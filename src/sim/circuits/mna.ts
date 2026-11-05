/**
 * Analisi nodale modificata (MNA) in virgola mobile.
 *
 *  - dc():        regime stazionario (condensatori aperti, induttori in corto);
 *  - ac():        regime sinusoidale con i fasori (s = jω);
 *  - steadyState(): sovrapposizione di continua e sinusoidi a pulsazioni diverse;
 *  - thevenin()/norton(): equivalenti visti da due nodi;
 *  - transfer()/sweep(): funzione di trasferimento H(jω) e diagrammi di Bode;
 *  - transient(): integrazione nel tempo (trapezi, primo passo di Eulero
 *    implicito dopo ogni discontinuità) per circuiti di ordine qualsiasi;
 *  - firstOrder(): soluzione in forma chiusa x(t) = x_ss(t) + [x(0⁺) − x_ss(0⁺)]e^(−t/τ).
 *
 * Correnti con la convenzione degli utilizzatori (da a verso b attraverso
 * l'elemento), potenze assorbite. Vedi docs/SIM.md.
 */
import { Complex } from './complex';
import { CMatrix, CVector, LU, SingularMatrixError } from './linalg';
import {
  GROUND,
  circuitOmega,
  normalizeNetlist,
  normNode,
  nodesOf,
  type Element,
  type ElementOf,
  type Netlist,
  type Wave,
} from './model';
import type { NetlistInput } from './netlist';

export class CircuitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitError';
  }
}

export type AnyNetlist = Netlist | NetlistInput;
const PARSED = new WeakSet<object>();
function isParsed(n: AnyNetlist): n is Netlist {
  return PARSED.has(n);
}
/** Valida una volta e ricorda il risultato (le analisi ripetute non rivalidano). */
export function prepare(n: AnyNetlist): Netlist {
  if (isParsed(n)) return n;
  const p = normalizeNetlist(n);
  PARSED.add(p);
  return p;
}

// ------------------------------------------------------------------ indici

interface SystemIndex {
  nodes: string[];
  nodeIdx: Map<string, number>;
  /** id elemento → indici delle correnti incognite. */
  branch: Map<string, number[]>;
  size: number;
  /** Matrice delle induttanze (proprie e mutue) per gli induttori. */
  inductance: Map<string, Array<[string, number]>>;
}

function branchCount(e: Element): number {
  switch (e.type) {
    case 'V':
    case 'L':
    case 'E':
    case 'H':
    case 'SW':
    case 'AM':
    case 'OA':
    case 'N':
      return 1;
    case 'T':
      return 2;
    case 'P':
      return e.kind === 'Y' ? 0 : 2;
    default:
      return 0;
  }
}

function indexSystem(net: Netlist): SystemIndex {
  const nodes = nodesOf(net).filter((n) => n !== GROUND);
  const nodeIdx = new Map(nodes.map((n, i) => [n, i] as const));
  let size = nodes.length;
  const branch = new Map<string, number[]>();
  for (const e of net.elements) {
    const k = branchCount(e);
    if (k > 0) {
      const idx: number[] = [];
      for (let j = 0; j < k; j++) idx.push(size++);
      branch.set(e.id, idx);
    }
  }
  const inductance = new Map<string, Array<[string, number]>>();
  const Ls = new Map<string, number>();
  for (const e of net.elements)
    if (e.type === 'L') {
      Ls.set(e.id, e.value);
      inductance.set(e.id, [[e.id, e.value]]);
    }
  for (const e of net.elements)
    if (e.type === 'K') {
      const L1 = Ls.get(e.l1)!;
      const L2 = Ls.get(e.l2)!;
      const M = e.m ?? (e.k ?? 0) * Math.sqrt(L1 * L2);
      inductance.get(e.l1)!.push([e.l2, M]);
      inductance.get(e.l2)!.push([e.l1, M]);
    }
  return { nodes, nodeIdx, branch, size, inductance };
}

// ------------------------------------------------------------------ sorgenti

/** Componente continua e sinusoidi (fasori) di una sorgente, per il regime. */
interface Decomp {
  dc: number;
  sines: Array<{ omega: number; phasor: Complex }>;
}

type Source = ElementOf<'V'> | ElementOf<'I'>;

/** Fattore fasore → ampiezza nel tempo (1 per i fasori di picco, √2 per gli efficaci). */
const timeFactor = (net: Netlist): number => (net.phasor === 'rms' ? Math.SQRT2 : 1);

function waveOmega(net: Netlist, w: Extract<Wave, { kind: 'sin' }>): number {
  if (w.omega !== undefined) return w.omega;
  if (w.freq !== undefined) return 2 * Math.PI * w.freq;
  const o = circuitOmega(net);
  if (o === undefined) throw new CircuitError('sinusoide senza pulsazione');
  return o;
}

/** Valore nel tempo di una forma d'onda. */
export function waveAt(w: Wave, t: number, omegaDefault?: number): number {
  switch (w.kind) {
    case 'dc':
      return w.value;
    case 'sin': {
      const om = w.omega ?? (w.freq !== undefined ? 2 * Math.PI * w.freq : (omegaDefault ?? 0));
      return w.offset + w.amp * Math.cos(om * t + (w.phase * Math.PI) / 180);
    }
    case 'step':
      return t < w.at ? w.before : w.after;
    case 'pulse': {
      let tt = t - w.delay;
      if (tt < 0) return w.low;
      if (w.period && w.period > 0) tt %= w.period;
      const { rise, fall, width, low, high } = w;
      if (tt < rise) return low + ((high - low) * tt) / rise;
      if (tt < rise + width) return high;
      if (tt < rise + width + fall) return high - ((high - low) * (tt - rise - width)) / fall;
      return low;
    }
    case 'pwl': {
      const p = w.points;
      if (t <= p[0]![0]) return p[0]![1];
      for (let k = 1; k < p.length; k++) {
        const [t1, v1] = p[k]!;
        const [t0, v0] = p[k - 1]!;
        if (t <= t1) return t1 === t0 ? v1 : v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
      }
      return p[p.length - 1]![1];
    }
  }
}

/** Valore nel tempo di un generatore indipendente. */
export function sourceAt(net: Netlist, e: Source, t: number): number {
  if (e.wave) return waveAt(e.wave, t, circuitOmega(net));
  let v = e.dc ?? 0;
  const om = circuitOmega(net);
  if (e.ac && om !== undefined)
    v += timeFactor(net) * e.ac.mag * Math.cos(om * t + (e.ac.phase * Math.PI) / 180);
  return v;
}

/**
 * Scomposizione in continua + sinusoidi del generatore nel regime
 * "prima" (t < 0, condizioni iniziali) o "dopo" (t → ∞) le commutazioni.
 */
