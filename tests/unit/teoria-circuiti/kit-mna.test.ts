/**
 * Verifica incrociata con il risolutore comune del kit (src/sim/circuits/mna.ts, virgola mobile):
 * le figure dei generatori sono netlist valide e il kit ritrova gli stessi valori del risolutore
 * esatto del corso (regime continuo, fasori, resistenza vista dalla memoria).
 */
import { describe, expect, it } from 'vitest';
import { parseNetlist } from '../../../src/sim/circuits/netlist';
import { ac, dc, thevenin } from '../../../src/sim/circuits/mna';
import { generateInstance } from '../../../src/courses/teoria-circuiti/lib/generate';
import { instanceNetlist, kitNetlist } from '../../../src/courses/teoria-circuiti/lib/kit';
import { renderSchematic } from '../../../src/sim/circuits/schematic';
import { listGenerators, runGenerator } from '../../../src/engine/generators/registry';
import '../../../src/courses/teoria-circuiti/generators/analisi';
import '../../../src/courses/teoria-circuiti/generators/applicate';

const SEEDS = Array.from({ length: 25 }, (_, i) => i * 6007 + 11);
const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 7);

describe('esercizio d’analisi contro il risolutore del kit', () => {
  for (const tpl of ['A', 'B', 'C'] as const)
    for (const level of [1, 2, 3] as const)
      it(`template ${tpl}, livello ${level}`, () => {
        for (const seed of SEEDS) {
          const { inst, sol } = generateInstance(tpl, level, seed);
          const net = parseNetlist(instanceNetlist(inst));
          const [o1, o2] = inst.out;
          close(dc(net).vd(o1, o2), sol.pre.dc.toNumber());
          if (sol.hasAc) {
            const ph = ac(net).vd(o1, o2);
            close(ph.re, sol.pre.cos.toNumber());
            close(-ph.im, sol.pre.sin.toNumber());
          }
          const mem = inst.circuit.elements.find((e) => e.id === inst.memory)!;
          if (mem.type !== 'C' && mem.type !== 'L') throw new Error('memoria');
          const rest = { elements: inst.circuit.elements.filter((e) => e.id !== mem.id) };
          const eq = thevenin(kitNetlist(rest), mem.a, mem.b, { dc: true });
          close(Number(typeof eq.zth === 'number' ? eq.zth : eq.zth.re), sol.req.toNumber());
        }
      }, 60_000);
});

describe('figure dei generatori', () => {
  it('ogni netlist è valida e si disegna', () => {
    for (const g of listGenerators('teoria-circuiti'))
      for (const seed of SEEDS.slice(0, 5)) {
        const ex = runGenerator(g.id, seed, 'it');
        if (!ex.figure?.netlist) continue;
        const svg = renderSchematic(ex.figure.netlist, { lang: 'it', idPrefix: 't' }).svg;
        expect(svg).toContain('<svg');
      }
  }, 60_000);
});
