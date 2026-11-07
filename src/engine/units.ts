/**
 * Numeri, unità di misura e numeri complessi.
 *
 * Il parsing è tollerante come uno studente reale: virgola o punto decimale,
 * notazione scientifica in tutte le forme che si scrivono a mano
 * (`1.5e-3`, `1,5·10^-3`, `1,5×10⁻³`), prefissi SI (e binari per l'informatica),
 * unità composte (`V/m`, `kg·m²/s²`, `rad/s`) e numeri complessi in forma
 * cartesiana (`3+4j`, `3 - j4`, `2i`) o polare (`5∠53,13°`, `5∠0,93 rad`,
 * `5e^(j30°)`).
 *
 * Le grandezze sono ridotte a SI con un vettore di dimensioni: così `4,7 kΩ`
 * e `4700 ohm` coincidono e `Hz` ≠ `rad/s` (l'angolo è una dimensione a parte,
 * per poter riconoscere l'errore del fattore 2π).
 */

import type { Lang } from '../config/site';

export type { Lang };

// ───────────────────────────── dimensioni ─────────────────────────────

/** Ordine delle dimensioni: lunghezza, massa, tempo, corrente, temperatura, quantità, intensità luminosa, informazione, angolo. */
export const DIMENSIONS = ['L', 'M', 'T', 'I', 'Θ', 'N', 'J', 'bit', 'ang'] as const;
export type Dim = readonly [number, number, number, number, number, number, number, number, number];

const D = (L = 0, M = 0, T = 0, I = 0, Th = 0, N = 0, J = 0, B = 0, A = 0): Dim => [
  L,
  M,
  T,
  I,
  Th,
  N,
  J,
  B,
  A,
];
export const DIMLESS: Dim = D();

export function dimEquals(a: Dim, b: Dim): boolean {
  return a.every((x, i) => Math.abs(x - (b[i] as number)) < 1e-9);
}
function dimMul(a: Dim, b: Dim, k = 1): Dim {
  return a.map((x, i) => x + k * (b[i] as number)) as unknown as Dim;
}
function dimPow(a: Dim, p: number): Dim {
  return a.map((x) => x * p) as unknown as Dim;
}

interface UnitDef {
  /** Fattore verso l'unità SI coerente. */
  factor: number;
  dim: Dim;
  /** Ammette prefissi SI? */
  prefix?: boolean;
  /** Ammette prefissi binari (Ki, Mi…)? */
  binary?: boolean;
}

