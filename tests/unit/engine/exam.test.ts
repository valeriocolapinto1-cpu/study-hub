import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import * as E from '../../../src/engine/exam';
import { createMemoryBackend, setStorageBackend } from '../../../src/engine/storage';
import { cards, exercises } from './fixtures';

const course: E.ExamCourse = {
  id: 'esempio',
  durationMin: 90,
  examFormat: 'scritto',
  structure: [
    { label: 'Esercizio 1', points: 10, kind: 'esercizio' },
    { label: 'Esercizio 2', points: 10, kind: 'problema' },
    { label: 'Quiz', points: 5, kind: 'quiz' },
    { label: 'Teoria', points: 5, kind: 'domanda-teoria' },
  ],
};
const pool = { exercises, cards };

describe('assemblaggio', () => {
  it('categorie dalle kind', () => {
    expect(E.categoryOf('quiz')).toBe('choice');
    expect(E.categoryOf('crocette')).toBe('choice');
    expect(E.categoryOf('orale')).toBe('open');
    expect(E.categoryOf('domanda-teoria')).toBe('open');
    expect(E.categoryOf('esercizio')).toBe('numeric');
  });
  it('deterministico e conforme alla struttura', () => {
    const cfg: E.ExamConfig = { mode: 'completa', seed: 42 };
    const a = E.assembleExam(course, pool, cfg);
    const b = E.assembleExam(course, pool, cfg);
    expect(a).toEqual(b);
    expect(a.questions).toHaveLength(4);
    expect(a.totalPoints).toBe(30);
    expect(a.durationMin).toBe(90);
    expect(a.questions[2]!.category).toBe('choice');
    expect(a.questions[3]!.category).toBe('open');
    expect(new Set(a.questions.map((q) => q.ref.id)).size).toBe(4);
    const seeds = new Set(
      Array.from({ length: 20 }, (_, s) =>
        E.examRefs(E.assembleExam(course, pool, { mode: 'completa', seed: s })).join(),
      ),
    );
    expect(seeds.size).toBeGreaterThan(1);
  });
  it('generati con seme derivato, filtro argomenti, durata', () => {
    for (let s = 0; s < 30; s++) {
      const e = E.assembleExam(course, pool, {
        mode: 'personalizzata',
        seed: s,
        topics: ['gamma'],
        count: 2,
        durationMin: null,
      });
      expect(e.questions.every((q) => q.topic === 'gamma')).toBe(true);
      expect(e.durationMin).toBeNull();
      for (const q of e.questions) if (q.ref.id === 'g1') expect(typeof q.seed).toBe('number');
    }
  });
  it('senza punti: 1 a domanda; orale: domande aperte; pool vuoto', () => {
    const e = E.assembleExam(
      {
        id: 'x',
        structure: [
          { label: 'A', kind: 'orale' },
          { label: 'B', kind: 'orale' },
        ],
      },
      pool,
      { mode: 'completa', seed: 1 },
    );
    expect(e.totalPoints).toBe(2);
    const o = E.assembleExam({ id: 'x', structure: [], examFormat: 'orale' }, pool, {
      mode: 'personalizzata',
      seed: 3,
      count: 3,
    });
    expect(o.questions.every((q) => q.category === 'open')).toBe(true);
    expect(
      E.assembleExam(course, { exercises: [], cards: [] }, { mode: 'completa', seed: 1 }).questions,
    ).toHaveLength(0);
    // pool più piccolo della prova: si ripete
    const big = E.assembleExam(
      course,
      { exercises: exercises.slice(0, 1), cards: [] },
      { mode: 'personalizzata', seed: 1, count: 3 },
    );
    expect(big.questions).toHaveLength(3);
  });
  it('mirata privilegia gli obiettivi deboli', () => {
    const weak = { 'alfa.1': 1, 'alfa.2': 1, 'beta.1': 1, 'gamma.1': 0 };
    let gamma = 0;
    for (let s = 0; s < 40; s++) {
      const e = E.assembleExam(course, pool, { mode: 'mirata', seed: s, count: 1 }, weak);
      if (e.questions[0]!.topic === 'gamma') gamma++;
    }
    expect(gamma).toBeGreaterThan(30);
  });
  it('riferimenti forzati riproducono la prova', () => {
    const cfg: E.ExamConfig = { mode: 'mirata', seed: 9, count: 3 };
    const a = E.assembleExam(course, pool, cfg, { 'gamma.1': 0 });
    const b = E.assembleExam(course, pool, cfg, undefined, E.examRefs(a));
    expect(b.questions).toEqual(a.questions);
  });
});

