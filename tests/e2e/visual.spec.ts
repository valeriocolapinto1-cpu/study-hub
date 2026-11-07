/**
 * Test visivi. Le baseline si generano SOLO in CI (container Playwright, stesso
 * Chromium e stessi font): workflow "Aggiorna baseline visive". Vedi docs/ARCHITECTURE.md.
 */
import { expect, test } from '@playwright/test';
import { SAMPLE_PAGES } from './pages';

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 800 },
];

for (const theme of ['light', 'dark'] as const) {
  for (const vp of VIEWPORTS) {
    for (const p of SAMPLE_PAGES.filter((s) => s.visual !== false)) {
      test(`${p.name} ${theme} ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
        await page.goto(p.path);
        await page.evaluate(() => document.fonts.ready);
        // Le isole client:visible (esercizi, appunti) si idratano quando entrano nella finestra e
        // aggiungono markup: si porta tutta la pagina in vista, si aspetta che siano idratate e si
        // torna alla finestra iniziale, così lo screenshot a pagina intera non cambia mentre si scatta.
        const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        await page.setViewportSize({ width: vp.width, height: Math.max(vp.height, fullHeight) });
        await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
        await page.waitForLoadState('networkidle');
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await expect(page).toHaveScreenshot(`${p.name}-${theme}-${vp.name}.png`, { fullPage: true });
      });
    }
  }
}
