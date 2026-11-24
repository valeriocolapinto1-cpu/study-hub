/**
 * Configurazione del Worker del tutor, letta dalle variabili di wrangler.toml e dai secret.
 * Valori mancanti o non validi → predefiniti prudenti (mai un errore all'avvio).
 */

/** Modelli selezionabili con la variabile `MODEL`. Il primo è il predefinito. */
export const MODELS = ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'] as const;
export type TutorModel = (typeof MODELS)[number];

export const EFFORTS = ['low', 'medium', 'high'] as const;
export type Effort = (typeof EFFORTS)[number];

/** Beta del fallback lato server (`fallbacks: "default"`). */
export const FALLBACK_BETA = 'server-side-fallback-2026-07-01';

/**
 * Modelli con fallback lato server. Claude Haiku 5.5 non ne ha: con `fallbacks` una lista
 * darebbe 400 e `"default"` non farebbe nulla, quindi per lui il parametro non si manda.
 */
export const HAS_SERVER_FALLBACK: Record<TutorModel, boolean> = {
  'claude-opus-5-5': true,
  'claude-sonnet-5-5': true,
  'claude-haiku-5-5': false,
};

export interface Env {
  /** Secret: chiave dell'API Anthropic (`wrangler secret put ANTHROPIC_API_KEY`). */
  ANTHROPIC_API_KEY?: string;
  /** Secret: chiave segreta di Turnstile (`wrangler secret put TURNSTILE_SECRET_KEY`). */
  TURNSTILE_SECRET_KEY?: string;
  /** Origini del sito ammesse (CORS), separate da virgole, es. `https://utente.github.io`. */
  ALLOWED_ORIGINS?: string;
  MODEL?: string;
  EFFORT?: string;
  MAX_TOKENS?: string;
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
  model: TutorModel;
  effort: Effort;
  maxTokens: number;
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

export function readConfig(env: Env): TutorConfig {
  const model = (MODELS as readonly string[]).includes(env.MODEL ?? '')
    ? (env.MODEL as TutorModel)
    : MODELS[0];
  const effort = (EFFORTS as readonly string[]).includes(env.EFFORT ?? '') ? (env.EFFORT as Effort) : 'low';
  return {
    model,
    effort,
    maxTokens: Math.round(num(env.MAX_TOKENS, 4000, 256, 8000)),
    ratePerHour: Math.round(num(env.RATE_LIMIT_PER_HOUR, 20, 1, 1000)),
    dailyBudgetUsd: num(env.DAILY_BUDGET_USD, 2, 0, 1000),
    origins: (env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim().replace(/\/+$/, ''))
      .filter(Boolean),
    requireTurnstile: !(env.ALLOW_NO_TURNSTILE === '1' && !env.TURNSTILE_SECRET_KEY),
  };
}
