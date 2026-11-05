import type { JSX } from 'preact';
import { useReducedMotion } from '~/lib/useReducedMotion';

/** Piste del datapath: gli stessi tracciati del prototipo. */
const TRACES = [
  { d: 'M0,80 H360 V150 H720 V90 H1200', dur: '6s', fill: 'url(#aefin-signal)', r: 4 },
  { d: 'M0,180 H220 V240 H560 V180 H900 V250 H1200', dur: '8s', fill: '#C88A4E', r: 4 },
  { d: 'M0,300 H480 V240 H820 V300 H1200', dur: '7s', fill: '#37C2D6', r: 3.5 },
] as const;

/** Piazzole di contatto lungo le piste. */
const PADS = [
  [352, 142],
  [712, 82],
  [212, 232],
  [552, 172],
  [472, 232],
  [812, 292],
] as const;

/**
 * `<animateMotion path=…>` è SVG valido ma manca dai tipi JSX di Preact:
 * un unico cast circoscritto qui, invece di allentare i tipi altrove.
 */
function motionProps(dur: string, path: string): JSX.SVGAttributes<SVGAnimateMotionElement> {
  return { dur, repeatCount: 'indefinite', path } as JSX.SVGAttributes<SVGAnimateMotionElement>;
}

/**
 * Elemento *signature* del design: substrato a griglia con segnali che
 * scorrono lungo le piste. Con `prefers-reduced-motion` i pallini animati
 * non vengono renderizzati affatto — le animazioni SMIL ignorano le media
 * query CSS, quindi vanno tenute fuori dal DOM, non solo fermate.
 */
export function DatapathHero(): JSX.Element {
  const reduced = useReducedMotion();

  return (
    <svg
      class="trace"
      viewBox="0 0 1200 380"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="aefin-signal" x1="0" x2="1">
          <stop offset="0" stop-color="#37C2D6" stop-opacity="0" />
          <stop offset=".5" stop-color="#37C2D6" stop-opacity=".8" />
          <stop offset="1" stop-color="#37C2D6" stop-opacity="0" />
        </linearGradient>
      </defs>

      <g stroke="#2A3542" stroke-width="1.4" fill="none">
        {TRACES.map((trace) => (
          <path key={trace.d} d={trace.d} />
        ))}
        <path d="M300,0 V150 M720,90 V0 M560,180 V380 M900,250 V380" />
      </g>

      <g fill="#C88A4E">
        {PADS.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="16" height="16" rx="2" />
        ))}
      </g>

      {!reduced &&
        TRACES.map((trace) => (
          <circle key={trace.d} r={trace.r} fill={trace.fill}>
            <animateMotion {...motionProps(trace.dur, trace.d)} />
          </circle>
        ))}
    </svg>
  );
}
