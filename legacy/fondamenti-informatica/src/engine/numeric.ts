/**
 * Primitive numeriche: complemento a 2, esadecimale, range, overflow.
 * Sono il nucleo su cui si regge la correttezza dei generatori, quindi sono
 * funzioni pure e coperte da test.
 */

/**
 * Tetto a 32 bit. Basta e avanza per il programma (si lavora su 4, 8, 16, 32)
 * e tiene ogni calcolo dentro gli interi esatti: `a + b` su 32 bit sta sotto
 * Number.MAX_SAFE_INTEGER, quindi nessun risultato può essere arrotondato di
 * nascosto. Meglio fallire che restituire un numero plausibile ma sbagliato.
 */
const MAX_BITS = 32;

function assertBits(bits: number): void {
  if (!Number.isInteger(bits) || bits < 1 || bits > MAX_BITS) {
    throw new RangeError(`numero di bit non valido: ${bits} (ammessi 1…${MAX_BITS})`);
  }
}

/** Tiene solo 0 e 1: usata per ripulire l'input dell'utente. */
export function cleanBin(s: string): string {
  return s.replace(/[^01]/g, '');
}

/**
 * Rappresentazione su `bits` bit, con wrap in [0, 2^bits).
 * Per i negativi produce direttamente il complemento a 2.
 */
export function toBin(n: number, bits: number): string {
  assertBits(bits);
  const mod = 2 ** bits;
  const wrapped = ((Math.trunc(n) % mod) + mod) % mod;
  return wrapped.toString(2).padStart(bits, '0');
}

/** Legge una stringa binaria come intero in complemento a 2. */
export function fromBinCP2(s: string, bits: number): number {
  assertBits(bits);
  const padded = cleanBin(s).padStart(bits, '0').slice(-bits);
  const value = Number.parseInt(padded, 2);
  return padded.startsWith('1') ? value - 2 ** bits : value;
}

/** Il valore è rappresentabile in complemento a 2 su `bits` bit? */
export function cp2Valid(n: number, bits: number): boolean {
  const { min, max } = rangeFor(bits, true);
  return n >= min && n <= max;
}

export function rangeFor(bits: number, signed: boolean): { min: number; max: number } {
  assertBits(bits);
  return signed
    ? { min: -(2 ** (bits - 1)), max: 2 ** (bits - 1) - 1 }
    : { min: 0, max: 2 ** bits - 1 };
}

export function toHex(n: number, minDigits = 1): string {
  const sign = n < 0 ? '-' : '';
  return sign + Math.abs(Math.trunc(n)).toString(16).toUpperCase().padStart(minDigits, '0');
}

export interface AddResult {
  /** Risultato letto in complemento a 2 su `bits` bit (quindi già wrappato). */
  sum: number;
  binary: string;
  /**
   * Overflow di complemento a 2: XOR fra il riporto entrante e quello uscente
   * dal bit di segno.
   */
  overflow: boolean;
  /**
   * Riporto uscente dal bit più significativo. Tenuto **separato**
   * dall'overflow: sono cose diverse e confonderli è una classica perdita di
   * punti all'esame (in CP2 il carry out da solo non segnala nulla).
   */
  carryOut: boolean;
}

/** Somma in complemento a 2 su `bits` bit, con entrambi i flag. */
export function addTwos(a: number, b: number, bits: number): AddResult {
  assertBits(bits);
  const mod = 2 ** bits;
  const half = 2 ** (bits - 1);

  const ua = ((Math.trunc(a) % mod) + mod) % mod;
  const ub = ((Math.trunc(b) % mod) + mod) % mod;

  // Riporto entrante nel bit di segno = riporto prodotto dai bit inferiori.
  // Modulo e non `&`: gli operatori bit a bit di JS troncano a 32 bit con
  // segno, e a 32 bit pieni darebbero il risultato sbagliato.
  const carryIntoSign = (ua % half) + (ub % half) >= half;

  const raw = ua + ub;
  const carryOut = raw >= mod;
  const wrapped = raw % mod;

  return {
    sum: wrapped >= half ? wrapped - mod : wrapped,
    binary: wrapped.toString(2).padStart(bits, '0'),
    overflow: carryIntoSign !== carryOut,
    carryOut,
  };
}

/** Sottrazione in complemento a 2: `a - b` è `a + (-b)`. */
export function subTwos(a: number, b: number, bits: number): AddResult {
  return addTwos(a, -b, bits);
}
