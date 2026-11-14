/** Testi ricchi resi a build-time con KaTeX (HTML + MathML): nessun JS di matematica nel browser. */
import katex from 'katex';
import { renderRich, type MathRenderer } from '../engine/rich';

export const katexRenderer: MathRenderer = (tex, display) =>
  katex.renderToString(tex, {
    displayMode: display,
    throwOnError: true,
    output: 'htmlAndMathml',
    strict: 'error',
  });

export const richHtml = (text: string): string => renderRich(text, katexRenderer);
export const richInline = (text: string): string => renderRich(text, katexRenderer, { inlineOnly: true });

const MATHML =
  /<span class="katex">(<span class="katex-mathml"><math[\s\S]*?<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>[\s\S]*?<\/math><\/span>)/g;

/**
 * Per i JSON delle isole: toglie il MathML duplicato di KaTeX e mette il TeX in `aria-label`
 * sul contenitore `.katex` (con `role="math"`). Il disegno resta quello di `.katex-html`.
 * Nelle pagine statiche il MathML resta.
 */
export const compactMath = (html: string): string =>
  // il testo dell'annotazione è già escapato per l'HTML: nell'attributo serve solo escapare le virgolette
  html.replace(MATHML, (_m, _ml: string, tex: string) => {
    return `<span class="katex" role="math" aria-label="${tex.replace(/"/g, '&quot;')}">`;
  });

/** `compactMath` su tutte le stringhe di un valore JSON. */
export function compactMathDeep<T>(v: T): T {
  if (typeof v === 'string') return compactMath(v) as T;
  if (Array.isArray(v)) return v.map(compactMathDeep) as T;
  if (v && typeof v === 'object')
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, compactMathDeep(x)])) as T;
  return v;
}
