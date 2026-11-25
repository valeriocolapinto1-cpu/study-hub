/**
 * Tutor AI (R12) sul corso finto: nella build delle fixture il Worker è `https://tutor.invalid/chat`,
 * qui sostituito da un server SSE finto (page.route), e lo script di Turnstile da uno finto.
 * Nessuna chiamata reale. Pulsanti, contesto inviato, stream e formule, cronologia, rifiuti,
 * limiti, tastiera, axe; niente tutor nella pagina d'esame.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type Request } from '@playwright/test';

const B = '/study-hub/';
const C = `${B}it/anno-1/esempio/`;
const WORKER = 'https://tutor.invalid/chat';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const TURNSTILE_STUB = `window.turnstile = {
  render(el, o) { setTimeout(() => o.callback('tok-finto'), 10); return 'w1'; },
  reset() {}, remove() {},
};`;

const sse = (events: unknown[]) => events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('');

interface FakeWorker {
  requests: { body: Record<string, any>; session: string | null }[];
}

/** Server finto: `reply` decide la risposta per ogni richiesta. */
async function fakeWorker(
  page: Page,
  reply: (body: Record<string, any>, n: number) => { status?: number; events?: unknown[]; json?: unknown },
): Promise<FakeWorker> {
  const state: FakeWorker = { requests: [] };
  await page.route('https://challenges.cloudflare.com/turnstile/**', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: TURNSTILE_STUB }),
  );
  await page.route(WORKER, async (route) => {
    const req: Request = route.request();
    const origin = new URL(page.url()).origin;
    const cors = {
      'access-control-allow-origin': origin,
      'access-control-allow-headers': 'content-type, x-tutor-session',
    };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const body = req.postDataJSON() as Record<string, any>;
    state.requests.push({ body, session: req.headers()['x-tutor-session'] ?? null });
    const r = reply(body, state.requests.length);
    if (r.json !== undefined)
      return route.fulfill({
        status: r.status ?? 400,
        headers: cors,
        contentType: 'application/json',
        body: JSON.stringify(r.json),
      });
    return route.fulfill({
      status: 200,
      headers: cors,
      contentType: 'text/event-stream',
      body: sse(r.events ?? []),
    });
  });
  return state;
}

const errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  page.on(
    'console',
    (m) => m.type() === 'error' && !/status of 4\d\d/.test(m.text()) && errors.push(m.text()),
  );
});
test.afterEach(() => expect(errors).toEqual([]));

test('esercizio: contesto con soluzione, risposta in streaming con formule, sessione e cronologia', async ({
  page,
}) => {
  const w = await fakeWorker(page, (_b, n) => ({
    events: [
      ...(n === 1 ? [{ type: 'session', token: 'v1.sessione' }] : []),
      { type: 'text', text: 'Usa la legge di Ohm: ' },
      { type: 'text', text: '$V = R I$.' },
      { type: 'done', stop: 'end_turn' },
    ],
  }));
  await page.goto(`${C}esercizi/resistori/`);
  // nessun byte del pannello prima del clic
  const panelLoads: string[] = [];
  page.on('request', (r) => /\/panel\.|tutor\..*\.css/.test(r.url()) && panelLoads.push(r.url()));
  // l'isola dell'esercizio deve essere idratata, o il valore scritto si perde
  await expect(page.locator('astro-island:has(#ohm-base)')).not.toHaveAttribute('ssr');
  await page.locator('#ohm-base input').first().fill('3');
  expect(panelLoads).toEqual([]);

  const open = page.getByRole('button', { name: 'Chiedi al tutor: Esercizio 1' });
  await open.click();
  const panel = page.getByRole('dialog', { name: 'Tutor' });
  await expect(panel).toBeVisible();
  expect(panelLoads.length).toBeGreaterThan(0);
  await expect(page.getByLabel('La tua domanda')).toBeFocused();
  await panel.getByRole('button', { name: 'Dove sbaglio?' }).click();

  await expect(panel.locator('.tutor__msg--assistant .katex')).toBeVisible();
  await expect(panel.locator('.tutor__msg--assistant')).toContainText('Usa la legge di Ohm');
  const first = w.requests[0]!;
  expect(first.session).toBeNull();
  expect(first.body.turnstile).toBe('tok-finto');
  expect(first.body).toMatchObject({
    lang: 'it',
    course: { id: 'esempio' },
    context: { kind: 'exercise', title: 'Esercizio 1' },
    messages: [{ role: 'user', content: 'Dove sbaglio?' }],
  });
  expect(first.body.context.text).toContain('Calcola V con R = 100 Ω');
  expect(first.body.context.answer).toContain('= 3');
  expect(first.body.context.solution).toContain('$V = R I = 2$');
  expect(first.body.course.outline).toContain('1. ');

  // seconda domanda: gettone di sessione, niente Turnstile, la storia va con la domanda
  const input = page.getByLabel('La tua domanda');
  await input.fill('E poi?');
  await input.press('Enter');
  await expect(panel.locator('.tutor__msg--assistant').nth(1)).toContainText('Usa la legge di Ohm');
  await expect(panel.locator('.tutor__waiting')).toHaveCount(0);
  const second = w.requests[1]!;
  expect(second.session).toBe('v1.sessione');
  expect(second.body.turnstile).toBeUndefined();
  expect(second.body.messages.map((m: { role: string }) => m.role)).toEqual(['user', 'assistant', 'user']);

  // Esc chiude e il focus torna al pulsante
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(open).toBeFocused();

  // cronologia solo nel browser: dopo il ricaricamento la conversazione c'è ancora
  await page.reload();
  await page.getByRole('button', { name: 'Chiedi al tutor: Esercizio 1' }).click();
  await expect(page.getByRole('dialog', { name: 'Tutor' }).locator('.tutor__msg')).toHaveCount(4);
  await page.getByRole('button', { name: 'Nuova conversazione' }).click();
  await expect(page.getByRole('dialog', { name: 'Tutor' }).locator('.tutor__msg')).toHaveCount(0);
});

