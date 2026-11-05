/** Testi lunghi delle pagine globali (src/texts/<nome>.<lang>.md) e date localizzate. */
import type { MarkdownInstance } from 'astro';
import type { Lang } from '../i18n';

const texts = import.meta.glob<MarkdownInstance<Record<string, never>>>('../texts/*.md');

export async function legalText(name: string, lang: Lang): Promise<MarkdownInstance<Record<string, never>>> {
  const load = texts[`../texts/${name}.${lang}.md`];
  if (!load) throw new Error(`Testo mancante: src/texts/${name}.${lang}.md`);
  return load();
}

/** "2026-11-05" → "5 novembre 2026" / "5 November 2026". */
export const formatDate = (iso: string, lang: Lang): string =>
  new Intl.DateTimeFormat(lang === 'it' ? 'it-IT' : 'en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  );
