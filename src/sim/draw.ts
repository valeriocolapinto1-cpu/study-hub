/**
 * Utilità di disegno su canvas 2D (frecce, griglie, tracciati) e palette dai token.
 */
import { cssVar } from './hooks';

/** Colori del tema letti dai token CSS (ridisegnare quando cambia il tema). */
export interface Palette {
  text: string;
  muted: string;
  border: string;
  strong: string;
  accent: string;
  accentSoft: string;
  surface: string;
  bg: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  /** Sequenza per più serie: accento, info, warning, success, danger. */
  series: string[];
}

export function readPalette(el: Element | null): Palette {
  const v = (n: string, f: string): string => cssVar(el, n, f);
  const p = {
    text: v('--text', '#1c1d20'),
    muted: v('--text-muted', '#54565c'),
    border: v('--border', '#dcd8ce'),
    strong: v('--border-strong', '#b5b0a4'),
    accent: v('--accent', '#1f4f8f'),
    accentSoft: v('--accent-soft', '#e3ebf6'),
    surface: v('--surface', '#ffffff'),
    bg: v('--bg', '#05060c'),
    success: v('--success', '#1e6b3a'),
    warning: v('--warning', '#8a5a00'),
    danger: v('--danger', '#a32020'),
    info: v('--info', '#1f5e8f'),
  };
  return { ...p, series: [p.accent, p.warning, p.success, p.danger, p.info] };
}

/** Freccia da (x1,y1) a (x2,y2) con punta piena. */
export function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 2,
  head = 8,
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const L = Math.hypot(dx, dy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  if (L < 1) {
    ctx.beginPath();
    ctx.arc(x1, y1, width + 1, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const ux = dx / L;
  const uy = dy / L;
  const h = Math.min(head, L * 0.6);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - ux * h * 0.8, y2 - uy * h * 0.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * h - uy * h * 0.45, y2 - uy * h + ux * h * 0.45);
  ctx.lineTo(x2 - ux * h + uy * h * 0.45, y2 - uy * h - ux * h * 0.45);
  ctx.closePath();
  ctx.fill();
}

/** Polilinea da campioni (x, y) già in pixel; salta i valori non finiti. */
export function polyline(ctx: CanvasRenderingContext2D, xs: ArrayLike<number>, ys: ArrayLike<number>): void {
  ctx.beginPath();
  let pen = false;
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i]!;
    const y = ys[i]!;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      pen = false;
      continue;
    }
    if (pen) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
    pen = true;
  }
  ctx.stroke();
}

/** Griglia a divisioni regolari nel rettangolo dato. */
export function grid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  nx: number,
  ny: number,
  color: string,
  sub = 0,
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= nx; i++) {
    const px = Math.round(x + (w * i) / nx) + 0.5;
    ctx.moveTo(px, y);
    ctx.lineTo(px, y + h);
  }
  for (let j = 0; j <= ny; j++) {
    const py = Math.round(y + (h * j) / ny) + 0.5;
    ctx.moveTo(x, py);
    ctx.lineTo(x + w, py);
  }
  ctx.stroke();
  if (sub > 0) {
    // tacchette sugli assi centrali (stile oscilloscopio)
    ctx.beginPath();
    const cx = x + w / 2;
    const cy = y + h / 2;
    for (let i = 0; i <= nx * sub; i++) {
      const px = x + (w * i) / (nx * sub);
      ctx.moveTo(px, cy - 3);
      ctx.lineTo(px, cy + 3);
    }
    for (let j = 0; j <= ny * sub; j++) {
      const py = y + (h * j) / (ny * sub);
      ctx.moveTo(cx - 3, py);
      ctx.lineTo(cx + 3, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}
