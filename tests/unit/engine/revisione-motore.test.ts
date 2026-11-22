/**
 * Lacune del motore segnalate in docs/revisione/: crocette rimescolate (con alternative fisse in
 * fondo), voci della prova coperte da esercizi con `examTags`, appelli passati nascosti.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import * as E from '../../../src/engine/exam';
import { choiceOrder, deriveSeed } from '../../../src/engine/random';
import { daysUntil, examDateFor, upcomingDates } from '../../../src/engine/mastery';
import type { ChoiceData, ExerciseData } from '../../../src/engine/course-data';
import { cards, exercises } from './fixtures';

const choices: ChoiceData[] = [
  { html: 'A', correct: false },
  { html: 'B', correct: true },
  { html: 'C', correct: false },
  { html: 'D', correct: false },
  { html: 'Tutte le precedenti', correct: false, fixedLast: true },
];

describe('rimescolamento delle alternative', () => {
  it('stesso seme → stesso ordine; è una permutazione', () => {
    for (let s = 0; s < 50; s++) {
      const a = choiceOrder(choices, s);
      expect(choiceOrder(choices, s)).toEqual(a);
      expect([...a].sort()).toEqual([0, 1, 2, 3, 4]);
    }
  });
  it("cambia con il seme e non resta sempre nell'ordine d'autore", () => {
    const orders = new Set(Array.from({ length: 50 }, (_, s) => choiceOrder(choices, s).join()));
    expect(orders.size).toBeGreaterThan(10);
    // ogni alternativa libera finisce prima o poi in testa
    const first = new Set(Array.from({ length: 50 }, (_, s) => choiceOrder(choices, s)[0]));
    expect(first).toEqual(new Set([0, 1, 2, 3]));
  });
  it('le alternative fixedLast restano in fondo, nell’ordine d’autore', () => {
    const two = [...choices.slice(0, 3), { html: 'Nessuna', correct: false, fixedLast: true }, choices[4]!];
    for (let s = 0; s < 50; s++) {
      expect(choiceOrder(choices, s).at(-1)).toBe(4);
      expect(choiceOrder(two, s).slice(-2)).toEqual([3, 4]);
    }
  });
  it('la correzione resta corretta dopo il rimescolamento (prova)', () => {
    const q: E.ExamQuestion = {
      index: 2,
      ref: { type: 'exercise', id: 'mcq' },
      topic: 'alfa',
      objectives: ['alfa.1'],
      label: 'Crocetta',
      points: 2,
      category: 'choice',
    };
    for (let s = 0; s < 50; s++) {
      // come resolveQuestion: alternative nell'ordine mostrato, risposte salvate come indici mostrati
      const order = choiceOrder(choices, deriveSeed('scelte', s, q.index, q.ref.id));
      const shown = order.map((i) => choices[i]!);
      const right = shown.findIndex((c) => c.correct);
      const wrong = shown.findIndex((c) => !c.correct);
      const resolved = { answer: [], choices: shown };
      expect(order[right]).toBe(1);
      expect(E.gradeQuestion(q, resolved, { choices: [right] }).status).toBe('correct');
      expect(E.gradeQuestion(q, resolved, { choices: [wrong] }).status).toBe('wrong');
      // ripresa della prova: stesso seme, stesso ordine, stessa correzione
      const again = choiceOrder(choices, deriveSeed('scelte', s, q.index, q.ref.id)).map((i) => choices[i]!);
      expect(E.gradeQuestion(q, { answer: [], choices: again }, { choices: [right] }).earned).toBe(2);
    }
  });
});

describe('struttura della prova: voci con examTags', () => {
  const ex = (id: string, topic: string, extra: Partial<ExerciseData> = {}): ExerciseData => ({
    id,
    topic,
    objectives: [`${topic}.1`],
    difficulty: 1,
    kind: 'static',
    title: id,
    steps: [],
    answer: [{ label: 'x', value: 1 }],
    ...extra,
  });
  const tagged = [
    ex('kmap-1', 'beta', { examTags: ['karnaugh'] }),
    ex('kmap-2', 'beta', { examTags: ['karnaugh'] }),
    ex('asm-1', 'gamma', { examTags: ['assembly'], answer: [] }),
  ];
  const pool = { exercises: [...exercises, ...tagged], cards };
  const course: E.ExamCourse = {
    id: 'esempio',
    structure: [
      { label: 'Karnaugh', points: 3, kind: 'esercizio', tag: 'karnaugh' },
      { label: 'Esercizio', points: 3, kind: 'esercizio' },
      { label: 'Assembly', points: 3, kind: 'esercizio', tag: 'assembly' },
      { label: 'Schema', points: 3, kind: 'esercizio', tag: 'schema-da-completare' },
    ],
  };
  it('le voci con tag pescano solo esercizi con quel tag (anche di altra categoria)', () => {
    for (let s = 0; s < 40; s++) {
      const exam = E.assembleExam(course, pool, { mode: 'completa', seed: s });
      expect(['kmap-1', 'kmap-2']).toContain(exam.questions[0]!.ref.id);
      // l'unico esercizio «assembly» è aperto: conta il tag, non la categoria della voce
      expect(exam.questions[2]!.ref.id).toBe('asm-1');
      expect(exam.questions[2]!.category).toBe('open');
      expect(E.assembleExam(course, pool, { mode: 'completa', seed: s })).toEqual(exam);
    }
  });
  it('senza esercizi con il tag si ripiega sulla categoria', () => {
    for (let s = 0; s < 20; s++) {
      const exam = E.assembleExam(course, pool, { mode: 'completa', seed: s });
      expect(exam.questions).toHaveLength(4);
      expect(exam.questions[3]!.category).toBe('numeric');
    }
  });
  it('i tag rispettano il filtro per argomento (ripiego se esclusi)', () => {
    const exam = E.assembleExam(course, pool, { mode: 'completa', seed: 3, topics: ['alfa'] });
    expect(exam.questions.every((q) => q.topic === 'alfa')).toBe(true);
  });
});

describe('appelli passati', () => {
  const now = new Date(2026, 10, 22, 10).getTime(); // 22 novembre 2026
  const suggested = ['2027-01-20', '2026-10-29', '2026-11-03', '2026-11-22'];
  it('upcomingDates nasconde le date passate (oggi compreso) e ordina', () => {
    expect(upcomingDates(suggested, now)).toEqual(['2026-11-22', '2027-01-20']);
    expect(upcomingDates(['2026-10-29', '2026-11-03'], now)).toEqual([]);
  });
  it('examDateFor: personale se futura, poi il primo appello futuro, altrimenti nessuna', () => {
    expect(examDateFor('2027-02-01', suggested, now)).toBe('2027-02-01');
    // un appello scelto e ormai passato non vale più: si passa al successivo
    expect(examDateFor('2026-10-29', suggested, now)).toBe('2026-11-22');
    expect(examDateFor(undefined, ['2026-10-29', '2026-11-03'], now)).toBeNull();
    expect(examDateFor('2026-11-01', ['2026-10-29', '2026-11-03'], now)).toBeNull();
    expect(examDateFor('2026-12-15', ['2026-10-29', '2026-11-03'], now)).toBe('2026-12-15');
    expect(daysUntil(examDateFor(undefined, suggested, now)!, now)).toBe(0);
  });
});

describe('contenuti: alternative e voci della prova di Fondamenti di Informatica', () => {
  const dir = join(import.meta.dirname, '../../../src/content/exercises/fondamenti-informatica');
  const all = readdirSync(dir).flatMap(
    (f) =>
      parse(readFileSync(join(dir, f), 'utf8')) as Array<{
        id: string;
        examTags?: string[];
        choices?: Array<{ text: { it: string }; correct: boolean; fixedLast?: true }>;
      }>,
  );
  it('«Tutte le precedenti» di mcq-irq-07 resta in fondo ed è la risposta giusta', () => {
    const q = all.find((e) => e.id === 'mcq-irq-07')!;
    const last = q.choices!.length - 1;
    expect(q.choices![last]).toMatchObject({ correct: true, fixedLast: true });
    for (let s = 0; s < 30; s++) expect(choiceOrder(q.choices!, s).at(-1)).toBe(last);
  });
  it('ogni alternativa che rimanda alle altre è fissata in fondo', () => {
    const rel = /\b(precedent|sopra|above)/i;
    for (const e of all)
      for (const c of e.choices ?? []) if (rel.test(c.text.it)) expect(c.fixedLast, e.id).toBe(true);
  });
  it('le quattro voci della prova hanno esercizi dedicati', () => {
    const count = (tag: string) => all.filter((e) => e.examTags?.includes(tag)).length;
    expect(count('karnaugh')).toBeGreaterThan(0);
    expect(count('assembly')).toBeGreaterThan(0);
    expect(count('tabella-espressione')).toBeGreaterThan(1);
    expect(count('schema-da-completare')).toBeGreaterThan(1);
  });
});
