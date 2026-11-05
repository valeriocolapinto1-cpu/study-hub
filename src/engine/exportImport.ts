/**
 * Esportazione e importazione dei dati locali (progressi, ripasso, prove,
 * appunti, impostazioni) per spostarli tra dispositivi: file JSON o QR.
 *
 * Schema versionato:
 * ```json
 * { "format": "study-hub", "version": 1, "exportedAt": "2026-…Z",
 *   "data": { "sh:v1:fisica-2:srs": { … }, "sh:v1:global:examDates": { … } } }
 * ```
 * Le annotazioni delle migrazioni (`global:migrations`) restano sul
 * dispositivo. Importazione in due modalità:
 * - `merge`: fonde area per area tenendo il dato più recente o l'unione;
 * - `replace`: sostituisce tutti i dati del sito con quelli del file.
 */
import { sanitizeProgress, sanitizeSrs, type ProgressState, type SrsState } from './progress';
import { sanitizeNotes, type NotesState } from './notes';
import { sanitizeExamState, type ExamState, MAX_HISTORY } from './exam';
import { clearScope, listKeys, parseKey, readAll, readRaw, writeRaw } from './storage';
import { MIGRATIONS_AREA } from './migrate';

export const EXPORT_FORMAT = 'study-hub';
export const EXPORT_VERSION = 1;

export interface ExportFile {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
}

const excluded = (key: string) => parseKey(key)?.area === MIGRATIONS_AREA;

export function buildExport(now: Date = new Date()): ExportFile {
  const data = Object.fromEntries(Object.entries(readAll()).filter(([k]) => !excluded(k)));
  return { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: now.toISOString(), data };
}

export const serializeExport = (file: ExportFile): string => JSON.stringify(file);

export type ValidationResult =
  { ok: true; file: ExportFile; warnings: string[] } | { ok: false; error: ImportError };
export type ImportError = 'json' | 'format' | 'version' | 'empty';

/** Verifica e ripulisce un file importato. Le chiavi non riconosciute sono scartate con un avviso. */
export function validateExport(input: string | unknown): ValidationResult {
  let raw: unknown = input;
  if (typeof input === 'string') {
    try {
      raw = JSON.parse(input);
    } catch {
      return { ok: false, error: 'json' };
    }
  }
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'format' };
  const f = raw as Partial<ExportFile>;
  if (f.format !== EXPORT_FORMAT || !f.data || typeof f.data !== 'object' || Array.isArray(f.data))
    return { ok: false, error: 'format' };
  if (typeof f.version !== 'number' || f.version < 1 || f.version > EXPORT_VERSION)
    return { ok: false, error: 'version' };
  const warnings: string[] = [];
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(f.data)) {
    const parsed = parseKey(key);
    if (!parsed || excluded(key)) {
      warnings.push(key);
      continue;
    }
    data[key] = sanitizeArea(parsed.area, value);
  }
  if (Object.keys(data).length === 0) return { ok: false, error: 'empty' };
  return {
    ok: true,
    file: { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: String(f.exportedAt ?? ''), data },
    warnings,
  };
}

function sanitizeArea(area: string, value: unknown): unknown {
  switch (area) {
    case 'progress':
      return sanitizeProgress(value);
    case 'srs':
      return sanitizeSrs(value);
    case 'notes':
      return sanitizeNotes(value);
    case 'exam':
      return sanitizeExamState(value);
    default:
      return value;
  }
}

// ─────────────────────────── fusione ───────────────────────────

function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  const out = sanitizeProgress(a);
  for (const [id, p] of Object.entries(b.exercises)) {
    const prev = out.exercises[id];
    const seen = new Set((prev?.attempts ?? []).map((x) => `${x.at}:${x.score}`));
    const attempts = [...(prev?.attempts ?? []), ...p.attempts.filter((x) => !seen.has(`${x.at}:${x.score}`))]
      .sort((x, y) => x.at - y.at)
      .slice(-20);
    out.exercises[id] = {
      attempts,
      best: Math.max(prev?.best ?? 0, p.best),
      last: Math.max(prev?.last ?? 0, p.last),
    };
  }
  for (const [id, at] of Object.entries(b.read)) out.read[id] = Math.max(out.read[id] ?? 0, at);
  return out;
}

