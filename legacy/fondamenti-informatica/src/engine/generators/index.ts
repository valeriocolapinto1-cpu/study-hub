import type { Question } from '../types';
import type { GenCtx } from './context';
import { genAsmSnippet } from './assembly';
import { genIeee754 } from './ieee';
import { genDiagramLabel } from './diagram';
import { genGate, genKarnaugh, genTruthToExpr } from './logic';
import { genCacheFields, genPageTranslate } from './memory';
import { genArith, genCP2, genHex, genMaxRange } from './numbers';
import { genPipelineCycles } from './perf';
import { genAsmWrite, genMC, genOpen, genRtn } from './theory';

export { genAsmSnippet, genGate, genKarnaugh, genArith, genCP2, genHex, genMaxRange };
export { genDiagramLabel, genTruthToExpr };
export { genAsmWrite, genMC, genOpen, genRtn };
export { genIeee754, genCacheFields, genPageTranslate, genPipelineCycles };
export { makeChoices, numericChoices, questionId, type GenCtx } from './context';

/**
 * Registro dei generatori: è il punto di estensione dell'app.
 *
 * Aggiungere un tipo di quesito vuol dire scrivere una funzione
 * `(ctx) => Question` e registrarla qui; da quel momento può comparire in
 * qualunque blueprint d'esame — ma va anche **messa** in almeno un blueprint,
 * altrimenti resta codice che nessuna prova può pescare.
 */
export const GENERATORS = {
  mc: genMC,
  cp2: genCP2,
  arith: genArith,
  hex: genHex,
  maxRange: genMaxRange,
  gate: genGate,
  asmSnippet: genAsmSnippet,
  karnaugh: genKarnaugh,
  asmWrite: genAsmWrite,
  open: genOpen,

  // Le due famiglie che questa prova ha sempre: «completare
  // l'immagine» e «dalla tabella di verità all'espressione logica».
  diagramLabel: genDiagramLabel,
  truthToExpr: genTruthToExpr,

  // Quesiti calcolati sugli argomenti approfonditi: processore, memoria
  // virtuale, cache, pipeline, virgola mobile.
  rtn: genRtn,
  ieee754: genIeee754,
  pageTranslate: genPageTranslate,
  cacheFields: genCacheFields,
  pipelineCycles: genPipelineCycles,
} as const satisfies Record<string, (ctx: GenCtx) => Question>;

export type GeneratorId = keyof typeof GENERATORS;
