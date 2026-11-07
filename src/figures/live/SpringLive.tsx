/** Molla interattiva: spostamento dall'equilibrio, forza elastica ed energia. */
import { useMemo, useState } from 'preact/hooks';
import { Slider } from '../../sim/Slider';
import { finish, makeCtx, type Lang } from '../core';
import { springMass } from '../types/mechanics';
import { fix, LiveFrame } from './LiveFrame';

export default function SpringLive({ lang, id = 'live-spring' }: { lang: Lang; id?: string }) {
  const [x, setX] = useState(0.06);
  const [k, setK] = useState(50);
  const L = makeCtx(lang).L;
  const svg = useMemo(() => {
    const params = { displacement: x / 0.1 };
    return finish('spring-mass', params, springMass(params, makeCtx(lang)), { lang, idPrefix: id }).svg;
  }, [x, lang, id]);
  return (
    <LiveFrame
      id={id}
      title={L('Molla e massa', 'Mass and spring')}
      svg={svg}
      readout={L(
        `F = −k x = ${fix(lang, -k * x)} N · U = ½ k x² = ${fix(lang, 0.5 * k * x * x, 3)} J`,
        `F = −k x = ${fix(lang, -k * x)} N · U = ½ k x² = ${fix(lang, 0.5 * k * x * x, 3)} J`,
      )}
    >
      <Slider
        lang={lang}
        label={L('Spostamento x', 'Displacement x')}
        value={x}
        min={-0.1}
        max={0.1}
        step={0.005}
        unit="m"
        onInput={setX}
      />
      <Slider
        lang={lang}
        label={L('Costante elastica k', 'Spring constant k')}
        value={k}
        min={10}
        max={200}
        step={5}
        unit="N/m"
        onInput={setK}
      />
    </LiveFrame>
  );
}
