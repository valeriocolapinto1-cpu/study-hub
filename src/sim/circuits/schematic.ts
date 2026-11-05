/**
 * Schemi dei circuiti in SVG generati dalla netlist (la stessa usata dal risolutore).
 *
 * - Simboli IEC/europei (resistore rettangolare, induttore ad archi, generatori
 *   circolari con segni + e −, generatori pilotati a rombo, op-amp triangolare).
 * - Layout: `auto` a binari (massa in basso, generatori a sinistra, elementi in
 *   serie sul binario superiore, derivazioni verticali, retroazioni e paralleli
 *   ad archi sopra), `bridge` per i ponti, `manual` con le posizioni `at`.
 * - Fili ortogonali instradati per nodo (albero rettilineo che evita corpi,
 *   morsetti e fili degli altri nodi); pallini sulle giunzioni.
 * - Accessibile: <title>, <desc> con la descrizione testuale del circuito.
 * - Colori: solo currentColor (tema chiaro/scuro e stampa); evidenziazioni con
 *   var(--accent) e ripiego su currentColor.
 *
 * Funzione pura, senza DOM: si usa a build-time (componente Circuit.astro) e a
 * runtime (generatori di esercizi, isole).
 */
import { formatNumber, formatSI, type Lang } from '../units';
import {
  circuitOmega,
  GROUND,
  isTwoTerminal,
  normalizeNetlist,
  type Element,
  type ElementOf,
  type Netlist,
  type Placement,
} from './model';
import type { NetlistInput } from './netlist';

export interface SchematicOptions {
  lang?: Lang;
  /** Pixel per unità di griglia (default 20). */
  unit?: number;
  /** Prefisso degli id interni (title/desc), per più schemi nella stessa pagina. */
  idPrefix?: string;
  /** Titolo accessibile (default: titolo della netlist o "Schema del circuito"). */
  title?: string;
  /** Cifre significative dei valori (default 3). */
  digits?: number;
  /** Mostra i valori (default true). */
  values?: boolean;
  /** Classe CSS aggiuntiva sull'elemento <svg>. */
  className?: string;
}

export interface SchematicResult {
  /** Geometria (unità di griglia) per i test di coerenza schema ↔ netlist. */
  geometry: {
    wires: Map<string, Array<[[number, number], [number, number]]>>;
    terminals: Map<string, Array<[number, number]>>;
    drawn: string[];
  };
  svg: string;
  width: number;
  height: number;
  title: string;
  description: string;
}

type Pt = [number, number];
type Side = 'left' | 'right' | 'above' | 'below';

type Symbol =
  | 'R'
  | 'C'
  | 'L'
  | 'V'
  | 'Vac'
  | 'I'
  | 'Edep'
  | 'Gdep'
  | 'SW'
  | 'AM'
  | 'VM'
  | 'null'
  | 'nor'
  | 'port'
  | 'probe';

interface TwoPart {
  kind: 'two';
  el: Element;
  sym: Symbol;
  /** Morsetti in unità di griglia: p1 = a, p2 = b. */
  p1: Pt;
  p2: Pt;
  n1: string;
  n2: string;
  side: Side;
  name: string;
  value: string;
  vMark?: string;
  iMark?: string;
  /** Interruttore: chiuso nel disegno? */
  closed?: boolean;
}
interface OaPart {
  kind: 'oa';
  el: ElementOf<'OA'>;
  at: Pt;
  flip: boolean;
  name: string;
}
interface TpPart {
  kind: 'tp';
  el: ElementOf<'T'> | ElementOf<'P'>;
  at: Pt;
  w: number;
  name: string;
  value: string;
}
type Part = TwoPart | OaPart | TpPart;

const DEFAULT_LEN = 4;
const SHUNT_LEN = 4;
const ARC_STEP = 3;

const T = {
  it: {
    title: 'Schema del circuito',
    ground: 'massa',
    node: 'nodo',
    between: 'tra',
    and: 'e',
    R: 'resistore',
    C: 'condensatore',
    L: 'induttore',
    V: 'generatore di tensione',
    I: 'generatore di corrente',
    E: 'generatore di tensione pilotato in tensione',
    G: 'generatore di corrente pilotato in tensione',
    H: 'generatore di tensione pilotato in corrente',
    F: 'generatore di corrente pilotato in corrente',
    SW: 'interruttore',
    open: 'aperto',
    closed: 'chiuso',
    switchesAt: 'commuta a t =',
    AM: 'amperometro',
    VM: 'voltmetro',
    K: 'accoppiamento magnetico',
    T: 'trasformatore ideale',
    OA: 'amplificatore operazionale ideale',
    N: 'nullore',
    P: 'doppio bipolo',
    nullator: 'nullatore',
    norator: 'noratore',
    plusTerm: 'positivo',
    port: 'porta',
    primary: 'primario',
    secondary: 'secondario',
    input: 'ingresso',
    output: 'uscita',
    inverting: 'ingresso invertente',
    nonInverting: 'ingresso non invertente',
    controlledBy: 'pilotato da',
    currentOf: 'la corrente di',
    voltageBetween: 'la tensione tra',
    gain: 'guadagno',
    flowsTo: 'la corrente esce dal morsetto',
    matrix: 'matrice',
    pulse: 'impulso',
    probe: 'tensione indicata',
  },
  en: {
    title: 'Circuit diagram',
    ground: 'ground',
    node: 'node',
    between: 'between',
    and: 'and',
    R: 'resistor',
    C: 'capacitor',
    L: 'inductor',
    V: 'voltage source',
    I: 'current source',
    E: 'voltage-controlled voltage source',
    G: 'voltage-controlled current source',
    H: 'current-controlled voltage source',
    F: 'current-controlled current source',
    SW: 'switch',
    open: 'open',
    closed: 'closed',
    switchesAt: 'switching at t =',
    AM: 'ammeter',
    VM: 'voltmeter',
    K: 'magnetic coupling',
    T: 'ideal transformer',
    OA: 'ideal operational amplifier',
    N: 'nullor',
    P: 'two-port',
    nullator: 'nullator',
    norator: 'norator',
    plusTerm: 'positive',
    port: 'port',
    primary: 'primary',
    secondary: 'secondary',
    input: 'input',
    output: 'output',
    inverting: 'inverting input',
    nonInverting: 'non-inverting input',
    controlledBy: 'controlled by',
    currentOf: 'the current of',
    voltageBetween: 'the voltage between',
    gain: 'gain',
    flowsTo: 'current leaves terminal',
    matrix: 'matrix',
    pulse: 'pulse',
    probe: 'marked voltage',
  },
} as const;
type Dict = (typeof T)['it'] | (typeof T)['en'];

// ------------------------------------------------------------------ testo

export const escapeXml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Nome dell'elemento con pedice: "R1" → R₁ (markup "R_1"). */
export function nameMarkup(id: string): string {
  const m = /^([A-Za-z])(.+)$/.exec(id);
  if (!m) return id;
  return `${m[1]}_{${m[2]}}`;
}

/** Testo semplice da markup (per descrizioni e stime di larghezza). */
export function plainText(markup: string): string {
  return markup.replace(/_\{([^}]*)\}/g, '$1').replace(/_(\S)/g, '$1');
}

/** Larghezza stimata (px) di un testo in markup con font di `size` px. */
function textWidth(markup: string, size: number): number {
  let w = 0;
  const parts = splitMarkup(markup);
  for (const p of parts) w += p.text.length * size * (p.sub ? 0.42 : 0.56);
  return w;
}

function splitMarkup(markup: string): Array<{ text: string; sub: boolean }> {
  const out: Array<{ text: string; sub: boolean }> = [];
  const re = /_\{([^}]*)\}|_(\S)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markup))) {
    if (m.index > last) out.push({ text: markup.slice(last, m.index), sub: false });
    out.push({ text: m[1] ?? m[2] ?? '', sub: true });
    last = m.index + m[0].length;
  }
  if (last < markup.length) out.push({ text: markup.slice(last), sub: false });
  return out;
}

/** <tspan> con pedici (dy relativo, compatibile con tutti i browser). */
function tspans(markup: string): string {
  let out = '';
  let down = false;
  for (const p of splitMarkup(markup)) {
    if (p.sub && !down) {
      out += `<tspan dy="0.3em" font-size="0.72em">${escapeXml(p.text)}</tspan>`;
      down = true;
    } else if (!p.sub && down) {
      out += `<tspan dy="-0.3em">${escapeXml(p.text)}</tspan>`;
      down = false;
    } else if (p.sub) out += `<tspan font-size="0.72em">${escapeXml(p.text)}</tspan>`;
    else out += escapeXml(p.text);
  }
  return out;
}

// ------------------------------------------------------------------ valori

function fmt(x: number, unit: string, lang: Lang, digits: number): string {
  return formatSI(x, unit, { lang, digits, sep: ' ' });
}

