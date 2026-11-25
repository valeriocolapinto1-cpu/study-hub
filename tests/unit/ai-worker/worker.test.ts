/**
 * Worker del tutor (tools/ai-worker): CORS, validazione, Turnstile e sessione, limiti per IP,
 * tetto di spesa, streaming SSE da Gemini, blocchi di sicurezza, MAX_TOKENS, errori e tempo massimo.
 * `fetch` finto per Turnstile e per l'API Gemini: nessuna chiamata reale.
 */
import { describe, expect, it } from 'vitest';
import { handle, type Deps, type LimitsClient } from '../../../tools/ai-worker/src/handler';
import { readConfig, DEFAULT_MODEL, DEFAULT_PRICE } from '../../../tools/ai-worker/src/config';
import {
  begin,
  end,
  spentToday,
  secondsToNextDay,
  type LimitStore,
} from '../../../tools/ai-worker/src/limits';
import { usageCost, tokenCost, worstCaseCost } from '../../../tools/ai-worker/src/pricing';
import { validateRequest, LIMITS } from '../../../tools/ai-worker/src/validate';
import { INSTRUCTIONS, apiContents, contextBlock } from '../../../tools/ai-worker/src/prompt';
import {
  buildRequest,
  classifyStatus,
  outcome,
  readSse,
  streamUrl,
  type StreamChunk,
} from '../../../tools/ai-worker/src/gemini';
import { checkSession, hashIp, issueSession, SITEVERIFY_URL } from '../../../tools/ai-worker/src/session';

const ORIGIN = 'https://esempio.github.io';
const NOW = Date.UTC(2026, 10, 24, 10, 0, 0);

const body = (over: Record<string, unknown> = {}) => ({
  lang: 'it',
  course: { id: 'teoria-circuiti', title: 'Teoria dei Circuiti', outline: '1. Leggi di Kirchhoff' },
  context: {
    kind: 'exercise',
    title: 'Esercizio 1',
    text: 'Calcola $V$.',
    answer: '5 V',
    solution: '$V = 10\\,\\mathrm{V}$',
  },
  messages: [{ role: 'user', content: 'Dove sbaglio?' }],
  turnstile: 'tok-ok',
  ...over,
});

function memoryStore(): LimitStore & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>();
  return {
    data,
    get: async <T>(k: string) => structuredClone(data.get(k)) as T | undefined,
    put: async <T>(k: string, v: T) => void data.set(k, structuredClone(v)),
  };
}

function memoryLimits(store = memoryStore()): LimitsClient & { store: ReturnType<typeof memoryStore> } {
  return { store, begin: (o) => begin(store, o), end: (o) => end(store, o) };
}

const USAGE = {
  promptTokenCount: 1000,
  candidatesTokenCount: 150,
  thoughtsTokenCount: 50,
  totalTokenCount: 1200,
};

/** Pezzi di una risposta normale: testo a pezzi, poi finishReason e usageMetadata. */
const textChunks = (parts: string[], finishReason = 'STOP', usage: object | null = USAGE): StreamChunk[] => [
  ...parts.map(
    (text) => ({ candidates: [{ content: { role: 'model', parts: [{ text }] } }] }) as StreamChunk,
  ),
  {
    candidates: [{ content: { role: 'model', parts: [] }, finishReason }],
    ...(usage ? { usageMetadata: usage } : {}),
  } as StreamChunk,
];

/** Corpo SSE come lo manda Google (`data: {json}\r\n\r\n`), in pezzi di byte arbitrari. */
function sseBody(
  chunks: unknown[],
  opts: { cutAfter?: number; split?: number } = {},
): ReadableStream<Uint8Array> {
  const text = chunks
    .slice(0, opts.cutAfter ?? chunks.length)
    .map((c) => `data: ${JSON.stringify(c)}\r\n\r\n`)
    .join('');
  const bytes = new TextEncoder().encode(text);
  const size = opts.split ?? 7;
  let i = 0;
  return new ReadableStream({
    pull(ctrl) {
      if (i >= bytes.length) {
        if (opts.cutAfter !== undefined && opts.cutAfter < chunks.length) ctrl.error(new Error('rete'));
        else ctrl.close();
        return;
      }
      ctrl.enqueue(bytes.slice(i, i + size));
      i += size;
    },
  });
}

