import { describe, expect, it } from 'vitest';
import { groupTopics } from '../../src/lib/courses';
import { formulaSchema } from '../../src/content/schemas';

describe('groupTopics', () => {
  const topics = [
    { id: 'a', group: { it: 'Uno', en: 'One' } },
    { id: 'b', group: { it: 'Uno', en: 'One' } },
    { id: 'c', group: { it: 'Due' } },
    { id: 'd' },
  ];
  it('raggruppa argomenti consecutivi con lo stesso gruppo, nella lingua richiesta', () => {
    const en = groupTopics(topics, 'en');
    expect(en.map((g) => [g.title, g.items.map((x) => x.id)])).toEqual([
      ['One', ['a', 'b']],
      ['Due', ['c']],
      [undefined, ['d']],
    ]);
    expect(groupTopics(topics, 'it')[0]!.title).toBe('Uno');
  });
});

describe('formulaSchema', () => {
  it('accetta simboli, uso ed errore tipico facoltativi', () => {
    const base = { id: 'ohm', course: 'x', topic: 'y', latex: 'v=Ri', label: { it: 'Ohm', en: 'Ohm' } };
    expect(formulaSchema.safeParse(base).success).toBe(true);
    const full = { ...base, symbols: { it: 'R [Ω]' }, usage: { it: 'Sempre' }, pitfall: { it: 'Segni' } };
    expect(formulaSchema.safeParse(full).success).toBe(true);
    expect(formulaSchema.safeParse({ ...base, uso: { it: 'x' } }).success).toBe(false);
  });
});
