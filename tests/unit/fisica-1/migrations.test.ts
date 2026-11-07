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
  migrateExamDate,
  migrateOral,
  migrateProgress,
} from '../../../src/courses/fisica-1/migrations';
import extract from '../../../tools/legacy-topics/fisica-1.mjs';
import { join } from 'node:path';

const legacy = {
  argomenti: {
    '1': { stato: 3, ef: 2.5, intervallo: 4, prossimoRipasso: '2026-11-10', ultimaRevisione: '2026-11-03' },
    '30': { stato: 1, ef: 2.0, intervallo: 1, prossimoRipasso: '2026-11-05' },
    '12': { stato: 0, ef: 2.3, intervallo: 0, prossimoRipasso: null },
    '99': { stato: 2 },
  },
  simulazioni: { '2026-11-03': 2 },
  dataEsame: '2026-12-15',
  modalitaSim: 'facile',
};

describe('migrazione di Fisica 1 (fisica1-orale-v1)', () => {
  let backend: StorageBackend;
  beforeEach(() => {
    backend = createMemoryBackend();
    setStorageBackend(backend);
  });
  afterEach(() => setStorageBackend(undefined));

  it('la tabella degli argomenti coincide con l’estrattore', () => {
    expect([...LEGACY_TOPICS]).toEqual(
      extract(join(import.meta.dirname, '../../../legacy/fisica-1')).map((t) => t.id),
    );
  });

  it('converte progressi, storico dell’orale e data d’esame', () => {
    const now = 1_800_000_000_000;
    const p = migrateProgress(legacy, now)!;
    expect(Object.keys(p.read).sort()).toEqual(['ciclo-di-carnot', 'moto-circolare-vario']);
    expect(p.read['ciclo-di-carnot']).toBe(now);
    const o = migrateOral(legacy, now)!;
    expect(o.mode).toBe('facile');
    expect(o.history.map((h) => [h.topic, h.score])).toEqual([
      ['moto-circolare-vario', 3],
      ['ciclo-di-carnot', 1],
    ]);
    expect(migrateExamDate(legacy)).toEqual({ 'fisica-1': '2026-12-15' });
    expect(migrateProgress({ argomenti: {} })).toBeUndefined();
    expect(migrateOral({})).toBeUndefined();
    expect(migrateExamDate({ dataEsame: null })).toBeUndefined();
    expect(migrateProgress('x')).toBeUndefined();
  });

  it('esegue le migrazioni senza toccare la chiave legacy e senza sovrascrivere le date', () => {
    backend.setItem(LEGACY_KEY, JSON.stringify(legacy));
    write('global', 'examDates', { 'fisica-2': '2027-01-10' });
    runMigrations();
    expect(backend.getItem(LEGACY_KEY)).toBe(JSON.stringify(legacy));
    expect(read('global', 'examDates', {})).toEqual({ 'fisica-2': '2027-01-10', 'fisica-1': '2026-12-15' });
    expect(Object.keys(read<{ read: object }>('fisica-1', 'progress', { read: {} }).read)).toHaveLength(2);
    expect(read<{ mode: string }>('fisica-1', 'orale', { mode: '' }).mode).toBe('facile');
  });
});
