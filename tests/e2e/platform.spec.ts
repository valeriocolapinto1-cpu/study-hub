/**
 * Piattaforma sul sito vero (dist/): modulo Contribuisci (ripiego email e invio
 * all'Apps Script con endpoint e Turnstile finti), ricerca globale.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type Route } from '@playwright/test';
import { CHUNK_BYTES } from '../../src/lib/contribute/rules';

const B = '/study-hub/';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const ENDPOINT = 'https://script.example.test/macros/s/finto/exec';

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

async function formReady(page: Page) {
  await expect(page.locator('astro-island:has(.pf-cf)')).not.toHaveAttribute('ssr', /.*/);
}

async function fillValid(page: Page) {
  await page.getByLabel('Messaggio').fill('Nella formula del partitore manca R2 al numeratore.');
  for (const name of [/Ho letto l'informativa/, /Il materiale è mio/, /Acconsento che il contributo/])
    await page.getByRole('checkbox', { name }).check();
}

test.describe('Contribuisci', () => {
  test('senza endpoint: valida, precompila e prepara l’email', async ({ page }) => {
    await page.goto(
      `${B}it/contribuisci/?corso=inesistente&pagina=%2Fstudy-hub%2Fit%2Fchi-sono%2F&tipo=miglioria`,
    );
    await formReady(page);
    await expect(page.getByLabel('Pagina')).toHaveValue('/study-hub/it/chi-sono/');
    await expect(page.getByRole('radio', { name: 'Suggerimento' })).toBeChecked();
    // Nessun caricamento di terze parti finché il modulo non è configurato.
    const third: string[] = [];
    page.on(
      'request',
      (r) => /^https?:/.test(r.url()) && !r.url().startsWith('http://localhost') && third.push(r.url()),
    );

    await page.getByRole('button', { name: "Prepara l'email" }).click();
    const summary = page.getByRole('alert').filter({ hasText: 'Controlla' });
    await expect(summary).toBeFocused();
    await expect(summary.getByRole('link')).toHaveCount(4);
    await expect(page.getByLabel('Messaggio')).toHaveAttribute('aria-invalid', 'true');

    await fillValid(page);
    await page.getByLabel('Nome per i ringraziamenti').fill('Anna');
    await page.getByRole('button', { name: "Prepara l'email" }).click();
    const link = page.locator('[data-contribute-mailto]');
    await expect(link).toBeVisible();
    const href = (await link.getAttribute('href')) ?? '';
    const q = new URLSearchParams(href.slice(href.indexOf('?')));
    expect(href.startsWith('mailto:valeriocolapinto1@gmail.com?')).toBe(true);
    expect(q.get('subject')).toContain('[miglioria]');
    expect(q.get('body')).toContain('Pagina: /study-hub/it/chi-sono/');
    expect(q.get('body')).toContain('Nome per i ringraziamenti: Anna');
    expect(third).toEqual([]);
  });

  test('rifiuta allegati non ammessi', async ({ page }) => {
    await page.goto(`${B}it/contribuisci/`);
    await formReady(page);
    await page
      .locator('#cf-files-input')
      .setInputFiles({ name: 'materiale.zip', mimeType: 'application/zip', buffer: Buffer.from('PK') });
    await expect(page.locator('#cf-files-err')).toContainText('tipo di file non ammesso');
    await page.getByRole('button', { name: 'Rimuovi materiale.zip' }).click();
    await expect(page.locator('#cf-files-err')).toHaveCount(0);
  });

  test('con endpoint: verifica Turnstile, invia i dati e carica gli allegati a blocchi', async ({ page }) => {
    await page.addInitScript((endpoint) => {
      (window as unknown as { __SH_CONTRIBUTE__: unknown }).__SH_CONTRIBUTE__ = {
        endpoint,
        siteKey: '1x00000000000000000000AA',
      };
    }, ENDPOINT);
    // Turnstile finto: chiama subito il callback con un token.
    let turnstileLoads = 0;
    await page.route('https://challenges.cloudflare.com/**', (route) => {
      turnstileLoads++;
      return route.fulfill({
        contentType: 'text/javascript',
        body: `window.turnstile = { render(el, o) { setTimeout(() => o.callback('tok-123'), 50); return 'w1'; }, reset() {}, remove() {} };`,
      });
    });
    const calls: Record<string, any>[] = [];
    await page.route(ENDPOINT, async (route: Route) => {
      const req = route.request();
      expect(req.method()).toBe('POST');
      expect(req.headers()['content-type']).toContain('text/plain');
      const body = JSON.parse(req.postData() ?? '{}');
      calls.push(body);
      const json = (o: unknown) =>
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(o),
          headers: { 'access-control-allow-origin': '*' },
        });
      if (body.action === 'submit')
        return json({
          ok: true,
          v: 1,
          id: '20261105-120000-abc123',
          uploadToken: 'up-1',
          chunkBytes: CHUNK_BYTES,
        });
      if (body.action === 'chunk') return json({ ok: true, v: 1, done: true });
      if (body.action === 'finalize') return json({ ok: true, v: 1, id: body.id });
      return json({ ok: false, error: 'bad_request' });
    });

    await page.goto(`${B}en/contribuisci/?corso=fisica-1&tipo=errore`);
    await formReady(page);
    expect(turnstileLoads).toBe(0);
    await page.getByLabel('Message').fill('The sign in the second equation is wrong, it should be minus.');
    expect(turnstileLoads).toBe(1);
    const pdf = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(CHUNK_BYTES + 1000, 0x20)]);
    await page.locator('#cf-files-input').setInputFiles([
      { name: 'notes.md', mimeType: 'text/markdown', buffer: Buffer.from('# Notes\n') },
      { name: 'worked.pdf', mimeType: 'application/pdf', buffer: pdf },
    ]);
    await page.getByLabel('Email').fill('student@example.org');
    for (const name of [
      /I have read the privacy notice/,
      /The material is mine/,
      /I agree that the contribution/,
    ])
      await page.getByRole('checkbox', { name }).check();
    await page.waitForTimeout(3100); // tempo minimo di compilazione (trappola anti-bot)
    await page.getByRole('button', { name: 'Send the contribution' }).click();
    await expect(page.getByRole('heading', { name: 'Thank you, contribution received' })).toBeVisible();
    await expect(page.getByText('20261105-120000-abc123')).toBeVisible();

    const submit = calls[0]!;
    expect(submit).toMatchObject({
      action: 'submit',
      turnstileToken: 'tok-123',
      payload: {
        tipo: 'errore',
        lingua: 'en',
        email: 'student@example.org',
        website: '',
        consensoPrivacy: true,
        consensoDiritti: true,
        consensoPubblicazione: true,
        files: [
          { name: 'notes.md', size: 8 },
          { name: 'worked.pdf', size: pdf.length },
        ],
      },
    });
    expect(submit.payload.elapsedMs).toBeGreaterThan(3000);
    expect(submit.payload.clientId).toMatch(/^[a-f0-9-]{36}$/);
    const chunks = calls.filter((c) => c.action === 'chunk');
    expect(chunks.map((c) => [c.fileIndex, c.chunkIndex])).toEqual([
      [0, 0],
      [1, 0],
      [1, 1],
    ]);
    const rebuilt = Buffer.concat(
      chunks.filter((c) => c.fileIndex === 1).map((c) => Buffer.from(c.data, 'base64')),
    );
    expect(rebuilt.equals(pdf)).toBe(true);
    expect(calls.at(-1)).toEqual({ action: 'finalize', id: '20261105-120000-abc123', uploadToken: 'up-1' });
  });

  test('mostra gli errori del server con i canali alternativi', async ({ page }) => {
    await page.addInitScript((endpoint) => {
      (window as unknown as { __SH_CONTRIBUTE__: unknown }).__SH_CONTRIBUTE__ = { endpoint, siteKey: 'k' };
    }, ENDPOINT);
    await page.route('https://challenges.cloudflare.com/**', (route) =>
      route.fulfill({
        contentType: 'text/javascript',
        body: `window.turnstile = { render(el, o) { o.callback('t'); return 'w'; }, reset() {}, remove() {} };`,
      }),
    );
    await page.route(ENDPOINT, (route) =>
      route.fulfill({ contentType: 'application/json', body: '{"ok":false,"v":1,"error":"rate_limited"}' }),
    );
    await page.goto(`${B}it/contribuisci/`);
    await formReady(page);
    await fillValid(page);
    await page.getByRole('button', { name: 'Invia il contributo' }).click();
    const alert = page.getByRole('alert').filter({ hasText: 'riprova tra un' });
    await expect(alert).toBeVisible();
    await expect(alert.getByRole('link', { name: 'invia per email' })).toHaveAttribute('href', /^mailto:/);
    await axe(page);
  });
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
    const before = await page.locator('.pf-search__item').count();
    await page.getByRole('button', { name: 'Also in Italian' }).click();
    await expect(page.locator('.pf-search__item[lang="it"]').first()).toBeVisible();
    expect(await page.locator('.pf-search__item').count()).toBeGreaterThan(before);
  });
});
