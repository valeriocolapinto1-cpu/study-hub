/** Simulazione «Risonanza»: curva A(Ω) per diversi γ, con il picco e la risposta statica F₀/k. */
import { useMemo, useState } from 'preact/hooks';
import { Plot } from '../../../sim/Plot';
import { Slider } from '../../../sim/Slider';
import { formatNumber, type Lang } from '../../../sim/units';
import '../../../sim/sim.css';

const W0 = 2;
const T = {
  it: {
    g: 'Smorzamento γ',
    title: 'Ampiezza a regime in funzione della pulsazione della forzante',
    curve: 'A(Ω)',
    peak: 'picco',
    nopeak: 'γ troppo grande: nessun picco (γ² > ω₀²/2)',
    note: 'F₀/m = 1 N/kg, ω₀ = 2 rad/s. Riducendo γ il picco si alza e si stringe attorno a ω₀; per Ω → 0 la risposta è quella statica F₀/k.',
  },
  en: {
    g: 'Damping γ',
    title: 'Steady-state amplitude versus driving angular frequency',
    curve: 'A(Ω)',
    peak: 'peak',
    nopeak: 'γ too large: no peak (γ² > ω₀²/2)',
    note: 'F₀/m = 1 N/kg, ω₀ = 2 rad/s. As γ decreases the peak rises and narrows around ω₀; for Ω → 0 the response is the static one, F₀/k.',
  },
};

export const amplitude = (om: number, g: number, w0 = W0): number =>
  1 / Math.sqrt((w0 * w0 - om * om) ** 2 + 4 * g * g * om * om);

export default function Risonanza({ lang }: { lang: Lang }): preact.JSX.Element {
  const t = T[lang];
  const [g, setG] = useState(0.4);
  const data = useMemo(() => {
    const x = Array.from({ length: 401 }, (_, i) => (i * 5) / 400);
    return { x, y: x.map((om) => amplitude(om, g)) };
  }, [g]);
  const hasPeak = W0 * W0 - 2 * g * g > 0;
  const omR = hasPeak ? Math.sqrt(W0 * W0 - 2 * g * g) : 0;
  const Am = amplitude(omR, g);
  return (
    <div class="sim">
      <div class="sim__panel">
        <Slider
          lang={lang}
          label={t.g}
          value={g}
          min={0.06}
          max={1.6}
          step={0.01}
          format={(v) => `${formatNumber(v, 3, lang)} 1/s`}
          onInput={setG}
        />
        <p class="sim-note" aria-live="polite">
          {hasPeak
            ? `Ω_ris = ${formatNumber(omR, 3, lang)} rad/s · A_max = ${formatNumber(Am, 3, lang)} m`
            : t.nopeak}
        </p>
      </div>
      <Plot
        lang={lang}
        title={t.title}
        xLabel="Ω"
        xUnit="rad/s"
        yLabel="A"
        yUnit="m"
        height={240}
        formatX={(v) => formatNumber(v, 3, lang)}
        formatY={(v) => formatNumber(v, 3, lang)}
        series={[{ label: t.curve, x: data.x, y: data.y }]}
        markers={
          hasPeak
            ? [
                { x: omR, y: Am, label: t.peak },
                { x: W0, label: 'ω₀' },
              ]
            : [{ x: W0, label: 'ω₀' }]
        }
      />
      <p class="sim-note">{t.note}</p>
    </div>
  );
}
