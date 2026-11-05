/**
 * Ripetizione spaziata con FSRS (Free Spaced Repetition Scheduler), versione 5,
 * con i parametri di default pubblicati. Compatibile con il modello v4
 * (stessa curva di oblio in forma generale; v5 aggiunge il ripasso nello
 * stesso giorno e lo smorzamento lineare della difficoltà).
 *
 * Modello DSR: ogni carta ha stabilità S (giorni perché la probabilità di
 * ricordo scenda al 90 %), difficoltà D ∈ [1, 10] e retrievability R(t).
 * Valutazioni: 1 Again, 2 Hard, 3 Good, 4 Easy.
 *
 * Funzioni pure: il "ora" si passa sempre da fuori (ms epoch).
 */

export const Rating = { Again: 1, Hard: 2, Good: 3, Easy: 4 } as const;
export type Rating = (typeof Rating)[keyof typeof Rating];
export const RATINGS: readonly Rating[] = [1, 2, 3, 4];

export type CardState = 'new' | 'learning' | 'review' | 'relearning';

export interface SrsCard {
  /** Prossima scadenza (ms epoch). Le carte nuove scadono subito. */
  due: number;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  state: CardState;
  /** Ultimo ripasso (ms epoch), assente per le carte nuove. */
  lastReview?: number;
}

export interface ReviewLog {
  rating: Rating;
  at: number;
  /** Stato prima del ripasso. */
  state: CardState;
  /** Giorni trascorsi dal ripasso precedente. */
  elapsedDays: number;
  /** Intervallo programmato (giorni, frazionario per i passi brevi). */
  scheduledDays: number;
  /** Probabilità di ricordo stimata al momento del ripasso. */
  retrievability: number;
}

/** Parametri di default di FSRS-5 (19 pesi). */
export const DEFAULT_W: readonly number[] = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11,
  0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
];

export interface FsrsParams {
  w: readonly number[];
  /** Probabilità di ricordo desiderata al momento del ripasso. */
  requestRetention: number;
  /** Intervallo massimo in giorni. */
  maximumInterval: number;
  /** Passo di (ri)apprendimento dopo Again, in minuti. */
  learningStepMinutes: number;
}

export const DEFAULT_PARAMS: FsrsParams = {
  w: DEFAULT_W,
  requestRetention: 0.9,
  maximumInterval: 36500,
  learningStepMinutes: 10,
};

export const DECAY = -0.5;
export const FACTOR = 19 / 81; // 0.9^(1/DECAY) − 1: con R = 0.9 l'intervallo vale S
export const DAY_MS = 86_400_000;

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const wAt = (w: readonly number[], i: number) => w[i] as number;

export function newCard(now: number): SrsCard {
  return { due: now, stability: 0, difficulty: 0, reps: 0, lapses: 0, state: 'new' };
}

/** Probabilità di ricordo dopo `elapsedDays` con stabilità `stability`. */
export function forgettingCurve(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return (1 + (FACTOR * Math.max(0, elapsedDays)) / stability) ** DECAY;
}

/** Retrievability attuale di una carta (0 per le nuove). */
export function retrievability(card: SrsCard, now: number): number {
  if (card.state === 'new' || card.lastReview === undefined) return 0;
  return forgettingCurve((now - card.lastReview) / DAY_MS, card.stability);
}

/** Intervallo in giorni (intero ≥ 1) che porta R a `requestRetention`. */
export function nextInterval(stability: number, params: FsrsParams = DEFAULT_PARAMS): number {
  const raw = (stability / FACTOR) * (params.requestRetention ** (1 / DECAY) - 1);
  return clamp(Math.round(raw), 1, params.maximumInterval);
}

export function initStability(rating: Rating, w: readonly number[] = DEFAULT_W): number {
  return Math.max(wAt(w, rating - 1), 0.1);
}

export function initDifficulty(rating: Rating, w: readonly number[] = DEFAULT_W): number {
  return clamp(wAt(w, 4) - Math.exp(wAt(w, 5) * (rating - 1)) + 1, 1, 10);
}

export function nextDifficulty(d: number, rating: Rating, w: readonly number[] = DEFAULT_W): number {
  const delta = -wAt(w, 6) * (rating - 3);
  const damped = d + (delta * (10 - d)) / 9; // smorzamento lineare (FSRS-5)
  const target = initDifficulty(Rating.Easy, w);
  return clamp(wAt(w, 7) * target + (1 - wAt(w, 7)) * damped, 1, 10);
}

