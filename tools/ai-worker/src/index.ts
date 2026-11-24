/**
 * Worker Cloudflare del tutor AI (revisione 2, R12). Tiene la chiave dell'API come secret e
 * chiama la Messages API in streaming; il sito parla solo con questo Worker.
 * Guida alla pubblicazione: docs/TUTOR-AI.md. Logica in handler.ts (provata con un client finto).
 */
import Anthropic from '@anthropic-ai/sdk';
import type { Env } from './config';
import { handle, type LimitsClient } from './handler';
import { begin, end, type LimitStore } from './limits';

/** Errori dell'API → codice breve per il pannello (le classi dell'SDK, non i messaggi). */
export function classifyError(err: unknown): string {
  if (err instanceof Anthropic.RateLimitError) return 'overloaded';
  if (err instanceof Anthropic.InternalServerError) return 'overloaded';
  if (err instanceof Anthropic.AuthenticationError) return 'unconfigured';
  if (err instanceof Anthropic.BadRequestError) return 'invalid';
  if (err instanceof Anthropic.APIError) return 'upstream';
  return 'upstream';
}

/** Client dei limiti verso il Durable Object (un'istanza sola, nome fisso). */
function limitsClient(env: Env): LimitsClient | null {
  const ns = env.LIMITS;
  if (!ns) return null;
  const stub = ns.get(ns.idFromName('tutor'));
  const call = async <T>(path: string, body: unknown): Promise<T> => {
    const res = await stub.fetch(`https://limits${path}`, { method: 'POST', body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`limits ${res.status}`);
    return (await res.json()) as T;
  };
  return {
    begin: (opts) => call('/begin', opts),
    end: async (opts) => {
      await call('/end', opts);
    },
  };
}

interface ExecutionContextLike {
  waitUntil(p: Promise<unknown>): void;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContextLike): Promise<Response> {
    return handle(request, {
      env,
      streamer: (apiKey) => {
        // Due tentativi automatici dell'SDK su 429/5xx/errori di rete, come da predefinito.
        const client = new Anthropic({ apiKey });
        return { stream: (params, opts) => client.beta.messages.stream(params, { signal: opts.signal }) };
      },
      limits: limitsClient(env),
      fetchFn: fetch.bind(globalThis),
      waitUntil: (p) => ctx.waitUntil(p),
      classifyError,
    });
  },
};

interface DurableObjectStateLike {
  storage: LimitStore;
  blockConcurrencyWhile<T>(fn: () => Promise<T>): Promise<T>;
}

/**
 * Durable Object dei limiti (SQLite, piano gratuito). Le operazioni girano una per volta
 * (`blockConcurrencyWhile`), così leggere e aggiornare i contatori è atomico.
 */
export class TutorLimits {
  constructor(
    private readonly state: DurableObjectStateLike,
    _env: Env,
  ) {}

  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    const body: unknown = await request.json();
    return this.state.blockConcurrencyWhile(async () => {
      if (path === '/begin')
        return Response.json(await begin(this.state.storage, body as Parameters<typeof begin>[1]));
      if (path === '/end') {
        await end(this.state.storage, body as Parameters<typeof end>[1]);
        return Response.json({ ok: true });
      }
      return new Response('not found', { status: 404 });
    });
  }
}
