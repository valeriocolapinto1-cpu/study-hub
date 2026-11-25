/**
 * Piattaforma sul sito vero (dist/): pagina Contribuisci senza modulo configurato (R14), ricerca
 * globale. La pagina con il modulo (URL finto) si prova sulla build delle fixture
 * (tests/e2e/engine/platform.spec.ts).
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const B = '/study-hub/';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

test.describe('Contribuisci', () => {
  for (const [lang, soon, open] of [
    ['it', 'Modulo in arrivo', 'Apri il modulo'],
    ['en', 'Form coming soon', 'Open the form'],
  ] as const) {
    test(`senza formUrl (${lang}): nota «in arrivo», nessun pulsante, altri canali`, async ({ page }) => {
      const third: string[] = [];
      page.on(
        'request',
        (r) => /^https?:/.test(r.url()) && !r.url().startsWith('http://localhost') && third.push(r.url()),
      );
      // Arrivo da «Segnala un errore»: i parametri non cambiano la pagina.
      await page.goto(`${B}${lang}/contribuisci/?corso=fisica-1&pagina=%2Fchi-sono&tipo=errore`);
      await expect(page.getByRole('heading', { name: soon })).toBeVisible();
      await expect(page.getByRole('link', { name: open })).toHaveCount(0);
      await expect(page.locator('main a[href*="docs.google.com"]')).toHaveCount(0);
      await expect(page.locator('main a[href^="mailto:"]')).toHaveCount(1);
      await expect(page.locator('main a[href$="/issues/new"]')).toHaveCount(1);
      await page.waitForLoadState('networkidle');
      expect(third).toEqual([]);
      await axe(page);
    });
  }
});

test.describe('Ricerca', () => {
  test('si apre con "/" e Ctrl+K, cerca, naviga con le frecce e restituisce il focus', async ({ page }) => {
    await page.goto(`${B}it/`);
    await expect(page.locator('html')).toHaveAttribute('data-search', 'ready');
    const trigger = page.locator('[data-search-trigger]').first();
    await expect(trigger).toBeVisible();
    await page.keyboard.press('/');
    const input = page.getByRole('searchbox', { name: 'Cerca nel sito' });
    await expect(input).toBeFocused();
    await input.fill('privacy');
    await expect(page.locator('#pf-search-status')).toHaveText(/\d+ risultat/);
    const first = page.locator('.pf-search__link').first();
    await expect(first).toBeVisible();
    await input.press('ArrowDown');
    await expect(first).toBeFocused();
    await axe(page);
    await page.keyboard.press('Escape');
    await expect(input).toBeHidden();

    await trigger.click();
    await expect(input).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();

    await page.keyboard.press('Control+k');
    await expect(input).toBeFocused();
    // Pagefind, se una parola non c'è nell'indice, la accorcia finché trova un prefisso indicizzato:
    // con i corsi l'indice contiene parole di una lettera (z, x, Q…), quindi serve un testo che
    // non abbia nessun prefisso indicizzato.
    await input.fill('ŋŋŋŋŋŋ');
    await expect(page.locator('#pf-search-status')).toHaveText(/Nessun risultato/);
  });

  test('cerca nell’altra lingua solo se richiesto', async ({ page }) => {
    await page.goto(`${B}en/`);
    await page.keyboard.press('Control+k');
    const input = page.getByRole('searchbox', { name: 'Search the site' });
    await input.fill('ringraziamenti');
    await expect(page.locator('#pf-search-status')).toHaveText(/No results|result/);
    // Prima della scelta nessun risultato italiano (il conteggio totale non basta: con più
    // contenuti la prima pagina di risultati inglesi può essere già piena).
    await expect(page.locator('.pf-search__item[lang="it"]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Also in Italian' }).click();
    await expect(page.locator('.pf-search__item[lang="it"]').first()).toBeVisible();
  });
});
