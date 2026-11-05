/**
 * Prefissi SI: lettura ("4.7k", "10u", "2,2 mH") e scrittura ("4,7 kΩ").
 * Condiviso dal kit dei grafici e dai circuiti.
 */
export type Lang = 'it' | 'en';

const PREFIX: Record<string, number> = {
  f: 1e-15,
  p: 1e-12,
  n: 1e-9,
  u: 1e-6,
  µ: 1e-6,
  μ: 1e-6,
  m: 1e-3,
  '': 1,
  k: 1e3,
  K: 1e3,
  M: 1e6,
  meg: 1e6,
  G: 1e9,
  T: 1e12,
};

const SI_RE =
  /^\s*([+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?)\s*(meg|[fpnuµμmkKMGT]?)\s*([A-Za-zΩΩ°]*)\s*$/;

/**
 * Legge un valore con prefisso SI. Accetta numeri, la virgola decimale italiana
 * e un'unità di misura facoltativa (ignorata): "4,7kΩ" → 4700, "10 uF" → 1e-5.
 * Nota: "m" è milli, "M"/"meg" è mega (come in SPICE "meg").
 */
export function parseSI(input: number | string): number {
  if (typeof input === 'number') return input;
  const m = SI_RE.exec(input);
  if (!m) throw new Error(`Valore non valido: "${input}"`);
  const num = Number((m[1] ?? '').replace(',', '.'));
  const p = m[2] ?? '';
  const factor = PREFIX[p];
  if (factor === undefined || !Number.isFinite(num)) throw new Error(`Valore non valido: "${input}"`);
  return num * factor;
}

const OUT_PREFIX: ReadonlyArray<readonly [number, string]> = [
  [1e12, 'T'],
  [1e9, 'G'],
  [1e6, 'M'],
  [1e3, 'k'],
  [1, ''],
  [1e-3, 'm'],
  [1e-6, 'µ'],
  [1e-9, 'n'],
  [1e-12, 'p'],
  [1e-15, 'f'],
];

export interface FormatOptions {
  /** Cifre significative (default 3). */
  digits?: number;
  /** Lingua per il separatore decimale (default "it": virgola). */
  lang?: Lang;
  /** Separatore tra numero e unità (default spazio sottile non separabile). */
  sep?: string;
  /** Usa i prefissi SI (default true). */
  prefix?: boolean;
}

/** Numero con cifre significative e separatore decimale localizzato; −0 diventa 0. */
export function formatNumber(x: number, digits = 3, lang: Lang = 'it'): string {
  if (!Number.isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—';
  if (x === 0 || Math.abs(x) < 1e-300) return '0';
  let s = Number(x.toPrecision(digits)).toString();
  if (s.includes('e')) {
    const [mant, exp] = s.split('e');
    s = `${mant}·10${toSuperscript(Number(exp))}`;
  }
  s = s.replace('-', '−');
  return lang === 'it' ? s.replace('.', ',') : s;
}

const SUP: Record<string, string> = {
  '-': '⁻',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};
export function toSuperscript(n: number): string {
  return String(n)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('');
}

/** Scrive un valore con prefisso SI: formatSI(4700, 'Ω') → "4,7 kΩ". */
export function formatSI(x: number, unit = '', opts: FormatOptions = {}): string {
  const { digits = 3, lang = 'it', sep = ' ', prefix = true } = opts;
  if (!Number.isFinite(x) || x === 0 || !prefix) {
    return `${formatNumber(x, digits, lang)}${unit ? sep + unit : ''}`;
  }
  const a = Math.abs(x);
  // Arrotonda prima di scegliere il prefisso: 999,96 → "1 k", non "1000".
  const rounded = Number(a.toPrecision(digits));
  let chosen: readonly [number, string] = [1, ''];
  for (const pr of OUT_PREFIX) {
    if (rounded >= pr[0] * (1 - 1e-12)) {
      chosen = pr;
      break;
    }
    chosen = pr;
  }
  const v = x / chosen[0];
  return `${formatNumber(v, digits, lang)}${sep}${chosen[1]}${unit}`;
}