test('rifiuto: il testo parziale sparisce e la domanda resta da riprovare', async ({ page }) => {
  await fakeWorker(page, () => ({ events: [{ type: 'text', text: 'Testo parziale' }, { type: 'refusal' }] }));
  await page.goto(`${C}esercizi/resistori/`);
  await page.getByRole('button', { name: 'Chiedi al tutor: Esercizio 1' }).click();
  const panel = page.getByRole('dialog', { name: 'Tutor' });
  await page.getByLabel('La tua domanda').fill('Domanda');
  await panel.getByRole('button', { name: 'Invia' }).click();
  await expect(panel.getByRole('alert')).toContainText('non può rispondere');
  await expect(panel).not.toContainText('Testo parziale');
  await expect(panel.getByRole('button', { name: 'Riprova' })).toBeVisible();
  const saved = await page.evaluate(() => localStorage.getItem('sh:tutor:esempio'));
  expect(saved ?? '').not.toContain('Testo parziale');
});

test('errori a risposta iniziata: quota del servizio e tempo massimo', async ({ page }) => {
  let n = 0;
  await fakeWorker(page, () => ({
    events: [
      { type: 'text', text: 'Parz' },
      { type: 'error', code: ++n === 1 ? 'quota' : 'timeout' },
    ],
  }));
  await page.goto(`${C}esercizi/resistori/`);
  await page.getByRole('button', { name: 'Chiedi al tutor: Esercizio 1' }).click();
  const panel = page.getByRole('dialog', { name: 'Tutor' });
  await page.getByLabel('La tua domanda').fill('Domanda');
  await panel.getByRole('button', { name: 'Invia' }).click();
  await expect(panel.getByRole('alert')).toContainText('limite di richieste del servizio');
  await panel.getByRole('button', { name: 'Riprova' }).click();
  await expect(panel.getByRole('alert')).toContainText('ci sta mettendo troppo');
});

test('limiti: tetto del giorno e richieste per ora', async ({ page }) => {
  let n = 0;
  await fakeWorker(page, () =>
    ++n === 1
      ? { status: 429, json: { error: 'budget', retryAfter: 3600 } }
      : { status: 429, json: { error: 'rate', retryAfter: 1500 } },
  );
  await page.goto(`${C}ripasso/`);
  await page.getByRole('button', { name: 'Chiedi al tutor' }).click();
  const panel = page.getByRole('dialog', { name: 'Tutor' });
  await page.getByLabel('La tua domanda').fill('Ciao');
  await page.getByLabel('La tua domanda').press('Enter');
  await expect(panel.getByRole('alert')).toContainText('riprova domani');
  await panel.getByRole('button', { name: 'Riprova' }).click();
  await expect(panel.getByRole('alert')).toContainText('riprova tra 25 minuti');
});

test('teoria: pulsante fisso, contesto della sezione, risposta in inglese nella pagina inglese, axe', async ({
  page,
}) => {
  const w = await fakeWorker(page, () => ({
    events: [
      { type: 'text', text: 'Short answer.' },
      { type: 'done', stop: 'max_tokens' },
    ],
  }));
  await page.goto(`${B}en/anno-1/esempio/teoria/resistori/`);
  await page.getByRole('button', { name: 'Ask the tutor' }).click();
  const panel = page.getByRole('dialog', { name: 'Tutor' });
  await expect(panel).toBeVisible();
  await panel.getByRole('button', { name: 'Explain it more simply' }).click();
  await expect(panel.locator('.tutor__msg--assistant')).toContainText('Short answer.');
  await expect(panel).toContainText('ask it to continue');
  expect(w.requests[0]!.body).toMatchObject({ lang: 'en', context: { kind: 'theory' } });
  expect(w.requests[0]!.body.context.text.length).toBeGreaterThan(20);
  const results = await new AxeBuilder({ page }).include('.tutor').withTags(TAGS).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => v.id)).toEqual([]);
});

test('nella pagina d’esame il tutor non c’è (né pulsante né script)', async ({ page }) => {
  const loads: string[] = [];
  page.on('request', (r) => /Tutor\.astro|\/panel\./.test(r.url()) && loads.push(r.url()));
  await page.goto(`${C}esame/`);
  await expect(page.locator('[data-tutor-open]')).toHaveCount(0);
  await expect(page.locator('#sh-tutor-config')).toHaveCount(0);
  expect(loads).toEqual([]);
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).not.toContain('tutor.invalid');
});
