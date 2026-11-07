/**
 * Soluzione esatta dell'esercizio d'analisi «determinare v_out(t) per tutto l'asse dei tempi»:
 * t<0 regime (continua e/o sinusoidale a ω0, sovrapposizione); t>0 generatori indipendenti spenti,
 * un solo elemento con memoria, v_out(t) = K e^{−t/τ}.
 */
import { Rational } from './rational';
import { Cx } from './complex';
import { solve, thevenin } from './mna';
import { byId, clone, type Circuit, type Element } from './netlist';

export class InvalidInstance extends Error {
  constructor(m: string) {
    super(m);
    this.name = 'InvalidInstance';
  }
}

export interface Instance {
  template: 'A' | 'B' | 'C';
  variant: string;
  level: 1 | 2 | 3;
  circuit: Circuit;
  out: [string, string];
  memory: string;
  omega: Rational | null;
}

export interface AnalysisSolution {
  pre: { dc: Rational; cos: Rational; sin: Rational; omega: Rational | null; phasor: Cx };
  x0: Rational;
  xKind: 'vC' | 'iL';
  xDc: Rational;
  xAc: Cx;
  req: Rational;
  tau: Rational;
  k: Rational;
  hasAc: boolean;
  hasDc: boolean;
  omega: Rational | null;
}

const isSource = (e: Element): e is Element & { type: 'V' | 'I' } => e.type === 'V' || e.type === 'I';

export function analyze(inst: Instance): AnalysisSolution {
  const { circuit, out, memory } = inst;
  const mem = byId(circuit, memory);
  if (!mem || (mem.type !== 'C' && mem.type !== 'L'))
    throw new InvalidInstance('elemento di memoria assente');
  if (circuit.elements.filter((e) => e.type === 'C' || e.type === 'L').length !== 1)
    throw new InvalidInstance('serve un solo elemento con memoria');
  const omega = inst.omega;
  const hasAc = circuit.elements.some((e) => isSource(e) && !e.wave.ac.isZero());
  if (hasAc && !omega) throw new InvalidInstance('generatore sinusoidale senza ω0');
  const xOf = (sol: ReturnType<typeof solve>) =>
    mem.type === 'C' ? sol.vd(mem.a, mem.b) : (sol.i(mem.id) as Cx);
  const dc = solve(circuit, { s: 0, source: (e) => Cx.from(e.wave.dc) });
  const vDc = dc.vd(out[0], out[1]);
  const xDc = xOf(dc);
  let vAc = Cx.ZERO;
  let xAc = Cx.ZERO;
  if (hasAc) {
    const ac = solve(circuit, { s: new Cx(0, omega!), source: (e) => e.wave.ac });
    vAc = ac.vd(out[0], out[1]);
    xAc = xOf(ac);
  }
  if (!vDc.isReal() || !xDc.isReal()) throw new InvalidInstance('soluzione continua non reale');
  const pre = { dc: vDc.re, cos: vAc.re, sin: vAc.im.neg(), omega, phasor: vAc };
  const x0 = xDc.re.add(xAc.re);
  const th = thevenin(circuit, mem.a, mem.b, { without: mem.id, s: 0 });
  const req = th.zth;
  if (!req.isReal() || req.re.sign() <= 0) throw new InvalidInstance('Req non positiva');
  const tau = mem.type === 'C' ? req.re.mul(mem.c) : Rational.from(mem.l).div(req.re);
  const post = clone(circuit);
  const i = post.elements.findIndex((e) => e.id === mem.id);
  post.elements[i] =
    mem.type === 'C'
      ? { id: mem.id, type: 'V', a: mem.a, b: mem.b, wave: { dc: x0, ac: Cx.ZERO } }
      : { id: mem.id, type: 'I', a: mem.a, b: mem.b, wave: { dc: x0, ac: Cx.ZERO } };
  const p = solve(post, { s: 0, source: (e) => (e.id === mem.id ? Cx.from(x0) : Cx.ZERO) });
  const k = p.vd(out[0], out[1]);
  if (!k.isReal()) throw new InvalidInstance('K non reale');
  return {
    pre,
    x0,
    xKind: mem.type === 'C' ? 'vC' : 'iL',
    xDc: xDc.re,
    xAc,
    req: req.re,
    tau,
    k: k.re,
    hasAc,
    omega,
    hasDc: circuit.elements.some((e) => isSource(e) && !e.wave.dc.isZero()),
  };
}

/** Valore numerico della soluzione esatta al tempo t (per t = 0 si usa il regime precedente). */
export function evalSolution(sol: AnalysisSolution, t: number): number {
  if (t < 0) {
    const w = sol.pre.omega ? sol.pre.omega.toNumber() : 0;
    return (
      sol.pre.dc.toNumber() +
      sol.pre.cos.toNumber() * Math.cos(w * t) +
      sol.pre.sin.toNumber() * Math.sin(w * t)
    );
  }
  return sol.k.toNumber() * Math.exp(-t / sol.tau.toNumber());
}

/** Verifica con Laplace: V_out(s0) con il generatore equivalente della condizione iniziale = K/(s0+1/τ). */
export function laplaceCheck(inst: Instance, sol: AnalysisSolution, s0: Rational = Rational.ONE) {
  const circuit = clone(inst.circuit);
  const mem = circuit.elements.find((e) => e.id === inst.memory)!;
  if (mem.type === 'C') mem.v0 = sol.x0;
  else if (mem.type === 'L') mem.i0 = sol.x0;
  const r = solve(circuit, { s: Cx.from(s0), source: () => Cx.ZERO, init: true });
  const got = r.vd(inst.out[0], inst.out[1]);
  const want = Cx.from(sol.k.div(s0.add(sol.tau.inv())));
  return { got, want, ok: got.eq(want) };
}
