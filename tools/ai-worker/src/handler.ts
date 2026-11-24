/**
 * Gestore HTTP del tutor, indipendente da Cloudflare: client dell'API, limiti, `fetch` per
 * Turnstile e `waitUntil` arrivano come dipendenze (nei test: finti).
 *
 * POST /chat → `text/event-stream`, una riga `data: {json}` per evento:
 *  - `{type:"session", token}`  gettone di sessione nuovo (dopo una verifica di Turnstile);
 *  - `{type:"text", text}`      pezzo di risposta;
 *  - `{type:"refusal"}`         rifiuto per sicurezza (anche dopo il fallback): il pannello scarta
 *                               il testo parziale;
 *  - `{type:"done", stop}`      fine (`end_turn`, `max_tokens`, …);
 *  - `{type:"error", code}`     errore dell'API a risposta iniziata.
 * Prima dello stream gli errori sono JSON `{ error: code }` con lo stato HTTP adatto
 * (403 origine, 400/413 richiesta, 401 Turnstile, 429 limiti con Retry-After, 503 non configurato).
 */
import type {
  BetaMessage,
  BetaMessageStreamParams,
  BetaRawMessageStreamEvent,
  BetaUsage,
} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { FALLBACK_BETA, HAS_SERVER_FALLBACK, readConfig, type Env, type TutorConfig } from './config';
import type { BeginResult } from './limits';
import { usageCost, worstCaseCost } from './pricing';
import { apiMessages, systemBlocks } from './prompt';
import { checkSession, hashIp, issueSession, verifyTurnstile } from './session';
import { LIMITS, requestChars, validateRequest, type TutorRequest } from './validate';

/** Stream dell'SDK, ridotto a ciò che serve (il client finto dei test lo imita). */
export interface StreamLike extends AsyncIterable<BetaRawMessageStreamEvent> {
  finalMessage(): Promise<BetaMessage>;
}

export interface Streamer {
  stream(params: BetaMessageStreamParams, opts: { signal: AbortSignal }): StreamLike;
}

export interface LimitsClient {
  begin(opts: {
    ipHash: string;
    now: number;
    perHour: number;
    budgetUsd: number;
    reserveUsd: number;
  }): Promise<BeginResult>;
  end(opts: { now: number; startedAt: number; reservedUsd: number; actualUsd: number }): Promise<void>;
}

export interface Deps {
  env: Env;
  /** Client dell'API (creato solo se c'è la chiave). */
  streamer: (apiKey: string) => Streamer;
  limits: LimitsClient | null;
  fetchFn: typeof fetch;
  waitUntil: (p: Promise<unknown>) => void;
  now?: () => number;
  /** Errori dell'API: classificazione (il Worker usa le classi dell'SDK). */
  classifyError?: (err: unknown) => string;
}

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function corsHeaders(origin: string): Record<string, string> {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, x-tutor-session',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
}

const json = (status: number, body: unknown, headers: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...headers } });

/** Parametri della richiesta all'API (esportata per i test: niente prefill, fallback, cache, effort). */
export function buildParams(req: TutorRequest, cfg: TutorConfig): BetaMessageStreamParams {
  const fallback = HAS_SERVER_FALLBACK[cfg.model];
  return {
    model: cfg.model,
    max_tokens: cfg.maxTokens,
    // Pensiero adattivo (il predefinito su questi modelli): non si passa `thinking`.
    output_config: { effort: cfg.effort },
    // Cache automatica: copre anche la conversazione che cresce, dopo i due punti fissi del system.
    cache_control: { type: 'ephemeral' },
    system: systemBlocks(req),
    messages: apiMessages(req),
    ...(fallback ? { betas: [FALLBACK_BETA], fallbacks: 'default' as const } : {}),
  };
}

