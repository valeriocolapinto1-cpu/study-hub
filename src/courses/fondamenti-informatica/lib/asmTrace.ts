/**
 * Traccia d'esecuzione dei tre programmi tipo (vedi asmSim.ts): uno stato per
 * ogni istruzione eseguita, con registri, flag, riga corrente e commento.
 * Il risultato finale coincide per costruzione con simLoop/simMulCmp/simShift
 * (lo verifica un test).
 */
import { loopListing, mulCmpListing, shiftListing, type AsmLine } from './asmSim';

export type ProgramKind = 'loop' | 'mulcmp' | 'shift';

export interface TraceStep {
  /** Riga del listato appena eseguita (−1 = stato iniziale). */
  line: number;
  regs: Record<string, number>;
  flags: { Z: boolean; N: boolean };
  note: string;
}

export interface Trace {
  listing: AsmLine[];
  steps: TraceStep[];
}

type Lang = 'it' | 'en';
const L = (lang: Lang, it: string, en: string) => (lang === 'en' ? en : it);
const MAX_STEPS = 500;

export function traceProgram(kind: ProgramKind, p: Record<string, number>, lang: Lang = 'it'): Trace {
  const steps: TraceStep[] = [];
  const regs: Record<string, number> = { R1: 0, R2: 0, R3: 0 };
  const flags = { Z: false, N: false };
  const push = (line: number, note: string) =>
    steps.push({ line, regs: { ...regs }, flags: { ...flags }, note });
  const setFlags = (v: number) => {
    flags.Z = v === 0;
    flags.N = v < 0;
  };
  push(-1, L(lang, 'Stato iniziale: registri a zero.', 'Initial state: registers at zero.'));

  if (kind === 'loop') {
    const start = p.start ?? 10;
    const step = Math.max(1, p.step ?? 1);
    const listing = loopListing({ start, step });
    regs.R1 = start;
    push(0, L(lang, `R1 ← ${start}`, `R1 ← ${start}`));
    regs.R2 = 0;
    push(1, L(lang, 'R2 ← 0 (contatore dei giri)', 'R2 ← 0 (iteration counter)'));
    for (let guard = 0; guard < MAX_STEPS; guard++) {
      regs.R1! -= step;
      setFlags(regs.R1!);
      push(2, `R1 ← R1 − ${step} = ${regs.R1}`);
      regs.R2! += 1;
      push(3, `R2 ← R2 + 1 = ${regs.R2}`);
      const taken = regs.R1! > 0;
      push(
        4,
        taken
          ? L(
              lang,
              `R1 = ${regs.R1} > 0: il salto è preso, si torna a L.`,
              `R1 = ${regs.R1} > 0: branch taken, back to L.`,
            )
          : L(
              lang,
              `R1 = ${regs.R1} non è > 0: il salto non è preso, fine.`,
              `R1 = ${regs.R1} is not > 0: branch not taken, end.`,
            ),
      );
      if (!taken) break;
    }
    return { listing, steps };
  }

  if (kind === 'mulcmp') {
    const a = p.a ?? 6;
    const b = p.b ?? 7;
    const cmp = p.cmp ?? 42;
    const add = p.add ?? 5;
    const listing = mulCmpListing({ a, b, cmp, add });
    regs.R1 = a;
    push(0, `R1 ← ${a}`);
    regs.R2 = b;
    push(1, `R2 ← ${b}`);
    regs.R3 = a * b;
    push(2, `R3 ← R1 × R2 = ${regs.R3}`);
    setFlags(regs.R3 - cmp);
    push(
      3,
      L(
        lang,
        `CMP: R3 − ${cmp} = ${regs.R3 - cmp}, aggiorna i flag senza salvare il risultato.`,
        `CMP: R3 − ${cmp} = ${regs.R3 - cmp}, updates the flags without saving the result.`,
      ),
    );
    if (flags.Z) {
      push(
        4,
        L(
          lang,
          'Z = 1: BEQ salta a FINE, la ADD è saltata.',
          'Z = 1: BEQ branches to FINE, the ADD is skipped.',
        ),
      );
      push(6, L(lang, 'Fine del programma.', 'End of the program.'));
    } else {
      push(4, L(lang, 'Z = 0: BEQ non salta.', 'Z = 0: BEQ does not branch.'));
      regs.R3 += add;
      push(5, `R3 ← R3 + ${add} = ${regs.R3}`);
      push(6, L(lang, 'Fine del programma.', 'End of the program.'));
    }
    return { listing, steps };
  }

  const value = p.value ?? 13;
  const left = p.left ?? 3;
  const right = p.right ?? 2;
  const listing = shiftListing({ value, left, right }, lang);
  regs.R1 = value;
  push(0, `R1 ← ${value}`);
  regs.R1 = value * 2 ** left;
  push(
    1,
    L(lang, `LSL di ${left}: × ${2 ** left} = ${regs.R1}`, `LSL by ${left}: × ${2 ** left} = ${regs.R1}`),
  );
  regs.R1 = Math.floor(regs.R1 / 2 ** right);
  push(
    2,
    L(
      lang,
      `LSR di ${right}: divisione intera per ${2 ** right} = ${regs.R1}`,
      `LSR by ${right}: integer division by ${2 ** right} = ${regs.R1}`,
    ),
  );
  return { listing, steps };
}
