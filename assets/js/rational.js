// Numeri razionali esatti su BigInt. Immutabili; sempre ridotti ai minimi termini con denominatore > 0.
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };

export class Rational {
  constructor(n, d = 1n) {
    n = BigInt(n); d = BigInt(d);
    if (d === 0n) throw new RangeError('Divisione per zero');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d) || 1n;
    this.n = n / g; this.d = d / g;
    Object.freeze(this);
  }
  /** Crea da intero, stringa «a/b» o decimale «1.25», o altro Rational. */
  static from(x) {
    if (x instanceof Rational) return x;
    if (typeof x === 'bigint') return new Rational(x);
    if (typeof x === 'number') {
      if (!Number.isFinite(x)) throw new RangeError('Numero non finito');
      if (Number.isInteger(x)) return new Rational(BigInt(x));
      return Rational.from(String(x));
    }
    const s = String(x).trim().replace(',', '.').replace('−', '-');
    let m = /^([+-]?\d+)\s*\/\s*([+-]?\d+)$/.exec(s);
    if (m) return new Rational(BigInt(m[1]), BigInt(m[2]));
    m = /^([+-]?)(\d*)\.?(\d*)$/.exec(s);
    if (m && (m[2] || m[3])) {
      const frac = m[3] || '';
      const num = BigInt((m[1] === '-' ? '-' : '') + ((m[2] || '0') + frac));
      return new Rational(num, 10n ** BigInt(frac.length));
    }
    throw new SyntaxError('Razionale non valido: ' + x);
  }
  add(o) { o = Rational.from(o); return new Rational(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Rational.from(o); return new Rational(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Rational.from(o); return new Rational(this.n * o.n, this.d * o.d); }
  div(o) { o = Rational.from(o); if (o.n === 0n) throw new RangeError('Divisione per zero'); return new Rational(this.n * o.d, this.d * o.n); }
  neg() { return new Rational(-this.n, this.d); }
  inv() { return Rational.ONE.div(this); }
  abs() { return this.n < 0n ? this.neg() : this; }
  pow(k) {
    if (!Number.isInteger(k)) throw new TypeError('esponente intero');
    if (k < 0) return this.pow(-k).inv();
    return new Rational(this.n ** BigInt(k), this.d ** BigInt(k));
  }
  cmp(o) { o = Rational.from(o); const l = this.n * o.d, r = o.n * this.d; return l < r ? -1 : l > r ? 1 : 0; }
  eq(o) { return this.cmp(o) === 0; }
  lt(o) { return this.cmp(o) < 0; }
  gt(o) { return this.cmp(o) > 0; }
  isZero() { return this.n === 0n; }
  isInteger() { return this.d === 1n; }
  sign() { return this.n === 0n ? 0 : this.n < 0n ? -1 : 1; }
  toNumber() {
    // Divisione robusta anche per BigInt molto grandi.
    const n = this.n, d = this.d;
    const lim = 10n ** 300n;
    if ((n < 0n ? -n : n) < lim && d < lim) return Number(n) / Number(d);
    const shift = BigInt(Math.max(n.toString(2).length, d.toString(2).length) - 1000);
    return Number(n >> shift) / Number(d >> shift);
  }
  toString() { return this.d === 1n ? String(this.n) : `${this.n}/${this.d}`; }
  /** LaTeX: \frac{a}{b} con segno davanti. */
  toLatex() {
    if (this.d === 1n) return String(this.n);
    return `${this.n < 0n ? '-' : ''}\\frac{${this.n < 0n ? -this.n : this.n}}{${this.d}}`;
  }
  /** Decimale con `digits` cifre, utile per mostrare valori accanto alla frazione. */
  toDecimal(digits = 3) {
    const f = 10n ** BigInt(digits);
    let q = (this.n * f * 2n + (this.n < 0n ? -this.d : this.d)) / (this.d * 2n);
    const neg = q < 0n; if (neg) q = -q;
    let s = q.toString().padStart(digits + 1, '0');
    const out = digits ? `${s.slice(0, -digits)},${s.slice(-digits)}` : s;
    return (neg && q !== 0n ? '-' : '') + out;
  }
  /** Dimensione «estetica»: max cifre di numeratore e denominatore. */
  size() { return Math.max(this.n.toString().replace('-', '').length, this.d.toString().length); }
}
Rational.ZERO = new Rational(0n);
Rational.ONE = new Rational(1n);
export const R = (x, y) => (y === undefined ? Rational.from(x) : Rational.from(x).div(Rational.from(y)));
