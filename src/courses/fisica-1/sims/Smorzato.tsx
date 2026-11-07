/** Simulazione «Oscillatore smorzato»: x(t) con inviluppo nei tre regimi al variare di γ (ω₀ fissata). */
import { useMemo, useState } from 'preact/hooks';
import { Plot } from '../../../sim/Plot';
import { Slider } from '../../../sim/Slider';
import { formatNumber, type Lang } from '../../../sim/units';
import '../../../sim/sim.css';

const W0 = 2;
const T = {
  it: {
    g: 'Smorzamento γ',
    title: 'Oscillatore smorzato: posizione nel tempo',
    x: 'posizione x',
    env: 'inviluppo ±e^(−γt)',
    regimes: { sotto: 'sottosmorzato', critico: 'critico', sovra: 'sovrasmorzato' },
    regime: 'Regime',
    note: 'ω₀ = 2 rad/s, partenza da x = 1 m ferma. Sotto ω₀ oscilla dentro l’inviluppo; a γ = ω₀ torna all’equilibrio nel modo più rapido senza oscillare; sopra torna lentamente.',
  },
  en: {
    g: 'Damping γ',
    title: 'Damped oscillator: position over time',
    x: 'position x',
    env: 'envelope ±e^(−γt)',
    regimes: { sotto: 'underdamped', critico: 'critical', sovra: 'overdamped' },
    regime: 'Regime',
    note: 'ω₀ = 2 rad/s, starting from x = 1 m at rest. Below ω₀ it oscillates inside the envelope; at γ = ω₀ it returns to equilibrium fastest without oscillating; above it returns slowly.',
  },
};

/** Soluzione con x(0) = 1, v(0) = 0 nei tre regimi. */
export function dampedX(t: number, g: number, w0 = W0): number {
  if (Math.abs(g - w0) < 1e-6) return (1 + w0 * t) * Math.exp(-w0 * t);
  if (g < w0) {
    const ws = Math.sqrt(w0 * w0 - g * g);
    return Math.exp(-g * t) * (Math.cos(ws * t) + (g / ws) * Math.sin(ws * t));
  }
  const s = Math.sqrt(g * g - w0 * w0);
  const l1 = -g + s;
  const l2 = -g - s;
  return (l2 * Math.exp(l1 * t) - l1 * Math.exp(l2 * t)) / (l2 - l1);
}

export default function Smorzato({ lang }: { lang: Lang }): preact.JSX.Element {
  const t = T[lang];
  const [g, setG] = useState(0.3);
  const data = useMemo(() => {
    const ts = Array.from({ length: 301 }, (_, i) => (i * 12) / 300);
    return {
      ts,
      x: ts.map((tt) => dampedX(tt, g)),
      up: ts.map((tt) => Math.exp(-g * tt)),
      down: ts.map((tt) => -Math.exp(-g * tt)),
    };
  }, [g]);
  const regime = Math.abs(g - W0) < 0.03 ? t.regimes.critico : g < W0 ? t.regimes.sotto : t.regimes.sovra;
  return (
    <div class="sim">
      <div class="sim__panel">
        <Slider
          lang={lang}
          label={t.g}
          value={g}
          min={0}
          max={3.5}
          step={0.02}
          format={(v) => `${formatNumber(v, 3, lang)} 1/s`}
          onInput={(v) => setG(Math.abs(v - W0) < 0.03 ? W0 : v)}
        />
        <p class="sim-note" aria-live="polite">
          {t.regime}: <strong>{regime}</strong>
        </p>
      </div>
      <Plot
        lang={lang}
        title={t.title}
        xLabel="t"
        xUnit="s"
        yLabel="x"
        yUnit="m"
        yDomain={[-1.05, 1.05]}
        height={240}
        formatX={(v) => formatNumber(v, 3, lang)}
        formatY={(v) => formatNumber(v, 3, lang)}
        series={[
          { label: t.x, x: data.ts, y: data.x },
          ...(g < W0 && g > 0
            ? [
                { label: t.env, x: data.ts, y: data.up, dash: '5 4', width: 1, color: 'var(--text-muted)' },
                { label: '', x: data.ts, y: data.down, dash: '5 4', width: 1, color: 'var(--text-muted)' },
              ]
            : []),
        ]}
        legend={false}
      />
      <p class="sim-note">{t.note}</p>
    </div>
  );
}
