/**
 * Revisione di lettura: le pagine si presentano in modo più compatto ma non perdono contenuti.
 * - il testo visibile di ogni pagina campione contiene tutte le frasi di prima (`lettura/frasi.json`,
 *   estratto dalla build di partenza con tools/lettura-frasi.mjs);
 * - nessun blocco <details> chiuso in più;
 * - a 390 px l'indice degli esercizi è almeno del 40 % più corto e la panoramica sta in 2 500 px (R8);
 * - un solo indice degli argomenti nel DOM della teoria;
 * - nessun TeX grezzo (`$…$`) visibile fuori da KaTeX, né nella meta description.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
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
    const prima = FRASI[p.name]!;
    // R8: le frasi spostate dalla panoramica si cercano nell'unione con le pagine in cui sono andate.
    let chiusi = 0;
    const righe: string[] = [];
    for (const path of [p.path, ...(p.anche ?? [])]) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      chiusi += await page.locator('main details:not([open])').count();
      righe.push(...(await righeVisibili(page)));
    }
    expect(chiusi).toBeLessThanOrEqual(prima.chiusi);
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
    for (const path of [p.path, ...(p.anche ?? [])]) {
      await page.goto(`${BASE}${path}`);
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
    }
  });
}

/**
 * Altezze massime a 390 px. Esercizi: 40 % in meno della build di partenza (main abc2664, 36 802 px
 * con 302 esercizi, Chromium, finestra 390×844), riportato al numero di esercizi attuale (R2 ne ha
 * aggiunti): la riga di ogni esercizio deve restare in media il 40 % più bassa di allora.
 * Panoramica: 2 500 px (R8; prima 12 968, poi 7 489 dopo la PR10).
 */
const ESERCIZI_TDC = readdirSync('src/content/exercises/teoria-circuiti').reduce(
  (n, f) =>
    n + (parse(readFileSync(`src/content/exercises/teoria-circuiti/${f}`, 'utf8')) as unknown[]).length,
  0,
);
const ALTEZZE_MAX = {
  'it/anno-2/teoria-circuiti/': 2_500,
  'it/anno-2/teoria-circuiti/esercizi/': Math.round(((36_802 * 0.6) / 302) * ESERCIZI_TDC),
} as const;

test.describe('telefono (390 px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const [path, max] of Object.entries(ALTEZZE_MAX)) {
    test(`abbastanza corta: ${path}`, async ({ page }) => {
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      expect(h).toBeLessThanOrEqual(max);
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
