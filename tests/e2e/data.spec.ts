/**
 * Robustezza dei dati dell'utente sul sito vero (dist/): isola che lancia
 * (IslandBoundary), salvataggio impossibile, promemoria di backup, spazio usato.
 */
import { expect, test } from '@playwright/test';

const B = '/study-hub/';
const PROGRESS = `${B}it/anno-2/fisica-2/progressi/`;

test.describe('IslandBoundary', () => {
  test('un’isola che lancia mostra il ripiego e il resto della pagina funziona', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    // Il modulo dell'isola «data dell'esame» viene sostituito da uno che lancia al render.
    await page.route('**/_astro/ExamDatePicker.*.js', (route) =>
      route.fulfill({
        contentType: 'text/javascript',
        body: 'export default function Rotta() { throw new Error("isola rotta (test)"); }',
      }),
    );
    await page.goto(PROGRESS);
    const fallback = page.locator('[data-island-error]');
    await expect(fallback).toBeVisible();
    await expect(fallback).toHaveAttribute('role', 'alert');
    await expect(fallback).toContainText('Questa sezione non si è caricata');
    await expect(page.locator('[data-island-error]')).toHaveCount(1);
    await expect(fallback.getByRole('button', { name: 'Ricarica' })).toBeVisible();
    // Le altre isole della pagina si idratano normalmente.
    for (const name of ['StudyPlan', 'MasteryMap'])
      await expect(page.locator(`astro-island[component-url*="${name}"]`)).not.toHaveAttribute('ssr', /.*/);
    // Il resto della pagina risponde: interruttore del tema.
    const before = await page.locator('html').getAttribute('data-theme');
    await page.locator('[data-theme-toggle]').first().click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', before ?? 'dark');
    // L'errore non è sfuggito come eccezione non gestita.
    expect(errors).toEqual([]);
    // «Segnala errore» apre Contribuisci precompilato con pagina, corso e messaggio.
    await fallback.getByRole('link', { name: 'Segnala errore' }).click();
    await expect(page).toHaveURL(/\/it\/contribuisci\/\?tipo=errore/);
    await expect(page.locator('astro-island:has(.pf-cf)')).not.toHaveAttribute('ssr', /.*/);
    await expect(page.getByLabel('Pagina')).toHaveValue('/anno-2/fisica-2/progressi');
    await expect(page.getByLabel('Messaggio')).toHaveValue('isola rotta (test)');
  });
});

test.describe('salvataggio impossibile', () => {
  test('quota piena: un solo avviso con link a I miei dati', async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.setItem = function () {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      };
    });
    await page.goto(`${B}it/`);
    const toggle = page.locator('[data-theme-toggle]').first();
    await toggle.click();
    const notice = page.locator('.sh-notice');
    await expect(notice).toBeVisible();
    await expect(notice).toHaveAttribute('role', 'status');
    await expect(notice).toContainText('Impossibile salvare i progressi');
    await expect(notice.getByRole('link', { name: 'I miei dati' })).toHaveAttribute(
      'href',
      `${B}it/i-miei-dati/`,
    );
    // Altre scritture fallite non aggiungono avvisi; il tema cambia comunque.
    await toggle.click();
    await expect(page.locator('.sh-notice')).toHaveCount(1);
    await notice.getByRole('button', { name: 'Chiudi l’avviso' }).click();
    await expect(page.locator('.sh-notice')).toHaveCount(0);
  });

  test('in inglese l’avviso è in inglese', async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.setItem = function () {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      };
    });
    await page.goto(`${B}en/`);
    await page.locator('[data-theme-toggle]').first().click();
    await expect(page.locator('.sh-notice')).toContainText('Your progress cannot be saved');
    await expect(page.locator('.sh-notice a')).toHaveAttribute('href', `${B}en/i-miei-dati/`);
  });
});

test.describe('promemoria di backup', () => {
  test('ultimo export più vecchio di 30 giorni: avviso, la chiusura lo rimanda', async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem(
        'sh:v1:fisica-2:progress',
        JSON.stringify({ v: 1, exercises: {}, read: { a: 1 } }),
      );
      localStorage.setItem(
        'sh:v1:global:backup',
        JSON.stringify({ lastExport: Date.now() - 40 * 86_400_000 }),
      );
    });
    await page.goto(`${B}it/`);
    const notice = page.locator('.sh-notice[data-kind="backup"]');
    await expect(notice).toBeVisible({ timeout: 10_000 });
    await expect(notice).toContainText('da più di 30 giorni');
    await notice.getByRole('button', { name: 'Chiudi l’avviso' }).click();
    const state = await page.evaluate(() => JSON.parse(localStorage.getItem('sh:v1:global:backup') ?? '{}'));
    expect(state.snoozeUntil).toBeGreaterThan(Date.now() + 6 * 86_400_000);
    await page.reload();
    await page.waitForTimeout(3_500);
    await expect(page.locator('.sh-notice')).toHaveCount(0);
  });

  test('chi ha appena iniziato non vede il promemoria', async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        'sh:v1:fisica-2:progress',
        JSON.stringify({ v: 1, exercises: {}, read: { a: 1 } }),
      ),
    );
    await page.goto(`${B}it/`);
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('sh:v1:global:backup')), { timeout: 10_000 })
      .toMatch(/snoozeUntil/);
    await expect(page.locator('.sh-notice')).toHaveCount(0);
  });
});

test('I miei dati mostra lo spazio usato e l’ultimo export', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'sh:v1:fisica-2:notes',
      JSON.stringify({ v: 1, notes: { a: { text: 'x', createdAt: 1, updatedAt: 1 } } }),
    ),
  );
  await page.goto(`${B}it/i-miei-dati/`);
  const info = page.locator('[data-storage-info]');
  await expect(info).toContainText('Dati salvati');
  await expect(info).toContainText(/\d+ (B|KB)/);
  await expect(info).toContainText('Ultimo export');
  await expect(info).toContainText('Mai');
  await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Esporta in un file' }).click(),
  ]);
  await expect(info).not.toContainText('Mai');
});
