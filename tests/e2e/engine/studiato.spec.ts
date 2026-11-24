/**
 * «Segna come studiato» (R13) sul corso finto: pulsante in fondo alla teoria e invito,
 * capitoli nell'indice, spunte e avanzamento, ripasso, Progressi, persistenza, tastiera, axe.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const B = '/study-hub/';
const C = `${B}it/anno-1/esempio/`;
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const DAY = 86_400_000;

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

const stored = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('sh:v1:esempio:studied') ?? 'null'));

const errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
});
test.afterEach(() => expect(errors).toEqual([]));

test('teoria: segna e annulla da tastiera, spunta nell’indice, persistenza', async ({ page }) => {
  await page.goto(`${C}teoria/resistori/`);
  const btn = page.getByRole('button', { name: 'Segna come studiato' });
  await expect(btn).toBeVisible();
  const side = page.locator('#indice-corso a[data-topic="resistori"]');
  await expect(side).not.toHaveAttribute('data-studied');
  await btn.focus();
  await page.keyboard.press('Enter');
  const undo = page.getByRole('button', { name: 'Studiato ✓ (annulla)' });
  await expect(undo).toBeFocused();
  await expect(page.locator('[data-studied-status]')).toContainText('segnato come studiato');
  await expect(page.locator('[data-studied-state]')).toContainText('Studiato');
  await expect(side).toHaveAttribute('data-studied', '');
  await expect(side).toContainText('studiato');
  const s = await stored(page);
  expect(s.v).toBe(1);
  expect(typeof s.topics.resistori).toBe('number');
  // persistenza dopo ricarica
  await page.reload();
  await expect(undo).toBeVisible();
  await expect(side).toHaveAttribute('data-studied', '');
  // annulla con Spazio
  await undo.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Segna come studiato' })).toBeFocused();
  await expect(side).not.toHaveAttribute('data-studied');
  expect((await stored(page)).topics).toEqual({});
});

test('teoria: invito dopo l’80 % della lettura, niente segnatura automatica', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto(`${C}teoria/resistori/`);
  const hint = page.locator('[data-studied-hint]');
  // pagina finta lunga: l'invito compare solo verso la fine e non segna nulla da solo
  await page.evaluate(() => {
    const filler = document.createElement('div');
    filler.style.blockSize = '4000px';
    document.querySelector('article.prose')!.append(filler);
  });
  await expect(hint).toBeHidden();
  await page.evaluate(() => {
    const a = document.querySelector('article.prose')!.getBoundingClientRect();
    scrollTo(0, scrollY + a.top + a.height * 0.85 - innerHeight);
  });
  await expect(hint).toBeVisible();
  expect(await stored(page)).toBeNull();
  await axe(page);
  await hint.getByRole('button', { name: 'Finito? Segnalo come studiato' }).click();
  await expect(hint).toBeHidden();
  await expect(page.getByRole('button', { name: 'Studiato ✓ (annulla)' })).toBeFocused();
  expect(Object.keys((await stored(page)).topics)).toEqual(['resistori']);
});

test('capitolo nell’indice, panoramica e «Riprendi la teoria»', async ({ page }) => {
  await page.goto(`${C}teoria/`);
  const group = page.locator('.topic-index__group').first();
  await expect(group.locator('[data-chapter-count]')).toHaveText('0/2 argomenti');
  await group.getByRole('button', { name: 'Segna tutto il capitolo' }).click();
  await expect(group.locator('[data-chapter-count]')).toHaveText('2/2 argomenti');
  const undo = group.getByRole('button', { name: 'Capitolo studiato ✓ (annulla)' });
  await expect(undo).toBeFocused();
  await expect(group).toHaveAttribute('data-studied', '');
  await expect(page.locator('.topic-card[data-studied]')).toHaveCount(2);
  await axe(page);

  await page.goto(C);
  await expect(page.locator('.topic-map li[data-studied]')).toHaveCount(2);
  await expect(page.locator('.topic-map [data-chapter-count]').first()).toHaveText('2/2 argomenti');
  await expect(page.locator('.course-status [data-chapter-count]')).toHaveText('2 / 2');
  await expect(page.locator('[data-studied-next]')).toBeHidden();
  await axe(page);

  // annullato il capitolo, «Riprendi» propone il primo argomento non studiato
  await page.goto(`${C}teoria/`);
  await page.getByRole('button', { name: 'Capitolo studiato ✓ (annulla)' }).click();
  await expect(page.locator('.topic-card[data-studied]')).toHaveCount(0);
  await page.goto(`${C}teoria/resistori/`);
  await page.getByRole('button', { name: 'Segna come studiato' }).click();
  await page.goto(C);
  const next = page.locator('[data-studied-next]');
  await expect(next).toHaveText('Riprendi la teoria: Condensatori');
  await expect(next).toHaveAttribute('href', `${C}teoria/condensatori/`);
  await expect(page.locator('.course-status [data-chapter-count]')).toHaveText('1 / 2');
});

test('ripasso: invito senza argomenti studiati, carte dal giorno dopo', async ({ page }) => {
  await page.clock.install();
  await page.goto(`${C}ripasso/`);
  await expect(page.getByText('Segna come studiato un argomento per iniziare')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Vai alla teoria' })).toHaveAttribute('href', `${C}teoria/`);
  await axe(page);

  await page.goto(`${C}teoria/resistori/`);
  await page.getByRole('button', { name: 'Segna come studiato' }).click();
  await page.goto(`${C}ripasso/`);
  // stesso giorno: le due carte di «resistori» entrano domani
  await expect(page.getByText(/entrano nel ripasso domani.*: 2\./)).toBeVisible();
  await page.clock.setSystemTime(Date.now() + DAY + 60_000);
  await page.reload();
  await expect(page.locator('.sh-count')).toHaveText('0 da ripassare · 2 nuove');
  await expect(page.getByRole('button', { name: 'Mostra la risposta' })).toBeVisible();
});

test('progressi: colonna Teoria, «Studiato» non cambia la padronanza', async ({ page }) => {
  await page.goto(`${C}teoria/resistori/`);
  await page.getByRole('button', { name: 'Segna come studiato' }).click();
  await page.goto(`${C}progressi/`);
  const row = page.locator('.sh-topic').filter({ hasText: 'Resistori' });
  await expect(row.locator('.sh-theory')).toHaveText('Teoria: Studiato · padronanza 0%');
  await expect(
    page.locator('.sh-topic').filter({ hasText: 'Condensatori' }).locator('.sh-theory'),
  ).toHaveText('Teoria: Da studiare');
  await expect(page.locator('.sh-overall strong')).toHaveText('0%');
  await axe(page);
});
