/**
 * Generatore di esercizi di Fisica Generale II, portato da legacy/fisica-2/assets/js/generatore.js.
 *
 * Ogni esercizio è un TEMPLATE scritto per il sito, con parametri casuali riproducibili da un seme e
 * soluzione calcolata: ricalca la TIPOLOGIA degli appelli passati (stessi argomenti, stesse grandezze
 * richieste, stesso livello), non i loro testi né i loro dati. Stesso PRNG e stessi parametri del sito
 * originale: a parità di seme i numeri coincidono con quelli che generava.
 *
 * Ogni template diventa un generatore del motore `fisica-2/<id>` (src/engine/generators/registry.ts).
 */
import {
  registerGenerator,
  type AnswerItem,
  type ExerciseFigure,
  type GeneratedExercise,
  type Lang,
} from '../../../engine/generators/registry';

export const S = String.raw;
export const EPS0 = 8.8541878128e-12;
export const MU0 = 4e-7 * Math.PI;
export const C0 = 299792458;
export const K = 1 / (4 * Math.PI * EPS0);
export const PI = Math.PI;

/* ---------- numeri casuali riproducibili (mulberry32, come nel sito originale) ---------- */
export type Rand = () => number;
export function rng(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const pick = <T>(r: Rand, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)]!;
/** valore "tondo" in [a, b] con passo s */
export const step = (r: Rand, a: number, b: number, s: number): number =>
  +(a + s * Math.floor(r() * (Math.round((b - a) / s) + 1))).toFixed(10);

/* ---------- formattazione in TeX (virgola decimale in italiano, punto in inglese) ---------- */
const PREF: [number, string][] = [
  [1e-12, 'p'],
  [1e-9, 'n'],
  [1e-6, S`\mu `],
  [1e-3, 'm'],
  [1, ''],
  [1e3, 'k'],
  [1e6, 'M'],
  [1e9, 'G'],
];

export interface Fmt {
  lang: Lang;
  /** testo nella lingua corrente */
  t: (it: string, en: string) => string;
  sig: (x: number, n?: number) => string;
  /** grandezza con prefisso SI adatto: P(2.5e-9,'C') → 2{,}50\,\mathrm{nC} */
  P: (x: number, unit: string, n?: number) => string;
  /** grandezza senza prefisso */
  Un: (x: number, unit: string, n?: number) => string;
  cm: (x: number) => string;
  mm: (x: number) => string;
  I_: (x: number) => string;
  ang: (rad: number) => string;
}

export function fmt(lang: Lang): Fmt {
  const dec = (s: string) => (lang === 'it' ? s.replace('.', '{,}') : s);
  const sig = (x: number, n = 3): string => {
    if (x === 0) return '0';
    const a = Math.abs(x);
    if (a >= 1e4 || a < 1e-2) {
      let e = Math.floor(Math.log10(a));
      let ms = (x / Math.pow(10, e)).toPrecision(n);
      if (Math.abs(parseFloat(ms)) >= 10) {
        e += 1;
        ms = (x / Math.pow(10, e)).toPrecision(n);
      }
      return dec(ms) + S`\times10^{${e}}`;
    }
    const dp = Math.max(0, n - 1 - Math.floor(Math.log10(a)));
    return dec(x.toFixed(dp));
  };
  const P = (x: number, unit: string, n = 3): string => {
    if (x === 0) return S`0\,\mathrm{${unit}}`;
    const a = Math.abs(x);
    let best = PREF[4]!;
    for (const p of PREF) if (a >= p[0] * 0.99999) best = p;
    return `${sig(x / best[0], n)}\\,\\mathrm{${best[1]}${unit}}`;
  };
  const Un = (x: number, unit: string, n = 3) => `${sig(x, n)}\\,\\mathrm{${unit}}`;
  const trim = (t: string) => {
    const sep = lang === 'it' ? '{,}' : '.';
    if (!t.includes(sep) || t.includes('times')) return t;
    return t.replace(/0+$/, '').replace(lang === 'it' ? /\{,\}$/ : /\.$/, '');
  };
  return {
    lang,
    t: (it, en) => (lang === 'it' ? it : en),
    sig,
    P,
    Un,
    cm: (x) => `${trim(sig(x * 100, 3))}\\,\\mathrm{cm}`,
    mm: (x) => `${trim(sig(x * 1000, 3))}\\,\\mathrm{mm}`,
    I_: (x) => String(Math.round(x)),
    ang: (rad) => `${sig((rad * 180) / PI, 3)}^\\circ`,
  };
}

/* ---------- template ---------- */
export interface TemplateOutput {
  statement: string;
  steps: string[];
  /** risposte da verificare (valori SI, unità SI) */
  answer: AnswerItem[];
  parametri: Record<string, number>;
  valori: Record<string, number>;
}

export interface Template {
  /** id del sito originale (es. "b1-sfera-rho-kr"); generatore `fisica-2/<id>` */
  id: string;
  /** blocco del programma nel sito originale (distribuzione delle prove) */
  blocco: 'b1' | 'b2' | 'b3' | 'b4' | 'b5';
  topic: string;
  objectives: string[];
  tema: { it: string; en: string };
  make: (r: Rand, f: Fmt) => TemplateOutput;
  /** Figura (kit `src/figures` o netlist) costruita dai parametri dell'esercizio generato. */
  figure?: (p: Record<string, number>, lang: Lang) => ExerciseFigure;
}

/**
 * Etichetta di una figura con valore e unità in testo semplice (virgola decimale in italiano):
 * `lv(0.035, 'cm', 'it', 100)` → `3,5 cm`; valori grandi o piccoli come `1,5·10^{11}`.
 */
export function lv(x: number, unit: string, lang: Lang, scale = 1, n = 3): string {
  const v = x * scale;
  const a = Math.abs(v);
  let t: string;
  if (a !== 0 && (a >= 1e5 || a < 1e-3)) {
    const e = Math.floor(Math.log10(a));
    t = `${Number((v / 10 ** e).toPrecision(n))}·10^{${e}}`;
  } else t = String(Number(v.toPrecision(n)));
  if (lang === 'it') t = t.replace('.', ',');
  return unit ? `${t} ${unit}` : t;
}

export const TEMPLATES: Record<string, Template> = {};

/** Esegue un template: stesso schema di semi del sito originale (seme del template derivato dal seme dato). */
export function runTemplate(tpl: Template, seed: number, lang: Lang): TemplateOutput {
  return tpl.make(rng(((seed >>> 0) * 2654435761) >>> 0), fmt(lang));
}

export function defineTemplate(tpl: Template): Template {
  TEMPLATES[tpl.id] = tpl;
  registerGenerator({
    id: `fisica-2/${tpl.id}`,
    topic: tpl.topic,
    objectives: tpl.objectives,
    generate(seed: number, lang: Lang): GeneratedExercise {
      const out = runTemplate(tpl, seed, lang);
      const figure = tpl.figure?.(out.parametri, lang);
      return {
        statement: out.statement,
        ...(figure ? { figure } : {}),
        steps: out.steps.map((body, i) => ({ title: `${lang === 'it' ? 'Passo' : 'Step'} ${i + 1}`, body })),
        answer: out.answer,
      };
    },
  });
  return tpl;
}
