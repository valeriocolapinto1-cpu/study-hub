/**
 * Tipi «segnali e logica» del kit delle figure: valori calcolati (Bode), geometria
 * (Karnaugh), vincoli dei parametri. Validità, colori e accessibilità sono già
 * controllati per ogni esempio in figures.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { bodeAt } from '../../src/figures/types/signals';
import { kmapLayout } from '../../src/figures/types/structures';
import { DIAGRAM_SCHEMAS } from '../../src/figures/schemas';
import { renderDiagram } from '../../src/figures/render';

const ok = (t: keyof typeof DIAGRAM_SCHEMAS, p: unknown): boolean => DIAGRAM_SCHEMAS[t].safeParse(p).success;

describe('bode', () => {
  it('polo semplice: −3 dB e −45° alla pulsazione d’angolo, −20 dB/decade dopo', () => {
    const p = { poles: [{ w: 100 }] };
    expect(bodeAt(p, 100).db).toBeCloseTo(-3.0103, 3);
    expect(bodeAt(p, 100).deg).toBeCloseTo(-45, 6);
    expect(bodeAt(p, 1e5).db - bodeAt(p, 1e4).db).toBeCloseTo(-20, 1);
  });
  it('zero nell’origine e polo: passa-alto con fase +90° → 0°', () => {
    const p = { gain: 0.01, origin: 1, poles: [{ w: 100 }] };
    expect(bodeAt(p, 1e4).db).toBeCloseTo(0, 2);
    expect(bodeAt(p, 0.01).deg).toBeCloseTo(90, 1);
    expect(bodeAt(p, 100).deg).toBeCloseTo(45, 6);
  });
  it('coppia complessa: −90° e picco 1/(2ζ) a ω₀; guadagno negativo = 180°', () => {
    const p = { poles: [{ w: 10, zeta: 0.1 }] };
    expect(bodeAt(p, 10).deg).toBeCloseTo(-90, 6);
    expect(bodeAt(p, 10).db).toBeCloseTo(20 * Math.log10(5), 6);
    expect(bodeAt({ gain: -2, poles: [{ w: 1 }] }, 1e-4).deg).toBeCloseTo(180, 1);
  });
  it('parametri non validi', () => {
    expect(ok('bode', {})).toBe(false);
    expect(ok('bode', { poles: [{ w: 1, zeta: 1.2 }] })).toBe(false);
    expect(ok('bode', { poles: [{ w: 1 }], range: { min: 1, max: 5 } })).toBe(false);
  });
});

describe('karnaugh', () => {
  it('righe sulle prime variabili, colonne sulle ultime, in codice Gray', () => {
    expect(kmapLayout(3)).toEqual({ rows: [0, 1], cols: [0, 1, 3, 2], rv: 1, cv: 2 });
    expect(kmapLayout(4).rows).toEqual([0, 1, 3, 2]);
    expect(kmapLayout(2)).toEqual({ rows: [0, 1], cols: [0, 1], rv: 1, cv: 1 });
  });
  it('valori e gruppi controllati', () => {
    const base = { vars: ['A', 'B', 'C'], values: [0, 1, 1, 1, 0, 0, 1, 0] };
    expect(ok('karnaugh', base)).toBe(true);
    expect(ok('karnaugh', { ...base, values: [0, 1] })).toBe(false);
    expect(ok('karnaugh', { ...base, groups: [{ cells: [1, 3, 2] }] })).toBe(false);
    expect(ok('karnaugh', { ...base, groups: [{ cells: [9] }] })).toBe(false);
  });
  it('la descrizione elenca uni, indifferenze e gruppi', () => {
    const r = renderDiagram(
      'karnaugh',
      { vars: ['A', 'B'], values: [1, 'x', 1, 0], groups: [{ cells: [0, 2], label: "B'" }] },
      { lang: 'it' },
    );
    expect(r.description).toContain('Uno nei mintermini 0, 2');
    expect(r.description).toContain('indifferenze in 1');
    expect(r.description).toContain("B' {0, 2}");
  });
});

describe('vincoli degli altri tipi', () => {
  it('bitfield: campi dentro la parola', () => {
    expect(ok('bitfield', { bits: '1010', fields: [{ msb: 3, lsb: 2, label: 'op' }] })).toBe(true);
    expect(ok('bitfield', { bits: '1010', fields: [{ msb: 4, lsb: 2, label: 'op' }] })).toBe(false);
    expect(ok('bitfield', { bits: '1'.repeat(33) })).toBe(false);
    const r = renderDiagram(
      'bitfield',
      { bits: '1100 0101', fields: [{ msb: 7, lsb: 4, label: 'hi' }] },
      { lang: 'en' },
    );
    expect(r.description).toContain('hi bits 7–4 = 1100');
  });
  it('pipeline: inoltri dentro il diagramma', () => {
    const rows = [{ label: 'i1', start: 1, stages: ['F', 'D', 'E'] }];
    expect(ok('pipeline', { rows, forwards: [{ from: [0, 3], to: [0, 3] }] })).toBe(true);
    expect(ok('pipeline', { rows, forwards: [{ from: [1, 3], to: [0, 3] }] })).toBe(false);
  });
  it('graph: nodi esistenti, posizioni per tutti o per nessuno, niente autoanelli', () => {
    const nodes = [{ id: 'a' }, { id: 'b' }];
    expect(ok('graph', { nodes, edges: [{ from: 'a', to: 'b' }] })).toBe(true);
    expect(ok('graph', { nodes, edges: [{ from: 'a', to: 'c' }] })).toBe(false);
    expect(ok('graph', { nodes, edges: [{ from: 'a', to: 'a' }] })).toBe(false);
    expect(
      ok('graph', { nodes: [{ id: 'a', x: 1, y: 1 }, { id: 'b' }], edges: [{ from: 'a', to: 'b' }] }),
    ).toBe(false);
  });
  it('timing e pole-zero', () => {
    expect(ok('timing', { signals: [{ label: 'D', wave: '.01' }] })).toBe(false);
    expect(ok('timing', { signals: [{ label: 'D', wave: '0.1x' }] })).toBe(true);
    expect(ok('pole-zero', {})).toBe(false);
    const r = renderDiagram('pole-zero', { poles: [{ re: 1, im: 0 }], stableRegion: true }, { lang: 'it' });
    expect(r.description).toContain('Non tutti i poli');
  });
  it('function-plot: serie smorzata', () => {
    const r = renderDiagram(
      'function-plot',
      { x: { min: 0, max: 5 }, series: [{ kind: 'damped', amp: 1, alpha: 1, omega: 3 }] },
      { lang: 'it' },
    );
    expect(r.svg).not.toMatch(/NaN/);
    expect(r.description).toContain('oscillazione smorzata');
  });
});
