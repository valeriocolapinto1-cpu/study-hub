/**
 * Testo di un frammento HTML come lo vedrebbe chi legge, senza le parti che possono contenere TeX o
 * codice di proposito: `.katex` (formula resa), `pre`, `code`, `script`, `style`, `svg`, `template`,
 * `head`, gli elementi con `data-tex-ok` e i commenti. Analizzatore minimo a pila (l'HTML è quello
 * della build di Astro, ben formato): niente DOM, così il controllo di tutta la build resta veloce.
 */

const SALTA = new Set(['pre', 'code', 'script', 'style', 'svg', 'template', 'head', 'textarea', 'math']);
const VUOTI = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
]);
const BLOCCO =
  /^(p|div|li|ul|ol|h[1-6]|tr|td|th|table|section|article|details|summary|figure|figcaption|dt|dd|dl|header|footer|nav|main|aside|blockquote|label|option|button|br)$/;
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', minus: '−' };

export const decodifica = (s) =>
  s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (e, c) =>
    c[0] === '#'
      ? String.fromCodePoint(c[1] === 'x' || c[1] === 'X' ? parseInt(c.slice(2), 16) : Number(c.slice(1)))
      : (ENT[c.toLowerCase()] ?? e),
  );

/** Testo visibile (approssimato) di un frammento HTML, con i blocchi su righe separate. */
export function testoVisibile(html) {
  const out = [];
  // pila: per ogni elemento aperto, se fa saltare il contenuto
  const pila = [];
  let saltati = 0;
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|([^<]+)/g;
  for (const m of html.matchAll(re)) {
    if (m[0].startsWith('<!--')) continue;
    if (m[4] !== undefined) {
      if (!saltati) out.push(decodifica(m[4]));
      continue;
    }
    const chiusura = m[1] === '/';
    const tag = m[2].toLowerCase();
    const attr = m[3] ?? '';
    if (BLOCCO.test(tag)) out.push('\n');
    if (chiusura) {
      // chiude fino al tag corrispondente (tollerante ai tag non chiusi)
      const i = pila.map((e) => e.tag).lastIndexOf(tag);
      if (i < 0) continue;
      for (const e of pila.splice(i)) if (e.salta) saltati--;
      continue;
    }
    if (VUOTI.has(tag) || /\/\s*$/.test(attr)) continue;
    const salta =
      SALTA.has(tag) ||
      /\bclass=(["'])(?:[^"']*\s)?katex(?:\s[^"']*)?\1/.test(attr) ||
      /\sdata-tex-ok\b/.test(attr);
    pila.push({ tag, salta });
    if (salta) saltati++;
  }
  return out.join('').replace(/[ \t]+/g, ' ');
}
