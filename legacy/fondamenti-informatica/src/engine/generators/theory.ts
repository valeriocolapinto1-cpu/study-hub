import { asmWrite, mcq, open } from '~/content';
import { pick, pickUnused, shuffle } from '../rng';
import type { McQuestion, SelfQuestion } from '../types';
import { makeChoices, questionId, type GenCtx } from './context';

/** Crocetta pescata dalla banca, con le alternative rimescolate. */
export function genMC(ctx: GenCtx): McQuestion {
  const item = pickUnused(ctx.rng, mcq, ctx.used);

  // Si rimescolano gli indici, così l'indice della risposta esatta segue le
  // opzioni invece di essere ricalcolato per confronto di testo.
  const order = shuffle(
    ctx.rng,
    item.options.map((_, index) => index),
  );

  return {
    id: questionId(ctx),
    kind: 'mc',
    cat: 'Crocetta',
    points: ctx.points,
    q: item.q,
    topic: item.topic,
    bankId: item.id,
    options: order.map((index) => item.options[index] as string),
    correct: order.indexOf(item.correct),
  };
}

const mono = (s: string): string => `<code>${s}</code>`;

/**
 * Notazione RTN di un'istruzione.
 *
 * I distrattori non sono casuali: sono i tre errori tipici raccolti negli
 * convenzioni (`trap-rtn`) — parentesi quadre dimenticate sulle sorgenti,
 * parentesi messe erroneamente sulla destinazione, destinazione scambiata.
 * Le parentesi significano «contenuto di», quindi vanno solo dove si legge.
 */
export function genRtn(ctx: GenCtx): McQuestion {
  const cases = [
    {
      instr: 'Add R1, R2, R3',
      right: 'R1 ← [R2] + [R3]',
      wrong: ['R1 ← R2 + R3', '[R1] ← [R2] + [R3]', 'R3 ← [R1] + [R2]'],
      note: 'La destinazione è R1 e si scrive senza parentesi: non si legge, si scrive.',
    },
    {
      instr: 'Load R1, LOC',
      right: 'R1 ← [LOC]',
      wrong: ['[R1] ← LOC', 'LOC ← [R1]', 'R1 ← LOC'],
      note: 'Si legge il contenuto di LOC e lo si porta in R1.',
    },
    {
      instr: 'Store R1, LOC',
      right: 'LOC ← [R1]',
      wrong: ['R1 ← [LOC]', '[LOC] ← [R1]', 'LOC ← R1'],
      note: 'Store scrive in memoria: la destinazione è LOC, la sorgente è il contenuto di R1.',
    },
    {
      instr: 'Aumenta di [LOC] il valore in R1',
      right: 'R1 ← [LOC] + [R1]',
      wrong: ['R1 ← LOC + R1', '[R1] ← [LOC] + [R1]', 'LOC ← [LOC] + [R1]'],
      note: 'Entrambe le sorgenti si leggono, quindi entrambe hanno le parentesi.',
    },
  ] as const;

  const item = pick(ctx.rng, cases);
  const { options, correct } = makeChoices(
    ctx.rng,
    mono(item.right),
    item.wrong.map(mono),
  );

  return {
    id: questionId(ctx),
    kind: 'mc',
    cat: 'RTN · notazione',
    points: ctx.points,
    q: `Come si scrive in RTN <code>${item.instr}</code>?`,
    topic: 'cpu',
    options,
    correct,
    hint: `Le parentesi quadre significano «contenuto di». ${item.note}`,
  };
}

/** Domanda aperta di teoria, con risposta modello. */
export function genOpen(ctx: GenCtx): SelfQuestion {
  const item = pickUnused(ctx.rng, open, ctx.used);
  return {
    id: questionId(ctx),
    kind: 'self',
    cat: 'Domanda aperta',
    points: ctx.points,
    q: item.q,
    topic: item.topic,
    bankId: item.id,
    model: item.model,
  };
}

/** Esercizio «scrivi un programma», da svolgere su carta. */
export function genAsmWrite(ctx: GenCtx): SelfQuestion {
  const item = pickUnused(ctx.rng, asmWrite, ctx.used);
  return {
    id: questionId(ctx),
    kind: 'self',
    cat: 'Assembly · scrittura',
    points: ctx.points,
    q: item.q,
    topic: 'isa',
    bankId: item.id,
    model: item.model,
  };
}
