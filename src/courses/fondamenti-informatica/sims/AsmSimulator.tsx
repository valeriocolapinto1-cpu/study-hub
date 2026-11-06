/**
 * Simulatore assembly: esegue un'istruzione alla volta i tre programmi tipo
 * del corso (ciclo con contatore, prodotto-confronto-salto, shift), mostrando
 * registri, flag e istruzione corrente. La traccia è calcolata in anticipo da
 * `traceProgram` (puro e testato): l'isola si limita a scorrerla.
 */
import { useMemo, useState } from 'preact/hooks';
import { traceProgram, type ProgramKind, type TraceStep } from '../lib/asmTrace';
import '../../../sim/sim.css';

type Lang = 'it' | 'en';
const L = (lang: Lang, it: string, en: string) => (lang === 'en' ? en : it);

const PARAMS: Record<
  ProgramKind,
  { key: string; it: string; en: string; min: number; max: number; def: number }[]
> = {
  loop: [
    { key: 'start', it: 'Valore iniziale di R1', en: 'Initial value of R1', min: 1, max: 40, def: 10 },
    { key: 'step', it: 'Decremento', en: 'Decrement', min: 1, max: 9, def: 3 },
  ],
  mulcmp: [
    { key: 'a', it: 'Primo fattore', en: 'First factor', min: 0, max: 20, def: 6 },
    { key: 'b', it: 'Secondo fattore', en: 'Second factor', min: 0, max: 20, def: 7 },
    { key: 'cmp', it: 'Valore confrontato', en: 'Compared value', min: 0, max: 400, def: 42 },
    { key: 'add', it: 'Addendo finale', en: 'Final addend', min: 0, max: 20, def: 5 },
  ],
  shift: [
    { key: 'value', it: 'Valore iniziale', en: 'Initial value', min: 0, max: 255, def: 13 },
    { key: 'left', it: 'Shift a sinistra', en: 'Left shift', min: 0, max: 8, def: 3 },
    { key: 'right', it: 'Shift a destra', en: 'Right shift', min: 0, max: 8, def: 2 },
  ],
};

const NAMES: Record<ProgramKind, { it: string; en: string }> = {
  loop: { it: 'Ciclo con contatore', en: 'Counter loop' },
  mulcmp: { it: 'Prodotto, confronto e salto', en: 'Product, compare and branch' },
  shift: { it: 'Shift logici', en: 'Logical shifts' },
};

const defaults = (k: ProgramKind) => Object.fromEntries(PARAMS[k].map((p) => [p.key, p.def]));

export default function AsmSimulator({ lang }: { lang: Lang }) {
  const [kind, setKind] = useState<ProgramKind>('loop');
  const [params, setParams] = useState<Record<string, number>>(defaults('loop'));
  const [i, setI] = useState(0);
  const trace = useMemo(() => traceProgram(kind, params, lang), [kind, params, lang]);
  const step: TraceStep = trace.steps[Math.min(i, trace.steps.length - 1)]!;
  const done = i >= trace.steps.length - 1;

  const choose = (k: ProgramKind) => {
    setKind(k);
    setParams(defaults(k));
    setI(0);
  };

  return (
    <section class="sim" aria-labelledby="fi-asm-title">
      <h2 class="sim__title" id="fi-asm-title">
        {L(lang, 'Esecuzione passo per passo', 'Step-by-step execution')}
      </h2>
      <div class="sim__panel">
        <div class="field">
          <label class="field__label" for="fi-asm-prog">
            {L(lang, 'Programma', 'Program')}
          </label>
          <select
            id="fi-asm-prog"
            class="select"
            value={kind}
            onChange={(e) => choose(e.currentTarget.value as ProgramKind)}
          >
            {(Object.keys(NAMES) as ProgramKind[]).map((k) => (
              <option key={k} value={k}>
                {NAMES[k][lang]}
              </option>
            ))}
          </select>
        </div>
        {PARAMS[kind].map((p) => (
          <div class="field" key={p.key}>
            <label class="field__label" for={`fi-asm-${p.key}`}>
              {lang === 'en' ? p.en : p.it}
            </label>
            <input
              id={`fi-asm-${p.key}`}
              class="input input--mono"
              type="number"
              min={p.min}
              max={p.max}
              value={params[p.key]}
              onInput={(e) => {
                const v = Number(e.currentTarget.value);
                if (Number.isInteger(v) && v >= p.min && v <= p.max) {
                  setParams({ ...params, [p.key]: v });
                  setI(0);
                }
              }}
            />
          </div>
        ))}
      </div>

      <ol
        style="list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; white-space: pre; overflow-x: auto"
        aria-label={L(lang, 'Listato', 'Listing')}
      >
        {trace.listing.map((line, n) => (
          <li
            key={n}
            aria-current={step.line === n ? 'step' : undefined}
            class={step.line === n ? 'chip' : undefined}
          >
            <code>
              {(line.label ?? '').padEnd(7)}
              {line.text}
            </code>
            {line.comment && <span class="sim-note"> {line.comment}</span>}
          </li>
        ))}
      </ol>

      <div class="btn-row">
        <button type="button" class="btn" onClick={() => setI(0)} disabled={i === 0}>
          {L(lang, 'Ricomincia', 'Restart')}
        </button>
        <button type="button" class="btn" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}>
          {L(lang, 'Indietro', 'Back')}
        </button>
        <button type="button" class="btn btn--primary" onClick={() => setI(i + 1)} disabled={done}>
          {L(lang, 'Passo', 'Step')}
        </button>
        <button type="button" class="btn" onClick={() => setI(trace.steps.length - 1)} disabled={done}>
          {L(lang, 'Fino alla fine', 'Run to end')}
        </button>
      </div>

      <dl class="facts">
        {Object.entries(step.regs).map(([r, v]) => (
          <div key={r}>
            <dt>{r}</dt>
            <dd class="input--mono">{v}</dd>
          </div>
        ))}
        <div>
          <dt>{L(lang, 'Flag', 'Flags')}</dt>
          <dd class="input--mono">
            Z={step.flags.Z ? 1 : 0} N={step.flags.N ? 1 : 0}
          </dd>
        </div>
      </dl>
      <p class="sim-readout" aria-live="polite">
        {L(lang, `Passo ${i} di ${trace.steps.length - 1}. `, `Step ${i} of ${trace.steps.length - 1}. `)}
        {step.note}
      </p>
    </section>
  );
}
