/**
 * Generatori di Fondamenti di Informatica: forma valida su molti semi in
 * entrambe le lingue, determinismo, e risposte RICALCOLATE in modo
 * indipendente dal testo mostrato (non rilette dal generatore).
 */
import { describe, expect, it } from 'vitest';
import { listGenerators, runGenerator } from '../../../src/engine/generators/registry';
import '../../../src/courses/fondamenti-informatica/generators/numeri';
import '../../../src/courses/fondamenti-informatica/generators/logica';
import '../../../src/courses/fondamenti-informatica/generators/assembly';
import '../../../src/courses/fondamenti-informatica/generators/memoria';
import { gradeAnswers } from '../../../src/engine/grading';
import { minimalCover, varNames } from '../../../src/courses/fondamenti-informatica/lib/boolean';

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 13);
const ids = listGenerators('fondamenti-informatica').map((g) => g.id);
const toSpec = (a: {
  label: string;
  value: number | string;
  tol?: number;
  kind?: 'number' | 'complex' | 'text';
  accept?: string[];
}) => a;

/** Rilegge un intero (anche negativo, con «−») dopo un'etichetta nel testo. */
const num = (s: string) => Number(s.replace('−', '-'));

describe('generatori di Fondamenti di Informatica', () => {
  it('sono registrati tutti', () => {
    expect(ids.length).toBeGreaterThanOrEqual(18);
  });

  it.each(ids)('%s: uscita valida, deterministica, risposta propria corretta', (id) => {
    for (const seed of SEEDS) {
      for (const lang of ['it', 'en'] as const) {
        const ex = runGenerator(id, seed, lang);
        expect(runGenerator(id, seed, lang)).toEqual(ex);
        if (ex.choices) {
          expect(ex.choices.filter((c) => c.correct)).toHaveLength(1);
          expect(new Set(ex.choices.map((c) => c.text)).size).toBe(ex.choices.length);
        } else {
          // La risposta attesa, scritta così com'è, deve risultare corretta.
          const r = gradeAnswers(
            ex.answer.map(toSpec),
            ex.answer.map((a) => String(a.value)),
          );
          expect(r.status, `${id} seed ${seed}`).toBe('correct');
          for (const a of ex.answer)
            for (const alt of a.accept ?? [])
              expect(gradeAnswers([toSpec(a)], [alt]).status, `${id}: «${alt}»`).toBe('correct');
        }
        // Nessun testo inglese nella versione italiana e viceversa (controllo grossolano).
        if (lang === 'en') expect(ex.statement).not.toMatch(/\b(Quale|Scrivi|Calcola|quanti)\b/);
      }
    }
  });

  it('complemento a 2: ricalcolo dal valore nel testo', () => {
    for (const seed of SEEDS) {
      const ex = runGenerator('fondamenti-informatica/complemento-a-2', seed, 'it');
      const m = /\*\*(−?-?\d+)\*\*.*\*\*(\d+) bit\*\*/.exec(ex.statement)!;
      const n = num(m[1]!);
      const bits = Number(m[2]);
      const expected = ((n + 2 ** bits) % 2 ** bits).toString(2).padStart(bits, '0');
      expect(ex.answer[0]!.value).toBe(expected);
    }
  });

  it('esadecimale: ricalcolo', () => {
    for (const seed of SEEDS) {
      const ex = runGenerator('fondamenti-informatica/decimale-esadecimale', seed, 'en');
      const n = Number(/\*\*(\d+)\*\*/.exec(ex.statement)![1]);
      expect(ex.answer[0]!.value).toBe(n.toString(16).toUpperCase());
    }
  });

  it('somma con flag: ricalcolo di somma, riporto e overflow', () => {
    for (const seed of SEEDS) {
      const ex = runGenerator('fondamenti-informatica/somma-con-flag', seed, 'it');
      const m = /\*\*(-?\d+) \+ (-?\d+)\*\*.*\*\*(\d+) bit\*\*/.exec(ex.statement)!;
      const [a, b, bits] = [Number(m[1]), Number(m[2]), Number(m[3])];
      const mod = 2 ** bits;
      const ua = (a + mod) % mod;
      const ub = (b + mod) % mod;
      const raw = ua + ub;
      const wrapped = raw % mod;
      const read = wrapped >= mod / 2 ? wrapped - mod : wrapped;
      const overflow = a + b < -(mod / 2) || a + b > mod / 2 - 1;
      expect(ex.answer[2]!.value).toBe(wrapped.toString(2).padStart(bits, '0'));
      expect(ex.answer[3]!.value).toBe(raw >= mod ? 'sì' : 'no');
      expect(ex.answer[4]!.value).toBe(overflow ? 'sì' : 'no');
      expect(ex.answer[5]!.value).toBe(read);
    }
  });

  it('karnaugh: numero di termini uguale alla copertura minima ricalcolata', () => {
    for (const seed of SEEDS) {
      const ex = runGenerator('fondamenti-informatica/karnaugh', seed, 'it');
      const names = /Y\(([A-D,]+)\)/.exec(ex.statement)![1]!.split(',');
      const on = new Set(/Σm\(([\d, ]+)\)/.exec(ex.statement)![1]!.split(',').map(Number));
      const d = /d\(([\d, ]+)\)/.exec(ex.statement);
      const dc = new Set(d ? d[1]!.split(',').map(Number) : []);
      expect(varNames(names.length)).toEqual(names);
      expect(ex.answer[0]!.value).toBe(minimalCover(on, dc, names.length).length);
    }
  });

  it('pipeline e cache: ricalcolo', () => {
    for (const seed of SEEDS) {
      const p = runGenerator('fondamenti-informatica/cicli-pipeline', seed, 'it');
      const [, k, n] = /\*\*(\d+) stadi\*\* esegue \*\*(\d+) istruzioni/.exec(p.statement)!.map(Number);
      expect(p.answer.map((a) => a.value)).toEqual([k! + n! - 1, k! * n!, k! * n! - (k! + n! - 1)]);
      const c = runGenerator('fondamenti-informatica/campi-cache', seed, 'it');
      const block = Number(/\*\*(\d+) byte\*\*/.exec(c.statement)![1]);
      const addr = Number(/\*\*(\d+) bit\*\*/.exec(c.statement)![1]);
      const sets = Number(/con (\d+) (?:linee|insiemi)/.exec(c.statement)![1]);
      expect(c.answer.map((a) => a.value)).toEqual([
        addr - Math.log2(sets) - Math.log2(block),
        Math.log2(sets),
        Math.log2(block),
      ]);
    }
  });

  it('traduzione degli indirizzi: ricalcolo', () => {
    for (const seed of SEEDS) {
      const ex = runGenerator('fondamenti-informatica/traduzione-indirizzi', seed, 'it');
      const m =
        /\*\*(\d+) byte\*\*, l'indirizzo virtuale `0x([0-9A-F]+)`.*\*\*(\d+)\*\*, mappata sul frame \*\*(\d+)\*\*/.exec(
          ex.statement,
        );
      if (m) {
        const size = Number(m[1]);
        const va = parseInt(m[2]!, 16);
        expect(Math.floor(va / size)).toBe(Number(m[3]));
        expect(ex.answer[0]!.value).toBe(va % size);
        expect(ex.answer[1]!.value).toBe((Number(m[4]) * size + (va % size)).toString(16).toUpperCase());
      } else {
        const [, kib, va] = /\*\*(\d+) KiB\*\*.*\*\*(\d+) bit\*\*/.exec(ex.statement)!.map(Number);
        expect(ex.answer.map((a) => a.value)).toEqual([Math.log2(kib! * 1024), va! - Math.log2(kib! * 1024)]);
      }
    }
  });
});
