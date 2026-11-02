// Numeri complessi con parte reale e immaginaria razionali (aritmetica esatta).
import { Rational } from './rational.js';

export class Cx {
  constructor(re = 0, im = 0) { this.re = Rational.from(re); this.im = Rational.from(im); Object.freeze(this); }
  static from(x) { return x instanceof Cx ? x : new Cx(x, 0); }
  add(o) { o = Cx.from(o); return new Cx(this.re.add(o.re), this.im.add(o.im)); }
  sub(o) { o = Cx.from(o); return new Cx(this.re.sub(o.re), this.im.sub(o.im)); }
  mul(o) { o = Cx.from(o); return new Cx(this.re.mul(o.re).sub(this.im.mul(o.im)), this.re.mul(o.im).add(this.im.mul(o.re))); }
  neg() { return new Cx(this.re.neg(), this.im.neg()); }
  conj() { return new Cx(this.re, this.im.neg()); }
  abs2() { return this.re.mul(this.re).add(this.im.mul(this.im)); }
  div(o) {
    o = Cx.from(o); const d = o.abs2();
    if (d.isZero()) throw new RangeError('Divisione per zero');
    const nn = this.mul(o.conj());
    return new Cx(nn.re.div(d), nn.im.div(d));
  }
  inv() { return Cx.ONE.div(this); }
  isZero() { return this.re.isZero() && this.im.isZero(); }
  isReal() { return this.im.isZero(); }
  eq(o) { o = Cx.from(o); return this.re.eq(o.re) && this.im.eq(o.im); }
  abs() { return Math.hypot(this.re.toNumber(), this.im.toNumber()); }
  arg() { return Math.atan2(this.im.toNumber(), this.re.toNumber()); }
  toNumbers() { return [this.re.toNumber(), this.im.toNumber()]; }
  toString() {
    if (this.im.isZero()) return this.re.toString();
    if (this.re.isZero()) return `${this.im}j`;
    return `${this.re}${this.im.sign() < 0 ? '-' : '+'}${this.im.abs()}j`;
  }
  toLatex() {
    if (this.im.isZero()) return this.re.toLatex();
    const imp = this.im.abs().eq(1) ? '' : this.im.abs().toLatex();
    const j = `${imp}j`;
    if (this.re.isZero()) return (this.im.sign() < 0 ? '-' : '') + j;
    return `${this.re.toLatex()} ${this.im.sign() < 0 ? '-' : '+'} ${j}`;
  }
}
Cx.ZERO = new Cx(0, 0);
Cx.ONE = new Cx(1, 0);
Cx.J = new Cx(0, 1);
export const C = (re, im = 0) => new Cx(re, im);
