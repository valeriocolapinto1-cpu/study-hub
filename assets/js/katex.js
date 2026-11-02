// Caricamento di KaTeX da CDN con fallback: se non carica, le formule restano come testo LaTeX.
const V = '0.16.9';
const BASE = `https://cdnjs.cloudflare.com/ajax/libs/KaTeX/${V}/`;
let loading = null;
function addScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.defer = true; s.onload = res; s.onerror = () => rej(new Error('KaTeX non raggiungibile')); document.head.append(s); });
}
function load() {
  if (!loading) {
    loading = (async () => {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = BASE + 'katex.min.css'; document.head.append(l);
      await addScript(BASE + 'katex.min.js');
      await addScript(BASE + 'contrib/auto-render.min.js');
    })();
  }
  return loading;
}
export const DELIMS = [
  { left: '$$', right: '$$', display: true },
  { left: '$', right: '$', display: false },
];
/** Compone le formule $…$ e $$…$$ dentro `el`. Non lancia mai: in caso di errore lascia il LaTeX leggibile. */
export async function typeset(el) {
  try {
    await load();
    globalThis.renderMathInElement(el, { delimiters: DELIMS, throwOnError: false, ignoredTags: ['script', 'style', 'textarea', 'code'] });
    return true;
  } catch (e) {
    el.classList.add('math-fallback');
    return false;
  }
}
