/**
 * Teoria dei Circuiti: ricalcolo indipendente delle risposte numeriche degli esercizi statici
 * (revisione 2, R2). Per ogni esercizio con `answer`, i valori attesi nell'ordine dei campi,
 * calcolati dai dati dell'enunciato con formule chiuse (o con l'algebra lineare a mano).
 * Un nuovo esercizio numerico senza ricalcolo fa fallire il test.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const DIR = join(process.cwd(), 'src/content/exercises/teoria-circuiti');
type Ex = { id: string; answer?: { value: number | string }[] };
const all: Ex[] = readdirSync(DIR).flatMap((f) => (parse(readFileSync(join(DIR, f), 'utf8')) ?? []) as Ex[]);

const deg = (r: number) => (r * 180) / Math.PI;
const par = (a: number, b: number) => (a * b) / (a + b);
/** Modulo e fase (°) di re + j·im. */
const polar = (re: number, im: number) => [Math.hypot(re, im), deg(Math.atan2(im, re))];
/** Prodotto di matrici 2×2 [a, b, c, d]. */
const mul = (x: number[], y: number[]) => [
  x[0] * y[0] + x[1] * y[2],
  x[0] * y[1] + x[1] * y[3],
  x[2] * y[0] + x[3] * y[2],
  x[2] * y[1] + x[3] * y[3],
];

const EXPECTED: Record<string, number[]> = {
  'r2-kir-1': [3 + -2 - 4, 5 - 12],
  'r2-pb-1': [8 * -0.5, -(8 * 2)],
  'r2-rc-1': [10 / (2 + 3), (3 * 10) / (2 + 3)],
  'r2-gc-1': (() => {
    const v = 10 / 2 / (1 / 2 + 1 / 2 - 0.2);
    return [v, 0.2 * v * v];
  })(),
  'r2-gc-2': [6, 2 + 3],
  'r2-gr-2': [6 - 1, 9 - 6 + 1, 6 - 1],
  'r2-tci-1': [7 - 1, 11 - 7 + 1],
  'r2-spp-1': [(10 * par(1000, 1000)) / (1000 + par(1000, 1000)), 5],
  'r2-nodi-1': (() => {
    // [[0.75, -0.25], [-0.25, 0.5]] · v = [2, 0.5] con Cramer
    const [a, b, c, d] = [0.75, -0.25, -0.25, 0.5];
    const det = a * d - b * c;
    return [0.75, (2 * d - b * 0.5) / det, (a * 0.5 - c * 2) / det];
  })(),
  'r2-fas-1': polar(3, 4),
  'r2-imp-1': [1000 * 0.02, -1 / (1000 * 50e-6)],
  'r2-imp-2': (() => {
    const xp = 1 / (1 / 20 + 1 / -10); // reattanze in parallelo: j·xp
    return [10, xp, 100 / Math.hypot(10, xp)];
  })(),
  'r2-pc-1': (() => {
    const wl = 0.5 * 0.5 * 2 ** 2;
    const wc = 0.5 * 400e-6 * (2 / (100 * 400e-6)) ** 2;
    return [wl, wc, 2 * 100 * (wl - wc)];
  })(),
  'r2-cons-1': [3 + 3, Math.hypot(6, 4 - 4), Math.hypot(3, 4) + Math.hypot(3, -4)],
  'r2-rif-1': (() => {
    const q1 = 10 * Math.tan(Math.acos(0.6));
    const q2 = 10 * Math.tan(Math.acos(0.9));
    return [q1 - q2, (((q1 - q2) * 1e3) / (2 * Math.PI * 50 * 230 ** 2)) * 1e6, q2];
  })(),
  'r2-fs-1': [1, -1, -1, 1 - Math.exp(-1) - 1 * Math.exp(-1)],
  'r2-pcc-1': [4 / 2, Math.sqrt(13 - 4), 1, (5 - 2) / 3],
  'r2-eid-1': [6 / 3, (-3 + 6) / -3, 2 - Math.exp(-3 * 0.5)],
  'r2-cdl-1': (() => {
    // V = 10/s · 1/(LC s² + RC s + 1) = 20/(s(s+1)(s+2))
    const r = (p: number, o1: number, o2: number) => 20 / ((p - o1) * (p - o2));
    const [a, b, d] = [r(0, -1, -2), r(-1, 0, -2), r(-2, 0, -1)];
    return [a, b, d, a + b * Math.exp(-1) + d * Math.exp(-2)];
  })(),
  'r2-cig-1': [10, 4 - 10, 2 * 0.5],
  'r2-fdr-1': [-3, -1, -2, 3 / 2],
  'r2-rlf-1': [3, 8, 8 + (3 - 8) * Math.exp(-0.5 / (2 * 0.25))],
  'r2-rtp-1': (() => {
    // H(j2) = 2/(2+2j)
    const [m, ph] = polar((2 / 8) * 2, (-2 / 8) * 2);
    return [3 * m, ph, (2 * 3 * -2) / ((-2) ** 2 + 4)];
  })(),
  'r2-fl-1': (() => {
    const [m, ph] = polar(10 - 9, 2 * 3);
    return [10 / m, -ph];
  })(),
  'r2-ris-2': (() => {
    const w0 = 1 / Math.sqrt(0.1 * 10e-6);
    const q = (w0 * 0.1) / 5;
    return [w0, q, w0 * 0.1 * (10 / 5)];
  })(),
  'r2-sost-2': [(12 - 6) / 4, (12 - 6) / 4 - 6 / 6],
  'r2-no-1': [9 / 3, 6 * (9 / (3 + 6)) ** 2],
  'r2-ar-1': [4 / 2, (4 * 6 - 2 * 2) / 2, 1 / 2, 6 / 2],
  'r2-ar-2': (() => {
    const t = mul([2, 10, 0.5, 3], [2, 10, 0.5, 3]);
    return [t[0], t[1], (t[0] * 10 + t[1]) / (t[2] * 10 + t[3])];
  })(),
  'r2-con-1': (() => {
    const t = mul([1, 2, 0, 1], [1, 0, 1 / 3, 1]);
    return [t[2], 2 + par(3, 6)];
  })(),
};

describe('teoria-circuiti: risposte numeriche degli esercizi statici', () => {
  const numeric = all.filter((e) => e.answer?.some((a) => typeof a.value === 'number'));

  it('ogni esercizio numerico ha un ricalcolo', () => {
    expect(numeric.map((e) => e.id).filter((id) => !(id in EXPECTED))).toEqual([]);
  });

  for (const e of numeric) {
    it(`${e.id}: valori coerenti con il ricalcolo`, () => {
      const exp = EXPECTED[e.id];
      expect(exp, `manca il ricalcolo di ${e.id}`).toBeDefined();
      const got = e.answer!.map((a) => Number(a.value));
      expect(got.length).toBe(exp.length);
      got.forEach((v, i) => expect(v).toBeCloseTo(exp[i], 4));
    });
  }
});