function decompose(net: Netlist, e: Source, when: 'before' | 'after'): Decomp {
  const kt = timeFactor(net);
  if (!e.wave) {
    const om = circuitOmega(net);
    const sines =
      e.ac && om !== undefined && e.ac.mag !== 0
        ? [{ omega: om, phasor: Complex.polarDeg(e.ac.mag, e.ac.phase) }]
        : [];
    return { dc: e.dc ?? 0, sines };
  }
  const w = e.wave;
  switch (w.kind) {
    case 'dc':
      return { dc: w.value, sines: [] };
    case 'sin':
      return {
        dc: w.offset,
        sines: [{ omega: waveOmega(net, w), phasor: Complex.polarDeg(w.amp / kt, w.phase) }],
      };
    case 'step':
      return {
        dc: when === 'before' ? (w.at > 0 ? w.before : w.at < 0 ? w.after : w.before) : w.after,
        sines: [],
      };
    case 'pulse':
      if (when === 'after') throw new CircuitError(`${e.id}: un impulso non ha un regime finale`);
      return { dc: w.delay >= 0 ? w.low : waveAt(w, 0), sines: [] };
    case 'pwl':
      return { dc: waveAt(w, when === 'before' ? Math.min(0, w.points[0]![0]) : Infinity), sines: [] };
  }
}

// ------------------------------------------------------------------ assemblaggio

/** Forma lineare di una corrente: Σ coef·x[idx] + costante. */
interface Lin {
  terms: Array<[number, Complex]>;
  c: Complex;
}

interface TranState {
  /** Tensione e corrente dei condensatori al passo precedente. */
  cap: Map<string, { v: number; i: number }>;
  /** Corrente e tensione degli induttori al passo precedente. */
  ind: Map<string, { i: number; v: number }>;
}

interface StampCtx {
  /** Fasori: s; transitorio: undefined. */
  s?: Complex;
  tran?: { h: number; method: 'be' | 'trap'; state: TranState };
  /** Valori algebrici fissati (soluzione a t = 0⁺): C → generatore di tensione, L → di corrente. */
  frozen?: { cap: Map<string, number>; ind: Map<string, number> };
  src: (e: Source) => Complex;
  /** Istante per lo stato degli interruttori (−∞ = stato iniziale). */
  t: number;
  gmin: number;
}

/** Stato di un interruttore all'istante t (cambia stato a toggleAt, incluso). */
export function switchClosed(e: ElementOf<'SW'>, t: number): boolean {
  return e.toggleAt !== undefined && t >= e.toggleAt ? !e.closed : e.closed;
}

class Assembler {
  readonly M: CMatrix | null;
  readonly rhs: CVector;
  constructor(
    readonly net: Netlist,
    readonly ix: SystemIndex,
    readonly ctx: StampCtx,
    withMatrix: boolean,
    /** Correnti aggiuntive: per i C trasformati in generatori (frozen) servono incognite. */
    readonly extra: Map<string, number>,
  ) {
    const n = ix.size + extra.size;
    this.M = withMatrix ? new CMatrix(n) : null;
    this.rhs = new CVector(n);
  }
  n(node: string): number {
    return node === GROUND ? -1 : this.ix.nodeIdx.get(node)!;
  }
  m(r: number, c: number, v: Complex | number): void {
    this.M?.add(r, c, v);
  }
  r(i: number, v: Complex | number): void {
    this.rhs.add(i, v);
  }
  adm(a: string, b: string, y: Complex | number): void {
    const A = this.n(a);
    const B = this.n(b);
    const ny = typeof y === 'number' ? -y : y.neg();
    this.m(A, A, y);
    this.m(B, B, y);
    this.m(A, B, ny);
    this.m(B, A, ny);
  }
  /** Corrente incognita `col` da a verso b attraverso l'elemento. */
  branch(a: string, b: string, col: number): void {
    this.m(this.n(a), col, 1);
    this.m(this.n(b), col, -1);
  }
  /** Nella riga `row`: + k·(v(a) − v(b)). */
  vrow(row: number, a: string, b: string, k: Complex | number = 1): void {
    this.m(row, this.n(a), k);
    this.m(row, this.n(b), typeof k === 'number' ? -k : k.neg());
  }
  /** Inietta la corrente lineare `lin` (da a verso b) nelle equazioni di Kirchhoff. */
  kclLin(a: string, b: string, lin: Lin, gain: Complex | number = 1): void {
    const g = Complex.from(gain);
    const A = this.n(a);
    const B = this.n(b);
    for (const [k, c] of lin.terms) {
      this.m(A, k, c.mul(g));
      this.m(B, k, c.mul(g).neg());
    }
    const cc = lin.c.mul(g);
    this.r(A, cc.neg());
    this.r(B, cc);
  }

  /** Corrente (da a verso b) di un bipolo come forma lineare delle incognite. */
  current(id: string, depth = 0): Lin {
    if (depth > 20) throw new CircuitError(`catena di controlli circolare su ${id}`);
    const e = this.net.elements.find((q) => q.id === id);
    if (!e) throw new CircuitError(`elemento inesistente: ${id}`);
    const extra = this.extra.get(id);
    if (extra !== undefined) return { terms: [[extra, Complex.ONE]], c: Complex.ZERO };
    const br = this.ix.branch.get(id);
    if (br && br.length === 1 && e.type !== 'OA' && e.type !== 'N')
      return { terms: [[br[0]!, Complex.ONE]], c: Complex.ZERO };
    const vab = (a: string, b: string, k: Complex): Lin => {
      const terms: Array<[number, Complex]> = [];
      if (a !== GROUND) terms.push([this.n(a), k]);
      if (b !== GROUND) terms.push([this.n(b), k.neg()]);
      return { terms, c: Complex.ZERO };
    };
    switch (e.type) {
      case 'R':
        return vab(e.a, e.b, Complex.from(1 / e.value));
      case 'C': {
        if (this.ctx.tran) {
          const { h, method, state } = this.ctx.tran;
          const g = ((method === 'be' ? 1 : 2) * e.value) / h;
          const st = state.cap.get(e.id)!;
          const hist = method === 'be' ? -g * st.v : -g * st.v - st.i;
          const lin = vab(e.a, e.b, Complex.from(g));
          return { terms: lin.terms, c: Complex.from(hist) };
        }
        return vab(e.a, e.b, (this.ctx.s ?? Complex.ZERO).mul(e.value));
      }
      case 'I':
        return { terms: [], c: this.ctx.src(e) };
      case 'G':
        return vab(e.cp, e.cn, Complex.from(e.gain));
      case 'F': {
        const l = this.current(e.ctrl, depth + 1);
        return { terms: l.terms.map(([k, c]) => [k, c.mul(e.gain)]), c: l.c.mul(e.gain) };
      }
      case 'VM':
        return { terms: [], c: Complex.ZERO };
      default:
        throw new CircuitError(`corrente non definita per ${id}`);
    }
  }

