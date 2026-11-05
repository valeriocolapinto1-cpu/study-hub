/**
 * Simulatore INDIPENDENTE in virgola mobile (integrazione nel tempo con il metodo dei trapezi,
 * matrici costruite per conto proprio): parte da stato nullo molto prima di t = 0 con i
 * generatori accesi, li spegne a t = 0 e confronta con la soluzione esatta. Usato solo dai test.
 */
import { GND, nodesOf, type Circuit, type Element } from './netlist';
import { evalSolution, type AnalysisSolution, type Instance } from './exercise';

interface Lu {
  M: number[][];
  perm: number[];
  n: number;
}
function luFactor(A: number[][]): Lu {
  const n = A.length;
  const M = A.map((r) => r.slice());
  const perm = Array.from({ length: n }, (_, i) => i);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r]![c]!) > Math.abs(M[p]![c]!)) p = r;
    if (Math.abs(M[p]![c]!) < 1e-14) throw new Error('matrice singolare nel simulatore');
    if (p !== c) {
      [M[p], M[c]] = [M[c]!, M[p]!];
      [perm[p], perm[c]] = [perm[c]!, perm[p]!];
    }
    for (let r = c + 1; r < n; r++) {
      const f = (M[r]![c]! /= M[c]![c]!);
      for (let k = c + 1; k < n; k++) M[r]![k]! -= f * M[c]![k]!;
    }
  }
  return { M, perm, n };
}
function luSolve({ M, perm, n }: Lu, b: number[]): number[] {
  const y = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    let s = b[perm[i]!]!;
    for (let k = 0; k < i; k++) s -= M[i]![k]! * y[k]!;
    y[i] = s;
  }
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i]!;
    for (let k = i + 1; k < n; k++) s -= M[i]![k]! * y[k]!;
    y[i] = s / M[i]![i]!;
  }
  return y;
}

interface Dyn {
  e: Element & { type: 'C' | 'L' };
  g: number;
  v: number;
  i: number;
  hist: number;
}

class Sim {
  readonly idx: Map<string, number>;
  N: number;
  readonly cur = new Map<string, number[]>();
  dyn: Dyn[] = [];
  lu!: Lu;
  vv: (n: string) => number = () => 0;
  constructor(
    readonly c: Circuit,
    readonly dt: number,
    readonly mode: 'be' | 'trap',
  ) {
    const nodes = nodesOf(c).filter((n) => n !== GND);
    this.idx = new Map(nodes.map((n, i) => [n, i]));
    this.N = nodes.length;
    for (const e of c.elements) {
      if (e.type === 'V' || e.type === 'L' || e.type === 'N') this.cur.set(e.id, [this.N++]);
      else if (e.type === 'T' || (e.type === 'P' && e.kind === 'Z')) this.cur.set(e.id, [this.N++, this.N++]);
    }
    this.build();
  }
  n(x: string) {
    return x === GND ? -1 : this.idx.get(String(x))!;
  }
  build() {
    const { c, dt, mode, N } = this;
    const A = Array.from({ length: N }, () => new Array<number>(N).fill(0));
    const put = (r: number, k: number, v: number) => {
      if (r >= 0 && k >= 0) A[r]![k]! += v;
    };
    const kirch = (a: string, b: string, col: number) => {
      put(this.n(a), col, 1);
      put(this.n(b), col, -1);
    };
    const vr = (row: number, a: string, b: string, k = 1) => {
      put(row, this.n(a), k);
      put(row, this.n(b), -k);
    };
    for (const e of c.elements) {
      const ci = this.cur.get(e.id);
      switch (e.type) {
        case 'R': {
          const g = 1 / e.r.toNumber();
          vr(this.n(e.a), e.a, e.b, g);
          vr(this.n(e.b), e.a, e.b, -g);
          break;
        }
        case 'C': {
          const g = ((mode === 'be' ? 1 : 2) * e.c.toNumber()) / dt;
          vr(this.n(e.a), e.a, e.b, g);
          vr(this.n(e.b), e.a, e.b, -g);
          this.dyn.push({ e, g, v: 0, i: 0, hist: 0 });
          break;
        }
        case 'L': {
          const r = ((mode === 'be' ? 1 : 2) * e.l.toNumber()) / dt;
          kirch(e.a, e.b, ci![0]!);
          vr(ci![0]!, e.a, e.b);
          put(ci![0]!, ci![0]!, -r);
          this.dyn.push({ e, g: r, v: 0, i: 0, hist: 0 });
          break;
        }
        case 'V':
          kirch(e.a, e.b, ci![0]!);
          vr(ci![0]!, e.a, e.b);
          break;
        case 'G': {
          const g = e.gm.toNumber();
          put(this.n(e.a), this.n(e.cp), g);
          put(this.n(e.a), this.n(e.cn), -g);
          put(this.n(e.b), this.n(e.cp), -g);
          put(this.n(e.b), this.n(e.cn), g);
          break;
        }
        case 'T': {
          const [i1, i2] = ci as [number, number];
          const n = e.n.toNumber();
          kirch(e.p1a, e.p1b, i1);
          kirch(e.p2a, e.p2b, i2);
          vr(i1, e.p1a, e.p1b);
          vr(i1, e.p2a, e.p2b, -n);
          put(i2, i1, n);
          put(i2, i2, 1);
          break;
        }
        case 'N':
          kirch(e.ra, e.rb, ci![0]!);
          vr(ci![0]!, e.na, e.nb);
          break;
        case 'P': {
          const m = e.m.map((r) => r.map((q) => q.toNumber()));
          if (e.kind === 'Y') {
            const ports: [string, string][] = [
              [e.p1a, e.p1b],
              [e.p2a, e.p2b],
            ];
            for (let r = 0; r < 2; r++)
              for (let k = 0; k < 2; k++) {
                const [pa, pb] = ports[r]!;
                const [qa, qb] = ports[k]!;
                put(this.n(pa), this.n(qa), m[r]![k]!);
                put(this.n(pa), this.n(qb), -m[r]![k]!);
                put(this.n(pb), this.n(qa), -m[r]![k]!);
                put(this.n(pb), this.n(qb), m[r]![k]!);
              }
          } else {
            const [i1, i2] = ci as [number, number];
            kirch(e.p1a, e.p1b, i1);
            kirch(e.p2a, e.p2b, i2);
            vr(i1, e.p1a, e.p1b);
            put(i1, i1, -m[0]![0]!);
            put(i1, i2, -m[0]![1]!);
            vr(i2, e.p2a, e.p2b);
            put(i2, i1, -m[1]![0]!);
            put(i2, i2, -m[1]![1]!);
          }
          break;
        }
        default:
          break; // I: solo termine noto
      }
    }
    this.lu = luFactor(A);
  }
  step(val: (e: Element & { type: 'V' | 'I' }) => number) {
    const b = new Array<number>(this.N).fill(0);
    const { mode } = this;
    for (const e of this.c.elements) {
      if (e.type === 'V') b[this.cur.get(e.id)![0]!]! += val(e);
      else if (e.type === 'I') {
        const v = val(e);
        const a = this.n(e.a);
        const bb = this.n(e.b);
        if (a >= 0) b[a]! -= v;
        if (bb >= 0) b[bb]! += v;
      }
    }
    for (const d of this.dyn) {
      if (d.e.type === 'C') {
        const hist = mode === 'be' ? d.g * d.v : d.g * d.v + d.i;
        const a = this.n(d.e.a);
        const bb = this.n(d.e.b);
        if (a >= 0) b[a]! += hist;
        if (bb >= 0) b[bb]! -= hist;
        d.hist = hist;
      } else {
        const k = this.cur.get(d.e.id)![0]!;
        b[k]! += -(mode === 'be' ? d.g * d.i : d.g * d.i + d.v);
      }
    }
    const x = luSolve(this.lu, b);
    const vv = (nn: string) => (nn === GND ? 0 : x[this.idx.get(String(nn))!]!);
    for (const d of this.dyn) {
      const vab = vv(d.e.a) - vv(d.e.b);
      if (d.e.type === 'C') {
        d.i = d.g * vab - d.hist;
        d.v = vab;
      } else {
        d.i = x[this.cur.get(d.e.id)![0]!]!;
        d.v = vab;
      }
    }
    this.vv = vv;
  }
}

