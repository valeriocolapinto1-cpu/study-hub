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
      // Le formule che scorrono diventano focusabili quando la loro larghezza è definitiva
      // (font caricati, ResizeObserver eseguito; nei formulari anche le voci fuori schermo,
      // misurate nei momenti liberi: `data-math-scroll="ready"`): si analizza la pagina in quello stato.
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      });
      await page.waitForFunction(() => document.documentElement.dataset.mathScroll === 'ready');
      // content-visibility: auto (voci dei formulari): finché una voce fuori schermo non è mai
      // stata disegnata ha l'altezza stimata e il suo contenuto può uscirne, quindi axe
      // misurerebbe sovrapposizioni che nessuno vede. Come nei test visivi, si porta tutta la
      // pagina in vista una volta (le altezze reali restano ricordate da `auto`) e si torna alla
      // finestra iniziale: axe analizza la geometria vera della pagina.
      const viewport = page.viewportSize()!;
      for (let last = 0, h = 1; h !== last;) {
        last = h;
        h = await page.evaluate(() => document.documentElement.scrollHeight);
        await page.setViewportSize({ width: viewport.width, height: Math.max(viewport.height, h) });
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      }
      await page.setViewportSize(viewport);
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(
        serious.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
    });
  }
}