  stamp(): void {
    const { net, ix, ctx } = this;
    for (const nd of ix.nodes) if (ctx.gmin > 0) this.m(this.n(nd), this.n(nd), ctx.gmin);
    for (const e of net.elements) {
      const br = ix.branch.get(e.id);
      switch (e.type) {
        case 'R':
          this.adm(e.a, e.b, 1 / e.value);
          break;
        case 'C': {
          const ex = this.extra.get(e.id);
          if (ctx.frozen && ex !== undefined) {
            // C come generatore di tensione v(0⁺)
            this.branch(e.a, e.b, ex);
            this.vrow(ex, e.a, e.b);
            this.r(ex, ctx.frozen.cap.get(e.id) ?? 0);
          } else this.kclLin(e.a, e.b, this.current(e.id));
          break;
        }
        case 'L': {
          const k = br![0]!;
          this.branch(e.a, e.b, k);
          if (ctx.frozen) {
            // L come generatore di corrente i(0⁺)
            this.m(k, k, 1);
            this.r(k, ctx.frozen.ind.get(e.id) ?? 0);
            break;
          }
          this.vrow(k, e.a, e.b);
          const row = ix.inductance.get(e.id)!;
          if (ctx.tran) {
            const { h, method, state } = ctx.tran;
            const a = (method === 'be' ? 1 : 2) / h;
            let flux = 0;
            for (const [other, Lv] of row) {
              this.m(k, ix.branch.get(other)![0]!, -a * Lv);
              flux += Lv * state.ind.get(other)!.i;
            }
            const vPrev = state.ind.get(e.id)!.v;
            this.r(k, -a * flux - (method === 'trap' ? vPrev : 0));
          } else {
            const s = ctx.s ?? Complex.ZERO;
            for (const [other, Lv] of row) this.m(k, ix.branch.get(other)![0]!, s.mul(-Lv));
          }
          break;
        }
        case 'V': {
          const k = br![0]!;
          this.branch(e.a, e.b, k);
          this.vrow(k, e.a, e.b);
          this.r(k, ctx.src(e));
          break;
        }
        case 'I': {
          const v = ctx.src(e);
          this.r(this.n(e.a), v.neg());
          this.r(this.n(e.b), v);
          break;
        }
        case 'E': {
          const k = br![0]!;
          this.branch(e.a, e.b, k);
          this.vrow(k, e.a, e.b);
          this.vrow(k, e.cp, e.cn, -e.gain);
          break;
        }
        case 'G':
          this.kclLin(e.a, e.b, this.current(e.id));
          break;
        case 'H': {
          const k = br![0]!;
          this.branch(e.a, e.b, k);
          this.vrow(k, e.a, e.b);
          const l = this.current(e.ctrl);
          for (const [c, coef] of l.terms) this.m(k, c, coef.mul(-e.gain));
          this.r(k, l.c.mul(e.gain));
          break;
        }
        case 'F':
          this.kclLin(e.a, e.b, this.current(e.id));
          break;
        case 'SW': {
          const k = br![0]!;
          this.branch(e.a, e.b, k);
          if (switchClosed(e, ctx.t)) this.vrow(k, e.a, e.b);
          else this.m(k, k, 1);
          break;
        }
        case 'AM': {
          const k = br![0]!;
          this.branch(e.a, e.b, k);
          this.vrow(k, e.a, e.b);
          break;
        }
        case 'VM':
        case 'K':
          break;
        case 'T': {
          const [k1, k2] = br as [number, number];
          this.branch(e.p1a, e.p1b, k1);
          this.branch(e.p2a, e.p2b, k2);
          this.vrow(k1, e.p1a, e.p1b);
          this.vrow(k1, e.p2a, e.p2b, -e.n);
          this.m(k2, k1, e.n);
          this.m(k2, k2, 1);
          break;
        }
        case 'OA': {
          const k = br![0]!;
          // corrente erogata dall'uscita verso il nodo out (riferita a massa)
          this.m(this.n(e.out), k, -1);
          if (e.gain === undefined) this.vrow(k, e.plus, e.minus);
          else {
            this.vrow(k, e.out, GROUND);
            this.vrow(k, e.plus, e.minus, -e.gain);
          }
          break;
        }
        case 'N': {
          const k = br![0]!;
          this.branch(e.ra, e.rb, k);
          this.vrow(k, e.na, e.nb);
          break;
        }
        case 'P': {
          const [[a11, a12], [a21, a22]] = e.m;
          if (e.kind === 'Y') {
            const ports: Array<[string, string]> = [
              [e.p1a, e.p1b],
              [e.p2a, e.p2b],
            ];
            const Y = [
              [a11, a12],
              [a21, a22],
            ];
            for (let r = 0; r < 2; r++)
              for (let c = 0; c < 2; c++) {
                const [pa, pb] = ports[r]!;
                const [qa, qb] = ports[c]!;
                const y = Y[r]![c]!;
                this.m(this.n(pa), this.n(qa), y);
                this.m(this.n(pa), this.n(qb), -y);
                this.m(this.n(pb), this.n(qa), -y);
                this.m(this.n(pb), this.n(qb), y);
              }
            break;
          }
          const [k1, k2] = br as [number, number];
          this.branch(e.p1a, e.p1b, k1);
          this.branch(e.p2a, e.p2b, k2);
          if (e.kind === 'Z') {
            this.vrow(k1, e.p1a, e.p1b);
            this.m(k1, k1, -a11);
            this.m(k1, k2, -a12);
            this.vrow(k2, e.p2a, e.p2b);
            this.m(k2, k1, -a21);
            this.m(k2, k2, -a22);
          } else if (e.kind === 'H') {
            this.vrow(k1, e.p1a, e.p1b);
            this.m(k1, k1, -a11);
            this.vrow(k1, e.p2a, e.p2b, -a12);
            this.m(k2, k2, 1);
            this.m(k2, k1, -a21);
            this.vrow(k2, e.p2a, e.p2b, -a22);
          } else {
            // ABCD: v1 = A v2 − B i2 ; i1 = C v2 − D i2
            this.vrow(k1, e.p1a, e.p1b);
            this.vrow(k1, e.p2a, e.p2b, -a11);
            this.m(k1, k2, a12);
            this.m(k2, k1, 1);
            this.vrow(k2, e.p2a, e.p2b, -a21);
            this.m(k2, k2, a22);
          }
          break;
        }
      }
    }
  }
}

// ------------------------------------------------------------------ soluzione fasoriale

export interface Power {
  /** Potenza attiva assorbita [W] (in continua: v·i). */
  p: number;
  /** Potenza reattiva assorbita [var] (0 in continua). */
  q: number;
  /** Potenza complessa S = P + jQ [VA]. */
  s: Complex;
  /** Potenza apparente |S| [VA]. */
  apparent: number;
  /** Fattore di potenza cos φ = P/|S| (1 se |S| = 0). */
  pf: number;
}

/** Soluzione in regime (continua: omega = 0) con grandezze complesse. */
export class PhasorSolution {
  constructor(
    readonly net: Netlist,
    readonly omega: number,
    private readonly ix: SystemIndex,
    private readonly x: CVector,
    private readonly asm: Assembler,
  ) {}

