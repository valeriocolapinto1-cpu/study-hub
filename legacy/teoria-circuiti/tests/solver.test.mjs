import test from 'node:test';
import assert from 'node:assert/strict';
import { R } from '../assets/js/rational.js';
import { Cx, C } from '../assets/js/complex.js';
import { solve } from '../assets/js/solver/mna.js';
import { thevenin } from '../assets/js/solver/network.js';
import { wave } from '../assets/js/solver/netlist.js';
import { analyze, laplaceCheck } from '../assets/js/solver/exercise.js';

const V = (id, a, b, dc, ac = 0) => ({ id, type: 'V', a, b, wave: wave(dc, ac) });
const Rr = (id, a, b, r) => ({ id, type: 'R', a, b, r: R(r) });

test('partitore di tensione e KCL (a mano: 12 V, 2+4 Ω → 8 V)', () => {
  const s = solve({ elements: [V('V1', 'a', '0', 12), Rr('R1', 'a', 'o', 2), Rr('R2', 'o', '0', 4)] });
  assert.equal(s.v('o').toString(), '8');
  assert.equal(s.i('V1').toString(), '-2'); // il generatore eroga 2 A (a→b negativa)
  assert.equal(s.i('R1').toString(), '2');
});

test('esempio ai nodi del corso: e1=30/7, e2=24/7', () => {
  const s = solve({ elements: [
    { id: 'I1', type: 'I', a: '0', b: '1', wave: wave(3) }, // 3 A entranti nel nodo 1
    Rr('Ra', '1', '0', 2), Rr('Rb', '1', '2', 1), Rr('Rc', '2', '0', 4)] });
  assert.equal(s.v('1').toString(), '30/7');
  assert.equal(s.v('2').toString(), '24/7');
});

test('Tellegen sulla rete risolta: somma delle potenze assorbite = 0', () => {
  const c = { elements: [V('V1', 'a', '0', 10), Rr('R1', 'a', 'b', 2), Rr('R2', 'b', '0', 3)] };
  const s = solve(c);
  let sum = Cx.ZERO;
  for (const e of c.elements) sum = sum.add(s.vd(e.a, e.b).mul(s.i(e.id)));
  assert.ok(sum.isZero());
});

test('trasformatore ideale: n=2, v2=6 V, i1=1 A, potenza conservata', () => {
  const c = { elements: [V('V1', 's', '0', 24), Rr('Rg', 's', 'p', 12),
    { id: 'T1', type: 'T', p1a: 'p', p1b: '0', p2a: 'q', p2b: '0', n: R(2) }, Rr('RL', 'q', '0', 3)] };
  const s = solve(c);
  assert.equal(s.v('p').toString(), '12');
  assert.equal(s.v('q').toString(), '6');
  const [i1, i2] = s.i('T1');
  assert.equal(i1.toString(), '1');
  assert.equal(i2.toString(), '-2');
});

test('nullore: invertente Vo = -(Rf/R1)Vg', () => {
  const c = { elements: [V('V1', 'in', '0', 3), Rr('R1', 'in', 'x', 1), Rr('Rf', 'x', 'y', 4), { id: 'N1', type: 'N', na: 'x', nb: '0', ra: 'y', rb: '0' }] };
  const s = solve(c);
  assert.equal(s.v('y').toString(), '-12');
  assert.equal(s.v('x').toString(), '0');
});

test('nullore: generatore di corrente I = Vg/R (convertitore V→I)', () => {
  const c = { elements: [V('V1', 'in', '0', 2), { id: 'N1', type: 'N', na: 'in', nb: 'y', ra: 'z', rb: 'y' }, Rr('Rs', 'y', '0', 1), Rr('RL', 'z', '0', 3)] };
  const s = solve(c);
  assert.equal(s.v('z').toString(), '-6');
  assert.equal(s.v('y').toString(), '2');
});

test('doppio bipolo Z e Y equivalenti (Z=[[2,1],[1,2]], porta 2 aperta, 6 V alla porta 1 → v2=3)', () => {
  const base = [V('V1', 'a', '0', 6)];
  const z = solve({ elements: [...base, { id: 'P', type: 'P', kind: 'Z', p1a: 'a', p1b: '0', p2a: 'b', p2b: '0', m: [[R(2), R(1)], [R(1), R(2)]] }, Rr('Rleak', 'b', 'c', 1), Rr('Rg', 'c', '0', 1)] });
  // con Rleak+Rg in serie a massa la porta 2 non è aperta: confronto Z vs Y con la stessa rete
  const y = solve({ elements: [...base, { id: 'P', type: 'P', kind: 'Y', p1a: 'a', p1b: '0', p2a: 'b', p2b: '0', m: [[R(2, 3), R(-1, 3)], [R(-1, 3), R(2, 3)]] }, Rr('Rleak', 'b', 'c', 1), Rr('Rg', 'c', '0', 1)] });
  assert.ok(z.v('b').eq(y.v('b')));
  assert.ok(z.v('c').eq(y.v('c')));
  // porta 2 aperta davvero (solo Y: nodo b senza altri elementi)
  const open = solve({ elements: [...base, { id: 'P', type: 'P', kind: 'Y', p1a: 'a', p1b: '0', p2a: 'b', p2b: '0', m: [[R(2, 3), R(-1, 3)], [R(-1, 3), R(2, 3)]] }] });
  assert.equal(open.v('b').toString(), '3');
  assert.equal(open.i('V1').toString(), '-3');
});

