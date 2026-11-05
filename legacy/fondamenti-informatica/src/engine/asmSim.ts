import type { AsmLine } from './types';

/**
 * Mini-simulatori dei tre template assembly.
 *
 * Il punto è che la risposta esatta non è mai scritta a mano: viene
 * *eseguita*. Il generatore costruisce il testo del quesito dagli stessi
 * parametri che passa al simulatore, quindi codice mostrato e risposta attesa
 * non possono divergere.
 */

// ─────────────────────── (a) ciclo con contatore ───────────────────────

export interface LoopProgram {
  /** Valore iniziale di R1. */
  start: number;
  /** Quanto si sottrae a ogni giro. */
  step: number;
}

export interface LoopResult {
  /** Valore finale di R2, cioè il numero di iterazioni. */
  iterations: number;
  /** Valore finale di R1. */
  finalR1: number;
}

/**
 * Move R1,#start · Clear R2 · L: Sub R1,R1,#step · Add R2,R2,#1 · Branch>0 L
 * Il corpo è eseguito almeno una volta: il salto è in coda.
 */
export function simLoop({ start, step }: LoopProgram): LoopResult {
  if (step <= 0) throw new RangeError('step deve essere positivo, altrimenti il ciclo non termina');
  let r1 = start;
  let r2 = 0;
  do {
    r1 -= step;
    r2 += 1;
  } while (r1 > 0);
  return { iterations: r2, finalR1: r1 };
}

export function loopListing({ start, step }: LoopProgram): AsmLine[] {
  return [
    { text: `Move  R1, #${start}` },
    { text: 'Clear R2' },
    { label: 'L:', text: `Sub   R1, R1, #${step}` },
    { text: 'Add   R2, R2, #1' },
    { text: 'Branch_if_[R1]>0  L' },
  ];
}

// ──────────────────── (b) MUL / CMP / BEQ in stile ARM ────────────────────

export interface MulCmpProgram {
  a: number;
  b: number;
  /** Valore con cui si confronta il prodotto. */
  cmp: number;
  /** Addendo eseguito solo se il salto NON viene preso. */
  add: number;
}

export interface MulCmpResult {
  r3: number;
  branchTaken: boolean;
}

/** MOV R1,#a · MOV R2,#b · MUL R3,R1,R2 · CMP R3,#cmp · BEQ FINE · ADD R3,R3,#add */
export function simMulCmp({ a, b, cmp, add }: MulCmpProgram): MulCmpResult {
  const product = a * b;
  const branchTaken = product === cmp;
  return { r3: branchTaken ? product : product + add, branchTaken };
}

export function mulCmpListing({ a, b, cmp, add }: MulCmpProgram): AsmLine[] {
  return [
    { text: `MOV  R1, #${a}` },
    { text: `MOV  R2, #${b}` },
    { text: 'MUL  R3, R1, R2' },
    { text: `CMP  R3, #${cmp}` },
    { text: 'BEQ  FINE' },
    { text: `ADD  R3, R3, #${add}` },
    { label: 'FINE:', text: '' },
  ];
}

// ─────────────────────── (c) shift LSL / LSR ───────────────────────

export interface ShiftProgram {
  value: number;
  /** Posizioni di shift a sinistra. */
  left: number;
  /** Posizioni di shift a destra (logico). */
  right: number;
}

export interface ShiftResult {
  afterLeft: number;
  result: number;
}

/**
 * MOV R1,#value · LSL R1,R1,#left · LSR R1,R1,#right
 * Shift logici su interi senza segno: `<<` è ×2ⁿ, `>>` è divisione intera.
 * Aritmetica, non operatori bit a bit, per non incappare nel troncamento a
 * 32 bit con segno di JavaScript.
 */
export function simShift({ value, left, right }: ShiftProgram): ShiftResult {
  const afterLeft = value * 2 ** left;
  return { afterLeft, result: Math.floor(afterLeft / 2 ** right) };
}

export function shiftListing({ value, left, right }: ShiftProgram): AsmLine[] {
  return [
    { text: `MOV  R1, #${value}` },
    { text: `LSL  R1, R1, #${left}`, comment: '; shift a sinistra' },
    { text: `LSR  R1, R1, #${right}`, comment: '; shift a destra' },
  ];
}
