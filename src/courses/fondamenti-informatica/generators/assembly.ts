/**
 * Generatori sull'assembly (dal sito originale: genAsmSnippet e la palestra
 * «assembly da eseguire a mente»). La risposta non è mai scritta a mano: la
 * calcola il simulatore di `lib/asmSim.ts` con gli stessi parametri da cui è
 * costruito il listato mostrato.
 */
import { registerGenerator } from '../../../engine/generators/registry';
import type { ExerciseFigure } from '../../../engine/generators/registry';
import { figLoop, figMulCmp, figShift } from './figure';
import { createRng, type Rng } from '../../../engine/random';
import {
  loopListing,
  mulCmpListing,
  shiftListing,
  simLoop,
  simMulCmp,
  simShift,
  type AsmLine,
} from '../lib/asmSim';
import { bitsAnswer, L, numericChoices, pre, yesNoAnswer, type Lang } from '../lib/common';
import { toBin } from '../lib/numeric';

const TOPIC = 'risc-cisc-assembly';

/** Listato come testo a colonne: etichetta, istruzione, commento. */
export function formatListing(lines: readonly AsmLine[]): string {
  return lines
    .map((l) => `${(l.label ?? '').padEnd(7)}${l.text}${l.comment ? `   ${l.comment}` : ''}`.trimEnd())
    .join('\n');
}

const exact = (label: string, value: number) => ({ label, value, tol: 1e-9 });

interface Snippet {
  question: string;
  listing: AsmLine[];
  answer: number;
  distractors: number[];
  explain: string;
  figure: ExerciseFigure;
}

function loopSnippet(r: Rng, lang: Lang): Snippet {
  const start = r.int(2, 12);
  const step = r.int(1, 3);
  const { iterations, finalR1 } = simLoop({ start, step });
  return {
    figure: figLoop(start, step),
    question: L(
      lang,
      'Quale valore contiene `R2` al termine di questo programma?',
      'What value does `R2` hold at the end of this program?',
    ),
    listing: loopListing({ start, step }),
    answer: iterations,
    distractors: [iterations + 1, iterations - 1, start, step, start - step, finalR1],
    explain: L(
      lang,
      `Il salto è in coda, quindi il corpo gira almeno una volta: R1 parte da ${start} e scende di ${step} per volta finché arriva a ${finalR1}, cioè ${iterations} giri.`,
      `The branch is at the end, so the body runs at least once: R1 starts at ${start} and drops by ${step} each time until it reaches ${finalR1}, i.e. ${iterations} iterations.`,
    ),
  };
}

function mulCmpSnippet(r: Rng, lang: Lang): Snippet {
  const a = r.int(2, 9);
  const b = r.int(2, 9);
  const add = r.int(1, 9);
  const cmp = r.chance(0.5) ? a * b : a * b + r.int(1, 5);
  const { r3, branchTaken } = simMulCmp({ a, b, cmp, add });
  return {
    figure: figMulCmp(a, b, cmp, add),
    question: L(
      lang,
      'Quale valore contiene `R3` al termine di questo programma?',
      'What value does `R3` hold at the end of this program?',
    ),
    listing: mulCmpListing({ a, b, cmp, add }),
    answer: r3,
    distractors: [a * b, a * b + add, a + b, r3 + add, r3 - add, cmp],
    explain: branchTaken
      ? L(
          lang,
          `R3 = ${a}·${b} = ${a * b}, uguale al valore confrontato: BEQ salta e la ADD non viene eseguita.`,
          `R3 = ${a}·${b} = ${a * b}, equal to the compared value: BEQ branches and the ADD is skipped.`,
        )
      : L(
          lang,
          `R3 = ${a}·${b} = ${a * b} ≠ ${cmp}: BEQ non salta, quindi si somma ${add}.`,
          `R3 = ${a}·${b} = ${a * b} ≠ ${cmp}: BEQ does not branch, so ${add} is added.`,
        ),
  };
}