function sourceValue(
  net: Netlist,
  e: ElementOf<'V'> | ElementOf<'I'>,
  lang: Lang,
  digits: number,
  dict: Dict,
): string {
  const u = e.type === 'V' ? 'V' : 'A';
  const w = e.wave;
  if (w) {
    switch (w.kind) {
      case 'dc':
        return fmt(w.value, u, lang, digits);
      case 'sin': {
        const ph = w.phase
          ? ` ${w.phase > 0 ? '+' : '−'} ${formatNumber(Math.abs(w.phase), digits, lang)}°`
          : '';
        const off = w.offset ? `${fmt(w.offset, '', lang, digits)} + ` : '';
        return `${off}${formatNumber(w.amp, digits, lang)} cos(ωt${ph}) ${u}`;
      }
      case 'step':
        return `${fmt(w.before, '', lang, digits)} → ${fmt(w.after, u, lang, digits)}`;
      case 'pulse':
        return `${dict.pulse} ${fmt(w.low, '', lang, digits)}…${fmt(w.high, u, lang, digits)}`;
      case 'pwl':
        return `PWL (${u})`;
    }
  }
  const parts: string[] = [];
  if (e.dc !== undefined && (e.dc !== 0 || !e.ac)) parts.push(fmt(e.dc, u, lang, digits));
  if (e.ac) {
    const ph = e.ac.phase ? `∠${formatNumber(e.ac.phase, digits, lang)}°` : '';
    parts.push(`${fmt(e.ac.mag, '', lang, digits).trim()}${ph} ${u}`);
  }
  if (parts.length === 0) parts.push(`0 ${u}`);
  void net;
  return parts.join(' + ');
}

// ------------------------------------------------------------------ layout

interface Edge {
  el: Element;
  sub?: 'null' | 'nor' | 'port' | 'probe';
  n1: string;
  n2: string;
  /** Per porte e sonde. */
  label?: string;
}

const isSourceType = (t: string): boolean => ['V', 'I', 'E', 'G', 'H', 'F'].includes(t);

function edgesOf(net: Netlist): Edge[] {
  const edges: Edge[] = [];
  for (const e of net.elements) {
    if (e.type === 'N') {
      edges.push({ el: e, sub: 'null', n1: e.na, n2: e.nb }, { el: e, sub: 'nor', n1: e.ra, n2: e.rb });
    } else if (isTwoTerminal(e)) edges.push({ el: e, n1: e.a, n2: e.b });
  }
  return edges;
}

/** Porte e sonde di tensione che non coincidono con un elemento diventano coppie di morsetti disegnate. */
function pseudoEdges(net: Netlist, vMarks: Map<string, string>): Edge[] {
  const out: Edge[] = [];
  const matchEl = (p: string, m: string): Element | undefined =>
    net.elements.find((e) => isTwoTerminal(e) && ((e.a === p && e.b === m) || (e.a === m && e.b === p)));
  for (const p of net.ports ?? []) {
    out.push({
      el: { type: 'VM', id: `port:${p.id}`, a: p.plus, b: p.minus },
      sub: 'port',
      n1: p.plus,
      n2: p.minus,
      label: p.label ?? p.id,
    });
  }
  for (const pr of net.probes ?? []) {
    if (pr.kind !== 'v') continue;
    const e = matchEl(pr.plus, pr.minus);
    if (e && isTwoTerminal(e) && e.a === pr.plus) {
      vMarks.set(e.id, pr.label);
      continue;
    }
    const port = (net.ports ?? []).find((p) => p.plus === pr.plus && p.minus === pr.minus);
    if (port) {
      vMarks.set(`port:${port.id}`, pr.label);
      continue;
    }
    out.push({
      el: { type: 'VM', id: `probe:${pr.label}`, a: pr.plus, b: pr.minus },
      sub: 'probe',
      n1: pr.plus,
      n2: pr.minus,
      label: pr.label,
    });
  }
  return out;
}

interface Labels {
  name(e: Element, sub?: Edge['sub']): string;
  value(e: Element, sub?: Edge['sub']): string;
}

function shuntSortKey(e: Edge): number {
  if (e.sub === 'port' || e.sub === 'probe') return 9;
  if (e.el.type === 'V' || e.el.type === 'I') return 0;
  if (isSourceType(e.el.type)) return 1;
  return 2;
}

/** Ingombro a destra di un elemento verticale (corpo + etichetta) in unità di griglia. */
const labelWidthU = (name: string, value: string, unit: number, sym: Symbol): number =>
  (Math.max(BODY[sym] / 2, 8) + 7 + Math.max(textWidth(name, 15), textWidth(value, 12.5))) / unit;

/** Layout automatico "a binari". */
function autoLayout(net: Netlist, labels: Labels, vMarks: Map<string, string>, unit: number): Part[] {
  const edges = [...edgesOf(net), ...pseudoEdges(net, vMarks)];
  const oas = net.elements.filter((e): e is ElementOf<'OA'> => e.type === 'OA');
  const tps = net.elements.filter(
    (e): e is ElementOf<'T'> | ElementOf<'P'> => e.type === 'T' || e.type === 'P',
  );
  const shunts = new Map<string, Edge[]>();
  const series: Edge[] = [];
  for (const e of edges) {
    const g1 = e.n1 === GROUND;
    const g2 = e.n2 === GROUND;
    if (g1 && g2) continue;
    if (g1 || g2) {
      const n = g1 ? e.n2 : e.n1;
      if (!shunts.has(n)) shunts.set(n, []);
      shunts.get(n)!.push(e);
    } else series.push(e);
  }
  for (const list of shunts.values()) list.sort((a, b) => shuntSortKey(a) - shuntSortKey(b));

  // ordine dei nodi: BFS dai generatori lungo i collegamenti in serie
  type Link =
    | { kind: 'edge'; e: Edge }
    | { kind: 'oa'; e: ElementOf<'OA'> }
    | { kind: 'tp'; e: ElementOf<'T'> | ElementOf<'P'> };
  const links: Array<{ a: string; b: string; link: Link }> = [];
  for (const e of series) links.push({ a: e.n1, b: e.n2, link: { kind: 'edge', e } });
  for (const o of oas) links.push({ a: o.minus, b: o.out, link: { kind: 'oa', e: o } });
  for (const t of tps) links.push({ a: t.p1a, b: t.p2a, link: { kind: 'tp', e: t } });
  const allNodes: string[] = [];
  const pushNode = (n: string): void => {
    if (n !== GROUND && !allNodes.includes(n)) allNodes.push(n);
  };
  for (const e of edges) {
    pushNode(e.n1);
    pushNode(e.n2);
  }
  for (const o of oas) [o.plus, o.minus, o.out].forEach(pushNode);
  for (const t of tps) [t.p1a, t.p1b, t.p2a, t.p2b].forEach(pushNode);

  let order: string[];
  if (net.layout.order && net.layout.order.length) {
    order = net.layout.order.filter((n) => allNodes.includes(n));
    for (const n of allNodes) if (!order.includes(n)) order.push(n);
  } else {
    const firstSource = [...shunts.entries()].find(([, l]) =>
      l.some((e) => e.el.type === 'V' || e.el.type === 'I'),
    );
    const start = firstSource?.[0] ?? allNodes[0];
    order = [];
    const queue = start ? [start] : [];
    const seen = new Set(queue);
    const visit = (): void => {
      while (queue.length) {
        const n = queue.shift()!;
        order.push(n);
        // vicini nell'ordine: prima i collegamenti diretti sul binario
        for (const l of links) {
          const other = l.a === n ? l.b : l.b === n ? l.a : undefined;
          if (other && other !== GROUND && !seen.has(other)) {
            seen.add(other);
            queue.push(other);
          }
        }
      }
    };
    visit();
    for (const n of allNodes)
      if (!seen.has(n)) {
        seen.add(n);
        queue.push(n);
        visit();
      }
  }

  const parts: Part[] = [];
  const xStart = new Map<string, number>();
  const xEnd = new Map<string, number>();
  const usedLinks = new Set<Link>();
  let x = 0;
  let prev: string | undefined;
  let lastLabelW = 0;
  const shuntDir = (e: Edge, n: string): { p1: Pt; p2: Pt; nTop: string } => {
    // a in alto se a è il nodo non a massa
    return e.n1 === n
      ? { p1: [0, 0], p2: [0, SHUNT_LEN], nTop: e.n1 }
      : { p1: [0, SHUNT_LEN], p2: [0, 0], nTop: e.n2 };
  };
  for (const n of order) {
    let railLink: Link | undefined;
    if (prev !== undefined) {
      // sul binario preferisce op-amp e doppi bipoli (le retroazioni vanno sopra)
      const rank = { oa: 0, tp: 1, edge: 2 } as const;
      const cand = links
        .filter((l) => !usedLinks.has(l.link) && ((l.a === prev && l.b === n) || (l.a === n && l.b === prev)))
        .sort((p, q) => rank[p.link.kind] - rank[q.link.kind])[0];
      railLink = cand?.link;
      const gapBase = Math.max(DEFAULT_LEN, Math.ceil(lastLabelW + 0.9));
      if (railLink?.kind === 'oa') {
        const o = railLink.e;
        const off = (shunts.get(prev)?.length ?? 0) > 0 ? 2 : 1;
        const x0 = xEnd.get(prev)! + off;
        parts.push({ kind: 'oa', el: o, at: [x0, 0], flip: false, name: labels.name(o) });
        // se l'uscita ha derivazioni, le sposta a destra del triangolo
        x = x0 + 5 + ((shunts.get(n)?.length ?? 0) > 0 ? 2 : 0);
      } else if (railLink?.kind === 'tp') {
        const t = railLink.e;
        const w = t.type === 'T' ? 4 : 6;
        const x0 = xEnd.get(prev)! + 2;
        // orientamento: porta 1 a sinistra se p1a è il nodo precedente
        parts.push({ kind: 'tp', el: t, at: [x0, 0], w, name: labels.name(t), value: labels.value(t) });
        x = x0 + w + 2;
      } else {
        x = xEnd.get(prev)! + gapBase;
      }
      if (railLink) usedLinks.add(railLink);
      if (railLink?.kind === 'edge') {
        const e = railLink.e;
        const xl = xEnd.get(prev)!;
        const leftIsN1 = e.n1 === prev;
        parts.push(
          twoPart(e, leftIsN1 ? [xl, 0] : [x, 0], leftIsN1 ? [x, 0] : [xl, 0], 'above', labels, vMarks, net),
        );
      }
    }
    xStart.set(n, x);
    const list = shunts.get(n) ?? [];
    let col = x;
    lastLabelW = 0;
    list.forEach((e, k) => {
      if (k > 0) col += Math.max(DEFAULT_LEN, Math.ceil(lastLabelW + 0.9));
      const d = shuntDir(e, n);
      const side: Side = (e.el.type === 'V' || e.el.type === 'I') && col === 0 ? 'left' : 'right';
      parts.push(twoPart(e, [col + d.p1[0], d.p1[1]], [col + d.p2[0], d.p2[1]], side, labels, vMarks, net));
      const nm = e.sub === 'port' || e.sub === 'probe' ? (e.label ?? '') : labels.name(e.el, e.sub);
      lastLabelW =
        side === 'right' ? labelWidthU(nm, labels.value(e.el, e.sub), unit, symbolOf(e.el, e.sub)) : 0.8;
    });
    xEnd.set(n, col);
    prev = n;
  }

  // collegamenti rimasti: archi sopra il binario
  const arcs: Array<{ l: (typeof links)[number]; xl: number; xr: number }> = [];
  for (const l of links) {
    if (usedLinks.has(l.link)) continue;
    const xa = xStart.get(l.a) ?? 0;
    const xb = xStart.get(l.b) ?? 0;
    const [left, right] = xa <= xb ? [l.a, l.b] : [l.b, l.a];
    let xl = xEnd.get(left)!;
    let xr = xStart.get(right)!;
    if (xr - xl < DEFAULT_LEN) {
      xl = Math.min(xl, xStart.get(left)!);
      xr = Math.max(xr, xEnd.get(right)!);
    }
    if (xr - xl < DEFAULT_LEN) xr = xl + DEFAULT_LEN;
    arcs.push({ l, xl, xr });
  }
  arcs.sort((p, q) => p.xr - p.xl - (q.xr - q.xl));
  const levels: Array<Array<[number, number]>> = [];
  for (const a of arcs) {
    let k = 0;
    for (; ; k++) {
      const lv = (levels[k] ??= []);
      if (!lv.some(([l, r]) => a.xl < r && a.xr > l)) {
        lv.push([a.xl, a.xr]);
        break;
      }
    }
    // gli archi sopra un op-amp salgono di un livello in più (il triangolo è alto)
    const overOa = parts.some((p) => p.kind === 'oa' && p.at[0] >= a.xl && p.at[0] <= a.xr);
    const y = -ARC_STEP * (k + 1) - (overOa ? 0 : 0);
    const link = a.l.link;
    if (link.kind === 'edge') {
      const e = link.e;
      const mid = (a.xl + a.xr) / 2;
      const len = Math.max(DEFAULT_LEN, 2 * Math.floor((a.xr - a.xl) / 4));
      const c1 = Math.round(mid - len / 2);
      const c2 = c1 + len;
      const leftNode = (xStart.get(e.n1) ?? 0) <= (xStart.get(e.n2) ?? 0) ? e.n1 : e.n2;
      const p1: Pt = leftNode === e.n1 ? [c1, y] : [c2, y];
      const p2: Pt = leftNode === e.n1 ? [c2, y] : [c1, y];
      parts.push(twoPart(e, p1, p2, 'above', labels, vMarks, net));
    } else if (link.kind === 'oa') {
      parts.push({ kind: 'oa', el: link.e, at: [a.xl + 1, y], flip: false, name: labels.name(link.e) });
    } else {
      parts.push({
        kind: 'tp',
        el: link.e,
        at: [a.xl + 1, y - 4],
        w: link.e.type === 'T' ? 4 : 6,
        name: labels.name(link.e),
        value: labels.value(link.e),
      });
    }
  }
  return parts;
}

