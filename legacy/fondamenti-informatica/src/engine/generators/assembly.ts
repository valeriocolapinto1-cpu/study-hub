import {
  loopListing,
  mulCmpListing,
  shiftListing,
  simLoop,
  simMulCmp,
  simShift,
} from '../asmSim';
import { pick, randInt, type Rng } from '../rng';
import type { AsmLine, McQuestion } from '../types';
import { numericChoices, questionId, type GenCtx } from './context';

interface Snippet {
  /** Domanda specifica del template, es. «quale valore contiene R2?». */
  question: string;
  lines: AsmLine[];
  answer: number;
  /** Valori plausibili ma sbagliati; `makeChoices` deduplica. */
  distractors: number[];
  hint: string;
}

/** (a) Ciclo con contatore: quante iterazioni? */
function loopSnippet(rng: Rng): Snippet {
  const start = randInt(rng, 2, 12);
  const step = randInt(rng, 1, 3);
  const { iterations, finalR1 } = simLoop({ start, step });

  return {
    question: 'Quale valore contiene <code>R2</code> al termine di questo programma?',
    lines: loopListing({ start, step }),
    answer: iterations,
    distractors: [iterations + 1, iterations - 1, start, step, start - step, finalR1],
    hint:
      `Il salto è in coda, quindi il corpo gira almeno una volta: R1 parte da ${start} e ` +
      `scende di ${step} per volta finché non arriva a ${finalR1}, cioè ${iterations} giri.`,
  };
}

/** (b) MUL/CMP/BEQ in stile ARM: quale valore ha R3? */
function mulCmpSnippet(rng: Rng): Snippet {
  const a = randInt(rng, 2, 9);
  const b = randInt(rng, 2, 9);
  const add = randInt(rng, 1, 9);
  // Metà delle volte il confronto va a segno: così il salto conta davvero.
  const cmp = rng() < 0.5 ? a * b : a * b + randInt(rng, 1, 5);
  const { r3, branchTaken } = simMulCmp({ a, b, cmp, add });

  return {
    question: 'Quale valore contiene <code>R3</code> al termine di questo programma?',
    lines: mulCmpListing({ a, b, cmp, add }),
    answer: r3,
    distractors: [a * b, a * b + add, a + b, r3 + add, r3 - add, cmp],
    hint: branchTaken
      ? `R3 = ${a}·${b} = ${a * b}, uguale al valore confrontato: BEQ salta e l'ADD non viene eseguita.`
      : `R3 = ${a}·${b} = ${a * b} ≠ ${cmp}: BEQ non salta, quindi si somma ${add}.`,
  };
}

/** (c) Shift logici: quale valore resta in R1? */
function shiftSnippet(rng: Rng): Snippet {
  const value = randInt(rng, 3, 40);
  const left = randInt(rng, 1, 3);
  const right = randInt(rng, 1, 3);
  const { afterLeft, result } = simShift({ value, left, right });

  return {
    question: 'Quale valore contiene <code>R1</code> al termine di questo programma?',
    lines: shiftListing({ value, left, right }),
    answer: result,
    distractors: [afterLeft, value, result + 1, result - 1, value * 2 ** right, result * 2],
    hint:
      `Uno shift a sinistra di ${left} moltiplica per ${2 ** left}, uno a destra di ${right} ` +
      `divide (intero) per ${2 ** right}: ${value} → ${afterLeft} → ${result}.`,
  };
}

const TEMPLATES = [loopSnippet, mulCmpSnippet, shiftSnippet] as const;

/**
 * Snippet assembly da interpretare. Il prototipo aveva solo il template a
 * ciclo; qui ci sono i tre richiesti, e la risposta esatta non è mai scritta
 * a mano ma prodotta dal simulatore in `asmSim.ts`, che riceve gli stessi
 * parametri con cui è costruito il listato mostrato.
 */
export function genAsmSnippet(ctx: GenCtx): McQuestion {
  const snippet = pick(ctx.rng, TEMPLATES)(ctx.rng);

  const { options, correct } = numericChoices(ctx.rng, snippet.answer, snippet.distractors);

  return {
    id: questionId(ctx),
    kind: 'mc',
    cat: 'Assembly · snippet',
    points: ctx.points,
    q: snippet.question,
    topic: 'isa',
    payload: { type: 'asm', lines: snippet.lines },
    options,
    correct,
    hint: snippet.hint,
  };
}
