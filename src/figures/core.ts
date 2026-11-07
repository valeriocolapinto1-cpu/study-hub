/**
 * Nucleo del kit delle figure: costruttore SVG puro (nessun DOM, nessuna dipendenza
 * pesante), toni di colore dai token CSS, etichette con pedici/apici, frecce.
 *
 * Regole comuni a tutte le figure:
 * - colori solo `currentColor` o `var(--token)` (tema chiaro/scuro e stampa);
 * - testo sempre nel colore del testo (i colori distinguono i segni, non le scritte);
 * - `role="img"` con `<title>` e `<desc>` nella lingua della pagina;
 * - coordinate arrotondate a 2 decimali: stessa uscita per gli stessi parametri.
 */
import { formatNumber } from '../sim/units';

export type Lang = 'it' | 'en';
export type Pt = [number, number];

/** Toni dei segni (tratti e frecce). Il testo resta `ink` o `muted`. */
export const TONES = ['ink', 'muted', 'accent', 'accent2', 'info', 'success', 'warning', 'danger'] as const;
export type Tone = (typeof TONES)[number];

const TONE_CSS: Record<Tone | 'faint', string> = {
  ink: 'currentColor',
  muted: 'var(--text-muted)',
  faint: 'var(--border-strong)',
  accent: 'var(--accent)',
  accent2: 'var(--accent-2)',
  info: 'var(--info)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
};

/** Riempimenti: tono pieno oppure superfici del tema. */
export type Fill = Tone | 'faint' | 'none' | 'soft' | 'surface' | 'surface2' | 'bg';
const FILL_CSS: Record<Exclude<Fill, Tone | 'faint'>, string> = {
  none: 'none',
  soft: 'var(--accent-soft)',
  surface: 'var(--surface)',
  surface2: 'var(--surface-2)',
  bg: 'var(--bg)',
};

export const toneCss = (t: Tone | 'faint'): string => TONE_CSS[t];
export const fillCss = (f: Fill): string => (f in FILL_CSS ? FILL_CSS[f as keyof typeof FILL_CSS] : TONE_CSS[f as Tone]);

export const r2 = (v: number): string => {
  const x = Math.round(v * 100) / 100;
  return Object.is(x, -0) ? '0' : String(x);
};

export function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Testo localizzato breve. */
export const L = (lang: Lang, it: string, en: string): string => (lang === 'en' ? en : it);

/** Numero con separatore decimale della lingua. */
export const num = (x: number, lang: Lang, digits = 3): string => formatNumber(x, digits, lang);

/** Hash deterministico (djb2) per gli id interni. */
export function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export interface StrokeOpts {
  tone?: Tone | 'faint';
  width?: number;
  dash?: string;
  fill?: Fill;
  opacity?: number;
  cap?: 'round' | 'butt' | 'square';
  join?: 'round' | 'miter';
}

export interface TextOpts {
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
  /** Lettere in corsivo (simboli di grandezze). */
  italic?: boolean;
  weight?: number;
  muted?: boolean;
  mono?: boolean;
  /** Allineamento verticale: il punto (x, y) è il centro della riga (default) o la linea di base. */
  baseline?: 'middle' | 'alphabetic';
  /** Contorno del colore di fondo per staccare il testo dalle linee. */
  halo?: boolean;
}

/**
 * Etichetta con pedici e apici: `F_N`, `v_{0x}`, `x^2`, `R^{-1}`.
 * Restituisce i tspan (senza il <text> esterno).
 */
