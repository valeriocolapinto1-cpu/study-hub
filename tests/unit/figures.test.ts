// @vitest-environment jsdom
/**
 * Kit delle figure: ogni tipo ha esempi validi, SVG ben formato e accessibile,
 * uscita deterministica, nessun colore scritto a mano, parametri validati,
 * stessa uscita dal registro sincrono e da quello a caricamento dinamico.
 */
import { describe, expect, it } from 'vitest';
import { h } from 'preact';
import { renderToString } from 'preact-render-to-string';
import { EXAMPLES } from '../../src/figures/examples';
import { renderDiagram } from '../../src/figures/render';
import { renderDiagramAsync } from '../../src/figures/lazy';
import { DIAGRAM_SCHEMAS, DiagramSpecSchema, parseDiagram } from '../../src/figures/schemas';
import { DIAGRAM_TYPES } from '../../src/figures/types';
import { labelTspans } from '../../src/figures/core';
import { contours } from '../../src/figures/types/em';
import { carnotStates } from '../../src/figures/live/CarnotLive';
import RefractionLive from '../../src/figures/live/RefractionLive';
import InclinedPlaneLive from '../../src/figures/live/InclinedPlaneLive';
import { exerciseSchema } from '../../src/content/schemas';
import {
  clearGenerators,
  registerGenerator,
  runGenerator,
  validateGenerated,
} from '../../src/engine/generators/registry';

const parse = (svg: string): Document => new DOMParser().parseFromString(svg, 'image/svg+xml');

/** Valori di colore ammessi in attributi e stili: token, currentColor, none. */
const COLOR_RE = /(?:fill|stroke|color|stop-color)\s*[:=]\s*"?([^;"]+)/g;
const ALLOWED = /^(?:none|currentColor|var\(--[a-z0-9-]+(?:,\s*currentColor)?\))$/;

describe('catalogo degli esempi', () => {
  it('ogni tipo ha schema, disegnatore ed esempi', () => {
    for (const t of DIAGRAM_TYPES) {
      expect(DIAGRAM_SCHEMAS[t], t).toBeDefined();
      expect(
        EXAMPLES.some((e) => e.spec.type === t),
        `esempio per ${t}`,
      ).toBe(true);
    }
    expect(new Set(EXAMPLES.map((e) => e.id)).size).toBe(EXAMPLES.length);
  });

  for (const e of EXAMPLES) {
    describe(`${e.spec.type} — ${e.id}`, () => {
      it('parametri validi', () => {
        expect(() => parseDiagram(e.spec.type, e.spec.params)).not.toThrow();
        expect(DiagramSpecSchema.safeParse(e.spec).success).toBe(true);
      });

      for (const lang of ['it', 'en'] as const) {
        it(`SVG ben formato e accessibile (${lang})`, () => {
          const r = renderDiagram(e.spec.type, e.spec.params as never, { lang, idPrefix: 'x' });
          const doc = parse(r.svg);
          expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
          const svg = doc.documentElement;
          expect(svg.tagName).toBe('svg');
          expect(svg.getAttribute('role')).toBe('img');
          expect(svg.getAttribute('aria-labelledby')).toBe('x-t x-d');
          expect(svg.getAttribute('viewBox')).toMatch(/^0 0 [\d.]+ [\d.]+$/);
          expect(doc.getElementById('x-t')?.textContent?.length).toBeGreaterThan(3);
          expect(doc.getElementById('x-d')?.textContent?.length).toBeGreaterThan(20);
          expect(r.svg).not.toMatch(/NaN|Infinity|undefined/);
          expect(r.width).toBeGreaterThan(50);
          expect(r.height).toBeGreaterThan(50);
        });
      }

      it('descrizioni diverse per lingua', () => {
        const it_ = renderDiagram(e.spec.type, e.spec.params as never, { lang: 'it' });
        const en = renderDiagram(e.spec.type, e.spec.params as never, { lang: 'en' });
        expect(it_.description).not.toBe(en.description);
      });

      it('deterministico', () => {
        const a = renderDiagram(e.spec.type, e.spec.params as never, { lang: 'it' }).svg;
        const b = renderDiagram(e.spec.type, structuredClone(e.spec.params) as never, { lang: 'it' }).svg;
        expect(a).toBe(b);
      });

      it('nessun colore scritto a mano', () => {
        const { svg } = renderDiagram(e.spec.type, e.spec.params as never, { lang: 'it' });
        expect(svg).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
        for (const m of svg.matchAll(COLOR_RE)) expect(m[1]!.trim(), m[0]).toMatch(ALLOWED);
      });

      it('stessa uscita con il caricamento dinamico', async () => {
        const a = renderDiagram(e.spec.type, e.spec.params as never, { lang: 'en' }).svg;
        const b = (await renderDiagramAsync(e.spec.type, e.spec.params, { lang: 'en' })).svg;
        expect(b).toBe(a);
      });
    });
  }
});

