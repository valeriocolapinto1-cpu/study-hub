/**
 * Service worker di study-hub. Nel file pubblicato (dist/sw.js) è preceduto da
 * `MANIFEST` (generato a build-time) e dalle funzioni di src/pwa/sw-core.js.
 *
 * - Installazione: scarica in una cache temporanea solo i file della shell (e dei corsi
 *   già scaricati) che sono cambiati rispetto alla versione in uso.
 * - Attesa: la nuova versione non prende il controllo da sola; la pagina mostra
 *   "Nuova versione disponibile" e, alla conferma, invia SKIP_WAITING.
 * - Attivazione: sposta i file aggiornati nelle cache definitive e rimuove quelli spariti.
 * - Richieste: shell e corsi scaricati dalla cache; il resto dalla rete, con una copia
 *   nella cache di passaggio; offline, la pagina richiesta se è stata vista, altrimenti
 *   la pagina "sei offline" della lingua giusta.
 * - Messaggi: COURSE_STATUS, COURSE_DOWNLOAD (con avanzamento), COURSE_REMOVE, SKIP_WAITING.
 */
/* global MANIFEST, SHELL_CACHE, RUNTIME_CACHE, META_CACHE, RUNTIME_MAX, courseCacheName, parseCourseCache, stagingCacheName, diffEntries, lookupCandidates, langOf, courseStatus, pool */

const BASE = MANIFEST.base;
const ORIGIN = self.location.origin;
const abs = (path) => new URL(path, ORIGIN).href;
const metaKey = (cacheName) => abs(`${BASE}__sh-meta/${encodeURIComponent(cacheName)}`);

async function readMeta(cacheName) {
  const res = await (await caches.open(META_CACHE)).match(metaKey(cacheName));
  return res ? res.json() : null;
}
async function writeMeta(cacheName, revs) {
  const meta = await caches.open(META_CACHE);
  if (revs === null) await meta.delete(metaKey(cacheName));
  else
    await meta.put(
      metaKey(cacheName),
      new Response(JSON.stringify(revs), { headers: { 'content-type': 'application/json' } }),
    );
}

async function fetchFresh(url) {
  const res = await fetch(abs(url), { cache: 'no-cache', credentials: 'same-origin' });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res;
}

/** Cache dei corsi scaricati presenti (nome → { course, lang }). */
async function downloadedCourses() {
  return (await caches.keys()).map((n) => [n, parseCourseCache(n)]).filter(([, p]) => p);
}

/* ------------------------------------------------------------------ install */

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const targets = [[SHELL_CACHE, MANIFEST.shell]];
      for (const [name, info] of await downloadedCourses()) {
        const entries = MANIFEST.courses[info.course]?.[info.lang];
        if (entries) targets.push([name, entries]);
      }
      for (const [name, entries] of targets) {
        const current = (await readMeta(name)) ?? {};
        const { fetch: changed } = diffEntries(entries, current);
        const staging = await caches.open(stagingCacheName(MANIFEST.version, name));
        await pool(changed, 6, async ([url]) => {
          if (await staging.match(abs(url))) return;
          await staging.put(abs(url), await fetchFresh(url));
        });
      }
      // Primo arrivo: nessuna versione precedente da rispettare.
      if (!self.registration.active) await self.skipWaiting();
    })(),
  );
});

/* ------------------------------------------------------------------ activate */

async function commit(name, entries) {
  const staging = await caches.open(stagingCacheName(MANIFEST.version, name));
  const target = await caches.open(name);
  const current = (await readMeta(name)) ?? {};
  const { fetch: changed, remove } = diffEntries(entries, current);
  const revs = { ...current };
  for (const [url, rev] of changed) {
    const res = await staging.match(abs(url));
    if (!res) continue; // non scaricato (es. errore di rete): resta la copia precedente, se c'è
    await target.put(abs(url), res);
    revs[url] = rev;
  }
  for (const url of remove) {
    await target.delete(abs(url));
    delete revs[url];
  }
  await writeMeta(name, revs);
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await commit(SHELL_CACHE, MANIFEST.shell);
      for (const [name, info] of await downloadedCourses()) {
        const entries = MANIFEST.courses[info.course]?.[info.lang];
        if (entries) await commit(name, entries);
        else {
          // Corso non più pubblicato.
          await caches.delete(name);
          await writeMeta(name, null);
        }
      }
      for (const name of await caches.keys()) if (name.startsWith('sh-staging:')) await caches.delete(name);
      // Le pagine viste con la versione precedente possono richiamare risorse sparite.
      await caches.delete(RUNTIME_CACHE);
      await self.clients.claim();
    })(),
  );
});

