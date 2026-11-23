/**
 * Intestazione delle pagine nel browser: la Content-Security-Policy non blocca nulla (isole,
 * ricerca con WebAssembly, simulatori, stampa), il colore della barra segue il tema e il corso,
 * `?q=` apre la ricerca (SearchAction dei dati strutturati), i link interni si precaricano.
 */
import { expect, test, type Page } from '@playwright/test';
import { BASE, SAMPLE_PAGES } from './pages';

/** Raccoglie le violazioni della CSP (evento `securitypolicyviolation`) dall'avvio della pagina. */
async function watchCsp(page: Page) {
  await page.addInitScript(() => {
    const list: string[] = [];
    (window as unknown as { __csp: string[] }).__csp = list;
    document.addEventListener('securitypolicyviolation', (e) =>
      list.push(`${e.violatedDirective} ${e.blockedURI} ${e.sample}`),
    );
  });
  return () => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
}

test.describe('Content-Security-Policy', () => {
  for (const sample of SAMPLE_PAGES)
    test(`nessuna violazione: ${sample.name}`, async ({ page }) => {
      const violations = await watchCsp(page);
      await page.goto(sample.path);
      await page.waitForLoadState('networkidle');
      // Isole client:visible: scorrere fino in fondo le idrata tutte.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForLoadState('networkidle');
      expect(await violations()).toEqual([]);
    });

  test('ricerca (Pagefind, WebAssembly) aperta da ?q= senza violazioni', async ({ page }) => {
    const violations = await watchCsp(page);
    await page.goto(`${BASE}it/?q=thevenin`);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('searchbox')).toHaveValue('thevenin');
    await expect(dialog.getByRole('link', { name: /Thevenin/ }).first()).toBeVisible();
    expect(await violations()).toEqual([]);
  });
});

test('colore della barra: sfondo del corso, aggiornato dall’interruttore del tema', async ({ page }) => {
  const themeColor = () => page.locator('meta[name="theme-color"]').getAttribute('content');
  await page.goto(`${BASE}it/`);
  await page.waitForLoadState('load');
  expect(await themeColor()).toBe('#05060c');
  await page.goto(`${BASE}it/anno-2/teoria-circuiti/`);
  await page.waitForLoadState('load');
  expect(await themeColor()).toBe('#0b1530');
  await page.locator('[data-theme-toggle]:visible').first().click();
  await expect.poll(themeColor).toBe('#f6f7fb');
  // Il tema chiaro salvato vale già prima del CSS, alla pagina successiva.
  await page.goto(`${BASE}it/chi-sono/`);
  await page.waitForLoadState('load');
  expect(await themeColor()).toBe('#f6f7fc');
});

test('prefetch dei link interni al passaggio del puntatore', async ({ page }) => {
  await page.goto(`${BASE}it/anno-2/teoria-circuiti/`);
  await page.waitForLoadState('networkidle');
  const target = page.locator('main a[href$="/teoria/"]:visible').first();
  const href = await target.getAttribute('href');
  const prefetched = page.waitForRequest((r) => new URL(r.url()).pathname === href);
  await target.hover();
  await prefetched;
});
