/**
 * Prove d'esame simulate.
 *
 * - `assembleExam`: dalla struttura dell'esame del corso (`courses.exam.structure`,
 *   una domanda per voce) e dal pool di esercizi/flashcard, con un seme:
 *   stesso seme e stessa configurazione → stessa prova (anche in stampa).
 * - `gradeExam`: correzione deterministica (numeriche/scelte con grading.ts,
 *   domande aperte e orali in autovalutazione 0 / ½ / 1).
 * - timer, sessione salvata, storico, analisi per argomento e obiettivo,
 *   parametri della pagina di stampa.
 */
import { createRng, deriveSeed, type Rng } from './random';
import { gradeAnswers, gradeChoice, type AnswerSpec, type GradeStatus } from './grading';
import type { AnswerItemData, CardData, ChoiceData, ExamPartData, ExerciseData } from './course-data';
import { read, update, write } from './storage';

export type ExamMode = 'completa' | 'personalizzata' | 'mirata';

export interface ExamConfig {
  mode: ExamMode;
  seed: number;
  /** Argomenti ammessi (vuoto o assente = tutti). */
  topics?: string[];
  /** Numero di domande per le modalità personalizzata e mirata. */
  count?: number;
  /** Durata in minuti; `null` = senza tempo. Default: quella del corso. */
  durationMin?: number | null;
}

export type QuestionCategory = 'numeric' | 'choice' | 'open';

export interface ExamQuestion {
  index: number;
  ref: { type: 'exercise' | 'card'; id: string };
  topic: string;
  objectives: string[];
  /** Etichetta della parte (es. «Esercizio 1»), già localizzata. */
  label: string;
  points: number;
  category: QuestionCategory;
  /** Seme della variante per gli esercizi generati. */
  seed?: number;
}

export interface Exam {
  courseId: string;
  config: ExamConfig;
  questions: ExamQuestion[];
  totalPoints: number;
  durationMin: number | null;
}

export interface ExamPool {
  exercises: readonly ExerciseData[];
  cards: readonly CardData[];
}

export interface ExamCourse {
  id: string;
  structure: readonly ExamPartData[];
  durationMin?: number;
  examFormat?: 'scritto' | 'orale' | 'scritto+orale';
}

const CHOICE_KINDS = /^(quiz|crocett|scelta|test|domand[ae]-chius|vero-falso|multipl)/;
const OPEN_KINDS = /^(oral|domand|teoria|definizion|concett|apert|discussion|dimostrazion)/;

/** Categoria di una parte dalla sua `kind` (stringa libera del corso). */
export function categoryOf(kind: string): QuestionCategory {
  if (CHOICE_KINDS.test(kind)) return 'choice';
  if (OPEN_KINDS.test(kind)) return 'open';
  return 'numeric';
}

interface Candidate {
  type: 'exercise' | 'card';
  id: string;
  topic: string;
  objectives: string[];
  category: QuestionCategory;
  generated: boolean;
}

function exerciseCategory(e: ExerciseData): QuestionCategory {
  if (e.choices && e.choices.length > 0) return 'choice';
  if (e.answer.length > 0 || e.kind === 'generated') return 'numeric';
  return 'open';
}

function candidates(pool: ExamPool, topics: ReadonlySet<string> | null): Candidate[] {
  const ok = (t: string) => !topics || topics.has(t);
  return [
    ...pool.exercises
      .filter((e) => ok(e.topic))
      .map((e) => ({
        type: 'exercise' as const,
        id: e.id,
        topic: e.topic,
        objectives: e.objectives,
        category: exerciseCategory(e),
        generated: e.kind === 'generated',
      })),
    ...pool.cards
      .filter((c) => ok(c.topic))
      .map((c) => ({
        type: 'card' as const,
        id: c.id,
        topic: c.topic,
        objectives: c.objectives,
        category: 'open' as const,
        generated: false,
      })),
  ];
}

/** Ordine di ripiego quando manca materiale della categoria richiesta. */
const FALLBACK: Record<QuestionCategory, QuestionCategory[]> = {
  numeric: ['numeric', 'choice', 'open'],
  choice: ['choice', 'numeric', 'open'],
  open: ['open', 'numeric', 'choice'],
};

