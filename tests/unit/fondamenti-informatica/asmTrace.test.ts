import { describe, expect, it } from 'vitest';
import { traceProgram } from '../../../src/courses/fondamenti-informatica/lib/asmTrace';
import { simLoop, simMulCmp, simShift } from '../../../src/courses/fondamenti-informatica/lib/asmSim';

const last = (t: ReturnType<typeof traceProgram>) => t.steps.at(-1)!;

describe('traccia del simulatore assembly', () => {
  it('coincide con il simulatore del corso su tutti i parametri', () => {
    for (let start = 1; start <= 40; start++)
      for (let step = 1; step <= 9; step++) {
        const s = simLoop({ start, step });
        const t = traceProgram('loop', { start, step });
        expect(last(t).regs.R2).toBe(s.iterations);
        expect(last(t).regs.R1).toBe(s.finalR1);
        expect(t.steps.every((x) => x.line < t.listing.length)).toBe(true);
      }
    for (let a = 0; a <= 12; a++)
      for (let b = 0; b <= 12; b++)
        for (const cmp of [a * b, a * b + 1]) {
          const t = traceProgram('mulcmp', { a, b, cmp, add: 5 }, 'en');
          expect(last(t).regs.R3).toBe(simMulCmp({ a, b, cmp, add: 5 }).r3);
        }
    for (let value = 0; value <= 60; value++)
      for (let left = 0; left <= 4; left++)
        for (let right = 0; right <= 4; right++)
          expect(last(traceProgram('shift', { value, left, right })).regs.R1).toBe(
            simShift({ value, left, right }).result,
          );
  });
});
