/* Service worker (PWA offline, opzionale). La lista dei file è generata da tools/build-sw.mjs: non modificarla a mano. */
const VERSION = 'tdc-1bd70f2fdb';
const FILES = [
 "./",
 "./404.html",
 "./appunti/index.html",
 "./archivio/index.html",
 "./assets/css/style.css",
 "./assets/icon.svg",
 "./assets/js/app.js",
 "./assets/js/complex.js",
 "./assets/js/exam.js",
 "./assets/js/explain.js",
 "./assets/js/formulario.js",
 "./assets/js/generator.js",
 "./assets/js/grader/ai-adapter.js",
 "./assets/js/grader/exercise.js",
 "./assets/js/grader/expr.js",
 "./assets/js/grader/rubric.js",
 "./assets/js/katex.js",
 "./assets/js/metrics.js",
 "./assets/js/notes.js",
 "./assets/js/pages/appelli.js",
 "./assets/js/pages/appunti.js",
 "./assets/js/pages/archivio.js",
 "./assets/js/pages/corso.js",
 "./assets/js/pages/esame.js",
 "./assets/js/pages/esercizi.js",
 "./assets/js/pages/faq.js",
 "./assets/js/pages/formulario.js",
 "./assets/js/pages/home.js",
 "./assets/js/pages/impostazioni.js",
 "./assets/js/pages/piano.js",
 "./assets/js/pages/programma.js",
 "./assets/js/pages/progresso.js",
 "./assets/js/pages/prova.js",
 "./assets/js/pages/quiz.js",
 "./assets/js/pages/risorse.js",
 "./assets/js/pages/simulatori.js",
 "./assets/js/pages/studio.js",
 "./assets/js/pages/teoria.js",
 "./assets/js/plan.js",
 "./assets/js/print.js",
 "./assets/js/problems.js",
 "./assets/js/progress.js",
 "./assets/js/rational.js",
 "./assets/js/rng.js",
 "./assets/js/solver/exercise.js",
 "./assets/js/solver/linalg.js",
 "./assets/js/solver/mna.js",
 "./assets/js/solver/netlist.js",
 "./assets/js/solver/network.js",
 "./assets/js/solver/simulator.js",
 "./assets/js/spice.js",
 "./assets/js/srs.js",
 "./assets/js/stats.js",
 "./assets/js/storage.js",
 "./assets/js/svg/render.js",
 "./assets/js/svg/symbols.js",
 "./assets/js/templates/common.js",
 "./assets/js/templates/index.js",
 "./assets/js/templates/templateA.js",
 "./assets/js/templates/templateB.js",
 "./assets/js/templates/templateC.js",
 "./assets/js/ui.js",
 "./corso/index.html",
 "./data/appelli.json",
 "./data/archivio.json",
 "./data/errori.json",
 "./data/formulario.json",
 "./data/quiz.json",
 "./data/risorse.json",
 "./data/studio/I-01.json",
 "./data/studio/I-02.json",
 "./data/studio/I-03.json",
 "./data/studio/I-04.json",
 "./data/studio/I-05.json",
 "./data/studio/I-06.json",
 "./data/studio/I-07.json",
 "./data/studio/I-08.json",
 "./data/studio/I-09.json",
 "./data/studio/II-01.json",
 "./data/studio/II-02.json",
 "./data/studio/II-03.json",
 "./data/studio/II-04.json",
 "./data/studio/II-05.json",
 "./data/studio/II-06.json",
 "./data/studio/II-07.json",
 "./data/studio/II-08.json",
 "./data/studio/III-01.json",
 "./data/studio/III-02.json",
 "./data/studio/III-03.json",
 "./data/studio/III-04.json",
 "./data/studio/III-05.json",
 "./data/studio/III-06.json",
 "./data/studio/III-07.json",
 "./data/studio/III-08.json",
 "./data/studio/IV-01.json",
 "./data/studio/IV-02.json",
 "./data/studio/IV-03.json",
 "./data/studio/IV-04.json",
 "./data/studio/IV-05.json",
 "./data/studio/IV-06.json",
 "./data/studio/IV-07.json",
 "./data/studio/V-01.json",
 "./data/studio/V-02.json",
 "./data/studio/V-03.json",
 "./data/studio/V-04.json",
 "./data/studio/V-05.json",
 "./data/studio/V-06.json",
 "./data/studio/V-07.json",
 "./data/studio/V-08.json",
 "./data/studio/VI-01.json",
 "./data/studio/VI-02.json",
 "./data/studio/VI-03.json",
 "./data/studio/VI-04.json",
 "./data/studio/VI-05.json",
 "./data/studio/VI-06.json",
 "./data/studio/VI-07.json",
 "./data/studio/VI-08.json",
 "./data/studio/VI-09.json",
 "./data/syllabus.json",
 "./data/teoria.json",
 "./esame/index.html",
 "./esercizi/index.html",
 "./faq/index.html",
 "./formulario/index.html",
 "./impostazioni/index.html",
 "./index.html",
 "./manifest.webmanifest",
 "./piano/index.html",
 "./programma/index.html",
 "./progresso/index.html",
 "./prova/index.html",
 "./quiz/index.html",
 "./risorse/index.html",
 "./simulatori/index.html",
 "./studio/index.html",
 "./teoria/index.html"
];
const CDN = ['https://cdnjs.cloudflare.com/'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    // ogni file è messo in cache singolarmente: un file mancante non deve far fallire l'installazione
    await Promise.all(FILES.map((f) => c.add(new Request(f, { cache: 'reload' })).catch(() => null)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('tdc-') && k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const same = url.origin === self.location.origin;
  const cdn = CDN.some((p) => req.url.startsWith(p));
  if (!same && !cdn) return; // chiamate ai provider AI e altri siti: mai intercettate né messe in cache
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const hit = await c.match(req, { ignoreSearch: same });
    const net = fetch(req).then((r) => { if (r && r.ok && (same || cdn)) c.put(req, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; } // cache prima, aggiornamento in background
    const r = await net;
    if (r) return r;
    if (req.mode === 'navigate') { const idx = await c.match(new URL('index.html', self.registration.scope).href); if (idx) return idx; }
    return new Response('Contenuto non disponibile offline.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  })());
});
