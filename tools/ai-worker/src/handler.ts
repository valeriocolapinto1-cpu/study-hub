/**
 * Gestore HTTP del tutor, indipendente da Cloudflare: limiti, `fetch` (per Turnstile e per l'API
 * Gemini) e `waitUntil` arrivano come dipendenze (nei test: finti).
 *
 * POST /chat → `text/event-stream`, una riga `data: {json}` per evento:
 *  - `{type:"session", token}`  gettone di sessione nuovo (dopo una verifica di Turnstile);
 *  - `{type:"text", text}`      pezzo di risposta;
 *  - `{type:"refusal"}`         prompt o risposta bloccati dai filtri di Gemini: il pannello scarta
 *                               il testo parziale;
 *  - `{type:"done", stop}`      fine (`end_turn`, o `max_tokens` se tagliata dal tetto dei token);
 *  - `{type:"error", code}`     errore dell'API (`invalid`, `unconfigured`, `quota`, `overloaded`,
 *                               `timeout`, `upstream`).
 * Prima dello stream gli errori sono JSON `{ error: code }` con lo stato HTTP adatto
 * (403 origine, 400/413 richiesta, 401 Turnstile, 429 limiti con Retry-After, 503 non configurato).
 * Il protocollo verso il pannello non dipende dal fornitore del modello.
 */
import { readConfig, type Env } from './config';
import {
  RETRYABLE,
  buildRequest,
  classifyStatus,
  outcome,
  readSse,
  streamUrl,
  type GenerateContentRequest,
} from './gemini';
import type { BeginResult } from './limits';
import { usageCost, worstCaseCost, type UsageMetadata } from './pricing';
import { INSTRUCTIONS } from './prompt';
import { checkSession, hashIp, issueSession, verifyTurnstile } from './session';
import { LIMITS, requestChars, validateRequest } from './validate';

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
  limits: LimitsClient | null;
  /** `fetch` verso l'esterno: Turnstile e API Gemini. */
  fetchFn: typeof fetch;
  waitUntil: (p: Promise<unknown>) => void;
  now?: () => number;
  /** Attesa tra due tentativi (nei test: immediata). */
  sleep?: (ms: number) => Promise<void>;
  /** Registro degli errori del servizio (`wrangler tail`); mai testi delle conversazioni. */
  log?: (msg: string) => void;
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

  const apiKey = deps.env.GEMINI_API_KEY;
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
  const inputChars = requestChars(req) + INSTRUCTIONS.length + 500;
  const reserveUsd = worstCaseCost(inputChars, cfg.maxTokens, cfg.price);
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

  const payload = buildRequest(req, cfg);
  const upstream = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    upstream.abort();
  }, cfg.timeoutMs);
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
  const log = deps.log ?? ((msg: string) => console.warn(msg));

  const pump = (async () => {
    let usage: UsageMetadata | undefined;
    let outputChars = 0;
    try {
      if (newSession) await send({ type: 'session', token: newSession });
      const res = await callGemini(deps, apiKey, cfg.model, payload, upstream.signal);
      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => ({}))) as { error?: { status?: string } };
        log(`gemini ${res.status} ${err.error?.status ?? ''}`.trim());
        await send({ type: 'error', code: classifyStatus(res.status, err.error?.status) });
        return;
      }
      let blockReason: string | undefined;
      let finishReason: string | undefined;
      for await (const chunk of readSse(res.body)) {
        if (chunk.error) {
          log(`gemini stream ${chunk.error.code ?? ''} ${chunk.error.status ?? ''}`.trim());
          await send({ type: 'error', code: classifyStatus(chunk.error.code ?? 500, chunk.error.status) });
          return;
        }
        if (chunk.usageMetadata) usage = chunk.usageMetadata;
        if (chunk.promptFeedback?.blockReason) blockReason = chunk.promptFeedback.blockReason;
        const cand = chunk.candidates?.[0];
        for (const part of cand?.content?.parts ?? []) {
          // Riassunti del ragionamento (solo con includeThoughts, che non si chiede): mai allo studente.
          if (part.thought || typeof part.text !== 'string' || !part.text) continue;
          outputChars += part.text.length;
          await send({ type: 'text', text: part.text });
        }
        if (cand?.finishReason) finishReason = cand.finishReason;
      }
      // Controllare sempre l'esito: un blocco (anche a metà) rende inutilizzabile il testo arrivato.
      const end = outcome(blockReason, finishReason);
      if (end.kind === 'refusal') await send({ type: 'refusal' });
      else if (end.kind === 'done') await send({ type: 'done', stop: end.stop });
      else {
        log(`gemini finish ${finishReason ?? 'assente'}`);
        await send({ type: 'error', code: end.code });
      }
    } catch {
      if (timedOut) await send({ type: 'error', code: 'timeout' });
      else if (!upstream.signal.aborted) await send({ type: 'error', code: 'upstream' });
    } finally {
      clearTimeout(timer);
      try {
        await deps.limits!.end({
          now: deps.now?.() ?? Date.now(),
          startedAt: now,
          reservedUsd: reserveUsd,
          actualUsd: usageCost(usage, cfg.price, { inputChars, outputChars }),
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

/**
 * POST a `streamGenerateContent`, con la chiave nell'intestazione `x-goog-api-key` (mai nell'URL,
 * che può finire nei registri). Fino a due nuovi tentativi, prima che arrivi qualcosa, su 500/502/503
 * ed errori di rete; 429 no: con la quota esaurita riprovare subito non serve.
 */
async function callGemini(
  deps: Deps,
  apiKey: string,
  model: string,
  payload: GenerateContentRequest,
  signal: AbortSignal,
): Promise<Response> {
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const init: RequestInit = {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(payload),
    signal,
  };
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await deps.fetchFn(streamUrl(model), init);
      if (attempt < 2 && RETRYABLE.has(res.status)) {
        await res.body?.cancel().catch(() => undefined);
        await sleep(500 * 2 ** attempt);
        continue;
      }
      return res;
    } catch (err) {
      if (signal.aborted || attempt >= 2) throw err;
      await sleep(500 * 2 ** attempt);
    }
  }
}
