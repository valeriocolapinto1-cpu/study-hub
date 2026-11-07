/**
 * Esercizio d'analisi di Teoria dei Circuiti: ogni istanza generata è verificata in modo
 * indipendente (simulazione nel tempo in virgola mobile e metodo di Laplace con i generatori
 * equivalenti delle condizioni iniziali); testi e passi compilano con KaTeX in modalità stretta.
 */
import { describe, expect, it } from 'vitest';
import katex from 'katex';
import '../../../src/courses/teoria-circuiti/generators/analisi';
import { runGenerator, listGenerators } from '../../../src/engine/generators/registry';
import { generateInstance } from '../../../src/courses/teoria-circuiti/lib/generate';
import { crossCheck } from '../../../src/courses/teoria-circuiti/lib/simulator';
import { analyze, laplaceCheck } from '../../../src/courses/teoria-circuiti/lib/exercise';
import { Rational } from '../../../src/courses/teoria-circuiti/lib/rational';
import { Cx } from '../../../src/courses/teoria-circuiti/lib/complex';
import { solve, thevenin } from '../../../src/courses/teoria-circuiti/lib/mna';
import { wave, type Circuit } from '../../../src/courses/teoria-circuiti/lib/netlist';

const R = (x: number | string) => Rational.from(x);

/** Controlla che ogni formula $…$ / $$…$$ di un testo compili in KaTeX (strict). */
export function katexOk(text: string): void {
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+)\$/g;
  for (const m of text.matchAll(re))
    katex.renderToString((m[1] ?? m[2])!, {
      strict: 'error',
      throwOnError: true,
      displayMode: Boolean(m[1]),
    });
}

describe('aritmetica esatta', () => {
  it('razionali ridotti e operazioni', () => {
    expect(R('6/8').toString()).toBe('3/4');
    expect(R('1/3').add('1/6').toString()).toBe('1/2');
    expect(R('-2/4').toLatex()).toBe('-\\frac{1}{2}');
    expect(R('0.25').eq('1/4')).toBe(true);
    expect(R('1/3').toDecimal(3, '{,}')).toBe('0{,}333');
    expect(() => R(1).div(0)).toThrow();
  });
  it('complessi', () => {
    const z = new Cx(3, 4);
    expect(z.mul(z.conj()).eq(25)).toBe(true);
    expect(Cx.ONE.div(new Cx(1, 1)).toString()).toBe('1/2-1/2j');
  });
});

describe('risolutore esatto su casi svolti a mano', () => {
  it('partitore e Thevenin (esempio VI-02 del sito)', () => {
    const c: Circuit = {
      elements: [
        { id: 'V1', type: 'V', a: 'in', b: '0', wave: wave(12) },
        { id: 'R1', type: 'R', a: 'in', b: 'p', r: R(2) },
        { id: 'R2', type: 'R', a: 'p', b: '0', r: R(4) },
      ],
    };
    expect(solve(c).v('p').eq(8)).toBe(true);
    const t = thevenin(c, 'p', '0');
    expect(t.vth.eq(8)).toBe(true);
    expect(t.zth.eq(R('4/3'))).toBe(true);
  });
  it('Thevenin con VCCS da non spegnere (errore tipico E1)', () => {
    const c: Circuit = {
      elements: [
        { id: 'V1', type: 'V', a: 'a', b: '0', wave: wave(4) },
        { id: 'R1', type: 'R', a: 'a', b: 'o', r: R(2) },
        { id: 'G1', type: 'G', a: 'o', b: '0', cp: 'o', cn: '0', gm: R('1/2') },
      ],
    };
    const t = thevenin(c, 'o', '0');
    expect(t.vth.eq(2)).toBe(true);
    expect(t.zth.eq(1)).toBe(true);
  });
  it('trasformatore ideale con carico (esempio I-08)', () => {
    const c: Circuit = {
      elements: [
        { id: 'V1', type: 'V', a: 'in', b: '0', wave: wave(24) },
        { id: 'R1', type: 'R', a: 'in', b: 'p', r: R(12) },
        { id: 'T1', type: 'T', p1a: 'p', p1b: '0', p2a: 'q', p2b: '0', n: R(2) },
        { id: 'RL', type: 'R', a: 'q', b: '0', r: R(3) },
      ],
    };
    const s = solve(c);
    expect(s.v('p').eq(12)).toBe(true);
    expect(s.v('q').eq(6)).toBe(true);
  });
  it('invertente con nullore', () => {
    const c: Circuit = {
      elements: [
        { id: 'V1', type: 'V', a: 'in', b: '0', wave: wave(1) },
        { id: 'R1', type: 'R', a: 'in', b: 'x', r: R(2) },
        { id: 'N1', type: 'N', na: 'x', nb: '0', ra: 'y', rb: '0' },
        { id: 'Rf', type: 'R', a: 'x', b: 'y', r: R(8) },
      ],
    };
    expect(solve(c).v('y').eq(-4)).toBe(true);
  });
  it('RC in regime sinusoidale (esempio III-01): fasore 1/(1+j)', () => {
    const c: Circuit = {
      elements: [
        { id: 'V1', type: 'V', a: 'in', b: '0', wave: wave(0, 1) },
        { id: 'R1', type: 'R', a: 'in', b: 'o', r: R(1) },
        { id: 'C1', type: 'C', a: 'o', b: '0', c: R(1) },
      ],
    };
    const s = solve(c, { s: new Cx(0, 1), source: (e) => e.wave.ac });
    expect(s.v('o').eq(new Cx('1/2', '-1/2'))).toBe(true);
  });
});

const SEEDS = Array.from({ length: 40 }, (_, i) => i * 7919 + 1);

describe('istanze generate: verifica indipendente', () => {
  for (const tpl of ['A', 'B', 'C'] as const)
    for (const level of [1, 2, 3] as const)
      it(`template ${tpl}, livello ${level}: simulazione e Laplace concordano su ${SEEDS.length} semi`, () => {
        for (const seed of SEEDS) {
          const { inst, sol } = generateInstance(tpl, level, seed);
          const chk = crossCheck(inst, sol);
          expect(chk.ok, `seed ${seed}: errore ${chk.maxErr}`).toBe(true);
          expect(laplaceCheck(inst, sol).ok, `seed ${seed}`).toBe(true);
          expect(sol.tau.sign()).toBe(1);
          // deterministico
          expect(analyze(generateInstance(tpl, level, seed).inst).k.eq(sol.k)).toBe(true);
        }
      }, 120_000);
});

describe('generatori registrati', () => {
  const ids = listGenerators('teoria-circuiti').filter((g) => g.id.includes('/analisi-'));
  it('sono 12 (4 tipi × 3 livelli)', () => expect(ids).toHaveLength(12));
  for (const g of ids)
    it(`${g.id}: testi IT/EN validi, KaTeX stretto, risposte finite`, () => {
      for (const seed of SEEDS.slice(0, 12))
        for (const lang of ['it', 'en'] as const) {
          const ex = runGenerator(g.id, seed, lang);
          katexOk(ex.statement);
          for (const s of ex.steps) {
            katexOk(s.title);
            katexOk(s.body);
          }
          for (const a of ex.answer) katexOk(a.label);
          expect(ex.figure?.netlist).toBeTruthy();
          expect(JSON.stringify(runGenerator(g.id, seed, lang))).toBe(JSON.stringify(ex));
        }
    }, 60_000);
});
