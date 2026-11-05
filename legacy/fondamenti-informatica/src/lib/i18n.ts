/**
 * Predisposizione i18n (§14). Per ora esiste solo l'italiano: `t()` fa da
 * punto di passaggio unico per le stringhe di UI, così aggiungere una lingua
 * significherà aggiungere un dizionario, non rincorrere le stringhe nei
 * componenti.
 */
export type Locale = 'it';

export const locale: Locale = 'it';

/** Identità tipizzata: la stringa italiana è già la chiave. */
export function t(text: string): string {
  return text;
}

/** Formattazione numerica coerente con la lingua attiva. */
export function fmtNumber(n: number, opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale === 'it' ? 'it-IT' : 'it-IT', opts).format(n);
}

/**
 * I punteggi sono interi o mezzi punti: "2" e non "2.00" (il prototipo
 * stampava sempre due decimali), "2,5" all'italiana quando serve.
 */
export function fmtPoints(points: number): string {
  return Number.isInteger(points) ? String(points) : fmtNumber(points, { maximumFractionDigits: 2 });
}
