/** Demo: fasori di un RLC serie, rotanti con e^{jωt}; catena punta-coda per la legge di Kirchhoff. */
import { useMemo, useRef, useState } from 'preact/hooks';
import { ac } from '../circuits/mna';
import { Controls } from '../Controls';
import { useAnimationFrame, useReducedMotion } from '../hooks';
import { PhasorPlane } from '../PhasorPlane';
import { Slider } from '../Slider';
import type { Lang } from '../units';
import '../sim.css';

const T = {
  it: { title: 'Fasori di un RLC serie', w: 'Pulsazione ω', chain: 'Somma punta-coda (LKT)' },
  en: { title: 'Phasors of a series RLC', w: 'Angular frequency ω', chain: 'Tip-to-tail sum (KVL)' },
};

export default function PhasorDemo({ lang }: { lang: Lang }): preact.JSX.Element {
  const t = T[lang];
  const reduced = useReducedMotion();
  const [running, setRunning] = useState(false);
  const [w, setW] = useState(800);
  const [chain, setChain] = useState(true);
  const [angle, setAngle] = useState(0);
  const box = useRef<HTMLElement>(null);
  const sol = useMemo(
    () =>
      ac({
        omega: w,
        elements: [
          { type: 'V', id: 'V1', a: 'a', b: '0', ac: 10 },
          { type: 'R', id: 'R1', a: 'a', b: 'b', value: 10 },
          { type: 'L', id: 'L1', a: 'b', b: 'c', value: 0.02 },
          { type: 'C', id: 'C1', a: 'c', b: '0', value: 100e-6 },
        ],
      }),
    [w],
  );
  // animazione lenta e indipendente da ω (un giro ogni 4 s)
  useAnimationFrame((dt) => setAngle((a) => (a + (dt * Math.PI) / 2) % (2 * Math.PI)), running, box);
  const ph = (id: string, label: string): { label: string; re: number; im: number } => {
    const v = sol.vElement(id);
    return { label, re: v.re, im: v.im };
  };
  const V = sol.vd('a');
  return (
    <section class="sim" aria-labelledby="demo-ph" ref={box}>
      <h3 class="sim__title" id="demo-ph">
        {t.title}
      </h3>
      <div class="sim__panel">
        <Slider lang={lang} label={t.w} value={w} min={100} max={5000} log unit="rad/s" onInput={setW} />
        <label class="sim-note">
          <input
            type="checkbox"
            checked={chain}
            onChange={(e) => setChain((e.currentTarget as HTMLInputElement).checked)}
          />{' '}
          {t.chain}
        </label>
      </div>
      <Controls
        lang={lang}
        running={running}
        onToggle={() => setRunning((r) => !r)}
        onReset={() => setAngle(0)}
        reducedMotion={reduced}
      />
      <PhasorPlane
        lang={lang}
        title={t.title}
        unit="V"
        angle={angle}
        chain={chain}
        projection
        phasors={[
          ph('R1', 'V_R'),
          ph('L1', 'V_L'),
          ph('C1', 'V_C'),
          ...(chain ? [] : [{ label: 'V', re: V.re, im: V.im, dash: true }]),
        ]}
      />
    </section>
  );
}
