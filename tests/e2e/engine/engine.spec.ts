/**
 * Isole del motore di studio sul corso finto "esempio" (build delle fixture:
 * `npm run build:fixtures`, servita su una porta separata dal progetto `engine`).
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const B = '/study-hub/';
const C = `${B}it/anno-1/esempio/`;
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(
    serious.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

/** Attende l'idratazione dell'isola che contiene `selector` (Astro toglie l'attributo `ssr`). */
async function hydrated(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await expect(page.locator(`astro-island:has(${selector})`).first()).not.toHaveAttribute('ssr', /.*/);
}

const errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
});
test.afterEach(() => expect(errors).toEqual([]));

const PAGES = ['esercizi/', 'esercizi/resistori/', 'ripasso/', 'esame/', 'progressi/']
  .map((p) => C + p)
  .concat([
    `${B}it/ripasso/`,
    `${B}it/appunti/`,
    `${B}it/i-miei-dati/`,
    `${B}en/anno-1/esempio/esercizi/resistori/`,
  ]);

for (const theme of ['light', 'dark'] as const) {
  for (const url of PAGES) {
    test(`axe ${theme}: ${url}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      // Scuro di default: il tema chiaro si attiva con la scelta salvata dall'interruttore.
      await page.addInitScript((t) => localStorage.setItem('sh:v1:global:theme', JSON.stringify(t)), theme);
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await axe(page);
    });
  }
}

test('ExerciseList: filtri per argomento, difficoltà e testo', async ({ page }) => {
  await page.goto(`${C}esercizi/`);
  await hydrated(page, '.sh-list');
  const count = page.locator('.sh-count');
  await expect(count).toHaveText('6 esercizi');
  await page.locator('.sh-filters').getByLabel('Argomento').selectOption('condensatori');
  await expect(count).toHaveText('1 esercizi');
  await page.locator('.sh-filters').getByLabel('Argomento').selectOption('');
  await page.locator('.sh-filters').getByLabel('Difficoltà').selectOption('3');
  await expect(page.locator('.sh-item')).toHaveCount(1);
  await page.getByRole('button', { name: 'Azzera i filtri' }).click();
  await page.getByRole('searchbox').fill('partitore');
  await expect(page.locator('.sh-item__link')).toHaveText(/partitore/);
});

test('ExercisePlayer: verifica con unità, feedback, soluzione a passi, stato salvato', async ({ page }) => {
  await page.goto(`${C}esercizi/resistori/`);
  const ex = page.locator('article#ohm-base');
  await hydrated(page, 'article#ohm-base');
  await ex.getByLabel('Tensione').fill('2000 mV');
  await ex.getByRole('button', { name: 'Verifica' }).click();
  await expect(ex.getByRole('status')).toContainText('Corretto');
  const div = page.locator('article#partitore');
  await hydrated(page, 'article#partitore');
  await div.getByLabel('Corrente').fill('2 A');
  await div.getByLabel('Tensione su R2').fill('-6');
  await div.getByRole('button', { name: 'Verifica' }).click();
  await expect(div).toContainText('fattore 1000');
  await expect(div).toContainText('segno');
  await div.getByRole('button', { name: 'Suggerimento' }).click();
  await expect(div.locator('.sh-hints li')).toHaveCount(1);
  await div.getByRole('button', { name: 'Mostra il passo successivo' }).click();
  await expect(div.locator('.sh-step')).toHaveCount(1);
  await expect(div.locator('.sh-step').first()).toBeFocused();
  await div.getByRole('button', { name: 'Mostra tutta la soluzione' }).click();
  await expect(div.locator('.sh-step')).toHaveCount(3);
  await expect(div.locator('.katex').first()).toBeVisible();
  // complessi in forma polare
  const z = page.locator('article#impedenza-rl');
  await hydrated(page, 'article#impedenza-rl');
  await z.getByRole('textbox', { name: 'Z' }).fill('5∠53,13° Ω');
  await z.getByRole('textbox', { name: 'Z' }).press('Enter');
  await expect(z.getByRole('status')).toContainText('Corretto');
  // scelta multipla
  const q = page.locator('article#quiz-ohm');
  await hydrated(page, 'article#quiz-ohm');
  await q.getByLabel('si dimezza').check();
  await q.getByRole('button', { name: 'Verifica' }).click();
  await expect(q).toContainText('inversamente proporzionali');
  await page.reload();
  // client:visible: l'isola si idrata (e legge lo stato salvato) quando entra nella vista
  await page.locator('article#ohm-base').scrollIntoViewIfNeeded();
  await expect(page.locator('article#ohm-base [data-status]')).toHaveText(/Risolto/);
});

test('ExercisePlayer generato: KaTeX lazy e nuova variante', async ({ page }) => {
  await page.goto(`${C}esercizi/resistori/`);
  const g = page.locator('article#ohm-generato');
  await hydrated(page, 'article#ohm-generato');
  await g.scrollIntoViewIfNeeded();
  await expect(g.locator('.katex').first()).toBeVisible();
  const before = await g.locator('.sh-exercise__statement').innerText();
  await g.getByRole('button', { name: 'Nuova variante' }).click();
  await expect(g.locator('.sh-exercise__statement')).not.toHaveText(before);
  await g.getByRole('button', { name: 'Mostra tutta la soluzione' }).click();
  const body = await g.locator('.sh-step').nth(1).innerText();
  const v = /=\s*([\d.]+)\s*V/.exec(body.replace(/\s+/g, ' '))?.[1];
  expect(v).toBeTruthy();
  await g.getByLabel('V', { exact: true }).fill(v!);
  await g.getByRole('button', { name: 'Verifica' }).click();
  await expect(g.getByRole('status')).toContainText('Corretto');
});

test('ReviewSession: tastiera, valutazioni, fine sessione', async ({ page }) => {
  await page.goto(`${C}ripasso/`);
  await hydrated(page, '.sh-review');
  await expect(page.locator('.sh-count')).toHaveText('0 da ripassare · 3 nuove');
  for (let i = 0; i < 3; i++) {
    await expect(page.getByRole('button', { name: 'Mostra la risposta' })).toBeVisible();
    await page.keyboard.press('Space');
    await expect(page.getByRole('group', { name: 'Quanto bene la ricordavi?' })).toBeVisible();
    await page.keyboard.press(i === 0 ? '1' : '3');
  }
  // la carta "Di nuovo" torna fra 10 minuti: per oggi le nuove sono finite
  await expect(page.getByText('Hai finito il ripasso di oggi')).toBeVisible();
  await page.getByText('Statistiche').click();
  await expect(page.locator('.sh-dl')).toContainText('Ripassate oggi3');
});

test('ExamRunner: prova completa, consegna, correzione, stampa', async ({ page, context }) => {
  await page.goto(`${C}esame/`);
  await page.getByRole('button', { name: 'Inizia la prova' }).click();
  await expect(page.getByRole('heading', { name: /Domanda 1 di 3/ })).toBeFocused();
  await expect(page.locator('.sh-timer')).toContainText(/1:59:5\d|2:00:00/);
  await page.getByRole('navigation', { name: 'Domande della prova' }).getByRole('button').nth(1).click();
  await expect(page.getByRole('heading', { name: /Domanda 2 di 3/ })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Riprendi la prova in corso' }).click();
  await expect(page.getByRole('heading', { name: /Domanda 2 di 3/ })).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Consegna' }).click();
  await expect(page.getByRole('heading', { name: 'Esito' })).toBeFocused();
  await expect(page.locator('.sh-score')).toContainText('/ 30 punti');
  await page
    .getByRole('group', { name: 'Autovaluta la risposta' })
    .getByRole('button', { name: 'La sapevo', exact: true })
    .click();
  await expect(page.locator('.sh-score')).toContainText('10 / 30');
  await axe(page);
  const [print] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('link', { name: 'Scarica PDF soluzioni' }).click(),
  ]);
  await print.waitForLoadState();
  await expect(print.getByRole('heading', { name: 'Soluzioni' })).toBeVisible();
  await expect(print.locator('.sh-print__q')).toHaveCount(3);
  await expect(print.locator('.sh-print__solution').first()).toBeVisible();
  await page.getByRole('button', { name: 'Nuova prova' }).click();
  await expect(page.locator('.sh-history .sh-item')).toHaveCount(1);
});

test('Stampa: parametri non validi', async ({ page }) => {
  await page.goto(`${B}it/stampa/prova/?corso=boh&seme=1&modo=completa`);
  await expect(page.getByRole('alert')).toHaveText('Parametri di stampa non validi.');
});

test('Progressi: data d’esame, piano, mappa', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2027-01-05T10:00:00'));
  await page.goto(`${C}progressi/`);
  await hydrated(page, '.sh-datepicker');
  await hydrated(page, '.sh-mastery');
  await page.getByLabel(/20 gennaio 2027/).check();
  await expect(page.locator('.sh-countdown')).toHaveText('Mancano 15 giorni');
  await expect(page.locator('.sh-day')).toHaveCount(7);
  await page.getByRole('button', { name: 'Mostra tutto il piano' }).click();
  await expect(page.locator('.sh-day')).toHaveCount(15);
  await expect(page.locator('.sh-plan')).toContainText('Studia «Resistori e legge di Ohm»');
  await page.locator('.sh-topic summary', { hasText: 'Resistori e legge di Ohm' }).click();
  await expect(page.locator('.sh-objectives').first()).toContainText('Applicare la legge di Ohm');
  await page.getByRole('radio', { name: 'Un’altra data' }).check();
  await page.getByLabel('Un’altra data').last().fill('2027-01-07');
  await expect(page.locator('.sh-countdown')).toHaveText('Mancano 2 giorni');
});

test('NotesLayer e AllNotes', async ({ page }) => {
  await page.goto(`${C}esercizi/resistori/`);
  await hydrated(page, 'article#ohm-base');
  const btn = page.getByRole('button', { name: /^Aggiungi un appunto: Esercizio 1/ });
  await btn.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox').fill('Ricorda: V = R I');
  await dialog.getByRole('button', { name: 'Salva' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.sh-note-preview')).toHaveText('Ricorda: V = R I');
  await expect(page.getByRole('button', { name: /^Modifica l’appunto: Esercizio 1/ })).toBeFocused();
  await page.goto(`${B}it/appunti/`);
  await expect(page.locator('.sh-noteitem')).toContainText('Ricorda: V = R I');
  await page.getByRole('link', { name: 'Apri nel contesto' }).click();
  await expect(page).toHaveURL(/esercizi\/resistori\/#ohm-base$/);
});

test('ExportImport: file andata e ritorno, QR e codice incollato', async ({ page }) => {
  await page.goto(`${C}esercizi/resistori/`);
  await hydrated(page, 'article#ohm-base');
  await page.locator('article#ohm-base').getByLabel('Tensione').fill('2');
  await page.locator('article#ohm-base').getByRole('button', { name: 'Verifica' }).click();
  await page.goto(`${B}it/i-miei-dati/`);
  await hydrated(page, '.sh-sync');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Esporta in un file' }).click(),
  ]);
  const path = await download.path();
  await page.getByRole('button', { name: 'Mostra come QR' }).click();
  await expect(page.locator('.sh-qr__code svg')).toBeVisible();
  await expect(page.getByRole('img', { name: /QR 1 di 1/ })).toBeVisible();
  await page.evaluate(() => localStorage.clear());
  await page.locator('input[type=file][accept*=json]').setInputFiles(path!);
  await expect(page.getByText('Contenuto del file')).toBeVisible();
  await expect(page.locator('.sh-preview')).toContainText("Corso d'esempio: esercizi");
  await page.getByRole('button', { name: 'Unisci ai dati attuali' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Importazione completata' })).toBeVisible();
  const stored = await page.evaluate(() => localStorage.getItem('sh:v1:esempio:progress'));
  expect(stored).toContain('ohm-base');
  await page.getByRole('button', { name: 'Incolla il codice' }).click();
  await page.getByLabel(/Codice copiato/).fill('SH1:1/1:00000000:zzz');
  await page.getByRole('button', { name: 'Leggi il codice' }).click();
  await expect(page.getByText('Codice incompleto o danneggiato.')).toBeVisible();
});

test('Dati divisi: la soluzione si scarica solo alla richiesta e un errore di rete si può ritentare', async ({
  page,
}) => {
  const requested: string[] = [];
  let fail = true;
  await page.route('**/dati/*.json', (route) => {
    requested.push(new URL(route.request().url()).pathname.split('/').pop()!);
    return fail && route.request().url().includes('resistori') ? route.abort() : route.continue();
  });
  await page.goto(`${C}esercizi/resistori/`);
  const ex = page.locator('article#partitore');
  await hydrated(page, 'article#partitore');
  expect(requested).toEqual([]);
  await ex.getByRole('button', { name: 'Mostra tutta la soluzione' }).click();
  await expect(ex.getByRole('alert')).toContainText('Impossibile caricare');
  fail = false;
  await ex.getByRole('button', { name: 'Riprova' }).click();
  await ex.getByRole('button', { name: 'Mostra tutta la soluzione' }).click();
  await expect(ex.locator('.sh-step')).toHaveCount(3);
  expect(requested.every((r) => r === 'resistori.json')).toBe(true);
  errors.length = 0; // la richiesta interrotta è voluta
});

test("ExerciseList: errore di rete sull'indice con «Riprova»", async ({ page }) => {
  let fail = true;
  await page.route('**/dati/indice.json', (route) => (fail ? route.abort() : route.continue()));
  await page.goto(`${C}esercizi/`);
  await hydrated(page, '.sh-list');
  await expect(page.getByRole('alert')).toContainText('Impossibile caricare');
  fail = false;
  await page.getByRole('button', { name: 'Riprova' }).click();
  await expect(page.locator('.sh-count')).toHaveText('6 esercizi');
  errors.length = 0; // la richiesta interrotta è voluta
});
