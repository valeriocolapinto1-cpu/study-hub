import { toHex } from '../numeric';
import { pick, randInt } from '../rng';
import type { FillQuestion, McQuestion } from '../types';
import { numericChoices, questionId, type GenCtx } from './context';

const log2 = (n: number): number => Math.round(Math.log2(n));

// ─────────────────────── memoria virtuale ───────────────────────

/** Traduzione indirizzo virtuale → fisico, con la mappa pagina→frame data. */
function physicalAddressVariant(ctx: GenCtx): FillQuestion {
  const offsetBits = pick(ctx.rng, [8, 10, 12] as const);
  const pageSize = 2 ** offsetBits;

  const page = randInt(ctx.rng, 1, 15);
  const frame = randInt(ctx.rng, 16, 63);
  const offset = randInt(ctx.rng, 1, pageSize - 1);

  const virtual = page * pageSize + offset;
  const physical = frame * pageSize + offset;

  return {
    id: questionId(ctx),
    kind: 'fill',
    cat: 'Memoria virtuale · traduzione',
    points: ctx.points,
    q:
      `Con pagine da <b>${pageSize} byte</b>, l'indirizzo virtuale ` +
      `<code>0x${toHex(virtual)}</code> cade nella pagina <b>${page}</b>, mappata sul frame ` +
      `<b>${frame}</b>. Qual è l'indirizzo fisico, in esadecimale?`,
    topic: 'vm',
    answer: toHex(physical),
    normalize: 'hex',
    placeholder: 'es. 1F40',
    hint:
      `L'offset non viene tradotto: 0x${toHex(virtual)} mod ${pageSize} = ${offset}. ` +
      `Si sostituisce solo il numero di pagina con quello di frame: ` +
      `${frame} · ${pageSize} + ${offset} = ${physical} = 0x${toHex(physical)}.`,
  };
}

/** Quanti bit di offset servono per una data dimensione di pagina. */
function offsetBitsVariant(ctx: GenCtx): FillQuestion {
  const kib = pick(ctx.rng, [1, 2, 4, 8, 16] as const);
  const bits = log2(kib * 1024);

  return {
    id: questionId(ctx),
    kind: 'fill',
    cat: 'Memoria virtuale · indirizzi',
    points: ctx.points,
    q: `Con pagine da <b>${kib} KiB</b>, quanti bit dell'indirizzo virtuale formano l'<b>offset</b>?`,
    topic: 'vm',
    answer: String(bits),
    normalize: 'dec',
    placeholder: 'numero di bit',
    hint: `${kib} KiB = ${kib * 1024} byte = 2^${bits}, quindi servono ${bits} bit per indirizzare un byte dentro la pagina.`,
  };
}

export function genPageTranslate(ctx: GenCtx): FillQuestion {
  return pick(ctx.rng, [physicalAddressVariant, offsetBitsVariant])(ctx);
}

// ─────────────────────── campi dell'indirizzo di cache ───────────────────────

/**
 * Scomposizione di un indirizzo in tag / indice / offset.
 *
 * I parametri sono scelti fra potenze di 2 in modo che il numero di insiemi sia
 * a sua volta una potenza di 2: così i tre campi sono interi e la somma torna
 * sempre all'ampiezza dell'indirizzo (verificato da un test).
 */
export function genCacheFields(ctx: GenCtx): McQuestion {
  const addressBits = pick(ctx.rng, [16, 32] as const);
  const blockBytes = pick(ctx.rng, [8, 16, 32, 64] as const);
  const ways = pick(ctx.rng, [1, 2, 4, 8] as const);
  const sets = pick(ctx.rng, [32, 64, 128, 256] as const);

  const offsetBits = log2(blockBytes);
  const indexBits = log2(sets);
  const tagBits = addressBits - indexBits - offsetBits;

  const totalBytes = sets * ways * blockBytes;
  const layout =
    ways === 1
      ? `a <b>mappatura diretta</b> con ${sets} linee`
      : `<b>set-associativa a ${ways} vie</b> con ${sets} insiemi`;

  const field = pick(ctx.rng, [
    { name: 'tag', value: tagBits },
    { name: 'indice', value: indexBits },
    { name: 'offset nel blocco', value: offsetBits },
  ] as const);

  const { options, correct } = numericChoices(ctx.rng, field.value, [
    tagBits,
    indexBits,
    offsetBits,
    addressBits - offsetBits,
    field.value + 1,
    field.value - 1,
  ]);

  return {
    id: questionId(ctx),
    kind: 'mc',
    cat: 'Cache · campi indirizzo',
    points: ctx.points,
    q:
      `Una cache ${layout}, con blocchi da <b>${blockBytes} byte</b> ` +
      `(${totalBytes / 1024 >= 1 ? `${totalBytes / 1024} KiB` : `${totalBytes} byte`} in totale), ` +
      `su indirizzi da <b>${addressBits} bit</b>. Quanti bit occupa il campo <b>${field.name}</b>?`,
    topic: 'mem',
    options,
    correct,
    hint:
      `offset = log₂(${blockBytes}) = ${offsetBits}; indice = log₂(${sets}) = ${indexBits}; ` +
      `tag = ${addressBits} − ${indexBits} − ${offsetBits} = ${tagBits}. ` +
      'I tre campi sommati fanno sempre l’ampiezza dell’indirizzo.',
  };
}
