/**
 * Generatore pseudo-casuale deterministico (mulberry32) per i generatori di
 * esercizi: stesso seed → stessa sequenza, su ogni piattaforma.
 */
export interface Rng {
  /** Reale in [0, 1). */
  next(): number;
  /** Intero in [min, max] (estremi inclusi). */
  int(min: number, max: number): number;
  /** Reale in [min, max). */
  float(min: number, max: number): number;
  /** Elemento a caso di un elenco non vuoto. */
  pick<T>(items: readonly T[]): T;
  /** Copia rimescolata (Fisher–Yates). */
  shuffle<T>(items: readonly T[]): T[];
  /** true con probabilità p. */
  chance(p: number): boolean;
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) throw new RangeError('int(min, max) non valido');
    return min + Math.floor(next() * (max - min + 1));
  };
  return {
    next,
    int,
    float: (min, max) => min + next() * (max - min),
    pick: (items) => {
      if (items.length === 0) throw new RangeError('pick su elenco vuoto');
      return items[int(0, items.length - 1)]!;
    },
    shuffle: (items) => {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(0, i);
        [out[i], out[j]] = [out[j]!, out[i]!];
      }
      return out;
    },
    chance: (p) => next() < p,
  };
}

/** Seed casuale a 32 bit (per una nuova istanza di esercizio). */
export function randomSeed(): number {
  try {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0]!;
  } catch {
    return Math.floor(Math.random() * 2 ** 32);
  }
}
