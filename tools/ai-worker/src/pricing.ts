/**
 * Stima del costo di una risposta (dollari), per il tetto di spesa giornaliero.
 * Prezzi di listino per milione di token (novembre 2026); scrittura in cache a 5 minuti = 1,25 × input.
 * I modelli di fallback lato server (Opus 5, Opus 4.8, Sonnet 5) sono qui perché `usage.iterations`
 * riporta anche i loro tentativi. Un modello sconosciuto si stima al prezzo più alto della tabella:
 * il tetto deve sbagliare per eccesso, mai per difetto.
 */
import type { BetaUsage } from '@anthropic-ai/sdk/resources/beta/messages/messages';

interface Price {
  input: number;
  output: number;
  cacheRead: number;
}

export const PRICES: Record<string, Price> = {
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.1 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5, cacheRead: 0.01 },
  'claude-opus-5': { input: 5, output: 25, cacheRead: 0.5 },
  'claude-opus-4-8': { input: 5, output: 25, cacheRead: 0.5 },
  'claude-sonnet-5': { input: 2, output: 10, cacheRead: 0.2 },
};

const MAX_PRICE: Price = Object.values(PRICES).reduce((a, b) => ({
  input: Math.max(a.input, b.input),
  output: Math.max(a.output, b.output),
  cacheRead: Math.max(a.cacheRead, b.cacheRead),
}));

export interface TokenCounts {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  model?: string | null;
}

/** Costo di un tentativo, in dollari. */
export function attemptCost(u: TokenCounts, fallbackModel: string): number {
  const p = PRICES[u.model ?? fallbackModel] ?? MAX_PRICE;
  const write = u.cache_creation_input_tokens ?? 0;
  const read = u.cache_read_input_tokens ?? 0;
  return (
    (u.input_tokens * p.input + write * p.input * 1.25 + read * p.cacheRead + u.output_tokens * p.output) /
    1e6
  );
}

/**
 * Costo di una risposta: con `usage.iterations` (fallback, rifiuti prima dell'uscita) si sommano
 * tutti i tentativi, ognuno al prezzo del suo modello; senza, l'uso complessivo al modello servito.
 */
export function usageCost(usage: Partial<BetaUsage> | undefined, model: string): number {
  if (!usage) return 0;
  const iterations = Array.isArray(usage.iterations) ? usage.iterations : [];
  const priced = iterations.filter(
    (it): it is typeof it & TokenCounts =>
      typeof (it as Partial<TokenCounts>).input_tokens === 'number' &&
      typeof (it as Partial<TokenCounts>).output_tokens === 'number',
  );
  if (priced.length > 0) return priced.reduce((sum, it) => sum + attemptCost(it, model), 0);
  return attemptCost(
    {
      input_tokens: usage.input_tokens ?? 0,
      output_tokens: usage.output_tokens ?? 0,
      cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
      cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
    },
    model,
  );
}

/** Costo massimo prevedibile di una richiesta (per decidere se c'è ancora margine nel tetto). */
export function worstCaseCost(inputChars: number, maxTokens: number, model: string): number {
  // ~3 caratteri per token è una stima per eccesso per testo italiano/inglese con formule.
  return attemptCost({ input_tokens: Math.ceil(inputChars / 3), output_tokens: maxTokens }, model);
}
