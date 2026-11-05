/**
 * Generatore pseudo-casuale seedabile.
 *
 * Serve a rendere i generatori deterministici: con lo stesso seme esce la
 * stessa prova, quindi i test possono coprire migliaia di casi in modo
 * riproducibile e un esame può essere salvato e rigiocato (§14).
 */
export type Rng = () => number;

/** mulberry32: 32 bit di stato, veloce e con buona distribuzione. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

/** Intero in [min, max], estremi inclusi. */
export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick<T>(rng: Rng, xs: readonly T[]): T {
  const item = xs[Math.floor(rng() * xs.length)];
  if (item === undefined) throw new Error('pick() su un array vuoto');
  return item;
}

/**
 * Fisher-Yates. Il prototipo usava `sort(() => Math.random() - .5)`, che non
 * produce una permutazione uniforme: la posizione della risposta esatta
 * risultava sbilanciata.
 */
export function shuffle<T>(rng: Rng, xs: readonly T[]): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = out[i] as T;
    const b = out[j] as T;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

/**
 * Pesca una voce non ancora usata nella prova corrente, registrandola.
 * Se la banca è esaurita riparte da capo, così una prova lunga non si blocca.
 */
export function pickUnused<T extends { id: string }>(
  rng: Rng,
  bank: readonly T[],
  used: Set<string>,
): T {
  const free = bank.filter((item) => !used.has(item.id));
  const chosen = pick(rng, free.length > 0 ? free : bank);
  used.add(chosen.id);
  return chosen;
}
