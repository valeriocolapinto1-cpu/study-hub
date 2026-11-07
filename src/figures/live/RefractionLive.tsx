/** Rifrazione interattiva: angolo di incidenza e indici dei due mezzi → angolo rifratto o riflessione totale. */
import { useMemo, useState } from 'preact/hooks';
import { Slider } from '../../sim/Slider';
import { finish, makeCtx, type Lang } from '../core';
import { refraction } from '../types/optics';
import { deg, fix, LiveFrame } from './LiveFrame';

export default function RefractionLive({ lang, id = 'live-refraction' }: { lang: Lang; id?: string }) {
  const [inc, setInc] = useState(40);
  const [n1, setN1] = useState(1.5);
  const [n2, setN2] = useState(1);
  const L = makeCtx(lang).L;
  const s = (n1 * Math.sin((inc * Math.PI) / 180)) / n2;
  const total = s > 1;
  const t2 = total ? 0 : (Math.asin(s) * 180) / Math.PI;
  const svg = useMemo(() => {
    const params = { n1, n2, incidence: inc };
    return finish('refraction', params, refraction(params, makeCtx(lang)), { lang, idPrefix: id }).svg;
  }, [inc, n1, n2, lang, id]);
  const tc = n1 > n2 ? (Math.asin(n2 / n1) * 180) / Math.PI : NaN;
  return (
    <LiveFrame
      id={id}
      title={L('Riflessione e rifrazione', 'Reflection and refraction')}
      svg={svg}
      readout={
        total
          ? L(
              `Riflessione totale: θ₁ supera l'angolo limite θc = ${deg(lang, tc)}`,
              `Total internal reflection: θ₁ exceeds the critical angle θc = ${deg(lang, tc)}`,
            )
          : L(
              `n₁ sin θ₁ = n₂ sin θ₂ → θ₂ = ${deg(lang, t2)}`,
              `n₁ sin θ₁ = n₂ sin θ₂ → θ₂ = ${deg(lang, t2)}`,
            )
      }
    >
      <Slider
        lang={lang}
        label={L('Incidenza θ₁', 'Incidence θ₁')}
        value={inc}
        min={0}
        max={89}
        step={1}
        format={(v) => deg(lang, v)}
        onInput={setInc}
      />
      <Slider
        lang={lang}
        label={L('Indice n₁ (sopra)', 'Index n₁ (top)')}
        value={n1}
        min={1}
        max={2.5}
        step={0.01}
        format={(v) => fix(lang, v)}
        onInput={setN1}
      />
      <Slider
        lang={lang}
        label={L('Indice n₂ (sotto)', 'Index n₂ (bottom)')}
        value={n2}
        min={1}
        max={2.5}
        step={0.01}
        format={(v) => fix(lang, v)}
        onInput={setN2}
      />
    </LiveFrame>
  );
}