type GeminiReply =
  | { chunks: unknown[]; cutAfter?: number }
  | { status: number; json?: unknown }
  | { hang: true }
  | { throws: true };

interface GeminiCall {
  url: string;
  headers: Headers;
  body: Record<string, unknown>;
}

/** `fetch` finto: Turnstile accetta solo `tok-ok`; Gemini risponde con le risposte in coda. */
function fakeFetch(replies: GeminiReply[] = [{ chunks: textChunks(['Ciao', ' studente']) }], verify = true) {
  const gemini: GeminiCall[] = [];
  const turnstile: string[] = [];
  let next = 0;
  const fetchFn = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url === SITEVERIFY_URL) {
      const form = init?.body as FormData;
      turnstile.push(String(form.get('response')));
      return Response.json({ success: verify && form.get('response') === 'tok-ok' });
    }
    expect(url.startsWith('https://generativelanguage.googleapis.com/v1beta/models/')).toBe(true);
    gemini.push({
      url,
      headers: new Headers(init?.headers),
      body: JSON.parse(String(init?.body)) as Record<string, unknown>,
    });
    const reply = replies[Math.min(next++, replies.length - 1)]!;
    if ('throws' in reply) throw new TypeError('fetch failed');
    if ('hang' in reply)
      return new Promise<Response>((_, reject) =>
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))),
      );
    if ('status' in reply)
      return Response.json(reply.json ?? { error: { code: reply.status, status: 'X' } }, {
        status: reply.status,
      });
    return new Response(sseBody(reply.chunks, { cutAfter: reply.cutAfter }), {
      headers: { 'content-type': 'text/event-stream' },
    });
  }) as typeof fetch;
  return { fetchFn, gemini, turnstile };
}

function deps(over: Partial<Deps> & { replies?: GeminiReply[]; verify?: boolean } = {}) {
  const pending: Promise<unknown>[] = [];
  const logs: string[] = [];
  const fake = fakeFetch(over.replies, over.verify ?? true);
  const d: Deps = {
    env: {
      GEMINI_API_KEY: 'chiave-finta',
      TURNSTILE_SECRET_KEY: 'segreto',
      ALLOWED_ORIGINS: `${ORIGIN}, http://localhost:4321/`,
    },
    limits: memoryLimits(),
    fetchFn: fake.fetchFn,
    waitUntil: (p) => void pending.push(p),
    now: () => NOW,
    sleep: async () => undefined,
    log: (m) => void logs.push(m),
    ...over,
  };
  return { d, pending, logs, gemini: fake.gemini, turnstileCalls: fake.turnstile };
}

const post = (payload: unknown, headers: Record<string, string> = {}) =>
  new Request('https://tutor.example.workers.dev/chat', {
    method: 'POST',
    headers: {
      origin: ORIGIN,
      'content-type': 'application/json',
      'cf-connecting-ip': '203.0.113.7',
      ...headers,
    },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });

/** Eventi SSE di una risposta. */
async function events(res: Response): Promise<Record<string, unknown>[]> {
  const text = await res.text();
  return text
    .split('\n\n')
    .filter((b) => b.startsWith('data: '))
    .map((b) => JSON.parse(b.slice(6)) as Record<string, unknown>);
}

/** Una domanda completa: eventi dello stream e stato dei limiti a fine risposta. */
async function ask(replies: GeminiReply[], over: Partial<Deps> = {}) {
  const limits = memoryLimits();
  const x = deps({ replies, limits, ...over });
  const res = await handle(post(body()), x.d);
  const ev = await events(res);
  await Promise.all(x.pending);
  const day = limits.store.data.get('day:2026-11-24') as { reserved: number; spent: number };
  return { ev, day, ...x };
}

