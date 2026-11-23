import { describe, expect, it, vi } from 'vitest';
import {
  formatBuild,
  isChunkLoadError,
  isCourseCache,
  isNewerBuild,
  parseBuildInfo,
  resetSiteCaches,
  shouldAutoReload,
  shouldCheck,
} from '../../../src/pwa/update';
import {
  isBypassed,
  isImmutableAsset,
  mergeClients,
  retiredCacheName,
  retiringCaches,
  runtimeCacheName,
  stagingCaches,
} from '../../../src/pwa/sw-core.js';

const local = { commit: 'aaaaaaa', date: '2026-11-09T10:00:00.000Z' };

describe('versione della build', () => {
  it('legge version.json e scarta contenuti non validi', () => {
    expect(parseBuildInfo({ commit: 'bbbbbbb', date: '2026-11-10T00:00:00Z', sw: 'x' })).toEqual({
      commit: 'bbbbbbb',
      date: '2026-11-10T00:00:00Z',
    });
    expect(parseBuildInfo(null)).toBeNull();
    expect(parseBuildInfo('x')).toBeNull();
    expect(parseBuildInfo({ commit: '', date: '2026-11-10' })).toBeNull();
    expect(parseBuildInfo({ commit: 'b', date: 'ieri' })).toBeNull();
  });

  it('è più recente solo con commit diverso e data successiva', () => {
    expect(isNewerBuild(local, { commit: 'bbbbbbb', date: '2026-11-09T11:00:00.000Z' })).toBe(true);
    expect(isNewerBuild(local, { commit: 'aaaaaaa', date: '2026-11-10T00:00:00.000Z' })).toBe(false);
    // Copia vecchia di version.json (cache di una CDN): nessun avviso.
    expect(isNewerBuild(local, { commit: 'ccccccc', date: '2026-11-08T00:00:00.000Z' })).toBe(false);
    expect(isNewerBuild(local, null)).toBe(false);
    expect(isNewerBuild({ commit: 'dev', date: local.date }, { commit: 'b', date: '2027-01-01' })).toBe(
      false,
    );
  });

  it('limita la frequenza dei controlli', () => {
    expect(shouldCheck(-Infinity, 0)).toBe(true);
    expect(shouldCheck(1000, 30_000)).toBe(false);
    expect(shouldCheck(1000, 61_000)).toBe(true);
  });

  it('formatta la build per il footer', () => {
    expect(formatBuild(local)).toBe('aaaaaaa · 2026-11-09');
  });
});

describe('Aggiorna il sito', () => {
  it('deregistra i service worker e svuota Cache Storage', async () => {
    const unregister = vi.fn(async () => true);
    const names = ['sh-shell', 'sh-course:x:it', 'sh-runtime:abc'];
    const del = vi.fn(async (n: string) => names.includes(n));
    const out = await resetSiteCaches({
      serviceWorker: { getRegistrations: async () => [{ unregister }, { unregister }] },
      caches: { keys: async () => names, delete: del },
    });
    expect(out).toEqual({ workers: 2, caches: 3 });
    expect(del.mock.calls.map((c) => c[0])).toEqual(names);
  });

  it('«Ricarica» del riquadro d’errore conserva i corsi scaricati', async () => {
    const names = ['sh-shell', 'sh-meta', 'sh-course:x:it', 'sh-runtime:abc', 'sh-retired:abc'];
    const del = vi.fn(async () => true);
    const out = await resetSiteCaches({ caches: { keys: async () => names, delete: del } }, isCourseCache);
    expect(out).toEqual({ workers: 0, caches: 4 });
    expect(del.mock.calls.map((c) => (c as unknown[])[0])).not.toContain('sh-course:x:it');
  });

  it('funziona anche senza service worker né Cache Storage', async () => {
    expect(await resetSiteCaches({})).toEqual({ workers: 0, caches: 0 });
  });
});

describe('recupero dopo una pubblicazione', () => {
  it('riconosce gli import falliti di Chrome, Safari, Firefox e Vite', () => {
    for (const msg of [
      'Failed to fetch dynamically imported module: https://x/_astro/A.js',
      'Importing a module script failed.',
      'error loading dynamically imported module: https://x/_astro/A.js',
      'Unable to preload CSS for /_astro/A.css',
    ])
      expect(isChunkLoadError(new TypeError(msg))).toBe(true);
    expect(isChunkLoadError(new TypeError("Cannot read properties of undefined (reading 'x')"))).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });

  it('ricarica una volta sola per build, e solo se quella pubblicata è più recente', () => {
    const remote = { commit: 'bbbbbbb', date: '2026-11-10T00:00:00Z' };
    expect(shouldAutoReload(local, remote, null)).toBe(true);
    expect(shouldAutoReload(local, remote, 'ccccccc')).toBe(true);
    expect(shouldAutoReload(local, remote, 'bbbbbbb')).toBe(false);
    expect(shouldAutoReload(local, local, null)).toBe(false);
    expect(shouldAutoReload(local, null, null)).toBe(false);
  });
});

describe('strategie di cache del service worker', () => {
  const BASE = '/study-hub/';
  it('serve dalla cache solo i file con hash nel nome', () => {
    expect(isImmutableAsset('/study-hub/_astro/Base.Dx3kQ9a_.js', BASE)).toBe(true);
    expect(isImmutableAsset('/study-hub/pagefind/it/fragment/it_1a2b3c.pf_fragment', BASE)).toBe(true);
    expect(isImmutableAsset('/study-hub/pagefind/index/it_1a2b.pf_index', BASE)).toBe(true);
    expect(isImmutableAsset('/study-hub/it/', BASE)).toBe(false);
    expect(isImmutableAsset('/study-hub/pagefind/pagefind.js', BASE)).toBe(false);
    expect(isImmutableAsset('/study-hub/it/anno-1/x/dati/indice.json', BASE)).toBe(false);
    expect(isImmutableAsset('/altro/_astro/a.js', BASE)).toBe(false);
  });

  it('non intercetta sw.js e version.json', () => {
    expect(isBypassed('/study-hub/version.json', BASE)).toBe(true);
    expect(isBypassed('/study-hub/sw.js', BASE)).toBe(true);
    expect(isBypassed('/study-hub/it/', BASE)).toBe(false);
  });

  it('lega la cache di passaggio alla versione; le vecchie vanno in pensione', () => {
    expect(runtimeCacheName('v2')).toBe('sh-runtime:v2');
    expect(retiredCacheName('v2')).toBe('sh-retired:v2');
    const names = [
      'sh-shell',
      'sh-meta',
      'sh-runtime',
      'sh-runtime:v1',
      'sh-runtime:v2',
      'sh-retired:v1',
      'sh-retired:v2',
      'sh-staging:v2:sh-shell',
      'sh-course:x:it',
    ];
    expect(stagingCaches(names)).toEqual(['sh-staging:v2:sh-shell']);
    expect(retiringCaches(names, 'v2')).toEqual([
      'sh-runtime',
      'sh-runtime:v1',
      'sh-retired:v1',
      'sh-retired:v2',
    ]);
  });

  it('attende le finestre già registrate e quelle aperte adesso', () => {
    expect(mergeClients(['a', 'b'], ['b', 'c'])).toEqual(['a', 'b', 'c']);
    expect(mergeClients([], [])).toEqual([]);
  });
});
