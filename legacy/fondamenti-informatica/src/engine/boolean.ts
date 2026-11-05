/**
 * Algebra booleana: implicanti, copertura, SOP minima.
 *
 * Il quesito di Karnaugh non «mostra una SOP e spera che sia minima»: la
 * calcola con un minimizzatore esatto. Lo spazio è piccolo (≤ 4 variabili =
 * 16 celle, 3⁴ = 81 cubi possibili), quindi la forza bruta è esatta e
 * istantanea — e non ha i casi limite di una minimizzazione a occhio.
 *
 * `minimalCover()` è anche il punto d'innesto per un Quine-McCluskey
 * generico (§14): stessa firma, implementazione diversa.
 */

/**
 * Cubo dello spazio booleano.
 *
 * Le variabili sono indicizzate da 0 (più significativa) a n-1. Il mintermine
 * `m` codifica la variabile i nel bit `n-1-i`, quindi per n=3 vale
 * m = 4·A + 2·B + C.
 */
export interface Implicant {
  /** Bit a 1 = variabile fissata. */
  mask: number;
  /** Valore delle variabili fissate (i bit fuori da `mask` sono ignorati). */
  bits: number;
}

export function coversMinterm(imp: Implicant, m: number): boolean {
  return (m & imp.mask) === (imp.bits & imp.mask);
}

/** Tutti i mintermini coperti dal cubo. */
export function mintermsOf(imp: Implicant, vars: number): number[] {
  const out: number[] = [];
  for (let m = 0; m < 1 << vars; m++) if (coversMinterm(imp, m)) out.push(m);
  return out;
}

/** Numero di letterali del termine, cioè di variabili fissate. */
export function literalCount(imp: Implicant, vars: number): number {
  let count = 0;
  for (let i = 0; i < vars; i++) if (imp.mask & (1 << i)) count++;
  return count;
}

/** Nomi delle variabili: 3 → A, B, C. */
export function varNames(vars: number): string[] {
  return Array.from({ length: vars }, (_, i) => String.fromCharCode(65 + i));
}

/** Un solo termine prodotto, es. "A·B̄". Il termine vuoto vale 1. */
export function termToString(imp: Implicant, vars: number): string {
  const names = varNames(vars);
  const parts: string[] = [];
  for (let i = 0; i < vars; i++) {
    const bit = 1 << (vars - 1 - i);
    if (!(imp.mask & bit)) continue;
    const name = names[i] as string;
    parts.push(imp.bits & bit ? name : `<span class="ovl">${name}</span>`);
  }
  return parts.length ? parts.join('·') : '1';
}

/** Somma di prodotti, es. "A·B̄ + C". La copertura vuota vale 0. */
export function sopToString(cover: readonly Implicant[], vars: number): string {
  if (cover.length === 0) return '0';
  return cover.map((imp) => termToString(imp, vars)).join(' + ');
}

/** Tutti i 3ⁿ cubi dello spazio a `vars` variabili. */
export function allCubes(vars: number): Implicant[] {
  const cubes: Implicant[] = [];
  const full = (1 << vars) - 1;
  for (let mask = 0; mask <= full; mask++) {
    // Enumera i valori delle sole posizioni fissate da `mask`.
    for (let bits = 0; bits <= full; bits++) {
      if ((bits & ~mask & full) !== 0) continue; // normalizza: fuori mask sta a 0
      cubes.push({ mask, bits });
    }
  }
  return cubes;
}

/** Il cubo è un implicante, cioè copre solo celle a 1 o indifferenti? */
export function isImplicant(imp: Implicant, allowed: ReadonlySet<number>, vars: number): boolean {
  return mintermsOf(imp, vars).every((m) => allowed.has(m));
}

/**
 * `outer` contiene `inner`? Un cubo ne contiene un altro quando fissa un
 * sottoinsieme delle sue variabili con gli stessi valori: meno vincoli,
 * più celle coperte.
 */
export function contains(outer: Implicant, inner: Implicant): boolean {
  const fixesSubset = (outer.mask & inner.mask) === outer.mask;
  const agrees = (outer.bits & outer.mask) === (inner.bits & outer.mask);
  return fixesSubset && agrees;
}

/**
 * Implicanti primi: implicanti non contenuti strettamente in un altro
 * implicante. `dontCares` può essere coperto ma non deve esserlo, quindi si
 * tengono solo i cubi che coprono almeno una cella a 1.
 */
export function primeImplicants(
  onSet: ReadonlySet<number>,
  dontCares: ReadonlySet<number>,
  vars: number,
): Implicant[] {
  const allowed = new Set([...onSet, ...dontCares]);
  const implicants = allCubes(vars).filter(
    (imp) => isImplicant(imp, allowed, vars) && mintermsOf(imp, vars).some((m) => onSet.has(m)),
  );

  return implicants.filter(
    (imp) =>
      !implicants.some((other) => other.mask !== imp.mask && contains(other, imp)),
  );
}

export interface CoverCost {
  /** Numero di termini della somma. */
  terms: number;
  /** Letterali totali. */
  literals: number;
}

export function coverCost(cover: readonly Implicant[], vars: number): CoverCost {
  return {
    terms: cover.length,
    literals: cover.reduce((sum, imp) => sum + literalCount(imp, vars), 0),
  };
}

/** Ordinamento dell'esame: prima meno termini, a parità meno letterali. */
export function compareCost(a: CoverCost, b: CoverCost): number {
  return a.terms !== b.terms ? a.terms - b.terms : a.literals - b.literals;
}

/**
 * SOP minima esatta: enumera gli implicanti primi e cerca la copertura di
 * costo minimo. Con ≤ 4 variabili gli implicanti primi sono pochi, quindi
 * l'enumerazione dei sottoinsiemi è immediata.
 *
 * Ritorna una delle coperture ottime (possono essercene più d'una equivalente).
 */
export function minimalCover(
  onSet: ReadonlySet<number>,
  dontCares: ReadonlySet<number>,
  vars: number,
): Implicant[] {
  if (onSet.size === 0) return [];

  const primes = primeImplicants(onSet, dontCares, vars);
  const targets = [...onSet];

  // Bitmask di copertura di ogni primo sui soli mintermini da coprire.
  const coverage = primes.map((imp) =>
    targets.reduce((acc, m, i) => (coversMinterm(imp, m) ? acc | (1 << i) : acc), 0),
  );
  const goal = (1 << targets.length) - 1;

  let best: Implicant[] | null = null;
  let bestCost: CoverCost | null = null;

  // Ricerca in profondità sul primo mintermine ancora scoperto: si prova solo
  // chi lo copre, il che pota drasticamente lo spazio rispetto a 2^primes.
  const search = (covered: number, chosen: Implicant[]): void => {
    if (bestCost && compareCost(coverCost(chosen, vars), bestCost) >= 0) return;

    if (covered === goal) {
      const cost = coverCost(chosen, vars);
      if (!bestCost || compareCost(cost, bestCost) < 0) {
        best = [...chosen];
        bestCost = cost;
      }
      return;
    }

    const firstUncovered = targets.findIndex((_, i) => (covered & (1 << i)) === 0);
    const needed = 1 << firstUncovered;

    for (const [index, bitsCovered] of coverage.entries()) {
      if ((bitsCovered & needed) === 0) continue;
      const imp = primes[index] as Implicant;
      chosen.push(imp);
      search(covered | bitsCovered, chosen);
      chosen.pop();
    }
  };

  search(0, []);
  return best ?? [];
}