test('generatori controllati: VCCS (esempio I-07 → 6 V), VCVS, CCVS, CCCS', () => {
  const base = [V('V1', 'a', '0', 6), Rr('R1', 'a', 'n2', 2), Rr('R2', 'n2', '0', 4)];
  const g = solve({ elements: [...base, { id: 'G1', type: 'G', a: '0', b: 'n3', cp: 'n2', cn: '0', gm: R(1, 2) }, Rr('R3', 'n3', '0', 3)] });
  assert.equal(g.v('n2').toString(), '4');
  assert.equal(g.v('n3').toString(), '6');
  const e = solve({ elements: [...base, { id: 'E1', type: 'E', a: 'n3', b: '0', cp: 'n2', cn: '0', mu: R(3) }, Rr('R3', 'n3', '0', 3)] });
  assert.equal(e.v('n3').toString(), '12');
  // CCVS: corrente misurata da un sensore S in serie a R2
  const h = solve({ elements: [V('V1', 'a', '0', 6), Rr('R1', 'a', 'n2', 2), { id: 'S1', type: 'S', a: 'n2', b: 'n4' }, Rr('R2', 'n4', '0', 4),
    { id: 'H1', type: 'H', a: 'n3', b: '0', ctrl: 'S1', rm: R(5) }, Rr('R3', 'n3', '0', 3)] });
  assert.equal(h.i('S1').toString(), '1'); // 6/(2+4)
  assert.equal(h.v('n3').toString(), '5');
  const f = solve({ elements: [V('V1', 'a', '0', 6), Rr('R1', 'a', 'n2', 2), { id: 'S1', type: 'S', a: 'n2', b: 'n4' }, Rr('R2', 'n4', '0', 4),
    { id: 'F1', type: 'F', a: '0', b: 'n3', ctrl: 'S1', beta: R(2) }, Rr('R3', 'n3', '0', 3)] });
  assert.equal(f.v('n3').toString(), '6'); // 2*1 A in 3 Ω
});

test('regime sinusoidale: RC serie, v_C = (1-j)/2 a ω=1', () => {
  const c = { elements: [V('V1', 'in', '0', 0, 1), Rr('R', 'in', 'o', 1), { id: 'C1', type: 'C', a: 'o', b: '0', c: R(1) }] };
  const s = solve(c, { s: new Cx(0, 1), source: (e) => e.wave.ac });
  assert.ok(s.v('o').eq(C('1/2', '-1/2')));
});

test('Thevenin/Norton: partitore 12 V, 2 Ω e 4 Ω → Vth=8, Rth=4/3, Isc=6', () => {
  const c = { elements: [V('V1', 'a', '0', 12), Rr('R1', 'a', 'o', 2), Rr('R2', 'o', '0', 4)] };
  const t = thevenin(c, 'o', '0');
  assert.equal(t.vth.toString(), '8');
  assert.equal(t.zth.toString(), '4/3');
  assert.equal(t.isc.toString(), '6');
});

test('Thevenin con generatore controllato (non spento): R_th = V/I col generatore di prova', () => {
  // R1=2 tra 'a' e 'o'; VCCS dalla tensione v(o) a corrente 0→o gm=1/2 (equivale a un resistore da -2 Ω... prova numerica)
  const c = { elements: [V('V1', 'a', '0', 4), Rr('R1', 'a', 'o', 2), { id: 'G1', type: 'G', a: 'o', b: '0', cp: 'o', cn: '0', gm: R(1, 2) }] };
  const t = thevenin(c, 'o', '0');
  // Equivalente a R1 in parallelo a 2 Ω (gm=1/2 S dissipa): Rth = 1, Vth = 2
  assert.equal(t.zth.toString(), '1');
  assert.equal(t.vth.toString(), '2');
});

const inst = (circuit, out, memory, omega = null) => ({ circuit, out, memory, omega });

test('esercizio a mano 1: RC in continua → v_C(t) = 6 per t<0, 6e^{-t/6} per t>0', () => {
  const sol = analyze(inst({ elements: [V('V1', 'in', '0', 6), Rr('R1', 'in', 'o', 2), { id: 'C1', type: 'C', a: 'o', b: '0', c: R(3) }] }, ['o', '0'], 'C1'));
  assert.equal(sol.pre.dc.toString(), '6'); assert.equal(sol.k.toString(), '6'); assert.equal(sol.tau.toString(), '6');
});

