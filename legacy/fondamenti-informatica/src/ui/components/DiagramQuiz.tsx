import type { JSX } from 'preact';
import type { Diagram } from '~/content/diagrams';
import { ArrowDefs, slotStyle } from './DiagramFigure';
import { TopicRef } from './TopicRef';

/** Etichetta scelta per ogni slot, indicizzata per id di slot. */
export type DiagramPicks = Record<string, string>;

/** Quali slot sono giusti, una volta corretto. */
export type DiagramVerdict = Record<string, boolean>;

export function checkDiagram(diagram: Diagram, picks: DiagramPicks): DiagramVerdict {
  return Object.fromEntries(
    diagram.slots.map((slot) => [slot.id, picks[slot.id] === slot.label]),
  );
}

export function countCorrect(verdict: DiagramVerdict): number {
  return Object.values(verdict).filter(Boolean).length;
}

/**
 * Schema con le etichette da collocare.
 *
 * Componente **controllato**: lo stato sta fuori, così lo stesso quiz serve sia
 * dentro una prova d'esame (dove le risposte vivono nello stato della prova)
 * sia nella pagina di allenamento.
 *
 * Le etichette disponibili sono quelle giuste **più alcuni distrattori**,
 * mescolate una volta sola in `options`: l'elenco è identico per tutti gli
 * slot, quindi va scelto quale mettere dove, non semplicemente abbinato uno a
 * uno per esclusione.
 */
export function DiagramQuiz({
  diagram,
  options,
  picks,
  onPick,
  verdict,
  locked = false,
}: {
  diagram: Diagram;
  options: string[];
  picks: DiagramPicks;
  onPick: (slotId: string, label: string) => void;
  verdict?: DiagramVerdict;
  locked?: boolean;
}): JSX.Element {
  return (
    <div class="dg">
      <div class="dg-frame">
        <svg
          class="dg-svg"
          viewBox={`0 0 ${diagram.width} ${diagram.height}`}
          role="img"
          aria-label={diagram.title}
        >
          <ArrowDefs />
          <g dangerouslySetInnerHTML={{ __html: diagram.svg }} />
        </svg>

        {diagram.slots.map((slot, index) => {
          const state = verdict ? (verdict[slot.id] ? ' ok' : ' ko') : '';
          return (
            <span
              key={slot.id}
              class={`dg-slot${state}`}
              style={slotStyle(slot.x, slot.y, diagram.width, diagram.height)}
            >
              <select
                aria-label={`Etichetta ${index + 1} di ${diagram.slots.length}`}
                disabled={locked}
                value={picks[slot.id] ?? ''}
                onChange={(event) => onPick(slot.id, (event.target as HTMLSelectElement).value)}
              >
                <option value="">— {index + 1} —</option>
                {options.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
              {verdict && !verdict[slot.id] && <span class="dg-n">{slot.label}</span>}
            </span>
          );
        })}
      </div>

      <div class="dg-caption">
        {diagram.title} · <TopicRef topic={diagram.topic} />
      </div>
    </div>
  );
}
