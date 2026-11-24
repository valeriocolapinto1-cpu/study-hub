/**
 * Worker del tutor (tools/ai-worker): CORS, validazione, Turnstile e sessione, limiti per IP,
 * tetto di spesa, streaming SSE, rifiuti ed errori. Client dell'API finto: nessuna chiamata reale.
 */
import { describe, expect, it } from 'vitest';
import type {
  BetaMessage,
  BetaRawMessageStreamEvent,
} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import {
  handle,
  buildParams,
  type Deps,
  type LimitsClient,
  type Streamer,
} from '../../../tools/ai-worker/src/handler';
import { readConfig, FALLBACK_BETA } from '../../../tools/ai-worker/src/config';
import {
  begin,
  end,
  spentToday,
  secondsToNextDay,
  type LimitStore,
} from '../../../tools/ai-worker/src/limits';
import { usageCost, attemptCost } from '../../../tools/ai-worker/src/pricing';
import { validateRequest, LIMITS } from '../../../tools/ai-worker/src/validate';
import { INSTRUCTIONS, apiMessages, contextBlock } from '../../../tools/ai-worker/src/prompt';
import { checkSession, hashIp, issueSession } from '../../../tools/ai-worker/src/session';
import { classifyError } from '../../../tools/ai-worker/src/index';
import Anthropic from '@anthropic-ai/sdk';

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

const message = (over: Partial<BetaMessage> = {}): BetaMessage =>
  ({
    id: 'msg_1',
    type: 'message',
    role: 'assistant',
    model: 'claude-opus-5-5',
    content: [],
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: 1000,
      output_tokens: 200,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    },
    ...over,
  }) as unknown as BetaMessage;

const textEvents = (parts: string[], final: BetaMessage): BetaRawMessageStreamEvent[] =>
  [
    { type: 'message_start', message: { ...final, content: [], stop_reason: null } },
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    ...parts.map((text) => ({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } })),
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: final.stop_reason }, usage: final.usage },
    { type: 'message_stop' },
  ] as unknown as BetaRawMessageStreamEvent[];

interface FakeCall {
  params: Parameters<Streamer['stream']>[0];
}

function fakeStreamer(
  opts: { parts?: string[]; final?: BetaMessage; throwAt?: number; error?: unknown } = {},
) {
  const calls: FakeCall[] = [];
  const final = opts.final ?? message();
  const streamer = (apiKey: string): Streamer => {
    expect(apiKey).toBe('sk-finta');
    return {
      stream: (params) => {
        calls.push({ params });
        const events = textEvents(opts.parts ?? ['Ciao', ' studente'], final);
        return {
          async *[Symbol.asyncIterator]() {
            for (const [i, e] of events.entries()) {
              if (opts.throwAt === i) throw opts.error ?? new Error('rete');
              yield e;
            }
          },
          finalMessage: async () => final,
        };
      },
    };
  };
  return { streamer, calls };
}

