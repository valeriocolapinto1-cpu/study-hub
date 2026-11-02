import test from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../assets/js/generator.js';
import { laplaceCheck } from '../assets/js/solver/exercise.js';
import { VARIANTS } from '../assets/js/templates/templateA.js';

const SEEDS = 25;

test('template A: doppia verifica (esatto vs simulatore indipendente) su ≥ 300 istanze', () => {
  let n = 0, worst = 0;
  for (const level of [1, 2, 3]) for (const variant of VARIANTS) for (let seed = 1; seed <= SEEDS; seed++) {
    const g = generate({ template: 'A', level, variant, seed });
    assert.ok(g.check.ok, `${level}/${variant}/${seed}: errore ${g.check.maxErr}`);
    assert.ok(laplaceCheck(g.inst, g.sol).ok, `Laplace ${level}/${variant}/${seed}`);
    assert.ok(laplaceCheck(g.inst, g.sol, g.sol.tau).ok);
    worst = Math.max(worst, g.check.maxErr); n++;
  }
  assert.ok(n >= 300);
  assert.ok(worst < 2e-3, 'errore massimo ' + worst);
});

test('determinismo: stesso seed → stessa istanza; seed diversi → istanze diverse', () => {
  const a = generate({ level: 2, seed: 'abc', variant: 'inv_rc' }), b = generate({ level: 2, seed: 'abc', variant: 'inv_rc' });
  assert.equal(JSON.stringify(a.inst.circuit.elements.map((e) => [e.id, String(e.r ?? e.c ?? e.l ?? '')])), JSON.stringify(b.inst.circuit.elements.map((e) => [e.id, String(e.r ?? e.c ?? e.l ?? '')])));
  assert.equal(String(a.sol.k), String(b.sol.k));
  const set = new Set(Array.from({ length: 12 }, (_, s) => String(generate({ level: 1, seed: s, variant: 'inv_rc' }).sol.k) + String(generate({ level: 1, seed: s, variant: 'inv_rc' }).sol.tau)));
  assert.ok(set.size > 4);
});

test('vincoli di bellezza: razionali piccoli, τ>0, K≠0, nessuna divisione per zero', () => {
  for (const level of [1, 2, 3]) for (let seed = 1; seed <= 15; seed++) {
    const { sol } = generate({ level, seed });
    for (const q of [sol.k, sol.tau, sol.x0, sol.pre.dc, sol.pre.cos, sol.pre.sin]) { assert.ok(q.d <= 120n); assert.ok(q.n <= 999n && q.n >= -999n); }
    assert.ok(sol.tau.sign() > 0); assert.ok(!sol.k.isZero());
  }
});

test('livelli: 1 = continua, 2 = sinusoidale, 3 = mista; un solo elemento con memoria', () => {
  for (let seed = 1; seed <= 12; seed++) {
    const l1 = generate({ level: 1, seed }).sol, l2 = generate({ level: 2, seed }).sol, l3 = generate({ level: 3, seed }).sol;
    assert.ok(!l1.hasAc && l1.hasDc);
    assert.ok(l2.hasAc && !l2.hasDc);
    assert.ok(l3.hasAc && l3.hasDc);
    for (const g of [generate({ level: 3, seed })]) assert.equal(g.inst.circuit.elements.filter((e) => e.type === 'C' || e.type === 'L').length, 1);
  }
});

test('copertura varianti: tutte le varianti appaiono scegliendo a caso', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 40; seed++) seen.add(generate({ level: 2, seed, verify: false }).inst.variant);
  assert.equal(seen.size, VARIANTS.length);
});

import { renderCircuit, checkLayout } from '../assets/js/svg/render.js';
import { steps, statement, answerLatex } from '../assets/js/explain.js';

test('schema ↔ calcolo: ogni elemento disegnato, valori in etichetta uguali alla netlist, collegamenti coerenti', () => {
  for (const level of [1, 2, 3]) for (const variant of VARIANTS) for (let seed = 1; seed <= 8; seed++) {
    const { inst } = generate({ level, variant, seed, verify: false });
    const { svg, drawn } = renderCircuit(inst.circuit, inst.layout, { omega: inst.omega });
    assert.deepEqual(checkLayout(inst.circuit, inst.layout, drawn), [], `${level}/${variant}/${seed}`);
    for (const e of inst.circuit.elements) {
      if (e.type === 'R') assert.ok(svg.includes(`${e.id}=${e.r} Ω`), `${e.id} valore`);
      if (e.type === 'C') assert.ok(svg.includes(`${e.id}=${e.c} F`));
      if (e.type === 'L') assert.ok(svg.includes(`${e.id}=${e.l} H`));
      assert.ok(svg.includes(`data-id="${e.id}"`) || svg.includes(`data-id="${e.id}.nullator"`));
    }
  }
});

test('spiegazione: 8 passi, risposta coerente con la soluzione esatta', () => {
  for (let seed = 1; seed <= 10; seed++) for (const level of [1, 2, 3]) {
    const g = generate({ level, seed, verify: false });
    const st = steps(g.inst, g.sol);
    assert.equal(st.length, 8);
    assert.ok(answerLatex(g.sol).includes('t<0') && answerLatex(g.sol).includes('t>0'));
    assert.ok(statement(g.inst, g.sol).includes('tutto l\'asse dei tempi'));
    assert.ok(st[5].testo[0].includes('u_{-1}'));
  }
});

let katex = null;
try { katex = (await import('katex')).default; } catch (e) { /* facoltativo in locale */ }
test('soluzioni generate: tutte le formule compilano in KaTeX', { skip: !katex && 'katex non installato' }, () => {
  let n = 0;
  for (let seed = 1; seed <= 12; seed++) for (const level of [1, 2, 3]) {
    const g = generate({ level, seed, verify: false });
    const texts = [statement(g.inst, g.sol), ...steps(g.inst, g.sol).flatMap((s) => s.testo), `$$${answerLatex(g.sol)}$$`];
    for (const t of texts) for (const m of t.matchAll(/\$\$([^$]+)\$\$|\$([^$]+)\$/g)) { katex.renderToString(m[1] || m[2], { throwOnError: true }); n++; }
  }
  assert.ok(n > 300);
});
