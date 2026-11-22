/**
 * Matematica `$…$` dentro testi brevi (sommari, obiettivi): resa con KaTeX a build-time, il resto
 * del testo solo con l'escape (niente Markdown: un `*` o un `_` restano come sono). Per i metadati
 * (`<meta name="description">`, titoli) `texToPlain` dà una versione in testo semplice.
 */
import katex from 'katex';
import { escapeHtml } from '../engine/rich';

const MATH = /(^|[^\\$])\$(?!\s)((?:\\\$|[^$\n])+?)\$(?!\d)/g;

export const hasTex = (text: string): boolean => /\$[^$\n]+\$/.test(text);

/** HTML del testo con la matematica inline resa da KaTeX (HTML + MathML). */
export function texInlineHtml(text: string): string {
  let out = '';
  let last = 0;
  for (const m of text.matchAll(MATH)) {
    const start = m.index + m[1]!.length;
    out += escapeHtml(text.slice(last, start));
    out += katex.renderToString(m[2]!.trim(), {
      output: 'htmlAndMathml',
      throwOnError: true,
      strict: 'error',
    });
    last = m.index + m[0].length;
  }
  return out + escapeHtml(text.slice(last));
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Testo semplice: la formula diventa il testo del suo MathML (`$Z_{th}$` → «Zth», `\Omega` → «Ω»). */
export function texToPlain(text: string): string {
  return text
    .replace(MATH, (_, pre: string, tex: string) => {
      const mathml = katex.renderToString(tex.trim(), { output: 'mathml', throwOnError: false });
      const plain = mathml
        .replace(/<annotation[\s\S]*?<\/annotation>/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (e, code: string) =>
          code.startsWith('#')
            ? String.fromCodePoint(
                code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : Number(code.slice(1)),
              )
            : (ENTITIES[code] ?? e),
        )
        .replace(/[⁡-⁤​]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      return pre + plain;
    })
    .replace(/\\\$/g, '$');
}
