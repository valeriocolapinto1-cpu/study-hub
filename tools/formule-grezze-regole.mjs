/**
 * Regole condivise per trovare formule grezze in un testo già reso (fuori da KaTeX e dal codice):
 * usate dalla misura (tools/formule-grezze.mjs), dal controllo statico della build e dall'e2e.
 */

export const REGEX_GREZZE =
  /\$[^$\n]{1,50}\$|\\[a-zA-Z]{2,}|\b[A-Za-zα-ωΔΩ]+_\{?[A-Za-z0-9]{1,6}\}?|\^\{[^}]{1,10}\}/g;

/**
 * Eccezioni legittime (piccole e motivate): identificatori minuscoli con due o più `_` (nomi di file e
 * chiavi di archiviazione come `study_hub_backup`) sono codice citato nel testo, non formule.
 */
const IDENTIFICATORE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+){2,}$/;

/** Frammenti di formula grezza distinti trovati nel testo. */
export function formuleGrezze(testo) {
  const out = new Set();
  for (const m of testo.matchAll(REGEX_GREZZE)) {
    const f = m[0];
    // parola intera attorno al pedice (la regola si ferma a 6 caratteri dopo `_`)
    const prima = /[\w.]*$/.exec(testo.slice(0, m.index))[0];
    const dopo = /^[\w]*/.exec(testo.slice(m.index + f.length))[0];
    if (f.includes('_') && IDENTIFICATORE.test(`${prima}${f}${dopo}`.replace(/\.\w+$/, ''))) continue;
    out.add(f);
  }
  return [...out];
}
