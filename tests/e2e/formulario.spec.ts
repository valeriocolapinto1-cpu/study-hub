/**
 * Formulario diviso per capitolo (revisione 2, R4): indice dei capitoli allo stesso URL di prima,
 * pagine dei capitoli con indice degli argomenti e barra ← precedente · successivo →, ricerca per
 * nome su tutte le formule dall'indice, ancore del vecchio formulario in una pagina che portano al
 * capitolo giusto, preferiti comuni a tutti i capitoli.
 */
import { expect, test } from '@playwright/test';
import { BASE } from './pages';

const F2 = `${BASE}it/anno-2/fisica-2/formulario/`;
const CAP1 = `${F2}elettrostatica-nel-vuoto-conduttori-dielettrici/`;
const CAP2 = `${F2}corrente-elettrica-stazionaria/`;

test('l’indice elenca i capitoli e porta alle loro pagine', async ({ page }) => {
  await page.goto(F2);
  await expect(page.getByRole('heading', { level: 1, name: 'Formulario' })).toBeVisible();
  const capitoli = page.locator('[data-fchapters] .topic-card__title a');
  await expect(capitoli).toHaveCount(7);
  // nessuna formula resa nell'indice: solo nomi, nascosti finché non si cerca
  await expect(page.locator('main .katex')).toHaveCount(0);
  await expect(page.locator('[data-fhits]')).toBeHidden();
  await capitoli.first().click();
  await expect(page).toHaveURL(CAP1);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Elettrostatica nel vuoto, conduttori, dielettrici' }),
  ).toBeVisible();
});

test('capitolo: indice degli argomenti in cima e barra fra i capitoli', async ({ page }) => {
  await page.goto(CAP1);
  const toc = page.getByRole('navigation', { name: 'Argomenti del capitolo' });
  await expect(toc.getByRole('link')).toHaveCount(3);
  await toc.getByRole('link').nth(1).click();
  await expect(page).toHaveURL(`${CAP1}#ft-conduttori-capacita`);
  const barra = page.locator('nav.pagination');
  await expect(barra.locator('[rel="prev"]')).toHaveCount(0);
  await expect(barra.getByRole('link', { name: /Tutti i capitoli/ })).toHaveAttribute('href', F2);
  await barra.locator('[rel="next"]').click();
  await expect(page).toHaveURL(CAP2);
  await expect(page.locator('nav.pagination [rel="prev"]')).toHaveAttribute('href', CAP1);
});

test('ricerca dall’indice in tutte le formule, con il capitolo', async ({ page }) => {
  await page.goto(F2);
  await page.getByLabel('Cerca nel formulario').fill('legge di ohm');
  const hits = page.locator('[data-fhits] li:visible');
  await expect(hits.first()).toBeVisible();
  await expect(page.locator('[data-fchapters]')).toBeHidden();
  await expect(hits.first().getByRole('link')).toHaveAttribute('href', /corrente-elettrica-stazionaria\/#f-/);
  await page.getByLabel('Cerca nel formulario').fill('zzzz');
  await expect(page.getByText('Nessuna formula corrisponde ai filtri.')).toBeVisible();
  await page.getByLabel('Cerca nel formulario').fill('');
  await expect(page.locator('[data-fchapters]')).toBeVisible();
});

test('le ancore del formulario in una pagina portano al capitolo giusto', async ({ page }) => {
  await page.goto(`${F2}#f-coulomb`);
  await expect(page).toHaveURL(`${CAP1}#f-coulomb`);
  await expect(page.locator('#f-coulomb')).toBeInViewport();
  await page.goto(`${F2}#ft-corrente-stazionaria`);
  await expect(page).toHaveURL(`${CAP2}#ft-corrente-stazionaria`);
  await page.goto(`${F2}#fg-1`);
  await expect(page).toHaveURL(CAP2);
});

test('preferiti comuni ai capitoli e filtrabili dall’indice', async ({ page }) => {
  await page.goto(CAP1);
  await page.locator('[data-bookmark="coulomb"]').click();
  await expect(page.locator('[data-bookmark="coulomb"]')).toHaveAttribute('aria-pressed', 'true');
  await page.goto(F2);
  await page.getByLabel('Solo i preferiti').check();
  const hits = page.locator('[data-fhits] li:visible');
  await expect(hits).toHaveCount(1);
  await expect(hits.getByRole('link')).toHaveAttribute('href', `${CAP1}#f-coulomb`);
});
