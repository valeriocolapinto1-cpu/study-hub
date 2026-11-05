// KaTeX self-hosted (assets/vendor/katex, come in Fisica II): nessun CDN, funziona offline. Se non carica, le formule restano come testo LaTeX.
import { url } from './ui.js';
const BASE = url('assets/vendor/katex/');
let loading = null;
function addScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.defer = true; s.onload = res; s.onerror = () => rej(new Error('KaTeX non raggiungibile')); document.head.append(s); });
}
function load() {
  if (!loading) {
    loading = (async () => {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = BASE + 'katex.min.css'; document.head.append(l);
      await addScript(BASE + 'katex.min.js');
      await addScript(BASE + 'auto-render.min.js');
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
    // formule lunghe che scorrono in orizzontale: raggiungibili e leggibili anche da tastiera
    el.querySelectorAll('.katex-display').forEach((d) => {
      if (d.closest('.fformula')) return; // lo scorrimento è del contenitore .fformula, già focalizzabile
      if (d.scrollWidth > d.clientWidth + 1) { d.tabIndex = 0; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'Formula (scorri in orizzontale)'); }
    });
    return true;
  } catch (e) {
    el.classList.add('math-fallback');
    return false;
  }
}