export function recallStability(
  d: number,
  s: number,
  r: number,
  rating: Rating,
  w: readonly number[] = DEFAULT_W,
): number {
  const hard = rating === Rating.Hard ? wAt(w, 15) : 1;
  const easy = rating === Rating.Easy ? wAt(w, 16) : 1;
  return (
    s *
    (1 +
      Math.exp(wAt(w, 8)) * (11 - d) * s ** -wAt(w, 9) * (Math.exp((1 - r) * wAt(w, 10)) - 1) * hard * easy)
  );
}

export function forgetStability(d: number, s: number, r: number, w: readonly number[] = DEFAULT_W): number {
  const sf = wAt(w, 11) * d ** -wAt(w, 12) * ((s + 1) ** wAt(w, 13) - 1) * Math.exp((1 - r) * wAt(w, 14));
  return Math.min(sf, s); // dopo un oblio la stabilità non può crescere
}

/** Ripasso nello stesso giorno (FSRS-5). */
export function shortTermStability(s: number, rating: Rating, w: readonly number[] = DEFAULT_W): number {
  return s * Math.exp(wAt(w, 17) * (rating - 3 + wAt(w, 18)));
}

export interface ScheduleOptions {
  params?: FsrsParams;
  /**
   * Scadenza massima (ms epoch), es. la data d'esame: l'intervallo viene
   * accorciato perché la carta torni prima dell'appello.
   */
  notAfter?: number;
}

/** Applica una valutazione: restituisce la carta aggiornata e il log. */
export function review(
  card: SrsCard,
  rating: Rating,
  now: number,
  opts: ScheduleOptions = {},
): { card: SrsCard; log: ReviewLog } {
  const params = opts.params ?? DEFAULT_PARAMS;
  const { w } = params;
  const elapsedDays = card.lastReview === undefined ? 0 : Math.max(0, (now - card.lastReview) / DAY_MS);
  const r = retrievability(card, now);
  let { stability: s, difficulty: d } = card;
  let state: CardState;

  if (card.state === 'new') {
    s = initStability(rating, w);
    d = initDifficulty(rating, w);
    state = rating === Rating.Again ? 'learning' : 'review';
  } else if (elapsedDays < 1) {
    s = shortTermStability(s, rating, w);
    d = nextDifficulty(d, rating, w);
    state = rating === Rating.Again ? (card.state === 'review' ? 'relearning' : card.state) : 'review';
  } else if (rating === Rating.Again) {
    s = forgetStability(d, s, r, w);
    d = nextDifficulty(d, rating, w);
    state = 'relearning';
  } else {
    s = recallStability(d, s, r, rating, w);
    d = nextDifficulty(d, rating, w);
    state = 'review';
  }
  s = clamp(s, 0.01, params.maximumInterval);

  let scheduledDays: number;
  if (rating === Rating.Again) {
    scheduledDays = params.learningStepMinutes / 1440;
  } else {
    scheduledDays = nextInterval(s, params);
    // Hard non deve superare Good, Easy almeno un giorno oltre Good: lo
    // garantisce la monotonia di S rispetto al rating (w15 < 1 < w16).
  }
  let due = now + scheduledDays * DAY_MS;
  if (opts.notAfter !== undefined && rating !== Rating.Again && due > opts.notAfter && opts.notAfter > now) {
    // Almeno un ripasso prima dell'esame: si torna al giorno prima, ma mai prima di domani.
    due = Math.max(now + DAY_MS, opts.notAfter - DAY_MS);
    scheduledDays = (due - now) / DAY_MS;
  }

  const lapses = card.lapses + (rating === Rating.Again && card.state === 'review' ? 1 : 0);
  return {
    card: { due, stability: s, difficulty: d, reps: card.reps + 1, lapses, state, lastReview: now },
    log: { rating, at: now, state: card.state, elapsedDays, scheduledDays, retrievability: r },
  };
}

/** Anteprima degli intervalli per i quattro pulsanti (giorni). */
export function preview(card: SrsCard, now: number, opts: ScheduleOptions = {}): Record<Rating, number> {
  const out = {} as Record<Rating, number>;
  for (const rating of RATINGS) out[rating] = review(card, rating, now, opts).log.scheduledDays;
  return out;
}

