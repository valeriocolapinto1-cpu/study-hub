/**
 * Correzione deterministica delle risposte (nessuna AI, nessuna rete).
 *
 * - numeri con tolleranza relativa (default 1 %) e/o assoluta, con unità
 *   convertite in SI prima del confronto (`4,7 kΩ` = `4700 Ω`);
 * - cifre significative richieste;
 * - numeri complessi in qualunque forma accettata da `units.ts`;
 * - risposte multiple (più campi) e scelte multiple con credito parziale;
 * - diagnosi degli errori tipici: segno, fattore 2π, fattore 2, √2
 *   (efficace/picco), reciproco, ordine di grandezza, prefisso, unità,
 *   coniugato, fase in gradi/radianti, arrotondamento.
 *
 * Il motore restituisce codici; i testi bilingui sono in `FEEDBACK`.
 */

import {
  cAbs,
  cArg,
  cConj,
  cScale,
  cSub,
  dimEquals,
  DIMLESS,
  normalizeInput,
  parseComplex,
  parseComplexQuantity,
  parseQuantity,
  parseUnit,
  splitNumberUnit,
  wrapAngle,
  type Complex,
  type Lang,
} from './units';
import { roundSig } from './random';

export type FeedbackCode =
  | 'sign'
  | 'factor-2pi'
  | 'factor-2'
  | 'factor-sqrt2'
  | 'reciprocal'
  | 'magnitude'
  | 'unit-prefix'
  | 'unit-wrong'
  | 'unit-missing'
  | 'sigfigs'
  | 'rounding'
  | 'conjugate'
  | 'phase'
  | 'modulus'
  | 'deg-rad'
  | 'parse'
  | 'choice-partial';

export const FEEDBACK: Record<FeedbackCode, { it: string; en: string }> = {
  sign: {
    it: 'Il modulo è giusto ma il segno no: ricontrolla versi e convenzioni.',
    en: 'The magnitude is right but the sign is not: check directions and conventions.',
  },
  'factor-2pi': {
    it: 'Differisce di un fattore 2π: hai confuso frequenza f (Hz) e pulsazione ω (rad/s)?',
    en: 'Off by a factor of 2π: did you mix up frequency f (Hz) and angular frequency ω (rad/s)?',
  },
  'factor-2': {
    it: 'Differisce di un fattore 2: controlla coefficienti ½ e simmetrie.',
    en: 'Off by a factor of 2: check ½ coefficients and symmetries.',
  },
  'factor-sqrt2': {
    it: 'Differisce di √2: hai confuso valore efficace e valore di picco?',
    en: 'Off by √2: did you mix up RMS and peak values?',
  },
  reciprocal: {
    it: 'Hai scritto il reciproco del risultato atteso.',
    en: 'You wrote the reciprocal of the expected result.',
  },
  magnitude: {
    it: 'Le cifre sono giuste ma l’ordine di grandezza no: ricontrolla potenze di dieci e conversioni.',
    en: 'The digits are right but the order of magnitude is not: check powers of ten and conversions.',
  },
  'unit-prefix': {
    it: 'Sbagli di un fattore 1000: controlla il prefisso (k, m, µ, n…).',
    en: 'Off by a factor of 1000: check the prefix (k, m, µ, n…).',
  },
  'unit-wrong': {
    it: 'L’unità di misura non è compatibile con la grandezza richiesta.',
    en: 'The unit is not compatible with the requested quantity.',
  },
  'unit-missing': {
    it: 'Manca l’unità di misura: è stata assunta quella indicata.',
    en: 'The unit is missing: the indicated one was assumed.',
  },
  sigfigs: { it: 'Servono più cifre significative.', en: 'More significant figures are needed.' },
  rounding: {
    it: 'Molto vicino: probabilmente un arrotondamento intermedio troppo aggressivo.',
    en: 'Very close: probably an intermediate rounding that was too aggressive.',
  },
  conjugate: {
    it: 'Hai scritto il complesso coniugato: la parte immaginaria ha il segno opposto.',
    en: 'You wrote the complex conjugate: the imaginary part has the opposite sign.',
  },
  phase: { it: 'Il modulo è giusto, la fase no.', en: 'The magnitude is right, the phase is not.' },
  modulus: { it: 'La fase è giusta, il modulo no.', en: 'The phase is right, the magnitude is not.' },
  'deg-rad': {
    it: 'Sembra che tu abbia confuso gradi e radianti nella fase.',
    en: 'It looks like you mixed up degrees and radians in the phase.',
  },
  parse: {
    it: 'Non riesco a leggere la risposta: usa un numero (es. 4,7e-3), eventualmente con unità o in forma complessa (3+j4, 5∠53°).',
    en: 'I cannot read the answer: use a number (e.g. 4.7e-3), optionally with a unit or in complex form (3+j4, 5∠53°).',
  },
  'choice-partial': {
    it: 'Alcune scelte sono giuste, ma non tutte.',
    en: 'Some choices are right, but not all of them.',
  },
};

