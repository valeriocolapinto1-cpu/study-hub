// Template B: doppio bipolo descritto da matrice Z o Y + resto del circuito (da ridurre con Thevenin/Norton).
// Livello 3: nullore (invertente) a monte e generatore controllato a valle.
import { Rational } from '../rational.js';
import { sources, addInput, newLayout, matrix2, R_, RAIL, GND } from './common.js';

export const VARIANTS = ['z', 'y'];
export const VARIANT_INFO = {
  z: 'Doppio bipolo con matrice Z + Thevenin',
  y: 'Doppio bipolo con matrice Y + Norton',
};

export function build(rng, { level = 1, variant } = {}) {
  const v = variant || rng.pick(VARIANTS);
  const omega = level === 1 ? null : R_(rng.pick([1, 2, 3]));
  const el = [], L = newLayout();
  addInput(el, L, sources(rng, level));
  const r = () => R_(rng.int(1, 5)), cap = () => R_(rng.int(1, 3));
  const useL = level > 1 && rng.chance(0.25);
  const memory = useL ? 'L1' : 'C1';
  const mem = (a, b) => (useL ? { id: 'L1', type: 'L', a, b, l: cap() } : { id: 'C1', type: 'C', a, b, c: cap() });
  const m = matrix2(rng, { reciprocal: v === 'z' && rng.chance(0.5) });
  const front = level === 3; // nullore a monte
  let x0 = 130; // ascissa dell'ingresso del doppio bipolo
  if (front) {
    el.push({ id: 'Rn', type: 'R', a: 'in', b: 'x', r: r() }, { id: 'N1', type: 'N', na: 'x', nb: '0', ra: 'y', rb: '0' }, { id: 'Rf', type: 'R', a: 'x', b: 'y', r: r() });
    Object.assign(L.term, { 'Rn.a': [40, RAIL], 'Rn.b': [130, RAIL], 'N1.na': [130, RAIL], 'N1.nb': [130, GND], 'N1.ra': [260, RAIL], 'N1.rb': [260, GND], 'Rf.a': [130, RAIL], 'Rf.b': [260, RAIL] });
    Object.assign(L.paths, { x: [[130, RAIL]], y: [[260, RAIL]] });
    el.push({ id: 'R1', type: 'R', a: 'y', b: 'p1', r: r() });
    L.term['R1.a'] = [260, RAIL]; L.term['R1.b'] = [350, RAIL]; x0 = 350;
  } else {
    el.push({ id: 'R1', type: 'R', a: 'in', b: 'p1', r: r() });
    L.term['R1.a'] = [40, RAIL]; L.term['R1.b'] = [130, RAIL];
  }
  const x1 = x0 + 140;
  el.push({ id: 'P1', type: 'P', kind: v === 'z' ? 'Z' : 'Y', p1a: 'p1', p1b: '0', p2a: 'p2', p2b: '0', m });
  Object.assign(L.term, { 'P1.p1a': [x0, RAIL], 'P1.p1b': [x0, GND], 'P1.p2a': [x1, RAIL], 'P1.p2b': [x1, GND] });
  L.paths.p1 = [[x0, RAIL]]; L.paths.p2 = [[x1, RAIL]];
  const xo = x1 + 100, xr = xo + 100;
  el.push({ id: 'R2', type: 'R', a: 'p2', b: 'o', r: r() }, mem('o', '0'));
  Object.assign(L.term, { 'R2.a': [x1, RAIL], 'R2.b': [xo, RAIL], [`${memory}.a`]: [xo, RAIL], [`${memory}.b`]: [xo, GND] });
  L.paths.o = [[xo, RAIL]];
  let xend = xo;
  if (!front) {
    el.push({ id: 'R3', type: 'R', a: 'o', b: '0', r: r() });
    Object.assign(L.term, { 'R3.a': [xr, RAIL], 'R3.b': [xr, GND] });
    L.paths.o = [[xo, RAIL], [xr, RAIL]]; xend = xr;
  } else {
    // generatore controllato in parallelo all'uscita: VCCS pilotata da v(p2), corrente iniettata in «o»
    const xg = xo + 100;
    el.push({ id: 'G1', type: 'G', a: '0', b: 'o', cp: 'p2', cn: '0', gm: R_(rng.pick(['1/2', '1/3', '1/4', '1', '-1/4'])) });
    Object.assign(L.term, { 'G1.a': [xg, GND], 'G1.b': [xg, RAIL] });
    L.paths.o = [[xo, RAIL], [xg, RAIL]]; L.ctrl = { G1: [x1, RAIL] }; xend = xg;
  }
  L.width = xend + 40; L.out = [xo, RAIL];
  return { template: 'B', variant: v, level, circuit: { elements: el }, out: ['o', '0'], memory, omega, layout: L };
}
export { Rational };