describe('CORS e metodo', () => {
  it('rifiuta origini non ammesse e richieste senza Origin', async () => {
    const { d } = deps();
    const bad = await handle(post(body(), { origin: 'https://altro.example' }), d);
    expect(bad.status).toBe(403);
    expect(bad.headers.get('access-control-allow-origin')).toBeNull();
    const none = new Request('https://x/chat', { method: 'POST', body: '{}' });
    expect((await handle(none, d)).status).toBe(403);
  });

  it('risponde al preflight solo per l’origine del sito (anche con barra finale in configurazione)', async () => {
    const { d } = deps();
    const res = await handle(
      new Request('https://x/chat', { method: 'OPTIONS', headers: { origin: 'http://localhost:4321' } }),
      d,
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:4321');
    expect(res.headers.get('access-control-allow-headers')).toContain('x-tutor-session');
  });

  it('404 fuori da /chat, 405 per GET', async () => {
    const { d } = deps();
    expect((await handle(new Request('https://x/', { headers: { origin: ORIGIN } }), d)).status).toBe(404);
    expect((await handle(new Request('https://x/chat', { headers: { origin: ORIGIN } }), d)).status).toBe(
      405,
    );
  });

  it('503 senza chiave, senza Durable Object o senza Turnstile', async () => {
    expect((await handle(post(body()), deps({ env: { ALLOWED_ORIGINS: ORIGIN } }).d)).status).toBe(503);
    expect((await handle(post(body()), deps({ limits: null }).d)).status).toBe(503);
    const noTs = deps({ env: { GEMINI_API_KEY: 'chiave-finta', ALLOWED_ORIGINS: ORIGIN } }).d;
    expect((await handle(post(body()), noTs)).status).toBe(503);
  });
});

describe('validazione', () => {
  it('accetta una richiesta valida e taglia gli spazi', () => {
    const r = validateRequest(body({ messages: [{ role: 'user', content: '  ciao  ' }] }));
    expect(r.ok && r.value.messages[0]!.content).toBe('ciao');
  });

  it('rifiuta turni non alterni, prefill dell’assistente e campi mancanti', () => {
    const user = { role: 'user', content: 'a' };
    const bot = { role: 'assistant', content: 'b' };
    expect(validateRequest(body({ messages: [bot] })).ok).toBe(false);
    expect(validateRequest(body({ messages: [user, bot] })).ok).toBe(false);
    expect(validateRequest(body({ messages: [user, user] })).ok).toBe(false);
    expect(validateRequest(body({ lang: 'fr' })).ok).toBe(false);
    expect(validateRequest(body({ course: { id: 'X Y', title: 't', outline: 'o' } })).ok).toBe(false);
    expect(validateRequest(body({ context: { kind: 'quiz', title: 't', text: 'x' } })).ok).toBe(false);
    expect(validateRequest(body({ context: { kind: 'theory', title: 't', text: 'x', answer: 3 } })).ok).toBe(
      false,
    );
    expect(validateRequest('x').ok).toBe(false);
  });

  it('413 per messaggi troppo lunghi, troppi turni o corpo enorme', async () => {
    const { d } = deps();
    const long = await handle(
      post(body({ messages: [{ role: 'user', content: 'x'.repeat(LIMITS.message + 1) }] })),
      d,
    );
    expect(long.status).toBe(413);
    expect(await long.json()).toMatchObject({ error: 'too-long', field: 'messages.0' });
    const turns = Array.from({ length: LIMITS.messages + 1 }, (_, i) => ({
      role: i % 2 ? 'assistant' : 'user',
      content: 'x',
    }));
    expect((await handle(post(body({ messages: turns })), d)).status).toBe(413);
    expect((await handle(post('x'.repeat(LIMITS.body + 1)), d)).status).toBe(413);
    expect((await handle(post('{rotto'), d)).status).toBe(400);
  });
});

describe('Turnstile e sessione', () => {
  it('senza token valido: 401; con token: sessione nuova nello stream, poi basta la sessione', async () => {
    const { d, pending, turnstileCalls } = deps();
    expect((await handle(post(body({ turnstile: undefined })), d)).status).toBe(401);
    expect((await handle(post(body({ turnstile: 'tok-falso' })), d)).status).toBe(401);

    const first = await handle(post(body()), d);
    const ev = await events(first);
    await Promise.all(pending);
    const token = ev.find((e) => e.type === 'session')?.token as string;
    expect(token).toMatch(/^v1\./);
    const calls = turnstileCalls.length;

    const second = await handle(post(body({ turnstile: undefined }), { 'x-tutor-session': token }), d);
    expect(second.status).toBe(200);
    expect((await events(second)).some((e) => e.type === 'session')).toBe(false);
    expect(turnstileCalls.length).toBe(calls);
  });

  it('la sessione è legata all’IP e scade', async () => {
    const ip = await hashIp('203.0.113.7', 's');
    const token = await issueSession('s', ip, NOW);
    expect(await checkSession(token, 's', ip, NOW + 1000)).toBe(true);
    expect(await checkSession(token, 's', await hashIp('198.51.100.1', 's'), NOW)).toBe(false);
    expect(await checkSession(token, 's', ip, NOW + 3 * 3_600_000)).toBe(false);
    expect(await checkSession(token, 'altro', ip, NOW)).toBe(false);
    expect(await checkSession(token.slice(0, -2) + 'xx', 's', ip, NOW)).toBe(false);
    expect(await checkSession(null, 's', ip, NOW)).toBe(false);
  });

  it('senza secret di Turnstile solo con ALLOW_NO_TURNSTILE=1 (prove locali)', async () => {
    const { d, pending } = deps({
      env: { GEMINI_API_KEY: 'chiave-finta', ALLOWED_ORIGINS: ORIGIN, ALLOW_NO_TURNSTILE: '1' },
    });
    const res = await handle(post(body({ turnstile: undefined })), d);
    expect(res.status).toBe(200);
    await events(res);
    await Promise.all(pending);
  });
});

describe('limiti', () => {
  it('20 richieste all’ora per IP, poi 429 con Retry-After', async () => {
    const limits = memoryLimits();
    let t = NOW;
    const { d, pending } = deps({ limits, now: () => t });
    const ip = {
      'x-tutor-session': await issueSession('segreto', await hashIp('203.0.113.7', 'segreto'), NOW),
    };
    for (let i = 0; i < 20; i++) {
      const r = await handle(post(body({ turnstile: undefined }), ip), d);
      expect(r.status).toBe(200);
      await events(r);
    }
    await Promise.all(pending);
    const over = await handle(post(body({ turnstile: undefined }), ip), d);
    expect(over.status).toBe(429);
    expect(await over.json()).toMatchObject({ error: 'rate' });
    expect(Number(over.headers.get('retry-after'))).toBe(3600);
    // un altro IP passa
    const other = await handle(post(body(), { 'cf-connecting-ip': '198.51.100.1' }), d);
    expect(other.status).toBe(200);
    await events(other);
    // dopo un'ora si riparte
    t = NOW + 3_600_001;
    const later = await handle(post(body()), d);
    expect(later.status).toBe(200);
    await events(later);
    await Promise.all(pending);
    expect(JSON.stringify(limits.store.data.get('ips'))).not.toContain('203.0.113.7');
  });

  it('tetto di spesa: 429 «budget» fino a mezzanotte UTC, prenotazione poi sostituita dal costo reale', async () => {
    const limits = memoryLimits();
    const { d, pending } = deps({ limits, env: { ...deps().d.env, DAILY_BUDGET_USD: '0.2' } });
    const r1 = await handle(post(body()), d);
    await events(r1);
    await Promise.all(pending);
    const spent = await spentToday(limits.store, NOW);
    expect(spent).toBeCloseTo(tokenCost(1000, 200, DEFAULT_PRICE));
    const day = limits.store.data.get('day:2026-11-24') as { reserved: number };
    expect(day.reserved).toBeCloseTo(0);

    await limits.store.put('day:2026-11-24', { spent: 0.19, reserved: 0 });
    const r2 = await handle(post(body()), d);
    expect(r2.status).toBe(429);
    expect(await r2.json()).toMatchObject({ error: 'budget', retryAfter: secondsToNextDay(NOW) });
    expect(secondsToNextDay(NOW)).toBe(14 * 3600);
  });

  it('le prenotazioni contemporanee contano nel tetto', async () => {
    const store = memoryStore();
    const o = { ipHash: 'a', now: NOW, perHour: 100, budgetUsd: 1, reserveUsd: 0.4 };
    expect((await begin(store, o)).ok).toBe(true);
    expect((await begin(store, o)).ok).toBe(true);
    expect(await begin(store, o)).toMatchObject({ ok: false, reason: 'budget' });
    await end(store, { now: NOW, startedAt: NOW, reservedUsd: 0.4, actualUsd: 0.01 });
    expect((await begin(store, o)).ok).toBe(true);
  });
});

describe('streaming e chiamata a Gemini', () => {
  it('inoltra il testo in SSE e chiude con done', async () => {
    const { ev, gemini, day } = await ask([{ chunks: textChunks(['La legge ', 'di Ohm: $V = RI$']) }]);
    expect(
      ev
        .filter((e) => e.type === 'text')
        .map((e) => e.text)
        .join(''),
    ).toBe('La legge di Ohm: $V = RI$');
    expect(ev.at(-1)).toEqual({ type: 'done', stop: 'end_turn' });
    expect(gemini).toHaveLength(1);
    // costo da usageMetadata: ingresso 1000, uscita 150 + 50 di ragionamento
    expect(day.spent).toBeCloseTo((1000 * 1.5 + 200 * 7.5) / 1e6);
    expect(day.reserved).toBeCloseTo(0);
  });

  it('URL, chiave nell’intestazione e mai nell’URL, corpo della richiesta', async () => {
    const { gemini } = await ask([{ chunks: textChunks(['ok']) }]);
    const call = gemini[0]!;
    expect(call.url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-4-hydrogen:streamGenerateContent?alt=sse',
    );
    expect(call.url).not.toContain('chiave-finta');
    expect(call.headers.get('x-goog-api-key')).toBe('chiave-finta');
    expect(call.headers.get('content-type')).toBe('application/json');
    expect(call.body.generationConfig).toEqual({
      maxOutputTokens: 4000,
      thinkingConfig: { thinkingLevel: 'LOW' },
    });
    const sys = call.body.systemInstruction as { parts: { text: string }[] };
    expect(sys.parts[0]!.text).toBe(INSTRUCTIONS);
    expect(sys.parts[1]!.text).toContain('<course id="teoria-circuiti">');
    for (const k of ['temperature', 'topP', 'topK', 'cachedContent', 'tools', 'safetySettings'])
      expect(JSON.stringify(call.body)).not.toContain(`"${k}"`);
  });

  it('richiesta: ruoli user/model, contesto nel primo messaggio, parti fisse uguali tra pagine', () => {
    const r = validateRequest(
      body({
        context: { kind: 'card', title: 'Scheda', text: 'Fronte' },
        messages: [
          { role: 'user', content: 'a' },
          { role: 'assistant', content: 'b' },
          { role: 'user', content: 'c' },
        ],
      }),
    );
    if (!r.ok) throw new Error('richiesta non valida');
    const contents = apiContents(r.value);
    expect(contents.map((c) => c.role)).toEqual(['user', 'model', 'user']);
    expect(contents[0]!.parts).toHaveLength(2);
    expect(contents[0]!.parts[0]!.text).toContain('<reference_solution>not available');
    expect(contents[0]!.parts[0]!.text).toContain('reply_language="Italian"');
    expect(contents[2]).toEqual({ role: 'user', parts: [{ text: 'c' }] });
    expect(contextBlock(r.value)).toContain('kind="flashcard"');
    // il prefisso (systemInstruction) non cambia tra lingue e pagine diverse
    const en = validateRequest(body({ lang: 'en', context: { kind: 'theory', title: 'X', text: 'Y' } }));
    if (!en.ok) throw new Error('richiesta non valida');
    expect(buildRequest(en.value, readConfig({})).systemInstruction).toEqual(
      buildRequest(r.value, readConfig({})).systemInstruction,
    );
  });

  it('configurazione: modello, livello di ragionamento, tetti e prezzi dalle variabili', () => {
    expect(readConfig({})).toMatchObject({
      model: DEFAULT_MODEL,
      thinkingLevel: 'low',
      maxTokens: 4000,
      price: DEFAULT_PRICE,
      timeoutMs: 60_000,
    });
    const c = readConfig({
      MODEL: 'gemini-3.5-flash-lite',
      THINKING_LEVEL: 'MINIMAL',
      MAX_TOKENS: '999999',
      PRICE_INPUT_PER_MTOK: '0.25',
      PRICE_OUTPUT_PER_MTOK: '2',
      TIMEOUT_SECONDS: '30',
    });
    expect(c).toMatchObject({
      model: 'gemini-3.5-flash-lite',
      thinkingLevel: 'minimal',
      maxTokens: 16000,
      price: { input: 0.25, output: 2 },
      timeoutMs: 30_000,
    });
    // valori non validi → predefiniti (un nome con / o ? finirebbe nell'URL)
    expect(
      readConfig({
        MODEL: '../x?key=1',
        THINKING_LEVEL: 'tanto',
        PRICE_INPUT_PER_MTOK: 'gratis',
        PRICE_OUTPUT_PER_MTOK: '0',
      }),
    ).toMatchObject({ model: DEFAULT_MODEL, thinkingLevel: 'low', price: { input: 1.5, output: 0.001 } });
    const r = validateRequest(body());
    if (!r.ok) throw new Error('richiesta non valida');
    expect(buildRequest(r.value, readConfig({ THINKING_LEVEL: 'default' })).generationConfig).toEqual({
      maxOutputTokens: 4000,
    });
    expect(streamUrl('gemini-3.5-flash-lite')).toContain(
      '/models/gemini-3.5-flash-lite:streamGenerateContent?alt=sse',
    );
  });

  it('le parti di ragionamento non arrivano allo studente', async () => {
    const { ev } = await ask([
      {
        chunks: [
          { candidates: [{ content: { parts: [{ text: 'penso…', thought: true }, { text: 'Risposta' }] } }] },
          { candidates: [{ content: { parts: [] }, finishReason: 'STOP' }], usageMetadata: USAGE },
        ],
      },
    ]);
    expect(ev.filter((e) => e.type === 'text')).toEqual([{ type: 'text', text: 'Risposta' }]);
  });

  it('domanda bloccata (promptFeedback.blockReason): refusal senza testo', async () => {
    const { ev, day } = await ask([
      {
        chunks: [
          {
            promptFeedback: { blockReason: 'SAFETY' },
            usageMetadata: { promptTokenCount: 900, totalTokenCount: 900 },
          },
        ],
      },
    ]);
    expect(ev).toEqual([{ type: 'session', token: expect.any(String) }, { type: 'refusal' }]);
    expect(day.spent).toBeCloseTo((900 * 1.5) / 1e6);
  });

  it.each(['SAFETY', 'RECITATION', 'PROHIBITED_CONTENT', 'SPII', 'BLOCKLIST', 'OTHER'])(
    'risposta bloccata a metà (%s): refusal, il pannello scarta il parziale',
    async (reason) => {
      const { ev } = await ask([{ chunks: textChunks(['Parz'], reason) }]);
      expect(ev.some((e) => e.type === 'text')).toBe(true);
      expect(ev.at(-1)).toEqual({ type: 'refusal' });
    },
  );

  it('MAX_TOKENS: done con max_tokens (avviso «risposta interrotta»)', async () => {
    const { ev } = await ask([{ chunks: textChunks(['Lunga…'], 'MAX_TOKENS') }]);
    expect(ev.at(-1)).toEqual({ type: 'done', stop: 'max_tokens' });
  });

  it('esiti: STOP, troncamenti, blocchi, errori del servizio, stream senza fine', () => {
    expect(outcome(undefined, 'STOP')).toEqual({ kind: 'done', stop: 'end_turn' });
    expect(outcome(undefined, 'CONTINUATION')).toEqual({ kind: 'done', stop: 'max_tokens' });
    expect(outcome('PROHIBITED_CONTENT', undefined)).toMatchObject({ kind: 'refusal' });
    expect(outcome('OTHER', 'STOP')).toMatchObject({ kind: 'refusal' });
    expect(outcome(undefined, 'MALFORMED_RESPONSE')).toEqual({ kind: 'error', code: 'upstream' });
    expect(outcome(undefined, undefined)).toEqual({ kind: 'error', code: 'upstream' });
  });

  it('stream interrotto senza finishReason: errore, costo stimato dalla lunghezza', async () => {
    const { ev, day } = await ask([
      { chunks: textChunks(['x'.repeat(300), 'y'], 'STOP', null), cutAfter: 1 },
    ]);
    expect(ev.at(-1)).toEqual({ type: 'error', code: 'upstream' });
    // senza usageMetadata: ingresso dalla richiesta (+ istruzioni), uscita dai 300 caratteri arrivati
    expect(day.spent).toBeGreaterThan(tokenCost(INSTRUCTIONS.length / 3, 100, DEFAULT_PRICE) * 0.99);
    expect(day.reserved).toBeCloseTo(0);
  });

  it('finishReason senza usageMetadata: stima dalla lunghezza', async () => {
    const { ev, day } = await ask([{ chunks: textChunks(['abc'], 'STOP', null) }]);
    expect(ev.at(-1)).toEqual({ type: 'done', stop: 'end_turn' });
    expect(day.spent).toBeGreaterThan(0);
  });

  it.each([
    [400, 'INVALID_ARGUMENT', 'invalid'],
    [400, 'FAILED_PRECONDITION', 'unconfigured'],
    [401, 'UNAUTHENTICATED', 'unconfigured'],
    [403, 'PERMISSION_DENIED', 'unconfigured'],
    [404, 'NOT_FOUND', 'unconfigured'],
    [429, 'RESOURCE_EXHAUSTED', 'quota'],
    [504, 'DEADLINE_EXCEEDED', 'timeout'],
  ])('HTTP %i %s → error %s, senza nuovi tentativi', async (status, gStatus, code) => {
    const { ev, gemini, logs, day } = await ask([
      { status, json: { error: { code: status, message: 'dettagli', status: gStatus } } },
    ]);
    expect(ev.at(-1)).toEqual({ type: 'error', code });
    expect(gemini).toHaveLength(1);
    expect(logs).toEqual([`gemini ${status} ${gStatus}`]);
    expect(day.reserved).toBeCloseTo(0);
  });

  it('503/500: due nuovi tentativi, poi overloaded; se un tentativo riesce, la risposta arriva', async () => {
    const fail = await ask([{ status: 503 }, { status: 500 }, { status: 503 }]);
    expect(fail.gemini).toHaveLength(3);
    expect(fail.ev.at(-1)).toEqual({ type: 'error', code: 'overloaded' });
    const ok = await ask([{ status: 503 }, { chunks: textChunks(['Eccomi']) }]);
    expect(ok.gemini).toHaveLength(2);
    expect(ok.ev.at(-1)).toEqual({ type: 'done', stop: 'end_turn' });
  });

  it('errore di rete: nuovi tentativi, poi upstream', async () => {
    const { ev, gemini } = await ask([{ throws: true }]);
    expect(gemini).toHaveLength(3);
    expect(ev.at(-1)).toEqual({ type: 'error', code: 'upstream' });
  });

  it('errore dentro lo stream: evento error classificato', async () => {
    const { ev, logs } = await ask([
      {
        chunks: [
          { candidates: [{ content: { parts: [{ text: 'Inizio' }] } }] },
          { error: { code: 429, status: 'RESOURCE_EXHAUSTED', message: 'quota' } },
        ],
      },
    ]);
    expect(ev.at(-1)).toEqual({ type: 'error', code: 'quota' });
    expect(logs[0]).toContain('429');
  });

  it('tempo massimo: la chiamata si interrompe ed esce timeout', async () => {
    const { ev, day } = await ask([{ hang: true }], {
      env: { ...deps().d.env, TIMEOUT_SECONDS: '5' },
    });
    expect(ev.at(-1)).toEqual({ type: 'error', code: 'timeout' });
    expect(day.reserved).toBeCloseTo(0);
  }, 10_000);

  it('classifica gli stati HTTP', () => {
    expect(classifyStatus(402)).toBe('unconfigured');
    expect(classifyStatus(500)).toBe('overloaded');
    expect(classifyStatus(418)).toBe('upstream');
  });

  it('lettore SSE: righe CRLF, pezzi spezzati a metà, righe non JSON ignorate', async () => {
    const raw = 'data: {"a":1}\r\n\r\n: commento\r\n\r\ndata: rotto\r\n\r\ndata: {"b":2}';
    const bytes = new TextEncoder().encode(raw);
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        for (let i = 0; i < bytes.length; i += 3) c.enqueue(bytes.slice(i, i + 3));
        c.close();
      },
    });
    const out: unknown[] = [];
    for await (const chunk of readSse(stream)) out.push(chunk);
    expect(out).toEqual([{ a: 1 }, { b: 2 }]);
  });
});

