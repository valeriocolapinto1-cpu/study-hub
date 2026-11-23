/**
 * Regole condivise per trovare formule grezze in un testo già reso (fuori da KaTeX e dal codice):
 * usate dalla misura (tools/formule-grezze.mjs), dal controllo statico della build e dall'e2e.
 */

export const REGEX_GREZZE =
  /\$[^$\n]{1,50}\$|\\[a-zA-Z]{2,}|\b[A-Za-zα-ωΔΩ]+_\{?[A-Za-z0-9]{1,6}\}?|\^\{[^}]{1,10}\}/g;

/**
 * Eccezioni legittime (piccole e motivate): identificatori che contengono `_` e non sono formule.
 * - nomi di file e chiavi di archiviazione (`study_hub_backup`, `frasi_json`): sono codice scritto nel testo;
 */
const ECCEZIONI = [/^[a-z]+(?:_[a-z]+){2,}$/];

/** Frammenti di formula grezza distinti trovati nel testo. */
export function formuleGrezze(testo) {
  const out = new Set();
  for (const m of testo.matchAll(REGEX_GREZZE)) {
    const f = m[0];
    if (ECCEZIONI.some((r) => r.test(f))) continue;
    out.add(f);
  }
  return [...out];
}
