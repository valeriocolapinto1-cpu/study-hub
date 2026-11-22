/** SVG compatto del kit delle figure: tracciati semplificati, segmenti raggruppati, tratto ereditato. */
import { describe, expect, it } from 'vitest';
import { Svg, pathD, simplify, type Pt } from '../../src/figures/core';
import { EXAMPLES } from '../../src/figures/examples';
import { renderDiagram } from '../../src/figures/render';

describe('simplify', () => {
  it('toglie i punti allineati e tiene gli estremi', () => {
    const line: Pt[] = Array.from({ length: 200 }, (_, i) => [i, 150]);
    expect(simplify(line)).toEqual([
      [0, 150],
      [199, 150],
    ]);
    expect(pathD(line)).toBe('M0 150L199 150');
  });

  it('nessun punto tolto dista più di 0,1 dalla spezzata semplificata', () => {
    const arc: Pt[] = Array.from({ length: 400 }, (_, i) => {
      const a = (i / 399) * Math.PI;
      return [200 + 120 * Math.cos(a), 150 + 80 * Math.sin(a)];
    });
    const kept = simplify(arc);
    expect(kept.length).toBeLessThan(arc.length / 3);
    const dist = (p: Pt, a: Pt, b: Pt) => {
      const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
      return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
    };
    for (const p of arc) {
      const d = Math.min(...kept.slice(1).map((b, i) => dist(p, kept[i]!, b)));
      expect(d).toBeLessThanOrEqual(0.1 + 1e-9);
    }
  });

  it('linee chiuse (primo punto = ultimo) non collassano', () => {
    const circle: Pt[] = Array.from({ length: 101 }, (_, i) => {
      const a = (i / 100) * 2 * Math.PI;
      return [50 + 20 * Math.cos(a), 50 + 20 * Math.sin(a)];
    });
    expect(simplify(circle).length).toBeGreaterThan(8);
  });
});

describe('Svg', () => {
  it('segmenti consecutivi con lo stesso tratto in un solo path', () => {
    const s = new Svg(10, 10);
    s.line(0, 0, 1, 1).line(1, 0, 0, 1).line(2, 2, 3, 3, { tone: 'accent' }).line(5, 5, 6, 6);
    expect(s.body.match(/<path/g)).toHaveLength(3);
    expect(s.body).toContain('d="M0 0L1 1M1 0L0 1"');
  });

  it('con opacità i segmenti restano separati; il tratto predefinito non si ripete', () => {
    const s = new Svg(10, 10);
    s.line(0, 0, 1, 1, { opacity: 0.5 }).line(1, 0, 0, 1, { opacity: 0.5 });
    expect(s.body.match(/<path/g)).toHaveLength(2);
    expect(s.body).not.toMatch(/stroke-linecap|stroke-linejoin|stroke-width="1.5"/);
    const t = new Svg(10, 10).line(0, 0, 1, 1, { width: 2, cap: 'butt' }).body;
    expect(t).toContain('stroke-width="2"');
    expect(t).toContain('stroke-linecap="butt"');
  });

  it("l'svg porta il tratto predefinito (ereditato dagli elementi)", () => {
    const { spec } = EXAMPLES[0]!;
    const { svg } = renderDiagram(spec.type, spec.params as never, { lang: 'it' });
    expect(svg).toMatch(/^<svg [^>]*stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">/);
  });
});