export function feedbackText(code: FeedbackCode, lang: Lang): string {
  return FEEDBACK[code][lang];
}

export type GradeStatus = 'correct' | 'partial' | 'wrong' | 'invalid' | 'blank';

export interface AnswerSpec {
  label: string;
  /** Valore atteso: numero, complesso, o testo (complesso "3+4j" o risposta testuale). */
  value: number | string | Complex;
  unit?: string;
  /** Tolleranza relativa (default 0,01 = 1 %). */
  tol?: number;
  /** Tolleranza assoluta (nell'unità `unit`), utile vicino a zero. */
  absTol?: number;
  /** Cifre significative minime richieste. */
  sigFigs?: number;
  /** Tipo di confronto; dedotto dal valore se assente. */
  kind?: 'number' | 'complex' | 'text';
  /** Per `text`: forme alternative accettate. */
  accept?: string[];
}

export interface FieldResult {
  label: string;
  status: GradeStatus;
  /** Punteggio del campo in [0, 1]. */
  score: number;
  feedback: FeedbackCode[];
  /** Valore letto (in unità `spec.unit`), se interpretabile. */
  given?: number | Complex | string;
  /** Errore relativo rispetto all'atteso. */
  relError?: number;
}

export const DEFAULT_TOL = 0.01;

/** Conta le cifre significative di un numero come scritto (`0,0450` → 3). */
export function countSigFigs(input: string): number {
  const { number } = splitNumberUnit(input);
  const mant = number
    .replace(/\s*(?:[eE][+-]?\d+|[·×x*⋅]\s*10.*)$/, '')
    .replace(/^[+-]/, '')
    .replace(/[' ]/g, '');
  const digits = mant.replace(/[.,]/g, '');
  const hasPoint = /[.,]/.test(mant);
  const stripped = digits.replace(/^0+/, '');
  if (stripped === '') return digits.length > 0 ? 1 : 0;
  return hasPoint ? stripped.length : stripped.replace(/0+$/, '').length || 1;
}

function within(given: number, expected: number, tol: number, absTol: number): boolean {
  return Math.abs(given - expected) <= Math.max(tol * Math.abs(expected), absTol) + 1e-15;
}

/**
 * Riconosce un errore tipico confrontando `given` con trasformazioni di `expected`.
 * Restituisce il primo codice che spiega lo scostamento, o `null`.
 */
export function diagnoseNumber(
  given: number,
  expected: number,
  tol = DEFAULT_TOL,
  absTol = 0,
): FeedbackCode | null {
  if (!Number.isFinite(given) || !Number.isFinite(expected)) return null;
  const t = Math.max(tol, 1e-6);
  const near = (x: number) => within(given, x, t, absTol);
  if (expected !== 0 && near(-expected)) return 'sign';
  const twoPi = 2 * Math.PI;
  if (near(expected * twoPi) || near(expected / twoPi)) return 'factor-2pi';
  if (near(expected * Math.SQRT2) || near(expected / Math.SQRT2)) return 'factor-sqrt2';
  if (near(expected * 2) || near(expected / 2)) return 'factor-2';
  if (expected !== 0 && Math.abs(expected) !== 1 && near(1 / expected)) return 'reciprocal';
  if (expected !== 0 && given !== 0) {
    const ratio = given / expected;
    const k = Math.round(Math.log10(Math.abs(ratio)));
    if (k !== 0 && near(expected * 10 ** k)) return k % 3 === 0 ? 'unit-prefix' : 'magnitude';
    if (k !== 0 && near(-expected * 10 ** k)) return 'magnitude';
  }
  if (within(given, expected, t * 5, absTol * 5)) return 'rounding';
  return null;
}

function inferKind(spec: AnswerSpec): 'number' | 'complex' | 'text' {
  if (spec.kind) return spec.kind;
  if (typeof spec.value === 'number') return 'number';
  if (typeof spec.value === 'object') return 'complex';
  return parseComplex(spec.value) ? 'complex' : 'text';
}

function expectedComplex(spec: AnswerSpec): Complex {
  if (typeof spec.value === 'object') return spec.value;
  if (typeof spec.value === 'number') return { re: spec.value, im: 0 };
  const z = parseComplex(spec.value);
  if (!z) throw new Error(`Valore atteso non valido per «${spec.label}»: ${spec.value}`);
  return z;
}

/** Normalizzazione per risposte testuali: minuscole, senza accenti, spazi compressi. */
export function normalizeText(s: string): string {
  return normalizeInput(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}+\-*/=<>^().,]+/gu, ' ')
    .trim();
}

