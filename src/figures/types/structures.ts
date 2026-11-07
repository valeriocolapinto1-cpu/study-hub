/**
 * Figure di logica e strutture: mappe di Karnaugh con raggruppamenti, campi di bit
 * (formati di istruzioni, IEEE 754, indirizzi), diagrammi di pipeline a stadi, grafi
 * (orientati o no, disposti in cerchio o su griglia).
 */
import { listText, plainLabel, Svg, type Ctx, type Drawn, type Pt, type Tone } from '../core';
import type { DiagramParams } from '../schemas';

type P<K extends keyof DiagramParams> = DiagramParams[K];
type Txt = string | { it: string; en?: string | undefined };
const tx = (t: Txt | undefined, c: Ctx): string =>
  t === undefined ? '' : typeof t === 'string' ? t : c.lang === 'en' ? (t.en ?? t.it) : t.it;
const textW = (s: string, size: number, mono = false): number => s.length * size * (mono ? 0.6 : 0.56);
const GROUP_TONES: Tone[] = ['accent', 'info', 'success', 'danger', 'warning', 'accent2'];

// --------------------------------------------------------- mappa di Karnaugh
const GRAY = [
  [0, 1],
  [0, 1, 3, 2],
] as const;

/** Geometria della mappa: righe = prime variabili, colonne = ultime (codice Gray). */
export function kmapLayout(n: number): {
  rows: readonly number[];
  cols: readonly number[];
  rv: number;
  cv: number;
} {
  const rv = Math.floor(n / 2);
  const cv = n - rv;
  return { rows: rv === 1 ? GRAY[0] : GRAY[1], cols: cv === 1 ? GRAY[0] : GRAY[1], rv, cv };
}

/** Tratti contigui (anche ciclici) di un insieme di posizioni su un anello di lunghezza n. */
function cyclicRuns(pos: number[], n: number): Array<[number, number]> {
  const set = new Set(pos);
  if (set.size === n) return [[0, n - 1]];
  const sorted = [...set].sort((a, b) => a - b);
  const runs: Array<[number, number]> = [];
  for (const p of sorted) {
    const last = runs[runs.length - 1];
    if (last && p === last[1] + 1) last[1] = p;
    else runs.push([p, p]);
  }
  // un gruppo che «gira» oltre il bordo resta in due tratti, uno per lato della mappa
  return runs;
}

