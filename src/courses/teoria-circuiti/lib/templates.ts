/**
 * Template dell'esercizio d'analisi del sito originale. Ogni template costruisce un'istanza
 * (netlist esatta + uscita + elemento con memoria) da un generatore pseudo-casuale con seme;
 * la «bellezza» dei numeri e la validità le controlla il generatore.
 *  A: nullore come generatore di tensione o di corrente;
 *  B: doppio bipolo (matrice Z o Y) da ridurre con Thevenin/Norton;
 *  C: trasformatore ideale.
 * Livelli: 1 continua, 2 sinusoidale, 3 misto (continua + sinusoide; nullore a monte e
 * generatore controllato a valle per B e C).
 */
import type { Rng } from '../../../engine/random';
import { Rational } from './rational';
import { Cx } from './complex';
import { wave, type Element } from './netlist';
import type { Instance } from './exercise';

export type Level = 1 | 2 | 3;
export type TemplateId = 'A' | 'B' | 'C';
const R_ = (x: number | string) => Rational.from(x);

/** Intero non nullo in [−m, m]. */
export const nz = (rng: Rng, m: number) => {
  let v = 0;
  while (v === 0) v = rng.int(-m, m);
  return v;
};

function sources(rng: Rng, level: Level): Element[] {
  const amp = () => rng.int(1, 8);
  const acVal = () => (rng.chance(0.5) ? new Cx(amp(), 0) : new Cx(0, -amp())); // cos(ωt) oppure sin(ωt)
  if (level === 1) return [{ id: 'V1', type: 'V', a: 'in', b: '0', wave: wave(nz(rng, 9), 0) }];
  if (level === 2) return [{ id: 'V1', type: 'V', a: 'in', b: '0', wave: wave(0, acVal()) }];
  return [
    { id: 'V1', type: 'V', a: 'in', b: 'm', wave: wave(nz(rng, 9), 0) },
    { id: 'V2', type: 'V', a: 'm', b: '0', wave: wave(0, acVal()) },
  ];
}
function matrix2(rng: Rng, reciprocal: boolean): Rational[][] {
  for (;;) {
    const m = [
      [rng.int(1, 4), rng.int(0, 3)],
      [rng.int(0, 3), rng.int(1, 4)],
    ];
    if (reciprocal) m[1]![0] = m[0]![1]!;
    if (m[0]![0]! * m[1]![1]! - m[0]![1]! * m[1]![0]! !== 0) return m.map((r) => r.map((x) => R_(x)));
  }
}

export const VARIANTS: Record<TemplateId, string[]> = {
  A: ['inv_rc', 'inv_fb', 'inv_l', 'v2i'],
  B: ['z', 'y'],
  C: ['t_rc', 't_rl'],
};

function buildA(rng: Rng, level: Level, variant?: string): Instance {
  const v = variant ?? rng.pick(VARIANTS.A);
  const omega = level === 1 ? null : R_(rng.pick([1, 2, 3]));
  const el = sources(rng, level);
  const r = () => R_(rng.int(1, 6));
  const cap = () => R_(rng.int(1, 3));
  let memory: string;
  let out: [string, string];
  if (v === 'inv_rc') {
    memory = 'C1';
    out = ['o', '0'];
    el.push(
      { id: 'R1', type: 'R', a: 'in', b: 'x', r: r() },
      { id: 'N1', type: 'N', na: 'x', nb: '0', ra: 'y', rb: '0' },
      { id: 'Rf', type: 'R', a: 'x', b: 'y', r: r() },
    );
    if (level !== 3)
      el.push(
        { id: 'Ra', type: 'R', a: 'y', b: 'o', r: r() },
        { id: 'C1', type: 'C', a: 'o', b: '0', c: cap() },
        { id: 'Rb', type: 'R', a: 'o', b: '0', r: r() },
      );
    else
      el.push(
        { id: 'Ra', type: 'R', a: 'y', b: 'p', r: r() },
        { id: 'Rb', type: 'R', a: 'p', b: '0', r: r() },
        { id: 'Rc', type: 'R', a: 'p', b: 'o', r: r() },
        { id: 'C1', type: 'C', a: 'o', b: '0', c: cap() },
      );
  } else if (v === 'inv_fb') {
    memory = 'C1';
    out = ['y', '0'];
    el.push(
      { id: 'R1', type: 'R', a: 'in', b: 'x', r: r() },
      { id: 'N1', type: 'N', na: 'x', nb: '0', ra: 'y', rb: '0' },
      { id: 'Rf', type: 'R', a: 'x', b: 'y', r: r() },
      { id: 'C1', type: 'C', a: 'x', b: 'y', c: cap() },
    );
  } else if (v === 'inv_l') {
    memory = 'L1';
    out = ['y', '0'];
    el.push(
      { id: 'R1', type: 'R', a: 'in', b: 'w', r: r() },
      { id: 'L1', type: 'L', a: 'w', b: 'x', l: cap() },
      { id: 'N1', type: 'N', na: 'x', nb: '0', ra: 'y', rb: '0' },
      { id: 'Rf', type: 'R', a: 'x', b: 'y', r: r() },
    );
  } else {
    const useL = level > 1 && rng.chance(0.3);
    memory = useL ? 'L1' : 'C1';
    out = ['z', '0'];
    el.push(
      { id: 'N1', type: 'N', na: 'in', nb: 'y', ra: 'z', rb: 'y' },
      { id: 'Rs', type: 'R', a: 'y', b: '0', r: r() },
      { id: 'RL', type: 'R', a: 'z', b: '0', r: r() },
      useL
        ? { id: 'L1', type: 'L', a: 'z', b: '0', l: cap() }
        : { id: 'C1', type: 'C', a: 'z', b: '0', c: cap() },
    );
  }
  return { template: 'A', variant: v, level, circuit: { elements: el }, out, memory, omega };
}

