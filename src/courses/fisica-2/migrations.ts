/**
 * Migrazione dei dati salvati dal sito originale di Fisica Generale II (stessa origine github.io).
 * Chiavi legacy (mai cancellate):
 *   fg2-theme        "light" | "dark"                         → global:theme
 *   fg2-progress-v1  { lesson: {n: true}, exam: {...}, lab: {...}, outcome: {...}, criterio: {...} }
 *                    lesson → fisica-2:lessons (lezioni spuntate, Panoramica) e argomenti "studiati" in fisica-2:progress
 *                    lab    → fisica-2:lab (checklist delle relazioni, extra/laboratorio)
 *                    exam   → fisica-2:appelli (esercizi degli appelli segnati come risolti, extra/appelli)
 *                    outcome/criterio: segnaposto del vecchio sito senza contenuto, non migrati
 *   fg2-quiz         [{ t, ok, n, voto }] (ultimi 20 quiz)    → fisica-2:legacyQuiz (storico mostrato in extra/appelli)
 *   fg2-consent      consenso alle statistiche GoatCounter: il nuovo sito non ha statistiche, non si migra
 */
import { jsonTransform, registerMigration } from '../../engine/migrate';
import { GLOBAL_SCOPE } from '../../engine/storage';
import { emptyProgress, sanitizeProgress } from '../../engine/progress';

const COURSE = 'fisica-2';

/** Lezioni di teoria (e di teoria della misura) di ciascun argomento, da legacy/fisica-2/data/lezioni.json. */
export const TOPIC_LESSONS: Record<string, number[]> = {
  'elettrostatica-nel-vuoto': [1, 2, 3, 4, 5, 6, 7, 8],
  'conduttori-capacita': [8, 9, 10, 12],
  dielettrici: [13, 14, 15, 17, 18],
  'corrente-stazionaria': [15, 17, 18, 19, 20, 24, 28],
  'magnetostatica-nel-vuoto': [24, 25, 27, 28, 29, 31, 33],
  'magnetismo-nella-materia': [33, 34, 40],
  'campi-variabili': [36, 38, 39, 41, 42, 43, 53],
  'onde-elettromagnetiche': [43, 44, 47, 48, 55],
  'radiazione-materia': [49, 50, 53],
  'fisica-moderna': [57, 58],
  'laboratorio-misura': [22, 23, 31, 42, 44, 50],
};

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

/** Voci `true` di una categoria di fg2-progress-v1, come insieme di id. */
export function legacyChecks(value: unknown, cat: string): Record<string, true> | undefined {
  const progressi = isObj(value) && isObj(value.progressi) ? value.progressi : value; // anche il file esportato
  if (!isObj(progressi) || !isObj(progressi[cat])) return undefined;
  const out: Record<string, true> = {};
  for (const [id, v] of Object.entries(progressi[cat])) if (v === true) out[id] = true;
  return Object.keys(out).length ? out : undefined;
}

/** Argomenti le cui lezioni di teoria sono tutte spuntate. */
export function topicsRead(lessons: Record<string, true>): string[] {
  return Object.entries(TOPIC_LESSONS)
    .filter(([, ns]) => ns.every((n) => lessons[String(n)]))
    .map(([t]) => t);
}

const unionChecks = (existing: unknown, migrated: unknown) => ({
  ...(isObj(migrated) ? migrated : {}),
  ...(isObj(existing) ? existing : {}),
});

export const migrations = [
  registerMigration({
    id: 'fisica-2/theme',
    legacyKey: 'fg2-theme',
    scope: GLOBAL_SCOPE,
    area: 'theme',
    transform: (raw) => (raw === 'light' || raw === 'dark' ? raw : undefined),
  }),
  registerMigration({
    id: 'fisica-2/lessons',
    legacyKey: 'fg2-progress-v1',
    scope: COURSE,
    area: 'lessons',
    transform: jsonTransform((v) => legacyChecks(v, 'lesson')),
    merge: unionChecks,
  }),
  registerMigration({
    id: 'fisica-2/topics-read',
    legacyKey: 'fg2-progress-v1',
    scope: COURSE,
    area: 'progress',
    transform: jsonTransform((v) => {
      const lessons = legacyChecks(v, 'lesson');
      const topics = lessons ? topicsRead(lessons) : [];
      if (!topics.length) return undefined;
      const p = emptyProgress();
      const now = Date.now();
      for (const t of topics) p.read[t] = now;
      return p;
    }),
    merge: (existing, migrated) => {
      const e = sanitizeProgress(existing);
      const m = sanitizeProgress(migrated);
      return { ...e, read: { ...m.read, ...e.read } };
    },
  }),
  registerMigration({
    id: 'fisica-2/lab',
    legacyKey: 'fg2-progress-v1',
    scope: COURSE,
    area: 'lab',
    transform: jsonTransform((v) => legacyChecks(v, 'lab')),
    merge: unionChecks,
  }),
  registerMigration({
    id: 'fisica-2/appelli',
    legacyKey: 'fg2-progress-v1',
    scope: COURSE,
    area: 'appelli',
    transform: jsonTransform((v) => legacyChecks(v, 'exam')),
    merge: unionChecks,
  }),
  registerMigration({
    id: 'fisica-2/quiz',
    legacyKey: 'fg2-quiz',
    scope: COURSE,
    area: 'legacyQuiz',
    transform: jsonTransform((v) => {
      if (!Array.isArray(v)) return undefined;
      const ok = v
        .filter(isObj)
        .filter((r) => [r.t, r.ok, r.n, r.voto].every((x) => typeof x === 'number' && Number.isFinite(x)))
        .map((r) => ({ t: r.t as number, ok: r.ok as number, n: r.n as number, voto: r.voto as number }));
      return ok.length ? ok.slice(0, 20) : undefined;
    }),
  }),
  registerMigration({
    // Il vecchio sito chiedeva il consenso alle statistiche (GoatCounter); il nuovo non ne raccoglie.
    // La voce viene solo annotata come eseguita: nessun dato da trasferire.
    id: 'fisica-2/consent',
    legacyKey: 'fg2-consent',
    scope: COURSE,
    area: 'settings',
    transform: () => undefined,
  }),
];
