import { pick, randInt } from '../rng';
import type { FillQuestion } from '../types';
import { questionId, type GenCtx } from './context';

/**
 * Cicli di una pipeline ideale.
 *
 * Con k stadi e n istruzioni, senza stalli, il primo risultato esce dopo k
 * cicli e poi ne esce uno per ciclo: <code>k + (n − 1)</code>. Il non-pipelined
 * costa <code>k · n</code>.
 */
function cyclesVariant(ctx: GenCtx): FillQuestion {
  const stages = randInt(ctx.rng, 4, 6);
  const instructions = randInt(ctx.rng, 6, 24);
  const cycles = stages + instructions - 1;

  return {
    id: questionId(ctx),
    kind: 'fill',
    cat: 'Pipeline · cicli',
    points: ctx.points,
    q:
      `Una pipeline a <b>${stages} stadi</b> esegue <b>${instructions} istruzioni</b> ` +
      'senza stalli né salti. Quanti cicli di clock servono in tutto?',
    topic: 'pipe',
    answer: String(cycles),
    normalize: 'dec',
    placeholder: 'numero di cicli',
    hint:
      `La prima istruzione esce dopo ${stages} cicli (riempimento), poi ne esce una per ciclo: ` +
      `${stages} + (${instructions} − 1) = ${cycles}.`,
  };
}

/** Quanti cicli si risparmiano rispetto all'esecuzione non sovrapposta. */
function savedVariant(ctx: GenCtx): FillQuestion {
  const stages = randInt(ctx.rng, 4, 6);
  const instructions = randInt(ctx.rng, 8, 20);
  const sequential = stages * instructions;
  const pipelined = stages + instructions - 1;

  return {
    id: questionId(ctx),
    kind: 'fill',
    cat: 'Pipeline · prestazioni',
    points: ctx.points,
    q:
      `Un processore a <b>${stages} stadi</b> esegue <b>${instructions} istruzioni</b>. ` +
      'Quanti cicli si risparmiano con la pipeline rispetto all’esecuzione una-alla-volta?',
    topic: 'pipe',
    answer: String(sequential - pipelined),
    normalize: 'dec',
    placeholder: 'cicli risparmiati',
    hint:
      `Senza pipeline: ${stages} · ${instructions} = ${sequential} cicli. ` +
      `Con pipeline: ${stages} + ${instructions} − 1 = ${pipelined}. ` +
      `Differenza: ${sequential - pipelined}.`,
  };
}

export function genPipelineCycles(ctx: GenCtx): FillQuestion {
  return pick(ctx.rng, [cyclesVariant, savedVariant])(ctx);
}