/** Unità riconosciute. Gli alias puntano alla stessa definizione. */
const UNITS: Record<string, UnitDef> = {
  // base SI
  m: { factor: 1, dim: D(1), prefix: true },
  g: { factor: 1e-3, dim: D(0, 1), prefix: true },
  s: { factor: 1, dim: D(0, 0, 1), prefix: true },
  A: { factor: 1, dim: D(0, 0, 0, 1), prefix: true },
  K: { factor: 1, dim: D(0, 0, 0, 0, 1), prefix: true },
  mol: { factor: 1, dim: D(0, 0, 0, 0, 0, 1), prefix: true },
  cd: { factor: 1, dim: D(0, 0, 0, 0, 0, 0, 1) },
  // tempo non SI
  min: { factor: 60, dim: D(0, 0, 1) },
  h: { factor: 3600, dim: D(0, 0, 1) },
  // derivate SI
  Hz: { factor: 1, dim: D(0, 0, -1), prefix: true },
  N: { factor: 1, dim: D(1, 1, -2), prefix: true },
  Pa: { factor: 1, dim: D(-1, 1, -2), prefix: true },
  J: { factor: 1, dim: D(2, 1, -2), prefix: true },
  W: { factor: 1, dim: D(2, 1, -3), prefix: true },
  VA: { factor: 1, dim: D(2, 1, -3), prefix: true },
  var: { factor: 1, dim: D(2, 1, -3), prefix: true },
  C: { factor: 1, dim: D(0, 0, 1, 1), prefix: true },
  V: { factor: 1, dim: D(2, 1, -3, -1), prefix: true },
  Ω: { factor: 1, dim: D(2, 1, -3, -2), prefix: true },
  S: { factor: 1, dim: D(-2, -1, 3, 2), prefix: true },
  F: { factor: 1, dim: D(-2, -1, 4, 2), prefix: true },
  H: { factor: 1, dim: D(2, 1, -2, -2), prefix: true },
  T: { factor: 1, dim: D(0, 1, -2, -1), prefix: true },
  Wb: { factor: 1, dim: D(2, 1, -2, -1), prefix: true },
  // energia e pressione non SI
  eV: { factor: 1.602176634e-19, dim: D(2, 1, -2), prefix: true },
  Wh: { factor: 3600, dim: D(2, 1, -2), prefix: true },
  cal: { factor: 4.184, dim: D(2, 1, -2), prefix: true },
  bar: { factor: 1e5, dim: D(-1, 1, -2), prefix: true },
  atm: { factor: 101325, dim: D(-1, 1, -2) },
  L: { factor: 1e-3, dim: D(3), prefix: true },
  l: { factor: 1e-3, dim: D(3), prefix: true },
  // angoli (dimensione propria)
  rad: { factor: 1, dim: D(0, 0, 0, 0, 0, 0, 0, 0, 1), prefix: true },
  '°': { factor: Math.PI / 180, dim: D(0, 0, 0, 0, 0, 0, 0, 0, 1) },
  deg: { factor: Math.PI / 180, dim: D(0, 0, 0, 0, 0, 0, 0, 0, 1) },
  rpm: { factor: (2 * Math.PI) / 60, dim: D(0, 0, -1, 0, 0, 0, 0, 0, 1) },
  // informatica
  bit: { factor: 1, dim: D(0, 0, 0, 0, 0, 0, 0, 1), prefix: true, binary: true },
  b: { factor: 1, dim: D(0, 0, 0, 0, 0, 0, 0, 1), prefix: true, binary: true },
  B: { factor: 8, dim: D(0, 0, 0, 0, 0, 0, 0, 1), prefix: true, binary: true },
  bps: { factor: 1, dim: D(0, 0, -1, 0, 0, 0, 0, 1), prefix: true, binary: true },
  // adimensionali
  '%': { factor: 0.01, dim: DIMLESS },
  ppm: { factor: 1e-6, dim: DIMLESS },
};

const ALIASES: Record<string, string> = {
  ohm: 'Ω',
  Ohm: 'Ω',
  ohms: 'Ω',
  Ω: 'Ω',
  mho: 'S',
  sec: 's',
  byte: 'B',
  bytes: 'B',
  bits: 'bit',
  grad: '°',
  gradi: '°',
  degree: '°',
  degrees: '°',
  Kelvin: 'K',
  VAR: 'var',
  VAr: 'var',
  VAR_: 'var',
};

/** Prefissi SI. `u` e `µ`/`μ` valgono micro. */
export const SI_PREFIXES: Record<string, number> = {
  y: 1e-24,
  z: 1e-21,
  a: 1e-18,
  f: 1e-15,
  p: 1e-12,
  n: 1e-9,
  µ: 1e-6,
  μ: 1e-6,
  u: 1e-6,
  m: 1e-3,
  c: 1e-2,
  d: 1e-1,
  da: 1e1,
  h: 1e2,
  k: 1e3,
  K: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
  P: 1e15,
  E: 1e18,
  Z: 1e21,
  Y: 1e24,
};
export const BINARY_PREFIXES: Record<string, number> = {
  Ki: 2 ** 10,
  Mi: 2 ** 20,
  Gi: 2 ** 30,
  Ti: 2 ** 40,
  Pi: 2 ** 50,
  Ei: 2 ** 60,
};

/** Prefissi usati in uscita per la notazione ingegneristica. */
const ENG_PREFIXES: Array<[number, string]> = [
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

const SUPERSCRIPTS: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '⁻': '-',
  '⁺': '+',
};

function normalizeSuperscripts(text: string): string {
  return text.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => '^' + [...m].map((c) => SUPERSCRIPTS[c]).join(''));
}

