/**
 * Padronanza per obiettivo e piano di studio fino all'esame.
 *
 * Ogni evidenza (tentativo di esercizio, esito di una prova, carta di
 * ripasso) dà un punteggio in [0, 1] sugli obiettivi a cui è collegata. La
 * padronanza è una media pesata con:
 * - decadimento esponenziale con l'età (emivita `halfLifeDays`, default 21 g):
 *   ciò che non si pratica da tempo pesa sempre meno;
 * - pesi per fonte (prova > esercizio > ripasso) e penalità per soluzione vista;
 * - un "prior" a zero di peso `priorWeight`: un solo esercizio giusto non vale il 100 %.
 * Le carte FSRS contribuiscono con la retrievability attuale, che decade già da sé.
 *
 * Tutto puro: lo stato e la data si passano da fuori.
 */
import { DAY_MS, retrievability } from './fsrs';
import type { ProgressState, SrsState } from './progress';
import type { ExamRecord } from './exam';
import type { TopicInfo } from './course-data';

export interface MasteryOptions {
  halfLifeDays?: number;
  priorWeight?: number;
  weights?: { exercise: number; exam: number; card: number };
}

const DEFAULTS = { halfLifeDays: 21, priorWeight: 1, weights: { exercise: 1, exam: 1.5, card: 0.6 } };

export type MasteryLevel = 0 | 1 | 2 | 3 | 4;
/** Chiavi i18n dei livelli (vedi `mastery.level.*`). */
export const LEVEL_KEYS = ['nuovo', 'fragile', 'in-corso', 'solido', 'padroneggiato'] as const;

export interface ObjectiveMastery {
  id: string;
  /** Stima in [0, 1]. */
  value: number;
  /** Somma dei pesi delle evidenze (dopo il decadimento): quanto è affidabile. */
  evidence: number;
  level: MasteryLevel;
  /** Ultima attività (ms) o 0. */
  last: number;
}

export interface MasteryInput {
  /** Obiettivi da valutare (tutti quelli del corso). */
  objectives: readonly string[];
  /** esercizio → obiettivi */
  exerciseObjectives: Readonly<Record<string, readonly string[]>>;
  /** carta → obiettivi */
  cardObjectives: Readonly<Record<string, readonly string[]>>;
  progress?: ProgressState;
  srs?: SrsState;
  exams?: readonly ExamRecord[];
  now: number;
}

export function levelOf(value: number, evidence: number): MasteryLevel {
  if (evidence <= 0) return 0;
  if (value < 0.4) return 1;
  if (value < 0.7) return 2;
  if (value < 0.9) return 3;
  return 4;
}

export function computeMastery(
  input: MasteryInput,
  opts: MasteryOptions = {},
): Record<string, ObjectiveMastery> {
  const halfLife = opts.halfLifeDays ?? DEFAULTS.halfLifeDays;
  const prior = opts.priorWeight ?? DEFAULTS.priorWeight;
  const W = { ...DEFAULTS.weights, ...opts.weights };
  const acc = new Map<string, { sw: number; sws: number; last: number }>();
  for (const id of input.objectives) acc.set(id, { sw: 0, sws: 0, last: 0 });
  const decay = (at: number) => 0.5 ** (Math.max(0, input.now - at) / DAY_MS / halfLife);
  const addEvidence = (
    objectives: readonly string[] | undefined,
    score: number,
    weight: number,
    at: number,
  ) => {
    for (const o of objectives ?? []) {
      const a = acc.get(o);
      if (!a) continue;
      a.sw += weight;
      a.sws += weight * score;
      a.last = Math.max(a.last, at);
    }
  };

  for (const [exId, p] of Object.entries(input.progress?.exercises ?? {})) {
    const objs = input.exerciseObjectives[exId];
    // I tentativi più recenti contano di più; quelli con soluzione vista valgono la metà e al più 0,5.
    for (const a of p.attempts) {
      const score = a.revealed ? Math.min(a.score, 0.5) : a.score;
      addEvidence(objs, score, W.exercise * decay(a.at) * (a.revealed ? 0.5 : 1), a.at);
    }
  }
  for (const r of input.exams ?? []) {
    for (const [o, b] of Object.entries(r.byObjective)) {
      if (b.max > 0) addEvidence([o], b.earned / b.max, W.exam * b.max * decay(r.at), r.at);
    }
  }
  for (const [cardId, c] of Object.entries(input.srs?.cards ?? {})) {
    if (c.state === 'new' || c.lastReview === undefined) continue;
    addEvidence(input.cardObjectives[cardId], retrievability(c, input.now), W.card, c.lastReview);
  }

  const out: Record<string, ObjectiveMastery> = {};
  for (const [id, a] of acc) {
    const value = a.sw > 0 ? a.sws / (a.sw + prior) : 0;
    out[id] = { id, value, evidence: a.sw, level: levelOf(value, a.sw), last: a.last };
  }
  return out;
}