/** Ponte: generatore a sinistra, due rami verticali, elemento di ponte orizzontale. */
function bridgeLayout(net: Netlist, labels: Labels, vMarks: Map<string, string>): Part[] | undefined {
  const edges = edgesOf(net);
  const src = edges.find(
    (e) => (e.el.type === 'V' || e.el.type === 'I') && (e.n1 === GROUND || e.n2 === GROUND),
  );
  if (!src) return undefined;
  const top = src.n1 === GROUND ? src.n2 : src.n1;
  const conn = (x: string, y: string): Edge | undefined =>
    edges.find((e) => e !== src && ((e.n1 === x && e.n2 === y) || (e.n1 === y && e.n2 === x)));
  const mids = [...new Set(edges.flatMap((e) => [e.n1, e.n2]))].filter(
    (n) => n !== top && n !== GROUND && conn(top, n) && conn(n, GROUND),
  );
  if (mids.length !== 2) return undefined;
  const [m1, m2] = mids as [string, string];
  const parts: Part[] = [];
  const H = 8;
  const L = 7;
  const R = 15;
  parts.push(
    twoPart(
      src,
      src.n1 === top ? [0, 0] : [0, H],
      src.n1 === top ? [0, H] : [0, 0],
      'left',
      labels,
      vMarks,
      net,
    ),
  );
  const vert = (e: Edge, x: number, yTopNode: string, y0: number, y1: number, side: Side): void => {
    const p1: Pt = e.n1 === yTopNode ? [x, y0] : [x, y1];
    const p2: Pt = e.n1 === yTopNode ? [x, y1] : [x, y0];
    parts.push(twoPart(e, p1, p2, side, labels, vMarks, net));
  };
  vert(conn(top, m1)!, L, top, 0, H / 2, 'left');
  vert(conn(m1, GROUND)!, L, m1, H / 2, H, 'left');
  vert(conn(top, m2)!, R, top, 0, H / 2, 'right');
  vert(conn(m2, GROUND)!, R, m2, H / 2, H, 'right');
  const used = new Set([src, conn(top, m1), conn(m1, GROUND), conn(top, m2), conn(m2, GROUND)]);
  const rest = edges.filter((e) => !used.has(e));
  const bridge = rest.filter((e) => (e.n1 === m1 && e.n2 === m2) || (e.n1 === m2 && e.n2 === m1));
  if (rest.length !== bridge.length || bridge.length > 1) return undefined;
  if (bridge[0]) {
    const e = bridge[0];
    parts.push(
      twoPart(
        e,
        e.n1 === m1 ? [L, H / 2] : [R, H / 2],
        e.n1 === m1 ? [R, H / 2] : [L, H / 2],
        'above',
        labels,
        vMarks,
        net,
      ),
    );
  }
  return parts;
}

const DIRV: Record<string, Pt> = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] };

function manualLayout(net: Netlist, labels: Labels, vMarks: Map<string, string>): Part[] {
  const parts: Part[] = [];
  const place = (e: Element, at: Placement, sub?: Edge['sub'], n1?: string, n2?: string): void => {
    const d = DIRV[at.dir ?? 'right']!;
    const len = at.len ?? DEFAULT_LEN;
    const p1: Pt = [at.x, at.y];
    const p2: Pt = [at.x + d[0] * len, at.y + d[1] * len];
    const side: Side = at.label && at.label !== 'auto' ? at.label : d[1] === 0 ? 'above' : 'right';
    parts.push(
      twoPart(
        { el: e, sub, n1: n1 ?? (e as { a: string }).a, n2: n2 ?? (e as { b: string }).b },
        p1,
        p2,
        side,
        labels,
        vMarks,
        net,
      ),
    );
  };
  for (const e of net.elements) {
    if (e.type === 'K') continue;
    if (!e.at) throw new Error(`layout manuale: manca "at" per ${e.id}`);
    if (e.type === 'OA')
      parts.push({ kind: 'oa', el: e, at: [e.at.x, e.at.y], flip: e.at.flip ?? false, name: labels.name(e) });
    else if (e.type === 'T' || e.type === 'P')
      parts.push({
        kind: 'tp',
        el: e,
        at: [e.at.x, e.at.y],
        w: e.at.len ?? (e.type === 'T' ? 4 : 6),
        name: labels.name(e),
        value: labels.value(e),
      });
    else if (e.type === 'N') {
      place(e, e.at, 'null', e.na, e.nb);
      if (!e.at2) throw new Error(`layout manuale: manca "at2" (noratore) per ${e.id}`);
      place(e, e.at2, 'nor', e.ra, e.rb);
    } else place(e, e.at);
  }
  for (const p of net.ports ?? []) {
    const at = net.nodes?.[p.plus]?.at;
    void at;
  }
  return parts;
}

function symbolOf(e: Element, sub?: Edge['sub']): Symbol {
  if (sub === 'null' || sub === 'nor' || sub === 'port' || sub === 'probe') return sub;
  switch (e.type) {
    case 'V':
      return e.ac || e.wave?.kind === 'sin' ? 'Vac' : 'V';
    case 'E':
    case 'H':
      return 'Edep';
    case 'G':
    case 'F':
      return 'Gdep';
    case 'R':
    case 'C':
    case 'L':
    case 'I':
    case 'SW':
    case 'AM':
    case 'VM':
      return e.type;
    default:
      return 'R';
  }
}

