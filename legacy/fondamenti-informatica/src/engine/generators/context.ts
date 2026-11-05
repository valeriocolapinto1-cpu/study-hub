import { shuffle, type Rng } from '../rng';

/** Contesto passato a ogni generatore. */
export interface GenCtx {
  rng: Rng;
  /** Punti assegnati dal blueprint a questo slot: la somma la decide l'esame. */
  points: number;
  /** Voci di banca già pescate in questa prova, per non ripeterle. */
  used: Set<string>;
  /** Progressivo del quesito, usato per l'id. */
  seq: number;
}

export function questionId(ctx: GenCtx): string {
  return `q${ctx.seq}`;
}

export interface Choices {
  options: string[];
  correct: number;
}

/**
 * Costruisce le alternative di una crocetta.
 *
 * Esiste per chiudere due bug del prototipo: `genMaxRange` poteva produrre
 * solo 3 opzioni (un `Set` collassava i valori coincidenti) e
 * `genAsmSnippet` poteva generare un distrattore identico alla risposta
 * esatta, marcato però come sbagliato.
 *
 * I distrattori vengono deduplicati e ripuliti da quelli uguali alla
 * risposta esatta; se non ne restano abbastanza è un errore del generatore e
 * si solleva un'eccezione, così i test lo intercettano invece di produrre in
 * silenzio un quesito difettoso.
 */
export function makeChoices(
  rng: Rng,
  correct: string,
  distractors: readonly string[],
  count = 4,
): Choices {
  const pool: string[] = [];
  for (const text of distractors) {
    if (text !== correct && !pool.includes(text)) pool.push(text);
  }

  if (pool.length < count - 1) {
    throw new Error(
      `distrattori insufficienti: ${pool.length} distinti, ne servono ${count - 1} ` +
        `(risposta esatta: "${correct}")`,
    );
  }

  const options = shuffle(rng, [correct, ...pool.slice(0, count - 1)]);
  return { options, correct: options.indexOf(correct) };
}

/**
 * Alternative per una risposta numerica.
 *
 * `extras` sono i distrattori «buoni», quelli che corrispondono a un errore
 * plausibile (aver dimenticato uno shift, aver preso il ramo sbagliato). Se
 * dopo la deduplica non bastano — succede: con `start=2, step=2` il ciclo
 * produce due soli valori distinti — si completa con valori vicini alla
 * risposta. Così la generazione non può fallire per un caso di bordo, ma i
 * distrattori significativi restano i primi della lista.
 */
export function numericChoices(
  rng: Rng,
  answer: number,
  extras: readonly number[],
  count = 4,
): Choices {
  const seen = new Set<number>([answer]);
  const pool: number[] = [];

  for (const value of extras) {
    if (seen.has(value)) continue;
    seen.add(value);
    pool.push(value);
  }

  for (let delta = 1; pool.length < count - 1; delta++) {
    for (const candidate of [answer + delta, answer - delta]) {
      if (pool.length >= count - 1) break;
      if (seen.has(candidate)) continue;
      seen.add(candidate);
      pool.push(candidate);
    }
  }

  return makeChoices(rng, String(answer), pool.map(String), count);
}