export function labelTspans(label: string, size: number): string {
  const segs: Array<{ kind: 'n' | 'sub' | 'sup'; text: string }> = [];
  let buf = '';
  let i = 0;
  while (i < label.length) {
    const c = label[i]!;
    if ((c === '_' || c === '^') && i + 1 < label.length) {
      if (buf) segs.push({ kind: 'n', text: buf });
      buf = '';
      let inner: string;
      if (label[i + 1] === '{') {
        const end = label.indexOf('}', i + 2);
        inner = end < 0 ? label.slice(i + 2) : label.slice(i + 2, end);
        i = end < 0 ? label.length : end + 1;
      } else {
        inner = label[i + 1]!;
        i += 2;
      }
      if (inner) segs.push({ kind: c === '_' ? 'sub' : 'sup', text: inner });
      continue;
    }
    buf += c;
    i++;
  }
  if (buf) segs.push({ kind: 'n', text: buf });
  if (segs.every((g) => g.kind === 'n')) return escapeXml(label);
  const small = Math.round(size * 0.72);
  let shift = 0;
  return segs
    .map((g) => {
      const target = g.kind === 'sub' ? size * 0.3 : g.kind === 'sup' ? -size * 0.38 : 0;
      const dy = target - shift;
      shift = target;
      const attrs = `${dy ? ` dy="${r2(dy)}"` : ''}${g.kind === 'n' ? '' : ` font-size="${small}"`}`;
      return attrs ? `<tspan${attrs}>${escapeXml(g.text)}</tspan>` : escapeXml(g.text);
    })
    .join('');
}

/** Testo semplice di un'etichetta (per <desc>): `F_N` → `FN`, `x^2` → `x²` non serve: resta leggibile. */
export function plainLabel(label: string): string {
  return label.replace(/[_^]\{([^}]*)\}/g, '$1').replace(/[_^](.)/g, '$1');
}

/** Costruttore SVG. */
export class Svg {
  private parts: string[] = [];
  constructor(
    public width: number,
    public height: number,
  ) {}

  private stroke(o: StrokeOpts, defFill: Fill = 'none'): string {
    const tone = o.tone ?? 'ink';
    const fill = o.fill ?? defFill;
    const st = [`stroke:${TONE_CSS[tone]}`, `fill:${fillCss(fill)}`];
    if (o.opacity !== undefined && o.opacity < 1) st.push(`opacity:${o.opacity}`);
    return (
      ` style="${st.join(';')}" stroke-width="${o.width ?? 1.5}"` +
      (o.dash ? ` stroke-dasharray="${o.dash}"` : '') +
      ` stroke-linecap="${o.cap ?? 'round'}" stroke-linejoin="${o.join ?? 'round'}"`
    );
  }

  raw(s: string): this {
    this.parts.push(s);
    return this;
  }

  line(x1: number, y1: number, x2: number, y2: number, o: StrokeOpts = {}): this {
    return this.raw(`<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}"${this.stroke(o)}/>`);
  }

  path(d: string, o: StrokeOpts = {}): this {
    return this.raw(`<path d="${d}"${this.stroke(o)}/>`);
  }

  polyline(pts: Pt[], o: StrokeOpts = {}, close = false): this {
    if (pts.length < 2) return this;
    return this.path(pathD(pts, close), o);
  }

  polygon(pts: Pt[], o: StrokeOpts = {}): this {
    return this.raw(`<polygon points="${pts.map((p) => `${r2(p[0])},${r2(p[1])}`).join(' ')}"${this.stroke(o)}/>`);
  }

  circle(cx: number, cy: number, r: number, o: StrokeOpts = {}): this {
    return this.raw(`<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}"${this.stroke(o)}/>`);
  }

  rect(x: number, y: number, w: number, h: number, o: StrokeOpts & { rx?: number } = {}): this {
    return this.raw(
      `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}"${o.rx ? ` rx="${o.rx}"` : ''}${this.stroke(o)}/>`,
    );
  }

  /** Punto pieno. */
  dot(x: number, y: number, r = 3, tone: Tone = 'ink'): this {
    return this.raw(`<circle cx="${r2(x)}" cy="${r2(y)}" r="${r}" style="fill:${TONE_CSS[tone]};stroke:none"/>`);
  }

