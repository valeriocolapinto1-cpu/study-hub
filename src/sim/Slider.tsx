/**
 * Cursore con etichetta, valore formattato con prefisso SI e unità, scala
 * lineare o logaritmica. Accessibile: <input type="range"> nativo con
 * aria-valuetext che legge il valore con l'unità.
 * NumberInput: campo testuale che accetta prefissi SI ("4,7k", "10u").
 */
import { useId, useState } from 'preact/hooks';
import { formatSI, parseSI, type Lang } from './units';
import { simT } from './i18n';

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  /** Passo (scala lineare) — default (max − min)/100. */
  step?: number;
  /** Scala logaritmica (min > 0): utile per R, C, frequenze. */
  log?: boolean;
  unit?: string;
  lang: Lang;
  digits?: number;
  /** Formattazione personalizzata del valore. */
  format?: (v: number) => string;
  onInput: (v: number) => void;
  /** Testo d'aiuto sotto il cursore. */
  hint?: string;
}

const LOG_STEPS = 1000;

export function Slider(p: SliderProps): preact.JSX.Element {
  const id = useId();
  const fmt =
    p.format ?? ((v: number): string => formatSI(v, p.unit ?? '', { lang: p.lang, digits: p.digits ?? 3 }));
  const toPos = (v: number): number =>
    p.log ? (Math.log(v / p.min) / Math.log(p.max / p.min)) * LOG_STEPS : v;
  const fromPos = (x: number): number => (p.log ? p.min * (p.max / p.min) ** (x / LOG_STEPS) : x);
  const text = fmt(p.value);
  return (
    <div class="sim-slider">
      <label for={id} class="sim-slider__label">
        {p.label}
      </label>
      <input
        id={id}
        type="range"
        min={p.log ? 0 : p.min}
        max={p.log ? LOG_STEPS : p.max}
        step={p.log ? 1 : (p.step ?? (p.max - p.min) / 100)}
        value={toPos(p.value)}
        aria-valuetext={text}
        aria-describedby={p.hint ? `${id}-h` : undefined}
        onInput={(e) => {
          let v = fromPos(Number((e.currentTarget as HTMLInputElement).value));
          if (p.log) v = Number(v.toPrecision(3));
          p.onInput(v);
        }}
      />
      <output for={id} class="sim-slider__value" aria-hidden="true">
        {text}
      </output>
      {p.hint && (
        <p id={`${id}-h`} class="sim-note">
          {p.hint}
        </p>
      )}
    </div>
  );
}

export interface NumberInputProps {
  label: string;
  value: number;
  unit?: string;
  lang: Lang;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}

export function NumberInput(p: NumberInputProps): preact.JSX.Element {
  const id = useId();
  const show = (v: number): string => formatSI(v, '', { lang: p.lang, digits: 4, sep: '' });
  const [draft, setDraft] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const commit = (s: string): void => {
    try {
      const v = parseSI(s);
      if (!Number.isFinite(v) || (p.min !== undefined && v < p.min) || (p.max !== undefined && v > p.max))
        throw new Error();
      setErr(false);
      setDraft(null);
      p.onChange(v);
    } catch {
      setErr(true);
    }
  };
  return (
    <div class="sim-number">
      <label for={id}>{p.label}</label>
      <span class="sim-number__field">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          spellcheck={false}
          autoComplete="off"
          value={draft ?? show(p.value)}
          aria-invalid={err}
          aria-describedby={err ? `${id}-e` : undefined}
          onInput={(e) => setDraft((e.currentTarget as HTMLInputElement).value)}
          onBlur={(e) => commit((e.currentTarget as HTMLInputElement).value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit((e.currentTarget as HTMLInputElement).value);
          }}
        />
        {p.unit && <span class="sim-number__unit">{p.unit}</span>}
      </span>
      {err && (
        <span id={`${id}-e`} class="sim-error" role="alert">
          {simT(p.lang, 'invalid')}
        </span>
      )}
    </div>
  );
}
