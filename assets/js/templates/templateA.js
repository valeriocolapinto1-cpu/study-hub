// Template A: nullore (amplificatore operazionale ideale) come generatore di tensione o di corrente,
// rete resistiva e un solo elemento con memoria. Il disegno (layout) legge la STESSA netlist del solutore.
import { Rational } from '../rational.js';
import { Cx } from '../complex.js';
import { wave } from '../solver/netlist.js';
import { sources } from './common.js';

export const VARIANTS = ['inv_rc', 'inv_fb', 'inv_l', 'v2i'];
export const VARIANT_INFO = {
  inv_rc: 'Nullore come generatore di tensione (invertente) con carico RC',
  inv_fb: 'Nullore come generatore di tensione con elemento di memoria in retroazione',
  inv_l: 'Nullore come generatore di tensione con induttore in serie all\'ingresso',
  v2i: 'Nullore come generatore di corrente (convertitore tensione-corrente) su carico R ∥ memoria',
};

const R_ = (x) => Rational.from(x);
const RAIL = 80, GND = 200, TOP = 40;

/** Costruisce l'istanza (netlist + metadati di layout). Non verifica la «bellezza»: lo fa il generatore. */
export function build(rng, { level = 1, variant } = {}) {
  const v = variant || rng.pick(level === 1 ? ['inv_rc', 'inv_fb', 'inv_l', 'v2i'] : VARIANTS);
  const omega = level === 1 ? null : R_(rng.pick([1, 2, 3]));
  const srcs = sources(rng, level, omega);
  const el = [];
  const L = { nodes: {}, term: {}, paths: {}, labels: [], width: 480, height: 240 };
  // generatori in ingresso (uno o due in serie)
  if (srcs.length === 1) {
    el.push({ id: 'V1', type: 'V', a: 'in', b: '0', wave: srcs[0].wave });
    L.term['V1.a'] = [40, RAIL]; L.term['V1.b'] = [40, GND];
  } else {
    el.push({ id: 'V1', type: 'V', a: 'in', b: 'm', wave: srcs[0].wave }, { id: 'V2', type: 'V', a: 'm', b: '0', wave: srcs[1].wave });
    L.term['V1.a'] = [40, RAIL]; L.term['V1.b'] = [40, 140]; L.term['V2.a'] = [40, 140]; L.term['V2.b'] = [40, GND];
    L.paths.m = [[40, 140]];
  }
  L.paths.in = [[40, RAIL]];
  const r = () => R_(rng.int(1, 6));
  const cap = () => R_(rng.int(1, 3));
  let memory, out;
  if (v === 'inv_rc') {
    memory = 'C1'; out = ['o', '0'];
    const big = level === 3;
    el.push({ id: 'R1', type: 'R', a: 'in', b: 'x', r: r() }, { id: 'N1', type: 'N', na: 'x', nb: '0', ra: 'y', rb: '0' }, { id: 'Rf', type: 'R', a: 'x', b: 'y', r: r() });
    if (!big) {
      el.push({ id: 'Ra', type: 'R', a: 'y', b: 'o', r: r() }, { id: 'C1', type: 'C', a: 'o', b: '0', c: cap() }, { id: 'Rb', type: 'R', a: 'o', b: '0', r: r() });
      Object.assign(L.term, { 'R1.a': [40, RAIL], 'R1.b': [130, RAIL], 'N1.na': [130, RAIL], 'N1.nb': [130, GND], 'N1.ra': [260, RAIL], 'N1.rb': [260, GND],
        'Rf.a': [130, RAIL], 'Rf.b': [260, RAIL], 'Ra.a': [260, RAIL], 'Ra.b': [350, RAIL], 'C1.a': [350, RAIL], 'C1.b': [350, GND], 'Rb.a': [450, RAIL], 'Rb.b': [450, GND] });
      Object.assign(L.paths, { x: [[130, RAIL]], y: [[260, RAIL]], o: [[350, RAIL], [450, RAIL]] });
      L.out = [350, RAIL]; L.width = 520;
    } else {
      el.push({ id: 'Ra', type: 'R', a: 'y', b: 'p', r: r() }, { id: 'Rb', type: 'R', a: 'p', b: '0', r: r() }, { id: 'Rc', type: 'R', a: 'p', b: 'o', r: r() }, { id: 'C1', type: 'C', a: 'o', b: '0', c: cap() });
      Object.assign(L.term, { 'R1.a': [40, RAIL], 'R1.b': [130, RAIL], 'N1.na': [130, RAIL], 'N1.nb': [130, GND], 'N1.ra': [260, RAIL], 'N1.rb': [260, GND],
        'Rf.a': [130, RAIL], 'Rf.b': [260, RAIL], 'Ra.a': [260, RAIL], 'Ra.b': [350, RAIL], 'Rb.a': [350, RAIL], 'Rb.b': [350, GND], 'Rc.a': [350, RAIL], 'Rc.b': [460, RAIL], 'C1.a': [460, RAIL], 'C1.b': [460, GND] });
      Object.assign(L.paths, { x: [[130, RAIL]], y: [[260, RAIL]], p: [[350, RAIL]], o: [[460, RAIL]] });
      L.width = 560; L.out = [460, RAIL];
    }
  } else if (v === 'inv_fb') {
    memory = 'C1'; out = ['y', '0'];
    el.push({ id: 'R1', type: 'R', a: 'in', b: 'x', r: r() }, { id: 'N1', type: 'N', na: 'x', nb: '0', ra: 'y', rb: '0' }, { id: 'Rf', type: 'R', a: 'x', b: 'y', r: r() }, { id: 'C1', type: 'C', a: 'x', b: 'y', c: cap() });
    Object.assign(L.term, { 'R1.a': [40, RAIL], 'R1.b': [130, RAIL], 'N1.na': [130, RAIL], 'N1.nb': [130, GND], 'N1.ra': [300, RAIL], 'N1.rb': [300, GND],
      'Rf.a': [130, RAIL], 'Rf.b': [300, RAIL], 'C1.a': [130, TOP], 'C1.b': [300, TOP] });
    Object.assign(L.paths, { x: [[130, TOP], [130, RAIL]], y: [[300, TOP], [300, RAIL]] });
    L.out = [300, RAIL]; L.width = 400; L.below = ['Rf'];
  } else if (v === 'inv_l') {
    memory = 'L1'; out = ['y', '0'];
    el.push({ id: 'R1', type: 'R', a: 'in', b: 'w', r: r() }, { id: 'L1', type: 'L', a: 'w', b: 'x', l: cap() }, { id: 'N1', type: 'N', na: 'x', nb: '0', ra: 'y', rb: '0' }, { id: 'Rf', type: 'R', a: 'x', b: 'y', r: r() });
    Object.assign(L.term, { 'R1.a': [40, RAIL], 'R1.b': [130, RAIL], 'L1.a': [130, RAIL], 'L1.b': [220, RAIL], 'N1.na': [220, RAIL], 'N1.nb': [220, GND], 'N1.ra': [350, RAIL], 'N1.rb': [350, GND],
      'Rf.a': [220, RAIL], 'Rf.b': [350, RAIL] });
    Object.assign(L.paths, { w: [[130, RAIL]], x: [[220, RAIL]], y: [[350, RAIL]] });
    L.out = [350, RAIL]; L.width = 420;
  } else { // v2i
    const useL = level > 1 && rng.chance(0.3);
    memory = useL ? 'L1' : 'C1'; out = ['z', '0'];
    el.push({ id: 'N1', type: 'N', na: 'in', nb: 'y', ra: 'z', rb: 'y' }, { id: 'Rs', type: 'R', a: 'y', b: '0', r: r() }, { id: 'RL', type: 'R', a: 'z', b: '0', r: r() },
      useL ? { id: 'L1', type: 'L', a: 'z', b: '0', l: cap() } : { id: 'C1', type: 'C', a: 'z', b: '0', c: cap() });
    Object.assign(L.term, { 'N1.na': [40, RAIL], 'N1.nb': [140, RAIL], 'N1.ra': [260, RAIL], 'N1.rb': [140, RAIL], 'Rs.a': [140, RAIL], 'Rs.b': [140, GND], 'RL.a': [260, RAIL], 'RL.b': [260, GND],
      [`${memory}.a`]: [370, RAIL], [`${memory}.b`]: [370, GND] });
    Object.assign(L.paths, { y: [[140, RAIL]], z: [[260, RAIL], [370, RAIL]] });
    L.out = [260, RAIL]; L.width = 460;
    L.nullorBoxes = true;
  }
  // il nodo «in» coincide con i terminali a sinistra
  const circuit = { elements: el };
  return { template: 'A', variant: v, level, circuit, out, memory, omega, layout: L };
}