  /** Tensione del nodo rispetto alla massa. */
  v(node: string | number): Complex {
    const n = normNode(node);
    if (n === GROUND) return Complex.ZERO;
    const k = this.ix.nodeIdx.get(n);
    if (k === undefined) throw new CircuitError(`nodo inesistente: ${n}`);
    return this.x.get(k);
  }

  /** Tensione v(a) − v(b). */
  vd(a: string | number, b: string | number = GROUND): Complex {
    return this.v(a).sub(this.v(b));
  }

  private evalLin(l: Lin): Complex {
    let s = l.c;
    for (const [k, c] of l.terms) s = s.add(c.mul(this.x.get(k)));
    return s;
  }

  /**
   * Corrente dell'elemento (da a verso b). Per i doppi bipoli e il
   * trasformatore `port` sceglie la porta (corrente entrante in p1a / p2a);
   * per l'op-amp è la corrente erogata dall'uscita; per il nullore quella del noratore.
   */
  i(id: string, port: 1 | 2 = 1): Complex {
    const e = this.net.elements.find((q) => q.id === id);
    if (!e) throw new CircuitError(`elemento inesistente: ${id}`);
    const br = this.ix.branch.get(id);
    if (e.type === 'T' || e.type === 'P') {
      if (br) return this.x.get(br[port - 1]!);
      // Y: i = Y v
      const v1 = this.vd(e.p1a, e.p1b);
      const v2 = this.vd(e.p2a, e.p2b);
      const row = (e as ElementOf<'P'>).m[port - 1]!;
      return v1.mul(row[0]).add(v2.mul(row[1]));
    }
    if (e.type === 'OA' || e.type === 'N') return this.x.get(br![0]!);
    if (e.type === 'K') throw new CircuitError(`${id}: un accoppiamento non ha corrente`);
    return this.evalLin(this.asm.current(id));
  }

  /** Tensione ai capi dell'elemento (porta 1 o 2 per i doppi bipoli). */
  vElement(id: string, port: 1 | 2 = 1): Complex {
    const e = this.net.elements.find((q) => q.id === id);
    if (!e) throw new CircuitError(`elemento inesistente: ${id}`);
    switch (e.type) {
      case 'T':
      case 'P':
        return port === 1 ? this.vd(e.p1a, e.p1b) : this.vd(e.p2a, e.p2b);
      case 'OA':
        return this.v(e.out);
      case 'N':
        return this.vd(e.ra, e.rb);
      case 'K':
        throw new CircuitError(`${id}: un accoppiamento non ha tensione`);
      default:
        return this.vd(e.a, e.b);
    }
  }

  /**
   * Potenza assorbita dall'elemento (convenzione degli utilizzatori).
   * Fasori di picco: S = ½·V·I*; efficaci: S = V·I*; continua: P = V·I.
   */
  power(id: string): Power {
    const e = this.net.elements.find((q) => q.id === id);
    if (!e) throw new CircuitError(`elemento inesistente: ${id}`);
    let s: Complex;
    if (e.type === 'K') s = Complex.ZERO;
    else if (e.type === 'T' || e.type === 'P')
      s = this.vElement(id, 1)
        .mul(this.i(id, 1).conj())
        .add(this.vElement(id, 2).mul(this.i(id, 2).conj()));
    else if (e.type === 'N' || e.type === 'OA') s = this.vElement(id).mul(this.i(id).conj());
    else s = this.vElement(id).mul(this.i(id).conj());
    const k = this.omega === 0 || this.net.phasor === 'rms' ? 1 : 0.5;
    s = s.mul(k);
    const apparent = s.abs();
    return { p: s.re, q: s.im, s, apparent, pf: apparent === 0 ? 1 : s.re / apparent };
  }

  /** Somma delle potenze complesse assorbite (≈ 0 per il teorema di Tellegen). */
  powerBalance(): Complex {
    let s = Complex.ZERO;
    for (const e of this.net.elements) if (e.type !== 'K' && e.type !== 'VM') s = s.add(this.power(e.id).s);
    return s;
  }

  /** Impedenza vista ai capi di un bipolo passivo: V/I. */
  impedance(id: string): Complex {
    return this.vElement(id).div(this.i(id));
  }
}

/** Soluzione in continua con grandezze reali. */
export class DcSolution {
  constructor(readonly phasor: PhasorSolution) {}
  v(node: string | number): number {
    return this.phasor.v(node).re;
  }
  vd(a: string | number, b: string | number = GROUND): number {
    return this.phasor.vd(a, b).re;
  }
  i(id: string, port: 1 | 2 = 1): number {
    return this.phasor.i(id, port).re;
  }
  vElement(id: string, port: 1 | 2 = 1): number {
    return this.phasor.vElement(id, port).re;
  }
  /** Potenza assorbita [W]. */
  power(id: string): number {
    return this.phasor.power(id).p;
  }
  powerBalance(): number {
    return this.phasor.powerBalance().re;
  }
}

interface SolveOpts {
  s: Complex;
  src: (e: Source) => Complex;
  t?: number;
  frozen?: StampCtx['frozen'];
  omega: number;
  /** Ritenta con gmin se il sistema è singolare (default true). */
  gminFallback?: boolean;
}

function solveSystem(net: Netlist, o: SolveOpts): PhasorSolution {
  const ix = indexSystem(net);
  const extra = new Map<string, number>();
  if (o.frozen) {
    let k = ix.size;
    for (const e of net.elements) if (e.type === 'C') extra.set(e.id, k++);
  }
  const attempt = (gmin: number): PhasorSolution => {
    const asm = new Assembler(
      net,
      ix,
      { s: o.s, src: o.src, t: o.t ?? -Infinity, gmin, frozen: o.frozen },
      true,
      extra,
    );
    asm.stamp();
    const lu = new LU(asm.M!);
    return new PhasorSolution(net, o.omega, ix, lu.solve(asm.rhs), asm);
  };
  try {
    return attempt(0);
  } catch (err) {
    if (!(err instanceof SingularMatrixError)) throw err;
    if (o.gminFallback === false) throw new CircuitError('Sistema singolare');
    // Nodi flottanti in continua (es. tra due condensatori in serie): come
    // SPICE, una conduttanza minima verso massa rende il sistema risolubile.
    try {
      return attempt(1e-12);
    } catch (err2) {
      if (err2 instanceof SingularMatrixError) {
        throw new CircuitError(
          'Sistema singolare: controllare maglie di soli generatori di tensione (o induttori in continua), tagli di soli generatori di corrente, nodi scollegati o op-amp senza retroazione.',
        );
      }
      throw err2;
    }
  }
}

export interface StaticOptions {
  /** Istante che fissa lo stato degli interruttori (default: stato iniziale). */
  t?: number;
}

/** Analisi in continua (condensatori aperti, induttori in cortocircuito). */
export function dc(input: AnyNetlist, opts: StaticOptions = {}): DcSolution {
  const net = prepare(input);
  const t = opts.t ?? -Infinity;
  const src = (e: Source): Complex =>
    Complex.from(t === -Infinity ? decompose(net, e, 'before').dc : waveDcAt(e, t));
  return new DcSolution(solveSystem(net, { s: Complex.ZERO, src, t, omega: 0 }));
}

