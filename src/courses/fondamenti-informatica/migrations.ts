/**
 * Migrazione dei dati del sito originale (chiave `aefin.v1`, stessa origine
 * github.io) verso le aree del sito nuovo. La chiave legacy non viene mai
 * modificata né cancellata (vedi src/engine/migrate.ts).
 *
 * Formato legacy (v1 o v2):
 *   { version, exams: [{mode, score30?, percent, lode, earned, total, at}],
 *     visited|studied: [topicId], done: {topicId: ms}, bank: {id: {right, wrong}},
 *     examDate?: 'AAAA-MM-GG' }
 */
import { jsonTransform, registerMigration } from '../../engine/migrate';
import { GLOBAL_SCOPE } from '../../engine/storage';
import type { ProgressState, ExerciseProgress, Attempt } from '../../engine/progress';
import type { ExamRecord, ExamState } from '../../engine/exam';

export const COURSE_ID = 'fondamenti-informatica';
export const LEGACY_KEY = 'aefin.v1';

/** Id brevi del sito originale → id degli argomenti (stessa tabella di tools/legacy-topics). */
export const LEGACY_TOPICS: Record<string, string> = {
  bin: 'numeri-binari',
  bool: 'algebra-di-boole',
  comb: 'reti-combinatorie',
  karnaugh: 'mappe-di-karnaugh',
  arith: 'aritmetica-hardware',
  ff: 'circuiti-sequenziali',
  tech: 'tempi-e-tecnologia',
  cpu: 'processore',
  isa: 'risc-cisc-assembly',
  sw: 'dal-sorgente-all-esecuzione',
  irq: 'interruzioni-ed-eccezioni',
  io: 'input-output',
  pipe: 'pipeline',
  mem: 'gerarchia-di-memoria',
  vm: 'memoria-virtuale',
  perf: 'prestazioni-e-parallelismo',
  ieee: 'virgola-mobile',
};

interface LegacyExam {
  mode?: string;
  score30?: number;
  percent?: number;
  lode?: boolean;
  earned?: number;
  total?: number;
  at?: number;
}
interface Legacy {
  version?: number;
  exams?: LegacyExam[];
  done?: Record<string, number>;
  bank?: Record<string, { right?: number; wrong?: number }>;
  examDate?: string;
}

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);
const num = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Id della banca legacy → id dell'esercizio nel sito nuovo. Crocette (`mcq-…`)
 * mantengono l'id; gli schemi da completare diventano `schema-<id>`. Le domande
 * aperte erano autovalutate dentro le prove e non hanno un esercizio
 * corrispondente (sono flashcard): il loro esito non si trasferisce.
 */
export function bankExerciseId(id: string): string | null {
  if (/^mcq-[a-z]+-\d+$/.test(id)) return id;
  if (/^(open|asmw)-/.test(id)) return null;
  if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) return `schema-${id}`;
  return null;
}

/** Progressi: moduli segnati come studiati e esiti delle domande della banca. */
export function migrateProgress(value: unknown): ProgressState | undefined {
  if (!isObj(value)) return undefined;
  const v = value as Legacy;
  const read: Record<string, number> = {};
  if (isObj(v.done)) {
    for (const [legacy, at] of Object.entries(v.done)) {
      const id = LEGACY_TOPICS[legacy];
      if (id && num(at)) read[id] = at;
    }
  }
  const lastExam = Array.isArray(v.exams) ? Math.max(0, ...v.exams.map((e) => (num(e?.at) ? e.at : 0))) : 0;
  const when = lastExam || Date.now();
  const exercises: Record<string, ExerciseProgress> = {};
  if (isObj(v.bank)) {
    for (const [legacy, outcome] of Object.entries(v.bank)) {
      const id = bankExerciseId(legacy);
      if (!id || !isObj(outcome)) continue;
      const right = num(outcome.right) ? Math.max(0, Math.floor(outcome.right)) : 0;
      const wrong = num(outcome.wrong) ? Math.max(0, Math.floor(outcome.wrong)) : 0;
      // L'ordine dei tentativi non è noto: prima gli errori, poi i successi
      // (stima prudente: il miglior punteggio resta quello vero).
      const attempts: Attempt[] = [
        ...Array.from({ length: Math.min(wrong, 10) }, () => ({ at: when, score: 0 })),
        ...Array.from({ length: Math.min(right, 10) }, () => ({ at: when, score: 1 })),
      ];
      if (attempts.length === 0) continue;
      exercises[id] = { attempts, best: right > 0 ? 1 : 0, last: when };
    }
  }
  if (Object.keys(read).length === 0 && Object.keys(exercises).length === 0) return undefined;
  return { v: 1, exercises, read };
}

/** Storico delle prove: diventano voci dello storico d'esame del corso. */
export function migrateExams(value: unknown): ExamState | undefined {
  if (!isObj(value)) return undefined;
  const v = value as Legacy;
  if (!Array.isArray(v.exams)) return undefined;
  const history: ExamRecord[] = v.exams
    .filter((e): e is LegacyExam & { at: number; percent: number } => isObj(e) && num(e.at) && num(e.percent))
    .map((e) => ({
      id: `aefin-${e.at.toString(36)}`,
      at: e.at,
      config: { mode: e.mode === 'full' ? 'completa' : 'personalizzata', seed: 0 },
      earned: num(e.earned) ? e.earned : 0,
      total: num(e.total) ? e.total : 0,
      percent: e.percent,
      ...(num(e.score30) ? { grade30: e.score30 } : {}),
      ...(e.lode === true ? { lode: true } : {}),
      durationMs: 0,
      byTopic: {},
      byObjective: {},
    }));
  return history.length ? { v: 1, history: history.slice(-50) } : undefined;
}

/** Data dell'appello scelta dall'utente. */
export function migrateExamDate(value: unknown): Record<string, string> | undefined {
  if (!isObj(value)) return undefined;
  const d = (value as Legacy).examDate;
  return typeof d === 'string' && ISO_DAY.test(d) ? { [COURSE_ID]: d } : undefined;
}

export const MIGRATIONS_FI = [
  registerMigration({
    id: 'fondamenti-informatica/progress',
    legacyKey: LEGACY_KEY,
    scope: COURSE_ID,
    area: 'progress',
    transform: jsonTransform(migrateProgress),
  }),
  registerMigration({
    id: 'fondamenti-informatica/exam',
    legacyKey: LEGACY_KEY,
    scope: COURSE_ID,
    area: 'exam',
    transform: jsonTransform(migrateExams),
  }),
  registerMigration({
    id: 'fondamenti-informatica/exam-date',
    legacyKey: LEGACY_KEY,
    scope: GLOBAL_SCOPE,
    area: 'examDates',
    transform: jsonTransform(migrateExamDate),
    // Le date degli altri corsi restano; quella già scelta nel sito nuovo prevale.
    merge: (existing, migrated) => ({ ...(migrated as object), ...(isObj(existing) ? existing : {}) }),
  }),
];
