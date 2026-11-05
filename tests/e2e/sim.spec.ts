/**
 * Kit dei simulatori: idratazione delle isole, interazioni da tastiera,
 * movimento ridotto e accessibilità della pagina demo (/stile/simulatori/).
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { BASE } from './pages';

const DEMO = `${BASE}it/stile/simulatori/`;
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Scorre la pagina per far idratare tutte le isole client:visible. */
async function hydrateAll(page: Page): Promise<void> {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 400) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(50);
  }
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
}

test('le isole si idratano senza errori in console', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(DEMO);
  await hydrateAll(page);
  expect(errors).toEqual([]);
  await expect(page.locator('canvas')).toHaveCount(3);
});

test('il cursore del filtro RC aggiorna la frequenza di taglio', async ({ page }) => {
  await page.goto(DEMO);
  const sec = page.locator('section[aria-labelledby="demo-rc"]');
  await sec.scrollIntoViewIfNeeded();
  await expect(sec.locator('xpath=ancestor::astro-island')).not.toHaveAttribute('ssr', '');
  await expect(sec).toContainText('1,59 kHz');
  const r = sec.getByLabel('Resistenza R');
  await r.focus();
  for (let i = 0; i < 100; i++) await page.keyboard.press('ArrowRight');
  await expect(sec).not.toContainText('1,59 kHz');
});

test('cursore del grafico con la tastiera e lettura dei valori', async ({ page }) => {
  await page.goto(DEMO);
  const sec = page.locator('section[aria-labelledby="demo-rlc"]');
  await sec.scrollIntoViewIfNeeded();
  await expect(sec.locator('xpath=ancestor::astro-island')).not.toHaveAttribute('ssr', '');
  const area = sec.locator('.sim-plot__area');
  await area.focus();
  await page.keyboard.press('End');
  await expect(sec.locator('.sim-readout')).toContainText('Tempo t = 10 ms');
  await expect(sec.locator('.sim-readout')).toContainText('vC(t) = 1');
});

test('movimento ridotto: le animazioni partono ferme e si avviano a richiesta', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(DEMO);
  const sec = page.locator('section[aria-labelledby="demo-osc"]');
  await sec.scrollIntoViewIfNeeded();
  const play = sec.getByRole('button', { name: 'Avvia' });
  await expect(play).toHaveAttribute('aria-pressed', 'false');
  await expect(sec.locator('.sim-note').last()).toContainText('movimento ridotto');
  await play.click();
  await expect(sec.getByRole('button', { name: 'Pausa' })).toHaveAttribute('aria-pressed', 'true');
});

test('la tabella dei dati è un’alternativa accessibile al grafico', async ({ page }) => {
  await page.goto(DEMO);
  const sec = page.locator('section[aria-labelledby="demo-rc"]');
  await sec.scrollIntoViewIfNeeded();
  await sec.locator('summary').first().click();
  await expect(sec.locator('table').first()).toBeVisible();
  expect(await sec.locator('table').first().locator('tbody tr').count()).toBeGreaterThan(10);
});

test('pagina degli schemi: nessuna isola, ogni schema ha titolo e descrizione', async ({ page }) => {
  await page.goto(`${BASE}it/stile/circuiti/`);
  await expect(page.locator('astro-island')).toHaveCount(0);
  const svgs = page.locator('svg.circuit');
  expect(await svgs.count()).toBeGreaterThan(10);
  for (const svg of await svgs.all()) {
    await expect(svg.locator('title')).toHaveCount(1);
    await expect(svg.locator('desc')).not.toBeEmpty();
  }
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

for (const theme of ['light', 'dark'] as const) {
  test(`axe WCAG 2.2 AA sulle simulazioni idratate (${theme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto(DEMO);
    await hydrateAll(page);
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(
      serious.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    ).toEqual([]);
  });
}