function shiftSnippet(r: Rng, lang: Lang): Snippet {
  const value = r.int(3, 40);
  const left = r.int(1, 3);
  const right = r.int(1, 3);
  const { afterLeft, result } = simShift({ value, left, right });
  return {
    figure: figShift(value, left, right),
    question: L(
      lang,
      'Quale valore contiene `R1` al termine di questo programma?',
      'What value does `R1` hold at the end of this program?',
    ),
    listing: shiftListing({ value, left, right }, lang),
    answer: result,
    distractors: [afterLeft, value, result + 1, result - 1, value * 2 ** right, result * 2],
    explain: L(
      lang,
      `Uno shift a sinistra di ${left} moltiplica per ${2 ** left}, uno a destra di ${right} divide (intero) per ${2 ** right}: ${value} → ${afterLeft} → ${result}.`,
      `A left shift by ${left} multiplies by ${2 ** left}, a right shift by ${right} divides (integer) by ${2 ** right}: ${value} → ${afterLeft} → ${result}.`,
    ),
  };
}

export const snippet = registerGenerator({
  id: 'fondamenti-informatica/assembly-snippet',
  topic: TOPIC,
  objectives: ['risc-cisc-assembly.3'],
  generate(seed, lang) {
    const r = createRng(seed);
    const s = r.pick([loopSnippet, mulCmpSnippet, shiftSnippet])(r, lang);
    return {
      figure: s.figure,
      statement: `${s.question}\n\n${pre(formatListing(s.listing))}`,
      steps: [{ title: L(lang, 'Esecuzione', 'Execution'), body: s.explain }],
      answer: [],
      choices: numericChoices(r, s.answer, s.distractors),
    };
  },
});

export const ciclo = registerGenerator({
  id: 'fondamenti-informatica/assembly-ciclo',
  topic: TOPIC,
  objectives: ['risc-cisc-assembly.3'],
  generate(seed, lang) {
    const r = createRng(seed);
    const step = r.int(1, 3);
    const start = r.int(3, 12) * step + r.int(0, step - 1);
    const program = { start, step };
    const { iterations, finalR1 } = simLoop(program);
    return {
      figure: figLoop(start, step),
      statement:
        L(lang, 'Esegui a mente il ciclo con contatore.', 'Run the counter loop in your head.') +
        `\n\n${pre(formatListing(loopListing(program)))}`,
      steps: [
        {
          title: L(lang, 'Primo passaggio', 'First pass'),
          body: L(
            lang,
            `Si parte da ${start} e si sottrae ${step}: R1 = ${start - step}.`,
            `Start at ${start} and subtract ${step}: R1 = ${start - step}.`,
          ),
        },
        {
          title: L(lang, 'Quanti giri', 'How many iterations'),
          body: L(
            lang,
            `Il salto è in coda: il corpo gira almeno una volta, e si esce quando R1 non è più > 0 (conta anche il giro che porta R1 a zero o sotto). Giri: ${iterations}.`,
            `The branch is at the end: the body runs at least once, and the loop exits when R1 is no longer > 0 (the pass that takes R1 to zero or below counts too). Iterations: ${iterations}.`,
          ),
        },
        {
          title: L(lang, 'Valore d’uscita', 'Exit value'),
          body: L(
            lang,
            `R1 = ${start} − ${iterations}·${step} = ${finalR1}${finalR1 < 0 ? ': negativo, perché lo step non divide il valore iniziale' : ''}.`,
            `R1 = ${start} − ${iterations}·${step} = ${finalR1}${finalR1 < 0 ? ': negative, because the step does not divide the initial value' : ''}.`,
          ),
        },
      ],
      answer: [
        exact(L(lang, 'R1 dopo il primo passaggio', 'R1 after the first pass'), start - step),
        exact(L(lang, 'R2 finale (giri)', 'Final R2 (iterations)'), iterations),
        exact(L(lang, 'R1 all’uscita', 'R1 on exit'), finalR1),
      ],
    };
  },
});

