// Template C: trasformatore ideale n:1 con equazioni di maglia (v1 = n v2, i1 = -i2/n).
// Livello 3: generatore controllato a valle e nullore a monte.
import { sources, addInput, newLayout, R_, RAIL, GND } from './common.js';

export const VARIANTS = ['t_rc', 't_rl'];
export const VARIANT_INFO = {
  t_rc: 'Trasformatore ideale con carico RC',
  t_rl: 'Trasformatore ideale con carico RL',
};

export function build(rng, { level = 1, variant } = {}) {
  const v = variant || rng.pick(VARIANTS);
  const omega = level === 1 ? null : R_(rng.pick([1, 2, 3]));
  const el = [], L = newLayout();
  addInput(el, L, sources(rng, level));
  const r = () => R_(rng.int(1, 5)), cap = () => R_(rng.int(1, 3));
  const useL = v === 't_rl';
  const memory = useL ? 'L1' : 'C1';
  const n = R_(rng.pick([2, 3, 4, '1/2', '3/2', '2/3']));
  let x0 = 130;
  if (level === 3) {
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
  el.push({ id: 'T1', type: 'T', p1a: 'p1', p1b: '0', p2a: 'q', p2b: '0', n });
  Object.assign(L.term, { 'T1.p1a': [x0, RAIL], 'T1.p1b': [x0, GND], 'T1.p2a': [x1, RAIL], 'T1.p2b': [x1, GND] });
  L.paths.p1 = [[x0, RAIL]]; L.paths.q = [[x1, RAIL]];
  const xo = x1 + 100, xr = xo + 100;
  el.push({ id: 'R2', type: 'R', a: 'q', b: 'o', r: r() });
  el.push(useL ? { id: 'L1', type: 'L', a: 'o', b: '0', l: cap() } : { id: 'C1', type: 'C', a: 'o', b: '0', c: cap() });
  el.push({ id: 'R3', type: 'R', a: 'o', b: '0', r: r() });
  Object.assign(L.term, { 'R2.a': [x1, RAIL], 'R2.b': [xo, RAIL], [`${memory}.a`]: [xo, RAIL], [`${memory}.b`]: [xo, GND], 'R3.a': [xr, RAIL], 'R3.b': [xr, GND] });
  L.paths.o = [[xo, RAIL], [xr, RAIL]];
  let xend = xr;
  if (level === 3) {
    const xg = xr + 100;
    el.push({ id: 'G1', type: 'G', a: '0', b: 'o', cp: 'q', cn: '0', gm: R_(rng.pick(['1/2', '1/3', '1/4', '1', '-1/4'])) });
    Object.assign(L.term, { 'G1.a': [xg, GND], 'G1.b': [xg, RAIL] });
    L.paths.o = [[xo, RAIL], [xg, RAIL]]; L.ctrl = { G1: [x1, RAIL] }; xend = xg;
  }
  // con l'induttore l'uscita ai suoi capi sarebbe nulla in continua: si misura la tensione su R2 (da q a o)
  const out = useL ? ['q', 'o'] : ['o', '0'];
  L.width = xend + 40; L.out = useL ? [x1, RAIL] : [xo, RAIL]; if (useL) L.outRef = [xo, RAIL];
  return { template: 'C', variant: v, level, circuit: { elements: el }, out, memory, omega, layout: L };
}
