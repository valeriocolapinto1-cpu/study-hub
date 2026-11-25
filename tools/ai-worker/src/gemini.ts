/**
 * Chiamata all'API Gemini con `fetch` (nessun SDK): `streamGenerateContent?alt=sse`.
 * Riferimenti (verificati il 25 novembre 2026):
 *  - https://ai.google.dev/api/generate-content (richiesta, `finishReason`, `promptFeedback`,
 *    `usageMetadata`);
 *  - https://ai.google.dev/gemini-api/docs/thinking (`thinkingLevel`);
 *  - https://ai.google.dev/gemini-api/docs/troubleshooting (codici HTTP e tentativi).
 */
import type { TutorConfig } from './config';
import type { UsageMetadata } from './pricing';
import { apiContents, systemInstruction, type GeminiContent, type TextPart } from './prompt';
import type { TutorRequest } from './validate';

export const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GenerateContentRequest {
  systemInstruction: { parts: TextPart[] };
  contents: GeminiContent[];
  generationConfig: {
    maxOutputTokens: number;
    thinkingConfig?: { thinkingLevel: string };
  };
}

/** Corpo della richiesta (esportato per i test). Niente temperature/topP/topK: Gemini 4 li ignora. */
export function buildRequest(req: TutorRequest, cfg: TutorConfig): GenerateContentRequest {
  return {
    systemInstruction: systemInstruction(req),
    contents: apiContents(req),
    generationConfig: {
      // Il tetto comprende i token del ragionamento.
      maxOutputTokens: cfg.maxTokens,
      ...(cfg.thinkingLevel === 'default'
        ? {}
        : { thinkingConfig: { thinkingLevel: cfg.thinkingLevel.toUpperCase() } }),
    },
  };
}

export const streamUrl = (model: string): string =>
  `${API_BASE}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;

/** Un pezzo dello stream: un `GenerateContentResponse` parziale, o un errore a metà. */
export interface StreamChunk {
  candidates?: {
    content?: { role?: string; parts?: (TextPart & { thought?: boolean })[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: UsageMetadata;
  error?: { code?: number; status?: string; message?: string };
}

/** Pezzi JSON di uno stream SSE (`data: {json}` separati da una riga vuota). */
export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  const parse = (block: string): StreamChunk | null => {
    const data = block
      .split('\n')
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).replace(/^ /, ''))
      .join('\n');
    if (!data) return null;
    try {
      const v: unknown = JSON.parse(data);
      return typeof v === 'object' && v !== null ? (v as StreamChunk) : null;
    } catch {
      return null;
    }
  };
  try {
    for (;;) {
      const { value, done } = await reader.read();
      buf += decoder.decode(value, { stream: !done }).replace(/\r\n?/g, '\n');
      let i: number;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const chunk = parse(buf.slice(0, i));
        buf = buf.slice(i + 2);
        if (chunk) yield chunk;
      }
      if (done) break;
    }
    const last = parse(buf);
    if (last) yield last;
  } finally {
    reader.releaseLock();
  }
}

/**
 * `finishReason` che rendono inutilizzabile la risposta (filtri di sicurezza, recitazione,
 * contenuti vietati, dati personali): il pannello scarta il testo parziale, come per un rifiuto.
 */
const BLOCKED = new Set([
  'SAFETY',
  'RECITATION',
  'LANGUAGE',
  'BLOCKLIST',
  'PROHIBITED_CONTENT',
  'SPII',
  'IMAGE_SAFETY',
  'IMAGE_PROHIBITED_CONTENT',
  'IMAGE_RECITATION',
  'IMAGE_OTHER',
  'ESCALATION',
  'PUP_LIMITED_DISABLED',
  'OTHER',
]);

/** Risposta tagliata dal tetto dei token: il pannello avvisa («risposta interrotta»). */
const TRUNCATED = new Set(['MAX_TOKENS', 'CONTINUATION']);

export type Outcome =
  | { kind: 'done'; stop: 'end_turn' | 'max_tokens' }
  | { kind: 'refusal'; reason: string }
  | { kind: 'error'; code: string };

/** Esito della risposta dal motivo di blocco del prompt e dall'ultimo `finishReason`. */
export function outcome(blockReason: string | undefined, finishReason: string | undefined): Outcome {
  if (blockReason) return { kind: 'refusal', reason: blockReason };
  if (!finishReason) return { kind: 'error', code: 'upstream' };
  if (finishReason === 'STOP') return { kind: 'done', stop: 'end_turn' };
  if (TRUNCATED.has(finishReason)) return { kind: 'done', stop: 'max_tokens' };
  if (BLOCKED.has(finishReason)) return { kind: 'refusal', reason: finishReason };
  // MALFORMED_RESPONSE, UNEXPECTED_TOOL_CALL, … : errori del servizio, non del contenuto.
  return { kind: 'error', code: 'upstream' };
}

/**
 * Stato HTTP (ed eventuale `status` di Google) → codice breve per il pannello.
 *  - `invalid`: richiesta rifiutata (400 INVALID_ARGUMENT);
 *  - `unconfigured`: chiave, modello, fatturazione o regione da sistemare (401, 402, 403, 404,
 *    400 FAILED_PRECONDITION): lo studente non può farci nulla;
 *  - `quota`: limiti di Google (429 RESOURCE_EXHAUSTED);
 *  - `overloaded`: servizio sovraccarico o guasto (5xx);
 *  - `timeout`: 504 o tempo massimo del Worker.
 */
export function classifyStatus(status: number, googleStatus = ''): string {
  if (status === 400) return googleStatus === 'FAILED_PRECONDITION' ? 'unconfigured' : 'invalid';
  if (status === 401 || status === 402 || status === 403 || status === 404) return 'unconfigured';
  if (status === 408 || status === 504) return 'timeout';
  if (status === 429) return 'quota';
  if (status >= 500) return 'overloaded';
  return 'upstream';
}

/** Stati per cui ha senso riprovare subito (prima che arrivi qualcosa allo studente). */
export const RETRYABLE = new Set([500, 502, 503]);
