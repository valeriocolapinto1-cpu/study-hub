/**
 * Confronto "argomenti identici a legacy".
 * Ogni corso pubblicato ha un estrattore `tools/legacy-topics/<courseId>.mjs` che
 * esporta di default `extract(legacyDir) → [{ title, group? }]` (titoli italiani,
 * nell'ordine del sito originale). L'elenco degli argomenti migrati deve
 * coincidere esattamente: stessi titoli, stesso ordine, stessi gruppi.
 */

/** Normalizza spazi, apostrofi e trattini tipografici. */
export const normalizeTitle = (s) =>
  String(s)
    .normalize('NFC')
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * @param {{ title: string, group?: string }[]} legacy
 * @param {{ title: string, group?: string }[]} migrated
 * @returns {string[]} differenze (vuoto se identici)
 */
export function compareTopicLists(legacy, migrated) {
  const problems = [];
  if (legacy.length === 0) problems.push("l'estrattore non ha trovato argomenti nel sito originale");
  const n = Math.max(legacy.length, migrated.length);
  for (let i = 0; i < n; i++) {
    const a = legacy[i];
    const b = migrated[i];
    if (!a) {
      problems.push(`#${i + 1}: argomento in più nel nuovo sito: "${b.title}"`);
      continue;
    }
    if (!b) {
      problems.push(`#${i + 1}: argomento mancante: "${a.title}"`);
      continue;
    }
    if (normalizeTitle(a.title) !== normalizeTitle(b.title))
      problems.push(`#${i + 1}: titolo diverso: originale "${a.title}", migrato "${b.title}"`);
    if (a.group !== undefined && normalizeTitle(a.group) !== normalizeTitle(b.group ?? ''))
      problems.push(
        `#${i + 1} "${a.title}": gruppo diverso: originale "${a.group}", migrato "${b.group ?? ''}"`,
      );
  }
  return problems;
}
