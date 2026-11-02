import test from 'node:test';
import assert from 'node:assert/strict';
import { compile, evaluate, parseNumber, ParseError } from '../assets/js/grader/expr.js';
import { compareExpr, gradeNumber, gradeAnswer } from '../assets/js/grader/exercise.js';
import { generate } from '../assets/js/generator.js';

const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(b));

test('parser: aritmetica, frazioni, decimali, potenze, implicita moltiplicazione', () => {
  assert.equal(evaluate('3/4'), 0.75);
  assert.equal(evaluate('-0,25'), -0.25);
  assert.equal(evaluate('2^3^2'), 2 ** 9);
  assert.equal(evaluate('2(3+4)'), 14);
  assert.equal(evaluate('2*3+4/2-1'), 7);
  assert.equal(evaluate('−5 · 2'), -10);
  assert.ok(close(evaluate('sqrt(2)*sqrt(2)'), 2));
  assert.ok(close(evaluate('pi'), Math.PI));
});

test('parser: funzioni in t e forme equivalenti di una stessa sinusoide', () => {
  const t = 0.7;
  const target = Math.cos(t) + Math.sin(t);
  for (const s of ['cos(t)+sin(t)', 'cos t + sin t', 'sqrt(2)cos(t-pi/4)', 'sqrt(2)*cos(t-45°)', '√2 cos(t − 45°)', 'sqrt(2) sin(t+pi/4)', 'cost+sint']) {
    assert.ok(close(evaluate(s, { t }), target, 1e-9), s);
  }
  assert.ok(close(evaluate('6e^(-t/6)', { t: 2 }), 6 * Math.exp(-1 / 3)));
  assert.ok(close(evaluate('6*exp(-t/6)*u(t)', { t: 2 }), 6 * Math.exp(-1 / 3)));
  assert.equal(evaluate('u(t)', { t: -1 }), 0);
  assert.equal(evaluate('u_{-1}(t)', { t: 1 }), 1);
  assert.ok(close(evaluate('2cos(2t)', { t: 1 }), 2 * Math.cos(2)));
});

test('parser: input errati o pericolosi sono rifiutati senza eseguire codice', () => {
  for (const bad of ['1+', '', '()', 'foo(t)', 't^^2', '3 $ 4', 'constructor', '__proto__', 'process.exit()', 'while(1){}', '1..2', 'cos(', '2)', 'a=1', 'alert(1)', 'x'.repeat(300)]) {
    assert.throws(() => evaluate(bad, { t: 1 }), (e) => e instanceof ParseError, bad);
  }
  assert.throws(() => evaluate('t', {}), ParseError); // variabile non definita
  assert.throws(() => evaluate('1/0'), ParseError); // non finito
});

test('parseNumber: unità finali ignorate', () => {
  assert.equal(parseNumber('12 V'), 12);
  assert.equal(parseNumber('3/4 Ω'), 0.75);
  assert.equal(parseNumber('-2,5 A'), -2.5);
});

test('gradeNumber: tolleranza e rifiuto', () => {
  assert.ok(gradeNumber('0.378', 14 / 37).ok === false || gradeNumber('0.378', 14 / 37, { tol: 5e-3 }).ok);
  assert.ok(gradeNumber('14/37', 14 / 37).ok);
  assert.ok(!gradeNumber('0.4', 14 / 37).ok);
  assert.ok(gradeNumber('abc', 1).parseError);
});

test('gradeAnswer: risposta esatta in più forme equivalenti → 100%; errori → suggerimenti', () => {
  for (let seed = 1; seed <= 20; seed++) for (const level of [1, 2, 3]) {
    const { sol } = generate({ level, seed, verify: false });
    const w = sol.pre.omega ? sol.pre.omega.toString() : '1';
    const parts = [];
    if (!sol.pre.dc.isZero()) parts.push(`(${sol.pre.dc})`);
    if (!sol.pre.cos.isZero()) parts.push(`(${sol.pre.cos})*cos((${w})*t)`);
    if (!sol.pre.sin.isZero()) parts.push(`(${sol.pre.sin})*sin((${w})*t)`);
    const pre = parts.join('+') || '0';
    const post = `(${sol.post.k})*e^(-t/(${sol.post.tau}))*u(t)`;
    const r = gradeAnswer(sol, { pre, post });
    assert.equal(r.score, 1, `${level}/${seed}: ${pre} | ${post} ${JSON.stringify(r.hints)}`);
    // τ sbagliata → suggerimento
    const bad = gradeAnswer(sol, { pre, post: `(${sol.post.k})*e^(-t/(${sol.post.tau.mul(2)}))` });
    assert.equal(bad.score, 0.5);
    assert.ok(bad.hints.some((h) => h.includes('costante di tempo')));
    // continuità imposta su v_out → K diverso
    const cont = gradeAnswer(sol, { pre, post: `(${sol.pre.dc.add(sol.pre.cos)})*e^(-t/(${sol.post.tau}))` });
    if (!sol.pre.dc.add(sol.pre.cos).eq(sol.post.k)) assert.equal(cont.score, 0.5);
  }
});

test('gradeAnswer: componente continua dimenticata nel caso misto', () => {
  const { sol } = generate({ level: 3, seed: 5, verify: false });
  const w = sol.pre.omega.toString();
  const only = `(${sol.pre.cos})*cos((${w})*t)+(${sol.pre.sin})*sin((${w})*t)`;
  const r = gradeAnswer(sol, { pre: only, post: '0' });
  assert.ok(r.hints.some((h) => h.includes('componente continua')));
  assert.equal(r.pre.ok, false);
});

test('compareExpr: errore di parsing riportato, valore finito richiesto', () => {
  assert.ok(compareExpr('2+', () => 1, 'neg').parseError);
  assert.equal(compareExpr('1/t', () => 1, 'neg').ok, false);
});
