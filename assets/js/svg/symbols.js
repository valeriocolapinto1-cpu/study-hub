// Simboli SVG (stile ANSI/IEEE). Ogni funzione disegna in coordinate locali: terminale 1 in (0,0), terminale 2 in (len,0).
const STR = 'stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"';
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ln = (...p) => `<polyline points="${p.join(' ')}"/>`;
const mid = (len) => len / 2;

export const SYM = {
  R: (len) => { const m = mid(len); return ln(0, 0, m - 30, 0, m - 25, -9, m - 15, 9, m - 5, -9, m + 5, 9, m + 15, -9, m + 25, 9, m + 30, 0, len, 0); },
  C: (len) => { const m = mid(len); return ln(0, 0, m - 5, 0) + ln(m - 5, -14, m - 5, 14) + ln(m + 5, -14, m + 5, 14) + ln(m + 5, 0, len, 0); },
  L: (len) => { const m = mid(len); return ln(0, 0, m - 24, 0) + `<path d="M${m - 24} 0 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0"/>` + ln(m + 24, 0, len, 0); },
  V: (len) => { const m = mid(len); return ln(0, 0, m - 18, 0) + `<circle cx="${m}" cy="0" r="18"/>` + ln(m + 18, 0, len, 0) + `<g stroke-width="1.5">${ln(m - 12, 0, m - 6, 0)}${ln(m - 9, -3, m - 9, 3)}${ln(m + 6, 0, m + 12, 0)}</g>`; },
  I: (len) => { const m = mid(len); return ln(0, 0, m - 18, 0) + `<circle cx="${m}" cy="0" r="18"/>` + ln(m + 18, 0, len, 0) + ln(m - 10, 0, m + 10, 0) + ln(m + 4, -6, m + 10, 0, m + 4, 6); },
  S: (len) => { const m = mid(len); return ln(0, 0, len, 0) + `<circle cx="${m}" cy="0" r="12"/>`; },
  G: (len) => { const m = mid(len); return ln(0, 0, m - 18, 0) + `<polygon points="${m - 18},0 ${m},-18 ${m + 18},0 ${m},18"/>` + ln(m + 18, 0, len, 0) + ln(m - 9, 0, m + 9, 0) + ln(m + 3, -6, m + 9, 0, m + 3, 6); },
  // nullatore e noratore: scatole con etichetta
  nullator: (len) => { const m = mid(len); return ln(0, 0, m - 28, 0) + `<rect x="${m - 28}" y="-13" width="56" height="26" rx="4"/>` + ln(m + 28, 0, len, 0); },
  norator: (len) => { const m = mid(len); return ln(0, 0, m - 28, 0) + `<rect x="${m - 28}" y="-13" width="56" height="26" rx="4" stroke-dasharray="5 3"/>` + ln(m + 28, 0, len, 0); },
};
export const GROUND = (x, y) => `<g transform="translate(${x},${y})">${ln(0, 0, 0, 8)}${ln(-12, 8, 12, 8)}${ln(-7, 13, 7, 13)}${ln(-3, 18, 3, 18)}</g>`;
export const DOT = (x, y) => `<circle cx="${x}" cy="${y}" r="3.2" fill="currentColor" stroke="none"/>`;
export const TEXT = (x, y, t, anchor = 'middle', cls = '') => `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="currentColor" stroke="none"${cls ? ` class="${cls}"` : ''}>${esc(t)}</text>`;
export { STR };
