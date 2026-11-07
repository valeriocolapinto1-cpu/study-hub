/** Numeri complessi con parte reale e immaginaria razionali (aritmetica esatta). */
import { Rational, type RationalLike } from './rational';

export type CxLike = Cx | RationalLike;

export class Cx {
  readonly re: Rational;
  readonly im: Rational;
  constructor(re: RationalLike = 0, im: RationalLike = 0) {
    this.re = Rational.from(re);
    this.im = Rational.from(im);
    Object.freeze(this);
  }
  static readonly ZERO = new Cx(0, 0);
  static readonly ONE = new Cx(1, 0);
  static readonly J = new Cx(0, 1);
  static from(x: CxLike): Cx {
    return x instanceof Cx ? x : new Cx(x, 0);
  }
  add(o: CxLike): Cx {
    const c = Cx.from(o);
    return new Cx(this.re.add(c.re), this.im.add(c.im));
  }
  sub(o: CxLike): Cx {
    const c = Cx.from(o);
    return new Cx(this.re.sub(c.re), this.im.sub(c.im));
  }
  mul(o: CxLike): Cx {
    const c = Cx.from(o);
    return new Cx(this.re.mul(c.re).sub(this.im.mul(c.im)), this.re.mul(c.im).add(this.im.mul(c.re)));
  }
  neg(): Cx {
    return new Cx(this.re.neg(), this.im.neg());
  }
  conj(): Cx {
    return new Cx(this.re, this.im.neg());
  }
  abs2(): Rational {
    return this.re.mul(this.re).add(this.im.mul(this.im));
  }
  div(o: CxLike): Cx {
    const c = Cx.from(o);
    const d = c.abs2();
    if (d.isZero()) throw new RangeError('Divisione per zero');
    const nn = this.mul(c.conj());
    return new Cx(nn.re.div(d), nn.im.div(d));
  }
  inv(): Cx {
    return Cx.ONE.div(this);
  }
  isZero(): boolean {
    return this.re.isZero() && this.im.isZero();
  }
  isReal(): boolean {
    return this.im.isZero();
  }
  eq(o: CxLike): boolean {
    const c = Cx.from(o);
    return this.re.eq(c.re) && this.im.eq(c.im);
  }
  abs(): number {
    return Math.hypot(this.re.toNumber(), this.im.toNumber());
  }
  toString(): string {
    if (this.im.isZero()) return this.re.toString();
    if (this.re.isZero()) return `${this.im}j`;
    return `${this.re}${this.im.sign() < 0 ? '-' : '+'}${this.im.abs()}j`;
  }
  toLatex(): string {
    if (this.im.isZero()) return this.re.toLatex();
    const imp = this.im.abs().eq(1) ? '' : this.im.abs().toLatex();
    const j = `${imp}j`;
    if (this.re.isZero()) return (this.im.sign() < 0 ? '-' : '') + j;
    return `${this.re.toLatex()} ${this.im.sign() < 0 ? '-' : '+'} ${j}`;
  }
}
