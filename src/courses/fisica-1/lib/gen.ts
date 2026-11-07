/**
 * Utilità dei generatori di Fisica 1: testi bilingui, numeri formattati per
 * lingua (virgola in italiano) dentro la matematica KaTeX, costruzione
 * compatta di passi e risposte.
 */
import type { AnswerItem, ExerciseStep, GeneratedExercise } from '../../../engine/generators/registry';

export type Lang = 'it' | 'en';
export const COURSE = 'fisica-1';
/** Accelerazione di gravità usata in tutti gli esercizi del corso. */
export const G = 9.81;
/** Costante dei gas [J/(mol·K)]. */
export const R = 8.314;

export const L = (lang: Lang, it: string, en: string): string => (lang === 'en' ? en : it);

/**
 * Numero con `sig` cifre significative, in notazione LaTeX (da usare dentro `$…$`):
 * separatore decimale `{,}` in italiano, potenze di dieci per valori molto grandi o piccoli.
 */
export function num(x: number, lang: Lang, sig = 3): string {
  if (x === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(x)));
  const dec = (s: string) => (lang === 'it' ? s.replace('.', '{,}') : s);
  if (exp >= 6 || exp <= -4) {
    const m = x / 10 ** exp;
    return `${dec(trim(m.toFixed(Math.max(0, sig - 1))))} \\cdot 10^{${exp}}`;
  }
  const decimals = Math.max(0, sig - 1 - exp);
  return dec(trim(x.toFixed(decimals))).replace('-', '-');
}
const trim = (s: string) => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s);

/** Valore arrotondato come viene mostrato nel testo (stesse cifre significative di `num`). */
export const round = (x: number, sig = 3): number => (x === 0 ? 0 : Number(x.toPrecision(sig)));

/** Grandezza con unità dentro la matematica: `$v = 3{,}2\ \text{m/s}$`. */
export const q = (x: number, unit: string, lang: Lang, sig = 3) =>
  `${num(x, lang, sig)}${unit ? `\\ \\text{${unit}}` : ''}`;

export const step = (lang: Lang, it: [string, string], en: [string, string]): ExerciseStep => ({
  title: L(lang, it[0], en[0]),
  body: L(lang, it[1], en[1]),
});

export const ans = (label: string, value: number, unit?: string, tol?: number): AnswerItem => ({
  label,
  value,
  ...(unit ? { unit } : {}),
  ...(tol ? { tol } : {}),
});

export const exercise = (
  statement: string,
  steps: ExerciseStep[],
  answer: AnswerItem[],
): GeneratedExercise => ({
  statement,
  steps,
  answer,
});

export const deg = (rad: number) => (rad * 180) / Math.PI;
export const rad = (d: number) => (d * Math.PI) / 180;
