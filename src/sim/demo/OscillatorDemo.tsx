/** Demo: moto armonico (massa e molla) con grafico x(t) che scorre — Canvas2D + Controls. */
import { useRef, useState } from 'preact/hooks';
import { Canvas2D } from '../Canvas2D';
import { Controls } from '../Controls';
import { useReducedMotion } from '../hooks';
import { Slider } from '../Slider';
import { formatNumber, type Lang } from '../units';
import '../sim.css';

const T = {
  it: {
    title: 'Moto armonico semplice',
    a: 'Ampiezza A',
    w: 'Pulsazione ω',
    alt: 'Massa appesa a una molla che oscilla e grafico della posizione nel tempo',
  },
  en: {
    title: 'Simple harmonic motion',
    a: 'Amplitude A',
    w: 'Angular frequency ω',
    alt: 'Mass on a spring oscillating and plot of its position over time',
  },
};

export default function OscillatorDemo({ lang }: { lang: Lang }): preact.JSX.Element {
  const t = T[lang];
  const reduced = useReducedMotion();
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [A, setA] = useState(0.7);
  const [w, setW] = useState(2);
  const [reset, setReset] = useState(0);
  const hist = useRef<number[]>([]);
  return (
    <section class="sim" aria-labelledby="demo-osc">
      <h3 class="sim__title" id="demo-osc">
        {t.title}
      </h3>
      <div class="sim__panel">
        <Slider lang={lang} label={t.a} value={A} min={0.1} max={1} step={0.01} unit="m" onInput={setA} />
        <Slider lang={lang} label={t.w} value={w} min={0.5} max={4} step={0.05} unit="rad/s" onInput={setW} />
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
        label={`${t.alt}. T = ${formatNumber((2 * Math.PI) / w, 3, lang)} s`}
        height={220}
        running={running}
        speed={speed}
        resetKey={reset}
        deps={[A, w]}
        draw={({ ctx, width, height, t: time, dt, colors }) => {
          const x = A * Math.cos(w * time);
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
          // molla
          ctx.strokeStyle = colors.muted;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(mx, 10);
          const n = 10;
          for (let i = 1; i <= n; i++) ctx.lineTo(mx + (i % 2 ? 9 : -9), 10 + ((my - 22) * i) / (n + 1));
          ctx.lineTo(mx, my - 14);
          ctx.stroke();
          ctx.fillStyle = colors.accent;
          ctx.fillRect(mx - 16, my - 14, 32, 28);
          // traccia x(t)
          const h = hist.current;
          ctx.strokeStyle = colors.accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          const x0 = 100;
          const step = (width - x0 - 10) / 400;
          if (h.length === 0) {
            // fotogramma statico: curva completa
            for (let i = 0; i <= 400; i++) {
              const tt = (i - 400) / 60;
              const y = cy - A * Math.cos(w * tt) * k;
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
          ctx.fillText(`x = ${formatNumber(x, 2, lang)} m`, width - 110, 18);
        }}
      />
    </section>
  );
}
