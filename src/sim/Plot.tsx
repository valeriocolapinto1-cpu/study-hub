/**
 * Grafico SVG leggero: assi, griglia, più serie, scala lineare o log,
 * cursore con lettura dei valori (puntatore e frecce da tastiera), tabella dei
 * dati come alternativa accessibile. Funziona anche senza idratazione (SSR:
 * grafico statico a zero JS); con client:visible diventa interattivo.
 * BodePlot: modulo [dB] e fase [°] con asse delle frequenze logaritmico e
 * cursore condiviso.
 */
import { useId, useMemo, useRef, useState } from 'preact/hooks';
import { useElementSize } from './hooks';
import { simT, type Lang } from './i18n';
import { extent, makeScale, type ScaleKind } from './scale';
import { formatNumber, formatSI } from './units';
import { plain, RichText } from './RichText';

export interface Series {
  label: string;
  x: ArrayLike<number>;
  y: ArrayLike<number>;
  /** Colore CSS (default: sequenza dei token). */
  color?: string;
  /** Tratteggio SVG, es. "6 4". */
  dash?: string;
  width?: number;
  /** Riempie l'area sotto la curva (fino a y = 0 o al bordo). */
  fill?: boolean;
}

export interface Marker {
  x: number;
  y?: number;
  label?: string;
}

export interface PlotProps {
  series: Series[];
  lang: Lang;
  /** Titolo accessibile del grafico. */
  title: string;
  xLabel?: string;
  yLabel?: string;
  xUnit?: string;
  yUnit?: string;
  xScale?: ScaleKind;
  yScale?: ScaleKind;
  xDomain?: [number, number];
  yDomain?: [number, number];
  height?: number;
  markers?: Marker[];
  /** Cursore interattivo (default true). */
  cursor?: boolean;
  /** Cursore controllato dall'esterno (es. Bode). */
  cursorX?: number | null;
  onCursor?: (x: number | null) => void;
  /** Tabella dei dati (default true). */
  table?: boolean;
  /** Formattazione dei valori (default: prefissi SI con l'unità). */
  formatX?: (v: number) => string;
  formatY?: (v: number) => string;
  /** Legenda (default: se più di una serie). */
  legend?: boolean;
  class?: string;
}

const PALETTE = ['var(--accent)', 'var(--warning)', 'var(--success)', 'var(--danger)', 'var(--info)'];
const M = { top: 14, right: 16, bottom: 40, left: 58 };

function nearestIndex(xs: ArrayLike<number>, x: number): number {
  // campioni ordinati in x: ricerca binaria
  let lo = 0;
  let hi = xs.length - 1;
  if (hi < 0) return -1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid]! < x) lo = mid;
    else hi = mid;
  }
  return Math.abs(xs[lo]! - x) <= Math.abs(xs[hi]! - x) ? lo : hi;
}

/** Riduce le righe della tabella a circa `n`, campionando uniformemente. */
function decimate(len: number, n: number): number[] {
  if (len <= n) return Array.from({ length: len }, (_, i) => i);
  return Array.from({ length: n }, (_, i) => Math.round((i * (len - 1)) / (n - 1)));
}