/** Corregge un singolo campo. */
export function gradeField(spec: AnswerSpec, input: string): FieldResult {
  const base = { label: spec.label };
  const text = normalizeInput(input ?? '');
  if (text === '') return { ...base, status: 'blank', score: 0, feedback: [] };
  const kind = inferKind(spec);
  if (kind === 'text') {
    const accepted = [String(spec.value), ...(spec.accept ?? [])].map(normalizeText);
    const ok = accepted.includes(normalizeText(text));
    return { ...base, status: ok ? 'correct' : 'wrong', score: ok ? 1 : 0, feedback: [], given: text };
  }
  return kind === 'complex' ? gradeComplex(spec, text) : gradeNumber(spec, text);
}

/** Fattore della unità attesa verso SI, o 1 se la domanda è adimensionale. */
function unitInfo(spec: AnswerSpec) {
  const u = parseUnit(spec.unit ?? '');
  if (!u) throw new Error(`Unità attesa non valida per «${spec.label}»: ${spec.unit}`);
  return u;
}

function gradeNumber(spec: AnswerSpec, text: string): FieldResult {
  const base = { label: spec.label };
  const expected = typeof spec.value === 'number' ? spec.value : Number(spec.value);
  const tol = spec.tol ?? DEFAULT_TOL;
  const absTol = spec.absTol ?? 0;
  const feedback: FeedbackCode[] = [];
  const q = parseQuantity(text);
  if (!q) {
    // Forse ha scritto un complesso con parte immaginaria nulla
    const z = parseComplex(text);
    if (z && Math.abs(z.im) < 1e-12) return gradeNumber(spec, String(z.re));
    return { ...base, status: 'invalid', score: 0, feedback: ['parse'] };
  }
  const expUnit = unitInfo(spec);
  let given: number;
  if (q.unit === '') {
    given = q.value;
    if (spec.unit && !dimEquals(expUnit.dim, DIMLESS)) feedback.push('unit-missing');
  } else if (!dimEquals(q.dim, expUnit.dim)) {
    return { ...base, status: 'wrong', score: 0, feedback: ['unit-wrong'], given: q.value };
  } else {
    given = (q.si - (expUnit.offset ?? 0)) / expUnit.factor;
  }
  const relError = expected === 0 ? Math.abs(given) : Math.abs(given - expected) / Math.abs(expected);
  let ok = within(given, expected, tol, absTol);
  if (!ok && spec.sigFigs) {
    ok = roundSig(given, spec.sigFigs) === roundSig(expected, spec.sigFigs);
  }
  if (ok) {
    if (spec.sigFigs && countSigFigs(text) < spec.sigFigs) {
      return { ...base, status: 'partial', score: 0.5, feedback: [...feedback, 'sigfigs'], given, relError };
    }
    return { ...base, status: 'correct', score: 1, feedback, given, relError };
  }
  const code = diagnoseNumber(given, expected, tol, absTol);
  if (code) feedback.push(code);
  return { ...base, status: 'wrong', score: 0, feedback, given, relError };
}

