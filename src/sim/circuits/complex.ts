/**
 * Numeri complessi immutabili in virgola mobile (doppia precisione).
 * Usati dall'analisi in regime sinusoidale (fasori) e dalla risposta in frequenza.
 */
export class Complex {
  readonly re: number;
  readonly im: number;

  constructor(re = 0, im = 0) {
    this.re = re;
    this.im = im;
  }

  static readonly ZERO = new Complex(0, 0);
  static readonly ONE = new Complex(1, 0);
  static readonly J = new Complex(0, 1);

  /** Converte un numero o un complesso in complesso. */
  static from(x: number | Complex): Complex {
    return typeof x === 'number' ? new Complex(x, 0) : x;
  }

  /** Forma polare: modulo e fase in radianti. */
  static polar(mag: number, phaseRad = 0): Complex {
    return new Complex(mag * Math.cos(phaseRad), mag * Math.sin(phaseRad));
  }

  /** Forma polare con fase in gradi (comoda per i fasori scritti a mano). */
  static polarDeg(mag: number, phaseDeg = 0): Complex {
    return Complex.polar(mag, (phaseDeg * Math.PI) / 180);
  }

  add(o: number | Complex): Complex {
    const b = Complex.from(o);
    return new Complex(this.re + b.re, this.im + b.im);
  }

  sub(o: number | Complex): Complex {
    const b = Complex.from(o);
    return new Complex(this.re - b.re, this.im - b.im);
  }

  mul(o: number | Complex): Complex {
    if (typeof o === 'number') return new Complex(this.re * o, this.im * o);
    return new Complex(this.re * o.re - this.im * o.im, this.re * o.im + this.im * o.re);
  }

  div(o: number | Complex): Complex {
    if (typeof o === 'number') {
      if (o === 0) throw new RangeError('Divisione per zero');
      return new Complex(this.re / o, this.im / o);
    }
    // Algoritmo di Smith: evita overflow/underflow intermedi.
    const { re: c, im: d } = o;
    if (c === 0 && d === 0) throw new RangeError('Divisione per zero');
    if (Math.abs(c) >= Math.abs(d)) {
      const r = d / c;
      const den = c + d * r;
      return new Complex((this.re + this.im * r) / den, (this.im - this.re * r) / den);
    }
    const r = c / d;
    const den = c * r + d;
    return new Complex((this.re * r + this.im) / den, (this.im * r - this.re) / den);
  }

  inv(): Complex {
    return Complex.ONE.div(this);
  }

  neg(): Complex {
    return new Complex(-this.re, -this.im);
  }

  conj(): Complex {
    return new Complex(this.re, -this.im);
  }

  /** Modulo. */
  abs(): number {
    return Math.hypot(this.re, this.im);
  }

  /** Fase in radianti, in (−π, π]. */
  arg(): number {
    return Math.atan2(this.im, this.re);
  }

  /** Fase in gradi, in (−180°, 180°]. */
  argDeg(): number {
    return (this.arg() * 180) / Math.PI;
  }

  isZero(eps = 0): boolean {
    return Math.abs(this.re) <= eps && Math.abs(this.im) <= eps;
  }

  /** Uguaglianza con tolleranza relativa/assoluta. */
  approxEq(o: number | Complex, rel = 1e-9, abs = 1e-12): boolean {
    const b = Complex.from(o);
    const d = this.sub(b).abs();
    return d <= abs + rel * Math.max(this.abs(), b.abs());
  }

  toString(digits = 4): string {
    const f = (x: number): string => Number(x.toPrecision(digits)).toString();
    if (this.im === 0) return f(this.re);
    if (this.re === 0) return `${f(this.im)}j`;
    return `${f(this.re)}${this.im < 0 ? '−' : '+'}${f(Math.abs(this.im))}j`;
  }
}

/** Abbreviazione: `cx(3, 4)` = 3 + 4j. */
export const cx = (re: number, im = 0): Complex => new Complex(re, im);
