/**
 * Comandi di riproduzione: avvia/pausa, ricomincia, passo, velocità.
 * Pulsanti nativi con etichette accessibili; aree di tocco ≥ 44 px.
 */
import { simT, type Lang } from './i18n';

export interface ControlsProps {
  lang: Lang;
  running: boolean;
  onToggle: () => void;
  onReset?: () => void;
  onStep?: () => void;
  /** Velocità attuale e valori proposti (es. [0.25, 0.5, 1, 2]). */
  speed?: number;
  speeds?: number[];
  onSpeed?: (s: number) => void;
  /** Messaggio quando l'animazione è ferma per movimento ridotto. */
  reducedMotion?: boolean;
}

export function Controls(p: ControlsProps): preact.JSX.Element {
  const t = (k: Parameters<typeof simT>[1]): string => simT(p.lang, k);
  return (
    <div class="sim-controls" role="group" aria-label={t('play') + ' / ' + t('pause')}>
      <button
        type="button"
        class="btn btn--primary sim-controls__play"
        aria-pressed={p.running}
        onClick={p.onToggle}
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16">
          {p.running ? (
            <path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" />
          ) : (
            <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
          )}
        </svg>
        {p.running ? t('pause') : t('play')}
      </button>
      {p.onStep && (
        <button type="button" class="btn" onClick={p.onStep} disabled={p.running}>
          {t('step')}
        </button>
      )}
      {p.onReset && (
        <button type="button" class="btn" onClick={p.onReset}>
          {t('reset')}
        </button>
      )}
      {p.onSpeed && p.speeds && (
        <label class="sim-controls__speed">
          <span>{t('speed')}</span>
          <select
            value={String(p.speed ?? 1)}
            onChange={(e) => p.onSpeed!(Number((e.currentTarget as HTMLSelectElement).value))}
          >
            {p.speeds.map((s) => (
              <option value={String(s)}>{`${String(s).replace('.', p.lang === 'it' ? ',' : '.')}×`}</option>
            ))}
          </select>
        </label>
      )}
      {p.reducedMotion && !p.running && <p class="sim-note">{t('reducedMotion')}</p>}
    </div>
  );
}
