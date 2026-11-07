/** Fisica 1: simulazioni (accessibilità, nessun errore) e simulazione dell'orale (flusso completo). */
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { BASE } from './pages';

const SIMS = `${BASE}en/anno-1/fisica-1/extra/simulazioni/`;
const ORALE = `${BASE}it/anno-1/fisica-1/extra/simulazione-orale/`;

for (const theme of ['light', 'dark'] as const) {
  test(`simulazioni: tutte montate, nessun errore, axe WCAG 2.2 AA (${theme})`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    await page.goto(SIMS);
    for (const s of await page.locator('.sim-section').all()) {
      await s.scrollIntoViewIfNeeded();
      await expect(s.locator('.sim')).toBeVisible();
    }
    expect(await page.locator('.sim canvas, .sim svg').count()).toBeGreaterThanOrEqual(8);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id),
    ).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('le pagine di teoria rimandano alla simulazione', async ({ page }) => {
  await page.goto(`${BASE}it/anno-1/fisica-1/teoria/risonanza/`);
  const link = page.getByRole('link', { name: /simulazione interattiva/ });
  await expect(link).toHaveAttribute('href', /extra\/simulazioni\/#sim-risonanza$/);
  // derivazione a passaggi rivelabili
  const step = page.locator('details#passo-1');
  await expect(step).not.toHaveAttribute('open', '');
  await step.locator('summary').click();
  await expect(step).toHaveAttribute('open', '');
});

test('simulazione dell’orale: estrazione, scaletta, autovalutazione, storico', async ({ page }) => {
  await page.goto(ORALE);
  await page.getByLabel(/Facile/).check();
  await page.getByRole('button', { name: /Estrai l’argomento/ }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  const items = page.locator('.oral__checklist li');
  const n = await items.count();
  expect(n).toBeGreaterThan(3);
  await items.first().locator('input').check();
  await page.getByRole('button', { name: /Ho finito/ }).click();
  const save = page.getByRole('button', { name: /Salva l’esito/ });
  await expect(save).toBeDisabled();
  for (let i = 0; i < n; i++) await page.locator(`input[name="vote-${i}"]`).nth(2).check({ force: true });
  await save.click();
  await expect(page.getByText(/Tempo di esposizione .*, media 2\.0\/3/)).toBeVisible();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('sh:v1:fisica-1:orale') ?? 'null'),
  );
  expect(stored.history).toHaveLength(1);
  expect(stored.mode).toBe('facile');
  await page.reload();
  await page.getByText('I tuoi ultimi esiti per argomento').click();
  await expect(page.locator('.oral__history li')).toHaveCount(1);
});
