// Mini-libreria SVG per gli schemi didattici delle pagine di studio (stile ANSI/IEEE: resistore a zig-zag).
const W = 'stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"';
export const wrap = (w, h, inner) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" ${W} font-family="system-ui,sans-serif" font-size="14" aria-hidden="true">${inner}</svg>`;
export const line = (...p) => `<polyline points="${p.join(' ')}"/>`;
export const dot = (x, y) => `<circle cx="${x}" cy="${y}" r="3" fill="currentColor"/>`;
export const text = (x, y, t, a = 'middle') => `<text x="${x}" y="${y}" text-anchor="${a}" fill="currentColor" stroke="none">${t}</text>`;
/** Resistore orizzontale da x a x+60 alla quota y. */
export const resH = (x, y, label) => `${line(x, y, x + 10, y, x + 15, y - 9, x + 25, y + 9, x + 35, y - 9, x + 45, y + 9, x + 50, y, x + 60, y)}${label ? text(x + 30, y - 16, label) : ''}`;
export const resV = (x, y, label) => `${line(x, y, x, y + 10, x - 9, y + 15, x + 9, y + 25, x - 9, y + 35, x + 9, y + 45, x, y + 50, x, y + 60)}${label ? text(x + 18, y + 34, label, 'start') : ''}`;
export const vsrcV = (x, y, label) => `<circle cx="${x}" cy="${y + 20}" r="18"/>${line(x, y, x, y + 2)}${line(x, y + 38, x, y + 60)}${text(x, y + 16, '+')}${text(x, y + 32, '−')}${label ? text(x - 24, y + 25, label, 'end') : ''}`;
export const isrcV = (x, y, label) => `<circle cx="${x}" cy="${y + 20}" r="18"/>${line(x, y, x, y + 2)}${line(x, y + 38, x, y + 60)}${line(x, y + 30, x, y + 10, x - 5, y + 18, x, y + 10, x + 5, y + 18)}${label ? text(x - 24, y + 25, label, 'end') : ''}`;
export const capH = (x, y, label) => `${line(x, y, x + 24, y)}${line(x + 24, y - 12, x + 24, y + 12)}${line(x + 34, y - 12, x + 34, y + 12)}${line(x + 34, y, x + 60, y)}${label ? text(x + 30, y - 18, label) : ''}`;
export const indH = (x, y, label) => `${line(x, y, x + 8, y)}<path d="M${x + 8} ${y} a6 6 0 0 1 12 0 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0 a6 6 0 0 1 12 0"/>${line(x + 56, y, x + 60, y)}${label ? text(x + 30, y - 16, label) : ''}`;
export const gnd = (x, y) => `${line(x, y, x, y + 8)}${line(x - 12, y + 8, x + 12, y + 8)}${line(x - 7, y + 13, x + 7, y + 13)}${line(x - 3, y + 18, x + 3, y + 18)}`;
export const arrow = (x1, y1, x2, y2) => {
  const a = Math.atan2(y2 - y1, x2 - x1), s = 7;
  const p = (t) => `${(x2 - s * Math.cos(a + t)).toFixed(1)},${(y2 - s * Math.sin(a + t)).toFixed(1)}`;
  return `${line(x1, y1, x2, y2)}${line(p(0.45), `${x2},${y2}`, p(-0.45))}`;
};
