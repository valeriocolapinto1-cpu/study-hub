/**
 * Appunti personali ancorati a id stabili (`data-note-id` su paragrafi,
 * formule ed esercizi). Locali (`sh:v1:<courseId>:notes`), inclusi
 * nell'export. Un appunto vuoto equivale a nessun appunto.
 */
import { listKeys, parseKey, read, update } from './storage';

export const MAX_NOTE_LENGTH = 10_000;
/** Id di ancoraggio: kebab-case con punti e due punti ammessi (es. `teoria/legge-di-ohm/p3`). */
export const NOTE_ID_RE = /^[a-z0-9][a-z0-9\-.:/]{0,199}$/;

export interface Note {
  text: string;
  createdAt: number;
  updatedAt: number;
  /** Percorso della pagina (senza base né lingua), per il link dalla vista "tutti gli appunti". */
  page?: string;
  /** Contesto leggibile (titolo del paragrafo o dell'esercizio). */
  label?: string;
}

export interface NotesState {
  v: 1;
  notes: Record<string, Note>;
}

export const emptyNotes = (): NotesState => ({ v: 1, notes: {} });

function isNote(x: unknown): x is Note {
  if (!x || typeof x !== 'object') return false;
  const n = x as Record<string, unknown>;
  return typeof n.text === 'string' && typeof n.createdAt === 'number' && typeof n.updatedAt === 'number';
}

export function sanitizeNotes(x: unknown): NotesState {
  const out = emptyNotes();
  if (!x || typeof x !== 'object') return out;
  for (const [id, n] of Object.entries((x as Partial<NotesState>).notes ?? {})) {
    if (!NOTE_ID_RE.test(id) || !isNote(n) || n.text.trim() === '') continue;
    out.notes[id] = {
      text: n.text.slice(0, MAX_NOTE_LENGTH),
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      ...(typeof n.page === 'string' ? { page: n.page } : {}),
      ...(typeof n.label === 'string' ? { label: n.label.slice(0, 200) } : {}),
    };
  }
  return out;
}

/** Imposta (o cancella, se il testo è vuoto) un appunto. Puro. */
export function withNote(
  state: NotesState,
  id: string,
  text: string,
  now: number,
  meta: Pick<Note, 'page' | 'label'> = {},
): NotesState {
  if (!NOTE_ID_RE.test(id)) throw new Error(`id appunto non valido: "${id}"`);
  const notes = { ...state.notes };
  const trimmed = text.slice(0, MAX_NOTE_LENGTH);
  if (trimmed.trim() === '') {
    delete notes[id];
  } else {
    const prev = notes[id];
    notes[id] = {
      text: trimmed,
      createdAt: prev?.createdAt ?? now,
      updatedAt: now,
      ...((meta.page ?? prev?.page) ? { page: meta.page ?? prev?.page } : {}),
      ...((meta.label ?? prev?.label) ? { label: meta.label ?? prev?.label } : {}),
    };
  }
  return { v: 1, notes };
}

export const loadNotes = (scope: string): NotesState => sanitizeNotes(read(scope, 'notes', null));

export function saveNote(
  scope: string,
  id: string,
  text: string,
  now: number,
  meta: Pick<Note, 'page' | 'label'> = {},
): NotesState {
  return update<NotesState>(scope, 'notes', emptyNotes(), (raw) =>
    withNote(sanitizeNotes(raw), id, text, now, meta),
  );
}

export interface NoteEntry extends Note {
  scope: string;
  id: string;
}

/** Tutti gli appunti di tutti i corsi (e globali), dal più recente. */
export function allNotes(): NoteEntry[] {
  const out: NoteEntry[] = [];
  for (const key of listKeys()) {
    const parsed = parseKey(key);
    if (!parsed || parsed.area !== 'notes') continue;
    for (const [id, n] of Object.entries(loadNotes(parsed.scope).notes))
      out.push({ ...n, scope: parsed.scope, id });
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Filtra per testo (senza accenti né maiuscole) su testo, etichetta e id. */
export function searchNotes(entries: readonly NoteEntry[], query: string): NoteEntry[] {
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const q = norm(query.trim());
  if (!q) return [...entries];
  return entries.filter((e) => norm(`${e.text} ${e.label ?? ''} ${e.id}`).includes(q));
}

/** Esporta in Markdown, raggruppato per corso. `titles` = nomi leggibili dei corsi. */
export function notesToMarkdown(
  entries: readonly NoteEntry[],
  titles: Readonly<Record<string, string>> = {},
  heading = 'Appunti',
): string {
  const byScope = new Map<string, NoteEntry[]>();
  for (const e of entries) byScope.set(e.scope, [...(byScope.get(e.scope) ?? []), e]);
  const parts = [`# ${heading}`];
  for (const [scope, list] of [...byScope].sort(([a], [b]) => a.localeCompare(b))) {
    parts.push(`\n## ${titles[scope] ?? scope}`);
    for (const e of list) parts.push(`\n### ${e.label ?? e.id}\n\n${e.text.trim()}`);
  }
  return `${parts.join('\n')}\n`;
}
