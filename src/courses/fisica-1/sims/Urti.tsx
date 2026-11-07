/**
 * Simulazione «Urti centrali»: m₁ arriva a 2 m/s su m₂ ferma; rapporto delle masse e
 * coefficiente di restituzione e regolabili; energia cinetica conservata dopo l'urto.
 */
import { useRef, useState } from 'preact/hooks';
import { Canvas2D } from '../../../sim/Canvas2D';
import { Controls } from '../../../sim/Controls';
import { useReducedMotion } from '../../../sim/hooks';
import { Slider } from '../../../sim/Slider';
import { formatNumber, type Lang } from '../../../sim/units';
import '../../../sim/sim.css';
import { useAutoplay } from './autoplay';

const V1 = 2;
const T = {
  it: {
    m: 'Rapporto delle masse m₂/m₁',
    e: 'Restituzione e',
    alt: 'Due carrelli su una rotaia: il primo urta il secondo, fermo',
    kept: 'K conservata',
    note: 'e = 1: urto elastico (masse uguali → si scambiano le velocità). e = 0: perfettamente anelastico (proseguono insieme alla velocità del centro di massa). La quantità di moto si conserva sempre.',
  },
  en: {
    m: 'Mass ratio m₂/m₁',
    e: 'Restitution e',
    alt: 'Two carts on a track: the first hits the second, at rest',
    kept: 'K kept',
    note: 'e = 1: elastic collision (equal masses → they exchange velocities). e = 0: perfectly inelastic (they move on together at the centre-of-mass velocity). Momentum is always conserved.',
  },
};

/** Velocità dopo un urto centrale con coefficiente di restituzione e. */
export function collide(m1: number, m2: number, v1: number, v2: number, e: number): [number, number] {
  const P = m1 * v1 + m2 * v2;
  return [(P - m2 * e * (v1 - v2)) / (m1 + m2), (P + m1 * e * (v1 - v2)) / (m1 + m2)];
}

export default function Urti({ lang }: { lang: Lang }): preact.JSX.Element {
  const t = T[lang];
  const reduced = useReducedMotion();
  const [running, setRunning] = useAutoplay();
  const [ratio, setRatio] = useState(1);
  const [e, setE] = useState(1);
  const [reset, setReset] = useState(0);
  const s = useRef({ x1: 0.5, x2: 3, v1: V1, v2: 0, hit: false, last: 0 });
  const [u1, u2] = collide(1, ratio, V1, 0, e);
  const kept = (u1 * u1 + ratio * u2 * u2) / (V1 * V1);
  return (
    <div class="sim">
      <div class="sim__panel">
        <Slider
          lang={lang}
          label={t.m}
          value={ratio}
          min={0.2}
          max={5}
          step={0.1}
          format={(v) => formatNumber(v, 2, lang)}
          onInput={setRatio}
        />
        <Slider
          lang={lang}
          label={t.e}
          value={e}
          min={0}
          max={1}
          step={0.05}
          format={(v) => formatNumber(v, 2, lang)}
          onInput={setE}
        />
      </div>
      <Controls
        lang={lang}
        running={running}
        onToggle={() => setRunning((r) => !r)}
        onReset={() => setReset((k) => k + 1)}
        reducedMotion={reduced}
      />
      <Canvas2D
        label={`${t.alt}. v₁' = ${formatNumber(u1, 3, lang)} m/s, v₂' = ${formatNumber(u2, 3, lang)} m/s, ${t.kept} ${Math.round(100 * kept)} %`}
        height={160}
        running={running}
        resetKey={reset}
        deps={[ratio, e]}
        draw={({ ctx, width, height, t: time, dt, colors }) => {
          const st = s.current;
          const restart = () => Object.assign(st, { x1: 0.5, x2: 3, v1: V1, v2: 0, hit: false, last: time });
          if (time === 0) restart();
          const w1 = 0.4;
          const w2 = 0.4 * Math.cbrt(ratio);
          st.x1 += st.v1 * dt;
          st.x2 += st.v2 * dt;
          if (!st.hit && st.x1 + w1 / 2 >= st.x2 - w2 / 2) {
            [st.v1, st.v2] = collide(1, ratio, st.v1, st.v2, e);
            st.hit = true;
          }
          if (st.x2 > 7 || st.x1 < -1 || time - st.last > 8) restart();
          const scale = width / 6;
          const y = height - 40;
          ctx.strokeStyle = colors.border;
          ctx.beginPath();
          ctx.moveTo(0, y + 2);
          ctx.lineTo(width, y + 2);
          ctx.stroke();
          const box = (x: number, w: number, c: string, label: string) => {
            const h = 30 * (w / 0.4);
            ctx.fillStyle = c;
            ctx.fillRect((x - w / 2) * scale, y - h, w * scale, h);
            ctx.fillStyle = colors.bg;
            ctx.font = '600 12px var(--font-sans, sans-serif)';
            ctx.fillText(label, x * scale - 8, y - h / 2 + 4);
          };
          box(st.x1, w1, colors.accent, 'm₁');
          box(st.x2, w2, colors.series[1] ?? colors.info, 'm₂');
          ctx.fillStyle = colors.muted;
          ctx.font = '12px var(--font-sans, sans-serif)';
          ctx.fillText(`m₁: v = ${formatNumber(st.v1, 3, lang)} m/s`, 10, 18);
          ctx.fillText(`m₂: v = ${formatNumber(st.v2, 3, lang)} m/s`, 10, 34);
          if (st.hit) ctx.fillText(`${t.kept}: ${Math.round(100 * kept)} %`, width - 140, 18);
        }}
      />
      <p class="sim-note">{t.note}</p>
    </div>
  );
}
