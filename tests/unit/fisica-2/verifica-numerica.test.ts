// @ts-nocheck -- porting fedele (JavaScript) dei test del sito originale; i tipi sono verificati in generatori.test.ts.
// Verifica numerica indipendente dei generatori di Fisica Generale II (src/courses/fisica-2/generators),
// portata dal sito originale (legacy/fisica-2/tests/generatore.test.mjs). Ogni soluzione analitica è
// confrontata con un calcolo diverso: integrazione numerica, simulazione di ODE, Biot–Savart discretizzato,
// algebra dei nodi, ecc.
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { C0, EPS0, K, MU0, TEMPLATES, runTemplate } from '../../../src/courses/fisica-2/generators/lib';
import '../../../src/courses/fisica-2/generators/b1-elettrostatica';
import '../../../src/courses/fisica-2/generators/b2-corrente';
import '../../../src/courses/fisica-2/generators/b3-magnetostatica';
import '../../../src/courses/fisica-2/generators/b4-induzione';
import '../../../src/courses/fisica-2/generators/b5-onde';

const PI = Math.PI;
const SEEDS = Array.from({ length: 40 }, (_, i) => 1000 + i * 37);
const close = (a: number, b: number, tol: number, msg = '') =>
  assert.ok(Math.abs(a - b) <= tol * Math.max(Math.abs(b), 1e-300) + 1e-300, `${msg} atteso ${b}, ottenuto ${a}`);
