// @ts-check
/**
 * Funzioni pure del service worker (nessun accesso a cache o rete): testate con vitest
 * (tests/unit/pwa/sw-core.test.ts). Al momento della build tools/integrations/pwa.mjs
 * le concatena a src/pwa/sw.js togliendo le parole chiave `export`.
 */

export const SHELL_CACHE = 'sh-shell';
/** Prefisso della cache "di passaggio": il nome completo contiene la versione della build. */
export const RUNTIME_PREFIX = 'sh-runtime';
export const META_CACHE = 'sh-meta';
/** Voci massime della cache "di passaggio" (pagine e risorse viste ma non scaricate). */
export const RUNTIME_MAX = 120;
/** Attesa massima della rete per pagine e file senza hash prima di usare la copia in cache. */
export const NETWORK_TIMEOUT_MS = 3000;

/** @param {string} version */
export const runtimeCacheName = (version) => `${RUNTIME_PREFIX}:${version}`;

/**
 * Cache da eliminare all'attivazione di `version`: quelle di passaggio delle versioni
 * precedenti (anche il vecchio nome senza versione) e le cache temporanee d'installazione.
 * @param {string[]} names @param {string} version
 */
export function staleCaches(names, version) {
  const keep = runtimeCacheName(version);
  return names.filter(
    (n) =>
      n.startsWith('sh-staging:') ||
      (n !== keep && (n === RUNTIME_PREFIX || n.startsWith(`${RUNTIME_PREFIX}:`))),
  );
}

/**
 * File con l'hash del contenuto nel nome (mai modificati sullo stesso URL): si servono
 * dalla cache senza chiedere alla rete. Tutto il resto (pagine, JSON, icone, pagefind.js…)
 * passa prima dalla rete.
 * @param {string} pathname @param {string} base
 */
export function isImmutableAsset(pathname, base) {
  if (!pathname.startsWith(base)) return false;
  const rest = pathname.slice(base.length);
  return rest.startsWith('_astro/') || /^pagefind\/(?:[a-z]+\/)?(?:fragment|index|filter)\//.test(rest);
}

/**
 * Percorsi mai intercettati dal service worker (sempre dalla rete, mai in cache).
 * @param {string} pathname @param {string} base
 */
export const isBypassed = (pathname, base) =>
  pathname === `${base}sw.js` || pathname === `${base}version.json`;

/** @param {string} course @param {string} lang */
export const courseCacheName = (course, lang) => `sh-course:${course}:${lang}`;

/** @param {string} name @returns {{ course: string, lang: string } | null} */
export function parseCourseCache(name) {
  const m = /^sh-course:([a-z0-9-]+):(it|en)$/.exec(name);
  return m ? { course: /** @type {string} */ (m[1]), lang: /** @type {string} */ (m[2]) } : null;
}

/** @param {string} version @param {string} target */
export const stagingCacheName = (version, target) => `sh-staging:${version}:${target}`;

/**
 * Confronta le voci del nuovo manifest con le revisioni in cache.
 * @param {[string, string, number][]} entries [url, revisione, byte]
 * @param {Record<string, string>} current url → revisione già in cache
 * @returns {{ fetch: [string, string, number][], keep: string[], remove: string[] }}
 */
export function diffEntries(entries, current) {
  const next = new Set();
  /** @type {[string, string, number][]} */
  const toFetch = [];
  /** @type {string[]} */
  const keep = [];
  for (const e of entries) {
    next.add(e[0]);
    if (current[e[0]] === e[1]) keep.push(e[0]);
    else toFetch.push(e);
  }
  const remove = Object.keys(current).filter((u) => !next.has(u));
  return { fetch: toFetch, keep, remove };
}

/**
 * Percorsi candidati per cercare una richiesta in cache: le pagine sono salvate con la
 * barra finale (`/it/chi-sono/`), ma si può arrivare anche da `/it/chi-sono` o
 * `/it/chi-sono/index.html`.
 * @param {string} pathname
 * @returns {string[]}
 */
export function lookupCandidates(pathname) {
  if (pathname.endsWith('/index.html')) return [pathname, pathname.slice(0, -'index.html'.length)];
  if (pathname.endsWith('/')) return [pathname];
  const last = pathname.slice(pathname.lastIndexOf('/') + 1);
  if (last.includes('.')) return [pathname];
  return [pathname, `${pathname}/`];
}

/**
 * Lingua di un percorso del sito (per scegliere la pagina "sei offline").
 * @param {string} pathname @param {string} base
 */
export function langOf(pathname, base) {
  const rest = pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\/+/, '');
  return rest.startsWith('en/') || rest === 'en' ? 'en' : 'it';
}

/**
 * Stato di un corso scaricato rispetto al manifest.
 * @param {[string, string, number][]} entries
 * @param {Record<string, string> | null} current revisioni in cache (null = mai scaricato)
 */
export function courseStatus(entries, current) {
  const bytes = entries.reduce((s, e) => s + e[2], 0);
  if (!current)
    return { state: 'none', files: entries.length, bytes, missing: entries.length, missingBytes: bytes };
  const d = diffEntries(entries, current);
  const missingBytes = d.fetch.reduce((s, e) => s + e[2], 0);
  return {
    state: d.fetch.length === 0 ? 'complete' : 'partial',
    files: entries.length,
    bytes,
    missing: d.fetch.length,
    missingBytes,
  };
}

/**
 * Esegue `task` su tutti gli elementi con al più `limit` operazioni contemporanee.
 * @template T
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T, index: number) => Promise<void>} task
 */
export async function pool(items, limit, task) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      await task(/** @type {T} */ (items[i]), i);
    }
  });
  await Promise.all(workers);
}