function waveDcAt(e: Source, t: number): number {
  if (!e.wave) return e.dc ?? 0;
  if (e.wave.kind === 'sin') return e.wave.offset;
  return waveAt(e.wave, t);
}

export interface AcOptions extends StaticOptions {
  /** Pulsazione [rad/s] (default quella del circuito). */
  omega?: number;
}

/** Analisi in regime sinusoidale con i fasori dei generatori (campo `ac`). */
export function ac(input: AnyNetlist, opts: AcOptions = {}): PhasorSolution {
  const net = prepare(input);
  const omega = opts.omega ?? circuitOmega(net);
  if (omega === undefined) throw new CircuitError('pulsazione non specificata (omega o freq)');
  const src = (e: Source): Complex => {
    const d = decompose(net, e, 'before');
    let s = Complex.ZERO;
    for (const q of d.sines) if (Math.abs(q.omega - omega) <= 1e-9 * Math.max(1, omega)) s = s.add(q.phasor);
    return s;
  };
  return new PhasorSolution(net, omega, ...solveParts(net, Complex.J.mul(omega), src, opts.t, omega));
}

function solveParts(
  net: Netlist,
  s: Complex,
  src: (e: Source) => Complex,
  t: number | undefined,
  omega: number,
): [SystemIndex, CVector, Assembler] {
  const sol = solveSystem(net, { s, src, t, omega });
  // accesso ai campi privati tramite cast mirato: evita di duplicare la logica
  const inner = sol as unknown as { ix: SystemIndex; x: CVector; asm: Assembler };
  return [inner.ix, inner.x, inner.asm];
}

// ------------------------------------------------------------------ regime con più frequenze

export interface SteadyState {
  dc: DcSolution;
  harmonics: Array<{ omega: number; solution: PhasorSolution }>;
  /** Tensione di nodo nel tempo. */
  v(node: string | number, t: number): number;
  vd(a: string | number, b: string | number, t: number): number;
  /** Corrente di un elemento nel tempo. */
  i(id: string, t: number): number;
}

/**
 * Regime permanente per sovrapposizione: componente continua + una soluzione
 * fasoriale per ogni pulsazione presente. `when` sceglie la configurazione
 * prima (t < 0) o dopo (t → ∞) le commutazioni.
 */
export function steadyState(
  input: AnyNetlist,
  opts: { when?: 'before' | 'after'; t?: number } = {},
): SteadyState {
  const net = prepare(input);
  const when = opts.when ?? 'before';
  const tSw = opts.t ?? (when === 'before' ? -Infinity : Infinity);
  const sources = net.elements.filter((e): e is Source => e.type === 'V' || e.type === 'I');
  const dec = new Map(sources.map((e) => [e.id, decompose(net, e, when)] as const));
  const dcSol = new DcSolution(
    solveSystem(net, { s: Complex.ZERO, src: (e) => Complex.from(dec.get(e.id)!.dc), t: tSw, omega: 0 }),
  );
  const omegas: number[] = [];
  for (const d of dec.values())
    for (const q of d.sines)
      if (q.omega > 0 && !omegas.some((o) => Math.abs(o - q.omega) <= 1e-9 * q.omega)) omegas.push(q.omega);
  const harmonics = omegas.map((omega) => {
    const src = (e: Source): Complex => {
      let s = Complex.ZERO;
      for (const q of dec.get(e.id)!.sines)
        if (Math.abs(q.omega - omega) <= 1e-9 * omega) s = s.add(q.phasor);
      return s;
    };
    return {
      omega,
      solution: new PhasorSolution(net, omega, ...solveParts(net, Complex.J.mul(omega), src, tSw, omega)),
    };
  });
  const kt = timeFactor(net);
  const sum = (dcv: number, f: (s: PhasorSolution) => Complex, t: number): number => {
    let v = dcv;
    for (const h of harmonics) {
      const X = f(h.solution);
      v += kt * (X.re * Math.cos(h.omega * t) - X.im * Math.sin(h.omega * t));
    }
    return v;
  };
  return {
    dc: dcSol,
    harmonics,
    v: (node, t) => sum(dcSol.v(node), (s) => s.v(node), t),
    vd: (a, b, t) => sum(dcSol.vd(a, b), (s) => s.vd(a, b), t),
    i: (id, t) => sum(dcSol.i(id), (s) => s.i(id), t),
  };
}

// ------------------------------------------------------------------ Thévenin / Norton

export interface Equivalent {
  /** Tensione a vuoto (Thévenin) v(a) − v(b); undefined se l'equivalente non esiste. */
  vth?: Complex;
  /** Impedenza equivalente; Infinity se il bipolo è un generatore di corrente ideale. */
  zth: Complex | number;
  /** Corrente di cortocircuito (Norton) da a verso b attraverso il corto. */
  isc?: Complex;
  /** Ammettenza equivalente (1/zth). */
  yn: Complex | number;
}

/**
 * Equivalenti di Thévenin e Norton visti dai nodi a, b. In continua se
 * `omega` è 0 o assente e il circuito non ha pulsazione; altrimenti ai fasori.
 * L'impedenza si ricava spegnendo i generatori indipendenti e applicando un
 * generatore di prova (vale anche con i generatori pilotati).
 */
export function thevenin(
  input: AnyNetlist,
  a: string | number,
  b: string | number = GROUND,
  opts: AcOptions & { dc?: boolean } = {},
): Equivalent {
  const net = prepare(input);
  const A = normNode(a);
  const B = normNode(b);
  const omega = opts.dc ? 0 : (opts.omega ?? circuitOmega(net) ?? 0);
  const s = Complex.J.mul(omega);
  const t = opts.t;
  const srcOf = (e: Source): Complex => {
    if (e.id.startsWith('__test')) return Complex.ONE;
    const d = decompose(net, e, 'before');
    if (omega === 0) return Complex.from(d.dc);
    let v = Complex.ZERO;
    for (const q of d.sines) if (Math.abs(q.omega - omega) <= 1e-9 * omega) v = v.add(q.phasor);
    return v;
  };
  const off = (e: Source): Complex => (e.id.startsWith('__test') ? Complex.ONE : Complex.ZERO);
  const withTest = (el: Element): Netlist => ({ ...net, elements: [...net.elements, el] });
  const trySolve = (
    n: Netlist,
    src: (e: Source) => Complex,
    gminFallback = false,
  ): PhasorSolution | undefined => {
    try {
      return solveSystem(n, { s, src, t, omega, gminFallback });
    } catch (err) {
      if (err instanceof CircuitError) return undefined;
      throw err;
    }
  };
  // vuoto
  const open = trySolve(net, srcOf, true);
  const vth = open?.vd(A, B);
  // impedenza: corrente di prova 1 A entrante in a (esce da b) a generatori spenti
  const testI = withTest({ type: 'I', id: '__testI', a: B, b: A } as Element);
  const zSol = trySolve(testI, off);
  let zth: Complex | number = zSol ? zSol.vd(A, B) : Infinity;
  // cortocircuito
  const shorted = withTest({ type: 'AM', id: '__testS', a: A, b: B } as Element);
  const scSol = trySolve(shorted, srcOf);
  const isc = scSol?.i('__testS');
  let yn: Complex | number;
  if (zth === Infinity) {
    const testV = withTest({ type: 'V', id: '__testV', a: A, b: B } as Element);
    const ySol = trySolve(testV, off);
    yn = ySol ? ySol.i('__testV').neg() : Infinity;
    if (yn instanceof Complex && yn.abs() > 0) zth = yn.inv();
  } else {
    yn = zth instanceof Complex && zth.abs() === 0 ? Infinity : (zth as Complex).inv();
  }
  if (vth === undefined && isc === undefined)
    throw new CircuitError('equivalente non calcolabile tra i nodi indicati');
  return { vth, zth, isc, yn };
}

