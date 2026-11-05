/**
 * Oscilloscopio a due (o più) canali su canvas: reticolo 10×8 divisioni,
 * tempo/divisione, volt/divisione e offset per canale, trigger su livello e
 * fronte (con modalità automatica se il trigger non scatta). I segnali sono
 * funzioni del tempo, quindi il tracciato è sempre nitido a ogni zoom.
 */
import { Canvas2D } from './Canvas2D';
import { grid, polyline } from './draw';
import { simT, type Lang } from './i18n';
import { formatSI } from './units';
import { plain } from './RichText';

export interface ScopeChannel {
  label: string;
  /** Segnale in funzione del tempo [s]. */
  fn: (t: number) => number;
  /** Unità per divisione (default 1). */
  perDiv?: number;
  /** Offset verticale in divisioni. */
  offset?: number;
  unit?: string;
  color?: string;
}

export interface ScopeProps {
  lang: Lang;
  title: string;
  channels: ScopeChannel[];
  /** Secondi per divisione. */
  timePerDiv: number;
  trigger?: { channel: number; level: number; edge?: 'rising' | 'falling' };
  running?: boolean;
  /** Fattore tra tempo reale e tempo del segnale (default: una schermata al secondo). */
  timeScale?: number;
  height?: number;
  resetKey?: number;
}

const NX = 10;
const NY = 8;

/** Primo istante ≥ t0 in cui il segnale attraversa il livello con il fronte richiesto. */
export function findTrigger(
  fn: (t: number) => number,
  t0: number,
  span: number,
  level: number,
  edge: 'rising' | 'falling',
  samples = 2000,
): number | undefined {
  const h = span / samples;
  let prev = fn(t0);
  for (let i = 1; i <= samples; i++) {
    const t = t0 + i * h;
    const v = fn(t);
    if (
      (edge === 'rising' && prev < level && v >= level) ||
      (edge === 'falling' && prev > level && v <= level)
    ) {
      // interpolazione lineare dell'istante di attraversamento
      return t - h + (h * (level - prev)) / (v - prev || 1);
    }
    prev = v;
  }
  return undefined;
}

export function Scope(p: ScopeProps): preact.JSX.Element {
  const window = p.timePerDiv * NX;
  const speed = p.timeScale ?? window;
  const colors = (pal: { series: string[] }, i: number, ch: ScopeChannel): string =>
    ch.color ?? pal.series[i % pal.series.length]!;
  const tr = p.trigger;
  const readout =
    p.channels
      .map(
        (ch, i) =>
          `${simT(p.lang, 'channel')} ${i + 1} (${plain(ch.label)}): ${formatSI(ch.perDiv ?? 1, ch.unit ?? 'V', { lang: p.lang })}/div`,
      )
      .join(', ') +
    `; ${formatSI(p.timePerDiv, 's', { lang: p.lang })}/div` +
    (tr
      ? `; ${simT(p.lang, 'trigger')} ${simT(p.lang, 'channel').toLowerCase()} ${tr.channel + 1}, ${simT(p.lang, tr.edge === 'falling' ? 'falling' : 'rising')}, ${formatSI(tr.level, p.channels[tr.channel]?.unit ?? 'V', { lang: p.lang })}`
      : '');
  return (
    <figure class="sim-scope">
      <Canvas2D
        label={`${p.title || simT(p.lang, 'scope')}. ${readout}`}
        height={p.height ?? 300}
        running={p.running ?? false}
        speed={speed}
        resetKey={p.resetKey}
        deps={[p.channels, p.timePerDiv, tr?.level, tr?.edge, tr?.channel]}
        draw={({ ctx, width, height, t, colors: pal }) => {
          const pad = 6;
          const W = width - 2 * pad;
          const H = height - 2 * pad;
          ctx.fillStyle = pal.surface;
          ctx.fillRect(pad, pad, W, H);
          grid(ctx, pad, pad, W, H, NX, NY, pal.border, 5);
          // istante di inizio della finestra
          let start = t;
          if (tr && p.channels[tr.channel]) {
            const tt = findTrigger(p.channels[tr.channel]!.fn, t, window * 2, tr.level, tr.edge ?? 'rising');
            if (tt !== undefined) start = tt - window / 2;
            // livello di trigger
            const ch = p.channels[tr.channel]!;
            const yl = pad + H / 2 - ((tr.level / (ch.perDiv ?? 1) + (ch.offset ?? 0)) * H) / NY;
            ctx.fillStyle = colors(pal, tr.channel, ch);
            ctx.beginPath();
            ctx.moveTo(pad + W, yl);
            ctx.lineTo(pad + W - 7, yl - 5);
            ctx.lineTo(pad + W - 7, yl + 5);
            ctx.fill();
          }
          const N = Math.max(200, Math.round(W * 1.5));
          const xs = new Float64Array(N);
          const ys = new Float64Array(N);
          p.channels.forEach((ch, i) => {
            const per = ch.perDiv ?? 1;
            for (let k = 0; k < N; k++) {
              const tk = start + (window * k) / (N - 1);
              xs[k] = pad + (W * k) / (N - 1);
              const y = pad + H / 2 - ((ch.fn(tk) / per + (ch.offset ?? 0)) * H) / NY;
              ys[k] = Math.min(Math.max(y, pad - 2), pad + H + 2);
            }
            ctx.save();
            ctx.beginPath();
            ctx.rect(pad, pad, W, H);
            ctx.clip();
            ctx.strokeStyle = colors(pal, i, ch);
            ctx.lineWidth = 2;
            polyline(ctx, xs, ys);
            ctx.restore();
            // marcatore del canale (livello di zero)
            ctx.fillStyle = colors(pal, i, ch);
            ctx.font = '600 11px var(--font-sans, sans-serif)';
            ctx.fillText(String(i + 1), pad + 3, pad + H / 2 - ((ch.offset ?? 0) * H) / NY - 3);
          });
        }}
      />
      <figcaption class="sim-scope__readout">
        {p.channels.map((ch, i) => (
          <span
            class="sim-scope__ch"
            style={{
              '--ch': ch.color ?? `var(--${['accent', 'warning', 'success', 'danger', 'info'][i % 5]})`,
            }}
          >
            {`CH${i + 1} ${plain(ch.label)}: ${formatSI(ch.perDiv ?? 1, ch.unit ?? 'V', { lang: p.lang })}/div`}
          </span>
        ))}
        <span>{`${formatSI(p.timePerDiv, 's', { lang: p.lang })}/div`}</span>
      </figcaption>
    </figure>
  );
}
