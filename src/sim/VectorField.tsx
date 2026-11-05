/**
 * Campo vettoriale su canvas: frecce su griglia (lunghezza compressa in scala
 * logaritmica, direzione esatta), linee di campo e sorgenti con segno.
 */
import { useMemo } from 'preact/hooks';
import { Canvas2D } from './Canvas2D';
import { arrow } from './draw';
import {
  sampleGrid,
  seedsAround,
  streamline,
  type Bounds,
  type Field,
  type PointSource,
  type Vec,
} from './field';

export interface VectorFieldProps {
  title: string;
  field: Field;
  bounds: Bounds;
  /** Sorgenti da disegnare (e da cui partono le linee di campo). */
  sources?: PointSource[];
  /** Frecce su griglia (default true) e numero di colonne. */
  arrows?: boolean;
  columns?: number;
  /** Linee di campo (default true se ci sono sorgenti). */
  lines?: boolean;
  linesPerUnit?: number;
  /** Simbolo delle sorgenti: cariche (+/−) o fili (• uscente, × entrante). */
  sourceStyle?: 'charge' | 'wire';
  height?: number;
  description?: string;
}

export function VectorField(p: VectorFieldProps): preact.JSX.Element {
  const b = p.bounds;
  const lines = useMemo(() => {
    if (!(p.lines ?? Boolean(p.sources?.length)) || !p.sources) return [];
    const span = Math.max(b.xMax - b.xMin, b.yMax - b.yMin);
    const sinks = p.sources.map((s) => ({ x: s.x, y: s.y, r: span * 0.012 }));
    return seedsAround(p.sources, p.linesPerUnit ?? 8, span * 0.02)
      .filter(({ direction }) => p.sourceStyle !== 'wire' || direction === 1)
      .map(({ seed, direction }) =>
        streamline(p.field, seed, { bounds: b, step: span / 400, maxSteps: 1500, direction, sinks }),
      );
  }, [p.field, p.sources, b, p.lines, p.linesPerUnit, p.sourceStyle]);
  return (
    <figure class="sim-field">
      <Canvas2D
        label={p.title}
        height={p.height}
        aspect={(b.xMax - b.xMin) / (b.yMax - b.yMin)}
        deps={[p.field, lines, p.arrows, p.columns]}
        draw={({ ctx, width, height, colors }) => {
          const sx = (x: number): number => ((x - b.xMin) / (b.xMax - b.xMin)) * width;
          const sy = (y: number): number => height - ((y - b.yMin) / (b.yMax - b.yMin)) * height;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = colors.accent;
          ctx.globalAlpha = 0.9;
          ctx.lineWidth = 1.4;
          for (const l of lines) {
            ctx.beginPath();
            l.forEach(([x, y], i) => (i ? ctx.lineTo(sx(x), sy(y)) : ctx.moveTo(sx(x), sy(y))));
            ctx.stroke();
            // freccia a metà linea che indica il verso
            const m = Math.floor(l.length / 2);
            if (l.length > 6) {
              const [x1, y1] = l[m - 2] as Vec;
              const [x2, y2] = l[m] as Vec;
              arrow(ctx, sx(x1), sy(y1), sx(x2), sy(y2), colors.accent, 1.4, 7);
            }
          }
          ctx.globalAlpha = 1;
          if (p.arrows ?? true) {
            const nx = p.columns ?? Math.max(8, Math.round(width / 40));
            const ny = Math.max(4, Math.round((nx * height) / width));
            const cell = Math.min(width / nx, height / ny);
            const pts = sampleGrid(p.field, b, nx, ny);
            const mags = pts
              .map((q) => Math.hypot(q.v[0], q.v[1]))
              .filter((m) => m > 0)
              .sort((x, y) => x - y);
            const ref = mags[Math.floor(mags.length * 0.5)] ?? 1;
            for (const q of pts) {
              const m = Math.hypot(q.v[0], q.v[1]);
              if (!(m > 0)) continue;
              const len = cell * 0.42 * Math.min(1.6, Math.max(0.25, 1 + 0.35 * Math.log(m / ref)));
              const ux = q.v[0] / m;
              const uy = -q.v[1] / m;
              const cx = sx(q.x);
              const cy = sy(q.y);
              arrow(
                ctx,
                cx - (ux * len) / 2,
                cy - (uy * len) / 2,
                cx + (ux * len) / 2,
                cy + (uy * len) / 2,
                colors.muted,
                1.3,
                5,
              );
            }
          }
          for (const s of p.sources ?? []) {
            const x = sx(s.x);
            const y = sy(s.y);
            const pos = s.q >= 0;
            ctx.fillStyle = pos ? colors.danger : colors.info;
            ctx.beginPath();
            ctx.arc(x, y, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = colors.surface;
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (p.sourceStyle === 'wire') {
              if (pos) {
                ctx.fillStyle = colors.surface;
                ctx.arc(x, y, 2.5, 0, Math.PI * 2);
                ctx.fill();
              } else {
                ctx.moveTo(x - 4, y - 4);
                ctx.lineTo(x + 4, y + 4);
                ctx.moveTo(x + 4, y - 4);
                ctx.lineTo(x - 4, y + 4);
              }
            } else {
              ctx.moveTo(x - 4.5, y);
              ctx.lineTo(x + 4.5, y);
              if (pos) {
                ctx.moveTo(x, y - 4.5);
                ctx.lineTo(x, y + 4.5);
              }
            }
            ctx.stroke();
          }
        }}
      >
        {p.description}
      </Canvas2D>
    </figure>
  );
}