function twoPart(
  edge: Edge,
  p1: Pt,
  p2: Pt,
  side: Side,
  labels: Labels,
  vMarks: Map<string, string>,
  net: Netlist,
): TwoPart {
  const e = edge.el;
  const sym = symbolOf(e, edge.sub);
  const pseudo = edge.sub === 'port' || edge.sub === 'probe';
  const part: TwoPart = {
    kind: 'two',
    el: e,
    sym,
    p1,
    p2,
    n1: edge.n1,
    n2: edge.n2,
    side,
    name: pseudo ? (edge.label ?? '') : labels.name(e, edge.sub),
    value: pseudo ? '' : labels.value(e, edge.sub),
  };
  const vm = vMarks.get(e.id);
  if (vm) part.vMark = vm;
  if (edge.sub === 'probe') part.vMark = edge.label ?? '';
  const show = e.show;
  if (show?.v && !edge.sub) part.vMark = show.v === true ? `v_{${e.id}}` : show.v;
  if (show?.i && !edge.sub) part.iMark = show.i === true ? `i_{${e.id}}` : show.i;
  const ip = net.probes?.find((p) => p.kind === 'i' && p.element === e.id);
  if (ip && !edge.sub) part.iMark = ip.label;
  if (e.type === 'SW') part.closed = e.closed;
  return part;
}

// ------------------------------------------------------------------ instradamento dei fili

type Seg = [Pt, Pt];
const eqPt = (a: Pt, b: Pt): boolean => a[0] === b[0] && a[1] === b[1];
const key = (p: Pt): string => `${p[0]},${p[1]}`;

function onSeg(p: Pt, s: Seg, strict = false): boolean {
  const [[x1, y1], [x2, y2]] = s;
  if (x1 === x2 && p[0] === x1) {
    const lo = Math.min(y1, y2);
    const hi = Math.max(y1, y2);
    return strict ? p[1] > lo && p[1] < hi : p[1] >= lo && p[1] <= hi;
  }
  if (y1 === y2 && p[1] === y1) {
    const lo = Math.min(x1, x2);
    const hi = Math.max(x1, x2);
    return strict ? p[0] > lo && p[0] < hi : p[0] >= lo && p[0] <= hi;
  }
  return false;
}

/** Sovrapposizione collineare di lunghezza positiva. */
function overlap(a: Seg, b: Seg): boolean {
  const ha = a[0][1] === a[1][1];
  const hb = b[0][1] === b[1][1];
  if (ha !== hb) return false;
  if (ha) {
    if (a[0][1] !== b[0][1]) return false;
    const lo = Math.max(Math.min(a[0][0], a[1][0]), Math.min(b[0][0], b[1][0]));
    const hi = Math.min(Math.max(a[0][0], a[1][0]), Math.max(b[0][0], b[1][0]));
    return hi > lo;
  }
  if (a[0][0] !== b[0][0]) return false;
  const lo = Math.max(Math.min(a[0][1], a[1][1]), Math.min(b[0][1], b[1][1]));
  const hi = Math.min(Math.max(a[0][1], a[1][1]), Math.max(b[0][1], b[1][1]));
  return hi > lo;
}

/** Incrocio perpendicolare interno a entrambi. */
function cross(a: Seg, b: Seg): boolean {
  const ha = a[0][1] === a[1][1];
  const hb = b[0][1] === b[1][1];
  if (ha === hb) return false;
  const [h, v] = ha ? [a, b] : [b, a];
  const y = h[0][1];
  const x = v[0][0];
  const hx1 = Math.min(h[0][0], h[1][0]);
  const hx2 = Math.max(h[0][0], h[1][0]);
  const vy1 = Math.min(v[0][1], v[1][1]);
  const vy2 = Math.max(v[0][1], v[1][1]);
  return x > hx1 && x < hx2 && y > vy1 && y < vy2;
}

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
function segHitsBox(s: Seg, b: Box): boolean {
  const x1 = Math.min(s[0][0], s[1][0]);
  const x2 = Math.max(s[0][0], s[1][0]);
  const y1 = Math.min(s[0][1], s[1][1]);
  const y2 = Math.max(s[0][1], s[1][1]);
  return x2 > b.x1 && x1 < b.x2 && y2 > b.y1 && y1 < b.y2;
}

interface Obstacles {
  /** Segmenti occupati da corpi di elementi (non attraversabili). */
  bodies: Seg[];
  boxes: Box[];
  /** Fili già instradati per nodo. */
  wires: Map<string, Seg[]>;
  /** Morsetti per nodo. */
  terms: Map<string, Pt[]>;
}

function pathCost(path: Seg[], node: string, ob: Obstacles): number {
  let c = 0;
  for (const s of path) {
    c += Math.abs(s[1][0] - s[0][0]) + Math.abs(s[1][1] - s[0][1]);
    for (const b of ob.bodies) if (overlap(s, b) || cross(s, b)) c += 1000;
    for (const bx of ob.boxes) if (segHitsBox(s, bx)) c += 400;
    for (const [n, segs] of ob.wires) {
      if (n === node) continue;
      for (const w of segs) {
        if (overlap(s, w)) c += 1000;
        else if (cross(s, w)) c += 25;
        else if (onSeg(s[0], w) || onSeg(s[1], w) || onSeg(w[0], s) || onSeg(w[1], s)) c += 1000;
      }
    }
    for (const [n, pts] of ob.terms) {
      if (n === node) continue;
      for (const p of pts) if (onSeg(p, s)) c += 1000;
    }
  }
  return c + 3 * (path.length - 1);
}

function candidatePaths(p: Pt, q: Pt): Seg[][] {
  if (eqPt(p, q)) return [[]];
  if (p[0] === q[0] || p[1] === q[1]) return [[[p, q]]];
  const c1: Pt = [q[0], p[1]];
  const c2: Pt = [p[0], q[1]];
  const out: Seg[][] = [
    [
      [p, c1],
      [c1, q],
    ],
    [
      [p, c2],
      [c2, q],
    ],
  ];
  // percorsi a Z con il tratto intermedio a metà o spostato di un'unità
  const mx = Math.round((p[0] + q[0]) / 2);
  const my = Math.round((p[1] + q[1]) / 2);
  for (const x of new Set([mx, p[0] + Math.sign(q[0] - p[0]), q[0] - Math.sign(q[0] - p[0])])) {
    if (x !== p[0] && x !== q[0])
      out.push([
        [p, [x, p[1]]],
        [
          [x, p[1]],
          [x, q[1]],
        ],
        [[x, q[1]], q],
      ]);
  }
  for (const y of new Set([my, p[1] + Math.sign(q[1] - p[1]), q[1] - Math.sign(q[1] - p[1])])) {
    if (y !== p[1] && y !== q[1])
      out.push([
        [p, [p[0], y]],
        [
          [p[0], y],
          [q[0], y],
        ],
        [[q[0], y], q],
      ]);
  }
  // giri esterni (sopra/sotto, a sinistra/destra) per aggirare ostacoli
  for (const dy of [-1, 1]) {
    const y = dy < 0 ? Math.min(p[1], q[1]) - 1 : Math.max(p[1], q[1]) + 1;
    out.push([
      [p, [p[0], y]],
      [
        [p[0], y],
        [q[0], y],
      ],
      [[q[0], y], q],
    ]);
  }
  for (const dx of [-1, 1]) {
    const x = dx < 0 ? Math.min(p[0], q[0]) - 1 : Math.max(p[0], q[0]) + 1;
    out.push([
      [p, [x, p[1]]],
      [
        [x, p[1]],
        [x, q[1]],
      ],
      [[x, q[1]], q],
    ]);
  }
  return out.map((path) => path.filter((s) => !eqPt(s[0], s[1])));
}

/** Albero rettilineo che collega i morsetti di un nodo (Prim con percorsi a L/Z). */
function routeNode(node: string, pts: Pt[], ob: Obstacles): Seg[] {
  const uniq: Pt[] = [];
  for (const p of pts) if (!uniq.some((q) => eqPt(p, q))) uniq.push(p);
  if (uniq.length < 2) return [];
  // parte dal morsetto più in alto a sinistra
  uniq.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const tree: Seg[] = [];
  const treePts: Pt[] = [uniq[0]!];
  const rest = uniq.slice(1);
  while (rest.length) {
    let best: { cost: number; idx: number; path: Seg[] } | undefined;
    rest.forEach((p, idx) => {
      const attach: Pt[] = [...treePts];
      for (const s of tree) {
        const foot: Pt = s[0][0] === s[1][0] ? [s[0][0], p[1]] : [p[0], s[0][1]];
        if (onSeg(foot, s)) attach.push(foot);
      }
      for (const q of attach) {
        for (const path of candidatePaths(p, q)) {
          const cost = pathCost(path, node, { ...ob, wires: new Map([...ob.wires, [node, tree]]) });
          if (!best || cost < best.cost) best = { cost, idx, path };
        }
      }
    });
    const b = best!;
    const p = rest.splice(b.idx, 1)[0]!;
    tree.push(...b.path);
    treePts.push(p);
    for (const s of b.path) treePts.push(s[0], s[1]);
  }
  return mergeSegs(tree);
}

/** Fonde segmenti collineari contigui. */
function mergeSegs(segs: Seg[]): Seg[] {
  const out: Seg[] = segs.map((s) => {
    const [a, b] = s;
    return (a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) ? [a, b] : [b, a]) as Seg;
  });
  let changed = true;
  while (changed) {
    changed = false;
    outer: for (let i = 0; i < out.length; i++)
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i]!;
        const b = out[j]!;
        if (
          overlap(a, b) ||
          ((a[0][1] === a[1][1]) === (b[0][1] === b[1][1]) &&
            (eqPt(a[1], b[0]) || eqPt(b[1], a[0]) || eqPt(a[0], b[0]) || eqPt(a[1], b[1])) &&
            collinear(a, b))
        ) {
          const xs = [a[0], a[1], b[0], b[1]].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
          out[i] = [xs[0]!, xs[3]!];
          out.splice(j, 1);
          changed = true;
          break outer;
        }
      }
  }
  return out;
}
function collinear(a: Seg, b: Seg): boolean {
  if (a[0][1] === a[1][1] && b[0][1] === b[1][1]) return a[0][1] === b[0][1];
  if (a[0][0] === a[1][0] && b[0][0] === b[1][0]) return a[0][0] === b[0][0];
  return false;
}

