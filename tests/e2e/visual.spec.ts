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
    for (const p of SAMPLE_PAGES.filter((x) => x.visual !== false)) {
      test(`${p.name} ${theme} ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
        await page.goto(p.path);
        await page.evaluate(() => document.fonts.ready);
        // Pagine lunghe (formulario, teoria): lo screenshot a pagina intera va ripetuto finché è stabile e
        // supera i 5 s predefiniti.
        await expect(page).toHaveScreenshot(`${p.name}-${theme}-${vp.name}.png`, {
          fullPage: true,
          timeout: 20_000,
        });
      });
    }
  }
}
