/** Demo: risposta al gradino di un RLC serie (secondo ordine, integrazione con i trapezi). */
import { useMemo, useState } from 'preact/hooks';
import { transient } from '../circuits/mna';
import { Plot } from '../Plot';
import { Slider } from '../Slider';
import { formatNumber, type Lang } from '../units';
import '../sim.css';

const T = {
  it: {
    title: 'RLC serie: risposta al gradino',
    r: 'Resistenza R',
    vc: 'v_C(t)',
    il: 'i_L(t) × R',
    time: 'Tempo t',
    regime: { under: 'sottosmorzato', critical: 'critico', over: 'sovrasmorzato' },
    zeta: 'Smorzamento ζ',
  },
  en: {
    title: 'Series RLC: step response',
    r: 'Resistance R',
    vc: 'v_C(t)',
    il: 'i_L(t) × R',
    time: 'Time t',
    regime: { under: 'underdamped', critical: 'critically damped', over: 'overdamped' },
    zeta: 'Damping ratio ζ',
  },
};

export default function RlcTransientDemo({ lang }: { lang: Lang }): preact.JSX.Element {
  const t = T[lang];
  const [R, setR] = useState(20);
  const Lh = 0.01;
  const C = 10e-6;
  const res = useMemo(
    () =>
      transient(
        {
          elements: [
            { type: 'V', id: 'V1', a: 'a', b: '0', wave: { kind: 'step', after: 1 } },
            { type: 'R', id: 'R1', a: 'a', b: 'b', value: R },
            { type: 'L', id: 'L1', a: 'b', b: 'c', value: Lh },
            { type: 'C', id: 'C1', a: 'c', b: '0', value: C },
          ],
        },
        { tEnd: 0.01, dt: 1e-5 },
      ),
    [R],
  );
  const zeta = (R / 2) * Math.sqrt(C / Lh);
  const regime = Math.abs(zeta - 1) < 0.02 ? t.regime.critical : zeta < 1 ? t.regime.under : t.regime.over;
  const vc = res.v('c');
  const il = res.i('L1').map((x) => x * R);
  return (
    <section class="sim" aria-labelledby="demo-rlc">
      <h3 class="sim__title" id="demo-rlc">
        {t.title}
      </h3>
      <div class="sim__panel">
        <Slider lang={lang} label={t.r} value={R} min={2} max={200} log unit="Ω" onInput={setR} />
        <p class="sim-note" aria-live="polite">
          {t.zeta} = {formatNumber(zeta, 3, lang)} — <strong>{regime}</strong>
        </p>
      </div>
      <Plot
        lang={lang}
        title={t.title}
        xLabel={t.time}
        xUnit="s"
        yUnit="V"
        series={[
          { label: t.vc, x: res.t, y: vc },
          { label: t.il, x: res.t, y: il, dash: '6 4' },
        ]}
      />
    </section>
  );
}