export interface TopicMastery {
  id: string;
  value: number;
  level: MasteryLevel;
  objectives: ObjectiveMastery[];
}

/** Aggrega per argomento (media semplice degli obiettivi). */
export function topicMastery(
  topics: readonly TopicInfo[],
  mastery: Readonly<Record<string, ObjectiveMastery>>,
): TopicMastery[] {
  return topics.map((t) => {
    const objectives = t.objectives.map(
      (o) => mastery[o.id] ?? { id: o.id, value: 0, evidence: 0, level: 0 as MasteryLevel, last: 0 },
    );
    const value = objectives.length ? objectives.reduce((s, o) => s + o.value, 0) / objectives.length : 0;
    const evidence = objectives.reduce((s, o) => s + o.evidence, 0);
    return { id: t.id, value, level: levelOf(value, evidence), objectives };
  });
}

/** Obiettivi già affrontati ma deboli, dal più debole (quelli mai visti sono "da iniziare", non deboli). */
export function weakSpots(
  mastery: Readonly<Record<string, ObjectiveMastery>>,
  limit = 5,
): ObjectiveMastery[] {
  return Object.values(mastery)
    .filter((m) => m.evidence > 0 && m.value < 0.7)
    .sort((a, b) => a.value - b.value || b.evidence - a.evidence)
    .slice(0, limit);
}

/** Padronanza complessiva del corso in [0, 1]. */
export function overallMastery(mastery: Readonly<Record<string, ObjectiveMastery>>): number {
  const all = Object.values(mastery);
  return all.length ? all.reduce((s, m) => s + m.value, 0) / all.length : 0;
}

// ─────────────────────────── piano di studio ───────────────────────────

export type PlanTaskKind = 'studia' | 'esercitati' | 'ripassa' | 'prova';

export interface PlanTask {
  kind: PlanTaskKind;
  /** Argomento (studia/esercitati). */
  topic?: string;
  /** Obiettivi coinvolti. */
  objectives?: string[];
  /** Carte da ripassare (ripassa). */
  cards?: number;
  minutes: number;
}

export interface PlanDay {
  /** AAAA-MM-GG (giorno locale). */
  date: string;
  tasks: PlanTask[];
  minutes: number;
}

export interface StudyPlan {
  days: PlanDay[];
  /** Giorni rimasti, esame escluso. */
  daysLeft: number;
  /** Minuti al giorno necessari (prima del limite). */
  requiredMinutesPerDay: number;
  /** Il carico supera il tempo disponibile. */
  overloaded: boolean;
}

export interface PlanInput {
  topics: readonly TopicInfo[];
  mastery: Readonly<Record<string, ObjectiveMastery>>;
  /** Data d'esame AAAA-MM-GG. */
  examDate: string;
  now: number;
  /** Minuti disponibili al giorno (default 90). */
  dailyMinutes?: number;
  /** Carte in scadenza ogni giorno (stima, default 0). */
  dailyReviews?: number;
  /** Prova completa? Se il corso ha una prova scritta si inseriscono simulazioni. */
  mockExams?: boolean;
  /** Durata della simulazione (minuti, default 120). */
  mockMinutes?: number;
}

export const ymd = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Giorni di calendario fra oggi e `dateISO` (a mezzogiorno locale: immune all'ora legale). */
export function daysUntil(dateISO: string, now: number): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
  if (!m) return null;
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  if (Number.isNaN(target.getTime()) || ymd(target) !== dateISO) return null;
  const today = new Date(now);
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  return Math.round((target.getTime() - t0.getTime()) / DAY_MS);
}

/** Minuti stimati per portare un obiettivo dalla padronanza attuale a "solido". */
const minutesFor = (m: ObjectiveMastery) =>
  m.evidence === 0 ? 40 : Math.max(10, Math.round((0.9 - m.value) * 50));