/** Uniforma segni e spazi tipografici che arrivano da tastiere mobili o copia-incolla. */
export function normalizeInput(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[−‒–—]/g, '-')
    .replace(/[   ]/g, ' ')
    .replace(/Ω/g, 'Ω')
    .trim();
}

// ───────────────────────────── numeri ─────────────────────────────

const NUM_RE = /^[+-]?(?:\d[\d.,' ]*\d|\d)?(?:[.,]\d*)?(?:[eE][+-]?\d+)?$/;

function normalizeDecimal(mantissa: string): string | null {
  let s = mantissa.replace(/[' ]/g, '');
  const dots = (s.match(/\./g) ?? []).length;
  const commas = (s.match(/,/g) ?? []).length;
  if (dots > 0 && commas > 0) {
    // Il separatore che compare per ultimo è quello decimale: 1.234,5 / 1,234.5
    const decimal = s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.';
    const thousands = decimal === ',' ? '.' : ',';
    if ((s.match(new RegExp(`\\${decimal}`, 'g')) ?? []).length > 1) return null;
    s = s.split(thousands).join('').replace(decimal, '.');
  } else if (commas > 1 || dots > 1) {
    // 1.234.567 oppure 1,234,567: separatori delle migliaia (gruppi da 3)
    const sep = commas > 1 ? ',' : '.';
    const groups = s.replace(/^[+-]/, '').split(sep);
    if (!groups.slice(1).every((g) => g.length === 3)) return null;
    s = s.split(sep).join('');
  } else if (commas === 1) {
    s = s.replace(',', '.');
  }
  return s;
}

/**
 * Converte un testo in numero. Accetta virgola o punto, segno, notazione
 * scientifica (`e`, `E`, `·10^`, `×10^`, `x10^`, `*10^`, apici Unicode) e
 * frazioni semplici `a/b`. Restituisce `null` se il testo non è un numero.
 */
export function parseNumber(input: string): number | null {
  let text = normalizeSuperscripts(normalizeInput(input)).replace(/\s+/g, ' ');
  if (text === '') return null;
  // frazione a/b
  const frac = /^([^/]+)\/([^/]+)$/.exec(text);
  if (frac) {
    const a = parseNumber(frac[1] as string);
    const b = parseNumber(frac[2] as string);
    if (a === null || b === null || b === 0) return null;
    return a / b;
  }
  // mantissa × 10^esponente
  let exponent = 0;
  // "1,5·10^-3", "2 x 10^(4)", "10^3", "-10^-2" (senza operatore solo se la mantissa manca)
  const pow = /^(?:(.*?)\s*[·×x*⋅]\s*|([+-]?))10\s*\^\s*\(?\s*([+-]?\d+)\s*\)?$/.exec(text);
  if (pow) {
    const mant = (pow[1] ?? pow[2] ?? '').trim();
    exponent = Number(pow[3]);
    text = mant === '' || mant === '+' || mant === '-' ? `${mant}1` : mant;
  }
  text = text.replace(/\s+/g, '');
  if (!NUM_RE.test(text) || !/\d/.test(text)) return null;
  const [mantissa, exp] = text.split(/[eE]/) as [string, string | undefined];
  const dec = normalizeDecimal(mantissa);
  if (dec === null || dec === '' || dec === '+' || dec === '-') return null;
  const value = Number(dec) * 10 ** (exponent + (exp !== undefined ? Number(exp) : 0));
  return Number.isFinite(value) ? value : null;
}

// ───────────────────────────── unità ─────────────────────────────

export interface ParsedUnit {
  /** Fattore moltiplicativo verso SI (comprende i prefissi). */
  factor: number;
  dim: Dim;
  /** Offset additivo (solo °C e °F, che non si possono comporre). */
  offset?: number;
}

function lookupUnit(symbol: string): UnitDef | undefined {
  return UNITS[symbol] ?? (ALIASES[symbol] ? UNITS[ALIASES[symbol] as string] : undefined);
}

/** Risolve un simbolo semplice con eventuale prefisso (`kΩ`, `µF`, `KiB`, `ms`, `min`). */
function parseAtom(symbol: string): ParsedUnit | null {
  const direct = lookupUnit(symbol);
  if (direct) return { factor: direct.factor, dim: direct.dim };
  for (const [p, f] of Object.entries(BINARY_PREFIXES)) {
    if (symbol.startsWith(p)) {
      const def = lookupUnit(symbol.slice(p.length));
      if (def?.binary) return { factor: f * def.factor, dim: def.dim };
    }
  }
  // prefissi a due lettere prima di quelli a una (da)
  const prefixes = Object.keys(SI_PREFIXES).sort((a, b) => b.length - a.length);
  for (const p of prefixes) {
    if (symbol.length > p.length && symbol.startsWith(p)) {
      const def = lookupUnit(symbol.slice(p.length));
      if (def?.prefix) return { factor: (SI_PREFIXES[p] as number) * def.factor, dim: def.dim };
    }
  }
  return null;
}

/**
 * Converte una stringa di unità (anche composta) in fattore SI e dimensione.
 * Separatori ammessi: `·`, `*`, `.`, spazio (prodotto) e `/` (quoziente);
 * potenze con `^n` o apici. Esempi: `kΩ`, `V/m`, `N·m`, `m/s^2`, `kg·m²/s²`,
 * `1/s`, `Ω·m`, `KiB/s`, `J/(kg·K)`. `°C` e `°F` sono gestite solo da sole (sono affini).
 * Stringa vuota = adimensionale.
 */
export function parseUnit(input: string): ParsedUnit | null {
  // Denominatore tra parentesi: "J/(kg·K)" → "J/kg/K" (un solo livello, senza potenze sul gruppo).
  const text = normalizeSuperscripts(normalizeInput(input)).replace(
    /\/\(([^()^]+)\)/g,
    (_, g: string) =>
      `/${g
        .trim()
        .split(/\s*[·*.\s]\s*/)
        .join('/')}`,
  );
  if (text === '') return { factor: 1, dim: DIMLESS };
  if (text === '°C' || text === 'degC') return { factor: 1, dim: D(0, 0, 0, 0, 1), offset: 273.15 };
  if (text === '°F' || text === 'degF')
    return { factor: 5 / 9, dim: D(0, 0, 0, 0, 1), offset: 459.67 * (5 / 9) };
  if (text === '°' || text === 'º') return parseAtom('°');
  const atom0 = parseAtom(text);
  if (atom0) return atom0;
  // "k ohm", "µ F": prefisso staccato dall'unità
  const spaced = /^(\S{1,2})\s+(\S+)$/.exec(text);
  if (spaced && (spaced[1] as string) in SI_PREFIXES) {
    const joined = parseAtom(`${spaced[1]}${spaced[2]}`);
    if (joined) return joined;
  }

  let factor = 1;
  let dim: Dim = DIMLESS;
  // Divide in fattori conservando gli operatori: "kg·m^2/s^2" → [kg, ·, m^2, /, s^2]
  const tokens = text
    .replace(/\s*([·*⋅/])\s*/g, '$1')
    .split(/([·*⋅/ ]|(?<=[a-zA-ZΩµμ°%])\.(?=[a-zA-ZΩµμ°]))/)
    .filter((t) => t !== undefined && t !== '');
  let sign = 1;
  let expectOperand = true;
  for (const tok of tokens) {
    if (tok === '/') {
      sign = -1;
      expectOperand = true;
      continue;
    }
    if (tok === '·' || tok === '*' || tok === '⋅' || tok === ' ' || tok === '.') {
      expectOperand = true;
      continue;
    }
    if (!expectOperand) return null;
    const m = /^([^\^]+)(?:\^\(?([+-]?\d+(?:\.\d+)?)\)?)?$/.exec(tok);
    if (!m) return null;
    const base = m[1] as string;
    const power = (m[2] !== undefined ? Number(m[2]) : 1) * sign;
    if (base === '1') {
      expectOperand = false;
      continue;
    }
    const atom = parseAtom(base);
    if (!atom) return null;
    factor *= atom.factor ** power;
    dim = dimMul(dim, dimPow(atom.dim, power));
    expectOperand = false;
  }
  return expectOperand && tokens.length > 0 ? null : { factor, dim };
}

/** Le due unità misurano la stessa grandezza? */
export function sameDimension(a: string, b: string): boolean {
  const ua = parseUnit(a);
  const ub = parseUnit(b);
  return !!ua && !!ub && dimEquals(ua.dim, ub.dim);
}

/** Valore SI di `value` espresso in `unit`. */
export function toSI(value: number, unit: string): number {
  const u = parseUnit(unit);
  if (!u) throw new Error(`Unità non riconosciuta: «${unit}»`);
  return value * u.factor + (u.offset ?? 0);
}

/** Converte `value` da `from` a `to`; errore se le dimensioni non coincidono. */
export function convert(value: number, from: string, to: string): number {
  const uf = parseUnit(from);
  const ut = parseUnit(to);
  if (!uf) throw new Error(`Unità non riconosciuta: «${from}»`);
  if (!ut) throw new Error(`Unità non riconosciuta: «${to}»`);
  if (!dimEquals(uf.dim, ut.dim)) throw new Error(`Unità incompatibili: «${from}» → «${to}»`);
  const si = value * uf.factor + (uf.offset ?? 0);
  return (si - (ut.offset ?? 0)) / ut.factor;
}

export interface Quantity {
  /** Valore come scritto, prima dei prefissi. */
  value: number;
  /** Testo dell'unità come scritto (vuoto se assente). */
  unit: string;
  /** Valore in unità SI coerenti (prefissi applicati). */
  si: number;
  dim: Dim;
}

/** Separa un testo "numero + unità" (es. `4,7 kΩ`, `1.2e-3A`, `10 m/s^2`). */
export function splitNumberUnit(input: string): { number: string; unit: string } {
  const text = normalizeInput(input);
  // Parte numerica: cifre, separatori, segno, esponente e forme ×10^n
  const m =
    /^([+-]?[\d.,' ]*\d(?:[.,]\d*)?(?:\s*[eE][+-]?\d+|\s*[·×x*⋅]\s*10\s*(?:\^\s*\(?[+-]?\d+\)?|[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+))?|[+-]?[.,]\d+(?:[eE][+-]?\d+)?)\s*(.*)$/.exec(
      text,
    );
  if (!m) return { number: text, unit: '' };
  return { number: (m[1] as string).trim(), unit: (m[2] as string).trim() };
}

/** Interpreta una grandezza con unità facoltativa. `null` se numero o unità non sono validi. */
export function parseQuantity(input: string): Quantity | null {
  const { number, unit } = splitNumberUnit(input);
  const value = parseNumber(number);
  if (value === null) return null;
  const u = parseUnit(unit);
  if (!u) return null;
  return { value, unit, si: value * u.factor + (u.offset ?? 0), dim: u.dim };
}

// ───────────────────────────── formattazione ─────────────────────────────

/** Numero con `digits` cifre significative e separatore decimale della lingua. */
export function formatNumber(value: number, opts: { lang?: Lang; digits?: number } = {}): string {
  const { lang = 'it', digits = 4 } = opts;
  if (!Number.isFinite(value)) return String(value);
  if (value === 0) return '0';
  const abs = Math.abs(value);
  let out: string;
  if (abs >= 1e6 || abs < 1e-4) {
    const [m, e] = value.toExponential(Math.max(0, digits - 1)).split('e') as [string, string];
    out = `${trimZeros(m)}·10^${Number(e)}`;
  } else {
    out = trimZeros(Number(value.toPrecision(digits)).toString());
  }
  return lang === 'it' ? out.replace('.', ',') : out;
}

function trimZeros(s: string): string {
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}

/** Notazione ingegneristica con prefisso SI: `formatSI(4700, 'Ω')` → `4,7 kΩ`. */
export function formatSI(value: number, unit = '', opts: { lang?: Lang; digits?: number } = {}): string {
  const { digits = 3 } = opts;
  if (value === 0 || !Number.isFinite(value)) return `${formatNumber(value, opts)}${unit ? ` ${unit}` : ''}`;
  const abs = Math.abs(value);
  const prefixable = unit === '' || !!lookupUnit(unit)?.prefix;
  let chosen: [number, string] = [1, ''];
  if (prefixable && unit !== '') {
    for (const p of ENG_PREFIXES) {
      if (abs >= p[0] * 0.9995) {
        chosen = p;
        break;
      }
      chosen = p;
    }
  }
  const scaled = Number((value / chosen[0]).toPrecision(digits));
  return `${formatNumber(scaled, { ...opts, digits })}${unit ? ` ${chosen[1]}${unit}` : ''}`;
}

// ───────────────────────────── complessi ─────────────────────────────

export interface Complex {
  re: number;
  im: number;
}

export const complex = (re: number, im = 0): Complex => ({ re, im });
export const cAdd = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });
export const cSub = (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im });
export const cMul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});
export function cDiv(a: Complex, b: Complex): Complex {
  const d = b.re * b.re + b.im * b.im;
  if (d === 0) throw new RangeError('Divisione complessa per zero');
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
}
export const cConj = (a: Complex): Complex => ({ re: a.re, im: -a.im });
export const cAbs = (a: Complex): number => Math.hypot(a.re, a.im);
export const cArg = (a: Complex): number => Math.atan2(a.im, a.re);
export const cScale = (a: Complex, k: number): Complex => ({ re: a.re * k, im: a.im * k });
/** Da modulo e fase (radianti). */
export const fromPolar = (mod: number, phaseRad: number): Complex => ({
  re: mod * Math.cos(phaseRad),
  im: mod * Math.sin(phaseRad),
});
/** Parallelo di due impedenze: Z1·Z2/(Z1+Z2). */
export const cParallel = (a: Complex, b: Complex): Complex => cDiv(cMul(a, b), cAdd(a, b));