export const mulCmp = registerGenerator({
  id: 'fondamenti-informatica/assembly-mul-cmp',
  topic: TOPIC,
  objectives: ['risc-cisc-assembly.3'],
  generate(seed, lang) {
    const r = createRng(seed);
    const a = r.int(2, 9);
    const b = r.int(2, 9);
    const cmp = r.chance(0.5) ? a * b : a * b + r.int(1, 4);
    const add = r.int(1, 9);
    const { r3, branchTaken } = simMulCmp({ a, b, cmp, add });
    return {
      figure: figMulCmp(a, b, cmp, add),
      statement:
        L(
          lang,
          'Prodotto, confronto e salto condizionato: esegui il programma.',
          'Product, comparison and conditional branch: run the program.',
        ) + `\n\n${pre(formatListing(mulCmpListing({ a, b, cmp, add })))}`,
      steps: [
        {
          title: 'MUL',
          body: L(
            lang,
            `La MUL scrive in R3 il prodotto: ${a} × ${b} = ${a * b}.`,
            `MUL writes the product into R3: ${a} × ${b} = ${a * b}.`,
          ),
        },
        {
          title: 'CMP / BEQ',
          body: L(
            lang,
            `BEQ salta quando il confronto dà uguaglianza (la sottrazione fa zero): ${a * b} ${branchTaken ? '=' : '≠'} ${cmp}, quindi il salto ${branchTaken ? 'è preso' : 'non è preso'}.`,
            `BEQ branches when the comparison gives equality (the subtraction is zero): ${a * b} ${branchTaken ? '=' : '≠'} ${cmp}, so the branch is ${branchTaken ? 'taken' : 'not taken'}.`,
          ),
        },
        {
          title: L(lang, 'Valore finale', 'Final value'),
          body: branchTaken
            ? L(
                lang,
                `Salto preso: la ADD è saltata, R3 = ${r3}.`,
                `Branch taken: the ADD is skipped, R3 = ${r3}.`,
              )
            : L(
                lang,
                `Salto non preso: si esegue ADD R3, R3, #${add}, R3 = ${r3}.`,
                `Branch not taken: ADD R3, R3, #${add} runs, R3 = ${r3}.`,
              ),
        },
      ],
      answer: [
        exact(L(lang, 'R3 dopo la MUL', 'R3 after MUL'), a * b),
        yesNoAnswer(L(lang, 'BEQ salta? (sì/no)', 'Is BEQ taken? (yes/no)'), branchTaken, lang),
        exact(L(lang, 'R3 finale', 'Final R3'), r3),
      ],
    };
  },
});

export const shift = registerGenerator({
  id: 'fondamenti-informatica/assembly-shift',
  topic: TOPIC,
  objectives: ['risc-cisc-assembly.3'],
  generate(seed, lang) {
    const r = createRng(seed);
    const value = r.int(3, 60);
    const left = r.int(1, 4);
    const right = r.int(1, 4);
    const program = { value, left, right };
    const { afterLeft, result } = simShift(program);
    const bin = toBin(afterLeft % 2 ** 16, 16);
    return {
      figure: figShift(value, left, right),
      statement:
        L(lang, 'Shift logici: esegui il programma.', 'Logical shifts: run the program.') +
        `\n\n${pre(formatListing(shiftListing(program, lang)))}`,
      steps: [
        {
          title: 'LSL',
          body: L(
            lang,
            `Uno shift a sinistra di ${left} moltiplica per 2^${left}: ${value} × ${2 ** left} = ${afterLeft}.`,
            `A left shift by ${left} multiplies by 2^${left}: ${value} × ${2 ** left} = ${afterLeft}.`,
          ),
        },
        {
          title: L(lang, 'In binario', 'In binary'),
          body: L(
            lang,
            `Gli stessi bit spostati, con zeri in coda: \`${bin}\`.`,
            `The same bits shifted, with trailing zeros: \`${bin}\`.`,
          ),
        },
        {
          title: 'LSR',
          body: L(
            lang,
            `Divisione intera per 2^${right}: ${afterLeft} / ${2 ** right} = ${result} (la parte frazionaria si perde).`,
            `Integer division by 2^${right}: ${afterLeft} / ${2 ** right} = ${result} (the fractional part is lost).`,
          ),
        },
      ],
      answer: [
        exact(L(lang, 'R1 dopo la LSL', 'R1 after LSL'), afterLeft),
        bitsAnswer(L(lang, 'Lo stesso valore su 16 bit', 'The same value on 16 bits'), bin),
        exact(L(lang, 'R1 dopo la LSR', 'R1 after LSR'), result),
      ],
    };
  },
});