describe('correzione', () => {
  const exam = E.assembleExam(course, pool, { mode: 'completa', seed: 5 });
  const resolved = exam.questions.map((q) => {
    const e = exercises.find((x) => x.id === q.ref.id);
    if (e?.kind === 'generated') return { answer: [{ label: 'x', value: 1 }] };
    return e ? { answer: e.answer, ...(e.choices ? { choices: e.choices } : {}) } : undefined;
  });
  it('punteggio, voto e analisi', () => {
    const answers: E.ExamAnswer[] = exam.questions.map((q) =>
      q.category === 'choice' ? { choices: [1] } : q.category === 'open' ? { self: 1 } : { fields: ['1'] },
    );
    const r = E.gradeExam(exam, resolved, answers);
    expect(r.earned).toBe(30);
    expect(r.grade30).toBe(30);
    expect(r.lode).toBe(true);
    const r2 = E.gradeExam(exam, resolved, []);
    expect(r2.earned).toBe(0);
    expect(r2.questions.every((q) => q.status === 'blank')).toBe(true);
    const half: E.ExamAnswer[] = exam.questions.map((q) =>
      q.category === 'open' ? { self: 0.5 } : q.category === 'choice' ? { choices: [0] } : { fields: ['2'] },
    );
    const r3 = E.gradeExam(exam, resolved, half);
    expect(r3.earned).toBe(2.5);
    expect(r3.questions.find((q) => q.status === 'partial')).toBeTruthy();
    expect(r3.lode).toBe(false);
    const an = E.analyze(r3);
    expect(an.topics[0]!.percent).toBeLessThanOrEqual(an.topics.at(-1)!.percent);
    expect(an.objectives.length).toBeGreaterThan(0);
    const p = E.assembleExam(course, pool, { mode: 'personalizzata', seed: 1, count: 2 });
    expect(E.gradeExam(p, [], []).grade30).toBeUndefined();
    expect(E.gradeQuestion(p.questions[0]!, undefined, { self: 0 }).status).toBe('wrong');
  });
  it('timer', () => {
    expect(E.remainingMs(0, 1, 30_000)).toBe(30_000);
    expect(E.remainingMs(0, 1, 90_000)).toBe(0);
    expect(E.remainingMs(0, null, 1)).toBe(Infinity);
    expect(E.formatClock(65_000)).toBe('01:05');
    expect(E.formatClock(3_725_000)).toBe('1:02:05');
    expect(E.formatClock(Infinity)).toBe('∞');
  });
  it('stampa: query andata e ritorno', () => {
    const p: E.PrintParams = {
      course: 'esempio',
      config: { mode: 'personalizzata', seed: 7, topics: ['alfa', 'beta'], count: 4, durationMin: null },
      part: 'soluzioni',
      refs: ['e:e1', 'c:c2'],
    };
    expect(E.parsePrintQuery(E.printQuery(p))).toEqual(p);
    const p2: E.PrintParams = {
      course: 'esempio',
      config: { mode: 'completa', seed: 1, durationMin: 60 },
      part: 'prova',
    };
    expect(E.parsePrintQuery(E.printQuery(p2))).toEqual(p2);
    expect(E.parsePrintQuery('?corso=X!&seme=1&modo=completa')).toBeNull();
    expect(E.parsePrintQuery('corso=a&seme=-1&modo=completa')).toBeNull();
    expect(E.parsePrintQuery('corso=a&seme=1&modo=boh')).toBeNull();
  });
});

describe('sessione e storico', () => {
  beforeEach(() => setStorageBackend(createMemoryBackend()));
  afterEach(() => setStorageBackend(undefined));
  it('salva, riprende e registra', () => {
    const exam = E.assembleExam(course, pool, { mode: 'completa', seed: 5 });
    const session: E.ExamSession = {
      config: exam.config,
      startedAt: 1000,
      answers: [{ fields: ['1'] }],
      current: 0,
    };
    E.saveSession('esempio', session);
    expect(E.loadExamState('esempio').session).toEqual(session);
    const result = E.gradeExam(exam, [], []);
    const rec = E.toRecord(exam, result, 1000, 61_000);
    expect(rec.durationMs).toBe(60_000);
    E.saveRecord('esempio', rec);
    const st = E.loadExamState('esempio');
    expect(st.history).toHaveLength(1);
    expect(st.session).toBeUndefined();
    E.replaceRecord('esempio', { ...rec, percent: 99 });
    expect(E.loadExamState('esempio').history[0]!.percent).toBe(99);
    E.saveSession('esempio', session);
    E.saveSession('esempio', undefined);
    expect(E.loadExamState('esempio').session).toBeUndefined();
    expect(E.sanitizeExamState('x')).toEqual(E.emptyExamState());
    expect(E.sanitizeExamState({ history: [{ id: 1 }, rec], session: { foo: 1 } }).history).toHaveLength(1);
  });
});