// ------------------------------------------------------------------ disegno

interface Ctx {
  U: number;
  out: string[];
  /** Riquadri occupati (px) per il calcolo del viewBox. */
  bbox: Box;
  dict: Dict;
}

const grow = (c: Ctx, x1: number, y1: number, x2: number, y2: number): void => {
  c.bbox.x1 = Math.min(c.bbox.x1, x1, x2);
  c.bbox.y1 = Math.min(c.bbox.y1, y1, y2);
  c.bbox.x2 = Math.max(c.bbox.x2, x1, x2);
  c.bbox.y2 = Math.max(c.bbox.y2, y1, y2);
};
const n2 = (v: number): string => (Math.round(v * 100) / 100).toString();

function text(
  c: Ctx,
  x: number,
  y: number,
  markup: string,
  opts: { anchor?: 'start' | 'middle' | 'end'; size?: number; cls: string },
): void {
  const size = opts.size ?? 13;
  const anchor = opts.anchor ?? 'middle';
  const w = textWidth(markup, size);
  const x1 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2;
  grow(c, x1, y - size * 0.85, x1 + w, y + size * 0.35);
  const hl = opts.cls.includes('sch-hl');
  const serif = opts.cls.includes('sch-name');
  const style = `${serif ? 'font-family:var(--font-serif,Georgia,serif);font-style:italic' : 'font-family:var(--font-sans,system-ui,sans-serif)'}${hl ? ';fill:var(--accent,currentColor)' : ''}`;
  c.out.push(
    `<text class="${opts.cls}" x="${n2(x)}" y="${n2(y)}" text-anchor="${anchor}" font-size="${size}" fill="currentColor" stroke="none" style="${style}">${tspans(markup)}</text>`,
  );
}

function line(c: Ctx, pts: Array<[number, number]>, extra = ''): void {
  for (const [x, y] of pts) grow(c, x, y, x, y);
  c.out.push(`<polyline points="${pts.map(([x, y]) => `${n2(x)},${n2(y)}`).join(' ')}"${extra}/>`);
}

/** Segni + e − in coordinate dello schermo (sempre dritti, anche su elementi ruotati). */
function plus(c: Ctx, x: number, y: number, s = 4): void {
  line(c, [
    [x - s, y],
    [x + s, y],
  ]);
  line(c, [
    [x, y - s],
    [x, y + s],
  ]);
}
function minus(c: Ctx, x: number, y: number, s = 4): void {
  line(c, [
    [x - s, y],
    [x + s, y],
  ]);
}

/** Corpo del simbolo (lunghezza lungo l'asse) in pixel, per accorciare i reofori. */
const BODY: Record<Symbol, number> = {
  R: 36,
  C: 10,
  L: 40,
  V: 30,
  Vac: 30,
  I: 30,
  Edep: 32,
  Gdep: 32,
  SW: 30,
  AM: 26,
  VM: 26,
  null: 28,
  nor: 30,
  port: 0,
  probe: 0,
};

function drawTwo(c: Ctx, p: TwoPart): void {
  const { U } = c;
  const [ax, ay] = [p.p1[0] * U, p.p1[1] * U];
  const [bx, by] = [p.p2[0] * U, p.p2[1] * U];
  const len = Math.hypot(bx - ax, by - ay);
  const ux = (bx - ax) / len;
  const uy = (by - ay) / len;
  // normale "a sinistra" dell'asse
  const nx = uy;
  const ny = -ux;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const half = BODY[p.sym] / 2;
  const P = (s: number, t = 0): [number, number] => [mx + ux * s + nx * t, my + uy * s + ny * t];
  const g: string[] = [];
  c.out.push(
    `<g class="sch-el" data-id="${escapeXml(p.el.id)}"${p.sym === 'port' || p.sym === 'probe' ? ` data-kind="${p.sym}"` : ''}>`,
  );
  if (p.sym !== 'port' && p.sym !== 'probe') {
    line(c, [[ax, ay], P(-half)]);
    line(c, [P(half), [bx, by]]);
  }
  const ang = (Math.atan2(uy, ux) * 180) / Math.PI;
  const local = (body: string): void => {
    c.out.push(`<g transform="translate(${n2(mx)},${n2(my)}) rotate(${n2(ang)})">${body}</g>`);
    grow(c, mx - 20, my - 20, mx + 20, my + 20);
  };
  switch (p.sym) {
    case 'R':
      local(`<rect x="-18" y="-7" width="36" height="14"/>`);
      break;
    case 'C':
      local(`<line x1="-5" y1="-13" x2="-5" y2="13"/><line x1="5" y1="-13" x2="5" y2="13"/>`);
      break;
    case 'L':
      local(`<path d="M-20 0 a5 5 0 0 1 10 0 a5 5 0 0 1 10 0 a5 5 0 0 1 10 0 a5 5 0 0 1 10 0"/>`);
      break;
    case 'V':
    case 'Vac':
    case 'I':
    case 'AM':
    case 'VM': {
      const r = BODY[p.sym] / 2;
      c.out.push(`<circle cx="${n2(mx)}" cy="${n2(my)}" r="${r}"/>`);
      grow(c, mx - r, my - r, mx + r, my + r);
      if (p.sym === 'V') {
        const [px, py] = P(-7);
        const [qx, qy] = P(7);
        plus(c, px, py, 3.5);
        minus(c, qx, qy, 3.5);
      } else if (p.sym === 'Vac') {
        c.out.push(`<path d="M${n2(mx - 9)} ${n2(my)} q4.5 -9 9 0 t9 0"/>`);
        const [px, py] = P(-half - 7, 9);
        plus(c, px, py, 3);
      } else if (p.sym === 'I') {
        local(`<line x1="-9" y1="0" x2="9" y2="0"/><polyline points="3,-5 9,0 3,5"/>`);
      } else {
        c.out.push(
          `<text class="sch-sym" fill="currentColor" stroke="none" style="font-family:var(--font-sans,system-ui,sans-serif)" x="${n2(mx)}" y="${n2(my + 5)}" text-anchor="middle" font-size="14">${p.sym === 'AM' ? 'A' : 'V'}</text>`,
        );
      }
      break;
    }
    case 'Edep':
    case 'Gdep': {
      local(`<polygon points="-16,0 0,-16 16,0 0,16"/>`);
      if (p.sym === 'Edep') {
        const [px, py] = P(-7);
        const [qx, qy] = P(7);
        plus(c, px, py, 3);
        minus(c, qx, qy, 3);
      } else local(`<line x1="-8" y1="0" x2="8" y2="0"/><polyline points="3,-4 8,0 3,4"/>`);
      break;
    }
    case 'SW': {
      const closed = p.closed ?? false;
      local(
        `<circle cx="-13" cy="0" r="2.5" class="sch-fill" fill="currentColor" stroke="none"/><circle cx="13" cy="0" r="2.5" class="sch-fill" fill="currentColor" stroke="none"/>` +
          (closed ? `<line x1="-13" y1="0" x2="12" y2="-3"/>` : `<line x1="-13" y1="0" x2="10" y2="-13"/>`),
      );
      const e = p.el as ElementOf<'SW'>;
      if (e.toggleAt !== undefined) {
        // freccia curva che indica il verso della commutazione
        local(
          closed
            ? `<path d="M2 -14 q8 -2 9 -10" class="sch-thin" stroke-width="1.2"/><polyline points="7,-23 11,-24 12,-20" class="sch-thin" stroke-width="1.2"/>`
            : `<path d="M14 -14 q-1 7 -3 9" class="sch-thin" stroke-width="1.2"/><polyline points="9,-9 11,-5 14,-8" class="sch-thin" stroke-width="1.2"/>`,
        );
      }
      break;
    }
    case 'null':
      local(`<ellipse cx="0" cy="0" rx="14" ry="8"/>`);
      break;
    case 'nor':
      local(`<circle cx="-7.5" cy="0" r="7.5"/><circle cx="7.5" cy="0" r="7.5"/>`);
      break;
    case 'port':
    case 'probe':
      break;
  }
  if (p.sym === 'port') {
    c.out.push(
      `<circle class="sch-open" style="fill:var(--bg,#fff)" cx="${n2(ax)}" cy="${n2(ay)}" r="3.5"/><circle class="sch-open" style="fill:var(--bg,#fff)" cx="${n2(bx)}" cy="${n2(by)}" r="3.5"/>`,
    );
  }
  void g;
  // etichette
  const vertical = Math.abs(uy) > Math.abs(ux);
  const swAt =
    p.el.type === 'SW' && p.el.toggleAt !== undefined ? `t = ${formatNumber(p.el.toggleAt, 3, 'it')}` : '';
  if (p.sym === 'port' || p.sym === 'probe') {
    const [px, py] = P(-U * 0.9 * Math.sign(len));
    const [qx, qy] = P(U * 0.9);
    const lx = vertical ? mx + (p.side === 'left' ? -6 : 6) : mx;
    if (vertical) {
      plus(c, lx, py, 3.5);
      minus(c, lx, qy, 3.5);
      text(c, lx + (p.side === 'left' ? -6 : 8), my + 5, p.vMark ?? p.name, {
        anchor: p.side === 'left' ? 'end' : 'start',
        size: 15,
        cls: 'sch-name sch-hl',
      });
    } else {
      plus(c, px, my - 8, 3.5);
      minus(c, qx, my - 8, 3.5);
      text(c, mx, my - 12, p.vMark ?? p.name, { size: 15, cls: 'sch-name sch-hl' });
    }
    if (p.sym === 'port' && p.vMark && p.name)
      text(c, bx + 8, by + 5, p.name, { anchor: 'start', size: 13, cls: 'sch-val' });
    c.out.push('</g>');
    return;
  }
  const value = p.value + (swAt ? (p.value ? ', ' : '') + swAt : '');
  const off = Math.max(BODY[p.sym] / 2, 8) + 7;
  if (vertical) {
    const right = p.side !== 'left';
    const x = mx + (right ? off : -off);
    const anchor = right ? 'start' : 'end';
    if (value) {
      text(c, x, my - 2, p.name, { anchor, size: 15, cls: 'sch-name' });
      text(c, x, my + 14, value, { anchor, size: 12.5, cls: 'sch-val' });
    } else text(c, x, my + 5, p.name, { anchor, size: 15, cls: 'sch-name' });
  } else {
    const above = p.side !== 'below';
    const label = value ? `${p.name}  ${value}` : p.name;
    // nome in corsivo e valore in tondo sulla stessa riga
    const y = above ? my - off - 1 : my + off + 12;
    const wN = textWidth(p.name, 15);
    const wV = value ? textWidth(value, 12.5) + 6 : 0;
    const x0 = mx - (wN + wV) / 2;
    text(c, x0, y, p.name, { anchor: 'start', size: 15, cls: 'sch-name' });
    if (value) text(c, x0 + wN + 6, y, value, { anchor: 'start', size: 12.5, cls: 'sch-val' });
    void label;
  }
  // tensione: + vicino ad a, − vicino a b, sul lato opposto all'etichetta
  if (p.vMark) {
    const sgn = vertical ? (p.side === 'left' ? 1 : -1) : p.side === 'below' ? -1 : 1;
    // lato opposto: per verticali con etichetta a destra, segni a sinistra
    const t = vertical ? -sgn * 0 : 0;
    void t;
    const d = Math.max(BODY[p.sym] / 2, 8) + 9;
    if (vertical) {
      const x = mx + (p.side === 'left' ? d : -d);
      const [, y1] = P(-half - 2);
      const [, y2] = P(half + 2);
      plus(c, x, Math.min(y1, y2) === y1 ? y1 : y1, 3.5);
      minus(c, x, y2, 3.5);
      text(c, x + (p.side === 'left' ? 7 : -7), my + 5, p.vMark, {
        anchor: p.side === 'left' ? 'start' : 'end',
        size: 14,
        cls: 'sch-name sch-hl',
      });
    } else {
      const y = my + (p.side === 'below' ? -d : d);
      const [x1] = P(-half - 2);
      const [x2] = P(half + 2);
      plus(c, x1, y, 3.5);
      minus(c, x2, y, 3.5);
      text(c, mx, y + 5, p.vMark, { size: 14, cls: 'sch-name sch-hl' });
    }
    void sgn;
  }
  // corrente: freccia sul reoforo dal lato di a, diretta verso il corpo (a → b)
  if (p.iMark) {
    const leadLen = len / 2 - half;
    const s0 = -half - Math.min(leadLen * 0.5, 16);
    const [tx, ty] = P(s0 + 4);
    const [sx, sy] = P(s0 - 4);
    const [l1x, l1y] = [tx - ux * 7 + nx * 4, ty - uy * 7 + ny * 4];
    const [l2x, l2y] = [tx - ux * 7 - nx * 4, ty - uy * 7 - ny * 4];
    c.out.push(
      `<polygon class="sch-arrow" stroke="none" style="fill:var(--accent,currentColor)" points="${n2(tx)},${n2(ty)} ${n2(l1x)},${n2(l1y)} ${n2(l2x)},${n2(l2y)}"/>`,
    );
    void sx;
    void sy;
    const [lx, ly] = P(s0, vertical ? 0 : 10);
    if (vertical)
      text(c, lx + (p.side === 'left' ? 8 : -8), ly + 4, p.iMark, {
        anchor: p.side === 'left' ? 'start' : 'end',
        size: 14,
        cls: 'sch-name sch-hl',
      });
    else text(c, lx, ly - 2, p.iMark, { size: 14, cls: 'sch-name sch-hl' });
  }
  c.out.push('</g>');
}

