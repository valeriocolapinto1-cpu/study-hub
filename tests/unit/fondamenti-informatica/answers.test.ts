/**
 * Le risposte degli esercizi statici di Fondamenti di Informatica sono
 * RICALCOLATE qui da zero (con il codice del corso o con aritmetica diretta)
 * e confrontate con i valori scritti nei file YAML. Inoltre ogni risposta,
 * inserita così com'è, deve risultare corretta per il correttore del motore.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { gradeAnswers } from '../../../src/engine/grading';
import { addTwos, toBin, toHex } from '../../../src/courses/fondamenti-informatica/lib/numeric';
import {
  minimalCover,
  literalCount,
  type Implicant,
} from '../../../src/courses/fondamenti-informatica/lib/boolean';
import {
  encodeIeee754,
  fieldsToBits,
  decodeIeee754,
  bitsToFields,
} from '../../../src/courses/fondamenti-informatica/lib/ieee754';

interface Ans {
  label: { it: string };
  value: number | string;
  unit?: string;
  tol?: number;
  kind?: 'text';
  accept?: string[];
}
interface Ex {
  id: string;
  answer?: Ans[];
}

const DIR = join(import.meta.dirname, '../../../src/content/exercises/fondamenti-informatica');
const all = new Map<string, Ex>();
for (const f of readdirSync(DIR))
  for (const e of parse(readFileSync(join(DIR, f), 'utf8')) as Ex[]) all.set(e.id, e);
const values = (id: string) => {
  const e = all.get(id);
  if (!e?.answer) throw new Error(`esercizio ${id} senza risposte`);
  return e.answer.map((a) => a.value);
};
const yn = (b: boolean) => (b ? 'sì' : 'no');
const cover = (on: number[], vars: number, dc: number[] = []) => minimalCover(new Set(on), new Set(dc), vars);
const lits = (c: Implicant[], vars: number) => c.reduce((s, i) => s + literalCount(i, vars), 0);
const close = (a: unknown, b: number) =>
  expect(Math.abs(Number(a) - b) / Math.max(1, Math.abs(b))).toBeLessThan(0.005);

/** Simulazione indipendente di una cache LRU a 2 vie con 2 insiemi. */
function lru(seq: number[]) {
  const sets: number[][] = [[], []];
  let hit = 0;
  for (const b of seq) {
    const s = sets[b % 2]!;
    const i = s.indexOf(b);
    if (i >= 0) {
      hit++;
      s.splice(i, 1);
    } else if (s.length === 2) s.shift();
    s.push(b);
  }
  return { hit, miss: seq.length - hit };
}

