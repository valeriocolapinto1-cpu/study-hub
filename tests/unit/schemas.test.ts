import { describe, expect, it } from 'vitest';
import { courseSchema, exerciseSchema, topicSchema } from '../../src/content/schemas';

const ex = {
  id: 'es-1',
  course: 'esempio',
  topic: 'resistori',
  objectives: ['resistori.1'],
  difficulty: 1,
  kind: 'static',
  statement: { it: 'Testo', en: 'Text' },
  steps: [{ title: { it: 'Passo' }, body: { it: 'Corpo' } }],
  origin: 'originale',
};

describe('schemi dei contenuti', () => {
  it('accetta un esercizio statico valido', () => {
    expect(exerciseSchema.safeParse(ex).success).toBe(true);
  });

  it('rifiuta esercizi incoerenti', () => {
    expect(exerciseSchema.safeParse({ ...ex, steps: [] }).success).toBe(false);
    expect(exerciseSchema.safeParse({ ...ex, kind: 'generated' }).success).toBe(false);
    expect(exerciseSchema.safeParse({ ...ex, kind: 'generated', generator: 'altro/x' }).success).toBe(false);
    expect(exerciseSchema.safeParse({ ...ex, difficulty: 4 }).success).toBe(false);
    expect(exerciseSchema.safeParse({ ...ex, id: 'Es_1' }).success).toBe(false);
    expect(exerciseSchema.safeParse({ ...ex, extra: 1 }).success).toBe(false);
    expect(
      exerciseSchema.safeParse({
        ...ex,
        choices: [
          { text: { it: 'a' }, correct: false },
          { text: { it: 'b' }, correct: false },
        ],
      }).success,
    ).toBe(false);
  });

  it('richiede obiettivi con prefisso dell’argomento', () => {
    const topic = {
      id: 'resistori',
      course: 'esempio',
      order: 1,
      title: { it: 'R' },
      summary: { it: 'S' },
      objectives: [{ id: 'condensatori.1', text: { it: 'x' } }],
    };
    expect(topicSchema.safeParse(topic).success).toBe(false);
  });

  it('valida date d’esame e formato del corso', () => {
    const course = {
      id: 'esempio',
      year: 1,
      title: { it: 'C' },
      description: { it: 'D' },
      accent: 'blu',
      exam: { format: 'scritto' },
      legacyRepo: 'r',
      order: 1,
    };
    expect(courseSchema.safeParse(course).success).toBe(true);
    expect(courseSchema.safeParse({ ...course, examDates: ['20/01/2027'] }).success).toBe(false);
    expect(courseSchema.safeParse({ ...course, exam: { format: 'pratico' } }).success).toBe(false);
  });
});
