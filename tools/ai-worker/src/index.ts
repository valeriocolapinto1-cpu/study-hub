/**
 * Worker Cloudflare del tutor AI (R12, con Gemini da R15). Tiene la chiave dell'API come secret e
 * chiama `streamGenerateContent` con `fetch`; il sito parla solo con questo Worker.
 * Guida alla pubblicazione: docs/TUTOR-AI.md. Logica in handler.ts (provata con un fetch finto).
 */
import type { Env } from './config';
import { handle, type LimitsClient } from './handler';
import { begin, end, type LimitStore } from './limits';

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
      limits: limitsClient(env),
      fetchFn: fetch.bind(globalThis),
      waitUntil: (p) => ctx.waitUntil(p),
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
