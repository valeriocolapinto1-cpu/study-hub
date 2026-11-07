/**
 * Analisi nodale modificata ESATTA (Cx su razionali), con variabile di Laplace s generica:
 * continua s = 0, regime sinusoidale s = jω, transitorio s = valore con condizioni iniziali.
 */
import { Cx, type CxLike } from './complex';
import { solveLinear } from './linalg';
import { GND, nodesOf, validate, type Circuit, type Element } from './netlist';

export interface SolveOptions {
  s?: CxLike;
  /** Valore di un generatore indipendente (default: componente continua). */
  source?: (e: Element & { type: 'V' | 'I' }) => Cx;
  /** Usa v0 dei condensatori e i0 degli induttori (modello di Laplace con condizioni iniziali). */
  init?: boolean;
}
export interface Solution {
  v(n: string): Cx;
  vd(a: string, b: string): Cx;
  /** Corrente dell'elemento con verso a→b (per T e P-Z: [i1, i2] entranti nelle porte). */
  i(id: string): Cx | Cx[];
}

export function solve(circuit: Circuit, opts: SolveOptions = {}): Solution {
  validate(circuit);
  const s = Cx.from(opts.s ?? 0);
  const srcVal = opts.source ?? ((e) => Cx.from(e.wave.dc));
  const nodes = nodesOf(circuit).filter((n) => n !== GND);
  const idx = new Map(nodes.map((n, i) => [n, i]));
  let N = nodes.length;
  const cur = new Map<string, number | number[]>();
  for (const e of circuit.elements) {
    if (e.type === 'V' || e.type === 'L' || e.type === 'N') cur.set(e.id, N++);
    else if (e.type === 'T' || (e.type === 'P' && e.kind === 'Z')) cur.set(e.id, [N++, N++]);
  }
  const M: Cx[][] = Array.from({ length: N }, () => Array.from({ length: N }, () => Cx.ZERO));
  const rhs: Cx[] = new Array<Cx>(N).fill(Cx.ZERO);
  const ix = (n: string) => (n === GND ? -1 : idx.get(String(n))!);
  const add = (r: number, c: number, v: Cx) => {
    if (r >= 0 && c >= 0) M[r]![c] = M[r]![c]!.add(v);
  };
  const addr = (r: number, v: Cx) => {
    if (r >= 0) rhs[r] = rhs[r]!.add(v);
  };
  const one = Cx.ONE;
  const mone = Cx.ONE.neg();
  const branch = (a: string, b: string, col: number) => {
    add(ix(a), col, one);
    add(ix(b), col, mone);
  };
  const vrow = (row: number, a: string, b: string, k: Cx = one) => {
    add(row, ix(a), k);
    add(row, ix(b), k.neg());
  };
  const adm = (a: string, b: string, y: Cx) => {
    add(ix(a), ix(a), y);
    add(ix(a), ix(b), y.neg());
    add(ix(b), ix(a), y.neg());
    add(ix(b), ix(b), y);
  };
  for (const e of circuit.elements) {
    switch (e.type) {
      case 'R':
        adm(e.a, e.b, Cx.from(e.r).inv());
        break;
      case 'C':
        adm(e.a, e.b, s.mul(e.c));
        if (opts.init && e.v0) {
          const j = Cx.from(e.c).mul(e.v0);
          addr(ix(e.a), j);
          addr(ix(e.b), j.neg());
        }
        break;
      case 'L': {
        const c = cur.get(e.id) as number;
        branch(e.a, e.b, c);
        vrow(c, e.a, e.b);
        add(c, c, s.mul(e.l).neg());
        if (opts.init && e.i0) addr(c, Cx.from(e.l).mul(e.i0).neg());
        break;
      }
      case 'V': {
        const c = cur.get(e.id) as number;
        branch(e.a, e.b, c);
        vrow(c, e.a, e.b);
        addr(c, srcVal(e));
        break;
      }
      case 'I': {
        const v = srcVal(e);
        addr(ix(e.a), v.neg());
        addr(ix(e.b), v);
        break;
      }
      case 'G': {
        const g = Cx.from(e.gm);
        add(ix(e.a), ix(e.cp), g);
        add(ix(e.a), ix(e.cn), g.neg());
        add(ix(e.b), ix(e.cp), g.neg());
        add(ix(e.b), ix(e.cn), g);
        break;
      }
      case 'T': {
        const [c1, c2] = cur.get(e.id) as number[];
        const n = Cx.from(e.n);
        add(ix(e.p1a), c1!, one);
        add(ix(e.p1b), c1!, mone);
        add(ix(e.p2a), c2!, one);
        add(ix(e.p2b), c2!, mone);
        vrow(c1!, e.p1a, e.p1b);
        vrow(c1!, e.p2a, e.p2b, n.neg()); // v1 − n v2 = 0
        add(c2!, c1!, n);
        add(c2!, c2!, one); // n i1 + i2 = 0
        break;
      }
      case 'N': {
        const c = cur.get(e.id) as number;
        branch(e.ra, e.rb, c);
        vrow(c, e.na, e.nb);
        break;
      }
      case 'P': {
        const m = e.m.map((r) => r.map((x) => Cx.from(x)));
        const ports: [string, string][] = [
          [e.p1a, e.p1b],
          [e.p2a, e.p2b],
        ];
        if (e.kind === 'Y') {
          for (let row = 0; row < 2; row++)
            for (let col = 0; col < 2; col++) {
              const [pa, pb] = ports[row]!;
              const [qa, qb] = ports[col]!;
              const y = m[row]![col]!;
              add(ix(pa), ix(qa), y);
              add(ix(pa), ix(qb), y.neg());
              add(ix(pb), ix(qa), y.neg());
              add(ix(pb), ix(qb), y);
            }
        } else {
          const [c1, c2] = cur.get(e.id) as number[];
          add(ix(e.p1a), c1!, one);
          add(ix(e.p1b), c1!, mone);
          add(ix(e.p2a), c2!, one);
          add(ix(e.p2b), c2!, mone);
          vrow(c1!, e.p1a, e.p1b);
          add(c1!, c1!, m[0]![0]!.neg());
          add(c1!, c2!, m[0]![1]!.neg());
          vrow(c2!, e.p2a, e.p2b);
          add(c2!, c1!, m[1]![0]!.neg());
          add(c2!, c2!, m[1]![1]!.neg());
        }
        break;
      }
    }
  }
  const x = solveLinear(M, rhs);
  const v = (n: string) => (n === GND ? Cx.ZERO : x[idx.get(String(n))!]!);
  const result: Solution = {
    v,
    vd: (a, b) => v(a).sub(v(b)),
    i(id) {
      const e = circuit.elements.find((q) => q.id === id);
      if (!e) throw new Error('elemento ignoto ' + id);
      const c = cur.get(id);
      if (c !== undefined) return Array.isArray(c) ? c.map((k) => x[k]!) : x[c]!;
      if (e.type === 'R') return result.vd(e.a, e.b).div(e.r);
      if (e.type === 'C') {
        let i = result.vd(e.a, e.b).mul(s.mul(e.c));
        if (opts.init && e.v0) i = i.sub(Cx.from(e.c).mul(e.v0));
        return i;
      }
      if (e.type === 'I') return srcVal(e);
      if (e.type === 'G') return Cx.from(e.gm).mul(result.vd(e.cp, e.cn));
      throw new Error('corrente non disponibile per ' + id);
    },
  };
  return result;
}

/** Equivalente di Thevenin ai nodi (a, b), facoltativamente senza l'elemento `without`. */
export function thevenin(
  circuit: Circuit,
  a: string,
  b: string,
  {
    without = null as string | null,
    s = 0 as CxLike,
    source,
  }: Pick<SolveOptions, 'source'> & { without?: string | null; s?: CxLike } = {},
) {
  const c0: Circuit = { elements: circuit.elements.filter((e) => e.id !== without) };
  const full = solve(c0, { s, ...(source ? { source } : {}) });
  const vth = full.vd(a, b);
  const off: Circuit = {
    elements: [...c0.elements, { id: '_test', type: 'I', a: b, b: a, wave: { dc: Cx.ONE.re, ac: Cx.ZERO } }],
  };
  const t = solve(off, { s, source: (e) => (e.id === '_test' ? Cx.ONE : Cx.ZERO) });
  const zth = t.vd(a, b);
  return { vth, zth, isc: zth.isZero() ? null : vth.div(zth) };
}