const simpson = (f: (x: number) => number, a: number, b: number, n = 4000) => {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
const each = (id: string, fn: (p: Any, v: Any, e: Any) => void) =>
  test(`verifica numerica: ${id}`, () => {
    const tpl = TEMPLATES[id.toLowerCase()];
    assert.ok(tpl, `template ${id}`);
    for (const seed of SEEDS) {
      const e = runTemplate(tpl!, seed, 'it');
      fn(e.parametri, e.valori, e);
    }
  });
/* integratore RK4 per y' = f(t,y) (vettore) */
function rk4(f: (t: number, y: number[]) => number[], y0: number[], t1: number, n = 20000) {
  let y = [...y0], t = 0;
  const h = t1 / n, out: [number, number[]][] = [[t, [...y]]];
  for (let i = 0; i < n; i++) {
    const k1 = f(t, y), k2 = f(t + h / 2, y.map((v, j) => v + (h / 2) * k1[j]!)), k3 = f(t + h / 2, y.map((v, j) => v + (h / 2) * k2[j]!)), k4 = f(t + h, y.map((v, j) => v + h * k3[j]!));
    y = y.map((v, j) => v + (h / 6) * (k1[j]! + 2 * k2[j]! + 2 * k3[j]! + k4[j]!));
    t += h;
    out.push([t, [...y]]);
  }
  return out;
}
const firstCross = (traj: [number, number[]][], idx: number, level: number) => {
  for (let i = 1; i < traj.length; i++) {
    const [t0, y0] = traj[i - 1]!, [t1, y1] = traj[i]!;
    if ((y0[idx]! - level) * (y1[idx]! - level) <= 0) return t0 + ((t1 - t0) * (level - y0[idx]!)) / (y1[idx]! - y0[idx]!);
  }
  return NaN;
};

/* ---------------- blocco 1 ---------------- */
each('b1-sfera-rho-kr', (p, v) => {
  const Qint = (r) => simpson((x) => p.k * x * 4 * PI * x * x, p.a, Math.min(Math.max(r, p.a), p.b));
  close(v.Q, Qint(p.b), 1e-8, 'Q');
  const E = (r) => (r <= p.a ? 0 : Qint(r) / (4 * PI * EPS0 * r * r));
  close(v.E2, E((p.a + p.b) / 2), 1e-7, 'E2'); close(v.E3, E(2 * p.b), 1e-8, 'E3'); assert.equal(v.E1, 0);
});
each('b1-cilindro-rho-Ar', (p, v) => {
  const lam = (r) => simpson((x) => p.A * x * 2 * PI * x, 0, Math.min(r, p.R));
  const E = (r) => lam(r) / (2 * PI * EPS0 * r);
  close(v.E_meta, E(p.R / 2), 1e-7, 'E(R/2)'); close(v.E_2R, E(2 * p.R), 1e-7, 'E(2R)');
  close(v.dV, simpson(E, 1e-9, 2 * p.R, 8000), 1e-4, 'dV');
});
each('b1-anello-velocita', (p, v) => {
  const Vz = (z) => simpson((ph) => K * p.lam * p.R / Math.hypot(p.R, z), 0, 2 * PI, 8);
  let Vmax = 0; for (let z = -5 * p.R; z <= 5 * p.R; z += p.R / 50) Vmax = Math.max(Vmax, Vz(z));
  close(v.V0, Vmax, 1e-9, 'V0'); close(0.5 * p.m * v.v0 ** 2, p.q * Vmax, 1e-9, 'energia');
});
each('b1-filo-finito', (p, v) => {
  const lam = p.Q / p.L;
  const Ex = simpson((y) => K * lam * p.D / (p.D ** 2 + y * y) ** 1.5, 0, p.L), Ey = simpson((y) => -K * lam * y / (p.D ** 2 + y * y) ** 1.5, 0, p.L);
  close(v.Ex, Ex, 1e-9, 'Ex'); close(v.Ey, Ey, 1e-9, 'Ey'); close(v.E, Math.hypot(Ex, Ey), 1e-9, '|E|');
});
each('b1-condensatore-cilindrico', (p, v) => {
  const lamMax = 2 * PI * EPS0 * p.er * p.Ed * p.R1; // E(R1) = Ed
  const E = (r) => lamMax / (2 * PI * EPS0 * p.er * r);
  const V = simpson(E, p.R1, p.R2, 8000), Q = lamMax * p.L, U = simpson((r) => 0.5 * EPS0 * p.er * E(r) ** 2 * 2 * PI * r * p.L, p.R1, p.R2, 8000);
  close(v.Vmax, V, 1e-7, 'Vmax'); close(v.C, Q / V, 1e-7, 'C'); close(v.Umax, U, 1e-6, 'Umax'); close(v.Qmax, Q, 1e-7, 'Q');
});
each('b1-piano-serie', (p, v) => {
  const s = p.Q / p.S, E1 = s / (EPS0 * p.e1), E2 = s / (EPS0 * p.e2), dV = E1 * p.d1 + E2 * p.d2;
  const U = 0.5 * EPS0 * p.e1 * E1 ** 2 * p.S * p.d1 + 0.5 * EPS0 * p.e2 * E2 ** 2 * p.S * p.d2;
  close(v.dV, dV, 1e-9); close(v.C, p.Q / dV, 1e-9); close(v.U, U, 1e-9, 'U da integrale di energia'); close(v.E1, E1, 1e-9); close(v.E2, E2, 1e-9);
});
each('b1-piano-parallelo', (p, v) => {
  const U = 0.5 * EPS0 * p.e1 * (p.V / p.d) ** 2 * (p.S / 2) * p.d + 0.5 * EPS0 * p.e2 * (p.V / p.d) ** 2 * (p.S / 2) * p.d;
  close(v.C, 2 * U / p.V ** 2, 1e-9, 'C da energia'); close(v.Q, v.C * p.V, 1e-9);
  close(v.s1 * p.S / 2 + v.s2 * p.S / 2, v.Q, 1e-9, 'Q da densità');
});
each('b1-conduttori-sferici', (p, v) => {
  // campo prima del collegamento (induzione completa) e dopo (un solo conduttore)
  const Ei = (r) => (r < p.R1 ? 0 : r < p.R2 ? K * p.Q1 / r ** 2 : r < p.R3 ? 0 : K * (p.Q1 + p.Q2) / r ** 2);
  // fuori dal guscio il campo è identico prima e dopo: la differenza di energia è tutta nella cavità R1<r<R2
  const Wcav = simpson((r) => 0.5 * EPS0 * Ei(r) ** 2 * 4 * PI * r * r, p.R1, p.R2 - 1e-12, 20000); // si esclude l'estremo R2, dove il campo è discontinuo
  close(v.Wd, Wcav, 1e-6, 'energia dissipata');
  const V1 = simpson(Ei, p.R1, p.R2 - 1e-12, 20000) + simpson(Ei, p.R3, p.R3 * 2000, 400000) + K * (p.Q1 + p.Q2) / (p.R3 * 2000); // + coda oltre 2000·R3
  close(v.V1i, V1, 1e-6, 'potenziale della sfera interna'); close(v.Vf, K * (p.Q1 + p.Q2) / p.R3, 1e-12, 'potenziale finale');
});
each('b1-lavoro-anello-asse', (p, v) => {
  const V = (z) => simpson(() => K * (p.q / (2 * PI)) / Math.hypot(p.R, z), 0, 2 * PI, 4);
  close(v.W, p.Q * (V(p.d) - V(0)), 1e-9);
});

/* ---------------- blocco 2 ---------------- */
each('b2-rc-scarica-tempi', (p, v) => {
  const tau = p.R * p.C, tr = rk4((t, y) => [-y[0] / tau, y[0] * y[0] / p.R], [p.V0, 0], 6 * tau, 12000);
  close(firstCross(tr, 0, p.V0 / 2), v.tQ, 1e-4, 'tQ'); close(firstCross(tr.map(([t, y]) => [t, [0.5 * p.C * y[0] ** 2]]), 0, 0.25 * p.C * p.V0 ** 2), v.tU, 1e-4, 'tU');
  const at = tr.find(([t]) => t >= tau)[1][1]; close(v.Ut, at, 5e-3, 'energia fino a tau'); close(v.U0, 0.5 * p.C * p.V0 ** 2, 1e-12);
});
each('b2-dielettrico-perdite', (p, v) => {
  const R = p.rho * p.d / p.S, C = EPS0 * p.er * p.S / p.d; close(v.tau, R * C, 1e-9, 'tau'); close(v.C, C, 1e-12);
  const tr = rk4((t, y) => [-y[0] / (R * C)], [p.Q0], 8 * R * C, 8000); close(firstCross(tr, 0, 0.1 * p.Q0), v.t10, 1e-4, 't10'); close(v.I0, p.Q0 / (R * C), 1e-9); close(v.U0, p.Q0 ** 2 / (2 * C), 1e-9);
});
each('b2-partitore-apertura', (p, v) => {
  const v0 = p.E * p.R2 / (p.R1 + p.R2); close(v.v0, v0, 1e-12);
  const tau = p.R2 * p.C, tr = rk4((t, y) => [-y[0] / tau, y[0] * y[0] / p.R2], [v0, 0], 12 * tau, 12000);
  close(v.Ud, tr[tr.length - 1][1][1], 1e-4, 'energia dissipata'); const a = tr.find(([t]) => t >= tau)[1][0]; close(v.Ptau, a * a / p.R2, 5e-3, 'potenza a tau (griglia temporale discreta)');
});
each('b2-carica-chiusura', (p, v) => {
  const f = (t, y) => [((p.E - y[0]) / p.R1 - y[0] / p.R2) / p.C];
  const tau0 = (p.R1 * p.R2 / (p.R1 + p.R2)) * p.C, tr = rk4(f, [0], 12 * tau0, 24000), vinf = tr[tr.length - 1][1][0];
  close(v.vinf, vinf, 1e-4, 'v finale'); close(firstCross(tr, 0, vinf * (1 - Math.exp(-1))), v.tau, 2e-3, 'tau'); close(firstCross(tr, 0, 0.9 * v.vinf), v.t90, 2e-3, 't90');
  close(v.dU, 0.5 * p.C * v.vinf ** 2, 1e-12); close(v.I0, p.E / p.R1, 1e-12);
});
each('b2-ripartizione-cariche', (p, v) => {
  const tau = p.R * p.C1 * p.C2 / (p.C1 + p.C2);
  const tr = rk4((t, y) => { const i = (y[0] - y[1]) / p.R; return [-i / p.C1, i / p.C2, i * i * p.R]; }, [p.V0, 0, 0], 14 * tau, 14000), end = tr[tr.length - 1][1];
  close(v.Vf, end[0], 1e-4); close(v.Vf, end[1], 1e-4); close(v.Wd, end[2], 1e-4, 'dissipata'); close(v.Q1, p.C1 * end[0], 1e-4); close(v.Q2, p.C2 * end[1], 1e-4);
  const d = tr.map(([t, y]) => [t, [y[0] - y[1]]]); close(firstCross(d, 0, p.V0 * Math.exp(-1)), v.tau, 2e-3, 'tau');
});
function nodale(R1, R2, R3, Rx, R0, E) { // nodi: A=E, B=0, incognite C, D (conduttanze)
  const g1 = 1 / R1, g2 = 1 / R2, g3 = 1 / R3, gx = 1 / Rx, g0 = 1 / R0;
  const a11 = g1 + g2 + g0, a12 = -g0, a21 = -g0, a22 = g3 + gx + g0, b1 = g1 * E, b2 = g3 * E, det = a11 * a22 - a12 * a21;
  const Vc = (b1 * a22 - a12 * b2) / det, Vd = (a11 * b2 - a21 * b1) / det; return (Vc - Vd) / R0;
}
each('b2-ponte', (p, v) => {
  close(v.Rx, p.R2 * p.R3 / p.R1, 1e-12); assert.ok(Math.abs(nodale(p.R1, p.R2, p.R3, v.Rx, p.R0, p.E)) < 1e-12, 'corrente nulla all\'equilibrio');
  close(v.I0, nodale(p.R1, p.R2, p.R3, v.Rx * (1 + p.dl), p.R0, p.E), 1e-9, 'corrente fuori equilibrio');
});

/* ---------------- blocco 3 ---------------- */
each('b3-coassiale', (p, v) => {
  const Jin = p.I / (PI * p.a ** 2), Jout = -p.I / (PI * (p.c ** 2 - p.b ** 2));
  const Ienc = (r) => simpson((x) => Jin * 2 * PI * x, 0, Math.min(r, p.a)) + (r > p.b ? simpson((x) => Jout * 2 * PI * x, p.b, Math.min(r, p.c)) : 0);
  const B = (r) => MU0 * Ienc(r) / (2 * PI * r);
  close(v.B1, B(p.a / 2), 1e-7); close(v.B2, B((p.a + p.b) / 2), 1e-7); close(v.B3, B((p.b + p.c) / 2), 1e-7);
  assert.ok(Math.abs(B(2 * p.c)) < 1e-9 * MU0 * p.I / p.c, 'corrente totale nulla fuori dal cavo'); assert.equal(v.B4, 0);
});
each('b3-cilindro-J-kr', (p, v) => {
  const Ienc = (r) => simpson((x) => p.k * x * 2 * PI * x, 0, Math.min(r, p.R));
  close(v.I, Ienc(p.R), 1e-9); close(v.B_meta, MU0 * Ienc(p.R / 2) / (2 * PI * p.R / 2), 1e-7); close(v.B_2R, MU0 * Ienc(2 * p.R) / (2 * PI * 2 * p.R), 1e-7); close(v.B_R, MU0 * Ienc(p.R) / (2 * PI * p.R), 1e-7);
});
each('b3-spira-semicerchio', (p, v) => {
  const R = p.R;
  // Biot–Savart numerico: contributo = (μ0 I /4π) ∫ (dP/dt × (O−P))_z / |O−P|³ dt, con O = origine
  const cross = (dP, Q) => dP[0] * Q[1] - dP[1] * Q[0];
  const semicerchio = simpson((th) => { const dP = [-R * Math.sin(th), R * Math.cos(th)], Q = [-R * Math.cos(th), -R * Math.sin(th)]; return cross(dP, Q) / Math.hypot(...Q) ** 3; }, PI / 2, -PI / 2, 4000); // orario
  const filo = (y, da, a) => simpson((ph) => { const dP = [-R / Math.cos(ph) ** 2, 0], Q = [R * Math.tan(ph), -y]; return cross(dP, Q) / Math.hypot(...Q) ** 3; }, da, a, 20000);
  const alto = filo(R, PI / 2 - 1e-7, 0), basso = filo(-R, 0, PI / 2 - 1e-7); // alto: corrente verso +x; basso: verso −x
  const Bz = MU0 * p.I / (4 * PI) * (semicerchio + alto + basso);
  assert.ok(Bz < 0, 'campo entrante nel foglio'); close(v.B, Math.abs(Bz), 1e-5, 'B totale');
  close(v.Bsem, MU0 * p.I / (4 * PI) * Math.abs(semicerchio), 1e-6, 'semicerchio'); close(v.Brett, MU0 * p.I / (4 * PI) * Math.abs(alto), 1e-5, 'filo semi-infinito');
});
each('b3-toroide-traferro', (p, v) => {
  const S = p.L * p.L, lfe = 2 * PI * p.R - p.d, Rfe = lfe / (MU0 * p.mur * S), Ra = p.d / (MU0 * S), Phi = p.N * p.I / (Rfe + Ra);
  close(v.Phi, Phi, 1e-9); close(v.B, Phi / S, 1e-9); close(v.Hfe, Phi / S / (MU0 * p.mur), 1e-9); close(v.Ha, Phi / S / MU0, 1e-9); close(v.Ug, 0.5 * Ra * Phi * Phi, 1e-9, 'energia = ½ℜΦ²');
  close(v.Hfe * lfe + v.Ha * p.d, p.N * p.I, 1e-9, 'Ampère');
});
each('b3-spira-filo-carica', (p, v) => {
  const Phi = (d) => simpson((x) => MU0 * p.I / (2 * PI * x) * p.h, d, d + p.l, 4000);
  close(v.Phi1, Phi(p.d1), 1e-9); close(v.Phi2, Phi(p.d2), 1e-9); close(v.Q, (Phi(p.d1) - Phi(p.d2)) / p.R, 1e-9);
});

/* ---------------- blocco 4 ---------------- */
each('b4-rl-apertura', (p, v) => {
  const I0 = p.E / p.R1, tr = rk4((t, y) => [-p.R2 * y[0] / p.L, p.R2 * y[0] * y[0]], [I0, 0], 12 * p.L / p.R2, 12000);
  close(v.I0, I0, 1e-12); close(v.W, tr[tr.length - 1][1][1], 1e-4, 'energia dissipata'); const a = tr.find(([t]) => t >= p.L / p.R2)[1][0]; close(v.Itau, a, 5e-3); close(v.Vpk, I0 * p.R2, 1e-12);
});
each('b4-spira-B-variabile', (p, v) => {
  const A = PI * p.a ** 2, Rr = 2 * PI * p.a * p.lam, Phi = (t) => A * p.B0 * (1 - Math.exp(-t / p.tau)), e = (t) => (Phi(t + 1e-9) - Phi(t - 1e-9)) / 2e-9;
  close(v.Rr, Rr, 1e-12); close(v.e0, Math.abs(e(1e-8)), 1e-3, 'emf'); close(v.i0, Math.abs(e(1e-8)) / Rr, 1e-3);
  const T = 25 * p.tau; close(v.Q, simpson((t) => (A * p.B0 / p.tau) * Math.exp(-t / p.tau) / Rr, 0, T, 20000), 1e-5, 'carica'); close(v.Wj, simpson((t) => ((A * p.B0 / p.tau) * Math.exp(-t / p.tau)) ** 2 / Rr, 0, T, 20000), 1e-5, 'Joule');
});
each('b4-barretta-rotaie', (p, v) => {
  const k = p.B ** 2 * p.h ** 2 / p.R, tau = p.m / k, tr = rk4((t, y) => [(p.F - k * y[0]) / p.m], [0], 12 * tau, 12000), vL = tr[tr.length - 1][1][0];
  close(v.vL, vL, 1e-4, 'vL'); close(firstCross(tr, 0, vL * (1 - Math.exp(-1))), v.tau, 2e-3, 'tau'); close(v.I, p.B * p.h * vL / p.R, 1e-4, 'corrente'); close(v.P, p.R * (v.I) ** 2, 1e-4, 'potenza');
});
each('b4-sbarra-rotante', (p, v) => {
  const e = simpson((r) => p.B * p.w * r, 0, p.l); close(v.e, e, 1e-9); close(v.I, e / p.R, 1e-9); close(v.Pp, e * e / p.R, 1e-9); close(v.M * p.w, v.Pp, 1e-9, 'M·ω = P');
  const th = 1e-6, dPhi = 0.5 * p.B * p.l ** 2 * th; close(e, dPhi / (th / p.w), 1e-9, 'e = dΦ/dt');
});
each('b4-mutua-filo-spira', (p, v) => {
  const M = simpson((x) => MU0 / (2 * PI * x) * p.a, p.d, p.d + p.a, 4000); close(v.M, M, 1e-9); close(v.e, M * p.k, 1e-9); close(v.i, M * p.k / p.R, 1e-9);
});
each('b4-solenoide-bobina', (p, v) => {
  const Phi = (t) => p.N * MU0 * p.n * p.I0 * Math.exp(-t / p.tau) * p.d ** 2, e = (t) => -(Phi(t + 1e-9) - Phi(t - 1e-9)) / 2e-9;
  close(v.e0, e(1e-8), 1e-3); close(v.i0, e(1e-8) / p.R, 1e-3); close(v.Q, simpson((t) => e(t) / p.R, 0, 25 * p.tau, 4000), 1e-4, 'carica');
});
each('b4-spira-rotante', (p, v) => {
  const w = 2 * PI * p.f, Phi = (t) => p.N * p.B * PI * p.a ** 2 * Math.cos(w * t), e = (t) => -(Phi(t + 1e-7 / p.f) - Phi(t - 1e-7 / p.f)) / (2e-7 / p.f);
  let mx = 0; for (let i = 0; i < 2000; i++) mx = Math.max(mx, Math.abs(e(i / (2000 * p.f))));
  close(v.e0, mx, 1e-4, 'emf massima'); close(v.Pm, simpson((t) => e(t) ** 2 / p.R, 0, 1 / p.f, 4000) * p.f, 1e-4, 'potenza media'); close(v.Mm * w, v.Pm, 1e-9);
});
each('b4-toroide-L', (p, v) => {
  const Phi1 = simpson((r) => MU0 * p.mur * p.N * p.I / (2 * PI * r) * p.a, p.R - p.a / 2, p.R + p.a / 2, 4000), L = p.N * Phi1 / p.I;
  close(v.L, L, 1e-8); close(v.Phi, p.N * Phi1, 1e-8); close(v.U, 0.5 * L * p.I ** 2, 1e-8);
  // energia anche da ∫ B²/(2 μ) dV
  close(v.U, simpson((r) => (MU0 * p.mur * p.N * p.I / (2 * PI * r)) ** 2 / (2 * MU0 * p.mur) * p.a * 2 * PI * r, p.R - p.a / 2, p.R + p.a / 2, 4000), 1e-7, 'energia da densità');
});
each('b4-rapporto-densita', (p, v) => {
  const B = (t) => MU0 * p.n * p.I0 * Math.exp(-t / p.tau), Phi = (t) => PI * p.r ** 2 * B(t), dt = p.tau * 1e-6;
  const E0 = Math.abs((Phi(dt) - Phi(-dt)) / (2 * dt)) / (2 * PI * p.r); close(v.E0, E0, 1e-5); close(v.B0, B(0), 1e-12);
  close(v.ratio, (0.5 * EPS0 * E0 ** 2) / (B(0) ** 2 / (2 * MU0)), 1e-5); close(v.ratio, v.ratio_formula, 1e-5, 'formula (r/2cτ)²');
});

/* ---------------- blocco 5 ---------------- */
each('b5-stella', (p, v) => {
  const poynting = (E0) => E0 * (E0 / C0) / (2 * MU0);
  close(v.Id, poynting(p.Ed), 1e-9, 'intensità da Poynting'); close(v.Pw, v.Id * 4 * PI * p.d ** 2, 1e-12); close(v.Is * 4 * PI * p.Rs ** 2, v.Pw, 1e-12, 'conservazione della potenza');
  close(poynting(v.Es), v.Is, 1e-9, 'E_s da I_s'); close(v.Bs, v.Es / C0, 1e-12);
});
each('b5-laser', (p, v) => {
  const A = PI * p.d ** 2 / 4; close(v.I, p.W / A, 1e-12); close(v.E0 * v.B0 / (2 * MU0), v.I, 1e-9, 'Poynting'); close(v.E0 / v.B0, C0, 1e-12); close(v.F, v.pr * A, 1e-9); close(v.pr, p.W / A / C0, 1e-9);
});
each('b5-young', (p, v) => {
  const inten = (y, extra = 0) => Math.cos(PI * (p.d * y / p.D - extra) / p.lam) ** 2;
  const peaks = (extra) => { const out = []; const dy = p.lam * p.D / p.d / 4000; for (let y = -8 * p.lam * p.D / p.d, i = 0; y < 8 * p.lam * p.D / p.d; y += dy, i++) { const a = inten(y - dy, extra), b = inten(y, extra), c = inten(y + dy, extra); if (b > a && b >= c && b > 0.999) out.push(y); } return out; };
  const pk = peaks(0).sort((a, b) => a - b), c0 = pk.findIndex((y) => Math.abs(y) < 1e-3 * v.dy);
  close(pk[c0 + 1] - pk[c0], v.dy, 2e-3, 'interfrangia'); close(pk[c0 + 3] - pk[c0], v.y3, 2e-3, 'terzo massimo');
  const sh = peaks((p.n - 1) * p.t).filter((y) => Math.abs(y - v.shift) < v.dy / 2 || Math.abs(y - (v.shift - v.dy * Math.round(v.shift / v.dy))) < v.dy / 2);
  assert.ok(sh.length > 0); close(v.nfr, (p.n - 1) * p.t / p.lam, 1e-12);
  const yc = (p.n - 1) * p.t * p.D / p.d; close(v.shift, yc, 1e-9, 'spostamento della frangia centrale');
  assert.ok(Math.abs(inten(yc, (p.n - 1) * p.t) - 1) < 1e-9, 'massimo nella nuova posizione');
});
each('b5-spira-onda', (p, v) => {
  close(v.E0 * (v.E0 / C0) / (2 * MU0), p.I, 1e-9, 'Poynting'); const w = 2 * PI * C0 / p.lam;
  const Phi = (t) => (v.E0 / C0) * p.S * Math.cos(p.theta) * Math.cos(w * t), dt = 1e-3 / (w / (2 * PI)); let mx = 0;
  for (let i = 0; i < 4000; i++) { const t = i * (2 * PI / w) / 4000; mx = Math.max(mx, Math.abs((Phi(t + dt * 1e-4) - Phi(t - dt * 1e-4)) / (2e-4 * dt))); }
  close(v.e0, mx, 1e-3, 'emf massima'); close(v.w, w, 1e-12);
});
each('b5-angolo-limite-specchio', (p, v) => {
  const thc = Math.asin(1 / p.n); close(v.thc, thc, 1e-12);
  const up = simpson((th) => Math.sin(th) / 2, 0, thc, 4000), down = simpson((th) => Math.sin(th) / 2, 0, thc, 4000);
  close(v.frac, up + down, 1e-8, 'frazione di potenza'); assert.ok(v.frac > 0 && v.frac < 1);
  close(v.rdir, p.h * Math.tan(thc), 1e-12); close(v.rref, (2 * p.H - p.h) * Math.tan(thc), 1e-12);
  // il raggio al limite: un raggio emesso a thc dalla verticale colpisce la superficie a distanza h tan(thc) e incide con angolo thc
  close(Math.sin(thc) * p.n, 1, 1e-12);
});
each('b5-onda-piana', (p, v) => {
  close(v.lam * p.f, C0, 1e-12); close(v.k * v.lam, 2 * PI, 1e-12); close(v.w, 2 * PI * p.f, 1e-12); close(v.B0, p.E0 / C0, 1e-12);
  const u = (t) => 0.5 * EPS0 * (p.E0 * Math.cos(t)) ** 2 + (p.E0 / C0 * Math.cos(t)) ** 2 / (2 * MU0);
  close(v.uavg, simpson(u, 0, 2 * PI, 2000) / (2 * PI), 1e-9, 'densità media di energia');
  close(v.I, simpson((t) => p.E0 * Math.cos(t) * (p.E0 / C0) * Math.cos(t) / MU0, 0, 2 * PI, 2000) / (2 * PI), 1e-9, 'Poynting medio'); close(v.I, v.uavg * C0, 1e-9, 'I = u c'); close(v.pabs, v.I / C0, 1e-12);
});
