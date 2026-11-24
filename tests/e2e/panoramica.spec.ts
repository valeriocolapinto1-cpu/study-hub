/**
 * Panoramica del corso per chi arriva la prima volta (R8), nei 4 corsi e nelle 2 lingue:
 * - a 390 px è alta al massimo 2 500 px e ha al massimo 150 parole visibili (guida esclusa);
 * - un solo pulsante principale: «Inizia dal primo argomento», poi «Riprendi da …»;
 * - guida in 3 passi chiudibile, che non ricompare (preferenza sul dispositivo);
 * - stato «risolti / studiate» solo con progressi; capitoli con link all'indice della teoria;
 * - pagina info con «L'esame» e «Come usare il sito»; axe senza violazioni gravi.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { BASE } from './pages';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const CORSI = [
  { id: 'teoria-circuiti', anno: 2 },
  { id: 'fisica-1', anno: 1 },
  { id: 'fisica-2', anno: 2 },
  { id: 'fondamenti-informatica', anno: 1 },
];
const T = {
  it: {
    start: 'Inizia dal primo argomento',
    resume: 'Riprendi da',
    info: "Informazioni sul corso e sull'esame",
    guide: 'Da dove iniziare',
    close: 'Chiudi la guida',
    exam: "L'esame",
    howto: 'Come usare il sito',
  },
  en: {
    start: 'Start with the first topic',
    resume: 'Resume from',
    info: 'About the course and the exam',
    guide: 'Where to start',
    close: 'Close the guide',
    exam: 'The exam',
    howto: 'How to use this site',
  },
} as const;

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

for (const lang of ['it', 'en'] as const) {
  for (const c of CORSI) {
    const url = `${BASE}${lang}/anno-${c.anno}/${c.id}/`;
    const tx = T[lang];

    test(`panoramica breve: ${lang} ${c.id}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(url, { waitUntil: 'networkidle' });
      const { h, w, sw } = await page.evaluate(() => {
        const words = (el: HTMLElement | null) => (el?.innerText ?? '').split(/\s+/).filter(Boolean).length;
        const main = document.querySelector('main');
        return {
          h: document.documentElement.scrollHeight,
          w: words(main) - words(document.querySelector('[data-first-steps]')),
          sw: document.documentElement.scrollWidth,
        };
      });
      expect(h).toBeLessThanOrEqual(2_500);
      expect(w).toBeLessThanOrEqual(150);
      expect(sw).toBeLessThanOrEqual(390);

      // un solo pulsante principale, verso il primo argomento
      const main = page.locator('main');
      await expect(main.locator('.btn--primary')).toHaveCount(1);
      const start = main.getByRole('link', { name: tx.start });
      await expect(start).toBeVisible();
      await expect(start).toHaveAttribute('href', new RegExp(`^${url}teoria/[a-z0-9-]+/$`));
      // stato nascosto senza progressi; capitoli verso l'indice della teoria
      await expect(page.locator('.course-status')).toBeHidden();
      const chapters = page.locator('.chapters__list a');
      expect(await chapters.count()).toBeGreaterThan(0);
      await expect(chapters.first()).toHaveAttribute('href', `${url}teoria/#g-1`);
      await expect(page.locator('.chapters__list a[href$="#g-1"]').first()).toBeVisible();
      await expect(page.getByRole('heading', { name: tx.guide })).toBeVisible();
      await axe(page);

      // dall'indice della teoria il capitolo esiste
      await chapters.first().click();
      await expect(page.locator('#g-1')).toBeInViewport();
    });

    test(`pagina info: ${lang} ${c.id}`, async ({ page }) => {
      await page.goto(url);
      await page.getByRole('link', { name: tx.info }).click();
      await expect(page).toHaveURL(`${url}info/`);
      await expect(page.getByRole('heading', { level: 2, name: tx.exam, exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: tx.howto })).toBeVisible();
      await axe(page);
    });
  }
}

test('guida: si chiude e non ricompare, anche negli altri corsi', async ({ page }) => {
  const tdc = `${BASE}it/anno-2/teoria-circuiti/`;
  await page.goto(tdc);
  const guide = page.locator('[data-first-steps]');
  await expect(guide).toBeVisible();
  await guide.getByRole('button', { name: T.it.close }).click();
  await expect(guide).toBeHidden();
  await expect(page.getByRole('link', { name: T.it.start })).toBeFocused();
  await page.reload();
  await expect(guide).toBeHidden();
  await page.goto(`${BASE}en/anno-1/fisica-1/`);
  await expect(page.locator('[data-first-steps]')).toBeHidden();
});

test('«Riprendi da …»: primo argomento non studiato, altrimenti ultima pagina; stato con progressi', async ({
  page,
}) => {
  const tdc = `${BASE}it/anno-2/teoria-circuiti/`;
  // solo l'ultima pagina aperta: il pulsante la riprende, lo stato resta nascosto
  await page.goto(`${tdc}teoria/teorema-di-thevenin/`);
  await page.goto(tdc);
  const start = page.locator('[data-course-start]');
  await expect(start).toHaveText(`${T.it.resume} Teorema di Thevenin`);
  await expect(start).toHaveAttribute('href', `${tdc}teoria/teorema-di-thevenin/`);
  await expect(page.locator('.course-status')).toBeHidden();

  // un argomento studiato: si riprende dal primo non studiato, lo stato compare con l'ultima pagina
  await page.evaluate(() =>
    localStorage.setItem(
      'sh:v1:teoria-circuiti:studied',
      JSON.stringify({ v: 1, topics: { 'modellamento-costanti-concentrate': Date.now() } }),
    ),
  );
  await page.reload();
  await expect(start).toHaveText(`${T.it.resume} Leggi di Kirchhoff`);
  await expect(start).toHaveAttribute('href', `${tdc}teoria/leggi-di-kirchhoff/`);
  const status = page.locator('.course-status');
  await expect(status).toBeVisible();
  await expect(status.locator('[data-chapter-count]')).toHaveText('1 / 49');
  await expect(status.getByRole('link', { name: 'Ultima pagina: Teorema di Thevenin' })).toBeVisible();
  await expect(page.locator('.chapters__list [data-chapter-count]').first()).toHaveText('1/9 argomenti');
  await axe(page);
});
