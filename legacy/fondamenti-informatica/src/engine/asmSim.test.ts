import { describe, expect, it } from 'vitest';
import { simLoop, simMulCmp, simShift } from './asmSim';

describe('ciclo con contatore', () => {
  it('esegue il corpo almeno una volta: il salto è in coda', () => {
    expect(simLoop({ start: 1, step: 5 })).toEqual({ iterations: 1, finalR1: -4 });
  });

  it('conta le iterazioni come ⌈start/step⌉', () => {
    for (let start = 1; start <= 40; start++) {
      for (let step = 1; step <= 5; step++) {
        expect(simLoop({ start, step }).iterations, `start=${start} step=${step}`).toBe(
          Math.ceil(start / step),
        );
      }
    }
  });

  it('rifiuta uno step non positivo invece di ciclare all’infinito', () => {
    expect(() => simLoop({ start: 5, step: 0 })).toThrow(RangeError);
  });
});

describe('MUL / CMP / BEQ', () => {
  it('salta l’ADD quando il confronto va a segno', () => {
    expect(simMulCmp({ a: 3, b: 4, cmp: 12, add: 7 })).toEqual({ r3: 12, branchTaken: true });
  });

  it('esegue l’ADD quando il confronto fallisce', () => {
    expect(simMulCmp({ a: 3, b: 4, cmp: 99, add: 7 })).toEqual({ r3: 19, branchTaken: false });
  });

  it('coincide con la forma chiusa', () => {
    for (let a = 2; a <= 9; a++) {
      for (let b = 2; b <= 9; b++) {
        for (const add of [1, 5, 9]) {
          for (const cmp of [a * b, a * b + 1]) {
            const expected = a * b === cmp ? a * b : a * b + add;
            expect(simMulCmp({ a, b, cmp, add }).r3).toBe(expected);
          }
        }
      }
    }
  });
});

describe('shift logici', () => {
  it('sinistra moltiplica, destra divide (intero)', () => {
    expect(simShift({ value: 5, left: 2, right: 0 })).toEqual({ afterLeft: 20, result: 20 });
    expect(simShift({ value: 5, left: 0, right: 1 })).toEqual({ afterLeft: 5, result: 2 });
  });

  it('coincide con la forma chiusa', () => {
    for (let value = 1; value <= 40; value++) {
      for (let left = 0; left <= 3; left++) {
        for (let right = 0; right <= 3; right++) {
          expect(simShift({ value, left, right }).result).toBe(
            Math.floor((value * 2 ** left) / 2 ** right),
          );
        }
      }
    }
  });
});