  text(x: number, y: number, label: string, o: TextOpts = {}): this {
    const size = o.size ?? 13;
    const st = [
      `fill:${o.muted ? 'var(--text-muted)' : 'currentColor'}`,
      `font-family:${o.mono ? 'var(--font-mono)' : 'var(--font-sans)'}`,
    ];
    if (o.italic) st.push('font-style:italic');
    if (o.halo) st.push('paint-order:stroke', 'stroke:var(--bg)', 'stroke-width:4px', 'stroke-linejoin:round');
    const base = o.baseline ?? 'middle';
    // dominant-baseline non è affidabile in stampa e in alcuni lettori: si sposta a mano.
    const yy = base === 'middle' ? y + size * 0.35 : y;
    return this.raw(
      `<text x="${r2(x)}" y="${r2(yy)}" font-size="${size}"${o.weight ? ` font-weight="${o.weight}"` : ''} text-anchor="${o.anchor ?? 'middle'}" style="${st.join(';')}">${labelTspans(label, size)}</text>`,
    );
  }

  /** Freccia con punta piena (la punta è un poligono: segue il tono anche in stampa). */
  arrow(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    o: StrokeOpts & { head?: number; double?: boolean } = {},
  ): this {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 0.5) return this;
    const head = Math.min(o.head ?? 4 + (o.width ?? 1.5) * 2.4, len * 0.6);
    const ux = (x2 - x1) / len;
    const uy = (y2 - y1) / len;
    const sx = o.double ? x1 + ux * head * 0.8 : x1;
    const sy = o.double ? y1 + uy * head * 0.8 : y1;
    this.line(sx, sy, x2 - ux * head * 0.8, y2 - uy * head * 0.8, o);
    this.raw(arrowHead(x2, y2, ux, uy, head, o.tone ?? 'ink'));
    if (o.double) this.raw(arrowHead(x1, y1, -ux, -uy, head, o.tone ?? 'ink'));
    return this;
  }

  /** Punta di freccia isolata in (x, y) con direzione (ux, uy). */
  head(x: number, y: number, ux: number, uy: number, size = 8, tone: Tone | 'faint' = 'ink'): this {
    const m = Math.hypot(ux, uy) || 1;
    return this.raw(arrowHead(x, y, ux / m, uy / m, size, tone));
  }

  /** Quota: freccia doppia con etichetta al centro. */
  dimension(x1: number, y1: number, x2: number, y2: number, label: string, o: { offset?: number; italic?: boolean } = {}): this {
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = -(y2 - y1) / len;
    const ny = (x2 - x1) / len;
    const off = o.offset ?? 0;
    const a: Pt = [x1 + nx * off, y1 + ny * off];
    const b: Pt = [x2 + nx * off, y2 + ny * off];
    if (off) {
      this.line(x1, y1, a[0] + nx * 4 * Math.sign(off), a[1] + ny * 4 * Math.sign(off), { tone: 'muted', width: 0.8 });
      this.line(x2, y2, b[0] + nx * 4 * Math.sign(off), b[1] + ny * 4 * Math.sign(off), { tone: 'muted', width: 0.8 });
    }
    this.arrow(a[0], a[1], b[0], b[1], { tone: 'muted', width: 1, head: 7, double: true });
    const lo = off >= 0 ? 11 : -11;
    return this.text((a[0] + b[0]) / 2 + nx * lo, (a[1] + b[1]) / 2 + ny * lo, label, { italic: o.italic ?? true, halo: true });
  }

  /** Arco di angolo con etichetta (angoli in radianti, verso antiorario sullo schermo = y verso l'alto). */
  angleArc(cx: number, cy: number, r: number, a0: number, a1: number, label?: string, tone: Tone = 'muted'): this {
    const p0: Pt = [cx + r * Math.cos(a0), cy - r * Math.sin(a0)];
    const p1: Pt = [cx + r * Math.cos(a1), cy - r * Math.sin(a1)];
    const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
    const sweep = a1 > a0 ? 0 : 1;
    this.path(`M${r2(p0[0])} ${r2(p0[1])}A${r2(r)} ${r2(r)} 0 ${large} ${sweep} ${r2(p1[0])} ${r2(p1[1])}`, { tone, width: 1.2 });
    if (label) {
      const am = (a0 + a1) / 2;
      const rl = r + 12;
      this.text(cx + rl * Math.cos(am), cy - rl * Math.sin(am), label, { italic: true, size: 13, halo: true });
    }
    return this;
  }

  /** Terreno tratteggiato tra (x1, y) e (x2, y) (righe sotto). */
  ground(x1: number, y: number, x2: number, side: 1 | -1 = 1): this {
    this.line(x1, y, x2, y, { width: 1.6 });
    for (let x = x1 + 4; x < x2; x += 10) this.line(x, y, x - 7, y + 8 * side, { tone: 'muted', width: 1 });
    return this;
  }

  get body(): string {
    return this.parts.join('');
  }
}