describe('stima dei costi', () => {
  const price = { input: 1.5, output: 7.5 };

  it('da usageMetadata: ingresso + strumenti; uscita + ragionamento', () => {
    expect(
      usageCost(
        { promptTokenCount: 1e6, toolUsePromptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 1e6 },
        price,
        { inputChars: 0, outputChars: 0 },
      ),
    ).toBeCloseTo(1.5);
    expect(
      usageCost(
        { promptTokenCount: 0, candidatesTokenCount: 5e5, thoughtsTokenCount: 5e5, totalTokenCount: 1e6 },
        price,
        { inputChars: 0, outputChars: 0 },
      ),
    ).toBeCloseTo(7.5);
    // la cache implicita non dà sconto nella stima (per eccesso)
    expect(
      usageCost({ promptTokenCount: 1e6, cachedContentTokenCount: 9e5, candidatesTokenCount: 0 }, price, {
        inputChars: 0,
        outputChars: 0,
      }),
    ).toBeCloseTo(1.5);
    // solo il totale: l'uscita è la differenza
    expect(
      usageCost({ promptTokenCount: 1e6, totalTokenCount: 2e6 }, price, { inputChars: 0, outputChars: 0 }),
    ).toBeCloseTo(9);
  });

  it('senza usageMetadata: stima dai caratteri (3 per token)', () => {
    expect(usageCost(undefined, price, { inputChars: 3e6, outputChars: 3e6 })).toBeCloseTo(9);
    expect(usageCost({}, price, { inputChars: 3e6, outputChars: 0 })).toBeCloseTo(1.5);
  });

  it('prenotazione = ingresso stimato + tetto dei token in uscita', () => {
    expect(worstCaseCost(3e6, 1e6, price)).toBeCloseTo(9);
  });
});
