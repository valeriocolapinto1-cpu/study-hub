import {
  BIAS,
  decodeIeee754,
  fieldsToGroupedBits,
  fmtDecimal,
  realExponent,
  type Ieee754Fields,
} from '../ieee754';
import { pick, randInt, type Rng } from '../rng';
import { toBin } from '../numeric';
import { makeChoices, questionId, type GenCtx } from './context';
import type { FillQuestion, McQuestion } from '../types';

/**
 * Estrae un valore **esattamente rappresentabile**.
 *
 * Si scelgono prima i campi e solo dopo si ricava il numero: così il valore
 * mostrato nel quesito è per costruzione un razionale diadico che entra nei 23
 * bit di mantissa, e nessun arrotondamento può falsare la risposta attesa.
 * La mantissa usa i 4 bit più significativi, il che tiene i decimali leggibili
 * (6,5 · 0,40625 · 13) invece di code interminabili.
 */
function sampleFields(rng: Rng): Ieee754Fields {
  return {
    sign: pick(rng, [0, 1] as const),
    exponent: randInt(rng, -4, 6) + BIAS,
    mantissa: randInt(rng, 0, 15) << 19,
  };
}

/** Codifica: si chiede il campo esponente, quello dove si sbaglia il bias. */
function encodeVariant(ctx: GenCtx): FillQuestion {
  const fields = sampleFields(ctx.rng);
  const value = decodeIeee754(fields);
  const real = realExponent(fields);

  return {
    id: questionId(ctx),
    kind: 'fill',
    cat: 'IEEE 754 · codifica',
    points: ctx.points,
    q:
      `Codifica <b>${fmtDecimal(value)}</b> in IEEE 754 singola precisione. ` +
      'Qual è il campo <b>esponente</b> (8 bit)?',
    topic: 'ieee',
    answer: toBin(fields.exponent, 8),
    normalize: 'bin',
    placeholder: '8 bit',
    hint:
      `Normalizzando si ottiene 1,… × 2<sup>${real}</sup>, quindi l'esponente reale è ${real}. ` +
      `Polarizzando: ${real} + ${BIAS} = ${fields.exponent} = ${toBin(fields.exponent, 8)}.`,
  };
}

/** Decodifica: dati i campi, quale numero rappresentano. */
function decodeVariant(ctx: GenCtx): McQuestion {
  const fields = sampleFields(ctx.rng);
  const value = decodeIeee754(fields);
  const real = realExponent(fields);

  // Distrattori: gli errori che si fanno davvero. Il più insidioso è aver
  // dimenticato il bit implicito, cioè aver letto 0,M invece di 1,M — resta un
  // razionale diadico, quindi anche questo valore è esatto.
  const sign = fields.sign === 1 ? -1 : 1;
  const withoutImplicitBit = sign * (fields.mantissa / 2 ** 23) * 2 ** real;

  const { options, correct } = makeChoices(ctx.rng, fmtDecimal(value), [
    fmtDecimal(withoutImplicitBit),
    fmtDecimal(-value),
    fmtDecimal(value * 2),
    fmtDecimal(value / 2),
  ]);

  return {
    id: questionId(ctx),
    kind: 'mc',
    cat: 'IEEE 754 · decodifica',
    points: ctx.points,
    q:
      'Un numero in IEEE 754 singola precisione ha questa configurazione di bit. Quale valore rappresenta?' +
      `<br><span class="mono">${fieldsToGroupedBits(fields)}</span>`,
    topic: 'ieee',
    options,
    correct,
    hint:
      `Esponente polarizzato ${fields.exponent}, quindi reale ${fields.exponent} − ${BIAS} = ${real}. ` +
      `Rimettendo il bit implicito «1.» davanti alla mantissa e spostando la virgola si ottiene ${fmtDecimal(value)}.`,
  };
}

/** Codifica o decodifica di un float a 32 bit. */
export function genIeee754(ctx: GenCtx): FillQuestion | McQuestion {
  return pick(ctx.rng, [encodeVariant, decodeVariant])(ctx);
}

/** Esposta per i test, che verificano il round-trip sui campi campionati. */
export { sampleFields as sampleIeeeFields };
