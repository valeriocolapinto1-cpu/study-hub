/** Domande applicate e allenamento per passo: forma, determinismo, KaTeX e controlli incrociati. */
import { describe, expect, it } from 'vitest';
import { APPLIED_GENERATORS } from '../../../src/courses/teoria-circuiti/generators/applicate';
import { runGenerator } from '../../../src/engine/generators/registry';
import { katexOk } from './analisi.test';

const SEEDS = Array.from({ length: 60 }, (_, i) => i * 104729 + 3);
const val = (ex: ReturnType<typeof runGenerator>, label: string) =>
  Number(ex.answer.find((a) => a.label === label)?.value);

describe('domande applicate', () => {
  it('19 generatori registrati', () => expect(APPLIED_GENERATORS).toHaveLength(19));
  for (const id of APPLIED_GENERATORS)
    it(`${id}: valido, deterministico, KaTeX stretto in IT ed EN`, () => {
      for (const seed of SEEDS)
        for (const lang of ['it', 'en'] as const) {
          const ex = runGenerator(id, seed, lang);
          katexOk(ex.statement);
          ex.steps.forEach((s) => (katexOk(s.title), katexOk(s.body)));
          ex.answer.forEach((a) => katexOk(a.label));
          expect(JSON.stringify(runGenerator(id, seed, lang))).toBe(JSON.stringify(ex));
          const other = runGenerator(id, seed, lang === 'it' ? 'en' : 'it');
          expect(other.answer.map((a) => a.value)).toEqual(ex.answer.map((a) => a.value));
        }
    }, 60_000);
});

describe('controlli incrociati sulle risposte', () => {
  it('Norton = Thevenin / R_th', () => {
    for (const s of SEEDS) {
      const ex = runGenerator('teoria-circuiti/thevenin-norton', s, 'it');
      expect(val(ex, '$I_N$')).toBeCloseTo(val(ex, '$V_{th}$') / val(ex, '$R_{th}$'), 12);
    }
  });
  it('risonanza: B = ω0/Q', () => {
    for (const s of SEEDS) {
      const ex = runGenerator('teoria-circuiti/risonanza', s, 'it');
      expect(val(ex, '$B$')).toBeCloseTo(val(ex, '$\\omega_0$') / val(ex, '$Q$'), 12);
    }
  });
  it('potenze: |S|² = P² + Q² e |Z| = |S|·2/I_m²', () => {
    for (const s of SEEDS) {
      const ex = runGenerator('teoria-circuiti/potenze', s, 'it');
      const [P, Q, S] = ['$P$', '$Q$', '$|S|$'].map((l) => val(ex, l));
      expect(Math.hypot(P!, Q!)).toBeCloseTo(S!, 10);
      expect(val(ex, '$R$') / val(ex, '$X$')).toBeCloseTo(P! / Q!, 10);
    }
  });
  it('trasformata a tratti: confronto con integrazione numerica', () => {
    for (const s of SEEDS) {
      const ex = runGenerator('teoria-circuiti/laplace-segnale-a-tratti', s, 'it');
      const m = /x\(t\)=(\d+)(\\,t)?\$ per \$0<t<(\d)\$/.exec(ex.statement)!;
      const a = Number(m[1]);
      const ramp = Boolean(m[2]);
      const T = Number(m[3]);
      let sum = 0;
      const N = 20000;
      for (let k = 0; k < N; k++) {
        const t = ((k + 0.5) * T) / N;
        sum += (ramp ? a * t : a) * Math.exp(-t) * (T / N);
      }
      expect(val(ex, '$X(1)$')).toBeCloseTo(sum, 6);
    }
  });
  it('antitrasformata: i coefficienti ricostruiscono F(s) in due punti', () => {
    for (const s of SEEDS) {
      const ex = runGenerator('teoria-circuiti/antitrasformata-fratti-semplici', s, 'it');
      const m = /e\^\{-(\d)t\}\+B\\,e\^\{-(\d)t\}/.exec(ex.statement)!;
      const p = Number(m[1]);
      const q = Number(m[2]);
      const A = val(ex, '$A$');
      const B = val(ex, '$B$');
      const F = (x: number) => A / (x + p) + B / (x + q);
      const num = /\\dfrac\{([^}]*)\}\{\(s\+/.exec(ex.statement)![1]!;
      const ev = (x: number) => {
        const mm = /^(-?\d*)s([+-]\d+)?$|^([+-]?\d+)$/.exec(num)!;
        if (mm[3]) return Number(mm[3]);
        const c1 = mm[1] === '' ? 1 : mm[1] === '-' ? -1 : Number(mm[1]);
        return c1 * x + Number(mm[2] ?? 0);
      };
      for (const x of [0.7, 2.3]) expect(F(x)).toBeCloseTo(ev(x) / ((x + p) * (x + q)), 10);
    }
  });
});
