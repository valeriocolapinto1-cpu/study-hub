import { describe, expect, it } from 'vitest';
import {
  allCubes,
  compareCost,
  coverCost,
  coversMinterm,
  isImplicant,
  literalCount,
  minimalCover,
  mintermsOf,
  primeImplicants,
  sopToString,
  termToString,
  type CoverCost,
  type Implicant,
} from './boolean';

/**
 * Verifica indipendente della minimalità.
 *
 * Non riusa `minimalCover`: enumera i sottoinsiemi di implicanti per numero
 * crescente di termini e si ferma al primo che copre l'on-set, prendendo poi
 * il minor numero di letterali a parità di termini. È lento ma ovviamente
 * corretto — esattamente ciò che serve per fidarsi dell'implementazione vera.
 */
function bruteForceCost(
  onSet: ReadonlySet<number>,
  dontCares: ReadonlySet<number>,
  vars: number,
): CoverCost {
  if (onSet.size === 0) return { terms: 0, literals: 0 };

  const allowed = new Set([...onSet, ...dontCares]);
  const implicants = allCubes(vars).filter((imp) => isImplicant(imp, allowed, vars));
  const targets = [...onSet];

  const covers = (chosen: Implicant[]): boolean =>
    targets.every((m) => chosen.some((imp) => coversMinterm(imp, m)));

  for (let size = 1; size <= 6; size++) {
    let bestLiterals = Number.POSITIVE_INFINITY;

    const walk = (start: number, chosen: Implicant[]): void => {
      if (chosen.length === size) {
        if (covers(chosen)) {
          bestLiterals = Math.min(bestLiterals, coverCost(chosen, vars).literals);
        }
        return;
      }
      for (let i = start; i < implicants.length; i++) {
        chosen.push(implicants[i] as Implicant);
        walk(i + 1, chosen);
        chosen.pop();
      }
    };
    walk(0, []);

    if (Number.isFinite(bestLiterals)) return { terms: size, literals: bestLiterals };
  }
  throw new Error('nessuna copertura trovata entro 6 termini');
}

/** La copertura è valida: copre tutti gli 1 e nessuno 0. */
function isValidCover(
  cover: readonly Implicant[],
  onSet: ReadonlySet<number>,
  dontCares: ReadonlySet<number>,
  vars: number,
): boolean {
  const coversAllOnes = [...onSet].every((m) => cover.some((imp) => coversMinterm(imp, m)));
  const touchesNoZeros = cover.every((imp) =>
    mintermsOf(imp, vars).every((m) => onSet.has(m) || dontCares.has(m)),
  );
  return coversAllOnes && touchesNoZeros;
}

describe('cubi e implicanti', () => {
  it('enumera 3ⁿ cubi', () => {
    expect(allCubes(2)).toHaveLength(9);
    expect(allCubes(3)).toHaveLength(27);
    expect(allCubes(4)).toHaveLength(81);
  });

  it('conta i letterali come variabili fissate', () => {
    expect(literalCount({ mask: 0b000, bits: 0 }, 3)).toBe(0);
    expect(literalCount({ mask: 0b101, bits: 0b100 }, 3)).toBe(2);
  });

  it('scrive i termini con la soprallineatura sui complementati', () => {
    // A=1, B=0 su 3 variabili → A·B̄
    const term = termToString({ mask: 0b110, bits: 0b100 }, 3);
    expect(term).toBe('A·<span class="ovl">B</span>');
  });

  it('la funzione nulla è 0 e il cubo pieno è 1', () => {
    expect(sopToString([], 3)).toBe('0');
    expect(termToString({ mask: 0, bits: 0 }, 3)).toBe('1');
  });

  it('gli implicanti primi non sono contenuti in altri implicanti', () => {
    // Y = A (mintermini 4,5,6,7 su 3 variabili)
    const onSet = new Set([4, 5, 6, 7]);
    const primes = primeImplicants(onSet, new Set(), 3);
    expect(primes).toHaveLength(1);
    expect(literalCount(primes[0] as Implicant, 3)).toBe(1);
  });
});

describe('minimalCover produce davvero la SOP minima', () => {
  it('minimizza casi noti a mano', () => {
    // Y = A + A·B̄ deve collassare in Y = A.
    const onSet = new Set([4, 5, 6, 7]);
    expect(coverCost(minimalCover(onSet, new Set(), 3), 3)).toEqual({ terms: 1, literals: 1 });

    // XOR a 2 variabili (su 2 var: mintermini 01 e 10) non si semplifica.
    expect(coverCost(minimalCover(new Set([1, 2]), new Set(), 2), 2)).toEqual({
      terms: 2,
      literals: 4,
    });
  });

  it('è minima su TUTTE le 256 funzioni a 3 variabili', () => {
    for (let bitmap = 1; bitmap < 256; bitmap++) {
      const onSet = new Set<number>();
      for (let m = 0; m < 8; m++) if (bitmap & (1 << m)) onSet.add(m);

      const cover = minimalCover(onSet, new Set(), 3);
      expect(isValidCover(cover, onSet, new Set(), 3), `funzione ${bitmap}`).toBe(true);
      expect(compareCost(coverCost(cover, 3), bruteForceCost(onSet, new Set(), 3)),
        `funzione ${bitmap}: copertura non minima`).toBe(0);
    }
  });

  it('è minima anche con le indifferenze', () => {
    // Campione a 3 variabili con don't care, confrontato con la forza bruta.
    for (let bitmap = 1; bitmap < 256; bitmap += 7) {
      for (let dcMap = 0; dcMap < 8; dcMap++) {
        const onSet = new Set<number>();
        const dontCares = new Set<number>();
        for (let m = 0; m < 8; m++) {
          if (bitmap & (1 << m)) onSet.add(m);
          else if (dcMap & (1 << m)) dontCares.add(m);
        }
        if (onSet.size === 0) continue;

        const cover = minimalCover(onSet, dontCares, 3);
        expect(isValidCover(cover, onSet, dontCares, 3)).toBe(true);
        expect(compareCost(coverCost(cover, 3), bruteForceCost(onSet, dontCares, 3))).toBe(0);
      }
    }
  });

  it('è minima su un campione a 4 variabili', () => {
    // Funzioni pseudo-casuali deterministiche, indifferenze comprese.
    let state = 12345;
    const nextBit = (): number => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return (state >> 16) & 1;
    };

    for (let trial = 0; trial < 60; trial++) {
      const onSet = new Set<number>();
      const dontCares = new Set<number>();
      for (let m = 0; m < 16; m++) {
        if (nextBit()) onSet.add(m);
        else if (nextBit() && nextBit()) dontCares.add(m);
      }
      if (onSet.size === 0 || onSet.size === 16) continue;

      const cover = minimalCover(onSet, dontCares, 4);
      expect(isValidCover(cover, onSet, dontCares, 4), `tentativo ${trial}`).toBe(true);
      expect(
        compareCost(coverCost(cover, 4), bruteForceCost(onSet, dontCares, 4)),
        `tentativo ${trial}: copertura non minima`,
      ).toBe(0);
    }
  });
});
