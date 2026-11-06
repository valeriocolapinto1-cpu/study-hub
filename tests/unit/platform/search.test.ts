import { describe, expect, it } from 'vitest';
import { buildRecords, pageSearchType, pagefindFilter } from '../../../src/lib/search/records';

describe('classificazione delle pagine per la ricerca', () => {
  it('indicizza teoria e pagine, esclude interfacce e strumenti', () => {
    expect(pageSearchType('chi-sono')).toBe('pagina');
    expect(pageSearchType('')).toBe('pagina');
    for (const p of ['i-miei-dati', 'appunti', 'ripasso', 'stampa/prova', 'stile'])
      expect(pageSearchType(p)).toBeNull();
    expect(pageSearchType('anno-2/fisica-2', 'fisica-2')).toBe('pagina');
    expect(pageSearchType('anno-2/fisica-2/teoria/gauss', 'fisica-2')).toBe('teoria');
    expect(pageSearchType('anno-2/fisica-2/extra/simulatore', 'fisica-2')).toBe('pagina');
    for (const s of ['esercizi/gauss', 'formulario', 'ripasso', 'esame', 'progressi'])
      expect(pageSearchType(`anno-2/fisica-2/${s}`, 'fisica-2')).toBeNull();
    expect(pagefindFilter('corso', 'fisica-2')).toBe('corso:fisica-2');
  });

  it('crea un record per formula, esercizio e flashcard con l’ancora giusta', () => {
    const paths = {
      overview: '/b/en/anno-1/c/',
      exercises: '/b/en/anno-1/c/esercizi/',
      review: '/b/en/anno-1/c/ripasso/',
    };
    const recs = buildRecords({
      lang: 'en',
      courses: [{ id: 'c', paths }],
      formulas: [
        { id: 'ohm', course: 'c', latex: 'V = RI', label: { it: 'Legge di Ohm', en: "Ohm's law" } },
        { id: 'x', course: 'altro', latex: 'x', label: { it: 'x' } },
      ],
      exercises: [
        {
          id: 'e1',
          course: 'c',
          topic: 'res',
          statement: { it: 'Calcola $I$', en: 'Compute **I**' },
          steps: [{ title: { it: 'Passo' }, body: { it: 'Usa $V=RI$' } }],
        },
        { id: 'gen', course: 'c', topic: 'res', steps: [] },
      ],
      cards: [{ id: 'k1', course: 'c', front: { it: 'Definizione di resistenza' }, back: { it: 'R = V/I' } }],
    });
    expect(recs).toHaveLength(3);
    expect(recs[0]).toMatchObject({
      url: '/b/en/anno-1/c/formulario/#f-ohm',
      language: 'en',
      meta: { title: "Ohm's law" },
      filters: { tipo: ['formula'], corso: ['c'] },
    });
    expect(recs[0]!.content).toContain('V = RI');
    expect(recs[1]).toMatchObject({ url: '/b/en/anno-1/c/esercizi/res/#e1', meta: { title: 'Compute I' } });
    // Ripiego sull'italiano dove manca l'inglese.
    expect(recs[1]!.content).toContain('Passo: Usa V=RI');
    expect(recs[2]).toMatchObject({ url: '/b/en/anno-1/c/ripasso/#k1', filters: { tipo: ['flashcard'] } });
  });
});