test('esercizio a mano 2: uscita su R1, C in parallelo a R2 → pre 4, K=-8, τ=4/3', () => {
  const c = { elements: [V('V1', 'in', '0', 12), Rr('R1', 'in', 'o', 2), Rr('R2', 'o', '0', 4), { id: 'C1', type: 'C', a: 'o', b: '0', c: R(1) }] };
  const sol = analyze(inst(c, ['in', 'o'], 'C1'));
  assert.equal(sol.pre.dc.toString(), '4'); assert.equal(sol.k.toString(), '-8'); assert.equal(sol.tau.toString(), '4/3');
});

test('esercizio a mano 3: RC sinusoidale → ½cos t + ½ sin t, K=1/2, τ=1', () => {
  const c = { elements: [V('V1', 'in', '0', 0, 1), Rr('R', 'in', 'o', 1), { id: 'C1', type: 'C', a: 'o', b: '0', c: R(1) }] };
  const sol = analyze(inst(c, ['o', '0'], 'C1', 1));
  assert.equal(sol.pre.cos.toString(), '1/2'); assert.equal(sol.pre.sin.toString(), '1/2');
  assert.equal(sol.x0.toString(), '1/2'); assert.equal(sol.k.toString(), '1/2'); assert.equal(sol.tau.toString(), '1');
});

test('esercizio a mano 4: RL continua, uscita su R → 10 per t<0, K=10, τ=2/5', () => {
  const c = { elements: [V('V1', 'in', '0', 10), Rr('R', 'in', 'a', 5), { id: 'L1', type: 'L', a: 'a', b: '0', l: R(2) }] };
  const sol = analyze(inst(c, ['in', 'a'], 'L1'));
  assert.equal(sol.x0.toString(), '2'); assert.equal(sol.pre.dc.toString(), '10');
  assert.equal(sol.k.toString(), '10'); assert.equal(sol.tau.toString(), '2/5');
});

test('esercizio a mano 5: nullore con C in retroazione → pre -12, K -12, τ 4', () => {
  const c = { elements: [V('V1', 'in', '0', 3), Rr('R1', 'in', 'x', 1), Rr('Rf', 'x', 'y', 4), { id: 'C1', type: 'C', a: 'x', b: 'y', c: R(1) }, { id: 'N1', type: 'N', na: 'x', nb: '0', ra: 'y', rb: '0' }] };
  const sol = analyze(inst(c, ['y', '0'], 'C1'));
  assert.equal(sol.pre.dc.toString(), '-12'); assert.equal(sol.k.toString(), '-12'); assert.equal(sol.tau.toString(), '4');
});

test('esercizio a mano 6: nullore V→I con C su carico → pre -6, K -6, τ 6 (C=2, RL=3)', () => {
  const c = { elements: [V('V1', 'in', '0', 2), { id: 'N1', type: 'N', na: 'in', nb: 'y', ra: 'z', rb: 'y' }, Rr('Rs', 'y', '0', 1), Rr('RL', 'z', '0', 3), { id: 'C1', type: 'C', a: 'z', b: '0', c: R(2) }] };
  const sol = analyze(inst(c, ['z', '0'], 'C1'));
  assert.equal(sol.pre.dc.toString(), '-6'); assert.equal(sol.k.toString(), '-6'); assert.equal(sol.tau.toString(), '6');
});

test('esercizio misto: DC 4 V + cos(t) su RC serie → pre = 4 + ½cos + ½sin, x0 = 4.5', () => {
  const c = { elements: [V('V1', 'in', 'm', 4), V('V2', 'm', '0', 0, 1), Rr('R', 'in', 'o', 1), { id: 'C1', type: 'C', a: 'o', b: '0', c: R(1) }] };
  const sol = analyze(inst(c, ['o', '0'], 'C1', 1));
  assert.equal(sol.pre.dc.toString(), '4'); assert.equal(sol.pre.cos.toString(), '1/2'); assert.equal(sol.pre.sin.toString(), '1/2');
  assert.equal(sol.x0.toString(), '9/2'); assert.equal(sol.k.toString(), '9/2');
});

test('metodo di Laplace con generatori equivalenti coincide con K/(s+1/τ)', () => {
  const c = { elements: [V('V1', 'in', '0', 12), Rr('R1', 'in', 'o', 2), Rr('R2', 'o', '0', 4), { id: 'C1', type: 'C', a: 'o', b: '0', c: R(1) }] };
  const i = inst(c, ['in', 'o'], 'C1');
  const sol = analyze(i);
  for (const s0 of [1, 2, '1/3', 7]) assert.ok(laplaceCheck(i, sol, R(s0)).ok);
});