const GM = ['1/2', '1/3', '1/4', '1', '-1/4'];

function buildB(rng: Rng, level: Level, variant?: string): Instance {
  const v = variant ?? rng.pick(VARIANTS.B);
  const omega = level === 1 ? null : R_(rng.pick([1, 2, 3]));
  const el = sources(rng, level);
  const r = () => R_(rng.int(1, 5));
  const cap = () => R_(rng.int(1, 3));
  const useL = level > 1 && rng.chance(0.25);
  const memory = useL ? 'L1' : 'C1';
  const m = matrix2(rng, v === 'z' && rng.chance(0.5));
  const front = level === 3;
  if (front) {
    el.push(
      { id: 'Rn', type: 'R', a: 'in', b: 'x', r: r() },
      { id: 'N1', type: 'N', na: 'x', nb: '0', ra: 'y', rb: '0' },
      { id: 'Rf', type: 'R', a: 'x', b: 'y', r: r() },
      { id: 'R1', type: 'R', a: 'y', b: 'p1', r: r() },
    );
  } else el.push({ id: 'R1', type: 'R', a: 'in', b: 'p1', r: r() });
  el.push(
    { id: 'P1', type: 'P', kind: v === 'z' ? 'Z' : 'Y', p1a: 'p1', p1b: '0', p2a: 'p2', p2b: '0', m },
    { id: 'R2', type: 'R', a: 'p2', b: 'o', r: r() },
    useL
      ? { id: 'L1', type: 'L', a: 'o', b: '0', l: cap() }
      : { id: 'C1', type: 'C', a: 'o', b: '0', c: cap() },
  );
  if (!front) el.push({ id: 'R3', type: 'R', a: 'o', b: '0', r: r() });
  else el.push({ id: 'G1', type: 'G', a: '0', b: 'o', cp: 'p2', cn: '0', gm: R_(rng.pick(GM)) });
  return { template: 'B', variant: v, level, circuit: { elements: el }, out: ['o', '0'], memory, omega };
}

function buildC(rng: Rng, level: Level, variant?: string): Instance {
  const v = variant ?? rng.pick(VARIANTS.C);
  const omega = level === 1 ? null : R_(rng.pick([1, 2, 3]));
  const el = sources(rng, level);
  const r = () => R_(rng.int(1, 5));
  const cap = () => R_(rng.int(1, 3));
  const useL = v === 't_rl';
  const memory = useL ? 'L1' : 'C1';
  const n = R_(rng.pick([2, 3, 4, '1/2', '3/2', '2/3']));
  if (level === 3)
    el.push(
      { id: 'Rn', type: 'R', a: 'in', b: 'x', r: r() },
      { id: 'N1', type: 'N', na: 'x', nb: '0', ra: 'y', rb: '0' },
      { id: 'Rf', type: 'R', a: 'x', b: 'y', r: r() },
      { id: 'R1', type: 'R', a: 'y', b: 'p1', r: r() },
    );
  else el.push({ id: 'R1', type: 'R', a: 'in', b: 'p1', r: r() });
  el.push(
    { id: 'T1', type: 'T', p1a: 'p1', p1b: '0', p2a: 'q', p2b: '0', n },
    { id: 'R2', type: 'R', a: 'q', b: 'o', r: r() },
    useL
      ? { id: 'L1', type: 'L', a: 'o', b: '0', l: cap() }
      : { id: 'C1', type: 'C', a: 'o', b: '0', c: cap() },
    { id: 'R3', type: 'R', a: 'o', b: '0', r: r() },
  );
  if (level === 3) el.push({ id: 'G1', type: 'G', a: '0', b: 'o', cp: 'q', cn: '0', gm: R_(rng.pick(GM)) });
  // con l'induttore la tensione ai suoi capi sarebbe nulla in continua: si misura quella su R2
  const out: [string, string] = useL ? ['q', 'o'] : ['o', '0'];
  return { template: 'C', variant: v, level, circuit: { elements: el }, out, memory, omega };
}

export const BUILD: Record<TemplateId, (rng: Rng, level: Level, variant?: string) => Instance> = {
  A: buildA,
  B: buildB,
  C: buildC,
};