/* ------------------------------------------------------------------ fetch */

async function matchOwned(pathname, navigate) {
  const names = [SHELL_CACHE, ...(await downloadedCourses()).map(([n]) => n), RUNTIME_CACHE];
  for (const candidate of lookupCandidates(pathname)) {
    const url = abs(candidate);
    for (const name of names) {
      const cache = await caches.open(name);
      const res = await cache.match(url, { ignoreSearch: navigate });
      if (res) return res;
    }
  }
  return null;
}

async function remember(request, response) {
  if (!response.ok || response.type !== 'basic') return;
  const cache = await caches.open(RUNTIME_CACHE);
  await cache.put(request, response);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - RUNTIME_MAX; i++) await cache.delete(keys[i]);
}

async function handle(event, url) {
  const { request } = event;
  const navigate = request.mode === 'navigate';
  const cached = await matchOwned(url.pathname, navigate);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    event.waitUntil(remember(navigate ? new Request(abs(url.pathname)) : request, res.clone()));
    return res;
  } catch (err) {
    if (navigate) {
      const offline = await caches.match(abs(`${BASE}${langOf(url.pathname, BASE)}/offline/`), {
        cacheName: SHELL_CACHE,
      });
      if (offline) return offline;
    }
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== ORIGIN || !url.pathname.startsWith(BASE)) return;
  if (url.pathname === `${BASE}sw.js`) return;
  event.respondWith(handle(event, url));
});

/* ------------------------------------------------------------------ messaggi */

async function status(course, lang) {
  const entries = MANIFEST.courses[course]?.[lang];
  if (!entries) return { state: 'unknown' };
  const name = courseCacheName(course, lang);
  const exists = (await caches.keys()).includes(name);
  return courseStatus(entries, exists ? ((await readMeta(name)) ?? {}) : null);
}

async function download(course, lang, port) {
  const entries = MANIFEST.courses[course]?.[lang];
  if (!entries) throw new Error('unknown');
  const name = courseCacheName(course, lang);
  const cache = await caches.open(name);
  const revs = (await readMeta(name)) ?? {};
  // La shell contiene già le risorse comuni: si scaricano solo quelle mancanti.
  const { fetch: todo } = diffEntries(entries, revs);
  const total = todo.reduce((s, e) => s + e[2], 0);
  let done = 0;
  port?.postMessage({ type: 'progress', done, total });
  await pool(todo, 4, async ([url, rev, size]) => {
    await cache.put(abs(url), await fetchFresh(url));
    revs[url] = rev;
    done += size;
    port?.postMessage({ type: 'progress', done, total });
  });
  for (const url of Object.keys(revs)) if (!entries.some((e) => e[0] === url)) delete revs[url];
  await writeMeta(name, revs);
}

self.addEventListener('message', (event) => {
  const data = event.data ?? {};
  const port = event.ports?.[0];
  const reply = (msg) => port?.postMessage(msg);
  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'VERSION':
      reply({ type: 'version', version: MANIFEST.version });
      break;
    case 'COURSE_STATUS':
      event.waitUntil(status(data.course, data.lang).then((s) => reply({ type: 'status', ...s })));
      break;
    case 'COURSE_DOWNLOAD':
      event.waitUntil(
        download(data.course, data.lang, port)
          .then(() => status(data.course, data.lang))
          .then((s) => reply({ type: 'done', ...s }))
          .catch((err) => reply({ type: 'error', message: String(err?.message ?? err) })),
      );
      break;
    case 'COURSE_REMOVE':
      event.waitUntil(
        (async () => {
          const name = courseCacheName(data.course, data.lang);
          await caches.delete(name);
          await writeMeta(name, null);
          reply({ type: 'status', ...(await status(data.course, data.lang)) });
        })(),
      );
      break;
    default:
      break;
  }
});
