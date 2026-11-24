import { describe, expect, it } from 'vitest';
import { chapterOfFormula, chapterSlug, formularyChapters } from '../../src/lib/formulary';

describe('chapterSlug', () => {
  it('minuscole senza accenti, parole intere fino a 60 caratteri', () => {
    expect(chapterSlug('Elettrostatica nel vuoto, conduttori, dielettrici')).toBe(
      'elettrostatica-nel-vuoto-conduttori-dielettrici',
    );
    expect(chapterSlug('I · Costanti concentrate')).toBe('i-costanti-concentrate');
    expect(chapterSlug('Funzioni di rete e stabilità')).toBe('funzioni-di-rete-e-stabilita');
    const long = chapterSlug('parola '.repeat(20));
    expect(long.length).toBeLessThanOrEqual(60);
    expect(long.endsWith('parola')).toBe(true);
  });
});

describe('formularyChapters', () => {
  const g1 = { it: 'Uno', en: 'One' };
  const g2 = { it: 'Due due' };
  const topics = [
    { id: 'c', order: 3, group: g2 },
    { id: 'a', order: 1, group: g1 },
    { id: 'b', order: 2, group: g1 },
    { id: 'd', order: 4, group: { it: 'Vuoto' } },
    { id: 'e', order: 5 },
  ];
  const formulas = [
    { id: 'f1', topic: 'a' },
    { id: 'f2', topic: 'c' },
    { id: 'f3', topic: 'c' },
    { id: 'f4', topic: 'e' },
  ];
  it('un capitolo per gruppo di argomenti, nell’ordine; argomenti e capitoli senza formule esclusi', () => {
    const ch = formularyChapters(topics, formulas);
    expect(ch.map((c) => [c.slug, c.count, c.items.map((x) => x.topic.id)])).toEqual([
      ['uno', 1, ['a']],
      ['due-due', 2, ['c']],
      // senza gruppo: slug dall'id del primo argomento
      ['e', 1, ['e']],
    ]);
    expect(chapterOfFormula(ch).get('f3')).toBe('due-due');
  });
  it('slug unici e mai «stampa» (pagina del formulario completo)', () => {
    const ch = formularyChapters(
      [
        { id: 'a', order: 1, group: { it: 'Stampa' } },
        { id: 'b', order: 2, group: { it: 'Uno' } },
        { id: 'c', order: 3, group: { it: 'Altro' } },
        { id: 'd', order: 4, group: { it: 'Uno' } },
      ],
      ['a', 'b', 'c', 'd'].map((t) => ({ id: `f-${t}`, topic: t })),
    );
    expect(ch.map((c) => c.slug)).toEqual(['stampa-2', 'uno', 'altro', 'uno-2']);
  });
});