function choose(
  rng: Rng,
  all: Candidate[],
  category: QuestionCategory,
  used: Set<string>,
  usedTopics: Map<string, number>,
  weakness: Readonly<Record<string, number>> | null,
): Candidate | null {
  for (const cat of FALLBACK[category]) {
    // Preferisce gli esercizi alle flashcard per le categorie scritte e le carte "orale" per le aperte.
    let list = all.filter((c) => c.category === cat && !used.has(`${c.type}:${c.id}`));
    if (list.length === 0) list = all.filter((c) => c.category === cat);
    if (list.length === 0) continue;
    const weights = list.map((c) => {
      const topicUses = usedTopics.get(c.topic) ?? 0;
      let w = 1 / (1 + 2 * topicUses); // varietà di argomenti
      if (weakness) {
        const m = c.objectives.length
          ? c.objectives.reduce((s, o) => s + (weakness[o] ?? 0), 0) / c.objectives.length
          : 0.5;
        w *= (1 - m) ** 2 + 0.05;
      }
      return w;
    });
    return rng.weighted(list, weights);
  }
  return null;
}

/** Assembla una prova in modo deterministico. `weakness` = padronanza per obiettivo (0–1), usata dalla modalità mirata. */
export function assembleExam(
  course: ExamCourse,
  pool: ExamPool,
  config: ExamConfig,
  weakness?: Readonly<Record<string, number>>,
  /** Domande già scelte (`e:<id>` / `c:<id>`), es. dalla pagina di stampa: niente estrazione. */
  forcedRefs?: readonly string[],
): Exam {
  const rng = createRng(
    deriveSeed('exam', course.id, config.seed, config.mode, (config.topics ?? []).join(',')),
  );
  const topics = config.topics && config.topics.length > 0 ? new Set(config.topics) : null;
  const all = candidates(pool, topics);
  const used = new Set<string>();
  const usedTopics = new Map<string, number>();
  const parts: Array<{ label: string; points: number; category: QuestionCategory }> = [];

  if (config.mode === 'completa' && course.structure.length > 0) {
    const anyPoints = course.structure.some((p) => p.points !== undefined);
    for (const p of course.structure)
      parts.push({ label: p.label, points: anyPoints ? (p.points ?? 0) : 1, category: categoryOf(p.kind) });
  } else {
    const n = Math.max(1, Math.min(50, config.count ?? 6));
    const category: QuestionCategory = course.examFormat === 'orale' ? 'open' : 'numeric';
    for (let i = 0; i < n; i++) parts.push({ label: String(i + 1), points: 1, category });
  }

  const questions: ExamQuestion[] = [];
  parts.forEach((part, i) => {
    const forced = forcedRefs?.[i];
    const c = forcedRefs
      ? (all.find((x) => `${x.type === 'exercise' ? 'e' : 'c'}:${x.id}` === forced) ?? null)
      : choose(rng, all, part.category, used, usedTopics, config.mode === 'mirata' ? (weakness ?? {}) : null);
    if (!c) return;
    used.add(`${c.type}:${c.id}`);
    usedTopics.set(c.topic, (usedTopics.get(c.topic) ?? 0) + 1);
    questions.push({
      index: questions.length,
      ref: { type: c.type, id: c.id },
      topic: c.topic,
      objectives: c.objectives,
      label: part.label,
      points: part.points,
      category: c.category,
      ...(c.generated ? { seed: deriveSeed(config.seed, i, c.id) } : {}),
    });
  });

  const durationMin = config.durationMin === undefined ? (course.durationMin ?? null) : config.durationMin;
  return {
    courseId: course.id,
    config,
    questions,
    totalPoints: questions.reduce((s, q) => s + q.points, 0),
    durationMin,
  };
}

// ─────────────────────────── correzione ───────────────────────────

export interface ExamAnswer {
  /** Campi numerici/testuali, nell'ordine di `answer`. */
  fields?: string[];
  /** Indici delle opzioni scelte. */
  choices?: number[];
  /** Autovalutazione delle domande aperte. */
  self?: 0 | 0.5 | 1;
}

/** Contenuto risolto di una domanda (per i generati: uscita del generatore). */
export interface ResolvedQuestion {
  answer: AnswerItemData[];
  choices?: Pick<ChoiceData, 'correct'>[];
}

export interface QuestionResult {
  index: number;
  status: GradeStatus;
  score: number;
  earned: number;
  max: number;
}

export interface Breakdown {
  earned: number;
  max: number;
}

export interface ExamResult {
  questions: QuestionResult[];
  earned: number;
  total: number;
  percent: number;
  /** Voto in trentesimi (solo prova completa), 30L con punteggio pieno. */
  grade30?: number;
  lode?: boolean;
  byTopic: Record<string, Breakdown>;
  byObjective: Record<string, Breakdown>;
}

export const toAnswerSpec = (a: AnswerItemData): AnswerSpec => ({
  label: a.label,
  value: a.value,
  ...(a.unit ? { unit: a.unit } : {}),
  ...(a.tol !== undefined ? { tol: a.tol } : {}),
  ...(a.kind ? { kind: a.kind } : {}),
  ...(a.accept?.length ? { accept: a.accept } : {}),
});

