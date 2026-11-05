import test from 'node:test';
import assert from 'node:assert/strict';
import { Rational, R } from '../assets/js/rational.js';
import { Cx, C } from '../assets/js/complex.js';
import { makeRng } from '../assets/js/rng.js';

const rr = (rng) => R(rng.int(-30, 30), rng.int(1, 12));

test('Rational: normalizzazione e parsing', () => {
  assert.equal(R(6, -4).toString(), '-3/2');
  assert.equal(Rational.from('1.25').toString(), '5/4');
  assert.equal(Rational.from('-0,5').toString(), '-1/2');
  assert.equal(Rational.from('3/9').toString(), '1/3');
  assert.equal(Rational.from(7).toString(), '7');
  assert.throws(() => R(1, 0));
  assert.throws(() => Rational.from('abc'));
});

test('Rational: proprietà algebriche su 500 terne casuali', () => {
  const rng = makeRng(42);
  for (let i = 0; i < 500; i++) {
    const a = rr(rng), b = rr(rng), c = rr(rng);
    assert.ok(a.add(b).eq(b.add(a)));
    assert.ok(a.mul(b).eq(b.mul(a)));
    assert.ok(a.add(b).add(c).eq(a.add(b.add(c))));
    assert.ok(a.mul(b.add(c)).eq(a.mul(b).add(a.mul(c))));
    assert.ok(a.sub(a).isZero());
    if (!b.isZero()) assert.ok(a.div(b).mul(b).eq(a));
    assert.ok(a.neg().add(a).isZero());
    assert.ok(a.cmp(b) === -b.cmp(a));
  }
});

test('Rational: forma ridotta, denominatore positivo, nessun float', () => {
  const x = R(1, 3).add(R(1, 6));
  assert.equal(x.toString(), '1/2');
  assert.equal(R(1, 3).mul(3).toString(), '1');
  assert.equal(R(-3, 7).toLatex(), '-\\frac{3}{7}');
  assert.equal(R(2, 3).toDecimal(2), '0,67');
  assert.equal(R(-1, 3).toDecimal(3), '-0,333');
  assert.equal(R(1, 3).pow(-2).toString(), '9');
  // somma di 1/k fino a 30 è esatta e ridotta
  let s = R(0); for (let k = 1; k <= 30; k++) s = s.add(R(1, k));
  assert.equal(s.toString(), '9304682830147/2329089562800');
});

test('Cx: algebra di campo', () => {
  const rng = makeRng(7);
  const cc = () => new Cx(rr(rng), rr(rng));
  for (let i = 0; i < 300; i++) {
    const a = cc(), b = cc(), c = cc();
    assert.ok(a.mul(b).eq(b.mul(a)));
    assert.ok(a.mul(b.add(c)).eq(a.mul(b).add(a.mul(c))));
    if (!b.isZero()) assert.ok(a.div(b).mul(b).eq(a));
    assert.ok(a.mul(a.conj()).isReal());
    assert.ok(a.mul(a.conj()).re.eq(a.abs2()));
  }
});

test('Cx: valori noti', () => {
  assert.ok(Cx.J.mul(Cx.J).eq(C(-1)));
  assert.ok(C(1, 1).inv().eq(C('1/2', '-1/2')));
  assert.equal(C(3, -2).toString(), '3-2j');
  assert.throws(() => Cx.ONE.div(Cx.ZERO));
});

test('rng: riproducibile con lo stesso seed', () => {
  const a = makeRng('x'), b = makeRng('x'), c = makeRng('y');
  const sa = Array.from({ length: 5 }, () => a.int(0, 1000)), sb = Array.from({ length: 5 }, () => b.int(0, 1000));
  assert.deepEqual(sa, sb);
  assert.notDeepEqual(sa, Array.from({ length: 5 }, () => c.int(0, 1000)));
});
