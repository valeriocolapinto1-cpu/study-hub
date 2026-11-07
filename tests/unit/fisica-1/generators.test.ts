/**
 * Generatori di Fisica 1: forma valida su molti semi in entrambe le lingue,
 * determinismo, e risposte RICALCOLATE in modo indipendente a partire dai dati
 * letti nel testo (integrazione numerica delle equazioni del moto, bilanci
 * alternativi), non rilette dal generatore.
 */
import { describe, expect, it } from 'vitest';
import {
  listGenerators,
  runGenerator,
  type GeneratedExercise,
} from '../../../src/engine/generators/registry';
import '../../../src/courses/fisica-1/generators/oscillazioni';
import '../../../src/courses/fisica-1/generators/energia';
import '../../../src/courses/fisica-1/generators/rigido';
import '../../../src/courses/fisica-1/generators/termodinamica';
import { gradeAnswers } from '../../../src/engine/grading';
import { num } from '../../../src/courses/fisica-1/lib/gen';

const SEEDS = Array.from({ length: 200 }, (_, i) => i * 7919 + 13);
const ids = listGenerators('fisica-1').map((g) => g.id);
const g = 9.81;
const R = 8.314;

/** Numeri che compaiono nel testo, nell'ordine (virgola o punto, potenze di dieci). */
function numbers(statement: string): number[] {
  const re = /(?<![_A-Za-z^{\d])(-?\d+(?:(?:\{,\}|\.)\d+)?)(?:\s*\\cdot\s*10\^\{(-?\d+)\})?/g;
  return [...statement.matchAll(re)].map((m) => Number(m[1]!.replace('{,}', '.')) * 10 ** Number(m[2] ?? 0));
}
const close = (a: number, b: number, rel = 2e-3) => Math.abs(a - b) <= rel * Math.max(Math.abs(b), 1e-9);
const val = (ex: GeneratedExercise, i: number) => ex.answer[i]!.value as number;

/** Integratore RK4 per x'' = f(x, v, t). */
function rk4(
  f: (x: number, v: number, t: number) => number,
  x0: number,
  v0: number,
  dt: number,
  steps: number,
  each?: (x: number, v: number, t: number) => void,
) {
  let x = x0,
    v = v0,
    t = 0;
  for (let i = 0; i < steps; i++) {
    const k1x = v,
      k1v = f(x, v, t);
    const k2x = v + (dt / 2) * k1v,
      k2v = f(x + (dt / 2) * k1x, v + (dt / 2) * k1v, t + dt / 2);
    const k3x = v + (dt / 2) * k2v,
      k3v = f(x + (dt / 2) * k2x, v + (dt / 2) * k2v, t + dt / 2);
    const k4x = v + dt * k3v,
      k4v = f(x + dt * k3x, v + dt * k3v, t + dt);
    x += (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    v += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    t += dt;
    each?.(x, v, t);
  }
  return { x, v };
}

/** Verifiche indipendenti: dai numeri del testo (it) alle risposte attese. */
const CHECKS: Record<string, (n: number[], ex: GeneratedExercise) => void> = {
  'fisica-1/moto-circolare': ([R0, a, t], ex) => {
    // velocità e posizione integrate nel tempo: ω(t) = ∫α dt
    const w = rk4(() => a!, 0, 0, t! / 1000, 1000).v;
    expect(close(val(ex, 0), w)).toBe(true);
    expect(close(val(ex, 3), Math.hypot(a! * R0!, w * w * R0!))).toBe(true);
  },
  'fisica-1/moto-armonico': ([T, , x0, v0], ex) => {
    const w = (2 * Math.PI) / T!;
    let max = 0;
    rk4(
      (x) => -w * w * x,
      x0!,
      v0!,
      T! / 4000,
      4000,
      (x) => (max = Math.max(max, Math.abs(x))),
    );
    expect(close(val(ex, 1), max, 5e-3)).toBe(true);
  },
  'fisica-1/massa-molla': ([m, k, A, x], ex) => {
    let vAt = 0;
    const T = 2 * Math.PI * Math.sqrt(m! / k!);
    rk4(
      (y) => (-k! / m!) * y,
      A!,
      0,
      T / 20000,
      10000,
      (y, v) => {
        if (Math.abs(y - x!) < A! * 2e-3 && vAt === 0) vAt = Math.abs(v);
      },
    );
    expect(close(val(ex, 2), vAt, 2e-2)).toBe(true);
  },
  'fisica-1/pendolo': ([Lf, , th], ex) => {
    // pendolo ESATTO integrato fino al passaggio per la verticale
    let vb = 0;
    const T0 = 2 * Math.PI * Math.sqrt(Lf! / g);
    rk4(
      (q) => -(g / Lf!) * Math.sin(q),
      (th! * Math.PI) / 180,
      0,
      T0 / 40000,
      20000,
      (_q, w) => {
        vb = Math.max(vb, Math.abs(w) * Lf!);
      },
    );
    expect(close(val(ex, 1), vb, 1e-3)).toBe(true);
  },
  'fisica-1/oscillatore-smorzato': ([m, k, b], ex) => {
    // rapporto tra massimi successivi misurato sulla soluzione numerica
    const maxima: number[] = [];
    let prev = 0;
    const T = 2 * Math.PI * Math.sqrt(m! / k!);
    rk4(
      (x, v) => (-k! * x - b! * v) / m!,
      1,
      0,
      T / 4000,
      12000,
      (x, v) => {
        if (prev > 0 && v <= 0) maxima.push(x);
        prev = v;
      },
    );
    expect(maxima.length).toBeGreaterThan(1);
    expect(close(val(ex, 2), maxima[0]! / maxima[1]!, 5e-3)).toBe(true);
  },
  'fisica-1/risonanza': ([m, k, b, F0, Om], ex) => {
    // ampiezza a regime dopo l'estinzione del transitorio
    const gam = b! / (2 * m!);
    const steps = Math.ceil(12 / gam / ((2 * Math.PI) / Om! / 400));
    const dt = (2 * Math.PI) / Om! / 400;
    let amp = 0;
    rk4(
      (x, v, t) => (F0! * Math.cos(Om! * t) - k! * x - b! * v) / m!,
      0,
      0,
      dt,
      steps + 800,
      (x, _v, t) => {
        if (t > steps * dt) amp = Math.max(amp, Math.abs(x));
      },
    );
    expect(close(val(ex, 0), amp, 1e-2)).toBe(true);
  },
  'fisica-1/riferimento-accelerato': ([m, A], ex) => {
    const up = /alto/.test(ex.statement);
    expect(close(val(ex, 0), m! * (g + (up ? A! : -A!)))).toBe(true);
  },
  'fisica-1/lavoro-frenata': ([m, vk, F], ex) => {
    // cinematica: d = v²/(2a) con a = F/m
    const v = vk! / 3.6;
    expect(close(val(ex, 1), (v * v) / (2 * (F! / m!)))).toBe(true);
  },
  'fisica-1/giro-della-morte': ([m, h, R0], ex) => {
    expect(close(val(ex, 2), m! * g * ((2 * h!) / R0! - 5))).toBe(true);
  },
  'fisica-1/piano-scabro': ([v0, th, mu], ex) => {
    // dinamica: decelerazione in salita, accelerazione in discesa
    const t = (th! * Math.PI) / 180;
    const aUp = g * (Math.sin(t) + mu! * Math.cos(t));
    const aDown = g * (Math.sin(t) - mu! * Math.cos(t));
    const d = (v0! * v0!) / (2 * aUp);
    expect(close(val(ex, 1), Math.sqrt(2 * aDown * d))).toBe(true);
  },
  'fisica-1/momento-angolare-filo': ([m, r1, v1, r2], ex) => {
    // L conservato: m v r costante; tensione = m v²/r
    const v2 = val(ex, 0);
    expect(close(m! * v2 * r2!, m! * v1! * r1!)).toBe(true);
    expect(close(val(ex, 2), (m! * v2 * v2) / r2!)).toBe(true);
  },
  'fisica-1/centro-di-massa-barca': ([m, M, Lb], ex) => {
    expect(close(m! * val(ex, 1) + M! * val(ex, 0), 0, 1)).toBe(true);
    expect(close(val(ex, 1) - val(ex, 0), Lb!)).toBe(true);
  },
  'fisica-1/momenti-di-inerzia': ([M, Lr, m], ex) => {
    // integrazione numerica di x² dm rispetto all'estremo
    let I = 0;
    const N = 20000;
    for (let i = 0; i < N; i++) {
      const x = ((i + 0.5) / N) * Lr!;
      I += (M! / N) * x * x;
    }
    I += m! * Lr! * Lr!;
    expect(close(val(ex, 1), I, 1e-4)).toBe(true);
  },
  'fisica-1/carrucola-massiva': ([m, M, R0, h], ex) => {
    // energia: m g h = ½ m v² + ½ (½ M R²) ω²
    const w = val(ex, 2);
    expect(close(m! * g * h!, 0.5 * m! * (w * R0!) ** 2 + 0.25 * M! * R0! * R0! * w * w)).toBe(true);
  },
  'fisica-1/rotolamento': ([th, s], ex) => {
    const beta = /sfera piena/.test(ex.statement)
      ? 0.4
      : /cilindro/.test(ex.statement)
        ? 0.5
        : /anello/.test(ex.statement)
          ? 1
          : 2 / 3;
    // energia: g s sinθ = ½(1+β) v²
    expect(close(val(ex, 1), Math.sqrt((2 * g * s! * Math.sin((th! * Math.PI) / 180)) / (1 + beta)))).toBe(
      true,
    );
  },
  'fisica-1/urto-elastico': ([m1, v1, m2, v2], ex) => {
    const u1 = val(ex, 0),
      u2 = val(ex, 1);
    expect(close(m1! * u1 + m2! * u2, m1! * v1! + m2! * v2!, 1e-6)).toBe(true);
    expect(close(m1! * u1 * u1 + m2! * u2 * u2, m1! * v1! * v1! + m2! * v2! * v2!, 1e-6)).toBe(true);
  },
  'fisica-1/pendolo-balistico': ([m, M, Lf, th], ex) => {
    // in avanti: dalla velocità del proiettile all'angolo di risalita
    const V = (m! * val(ex, 1)) / (m! + M!);
    const cos = 1 - (V * V) / (2 * g * Lf!);
    expect(close((Math.acos(cos) * 180) / Math.PI, th!, 1e-6)).toBe(true);
  },
  'fisica-1/pendolo-fisico': ([Lr, d], ex) => {
    // periodo del pendolo fisico linearizzato integrato numericamente
    const I = (Lr! * Lr!) / 12 + d! * d!; // per unità di massa
    let last = 0,
      crossings = 0,
      t0 = 0,
      t1 = 0;
    rk4(
      (q) => (-g * d! * q) / I,
      0.01,
      0,
      1e-4,
      80000,
      (q, _w, t) => {
        if (last > 0 && q <= 0) {
          crossings++;
          if (crossings === 1) t0 = t;
          if (crossings === 3) t1 = t;
        }
        last = q;
      },
    );
    expect(close(val(ex, 1), (t1 - t0) / 2, 2e-3)).toBe(true);
  },
  'fisica-1/asta-che-cade': ([Lr, th], ex) => {
    // integrazione della dinamica esatta: I θ'' = −M g (L/2) cos θ
    let w = 0;
    let done = false;
    rk4(
      (q) => (-g * (Lr! / 2) * Math.cos(q)) / ((Lr! * Lr!) / 3),
      (th! * Math.PI) / 180,
      0,
      2e-4,
      20000,
      (q, om) => {
        if (!done && q <= -Math.PI / 2) {
          w = Math.abs(om);
          done = true;
        }
      },
    );
    expect(close(val(ex, 0), w, 2e-3)).toBe(true);
  },
  'fisica-1/stevino': ([rho, , h, A], ex) => {
    // integrazione di dp/dz = −ρg
    let p = 0;
    for (let i = 0; i < 1000; i++) p += rho! * g * (h! / 1000);
    expect(close(val(ex, 1), p)).toBe(true);
    expect(close(val(ex, 2), p * A!)).toBe(true);
  },
  'fisica-1/velocita-quadratica-media': ([M, T], ex) => {
    const kB = R / 6.022e23;
    const m = M! / 1000 / 6.022e23;
    expect(close(0.5 * m * val(ex, 0) ** 2, 1.5 * kB * T!)).toBe(true);
  },
  'fisica-1/legge-combinata': ([V1, p1, t1, p2, t2], ex) => {
    const n = val(ex, 0);
    expect(close(p2! * val(ex, 1) * 1e-3, n * R * (t2! + 273.15))).toBe(true);
    expect(close(p1! * V1! * 1e-3, n * R * (t1! + 273.15))).toBe(true);
  },
  'fisica-1/calori-molari': ([n, dT], ex) => {
    // Mayer: Q_p − Q_V = W = nRΔT
    expect(close(val(ex, 1) - val(ex, 0), n! * R * dT!)).toBe(true);
    expect(close(val(ex, 2), n! * R * dT!)).toBe(true);
  },
  'fisica-1/espansione-isoterma-adiabatica': ([n, T1, k], ex) => {
    const mono = /monoatomico/.test(ex.statement);
    const gam = mono ? 5 / 3 : 7 / 5;
    // ∫ p dV numerico lungo isoterma e adiabatica
    const V1 = 1,
      N = 20000;
    let Wi = 0,
      Wa = 0;
    const p1 = (n! * R * T1!) / V1;
    for (let i = 0; i < N; i++) {
      const V = V1 + ((i + 0.5) / N) * (k! - 1) * V1;
      const dV = ((k! - 1) * V1) / N;
      Wi += ((n! * R * T1!) / V) * dV;
      Wa += p1 * (V1 / V) ** gam * dV;
    }
    expect(close(val(ex, 0), Wi, 1e-5)).toBe(true);
    expect(close(val(ex, 2), Wa, 1e-5)).toBe(true);
  },
  'fisica-1/macchina-termica': ([Qc, eta], ex) => {
    expect(close(val(ex, 0) + val(ex, 1), Qc!)).toBe(true);
    expect(close(val(ex, 0) / Qc!, eta!)).toBe(true);
  },
  'fisica-1/ciclo-di-carnot': ([n, Tc, Tf, k], ex) => {
    // somma dei lavori dei quattro tratti integrati numericamente (gas monoatomico)
    const gam = 5 / 3,
      V1 = 1,
      V2 = k! * V1;
    const V3 = V2 * (Tc! / Tf!) ** (1 / (gam - 1));
    const V4 = V1 * (Tc! / Tf!) ** (1 / (gam - 1));
    const W = (f: (V: number) => number, a: number, b: number) => {
      let s = 0;
      const N = 20000;
      for (let i = 0; i < N; i++) s += f(a + ((i + 0.5) / N) * (b - a)) * ((b - a) / N);
      return s;
    };
    const pAd = (Va: number, Ta: number) => (V: number) => ((n! * R * Ta) / Va) * (Va / V) ** gam;
    const tot =
      W((V) => (n! * R * Tc!) / V, V1, V2) +
      W(pAd(V2, Tc!), V2, V3) +
      W((V) => (n! * R * Tf!) / V, V3, V4) +
      W(pAd(V4, Tf!), V4, V1);
    expect(close(val(ex, 2), tot, 1e-4)).toBe(true);
  },
  'fisica-1/entropia-mescolamento': ([m1, t1, m2, t2], ex) => {
    // ∫ dQ/T numerico per la massa calda
    const T1 = t1! + 273.15,
      Tf = val(ex, 0);
    let S = 0;
    const N = 20000;
    for (let i = 0; i < N; i++) {
      const T = T1 + ((i + 0.5) / N) * (Tf - T1);
      S += (m1! * 4186 * ((Tf - T1) / N)) / T;
    }
    expect(close(val(ex, 1), S, 1e-5)).toBe(true);
    expect(close(m1! * (T1 - Tf), m2! * (Tf - t2! - 273.15), 1e-6)).toBe(true);
  },
};

describe('generatori di Fisica 1', () => {
  it('sono registrati e hanno tutti una verifica indipendente', () => {
    expect(ids.length).toBeGreaterThanOrEqual(25);
    expect(ids.filter((id) => !CHECKS[id])).toEqual([]);
  });

  it.each(ids)('%s: uscita valida, deterministica, verificata in modo indipendente', (id) => {
    for (const seed of SEEDS) {
      const it_ = runGenerator(id, seed, 'it');
      const en = runGenerator(id, seed, 'en');
      expect(runGenerator(id, seed, 'it')).toEqual(it_);
      expect(en.answer.map((a) => a.value)).toEqual(it_.answer.map((a) => a.value));
      expect(en.statement).not.toEqual(it_.statement);
      for (const a of it_.answer) expect(Number.isFinite(a.value as number)).toBe(true);
      // la propria risposta è accettata dalla correzione
      const graded = gradeAnswers(
        it_.answer.map((a) => ({
          label: a.label,
          value: a.value,
          ...(a.tol ? { tol: a.tol } : {}),
          ...(a.unit ? { unit: a.unit } : {}),
        })),
        it_.answer.map((a) => String(a.value)),
      );
      expect(graded.score).toBe(1);
      CHECKS[id]!(numbers(it_.statement), it_);
    }
  });

  it('formatta i numeri per lingua', () => {
    expect(num(3.14159, 'it')).toBe('3{,}14');
    expect(num(3.14159, 'en')).toBe('3.14');
    expect(num(2.5e-5, 'en')).toBe('2.5 \\cdot 10^{-5}');
    expect(num(1200, 'it')).toBe('1200');
    expect(num(0, 'it')).toBe('0');
  });
});
