/**
 * Argomenti segnati come studiati («Segna come studiato» in fondo alla teoria).
 *
 * Area di storage per corso `sh:v1:<courseId>:studied`, schema versionato:
 * ```json
 * { "v": 1, "topics": { "legge-di-gauss": 1763900000000 } }
 * ```
 * (id dell'argomento → istante della segnatura, ms). È un segnale a parte: non entra nella
 * padronanza (`mastery.ts`), ma decide quali flashcard **nuove** entrano nel ripasso.
 *
 * Migrazione: chi aveva segnato argomenti nei siti originali li ha in `progress.read`
 * (migrazioni dei corsi). Finché l'area `studied` non esiste, il suo valore si ricava da lì;
 * la prima scrittura la salva e da allora `progress.read` non si consulta più.
 *
 * Le funzioni `load*`/`save*` passano da storage.ts; le altre sono pure.
 */
import type { SrsCard } from './fsrs';
import { loadProgress, type ProgressState } from './progress';
import { read, update } from './storage';

export const STUDIED_AREA = 'studied';
export const STUDIED_VERSION = 1;

export interface StudiedState {
  v: typeof STUDIED_VERSION;
  /** Argomento → istante in cui è stato segnato come studiato. */
  topics: Record<string, number>;
}

export const emptyStudied = (): StudiedState => ({ v: STUDIED_VERSION, topics: {} });

const validAt = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0;

/**
 * Normalizza un valore letto o importato. Accetta lo schema v1, un elenco di id (forma compatta,
 * istante sconosciuto → `fallbackAt`) e una mappa id → istante senza involucro; scarta il resto.
 */
export function sanitizeStudied(x: unknown, fallbackAt = 0): StudiedState {
  const out = emptyStudied();
  if (Array.isArray(x)) {
    for (const id of x) if (typeof id === 'string' && id) out.topics[id] = fallbackAt || 1;
    return out;
  }
  if (!x || typeof x !== 'object') return out;
  const o = x as Record<string, unknown>;
  const map = o.topics && typeof o.topics === 'object' && !Array.isArray(o.topics) ? o.topics : o;
  for (const [id, at] of Object.entries(map as Record<string, unknown>))
    if (id && id !== 'v' && validAt(at)) out.topics[id] = at;
  return out;
}

/** Migrazione: argomenti segnati nei siti originali (`progress.read`). */
export const studiedFromProgress = (progress: ProgressState): StudiedState =>
  sanitizeStudied({ topics: progress.read });

/** Stato del corso; senza area `studied` si usa `progress.read` (migrazione, senza scrivere). */
export function loadStudied(courseId: string): StudiedState {
  const raw = read<unknown>(courseId, STUDIED_AREA, null);
  return raw === null ? studiedFromProgress(loadProgress(courseId)) : sanitizeStudied(raw);
}

/** Segna (`on`) o toglie un gruppo di argomenti (puro). */
export function withStudied(state: StudiedState, ids: readonly string[], on: boolean, now: number): StudiedState {
  const topics = { ...state.topics };
  for (const id of ids) {
    if (!on) delete topics[id];
    else if (!topics[id]) topics[id] = now;
  }
  return { v: STUDIED_VERSION, topics };
}

/** Segna o toglie e salva; restituisce lo stato nuovo. */
export function saveStudied(courseId: string, ids: readonly string[], on: boolean, now: number): StudiedState {
  return update<unknown>(courseId, STUDIED_AREA, null, (raw) =>
    withStudied(raw === null ? studiedFromProgress(loadProgress(courseId)) : sanitizeStudied(raw), ids, on, now),
  ) as StudiedState;
}

export const isStudied = (state: StudiedState, topicId: string): boolean => validAt(state.topics[topicId]);

/** Fusione all'importazione: unione, con l'istante più vecchio (la prima segnatura). */
export function mergeStudied(a: StudiedState, b: StudiedState): StudiedState {
  const topics = { ...a.topics };
  for (const [id, at] of Object.entries(b.topics)) topics[id] = topics[id] ? Math.min(topics[id], at) : at;
  return { v: STUDIED_VERSION, topics };
}

// ─────────────────────────── capitoli e indice ───────────────────────────

export interface ChapterTopic {
  id: string;
  /** Capitolo (gruppo) dell'argomento; `undefined` = argomenti fuori da un capitolo. */
  group?: { it: string; en?: string | undefined } | string | undefined;
}

export interface ChapterProgress {
  /** Titolo del capitolo nella lingua chiesta (`undefined` se gli argomenti non hanno gruppo). */
  title: string | undefined;
  ids: string[];
  studied: number;
  total: number;
  /** Tutti gli argomenti del capitolo studiati. */
  done: boolean;
}

const groupTitle = (g: ChapterTopic['group'], lang: 'it' | 'en'): string | undefined =>
  g === undefined ? undefined : typeof g === 'string' ? g : lang === 'en' && g.en ? g.en : g.it;

/**
 * Avanzamento per capitolo: gruppi consecutivi nell'ordine dato (come l'indice della teoria),
 * con argomenti studiati e totali («3/5 argomenti»). Un capitolo è studiato quando lo sono tutti.
 */
export function studiedByChapter(
  topics: readonly ChapterTopic[],
  state: StudiedState,
  lang: 'it' | 'en' = 'it',
): ChapterProgress[] {
  const out: ChapterProgress[] = [];
  for (const t of topics) {
    const title = groupTitle(t.group, lang);
    let last = out.at(-1);
    if (!last || last.title !== title) {
      last = { title, ids: [], studied: 0, total: 0, done: false };
      out.push(last);
    }
    last.ids.push(t.id);
    last.total += 1;
    if (isStudied(state, t.id)) last.studied += 1;
  }
  for (const c of out) c.done = c.total > 0 && c.studied === c.total;
  return out;
}

/** Primo argomento non ancora studiato nell'ordine dato («Riprendi»); `undefined` se sono tutti studiati. */
export const firstUnstudied = (topicIds: readonly string[], state: StudiedState): string | undefined =>
  topicIds.find((id) => !isStudied(state, id));

// ─────────────────────────── ripasso ───────────────────────────

/** Le carte di un argomento entrano nel ripasso dal giorno dopo la segnatura (prima ripetizione a 1 giorno). */
export function reviewFrom(studiedAt: number): number {
  const d = new Date(studiedAt);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
}

export interface ReviewCandidate {
  id: string;
  topic: string;
}

/**
 * Carte che possono entrare nel ripasso: tutte quelle già viste (stato FSRS salvato, come prima
 * di questa funzione) e le nuove dei soli argomenti studiati, dal giorno dopo la segnatura.
 * `waiting` conta le nuove di argomenti segnati oggi, che entrano domani.
 */
export function reviewableCards(
  cards: readonly ReviewCandidate[],
  seen: Readonly<Record<string, SrsCard>>,
  state: StudiedState,
  now: number,
): { ids: string[]; waiting: number } {
  const ids: string[] = [];
  let waiting = 0;
  for (const c of cards) {
    const at = state.topics[c.topic];
    if (seen[c.id]) ids.push(c.id);
    else if (validAt(at)) {
      if (reviewFrom(at) <= now) ids.push(c.id);
      else waiting += 1;
    }
  }
  return { ids, waiting };
}
