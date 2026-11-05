import type { JSX } from 'preact';
import type { Diagram } from '~/content/diagrams';
import { TopicRef } from './TopicRef';

/** Freccia condivisa: definita una volta qui, richiamata dagli SVG dei dati. */
export function ArrowDefs(): JSX.Element {
  return (
    <defs>
      <marker
        id="aefin-arrow"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M0 0 L10 5 L0 10 z" fill="var(--color-line)" />
      </marker>
    </defs>
  );
}

/**
 * Posizione percentuale di uno slot dentro il viewBox.
 *
 * Di norma l'etichetta è **centrata** sul punto (`translate(-50%,-50%)` sta
 * nel CSS). Vicino ai bordi però centrarla la farebbe finire per metà fuori
 * dal riquadro — succedeva a «Riporto uscente» e «Riporto entrante» — quindi
 * lì si ancora al bordo e cresce verso l'interno.
 */
export function slotStyle(x: number, y: number, w: number, h: number): string {
  const left = (x / w) * 100;
  const top = (y / h) * 100;

  // Verticale: sotto il bordo l'etichetta finirebbe sulla didascalia.
  const vertical =
    top >= 94 ? `bottom:${100 - top}%` : top <= 6 ? `top:${top}%` : `top:${top}%;`;
  const centred = top > 6 && top < 94;

  if (left <= 12) {
    return `left:${left}%;${vertical};transform:translate(0,${centred ? '-50%' : '0'})`;
  }
  if (left >= 88) {
    return `right:${100 - left}%;${vertical};transform:translate(0,${centred ? '-50%' : '0'})`;
  }
  return centred
    ? `left:${left}%;top:${top}%`
    : `left:${left}%;${vertical};transform:translate(-50%,0)`;
}

/** Lo schema con tutte le etichette al loro posto: serve da figura di studio. */
export function DiagramFigure({ diagram }: { diagram: Diagram }): JSX.Element {
  return (
    <figure class="dg" style="margin-left:0;margin-right:0">
      {/* Il riquadro coincide con l'SVG: le percentuali degli slot valgono
          sul disegno, non sulla figura (che ha padding e didascalia). */}
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
        {diagram.slots.map((slot) => (
          <span
            key={slot.id}
            class="dg-slot"
            style={slotStyle(slot.x, slot.y, diagram.width, diagram.height)}
          >
            <span class="dg-label">{slot.label}</span>
          </span>
        ))}
      </div>
      <figcaption class="dg-caption">
        {diagram.title} · <TopicRef topic={diagram.topic} />
      </figcaption>
    </figure>
  );
}
