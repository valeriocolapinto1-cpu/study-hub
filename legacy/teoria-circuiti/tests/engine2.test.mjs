import test from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../assets/js/generator.js';
import { laplaceCheck } from '../assets/js/solver/exercise.js';
import { TEMPLATES } from '../assets/js/templates/index.js';
import { renderCircuit, checkLayout } from '../assets/js/svg/render.js';
import { steps, guidedSteps, answerLatex } from '../assets/js/explain.js';
import { gradeAnswer } from '../assets/js/grader/exercise.js';

const SEEDS = 12;

test('tutte le combinazioni (template × variante × livello) generano istanze valide e verificate', () => {
  let n = 0;
  for (const [name, T] of Object.entries(TEMPLATES)) for (const variant of T.VARIANTS) for (const level of [1, 2, 3]) for (let seed = 1; seed <= SEEDS; seed++) {
    const g = generate({ template: name, level, variant, seed });
    assert.ok(g.check.ok, `${name}/${variant}/${level}/${seed}: ${g.check.maxErr}`);
    assert.ok(laplaceCheck(g.inst, g.sol).ok, `Laplace ${name}/${variant}/${level}/${seed}`);
    // schema coerente con la netlist
    const { svg, drawn } = renderCircuit(g.inst.circuit, g.inst.layout, { omega: g.inst.omega });
    assert.deepEqual(checkLayout(g.inst.circuit, g.inst.layout, drawn), [], `layout ${name}/${variant}/${level}/${seed}`);
    for (const e of g.inst.circuit.elements) {
      if (e.type === 'R') assert.ok(svg.includes(`${e.id}=${e.r} Ω`));
      if (e.type === 'C') assert.ok(svg.includes(`${e.id}=${e.c} F`));
      if (e.type === 'L') assert.ok(svg.includes(`${e.id}=${e.l} H`));
      if (e.type === 'P') assert.ok(svg.includes(`[ ${e.m[0][0]}   ${e.m[0][1]} ]`));
      if (e.type === 'T') assert.ok(svg.includes(`n : 1 = ${e.n} : 1`));
      if (e.type === 'G') assert.ok(svg.includes(`${e.id}=${e.gm} S`));
    }
    assert.equal(steps(g.inst, g.sol).length, 8);
    assert.equal(guidedSteps(g.inst, g.sol).length, 8);
    n++;
  }
  assert.ok(n >= 6 * 3 * SEEDS / 2);
});

test('livelli: il livello 3 contiene nullore + (doppio bipolo | trasformatore) e un generatore controllato nei template B e C', () => {
  for (const name of ['B', 'C']) for (let seed = 1; seed <= 6; seed++) {
    const { inst, sol } = generate({ template: name, level: 3, seed });
    const types = new Set(inst.circuit.elements.map((e) => e.type));
    assert.ok(types.has('N') && types.has('G'));
    assert.ok(types.has(name === 'B' ? 'P' : 'T'));
    assert.ok(sol.hasAc && sol.hasDc);
  }
});

test('livello 1: continua con una sola semplificazione, senza controllati', () => {
  for (const name of ['A', 'B', 'C']) for (let seed = 1; seed <= 6; seed++) {
    const { inst, sol } = generate({ template: name, level: 1, seed });
    assert.ok(!sol.hasAc && sol.hasDc);
    assert.ok(!inst.circuit.elements.some((e) => e.type === 'G'));
  }
});

test('template «any»: copre A, B e C ed è deterministico', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 30; seed++) seen.add(generate({ template: 'any', level: 2, seed, verify: false }).inst.template);
  assert.equal(seen.size, 3);
  assert.equal(generate({ template: 'any', level: 2, seed: 5 }).inst.template, generate({ template: 'any', level: 2, seed: 5 }).inst.template);
});

test('B e C: matrici Z/Y invertibili e rapporto n valido; risposta corretta riconosciuta al 100%', () => {
  for (let seed = 1; seed <= 15; seed++) for (const name of ['B', 'C']) for (const level of [1, 2, 3]) {
    const { inst, sol } = generate({ template: name, level, seed, verify: false });
    const p = inst.circuit.elements.find((e) => e.type === 'P');
    if (p) assert.ok(!p.m[0][0].mul(p.m[1][1]).sub(p.m[0][1].mul(p.m[1][0])).isZero());
    const w = sol.pre.omega ? sol.pre.omega.toString() : '1';
    const parts = [];
    if (!sol.pre.dc.isZero()) parts.push(`(${sol.pre.dc})`);
    if (!sol.pre.cos.isZero()) parts.push(`(${sol.pre.cos})*cos((${w})*t)`);
    if (!sol.pre.sin.isZero()) parts.push(`(${sol.pre.sin})*sin((${w})*t)`);
    assert.equal(gradeAnswer(sol, { pre: parts.join('+') || '0', post: `(${sol.post.k})*e^(-t/(${sol.post.tau}))` }).score, 1);
    assert.ok(answerLatex(sol).includes('cases'));
  }
});
