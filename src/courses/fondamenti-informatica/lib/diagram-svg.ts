/**
 * Resa degli schemi a blocchi come SVG autonomo: le classi del sito originale
 * (dg-box, dg-line…) diventano stili in linea sui token del tema, così lo
 * stesso SVG funziona nella teoria, negli esercizi e in stampa, in chiaro e in
 * scuro, senza fogli di stile dedicati.
 *
 * Due modi: `labels` (figura di studio, etichette al loro posto) e `blanks`
 * (esercizio: al posto delle etichette un numero da 1 a n).
 */
import type { Diagram, DText } from '../diagrams/types';

export type Lang = 'it' | 'en';
export const dt = (t: DText, lang: Lang): string => (lang === 'en' ? (t.en ?? t.it) : t.it);

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const STYLE: Record<string, string> = {
  'dg-box': 'fill:var(--surface-2);stroke:var(--border-strong);stroke-width:1.5',
  'dg-group':
    'fill:var(--accent-soft);fill-opacity:.45;stroke:var(--accent);stroke-width:1;stroke-dasharray:5 4',
  'dg-line': 'stroke:var(--text-muted);stroke-width:1.5;fill:none',
  'dg-text': 'fill:var(--text-muted);font-family:var(--font-mono);text-anchor:middle',
  'dg-text dg-start': 'fill:var(--text-muted);font-family:var(--font-mono);text-anchor:start',
};

/** Sostituisce le classi con stili in linea; il marcatore della freccia prende un id univoco. */
function inlineStyles(svg: string, arrowId: string): string {
  return svg
    .replace(/class="([^"]+)"/g, (_, cls: string) => {
      const style = STYLE[cls];
      if (!style) throw new Error(`schema: classe sconosciuta "${cls}"`);
      return `style="${style}"`;
    })
    .replace(/url\(#aefin-arrow\)/g, `url(#${arrowId})`)
    .replace(/<text(?![^>]*font-size)/g, '<text font-size="12"');
}

function anchorFor(x: number, w: number): 'start' | 'middle' | 'end' {
  const f = x / w;
  return f <= 0.12 ? 'start' : f >= 0.88 ? 'end' : 'middle';
}

export interface RenderOptions {
  mode: 'labels' | 'blanks';
  /** Prefisso degli id interni (titolo, freccia): univoco nella pagina. */
  idPrefix: string;
}

/** Larghezza stimata di un'etichetta in carattere mono da 11,5 px. */
const labelWidth = (s: string) => Math.ceil([...s].length * 6.95) + 14;

export function renderDiagram(d: Diagram, lang: Lang, { mode, idPrefix }: RenderOptions): string {
  const id = `${idPrefix}-${d.id}`;
  const arrow = `${id}-arrow`;
  const parts: string[] = [];
  d.slots.forEach((s, i) => {
    const anchor = anchorFor(s.x, d.width);
    if (mode === 'labels') {
      const text = dt(s.label, lang);
      const w = labelWidth(text);
      const x0 = anchor === 'start' ? s.x : anchor === 'end' ? s.x - w : s.x - w / 2;
      const y0 = Math.min(Math.max(s.y - 10, 0), d.height - 20);
      parts.push(
        `<rect x="${x0}" y="${y0}" width="${w}" height="20" rx="4" style="fill:var(--surface);stroke:var(--accent);stroke-width:1"/>` +
          `<text x="${x0 + w / 2}" y="${y0 + 10}" font-size="11.5" dominant-baseline="central" style="fill:var(--text);font-family:var(--font-mono);text-anchor:middle">${esc(text)}</text>`,
      );
    } else {
      const cx = anchor === 'start' ? s.x + 12 : anchor === 'end' ? s.x - 12 : s.x;
      const cy = Math.min(Math.max(s.y, 12), d.height - 12);
      parts.push(
        `<circle cx="${cx}" cy="${cy}" r="11" style="fill:var(--surface);stroke:var(--accent);stroke-width:1.5"/>` +
          `<text x="${cx}" y="${cy}" font-size="12" font-weight="700" dominant-baseline="central" style="fill:var(--accent-strong);font-family:var(--font-sans);text-anchor:middle">${i + 1}</text>`,
      );
    }
  });
  const title = dt(d.title, lang);
  const desc =
    mode === 'labels'
      ? (lang === 'en' ? 'Labels: ' : 'Etichette: ') + d.slots.map((s) => dt(s.label, lang)).join(', ') + '.'
      : lang === 'en'
        ? `Diagram with ${d.slots.length} numbered positions to fill in.`
        : `Schema con ${d.slots.length} posizioni numerate da completare.`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${d.width} ${d.height}" role="img" aria-labelledby="${id}-t ${id}-d" style="width:100%;height:auto;max-width:${d.width}px">` +
    `<title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc>` +
    `<defs><marker id="${arrow}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--text-muted)"/></marker></defs>` +
    inlineStyles(d.svg[lang], arrow) +
    parts.join('') +
    `</svg>`
  );
}

/** Etichette proposte nell'esercizio: quelle giuste più i distrattori, senza doppioni, in ordine alfabetico. */
export function labelPool(d: Diagram, lang: Lang): string[] {
  const all = [...d.slots.map((s) => dt(s.label, lang)), ...d.distractors.map((x) => dt(x, lang))];
  return [...new Set(all)].sort((a, b) => a.localeCompare(b, lang));
}