function gradeComplex(spec: AnswerSpec, text: string): FieldResult {
  const base = { label: spec.label };
  const expected = expectedComplex(spec);
  const tol = spec.tol ?? DEFAULT_TOL;
  const absTol = spec.absTol ?? 0;
  const feedback: FeedbackCode[] = [];
  const q = parseComplexQuantity(text);
  if (!q) return { ...base, status: 'invalid', score: 0, feedback: ['parse'] };
  const expUnit = unitInfo(spec);
  let given: Complex;
  if (q.unit === '') {
    given = q.value;
    if (spec.unit && !dimEquals(expUnit.dim, DIMLESS)) feedback.push('unit-missing');
  } else if (!dimEquals(q.dim, expUnit.dim)) {
    return { ...base, status: 'wrong', score: 0, feedback: ['unit-wrong'], given: q.value };
  } else {
    given = cScale(q.si, 1 / expUnit.factor);
  }
  const scale = cAbs(expected);
  const err = cAbs(cSub(given, expected));
  const relError = scale === 0 ? err : err / scale;
  const close = (z: Complex) => cAbs(cSub(given, z)) <= Math.max(tol * scale, absTol) + 1e-15;
  if (close(expected)) return { ...base, status: 'correct', score: 1, feedback, given, relError };
  if (expected.im !== 0 && close(cConj(expected))) feedback.push('conjugate');
  else if (scale !== 0 && close(cScale(expected, -1))) feedback.push('sign');
  else if (scale !== 0 && within(cAbs(given), scale, tol, absTol)) {
    // modulo giusto: la fase è stata scritta in radianti come se fossero gradi o viceversa?
    const phiE = cArg(expected);
    const phiG = cArg(given);
    const degAsRad = wrapAngle((phiE * 180) / Math.PI);
    const radAsDeg = wrapAngle((phiE * Math.PI) / 180);
    const angTol = Math.max(0.02, tol * Math.PI);
    if (Math.abs(wrapAngle(phiG - degAsRad)) < angTol || Math.abs(wrapAngle(phiG - radAsDeg)) < angTol)
      feedback.push('deg-rad');
    else feedback.push('phase');
  } else if (
    scale !== 0 &&
    cAbs(given) !== 0 &&
    Math.abs(wrapAngle(cArg(given) - cArg(expected))) < Math.max(0.01, tol)
  ) {
    feedback.push('modulus');
    const code = diagnoseNumber(cAbs(given), scale, tol, absTol);
    if (code && code !== 'sign') feedback.push(code);
  }
  return { ...base, status: 'wrong', score: 0, feedback, given, relError };
}

export interface MultiResult {
  status: GradeStatus;
  /** Punteggio complessivo in [0, 1]: media dei campi. */
  score: number;
  fields: FieldResult[];
}

function aggregate(fields: FieldResult[]): MultiResult {
  const score = fields.length ? fields.reduce((s, f) => s + f.score, 0) / fields.length : 0;
  let status: GradeStatus;
  if (fields.every((f) => f.status === 'blank')) status = 'blank';
  else if (fields.every((f) => f.status === 'correct')) status = 'correct';
  else if (score > 0) status = 'partial';
  else if (fields.every((f) => f.status === 'invalid' || f.status === 'blank')) status = 'invalid';
  else status = 'wrong';
  return { status, score, fields };
}

/** Corregge una risposta a più campi (es. V e I, oppure parte reale e fase). */
export function gradeAnswers(
  specs: readonly AnswerSpec[],
  inputs: readonly string[] | Record<string, string>,
): MultiResult {
  const get = (spec: AnswerSpec, i: number) =>
    (Array.isArray(inputs) ? inputs[i] : (inputs as Record<string, string>)[spec.label]) ?? '';
  return aggregate(specs.map((spec, i) => gradeField(spec, get(spec, i))));
}

export interface ChoiceSpec {
  /** Indici delle opzioni corrette (una sola = scelta singola). */
  correct: number | readonly number[];
  /** Ammette più risposte (checkbox)? Dedotto da `correct` se assente. */
  multiple?: boolean;
}

/**
 * Corregge una scelta. Per la scelta multipla il credito è
 * (giuste − sbagliate) / corrette, limitato a [0, 1]: chi spunta tutto non prende punti.
 */
export function gradeChoice(spec: ChoiceSpec, selected: readonly number[]): MultiResult {
  const correct = new Set(typeof spec.correct === 'number' ? [spec.correct] : spec.correct);
  const label = 'choice';
  if (selected.length === 0) return aggregate([{ label, status: 'blank', score: 0, feedback: [] }]);
  const multiple = spec.multiple ?? correct.size > 1;
  if (!multiple) {
    const ok = correct.has(selected[0] as number);
    return aggregate([{ label, status: ok ? 'correct' : 'wrong', score: ok ? 1 : 0, feedback: [] }]);
  }
  const uniq = [...new Set(selected)];
  const right = uniq.filter((i) => correct.has(i)).length;
  const wrong = uniq.length - right;
  const score = Math.max(0, Math.min(1, (right - wrong) / correct.size));
  const status: GradeStatus = score === 1 ? 'correct' : score > 0 ? 'partial' : 'wrong';
  return aggregate([{ label, status, score, feedback: status === 'partial' ? ['choice-partial'] : [] }]);
}
