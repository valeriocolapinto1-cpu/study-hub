/**
 * Figure SVG generate dal codice per gli esercizi del corso: tabelle di verità
 * e mappe di Karnaugh. Nessun colore fisso: testo e linee seguono
 * `currentColor`, le celle a 1 usano i token del tema, quindi le figure
 * restano leggibili in chiaro e in scuro. Ogni figura ha `role="img"` e una
 * descrizione testuale completa (`<title>` + `<desc>`), perché chi usa un
 * lettore di schermo deve poter risolvere l'esercizio quanto chi la guarda.
 */
import { L, type Lang } from './common';

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const FONT = 'font-family="var(--font-mono, monospace)"';
const TEXT = 'fill="currentColor"';
const LINE = 'stroke="currentColor" stroke-opacity="0.45"';
const HIGHLIGHT = 'style="fill: var(--accent-soft)"';

export type Bit = 0 | 1 | 'x';

/** Ordine di Gray delle righe/colonne di una mappa. */
export const GRAY2 = [0, 1, 3, 2] as const;

function svg(width: number, height: number, title: string, desc: string, body: string, id: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" ` +
    `role="img" aria-labelledby="${id}-t ${id}-d" style="max-width:100%;height:auto">` +
    `<title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc>${body}</svg>`
  );
}

/**
 * Tabella di verità. `rows[i]` è l'uscita della combinazione `i`
 * (bit più significativo = prima variabile).
 */
export function truthTableSvg(vars: readonly string[], rows: readonly Bit[], lang: Lang, out = 'Y'): string {
  const n = vars.length;
  const cw = 34;
  const rh = 26;
  const width = cw * (n + 1) + 16;
  const height = rh * (rows.length + 1) + 8;
  const sepX = 8 + cw * n;
  let body = `<g ${FONT} font-size="15" text-anchor="middle" dominant-baseline="central">`;
  vars.forEach(
    (v, i) =>
      (body += `<text ${TEXT} font-weight="600" x="${8 + cw * i + cw / 2}" y="${rh / 2 + 4}">${esc(v)}</text>`),
  );
  body += `<text ${TEXT} font-weight="600" x="${sepX + 8 + cw / 2}" y="${rh / 2 + 4}">${esc(out)}</text>`;
  rows.forEach((y, r) => {
    const cy = rh * (r + 1) + rh / 2 + 4;
    if (y === 1)
      body += `<rect ${HIGHLIGHT} x="${sepX + 8}" y="${cy - rh / 2}" width="${cw}" height="${rh}"/>`;
    for (let i = 0; i < n; i++) {
      const bit = (r >> (n - 1 - i)) & 1;
      body += `<text ${TEXT} x="${8 + cw * i + cw / 2}" y="${cy}">${bit}</text>`;
    }
    body += `<text ${TEXT} font-weight="600" x="${sepX + 8 + cw / 2}" y="${cy}">${y}</text>`;
  });
  body += `</g><line ${LINE} x1="4" y1="${rh + 4}" x2="${width - 4}" y2="${rh + 4}"/>`;
  body += `<line ${LINE} x1="${sepX + 4}" y1="4" x2="${sepX + 4}" y2="${height - 4}"/>`;
  const list = rows
    .map(
      (y, r) => `${r.toString(2).padStart(n, '0')}→${y === 'x' ? L(lang, 'indifferente', "don't care") : y}`,
    )
    .join(', ');
  return svg(
    width,
    height,
    L(lang, `Tabella di verità di ${out}(${vars.join(',')})`, `Truth table of ${out}(${vars.join(',')})`),
    L(lang, `Combinazioni ${vars.join('')} e uscita: `, `Combinations ${vars.join('')} and output: `) +
      list +
      '.',
    body,
    `tt-${vars.join('')}-${rows.join('')}`.replace(/x/g, 'd'),
  );
}

/** Mappa di Karnaugh a 3 o 4 variabili (righe = prime variabili, colonne = ultime due, in ordine di Gray). */
export function kmapSvg(vars: readonly string[], cells: readonly Bit[], lang: Lang): string {
  const n = vars.length;
  if (n !== 3 && n !== 4) throw new Error('mappe a 3 o 4 variabili');
  const rowVars = n === 3 ? vars.slice(0, 1) : vars.slice(0, 2);
  const colVars = vars.slice(n - 2);
  const rowCodes = n === 3 ? [0, 1] : [...GRAY2];
  const colCodes = [...GRAY2];
  const rowBits = rowVars.length;
  const cs = 46;
  const ox = 70;
  const oy = 54;
  const width = ox + cs * 4 + 12;
  const height = oy + cs * rowCodes.length + 12;
  let body = `<g ${FONT} text-anchor="middle" dominant-baseline="central">`;
  body += `<text ${TEXT} font-size="13" x="${ox / 2}" y="${oy / 2 - 6}">${esc(rowVars.join(''))}\\${esc(colVars.join(''))}</text>`;
  colCodes.forEach((c, j) => {
    body += `<text ${TEXT} font-size="14" x="${ox + cs * j + cs / 2}" y="${oy - 14}">${c.toString(2).padStart(2, '0')}</text>`;
  });
  rowCodes.forEach((rc, i) => {
    body += `<text ${TEXT} font-size="14" x="${ox - 18}" y="${oy + cs * i + cs / 2}">${rc.toString(2).padStart(rowBits, '0')}</text>`;
    colCodes.forEach((cc, j) => {
      const m = (rc << 2) | cc;
      const v = cells[m] ?? 0;
      const x = ox + cs * j;
      const y = oy + cs * i;
      body += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" ${LINE} ${v === 1 ? HIGHLIGHT : 'fill="none"'}/>`;
      body += `<text ${TEXT} font-size="17" font-weight="${v === 0 ? 400 : 600}" x="${x + cs / 2}" y="${y + cs / 2}">${v}</text>`;
      body += `<text ${TEXT} fill-opacity="0.55" font-size="9" x="${x + cs - 8}" y="${y + cs - 8}">${m}</text>`;
    });
  });
  body += '</g>';
  const ones = cells.flatMap((v, m) => (v === 1 ? [m] : []));
  const dc = cells.flatMap((v, m) => (v === 'x' ? [m] : []));
  const desc =
    L(
      lang,
      `Mintermini a 1: ${ones.join(', ') || 'nessuno'}`,
      `Minterms at 1: ${ones.join(', ') || 'none'}`,
    ) +
    (dc.length ? L(lang, `; indifferenze: ${dc.join(', ')}`, `; don't cares: ${dc.join(', ')}`) : '') +
    L(lang, '; tutte le altre celle valgono 0.', '; every other cell is 0.');
  return svg(
    width,
    height,
    L(lang, `Mappa di Karnaugh di Y(${vars.join(',')})`, `Karnaugh map of Y(${vars.join(',')})`),
    desc,
    body,
    `km-${cells.join('')}`.replace(/x/g, 'd'),
  );
}
