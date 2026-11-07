/**
 * Figure di informatica: diagrammi di flusso (disposizione automatica), schemi a
 * blocchi (su griglia), array/memoria/pila/coda, liste concatenate, alberi,
 * tabelle di verità.
 */
import { listText, Svg, type Ctx, type Drawn, type Pt } from '../core';
import type { DiagramParams, TreeNodeInput } from '../schemas';

type P<K extends keyof DiagramParams> = DiagramParams[K];
type Txt = string | { it: string; en?: string | undefined };

const tx = (t: Txt | undefined, c: Ctx): string => (t === undefined ? '' : typeof t === 'string' ? t : c.lang === 'en' ? (t.en ?? t.it) : t.it);

/** Larghezza stimata del testo (Geist: ~0,56 em per carattere, mono 0,6). */
const textW = (s: string, size: number, mono = false): number => s.length * size * (mono ? 0.6 : 0.56);

/** A capo per larghezza massima. */
function wrap(s: string, size: number, max: number): string[] {
  const words = s.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (textW(next, size) > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

function multiline(s: Svg, x: number, y: number, lines: string[], size: number, o: { mono?: boolean } = {}): void {
  const lh = size * 1.25;
  lines.forEach((l, i) => s.text(x, y + (i - (lines.length - 1) / 2) * lh, l, { size, ...(o.mono ? { mono: true } : {}) }));
}

/** Freccia ortogonale lungo una spezzata con punta finale. */
function route(s: Svg, pts: Pt[], o: { both?: boolean } = {}): void {
  s.polyline(pts, { width: 1.4 });
  const a = pts[pts.length - 2]!;
  const b = pts[pts.length - 1]!;
  s.head(b[0], b[1], b[0] - a[0], b[1] - a[1], 9);
  if (o.both) s.head(pts[0]![0], pts[0]![1], pts[0]![0] - pts[1]![0], pts[0]![1] - pts[1]![1], 9);
}

// -------------------------------------------------------------- diagramma di flusso
interface FNode {
  id: string;
  kind: P<'flowchart'>['nodes'][number]['kind'];
  lines: string[];
  w: number;
  h: number;
  rank: number;
  col: number;
  x: number;
  y: number;
}

export function flowchart(p: P<'flowchart'>, c: Ctx): Drawn {
  const size = 13;
  const nodes = new Map<string, FNode>();
  for (const n of p.nodes) {
    const lines = wrap(tx(n.text, c), size, n.kind === 'decision' ? 110 : 150);
    const tw = Math.max(...lines.map((l) => textW(l, size)));
    const dec = n.kind === 'decision';
    const w = dec ? Math.max(130, tw * 1.6 + 30) : Math.max(n.kind === 'io' ? 120 : 100, tw + 32);
    const h = dec ? Math.max(60, lines.length * size * 1.25 * 1.9 + 16) : Math.max(38, lines.length * size * 1.25 + 18);
    nodes.set(n.id, { id: n.id, kind: n.kind, lines, w, h, rank: 0, col: -1, x: 0, y: 0 });
  }
  const out = new Map<string, string[]>();
  for (const e of p.edges) out.set(e.from, [...(out.get(e.from) ?? []), e.to]);
  // archi all'indietro (DFS) e ordine topologico
  const state = new Map<string, number>();
  const back = new Set<number>();
  const order: string[] = [];
  const dfs = (u: string): void => {
    state.set(u, 1);
    p.edges.forEach((e, i) => {
      if (e.from !== u) return;
      const st = state.get(e.to) ?? 0;
      if (st === 1) back.add(i);
      else if (st === 0) dfs(e.to);
    });
    state.set(u, 2);
    order.push(u);
  };
  for (const n of p.nodes) if (!state.get(n.id)) dfs(n.id);
  order.reverse();
  for (const u of order)
    p.edges.forEach((e, i) => {
      if (e.from === u && !back.has(i)) nodes.get(e.to)!.rank = Math.max(nodes.get(e.to)!.rank, nodes.get(u)!.rank + 1);
    });
  // colonne: il primo successore resta sotto, gli altri a destra; un nodo con più
  // predecessori (ricongiungimento) prende la colonna più a sinistra proposta
  const taken = new Set<string>();
  for (const v of order) {
    const nv = nodes.get(v)!;
    let col = Infinity;
    p.edges.forEach((e, i) => {
      if (e.to !== v || back.has(i)) return;
      const sibs = p.edges.filter((f, k) => f.from === e.from && !back.has(k));
      col = Math.min(col, nodes.get(e.from)!.col + sibs.indexOf(e));
    });
    nv.col = Number.isFinite(col) ? col : 0;
    while (taken.has(`${nv.rank}:${nv.col}`)) nv.col++;
    taken.add(`${nv.rank}:${nv.col}`);
  }
  const colW = Math.max(...[...nodes.values()].map((n) => n.w)) + 56;
  const ranks = Math.max(...[...nodes.values()].map((n) => n.rank)) + 1;
  const rowH = Math.max(...[...nodes.values()].map((n) => n.h)) + 40;
  const cols = Math.max(...[...nodes.values()].map((n) => n.col)) + 1;
  const backCount = back.size;
  const left = 24 + backCount * 14;
  for (const n of nodes.values()) {
    n.x = left + n.col * colW + colW / 2;
    n.y = 20 + n.rank * rowH + rowH / 2;
  }
  const s = new Svg(left + cols * colW + 10, 20 + ranks * rowH + 10);
  // nodi
  for (const n of nodes.values()) {
    const { x, y, w, h } = n;
    if (n.kind === 'decision')
      s.polygon(
        [
          [x, y - h / 2],
          [x + w / 2, y],
          [x, y + h / 2],
          [x - w / 2, y],
        ],
        { fill: 'surface2', width: 1.5 },
      );
    else if (n.kind === 'io') {
      const k = 12;
      s.polygon(
        [
          [x - w / 2 + k, y - h / 2],
          [x + w / 2 + k, y - h / 2],
          [x + w / 2 - k, y + h / 2],
          [x - w / 2 - k, y + h / 2],
        ],
        { fill: 'surface2', width: 1.5 },
      );
    } else {
      s.rect(x - w / 2, y - h / 2, w, h, { fill: n.kind === 'start' || n.kind === 'end' ? 'soft' : 'surface2', width: 1.5, rx: n.kind === 'start' || n.kind === 'end' ? h / 2 : 3 });
      if (n.kind === 'call') {
        s.line(x - w / 2 + 8, y - h / 2, x - w / 2 + 8, y + h / 2, { width: 1.2 });
        s.line(x + w / 2 - 8, y - h / 2, x + w / 2 - 8, y + h / 2, { width: 1.2 });
      }
    }
    multiline(s, x, y, n.lines, size);
  }
  // archi
  let lane = 0;
  p.edges.forEach((e, i) => {
    const a = nodes.get(e.from)!;
    const b = nodes.get(e.to)!;
    const label = tx(e.label, c);
    let pts: Pt[];
    let lp: Pt;
    if (back.has(i) || b.rank <= a.rank) {
      const lx = left - 12 - lane++ * 14;
      const sx = a.x - a.w / 2 - (a.kind === 'io' ? 6 : 0);
      pts = [
        [sx, a.y],
        [lx, a.y],
        [lx, b.y],
        [b.x - b.w / 2 - (b.kind === 'io' ? 6 : 0), b.y],
      ];
      lp = [sx - 14, a.y - 10];
    } else if (b.col === a.col && [...nodes.values()].some((m) => m.col === a.col && m.rank > a.rank && m.rank < b.rank)) {
      // stessa colonna ma con blocchi in mezzo: si passa nel corridoio a destra
      const lx = a.x + colW / 2 - 6;
      const yy = b.y - b.h / 2 - 14;
      pts = [
        [a.x + a.w / 2, a.y],
        [lx, a.y],
        [lx, yy],
        [b.x, yy],
        [b.x, b.y - b.h / 2],
      ];
      lp = [a.x + a.w / 2 + 12, a.y - 10];
    } else if (b.col === a.col) {
      pts = [
        [a.x, a.y + a.h / 2],
        [b.x, b.y - b.h / 2],
      ];
      lp = [a.x + 12, a.y + a.h / 2 + 10];
    } else if (b.col > a.col) {
      pts = [
        [a.x + a.w / 2, a.y],
        [b.x, a.y],
        [b.x, b.y - b.h / 2],
      ];
      lp = [a.x + a.w / 2 + 14, a.y - 10];
    } else {
      const yy = b.y - b.h / 2 - 16;
      pts = [
        [a.x, a.y + a.h / 2],
        [a.x, yy],
        [b.x, yy],
        [b.x, b.y - b.h / 2],
      ];
      lp = [a.x + 12, a.y + a.h / 2 + 10];
    }
    route(s, pts);
    if (label) s.text(lp[0], lp[1], label, { size: 11, muted: true, halo: true, anchor: 'start' });
  });
  const kindName = (k: FNode['kind']): string =>
    ({
      start: c.L('inizio', 'start'),
      end: c.L('fine', 'end'),
      process: c.L('istruzione', 'process'),
      decision: c.L('decisione', 'decision'),
      io: c.L('ingresso/uscita', 'input/output'),
      call: c.L('sottoprogramma', 'subroutine'),
    })[k];
  const steps = p.nodes.map((n) => {
    const outs = p.edges.filter((e) => e.from === n.id).map((e) => `${e.label ? `${tx(e.label, c)} → ` : '→ '}${tx(p.nodes.find((m) => m.id === e.to)!.text, c)}`);
    return `${kindName(n.kind)} «${tx(n.text, c)}»${outs.length ? ` ${outs.join(', ')}` : ''}`;
  });
  return {
    svg: s,
    title: c.L('Diagramma di flusso', 'Flowchart'),
    description: c.L(`Diagramma di flusso con ${p.nodes.length} blocchi. `, `Flowchart with ${p.nodes.length} blocks. `) + steps.join('; ') + '.',
  };
}

// ------------------------------------------------------------------ schema a blocchi
export function blockDiagram(p: P<'block-diagram'>, c: Ctx): Drawn {
  const size = 13;
  const colW = 156;
  const rowH = 96;
  const bh = 52;
  const gap = 36;
  const cols = Math.max(...p.blocks.map((b) => b.col + (b.span ?? 1)));
  const rows = Math.max(...p.blocks.map((b) => b.row)) + 1;
  const s = new Svg(20 + cols * colW, 20 + rows * rowH);
  const box = new Map(
    p.blocks.map((b) => {
      const w = (b.span ?? 1) * colW - gap;
      const x = 20 + b.col * colW;
      const y = 20 + b.row * rowH + (rowH - bh) / 2 - 10;
      return [b.id, { b, x, y, w, h: bh, cx: x + w / 2, cy: y + bh / 2 }];
    }),
  );
  for (const l of p.links) {
    const a = box.get(l.from)!;
    const b = box.get(l.to)!;
    let pts: Pt[];
    if (a.b.row === b.b.row) {
      const y = (Math.max(a.y, b.y) + Math.min(a.y + a.h, b.y + b.h)) / 2;
      pts = b.cx > a.cx ? [[a.x + a.w, y], [b.x, y]] : [[a.x, y], [b.x + b.w, y]];
    } else if (Math.abs(a.cx - b.cx) < 1 || (b.x < a.x + a.w && b.x + b.w > a.x && a.b.col === b.b.col)) {
      const x = (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) / 2;
      pts = b.cy > a.cy ? [[x, a.y + a.h], [x, b.y]] : [[x, a.y], [x, b.y + b.h]];
    } else {
      const sx = b.cx > a.cx ? a.x + a.w : a.x;
      pts = [
        [sx, a.cy],
        [b.cx, a.cy],
        [b.cx, b.cy > a.cy ? b.y : b.y + b.h],
      ];
    }
    route(s, pts, { both: !!l.both });
    const label = tx(l.label, c);
    if (label) {
      const m = pts.length === 2 ? [(pts[0]![0] + pts[1]![0]) / 2, (pts[0]![1] + pts[1]![1]) / 2] : pts[1]!;
      s.text(m[0]! + (pts.length === 2 && pts[0]![0] === pts[1]![0] ? 8 : 0), m[1]! - 10, label, { size: 11, muted: true, halo: true, anchor: pts.length === 2 && pts[0]![0] === pts[1]![0] ? 'start' : 'middle' });
    }
  }
  for (const { b, x, y, w, h, cx, cy } of box.values()) {
    s.rect(x, y, w, h, { fill: b.emphasis ? 'soft' : 'surface2', tone: b.emphasis ? 'accent' : 'ink', width: b.emphasis ? 2 : 1.5, rx: 4 });
    multiline(s, cx, cy, wrap(tx(b.text, c), size, w - 16), size);
  }
  const name = (id: string): string => tx(p.blocks.find((b) => b.id === id)!.text, c);
  return {
    svg: s,
    title: c.L('Schema a blocchi', 'Block diagram'),
    description:
      c.L(`Schema a blocchi: ${listText(p.blocks.map((b) => tx(b.text, c)), 'it')}. `, `Block diagram: ${listText(p.blocks.map((b) => tx(b.text, c)), 'en')}. `) +
      (p.links.length ? c.L('Collegamenti: ', 'Links: ') + p.links.map((l) => `${name(l.from)} ${l.both ? '↔' : '→'} ${name(l.to)}${l.label ? ` (${tx(l.label, c)})` : ''}`).join('; ') + '.' : ''),
  };
}

// --------------------------------------------------------- array, memoria, pila, coda
export function memory(p: P<'memory'>, c: Ctx): Drawn {
  const kind = p.kind;
  const horizontal = (p.orientation ?? (kind === 'array' || kind === 'queue' ? 'horizontal' : 'vertical')) === 'horizontal';
  const n = p.cells.length;
  const title = tx(p.title, c);
  const top = title ? 34 : 12;
  const cw = horizontal ? Math.max(46, ...p.cells.map((q) => textW(q.value, 13, true) + 16)) : Math.max(110, ...p.cells.map((q) => textW(q.value, 13, true) + 24));
  const ch = horizontal ? 42 : 32;
  const pointers =
    p.pointers ??
    (kind === 'stack' ? [{ label: 'top', index: n - 1 }] : kind === 'queue' ? [{ label: c.L('testa', 'front'), index: 0 }, { label: c.L('coda', 'rear'), index: n - 1 }] : []);
  const labelW = horizontal ? 0 : Math.max(0, ...p.cells.map((q, i) => textW(q.label ?? (p.indices !== false && kind !== 'stack' ? String(i) : ''), 12, true))) + 14;
  const ptrW = horizontal ? 0 : pointers.length ? Math.max(...pointers.map((q) => textW(q.label, 12, true))) + 50 : 0;
  const W = horizontal ? 30 + n * cw + 30 : 20 + labelW + cw + ptrW + 20;
  const H = horizontal ? top + 34 + ch + 34 : top + n * ch + (kind === 'stack' ? 24 : 16);
  const s = new Svg(Math.max(W, title ? textW(title, 14) + 40 : 0), H);
  if (title) s.text(s.width / 2, 16, title, { weight: 600, size: 14 });
  const cellPos = (i: number): Pt => (horizontal ? [30 + i * cw, top + 30] : [20 + labelW, top + (kind === 'stack' ? n - 1 - i : i) * ch]);
  p.cells.forEach((q, i) => {
    const [x, y] = cellPos(i);
    s.rect(x, y, cw, ch, { fill: q.highlight ? 'soft' : 'surface2', tone: q.highlight ? 'accent' : 'ink', width: q.highlight ? 2 : 1.3 });
    s.text(x + cw / 2, y + ch / 2, q.value, { mono: true, size: 13 });
    const lab = q.label ?? (p.indices !== false && kind !== 'stack' && kind !== 'queue' ? String(i) : '');
    if (lab) {
      if (horizontal) s.text(x + cw / 2, y + ch + 14, lab, { mono: true, size: 11, muted: true });
      else s.text(x - 8, y + ch / 2, lab, { mono: true, size: 11, muted: true, anchor: 'end' });
    }
  });
  if (kind === 'stack') {
    const [x] = cellPos(0);
    const yb = top + n * ch;
    s.line(x - 6, top - 6, x - 6, yb + 6, { width: 2.4 });
    s.line(x + cw + 6, top - 6, x + cw + 6, yb + 6, { width: 2.4 });
    s.line(x - 6, yb + 6, x + cw + 6, yb + 6, { width: 2.4 });
  }
  for (const ptr of pointers) {
    if (ptr.index >= n) continue;
    const [x, y] = cellPos(ptr.index);
    if (horizontal) {
      s.arrow(x + cw / 2, y - 26, x + cw / 2, y - 3, { tone: 'accent', width: 1.6 });
      s.text(x + cw / 2, y - 32, ptr.label, { mono: true, size: 12 });
    } else {
      const ax = x + cw + (kind === 'stack' ? 10 : 4);
      s.arrow(ax + 34, y + ch / 2, ax, y + ch / 2, { tone: 'accent', width: 1.6 });
      s.text(ax + 40, y + ch / 2, ptr.label, { mono: true, size: 12, anchor: 'start' });
    }
  }
  const name =
    kind === 'array' ? c.L('Array', 'Array') : kind === 'memory' ? c.L('Memoria', 'Memory') : kind === 'stack' ? c.L('Pila (stack)', 'Stack') : c.L('Coda (queue)', 'Queue');
  const cells = p.cells.map((q, i) => `${q.label ?? i}: ${q.value}${q.highlight ? c.L(' (evidenziata)', ' (highlighted)') : ''}`);
  return {
    svg: s,
    title: title || name,
    description:
      c.L(`${name} di ${n} celle${kind === 'stack' ? ' dal fondo alla cima' : ''}: `, `${name} of ${n} cells${kind === 'stack' ? ' from bottom to top' : ''}: `) +
      cells.join(', ') +
      (pointers.length ? '. ' + pointers.filter((q) => q.index < n).map((q) => c.L(`${q.label} punta alla cella ${p.cells[q.index]!.label ?? q.index}`, `${q.label} points to cell ${p.cells[q.index]!.label ?? q.index}`)).join('; ') : '') +
      '.',
  };
}

// --------------------------------------------------------------- lista concatenata
export function linkedList(p: P<'linked-list'>, c: Ctx): Drawn {
  const n = p.nodes.length;
  const vw = Math.max(44, ...p.nodes.map((q) => textW(q.value, 13, true) + 16));
  const pw = 24;
  const nodeW = vw + pw + (p.doubly ? pw : 0);
  const gap = 46;
  const h = 36;
  const nullLabel = p.nullLabel ?? 'NULL';
  const x0 = 30;
  const y = 52;
  const tailExtra = textW(nullLabel, 12, true) + 50;
  const s = new Svg(x0 + Math.max(1, n) * (nodeW + gap) + tailExtra, y + h + (p.circular || p.doubly ? 60 : 30) + (p.tail ? 20 : 0));
  const nx = (i: number): number => x0 + i * (nodeW + gap);
  p.nodes.forEach((q, i) => {
    const x = nx(i);
    let cx = x;
    if (p.doubly) {
      s.rect(cx, y, pw, h, { fill: 'surface', width: 1.3 });
      cx += pw;
    }
    s.rect(cx, y, vw, h, { fill: q.highlight ? 'soft' : 'surface2', tone: q.highlight ? 'accent' : 'ink', width: q.highlight ? 2 : 1.3 });
    s.text(cx + vw / 2, y + h / 2, q.value, { mono: true });
    s.rect(cx + vw, y, pw, h, { fill: 'surface', width: 1.3 });
    s.dot(cx + vw + pw / 2, y + h / 2, 2.6);
    const sx = cx + vw + pw / 2;
    if (i < n - 1) s.arrow(sx, y + h / 2, nx(i + 1), y + h / 2, { width: 1.5 });
    else if (p.circular) {
      s.polyline(
        [
          [sx, y + h / 2],
          [sx, y + h + 30],
          [nx(0) + 12, y + h + 30],
        ],
        { width: 1.5 },
      );
      s.arrow(nx(0) + 12, y + h + 30, nx(0) + 12, y + h + 2, { width: 1.5 });
    } else {
      s.arrow(sx, y + h / 2, sx + 36, y + h / 2, { width: 1.5 });
      s.text(sx + 40, y + h / 2, nullLabel, { mono: true, size: 12, muted: true, anchor: 'start' });
    }
    if (p.doubly && i > 0) {
      s.dot(x + pw / 2, y + h / 2, 2.6);
      s.polyline([[x + pw / 2, y + h / 2], [x + pw / 2, y + h + 14], [nx(i - 1) + nodeW - 10, y + h + 14]], { width: 1.2, tone: 'muted' });
      s.arrow(nx(i - 1) + nodeW - 10, y + h + 14, nx(i - 1) + nodeW - 10, y + h + 1, { width: 1.2, tone: 'muted' });
    }
    if (p.doubly && i === 0) s.line(x + 3, y + h - 3, x + pw - 3, y + 3, { tone: 'muted', width: 1.2 });
  });
  const head = p.head ?? 'head';
  if (n > 0) {
    s.arrow(nx(0) - 18, 14, nx(0) + 8, y - 2, { tone: 'accent', width: 1.6 });
    s.text(nx(0) - 20, 10, head, { mono: true, size: 12, anchor: 'start' });
    if (p.tail) {
      const tx2 = nx(n - 1) + nodeW / 2;
      s.arrow(tx2, s.height - 12, tx2, y + h + 2, { tone: 'accent', width: 1.6 });
      s.text(tx2 + 8, s.height - 10, p.tail, { mono: true, size: 12, anchor: 'start' });
    }
  } else {
    s.text(x0, y + h / 2, head, { mono: true, size: 12, anchor: 'start' });
    s.arrow(x0 + textW(head, 12, true) + 6, y + h / 2, x0 + textW(head, 12, true) + 44, y + h / 2, { width: 1.5 });
    s.text(x0 + textW(head, 12, true) + 50, y + h / 2, nullLabel, { mono: true, size: 12, muted: true, anchor: 'start' });
  }
  return {
    svg: s,
    title: p.doubly ? c.L('Lista doppiamente concatenata', 'Doubly linked list') : c.L('Lista concatenata', 'Linked list'),
    description:
      n === 0
        ? c.L(`Lista vuota: ${head} vale ${nullLabel}.`, `Empty list: ${head} is ${nullLabel}.`)
        : c.L(
            `${head} → ${p.nodes.map((q) => q.value).join(' → ')} → ${p.circular ? 'di nuovo il primo nodo (lista circolare)' : nullLabel}${p.doubly ? '; ogni nodo punta anche al precedente' : ''}.`,
            `${head} → ${p.nodes.map((q) => q.value).join(' → ')} → ${p.circular ? 'back to the first node (circular list)' : nullLabel}${p.doubly ? '; each node also points to the previous one' : ''}.`,
          ) + (p.nodes.some((q) => q.highlight) ? c.L(` Evidenziati: ${p.nodes.filter((q) => q.highlight).map((q) => q.value).join(', ')}.`, ` Highlighted: ${p.nodes.filter((q) => q.highlight).map((q) => q.value).join(', ')}.`) : ''),
  };
}

// ------------------------------------------------------------------------- alberi
type TNode = TreeNodeInput;
interface Laid {
  node: TNode | null;
  x: number;
  y: number;
  children: Laid[];
}

export function tree(p: P<'tree'>, c: Ctx): Drawn {
  const dx = 46;
  const dy = 66;
  let next = 0;
  let depth = 0;
  const lay = (t: TNode | null, d: number): Laid => {
    depth = Math.max(depth, d);
    const kids = t?.children ?? [];
    const real = p.binary && t && kids.length ? [kids[0] ?? null, kids[1] ?? null] : kids;
    if (!t || real.length === 0 || real.every((k) => k === null && !p.binary)) {
      const x = next++ * dx;
      return { node: t, x, y: d * dy, children: [] };
    }
    const ch = real.map((k) => lay(k, d + 1));
    return { node: t, x: (ch[0]!.x + ch[ch.length - 1]!.x) / 2, y: d * dy, children: ch };
  };
  const root = lay(p.root, 0);
  const s = new Svg(Math.max(1, next) * dx + 30, (depth + 1) * dy + 10);
  const ox = 15 + dx / 2;
  const oy = 30;
  const r = 17;
  const edges = (l: Laid): void => {
    for (const k of l.children) {
      if (k.node) s.line(ox + l.x, oy + l.y + r, ox + k.x, oy + k.y - r, { width: 1.4 });
      else s.line(ox + l.x, oy + l.y + r, ox + l.x + (k.x - l.x) * 0.45, oy + l.y + r + (k.y - l.y - r) * 0.45, { width: 1, tone: 'muted', dash: '3 3' });
      edges(k);
    }
  };
  const nodes = (l: Laid): void => {
    if (l.node) {
      s.circle(ox + l.x, oy + l.y, r, { fill: l.node.highlight ? 'soft' : 'surface2', tone: l.node.highlight ? 'accent' : 'ink', width: l.node.highlight ? 2.2 : 1.4 });
      s.text(ox + l.x, oy + l.y, l.node.value, { mono: true, size: 13 });
    }
    l.children.forEach(nodes);
  };
  edges(root);
  nodes(root);
  const describe = (t: TNode | null): string => {
    if (!t) return '∅';
    const k = t.children?.filter((x, i, a) => x !== null || p.binary || a.some(Boolean)) ?? [];
    if (!k.length || k.every((x) => x === null)) return t.value;
    return `${t.value} (${k.map(describe).join(', ')})`;
  };
  const count = (t: TNode | null): number => (t ? 1 + (t.children ?? []).reduce((a, k) => a + count(k), 0) : 0);
  return {
    svg: s,
    title: p.binary ? c.L('Albero binario', 'Binary tree') : c.L('Albero', 'Tree'),
    description: c.L(`Albero di ${count(p.root)} nodi e altezza ${depth}, in forma annidata (figli tra parentesi${p.binary ? ', ∅ = figlio assente' : ''}): `, `Tree with ${count(p.root)} nodes and height ${depth}, nested form (children in brackets${p.binary ? ', ∅ = missing child' : ''}): `) + describe(p.root) + '.',
  };
}

// ------------------------------------------------------------------ tabella di verità
export function truthTable(p: P<'truth-table'>, c: Ctx): Drawn {
  const ni = p.inputs.length;
  const rows = 2 ** ni;
  const heads = [...p.inputs, ...p.outputs.map((o) => o.label)];
  const cw = heads.map((h) => Math.max(36, textW(h, 13, true) + 18));
  const rh = 24;
  const gapX = 8;
  const W = cw.reduce((a, b) => a + b, 0) + gapX + 4;
  const s = new Svg(W, (rows + 1) * rh + 6);
  const xs: number[] = [];
  let x = 2;
  heads.forEach((_, i) => {
    if (i === ni) x += gapX;
    xs.push(x);
    x += cw[i]!;
  });
  const hl = new Set(p.highlight ?? []);
  for (let r = 0; r < rows; r++) if (hl.has(r)) s.rect(2, (r + 1) * rh + 2, W - 4, rh, { fill: 'soft', tone: 'accent', width: 0 });
  s.rect(2, 2, W - 4, rh, { fill: 'surface2', tone: 'faint', width: 0 });
  heads.forEach((h, i) => s.text(xs[i]! + cw[i]! / 2, 2 + rh / 2, h, { mono: true, weight: 600 }));
  for (let r = 0; r < rows; r++) {
    const y = (r + 1) * rh + 2 + rh / 2;
    for (let i = 0; i < ni; i++) s.text(xs[i]! + cw[i]! / 2, y, String((r >> (ni - 1 - i)) & 1), { mono: true });
    p.outputs.forEach((o, j) => {
      const v = o.values[r]!;
      s.text(xs[ni + j]! + cw[ni + j]! / 2, y, v === '-' ? '–' : String(v), { mono: true, weight: v === 1 ? 600 : 400 });
    });
  }
  s.line(2, rh + 2, W - 2, rh + 2, { width: 1.4 });
  const sepX = xs[ni]! - gapX / 2;
  s.line(sepX - 1.5, 2, sepX - 1.5, (rows + 1) * rh + 2, { width: 1 });
  s.line(sepX + 1.5, 2, sepX + 1.5, (rows + 1) * rh + 2, { width: 1 });
  s.rect(2, 2, W - 4, (rows + 1) * rh, { width: 1.2, tone: 'muted' });
  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    const ins = p.inputs.map((n, i) => `${n}=${(r >> (ni - 1 - i)) & 1}`).join(' ');
    const outs = p.outputs.map((o) => `${o.label}=${o.values[r]}`).join(' ');
    lines.push(`${ins} → ${outs}`);
  }
  return {
    svg: s,
    title: c.L('Tabella di verità', 'Truth table'),
    description: c.L(`Tabella di verità con ingressi ${p.inputs.join(', ')} e uscite ${p.outputs.map((o) => o.label).join(', ')}. `, `Truth table with inputs ${p.inputs.join(', ')} and outputs ${p.outputs.map((o) => o.label).join(', ')}. `) + lines.join('; ') + '.',
  };
}

