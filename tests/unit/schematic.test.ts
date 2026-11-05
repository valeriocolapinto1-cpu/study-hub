import { describe, expect, it } from 'vitest';
import { EXAMPLES } from '../../src/sim/circuits/examples';
import { Netlist } from '../../src/sim/circuits/netlist';
import { normalizeNetlist } from '../../src/sim/circuits/model';
import { describeCircuit, nameMarkup, plainText, renderSchematic } from '../../src/sim/circuits/schematic';

type P = [number, number];
type S = [P, P];
const onSeg = (p: P, s: S): boolean =>
  (s[0][0] === s[1][0] &&
    p[0] === s[0][0] &&
    p[1] >= Math.min(s[0][1], s[1][1]) &&
    p[1] <= Math.max(s[0][1], s[1][1])) ||
  (s[0][1] === s[1][1] &&
    p[1] === s[0][1] &&
    p[0] >= Math.min(s[0][0], s[1][0]) &&
    p[0] <= Math.max(s[0][0], s[1][0]));

/** Componenti connesse di morsetti + fili di un nodo. */
function components(terms: P[], wires: S[]): number {
  const items: Array<{ kind: 'p'; p: P } | { kind: 's'; s: S }> = [
    ...terms.map((p) => ({ kind: 'p' as const, p })),
    ...wires.map((s) => ({ kind: 's' as const, s })),
  ];
  const parent = items.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  const touch = (a: (typeof items)[number], b: (typeof items)[number]): boolean => {
    if (a.kind === 'p' && b.kind === 'p') return a.p[0] === b.p[0] && a.p[1] === b.p[1];
    if (a.kind === 'p' && b.kind === 's') return onSeg(a.p, b.s);
    if (a.kind === 's' && b.kind === 'p') return onSeg(b.p, a.s);
    const sa = (a as { s: S }).s;
    const sb = (b as { s: S }).s;
    return onSeg(sa[0], sb) || onSeg(sa[1], sb) || onSeg(sb[0], sa) || onSeg(sb[1], sa);
  };
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) if (touch(items[i]!, items[j]!)) parent[find(i)] = find(j);
  return new Set(items.map((_, i) => find(i))).size;
}

describe('schema SVG generato dalla netlist', () => {
  for (const [name, net] of Object.entries(EXAMPLES)) {
    it(`${name}: valido, completo, connesso e senza corti grafici`, () => {
      expect(Netlist.safeParse(net).success).toBe(true);
      const r = renderSchematic(net);
      const n = normalizeNetlist(net);
      // ogni elemento (tranne gli accoppiamenti) è disegnato
      for (const e of n.elements) if (e.type !== 'K') expect(r.geometry.drawn).toContain(e.id);
      for (const e of n.elements) if (e.type !== 'K') expect(r.svg).toContain(`data-id="${e.id}"`);
      // ogni nodo è un'unica componente connessa (la massa può usare simboli separati)
      for (const [node, terms] of r.geometry.terminals) {
        if (node === '0' && n.layout.ground === 'symbols') continue;
        expect(components(terms, r.geometry.wires.get(node) ?? []), `nodo ${node}`).toBe(1);
      }
      // nessun filo tocca morsetti o fili di altri nodi
      for (const [node, segs] of r.geometry.wires) {
        for (const [other, terms] of r.geometry.terminals) {
          if (other === node) continue;
          for (const p of terms)
            for (const s of segs) expect(onSeg(p, s), `filo di ${node} su morsetto di ${other}`).toBe(false);
        }
        for (const [other, segs2] of r.geometry.wires) {
          if (other <= node) continue;
          for (const a of segs)
            for (const b of segs2) {
              const touching = onSeg(a[0], b) || onSeg(a[1], b) || onSeg(b[0], a) || onSeg(b[1], a);
              expect(touching, `fili di ${node} e ${other} si toccano`).toBe(false);
            }
        }
      }
      // accessibilità
      expect(r.svg).toMatch(/role="img"/);
      expect(r.svg).toMatch(/<title id="[^"]+">/);
      expect(r.svg).toMatch(/<desc id="[^"]+">/);
      expect(r.svg).not.toMatch(/NaN|undefined|Infinity/);
      expect(r.width).toBeGreaterThan(50);
    });
  }

  it('descrizione testuale in italiano e in inglese', () => {
    const it = describeCircuit(EXAMPLES.partitore, 'it');
    expect(it).toContain('generatore di tensione V1 (12 V) tra nodo in (+) e massa (−)');
    expect(it).toContain('resistore R1 (2 kΩ) tra nodo in e nodo out');
    const en = describeCircuit(EXAMPLES.partitore, 'en');
    expect(en).toContain('resistor R2 (1 kΩ) between node out and ground');
  });

  it('pedici nei nomi', () => {
    expect(nameMarkup('R1')).toBe('R_{1}');
    expect(nameMarkup('Vin')).toBe('V_{in}');
    expect(plainText('v_{out}')).toBe('vout');
  });

  it('colori solo da currentColor e token (tema e stampa)', () => {
    const { svg } = renderSchematic(EXAMPLES.invertente);
    expect(svg).not.toMatch(/#[0-9a-f]{3,6}\b(?![^"]*\))/i);
    expect(svg).toContain('stroke="currentColor"');
  });

  it('layout manuale incompleto: errore esplicito', () => {
    expect(() =>
      renderSchematic({
        layout: { mode: 'manual' },
        elements: [
          { type: 'V', id: 'V1', a: 'a', b: '0', dc: 1, at: { x: 0, y: 0, dir: 'down' } },
          { type: 'R', id: 'R1', a: 'a', b: '0', value: 1 },
        ],
      }),
    ).toThrow(/R1/);
  });

  it('lo schema è deterministico', () => {
    expect(renderSchematic(EXAMPLES.scala).svg).toBe(renderSchematic(EXAMPLES.scala).svg);
  });
});