/** Morsetti in griglia di un op-amp (ingressi a sinistra, uscita a destra). */
function oaTerms(p: OaPart): { minus: Pt; plus: Pt; out: Pt } {
  const [x, y] = p.at;
  return p.flip
    ? { plus: [x, y - 1], minus: [x, y + 1], out: [x + 5, y] }
    : { minus: [x, y - 1], plus: [x, y + 1], out: [x + 5, y] };
}

function drawOa(c: Ctx, p: OaPart): void {
  const { U } = c;
  const t = oaTerms(p);
  const [x, y] = [p.at[0] * U, p.at[1] * U];
  c.out.push(`<g class="sch-el" data-id="${escapeXml(p.el.id)}">`);
  line(c, [
    [x + U, y - 2.2 * U],
    [x + U, y + 2.2 * U],
    [x + 4.2 * U, y],
    [x + U, y - 2.2 * U],
  ]);
  line(c, [
    [t.minus[0] * U, t.minus[1] * U],
    [x + U, t.minus[1] * U],
  ]);
  line(c, [
    [t.plus[0] * U, t.plus[1] * U],
    [x + U, t.plus[1] * U],
  ]);
  line(c, [
    [x + 4.2 * U, y],
    [t.out[0] * U, t.out[1] * U],
  ]);
  minus(c, x + U + 8, t.minus[1] * U, 4);
  plus(c, x + U + 8, t.plus[1] * U, 4);
  if (p.el.gain === undefined) text(c, x + 2.1 * U, y + 5, '∞', { size: 14, cls: 'sch-val' });
  text(c, x + 2.9 * U, y - 1.4 * U, p.name, { anchor: 'start', size: 15, cls: 'sch-name' });
  c.out.push('</g>');
}

function tpTerms(p: TpPart): { p1a: Pt; p1b: Pt; p2a: Pt; p2b: Pt } {
  const [x, y] = p.at;
  return { p1a: [x, y], p1b: [x, y + 4], p2a: [x + p.w, y], p2b: [x + p.w, y + 4] };
}

function drawTp(c: Ctx, p: TpPart): void {
  const { U } = c;
  const t = tpTerms(p);
  const [x, y] = [p.at[0] * U, p.at[1] * U];
  const W = p.w * U;
  c.out.push(`<g class="sch-el" data-id="${escapeXml(p.el.id)}">`);
  if (p.el.type === 'P') {
    line(c, [
      [x, y],
      [x + U, y],
    ]);
    line(c, [
      [x, y + 4 * U],
      [x + U, y + 4 * U],
    ]);
    line(c, [
      [x + W - U, y],
      [x + W, y],
    ]);
    line(c, [
      [x + W - U, y + 4 * U],
      [x + W, y + 4 * U],
    ]);
    c.out.push(`<rect x="${x + U}" y="${y - 0.5 * U}" width="${W - 2 * U}" height="${5 * U}" rx="3"/>`);
    grow(c, x, y - 0.5 * U, x + W, y + 4.5 * U);
    text(c, x + W / 2, y + 2 * U - 2, p.name, { size: 15, cls: 'sch-name' });
    text(c, x + W / 2, y + 2 * U + 16, p.value, { size: 12.5, cls: 'sch-val' });
  } else {
    const lx = x + 1.3 * U;
    const rx = x + W - 1.3 * U;
    const c0 = y + 0.8 * U;
    line(c, [
      [x, y],
      [lx, y],
      [lx, c0],
    ]);
    line(c, [
      [lx, c0 + 2.4 * U],
      [lx, y + 4 * U],
      [x, y + 4 * U],
    ]);
    line(c, [
      [x + W, y],
      [rx, y],
      [rx, c0],
    ]);
    line(c, [
      [rx, c0 + 2.4 * U],
      [rx, y + 4 * U],
      [x + W, y + 4 * U],
    ]);
    const arcs = (dir: 1 | 0): string => Array.from({ length: 4 }, () => `a6 6 0 0 ${dir} 0 12`).join(' ');
    c.out.push(`<path d="M${n2(lx)} ${n2(c0)} ${arcs(1)}"/><path d="M${n2(rx)} ${n2(c0)} ${arcs(0)}"/>`);
    const cx = x + W / 2;
    line(c, [
      [cx - 3, c0 - 4],
      [cx - 3, c0 + 2.4 * U + 4],
    ]);
    line(c, [
      [cx + 3, c0 - 4],
      [cx + 3, c0 + 2.4 * U + 4],
    ]);
    c.out.push(
      `<circle class="sch-fill" fill="currentColor" stroke="none" cx="${n2(lx + 10)}" cy="${n2(c0 - 2)}" r="2.6"/><circle class="sch-fill" fill="currentColor" stroke="none" cx="${n2(rx - 10)}" cy="${n2(c0 - 2)}" r="2.6"/>`,
    );
    text(c, cx, y - 8, `${p.name}  ${p.value}`, { size: 13, cls: 'sch-val' });
  }
  c.out.push('</g>');
  void t;
}

