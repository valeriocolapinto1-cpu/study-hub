/**
 * Generatore pseudo-casuale deterministico (mulberry32) per i generatori di
 * esercizi e l'assemblaggio delle prove: stesso seed → stessa sequenza, su
 * ogni piattaforma. Una prova si salva, si rigioca e si stampa conservando
 * solo il seme.
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
  /** `k` elementi distinti (per posizione), in ordine casuale. */
  sample<T>(items: readonly T[], k: number): T[];
  /** Scelta pesata: `weights[i] ≥ 0` è il peso di `items[i]`. */
  weighted<T>(items: readonly T[], weights: readonly number[]): T;
  /** +1 oppure −1. */
  sign(): 1 | -1;
  /** Reale in [min, max) arrotondato a `digits` cifre significative (valori "da tema d'esame"). */
  nice(min: number, max: number, digits?: number): number;
  /** Valore della serie E12 tra 10^minExp e 10^maxExp (resistenze, condensatori…). */
  e12(minExp: number, maxExp: number): number;
}

/** Serie E12 dei valori normalizzati dei componenti. */
export const E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2] as const;

/** Hash FNV-1a a 32 bit: trasforma una stringa in un seme numerico stabile. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Combina più parti (es. seme della prova + indice della domanda) in un seme stabile. */
export function deriveSeed(...parts: Array<string | number>): number {
  return hashString(parts.map(String).join('␟'));
}

/** Arrotonda a `digits` cifre significative (0 e non finiti restano invariati). */
export function roundSig(value: number, digits: number): number {
  if (value === 0 || !Number.isFinite(value)) return value;
  return Number(value.toPrecision(Math.max(1, Math.floor(digits))));
}

export function createRng(seed: number | string): Rng {
  let a = (typeof seed === 'string' ? hashString(seed) : seed) >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min)
      throw new RangeError('int(min, max) non valido');
    return min + Math.floor(next() * (max - min + 1));
  };
  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) throw new RangeError('pick su elenco vuoto');
    return items[int(0, items.length - 1)]!;
  };
  const shuffle = <T>(items: readonly T[]): T[] => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(0, i);
      [out[i], out[j]] = [out[j]!, out[i]!];
    }
    return out;
  };
  const float = (min: number, max: number) => min + next() * (max - min);
  return {
    next,
    int,
    float,
    pick,
    shuffle,
    chance: (p) => next() < p,
    sample: (items, k) => shuffle(items).slice(0, Math.max(0, Math.min(k, items.length))),
    weighted: (items, weights) => {
      if (items.length === 0 || items.length !== weights.length)
        throw new RangeError('weighted: dimensioni non valide');
      const total = weights.reduce((s, w) => s + Math.max(0, w), 0);
      if (total <= 0) return pick(items);
      let r = next() * total;
      for (let i = 0; i < items.length; i++) {
        r -= Math.max(0, weights[i]!);
        if (r < 0) return items[i]!;
      }
      return items[items.length - 1]!;
    },
    sign: () => (next() < 0.5 ? -1 : 1),
    nice: (min, max, digits = 2) => roundSig(float(min, max), digits),
    e12: (minExp, maxExp) => roundSig(pick(E12) * 10 ** int(minExp, maxExp), 3),
  };
}

/** Seed casuale a 32 bit (per una nuova istanza di esercizio o di prova). */
export function randomSeed(): number {
  try {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0]!;
  } catch {
    return Math.floor(Math.random() * 2 ** 32);
  }
}
