/**
 * Formati degli id (senza dipendenze: usabili anche nel browser, es. dal
 * registro dei generatori, senza trascinare Zod nel bundle).
 */

/** kebab-case: minuscole, cifre e trattini singoli. */
export const KEBAB_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Id di un obiettivo: `<topicId>.<n>`. */
export const OBJECTIVE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.[1-9]\d*$/;
/** Id di un generatore: `<courseId>/<name>`. */
export const GENERATOR_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