/** Testo breve di un intervallo: «10 min», «3 g», «2 mesi», «1,5 anni». */
export function formatInterval(days: number, lang: 'it' | 'en' = 'it'): string {
  const it = lang === 'it';
  if (days < 1 / 24) return `${Math.max(1, Math.round(days * 1440))} min`;
  if (days < 1) return `${Math.round(days * 24)} ${it ? 'h' : 'h'}`;
  if (days < 30) return `${Math.round(days)} ${it ? 'g' : 'd'}`;
  if (days < 365) {
    const m = Math.round(days / 30);
    return `${m} ${it ? (m === 1 ? 'mese' : 'mesi') : m === 1 ? 'month' : 'months'}`;
  }
  const y = Math.round((days / 365) * 10) / 10;
  const ys = it ? String(y).replace('.', ',') : String(y);
  return `${ys} ${it ? (y === 1 ? 'anno' : 'anni') : y === 1 ? 'year' : 'years'}`;
}

export interface QueueItem {
  id: string;
  card: SrsCard;
}

export interface QueueOptions {
  /** Carte nuove al giorno (default 20). */
  newLimit?: number;
  /** Ripassi al giorno (default 200). */
  reviewLimit?: number;
  /** Ordine in cui introdurre le carte nuove (id); di default quello di `ids`. */
  order?: readonly string[];
}

/**
 * Coda di ripasso: prima le carte scadute, dalla meno ricordata; poi le nuove
 * fino al limite giornaliero. `ids` sono tutte le carte disponibili; quelle
 * senza stato in `cards` sono nuove.
 */
export function buildQueue(
  ids: readonly string[],
  cards: Readonly<Record<string, SrsCard>>,
  now: number,
  opts: QueueOptions = {},
): QueueItem[] {
  const { newLimit = 20, reviewLimit = 200 } = opts;
  const due: QueueItem[] = [];
  const fresh: QueueItem[] = [];
  const order = opts.order ?? ids;
  const rank = new Map(order.map((id, i) => [id, i]));
  for (const id of ids) {
    const card = cards[id];
    if (!card || card.state === 'new') fresh.push({ id, card: card ?? newCard(now) });
    else if (card.due <= now) due.push({ id, card });
  }
  due.sort((a, b) => retrievability(a.card, now) - retrievability(b.card, now) || a.card.due - b.card.due);
  fresh.sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity));
  return [...due.slice(0, reviewLimit), ...fresh.slice(0, newLimit)];
}

export interface SrsStats {
  total: number;
  new: number;
  learning: number;
  review: number;
  dueNow: number;
  /** Scadenze nei prossimi 7 giorni (indice 0 = oggi entro fine giornata). */
  forecast: number[];
  /** Retrievability media delle carte già studiate. */
  averageRetention: number;
}

export function stats(
  ids: readonly string[],
  cards: Readonly<Record<string, SrsCard>>,
  now: number,
): SrsStats {
  const out: SrsStats = {
    total: ids.length,
    new: 0,
    learning: 0,
    review: 0,
    dueNow: 0,
    forecast: [0, 0, 0, 0, 0, 0, 0],
    averageRetention: 0,
  };
  let sumR = 0;
  let studied = 0;
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  for (const id of ids) {
    const c = cards[id];
    if (!c || c.state === 'new') {
      out.new++;
      continue;
    }
    if (c.state === 'review') out.review++;
    else out.learning++;
    if (c.due <= now) out.dueNow++;
    const dayIdx = c.due <= endOfToday.getTime() ? 0 : Math.ceil((c.due - endOfToday.getTime()) / DAY_MS);
    if (dayIdx < 7) out.forecast[dayIdx] = (out.forecast[dayIdx] as number) + 1;
    sumR += retrievability(c, now);
    studied++;
  }
  out.averageRetention = studied ? sumR / studied : 0;
  return out;
}

/** Valida (e ripara) uno stato importato: niente NaN, stati noti. */
export function isSrsCard(x: unknown): x is SrsCard {
  if (!x || typeof x !== 'object') return false;
  const c = x as Record<string, unknown>;
  return (
    typeof c.due === 'number' &&
    Number.isFinite(c.due) &&
    typeof c.stability === 'number' &&
    Number.isFinite(c.stability) &&
    typeof c.difficulty === 'number' &&
    Number.isFinite(c.difficulty) &&
    typeof c.reps === 'number' &&
    typeof c.lapses === 'number' &&
    (c.state === 'new' || c.state === 'learning' || c.state === 'review' || c.state === 'relearning') &&
    (c.lastReview === undefined || (typeof c.lastReview === 'number' && Number.isFinite(c.lastReview)))
  );
}