export function karnaugh(p: P<'karnaugh'>, c: Ctx): Drawn {
  const n = p.vars.length;
  const { rows, cols, rv, cv } = kmapLayout(n);
  const cw = 44;
  const ch = 36;
  const left = 64;
  const top = 50;
  const s = new Svg(left + cols.length * cw + 16, top + rows.length * ch + 14);
  const rowVars = p.vars.slice(0, rv).join('');
  const colVars = p.vars.slice(rv).join('');
  // intestazioni
  s.line(left - 34, top - 34, left, top, { tone: 'muted', width: 1 });
  s.text(left - 30, top - 6, rowVars, { anchor: 'start', italic: true, size: 12 });
  s.text(left - 4, top - 30, colVars, { anchor: 'end', italic: true, size: 12 });
  const bits = (v: number, k: number): string => v.toString(2).padStart(k, '0');
  cols.forEach((g, j) =>
    s.text(left + j * cw + cw / 2, top - 12, bits(g, cv), { mono: true, size: 12, muted: true }),
  );
  rows.forEach((g, i) =>
    s.text(left - 10, top + i * ch + ch / 2, bits(g, rv), {
      mono: true,
      size: 12,
      muted: true,
      anchor: 'end',
    }),
  );
  const posOf = (m: number): [number, number] => [rows.indexOf(m >> cv), cols.indexOf(m & ((1 << cv) - 1))];
  // gruppi (sotto le cifre)
  (p.groups ?? []).forEach((g, gi) => {
    const tone = g.tone ?? GROUP_TONES[gi % GROUP_TONES.length]!;
    const cells = g.cells.map(posOf);
    const rr = cyclicRuns(
      cells.map((q) => q[0]),
      rows.length,
    );
    const cc = cyclicRuns(
      cells.map((q) => q[1]),
      cols.length,
    );
    const inset = 3 + (gi % 3) * 2.5;
    for (const [r0, r1] of rr)
      for (const [c0, c1] of cc)
        s.rect(
          left + c0 * cw + inset,
          top + r0 * ch + inset,
          (c1 - c0 + 1) * cw - 2 * inset,
          (r1 - r0 + 1) * ch - 2 * inset,
          {
            tone,
            width: 2.2,
            rx: 12,
            fill: 'none',
          },
        );
  });
  for (let i = 0; i < rows.length; i++)
    for (let j = 0; j < cols.length; j++) {
      const m = (rows[i]! << cv) | cols[j]!;
      const v = p.values[m]!;
      s.rect(left + j * cw, top + i * ch, cw, ch, { tone: 'muted', width: 1 });
      s.text(left + j * cw + cw / 2, top + i * ch + ch / 2, v === '-' ? '–' : String(v), {
        mono: true,
        weight: v === 1 ? 650 : 400,
        muted: v === 0,
      });
      s.text(left + j * cw + cw - 4, top + i * ch + 8, String(m), { size: 8, muted: true, anchor: 'end' });
    }
  const ones = p.values.flatMap((v, i) => (v === 1 ? [i] : []));
  const dcs = p.values.flatMap((v, i) => (v === 'x' || v === '-' ? [i] : []));
  const out = p.output ?? 'Y';
  return {
    svg: s,
    title: c.L('Mappa di Karnaugh', 'Karnaugh map'),
    description:
      c.L(
        `Mappa di Karnaugh di ${out}(${p.vars.join(',')}): righe ${rowVars}, colonne ${colVars} in codice Gray. Uno nei mintermini ${ones.join(', ') || 'nessuno'}`,
        `Karnaugh map of ${out}(${p.vars.join(',')}): rows ${rowVars}, columns ${colVars} in Gray code. Ones at minterms ${ones.join(', ') || 'none'}`,
      ) +
      (dcs.length ? c.L(`; indifferenze in ${dcs.join(', ')}`, `; don't-cares at ${dcs.join(', ')}`) : '') +
      (p.groups?.length
        ? c.L('; gruppi: ', '; groups: ') +
          p.groups
            .map((g) => `${g.label ? `${plainLabel(g.label)} ` : ''}{${[...new Set(g.cells)].join(', ')}}`)
            .join('; ')
        : '') +
      '.',
  };
}

// ------------------------------------------------------------- campi di bit
export function bitfield(p: P<'bitfield'>, c: Ctx): Drawn {
  const bits = p.bits.replace(/ /g, '');
  const n = bits.length;
  const cw = n > 24 ? 14 : n > 16 ? 18 : 26;
  const x0 = 8;
  const hasFields = !!p.fields?.length;
  const yb = p.indices === false ? 8 : 22;
  const bh = 28;
  const s = new Svg(x0 * 2 + n * cw, yb + bh + (hasFields ? 44 : 8) + (p.caption ? 18 : 0));
  const xOf = (bit: number): number => x0 + (n - 1 - bit) * cw;
  (p.fields ?? []).forEach((f, i) => {
    const tone = f.tone ?? GROUP_TONES[i % GROUP_TONES.length]!;
    s.rect(xOf(f.msb), yb, (f.msb - f.lsb + 1) * cw, bh, { fill: 'soft', tone, width: 0, opacity: 0.9 });
  });
  for (let k = 0; k < n; k++) {
    const bit = n - 1 - k;
    const x = x0 + k * cw;
    s.rect(x, yb, cw, bh, { tone: 'muted', width: 0.8 });
    s.text(x + cw / 2, yb + bh / 2, bits[k]!, { mono: true, size: cw < 16 ? 11 : 13 });
    if (p.indices !== false && (n <= 16 || bit % 4 === 0 || bit === n - 1))
      s.text(x + cw / 2, yb - 9, String(bit), { size: 9, muted: true });
  }
  if (n > 8)
    for (let b = 4; b < n; b += 4) s.line(xOf(b) + cw, yb - 2, xOf(b) + cw, yb + bh + 2, { width: 1.6 });
  s.rect(x0, yb, n * cw, bh, { width: 1.4 });
  const fieldTexts: string[] = [];
  (p.fields ?? []).forEach((f, i) => {
    const tone = f.tone ?? GROUP_TONES[i % GROUP_TONES.length]!;
    const a = xOf(f.msb) + 2;
    const b = xOf(f.lsb) + cw - 2;
    const y = yb + bh + 8;
    s.path(`M${a} ${y - 3}V${y + 3}H${b}V${y - 3}`, { tone, width: 1.6 });
    const lab = tx(f.label, c);
    s.text((a + b) / 2, y + 18, lab, { size: textW(lab, 12) > b - a + 30 ? 10 : 12 });
    fieldTexts.push(
      `${plainLabel(lab)} ${c.L('bit', 'bits')} ${f.msb}–${f.lsb} = ${bits.slice(n - 1 - f.msb, n - f.lsb)}`,
    );
  });
  if (p.caption) s.text(s.width / 2, s.height - 6, tx(p.caption, c), { size: 12, muted: true });
  return {
    svg: s,
    title: c.L('Campi di bit', 'Bit fields'),
    description:
      c.L(`Parola di ${n} bit: ${bits}`, `${n}-bit word: ${bits}`) +
      (fieldTexts.length ? `. ${c.L('Campi', 'Fields')}: ${fieldTexts.join('; ')}` : '') +
      '.',
  };
}

