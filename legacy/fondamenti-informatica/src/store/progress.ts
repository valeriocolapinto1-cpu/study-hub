import { useEffect, useState } from 'preact/hooks';
import type { ExamResult } from '~/engine/types';
import type { TopicId } from '~/content/types';
import { storage, type KeyValueStore } from './storage';

const KEY = 'aefin.v1';

/** Esito salvato di una prova. Volutamente essenziale: non serve altro. */
export interface ExamRecord {
  mode: ExamResult['mode'];
  /** Presente solo per la prova completa. */
  score30?: number;
  percent: number;
  lode: boolean;
  earned: number;
  total: number;
  at: number;
}

/**
 * Esito per singola voce di banca. Serve alle statistiche per argomento e
 * sarà la base della ripetizione dilazionata (§14).
 */
export type BankOutcomes = Record<string, { right: number; wrong: number }>;

/**
 * Progressi salvati.
 *
 * **Aperto** e **studiato** sono cose diverse, e tenerle separate è il punto
 * della carriera di studio: aprire un modulo è automatico e non significa
 * nulla, dichiararlo studiato è una decisione tua. Prima esisteva solo la
 * prima, chiamata però «studiato» — un'imprecisione che qui si chiude.
 */
export interface ProgressData {
  version: 2;
  exams: ExamRecord[];
  /** Moduli aperti almeno una volta. Automatico. */
  visited: TopicId[];
  /** Moduli dichiarati studiati, con l'istante in cui li hai segnati. */
  done: Partial<Record<TopicId, number>>;
  bank: BankOutcomes;
  /**
   * Data dell'appello, in formato `AAAA-MM-GG`.
   *
   * Campo **aggiunto** alla versione 2, non una versione nuova: è opzionale e
   * additivo, quindi dati salvati prima si leggono senza migrazione (esce
   * `undefined`) e una versione vecchia dell'app li rileggerebbe ignorandolo.
   * Bump della versione e migrazione servono quando cambia il *significato* di
   * un campo, come è stato per `studied` → `visited`.
   */
  examDate?: string;
}

const EMPTY: ProgressData = { version: 2, exams: [], visited: [], done: {}, bank: {} };

/** `AAAA-MM-GG`, la forma che `<input type="date">` legge e scrive. */
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Non lasciamo crescere lo storico all'infinito. */
const MAX_EXAMS = 200;

/** La forma dei dati salvati dalla versione precedente. */
interface ProgressV1 {
  version: 1;
  exams?: ExamRecord[];
  studied?: TopicId[];
  bank?: BankOutcomes;
}

function read(store: KeyValueStore): ProgressData {
  const data = store.get<ProgressData | ProgressV1 | null>(KEY, null);
  if (typeof data !== 'object' || data === null) return EMPTY;

  // Migrazione dalla v1: i moduli lì elencati erano stati **aperti**, non
  // dichiarati studiati. Diventano quindi `visited`, e la carriera parte
  // vuota — è l'interpretazione onesta di quel dato.
  if (data.version === 1) {
    const old = data as ProgressV1;
    return {
      version: 2,
      exams: Array.isArray(old.exams) ? old.exams : [],
      visited: Array.isArray(old.studied) ? old.studied : [],
      done: {},
      bank: typeof old.bank === 'object' && old.bank !== null ? old.bank : {},
    };
  }

  if (data.version !== 2) return EMPTY;
  return {
    version: 2,
    exams: Array.isArray(data.exams) ? data.exams : [],
    visited: Array.isArray(data.visited) ? data.visited : [],
    done: typeof data.done === 'object' && data.done !== null ? data.done : {},
    bank: typeof data.bank === 'object' && data.bank !== null ? data.bank : {},
    // Una data storpiata a mano nello storage non deve arrivare ai conti:
    // si scarta qui, e il sito si comporta come se non fosse mai stata messa.
    ...(typeof data.examDate === 'string' && ISO_DAY.test(data.examDate)
      ? { examDate: data.examDate }
      : {}),
  };
}

// ─────────── notifica ai componenti che i dati sono cambiati ───────────

const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function write(next: ProgressData): void {
  storage.set(KEY, next);
  emit();
}

export function getProgress(): ProgressData {
  return read(storage);
}

