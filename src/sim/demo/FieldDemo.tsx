/** Demo: linee di campo di due cariche puntiformi (dipolo o cariche uguali). */
import { useMemo, useState } from 'preact/hooks';
import { pointSourcesField, type PointSource } from '../field';
import { Slider } from '../Slider';
import { VectorField } from '../VectorField';
import { formatNumber, type Lang } from '../units';
import '../sim.css';

const T = {
  it: {
    title: 'Campo elettrico di due cariche',
    q2: 'Seconda carica q₂ / q₁',
    desc: 'Frecce del campo e linee di campo; la carica a sinistra vale +1.',
  },
  en: {
    title: 'Electric field of two charges',
    q2: 'Second charge q₂ / q₁',
    desc: 'Field arrows and field lines; the left charge is +1.',
  },
};

export default function FieldDemo({ lang }: { lang: Lang }): preact.JSX.Element {
  const t = T[lang];
  const [q2, setQ2] = useState(-1);
  const sources: PointSource[] = useMemo(
    () => [
      { x: -1, y: 0, q: 1 },
      { x: 1, y: 0, q: q2 },
    ],
    [q2],
  );
  const field = useMemo(() => pointSourcesField(sources), [sources]);
  const bounds = useMemo(() => ({ xMin: -3, xMax: 3, yMin: -2, yMax: 2 }), []);
  return (
    <section class="sim" aria-labelledby="demo-field">
      <h3 class="sim__title" id="demo-field">
        {t.title}
      </h3>
      <Slider
        lang={lang}
        label={t.q2}
        value={q2}
        min={-2}
        max={2}
        step={0.5}
        format={(v) => formatNumber(v, 2, lang)}
        onInput={setQ2}
      />
      <VectorField
        title={`${t.title}: q₁ = +1, q₂ = ${formatNumber(q2, 2, lang)}`}
        description={t.desc}
        field={field}
        bounds={bounds}
        sources={sources.filter((s) => s.q !== 0)}
      />
    </section>
  );
}
