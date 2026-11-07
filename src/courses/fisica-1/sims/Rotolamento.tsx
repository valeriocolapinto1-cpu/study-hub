/**
 * Simulazione «Rotolamento»: campo delle velocità v = v_cm + ω × r su una ruota che rotola
 * senza strisciare. Il punto di contatto ha velocità nulla, la cima 2v.
 */
import { useState } from 'preact/hooks';
import { Canvas2D } from '../../../sim/Canvas2D';
import { Controls } from '../../../sim/Controls';
import { arrow } from '../../../sim/draw';
import { useReducedMotion } from '../../../sim/hooks';
import { Slider } from '../../../sim/Slider';
import { formatNumber, type Lang } from '../../../sim/units';
import '../../../sim/sim.css';
import { useAutoplay } from './autoplay';

const T = {
  it: {
    v: 'Velocità del centro v',
    alt: 'Ruota che rotola su un piano con i vettori velocità di cinque punti: centro, cima, contatto, davanti e dietro',
    names: { top: 'cima (2v)', contact: 'contatto (v = 0)', center: 'centro (v)' },
    note: 'Ogni punto ha velocità v_cm + ω × r. Il punto di contatto è istantaneamente fermo: per questo l’attrito statico non compie lavoro.',
  },
  en: {
    v: 'Speed of the centre v',
    alt: 'Wheel rolling on a plane with the velocity vectors of five points: centre, top, contact, front and back',
    names: { top: 'top (2v)', contact: 'contact (v = 0)', center: 'centre (v)' },
    note: 'Every point has velocity v_cm + ω × r. The contact point is instantaneously at rest: this is why static friction does no work.',
  },
};

export default function Rotolamento({ lang }: { lang: Lang }): preact.JSX.Element {
  const t = T[lang];
  const reduced = useReducedMotion();
  const [running, setRunning] = useAutoplay();
  const [v, setV] = useState(1);
  const [reset, setReset] = useState(0);
  return (
    <div class="sim">
      <div class="sim__panel">
        <Slider
          lang={lang}
          label={t.v}
          value={v}
          min={0.5}
          max={2}
          step={0.05}
          format={(v) => `${formatNumber(v, 3, lang)} m/s`}
          onInput={setV}
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
        label={`${t.alt}. v = ${formatNumber(v, 2, lang)} m/s`}
        height={240}
        running={running}
        resetKey={reset}
        deps={[v]}
        draw={({ ctx, width, height, t: time, colors }) => {
          const R = 60;
          const ground = height - 30;
          const px = 60; // pixel per metro
          const travel = width - 2 * R - 20;
          const xc = R + 10 + ((v * px * time) % travel);
          const yc = ground - R;
          const omega = (v * px) / R; // rad/s in pixel
          const phi = omega * time;
          ctx.strokeStyle = colors.border;
          ctx.beginPath();
          ctx.moveTo(0, ground);
          ctx.lineTo(width, ground);
          ctx.stroke();
          ctx.strokeStyle = colors.text;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(xc, yc, R, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.lineWidth = 1;
          for (let k = 0; k < 4; k++) {
            const a = phi + (k * Math.PI) / 2;
            ctx.beginPath();
            ctx.moveTo(xc, yc);
            ctx.lineTo(xc + R * Math.cos(a), yc + R * Math.sin(a));
            ctx.stroke();
          }
          const kv = (0.55 * R) / (v * px); // scala visiva: la velocità del centro è lunga 0,55 R
          const points = [
            { dx: 0, dy: 0, name: t.names.center },
            { dx: 0, dy: -R, name: t.names.top },
            { dx: 0, dy: R, name: t.names.contact },
            { dx: R, dy: 0, name: '' },
            { dx: -R, dy: 0, name: '' },
          ];
          ctx.font = '12px var(--font-sans, sans-serif)';
          for (const p of points) {
            // v = v_cm x̂ + ω × r (ω entrante nel foglio per moto verso destra): (−ω·dy, ω·dx) in pixel/s
            const vx = v * px + omega * -p.dy;
            const vy = omega * p.dx;
            const x1 = xc + p.dx;
            const y1 = yc + p.dy;
            arrow(ctx, x1, y1, x1 + vx * kv, y1 + vy * kv, colors.accent, 2.5);
            ctx.fillStyle = colors.accent;
            ctx.beginPath();
            ctx.arc(x1, y1, 3.5, 0, 2 * Math.PI);
            ctx.fill();
            if (p.name) {
              ctx.fillStyle = colors.muted;
              ctx.fillText(p.name, x1 + 8, y1 + (p.dy >= 0 ? 18 : -10));
            }
          }
        }}
      />
      <p class="sim-note">{t.note}</p>
    </div>
  );
}
