import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MIGRATIONS, runMigrations, type Migration } from '../../src/engine/migrate';
import {
  createMemoryBackend,
  read,
  setStorageBackend,
  write,
  type StorageBackend,
} from '../../src/engine/storage';

describe('migrate', () => {
  let backend: StorageBackend;
  beforeEach(() => {
    backend = createMemoryBackend();
    setStorageBackend(backend);
  });
  afterEach(() => setStorageBackend(undefined));

  it('migra la lingua dell’hub senza cancellare la chiave legacy ed è idempotente', () => {
    backend.setItem('lang', 'en');
    const first = runMigrations();
    expect(first.applied).toContain('hub/lang');
    expect(read('global', 'lang', null)).toBe('en');
    expect(backend.getItem('lang')).toBe('en');
    backend.setItem('lang', 'it');
    const second = runMigrations();
    expect(second.applied).toEqual([]);
    expect(read('global', 'lang', null)).toBe('en');
  });

  it('non sovrascrive un valore nuovo già presente', () => {
    write('global', 'lang', 'it');
    backend.setItem('lang', 'en');
    runMigrations();
    expect(read('global', 'lang', null)).toBe('it');
  });

  it('rimanda le migrazioni la cui chiave legacy non esiste e isola gli errori', () => {
    const broken: Migration = {
      id: 'test/rotta',
      legacyKey: 'x',
      scope: 'global',
      area: 'x',
      transform: () => {
        throw new Error('formato inatteso');
      },
    };
    backend.setItem('x', '1');
    const report = runMigrations([...MIGRATIONS, broken]);
    expect(report.skipped).toContain('hub/lang');
    expect(report.failed).toEqual(['test/rotta']);
  });

  it('usa merge quando definito', () => {
    write('fisica-2', 'progress', { a: 1 });
    backend.setItem('fg2-progress-v1', JSON.stringify({ b: 2 }));
    runMigrations([
      {
        id: 'test/merge',
        legacyKey: 'fg2-progress-v1',
        scope: 'fisica-2',
        area: 'progress',
        transform: (raw) => JSON.parse(raw) as unknown,
        merge: (a, b) => ({ ...(a as object), ...(b as object) }),
      },
    ]);
    expect(read('fisica-2', 'progress', {})).toEqual({ a: 1, b: 2 });
  });
});
