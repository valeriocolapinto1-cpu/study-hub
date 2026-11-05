import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStorage } from './storage';

/** Sostituisce `window.localStorage` per la durata del test. */
function withLocalStorage(impl: Partial<Storage> | undefined): void {
  vi.stubGlobal('window', { localStorage: impl });
}

describe('storage incapsulato', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('usa localStorage quando funziona', () => {
    const backing = new Map<string, string>();
    withLocalStorage({
      getItem: (key: string) => backing.get(key) ?? null,
      setItem: (key: string, value: string) => void backing.set(key, value),
      removeItem: (key: string) => void backing.delete(key),
    });

    const store = createStorage();
    expect(store.persistent).toBe(true);

    store.set('k', { a: 1 });
    expect(store.get('k', null)).toEqual({ a: 1 });
    store.remove('k');
    expect(store.get('k', 'default')).toBe('default');
  });

  it('degrada in memoria se la scrittura è vietata', () => {
    // Navigazione privata: l'oggetto esiste ma setItem solleva.
    withLocalStorage({
      getItem: () => null,
      setItem: () => {
        throw new DOMException('QuotaExceededError');
      },
      removeItem: () => undefined,
    });

    const store = createStorage();
    expect(store.persistent).toBe(false);

    // L'app continua a funzionare: i dati vivono per la sessione.
    store.set('k', [1, 2, 3]);
    expect(store.get('k', [])).toEqual([1, 2, 3]);
  });

  it('non si rompe su dati corrotti', () => {
    withLocalStorage({
      getItem: () => '{ questo non è JSON',
      setItem: () => undefined,
      removeItem: () => undefined,
    });

    const store = createStorage();
    expect(store.get('k', { safe: true })).toEqual({ safe: true });
  });

  it('funziona anche senza window (build e test in Node)', () => {
    vi.stubGlobal('window', undefined);
    const store = createStorage();
    expect(store.persistent).toBe(false);
    store.set('k', 1);
    expect(store.get('k', 0)).toBe(1);
  });
});