export function Plot(p: PlotProps): preact.JSX.Element {
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const { width: measured } = useElementSize(wrap, 640);
  const W = Math.max(260, Math.round(measured));
  const H = p.height ?? 260;
  const xKind = p.xScale ?? 'lin';
  const yKind = p.yScale ?? 'lin';
  const fx = p.formatX ?? ((v: number): string => formatSI(v, p.xUnit ?? '', { lang: p.lang, digits: 3 }));
  const fy = p.formatY ?? ((v: number): string => formatSI(v, p.yUnit ?? '', { lang: p.lang, digits: 3 }));
  const [ownCursor, setOwnCursor] = useState<number | null>(null);
  const cursorX = p.cursorX !== undefined ? p.cursorX : ownCursor;
  const setCursor = (x: number | null): void => {
    setOwnCursor(x);
    p.onCursor?.(x);
  };

  const { sx, sy, xTicks, yTicks } = useMemo(() => {
    const allX = (function* () {
      for (const s of p.series)
        for (let i = 0; i < s.x.length; i++) {
          const v = s.x[i]!;
          if (xKind !== 'log' || v > 0) yield v;
        }
    })();
    const allY = (function* () {
      for (const s of p.series)
        for (let i = 0; i < s.y.length; i++) {
          const v = s.y[i]!;
          if (yKind !== 'log' || v > 0) yield v;
        }
    })();
    const xd = p.xDomain ?? extent(allX, 0);
    const yd = p.yDomain ?? extent(allY, 0.06);
    const sx = makeScale(xKind, xd, [M.left, W - M.right]);
    const sy = makeScale(yKind, yd, [H - M.bottom, M.top]);
    return {
      sx,
      sy,
      xTicks: sx.ticks(Math.max(3, Math.floor((W - M.left - M.right) / 80))),
      yTicks: sy.ticks(Math.max(3, Math.floor((H - M.top - M.bottom) / 40))),
    };
  }, [p.series, p.xDomain, p.yDomain, xKind, yKind, W, H]);

  const paths = p.series.map((s, k) => {
    let d = '';
    let pen = false;
    for (let i = 0; i < s.x.length; i++) {
      const X = sx(s.x[i]!);
      const Y = sy(s.y[i]!);
      if (!Number.isFinite(X) || !Number.isFinite(Y)) {
        pen = false;
        continue;
      }
      d += `${pen ? 'L' : 'M'}${X.toFixed(1)} ${Y.toFixed(1)}`;
      pen = true;
    }
    const color = s.color ?? PALETTE[k % PALETTE.length]!;
    let area = '';
    if (s.fill && d) {
      const y0 = Math.min(Math.max(sy(0), M.top), H - M.bottom);
      area = `${d}L${sx(s.x[s.x.length - 1]!).toFixed(1)} ${y0}L${sx(s.x[0]!).toFixed(1)} ${y0}Z`;
    }
    return { d, area, color, s };
  });

  const ref = p.series[0];
  const ci = cursorX != null && ref ? nearestIndex(ref.x, cursorX) : -1;
  const interactive = p.cursor ?? true;
  const pointer = (e: PointerEvent): void => {
    const svg = e.currentTarget as SVGSVGElement;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    if (px < M.left || px > W - M.right) return;
    setCursor(sx.invert(px));
  };
  const key = (e: KeyboardEvent): void => {
    if (!ref || ref.x.length === 0) return;
    const n = ref.x.length;
    const stepN = Math.max(1, Math.round(n / 100));
    let i = ci < 0 ? 0 : ci;
    if (e.key === 'ArrowRight') i = Math.min(n - 1, i + (e.shiftKey ? stepN * 10 : stepN));
    else if (e.key === 'ArrowLeft') i = Math.max(0, i - (e.shiftKey ? stepN * 10 : stepN));
    else if (e.key === 'Home') i = 0;
    else if (e.key === 'End') i = n - 1;
    else if (e.key === 'Escape') {
      setCursor(null);
      return;
    } else return;
    e.preventDefault();
    setCursor(ref.x[i]!);
  };
  const readout =
    ci >= 0 && ref
      ? `${p.xLabel ?? 'x'} = ${fx(ref.x[ci]!)}; ` +
        p.series
          .map((s) => {
            const j = s === ref ? ci : nearestIndex(s.x, ref.x[ci]!);
            return `${plain(s.label)} = ${j >= 0 ? fy(s.y[j]!) : '—'}`;
          })
          .join('; ')
      : '';
  const showLegend = p.legend ?? p.series.length > 1;
  const rows = ref ? decimate(ref.x.length, 41) : [];

  return (
    <figure class={`sim-plot${p.class ? ` ${p.class}` : ''}`} ref={wrap}>
      {showLegend && (
        <ul class="sim-legend" aria-hidden="true">
          {paths.map(({ color, s }) => (
            <li>
              <svg width="22" height="10" viewBox="0 0 22 10">
                <line
                  x1="1"
                  y1="5"
                  x2="21"
                  y2="5"
                  style={{ stroke: color }}
                  stroke-width="2.5"
                  stroke-dasharray={s.dash}
                />
              </svg>
              <RichText text={s.label} />
            </li>
          ))}
        </ul>
      )}
      <div
        class="sim-plot__area"
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'group' : undefined}
        aria-label={interactive ? `${p.title}. ${simT(p.lang, 'cursorHelp')}` : undefined}
        onKeyDown={interactive ? key : undefined}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-labelledby={`${id}-t`}
          onPointerMove={interactive ? pointer : undefined}
          onPointerDown={interactive ? pointer : undefined}
          style={{ touchAction: interactive ? 'pan-y' : undefined }}
        >
          <title id={`${id}-t`}>{p.title}</title>
          <g class="sim-plot__grid">
            {xTicks.map((v) => (
              <line x1={sx(v)} x2={sx(v)} y1={M.top} y2={H - M.bottom} />
            ))}
            {yTicks.map((v) => (
              <line x1={M.left} x2={W - M.right} y1={sy(v)} y2={sy(v)} />
            ))}
          </g>
          <g class="sim-plot__axis">
            <rect
              x={M.left}
              y={M.top}
              width={W - M.left - M.right}
              height={H - M.top - M.bottom}
              fill="none"
            />
            {xTicks.map((v) => (
              <text x={sx(v)} y={H - M.bottom + 16} text-anchor="middle">
                {fx(v)}
              </text>
            ))}
            {yTicks.map((v) => (
              <text x={M.left - 6} y={sy(v) + 4} text-anchor="end">
                {fy(v)}
              </text>
            ))}
            {p.xLabel && (
              <text x={(M.left + W - M.right) / 2} y={H - 6} text-anchor="middle" class="sim-plot__label">
                <RichText text={p.xLabel} svg />
              </text>
            )}
            {p.yLabel && (
              <text
                x={12}
                y={(M.top + H - M.bottom) / 2}
                text-anchor="middle"
                class="sim-plot__label"
                transform={`rotate(-90 12 ${(M.top + H - M.bottom) / 2})`}
              >
                <RichText text={p.yLabel} svg />
              </text>
            )}
          </g>
          <clipPath id={`${id}-c`}>
            <rect x={M.left} y={M.top} width={W - M.left - M.right} height={H - M.top - M.bottom} />
          </clipPath>
          <g clip-path={`url(#${id}-c)`}>
            {paths.map(
              ({ area, color }) =>
                area && <path d={area} style={{ fill: color }} class="sim-plot__area-fill" />,
            )}
            {paths.map(({ d, color, s }) => (
              <path
                d={d}
                fill="none"
                style={{ stroke: color }}
                stroke-width={s.width ?? 2}
                stroke-dasharray={s.dash}
                stroke-linejoin="round"
              />
            ))}
            {(p.markers ?? []).map((m) => (
              <g class="sim-plot__marker">
                {m.y === undefined ? (
                  <line x1={sx(m.x)} x2={sx(m.x)} y1={M.top} y2={H - M.bottom} stroke-dasharray="4 4" />
                ) : (
                  <circle cx={sx(m.x)} cy={sy(m.y)} r="4" />
                )}
                {m.label && (
                  <text x={sx(m.x) + 5} y={m.y === undefined ? M.top + 12 : sy(m.y) - 8}>
                    {m.label}
                  </text>
                )}
              </g>
            ))}
            {ci >= 0 && ref && (
              <g class="sim-plot__cursor">
                <line x1={sx(ref.x[ci]!)} x2={sx(ref.x[ci]!)} y1={M.top} y2={H - M.bottom} />
                {paths.map(({ color, s }) => {
                  const j = nearestIndex(s.x, ref.x[ci]!);
                  return j >= 0 ? (
                    <circle cx={sx(s.x[j]!)} cy={sy(s.y[j]!)} r="4" style={{ fill: color }} />
                  ) : null;
                })}
              </g>
            )}
          </g>
        </svg>
      </div>
      {interactive && (
        <p class="sim-readout" aria-live="polite">
          {readout || ' '}
        </p>
      )}
      {(p.table ?? true) && ref && (
        <details class="sim-data">
          <summary>{simT(p.lang, 'showData')}</summary>
          <div class="sim-data__scroll">
            <table>
              <caption>
                {simT(p.lang, 'data')}: {p.title}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{p.xLabel ?? 'x'}</th>
                  {p.series.map((s) => (
                    <th scope="col">
                      <RichText text={s.label} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => (
                  <tr>
                    <th scope="row">{fx(ref.x[i]!)}</th>
                    {p.series.map((s) => {
                      const j = s === ref ? i : nearestIndex(s.x, ref.x[i]!);
                      return <td>{j >= 0 ? fy(s.y[j]!) : '—'}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </figure>
  );
}

export interface BodePlotProps {
  lang: Lang;
  title: string;
  /** Asse delle ascisse: frequenze [Hz] o pulsazioni [rad/s]. */
  x: ArrayLike<number>;
  axis?: 'freq' | 'omega';
  /** Una o più funzioni di trasferimento già campionate. */
  curves: Array<{
    label: string;
    magDb: ArrayLike<number>;
    phaseDeg: ArrayLike<number>;
    color?: string;
    dash?: string;
  }>;
  markers?: Marker[];
  height?: number;
}

export function BodePlot(p: BodePlotProps): preact.JSX.Element {
  const [cx, setCx] = useState<number | null>(null);
  const xLabel = p.axis === 'omega' ? `${simT(p.lang, 'pulsation')} ω` : `${simT(p.lang, 'frequency')} f`;
  const xUnit = p.axis === 'omega' ? 'rad/s' : 'Hz';
  const fdb = (v: number): string => `${formatNumber(v, 3, p.lang)} dB`;
  const fdeg = (v: number): string => `${formatNumber(v, 3, p.lang)}°`;
  const common = {
    lang: p.lang,
    x: p.x,
    xScale: 'log' as const,
    xLabel,
    xUnit,
    cursorX: cx,
    onCursor: setCx,
    markers: p.markers,
    height: p.height ?? 220,
  };
  return (
    <div class="sim-bode">
      <Plot
        {...common}
        title={`${p.title} — ${simT(p.lang, 'magnitude')}`}
        yLabel={`|H| [dB]`}
        formatY={fdb}
        series={p.curves.map((c) => ({ label: c.label, x: p.x, y: c.magDb, color: c.color, dash: c.dash }))}
      />
      <Plot
        {...common}
        title={`${p.title} — ${simT(p.lang, 'phase')}`}
        yLabel={`∠H [°]`}
        formatY={fdeg}
        series={p.curves.map((c) => ({
          label: c.label,
          x: p.x,
          y: c.phaseDeg,
          color: c.color,
          dash: c.dash,
        }))}
      />
    </div>
  );
}
