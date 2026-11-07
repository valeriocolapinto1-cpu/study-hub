/**
 * Migrazione dei dati locali del sito originale di Teoria dei Circuiti (chiavi `tdc:*`, stessa
 * origine github.io) verso le aree del motore comune. Le chiavi legacy non si cancellano mai.
 *
 * Non migrati, di proposito: `tdc:secret.aiKey` (chiave API della vecchia correzione con AI, che il
 * nuovo sito non ha), `tdc:ai.cache`, `tdc:prova.corrente` e `tdc:prova.config` (stato di una prova
 * in corso con il vecchio generatore, non ricostruibile), `tdc:print-pref`/`tdc:printing`
 * (temporanei di stampa), il registro delle domande aperte e le scatole Leitner (`tdc:srs`), che non
 * corrispondono alle schede FSRS: le domande sbagliate rientrano dal registro dei quiz.
 * Gli appunti salvati in IndexedDB (`tdc-notes`) non sono leggibili in modo sincrono: si migrano
 * solo quelli del ripiego in localStorage (`tdc:notes`).
 */
import { GLOBAL_SCOPE } from '../../engine/storage';
import { jsonTransform, registerMigration } from '../../engine/migrate';
import { emptyProgress, sanitizeProgress, withAttempt, type ProgressState } from '../../engine/progress';
import { emptyNotes, sanitizeNotes, type NotesState } from '../../engine/notes';
import { LEGACY_TOPIC_IDS } from './legacy-ids';

const COURSE = 'teoria-circuiti';
const ts = (s: unknown): number => {
  const t = typeof s === 'string' ? Date.parse(s) : NaN;
  return Number.isFinite(t) ? t : Date.UTC(2026, 10, 1);
};

/** tdc:progress { "I-02": { stato, data } } → progress.read { topicId: istante }. */
export function progressFromLegacy(v: unknown): ProgressState | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const out = emptyProgress();
  for (const [legacy, p] of Object.entries(v as Record<string, { stato?: string; data?: string }>)) {
    const topic = LEGACY_TOPIC_IDS[legacy];
    if (topic && p && p.stato && p.stato !== 'non iniziato') out.read[topic] = ts(p.data);
  }
  return Object.keys(out.read).length ? out : undefined;
}

/** tdc:quiz.log [{ id: "Q-I-001", ok, data }] → tentativi sugli esercizi a scelta "q-i-001". */
export function quizLogToProgress(
  v: unknown,
  base: ProgressState = emptyProgress(),
): ProgressState | undefined {
  if (!Array.isArray(v)) return undefined;
  let s = base;
  for (const e of v as { id?: unknown; ok?: unknown; data?: unknown }[]) {
    if (!e || typeof e.id !== 'string' || !/^Q-[IV]+-\d{3}$/.test(e.id)) continue;
    s = withAttempt(s, e.id.toLowerCase(), { at: ts(e.data), score: e.ok === true ? 1 : 0 });
  }
  return Object.keys(s.exercises).length ? s : undefined;
}

const mergeProgress = (existing: unknown, migrated: unknown): ProgressState => {
  const a = sanitizeProgress(existing);
  const b = sanitizeProgress(migrated);
  const out: ProgressState = { v: 1, read: { ...b.read, ...a.read }, exercises: { ...a.exercises } };
  for (const [id, p] of Object.entries(b.exercises))
    for (const at of p.attempts) Object.assign(out, withAttempt(out, id, at));
  return out;
};

/** tdc:notes (ripiego localStorage) → appunti del corso, uno per appunto, senza pagina. */
export function notesFromLegacy(v: unknown): NotesState | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = emptyNotes();
  for (const n of v as {
    id?: unknown;
    titolo?: unknown;
    testo?: unknown;
    creato?: unknown;
    modificato?: unknown;
    argomenti?: unknown;
  }[]) {
    if (!n || typeof n.testo !== 'string' || !n.testo.trim()) continue;
    const id = `legacy:${
      String(n.id ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') || Math.abs(n.testo.length)
    }`;
    const topics = Array.isArray(n.argomenti)
      ? n.argomenti.map((a) => LEGACY_TOPIC_IDS[String(a)]).filter(Boolean)
      : [];
    out.notes[id] = {
      text: typeof n.titolo === 'string' && n.titolo.trim() ? `${n.titolo.trim()}\n\n${n.testo}` : n.testo,
      createdAt: ts(n.creato),
      updatedAt: ts(n.modificato),
      ...(topics[0] ? { page: `anno-2/${COURSE}/teoria/${topics[0]}` } : {}),
      label: typeof n.titolo === 'string' ? n.titolo.slice(0, 120) : 'Appunto',
    };
  }
  return Object.keys(out.notes).length ? out : undefined;
}

registerMigration({
  id: `${COURSE}/formulary`,
  legacyKey: 'tdc:formulario',
  scope: COURSE,
  area: 'formulary',
  transform: jsonTransform((v) => {
    const b = (v as { bookmarks?: unknown })?.bookmarks;
    return Array.isArray(b) && b.length ? { bookmarks: b.filter((x) => typeof x === 'string') } : undefined;
  }),
});
registerMigration({
  id: `${COURSE}/progress-read`,
  legacyKey: 'tdc:progress',
  scope: COURSE,
  area: 'progress',
  transform: jsonTransform(progressFromLegacy),
  merge: mergeProgress,
});
registerMigration({
  id: `${COURSE}/quiz-log`,
  legacyKey: 'tdc:quiz.log',
  scope: COURSE,
  area: 'progress',
  transform: jsonTransform((v) => quizLogToProgress(v)),
  merge: mergeProgress,
});
registerMigration({
  id: `${COURSE}/notes`,
  legacyKey: 'tdc:notes',
  scope: COURSE,
  area: 'notes',
  transform: jsonTransform(notesFromLegacy),
  merge: (existing, migrated) => {
    const a = sanitizeNotes(existing);
    const b = sanitizeNotes(migrated);
    return { v: 1, notes: { ...b.notes, ...a.notes } };
  },
});
registerMigration({
  id: `${COURSE}/exam-date`,
  legacyKey: 'tdc:piano',
  scope: GLOBAL_SCOPE,
  area: 'examDates',
  transform: jsonTransform((v) => {
    const d = (v as { esame?: unknown })?.esame;
    return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? { [COURSE]: d } : undefined;
  }),
  merge: (existing, migrated) => ({ ...(migrated as object), ...((existing as object) ?? {}) }),
});
registerMigration({
  id: `${COURSE}/theme`,
  legacyKey: 'tdc:settings',
  scope: GLOBAL_SCOPE,
  area: 'theme',
  transform: jsonTransform((v) => {
    const t = (v as { tema?: unknown })?.tema;
    return t === 'chiaro' ? 'light' : t === 'scuro' ? 'dark' : undefined;
  }),
});
