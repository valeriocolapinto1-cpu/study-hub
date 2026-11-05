import { describe, expect, it } from 'vitest';
import * as M from '../../../src/engine/mastery';
import { emptyProgress, emptySrs, withAttempt, withReview } from '../../../src/engine/progress';
import { DAY_MS } from '../../../src/engine/fsrs';
import { topics } from './fixtures';

const NOW = new Date(2026, 10, 5, 10).getTime();
const objectives = topics.flatMap((t) => t.objectives.map((o) => o.id));
const exObj = { e1: ['alfa.1'], e2: ['alfa.2'], e3: ['beta.1'] };

describe('padronanza', () => {
  it('nessuna evidenza → livello 0', () => {
    const m = M.computeMastery({ objectives, exerciseObjectives: exObj, cardObjectives: {}, now: NOW });
    expect(m['alfa.1']).toMatchObject({ value: 0, evidence: 0, level: 0 });
    expect(M.overallMastery(m)).toBe(0);
    expect(M.overallMastery({})).toBe(0);
  });
  it('esercizi, prior, decadimento, soluzione vista', () => {
    let p = emptyProgress();
    p = withAttempt(p, 'e1', { at: NOW, score: 1 });
    p = withAttempt(p, 'e1', { at: NOW, score: 1 });
    p = withAttempt(p, 'e2', { at: NOW - 60 * DAY_MS, score: 1 });
    p = withAttempt(p, 'e3', { at: NOW, score: 1, revealed: true });
    p = withAttempt(p, 'zz', { at: NOW, score: 1 });
    const m = M.computeMastery({
      objectives,
      exerciseObjectives: { ...exObj, zz: ['ignoto.1'] },
      cardObjectives: {},
      progress: p,
      now: NOW,
    });
    expect(m['alfa.1']!.value).toBeCloseTo(2 / 3);
    expect(m['alfa.2']!.value).toBeLessThan(0.2);
    expect(m['beta.1']!.value).toBeLessThanOrEqual(0.5);
    expect(m['alfa.1']!.last).toBe(NOW);
    expect(M.levelOf(0.95, 1)).toBe(4);
    expect(M.levelOf(0.8, 1)).toBe(3);
    expect(M.levelOf(0.5, 1)).toBe(2);
    expect(M.levelOf(0.1, 1)).toBe(1);
  });
  it('prove e carte', () => {
    let srs = emptySrs();
    srs = withReview(srs, 'c1', 3, NOW - 2 * DAY_MS);
    srs = {
      ...srs,
      cards: { ...srs.cards, c9: { due: 0, stability: 0, difficulty: 0, reps: 0, lapses: 0, state: 'new' } },
    };
    const exams = [
      {
        id: 'x',
        at: NOW,
        config: { mode: 'completa' as const, seed: 1 },
        earned: 5,
        total: 10,
        percent: 50,
        durationMs: 1,
        byTopic: {},
        byObjective: { 'gamma.1': { earned: 2, max: 2 }, 'beta.1': { earned: 0, max: 0 } },
      },
    ];
    const m = M.computeMastery({
      objectives,
      exerciseObjectives: {},
      cardObjectives: { c1: ['beta.1'], c9: ['beta.1'] },
      srs,
      exams,
      now: NOW,
    });
    expect(m['gamma.1']!.value).toBeGreaterThan(0.7);
    expect(m['beta.1']!.value).toBeGreaterThan(0.3);
    const tm = M.topicMastery(topics, m);
    expect(tm.map((t) => t.id)).toEqual(['alfa', 'beta', 'gamma']);
    expect(tm[0]!.level).toBe(0);
    expect(M.topicMastery([{ id: 'v', order: 0, title: 'v', objectives: [] }], {})[0]!.value).toBe(0);
    const weak = M.weakSpots({
      ...m,
      'alfa.1': { id: 'alfa.1', value: 0.2, evidence: 1, level: 1, last: 0 },
    });
    expect(weak[0]!.id).toBe('alfa.1');
    expect(weak.find((w) => w.id === 'gamma.1')).toBeUndefined();
  });
});

describe('piano di studio', () => {
  it('daysUntil', () => {
    expect(M.daysUntil('2026-11-05', NOW)).toBe(0);
    expect(M.daysUntil('2026-11-12', NOW)).toBe(7);
    expect(M.daysUntil('2026-02-30', NOW)).toBeNull();
    expect(M.daysUntil('boh', NOW)).toBeNull();
    expect(M.ymd(new Date(2026, 0, 2))).toBe('2026-01-02');
  });
  it('esame passato o oggi: piano vuoto', () => {
    expect(M.buildStudyPlan({ topics, mastery: {}, examDate: '2026-11-01', now: NOW }).days).toEqual([]);
    expect(M.buildStudyPlan({ topics, mastery: {}, examDate: 'x', now: NOW }).daysLeft).toBe(0);
  });
  it('distribuisce studio, richiami, ripasso e simulazioni', () => {
    const mastery = M.computeMastery({ objectives, exerciseObjectives: {}, cardObjectives: {}, now: NOW });
    mastery['beta.1'] = { id: 'beta.1', value: 0.3, evidence: 2, level: 1, last: NOW };
    const plan = M.buildStudyPlan({
      topics,
      mastery,
      examDate: '2026-11-20',
      now: NOW,
      dailyReviews: 10,
      dailyMinutes: 60,
    });
    expect(plan.daysLeft).toBe(15);
    expect(plan.days).toHaveLength(15);
    expect(plan.days[0]!.date).toBe('2026-11-05');
    expect(plan.days.every((d) => d.tasks.some((t) => t.kind === 'ripassa'))).toBe(true);
    const first = plan.days[0]!.tasks.find((t) => t.kind !== 'ripassa' && t.kind !== 'prova');
    expect(first).toMatchObject({ kind: 'esercitati', topic: 'beta' });
    expect(plan.days[12]!.tasks.some((t) => t.kind === 'prova')).toBe(true);
    const studied = plan.days
      .flatMap((d) => d.tasks)
      .filter((t) => t.kind === 'studia')
      .map((t) => t.topic);
    expect(studied).toEqual(['alfa', 'gamma']);
    expect(plan.days.at(-1)!.tasks.every((t) => t.kind === 'ripassa')).toBe(true);
    expect(plan.requiredMinutesPerDay).toBeGreaterThan(0);
    const short = M.buildStudyPlan({
      topics,
      mastery,
      examDate: '2026-11-07',
      now: NOW,
      mockExams: true,
      dailyMinutes: 10,
    });
    expect(short.overloaded).toBe(true);
    expect(short.days.some((d) => d.tasks.some((t) => t.kind === 'prova'))).toBe(true);
    const done = Object.fromEntries(
      objectives.map((o) => [o, { id: o, value: 1, evidence: 5, level: 4 as const, last: NOW }]),
    );
    expect(
      M.buildStudyPlan({
        topics,
        mastery: done,
        examDate: '2026-11-20',
        now: NOW,
        mockExams: false,
      }).days.every((d) => d.tasks.length === 0),
    ).toBe(true);
  });
});
