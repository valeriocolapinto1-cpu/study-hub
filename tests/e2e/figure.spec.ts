/**
 * Kit delle figure (/stile/figure/): figure statiche accessibili senza JavaScript,
 * varianti interattive che si idratano e ridisegnano la figura con i comandi.
 */
import { expect, test } from '@playwright/test';
import { BASE } from './pages';

const PAGE = `${BASE}it/stile/figure/`;

test('figure statiche: SVG accessibili, nessun JavaScript prima delle isole', async ({ page }) => {
  await page.goto(PAGE);
  const figs = page.locator('.diagram-figure svg[role="img"]');
  expect(await figs.count()).toBeGreaterThanOrEqual(21);
  // ogni figura ha titolo e descrizione collegati
  const missing = await figs.evaluateAll(
    (els) =>
      els.filter((el) => {
        const ids = (el.getAttribute('aria-labelledby') ?? '').split(' ');
        return ids.length !== 2 || ids.some((id) => !document.getElementById(id)?.textContent?.trim());
      }).length,
  );
  expect(missing).toBe(0);
  // id unici nella pagina
  const dup = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
    return ids.filter((id, i) => ids.indexOf(id) !== i);
  });
  expect(dup).toEqual([]);
});

test('le varianti interattive si idratano e rispondono ai comandi', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(PAGE);
  const sec = page.locator('section[aria-labelledby="live-incline"]');
  await sec.scrollIntoViewIfNeeded();
  await expect(sec.locator('xpath=ancestor::astro-island')).not.toHaveAttribute('ssr', '');
  await expect(sec.locator('.sim-readout')).toContainText('3,21 m/s²');
  const before = await sec.locator('svg').innerHTML();
  const angle = sec.getByLabel('Inclinazione θ');
  await angle.focus();
  for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
  await expect(sec.locator('.sim-readout')).toContainText('4,80 m/s²');
  expect(await sec.locator('svg').innerHTML()).not.toBe(before);
  // con attrito alto il blocco resta fermo
  const mu = sec.getByLabel("Coefficiente d'attrito μ");
  await mu.focus();
  await page.keyboard.press('End');
  await expect(sec.locator('.sim-readout')).toContainText('resta fermo');

  const carnot = page.locator('section[aria-labelledby="live-carnot"]');
  await carnot.scrollIntoViewIfNeeded();
  await expect(carnot.locator('.sim-readout')).toContainText('30 %');
  expect(errors).toEqual([]);
});
