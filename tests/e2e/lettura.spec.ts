/**
 * Revisione di lettura: le pagine si presentano in modo più compatto ma non perdono contenuti.
 * - il testo visibile di ogni pagina campione contiene tutte le frasi di prima (`lettura/frasi.json`,
 *   estratto dalla build di partenza con tools/lettura-frasi.mjs);
 * - nessun blocco <details> chiuso in più;
 * - a 390 px panoramica e indice degli esercizi sono almeno del 40 % più corti;
 * - un solo indice degli argomenti nel DOM della teoria;
 * - nessun TeX grezzo (`$…$`) visibile fuori da KaTeX, né nella meta description.
 */
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { BASE } from './pages';
import { PAGINE_LETTURA, normalizza, righeVisibili, sciolto, testoUnito } from './lettura/testo';

const FRASI = JSON.parse(readFileSync(new URL('./lettura/frasi.json', import.meta.url), 'utf8')) as Record<
  string,
  { chiusi: number; frasi: string[] }
>;

for (const p of PAGINE_LETTURA) {
  test(`contenuti invariati: ${p.name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' });
    const prima = FRASI[p.name]!;
    expect(await page.locator('main details:not([open])').count()).toBeLessThanOrEqual(prima.chiusi);
    const righe = await righeVisibili(page);
    const testo = testoUnito(righe);
    const testoSciolto = sciolto(righe.join(' '));
    // Le frasi con matematica scritta in chiaro (titoli degli esercizi: «50\,\mathrm{Hz}», «b-n+1») ora sono
    // rese come testo («50 Hz», «b−n+1»): se il confronto esatto non basta, si confrontano lettere e cifre.
    const mancanti = prima.frasi.filter(
      (f) => !testo.includes(normalizza(f)) && !testoSciolto.includes(sciolto(f)),
    );
    expect(mancanti).toEqual([]);
  });

  test(`nessun TeX grezzo: ${p.name}`, async ({ page }) => {
    await page.goto(`${BASE}${p.path}`);
    const grezzi = await page.evaluate(() => {
      const out: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const el = n.parentElement;
        if (!el || el.closest('.katex, script, style, template, code, pre')) continue;
        if (/\$[^$\s][^$]*\$/.test(n.textContent ?? '')) out.push(n.textContent!.trim().slice(0, 80));
      }
      const meta = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
      if (/\$[^$]+\$|\\[a-z]+|[_^]\{/.test(meta)) out.push(`meta: ${meta}`);
      return out;
    });
    expect(grezzi).toEqual([]);
  });
}

/** Altezze a 390 px della build di partenza (main abc2664, misurate con Chromium, finestra 390×844). */
const ALTEZZE_PRIMA = {
  'it/anno-2/teoria-circuiti/': 12_968,
  'it/anno-2/teoria-circuiti/esercizi/': 36_802,
} as const;

test.describe('telefono (390 px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const [path, prima] of Object.entries(ALTEZZE_PRIMA)) {
    test(`almeno 40 % più corta: ${path}`, async ({ page }) => {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      expect(h).toBeLessThanOrEqual(Math.round(prima * 0.6));
      // niente scorrimento orizzontale della pagina
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    });
  }

  test('teoria: un solo indice degli argomenti nel DOM', async ({ page }) => {
    await page.goto(`${BASE}it/anno-2/teoria-circuiti/teoria/teorema-di-thevenin/`);
    await expect(page.locator('.topic-nav')).toHaveCount(1);
    await expect(page.locator('.course-nav')).toHaveCount(1);
    // su telefono l'indice si apre come menu dallo stesso elemento
    await expect(page.locator('.topic-nav')).toBeHidden();
    await page.locator('.course-bar__toggle').first().click();
    await expect(page.locator('.topic-nav')).toBeVisible();
    await expect(page.locator('.topic-nav a[aria-current="page"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.topic-nav')).toBeHidden();
  });
});

test('teoria su desktop: indice degli argomenti nella barra laterale', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}it/anno-2/teoria-circuiti/teoria/teorema-di-thevenin/`);
  await expect(page.locator('.topic-nav')).toHaveCount(1);
  await expect(page.locator('.topic-nav')).toBeVisible();
  await expect(page.locator('.course-bar__toggle')).toBeHidden();
});
