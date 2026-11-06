import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runMigrations } from '../../../src/engine/migrate';
import {
  createMemoryBackend,
  read,
  setStorageBackend,
  write,
  type StorageBackend,
} from '../../../src/engine/storage';
import {
  LEGACY_KEY,
  LEGACY_TOPICS,
  bankExerciseId,
  migrateExamDate,
  migrateExams,
  migrateProgress,
} from '../../../src/courses/fondamenti-informatica/migrations';
import { LEGACY_TO_ID } from '../../../tools/legacy-topics/fondamenti-informatica.mjs';

const ROOT = join(import.meta.dirname, '../../..');
const exerciseIds = new Set<string>();
for (const f of readdirSync(join(ROOT, 'src/content/exercises/fondamenti-informatica')))
  for (const e of parse(
    readFileSync(join(ROOT, 'src/content/exercises/fondamenti-informatica', f), 'utf8'),
  ) as { id: string }[])
    exerciseIds.add(e.id);

const legacyV2 = {
  version: 2,
  exams: [
    { mode: 'full', score30: 27, percent: 90, lode: false, earned: 27, total: 30, at: 1_700_000_000_000 },
    { mode: 'quick', percent: 60, lode: false, earned: 12, total: 20, at: 1_700_000_100_000 },
  ],
  visited: ['bin', 'bool'],
  done: { bin: 1_699_000_000_000, ieee: 1_699_500_000_000, sconosciuto: 5 },
  bank: {
    'mcq-bin-01': { right: 2, wrong: 1 },
    'open-irq-01': { right: 1, wrong: 0 },
    'mux-4-1': { right: 0, wrong: 2 },
  },
  examDate: '2027-01-20',
};

describe('migrazione dal sito originale (aefin.v1)', () => {
  let backend: StorageBackend;
  beforeEach(() => {
    backend = createMemoryBackend();
    setStorageBackend(backend);
  });
  afterEach(() => setStorageBackend(undefined));

  it('la tabella degli argomenti coincide con quella dell’estrattore', () => {
    expect(LEGACY_TOPICS).toEqual(LEGACY_TO_ID);
  });

  it('gli id della banca puntano a esercizi esistenti', () => {
    for (const id of ['mcq-bin-01', 'mcq-cpu-05', 'mcq-perf-04'])
      expect(exerciseIds.has(bankExerciseId(id)!)).toBe(true);
    for (const id of ['mux-4-1', 'cache-diretta', 'datapath'])
      expect(exerciseIds.has(bankExerciseId(id)!)).toBe(true);
    expect(bankExerciseId('open-irq-01')).toBeNull();
    expect(bankExerciseId('asmw-mul')).toBeNull();
  });

  it('trasforma progressi, prove e data d’esame', () => {
    const p = migrateProgress(legacyV2)!;
    expect(p.read).toEqual({ 'numeri-binari': 1_699_000_000_000, 'virgola-mobile': 1_699_500_000_000 });
    expect(p.exercises['mcq-bin-01']).toMatchObject({ best: 1 });
    expect(p.exercises['mcq-bin-01']!.attempts).toHaveLength(3);
    expect(p.exercises['schema-mux-4-1']).toMatchObject({ best: 0 });
    expect(p.exercises['open-irq-01']).toBeUndefined();
    const e = migrateExams(legacyV2)!;
    expect(e.history.map((r) => [r.config.mode, r.grade30, r.percent])).toEqual([
      ['completa', 27, 90],
      ['personalizzata', undefined, 60],
    ]);
    expect(migrateExamDate(legacyV2)).toEqual({ 'fondamenti-informatica': '2027-01-20' });
    expect(migrateExamDate({ examDate: '20/01/2027' })).toBeUndefined();
    expect(migrateProgress(null)).toBeUndefined();
    expect(migrateExams({ version: 1 })).toBeUndefined();
  });

  it('esegue le migrazioni senza toccare la chiave legacy né sovrascrivere dati nuovi', async () => {
    await import('../../../src/courses/fondamenti-informatica/migrations');
    const raw = JSON.stringify(legacyV2);
    backend.setItem(LEGACY_KEY, raw);
    write('global', 'examDates', { 'fondamenti-informatica': '2027-02-10', 'fisica-1': '2027-01-15' });
    const report = runMigrations();
    expect(report.applied).toEqual(
      expect.arrayContaining([
        'fondamenti-informatica/progress',
        'fondamenti-informatica/exam',
        'fondamenti-informatica/exam-date',
      ]),
    );
    expect(backend.getItem(LEGACY_KEY)).toBe(raw);
    expect(read('global', 'examDates', {})).toEqual({
      'fondamenti-informatica': '2027-02-10',
      'fisica-1': '2027-01-15',
    });
    expect(
      read<{ read: Record<string, number> }>('fondamenti-informatica', 'progress', { read: {} }).read,
    ).toHaveProperty('numeri-binari');
    expect(runMigrations().applied).toEqual([]);
  });

  it('migra il formato v1 (moduli «studied» = solo aperti, non studiati)', () => {
    const v1 = { version: 1, exams: [], studied: ['bin'], bank: { 'mcq-bool-01': { right: 1, wrong: 0 } } };
    const p = migrateProgress(v1)!;
    expect(p.read).toEqual({});
    expect(p.exercises['mcq-bool-01']).toMatchObject({ best: 1 });
  });
});