function deps(over: Partial<Deps> & { verify?: boolean } = {}) {
  const pending: Promise<unknown>[] = [];
  const turnstileCalls: string[] = [];
  const fetchFn = (async (_url: string | URL | Request, init?: RequestInit) => {
    const form = init?.body as FormData;
    turnstileCalls.push(String(form.get('response')));
    return Response.json({ success: (over.verify ?? true) && form.get('response') === 'tok-ok' });
  }) as typeof fetch;
  const d: Deps = {
    env: {
      ANTHROPIC_API_KEY: 'sk-finta',
      TURNSTILE_SECRET_KEY: 'segreto',
      ALLOWED_ORIGINS: `${ORIGIN}, http://localhost:4321/`,
    },
    streamer: fakeStreamer().streamer,
    limits: memoryLimits(),
    fetchFn,
    waitUntil: (p) => void pending.push(p),
    now: () => NOW,
    ...over,
  };
  return { d, pending, turnstileCalls };
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
    const noTs = deps({ env: { ANTHROPIC_API_KEY: 'sk-finta', ALLOWED_ORIGINS: ORIGIN } }).d;
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
      env: { ANTHROPIC_API_KEY: 'sk-finta', ALLOWED_ORIGINS: ORIGIN, ALLOW_NO_TURNSTILE: '1' },
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
    expect(spent).toBeCloseTo(usageCost(message().usage, 'claude-opus-5-5'));
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

describe('streaming e chiamata all’API', () => {
  it('inoltra il testo in SSE e chiude con done', async () => {
    const { streamer, calls } = fakeStreamer({ parts: ['La legge ', 'di Ohm: $V = RI$'] });
    const { d, pending } = deps({ streamer });
    const res = await handle(post(body()), d);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    expect(res.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    const ev = await events(res);
    await Promise.all(pending);
    expect(
      ev
        .filter((e) => e.type === 'text')
        .map((e) => e.text)
        .join(''),
    ).toBe('La legge di Ohm: $V = RI$');
    expect(ev.at(-1)).toEqual({ type: 'done', stop: 'end_turn' });
    expect(calls).toHaveLength(1);
  });

  it('parametri: modello predefinito, effort low, max_tokens 4000, cache, fallback, niente prefill', () => {
    const r = validateRequest(body());
    if (!r.ok) throw new Error('richiesta non valida');
    const p = buildParams(r.value, readConfig({}));
    expect(p.model).toBe('claude-opus-5-5');
    expect(p.output_config).toEqual({ effort: 'low' });
    expect(p.max_tokens).toBe(4000);
    expect(p).not.toHaveProperty('thinking');
    expect(p.betas).toEqual([FALLBACK_BETA]);
    expect(p.fallbacks).toBe('default');
    expect(p.cache_control).toEqual({ type: 'ephemeral' });
    const system = p.system as { text: string; cache_control?: unknown }[];
    expect(system[0]!.text).toBe(INSTRUCTIONS);
    expect(system.every((b) => b.cache_control)).toBe(true);
    // le parti fisse non cambiano tra lingue e pagine diverse (prefisso della cache)
    const en = validateRequest(body({ lang: 'en', context: { kind: 'theory', title: 'X', text: 'Y' } }));
    if (!en.ok) throw new Error('richiesta non valida');
    expect(buildParams(en.value, readConfig({})).system).toEqual(p.system);
    expect(p.messages.at(-1)!.role).toBe('user');
    expect(JSON.stringify(p.messages[0])).toContain('reply_language=\\"Italian\\"');
  });

  it('Sonnet e Haiku selezionabili; Haiku senza fallback lato server', () => {
    const r = validateRequest(body());
    if (!r.ok) throw new Error('richiesta non valida');
    const sonnet = buildParams(r.value, readConfig({ MODEL: 'claude-sonnet-5-5' }));
    expect(sonnet.model).toBe('claude-sonnet-5-5');
    expect(sonnet.fallbacks).toBe('default');
    const haiku = buildParams(r.value, readConfig({ MODEL: 'claude-haiku-5-5', EFFORT: 'medium' }));
    expect(haiku.model).toBe('claude-haiku-5-5');
    expect(haiku).not.toHaveProperty('fallbacks');
    expect(haiku).not.toHaveProperty('betas');
    expect(haiku.output_config).toEqual({ effort: 'medium' });
    expect(readConfig({ MODEL: 'gpt-qualcosa', EFFORT: 'max', MAX_TOKENS: '999999' })).toMatchObject({
      model: 'claude-opus-5-5',
      effort: 'low',
      maxTokens: 8000,
    });
  });

  it('il contesto della pagina va nel primo messaggio, con soluzione o «not available»', () => {
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
    const msgs = apiMessages(r.value);
    expect(msgs).toHaveLength(3);
    expect(JSON.stringify(msgs[0])).toContain('<reference_solution>not available');
    expect(msgs[2]).toEqual({ role: 'user', content: 'c' });
    expect(contextBlock(r.value)).toContain('kind="flashcard"');
  });

  it('rifiuto: evento refusal (il pannello scarta il testo parziale)', async () => {
    const { streamer } = fakeStreamer({ parts: ['Parz'], final: message({ stop_reason: 'refusal' }) });
    const { d, pending } = deps({ streamer });
    const ev = await events(await handle(post(body()), d));
    await Promise.all(pending);
    expect(ev.at(-1)).toEqual({ type: 'refusal' });
  });

  it('risposta troncata: done con max_tokens', async () => {
    const { streamer } = fakeStreamer({ final: message({ stop_reason: 'max_tokens' }) });
    const { d, pending } = deps({ streamer });
    const ev = await events(await handle(post(body()), d));
    await Promise.all(pending);
    expect(ev.at(-1)).toEqual({ type: 'done', stop: 'max_tokens' });
  });

  it('errore dell’API a metà: evento error classificato e prenotazione chiusa', async () => {
    const err = new Anthropic.RateLimitError(429, { type: 'error' }, 'troppo', new Headers());
    const { streamer } = fakeStreamer({ throwAt: 3, error: err });
    const limits = memoryLimits();
    const { d, pending } = deps({ streamer, limits, classifyError });
    const ev = await events(await handle(post(body()), d));
    await Promise.all(pending);
    expect(ev.at(-1)).toEqual({ type: 'error', code: 'overloaded' });
    expect(ev.some((e) => e.type === 'text')).toBe(true);
    const day = limits.store.data.get('day:2026-11-24') as { reserved: number; spent: number };
    expect(day.reserved).toBeCloseTo(0);
    expect(day.spent).toBeGreaterThan(0);
  });

  it('classifica gli errori con le classi dell’SDK', () => {
    const h = new Headers();
    expect(classifyError(new Anthropic.InternalServerError(529, undefined, 'x', h))).toBe('overloaded');
    expect(classifyError(new Anthropic.AuthenticationError(401, undefined, 'x', h))).toBe('unconfigured');
    expect(classifyError(new Anthropic.BadRequestError(400, undefined, 'x', h))).toBe('invalid');
    expect(classifyError(new Error('x'))).toBe('upstream');
  });
});

describe('stima dei costi', () => {
  it('prezzi per modello, cache e tentativi di fallback', () => {
    expect(attemptCost({ input_tokens: 1e6, output_tokens: 0 }, 'claude-opus-5-5')).toBeCloseTo(4);
    expect(attemptCost({ input_tokens: 0, output_tokens: 1e6 }, 'claude-haiku-5-5')).toBeCloseTo(0.5);
    expect(
      attemptCost({ input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 1e6 }, 'claude-sonnet-5-5'),
    ).toBeCloseTo(0.1);
    expect(
      attemptCost({ input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 1e6 }, 'claude-opus-5-5'),
    ).toBeCloseTo(5);
    // modello sconosciuto: prezzo più alto
    expect(attemptCost({ input_tokens: 0, output_tokens: 1e6 }, 'claude-ignoto')).toBeCloseTo(25);
    const withFallback = usageCost(
      {
        input_tokens: 0,
        output_tokens: 0,
        iterations: [
          { type: 'message', model: 'claude-opus-5-5', input_tokens: 1e6, output_tokens: 0 },
          { type: 'fallback_message', model: 'claude-opus-4-8', input_tokens: 1e6, output_tokens: 0 },
        ],
      } as never,
      'claude-opus-5-5',
    );
    expect(withFallback).toBeCloseTo(9);
    expect(usageCost(undefined, 'claude-opus-5-5')).toBe(0);
  });
});
