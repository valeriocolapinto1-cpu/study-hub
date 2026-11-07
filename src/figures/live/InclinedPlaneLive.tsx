/** Piano inclinato interattivo: angolo e coefficiente d'attrito, accelerazione risultante. */
import { useMemo, useState } from 'preact/hooks';
import { Slider } from '../../sim/Slider';
import { finish, makeCtx, type Lang } from '../core';
import { inclinedPlane } from '../types/mechanics';
import { deg, fix, LiveFrame } from './LiveFrame';

export default function InclinedPlaneLive({ lang, id = 'live-incline' }: { lang: Lang; id?: string }) {
  const [angle, setAngle] = useState(30);
  const [mu, setMu] = useState(0.2);
  const g = 9.81;
  const th = (angle * Math.PI) / 180;
  const slides = Math.tan(th) > mu;
  const a = slides ? g * (Math.sin(th) - mu * Math.cos(th)) : 0;
  const L = makeCtx(lang).L;
  const svg = useMemo(() => {
    const params = {
      angle,
      friction: mu > 0,
      components: true,
      motion: slides ? ('down' as const) : ('none' as const),
    };
    return finish('inclined-plane', params, inclinedPlane(params, makeCtx(lang)), { lang, idPrefix: id }).svg;
  }, [angle, mu, slides, lang, id]);
  return (
    <LiveFrame
      id={id}
      title={L('Piano inclinato', 'Inclined plane')}
      svg={svg}
      readout={
        slides
          ? L(
              `Il blocco scivola: a = g (sin θ − μ cos θ) = ${fix(lang, a)} m/s²`,
              `The block slides: a = g (sin θ − μ cos θ) = ${fix(lang, a)} m/s²`,
            )
          : L(
              `Il blocco resta fermo: tan θ = ${fix(lang, Math.tan(th))} ≤ μ`,
              `The block stays at rest: tan θ = ${fix(lang, Math.tan(th))} ≤ μ`,
            )
      }
    >
      <Slider
        lang={lang}
        label={L('Inclinazione θ', 'Angle θ')}
        value={angle}
        min={5}
        max={75}
        step={1}
        format={(v) => deg(lang, v)}
        onInput={setAngle}
      />
      <Slider
        lang={lang}
        label={L("Coefficiente d'attrito μ", 'Friction coefficient μ')}
        value={mu}
        min={0}
        max={1}
        step={0.05}
        format={(v) => fix(lang, v)}
        onInput={setMu}
      />
    </LiveFrame>
  );
}