describe('validazione dei parametri', () => {
  const bad: Array<[string, unknown]> = [
    ['inclined-plane', { angle: 90 }],
    ['inclined-plane', { angle: 30, extra: true }],
    ['free-body', { forces: [] }],
    ['projectile', { v0: 10, angle: 0 }],
    ['projectile', { v0: -1, angle: 30 }],
    ['pendulum', { angle: 95 }],
    ['function-plot', { x: { min: 2, max: 1 }, series: [{ kind: 'poly', coeffs: [1] }] }],
    ['function-plot', { x: { min: 0, max: 1 }, series: [{ kind: 'expr', f: 'x*x' }] }],
    [
      'pv-cycle',
      {
        states: [
          { id: 'A', p: 1, V: 1 },
          { id: 'B', p: 2, V: 2 },
        ],
        processes: [{ from: 'A', to: 'B', kind: 'isothermal' }],
      },
    ],
    [
      'pv-cycle',
      {
        states: [
          { id: 'A', p: 1, V: 1 },
          { id: 'B', p: 1, V: 2 },
        ],
        processes: [{ from: 'A', to: 'Z', kind: 'isobaric' }],
      },
    ],
    ['point-charges', { charges: [{ x: 0, y: 0, q: 0 }] }],
    ['vectors', { vectors: [{ dx: 1, dy: 1, from: 'nessuno' }] }],
    ['flowchart', { nodes: [{ id: 'a', kind: 'start', text: 'x' }], edges: [{ from: 'a', to: 'b' }] }],
    ['truth-table', { inputs: ['A', 'B'], outputs: [{ label: 'Y', values: [0, 1, 1] }] }],
    ['memory', { kind: 'heap', cells: [{ value: '1' }] }],
    ['magnetic-field', { source: 'helix' }],
  ];
  for (const [type, params] of bad)
    it(`${type} rifiuta ${JSON.stringify(params).slice(0, 60)}`, () => {
      expect(() => parseDiagram(type as never, params)).toThrow(/parametri non validi/);
    });

  it('tipo sconosciuto', () => {
    expect(() => parseDiagram('ologramma' as never, {})).toThrow(/sconosciuta/);
    expect(DiagramSpecSchema.safeParse({ type: 'ologramma', params: {} }).success).toBe(false);
  });

  it('l’errore indica il campo', () => {
    expect(() => parseDiagram('inclined-plane', { angle: 3 })).toThrow(/angle/);
  });

  it('isoterma e adiabatica coerenti sono accettate', () => {
    const s = carnotStates(2.5, 0.6);
    expect(() =>
      parseDiagram('pv-cycle', {
        states: s,
        processes: [
          { from: 'A', to: 'B', kind: 'isothermal' },
          { from: 'B', to: 'C', kind: 'adiabatic' },
          { from: 'C', to: 'D', kind: 'isothermal' },
          { from: 'D', to: 'A', kind: 'adiabatic' },
        ],
      }),
    ).not.toThrow();
  });
});

