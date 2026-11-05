/** Comportamenti del sistema di design: menu mobile, lingua, pagine globali, segnalazioni. */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { BASE } from './pages';

test('il menu mobile si apre, si chiude con Esc e restituisce il focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}it/chi-sono/`);
  const toggle = page.locator('.menu-toggle');
  const menu = page.locator('#menu-mobile');
  await expect(menu).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(menu.getByRole('link', { name: 'Chi sono' })).toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('il cambio lingua resta sulla stessa pagina', async ({ page }) => {
  await page.goto(`${BASE}it/privacy/`);
  await page.locator('a[data-lang-switch="en"]').click();
  await expect(page).toHaveURL(`${BASE}en/privacy/`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
});

test('"Segnala un errore" porta a Contribuisci con la pagina precompilata', async ({ page }) => {
  await page.goto(`${BASE}it/stile/`);
  const link = page.locator('a.report-error').first();
  await expect(link).toHaveAttribute('href', /contribuisci\/\?pagina=%2Fstile&tipo=errore$/);
  await link.click();
  // Il modulo (isola) si precompila dalla query.
  await expect(page.getByLabel('Pagina')).toHaveValue('/stile');
  await expect(page.getByRole('radio', { name: 'Errore' })).toBeChecked();
});

test('le pagine di stampa e le icone dichiarate esistono', async ({ request }) => {
  for (const f of ['favicon.svg', 'apple-touch-icon.png', 'site.webmanifest', 'icon-512.png']) {
    expect((await request.get(`${BASE}${f}`)).status(), f).toBe(200);
  }
});

test('"Sapienza" compare solo nella pagina Chi sono', () => {
  const dist = resolve(import.meta.dirname, '../../dist');
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : [],
    );
  const found = walk(dist)
    .filter((f) => readFileSync(f, 'utf8').includes('Sapienza'))
    .map((f) => relative(dist, f).split('\\').join('/'))
    .sort();
  expect(found).toEqual(['en/chi-sono/index.html', 'it/chi-sono/index.html']);
});
