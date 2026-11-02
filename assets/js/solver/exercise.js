// Soluzione esatta dell'esercizio «determinare v_out(t) per tutto l'asse dei tempi».
//   t<0: regime (continua e/o sinusoidale a ω0, sovrapposizione); t>0: generatori indipendenti spenti,
//   un solo elemento con memoria: v_out(t)=K e^{-t/τ}.
import { Rational } from '../rational.js';
import { Cx } from '../complex.js';
import { solve } from './mna.js';
import { thevenin } from './network.js';
import { byId, clone, wave } from './netlist.js';

const ZERO = Cx.ZERO;

export class InvalidInstance extends Error { constructor(m) { super(m); this.name = 'InvalidInstance'; } }

/** inst = { circuit, out: [nodoA, nodoB], memory: id, omega: Rational|null } */
export function analyze(inst) {
  const { circuit, out, memory } = inst;
  const mem = byId(circuit, memory);
  if (!mem || (mem.type !== 'C' && mem.type !== 'L')) throw new InvalidInstance('elemento di memoria assente');
  if (circuit.elements.filter((e) => e.type === 'C' || e.type === 'L').length !== 1) throw new InvalidInstance('serve un solo elemento con memoria');
  const omega = inst.omega ? Rational.from(inst.omega) : null;
  const hasAc = circuit.elements.some((e) => (e.type === 'V' || e.type === 'I') && !e.wave.ac.isZero());
  if (hasAc && !omega) throw new InvalidInstance('generatore sinusoidale senza ω0');

  const xOf = (sol) => (mem.type === 'C' ? sol.vd(mem.a, mem.b) : sol.i(mem.id));
  // t<0, componente continua (C aperto, L corto: s=0)
  const dc = solve(circuit, { s: 0, source: (e) => Cx.from(e.wave.dc) });
  const vDc = dc.vd(out[0], out[1]);
  const xDc = xOf(dc);
  // t<0, componente sinusoidale (fasori a jω0)
  let vAc = ZERO, xAc = ZERO, acSol = null;
  if (hasAc) {
    acSol = solve(circuit, { s: new Cx(0, omega), source: (e) => e.wave.ac });
    vAc = acSol.vd(out[0], out[1]);
    xAc = xOf(acSol);
  }
  if (!vDc.isReal() || !xDc.isReal()) throw new InvalidInstance('soluzione continua non reale');
  const pre = { dc: vDc.re, cos: vAc.re, sin: vAc.im.neg(), omega, phasor: vAc };
  // Condizione iniziale: valore a t=0 di x(t) = x_dc + Re{X e^{jωt}}
  const x0 = xDc.re.add(xAc.re);
  // Equivalente visto dal bipolo di memoria (generatori indipendenti spenti)
  const th = thevenin(circuit, mem.a, mem.b, { without: mem.id, s: 0 });
  const req = th.zth;
  if (!req.isReal() || req.re.sign() <= 0) throw new InvalidInstance('Req non positiva');
  const tau = mem.type === 'C' ? req.re.mul(mem.c) : Rational.from(mem.l).div(req.re);
  // t>0: generatori indipendenti spenti, memoria sostituita dalla condizione iniziale.
  const post = clone(circuit);
  const i = post.elements.findIndex((e) => e.id === mem.id);
  post.elements[i] = mem.type === 'C'
    ? { id: mem.id, type: 'V', a: mem.a, b: mem.b, wave: wave(x0) }
    : { id: mem.id, type: 'I', a: mem.a, b: mem.b, wave: wave(x0) };
  const p = solve(post, { s: 0, source: (e) => (e.id === mem.id ? Cx.from(x0) : ZERO) });
  const k = p.vd(out[0], out[1]);
  if (!k.isReal()) throw new InvalidInstance('K non reale');
  return {
    pre, x0, xKind: mem.type === 'C' ? 'vC' : 'iL', xDc: xDc.re, xAc,
    req: req.re, tau, k: k.re, hasAc, omega,
    hasDc: circuit.elements.some((e) => (e.type === 'V' || e.type === 'I') && !e.wave.dc.isZero()),
    post: { k: k.re, tau },
    thevenin: { vth: th.vth, zth: th.zth },
  };
}

/** Valore numerico (float) della soluzione esatta al tempo t. */
export function evalSolution(sol, t) {
  if (t < 0) {
    const w = sol.pre.omega ? sol.pre.omega.toNumber() : 0;
    return sol.pre.dc.toNumber() + sol.pre.cos.toNumber() * Math.cos(w * t) + sol.pre.sin.toNumber() * Math.sin(w * t);
  }
  return sol.post.k.toNumber() * Math.exp(-t / sol.post.tau.toNumber());
}

/** Verifica via Laplace: V_out(s0) con generatore equivalente della condizione iniziale deve valere K/(s0+1/τ). */
export function laplaceCheck(inst, sol, s0 = Rational.from(1)) {
  const circuit = clone(inst.circuit);
  const mem = circuit.elements.find((e) => e.id === inst.memory);
  if (mem.type === 'C') mem.v0 = sol.x0; else mem.i0 = sol.x0;
  const r = solve(circuit, { s: Cx.from(s0), source: () => ZERO, init: true });
  const got = r.vd(inst.out[0], inst.out[1]);
  const want = sol.post.k.div(s0.add(sol.post.tau.inv()));
  return { got, want, ok: got.eq(want) };
}