export function gradeQuestion(
  q: ExamQuestion,
  resolved: ResolvedQuestion | undefined,
  answer: ExamAnswer | undefined,
): QuestionResult {
  const base = { index: q.index, max: q.points };
  let status: GradeStatus = 'blank';
  let score = 0;
  if (q.category === 'open' || !resolved || (resolved.answer.length === 0 && !resolved.choices?.length)) {
    if (answer?.self !== undefined) {
      score = answer.self;
      status = score === 1 ? 'correct' : score > 0 ? 'partial' : 'wrong';
    }
  } else if (resolved.choices && resolved.choices.length > 0) {
    const correct = resolved.choices.flatMap((c, i) => (c.correct ? [i] : []));
    const r = gradeChoice({ correct }, answer?.choices ?? []);
    status = r.status;
    score = r.score;
  } else {
    const r = gradeAnswers(resolved.answer.map(toAnswerSpec), answer?.fields ?? []);
    status = r.status;
    score = r.score;
  }
  return { ...base, status, score, earned: score * q.points };
}

const add = (map: Record<string, Breakdown>, key: string, earned: number, max: number) => {
  const b = map[key] ?? { earned: 0, max: 0 };
  map[key] = { earned: b.earned + earned, max: b.max + max };
};

export function gradeExam(
  exam: Exam,
  resolved: ReadonlyArray<ResolvedQuestion | undefined>,
  answers: ReadonlyArray<ExamAnswer | undefined>,
): ExamResult {
  const questions = exam.questions.map((q) => gradeQuestion(q, resolved[q.index], answers[q.index]));
  const byTopic: Record<string, Breakdown> = {};
  const byObjective: Record<string, Breakdown> = {};
  questions.forEach((r) => {
    const q = exam.questions[r.index]!;
    add(byTopic, q.topic, r.earned, r.max);
    for (const o of q.objectives) add(byObjective, o, r.score, 1);
  });
  const earned = questions.reduce((s, r) => s + r.earned, 0);
  const total = exam.totalPoints;
  const percent = total > 0 ? Math.round((earned / total) * 1000) / 10 : 0;
  const result: ExamResult = { questions, earned, total, percent, byTopic, byObjective };
  if (exam.config.mode === 'completa' && total > 0) {
    result.grade30 = Math.min(30, Math.round((earned / total) * 30));
    result.lode = earned >= total - 1e-9;
  }
  return result;
}

export interface WeakSpot {
  id: string;
  percent: number;
  max: number;
}

/** Argomenti e obiettivi dal più debole, per la sezione "cosa ripassare". */
export function analyze(result: ExamResult): { topics: WeakSpot[]; objectives: WeakSpot[] } {
  const rank = (m: Record<string, Breakdown>) =>
    Object.entries(m)
      .filter(([, b]) => b.max > 0)
      .map(([id, b]) => ({ id, percent: Math.round((b.earned / b.max) * 100), max: b.max }))
      .sort((a, b) => a.percent - b.percent || b.max - a.max || a.id.localeCompare(b.id));
  return { topics: rank(result.byTopic), objectives: rank(result.byObjective) };
}

// ─────────────────────────── timer e sessione ───────────────────────────

/** Millisecondi rimanenti (mai negativi); `Infinity` se la prova è senza tempo. */
export function remainingMs(startedAt: number, durationMin: number | null, now: number): number {
  if (durationMin === null) return Infinity;
  return Math.max(0, startedAt + durationMin * 60_000 - now);
}

