/** Simulazione «Ciclo di Carnot»: ciclo nel piano p-V (gas monoatomico) con area del lavoro e rendimento. */
import { useMemo, useState } from 'preact/hooks';
import { Plot } from '../../../sim/Plot';
import { Slider } from '../../../sim/Slider';
import { formatNumber, type Lang } from '../../../sim/units';
import '../../../sim/sim.css';

const R = 8.314;
const GAMMA = 5 / 3;
const T = {
  it: {
    tc: 'Temperatura calda T_C',
    tf: 'Temperatura fredda T_F',
    title: 'Ciclo di Carnot nel piano p-V (1 mol di gas monoatomico)',
    names: ['isoterma calda', 'adiabatica', 'isoterma fredda', 'adiabatica'],
    work: 'lavoro netto',
    note: 'Isoterma calda → adiabatica → isoterma fredda → adiabatica. L’area racchiusa è il lavoro netto; il rendimento dipende solo dalle due temperature.',
  },
  en: {
    tc: 'Hot temperature T_C',
    tf: 'Cold temperature T_F',
    title: 'Carnot cycle in the p-V plane (1 mol of monatomic gas)',
    names: ['hot isotherm', 'adiabatic', 'cold isotherm', 'adiabatic'],
    work: 'net work',
    note: 'Hot isotherm → adiabatic → cold isotherm → adiabatic. The enclosed area is the net work; the efficiency depends only on the two temperatures.',
  },
};

/** Vertici e lati del ciclo (V₁ = 10 L, V₂ = 2V₁). */
export function carnotCycle(Tc: number, Tf: number) {
  const V1 = 0.01;
  const V2 = 2 * V1;
  const r = (Tc / Tf) ** (1 / (GAMMA - 1));
  const V3 = V2 * r;
  const V4 = V1 * r;
  const iso = (Tk: number, a: number, b: number) =>
    Array.from({ length: 60 }, (_, i) => a + ((b - a) * i) / 59).map((V) => [V, (R * Tk) / V] as const);
  const adi = (Va: number, Ta: number, b: number) =>
    Array.from({ length: 60 }, (_, i) => Va + ((b - Va) * i) / 59).map(
      (V) => [V, ((R * Ta) / Va) * (Va / V) ** GAMMA] as const,
    );
  const sides = [iso(Tc, V1, V2), adi(V2, Tc, V3), iso(Tf, V3, V4), adi(V4, Tf, V1)];
  const Qc = R * Tc * Math.log(V2 / V1);
  const eta = 1 - Tf / Tc;
  return { sides, Qc, eta, W: eta * Qc };
}

export default function Carnot({ lang }: { lang: Lang }): preact.JSX.Element {
  const t = T[lang];
  const [Tc, setTc] = useState(500);
  const [Tf, setTf] = useState(300);
  const c = useMemo(() => carnotCycle(Tc, Tf), [Tc, Tf]);
  const toL = (pts: readonly (readonly [number, number])[]) => ({
    x: pts.map((p) => p[0] * 1000),
    y: pts.map((p) => p[1] / 1000),
  });
  return (
    <div class="sim">
      <div class="sim__panel">
        <Slider
          lang={lang}
          label={t.tc}
          value={Tc}
          min={400}
          max={700}
          step={5}
          format={(v) => `${formatNumber(v, 3, lang)} K`}
          onInput={setTc}
        />
        <Slider
          lang={lang}
          label={t.tf}
          value={Tf}
          min={200}
          max={350}
          step={5}
          format={(v) => `${formatNumber(v, 3, lang)} K`}
          onInput={setTf}
        />
        <p class="sim-note" aria-live="polite">
          η = 1 − T_F/T_C = <strong>{formatNumber(100 * c.eta, 3, lang)} %</strong> · {t.work} W ={' '}
          {formatNumber(c.W, 3, lang)} J (Q_C = {formatNumber(c.Qc, 3, lang)} J)
        </p>
      </div>
      <Plot
        lang={lang}
        title={t.title}
        xLabel="V"
        xUnit="L"
        yLabel="p"
        yUnit="kPa"
        height={260}
        formatX={(v) => formatNumber(v, 3, lang)}
        formatY={(v) => formatNumber(v, 3, lang)}
        series={c.sides.map((s, i) => ({
          label: t.names[i]!,
          ...toL(s),
          color: i % 2 ? 'var(--text-muted)' : i === 0 ? 'var(--danger)' : 'var(--info)',
          width: 2.5,
        }))}
      />
      <p class="sim-note">{t.note}</p>
    </div>
  );
}
