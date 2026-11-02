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
  'UFFICIALE': 'Dato da fonti ufficiali del corso o dal catalogo dell\'ateneo',
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

/* icone SVG in linea (le stesse di Fisica II) */
export const ICONS = {
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
  sigma: '<path d="M18 4H6l6 8-6 8h12"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  auto: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
};
export function icon(name, cls = '') {
  return `<svg class="${cls}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;
}
