/**
 * Configurazione del Worker del tutor, letta dalle variabili di wrangler.toml e dai secret.
 * Valori mancanti o non validi → predefiniti prudenti (mai un errore all'avvio).
 */

/**
 * Modello predefinito: Gemini 4 Hydrogen, stabile, disponibile sia nel livello gratuito sia a
 * pagamento (documentazione di ai.google.dev verificata il 25 novembre 2026). I modelli cambiano
 * spesso: l'elenco aggiornato è in Google AI Studio e su https://ai.google.dev/gemini-api/docs/models.
 */
export const DEFAULT_MODEL = 'gemini-4-hydrogen';

/**
 * Livelli di ragionamento (`thinkingConfig.thinkingLevel`). Gemini 4 Hydrogen accetta
 * low/medium/high/xhigh (predefinito high) e rifiuta minimal; i Flash-Lite accettano anche minimal.
 * `default` = il campo non si manda e vale il predefinito del modello.
 */
export const THINKING_LEVELS = ['minimal', 'low', 'medium', 'high', 'xhigh', 'default'] as const;
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];

/**
 * Prezzi predefiniti per milione di token, in dollari: listino di `gemini-4-hydrogen` (livello a
 * pagamento, «Standard») letto il 25 novembre 2026 su https://ai.google.dev/gemini-api/docs/pricing.
 * Da aggiornare dal listino Google se cambia il modello o il prezzo (variabili PRICE_*).
 */
export const DEFAULT_PRICE = { input: 1.5, output: 7.5 } as const;

export interface Env {
  /** Secret: chiave dell'API Gemini (`wrangler secret put GEMINI_API_KEY`). */
  GEMINI_API_KEY?: string;
  /** Secret: chiave segreta di Turnstile (`wrangler secret put TURNSTILE_SECRET_KEY`). */
  TURNSTILE_SECRET_KEY?: string;
  /** Origini del sito ammesse (CORS), separate da virgole, es. `https://utente.github.io`. */
  ALLOWED_ORIGINS?: string;
  /** Codice del modello Gemini, es. `gemini-4-hydrogen`. */
  MODEL?: string;
  THINKING_LEVEL?: string;
  /** Tetto dei token in uscita (ragionamento compreso). */
  MAX_TOKENS?: string;
  /** Prezzo per milione di token in ingresso, dollari. */
  PRICE_INPUT_PER_MTOK?: string;
  /** Prezzo per milione di token in uscita (ragionamento compreso), dollari. */
  PRICE_OUTPUT_PER_MTOK?: string;
  /** Tempo massimo di una risposta, in secondi. */
  TIMEOUT_SECONDS?: string;
  /** Richieste per IP all'ora. */
  RATE_LIMIT_PER_HOUR?: string;
  /** Tetto di spesa giornaliero stimato, in dollari (giorno UTC). */
  DAILY_BUDGET_USD?: string;
  /** "1" solo per prove locali: accetta richieste senza Turnstile se manca il secret. */
  ALLOW_NO_TURNSTILE?: string;
  /** Durable Object dei limiti (contatori per IP e spesa del giorno). */
  LIMITS?: DurableObjectNamespaceLike;
}

/** Il minimo dell'interfaccia dei Durable Object che usa il Worker (niente tipi di Cloudflare). */
export interface DurableObjectNamespaceLike {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(input: string, init?: RequestInit): Promise<Response> };
}

export interface TutorConfig {
  model: string;
  thinkingLevel: ThinkingLevel;
  maxTokens: number;
  price: { input: number; output: number };
  timeoutMs: number;
  ratePerHour: number;
  dailyBudgetUsd: number;
  origins: string[];
  requireTurnstile: boolean;
}

const num = (raw: string | undefined, fallback: number, min: number, max: number): number => {
  const n = Number(raw);
  return Number.isFinite(n) && raw !== undefined && raw.trim() !== ''
    ? Math.min(max, Math.max(min, n))
    : fallback;
};

/** Codice di modello plausibile: finisce nel percorso dell'URL, quindi niente `/`, `?`, `:`. */
const MODEL_RE = /^[a-z0-9][a-z0-9.-]{1,63}$/;

export function readConfig(env: Env): TutorConfig {
  const model = (env.MODEL ?? '').trim();
  const level = (env.THINKING_LEVEL ?? '').trim().toLowerCase();
  return {
    model: MODEL_RE.test(model) ? model : DEFAULT_MODEL,
    thinkingLevel: (THINKING_LEVELS as readonly string[]).includes(level) ? (level as ThinkingLevel) : 'low',
    maxTokens: Math.round(num(env.MAX_TOKENS, 4000, 256, 16000)),
    // Un prezzo non valido o assente vale il predefinito; zero non è ammesso (il tetto sparirebbe).
    price: {
      input: num(env.PRICE_INPUT_PER_MTOK, DEFAULT_PRICE.input, 0.001, 1000),
      output: num(env.PRICE_OUTPUT_PER_MTOK, DEFAULT_PRICE.output, 0.001, 1000),
    },
    timeoutMs: Math.round(num(env.TIMEOUT_SECONDS, 60, 5, 300) * 1000),
    ratePerHour: Math.round(num(env.RATE_LIMIT_PER_HOUR, 20, 1, 1000)),
    dailyBudgetUsd: num(env.DAILY_BUDGET_USD, 2, 0, 1000),
    origins: (env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim().replace(/\/+$/, ''))
      .filter(Boolean),
    requireTurnstile: !(env.ALLOW_NO_TURNSTILE === '1' && !env.TURNSTILE_SECRET_KEY),
  };
}
