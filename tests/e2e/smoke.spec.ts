import { expect, test } from '@playwright/test';
import { BASE } from './pages';

test.describe('radice e lingua', () => {
  test.use({ locale: 'en-US' });
  test('reindirizza alla lingua del browser (inglese)', async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveURL(`${BASE}en/`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
  });
});

test.describe('radice con lingua non supportata', () => {
  test.use({ locale: 'de-DE' });
  test('ripiega sull’italiano', async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveURL(`${BASE}it/`);
  });
});

test('la lingua scelta viene ricordata', async ({ page }) => {
  await page.goto(`${BASE}it/`);
  await page.locator('a[data-lang-switch="en"]').click();
  await expect(page).toHaveURL(`${BASE}en/`);
  await page.goto(BASE);
  await expect(page).toHaveURL(`${BASE}en/`);
});

test('hreflang e canonical presenti', async ({ page }) => {
  await page.goto(`${BASE}it/`);
  await expect(page.locator('link[rel="alternate"][hreflang="it-IT"]')).toHaveCount(1);
  await expect(page.locator('link[rel="alternate"][hreflang="en-US"]')).toHaveAttribute(
    'href',
    /\/study-hub\/en\/$/,
  );
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/study-hub\/it\/$/);
});

test('l’interruttore del tema cambia e ricorda il tema (scuro di default)', async ({ page }) => {
  // Scuro di default anche con il sistema in chiaro, come i siti originali.
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(`${BASE}it/`);
  const toggle = page.locator('[data-theme-toggle]');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(darkBg).toBe('rgb(5, 6, 12)');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).not.toBe(darkBg);
});

test('pagina 404 per indirizzi inesistenti', async ({ page }) => {
  const res = await page.goto(`${BASE}it/non-esiste/`);
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('nessun errore in console', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${BASE}en/`);
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});
