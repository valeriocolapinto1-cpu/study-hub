/**
 * Piano dei fasori (SVG): fasori statici o rotanti (moltiplicati per e^{jωt}),
 * catena punta-coda per visualizzare le leggi di Kirchhoff, proiezione sull'asse
 * reale (valore istantaneo). Senza idratazione è un diagramma statico.
 */
import { useMemo } from 'preact/hooks';
import { simT, type Lang } from './i18n';
import { formatNumber } from './units';
import { plain, RichText } from './RichText';

export interface PhasorItem {
  label: string;
  re: number;
  im: number;
  color?: string;
  /** Tratteggiato (es. risultante o riferimento). */
  dash?: boolean;
}

export interface PhasorPlaneProps {
  lang: Lang;
  title: string;
  phasors: PhasorItem[];
  /** Fase aggiuntiva comune in radianti (ωt) per i fasori rotanti. */
  angle?: number;
  /** Disegna in catena punta-coda (somma vettoriale) invece che dall'origine. */
  chain?: boolean;
  /** Mostra le proiezioni sull'asse reale (valori istantanei). */
  projection?: boolean;
  /** Modulo corrispondente al raggio del cerchio guida (default: il massimo). */
  scale?: number;
  /** Lato in pixel del riquadro (SVG scalabile). */
  size?: number;
  /** Unità per la descrizione testuale (es. "V"). */
  unit?: string;
}

const PALETTE = ['var(--accent)', 'var(--warning)', 'var(--success)', 'var(--danger)', 'var(--info)'];

export function PhasorPlane(p: PhasorPlaneProps): preact.JSX.Element {
  const S = p.size ?? 320;
  const c = S / 2;
  const R = S / 2 - 30;
  const ang = p.angle ?? 0;
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const rot = p.phasors.map((f) => ({ ...f, x: f.re * ca - f.im * sa, y: f.re * sa + f.im * ca }));
  const max = useMemo(() => {
    if (p.scale) return p.scale;
    if (p.chain) {
      let x = 0;
      let y = 0;
      let m = 0;
      for (const f of p.phasors) {
        x += f.re;
        y += f.im;
        m = Math.max(m, Math.hypot(x, y), Math.hypot(f.re, f.im));
      }
      return m || 1;
    }
    return Math.max(1e-12, ...p.phasors.map((f) => Math.hypot(f.re, f.im)));
  }, [p.phasors, p.scale, p.chain]);
  const k = R / max;
  let ox = 0;
  let oy = 0;
  const arrows = rot.map((f, i) => {
    const x0 = p.chain ? ox : 0;
    const y0 = p.chain ? oy : 0;
    if (p.chain) {
      ox += f.x;
      oy += f.y;
    }
    return { ...f, x0, y0, color: f.color ?? PALETTE[i % PALETTE.length]! };
  });
  const desc = p.phasors
    .map(
      (f) =>
        `${plain(f.label)} = ${formatNumber(Math.hypot(f.re, f.im), 3, p.lang)}${p.unit ? ' ' + p.unit : ''} ∠ ${formatNumber((Math.atan2(f.im, f.re) * 180) / Math.PI, 3, p.lang)}°`,
    )
    .join('; ');
  const X = (v: number): number => c + v * k;
  const Y = (v: number): number => c - v * k;
  return (
    <figure class="sim-phasor">
      <svg
        viewBox={`0 0 ${S} ${S}`}
        width="100%"
        style={{ maxWidth: `${S}px` }}
        role="img"
        aria-label={`${p.title || simT(p.lang, 'phasorDiagram')}: ${desc}`}
      >
        <defs>
          {arrows.map((a, i) => (
            <marker
              id={`ph-${i}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0 0L10 5L0 10z" style={{ fill: a.color }} />
            </marker>
          ))}
        </defs>
        <g class="sim-phasor__axes">
          <circle cx={c} cy={c} r={R} fill="none" stroke-dasharray="3 4" />
          <line x1={8} y1={c} x2={S - 8} y2={c} />
          <line x1={c} y1={8} x2={c} y2={S - 8} />
          <text x={S - 10} y={c - 6} text-anchor="end">
            {simT(p.lang, 'real')}
          </text>
          <text x={c + 6} y={16}>
            {simT(p.lang, 'imag')}
          </text>
        </g>
        {p.projection &&
          arrows.map((a) => (
            <g class="sim-phasor__proj">
              <line
                x1={X(a.x0 + a.x)}
                y1={Y(a.y0 + a.y)}
                x2={X(a.x0 + a.x)}
                y2={c}
                style={{ stroke: a.color }}
              />
              <circle cx={X(a.x0 + a.x)} cy={c} r="3.5" style={{ fill: a.color }} />
            </g>
          ))}
        {arrows.map((a, i) => (
          <g>
            <line
              x1={X(a.x0)}
              y1={Y(a.y0)}
              x2={X(a.x0 + a.x)}
              y2={Y(a.y0 + a.y)}
              style={{ stroke: a.color }}
              stroke-width="2.4"
              stroke-dasharray={a.dash ? '6 4' : undefined}
              marker-end={Math.hypot(a.x, a.y) * k > 4 ? `url(#ph-${i})` : undefined}
            />
            <text
              x={X(a.x0 + a.x * 1.0) + (a.x >= 0 ? 6 : -6)}
              y={Y(a.y0 + a.y) + (a.y >= 0 ? -6 : 14)}
              text-anchor={a.x >= 0 ? 'start' : 'end'}
              class="sim-phasor__label"
              style={{ fill: a.color }}
            >
              <RichText text={a.label} svg />
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}