/** Riduce un angolo in radianti a (−π, π]. */
export function wrapAngle(rad: number): number {
  let a = rad % (2 * Math.PI);
  if (a <= -Math.PI) a += 2 * Math.PI;
  if (a > Math.PI) a -= 2 * Math.PI;
  return a;
}

const J_RE = /[ji]/;

/**
 * Interpreta un numero complesso. Forme ammesse:
 * - cartesiana: `3+4j`, `3 + j4`, `3-4i`, `-j2`, `j`, `2,5`, `(3+4j)`
 * - polare: `5∠53,13°`, `5∠53.13`, `5 ∠ 0,927 rad`, `5∠-π/6` (senza unità l'angolo è in gradi)
 * - esponenziale: `5e^(j30°)`, `5·e^{j0.5}`, `5 exp(j0,5)` (senza unità l'angolo è in radianti)
 */
export function parseComplex(input: string): Complex | null {
  let text = normalizeInput(input)
    .replace(/^\((.*)\)$/, '$1')
    .trim();
  if (text === '') return null;
  // forma polare con ∠ (o "/_" scritto a tastiera)
  text = text.replace(/\/_/g, '∠');
  const polar = /^(.*?)\s*∠\s*(.+)$/.exec(text);
  if (polar) {
    const mod = (polar[1] as string).trim() === '' ? 1 : parseNumber(polar[1] as string);
    const ang = parseAngle(polar[2] as string, 'deg');
    if (mod === null || ang === null) return null;
    return fromPolar(mod, ang);
  }
  const expo = /^(.*?)\s*[·*]?\s*(?:e\s*\^\s*[({]?|exp\s*\()\s*([+-]?)\s*[ji]\s*[·*]?\s*(.*?)\s*[)}]?$/.exec(
    text,
  );
  if (expo && /e\s*\^|exp\s*\(/.test(text)) {
    const modText = (expo[1] as string).trim();
    const mod = modText === '' ? 1 : parseNumber(modText);
    const ang = parseAngle((expo[3] as string).trim() || '1', 'rad');
    if (mod === null || ang === null) return null;
    return fromPolar(mod, (expo[2] === '-' ? -1 : 1) * ang);
  }
  // forma cartesiana: termini separati da + o - (non quelli dell'esponente)
  const compact = text.replace(/\s+/g, '');
  const terms = compact.match(/[+-]?(?:[^+-]|(?<=[eE])[+-])+/g);
  if (!terms || terms.join('') !== compact || terms.length > 2) return null;
  let re = 0;
  let im = 0;
  let seenRe = false;
  let seenIm = false;
  for (const term of terms) {
    if (J_RE.test(term)) {
      if (seenIm) return null;
      const signMatch = /^([+-]?)/.exec(term) as RegExpExecArray;
      const body = term.slice((signMatch[1] as string).length).replace(/^[ji][·*]?|[·*]?[ji]$/, '');
      if (J_RE.test(body)) return null;
      const mag = body === '' ? 1 : parseNumber(body);
      if (mag === null) return null;
      im = (signMatch[1] === '-' ? -1 : 1) * mag;
      seenIm = true;
    } else {
      if (seenRe) return null;
      const v = parseNumber(term);
      if (v === null) return null;
      re = v;
      seenRe = true;
    }
  }
  return { re, im };
}

/** Angolo in radianti; `fallback` indica l'unità se il testo non la specifica. Ammette multipli di π. */
export function parseAngle(input: string, fallback: 'deg' | 'rad'): number | null {
  const text = normalizeInput(input).replace(/\s+/g, '');
  const unitMatch = /(°|º|deg|rad)$/.exec(text);
  const unit = unitMatch ? (unitMatch[1] === 'rad' ? 'rad' : 'deg') : fallback;
  const body = unitMatch ? text.slice(0, -(unitMatch[1] as string).length) : text;
  let value: number | null;
  if (/π|pi/.test(body)) {
    const m = /^([+-]?[\d.,]*)\*?(?:π|pi)(?:\/([\d.,]+))?$/.exec(body);
    if (!m) return null;
    const k = m[1] === '' || m[1] === '+' ? 1 : m[1] === '-' ? -1 : parseNumber(m[1] as string);
    const div = m[2] ? parseNumber(m[2]) : 1;
    if (k === null || div === null || div === 0) return null;
    return (k * Math.PI) / div; // π implica radianti
  }
  value = parseNumber(body);
  if (value === null) return null;
  return unit === 'deg' ? (value * Math.PI) / 180 : value;
}

export interface ComplexQuantity {
  value: Complex;
  unit: string;
  /** Valore in SI (prefisso dell'unità applicato). */
  si: Complex;
  dim: Dim;
}

/** Complesso con unità facoltativa in coda: `10∠30° V`, `3+4j Ω`, `(2-j) kΩ`. */
export function parseComplexQuantity(input: string): ComplexQuantity | null {
  const text = normalizeInput(input);
  // Prova prima tutto come complesso adimensionale, poi stacca l'ultima parola come unità.
  const whole = parseComplex(text);
  if (whole) return { value: whole, unit: '', si: whole, dim: DIMLESS };
  const m = /^(.*?[\d)°a-z])\s*([A-Za-zΩµμ%][A-Za-zΩµμ·*/^\d²³⁻]*)$/.exec(text);
  if (!m) return null;
  const c = parseComplex(m[1] as string);
  const u = parseUnit(m[2] as string);
  if (!c || !u || u.offset) return null;
  return { value: c, unit: m[2] as string, si: cScale(c, u.factor), dim: u.dim };
}

/** Formatta un complesso in forma cartesiana (`3 + j4`) o polare (`5 ∠ 53,13°`). */
export function formatComplex(
  z: Complex,
  opts: { form?: 'cartesian' | 'polar'; lang?: Lang; digits?: number; imaginary?: 'j' | 'i' } = {},
): string {
  const { form = 'cartesian', imaginary = 'j' } = opts;
  if (form === 'polar') {
    const deg = (cArg(z) * 180) / Math.PI;
    return `${formatNumber(cAbs(z), opts)} ∠ ${formatNumber(Math.abs(deg) < 1e-12 ? 0 : deg, opts)}°`;
  }
  const re = Math.abs(z.re) < 1e-15 ? 0 : z.re;
  const im = Math.abs(z.im) < 1e-15 ? 0 : z.im;
  if (im === 0) return formatNumber(re, opts);
  const imPart = `${imaginary}${formatNumber(Math.abs(im), opts)}`;
  if (re === 0) return im < 0 ? `−${imPart}` : imPart;
  return `${formatNumber(re, opts)} ${im < 0 ? '−' : '+'} ${imPart}`;
}
