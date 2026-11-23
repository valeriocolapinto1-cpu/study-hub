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
/**
 * La cache di passaggio si sfoltisce una volta ogni RUNTIME_TRIM_EVERY scritture (`cache.keys()`
 * costa quanto il numero di voci) e alla prima scrittura di ogni avvio del worker, che il browser
 * ferma dopo pochi secondi di inattività: senza quest'ultima la cache crescerebbe di qualche voce
 * a ogni avvio.
 */
export const RUNTIME_TRIM_EVERY = 20;
/** Attesa massima della rete per pagine e file senza hash prima di usare la copia in cache. */
export const NETWORK_TIMEOUT_MS = 3000;

/** @param {string} version */
export const runtimeCacheName = (version) => `${RUNTIME_PREFIX}:${version}`;

/** Prefisso delle cache "in pensione": file con hash tolti dalla shell o dai corsi a un aggiornamento. */
export const RETIRED_PREFIX = 'sh-retired';
/** Chiave (in `sh-meta`) degli id delle finestre aperte quando una versione ha preso il posto della precedente. */
export const RETIRING_KEY = '__retiring';

/** @param {string} version */
export const retiredCacheName = (version) => `${RETIRED_PREFIX}:${version}`;

/**
 * Cache temporanee d'installazione: si eliminano all'attivazione.
 * @param {string[]} names
 */
export const stagingCaches = (names) => names.filter((n) => n.startsWith('sh-staging:'));

/**
 * Cache delle versioni precedenti che le pagine ancora aperte possono usare: le cache di passaggio
 * delle altre versioni (anche il vecchio nome senza versione) e quelle in pensione. Si eliminano
 * solo quando le finestre aperte al momento dell'aggiornamento sono tutte chiuse (`sweepRetired`
 * in sw.js): una pagina vecchia rimasta aperta continua a trovare i suoi file con hash.
 * @param {string[]} names @param {string} version
 */
export function retiringCaches(names, version) {
  const keep = runtimeCacheName(version);
  return names.filter(
    (n) =>
      n.startsWith(`${RETIRED_PREFIX}:`) ||
      (n !== keep && (n === RUNTIME_PREFIX || n.startsWith(`${RUNTIME_PREFIX}:`))),
  );
}

/**
 * Finestre da attendere prima di eliminare le cache in pensione: quelle già registrate ancora
 * aperte più quelle aperte adesso (senza doppioni).
 * @param {string[]} recorded @param {string[]} open
 */
export const mergeClients = (recorded, open) => [...new Set([...recorded, ...open])];

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

/**
 * Va sfoltita la cache di passaggio alla scrittura numero `n` (da 1) di questo avvio?
 * @param {number} n
 */
export const shouldTrimRuntime = (n) => n % RUNTIME_TRIM_EVERY === 1;

/**
 * Corso e lingua di un percorso sotto `/<lingua>/anno-N/<corso>/` (null fuori dai corsi).
 * @param {string} pathname @param {string} base
 * @returns {{ course: string, lang: string } | null}
 */
export function courseOfPath(pathname, base) {
  if (!pathname.startsWith(base)) return null;
  const m = /^(it|en)\/anno-\d+\/([a-z0-9-]+)\//.exec(pathname.slice(base.length));
  return m ? { course: /** @type {string} */ (m[2]), lang: /** @type {string} */ (m[1]) } : null;
}

/**
 * Cache in cui cercare un percorso, in ordine. Le pagine e i dati di un corso stanno solo nella
 * cache di quel corso (se scaricato) o in quella di passaggio; le risorse comuni nella shell, in
 * uno dei corsi scaricati o in quella di passaggio.
 * @param {string} pathname @param {string} base
 * @param {string[]} owned nomi delle cache dei corsi scaricati
 * @param {string} runtime nome della cache di passaggio
 */
export function cachesFor(pathname, base, owned, runtime) {
  const c = courseOfPath(pathname, base);
  if (c) {
    const name = courseCacheName(c.course, c.lang);
    return owned.includes(name) ? [name, runtime] : [runtime];
  }
  return [SHELL_CACHE, ...owned, runtime];
}

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
