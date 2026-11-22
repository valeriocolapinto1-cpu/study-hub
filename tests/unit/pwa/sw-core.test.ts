import { describe, expect, it } from 'vitest';
import {
  RUNTIME_TRIM_EVERY,
  SHELL_CACHE,
  cachesFor,
  courseCacheName,
  courseOfPath,
  courseStatus,
  diffEntries,
  langOf,
  lookupCandidates,
  parseCourseCache,
  pool,
  shouldTrimRuntime,
  stagingCacheName,
} from '../../../src/pwa/sw-core.js';

type Entry = [string, string, number];

describe('sw-core', () => {
  it('nomina e riconosce le cache dei corsi', () => {
    expect(courseCacheName('fisica-1', 'it')).toBe('sh-course:fisica-1:it');
    expect(parseCourseCache('sh-course:fisica-1:en')).toEqual({ course: 'fisica-1', lang: 'en' });
    expect(parseCourseCache('sh-shell')).toBeNull();
    expect(parseCourseCache('sh-course:Fisica:de')).toBeNull();
    expect(stagingCacheName('abc', 'sh-shell')).toBe('sh-staging:abc:sh-shell');
  });

  it('scarica solo ciò che è cambiato e rimuove ciò che è sparito', () => {
    const entries: Entry[] = [
      ['/a', 'r1', 10],
      ['/b', 'r2', 20],
      ['/c', 'r3', 30],
    ];
    const d = diffEntries(entries, { '/a': 'r1', '/b': 'old', '/z': 'x' });
    expect(d.fetch.map((e) => e[0])).toEqual(['/b', '/c']);
    expect(d.keep).toEqual(['/a']);
    expect(d.remove).toEqual(['/z']);
  });

  it('trova le pagine con o senza barra finale', () => {
    expect(lookupCandidates('/b/it/chi-sono/')).toEqual(['/b/it/chi-sono/']);
    expect(lookupCandidates('/b/it/chi-sono')).toEqual(['/b/it/chi-sono', '/b/it/chi-sono/']);
    expect(lookupCandidates('/b/it/chi-sono/index.html')).toEqual([
      '/b/it/chi-sono/index.html',
      '/b/it/chi-sono/',
    ]);
    expect(lookupCandidates('/b/_astro/x.js')).toEqual(['/b/_astro/x.js']);
  });

  it('riconosce la lingua della pagina', () => {
    expect(langOf('/b/en/anno-1/x/', '/b/')).toBe('en');
    expect(langOf('/b/it/', '/b/')).toBe('it');
    expect(langOf('/b/', '/b/')).toBe('it');
  });

  it('calcola lo stato di un corso', () => {
    const entries: Entry[] = [
      ['/a', 'r1', 100],
      ['/b', 'r2', 50],
    ];
    expect(courseStatus(entries, null)).toEqual({
      state: 'none',
      files: 2,
      bytes: 150,
      missing: 2,
      missingBytes: 150,
    });
    expect(courseStatus(entries, { '/a': 'r1', '/b': 'r2' }).state).toBe('complete');
    expect(courseStatus(entries, { '/a': 'r1', '/b': 'vecchia' })).toMatchObject({
      state: 'partial',
      missing: 1,
      missingBytes: 50,
    });
  });

  it('limita le operazioni contemporanee', async () => {
    let running = 0;
    let peak = 0;
    const done: number[] = [];
    await pool([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((r) => setTimeout(r, 5));
      done.push(n);
      running--;
    });
    expect(peak).toBe(3);
    expect(done.sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    await expect(pool([], 3, async () => undefined)).resolves.toBeUndefined();
  });

  it('sfoltisce la cache di passaggio alla prima scrittura e poi una volta ogni N', () => {
    const trims = Array.from({ length: 3 * RUNTIME_TRIM_EVERY }, (_, i) => i + 1).filter(shouldTrimRuntime);
    expect(trims).toEqual([1, RUNTIME_TRIM_EVERY + 1, 2 * RUNTIME_TRIM_EVERY + 1]);
  });

  it('cerca ogni percorso solo nelle cache che possono contenerlo', () => {
    const B = '/study-hub/';
    const runtime = 'sh-runtime:v1';
    const f1 = courseCacheName('fisica-1', 'it');
    const tc = courseCacheName('teoria-circuiti', 'en');
    expect(courseOfPath(`${B}it/anno-1/fisica-1/teoria/`, B)).toEqual({ course: 'fisica-1', lang: 'it' });
    expect(courseOfPath(`${B}it/anno-1/fisica-1/dati/indice.json`, B)).toEqual({
      course: 'fisica-1',
      lang: 'it',
    });
    expect(courseOfPath(`${B}it/chi-sono/`, B)).toBeNull();
    expect(courseOfPath('/altro/it/anno-1/fisica-1/', B)).toBeNull();
    // Pagina di un corso scaricato: la sua cache, poi quella di passaggio.
    expect(cachesFor(`${B}it/anno-1/fisica-1/teoria/`, B, [f1, tc], runtime)).toEqual([f1, runtime]);
    // Corso non scaricato (o scaricato nell'altra lingua): solo la cache di passaggio.
    expect(cachesFor(`${B}en/anno-1/fisica-1/teoria/`, B, [f1, tc], runtime)).toEqual([runtime]);
    // Risorse comuni (pagine globali, indice di ricerca): shell, corsi scaricati, passaggio.
    expect(cachesFor(`${B}pagefind/it/pagefind.js`, B, [f1, tc], runtime)).toEqual([
      SHELL_CACHE,
      f1,
      tc,
      runtime,
    ]);
    expect(cachesFor(`${B}it/`, B, [], runtime)).toEqual([SHELL_CACHE, runtime]);
  });
});
