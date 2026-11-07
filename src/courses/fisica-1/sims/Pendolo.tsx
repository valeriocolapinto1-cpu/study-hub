/**
 * Simulazione «Pendolo»: pendolo reale (equazione esatta, integrazione semi-implicita)
 * a confronto con l'oscillatore armonico ideale; periodo reale e scarto percentuale.
 */
import { useMemo, useRef, useState } from 'preact/hooks';
import { Canvas2D } from '../../../sim/Canvas2D';
import { Controls } from '../../../sim/Controls';
import { useReducedMotion } from '../../../sim/hooks';
import { Slider } from '../../../sim/Slider';
import { formatNumber, type Lang } from '../../../sim/units';
import '../../../sim/sim.css';
import { useAutoplay } from './autoplay';

const G = 9.81;
const T = {
  it: {
    l: 'Lunghezza L',
    th: 'Ampiezza θ₀',
    alt: 'Pendolo reale (pieno) e pendolo armonico ideale (contorno) che partono dallo stesso angolo',
    t0: 'T piccole oscillazioni',
    tr: 'T reale',
    note: 'A piccoli angoli i due pendoli restano sovrapposti; oltre una trentina di gradi quello reale resta indietro: l’isocronismo cede.',
  },
  en: {
    l: 'Length L',
    th: 'Amplitude θ₀',
    alt: 'Real pendulum (filled) and ideal harmonic pendulum (outline) starting from the same angle',
    t0: 'Small-oscillation T',
    tr: 'Real T',
    note: 'At small angles the two pendulums stay together; beyond about thirty degrees the real one lags behind: isochronism breaks down.',
  },
};

/** Periodo esatto del pendolo (media aritmetico-geometrica): T = T₀ / AGM(1, cos(θ₀/2)). */
export function exactPeriod(L: number, theta0: number): number {
  let a = 1;
  let b = Math.cos(theta0 / 2);
  for (let i = 0; i < 20; i++) [a, b] = [(a + b) / 2, Math.sqrt(a * b)];
  return (2 * Math.PI * Math.sqrt(L / G)) / a;
}

export default function Pendolo({ lang }: { lang: Lang }): preact.JSX.Element {
  const t = T[lang];
  const reduced = useReducedMotion();
  const [running, setRunning] = useAutoplay();
  const [L, setL] = useState(1);
  const [th, setTh] = useState(20);
  const [reset, setReset] = useState(0);
  const state = useRef({ q: 0, w: 0, init: false });
  const T0 = 2 * Math.PI * Math.sqrt(L / G);
  const Tr = useMemo(() => exactPeriod(L, (th * Math.PI) / 180), [L, th]);
  const pct = (100 * (Tr - T0)) / T0;
  return (
    <div class="sim">
      <div class="sim__panel">
        <Slider
          lang={lang}
          label={t.l}
          value={L}
          min={0.5}
          max={2}
          step={0.05}
          format={(v) => `${formatNumber(v, 3, lang)} m`}
          onInput={setL}
        />
        <Slider
          lang={lang}
          label={t.th}
          value={th}
          min={5}
          max={170}
          step={1}
          format={(v) => `${v.toFixed(0)}°`}
          onInput={setTh}
        />
      </div>
      <Controls
        lang={lang}
        running={running}
        onToggle={() => setRunning((r) => !r)}
        onReset={() => {
          state.current.init = false;
          setReset((k) => k + 1);
        }}
        reducedMotion={reduced}
      />
      <Canvas2D
        label={`${t.alt}. ${t.t0} ${formatNumber(T0, 3, lang)} s, ${t.tr} ${formatNumber(Tr, 3, lang)} s`}
        height={260}
        running={running}
        resetKey={reset}
        deps={[L, th]}
        draw={({ ctx, width, height, t: time, dt, colors }) => {
          const th0 = (th * Math.PI) / 180;
          const s = state.current;
          if (!s.init || time === 0) {
            s.q = th0;
            s.w = 0;
            s.init = true;
          }
          // integrazione semi-implicita (simplettica) a passi piccoli
          const n = Math.max(1, Math.ceil(dt / 0.002));
          for (let i = 0; i < n; i++) {
            const h = dt / n;
            s.w += -(G / L) * Math.sin(s.q) * h;
            s.q += s.w * h;
          }
          const qLin = th0 * Math.cos(Math.sqrt(G / L) * time);
          const px = width / 2;
          const py = 20;
          const len = Math.min(height - 50, 200) * (L / 2);
          const bob = (q: number) => [px + len * Math.sin(q), py + len * Math.cos(q)] as const;
          ctx.strokeStyle = colors.border;
          ctx.beginPath();
          ctx.moveTo(px - 40, py);
          ctx.lineTo(px + 40, py);
          ctx.stroke();
          const [lx, ly] = bob(qLin);
          ctx.strokeStyle = colors.muted;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(lx, ly);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(lx, ly, 12, 0, 2 * Math.PI);
          ctx.stroke();
          const [rx, ry] = bob(s.q);
          ctx.strokeStyle = colors.text;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(rx, ry);
          ctx.stroke();
          ctx.fillStyle = colors.accent;
          ctx.beginPath();
          ctx.arc(rx, ry, 12, 0, 2 * Math.PI);
          ctx.fill();
          ctx.fillStyle = colors.muted;
          ctx.font = '12px var(--font-sans, sans-serif)';
          ctx.fillText(`${t.t0}: ${formatNumber(T0, 3, lang)} s`, 10, height - 28);
          ctx.fillText(
            `${t.tr}: ${formatNumber(Tr, 3, lang)} s (+${formatNumber(pct, 2, lang)} %)`,
            10,
            height - 10,
          );
        }}
      />
      <p class="sim-note">{t.note}</p>
    </div>
  );
}
