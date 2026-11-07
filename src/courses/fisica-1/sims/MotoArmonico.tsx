/** Simulazione «Moto armonico»: massa su molla e traccia x(t) che scorre; A, ω, φ regolabili. */
import { useRef, useState } from 'preact/hooks';
import { Canvas2D } from '../../../sim/Canvas2D';
import { Controls } from '../../../sim/Controls';
import { useReducedMotion } from '../../../sim/hooks';
import { Slider } from '../../../sim/Slider';
import { formatNumber, type Lang } from '../../../sim/units';
import '../../../sim/sim.css';
import { useAutoplay } from './autoplay';

const T = {
  it: {
    a: 'Ampiezza A',
    w: 'Pulsazione ω',
    f: 'Fase iniziale φ',
    alt: 'Massa che oscilla appesa a una molla, con il grafico della posizione x(t) che si disegna in tempo reale',
    note: 'Cambiare A non cambia il periodo: il moto armonico è isocrono.',
  },
  en: {
    a: 'Amplitude A',
    w: 'Angular frequency ω',
    f: 'Initial phase φ',
    alt: 'Mass oscillating on a spring, with the position plot x(t) drawn in real time',
    note: 'Changing A does not change the period: harmonic motion is isochronous.',
  },
};

export default function MotoArmonico({ lang }: { lang: Lang }): preact.JSX.Element {
  const t = T[lang];
  const reduced = useReducedMotion();
  const [running, setRunning] = useAutoplay();
  const [speed, setSpeed] = useState(1);
  const [A, setA] = useState(0.7);
  const [w, setW] = useState(2);
  const [phi, setPhi] = useState(0);
  const [reset, setReset] = useState(0);
  const hist = useRef<number[]>([]);
  const T0 = (2 * Math.PI) / w;
  return (
    <div class="sim">
      <div class="sim__panel">
        <Slider
          lang={lang}
          label={t.a}
          value={A}
          min={0.2}
          max={1}
          step={0.01}
          format={(v) => `${formatNumber(v, 3, lang)} m`}
          onInput={setA}
        />
        <Slider
          lang={lang}
          label={t.w}
          value={w}
          min={0.5}
          max={4}
          step={0.05}
          format={(v) => `${formatNumber(v, 3, lang)} rad/s`}
          onInput={setW}
        />
        <Slider
          lang={lang}
          label={t.f}
          value={phi}
          min={0}
          max={6.28}
          step={0.01}
          format={(v) => `${formatNumber(v, 3, lang)} rad`}
          onInput={setPhi}
        />
      </div>
      <Controls
        lang={lang}
        running={running}
        onToggle={() => setRunning((r) => !r)}
        onReset={() => {
          hist.current = [];
          setReset((k) => k + 1);
        }}
        speed={speed}
        speeds={[0.25, 0.5, 1, 2]}
        onSpeed={setSpeed}
        reducedMotion={reduced}
      />
      <Canvas2D
        label={`${t.alt}. T = ${formatNumber(T0, 3, lang)} s`}
        height={220}
        running={running}
        speed={speed}
        resetKey={reset}
        deps={[A, w, phi]}
        draw={({ ctx, width, height, t: time, dt, colors }) => {
          const x = A * Math.cos(w * time + phi);
          if (dt > 0) {
            hist.current.push(x);
            if (hist.current.length > 400) hist.current.shift();
          }
          const cy = height / 2;
          const k = height / 2 - 24;
          const mx = 50;
          const my = cy - x * k;
          ctx.strokeStyle = colors.border;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(100, cy);
          ctx.lineTo(width - 8, cy);
          ctx.stroke();
          ctx.strokeStyle = colors.muted;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(mx, 6);
          for (let i = 1; i <= 10; i++) ctx.lineTo(mx + (i % 2 ? 9 : -9), 6 + ((my - 20) * i) / 11);
          ctx.lineTo(mx, my - 14);
          ctx.stroke();
          ctx.fillStyle = colors.accent;
          ctx.fillRect(mx - 16, my - 14, 32, 28);
          const h = hist.current;
          const x0 = 100;
          const step = (width - x0 - 10) / 400;
          ctx.strokeStyle = colors.accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          if (h.length === 0) {
            for (let i = 0; i <= 400; i++) {
              const y = cy - A * Math.cos((w * (i - 400)) / 60 + phi) * k;
              if (i === 0) ctx.moveTo(x0 + i * step, y);
              else ctx.lineTo(x0 + i * step, y);
            }
          } else
            h.forEach((v, i) => {
              const px = x0 + (400 - h.length + i) * step;
              if (i === 0) ctx.moveTo(px, cy - v * k);
              else ctx.lineTo(px, cy - v * k);
            });
          ctx.stroke();
          ctx.fillStyle = colors.muted;
          ctx.font = '12px var(--font-sans, sans-serif)';
          ctx.fillText(`T = ${formatNumber(T0, 3, lang)} s`, width - 120, 18);
          ctx.fillText(`x = ${formatNumber(x, 2, lang)} m`, width - 120, 34);
        }}
      />
      <p class="sim-note">{t.note}</p>
    </div>
  );
}
