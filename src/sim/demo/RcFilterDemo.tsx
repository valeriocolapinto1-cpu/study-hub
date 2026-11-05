/** Demo: passa-basso RC, Bode calcolato con l'MNA al variare di R e C. */
import { useMemo, useState } from 'preact/hooks';
import { sweep } from '../circuits/mna';
import type { NetlistInput } from '../circuits/netlist';
import { BodePlot } from '../Plot';
import { Slider } from '../Slider';
import type { Lang } from '../units';
import { formatSI } from '../units';
import '../sim.css';

const L = {
  it: {
    title: 'Filtro RC passa-basso',
    r: 'Resistenza R',
    c: 'Capacità C',
    fc: 'Frequenza di taglio',
    curve: 'H(jω) = V_out/V_in',
  },
  en: {
    title: 'RC low-pass filter',
    r: 'Resistance R',
    c: 'Capacitance C',
    fc: 'Cut-off frequency',
    curve: 'H(jω) = V_out/V_in',
  },
};

export default function RcFilterDemo({ lang }: { lang: Lang }): preact.JSX.Element {
  const t = L[lang];
  const [R, setR] = useState(1000);
  const [C, setC] = useState(1e-7);
  const net: NetlistInput = useMemo(
    () => ({
      elements: [
        { type: 'V', id: 'Vin', a: 'i', b: '0', ac: 1 },
        { type: 'R', id: 'R1', a: 'i', b: 'o', value: R },
        { type: 'C', id: 'C1', a: 'o', b: '0', value: C },
      ],
    }),
    [R, C],
  );
  const sw = useMemo(() => sweep(net, 'Vin', { v: 'o' }, { fMin: 10, fMax: 1e6, points: 161 }), [net]);
  const fc = 1 / (2 * Math.PI * R * C);
  return (
    <section class="sim" aria-labelledby="demo-rc">
      <h3 class="sim__title" id="demo-rc">
        {t.title}
      </h3>
      <div class="sim__panel">
        <Slider lang={lang} label={t.r} value={R} min={100} max={100e3} log unit="Ω" onInput={setR} />
        <Slider lang={lang} label={t.c} value={C} min={1e-9} max={1e-5} log unit="F" onInput={setC} />
      </div>
      <p class="sim-note">
        {t.fc}: f<sub>c</sub> = 1/(2πRC) = <strong>{formatSI(fc, 'Hz', { lang })}</strong>
      </p>
      <BodePlot
        lang={lang}
        title={t.title}
        x={sw.freq}
        curves={[{ label: t.curve, magDb: sw.magDb, phaseDeg: sw.phaseDeg }]}
        markers={[{ x: fc, label: 'f_c' }]}
      />
    </section>
  );
}
