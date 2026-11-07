/** Ciclo di Carnot interattivo: espansione isoterma e rapporto delle temperature, rendimento. */
import { useMemo, useState } from 'preact/hooks';
import { Slider } from '../../sim/Slider';
import { finish, makeCtx, type Lang } from '../core';
import { pvCycle } from '../types/thermo';
import { fix, LiveFrame } from './LiveFrame';

const GAMMA = 1.4;

/** Stati del ciclo di Carnot (V in L, p in kPa) dati r = V_B/V_A e τ = T_c/T_h. */
export function carnotStates(r: number, tau: number) {
  const k = (1 / tau) ** (1 / (GAMMA - 1));
  const A = { id: 'A', V: 10, p: 400 };
  const B = { id: 'B', V: 10 * r, p: 400 / r };
  const C = { id: 'C', V: B.V * k, p: B.p * (B.V / (B.V * k)) ** GAMMA };
  const D = { id: 'D', V: A.V * k, p: A.p * (A.V / (A.V * k)) ** GAMMA };
  return [A, B, C, D];
}

export default function CarnotLive({ lang, id = 'live-carnot' }: { lang: Lang; id?: string }) {
  const [r, setR] = useState(2);
  const [tau, setTau] = useState(0.7);
  const L = makeCtx(lang).L;
  const svg = useMemo(() => {
    const params = {
      states: carnotStates(r, tau),
      gamma: GAMMA,
      processes: [
        { from: 'A', to: 'B', kind: 'isothermal' as const },
        { from: 'B', to: 'C', kind: 'adiabatic' as const },
        { from: 'C', to: 'D', kind: 'isothermal' as const },
        { from: 'D', to: 'A', kind: 'adiabatic' as const },
      ],
    };
    return finish('pv-cycle', params, pvCycle(params, makeCtx(lang)), { lang, idPrefix: id }).svg;
  }, [r, tau, lang, id]);
  return (
    <LiveFrame
      id={id}
      title={L('Ciclo di Carnot', 'Carnot cycle')}
      svg={svg}
      readout={L(
        `Rendimento η = 1 − Tc/Th = ${fix(lang, (1 - tau) * 100, 0)} %`,
        `Efficiency η = 1 − Tc/Th = ${fix(lang, (1 - tau) * 100, 0)} %`,
      )}
    >
      <Slider
        lang={lang}
        label={L('Espansione isoterma (rapporto dei volumi B/A)', 'Isothermal expansion (volume ratio B/A)')}
        value={r}
        min={1.5}
        max={4}
        step={0.1}
        format={(v) => fix(lang, v, 1)}
        onInput={setR}
      />
      <Slider
        lang={lang}
        label={L('Temperatura fredda / temperatura calda', 'Cold / hot temperature ratio')}
        value={tau}
        min={0.5}
        max={0.9}
        step={0.05}
        format={(v) => fix(lang, v)}
        onInput={setTau}
      />
    </LiveFrame>
  );
}
