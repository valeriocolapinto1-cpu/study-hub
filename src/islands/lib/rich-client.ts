/**
 * Resa dei testi generati nel browser: KaTeX viene caricato solo alla prima
 * formula (chunk separato, con il suo CSS), mai sulle pagine che non ne hanno bisogno.
 */
import { renderRich, type MathRenderer } from '../../engine/rich';

let katexPromise: Promise<MathRenderer> | null = null;

function loadKatex(): Promise<MathRenderer> {
  katexPromise ??= Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(([mod]) => {
    const katex = mod.default;
    return (tex: string, display: boolean) =>
      katex.renderToString(tex, { displayMode: display, throwOnError: false, output: 'htmlAndMathml' });
  });
  return katexPromise;
}

const hasMath = (s: string) => /\$|\\\(|\\\[/.test(s);

/** Rende un testo; carica KaTeX solo se contiene matematica. */
export async function renderRichClient(text: string, opts: { inlineOnly?: boolean } = {}): Promise<string> {
  return renderRich(text, hasMath(text) ? await loadKatex() : undefined, opts);
}