describe('risposte ricalcolate (Fondamenti di Informatica)', () => {
  it('ogni risposta scritta è accettata dal correttore, con tutte le forme alternative', () => {
    let n = 0;
    for (const e of all.values()) {
      if (!e.answer) continue;
      for (const a of e.answer) {
        const spec = {
          label: a.label.it,
          value: a.value,
          ...(a.unit ? { unit: a.unit } : {}),
          ...(a.tol ? { tol: a.tol } : {}),
          ...(a.kind ? { kind: a.kind } : {}),
          ...(a.accept ? { accept: a.accept } : {}),
        };
        const given = typeof a.value === 'number' ? String(a.value) : a.value;
        expect(
          gradeAnswers([spec], [a.unit ? `${given} ${a.unit}` : given]).status,
          `${e.id} ${a.label.it}`,
        ).toBe('correct');
        for (const alt of a.accept ?? [])
          expect(gradeAnswers([spec], [alt]).status, `${e.id} «${alt}»`).toBe('correct');
        n++;
      }
    }
    expect(n).toBeGreaterThan(100);
  });

  it('numeri binari', () => {
    expect(values('numeri-binari-es-1')).toEqual([(173).toString(2), Number((173).toString(8)), toHex(173)]);
    expect(values('numeri-binari-es-2')).toEqual([toBin(-87, 8), toHex(256 - 87)]);
    const r = addTwos(100, 45, 8);
    expect(values('numeri-binari-es-3')).toEqual([r.sum, yn(r.carryOut), yn(r.overflow)]);
    expect(values('numeri-binari-es-4')).toEqual([-8 + 3, toBin(-5, 8), toBin(-5, 16)]);
    expect(values('numeri-binari-es-5')).toEqual([5, Number((89).toString(5)), 5 ** 4 - 1]);
  });

  it('reti logiche e Karnaugh', () => {
    // parità dispari: colonna d'uscita di A⊕B⊕C sui mintermini 0…7
    expect(values('reti-combinatorie-es-2')).toEqual([
      Array.from({ length: 8 }, (_, m) => ((m >> 2) ^ (m >> 1) ^ m) & 1).join(''),
    ]);
    expect(values('reti-combinatorie-es-5')).toEqual([4 * 8, 1]);
    const k1 = cover([1, 2, 3, 6], 3);
    expect(values('mappe-di-karnaugh-es-1')).toEqual([k1.length, lits(k1, 3)]);
    const k2 = cover([0, 2, 8, 10], 4);
    expect(values('mappe-di-karnaugh-es-2')).toEqual([k2.length, lits(k2, 4)]);
    const k3 = cover([1, 3, 7, 11, 15], 4, [0, 2, 5]);
    expect(values('mappe-di-karnaugh-es-3')).toEqual([k3.length, lits(k3, 4)]);
    expect(values('mappe-di-karnaugh-es-4')[1]).toBe(cover([0, 1, 2, 5, 6, 7], 3).length);
    const zeros = cover([3, 4], 3); // POS = negazione della SOP degli zeri
    expect(values('mappe-di-karnaugh-es-5')).toEqual([zeros.length, lits(zeros, 3)]);
  });

  it('aritmetica hardware', () => {
    const r2 = addTwos(-5, 6, 4);
    expect(values('aritmetica-hardware-es-2')).toEqual([r2.binary, yn(r2.carryOut), yn(r2.overflow)]);
    const r3 = addTwos(7, -12, 5);
    expect(values('aritmetica-hardware-es-3')).toEqual([r3.binary, r3.sum, yn(r3.overflow)]);
    const s4 = 0b1101 + 0b0111;
    expect(values('aritmetica-hardware-es-4')).toEqual([toBin(s4 % 16, 4), s4 >> 4]);
    expect(values('aritmetica-hardware-es-5')).toEqual([toBin(13 * 5, 8), 65]);
  });

  it('sequenziali, tempi e tecnologia', () => {
    expect(values('circuiti-sequenziali-es-2')).toEqual([100e6 / 2]);
    let reg = '1011';
    const seq: string[] = [];
    for (const b of ['1', '0', '1']) {
      reg = b + reg.slice(0, 3);
      seq.push(reg);
    }
    expect(values('circuiti-sequenziali-es-4')).toEqual(seq);
    const T = (2 + 7 + 1.5) * 1e-9;
    close(values('circuiti-sequenziali-es-5')[0], T);
    close(values('circuiti-sequenziali-es-5')[1], 1 / T);
    expect(values('circuiti-sequenziali-es-5')[2]).toBe(yn(2 + 1 >= 0.5));
    close(values('tempi-e-tecnologia-es-1')[0], (3 + 2 + 4) * 1e-9);
    close(values('tempi-e-tecnologia-es-1')[1], (Math.max(3, 2) + 4) * 1e-9);
    close(values('tempi-e-tecnologia-es-2')[0], (1.5 + 7 * 0.2) * 1e-9);
    close(values('tempi-e-tecnologia-es-3')[0], 1 / ((3 + 16 * 2) * 1e-9));
    close(values('tempi-e-tecnologia-es-3')[1], 1 / ((3 + 6) * 1e-9));
    close(values('tempi-e-tecnologia-es-4')[0], 4 * 2);
    close(values('tempi-e-tecnologia-es-4')[1], 4 * 2 * 1.2 ** 2);
  });

  it('processore, assembly, software', () => {
    const v = values('processore-es-4');
    [6 * 2e-9, 4 * 2e-9, 1e6 * 6 * 2e-9, 1e6 * 4 * 2e-9].forEach((x, i) => close(v[i], x));
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += i;
    expect(values('risc-cisc-assembly-es-2')).toEqual([sum]);
    const word = 0x12345678;
    expect(values('risc-cisc-assembly-es-5')).toEqual([toHex(word >>> 24), toHex(word & 0xff)]);
    // sw-1: ORIGIN 200, 6 istruzioni prima di CONT; GIRO è la terza riga
    expect(values('dal-sorgente-all-esecuzione-es-1')).toEqual([200 + 2 * 4, 200 + 6 * 4, 200 + 7 * 4]);
    expect(values('dal-sorgente-all-esecuzione-es-3')).toEqual([100 + 2 * 4 + 20, 100 + 2 * 4 + 20 + 4 + 4]);
    expect(values('dal-sorgente-all-esecuzione-es-4')).toEqual([5 * 2e6, 2e6]);
  });

  it('interruzioni, I/O, pipeline', () => {
    close(values('interruzioni-ed-eccezioni-es-4')[0], ((1 + 20) / 2) * 2e-6);
    close(values('interruzioni-ed-eccezioni-es-4')[1], 20 * 2e-6);
    close(values('interruzioni-ed-eccezioni-es-5')[0], (12 + 8) / 500e6);
    close(values('interruzioni-ed-eccezioni-es-5')[1], (12 + 8 + 40 + 8) / 500e6);
    const ints = 100e6 / 4;
    expect(values('input-output-es-3')).toEqual([ints, (ints * 500) / 2e9]);
    expect(values('pipeline-es-1')).toEqual([5 + 4 - 1]);
    expect(values('pipeline-es-2')[0]).toBe(5 + 999);
    close(values('pipeline-es-2')[1], 5000 / 1004);
    expect(values('pipeline-es-3')).toEqual([3 + 5 + 1, 3 + 5 - 1]);
    close(values('pipeline-es-5')[0], 1 + 0.2 * 0.6 * 2);
  });

  it('memoria, memoria virtuale, prestazioni, IEEE 754', () => {
    const fields = (bytes: number, block: number, ways: number, addr = 32) => {
      const sets = bytes / block / ways;
      const off = Math.log2(block);
      const idx = Math.log2(sets);
      return [addr - idx - off, idx, off];
    };
    expect(values('gerarchia-di-memoria-es-1')).toEqual(fields(32768, 16, 1));
    expect(values('gerarchia-di-memoria-es-3')).toEqual(fields(32768, 16, 4));
    close(values('gerarchia-di-memoria-es-2')[0], (2 + 0.05 * 80) * 1e-9);
    close(values('gerarchia-di-memoria-es-2')[1], (2 + 0.02 * 80) * 1e-9);
    const reads = 1000 * 0.05 * 16;
    expect(values('gerarchia-di-memoria-es-4')).toEqual([reads + 200 * 4, reads + 50 * 0.3 * 16]);
    const l = lru([0, 1, 2, 0, 3, 1, 2, 4, 0]);
    expect(values('gerarchia-di-memoria-es-5')).toEqual([l.miss, l.hit]);
    expect(values('memoria-virtuale-es-1')).toEqual([toHex(0x0c3 * 4096 + (0x0002a7f4 % 4096), 8)]);
    expect(values('memoria-virtuale-es-2')).toEqual([(2 ** 20 * 4) / 2 ** 20, (100 * 2 ** 20 * 4) / 2 ** 20]);
    expect(values('memoria-virtuale-es-4')).toEqual([0.99 * 100 + 0.01 * 200 + 0.00001 * 10e-3 * 1e9]);
    close(values('prestazioni-e-parallelismo-es-1')[0], (2e9 * 1.8) / 3e9);
    close(values('prestazioni-e-parallelismo-es-2')[0], 1.8 / 3 / (1.2 / 2.5));
    close(values('prestazioni-e-parallelismo-es-3')[0], 1 / (0.75 + 0.25 / 8));
    close(values('prestazioni-e-parallelismo-es-3')[1], 1 / 0.75);
    expect(values('prestazioni-e-parallelismo-es-4')).toEqual([Math.ceil(0.8 / (0.5 - 0.2)), 1 / 0.2]);
    close(values('prestazioni-e-parallelismo-es-5')[0], (10 + 0.1) / 2);
    close(values('prestazioni-e-parallelismo-es-5')[1], Math.sqrt(10 * 0.1));
    const enc = parseInt(fieldsToBits(encodeIeee754(-12.375)), 2);
    expect(values('virgola-mobile-es-1')).toEqual([toHex(enc, 8)]);
    expect(values('virgola-mobile-es-2')).toEqual([decodeIeee754(bitsToFields((0x41200000).toString(2)))]);
  });
});
