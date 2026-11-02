// Thevenin / Norton visti da una porta, con generatore di prova.
import { Cx } from '../complex.js';
import { solve } from './mna.js';
import { clone, wave } from './netlist.js';

/** Equivalente visto ai nodi (a,b) del circuito privato dell'elemento `without` (se dato). s: variabile di Laplace. */
export function thevenin(circuit, a, b, { without = null, s = 0, source } = {}) {
  const c0 = clone(circuit);
  if (without) c0.elements = c0.elements.filter((e) => e.id !== without);
  const full = solve(c0, { s, source });
  const vth = full.vd(a, b);
  // Impedenza: generatori indipendenti spenti, generatore di prova da 1 A che entra in `a` ed esce da `b`.
  const off = clone(c0);
  off.elements.push({ id: '_test', type: 'I', a: b, b: a, wave: wave(1) });
  const t = solve(off, { s, source: (e) => (e.id === '_test' ? Cx.ONE : Cx.ZERO) });
  const zth = t.vd(a, b);
  return { vth, zth, isc: zth.isZero() ? null : vth.div(zth) };
}
