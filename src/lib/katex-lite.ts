/**
 * Formule KaTeX "leggere" per i dati delle isole: si toglie la copia MathML
 * (`<span class="katex-mathml">…</span>`, circa metà del peso di ogni formula)
 * e il contenitore `.katex` diventa un'immagine con il TeX come nome
 * accessibile. Le pagine statiche (teoria, formulario) tengono il MathML.
 */

const KATEX_WITH_MATHML = /<span class="katex"><span class="katex-mathml">([\s\S]*?)<\/span>/g;
const TEX_ANNOTATION = /<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/;

/** HTML con KaTeX senza MathML; `role="img"` + `aria-label` con il TeX (già con escape HTML). */
export function stripMathml(html: string): string {
  if (!html.includes('katex-mathml')) return html;
  return html.replace(KATEX_WITH_MATHML, (_, mathml: string) => {
    const tex = (TEX_ANNOTATION.exec(mathml)?.[1] ?? '').replace(/\s+/g, ' ').trim();
    return `<span class="katex" role="img" aria-label="${tex.replace(/"/g, '&quot;')}">`;
  });
}
