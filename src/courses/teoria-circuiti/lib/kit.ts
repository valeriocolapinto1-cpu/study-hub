/**
 * Conversione della netlist esatta dei generatori nella netlist del kit dei circuiti
 * (src/sim/circuits, docs/SIM.md): è il testo (oggetto validato da `Netlist`) che `<Circuit>` e
 * `renderSchematic` disegnano. Le frazioni compaiono come etichetta («1/3»), i valori come numeri.
 */
import type { Rational } from './rational';
import type { Circuit, Element } from './netlist';
import type { Instance } from './exercise';
import type { ElementInput, NetlistInput } from '../../../sim/circuits/netlist';

const num = (x: Rational) => x.toNumber();
const lbl = (x: Rational, unit: string) => (x.isInteger() ? undefined : `${x.toString()} ${unit}`);

export function kitElement(e: Element): ElementInput {
  switch (e.type) {
    case 'R':
    case 'C':
    case 'L': {
      const v = e.type === 'R' ? e.r : e.type === 'C' ? e.c : e.l;
      const label = lbl(v, e.type === 'R' ? 'Ω' : e.type === 'C' ? 'F' : 'H');
      return { type: e.type, id: e.id, a: e.a, b: e.b, value: num(v), ...(label ? { label } : {}) };
    }
    case 'V':
    case 'I': {
      const { dc, ac } = e.wave;
      const out: ElementInput & { dc?: number; ac?: { mag: number; phase: number } } = {
        type: e.type,
        id: e.id,
        a: e.a,
        b: e.b,
      };
      if (!dc.isZero()) out.dc = num(dc);
      if (!ac.isZero()) {
        const re = ac.re.toNumber();
        const im = ac.im.toNumber();
        out.ac = { mag: Math.hypot(re, im), phase: (Math.atan2(im, re) * 180) / Math.PI };
      }
      if (dc.isZero() && ac.isZero()) out.dc = 0;
      return out;
    }
    case 'G':
      return { type: 'G', id: e.id, a: e.a, b: e.b, cp: e.cp, cn: e.cn, gain: num(e.gm) };
    case 'T':
      return { type: 'T', id: e.id, p1a: e.p1a, p1b: e.p1b, p2a: e.p2a, p2b: e.p2b, n: num(e.n) };
    case 'N':
      return { type: 'N', id: e.id, na: e.na, nb: e.nb, ra: e.ra, rb: e.rb };
    case 'P':
      return {
        type: 'P',
        id: e.id,
        p1a: e.p1a,
        p1b: e.p1b,
        p2a: e.p2a,
        p2b: e.p2b,
        kind: e.kind,
        m: [
          [num(e.m[0]![0]!), num(e.m[0]![1]!)],
          [num(e.m[1]![0]!), num(e.m[1]![1]!)],
        ],
      };
  }
}

export function kitNetlist(
  circuit: Circuit,
  extra: { omega?: Rational | null; out?: [string, string]; outLabel?: string } = {},
): NetlistInput {
  const net: NetlistInput = { elements: circuit.elements.map(kitElement) };
  if (extra.omega) net.omega = num(extra.omega);
  if (extra.out)
    net.probes = [{ kind: 'v', plus: extra.out[0], minus: extra.out[1], label: extra.outLabel ?? 'v_{out}' }];
  return net;
}

export const instanceNetlist = (inst: Instance) =>
  kitNetlist(inst.circuit, { omega: inst.omega, out: inst.out });