describe('fisica delle figure', () => {
  it('ciclo orario → lavoro positivo nella descrizione', () => {
    const e = EXAMPLES.find((x) => x.id === 'ciclo-rettangolare')!;
    const r = renderDiagram(e.spec.type, e.spec.params as never, { lang: 'it' });
    expect(r.description).toMatch(/orario: lavoro netto fatto dal gas positivo/);
    expect(r.description).toMatch(/800 kPa·L/); // (6 − 2) L × (300 − 100) kPa
  });
  it('proiettile: gittata e quota massima', () => {
    const r = renderDiagram('projectile', { v0: 20, angle: 45, g: 10 }, { lang: 'en' });
    expect(r.description).toContain('range 40 m');
    expect(r.description).toContain('maximum height 10 m');
  });
  it('leggi orarie: posizione e velocità finali', () => {
    const r = renderDiagram(
      'motion-graphs',
      {
        segments: [
          { duration: 2, a: 3 },
          { duration: 1, a: 0 },
        ],
      },
      { lang: 'it' },
    );
    expect(r.description).toContain('x = 12 m e v = 6 m/s');
  });
  it('onda stazionaria: nodi e ventri', () => {
    const r = renderDiagram('wave', { kind: 'standing', harmonic: 3 }, { lang: 'it' });
    expect(r.description).toContain('4 nodi (N) e 3 ventri');
    const t = renderDiagram(
      'wave',
      { kind: 'standing', harmonic: 2, boundary: 'fixed-free' },
      { lang: 'it' },
    );
    expect(t.description).toContain('2 nodi (N) e 2 ventri');
  });
  it('vettori: risultante', () => {
    const r = renderDiagram(
      'vectors',
      {
        vectors: [
          { id: 'a', dx: 1, dy: 2 },
          { id: 'b', dx: 3, dy: -1 },
        ],
        sum: { of: ['a', 'b'] },
      },
      { lang: 'it' },
    );
    expect(r.description).toContain('Risultante R = (4; 1)');
  });
  it('equipotenziali di una carica: circonferenze', () => {
    const lines = contours(
      (x, y) => 1 / Math.hypot(x, y),
      { xMin: -2, xMax: 2, yMin: -2, yMax: 2 },
      60,
      60,
      1,
    );
    expect(lines).toHaveLength(1);
    for (const [x, y] of lines[0]!) expect(Math.hypot(x, y)).toBeCloseTo(1, 1);
  });
  it('etichette con pedici e apici', () => {
    expect(labelTspans('F', 13)).toBe('F');
    expect(labelTspans('v_{0x}', 13)).toContain('<tspan dy="3.9" font-size="9">0x</tspan>');
    expect(labelTspans('x^2 + y', 13)).toMatch(
      /<tspan dy="-4.94" font-size="9">2<\/tspan><tspan dy="4.94"> \+ y<\/tspan>/,
    );
    expect(labelTspans('a<b', 13)).toBe('a&lt;b');
  });
});