/** Alias: stesso calcolo, nomi da Norton. */
export const norton = thevenin;

/**
 * Potenza massima trasferibile a un carico tra a e b (adattamento coniugato):
 * P = |Vth|²/(8 Re Zth) con fasori di picco, |Vth|²/(4 Re Zth) efficaci o in continua.
 */
export function maxPower(
  input: AnyNetlist,
  a: string | number,
  b: string | number = GROUND,
  opts: AcOptions & { dc?: boolean } = {},
): { pmax: number; zLoad: Complex } {
  const net = prepare(input);
  const eq = thevenin(net, a, b, opts);
  if (!eq.vth || !(eq.zth instanceof Complex))
    throw new CircuitError('serve un equivalente di Thévenin con impedenza finita');
  const omega = opts.dc ? 0 : (opts.omega ?? circuitOmega(net) ?? 0);
  const k = omega === 0 || net.phasor === 'rms' ? 4 : 8;
  return { pmax: eq.vth.abs() ** 2 / (k * eq.zth.re), zLoad: eq.zth.conj() };
}

// ------------------------------------------------------------------ funzione di trasferimento

/** Grandezza d'uscita: tensione tra due nodi o corrente di un elemento. */
export type Output = { v: string | number; ref?: string | number } | { i: string };

function readOutput(sol: PhasorSolution, out: Output): Complex {
  return 'i' in out ? sol.i(out.i) : sol.vd(out.v, out.ref ?? GROUND);
}

/**
 * Funzione di trasferimento H(jω) = uscita / ingresso, con il generatore
 * indipendente `input` a fasore unitario e tutti gli altri spenti.
 */
export function transfer(
  input: AnyNetlist,
  source: string,
  out: Output,
  omega: number,
  opts: StaticOptions = {},
): Complex {
  const net = prepare(input);
  const e = net.elements.find((q) => q.id === source);
  if (!e || (e.type !== 'V' && e.type !== 'I'))
    throw new CircuitError(`${source} non è un generatore indipendente`);
  const src = (q: Source): Complex => (q.id === source ? Complex.ONE : Complex.ZERO);
  const sol = solveSystem(net, { s: Complex.J.mul(omega), src, t: opts.t, omega });
  return readOutput(sol, out);
}

export interface SweepOptions extends StaticOptions {
  /** Estremi in pulsazione [rad/s] … */
  omegaMin?: number;
  omegaMax?: number;
  /** … oppure in frequenza [Hz]. */
  fMin?: number;
  fMax?: number;
  /** Numero di punti (default 200). */
  points?: number;
  /** Scala log (default) o lineare. */
  scale?: 'log' | 'lin';
}

export interface Sweep {
  omega: Float64Array;
  freq: Float64Array;
  H: Complex[];
  /** |H| in dB (20 log10). */
  magDb: Float64Array;
  mag: Float64Array;
  /** Fase in gradi, "srotolata" (senza salti di 360°). */
  phaseDeg: Float64Array;
}

/** Spazzata in frequenza della funzione di trasferimento (diagrammi di Bode). */
export function sweep(input: AnyNetlist, source: string, out: Output, opts: SweepOptions): Sweep {
  const net = prepare(input);
  const wMin = opts.omegaMin ?? (opts.fMin !== undefined ? 2 * Math.PI * opts.fMin : undefined);
  const wMax = opts.omegaMax ?? (opts.fMax !== undefined ? 2 * Math.PI * opts.fMax : undefined);
  if (wMin === undefined || wMax === undefined || !(wMax > wMin) || wMin <= 0)
    throw new CircuitError('intervallo di frequenze non valido');
  const n = Math.max(2, opts.points ?? 200);
  const omega = new Float64Array(n);
  const logs = (opts.scale ?? 'log') === 'log';
  for (let k = 0; k < n; k++) {
    const u = k / (n - 1);
    omega[k] = logs ? wMin * (wMax / wMin) ** u : wMin + (wMax - wMin) * u;
  }
  const H = Array.from(omega, (w) => transfer(net, source, out, w, opts));
  const mag = Float64Array.from(H, (h) => h.abs());
  const magDb = Float64Array.from(mag, (m) => 20 * Math.log10(m));
  const phaseDeg = unwrapDeg(H.map((h) => h.argDeg()));
  return { omega, freq: Float64Array.from(omega, (w) => w / (2 * Math.PI)), H, mag, magDb, phaseDeg };
}

/** Elimina i salti di ±360° tra campioni consecutivi. */
export function unwrapDeg(ph: number[]): Float64Array {
  const out = new Float64Array(ph.length);
  let off = 0;
  for (let k = 0; k < ph.length; k++) {
    if (k > 0) {
      const d = ph[k]! + off - out[k - 1]!;
      if (d > 180) off -= 360 * Math.round(d / 360);
      else if (d < -180) off += 360 * Math.round(-d / 360);
    }
    out[k] = ph[k]! + off;
  }
  return out;
}

// ------------------------------------------------------------------ transitorio

export interface TransientOptions {
  /** Istante finale [s]. */
  tEnd: number;
  /** Passo [s] (default tEnd/2000). */
  dt?: number;
  /**
   * Stato iniziale: "steady" = regime (continua + sinusoidi) con la
   * configurazione per t < 0 (default); "zero" = tutto scarico;
   * "ic" = v0 dei condensatori e i0 degli induttori.
   */
  initial?: 'steady' | 'zero' | 'ic';
  /** Metodo: trapezi (default, A-stabile, del 2° ordine) o Eulero implicito. */
  method?: 'trap' | 'be';
}

export interface TransientResult {
  t: Float64Array;
  /** Tensione di nodo campionata. */
  v(node: string | number): Float64Array;
  vd(a: string | number, b?: string | number): Float64Array;
  /** Corrente di un bipolo (da a verso b) o della porta 1 di T/P, uscita di OA. */
  i(id: string): Float64Array;
  /** Interpolazione lineare di una serie all'istante t. */
  at(series: Float64Array, t: number): number;
}

