import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { checkStep, type Drill, type DrillStep } from '~/engine/drills';
import { AsmBlock } from '~/ui/components/AsmBlock';
import { Rich } from '~/ui/components/Rich';
import { TopicRef } from '~/ui/components/TopicRef';

const PLACEHOLDER: Record<DrillStep['kind'], string> = {
  bin: '0 e 1',
  hex: 'es. 1F',
  dec: 'numero',
  yesno: 'sì / no',
};

function StepRow({
  step,
  index,
  value,
  onInput,
}: {
  step: DrillStep;
  index: number;
  value: string;
  onInput: (text: string) => void;
}): JSX.Element {
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const verdict = checkStep(step, value);

  return (
    <li class={`step${verdict === true ? ' ok' : verdict === false ? ' ko' : ''}`}>
      <div class="step-n" aria-hidden="true">
        {index + 1}
      </div>
      <div class="step-body">
        <Rich class="step-q" html={step.prompt} as="p" />
        <div class="field">
          <input
            type="text"
            class={verdict === true ? 'fill ok' : verdict === false ? 'fill ko' : 'fill'}
            style={step.kind === 'bin' ? 'width:220px' : 'width:150px'}
            inputMode={step.kind === 'dec' ? 'numeric' : 'text'}
            autocomplete="off"
            spellcheck={false}
            aria-label={`Passo ${index + 1}`}
            placeholder={PLACEHOLDER[step.kind]}
            value={value}
            onInput={(event) => onInput((event.target as HTMLInputElement).value)}
          />
          {step.width && <span class="step-w">{step.width} bit</span>}
          <span class="step-v" aria-live="polite">
            {verdict === true ? '✓ giusto' : verdict === false ? '✗ riprova' : ''}
          </span>
        </div>

        <div class="step-tools">
          <button type="button" class="btn ghost mini" onClick={() => setShowHint((on) => !on)}>
            {showHint ? 'Nascondi il come si fa' : 'Come si fa'}
          </button>
          <button type="button" class="btn ghost mini" onClick={() => setShowAnswer((on) => !on)}>
            {showAnswer ? 'Nascondi la risposta' : 'Mostra la risposta'}
          </button>
        </div>
        {showHint && <Rich class="step-hint" html={step.hint} as="p" />}
        {showAnswer && (
          <p class="step-hint">
            Risposta: <code>{step.answer}</code>
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * Esegue un esercizio guidato: un passo alla volta, ognuno corretto per conto
 * suo. Lo stato delle risposte vive qui perché non serve altrove; l'esercizio
 * invece arriva già costruito dal motore, così la UI non calcola nulla.
 */
export function DrillRunner({ drill }: { drill: Drill }): JSX.Element {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const done = drill.steps.filter((step) => checkStep(step, inputs[step.id] ?? '') === true).length;

  return (
    <div class="drill">
      <h3>{drill.title}</h3>
      <div class="th-ref">{drill.recap}</div>
      {drill.listing && <AsmBlock lines={drill.listing} />}
      <ol class="steps">
        {drill.steps.map((step, index) => (
          <StepRow
            key={step.id}
            step={step}
            index={index}
            value={inputs[step.id] ?? ''}
            onInput={(text) => setInputs((prev) => ({ ...prev, [step.id]: text }))}
          />
        ))}
      </ol>
      <div class="drill-foot">
        <span class={done === drill.steps.length ? 'ok' : ''}>
          {done} / {drill.steps.length} passaggi corretti
          {done === drill.steps.length ? ' · esercizio completo' : ''}
        </span>
        <TopicRef class="th-ref" topic={drill.topic} />
      </div>
    </div>
  );
}
