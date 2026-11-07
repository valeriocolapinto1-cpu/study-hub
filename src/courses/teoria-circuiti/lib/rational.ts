/**
 * Numeri razionali esatti su BigInt (immutabili, sempre ridotti, denominatore > 0).
 * Servono ai generatori per ottenere risultati "da tema d'esame" (frazioni piccole) e
 * soluzioni esatte, mai approssimate.
 */
const gcd = (a: bigint, b: bigint): bigint => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
};

export type RationalLike = Rational | number | bigint | string;

export class Rational {
  readonly n: bigint;
  readonly d: bigint;
  constructor(n: bigint | number, d: bigint | number = 1n) {
    let nn = BigInt(n);
    let dd = BigInt(d);
    if (dd === 0n) throw new RangeError('Divisione per zero');
    if (dd < 0n) {
      nn = -nn;
      dd = -dd;
    }
    const g = gcd(nn, dd) || 1n;
    this.n = nn / g;
    this.d = dd / g;
    Object.freeze(this);
  }
  static readonly ZERO = new Rational(0n);
  static readonly ONE = new Rational(1n);
  /** Da intero, stringa «a/b» o decimale «1.25», o altro Rational. */
  static from(x: RationalLike): Rational {
    if (x instanceof Rational) return x;
    if (typeof x === 'bigint') return new Rational(x);
    if (typeof x === 'number') {
      if (!Number.isFinite(x)) throw new RangeError('Numero non finito');
      if (Number.isInteger(x)) return new Rational(BigInt(x));
      return Rational.from(String(x));
    }
    const s = String(x).trim().replace(',', '.').replace('−', '-');
    let m = /^([+-]?\d+)\s*\/\s*([+-]?\d+)$/.exec(s);
    if (m) return new Rational(BigInt(m[1]!), BigInt(m[2]!));
    m = /^([+-]?)(\d*)\.?(\d*)$/.exec(s);
    if (m && (m[2] || m[3])) {
      const frac = m[3] ?? '';
      const num = BigInt((m[1] === '-' ? '-' : '') + ((m[2] || '0') + frac));
      return new Rational(num, 10n ** BigInt(frac.length));
    }
    throw new SyntaxError('Razionale non valido: ' + x);
  }
  add(o: RationalLike): Rational {
    const q = Rational.from(o);
    return new Rational(this.n * q.d + q.n * this.d, this.d * q.d);
  }
  sub(o: RationalLike): Rational {
    const q = Rational.from(o);
    return new Rational(this.n * q.d - q.n * this.d, this.d * q.d);
  }
  mul(o: RationalLike): Rational {
    const q = Rational.from(o);
    return new Rational(this.n * q.n, this.d * q.d);
  }
  div(o: RationalLike): Rational {
    const q = Rational.from(o);
    if (q.n === 0n) throw new RangeError('Divisione per zero');
    return new Rational(this.n * q.d, this.d * q.n);
  }
  neg(): Rational {
    return new Rational(-this.n, this.d);
  }
  inv(): Rational {
    return Rational.ONE.div(this);
  }
  abs(): Rational {
    return this.n < 0n ? this.neg() : this;
  }
  cmp(o: RationalLike): number {
    const q = Rational.from(o);
    const l = this.n * q.d;
    const r = q.n * this.d;
    return l < r ? -1 : l > r ? 1 : 0;
  }
  eq(o: RationalLike): boolean {
    return this.cmp(o) === 0;
  }
  lt(o: RationalLike): boolean {
    return this.cmp(o) < 0;
  }
  gt(o: RationalLike): boolean {
    return this.cmp(o) > 0;
  }
  isZero(): boolean {
    return this.n === 0n;
  }
  isInteger(): boolean {
    return this.d === 1n;
  }
  sign(): -1 | 0 | 1 {
    return this.n === 0n ? 0 : this.n < 0n ? -1 : 1;
  }
  toNumber(): number {
    const lim = 10n ** 300n;
    if ((this.n < 0n ? -this.n : this.n) < lim && this.d < lim) return Number(this.n) / Number(this.d);
    const shift = BigInt(Math.max(this.n.toString(2).length, this.d.toString(2).length) - 1000);
    return Number(this.n >> shift) / Number(this.d >> shift);
  }
  toString(): string {
    return this.d === 1n ? String(this.n) : `${this.n}/${this.d}`;
  }
  /** LaTeX: \frac{a}{b} con il segno davanti. */
  toLatex(): string {
    if (this.d === 1n) return String(this.n);
    return `${this.n < 0n ? '-' : ''}\\frac{${this.n < 0n ? -this.n : this.n}}{${this.d}}`;
  }
  /** Decimale con `digits` cifre e separatore `sep`. */
  toDecimal(digits = 3, sep = '.'): string {
    const f = 10n ** BigInt(digits);
    let q = (this.n * f * 2n + (this.n < 0n ? -this.d : this.d)) / (this.d * 2n);
    const neg = q < 0n;
    if (neg) q = -q;
    const s = q.toString().padStart(digits + 1, '0');
    const out = digits ? `${s.slice(0, -digits)}${sep}${s.slice(-digits)}` : s;
    return (neg && q !== 0n ? '-' : '') + out;
  }
}

export const R = (x: RationalLike, y?: RationalLike): Rational =>
  y === undefined ? Rational.from(x) : Rational.from(x).div(Rational.from(y));
