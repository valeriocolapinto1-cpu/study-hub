/**
 * Sprite SVG condiviso per le pagine con molte formule (formulario).
 *
 * KaTeX disegna in SVG inline frecce dei vettori, radici e parentesi estensibili: lo stesso
 * tracciato (es. la freccia di `\vec`, ~600 byte) si ripete in ogni formula che lo usa.
 * `shareKatexPaths` sostituisce i tracciati presenti almeno due volte nella pagina con un
 * `<use href>` verso un'unica definizione nello sprite. L'`<svg>` esterno (dimensioni,
 * viewBox, preserveAspectRatio) resta invariato, quindi il disegno è lo stesso; il MathML
 * per le tecnologie assistive non viene toccato.
 */

import katex from 'katex';

/** Formula in display come in `<Formula>` (stesse opzioni ovunque). */
export const renderDisplayMath = (tex: string): string =>
  katex.renderToString(tex, { displayMode: true, output: 'htmlAndMathml', throwOnError: true });

const PATH = /<path d="([^"]*)"\/>/g;
/** Nell'HTML l'attributo è superfluo: l'`<svg>` inline è già nello spazio dei nomi SVG. */
const XMLNS = /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" /g;

/** Simboli d'interfaccia aggiunti allo sprite (es. la stella dei preferiti). */
export interface SpriteSymbol {
  id: string;
  viewBox: string;
  body: string;
}

export const STAR_SYMBOL: SpriteSymbol = {
  id: 'i-star',
  viewBox: '0 0 24 24',
  body: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" stroke-width="1.6" stroke-linejoin="round"/>',
};

export function shareKatexPaths(
  htmls: string[],
  symbols: SpriteSymbol[] = [],
  prefix = 'kp',
): { htmls: string[]; sprite: string } {
  const count = new Map<string, number>();
  for (const h of htmls) for (const m of h.matchAll(PATH)) count.set(m[1]!, (count.get(m[1]!) ?? 0) + 1);
  const ids = new Map<string, string>();
  for (const [d, n] of count) if (n > 1) ids.set(d, `${prefix}-${ids.size}`);
  const out = htmls.map((h) =>
    h.replace(XMLNS, '<svg ').replace(PATH, (whole, d: string) => {
      const id = ids.get(d);
      return id ? `<use href="#${id}"/>` : whole;
    }),
  );
  const defs =
    // stroke="none": nel documento vale `.katex svg path { stroke: none }`, che però non
    // raggiunge le copie create da <use> (ereditano dall'<svg> KaTeX, che ha uno stroke).
    [...ids].map(([d, id]) => `<path id="${id}" stroke="none" d="${d}"/>`).join('') +
    symbols.map((s) => `<symbol id="${s.id}" viewBox="${s.viewBox}">${s.body}</symbol>`).join('');
  const sprite = defs
    ? `<svg class="sh-sprite" width="0" height="0" aria-hidden="true" focusable="false"><defs>${defs}</defs></svg>`
    : '';
  return { htmls: out, sprite };
}
