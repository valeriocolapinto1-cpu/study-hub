import { cp2Valid, rangeFor, toBin, toHex } from '../numeric';
import { pick, randInt } from '../rng';
import type { FillQuestion, McQuestion } from '../types';
import { makeChoices, numericChoices, questionId, type GenCtx } from './context';

const WIDTHS = [4, 8] as const;

/** «Scrivi N in complemento a 2 su B bit» — auto-corretto. */
export function genCP2(ctx: GenCtx): FillQuestion {
  const bits = pick(ctx.rng, WIDTHS);
  const { min, max } = rangeFor(bits, true);
  const n = randInt(ctx.rng, min, max);

  return {
    id: questionId(ctx),
    kind: 'fill',
    cat: 'Completamento',
    points: ctx.points,
    q: `Scrivi <b>${n}</b> in complemento a 2 su <b>${bits} bit</b>.`,
    topic: 'bin',
    answer: toBin(n, bits),
    normalize: 'bin',
    placeholder: `${bits} bit`,
    hint:
      n >= 0
        ? `${n} è positivo: scrivilo in binario e riempi di zeri a sinistra fino a ${bits} bit.`
        : `Scrivi ${Math.abs(n)} in binario su ${bits} bit, inverti tutti i bit e somma 1.`,
  };
}

/** Somma o sottrazione in CP2, con la domanda sull'overflow. */
export function genArith(ctx: GenCtx): McQuestion {
  const bits = pick(ctx.rng, WIDTHS);
  const { min, max } = rangeFor(bits, true);
  const a = randInt(ctx.rng, min, max);
  const b = randInt(ctx.rng, min, max);
  const op = pick(ctx.rng, ['+', '−'] as const);

  // Risultato matematico: è quello che l'esame confronta con l'intervallo.
  const exact = op === '+' ? a + b : a - b;
  const overflow = !cp2Valid(exact, bits);

  const noOverflow = (value: number): string => `Risultato ${value}, nessun overflow`;
  const overflowText = `Overflow: il risultato esce dall'intervallo [${min}, ${max}]`;

  const { options, correct } = makeChoices(
    ctx.rng,
    overflow ? overflowText : noOverflow(exact),
    [
      overflow ? noOverflow(exact) : overflowText,
      noOverflow(exact + 1),
      noOverflow(exact - 1),
      'Errore di parità',
    ],
  );

  return {
    id: questionId(ctx),
    kind: 'mc',
    cat: 'Aritmetica CP2',
    points: ctx.points,
    q:
      `In CP2 a ${bits} bit calcoli <code>${toBin(a, bits)}</code> ${op} ` +
      `<code>${toBin(b, bits)}</code> (${a} ${op} ${b}). Cosa accade?`,
    topic: 'bin',
    options,
    correct,
    hint: `In ${bits} bit l'intervallo rappresentabile è [${min}, ${max}].`,
  };
}

/** Conversione decimale → esadecimale. */
export function genHex(ctx: GenCtx): FillQuestion {
  const n = randInt(ctx.rng, 16, 255);
  return {
    id: questionId(ctx),
    kind: 'fill',
    cat: 'Conversione',
    points: ctx.points,
    q: `Converti <b>${n}</b> (decimale) in <b>esadecimale</b>.`,
    topic: 'bin',
    answer: toHex(n),
    normalize: 'hex',
    placeholder: 'es. 1F',
    hint: `${n} = ${Math.floor(n / 16)}·16 + ${n % 16}`,
  };
}

/** Massimo/minimo rappresentabile, senza segno o in CP2. */
export function genMaxRange(ctx: GenCtx): McQuestion {
  const bits = pick(ctx.rng, WIDTHS);
  const unsigned = rangeFor(bits, false);
  const signed = rangeFor(bits, true);

  const variants = [
    {
      q: `Qual è il massimo intero rappresentabile con ${bits} bit senza segno?`,
      value: unsigned.max,
    },
    {
      q: `Qual è il massimo intero positivo in CP2 con ${bits} bit?`,
      value: signed.max,
    },
    {
      q: `Qual è il minimo (più negativo) rappresentabile in CP2 con ${bits} bit?`,
      value: signed.min,
    },
  ] as const;

  const variant = pick(ctx.rng, variants);
  const value = variant.value;

  // I distrattori sono i confini «vicini», quelli che si sbagliano davvero:
  // l'altro estremo, il range dell'altra rappresentazione, il fuori-di-uno.
  const { options, correct } = numericChoices(ctx.rng, value, [
    unsigned.max,
    signed.max,
    signed.min,
    2 ** (bits - 1),
    value + 1,
    value - 1,
    -value,
  ]);

  return {
    id: questionId(ctx),
    kind: 'mc',
    cat: 'Range',
    points: ctx.points,
    q: variant.q,
    topic: 'bin',
    options,
    correct,
    hint: `Con ${bits} bit: senza segno [${unsigned.min}, ${unsigned.max}], CP2 [${signed.min}, ${signed.max}].`,
  };
}
