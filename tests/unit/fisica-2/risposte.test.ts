/**
 * Fisica Generale II: ricalcolo indipendente delle risposte numeriche degli esercizi statici
 * (quiz del sito originale) a partire dai dati dell'enunciato e dalle formule chiuse.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const DIR = join(process.cwd(), 'src/content/exercises/fisica-2');
type Ex = { id: string; answer?: { value: number | string; unit?: string; tol?: number }[] };
const all: Ex[] = readdirSync(DIR).flatMap((f) => parse(readFileSync(join(DIR, f), 'utf8')) as Ex[]);

const EPS0 = 8.8541878128e-12;
const MU0 = 4e-7 * Math.PI;
const C0 = 299792458;
const K = 1 / (4 * Math.PI * EPS0);
const Z0 = MU0 * C0;
const ME = 9.1093837e-31;
const E = 1.602176634e-19;
const deg = (r: number) => (r * 180) / Math.PI;

/** Valore atteso nell'unità indicata dalla risposta. */
const EXPECTED: Record<string, number> = {
  'quiz-q109': (K * 2e-9) / 0.3 ** 2, // V/m
  'quiz-q110': ((EPS0 * 1e-2) / 1e-3) * 1e12, // pF
  'quiz-q111': 0.5 * ((EPS0 * 1e-2) / 1e-3) * 100 ** 2 * 1e9, // nJ
  'quiz-q112': (K * 10e-9) / 0.1, // V
  'quiz-q115': 1e-9 / (2 * Math.PI * EPS0 * 0.02), // V/m
  'quiz-q207': 1 / (3 / 6) + 4, // Ω
  'quiz-q208': 10e3 * 100e-6, // s
  'quiz-q209': 2 * Math.LN2, // s
  'quiz-q210': 12 ** 2 / (4 * 2), // W
  'quiz-q211': (1.7e-8 * 10) / 1e-6, // Ω
  'quiz-q308': ((MU0 * 10) / (2 * Math.PI * 0.05)) * 1e6, // μT
  'quiz-q309': MU0 * 1000 * 2 * 1e3, // mT
  'quiz-q310': ((ME * 1e6) / (E * 10e-3)) * 1e3, // mm
  'quiz-q311': ((MU0 * 5 * 5) / (2 * Math.PI * 0.1)) * 1e6, // μN/m
  'quiz-q312': ((MU0 * 3) / (2 * 0.05)) * 1e6, // μT
  'quiz-q407': 3 * 0.5 * 0.2, // V
  'quiz-q408': ((MU0 * 1000 ** 2 * Math.PI * 0.02 ** 2) / 0.5) * 1e3, // mH
  'quiz-q409': (0.2 / 50) * 1e3, // ms
  'quiz-q410': 0.5 * 0.1 * 100 * 0.5 ** 2, // V
  'quiz-q411': 100 * 0.2 * 0.01 * 2 * Math.PI * 50, // V
  'quiz-q412': 1 / (2 * MU0) / 1e3, // kJ/m³
  'quiz-q508': 100 ** 2 / (2 * Z0), // W/m²
  'quiz-q509': (100 / C0) * 1e6, // μT
  'quiz-q510': 100 / (4 * Math.PI * 2 ** 2), // W/m²
  'quiz-q511': deg(Math.asin(1 / 1.5)), // °
  'quiz-q512': ((1 - 1.33) / (1 + 1.33)) ** 2 * 100, // %
  'quiz-q513': ((600e-9 * 2) / 0.2e-3) * 1e3, // mm
  'quiz-q514': (40 / 2) * Math.cos(Math.PI / 3) ** 2, // W/m²
  'quiz-q515': (C0 / 1e9) * 100, // cm
  'quiz-q704': Math.hypot(0.3, 0.4),
  'quiz-q705': Math.hypot(1, 2), // %
};

describe('fisica-2: risposte numeriche degli esercizi statici', () => {
  const numeric = all.filter((e) => e.answer?.some((a) => typeof a.value === 'number'));
  it('ogni esercizio numerico ha un ricalcolo', () => {
    expect(numeric.map((e) => e.id).sort()).toEqual(Object.keys(EXPECTED).sort());
  });
  for (const e of numeric) {
    it(e.id, () => {
      const a = e.answer![0]!;
      const tol = a.tol ?? 0.01;
      const exp = EXPECTED[e.id]!;
      // la risposta pubblicata deve stare ben dentro la tolleranza concessa allo studente
      expect(Math.abs((a.value as number) - exp) / Math.abs(exp)).toBeLessThan(tol / 3);
    });
  }
});