describe('figure negli esercizi', () => {
  const base = {
    id: 'es',
    course: 'fisica-1',
    topic: 'dinamica',
    objectives: ['dinamica.1'],
    difficulty: 1,
    kind: 'static',
    statement: { it: 'Testo', en: 'Text' },
    steps: [{ title: { it: 'Passo', en: 'Step' }, body: { it: 'Conto', en: 'Sum' } }],
    answer: [{ label: { it: 'a', en: 'a' }, value: 1 }],
    origin: 'originale',
  };
  it('figure.diagram accettata e validata', () => {
    expect(
      exerciseSchema.safeParse({
        ...base,
        figure: { diagram: { type: 'inclined-plane', params: { angle: 30 } } },
      }).success,
    ).toBe(true);
    const r = exerciseSchema.safeParse({
      ...base,
      figure: { diagram: { type: 'inclined-plane', params: { angle: 99 } } },
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('angle');
  });
  it('una sola tra netlist, diagram e svg', () => {
    expect(
      exerciseSchema.safeParse({
        ...base,
        figure: { svg: '<svg/>', diagram: { type: 'pendulum', params: { angle: 10 } } },
      }).success,
    ).toBe(false);
    expect(exerciseSchema.safeParse({ ...base, figure: {} }).success).toBe(false);
  });
  it('generatore con figura del kit', () => {
    clearGenerators();
    registerGenerator({
      id: 'fisica-1/piano',
      topic: 'dinamica',
      objectives: ['dinamica.1'],
      generate: (seed) => ({
        statement: 'Blocco',
        steps: [],
        answer: [{ label: 'a', value: 1 + (seed % 3) }],
        figure: { diagram: { type: 'inclined-plane', params: { angle: 20 + (seed % 3) * 10 } } },
      }),
    });
    const g = runGenerator('fisica-1/piano', 4, 'it');
    expect(g.figure?.diagram?.type).toBe('inclined-plane');
    expect(() => parseDiagram(g.figure!.diagram!.type, g.figure!.diagram!.params)).not.toThrow();
    expect(
      validateGenerated({ ...g, figure: { diagram: { type: 'boh' as never, params: {} as never } } }),
    ).toContain('figura: tipo sconosciuto "boh"');
    expect(validateGenerated({ ...g, figure: { svg: '<svg/>', diagram: g.figure!.diagram! } })).toContain(
      'figura: una sola tra netlist, diagram e svg',
    );
    clearGenerators();
  });
});

describe('varianti interattive', () => {
  it('il piano inclinato si rende con figura, comandi e lettura', () => {
    const html = renderToString(h(InclinedPlaneLive, { lang: 'it' }));
    expect(html).toContain('role="img"');
    expect(html).toContain('type="range"');
    expect(html).toContain('a = g (sin θ − μ cos θ) = 3,21 m/s²');
  });
  it('la rifrazione dal vetro all’aria a 40° dà un raggio rifratto a 74,6°', () => {
    const html = renderToString(h(RefractionLive, { lang: 'it' }));
    expect(html).toContain('role="img"');
    expect(html.match(/type="range"/g)).toHaveLength(3);
    expect(html).toContain('θ₂ = 74,6°');
  });
});

describe('fisica delle figure di elettromagnetismo e ottica', () => {
  const d = (type: string, params: unknown, lang: 'it' | 'en' = 'it'): string =>
    renderDiagram(type as never, params as never, { lang }).description;
  it('forza di Lorentz: il verso di rotazione dipende da carica e campo', () => {
    expect(d('uniform-field', { field: 'B-in', object: 'particle' })).toContain('senso antiorario');
    expect(d('uniform-field', { field: 'B-in', object: 'particle', charge: 'negative' })).toContain(
      'senso orario',
    );
    expect(d('uniform-field', { field: 'B-out', object: 'particle', charge: 'negative' })).toContain(
      'senso antiorario',
    );
  });
  it('legge di Lenz: verso della corrente indotta', () => {
    expect(d('induction', { setup: 'sliding-bar' })).toContain('senso antiorario');
    expect(d('induction', { setup: 'sliding-bar', velocity: 'left' })).toContain('senso orario');
    expect(d('induction', { setup: 'loop-near-wire', motion: 'away' })).toContain('senso orario');
    expect(d('induction', { setup: 'loop-in-field', field: 'out', trend: 'decreasing' })).toContain(
      'senso antiorario',
    );
    expect(d('induction', { setup: 'rotating-rod' })).toContain('positivo sul perno');
  });
  it('rifrazione: legge di Snell e riflessione totale', () => {
    expect(d('refraction', { n1: 1, n2: 1.5, incidence: 30 })).toContain('19,5°');
    expect(d('refraction', { n1: 1.5, n2: 1, incidence: 50 })).toContain('angolo limite (41,8°)');
  });
  it('polarizzatori: legge di Malus', () => {
    expect(d('polarizers', { axes: [0, 45, 90] })).toContain('0,5·I0, 0,25·I0, 0,125·I0');
    expect(d('polarizers', { axes: [0, 90] })).toMatch(/0,5·I0, 0\./);
  });
  it('fili paralleli: correnti concordi si attraggono', () => {
    expect(d('magnetic-field', { source: 'wire-pair' })).toContain('si attraggono');
    expect(d('magnetic-field', { source: 'wire-pair', current2: 'negative' })).toContain('si respingono');
  });
  it('Gauss: campo nullo nella cavità e nel conduttore', () => {
    expect(d('charge-distribution', { shape: 'shell', gaussian: 0.3 })).toContain('il campo è nullo');
    expect(d('charge-distribution', { shape: 'sphere', conductor: true, gaussian: 0.5 })).toContain(
      'il campo è nullo',
    );
  });
});
