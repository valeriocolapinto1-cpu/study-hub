import { describe, expect, it } from 'vitest';
import { h } from 'preact';
import { renderToString } from 'preact-render-to-string';
import { extent, logTicks, makeScale, niceStep, niceTicks } from '../../src/sim/scale';
import {
  pointSourcesField,
  pointSourcesPotential,
  seedsAround,
  streamline,
  wiresMagneticField,
} from '../../src/sim/field';
import { findTrigger } from '../../src/sim/Scope';
import { Plot } from '../../src/sim/Plot';
import { PhasorPlane } from '../../src/sim/PhasorPlane';
import { plain, splitSub } from '../../src/sim/RichText';

describe('scale e tacche', () => {
  it('scala lineare e inversa', () => {
    const s = makeScale('lin', [0, 10], [0, 100]);
    expect(s(5)).toBe(50);
    expect(s.invert(25)).toBe(2.5);
  });
  it('scala logaritmica', () => {
    const s = makeScale('log', [1, 1000], [0, 300]);
    expect(s(10)).toBeCloseTo(100);
    expect(s.invert(200)).toBeCloseTo(100);
    expect(() => makeScale('log', [0, 10], [0, 1])).toThrow();
  });
  it('passi e tacche "belle"', () => {
    expect(niceStep(10, 5)).toBe(2);
    expect(niceStep(0.37, 4)).toBe(0.1);
    expect(niceTicks(0, 1, 5)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    expect(niceTicks(-1.3, 1.3, 4)).toEqual([-1, -0.5, 0, 0.5, 1]);
    expect(logTicks(10, 1e6)).toEqual([10, 30, 100, 300, 1000, 3000, 1e4, 3e4, 1e5, 3e5, 1e6]);
    expect(logTicks(1, 100)).toEqual([1, 2, 5, 10, 20, 50, 100]);
  });
  it('estremi', () => {
    expect(extent([3, 1, 2])).toEqual([1, 3]);
    expect(extent([2, 2])).toEqual([1, 3]);
    expect(extent([NaN])).toEqual([0, 1]);
  });
});

describe('campi vettoriali', () => {
  it('campo di una carica: radiale, ∝ 1/r²', () => {
    const E = pointSourcesField([{ x: 0, y: 0, q: 1 }], 1, 2, 0);
    const [ex, ey] = E(2, 0);
    expect(ex).toBeCloseTo(0.25);
    expect(ey).toBeCloseTo(0);
    const V = pointSourcesPotential([{ x: 0, y: 0, q: 1 }], 1, 2, 0);
    expect(V(2, 0)).toBeCloseTo(0.5);
  });
  it('filo: B tangente (regola della mano destra)', () => {
    const B = wiresMagneticField([{ x: 0, y: 0, q: 1 }], 1, 0);
    const [bx, by] = B(1, 0);
    expect(bx).toBeCloseTo(0);
    expect(by).toBeGreaterThan(0);
  });
  it('linea di campo di un dipolo: dalla carica positiva alla negativa', () => {
    const src = [
      { x: -1, y: 0, q: 1 },
      { x: 1, y: 0, q: -1 },
    ];
    const E = pointSourcesField(src);
    const line = streamline(E, [-0.95, 0.05], {
      bounds: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
      step: 0.01,
      maxSteps: 5000,
      sinks: [{ x: 1, y: 0, r: 0.05 }],
    });
    const end = line[line.length - 1]!;
    expect(Math.hypot(end[0] - 1, end[1])).toBeLessThan(0.06);
    expect(seedsAround(src, 8)).toHaveLength(16);
  });
});

describe('oscilloscopio', () => {
  it('trigger sul fronte di salita del coseno', () => {
    const t = findTrigger((x) => Math.cos(2 * Math.PI * x), 0, 2, 0, 'rising')!;
    expect(t).toBeCloseTo(0.75, 3);
    const f = findTrigger((x) => Math.cos(2 * Math.PI * x), 0, 2, 0, 'falling')!;
    expect(f).toBeCloseTo(0.25, 3);
    expect(findTrigger(() => 0, 0, 1, 5, 'rising')).toBeUndefined();
  });
});

describe('componenti (render statico, zero JS)', () => {
  it('Plot: SVG con titolo, assi e tabella dei dati', () => {
    const x = [0, 1, 2, 3];
    const html = renderToString(
      h(Plot, { lang: 'it', title: 'Prova', xLabel: 't', series: [{ label: 'v_C', x, y: [0, 1, 4, 9] }] }),
    );
    expect(html).toContain('<title');
    expect(html).toContain('Prova');
    expect(html).toContain('<table');
    expect(html).toContain('<sub>C</sub>');
    expect(html).toContain('Mostra i dati in tabella');
    expect(html).not.toMatch(/NaN/);
  });
  it('Plot log e Bode non producono NaN', () => {
    const x = [1, 10, 100, 1000];
    const html = renderToString(
      h(Plot, { lang: 'en', title: 'Log', xScale: 'log', series: [{ label: 'H', x, y: [0, -3, -20, -40] }] }),
    );
    expect(html).not.toMatch(/NaN|Infinity/);
    expect(html).toContain('Show data as a table');
  });
  it('PhasorPlane: descrizione testuale con modulo e fase', () => {
    const html = renderToString(
      h(PhasorPlane, { lang: 'it', title: 'Fasori', unit: 'V', phasors: [{ label: 'V_R', re: 0, im: 2 }] }),
    );
    expect(html).toContain('VR = 2 V ∠ 90°');
  });
  it('pedici nelle etichette', () => {
    expect(splitSub('v_{out}(t)')).toEqual([
      { t: 'v', sub: false },
      { t: 'out', sub: true },
      { t: '(t)', sub: false },
    ]);
    expect(plain('i_L')).toBe('iL');
  });
});
