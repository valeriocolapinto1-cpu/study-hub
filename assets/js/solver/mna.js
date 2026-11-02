// Analisi nodale modificata esatta (Cx su razionali). Variabile di Laplace s generica:
//  - continua: s = 0;  - regime sinusoidale: s = jω;  - transitorio: s = valore, con condizioni iniziali.
import { Cx } from '../complex.js';
import { solveLinear } from './linalg.js';
import { GND, nodesOf, validate, HAS_CURRENT } from './netlist.js';

/**
 * opts.s: Cx variabile di Laplace (default 0)
 * opts.source: (elemento) => Cx valore del generatore indipendente (default: wave.dc)
 * opts.init: se true, usa v0 dei condensatori e i0 degli induttori (condizioni iniziali)
 */
export function solve(circuit, opts = {}) {
  validate(circuit);
  const s = Cx.from(opts.s ?? 0);
  const srcVal = opts.source || ((e) => Cx.from(e.wave.dc));
  const nodes = nodesOf(circuit).filter((n) => n !== GND);
  const idx = new Map(nodes.map((n, i) => [n, i]));
  let N = nodes.length;
  const cur = new Map(); // id -> indice (o array) delle incognite di corrente
  const take = (id, k = 1) => { const a = []; for (let i = 0; i < k; i++) a.push(N++); cur.set(id, k === 1 ? a[0] : a); };
  for (const e of circuit.elements) {
    if (['V', 'L', 'S', 'E', 'H', 'N'].includes(e.type)) take(e.id);
    else if (e.type === 'T' || (e.type === 'P' && e.kind === 'Z')) take(e.id, 2);
  }
  const M = Array.from({ length: N }, () => Array.from({ length: N }, () => Cx.ZERO));
  const rhs = new Array(N).fill(Cx.ZERO);
  const ix = (n) => (n === GND ? -1 : idx.get(String(n)));
  const add = (r, c, v) => { if (r >= 0 && c >= 0) M[r][c] = M[r][c].add(v); };
  const addr = (r, v) => { if (r >= 0) rhs[r] = rhs[r].add(v); };
  const one = Cx.ONE, mone = Cx.ONE.neg();
  // Corrente incognita `col` che attraversa a→b: esce da a, entra in b.
  const branch = (a, b, col) => { add(ix(a), col, one); add(ix(b), col, mone); };
  // Riga `row`: v(a) - v(b)
  const vrow = (row, a, b, k = one) => { add(row, ix(a), k); add(row, ix(b), k.neg()); };
  const adm = (a, b, y) => { add(ix(a), ix(a), y); add(ix(a), ix(b), y.neg()); add(ix(b), ix(a), y.neg()); add(ix(b), ix(b), y); };

  for (const e of circuit.elements) {
    switch (e.type) {
      case 'R': adm(e.a, e.b, Cx.from(e.r).inv()); break;
      case 'C': {
        adm(e.a, e.b, s.mul(e.c));
        if (opts.init && e.v0) { const j = Cx.from(e.c).mul(e.v0); addr(ix(e.a), j); addr(ix(e.b), j.neg()); }
        break;
      }
      case 'L': {
        const c = cur.get(e.id); branch(e.a, e.b, c); vrow(c, e.a, e.b); add(c, c, s.mul(e.l).neg());
        if (opts.init && e.i0) addr(c, Cx.from(e.l).mul(e.i0).neg());
        break;
      }
      case 'V': { const c = cur.get(e.id); branch(e.a, e.b, c); vrow(c, e.a, e.b); addr(c, srcVal(e)); break; }
      case 'I': { const v = srcVal(e); addr(ix(e.a), v.neg()); addr(ix(e.b), v); break; }
      case 'S': { const c = cur.get(e.id); branch(e.a, e.b, c); vrow(c, e.a, e.b); break; }
      case 'E': { const c = cur.get(e.id); branch(e.a, e.b, c); vrow(c, e.a, e.b); vrow(c, e.cp, e.cn, Cx.from(e.mu).neg()); break; }
      case 'G': { const g = Cx.from(e.gm); add(ix(e.a), ix(e.cp), g); add(ix(e.a), ix(e.cn), g.neg()); add(ix(e.b), ix(e.cp), g.neg()); add(ix(e.b), ix(e.cn), g); break; }
      case 'H': {
        const c = cur.get(e.id); branch(e.a, e.b, c); vrow(c, e.a, e.b);
        const k = cur.get(e.ctrl); if (k === undefined) throw new Error(e.id + ': il controllo ' + e.ctrl + ' non ha una corrente incognita');
        add(c, k, Cx.from(e.rm).neg()); break;
      }
      case 'F': {
        const k = cur.get(e.ctrl); if (k === undefined) throw new Error(e.id + ': il controllo ' + e.ctrl + ' non ha una corrente incognita');
        const b = Cx.from(e.beta); add(ix(e.a), k, b); add(ix(e.b), k, b.neg()); break;
      }
      case 'T': {
        const [c1, c2] = cur.get(e.id); const n = Cx.from(e.n);
        add(ix(e.p1a), c1, one); add(ix(e.p1b), c1, mone); add(ix(e.p2a), c2, one); add(ix(e.p2b), c2, mone);
        vrow(c1, e.p1a, e.p1b); vrow(c1, e.p2a, e.p2b, n.neg()); // v1 - n v2 = 0
        add(c2, c1, n); add(c2, c2, one); // n i1 + i2 = 0
        break;
      }
      case 'N': { const c = cur.get(e.id); branch(e.ra, e.rb, c); vrow(c, e.na, e.nb); break; }
      case 'P': {
        const m = e.m.map((r) => r.map((x) => Cx.from(x)));
        if (e.kind === 'Y') {
          for (const [row, pa, pb] of [[0, e.p1a, e.p1b], [1, e.p2a, e.p2b]]) {
            for (const [col, qa, qb] of [[0, e.p1a, e.p1b], [1, e.p2a, e.p2b]]) {
              const y = m[row][col];
              add(ix(pa), ix(qa), y); add(ix(pa), ix(qb), y.neg()); add(ix(pb), ix(qa), y.neg()); add(ix(pb), ix(qb), y);
            }
          }
        } else {
          const [c1, c2] = cur.get(e.id);
          add(ix(e.p1a), c1, one); add(ix(e.p1b), c1, mone); add(ix(e.p2a), c2, one); add(ix(e.p2b), c2, mone);
          vrow(c1, e.p1a, e.p1b); add(c1, c1, m[0][0].neg()); add(c1, c2, m[0][1].neg());
          vrow(c2, e.p2a, e.p2b); add(c2, c1, m[1][0].neg()); add(c2, c2, m[1][1].neg());
        }
        break;
      }
      default: throw new Error('tipo non gestito: ' + e.type);
    }
  }
  const x = solveLinear(M, rhs, Cx.ZERO);
  const v = (n) => (n === GND ? Cx.ZERO : x[idx.get(String(n))]);
  const result = {
    v,
    vd: (a, b) => v(a).sub(v(b)),
    /** Corrente dell'elemento con verso a→b (o, per T/P-Z, [i1,i2] entranti nelle porte; per N, corrente del noratore). */
    i(id) {
      const e = circuit.elements.find((q) => q.id === id);
      if (!e) throw new Error('elemento ignoto ' + id);
      if (cur.has(id)) { const c = cur.get(id); return Array.isArray(c) ? c.map((k) => x[k]) : x[c]; }
      if (e.type === 'R') return result.vd(e.a, e.b).div(e.r);
      if (e.type === 'C') { const y = s.mul(e.c); let i = result.vd(e.a, e.b).mul(y); if (opts.init && e.v0) i = i.sub(Cx.from(e.c).mul(e.v0)); return i; }
      if (e.type === 'I') return srcVal(e);
      if (e.type === 'G') return Cx.from(e.gm).mul(result.vd(e.cp, e.cn));
      if (e.type === 'F') return Cx.from(e.beta).mul(result.i(e.ctrl));
      if (e.type === 'P' && e.kind === 'Y') {
        const v1 = result.vd(e.p1a, e.p1b), v2 = result.vd(e.p2a, e.p2b), m = e.m.map((r) => r.map((q) => Cx.from(q)));
        return [m[0][0].mul(v1).add(m[0][1].mul(v2)), m[1][0].mul(v1).add(m[1][1].mul(v2))];
      }
      throw new Error('corrente non disponibile per ' + id);
    },
  };
  return result;
}
export { HAS_CURRENT };
