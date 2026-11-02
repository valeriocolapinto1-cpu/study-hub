// Parti comuni ai template: generatori d'ingresso e valori «belli».
import { Rational } from '../rational.js';
import { Cx } from '../complex.js';
import { wave } from '../solver/netlist.js';

export const R_ = (x) => Rational.from(x);
export const RAIL = 80, GND = 200, TOP = 40;

/** Generatori d'ingresso per livello: 1 continua, 2 sinusoidale, 3 mista (uno in serie all'altro). */
export function sources(rng, level) {
  const amp = () => rng.int(1, 8);
  const acVal = () => (rng.chance(0.5) ? new Cx(amp(), 0) : new Cx(0, -amp())); // cos(ωt) oppure sin(ωt)
  if (level === 1) return [{ id: 'V1', wave: wave(rng.nz(9), 0) }];
  if (level === 2) return [{ id: 'V1', wave: wave(0, acVal()) }];
  return [{ id: 'V1', wave: wave(rng.nz(9), 0) }, { id: 'V2', wave: wave(0, acVal()) }];
}
/** Aggiunge i generatori d'ingresso (uno o due in serie) al circuito e al layout; il nodo d'ingresso è «in» a x=40. */
export function addInput(el, L, srcs) {
  if (srcs.length === 1) {
    el.push({ id: 'V1', type: 'V', a: 'in', b: '0', wave: srcs[0].wave });
    L.term['V1.a'] = [40, RAIL]; L.term['V1.b'] = [40, GND];
  } else {
    el.push({ id: 'V1', type: 'V', a: 'in', b: 'm', wave: srcs[0].wave }, { id: 'V2', type: 'V', a: 'm', b: '0', wave: srcs[1].wave });
    L.term['V1.a'] = [40, RAIL]; L.term['V1.b'] = [40, 140]; L.term['V2.a'] = [40, 140]; L.term['V2.b'] = [40, GND];
    L.paths.m = [[40, 140]];
  }
  L.paths.in = [[40, RAIL]];
}
export const newLayout = () => ({ nodes: {}, term: {}, paths: {}, labels: [], width: 480, height: 240 });
/** Matrice 2×2 di interi piccoli con determinante non nullo. */
export function matrix2(rng, { reciprocal = false } = {}) {
  for (;;) {
    const m = [[rng.int(1, 4), rng.int(0, 3)], [rng.int(0, 3), rng.int(1, 4)]];
    if (reciprocal) m[1][0] = m[0][1];
    if (m[0][0] * m[1][1] - m[0][1] * m[1][0] !== 0) return m.map((r) => r.map((x) => R_(x)));
  }
}
