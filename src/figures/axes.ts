/**
 * Assi cartesiani per le figure con grafici (funzioni, x/v/a nel tempo, piano pV):
 * tacche "belle", etichette con unità, griglia facoltativa. Puro.
 */
import { niceTicks } from '../sim/scale';
import type { Svg } from './core';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Frame {
  sx(v: number): number;
  sy(v: number): number;
  box: Box;
  xd: [number, number];
  yd: [number, number];
  /** Pixel dell'asse x (y = 0 se visibile, altrimenti il bordo inferiore). */
  axisY: number;
  axisX: number;
}

export interface AxesOpts {
  xLabel?: string | undefined;
  yLabel?: string | undefined;
  xUnit?: string | undefined;
  yUnit?: string | undefined;
  grid?: boolean | undefined;
  fmt(v: number): string;
  xTicks?: number;
  yTicks?: number;
  /** Assi al bordo (non per lo zero): piano pV. */
  edge?: boolean;
  /** Senza tacche numeriche (figure qualitative). */
  noTicks?: boolean;
}

const unitText = (label: string | undefined, unit: string | undefined): string =>
  label ? (unit ? `${label} (${unit})` : label) : unit ? `(${unit})` : '';

export function frame(box: Box, xd: [number, number], yd: [number, number], edge = false): Frame {
  const sx = (v: number): number => box.x + ((v - xd[0]) / (xd[1] - xd[0] || 1)) * box.w;
  const sy = (v: number): number => box.y + box.h - ((v - yd[0]) / (yd[1] - yd[0] || 1)) * box.h;
  const axisY = !edge && yd[0] <= 0 && yd[1] >= 0 ? sy(0) : box.y + box.h;
  const axisX = !edge && xd[0] <= 0 && xd[1] >= 0 ? sx(0) : box.x;
  return { sx, sy, box, xd, yd, axisY, axisX };
}

/** Disegna assi, tacche, griglia ed etichette; restituisce la cornice per disegnare i dati. */
export function drawAxes(s: Svg, f: Frame, o: AxesOpts): void {
  const { box } = f;
  const xt = o.noTicks ? [] : niceTicks(f.xd[0], f.xd[1], o.xTicks ?? 6);
  const yt = o.noTicks ? [] : niceTicks(f.yd[0], f.yd[1], o.yTicks ?? 5);
  if (o.grid) {
    for (const v of xt) s.line(f.sx(v), box.y, f.sx(v), box.y + box.h, { tone: 'faint', width: 0.6, opacity: 0.6 });
    for (const v of yt) s.line(box.x, f.sy(v), box.x + box.w, f.sy(v), { tone: 'faint', width: 0.6, opacity: 0.6 });
  }
  // assi con freccia
  s.arrow(box.x - 4, f.axisY, box.x + box.w + 12, f.axisY, { width: 1.2, head: 8 });
  s.arrow(f.axisX, box.y + box.h + 4, f.axisX, box.y - 12, { width: 1.2, head: 8 });
  for (const v of xt) {
    const x = f.sx(v);
    if (Math.abs(x - f.axisX) < 1 && !o.edge && f.axisY < box.y + box.h - 1) continue;
    s.line(x, f.axisY, x, f.axisY + 4, { width: 1 });
    s.text(x, f.axisY + 14, o.fmt(v), { size: 11, muted: true, halo: true });
  }
  for (const v of yt) {
    const y = f.sy(v);
    if (Math.abs(y - f.axisY) < 1 && !o.edge) {
      continue;
    }
    s.line(f.axisX - 4, y, f.axisX, y, { width: 1 });
    s.text(f.axisX - 7, y, o.fmt(v), { size: 11, muted: true, anchor: 'end', halo: true });
  }
  const xl = unitText(o.xLabel, o.xUnit);
  const yl = unitText(o.yLabel, o.yUnit);
  if (xl) s.text(box.x + box.w + 14, f.axisY - 12, xl, { anchor: 'end', size: 13, halo: true });
  if (yl) s.text(f.axisX + 8, box.y - 10, yl, { anchor: 'start', size: 13, halo: true });
}
