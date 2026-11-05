// Simulatore INDIPENDENTE di verifica: integrazione numerica nel tempo in virgola mobile (trapezi),
// con una propria costruzione delle matrici. Parte da stato nullo molto prima di t=0 con i generatori accesi,
// li spegne a t=0 e confronta con la soluzione esatta. Usato nei test e nel controllo a runtime.
import { GND, nodesOf } from './netlist.js';
import { evalSolution } from './exercise.js';

function luFactor(A) {
  const n = A.length, M = A.map((r) => r.slice()), perm = Array.from({ length: n }, (_, i) => i);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-14) throw new Error('matrice singolare nel simulatore');
    if (p !== c) { [M[p], M[c]] = [M[c], M[p]]; [perm[p], perm[c]] = [perm[c], perm[p]]; }
    for (let r = c + 1; r < n; r++) { const f = (M[r][c] /= M[c][c]); for (let k = c + 1; k < n; k++) M[r][k] -= f * M[c][k]; }
  }
  return { M, perm, n };
}
function luSolve({ M, perm, n }, b) {
  const y = new Array(n);
  for (let i = 0; i < n; i++) { let s = b[perm[i]]; for (let k = 0; k < i; k++) s -= M[i][k] * y[k]; y[i] = s; }
  for (let i = n - 1; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < n; k++) s -= M[i][k] * y[k]; y[i] = s / M[i][i]; }
  return y;
}
const num = (x) => (x && typeof x.toNumber === 'function' ? x.toNumber() : Number(x));

class Sim {
  constructor(circuit, dt, mode) {
    this.c = circuit; this.dt = dt; this.mode = mode;
    const nodes = nodesOf(circuit).filter((n) => n !== GND);
    this.idx = new Map(nodes.map((n, i) => [n, i]));
    this.N = nodes.length;
    this.cur = new Map();
    for (const e of circuit.elements) {
      if (['V', 'L', 'S', 'E', 'H', 'N'].includes(e.type)) this.cur.set(e.id, [this.N++]);
      else if (e.type === 'T' || (e.type === 'P' && e.kind === 'Z')) this.cur.set(e.id, [this.N++, this.N++]);
    }
    this.build();
  }
  n(x) { return x === GND ? -1 : this.idx.get(String(x)); }
  build() {
    const { c, dt, mode } = this, N = this.N;
    const A = Array.from({ length: N }, () => new Array(N).fill(0));
    const put = (r, k, v) => { if (r >= 0 && k >= 0) A[r][k] += v; };
    this.dyn = [];
    const kirch = (a, b, col) => { put(this.n(a), col, 1); put(this.n(b), col, -1); };
    const vr = (row, a, b, k = 1) => { put(row, this.n(a), k); put(row, this.n(b), -k); };
    for (const e of c.elements) {
      const ci = this.cur.get(e.id);
      switch (e.type) {
        case 'R': { const g = 1 / num(e.r); vr(this.n(e.a), e.a, e.b, g); vr(this.n(e.b), e.a, e.b, -g); break; }
        case 'C': { const g = (mode === 'be' ? 1 : 2) * num(e.c) / dt; vr(this.n(e.a), e.a, e.b, g); vr(this.n(e.b), e.a, e.b, -g); this.dyn.push({ e, g, v: 0, i: 0 }); break; }
        case 'L': { const r = (mode === 'be' ? 1 : 2) * num(e.l) / dt; kirch(e.a, e.b, ci[0]); vr(ci[0], e.a, e.b); put(ci[0], ci[0], -r); this.dyn.push({ e, r, i: 0, v: 0 }); break; }
        case 'V': case 'S': kirch(e.a, e.b, ci[0]); vr(ci[0], e.a, e.b); break;
        case 'E': kirch(e.a, e.b, ci[0]); vr(ci[0], e.a, e.b); vr(ci[0], e.cp, e.cn, -num(e.mu)); break;
        case 'G': { const g = num(e.gm); put(this.n(e.a), this.n(e.cp), g); put(this.n(e.a), this.n(e.cn), -g); put(this.n(e.b), this.n(e.cp), -g); put(this.n(e.b), this.n(e.cn), g); break; }
        case 'H': kirch(e.a, e.b, ci[0]); vr(ci[0], e.a, e.b); put(ci[0], this.cur.get(e.ctrl)[0], -num(e.rm)); break;
        case 'F': { const k = this.cur.get(e.ctrl)[0], b = num(e.beta); put(this.n(e.a), k, b); put(this.n(e.b), k, -b); break; }
        case 'T': {
          const [i1, i2] = ci, n = num(e.n);
          kirch(e.p1a, e.p1b, i1); kirch(e.p2a, e.p2b, i2);
          vr(i1, e.p1a, e.p1b); vr(i1, e.p2a, e.p2b, -n); put(i2, i1, n); put(i2, i2, 1); break;
        }
        case 'N': kirch(e.ra, e.rb, ci[0]); vr(ci[0], e.na, e.nb); break;
        case 'P': {
          const m = e.m.map((r) => r.map(num));
          if (e.kind === 'Y') {
            const ports = [[e.p1a, e.p1b], [e.p2a, e.p2b]];
            for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) {
              const [pa, pb] = ports[r], [qa, qb] = ports[k];
              put(this.n(pa), this.n(qa), m[r][k]); put(this.n(pa), this.n(qb), -m[r][k]); put(this.n(pb), this.n(qa), -m[r][k]); put(this.n(pb), this.n(qb), m[r][k]);
            }
          } else {
            const [i1, i2] = ci; kirch(e.p1a, e.p1b, i1); kirch(e.p2a, e.p2b, i2);
            vr(i1, e.p1a, e.p1b); put(i1, i1, -m[0][0]); put(i1, i2, -m[0][1]);
            vr(i2, e.p2a, e.p2b); put(i2, i1, -m[1][0]); put(i2, i2, -m[1][1]);
          }
          break;
        }
        default: break; // I: solo termine noto
      }
    }
    this.lu = luFactor(A);
  }
  /** Un passo: `val(e)` = valore del generatore indipendente a fine passo. Restituisce il vettore soluzione. */
  step(val) {
    const b = new Array(this.N).fill(0), { dt, mode } = this;
    for (const e of this.c.elements) {
      if (e.type === 'V') b[this.cur.get(e.id)[0]] += val(e);
      else if (e.type === 'I') { const v = val(e); const a = this.n(e.a), bb = this.n(e.b); if (a >= 0) b[a] -= v; if (bb >= 0) b[bb] += v; }
    }
    for (const d of this.dyn) {
      if (d.e.type === 'C') {
        const hist = mode === 'be' ? d.g * d.v : d.g * d.v + d.i; // i_{n+1} = g v_{n+1} - hist
        const a = this.n(d.e.a), bb = this.n(d.e.b);
        if (a >= 0) b[a] += hist; if (bb >= 0) b[bb] -= hist;
        d.hist = hist;
      } else {
        const k = this.cur.get(d.e.id)[0];
        b[k] += -(mode === 'be' ? d.r * d.i : d.r * d.i + d.v);
      }
    }
    const x = luSolve(this.lu, b);
    const vv = (nn) => (nn === GND ? 0 : x[this.idx.get(String(nn))]);
    for (const d of this.dyn) {
      const vab = vv(d.e.a) - vv(d.e.b);
      if (d.e.type === 'C') { d.i = d.g * vab - d.hist; d.v = vab; } else { d.i = x[this.cur.get(d.e.id)[0]]; d.v = vab; }
    }
    this.x = x; this.vv = vv;
    return x;
  }
}