function drawGround(c: Ctx, x: number, y: number): void {
  line(c, [
    [x, y],
    [x, y + 8],
  ]);
  line(c, [
    [x - 11, y + 8],
    [x + 11, y + 8],
  ]);
  line(c, [
    [x - 7, y + 12.5],
    [x + 7, y + 12.5],
  ]);
  line(c, [
    [x - 3, y + 17],
    [x + 3, y + 17],
  ]);
}

// ------------------------------------------------------------------ API

function termPoints(part: Part): Array<{ node: string; p: Pt }> {
  if (part.kind === 'two') {
    return [
      { node: part.n1, p: part.p1 },
      { node: part.n2, p: part.p2 },
    ];
  }
  if (part.kind === 'oa') {
    const t = oaTerms(part);
    return [
      { node: part.el.minus, p: t.minus },
      { node: part.el.plus, p: t.plus },
      { node: part.el.out, p: t.out },
    ];
  }
  const t = tpTerms(part);
  return [
    { node: part.el.p1a, p: t.p1a },
    { node: part.el.p1b, p: t.p1b },
    { node: part.el.p2a, p: t.p2a },
    { node: part.el.p2b, p: t.p2b },
  ];
}

function obstaclesOf(part: Part): { bodies: Seg[]; boxes: Box[] } {
  if (part.kind === 'two') {
    if (part.sym === 'port' || part.sym === 'probe') return { bodies: [[part.p1, part.p2]], boxes: [] };
    const [x1, y1] = part.p1;
    const [x2, y2] = part.p2;
    const box: Box =
      x1 === x2
        ? { x1: x1 - 0.8, x2: x1 + 0.8, y1: Math.min(y1, y2) + 0.5, y2: Math.max(y1, y2) - 0.5 }
        : { y1: y1 - 0.8, y2: y1 + 0.8, x1: Math.min(x1, x2) + 0.5, x2: Math.max(x1, x2) - 0.5 };
    return { bodies: [[part.p1, part.p2]], boxes: [box] };
  }
  if (part.kind === 'oa') {
    const [x, y] = part.at;
    return { bodies: [], boxes: [{ x1: x + 0.5, x2: x + 4.5, y1: y - 2.3, y2: y + 2.3 }] };
  }
  const [x, y] = part.at;
  return { bodies: [], boxes: [{ x1: x + 0.5, x2: x + part.w - 0.5, y1: y - 0.6, y2: y + 4.6 }] };
}

function makeLabels(
  net: Netlist,
  lang: Lang,
  digits: number,
  showValues: boolean,
  dict: Dict,
): { labels: Labels; vMarks: Map<string, string>; iMarks: Map<string, string> } {
  const vMarks = new Map<string, string>();
  const iMarks = new Map<string, string>();
  const byId = new Map(net.elements.map((e) => [e.id, e] as const));
  const ctrlV = (cp: string, cn: string): string => {
    const e = net.elements.find(
      (q) => isTwoTerminal(q) && q.a === cp && q.b === cn && q.type !== 'E' && q.type !== 'G',
    );
    const pr = net.probes?.find((p) => p.kind === 'v' && p.plus === cp && p.minus === cn);
    if (pr) return pr.label;
    if (e) {
      const lbl = e.show?.v && typeof e.show.v === 'string' ? e.show.v : `v_{${e.id}}`;
      vMarks.set(e.id, lbl);
      return lbl;
    }
    return `v_{${cp}${cn === GROUND ? '' : cn}}`;
  };
  const ctrlI = (id: string): string => {
    const e = byId.get(id);
    const pr = net.probes?.find((p) => p.kind === 'i' && p.element === id);
    if (pr) return pr.label;
    const lbl = e?.show?.i && typeof e.show.i === 'string' ? e.show.i : `i_{${id}}`;
    iMarks.set(id, lbl);
    return lbl;
  };
  const labels: Labels = {
    name: (e, sub) => (sub === 'nor' ? '' : nameMarkup(e.id)),
    value(e, sub) {
      if (!showValues && !['E', 'G', 'H', 'F'].includes(e.type)) return e.label ?? '';
      if (e.label) return e.label;
      const f = (x: number, u: string): string => fmt(x, u, lang, digits);
      switch (e.type) {
        case 'R':
          return f(e.value, 'Ω');
        case 'C':
          return f(e.value, 'F');
        case 'L':
          return f(e.value, 'H');
        case 'V':
        case 'I':
          return sourceValue(net, e, lang, digits, dict);
        case 'E':
          return `${formatNumber(e.gain, digits, lang)}·${ctrlV(e.cp, e.cn)}`;
        case 'G':
          return `${f(e.gain, 'S')}·${ctrlV(e.cp, e.cn)}`;
        case 'H':
          return `${f(e.gain, 'Ω')}·${ctrlI(e.ctrl)}`;
        case 'F':
          return `${formatNumber(e.gain, digits, lang)}·${ctrlI(e.ctrl)}`;
        case 'T':
          return `${formatNumber(e.n, digits, lang)} : 1`;
        case 'P':
          return `[${e.kind}]`;
        case 'N':
          return sub === 'null' ? '' : '';
        default:
          return '';
      }
    },
  };
  return { labels, vMarks, iMarks };
}

/** Descrizione testuale del circuito (per i lettori di schermo), dalla stessa netlist. */
export function describeCircuit(input: NetlistInput | Netlist, lang: Lang = 'it', digits = 3): string {
  const net = normalizeNetlist(input);
  const d = T[lang];
  const node = (n: string): string => (n === GROUND ? d.ground : `${d.node} ${net.nodes?.[n]?.label ?? n}`);
  const { labels } = makeLabels(net, lang, digits, true, d);
  const val = (e: Element): string => plainText(labels.value(e)).replace(/\s+/g, ' ').trim();
  const name = (e: Element): string => plainText(nameMarkup(e.id));
  const items = net.elements.map((e) => {
    const nm = name(e);
    switch (e.type) {
      case 'R':
      case 'C':
      case 'L':
      case 'AM':
      case 'VM':
        return `${d[e.type]} ${nm}${val(e) ? ` (${val(e)})` : ''} ${d.between} ${node(e.a)} ${d.and} ${node(e.b)}`;
      case 'V':
      case 'E':
      case 'H':
        return `${d[e.type]} ${nm} (${val(e)}) ${d.between} ${node(e.a)} (+) ${d.and} ${node(e.b)} (−)`;
      case 'I':
      case 'G':
      case 'F':
        return `${d[e.type]} ${nm} (${val(e)}) ${d.between} ${node(e.a)} ${d.and} ${node(e.b)}, ${d.flowsTo} ${node(e.b)}`;
      case 'SW':
        return `${d.SW} ${nm} ${d.between} ${node(e.a)} ${d.and} ${node(e.b)}, ${e.closed ? d.closed : d.open}${e.toggleAt !== undefined ? `, ${d.switchesAt} ${formatNumber(e.toggleAt, digits, lang)} s` : ''}`;
      case 'K':
        return `${d.K} ${nm} ${d.between} ${name(net.elements.find((q) => q.id === e.l1)!)} ${d.and} ${name(net.elements.find((q) => q.id === e.l2)!)} (${e.k !== undefined ? `k = ${formatNumber(e.k, digits, lang)}` : `M = ${fmt(e.m!, 'H', lang, digits)}`})`;
      case 'T':
        return `${d.T} ${nm} ${formatNumber(e.n, digits, lang)} : 1, ${d.primary} ${d.between} ${node(e.p1a)} ${d.and} ${node(e.p1b)}, ${d.secondary} ${d.between} ${node(e.p2a)} ${d.and} ${node(e.p2b)}`;
      case 'OA':
        return `${d.OA} ${nm}: ${d.inverting} ${node(e.minus)}, ${d.nonInverting} ${node(e.plus)}, ${d.output} ${node(e.out)}`;
      case 'N':
        return `${d.N} ${nm}: ${d.nullator} ${d.between} ${node(e.na)} ${d.and} ${node(e.nb)}, ${d.norator} ${d.between} ${node(e.ra)} ${d.and} ${node(e.rb)}`;
      case 'P':
        return `${d.P} ${nm} (${d.matrix} ${e.kind} = [${e.m.map((r) => r.map((x) => formatNumber(x, digits, lang)).join(' ')).join('; ')}]), ${d.port} 1 ${d.between} ${node(e.p1a)} ${d.and} ${node(e.p1b)}, ${d.port} 2 ${d.between} ${node(e.p2a)} ${d.and} ${node(e.p2b)}`;
    }
  });
  for (const p of net.ports ?? [])
    items.push(`${d.port} ${p.label ?? p.id} ${d.between} ${node(p.plus)} (+) ${d.and} ${node(p.minus)} (−)`);
  for (const p of net.probes ?? []) {
    if (p.kind === 'v')
      items.push(
        `${d.probe} ${plainText(p.label)} ${d.between} ${node(p.plus)} (+) ${d.and} ${node(p.minus)} (−)`,
      );
  }
  const om = circuitOmega(net);
  const head =
    net.description ??
    `${net.title ?? d.title}${om !== undefined ? ` (ω = ${formatNumber(om, digits, lang)} rad/s)` : ''}`;
  return `${head}: ${items.join('; ')}.`;
}

