/**
 * Simulazione: transitori dei circuiti RC e RL (carica/scarica, chiusura/apertura) calcolati con il
 * risolutore del kit (transient: trapezi, Eulero implicito dopo la discontinuità), confrontati con la
 * costante di tempo τ = RC o τ = L/R della teoria.
 */
import { useMemo, useState } from 'preact/hooks';
import { transient } from '../../../sim/circuits/mna';
import { Plot } from '../../../sim/Plot';
import { Slider } from '../../../sim/Slider';
import { formatNumber, formatSI, type Lang } from '../../../sim/units';
import '../../../sim/sim.css';

type Kind = 'rc-carica' | 'rc-scarica' | 'rl-chiusura' | 'rl-apertura';
const E = 10;
const T = {
  it: {
    title: 'Transitori RC e RL',
    kind: 'Transitorio',
    kinds: {
      'rc-carica': 'RC: carica del condensatore',
      'rc-scarica': 'RC: scarica del condensatore',
      'rl-chiusura': 'RL: chiusura del circuito',
      'rl-apertura': 'RL: apertura (scarica su R)',
    } as Record<Kind, string>,
    r: 'Resistenza R',
    c: 'Capacità C',
    l: 'Induttanza L',
    time: 'Tempo t',
    vc: 'Tensione sul condensatore v_C(t)',
    il: 'Corrente nell’induttore i_L(t)',
    tau: 'Costante di tempo',
    at: 'Dopo un τ la grandezza ha percorso il 63 % della variazione; dopo 5τ il transitorio è praticamente finito.',
    gen: 'Generatore ideale di 10 V che commuta a t = 0.',
  },
  en: {
    title: 'RC and RL transients',
    kind: 'Transient',
    kinds: {
      'rc-carica': 'RC: charging the capacitor',
      'rc-scarica': 'RC: discharging the capacitor',
      'rl-chiusura': 'RL: closing the circuit',
      'rl-apertura': 'RL: opening (discharge through R)',
    } as Record<Kind, string>,
    r: 'Resistance R',
    c: 'Capacitance C',
    l: 'Inductance L',
    time: 'Time t',
    vc: 'Capacitor voltage v_C(t)',
    il: 'Inductor current i_L(t)',
    tau: 'Time constant',
    at: 'After one τ the quantity has covered 63 % of its change; after 5τ the transient is practically over.',
    gen: 'Ideal 10 V generator switching at t = 0.',
  },
};

export default function Transitori({ lang }: { lang: Lang }): preact.JSX.Element {
  const t = T[lang];
  const [kind, setKind] = useState<Kind>('rc-carica');
  const [R, setR] = useState(1000);
  const [C, setC] = useState(10e-6);
  const [L, setL] = useState(0.1);
  const rc = kind.startsWith('rc');
  const tau = rc ? R * C : L / R;
  const res = useMemo(() => {
    const charging = kind === 'rc-carica' || kind === 'rl-chiusura';
    const wave = charging
      ? { kind: 'step' as const, before: 0, after: E, at: 0 }
      : { kind: 'step' as const, before: E, after: 0, at: 0 };
    const store = rc
      ? { type: 'C' as const, id: 'C1', a: 'b', b: '0', value: C }
      : { type: 'L' as const, id: 'L1', a: 'b', b: '0', value: L };
    const tEnd = 5 * tau;
    return transient(
      {
        elements: [
          { type: 'V', id: 'V1', a: 'a', b: '0', wave },
          { type: 'R', id: 'R1', a: 'a', b: 'b', value: R },
          store,
        ],
      },
      { tEnd, dt: tEnd / 400 },
    );
  }, [kind, R, C, L, rc, tau]);
  const y = rc ? res.v('b') : res.i('L1');
  const id = 'f2-sim-transitori';
  return (
    <section class="sim" aria-labelledby={id}>
      <h3 class="sim__title" id={id}>
        {t.title}
      </h3>
      <div class="sim__panel">
        <label class="field">
          <span class="field__label">{t.kind}</span>
          <select class="select" value={kind} onChange={(e) => setKind(e.currentTarget.value as Kind)}>
            {(Object.keys(t.kinds) as Kind[]).map((k) => (
              <option value={k} key={k}>
                {t.kinds[k]}
              </option>
            ))}
          </select>
        </label>
        <Slider lang={lang} label={t.r} value={R} min={10} max={1e5} log unit="Ω" onInput={setR} />
        {rc ? (
          <Slider lang={lang} label={t.c} value={C} min={1e-7} max={1e-4} log unit="F" onInput={setC} />
        ) : (
          <Slider lang={lang} label={t.l} value={L} min={1e-3} max={10} log unit="H" onInput={setL} />
        )}
        <p class="sim-note" aria-live="polite">
          {t.tau}: τ = {rc ? 'RC' : 'L/R'} = <strong>{formatSI(tau, 's', { digits: 3, lang })}</strong>
        </p>
      </div>
      <Plot
        lang={lang}
        title={`${t.kinds[kind]} — τ = ${formatSI(tau, 's', { digits: 3, lang })}`}
        xLabel={t.time}
        xUnit="s"
        yUnit={rc ? 'V' : 'A'}
        series={[{ label: rc ? t.vc : t.il, x: res.t, y }]}
      />
      <p class="sim-note">
        {t.gen} {t.at} ({formatNumber(1 - Math.exp(-1), 3, lang)})
      </p>
    </section>
  );
}
