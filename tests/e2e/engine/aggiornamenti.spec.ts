/**
 * Recupero dopo una pubblicazione (build delle fixture servita da un server di prova).
 *
 * Simula il caso visto su iPad: il service worker serve una pagina vecchia dalla cache (rete
 * lenta), ma dopo la nuova pubblicazione i file JS che quella pagina chiede non esistono più.
 * La pagina deve accorgersene (version.json più recente), attivare il worker nuovo e
 * ricaricarsi una volta, senza riquadri d'errore.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, normalize, resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const B = '/study-hub/';
const PAGE = `${B}it/anno-1/esempio/progressi/`;
const DIST = resolve('dist-fixtures');
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
};
const TEXT = /\.(html|js|css|json|webmanifest)$/;
/** Build nuova: tutti i file con hash cambiano percorso (`_astro/v2/`), quelli vecchi spariscono. */
const NEW_COMMIT = 'f00dcaf';
const NEW_SW = 'f00dcaf00000';

interface Build {
  commit: string;
  date: string;
  sw: string;
}

interface Deploy {
  /** Pubblicazione nuova attiva. */
  v2: boolean;
  /** Ritarda di 4,5 s la prossima risposta HTML di questo percorso (rete lenta: il worker usa la cache). */
  slowOnce: string | null;
  /** Richieste a file con hash della build vecchia dopo la pubblicazione (risposte 404). */
  missing: string[];
}

function startServer(state: Deploy, v1: Build, v2date: string) {
  const rewrite = (text: string) =>
    text
      .replaceAll(`${B}_astro/`, `${B}_astro/v2/`)
      .replaceAll(v1.date, v2date)
      .replaceAll(v1.commit, NEW_COMMIT)
      // Versione del service worker (sw.js e version.json).
      .replaceAll(v1.sw, NEW_SW);
  return createServer((req, res) => {
    void (async () => {
      const url = new URL(req.url ?? '/', 'http://localhost');
      let path = decodeURIComponent(url.pathname);
      if (state.v2 && path.startsWith(`${B}_astro/`)) {
        if (!path.startsWith(`${B}_astro/v2/`)) {
          state.missing.push(path);
          res.writeHead(404).end();
          return;
        }
        path = path.replace('_astro/v2/', '_astro/');
      }
      const rel = normalize(path.slice(B.length)).replace(/^(\.\.[/\\])+/, '');
      let file = join(DIST, rel);
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
      if (!path.startsWith(B) || !existsSync(file)) {
        res.writeHead(404).end();
        return;
      }
      if (file.endsWith('.html') && state.slowOnce === url.pathname) {
        state.slowOnce = null;
        await new Promise((r) => setTimeout(r, 4500));
      }
      const type = TYPES[extname(file)] ?? 'application/octet-stream';
      let body: string | Buffer = readFileSync(file);
      if (state.v2 && TEXT.test(file)) body = rewrite(body.toString('utf8'));
      if (state.v2 && file.endsWith('version.json'))
        body = JSON.stringify({ commit: NEW_COMMIT, date: v2date, sw: NEW_SW });
      res.writeHead(200, {
        'content-type': type,
        'cache-control': path.includes('/_astro/') ? 'public, max-age=31536000, immutable' : 'no-cache',
      });
      res.end(body);
    })();
  }).listen(0);
}

test.describe('aggiornamenti', () => {
  test.use({ serviceWorkers: 'allow' });

  let server: Server;
  let origin: string;
  const state: Deploy = { v2: false, slowOnce: null, missing: [] };

  test.beforeAll(async () => {
    const v1 = JSON.parse(readFileSync(join(DIST, 'version.json'), 'utf8')) as Build;
    server = startServer(state, v1, new Date(Date.parse(v1.date) + 86_400_000).toISOString());
    await new Promise((r) => server.once('listening', r));
    origin = `http://localhost:${(server.address() as AddressInfo).port}`;
  });
  test.afterAll(() => new Promise<void>((r) => server.close(() => r())));

  test('pagina vecchia in cache e file spariti dal server: si ricarica da sola sulla versione nuova', async ({
    page,
  }) => {
    const islands = page.locator(
      'astro-island[component-url*="StudyPlan"], astro-island[component-url*="MasteryMap"]',
    );
    await page.goto(origin + PAGE);
    await expect(page.locator('html')).toHaveAttribute('data-sw', 'ready', { timeout: 20_000 });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 20_000 });
    // Seconda visita sotto il controllo del worker: pagina e file in cache.
    await page.reload();
    await expect(islands).toHaveCount(2);
    for (const island of await islands.all()) await expect(island).not.toHaveAttribute('ssr', /.*/);
    // La cache di passaggio ha un limite di voci: i file delle isole possono esserne usciti.
    await page.evaluate(async () => {
      for (const name of await caches.keys()) {
        const cache = await caches.open(name);
        for (const req of await cache.keys())
          if (/_astro\/(StudyPlan|MasteryMap|ExamDatePicker)\./.test(req.url)) await cache.delete(req);
      }
    });
    // …e dalla cache HTTP del browser (come su un dispositivo che non li ha mai scaricati).
    await (await page.context().newCDPSession(page)).send('Network.clearBrowserCache');

    // Pubblicazione nuova; la prossima pagina arriva lenta e il worker usa la copia in cache.
    state.v2 = true;
    state.slowOnce = PAGE;
    await page.goto(origin + PAGE);

    // Ricaricata sulla build nuova: footer, isole idratate, nessun riquadro d'errore.
    await expect(page.locator('[data-build]')).toContainText(NEW_COMMIT, { timeout: 30_000 });
    await expect(islands).toHaveCount(2);
    for (const island of await islands.all()) {
      await expect(island).toHaveAttribute('component-url', /_astro\/v2\//);
      await expect(island).not.toHaveAttribute('ssr', /.*/);
    }
    await expect(page.locator('[data-island-error]')).toHaveCount(0);
    // È passata davvero dalla pagina vecchia (file chiesti e non trovati) e si è ricaricata una volta.
    expect(state.missing.some((p) => /_astro\/(StudyPlan|MasteryMap|ExamDatePicker)\./.test(p))).toBe(true);
    expect(await page.evaluate(() => sessionStorage.getItem('sh:auto-reload'))).toBe(NEW_COMMIT);
    // Il worker attivo è quello nuovo.
    const version = await page.evaluate(
      () =>
        new Promise<string>((done) => {
          const ch = new MessageChannel();
          ch.port1.onmessage = (e) => done(e.data.version);
          navigator.serviceWorker.controller!.postMessage({ type: 'VERSION' }, [ch.port2]);
        }),
    );
    expect(version).toBe(NEW_SW);
  });
});