/** Istanti di discontinuità (commutazioni, fronti) nell'intervallo (0, tEnd]. */
function breakpoints(net: Netlist, tEnd: number): number[] {
  const bp: number[] = [];
  for (const e of net.elements) {
    if (e.type === 'SW' && e.toggleAt !== undefined && e.toggleAt > 0 && e.toggleAt < tEnd)
      bp.push(e.toggleAt);
    if ((e.type === 'V' || e.type === 'I') && e.wave) {
      const w = e.wave;
      if (w.kind === 'step' && w.at > 0 && w.at < tEnd) bp.push(w.at);
      if (w.kind === 'pwl') for (const [t] of w.points) if (t > 0 && t < tEnd) bp.push(t);
      if (w.kind === 'pulse') {
        const corners = [0, w.rise, w.rise + w.width, w.rise + w.width + w.fall];
        const per = w.period && w.period > 0 ? w.period : Infinity;
        for (let k = 0; w.delay + k * per < tEnd && k < 10000; k++) {
          for (const c of corners) {
            const t = w.delay + k * per + c;
            if (t > 0 && t < tEnd) bp.push(t);
          }
          if (per === Infinity) break;
        }
      }
    }
  }
  return [...new Set(bp.map((t) => +t.toPrecision(15)))].sort((x, y) => x - y);
}

/**
 * Transitorio di un circuito di ordine qualsiasi. Il primo campione (t = 0)
 * è la soluzione a t = 0⁺ (continuità di vC e iL). Dopo ogni discontinuità il
 * primo passo è di Eulero implicito, così i trapezi non oscillano.
 */
export function transient(input: AnyNetlist, opts: TransientOptions): TransientResult {
  const net = prepare(input);
  const { tEnd } = opts;
  if (!(tEnd > 0)) throw new CircuitError('tEnd deve essere positivo');
  const dt = opts.dt ?? tEnd / 2000;
  const method = opts.method ?? 'trap';
  const ix = indexSystem(net);
  const caps = net.elements.filter((e): e is ElementOf<'C'> => e.type === 'C');
  const inds = net.elements.filter((e): e is ElementOf<'L'> => e.type === 'L');

  // --- stato iniziale (t = 0⁻)
  const state: TranState = { cap: new Map(), ind: new Map() };
  const initial = opts.initial ?? 'steady';
  let ss: SteadyState | undefined;
  if (initial === 'steady') ss = steadyState(net, { when: 'before', t: -Number.MIN_VALUE });
  for (const c of caps)
    state.cap.set(c.id, {
      v: initial === 'steady' ? ss!.vd(c.a, c.b, 0) : initial === 'ic' ? (c.v0 ?? 0) : 0,
      i: 0,
    });
  for (const l of inds)
    state.ind.set(l.id, {
      i: initial === 'steady' ? ss!.i(l.id, 0) : initial === 'ic' ? (l.i0 ?? 0) : 0,
      v: 0,
    });

  // --- campioni
  const bps = breakpoints(net, tEnd);
  const times: number[] = [];
  const sols: CVector[] = [];
  const capI: Map<string, number[]> = new Map(caps.map((c) => [c.id, []]));
  const extraIdx = new Map<string, number>();
  {
    let k = ix.size;
    for (const c of caps) extraIdx.set(c.id, k++);
  }

  const srcAt =
    (t: number) =>
    (e: Source): Complex =>
      Complex.from(sourceAt(net, e, t));

  /** Soluzione algebrica con vC e iL fissati (istante t⁺). */
  const algebraic = (t: number): void => {
    const frozen = {
      cap: new Map([...state.cap].map(([id, s]) => [id, s.v])),
      ind: new Map([...state.ind].map(([id, s]) => [id, s.i])),
    };
    const asm = new Assembler(
      net,
      ix,
      { src: srcAt(t), t, gmin: 0, frozen, s: Complex.ZERO },
      true,
      extraIdx,
    );
    asm.stamp();
    let x: CVector;
    try {
      x = new LU(asm.M!).solve(asm.rhs);
    } catch (err) {
      if (!(err instanceof SingularMatrixError)) throw err;
      const asm2 = new Assembler(
        net,
        ix,
        { src: srcAt(t), t, gmin: 1e-12, frozen, s: Complex.ZERO },
        true,
        extraIdx,
      );
      asm2.stamp();
      x = new LU(asm2.M!).solve(asm2.rhs);
    }
    // correnti dei condensatori e tensioni degli induttori a t⁺
    for (const c of caps) state.cap.get(c.id)!.i = x.re[extraIdx.get(c.id)!]!;
    const vOf = (n: string): number => (n === GROUND ? 0 : x.re[ix.nodeIdx.get(n)!]!);
    for (const l of inds) state.ind.get(l.id)!.v = vOf(l.a) - vOf(l.b);
    // vettore ridotto alle incognite del sistema dinamico
    const y = new CVector(ix.size);
    y.re.set(x.re.subarray(0, ix.size));
    times.push(t);
    sols.push(y);
    for (const c of caps) capI.get(c.id)!.push(state.cap.get(c.id)!.i);
  };

  const luCache = new Map<string, LU>();
  const swKey = (t: number): string =>
    net.elements
      .filter((e): e is ElementOf<'SW'> => e.type === 'SW')
      .map((e) => (switchClosed(e, t) ? '1' : '0'))
      .join('');

  const step = (t1: number, h: number, m: 'be' | 'trap'): void => {
    const ctx: StampCtx = { tran: { h, method: m, state }, src: srcAt(t1), t: t1, gmin: 0 };
    const key = `${h.toPrecision(12)}|${m}|${swKey(t1)}`;
    let lu = luCache.get(key);
    const asm = new Assembler(net, ix, ctx, !lu, new Map());
    asm.stamp();
    if (!lu) {
      try {
        lu = new LU(asm.M!);
      } catch (err) {
        if (!(err instanceof SingularMatrixError)) throw err;
        throw new CircuitError(
          'Sistema singolare nel transitorio: controllare nodi isolati da interruttori aperti o maglie di soli generatori.',
        );
      }
      if (luCache.size > 64) luCache.clear();
      luCache.set(key, lu);
    }
    const x = lu.solve(asm.rhs);
    const vOf = (n: string): number => (n === GROUND ? 0 : x.re[ix.nodeIdx.get(n)!]!);
    // aggiorna lo stato (correnti dei C dal modello compagno)
    for (const c of caps) {
      const st = state.cap.get(c.id)!;
      const g = ((m === 'be' ? 1 : 2) * c.value) / h;
      const v = vOf(c.a) - vOf(c.b);
      const i = m === 'be' ? g * (v - st.v) : g * (v - st.v) - st.i;
      st.v = v;
      st.i = i;
      capI.get(c.id)!.push(i);
    }
    for (const l of inds) {
      const st = state.ind.get(l.id)!;
      st.i = x.re[ix.branch.get(l.id)![0]!]!;
      st.v = vOf(l.a) - vOf(l.b);
    }
    times.push(t1);
    sols.push(x);
  };

  // t = 0⁺
  algebraic(0);
  let t = 0;
  let afterDisc = true;
  const segEnds = [...bps, tEnd];
  for (const tSeg of segEnds) {
    while (t < tSeg - dt * 1e-9) {
      const h = Math.min(dt, tSeg - t);
      const t1 = tSeg - t - h < dt * 1e-6 ? tSeg : t + h;
      step(t1, t1 - t, afterDisc || method === 'be' ? 'be' : 'trap');
      afterDisc = false;
      t = t1;
    }
    if (tSeg < tEnd) {
      // discontinuità: nuova soluzione algebrica a t⁺ (stesso istante, valori dopo il salto)
      algebraic(tSeg);
      afterDisc = true;
    }
  }

  const T = Float64Array.from(times);
  const series = (f: (x: CVector, k: number) => number): Float64Array =>
    Float64Array.from(sols, (x, k) => f(x, k));
  const nodeIdx = (node: string | number): number => {
    const n = normNode(node);
    if (n === GROUND) return -1;
    const k = ix.nodeIdx.get(n);
    if (k === undefined) throw new CircuitError(`nodo inesistente: ${n}`);
    return k;
  };
  const vSeries = (node: string | number): Float64Array => {
    const k = nodeIdx(node);
    return series((x) => (k < 0 ? 0 : x.re[k]!));
  };
  const vdSeries = (a: string | number, b: string | number = GROUND): Float64Array => {
    const ka = nodeIdx(a);
    const kb = nodeIdx(b);
    return series((x) => (ka < 0 ? 0 : x.re[ka]!) - (kb < 0 ? 0 : x.re[kb]!));
  };
  const iSeries = (id: string): Float64Array => {
    const e = net.elements.find((q) => q.id === id);
    if (!e) throw new CircuitError(`elemento inesistente: ${id}`);
    if (e.type === 'C') return Float64Array.from(capI.get(id)!);
    const br = ix.branch.get(id);
    if (br) return series((x) => x.re[br[0]!]!);
    const vab = (a: string, b: string): Float64Array => vdSeries(a, b);
    switch (e.type) {
      case 'R': {
        const v = vab(e.a, e.b);
        return v.map((q) => q / e.value);
      }
      case 'I':
        return Float64Array.from(T, (tt) => sourceAt(net, e, tt));
      case 'G': {
        const v = vab(e.cp, e.cn);
        return v.map((q) => q * e.gain);
      }
      case 'F': {
        const c = iSeries(e.ctrl);
        return c.map((q) => q * e.gain);
      }
      case 'VM':
        return new Float64Array(T.length);
      case 'P': {
        // doppio bipolo Y: i1 = y11 v1 + y12 v2
        const p = e as ElementOf<'P'>;
        const v1 = vab(p.p1a, p.p1b);
        const v2 = vab(p.p2a, p.p2b);
        return v1.map((q, k) => p.m[0][0] * q + p.m[0][1] * v2[k]!);
      }
      default:
        throw new CircuitError(`corrente non disponibile per ${id}`);
    }
  };
  return {
    t: T,
    v: vSeries,
    vd: vdSeries,
    i: iSeries,
    at(s: Float64Array, tq: number): number {
      if (tq <= T[0]!) return s[0]!;
      // ricerca binaria; con campioni duplicati (discontinuità) prende il valore dopo
      let lo = 0;
      let hi = T.length - 1;
      if (tq >= T[hi]!) return s[hi]!;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (T[mid]! <= tq) lo = mid;
        else hi = mid;
      }
      const t0 = T[lo]!;
      const t1 = T[hi]!;
      return t1 === t0 ? s[hi]! : s[lo]! + ((s[hi]! - s[lo]!) * (tq - t0)) / (t1 - t0);
    },
  };
}