function mergeSrs(a: SrsState, b: SrsState): SrsState {
  const cards = { ...a.cards };
  for (const [id, c] of Object.entries(b.cards)) {
    const prev = cards[id];
    if (!prev || (c.lastReview ?? 0) > (prev.lastReview ?? 0)) cards[id] = c;
  }
  const seen = new Set(a.log.map((e) => `${e.id}@${e.at}`));
  const log = [...a.log, ...b.log.filter((e) => !seen.has(`${e.id}@${e.at}`))]
    .sort((x, y) => x.at - y.at)
    .slice(-1000);
  return { v: 1, cards, log };
}

function mergeNotes(a: NotesState, b: NotesState): NotesState {
  const notes = { ...a.notes };
  for (const [id, n] of Object.entries(b.notes))
    if (!notes[id] || n.updatedAt > notes[id].updatedAt) notes[id] = n;
  return { v: 1, notes };
}

function mergeExam(a: ExamState, b: ExamState): ExamState {
  const ids = new Set(a.history.map((r) => r.id));
  const history = [...a.history, ...b.history.filter((r) => !ids.has(r.id))]
    .sort((x, y) => x.at - y.at)
    .slice(-MAX_HISTORY);
  const session = a.session ?? b.session;
  return { v: 1, history, ...(session ? { session } : {}) };
}

/** Fonde due valori della stessa area. Per le aree sconosciute prevale quello locale (se c'è). */
export function mergeArea(area: string, local: unknown, incoming: unknown): unknown {
  if (local === undefined || local === null) return incoming;
  switch (area) {
    case 'progress':
      return mergeProgress(sanitizeProgress(local), sanitizeProgress(incoming));
    case 'srs':
      return mergeSrs(sanitizeSrs(local), sanitizeSrs(incoming));
    case 'notes':
      return mergeNotes(sanitizeNotes(local), sanitizeNotes(incoming));
    case 'exam':
      return mergeExam(sanitizeExamState(local), sanitizeExamState(incoming));
    case 'examDates':
      return typeof local === 'object' && typeof incoming === 'object'
        ? { ...(incoming as object), ...(local as object) }
        : local;
    default:
      return local;
  }
}

export interface ImportReport {
  written: string[];
  mode: 'merge' | 'replace';
}

/** Applica un file già validato. */
export function applyImport(file: ExportFile, mode: 'merge' | 'replace'): ImportReport {
  const written: string[] = [];
  if (mode === 'replace') {
    for (const key of listKeys()) {
      const parsed = parseKey(key);
      if (parsed && !excluded(key)) clearScope(parsed.scope);
    }
  }
  for (const [key, value] of Object.entries(file.data)) {
    const parsed = parseKey(key)!;
    let next = value;
    if (mode === 'merge') {
      const raw = readRaw(key);
      let local: unknown;
      try {
        local = raw === null ? undefined : JSON.parse(raw);
      } catch {
        local = undefined;
      }
      next = mergeArea(parsed.area, local, value);
    }
    if (writeRaw(key, JSON.stringify(next))) written.push(key);
  }
  try {
    globalThis.dispatchEvent?.(new CustomEvent('sh:storage', { detail: { scope: '*', area: '*' } }));
  } catch {
    /* nessun DOM */
  }
  return { written, mode };
}

/** Riepilogo per l'anteprima prima di importare: scope → aree. */
export function summarize(file: ExportFile): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const key of Object.keys(file.data)) {
    const p = parseKey(key);
    if (p) (out[p.scope] ??= []).push(p.area);
  }
  for (const list of Object.values(out)) list.sort();
  return out;
}

/** Nome file suggerito: `study-hub-2026-11-05.json`. */
export const exportFileName = (now: Date = new Date()): string =>
  `study-hub-${now.toISOString().slice(0, 10)}.json`;
