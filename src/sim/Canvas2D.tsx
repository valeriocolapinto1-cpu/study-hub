/**
 * Canvas nitido (devicePixelRatio) che si adatta alla larghezza del contenitore,
 * con palette dai token e animazione facoltativa. Con prefers-reduced-motion
 * l'animazione parte ferma (si disegna un solo fotogramma) finché l'utente non
 * preme Avvia nei Controls. Il testo alternativo è obbligatorio.
 */
import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { readPalette, type Palette } from './draw';
import { useAnimationFrame, useElementSize, useThemeVersion } from './hooks';

export interface DrawInfo {
  ctx: CanvasRenderingContext2D;
  /** Dimensioni in pixel CSS. */
  width: number;
  height: number;
  dpr: number;
  /** Tempo di animazione [s] (somma dei dt mentre l'animazione è attiva). */
  t: number;
  /** Intervallo dall'ultimo fotogramma [s]. */
  dt: number;
  colors: Palette;
}

export interface Canvas2DProps {
  /** Disegna un fotogramma (il contesto è già scalato e pulito). */
  draw: (info: DrawInfo) => void;
  /** Altezza in pixel CSS, oppure rapporto larghezza/altezza con `aspect`. */
  height?: number;
  aspect?: number;
  /** Anima con requestAnimationFrame mentre è vero. */
  running?: boolean;
  /** Fattore sul tempo di animazione (velocità). */
  speed?: number;
  /** Ridisegna quando cambia (parametri della simulazione). */
  deps?: readonly unknown[];
  /** Testo alternativo (aria-label). */
  label: string;
  /** Descrizione testuale più lunga, letta dai lettori di schermo. */
  children?: ComponentChildren;
  class?: string;
  /** Tempo azzerato quando cambia questo valore (reset). */
  resetKey?: number;
}

export function Canvas2D(props: Canvas2DProps): preact.JSX.Element {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { width } = useElementSize(wrap);
  const theme = useThemeVersion();
  const height = props.height ?? Math.round(width / (props.aspect ?? 16 / 9));
  const time = useRef(0);
  const palette = useRef<Palette | null>(null);

  const paint = (dt: number): void => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 3);
    const W = Math.max(1, Math.round(width));
    const H = Math.max(1, Math.round(height));
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    }
    palette.current ??= readPalette(cv);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    props.draw({ ctx, width: W, height: H, dpr, t: time.current, dt, colors: palette.current });
  };

  useEffect(() => {
    time.current = 0;
  }, [props.resetKey]);
  useEffect(() => {
    palette.current = null;
  }, [theme]);
  // ridisegno statico: dimensioni, tema, parametri
  useEffect(() => {
    paint(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, theme, props.resetKey, ...(props.deps ?? [])]);
  useAnimationFrame(
    (dt) => {
      const d = dt * (props.speed ?? 1);
      time.current += d;
      paint(d);
    },
    props.running ?? false,
    wrap,
  );

  return (
    <div ref={wrap} class={`sim-canvas${props.class ? ` ${props.class}` : ''}`}>
      <canvas
        ref={canvas}
        role="img"
        aria-label={props.label}
        style={{ width: '100%', height: `${height}px` }}
      >
        {props.children}
      </canvas>
    </div>
  );
}