// --------------------------------------------------------------- pipeline
export function pipeline(p: P<'pipeline'>, c: Ctx): Drawn {
  const last = Math.max(...p.rows.map((r) => r.start + r.stages.length - 1));
  const lw = Math.max(60, ...p.rows.map((r) => textW(r.label, 12, true) + 16));
  const cw = Math.max(24, Math.min(38, Math.floor(440 / last)));
  const rh = 30;
  const top = 26;
  const s = new Svg(lw + last * cw + 8, top + p.rows.length * rh + 8);
  for (let k = 1; k <= last; k++) {
    s.text(lw + (k - 0.5) * cw, 12, String(k), { size: 11, muted: true });
    s.line(lw + (k - 1) * cw, top - 2, lw + (k - 1) * cw, top + p.rows.length * rh, {
      tone: 'faint',
      width: 0.6,
    });
  }
  const cellX = (cyc: number): number => lw + (cyc - 1) * cw;
  const lines: string[] = [];
  p.rows.forEach((r, i) => {
    const y = top + i * rh;
    s.text(lw - 8, y + rh / 2, r.label, { anchor: 'end', mono: true, size: 12 });
    r.stages.forEach((st, k) => {
      const x = cellX(r.start + k);
      const stall = st === '-' || st === '';
      s.rect(x + 2, y + 3, cw - 4, rh - 6, {
        rx: 4,
        tone: stall ? 'warning' : 'accent',
        width: 1.2,
        fill: stall ? 'none' : 'soft',
        ...(stall ? { dash: '3 3' } : {}),
      });
      s.text(x + cw / 2, y + rh / 2, stall ? '·' : st, { mono: true, size: 12, weight: 600 });
    });
    const stalls = r.stages.filter((st) => st === '-' || st === '').length;
    lines.push(
      c.L(
        `${r.label}: dal ciclo ${r.start} al ${r.start + r.stages.length - 1} (${r.stages.map((st) => (st === '-' || st === '' ? 'stallo' : st)).join(' ')})`,
        `${r.label}: cycles ${r.start} to ${r.start + r.stages.length - 1} (${r.stages.map((st) => (st === '-' || st === '' ? 'stall' : st)).join(' ')})`,
      ) + (stalls ? c.L(`, ${stalls} stalli`, `, ${stalls} stalls`) : ''),
    );
  });
  for (const f of p.forwards ?? []) {
    const a: Pt = [cellX(f.from[1]) + cw / 2, top + f.from[0] * rh + rh - 4];
    const b: Pt = [cellX(f.to[1]) + cw / 2 - 4, top + f.to[0] * rh + 5];
    s.arrow(a[0], a[1], b[0], b[1], { tone: 'danger', width: 1.8, head: 7 });
  }
  return {
    svg: s,
    title: c.L('Diagramma della pipeline', 'Pipeline diagram'),
    description:
      c.L(`Diagramma della pipeline su ${last} cicli. `, `Pipeline diagram over ${last} cycles. `) +
      lines.join('; ') +
      (p.forwards?.length
        ? c.L(`; ${p.forwards.length} inoltri (forwarding)`, `; ${p.forwards.length} forwarding paths`)
        : '') +
      '.',
  };
}