/**
 * Piano giornaliero da oggi al giorno prima dell'esame.
 * - priorità: obiettivi deboli già visti, poi quelli mai iniziati in ordine di programma;
 * - ogni argomento da studiare torna come esercitazione 2–4 giorni dopo (ripetizione distanziata);
 * - ripasso FSRS ogni giorno; simulazioni d'esame a cadenza settimanale e 3 giorni prima;
 * - l'ultimo giorno solo ripasso leggero.
 */
export function buildStudyPlan(input: PlanInput): StudyPlan {
  const daily = input.dailyMinutes ?? 90;
  const reviewsPerDay = input.dailyReviews ?? 0;
  const mockMinutes = input.mockMinutes ?? 120;
  const left = daysUntil(input.examDate, input.now);
  if (left === null || left <= 0)
    return { days: [], daysLeft: Math.max(0, left ?? 0), requiredMinutesPerDay: 0, overloaded: false };

  const order = new Map<string, number>();
  input.topics.forEach((t, i) => order.set(t.id, t.order ?? i));
  const units = input.topics
    .map((t) => {
      const objs = t.objectives.map(
        (o) => input.mastery[o.id] ?? { id: o.id, value: 0, evidence: 0, level: 0 as MasteryLevel, last: 0 },
      );
      const todo = objs.filter((o) => o.value < 0.9);
      const seen = objs.some((o) => o.evidence > 0);
      const avg = objs.length ? objs.reduce((s, o) => s + o.value, 0) / objs.length : 1;
      return { topic: t.id, todo, seen, avg, minutes: todo.reduce((s, o) => s + minutesFor(o), 0) };
    })
    .filter((u) => u.todo.length > 0)
    .sort(
      (a, b) =>
        Number(b.seen) - Number(a.seen) ||
        (a.seen ? a.avg - b.avg : 0) ||
        order.get(a.topic)! - order.get(b.topic)!,
    );

  const days: PlanDay[] = [];
  const start = new Date(input.now);
  for (let i = 0; i < left; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12);
    days.push({ date: ymd(d), tasks: [], minutes: 0 });
  }
  const push = (dayIdx: number, task: PlanTask) => {
    const day = days[Math.min(days.length - 1, Math.max(0, dayIdx))]!;
    day.tasks.push(task);
    day.minutes += task.minutes;
  };

  // Ripasso quotidiano.
  const reviewMin = Math.ceil(reviewsPerDay * 0.5);
  days.forEach((_, i) => {
    if (reviewsPerDay > 0) push(i, { kind: 'ripassa', cards: reviewsPerDay, minutes: reviewMin });
  });

  // Simulazioni: 3 giorni prima e poi a ritroso ogni 7 giorni (mai il primo giorno se c'è da studiare).
  const mocks = new Set<number>();
  if (input.mockExams !== false && left >= 2) {
    for (let i = left - 3; i >= 1; i -= 7) mocks.add(Math.max(0, i));
    if (left <= 3) mocks.add(left - 2);
  }
  for (const i of mocks) push(i, { kind: 'prova', minutes: mockMinutes });

  // Studio: si riempiono i giorni (escluso l'ultimo) rispettando il budget dove possibile.
  const studyDays = Math.max(1, left - 1);
  const totalStudy = units.reduce((s, u) => s + u.minutes * 1.5, 0); // +50 % per l'esercitazione di richiamo
  const fixed = days.reduce((s, d) => s + d.minutes, 0);
  const required = Math.ceil((totalStudy + fixed) / Math.max(1, left));
  let cursor = 0;
  for (const u of units) {
    // primo giorno con budget libero
    while (cursor < studyDays - 1 && days[cursor]!.minutes + u.minutes > Math.max(daily, required)) cursor++;
    const objectives = u.todo.map((o) => o.id);
    push(cursor, { kind: u.seen ? 'esercitati' : 'studia', topic: u.topic, objectives, minutes: u.minutes });
    const recall = Math.min(studyDays - 1, cursor + (u.seen ? 4 : 2));
    push(recall, { kind: 'esercitati', topic: u.topic, objectives, minutes: Math.ceil(u.minutes / 2) });
  }

  return { days, daysLeft: left, requiredMinutesPerDay: required, overloaded: required > daily };
}
