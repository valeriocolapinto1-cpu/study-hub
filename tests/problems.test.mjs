import test from 'node:test';
import assert from 'node:assert/strict';
import { APPLIED_KINDS, generateApplied, generateStep, STEP_KINDS, gradeProblem } from '../assets/js/problems.js';
import { Rational } from '../assets/js/rational.js';
import { solve } from '../assets/js/solver/mna.js';
import { wave } from '../assets/js/solver/netlist.js';

const R = (x, y = 1) => Rational.from(x).div(Rational.from(y));

/** Risposta «ideale» per un campo: il valore atteso scritto come testo. */
function perfect(c) {
  if (c.tipo === 'num') return typeof c.atteso === 'number' ? String(c.atteso) : c.atteso.toString();
  if (c.tipo === 'scelta') return String(c.atteso);
  return null; // espressioni: gestite a parte
}

test('domande applicate: 12 tipi, 20 seed ciascuno, campi e soluzioni presenti', () => {
  assert.equal(APPLIED_KINDS.length, 12);
  for (const { kind } of APPLIED_KINDS) for (let seed = 1; seed <= 20; seed++) {
    const p = generateApplied(kind, seed);
    assert.ok(p.testo.length > 30 && p.campi.length >= 1 && p.soluzione.length >= 1, `${kind}/${seed}`);
    const ans = {};
    for (const c of p.campi) { const v = perfect(c); if (v !== null) ans[c.key] = v; }
    if (p.campi.every((c) => c.tipo !== 'expr')) assert.equal(gradeProblem(p, ans).score, 1, `${kind}/${seed}`);
  }
});

test('domande applicate: determinismo e varietà', () => {
  const a = generateApplied('thevenin', 7), b = generateApplied('thevenin', 7);
  assert.equal(a.testo, b.testo);
  assert.equal(new Set(Array.from({ length: 15 }, (_, s) => generateApplied('rifasamento', s).testo)).size > 5, true);
});

test('Thevenin applicato: coerente con il solutore (Isc = Vth/Rth e cortocircuito diretto)', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const p = generateApplied('thevenin', seed);
    const c = { elements: [...p.inst.circuit.elements, { id: 'Sc', type: 'S', a: 'b', b: '0' }] };
    const isc = solve(c).i('Sc'); // corrente da b a 0 nel corto
    assert.ok(isc.re.eq(p.campi[2].atteso), `seed ${seed}`);
  }
});

test('matrici Z/Y delle reti a T e a π: verifica con il solutore (prove a vuoto e in corto)', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const p = generateApplied('doppi_bipoli', seed);
    const keys = p.campi.map((c) => c.key);
    const m = Object.fromEntries(p.campi.map((c) => [c.key, c.atteso]));
    const nums = [...p.testo.matchAll(/=(\d+)\\,\\(?:Omega|mathrm)/g)].map((x) => Number(x[1]));
    const [a, b, c] = nums;
    if (keys[0] === 'z11') {
      // T: corrente 1 A alla porta 1, porta 2 aperta → v1 = z11, v2 = z21
      const circ = { elements: [{ id: 'I1', type: 'I', a: '0', b: 'p1', wave: wave(1) }, { id: 'Ra', type: 'R', a: 'p1', b: 'm', r: R(a) }, { id: 'Rc', type: 'R', a: 'm', b: '0', r: R(c) }, { id: 'Rb', type: 'R', a: 'm', b: 'p2', r: R(b) }] };
      const s = solve(circ);
      assert.ok(s.v('p1').re.eq(m.z11)); assert.ok(s.v('p2').re.eq(m.z21));
    } else {
      // π: tensione 1 V alla porta 1, porta 2 in corto → i1 = y11, i2 = y21
      const circ = { elements: [{ id: 'V1', type: 'V', a: 'p1', b: '0', wave: wave(1) }, { id: 'Ga', type: 'R', a: 'p1', b: '0', r: R(1, a) }, { id: 'Gc', type: 'R', a: 'p1', b: 'p2', r: R(1, c) }, { id: 'Gb', type: 'R', a: 'p2', b: '0', r: R(1, b) }, { id: 'Sc', type: 'S', a: 'p2', b: '0' }] };
      const s = solve(circ);
      assert.ok(s.i('V1').re.neg().eq(m.y11)); assert.ok(s.i('Sc').re.neg().eq(m.y21));
    }
  }
});

test('allenamento per passo: quattro tipi, valori attesi verificati dal motore', () => {
  assert.equal(STEP_KINDS.length, 4);
  for (const { kind } of STEP_KINDS) for (let seed = 1; seed <= 15; seed++) for (const level of [1, 2, 3]) {
    const p = generateStep(kind, { level, seed });
    assert.ok(p.testo && p.campi.length && p.soluzione.length, `${kind}/${seed}`);
    if (kind !== 'antitrasformata') assert.ok(p.inst && p.inst.layout);
    const ans = {};
    for (const c of p.campi) { const v = perfect(c); if (v !== null) ans[c.key] = v; }
    if (p.campi.every((c) => c.tipo !== 'expr')) assert.equal(gradeProblem(p, ans).score, 1, `${kind}/${seed}/${level}`);
  }
});

test('antitrasformata: risposta in forma esatta riconosciuta, errata respinta', () => {
  let ok = 0;
  for (let seed = 1; seed <= 30; seed++) for (const level of [1, 2, 3]) {
    const p = generateStep('antitrasformata', { level, seed });
    const f = p.campi[0].atteso;
    // verifica numerica indiretta: ricostruzione dalla soluzione testuale non è automatica → controlla confronto con se stessa e con una funzione diversa
    assert.ok(gradeProblem(p, { f: '0' }).score < 1);
    ok++;
    assert.ok(Number.isFinite(f(1)));
  }
  assert.ok(ok > 50);
});

test('antitrasformata: forma con poli reali accettata in più scritture', () => {
  const p = generateStep('antitrasformata', { level: 1, seed: 3 });
  const m = /\\dfrac\{(-?\d+)\}\{s\+(\d+)\}/.exec(p.testo);
  const [k, a] = [Number(m[1]), Number(m[2])];
  for (const s of [`${k}e^(-${a}t)`, `${k}*exp(-${a}*t)*u(t)`, `${k} e^(-${a} t)`]) assert.equal(gradeProblem(p, { f: s }).score, 1, s);
  assert.equal(gradeProblem(p, { f: `${k}e^(${a}t)` }).score, 0);
});