// ------------------------------------------------------------------ grafo
export function graph(p: P<'graph'>, c: Ctx): Drawn {
  const W = 360;
  const H = 280;
  const s = new Svg(W, H);
  const placed = p.nodes.every((nd) => nd.x !== undefined && nd.y !== undefined);
  const pos = new Map<string, Pt>();
  p.nodes.forEach((nd, i) => {
    if (placed) pos.set(nd.id, [30 + (nd.x! / 10) * (W - 60), 30 + (nd.y! / 10) * (H - 60)]);
    else {
      const a = -Math.PI / 2 + (2 * Math.PI * i) / p.nodes.length;
      pos.set(nd.id, [W / 2 + 112 * Math.cos(a), H / 2 + 104 * Math.sin(a)]);
    }
  });
  const rN = 15;
  // archi multipli tra la stessa coppia: curvati in modo simmetrico
  const pairCount = new Map<string, number>();
  const pairSeen = new Map<string, number>();
  const key = (a: string, b: string): string => [a, b].sort().join('|');
  for (const e of p.edges) pairCount.set(key(e.from, e.to), (pairCount.get(key(e.from, e.to)) ?? 0) + 1);
  for (const e of p.edges) {
    const k = key(e.from, e.to);
    const tot = pairCount.get(k)!;
    const idx = pairSeen.get(k) ?? 0;
    pairSeen.set(k, idx + 1);
    const [x1, y1] = pos.get(e.from)!;
    const [x2, y2] = pos.get(e.to)!;
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    // normale orientata in modo canonico (indipendente dal verso dell'arco)
    const flip = e.from < e.to ? 1 : -1;
    const nx = (-(y2 - y1) / len) * flip;
    const ny = ((x2 - x1) / len) * flip;
    const bend = (idx - (tot - 1) / 2) * 34;
    const cx = (x1 + x2) / 2 + nx * bend;
    const cy = (y1 + y2) / 2 + ny * bend;
    const tone: Tone = e.highlight ? 'accent' : 'ink';
    const width = e.highlight ? 2.8 : 1.5;
    // estremi accorciati del raggio del nodo
    const sh = (px: number, py: number, qx: number, qy: number): Pt => {
      const d = Math.hypot(qx - px, qy - py) || 1;
      return [px + ((qx - px) / d) * rN, py + ((qy - py) / d) * rN];
    };
    const a = sh(x1, y1, cx, cy);
    const b = sh(x2, y2, cx, cy);
    s.path(
      `M${a[0].toFixed(1)} ${a[1].toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`,
      {
        tone,
        width,
        ...(e.dashed ? { dash: '6 4' } : {}),
      },
    );
    // punto medio della curva e tangente
    const mx = 0.25 * a[0] + 0.5 * cx + 0.25 * b[0];
    const my = 0.25 * a[1] + 0.5 * cy + 0.25 * b[1];
    if (p.directed)
      s.head(mx + (b[0] - a[0]) * 0.04, my + (b[1] - a[1]) * 0.04, b[0] - a[0], b[1] - a[1], 9, tone);
    if (e.label) {
      const lx = mx + nx * (bend >= 0 ? 12 : -12);
      const ly = my + ny * (bend >= 0 ? 12 : -12);
      s.text(lx, ly, e.label, { italic: true, size: 12, halo: true });
    }
  }
  for (const nd of p.nodes) {
    const [x, y] = pos.get(nd.id)!;
    s.circle(x, y, rN, { fill: 'surface', width: 1.6 });
    s.text(x, y, nd.label ?? nd.id, { size: 13, weight: 600 });
  }
  const name = (id: string): string => plainLabel(p.nodes.find((nd) => nd.id === id)?.label ?? id);
  const hl = p.edges.filter((e) => e.highlight).length;
  return {
    svg: s,
    title: c.L(p.directed ? 'Grafo orientato' : 'Grafo', p.directed ? 'Directed graph' : 'Graph'),
    description:
      c.L(
        `${p.directed ? 'Grafo orientato' : 'Grafo'} con ${p.nodes.length} nodi e ${p.edges.length} lati: `,
        `${p.directed ? 'Directed graph' : 'Graph'} with ${p.nodes.length} nodes and ${p.edges.length} edges: `,
      ) +
      listText(
        p.edges.map(
          (e) =>
            `${e.label ? `${plainLabel(e.label)} ` : ''}${name(e.from)}${p.directed ? '→' : '–'}${name(e.to)}${e.highlight ? c.L(' (evidenziato)', ' (highlighted)') : ''}`,
        ),
        c.lang,
      ) +
      (hl ? c.L(`; ${hl} lati evidenziati`, `; ${hl} highlighted edges`) : '') +
      '.',
  };
}
