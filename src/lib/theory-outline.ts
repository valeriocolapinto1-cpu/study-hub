/**
 * Indice di una pagina di teoria ricavato dal sorgente MDX: gli strati (`<Layer kind>`, id
 * `strato-<kind>` o quello dichiarato) e, dentro ciascuno, i titoli `##` (id dalle `headings` di
 * Astro, nello stesso ordine). Conta anche le parole della prosa per il tempo di lettura.
 */
import type { MarkdownHeading } from 'astro';

export interface OutlineItem {
  id: string;
  /** Strato: l'etichetta viene dal dizionario (`layer.<kind>`). */
  kind?: string;
  text: string;
  children: { id: string; text: string }[];
}

export function theoryOutline(
  body: string,
  headings: MarkdownHeading[],
): { items: OutlineItem[]; words: number } {
  const h2 = headings.filter((h) => h.depth === 2);
  const items: OutlineItem[] = [];
  let k = 0;
  for (const line of body.split('\n')) {
    const layer = /^<Layer\b([^>]*)>/.exec(line.trim());
    if (layer) {
      const kind = /kind="([a-z]+)"/.exec(layer[1]!)?.[1];
      const id = /\bid="([^"]+)"/.exec(layer[1]!)?.[1] ?? `strato-${kind}`;
      if (kind) items.push({ id, kind, text: kind, children: [] });
      continue;
    }
    if (/^## /.test(line)) {
      const h = h2[k++];
      if (!h) continue;
      const parent = items.at(-1);
      if (parent) parent.children.push({ id: h.slug, text: h.text });
      else items.push({ id: h.slug, text: h.text, children: [] });
    }
  }
  const prose = body
    .replace(/^---[\s\S]*?---/, '')
    // prima la matematica: un `<` dentro una formula ($n-1<b$) non deve sembrare l'inizio di un tag
    .replace(/\$\$[\s\S]*?\$\$|\$[^$]*\$/g, ' x ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^}]*\}/g, ' ');
  const words = prose.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  return { items, words };
}
