/** Demo: oscilloscopio a due canali su un RC (ingresso e uscita sfasata). */
import { useMemo, useState } from 'preact/hooks';
import { ac } from '../circuits/mna';
import { Controls } from '../Controls';
import { useReducedMotion } from '../hooks';
import { Scope } from '../Scope';
import { Slider } from '../Slider';
import type { Lang } from '../units';
import '../sim.css';

const T = {
  it: {
    title: 'Oscilloscopio: ingresso e uscita di un RC',
    f: 'Frequenza del generatore',
    in: 'v_in',
    out: 'v_out',
  },
  en: {
    title: 'Oscilloscope: input and output of an RC',
    f: 'Generator frequency',
    in: 'v_in',
    out: 'v_out',
  },
};

export default function ScopeDemo({ lang }: { lang: Lang }): preact.JSX.Element {
  const t = T[lang];
  const reduced = useReducedMotion();
  const [running, setRunning] = useState(false);
  const [f, setF] = useState(1000);
  const H = useMemo(() => {
    const s = ac({
      omega: 2 * Math.PI * f,
      elements: [
        { type: 'V', id: 'V1', a: 'i', b: '0', ac: 2 },
        { type: 'R', id: 'R1', a: 'i', b: 'o', value: 1000 },
        { type: 'C', id: 'C1', a: 'o', b: '0', value: 159e-9 },
      ],
    });
    return s.v('o');
  }, [f]);
  const w = 2 * Math.PI * f;
  const channels = useMemo(
    () => [
      { label: t.in, fn: (x: number) => 2 * Math.cos(w * x), perDiv: 1, offset: 0 },
      { label: t.out, fn: (x: number) => H.abs() * Math.cos(w * x + H.arg()), perDiv: 1, offset: 0 },
    ],
    [w, H, t],
  );
  const tdiv = 1 / f / 4;
  return (
    <section class="sim" aria-labelledby="demo-scope">
      <h3 class="sim__title" id="demo-scope">
        {t.title}
      </h3>
      <Slider lang={lang} label={t.f} value={f} min={50} max={20000} log unit="Hz" onInput={setF} />
      <Controls
        lang={lang}
        running={running}
        onToggle={() => setRunning((r) => !r)}
        reducedMotion={reduced}
      />
      <Scope
        lang={lang}
        title={t.title}
        channels={channels}
        timePerDiv={tdiv}
        trigger={{ channel: 0, level: 0 }}
        running={running}
        timeScale={tdiv}
      />
    </section>
  );
}
