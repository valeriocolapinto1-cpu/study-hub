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
