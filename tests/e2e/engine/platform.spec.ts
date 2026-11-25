/**
 * Piattaforma sul corso finto (build delle fixture): Contribuisci con un modulo finto, home per
 * chi torna, ricerca con filtri e record di formule/esercizi, service worker (download del corso, uso offline,
 * pagina "sei offline", avviso di nuova versione, pagine sempre dalla rete, "Aggiorna il sito").
 */
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const B = '/study-hub/';
const C = `${B}it/anno-1/esempio/`;
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

test.describe('Contribuisci con il modulo configurato (R14)', () => {
  test('un solo pulsante «Apri il modulo» in una nuova scheda, con la nota privacy', async ({ page }) => {
    const third: string[] = [];
    page.on(
      'request',
      (r) => /^https?:/.test(r.url()) && !r.url().startsWith('http://localhost') && third.push(r.url()),
    );
    await page.goto(`${B}it/contribuisci/`);
    const open = page.getByRole('link', { name: /^Apri il modulo/ });
    await expect(open).toHaveCount(1);
    await expect(open).toHaveAttribute('href', 'https://docs.google.com/forms/d/e/finto/viewform');
    await expect(open).toHaveAttribute('target', '_blank');
    await expect(open).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(open).toHaveAccessibleName('Apri il modulo (si apre in una nuova scheda)');
    await expect(page.locator('main .btn--primary')).toHaveCount(1);
    await expect(page.getByText('Le risposte vanno a Google Forms')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Modulo in arrivo' })).toHaveCount(0);
    await page.waitForLoadState('networkidle');
    // È solo un link: la pagina non contatta Google.
    expect(third).toEqual([]);
    await axe(page);

    await page.goto(`${B}en/contribuisci/`);
    await expect(page.getByRole('link', { name: /^Open the form/ })).toHaveAttribute('target', '_blank');
    await expect(page.getByText('Answers go to Google Forms')).toBeVisible();
    await axe(page);
  });
});

test.describe('home', () => {
  test('mostra la preparazione solo a chi ha già dati di studio', async ({ page }) => {
    await page.goto(`${B}it/`);
    await expect(page.locator('.home-metrics')).toContainText('esercizi');
    await expect(page.getByRole('heading', { name: 'Riprendi da dove eri' })).toBeHidden();
    await page.evaluate(() => {
      const now = Date.now();
      localStorage.setItem(
        'sh:v1:esempio:notes',
        JSON.stringify({
          v: 1,
          notes: {
            'teoria/resistori/p1': {
              text: 'Verso convenzionale della corrente.',
              createdAt: now,
              updatedAt: now,
              page: 'anno-1/esempio/teoria/resistori',
              label: 'Legge di Ohm',
            },
          },
        }),
      );
    });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Riprendi da dove eri' })).toBeVisible();
    await expect(page.locator('.pf-home-study__table tbody tr')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Legge di Ohm' })).toHaveAttribute(
      'href',
      `${B}it/anno-1/esempio/teoria/resistori/`,
    );
    await expect(page.getByText('Apri una pagina di teoria o di esercizi')).toBeVisible();
    await axe(page);
  });

  test('«Riprendi da dove eri»: l’ultima pagina di studio aperta', async ({ page }) => {
    await page.goto(`${B}it/anno-1/esempio/teoria/resistori/`);
    const title = (await page.locator('h1').textContent())!.trim();
    await page.goto(`${B}it/`);
    await expect(page.getByRole('heading', { name: 'Riprendi da dove eri' })).toBeVisible();
    await expect(page.locator('.pf-stat--resume a')).toHaveText(title);
    await expect(page.locator('.pf-stat--resume a')).toHaveAttribute(
      'href',
      `${B}it/anno-1/esempio/teoria/resistori/`,
    );
  });
});

test.describe('ricerca', () => {
  test('filtra per corso e tipo e trova formule ed esercizi', async ({ page }) => {
    await page.goto(`${B}it/`);
    await page.keyboard.press('Control+k');
    const input = page.getByRole('searchbox', { name: 'Cerca nel sito' });
    await input.fill('ohm');
    await expect(page.locator('#pf-search-status')).toHaveText(/\d+ risultat/);
    await page.getByRole('button', { name: 'Formule' }).click();
    await expect(page.getByRole('button', { name: 'Formule' })).toHaveAttribute('aria-pressed', 'true');
    const links = page.locator('.pf-search__results > li > a.pf-search__link');
    await expect(links.first()).toHaveAttribute('href', /formulario\/[a-z0-9-]+\/#f-/);
    for (const href of await links.evaluateAll((els) => els.map((e) => e.getAttribute('href'))))
      expect(href).toMatch(/\/formulario\/[a-z0-9-]+\/#f-/);
    await page.getByRole('button', { name: 'Formule' }).click();
    await page.getByRole('button', { name: 'Esercizi' }).click();
    await expect(links.first()).toHaveAttribute('href', /esercizi\/[a-z0-9-]+\/#/);
    await page.getByRole('combobox').selectOption('esempio');
    await expect(links.first()).toBeVisible();
    await axe(page);
  });
});

test.describe('offline', () => {
  test.use({ serviceWorkers: 'allow' });
  // Il secondo test modifica dist-fixtures/sw.js: niente esecuzione in parallelo.
  test.describe.configure({ mode: 'serial' });

  test('scarica un corso, funziona senza rete e lo rimuove', async ({ page, context }) => {
    // Ripasso offline: carte nuove solo degli argomenti studiati (R13), segnati due giorni fa.
    await page.addInitScript(() => {
      const at = Date.now() - 2 * 86_400_000;
      localStorage.setItem('sh:v1:esempio:studied', JSON.stringify({ v: 1, topics: { resistori: at } }));
    });
    await page.goto(C);
    await expect(page.locator('html')).toHaveAttribute('data-sw', 'ready', { timeout: 20_000 });
    const box = page.locator('.pf-offline');
    await box.scrollIntoViewIfNeeded();
    const download = page.getByRole('button', { name: "Scarica per l'offline" });
    await expect(download).toBeVisible({ timeout: 15_000 });
    await expect(box).toContainText(/circa \d+/);
    // Prima installazione leggera: l'indice di ricerca non è nella shell, arriva con il corso.
    const shellSearch = () =>
      page.evaluate(
        async () =>
          (await (await caches.open('sh-shell')).keys()).filter((r) => r.url.includes('/pagefind/')).length,
      );
    expect(await shellSearch()).toBe(0);
    await download.click();
    await expect(box).toHaveAttribute('data-state', 'complete', { timeout: 30_000 });
    await axe(page);

    await context.setOffline(true);
    await page.goto(`${C}teoria/`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Teoria');
    await page.goto(`${C}esercizi/resistori/`);
    await expect(page.locator('main')).toContainText(/Resistori|Ohm/);
    // Dati divisi: i passi della soluzione arrivano da dati/<argomento>.json, in cache con il corso.
    const div = page.locator('article#partitore');
    await div.scrollIntoViewIfNeeded();
    await expect(page.locator('astro-island:has(article#partitore)')).not.toHaveAttribute('ssr', /.*/);
    await div.getByRole('button', { name: 'Mostra tutta la soluzione' }).click();
    await expect(div.locator('.sh-step')).toHaveCount(3);
    // Ripasso: indice nelle props, fronte della carta da dati/<argomento>.json.
    await page.goto(`${C}ripasso/`);
    await expect(page.getByRole('button', { name: 'Mostra la risposta' })).toBeVisible();
    await expect(page.locator('.sh-flashcard .prose').first()).not.toBeEmpty();
    await page.goto(`${B}it/chi-sono/`);
    await expect(page).toHaveTitle(/Chi sono/);
    // Pagina del corso nell'altra lingua: non scaricata.
    await page.goto(`${B}en/anno-1/esempio/teoria/`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('You are offline');
    await page.goto(`${B}it/anno-1/esempio/inesistente/`).catch(() => undefined);
    await page.goto(`${B}it/offline/`);
    await expect(page.getByRole('link', { name: "Corso d'esempio" })).toBeVisible();
    // Ricerca offline.
    await page.goto(`${B}it/`);
    await page.keyboard.press('Control+k');
    await page.getByRole('searchbox', { name: 'Cerca nel sito' }).fill('ohm');
    await expect(page.locator('#pf-search-status')).toHaveText(/\d+ risultat/);
    // Dettagli dai frammenti scaricati con il corso.
    await expect(page.locator('a.pf-search__link').first()).toHaveAttribute(
      'href',
      /\/it\/anno-1\/esempio\//,
    );

    await context.setOffline(false);
    await page.goto(C);
    await page.locator('.pf-offline').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Rimuovi dal dispositivo' }).click();
    await expect(page.locator('.pf-offline')).toHaveAttribute('data-state', 'none');
  });

  test('avvisa quando c’è una nuova versione e aggiorna solo su richiesta', async ({ page }) => {
    await page.goto(`${B}it/`);
    await expect(page.locator('html')).toHaveAttribute('data-sw', 'ready', { timeout: 20_000 });
    // «ready» = worker attivo; la pagina passa sotto il suo controllo solo dopo clients.claim().
    // L'avviso compare solo per le pagine controllate: senza attesa, su macchine lente, il nuovo
    // worker può installarsi prima del claim e l'avviso non viene mai mostrato.
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 20_000 });
    // Simula una nuova pubblicazione: sw.js con un'altra versione sul server.
    const file = 'dist-fixtures/sw.js';
    const original = readFileSync(file, 'utf8');
    test.info().attach('sw-originale', { body: original.slice(0, 120) });
    writeFileSync(file, original.replace(/"version":"[a-f0-9]+"/, '"version":"nuova-versione"'));
    try {
      await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
    } finally {
      writeFileSync(file, original);
    }
    const toast = page.locator('[data-pwa-update]');
    await expect(toast).toBeVisible({ timeout: 20_000 });
    await expect(toast).toContainText('Nuova versione disponibile');
    await Promise.all([page.waitForEvent('load'), toast.getByRole('button', { name: 'Aggiorna' }).click()]);
    const version = await page.evaluate(
      () =>
        new Promise<string>((resolve) => {
          const ch = new MessageChannel();
          ch.port1.onmessage = (e) => resolve(e.data.version);
          navigator.serviceWorker.controller!.postMessage({ type: 'VERSION' }, [ch.port2]);
        }),
    );
    expect(version).toBe('nuova-versione');
  });

  test('dopo una pubblicazione la navigazione riceve subito l’HTML nuovo', async ({ page }) => {
    const path = `${B}it/chi-sono/`;
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('data-sw', 'ready', { timeout: 20_000 });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 20_000 });
    // La pagina è nella shell in precache: con il vecchio cache-first resterebbe quella vecchia.
    expect(
      await page.evaluate(async (u) => !!(await caches.match(new URL(u, location.href).href)), path),
    ).toBe(true);
    const file = 'dist-fixtures/it/chi-sono/index.html';
    const original = readFileSync(file, 'utf8');
    writeFileSync(file, original.replace('<title>', '<title>Pubblicazione nuova · '));
    try {
      await page.goto(path);
      await expect(page).toHaveTitle(/^Pubblicazione nuova · /);
      expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    } finally {
      writeFileSync(file, original);
    }
  });

  test('manifest non scaricabile: l’installazione fallisce e resta il worker in uso', async ({ page }) => {
    await page.goto(`${B}it/`);
    await expect(page.locator('html')).toHaveAttribute('data-sw', 'ready', { timeout: 20_000 });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 20_000 });
    const swVersion = () =>
      page.evaluate(
        () =>
          new Promise<string>((resolve) => {
            const ch = new MessageChannel();
            ch.port1.onmessage = (e) => resolve(e.data.version);
            navigator.serviceWorker.controller!.postMessage({ type: 'VERSION' }, [ch.port2]);
          }),
      );
    const before = await swVersion();
    // Pubblicazione con il manifest mancante: sw.js nuovo che rimanda a un file inesistente.
    const file = 'dist-fixtures/sw.js';
    const original = readFileSync(file, 'utf8');
    writeFileSync(
      file,
      original
        .replace(/"version":"[a-f0-9]+"/, '"version":"senza-manifest"')
        .replace(/sw-manifest\.[a-f0-9]+\.json/, 'sw-manifest.mancante.json'),
    );
    try {
      const outcome = await page.evaluate(async () => {
        const reg = (await navigator.serviceWorker.getRegistration())!;
        await reg.update();
        const w = reg.installing;
        if (w && w.state !== 'redundant')
          await new Promise<void>((resolve) =>
            w.addEventListener('statechange', () => {
              if (w.state === 'redundant' || w.state === 'installed' || w.state === 'activated') resolve();
            }),
          );
        return { state: w?.state ?? null, waiting: !!reg.waiting };
      });
      expect(outcome.waiting).toBe(false);
      if (outcome.state) expect(outcome.state).toBe('redundant');
    } finally {
      writeFileSync(file, original);
    }
    expect(await swVersion()).toBe(before);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-sw', 'ready', { timeout: 20_000 });
  });

  test('version.json più recente: avviso di aggiornamento', async ({ page }) => {
    await page.goto(`${B}it/`);
    await expect(page.locator('html')).toHaveAttribute('data-sw', 'ready', { timeout: 20_000 });
    await expect(page.locator('[data-build]')).toContainText(/Versione \w{3,7} · \d{4}-\d{2}-\d{2}/);
    await expect(page.locator('[data-pwa-update]')).toHaveCount(0);
    const file = 'dist-fixtures/version.json';
    const original = readFileSync(file, 'utf8');
    writeFileSync(file, JSON.stringify({ commit: 'fffffff', date: '2999-01-01T00:00:00.000Z', sw: 'x' }));
    try {
      await page.reload();
      const toast = page.locator('[data-pwa-update]');
      await expect(toast).toBeVisible({ timeout: 20_000 });
      await expect(toast).toContainText('Nuova versione disponibile');
    } finally {
      writeFileSync(file, original);
    }
  });

  test('"Aggiorna il sito" salva un backup, svuota la cache e conserva i dati', async ({ page }) => {
    await page.goto(`${B}it/i-miei-dati/`);
    await expect(page.locator('html')).toHaveAttribute('data-sw', 'ready', { timeout: 20_000 });
    await page.evaluate(() => {
      localStorage.setItem('sh:v1:esempio:progress', JSON.stringify({ x: { solved: true } }));
      localStorage.setItem('sh:v1:global:prova-aggiorna', '"resta"');
    });
    const before = await page.evaluate(() => localStorage.length);
    expect(await page.evaluate(async () => (await caches.keys()).length)).toBeGreaterThan(0);
    const section = page.locator('[data-refresh-site]');
    await section.scrollIntoViewIfNeeded();
    await axe(page);
    page.once('dialog', (d) => void d.accept());
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.waitForEvent('load'),
      section.getByRole('button', { name: 'Aggiorna il sito' }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    expect(await page.evaluate(() => localStorage.getItem('sh:v1:global:prova-aggiorna'))).toBe('"resta"');
    expect(await page.evaluate(() => localStorage.getItem('sh:v1:esempio:progress'))).toContain('solved');
    // Unica chiave in più: la data del backup appena scaricato (promemoria di backup).
    expect(await page.evaluate(() => localStorage.length)).toBe(before + 1);
    expect(await page.evaluate(() => localStorage.getItem('sh:v1:global:backup'))).toMatch(
      /^\{"lastExport":\d+\}$/,
    );
  });
});