/** Registra l'esito di una prova e gli esiti per voce di banca. */
export function recordExam(result: ExamResult): void {
  const data = getProgress();

  const record: ExamRecord = {
    mode: result.mode,
    ...(result.score30 !== undefined ? { score30: result.score30 } : {}),
    percent: result.percent,
    lode: result.lode,
    earned: result.earned,
    total: result.total,
    at: result.finishedAt,
  };

  const bank: BankOutcomes = { ...data.bank };
  for (const entry of result.results) {
    if (entry.bankId === undefined || entry.outcome === 'blank') continue;
    const current = bank[entry.bankId] ?? { right: 0, wrong: 0 };
    bank[entry.bankId] =
      entry.outcome === 'correct'
        ? { ...current, right: current.right + 1 }
        : { ...current, wrong: current.wrong + 1 };
  }

  write({ ...data, exams: [...data.exams, record].slice(-MAX_EXAMS), bank });
}

/** Il modulo è stato aperto. Automatico, non fa parte della carriera. */
export function markVisited(topicId: TopicId): void {
  const data = getProgress();
  if (data.visited.includes(topicId)) return;
  write({ ...data, visited: [...data.visited, topicId] });
}

/** Dichiara (o ritira) un modulo come studiato. */
export function setStudied(topicId: TopicId, studied: boolean, at = Date.now()): void {
  const data = getProgress();
  const done = { ...data.done };
  if (studied) done[topicId] = at;
  else delete done[topicId];
  write({ ...data, done });
}

export function toggleStudied(topicId: TopicId): void {
  const data = getProgress();
  setStudied(topicId, data.done[topicId] === undefined);
}

/** Segna in blocco: serve al pulsante «tutto il blocco» della carriera. */
export function setStudiedMany(ids: readonly TopicId[], studied: boolean): void {
  const data = getProgress();
  const done = { ...data.done };
  const now = Date.now();
  for (const id of ids) {
    if (studied) done[id] = done[id] ?? now;
    else delete done[id];
  }
  write({ ...data, done });
}

export function isStudied(data: ProgressData, topicId: TopicId): boolean {
  return data.done[topicId] !== undefined;
}

/**
 * Fissa (o toglie) la data dell'appello.
 *
 * `null` la rimuove: chi cambia idea o sposta l'appello non deve restare con
 * un conto alla rovescia sbagliato addosso.
 */
export function setExamDate(date: string | null): void {
  const data = getProgress();
  if (date === null) {
    const { examDate: _removed, ...rest } = data;
    write(rest);
    return;
  }
  if (!ISO_DAY.test(date)) return;
  write({ ...data, examDate: date });
}

/** Azzera solo la carriera di studio, lasciando intatto lo storico delle prove. */
export function resetCareer(): void {
  const data = getProgress();
  write({ ...data, done: {} });
}

export function resetProgress(): void {
  storage.remove(KEY);
  emit();
}

export interface Stats {
  examsTaken: number;
  /** Miglior voto in trentesimi, se esiste almeno una prova completa. */
  best: number | null;
  /** Media dei voti in trentesimi, arrotondata. */
  average: number | null;
  /** Moduli **dichiarati** studiati. */
  studiedCount: number;
  /** Moduli aperti almeno una volta. */
  visitedCount: number;
  lodi: number;
}

export function computeStats(data: ProgressData = getProgress()): Stats {
  const graded = data.exams.filter(
    (exam): exam is ExamRecord & { score30: number } => exam.score30 !== undefined,
  );

  return {
    examsTaken: data.exams.length,
    best: graded.length ? Math.max(...graded.map((exam) => exam.score30)) : null,
    average: graded.length
      ? Math.round(graded.reduce((sum, exam) => sum + exam.score30, 0) / graded.length)
      : null,
    studiedCount: Object.keys(data.done).length,
    visitedCount: data.visited.length,
    lodi: graded.filter((exam) => exam.lode).length,
  };
}

/** Si ri-renderizza quando i progressi cambiano. */
export function useProgress(): ProgressData {
  const [data, setData] = useState<ProgressData>(getProgress);

  useEffect(() => {
    const listener = (): void => setData(getProgress());
    listeners.add(listener);
    // Un'altra scheda potrebbe aver aggiornato i progressi.
    window.addEventListener('storage', listener);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', listener);
    };
  }, []);

  return data;
}