export async function handle(request: Request, deps: Deps): Promise<Response> {
  const cfg = readConfig(deps.env);
  const now = deps.now?.() ?? Date.now();
  const url = new URL(request.url);
  const origin = (request.headers.get('origin') ?? '').replace(/\/+$/, '');
  const allowed = origin !== '' && cfg.origins.includes(origin);

  if (url.pathname !== '/chat') return json(404, { error: 'not-found' });
  if (!allowed) return json(403, { error: 'origin' });
  const cors = corsHeaders(origin);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return json(405, { error: 'method' }, { ...cors, allow: 'POST, OPTIONS' });

  const apiKey = deps.env.ANTHROPIC_API_KEY;
  if (!apiKey || !deps.limits) return json(503, { error: 'unconfigured' }, cors);
  const secret = deps.env.TURNSTILE_SECRET_KEY ?? '';
  if (!secret && cfg.requireTurnstile) return json(503, { error: 'unconfigured' }, cors);

  // Corpo: limite in byte prima di leggerlo tutto.
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > LIMITS.body) return json(413, { error: 'too-long' }, cors);
  const raw = await request.text();
  if (raw.length > LIMITS.body) return json(413, { error: 'too-long' }, cors);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: 'invalid' }, cors);
  }
  const checked = validateRequest(body);
  if (!checked.ok)
    return json(checked.code === 'too-long' ? 413 : 400, { error: checked.code, field: checked.field }, cors);
  const req = checked.value;

  // Turnstile, o gettone di sessione ancora valido.
  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const sessionSecret = secret || 'solo-prove-locali';
  const ipHash = await hashIp(ip, sessionSecret);
  let newSession = '';
  if (secret) {
    const valid = await checkSession(request.headers.get('x-tutor-session'), sessionSecret, ipHash, now);
    if (!valid) {
      if (!req.turnstile || !(await verifyTurnstile(deps.fetchFn, secret, req.turnstile, ip)))
        return json(401, { error: 'turnstile' }, cors);
      newSession = await issueSession(sessionSecret, ipHash, now);
    }
  }

  // Limiti: richieste per IP e tetto di spesa (prenotando il costo massimo).
  const reserveUsd = worstCaseCost(requestChars(req), cfg.maxTokens, cfg.model);
  const gate = await deps.limits.begin({
    ipHash,
    now,
    perHour: cfg.ratePerHour,
    budgetUsd: cfg.dailyBudgetUsd,
    reserveUsd,
  });
  if (!gate.ok)
    return json(
      429,
      { error: gate.reason, retryAfter: gate.retryAfterSec },
      {
        ...cors,
        'retry-after': String(gate.retryAfterSec),
      },
    );

  const params = buildParams(req, cfg);
  const upstream = new AbortController();
  request.signal?.addEventListener('abort', () => upstream.abort());
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  let open = true;
  const send = async (event: Record<string, unknown>) => {
    if (!open) return;
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    } catch {
      // Il browser ha chiuso la connessione: si interrompe anche la chiamata all'API.
      open = false;
      upstream.abort();
    }
  };

  const pump = (async () => {
    let usage: Partial<BetaUsage> | undefined;
    let model: string = cfg.model;
    try {
      if (newSession) await send({ type: 'session', token: newSession });
      const stream = deps.streamer(apiKey).stream(params, { signal: upstream.signal });
      for await (const ev of stream) {
        if (ev.type === 'message_start') {
          usage = { ...ev.message.usage };
          model = ev.message.model;
        } else if (ev.type === 'message_delta') {
          usage = { ...usage, ...ev.usage } as Partial<BetaUsage>;
        } else if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
          await send({ type: 'text', text: ev.delta.text });
        }
      }
      const final = await stream.finalMessage();
      usage = final.usage;
      model = final.model;
      // Controllare sempre stop_reason: un rifiuto (anche a metà, se il fallback non ha salvato
      // la risposta) rende inutilizzabile il testo già arrivato.
      if (final.stop_reason === 'refusal') await send({ type: 'refusal' });
      else await send({ type: 'done', stop: final.stop_reason ?? 'end_turn' });
    } catch (err) {
      if (!upstream.signal.aborted)
        await send({ type: 'error', code: deps.classifyError?.(err) ?? 'upstream' });
    } finally {
      try {
        await deps.limits!.end({
          now: deps.now?.() ?? Date.now(),
          startedAt: now,
          reservedUsd: reserveUsd,
          actualUsd: usageCost(usage, model),
        });
      } catch {
        // Il contatore del giorno resta con la prenotazione: si sbaglia per eccesso.
      }
      if (open) await writer.close().catch(() => undefined);
    }
  })();
  deps.waitUntil(pump);

  return new Response(readable, {
    status: 200,
    headers: {
      ...cors,
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