/** `mm:ss` oppure `h:mm:ss`. */
export function formatClock(ms: number): string {
  if (!Number.isFinite(ms)) return '∞';
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export interface ExamSession {
  config: ExamConfig;
  startedAt: number;
  answers: Array<ExamAnswer | undefined>;
  /** Domanda visualizzata. */
  current: number;
  /** Domande estratte (`examRefs`), per riprendere la stessa prova anche se la padronanza è cambiata. */
  refs?: string[];
}

export interface ExamRecord {
  id: string;
  at: number;
  config: ExamConfig;
  earned: number;
  total: number;
  percent: number;
  grade30?: number;
  lode?: boolean;
  durationMs: number;
  byTopic: Record<string, Breakdown>;
  byObjective: Record<string, Breakdown>;
}

export interface ExamState {
  v: 1;
  session?: ExamSession;
  history: ExamRecord[];
}

export const MAX_HISTORY = 50;
export const emptyExamState = (): ExamState => ({ v: 1, history: [] });

export function sanitizeExamState(x: unknown): ExamState {
  if (!x || typeof x !== 'object') return emptyExamState();
  const s = x as Partial<ExamState>;
  const history = Array.isArray(s.history)
    ? s.history
        .filter(
          (r): r is ExamRecord =>
            !!r && typeof r.id === 'string' && typeof r.at === 'number' && typeof r.percent === 'number',
        )
        .slice(-MAX_HISTORY)
    : [];
  const session =
    s.session && typeof s.session.startedAt === 'number' && s.session.config ? s.session : undefined;
  return { v: 1, history, ...(session ? { session } : {}) };
}

export const loadExamState = (courseId: string): ExamState => sanitizeExamState(read(courseId, 'exam', null));

export function saveSession(courseId: string, session: ExamSession | undefined): void {
  update<ExamState>(courseId, 'exam', emptyExamState(), (raw) => {
    const s = sanitizeExamState(raw);
    if (session) return { ...s, session };
    const { session: _drop, ...rest } = s;
    return rest;
  });
}

export function toRecord(exam: Exam, result: ExamResult, startedAt: number, now: number): ExamRecord {
  return {
    id: `${exam.config.seed.toString(36)}-${now.toString(36)}`,
    at: now,
    config: exam.config,
    earned: result.earned,
    total: result.total,
    percent: result.percent,
    ...(result.grade30 !== undefined ? { grade30: result.grade30, lode: !!result.lode } : {}),
    durationMs: Math.max(0, now - startedAt),
    byTopic: result.byTopic,
    byObjective: result.byObjective,
  };
}

/** Aggiorna un esito già registrato (es. dopo l'autovalutazione delle domande aperte). */
export function replaceRecord(courseId: string, record: ExamRecord): ExamState {
  return update<ExamState>(courseId, 'exam', emptyExamState(), (raw) => {
    const s = sanitizeExamState(raw);
    return { ...s, history: s.history.map((r) => (r.id === record.id ? record : r)) };
  });
}

/** Registra l'esito e chiude la sessione. */
export function saveRecord(courseId: string, record: ExamRecord): ExamState {
  const next = ((s: ExamState): ExamState => ({ v: 1, history: [...s.history, record].slice(-MAX_HISTORY) }))(
    loadExamState(courseId),
  );
  write(courseId, 'exam', next);
  return next;
}

// ─────────────────────────── stampa ───────────────────────────

export interface PrintParams {
  course: string;
  config: ExamConfig;
  /** `prova` = solo testi, `soluzioni` = soluzioni e risposte. */
  part: 'prova' | 'soluzioni';
  /** Domande della prova (`e:<id>` / `c:<id>`), per ristampare esattamente quella svolta. */
  refs?: string[];
}

/** Riferimenti compatti delle domande di una prova. */
export const examRefs = (exam: Exam): string[] =>
  exam.questions.map((q) => `${q.ref.type === 'exercise' ? 'e' : 'c'}:${q.ref.id}`);

/** Query della pagina di stampa: `?corso=…&seme=…&modo=…&argomenti=a,b&n=6&durata=120&parte=prova`. */
export function printQuery(p: PrintParams): string {
  const q = new URLSearchParams();
  q.set('corso', p.course);
  q.set('seme', String(p.config.seed));
  q.set('modo', p.config.mode);
  if (p.config.topics?.length) q.set('argomenti', p.config.topics.join(','));
  if (p.config.count !== undefined) q.set('n', String(p.config.count));
  if (p.config.durationMin !== undefined)
    q.set('durata', p.config.durationMin === null ? 'no' : String(p.config.durationMin));
  if (p.refs?.length) q.set('q', p.refs.join(','));
  q.set('parte', p.part);
  return `?${q.toString()}`;
}

export function parsePrintQuery(search: string): PrintParams | null {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const course = q.get('corso');
  const seed = Number(q.get('seme'));
  const mode = q.get('modo');
  if (!course || !/^[a-z0-9-]+$/.test(course) || !Number.isInteger(seed) || seed < 0) return null;
  if (mode !== 'completa' && mode !== 'personalizzata' && mode !== 'mirata') return null;
  const config: ExamConfig = { mode, seed };
  const topics = q.get('argomenti');
  if (topics) config.topics = topics.split(',').filter((t) => /^[a-z0-9-]+$/.test(t));
  const n = Number(q.get('n'));
  if (q.has('n') && Number.isInteger(n) && n > 0) config.count = n;
  const d = q.get('durata');
  if (d === 'no') config.durationMin = null;
  else if (d !== null && Number.isFinite(Number(d)) && Number(d) > 0) config.durationMin = Number(d);
  const refs = (q.get('q') ?? '').split(',').filter((r) => /^[ec]:[a-z0-9-]+$/.test(r));
  return {
    course,
    config,
    part: q.get('parte') === 'soluzioni' ? 'soluzioni' : 'prova',
    ...(refs.length ? { refs } : {}),
  };
}
