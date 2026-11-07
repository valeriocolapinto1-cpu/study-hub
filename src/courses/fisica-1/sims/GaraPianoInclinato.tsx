/**
 * Simulazione «Gara sul piano inclinato»: sfera (β = 2/5), disco (β = 1/2) e anello (β = 1)
 * partono insieme e rotolano senza strisciare: a = g sinθ/(1+β), indipendente da massa e raggio.
 */
import { useState } from 'preact/hooks';
import { Canvas2D } from '../../../sim/Canvas2D';
import { Controls } from '../../../sim/Controls';
import { useReducedMotion } from '../../../sim/hooks';
import { Slider } from '../../../sim/Slider';
import { formatNumber, type Lang } from '../../../sim/units';
import '../../../sim/sim.css';
import { useAutoplay } from './autoplay';

const G = 9.81;
const TRACK = 3; // m
const BODIES = [
  { beta: 2 / 5, it: 'Sfera', en: 'Sphere' },
  { beta: 1 / 2, it: 'Disco', en: 'Disc' },
  { beta: 1, it: 'Anello', en: 'Ring' },
] as const;
const T = {
  it: {
    th: 'Inclinazione θ',
    alt: 'Tre corpi che rotolano su tre piste parallele; il traguardo è a 3 metri',
    note: 'Vince chi ha meno inerzia rotazionale relativa β = I/(MR²): la sfera batte il disco che batte l’anello, qualunque siano massa e raggio.',
  },
  en: {
    th: 'Inclination θ',
    alt: 'Three bodies rolling on three parallel tracks; the finish line is 3 metres away',
    note: 'The body with the least relative rotational inertia β = I/(MR²) wins: the sphere beats the disc, which beats the ring, whatever their mass and radius.',
  },
};

export default function GaraPianoInclinato({ lang }: { lang: Lang }): preact.JSX.Element {
  const t = T[lang];
  const reduced = useReducedMotion();
  const [running, setRunning] = useAutoplay();
  const [th, setTh] = useState(18);
  const [reset, setReset] = useState(0);
  const acc = BODIES.map((b) => (G * Math.sin((th * Math.PI) / 180)) / (1 + b.beta));
  const times = acc.map((a) => Math.sqrt((2 * TRACK) / a));
  return (
    <div class="sim">
      <div class="sim__panel">
        <Slider
          lang={lang}
          label={t.th}
          value={th}
          min={5}
          max={30}
          step={1}
          format={(v) => `${v.toFixed(0)}°`}
          onInput={setTh}
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
        label={`${t.alt}. ${BODIES.map((b, i) => `${b[lang]}: a = ${formatNumber(acc[i]!, 3, lang)} m/s², t = ${formatNumber(times[i]!, 3, lang)} s`).join('; ')}`}
        height={220}
        running={running}
        resetKey={reset}
        deps={[th]}
        draw={({ ctx, width, height, t: time, colors }) => {
          // ricomincia la gara 1 s dopo l'arrivo dell'ultimo
          const cycle = times[2]! + 1;
          const tt = time % cycle;
          const margin = 70;
          const lane = (height - 20) / 3;
          const scale = (width - margin - 30) / TRACK;
          ctx.font = '12px var(--font-sans, sans-serif)';
          BODIES.forEach((b, i) => {
            const y = 20 + lane * i + lane / 2 + 10;
            const s = Math.min(TRACK, 0.5 * acc[i]! * tt * tt);
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(margin, y + 12);
            ctx.lineTo(width - 20, y + 12);
            ctx.stroke();
            const cx = margin + s * scale;
            const R = 11;
            ctx.strokeStyle = colors.series[i] ?? colors.accent;
            ctx.fillStyle = colors.series[i] ?? colors.accent;
            ctx.lineWidth = b.beta === 1 ? 4 : 2;
            ctx.beginPath();
            ctx.arc(cx, y, R, 0, 2 * Math.PI);
            if (b.beta === 1) ctx.stroke();
            else ctx.fill();
            // raggio-marcatore che ruota con φ = s/R (rotolamento)
            const phi = (s * scale) / R;
            ctx.strokeStyle = colors.bg;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, y);
            ctx.lineTo(cx + R * Math.cos(phi), y + R * Math.sin(phi));
            ctx.stroke();
            ctx.fillStyle = colors.text;
            ctx.fillText(b[lang], 8, y + 4);
            ctx.fillStyle = colors.muted;
            ctx.fillText(`a = ${formatNumber(acc[i]!, 3, lang)} m/s²`, margin, y - 16);
          });
          ctx.strokeStyle = colors.success;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(width - 30, 14);
          ctx.lineTo(width - 30, height - 4);
          ctx.stroke();
          ctx.setLineDash([]);
        }}
      />
      <p class="sim-note">{t.note}</p>
    </div>
  );
}