/** Disegna lo schema. Lancia un errore se la netlist non è valida. */
export function renderSchematic(input: NetlistInput | Netlist, opts: SchematicOptions = {}): SchematicResult {
  const net = normalizeNetlist(input);
  const lang = opts.lang ?? 'it';
  const U = opts.unit ?? 20;
  const digits = opts.digits ?? 3;
  const dict = T[lang];
  const { labels, vMarks, iMarks } = makeLabels(net, lang, digits, opts.values ?? true, dict);
  // i valori dei generatori pilotati registrano le grandezze di controllo da evidenziare
  for (const e of net.elements) labels.value(e);

  const allPlaced = net.elements.every((e) => e.type === 'K' || e.at);
  const mode = net.layout.mode ?? (allPlaced ? 'manual' : 'auto');
  let parts: Part[];
  if (mode === 'manual') parts = manualLayout(net, labels, vMarks);
  else if (mode === 'bridge') parts = bridgeLayout(net, labels, vMarks) ?? autoLayout(net, labels, vMarks, U);
  else parts = autoLayout(net, labels, vMarks, U);
  for (const p of parts)
    if (p.kind === 'two' && !p.iMark && iMarks.has(p.el.id) && p.sym !== 'nor' && p.sym !== 'null')
      p.iMark = iMarks.get(p.el.id);
  for (const p of parts)
    if (p.kind === 'two' && !p.vMark && vMarks.has(p.el.id)) p.vMark = vMarks.get(p.el.id);

  // morsetti per nodo
  const terms = new Map<string, Pt[]>();
  for (const part of parts)
    for (const { node, p } of termPoints(part)) {
      if (!terms.has(node)) terms.set(node, []);
      terms.get(node)!.push(p);
    }
  const ob: Obstacles = { bodies: [], boxes: [], wires: new Map(), terms };
  for (const part of parts) {
    const o = obstaclesOf(part);
    ob.bodies.push(...o.bodies);
    ob.boxes.push(...o.boxes);
  }
  const groundSymbols = net.layout.ground === 'symbols';
  const manualWires = new Map<string, Seg[]>();
  for (const w of net.layout.wires ?? []) {
    const segs: Seg[] = [];
    for (let k = 0; k + 1 < w.points.length; k++) segs.push([w.points[k]!, w.points[k + 1]!]);
    manualWires.set(w.node, [...(manualWires.get(w.node) ?? []), ...segs]);
  }
  // instradamento: prima i nodi con meno morsetti, la massa per ultima
  const nodeOrder = [...terms.keys()].sort((a, b) =>
    a === GROUND ? 1 : b === GROUND ? -1 : terms.get(a)!.length - terms.get(b)!.length,
  );
  for (const n of nodeOrder) {
    if (n === GROUND && groundSymbols) continue;
    const segs = manualWires.get(n) ?? routeNode(n, terms.get(n)!, ob);
    ob.wires.set(n, segs);
  }

  const c: Ctx = { U, out: [], bbox: { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity }, dict };
  // fili
  for (const [n, segs] of ob.wires) {
    if (!segs.length) continue;
    c.out.push(`<g class="sch-wire" data-node="${escapeXml(n)}">`);
    for (const s of segs)
      line(c, [
        [s[0][0] * U, s[0][1] * U],
        [s[1][0] * U, s[1][1] * U],
      ]);
    c.out.push('</g>');
  }
  for (const part of parts) {
    if (part.kind === 'two') drawTwo(c, part);
    else if (part.kind === 'oa') drawOa(c, part);
    else drawTp(c, part);
  }
  // accoppiamenti: pallini sui morsetti a e arco tratteggiato con k o M
  for (const e of net.elements) {
    if (e.type !== 'K') continue;
    const p1 = parts.find((p): p is TwoPart => p.kind === 'two' && p.el.id === e.l1);
    const p2 = parts.find((p): p is TwoPart => p.kind === 'two' && p.el.id === e.l2);
    if (!p1 || !p2) continue;
    const dot = (p: TwoPart): Pt => {
      const [ax, ay] = [p.p1[0] * U, p.p1[1] * U];
      const [bx, by] = [p.p2[0] * U, p.p2[1] * U];
      const L = Math.hypot(bx - ax, by - ay);
      const ux = (bx - ax) / L;
      const uy = (by - ay) / L;
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      return [mx - ux * 24 + uy * 9, my - uy * 24 - ux * 9];
    };
    for (const p of [p1, p2]) {
      const [x, y] = dot(p);
      c.out.push(
        `<circle class="sch-fill" fill="currentColor" stroke="none" cx="${n2(x)}" cy="${n2(y)}" r="2.6"/>`,
      );
    }
    const m1: Pt = [((p1.p1[0] + p1.p2[0]) / 2) * U, ((p1.p1[1] + p1.p2[1]) / 2) * U];
    const m2: Pt = [((p2.p1[0] + p2.p2[0]) / 2) * U, ((p2.p1[1] + p2.p2[1]) / 2) * U];
    const mx = (m1[0] + m2[0]) / 2;
    const my = (m1[1] + m2[1]) / 2 - 18;
    c.out.push(
      `<path class="sch-thin" stroke-width="1.2" stroke-dasharray="4 3" d="M${n2(m1[0] + 12)} ${n2(m1[1] - 12)} Q${n2(mx)} ${n2(my - 18)} ${n2(m2[0] - 12)} ${n2(m2[1] - 12)}"/>`,
    );
    text(
      c,
      mx,
      my - 14,
      e.k !== undefined ? `k = ${formatNumber(e.k, digits, lang)}` : `M = ${fmt(e.m!, 'H', lang, digits)}`,
      { size: 12.5, cls: 'sch-val' },
    );
  }
  // pallini di giunzione: punti con tre o più collegamenti dello stesso nodo
  for (const [n, segs] of ob.wires) {
    const deg = new Map<string, number>();
    const bump = (p: Pt, k = 1): void => {
      deg.set(key(p), (deg.get(key(p)) ?? 0) + k);
    };
    for (const s of segs) {
      bump(s[0]);
      bump(s[1]);
    }
    const pts = [...deg.keys()].map((k) => k.split(',').map(Number) as Pt);
    for (const p of pts) for (const s of segs) if (onSeg(p, s, true)) bump(p, 2);
    for (const p of terms.get(n) ?? []) {
      const onWire = segs.some((s) => onSeg(p, s, true));
      if (onWire) bump(p, 1);
      else if (deg.has(key(p))) bump(p, 1);
    }
    for (const [k, v] of deg) {
      if (v >= 3) {
        const [x, y] = k.split(',').map(Number) as Pt;
        c.out.push(
          `<circle class="sch-dot" fill="currentColor" stroke="none" cx="${x * U}" cy="${y * U}" r="3.2"/>`,
        );
      }
    }
  }
  // massa
  const gTerms = terms.get(GROUND) ?? [];
  if (gTerms.length) {
    if (groundSymbols) for (const p of gTerms) drawGround(c, p[0] * U, p[1] * U);
    else {
      const gSegs = ob.wires.get(GROUND) ?? [];
      const cands = [...gTerms, ...gSegs.flatMap((s) => [s[0], s[1]])];
      const maxY = Math.max(...cands.map((p) => p[1]));
      const low = cands.filter((p) => p[1] === maxY).sort((a, b) => a[0] - b[0]);
      // preferisce il morsetto di un generatore, altrimenti il punto più a sinistra
      const src = parts.find(
        (p): p is TwoPart =>
          p.kind === 'two' &&
          (p.el.type === 'V' || p.el.type === 'I') &&
          (p.n1 === GROUND || p.n2 === GROUND),
      );
      const sp = src ? (src.n1 === GROUND ? src.p1 : src.p2) : undefined;
      const at = sp && sp[1] === maxY ? sp : low[0]!;
      c.out.push('<g class="sch-ground">');
      drawGround(c, at[0] * U, at[1] * U);
      c.out.push('</g>');
    }
  }
  // etichette dei nodi
  for (const [n, info] of Object.entries(net.nodes ?? {})) {
    if (!info.label) continue;
    const pts = terms.get(n);
    if (!pts?.length) continue;
    const p = [...pts].sort((a, b) => a[1] - b[1] || b[0] - a[0])[0]!;
    c.out.push(
      `<circle class="sch-dot" fill="currentColor" stroke="none" cx="${p[0] * U}" cy="${p[1] * U}" r="3.2"/>`,
    );
    text(c, p[0] * U + 6, p[1] * U - 8, info.label, { anchor: 'start', size: 14, cls: 'sch-name sch-node' });
  }

  const pad = 10;
  const b = c.bbox;
  if (!Number.isFinite(b.x1)) Object.assign(b, { x1: 0, y1: 0, x2: 10, y2: 10 });
  const x0 = Math.floor(b.x1 - pad);
  const y0 = Math.floor(b.y1 - pad);
  const width = Math.ceil(b.x2 + pad) - x0;
  const height = Math.ceil(b.y2 + pad) - y0;
  const title = opts.title ?? net.title ?? dict.title;
  const description = describeCircuit(net, lang, digits);
  const pre = opts.idPrefix ?? `sch-${hash(description)}`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" class="circuit${opts.className ? ` ${escapeXml(opts.className)}` : ''}" viewBox="${x0} ${y0} ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="${pre}-t ${pre}-d">` +
    `<title id="${pre}-t">${escapeXml(title)}</title><desc id="${pre}-d">${escapeXml(description)}</desc>` +
    `<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${c.out.join('')}</g></svg>`;
  const drawn = [...new Set(parts.map((p) => p.el.id))];
  return { svg, width, height, title, description, geometry: { wires: ob.wires, terminals: terms, drawn } };
}

/** Hash breve e stabile (id deterministici a build-time). */
function hash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
