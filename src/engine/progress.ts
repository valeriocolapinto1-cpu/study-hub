/**
 * Progressi sugli esercizi e stato del ripasso, per corso.
 *
 * Aree di storage (`sh:v1:<courseId>:<area>`):
 * - `progress`: tentativi per esercizio e argomenti letti;
 * - `srs`: stato FSRS delle flashcard e registro dei ripassi.
 * Le funzioni `load*`/`save*` passano da storage.ts; le altre sono pure.
 */
import { newCard, review, type Rating, type ScheduleOptions, type SrsCard, isSrsCard } from './fsrs';
import { read, update } from './storage';

export const MAX_ATTEMPTS = 20;
export const MAX_SRS_LOG = 1000;

export interface Attempt {
  at: number;
  /** Punteggio in [0, 1]. */
  score: number;
  /** Seme della variante (esercizi generati). */
  seed?: number;
  /** Suggerimenti chiesti prima della verifica. */
  hints?: number;
  /** Soluzione aperta prima di rispondere correttamente. */
  revealed?: boolean;
}

export interface ExerciseProgress {
  attempts: Attempt[];
  /** Miglior punteggio ottenuto senza aver visto la soluzione. */
  best: number;
  last: number;
}

export interface ProgressState {
  v: 1;
  exercises: Record<string, ExerciseProgress>;
  /** Argomenti segnati come studiati (id → istante). */
  read: Record<string, number>;
}

export const emptyProgress = (): ProgressState => ({ v: 1, exercises: {}, read: {} });

export type ExerciseStatus = 'nuovo' | 'tentato' | 'risolto';

export function exerciseStatus(p: ExerciseProgress | undefined): ExerciseStatus {
  if (!p || p.attempts.length === 0) return 'nuovo';
  return p.best >= 0.999 ? 'risolto' : 'tentato';
}

const clamp01 = (x: number) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0);

/** Aggiunge un tentativo (puro). */
export function withAttempt(state: ProgressState, exerciseId: string, attempt: Attempt): ProgressState {
  const a: Attempt = { ...attempt, score: clamp01(attempt.score) };
  const prev = state.exercises[exerciseId];
  const attempts = [...(prev?.attempts ?? []), a].slice(-MAX_ATTEMPTS);
  const best = Math.max(prev?.best ?? 0, a.revealed ? 0 : a.score);
  return { ...state, exercises: { ...state.exercises, [exerciseId]: { attempts, best, last: a.at } } };
}

/** Normalizza uno stato letto o importato (scarta voci malformate). */
export function sanitizeProgress(x: unknown): ProgressState {
  const out = emptyProgress();
  if (!x || typeof x !== 'object') return out;
  const s = x as Partial<ProgressState>;
  for (const [id, p] of Object.entries(s.exercises ?? {})) {
    if (!p || !Array.isArray(p.attempts)) continue;
    const attempts = p.attempts
      .filter((a): a is Attempt => !!a && typeof a.at === 'number' && typeof a.score === 'number')
      .map((a) => ({ ...a, score: clamp01(a.score) }))
      .slice(-MAX_ATTEMPTS);
    if (attempts.length === 0) continue;
    out.exercises[id] = {
      attempts,
      best: clamp01(typeof p.best === 'number' ? p.best : 0),
      last: Math.max(...attempts.map((a) => a.at)),
    };
  }
  for (const [id, at] of Object.entries(s.read ?? {})) if (typeof at === 'number') out.read[id] = at;
  return out;
}

export const loadProgress = (courseId: string): ProgressState =>
  sanitizeProgress(read(courseId, 'progress', null));

export function saveAttempt(courseId: string, exerciseId: string, attempt: Attempt): ProgressState {
  return update<ProgressState>(courseId, 'progress', emptyProgress(), (s) =>
    withAttempt(sanitizeProgress(s), exerciseId, attempt),
  );
}

export function setTopicRead(courseId: string, topicId: string, value: boolean, now: number): ProgressState {
  return update<ProgressState>(courseId, 'progress', emptyProgress(), (raw) => {
    const s = sanitizeProgress(raw);
    const readMap = { ...s.read };
    if (value) readMap[topicId] = now;
    else delete readMap[topicId];
    return { ...s, read: readMap };
  });
}

// ─────────────────────────── ripasso (FSRS) ───────────────────────────

export interface SrsLogEntry {
  id: string;
  rating: Rating;
  at: number;
}

export interface SrsState {
  v: 1;
  cards: Record<string, SrsCard>;
  log: SrsLogEntry[];
}

export const emptySrs = (): SrsState => ({ v: 1, cards: {}, log: [] });

export function sanitizeSrs(x: unknown): SrsState {
  const out = emptySrs();
  if (!x || typeof x !== 'object') return out;
  const s = x as Partial<SrsState>;
  for (const [id, c] of Object.entries(s.cards ?? {})) if (isSrsCard(c)) out.cards[id] = c;
  if (Array.isArray(s.log)) {
    out.log = s.log
      .filter(
        (e): e is SrsLogEntry =>
          !!e &&
          typeof e.id === 'string' &&
          typeof e.at === 'number' &&
          [1, 2, 3, 4].includes(e.rating as number),
      )
      .slice(-MAX_SRS_LOG);
  }
  return out;
}

export const loadSrs = (courseId: string): SrsState => sanitizeSrs(read(courseId, 'srs', null));

/** Valuta una carta (pura). */
export function withReview(
  state: SrsState,
  cardId: string,
  rating: Rating,
  now: number,
  opts: ScheduleOptions = {},
): SrsState {
  const card = state.cards[cardId] ?? newCard(now);
  const next = review(card, rating, now, opts).card;
  return {
    v: 1,
    cards: { ...state.cards, [cardId]: next },
    log: [...state.log, { id: cardId, rating, at: now }].slice(-MAX_SRS_LOG),
  };
}

export function saveReview(
  courseId: string,
  cardId: string,
  rating: Rating,
  now: number,
  opts: ScheduleOptions = {},
): SrsState {
  return update<SrsState>(courseId, 'srs', emptySrs(), (raw) =>
    withReview(sanitizeSrs(raw), cardId, rating, now, opts),
  );
}

/** Ripassi svolti in un giorno di calendario locale. */
export function reviewsOn(state: SrsState, day: Date): number {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const end = start + 86_400_000;
  return state.log.filter((e) => e.at >= start && e.at < end).length;
}
