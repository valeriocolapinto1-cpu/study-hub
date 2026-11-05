import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createMemoryBackend,
  listKeys,
  parseKey,
  read,
  remove,
  setStorageBackend,
  storageKey,
  update,
  write,
  type StorageBackend,
} from '../../src/engine/storage';

describe('storage', () => {
  let backend: StorageBackend;
  beforeEach(() => {
    backend = createMemoryBackend();
    setStorageBackend(backend);
  });
  afterEach(() => setStorageBackend(undefined));

  it('costruisce e scompone chiavi sh:v1:', () => {
    expect(storageKey('fisica-2', 'progress')).toBe('sh:v1:fisica-2:progress');
    expect(storageKey('global', 'theme')).toBe('sh:v1:global:theme');
    expect(parseKey('sh:v1:fisica-2:srs')).toEqual({ scope: 'fisica-2', area: 'srs' });
    expect(parseKey('fg2-theme')).toBeNull();
    expect(() => storageKey('Fisica 2', 'x')).toThrow();
    expect(() => storageKey('fisica-2', 'a:b')).toThrow();
  });

  it('legge e scrive JSON con ripiego', () => {
    expect(read('fisica-2', 'progress', { done: 0 })).toEqual({ done: 0 });
    expect(write('fisica-2', 'progress', { done: 3 })).toBe(true);
    expect(read('fisica-2', 'progress', { done: 0 })).toEqual({ done: 3 });
    expect(update('fisica-2', 'progress', { done: 0 }, (v) => ({ done: v.done + 1 }))).toEqual({ done: 4 });
    remove('fisica-2', 'progress');
    expect(read('fisica-2', 'progress', null)).toBeNull();
  });

  it('JSON corrotto restituisce il ripiego', () => {
    backend.setItem('sh:v1:global:theme', '{rotto');
    expect(read('global', 'theme', 'light')).toBe('light');
  });

  it('elenca solo le chiavi del sito', () => {
    backend.setItem('fg2-theme', 'dark');
    write('global', 'theme', 'dark');
    write('fisica-1', 'srs', {});
    expect(listKeys()).toEqual(['sh:v1:fisica-1:srs', 'sh:v1:global:theme']);
    expect(listKeys('fisica-1')).toEqual(['sh:v1:fisica-1:srs']);
  });

  it('non lancia eccezioni senza storage o con storage che fallisce', () => {
    setStorageBackend(null);
    expect(write('global', 'theme', 'dark')).toBe(false);
    expect(read('global', 'theme', 'light')).toBe('light');
    expect(listKeys()).toEqual([]);
    const failing: StorageBackend = {
      getItem: () => {
        throw new Error('negato');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('negato');
      },
      key: () => null,
      length: 0,
    };
    setStorageBackend(failing);
    expect(write('global', 'theme', 'dark')).toBe(false);
    expect(read('global', 'theme', 'light')).toBe('light');
    expect(() => remove('global', 'theme')).not.toThrow();
  });
});
