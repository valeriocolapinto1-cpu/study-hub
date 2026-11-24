/**
 * Indice del corso richiudibile (barra laterale da 1024 px) e barre di scorrimento (R9):
 * - «Nascondi indice» chiude la barra e il testo si allarga fino al limite di lettura; «Mostra indice» la riapre;
 * - la scelta resta dopo il ricaricamento ed è applicata prima del disegno (nessuno spostamento del layout);
 * - utilizzabile da tastiera, con `aria-expanded`;
 * - sotto i 1024 px il pulsante non c'è (l'indice è il menu a comparsa);
 * - barre di scorrimento sottili nel colore del corso, di sistema in contrasto elevato.
 */
import { expect, test, type Page } from '@playwright/test';
import { BASE } from './pages';

const TEORIA = `${BASE}it/anno-2/teoria-circuiti/teoria/teorema-di-thevenin/`;

const larghezza = (page: Page, sel: string) =>
  page
    .locator(sel)
    .first()
    .evaluate((el) => el.getBoundingClientRect().width);

test.describe('desktop (1024 px)', () => {
  test.use({ viewport: { width: 1024, height: 800 } });

  test('chiusura, riapertura e scelta ricordata dopo il ricaricamento', async ({ page }) => {
    await page.goto(TEORIA);
    const pulsante = page.locator('.course-bar__index');
    const indice = page.locator('#indice-corso');
    await expect(pulsante).toHaveAccessibleName('Nascondi indice');
    await expect(pulsante).toHaveAttribute('aria-expanded', 'true');
    await expect(pulsante).toHaveAttribute('aria-controls', 'indice-corso');
    await expect(indice).toBeVisible();
    const prima = await larghezza(page, '.prose');

    await pulsante.click();
    await expect(indice).toBeHidden();
    await expect(pulsante).toHaveAccessibleName('Mostra indice');
    await expect(pulsante).toHaveAttribute('aria-expanded', 'false');
    const dopo = await larghezza(page, '.prose');
    expect(dopo).toBeGreaterThan(prima);
    // Fino al limite di lettura (65ch della prosa), non oltre.
    const limite = await page
      .locator('.prose')
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).maxWidth));
    expect(dopo).toBeLessThanOrEqual(limite + 0.5);

    // Dopo il ricaricamento lo stato c'è già al primo disegno: niente spostamenti del layout.
    await page.reload();
    await expect(indice).toBeHidden();
    await expect(pulsante).toHaveAttribute('aria-expanded', 'false');
    expect(await page.evaluate(() => document.documentElement.dataset.courseIndex)).toBe('hidden');
    // Nessuno spostamento orizzontale registrato (sarebbe la barra che compare e poi sparisce).
    // Gli spostamenti verticali di alcuni strati, dovuti ai caratteri, ci sono anche con l'indice aperto.
    const orizzontali = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let n = 0;
          new PerformanceObserver((list) => {
            for (const e of list.getEntries() as (PerformanceEntry & {
              sources: { previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }[];
            })[])
              for (const s of e.sources)
                if (s.currentRect.width && Math.abs(s.previousRect.x - s.currentRect.x) > 1) n++;
          }).observe({ type: 'layout-shift', buffered: true });
          setTimeout(() => resolve(n), 300);
        }),
    );
    expect(orizzontali).toBe(0);

    await pulsante.click();
    await expect(indice).toBeVisible();
    await expect(pulsante).toHaveAccessibleName('Nascondi indice');
    await page.reload();
    await expect(indice).toBeVisible();
    await expect(pulsante).toHaveAttribute('aria-expanded', 'true');
  });

  test('da tastiera', async ({ page }) => {
    await page.goto(TEORIA);
    const pulsante = page.locator('.course-bar__index');
    await pulsante.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#indice-corso')).toBeHidden();
    await expect(pulsante).toBeFocused();
    await expect(pulsante).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Space');
    await expect(page.locator('#indice-corso')).toBeVisible();
    await expect(pulsante).toHaveAttribute('aria-expanded', 'true');
  });

  test('la preferenza vale per tutto il sito e resta sul dispositivo (fuori dall’esportazione)', async ({
    page,
  }) => {
    await page.goto(TEORIA);
    await page.locator('.course-bar__index').click();
    await page.goto(`${BASE}en/anno-1/fisica-1/formulario/`);
    await expect(page.locator('#indice-corso')).toBeHidden();
    await expect(page.locator('.course-bar__index')).toHaveAccessibleName('Show contents');
    expect(await page.evaluate(() => localStorage.getItem('sh:v1:global:courseIndex'))).toBe('"hidden"');
  });

  test('barre di scorrimento sottili nel colore del corso', async ({ page }) => {
    await page.goto(TEORIA);
    const stile = await page.evaluate(() => {
      const html = getComputedStyle(document.documentElement);
      const side = getComputedStyle(document.querySelector('#indice-corso')!);
      return { colore: html.scrollbarColor, larghezza: html.scrollbarWidth, lato: side.scrollbarWidth };
    });
    expect(stile.larghezza).toBe('thin');
    expect(stile.lato).toBe('thin');
    expect(stile.colore).not.toBe('auto');
  });

  test('contrasto elevato: barre di sistema', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto(TEORIA);
    const stile = await page.evaluate(() => {
      const html = getComputedStyle(document.documentElement);
      return { colore: html.scrollbarColor, larghezza: html.scrollbarWidth };
    });
    expect(stile).toEqual({ colore: 'auto', larghezza: 'auto' });
  });
});

test('telefono: niente pulsante, l’indice resta il menu a comparsa', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(TEORIA);
  await page.evaluate(() => localStorage.setItem('sh:v1:global:courseIndex', '"hidden"'));
  await page.reload();
  await expect(page.locator('.course-bar__index')).toBeHidden();
  await page.locator('.course-bar__toggle').click();
  await expect(page.locator('#indice-corso')).toBeVisible();
});
