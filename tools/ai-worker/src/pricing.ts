/**
 * Stima del costo di una risposta (dollari), per il tetto di spesa giornaliero.
 *
 * I prezzi arrivano dalla configurazione (variabili PRICE_* del Worker, predefiniti in config.ts):
 * il listino di Google cambia e dipende dal modello, quindi non è scritto qui.
 * Si sbaglia sempre per eccesso: i token del ragionamento (`thoughtsTokenCount`) si contano come
 * uscita, come li fattura Google; lo sconto della cache implicita non si applica.
 */

/** `usageMetadata` di una risposta di `generateContent` (solo i campi usati). */
export interface UsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
  toolUsePromptTokenCount?: number;
  cachedContentTokenCount?: number;
  totalTokenCount?: number;
}

export interface Price {
  /** Dollari per milione di token in ingresso. */
  input: number;
  /** Dollari per milione di token in uscita (ragionamento compreso). */
  output: number;
}

/** ~3 caratteri per token: stima per eccesso per testo italiano/inglese con formule. */
export const CHARS_PER_TOKEN = 3;

export const tokensFromChars = (chars: number): number => Math.ceil(Math.max(0, chars) / CHARS_PER_TOKEN);

const n = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

export function tokenCost(inputTokens: number, outputTokens: number, price: Price): number {
  return (inputTokens * price.input + outputTokens * price.output) / 1e6;
}

/**
 * Costo di una risposta. Con `usageMetadata` si usano i conteggi di Google; senza (risposta
 * interrotta prima dell'ultimo pezzo, campo assente) si stima dalla lunghezza dei testi.
 */
export function usageCost(
  usage: UsageMetadata | undefined,
  price: Price,
  estimate: { inputChars: number; outputChars: number },
): number {
  const hasUsage = usage && (n(usage.promptTokenCount) > 0 || n(usage.totalTokenCount) > 0);
  if (!hasUsage) {
    return tokenCost(tokensFromChars(estimate.inputChars), tokensFromChars(estimate.outputChars), price);
  }
  const input = n(usage.promptTokenCount) + n(usage.toolUsePromptTokenCount);
  let output = n(usage.candidatesTokenCount) + n(usage.thoughtsTokenCount);
  // Se mancano i conteggi dell'uscita ma c'è il totale, la differenza è l'uscita.
  if (output === 0 && n(usage.totalTokenCount) > input) output = n(usage.totalTokenCount) - input;
  // Nessun conteggio dell'uscita (pezzo finale perso): stima dal testo arrivato.
  if (output === 0) output = tokensFromChars(estimate.outputChars);
  return tokenCost(input, output, price);
}

/** Costo massimo prevedibile di una richiesta (per decidere se c'è ancora margine nel tetto). */
export function worstCaseCost(inputChars: number, maxTokens: number, price: Price): number {
  return tokenCost(tokensFromChars(inputChars), maxTokens, price);
}