// ------------------------------------------------------------------ primo ordine in forma chiusa

export interface FirstOrder {
  /** Elemento con memoria (C o L). */
  element: string;
  /** Costante di tempo τ [s]. */
  tau: number;
  /** Resistenza equivalente vista dall'elemento a generatori spenti [Ω]. */
  req: number;
  /** Valore a t = 0⁺ della grandezza richiesta. */
  y0: number;
  /** Regime finale della grandezza (funzione del tempo; costante se in continua). */
  yss: (t: number) => number;
  /** y(t) = y_ss(t) + [y(0⁺) − y_ss(0⁺)]·e^(−t/τ), per t ≥ 0. */
  at: (t: number) => number;
}

/**
 * Transitorio del primo ordine in forma chiusa (un solo C o L; commutazione a
 * t = 0). Le condizioni iniziali sono il regime per t < 0 (continua e/o
 * sinusoidi); il regime finale può essere continuo o sinusoidale.
 * L'uscita di default è la variabile di stato (vC o iL).
 */
export function firstOrder(input: AnyNetlist, out?: Output): FirstOrder {
  const net = prepare(input);
  const mem = net.elements.filter((e) => e.type === 'C' || e.type === 'L');
  if (mem.length !== 1)
    throw new CircuitError(`serve esattamente un elemento con memoria (trovati ${mem.length})`);
  const el = mem[0] as ElementOf<'C'> | ElementOf<'L'>;
  const output: Output = out ?? (el.type === 'C' ? { v: el.a, ref: el.b } : { i: el.id });
  // stato a 0⁻ (regime precedente) → continuità
  const before = steadyState(net, { when: 'before', t: -Number.MIN_VALUE });
  const x0 = el.type === 'C' ? before.vd(el.a, el.b, 0) : before.i(el.id, 0);
  // y(0⁺): soluzione algebrica con l'elemento sostituito da un generatore
  const frozen = { cap: new Map<string, number>(), ind: new Map<string, number>() };
  if (el.type === 'C') frozen.cap.set(el.id, x0);
  else frozen.ind.set(el.id, x0);
  const sol0 = solveSystem(net, {
    s: Complex.ZERO,
    src: (e) => Complex.from(sourceAt(net, e, 0)),
    t: 0,
    frozen,
    omega: 0,
  });
  const y0 = readOutput(sol0, output).re;
  // regime finale
  const after = steadyState(net, { when: 'after', t: Infinity });
  const yss = (t: number): number =>
    'i' in output ? after.i(output.i, t) : after.vd(output.v, output.ref ?? GROUND, t);
  // resistenza equivalente vista dall'elemento (generatori spenti, configurazione finale)
  const rest: Netlist = { ...net, elements: net.elements.filter((e) => e.id !== el.id) };
  PARSED.add(rest);
  const eq = thevenin(rest, el.a, el.b, { dc: true, t: Infinity });
  const zr = eq.zth;
  const req = zr instanceof Complex ? zr.re : zr;
  const tau = el.type === 'C' ? req * el.value : el.value / req;
  if (!(tau > 0) || !Number.isFinite(tau))
    throw new CircuitError(`costante di tempo non valida (Req = ${req})`);
  const k = y0 - yss(0);
  return { element: el.id, tau, req, y0, yss, at: (t) => yss(t) + k * Math.exp(-t / tau) };
}
