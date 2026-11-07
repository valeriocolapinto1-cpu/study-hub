/**
 * Testo "ricco" degli esercizi e delle flashcard → HTML sicuro.
 *
 * Sottoinsieme di Markdown pensato per enunciati e soluzioni: paragrafi,
 * a capo, elenchi puntati e numerati, **grassetto**, *corsivo*, `codice`,
 * blocchi preformattati fra righe ``` (tabelle di verità, listati, conti in
 * colonna: spazi conservati, nessuna altra sintassi al loro interno)
 * e matematica `$…$`, `$$…$$`, `\(…\)`, `\[…\]`. L'HTML in ingresso viene
 * sempre sottoposto a escape: nessun markup arbitrario entra nella pagina.
 *
 * La resa della matematica è iniettata (`renderMath`): a build-time si usa
 * KaTeX importato staticamente (src/lib/rich-server.ts), nel browser lo si
 * carica in modo lazy solo per i testi generati (src/islands/lib/rich-client.ts).
 */

export type MathRenderer = (tex: string, display: boolean) => string;

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s: string): string => s.replace(/[&<>"']/g, (c) => ESC[c]!);

/** Resa di ripiego della matematica (senza KaTeX): testo TeX con escape, marcato. */
export const plainMath: MathRenderer = (tex, display) =>
  `<span class="math-tex${display ? ' math-tex--display' : ''}">${escapeHtml(tex)}</span>`;

const PLACEHOLDER = (i: number) => `\u0000M${i}\u0000`;

/** Estrae la matematica sostituendola con segnaposto, così il Markdown non la tocca. */
function extractMath(text: string, render: MathRenderer): { text: string; math: string[] } {
  const math: string[] = [];
  const put = (tex: string, display: boolean) => {
    let html: string;
    try {
      html = render(tex.trim(), display);
    } catch {
      html = plainMath(tex.trim(), display);
    }
    math.push(display ? `<span class="math-display">${html}</span>` : html);
    return PLACEHOLDER(math.length - 1);
  };
  const out = text
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex: string) => put(tex, true))
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, tex: string) => put(tex, true))
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, tex: string) => put(tex, false))
    .replace(
      /(^|[^\\$])\$(?!\s)((?:\\\$|[^$\n])+?)\$(?!\d)/g,
      (_, pre: string, tex: string) => pre + put(tex, false),
    );
  return { text: out, math };
}

function inline(s: string): string {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(/(^|[^_\w])_([^_\s][^_]*?)_(?!\w)/g, '$1<em>$2</em>')
    .replace(/\\\$/g, '$')
    .replace(/ {2,}\n|\\\n/g, '<br>')
    .replace(/\n/g, ' ');
}

/** Converte testo ricco in HTML (blocchi). `inlineOnly` evita i `<p>` per testi brevi (etichette, opzioni). */
const CODE_PLACEHOLDER = (i: number) => `\u0000C${i}\u0000`;

/** Estrae i blocchi ``` … ``` prima di tutto il resto: dentro non vale né Markdown né matematica. */
function extractCode(text: string): { text: string; code: string[] } {
  const code: string[] = [];
  const out = text.replace(/(^|\n)```[^\n]*\n([\s\S]*?)\n```(?=\n|$)/g, (_, pre: string, body: string) => {
    code.push(`<pre class="rich-pre"><code>${escapeHtml(body)}</code></pre>`);
    return `${pre}\n\n${CODE_PLACEHOLDER(code.length - 1)}\n\n`;
  });
  return { text: out, code };
}

export function renderRich(
  source: string,
  render: MathRenderer = plainMath,
  opts: { inlineOnly?: boolean } = {},
): string {
  const normalized = source.replace(/\r\n?/g, '\n').trim();
  if (!opts.inlineOnly && normalized.includes('```')) {
    const { text: rest, code } = extractCode(normalized);
    return rest
      .split(/\n{2,}/)
      .map((block) => {
        const m = /^\u0000C(\d+)\u0000$/.exec(block.trim());
        return m ? (code[Number(m[1])] ?? '') : block.trim() ? renderRich(block, render) : '';
      })
      .join('');
  }
  const { text, math } = extractMath(normalized, render);
  const restore = (html: string) =>
    html.replace(/\u0000M(\d+)\u0000/g, (_, i: string) => math[Number(i)] ?? '');
  if (opts.inlineOnly) return restore(inline(text));
  const blocks = text.split(/\n{2,}/);
  const html = blocks
    .map((block) => {
      const lines = block.split('\n');
      if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) {
        return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*•]\s+/, ''))}</li>`).join('')}</ul>`;
      }
      if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
        return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`;
      }
      // Blocco composto da sola matematica display: niente <p> attorno.
      if (
        /^\u0000M\d+\u0000$/.test(block.trim()) &&
        math[Number(block.trim().slice(2, -1))]?.startsWith('<span class="math-display">')
      ) {
        return block.trim();
      }
      return `<p>${inline(block)}</p>`;
    })
    .join('');
  return restore(html);
}

/** Testo semplice (per aria-label, ricerca, anteprime): via la sintassi, la matematica resta in TeX. */
/**
 * Lettura in testo semplice di un testo con matematica TeX, per gli attributi ARIA:
 * toglie delimitatori, comandi di formato e graffe e trasforma i comandi in parole (\\omega → omega).
 */
export function speakableText(source: string): string {
  return plainText(
    source
      .replace(
        /\\(?:mathrm|text|operatorname|vec|hat|bar|dot|ddot|left|right|displaystyle|quad|qquad)(?![a-zA-Z])|\\[,;! ]/g,
        ' ',
      )
      .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
      .replace(/\\(?:cdot|times)/g, '·')
      .replace(/\\([a-zA-Z]+)/g, '$1')
      .replace(/[{}]/g, ''),
  );
}

/**
 * Solo la prosa di un testo, senza matematica: per l'indice di ricerca, dove le variabili di una
 * lettera ($q$, $z$…) farebbero corrispondere query qualsiasi e renderebbero illeggibili gli estratti.
 */
export function proseText(source: string): string {
  return plainText(source.replace(/\$\$[\s\S]*?\$\$|\$[^$]*\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g, ' '));
}

export function plainText(source: string): string {
  return source
    .replace(/^```[^\n]*$/gm, '')
    .replace(/\$\$?|\\[()[\]]/g, '')
    .replace(/\*\*|__|`/g, '')
    .replace(/(^|\s)[*_]([^*_]+)[*_]/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
}