function arrowHead(x: number, y: number, ux: number, uy: number, size: number, tone: Tone | 'faint'): string {
  const w = size * 0.42;
  const bx = x - ux * size;
  const by = y - uy * size;
  const pts = [
    [x, y],
    [bx - uy * w, by + ux * w],
    [bx + uy * w, by - ux * w],
  ];
  return `<polygon points="${pts.map((p) => `${r2(p[0]!)},${r2(p[1]!)}`).join(' ')}" style="fill:${TONE_CSS[tone]};stroke:none"/>`;
}

export function pathD(pts: Pt[], close = false): string {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${r2(p[0])} ${r2(p[1])}`).join('') + (close ? 'Z' : '');
}

export interface RenderOptions {
  lang?: Lang;
  /** Prefisso degli id interni (title/desc); default dal tipo e dai parametri. */
  idPrefix?: string;
  /** Titolo accessibile (default: generato dal tipo). */
  title?: string;
  /** Classe CSS aggiuntiva sull'elemento <svg>. */
  className?: string;
}

export interface FigureResult {
  svg: string;
  width: number;
  height: number;
  title: string;
  description: string;
}

/** Contesto passato ai disegnatori. */
export interface Ctx {
  lang: Lang;
  L(it: string, en: string): string;
  num(x: number, digits?: number): string;
}

export interface Drawn {
  svg: Svg;
  title: string;
  description: string;
}

export function makeCtx(lang: Lang): Ctx {
  return { lang, L: (it, en) => L(lang, it, en), num: (x, d) => num(x, lang, d) };
}

/** Avvolge il disegno nell'elemento <svg> accessibile. */
export function finish(type: string, params: unknown, d: Drawn, opts: RenderOptions = {}): FigureResult {
  const title = opts.title ?? d.title;
  const pre = opts.idPrefix ?? `fig-${type}-${hash(JSON.stringify(params) ?? '')}`;
  const { width, height } = d.svg;
  const cls = `figure-svg figure-svg--${type}${opts.className ? ` ${escapeXml(opts.className)}` : ''}`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 ${r2(width)} ${r2(height)}" width="${r2(width)}" height="${r2(height)}" role="img" aria-labelledby="${pre}-t ${pre}-d" style="max-width:100%;height:auto">` +
    `<title id="${pre}-t">${escapeXml(title)}</title><desc id="${pre}-d">${escapeXml(d.description)}</desc>` +
    d.svg.body +
    `</svg>`;
  return { svg, width, height, title, description: d.description };
}

/** Frecce a metà di una polilinea (verso di percorrenza). */
export function midArrow(s: Svg, pts: Pt[], tone: Tone = 'ink', at = 0.5, size = 9): void {
  if (pts.length < 2) return;
  let total = 0;
  const seg: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
    seg.push(l);
    total += l;
  }
  let target = total * at + size / 2;
  for (let i = 0; i < seg.length; i++) {
    if (target <= seg[i]! || i === seg.length - 1) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      const f = seg[i]! > 0 ? Math.min(1, target / seg[i]!) : 0;
      s.head(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, b[0] - a[0], b[1] - a[1], size, tone);
      return;
    }
    target -= seg[i]!;
  }
}

/** Gradi → radianti. */
export const rad = (deg: number): number => (deg * Math.PI) / 180;

/** Elenco leggibile: "a, b e c". */
export function listText(items: string[], lang: Lang): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${lang === 'en' ? 'and' : 'e'} ${items[items.length - 1]}`;
}