/** Confronto soluzione esatta / simulazione nel tempo. */
export function crossCheck(inst: Instance, sol: AnalysisSolution, { tol = 2e-3 } = {}) {
  const tau = sol.tau.toNumber();
  const w = sol.omega ? sol.omega.toNumber() : 0;
  const period = w ? (2 * Math.PI) / w : Infinity;
  const dt = Math.min(tau / 120, period / 240);
  const nPre = Math.ceil((30 * tau) / dt);
  const waveAt = (e: Element & { type: 'V' | 'I' }, t: number, on: boolean) =>
    on
      ? e.wave.dc.toNumber() +
        (w ? e.wave.ac.re.toNumber() * Math.cos(w * t) - e.wave.ac.im.toNumber() * Math.sin(w * t) : 0)
      : 0;
  const [o1, o2] = inst.out;
  const trap = new Sim(inst.circuit, dt, 'trap');
  const tEnd = Math.ceil((5 * tau) / dt);
  const pre = new Map<number, number>();
  const want = new Set(
    [0, 1, 2, Math.round(period / (4 * dt)) || 1, Math.round(period / (2 * dt)) || 3, 37].filter(
      (k) => Number.isFinite(k) && k >= 0 && k <= nPre,
    ),
  );
  let t = -nPre * dt;
  for (let k = 0; k < nPre; k++) {
    t += dt;
    trap.step((e) => waveAt(e, t, true));
    if (want.has(nPre - 1 - k)) pre.set(t, trap.vv(o1) - trap.vv(o2));
  }
  const be = new Sim(inst.circuit, dt, 'be');
  be.dyn.forEach((d, i) => {
    d.v = trap.dyn[i]!.v;
    d.i = trap.dyn[i]!.i;
  });
  be.step((e) => waveAt(e, 0, false));
  trap.dyn.forEach((d, i) => {
    d.v = be.dyn[i]!.v;
    d.i = be.dyn[i]!.i;
  });
  const post = new Map<number, number>();
  const wantPost = new Set([
    1,
    Math.round((0.5 * tau) / dt),
    Math.round(tau / dt),
    Math.round((2 * tau) / dt),
    Math.round((4 * tau) / dt),
  ]);
  if (wantPost.has(1)) post.set(dt, be.vv(o1) - be.vv(o2));
  for (let k = 2; k <= tEnd; k++) {
    trap.step((e) => waveAt(e, k * dt, false));
    if (wantPost.has(k)) post.set(k * dt, trap.vv(o1) - trap.vv(o2));
  }
  const scale = Math.max(
    Math.abs(sol.k.toNumber()),
    Math.abs(sol.pre.dc.toNumber()) + Math.hypot(sol.pre.cos.toNumber(), sol.pre.sin.toNumber()),
    1e-9,
  );
  let maxErr = 0;
  for (const m of [pre, post])
    for (const [tt, got] of m) {
      const t2 = Math.abs(tt) < dt / 2 ? -1e-12 : tt;
      maxErr = Math.max(maxErr, Math.abs(got - evalSolution(sol, t2)) / scale);
    }
  return { ok: maxErr <= tol, maxErr };
}