/** Confronto soluzione esatta / simulazione. Restituisce {ok, maxErr, scale, samples}. */
export function crossCheck(inst, sol, { tol = 2e-3 } = {}) {
  const tau = sol.tau.toNumber();
  const w = sol.omega ? sol.omega.toNumber() : 0;
  const period = w ? (2 * Math.PI) / w : Infinity;
  const dt = Math.min(tau / 120, period / 240);
  const nPre = Math.ceil((30 * tau) / dt);
  const waveAt = (e, t, on) => {
    if (!on) return 0;
    const ac = e.wave.ac;
    return e.wave.dc.toNumber() + (w ? ac.re.toNumber() * Math.cos(w * t) - ac.im.toNumber() * Math.sin(w * t) : 0);
  };
  const out = inst.out;
  const sample = [];
  // fase 1: sorgenti accese, da t=-nPre*dt a 0 (passi trapezoidali)
  const trap = new Sim(inst.circuit, dt, 'trap');
  const tEnd = Math.ceil((5 * tau) / dt);
  const preSamples = new Map();
  const wantPre = new Set([0, 1, 2, Math.round(period / (4 * dt)) || 1, Math.round(period / (2 * dt)) || 3, 37].filter((k) => Number.isFinite(k) && k >= 0 && k <= nPre));
  let t = -nPre * dt;
  let seenT0 = 0;
  for (let k = 0; k < nPre; k++) {
    t += dt;
    trap.step((e) => waveAt(e, t, true));
    const kk = nPre - 1 - k; // passi mancanti a t=0 (kk=0 -> t=0 - ... ) 
    if (wantPre.has(kk)) preSamples.set(t, trap.vv(out[0]) - trap.vv(out[1]));
    seenT0 = t;
  }
  // fase 2: sorgenti spente. Primo passo di Eulero all'indietro (discontinuità), poi trapezi.
  const be = new Sim(inst.circuit, dt, 'be');
  for (let i = 0; i < be.dyn.length; i++) { be.dyn[i].v = trap.dyn[i].v; be.dyn[i].i = trap.dyn[i].i; }
  be.step((e) => waveAt(e, 0, false));
  for (let i = 0; i < trap.dyn.length; i++) { trap.dyn[i].v = be.dyn[i].v; trap.dyn[i].i = be.dyn[i].i; }
  const postSamples = new Map();
  const wantPost = new Set([1, Math.round(0.5 * tau / dt), Math.round(tau / dt), Math.round(2 * tau / dt), Math.round(4 * tau / dt)]);
  if (wantPost.has(1)) postSamples.set(dt, be.vv(out[0]) - be.vv(out[1]));
  for (let k = 2; k <= tEnd; k++) {
    trap.step((e) => waveAt(e, k * dt, false));
    if (wantPost.has(k)) postSamples.set(k * dt, trap.vv(out[0]) - trap.vv(out[1]));
  }
  const exactScale = Math.max(Math.abs(sol.post.k.toNumber()), Math.abs(sol.pre.dc.toNumber()) + Math.hypot(sol.pre.cos.toNumber(), sol.pre.sin.toNumber()), 1e-9);
  let maxErr = 0; const samples = [];
  for (const m of [preSamples, postSamples]) for (const [tt, got] of m) {
    const tt2 = Math.abs(tt) < dt / 2 ? -1e-12 : tt; // t=0 appartiene al regime precedente (continuità di vC, iL; v_out valutata in 0-)
    const want = evalSolution(sol, tt2);
    const err = Math.abs(got - want) / exactScale; maxErr = Math.max(maxErr, err);
    samples.push({ t: tt, got, want, err });
  }
  void seenT0; void sample;
  return { ok: maxErr <= tol, maxErr, scale: exactScale, samples, dt };
}
