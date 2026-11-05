/**
 * Piattaforma sul corso finto (build delle fixture): home per chi torna, ricerca con
 * filtri e record di formule/esercizi, service worker (download del corso, uso offline,
 * pagina "sei offline", avviso di nuova versione).
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const B = '/study-hub/';
const C = `${B}it/anno-1/esempio/`;
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

test.describe('home', () => {
  test('mostra la preparazione solo a chi ha già dati di studio', async ({ page }) => {
    await page.goto(`${B}it/`);
    await expect(page.locator('.home-metrics')).toContainText('esercizi');
    await expect(page.getByRole('heading', { name: 'La tua preparazione' })).toBeHidden();
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
    await expect(page.getByRole('heading', { name: 'La tua preparazione' })).toBeVisible();
    await expect(page.locator('.pf-home-study__table tbody tr')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Legge di Ohm' })).toHaveAttribute(
      'href',
      `${B}it/anno-1/esempio/teoria/resistori/`,
    );
    await axe(page);
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
    await expect(links.first()).toHaveAttribute('href', /formulario\/#f-/);
    for (const href of await links.evaluateAll((els) => els.map((e) => e.getAttribute('href'))))
      expect(href).toContain('/formulario/#f-');
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

  test('scarica un corso, funziona senza rete e lo rimuove', async ({ page, context }) => {
    await page.goto(C);
    await expect(page.locator('html')).toHaveAttribute('data-sw', 'ready', { timeout: 20_000 });
    const box = page.locator('.pf-offline');
    await box.scrollIntoViewIfNeeded();
    const download = page.getByRole('button', { name: "Scarica per l'offline" });
    await expect(download).toBeVisible({ timeout: 15_000 });
    await expect(box).toContainText(/circa \d+/);
    await download.click();
    await expect(box).toHaveAttribute('data-state', 'complete', { timeout: 30_000 });
    await axe(page);

    await context.setOffline(true);
    await page.goto(`${C}teoria/`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Teoria');
    await page.goto(`${C}esercizi/resistori/`);
    await expect(page.locator('main')).toContainText(/Resistori|Ohm/);
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

    await context.setOffline(false);
    await page.goto(C);
    await page.locator('.pf-offline').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Rimuovi dal dispositivo' }).click();
    await expect(page.locator('.pf-offline')).toHaveAttribute('data-state', 'none');
  });

  test('avvisa quando c’è una nuova versione e aggiorna solo su richiesta', async ({ page, context }) => {
    await page.goto(`${B}it/`);
    await expect(page.locator('html')).toHaveAttribute('data-sw', 'ready', { timeout: 20_000 });
    // Simula una nuova pubblicazione: il server restituisce un sw.js diverso.
    await context.route(`**${B}sw.js`, async (route) => {
      const res = await route.fetch();
      const body = (await res.text()).replace(/"version":"[a-f0-9]+"/, '"version":"nuova-versione"');
      await route.fulfill({ response: res, body: `${body}\n// modificato dal test` });
    });
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
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
});
