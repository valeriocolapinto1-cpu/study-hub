// Utilità UI condivise: radice del sito, caricamento dati, badge, escape.
export const ROOT = new URL('../../', import.meta.url);
export const url = (p) => new URL(p, ROOT).href;
export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const cache = new Map();
export async function loadJSON(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(url(path)).then((r) => { if (!r.ok) throw new Error(path + ': HTTP ' + r.status); return r.json(); }));
  }
  return cache.get(path);
}
export const BADGES = ['UFFICIALE', 'STORICO', 'EDITORE', 'NON UFFICIALE', 'INFERENZA', 'DA VERIFICARE'];
const TITLES = {
  'UFFICIALE': 'Dato dal sito del docente o dal catalogo Roma',
  'STORICO': 'Ricavato dai testi d\'esame storici: indicazione, non regola',
  'EDITORE': 'Da schede di editori e librerie',
  'NON UFFICIALE': 'Materiale di terzi, non verificato',
  'INFERENZA': 'Deduzione ragionata, non un dato ufficiale',
  'DA VERIFICARE': 'Da confermare con il docente',
};
export function badge(name) {
  const cls = 'b-' + name.replace(/\s/g, '');
  return `<span class="badge ${cls}" title="${esc(TITLES[name] || '')}">${esc(name)}</span>`;
}
/** Sostituisce {{BADGE NOME}} nei testi con il badge corrispondente. */
export function withBadges(html) {
  return html.replace(/\[(UFFICIALE|STORICO|EDITORE|NON UFFICIALE|INFERENZA|DA VERIFICARE)\]/g, (_, n) => badge(n));
}
