/** Linee di campo interattive: due cariche, valore della seconda e distanza. */
import { useMemo, useState } from 'preact/hooks';
import { Slider } from '../../sim/Slider';
import { finish, makeCtx, type Lang } from '../core';
import { pointCharges } from '../types/em';
import { fix, LiveFrame } from './LiveFrame';

export default function FieldLinesLive({ lang, id = 'live-field' }: { lang: Lang; id?: string }) {
  const [q2, setQ2] = useState(-1);
  const [d, setD] = useState(2);
  const L = makeCtx(lang).L;
  const q = Math.abs(q2) < 0.25 ? (q2 < 0 ? -0.25 : 0.25) : q2;
  const svg = useMemo(() => {
    const params = {
      charges: [
        { x: -d / 2, y: 0, q: 1, label: 'q_1' },
        { x: d / 2, y: 0, q, label: 'q_2' },
      ],
      bounds: { xMin: -3.2, xMax: 3.2, yMin: -2.45, yMax: 2.45 },
      lines: 8,
      equipotentials: 3,
    };
    return finish('point-charges', params, pointCharges(params, makeCtx(lang)), { lang, idPrefix: id }).svg;
  }, [q, d, lang, id]);
  return (
    <LiveFrame id={id} title={L('Linee di campo di due cariche', 'Field lines of two charges')} svg={svg} readout={`q₁ = +1 · q₂ = ${q > 0 ? '+' : ''}${fix(lang, q)}`}>
      <Slider lang={lang} label={L('Seconda carica q₂ (in unità di q₁)', 'Second charge q₂ (in units of q₁)')} value={q2} min={-3} max={3} step={0.25} format={(v) => fix(lang, v)} onInput={setQ2} />
      <Slider lang={lang} label={L('Distanza', 'Distance')} value={d} min={1} max={4} step={0.25} format={(v) => fix(lang, v)} onInput={setD} />
    </LiveFrame>
  );
}
