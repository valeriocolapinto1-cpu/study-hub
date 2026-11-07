import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { SAMPLE_PAGES } from './pages';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const theme of ['light', 'dark'] as const) {
  for (const p of SAMPLE_PAGES) {
    test(`axe WCAG 2.2 AA: ${p.name} (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      // Scuro di default: il tema chiaro si attiva con la scelta salvata dall'interruttore.
      await page.addInitScript((t) => localStorage.setItem('sh:v1:global:theme', JSON.stringify(t)), theme);
      await page.goto(p.path);
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(
        serious.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
    });
  }
}
