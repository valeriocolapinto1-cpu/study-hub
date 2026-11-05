/**
 * Scale (lineari e logaritmiche) e tacche "belle" per gli assi. Funzioni pure.
 */
export type ScaleKind = 'lin' | 'log';

export interface Scale {
  kind: ScaleKind;
  domain: [number, number];
  range: [number, number];
  /** Valore → pixel. */
  (v: number): number;
  /** Pixel → valore. */
  invert(px: number): number;
  ticks(count?: number): number[];
}

export function makeScale(kind: ScaleKind, domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  if (kind === 'log' && !(d0 > 0 && d1 > 0)) throw new RangeError('scala log: dominio positivo richiesto');
  const f = kind === 'log' ? Math.log10 : (v: number): number => v;
  const fi = kind === 'log' ? (v: number): number => 10 ** v : (v: number): number => v;
  const a = f(d0);
  const b = f(d1);
  const span = b - a || 1;
  const s = ((v: number): number => r0 + ((f(v) - a) / span) * (r1 - r0)) as Scale;
  s.kind = kind;
  s.domain = domain;
  s.range = range;
  s.invert = (px: number): number => fi(a + ((px - r0) / (r1 - r0 || 1)) * span);
  s.ticks = (count = 6): number[] => (kind === 'log' ? logTicks(d0, d1) : niceTicks(d0, d1, count));
  return s;
}

/** Passo "bello" (1, 2, 5 × 10ⁿ) per circa `count` intervalli. */
export function niceStep(span: number, count: number): number {
  const raw = Math.abs(span) / Math.max(1, count);
  if (!(raw > 0) || !Number.isFinite(raw)) return 1;
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
}

/** Tacche lineari comprese nel dominio. */
export function niceTicks(d0: number, d1: number, count = 6): number[] {
  const lo = Math.min(d0, d1);
  const hi = Math.max(d0, d1);
  const step = niceStep(hi - lo, count);
  const out: number[] = [];
  const start = Math.ceil(lo / step - 1e-9) * step;
  for (let v = start; v <= hi + step * 1e-9; v += step)
    out.push(Math.abs(v) < step * 1e-9 ? 0 : +v.toPrecision(12));
  return out;
}

/** Tacche logaritmiche alle potenze di 10 (con 2 e 5 se le decadi sono poche). */
export function logTicks(d0: number, d1: number): number[] {
  const lo = Math.min(d0, d1);
  const hi = Math.max(d0, d1);
  const e0 = Math.floor(Math.log10(lo));
  const e1 = Math.ceil(Math.log10(hi));
  const decades = e1 - e0;
  const mult = decades <= 2 ? [1, 2, 5] : decades <= 5 ? [1, 3] : [1];
  const out: number[] = [];
  for (let e = e0; e <= e1; e++)
    for (const m of mult) {
      const v = m * 10 ** e;
      if (v >= lo * (1 - 1e-9) && v <= hi * (1 + 1e-9)) out.push(+v.toPrecision(12));
    }
  return out;
}

/** Estremi di una serie di valori finiti, con margine relativo. */
export function extent(values: Iterable<number>, pad = 0): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of values)
    if (Number.isFinite(v)) {
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  if (lo === Infinity) return [0, 1];
  if (lo === hi) {
    const d = Math.abs(lo) || 1;
    return [lo - d * 0.5, hi + d * 0.5];
  }
  const d = (hi - lo) * pad;
  return [lo - d, hi + d];
}
