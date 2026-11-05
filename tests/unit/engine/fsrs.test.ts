import { describe, expect, it } from 'vitest';
import * as F from '../../../src/engine/fsrs';

const T0 = Date.UTC(2026, 10, 5, 9, 0, 0);
const DAY = F.DAY_MS;

describe('FSRS-5', () => {
  it('curva di oblio e intervalli', () => {
    expect(F.forgettingCurve(0, 5)).toBe(1);
    expect(F.forgettingCurve(5, 5)).toBeCloseTo(0.9, 10);
    expect(F.forgettingCurve(3, 0)).toBe(0);
    expect(F.nextInterval(10)).toBe(10);
    expect(F.nextInterval(0.01)).toBe(1);
    expect(F.nextInterval(1e9)).toBe(36500);
    expect(F.nextInterval(10, { ...F.DEFAULT_PARAMS, requestRetention: 0.8 })).toBeGreaterThan(10);
  });
  it('stato iniziale secondo i parametri di default', () => {
    expect(F.initStability(1)).toBeCloseTo(0.40255);
    expect(F.initStability(4)).toBeCloseTo(15.69105);
    expect(F.initDifficulty(1)).toBeCloseTo(7.1949);
    expect(F.initDifficulty(4)).toBeGreaterThanOrEqual(1);
    expect(F.initDifficulty(3)).toBeLessThan(F.initDifficulty(2));
  });
  it('prima valutazione', () => {
    const c = F.newCard(T0);
    expect(F.retrievability(c, T0)).toBe(0);
    const again = F.review(c, F.Rating.Again, T0);
    expect(again.card.state).toBe('learning');
    expect(again.log.scheduledDays * 1440).toBeCloseTo(10);
    const good = F.review(c, F.Rating.Good, T0);
    expect(good.card.state).toBe('review');
    expect(good.log.scheduledDays).toBe(3);
    expect(good.card.reps).toBe(1);
    const p = F.preview(c, T0);
    expect(p[1]).toBeLessThan(p[2]);
    expect(p[2]).toBeLessThanOrEqual(p[3]);
    expect(p[3]).toBeLessThan(p[4]);
  });
  it('ripasso riuscito aumenta la stabilità, l’oblio la riduce', () => {
    let { card } = F.review(F.newCard(T0), F.Rating.Good, T0);
    const later = card.due;
    const ok = F.review(card, F.Rating.Good, later);
    expect(ok.card.stability).toBeGreaterThan(card.stability);
    expect(ok.log.retrievability).toBeCloseTo(0.9, 1);
    const hard = F.review(card, F.Rating.Hard, later);
    const easy = F.review(card, F.Rating.Easy, later);
    expect(hard.card.stability).toBeLessThan(ok.card.stability);
    expect(easy.card.stability).toBeGreaterThan(ok.card.stability);
    const lapse = F.review(card, F.Rating.Again, later);
    expect(lapse.card.state).toBe('relearning');
    expect(lapse.card.lapses).toBe(1);
    expect(lapse.card.stability).toBeLessThanOrEqual(card.stability);
    expect(lapse.card.difficulty).toBeGreaterThan(card.difficulty);
    card = lapse.card;
    // stesso giorno: ripasso a breve termine
    const st = F.review(card, F.Rating.Good, card.due);
    expect(st.card.state).toBe('review');
    expect(st.log.elapsedDays).toBeLessThan(1);
    const st2 = F.review(st.card, F.Rating.Again, st.card.lastReview! + 3600_000);
    expect(st2.card.state).toBe('relearning');
    const learning = F.review(F.newCard(T0), F.Rating.Again, T0).card;
    expect(F.review(learning, F.Rating.Again, T0 + 600_000).card.state).toBe('learning');
  });
  it('difficoltà limitata in [1, 10]', () => {
    let d = 5;
    for (let i = 0; i < 50; i++) d = F.nextDifficulty(d, 1);
    expect(d).toBeLessThanOrEqual(10);
    for (let i = 0; i < 50; i++) d = F.nextDifficulty(d, 4);
    expect(d).toBeGreaterThanOrEqual(1);
    expect(F.shortTermStability(2, 3)).toBeGreaterThan(2);
    expect(F.recallStability(5, 3, 0.9, 3)).toBeGreaterThan(3);
    expect(F.forgetStability(5, 3, 0.5)).toBeLessThanOrEqual(3);
  });
  it('rispetta la data d’esame', () => {
    const c = F.review(F.newCard(T0), F.Rating.Easy, T0).card;
    const exam = c.due - 2 * DAY + 3 * DAY; // scadenza naturale oltre l'esame?
    const r = F.review(c, F.Rating.Easy, c.due, { notAfter: c.due + 5 * DAY });
    expect(r.card.due).toBeLessThanOrEqual(c.due + 4 * DAY + 1);
    expect(r.card.due).toBeGreaterThanOrEqual(c.due + DAY);
    expect(exam).toBeGreaterThan(0);
  });
  it('coda e statistiche', () => {
    const cards: Record<string, F.SrsCard> = {};
    cards.a = F.review(F.newCard(T0), F.Rating.Good, T0).card; // scade a T0+3g
    cards.b = F.review(F.newCard(T0), F.Rating.Again, T0).card; // scade a T0+10min
    cards.c = F.review(F.newCard(T0), F.Rating.Easy, T0).card;
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
    const now = T0 + 4 * DAY;
    const q = F.buildQueue(ids, cards, now, { newLimit: 2, order: ['f', 'e', 'd'] });
    expect(q.map((x) => x.id)).toEqual(['b', 'a', 'f', 'e']);
    expect(F.buildQueue(ids, cards, now, { reviewLimit: 1, newLimit: 0 }).map((x) => x.id)).toEqual(['b']);
    const s = F.stats(ids, cards, now);
    expect(s).toMatchObject({ total: 6, new: 3, learning: 1, review: 2, dueNow: 2 });
    expect(s.forecast[0]).toBe(2);
    expect(s.averageRetention).toBeGreaterThan(0);
    expect(F.stats([], {}, now).averageRetention).toBe(0);
  });
  it('formato intervalli e validazione', () => {
    expect(F.formatInterval(10 / 1440)).toBe('10 min');
    expect(F.formatInterval(0.25, 'en')).toBe('6 h');
    expect(F.formatInterval(3)).toBe('3 g');
    expect(F.formatInterval(3, 'en')).toBe('3 d');
    expect(F.formatInterval(30)).toBe('1 mese');
    expect(F.formatInterval(90, 'en')).toBe('3 months');
    expect(F.formatInterval(31, 'en')).toBe('1 month');
    expect(F.formatInterval(547)).toBe('1,5 anni');
    expect(F.formatInterval(365, 'en')).toBe('1 year');
    expect(F.formatInterval(365)).toBe('1 anno');
    expect(F.formatInterval(800, 'en')).toBe('2.2 years');
    expect(F.isSrsCard(F.newCard(T0))).toBe(true);
    expect(F.isSrsCard({ ...F.newCard(T0), due: NaN })).toBe(false);
    expect(F.isSrsCard({ ...F.newCard(T0), state: 'x' })).toBe(false);
    expect(F.isSrsCard(null)).toBe(false);
    expect(F.isSrsCard({ ...F.newCard(T0), lastReview: 'x' })).toBe(false);
  });
});
