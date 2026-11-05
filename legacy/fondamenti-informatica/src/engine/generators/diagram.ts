import { diagrams } from '~/content/diagrams';
import { pickUnused, shuffle } from '../rng';
import type { DiagramQuestion } from '../types';
import { questionId, type GenCtx } from './context';

/**
 * «Completare l'immagine»: il quesito che all'esame c'è sempre, due volte.
 *
 * Lo schema arriva dal content layer già ridisegnato in SVG originale; qui si
 * decide solo quali etichette proporre. Fra le opzioni ci sono anche i
 * distrattori dello schema, altrimenti con sei slot e sei etichette la
 * risposta si troverebbe per esclusione invece che ragionando.
 *
 * `pickUnused` registra lo schema fra le voci già usate, quindi i due
 * completamenti della stessa prova cadono su schemi diversi.
 */
export function genDiagramLabel(ctx: GenCtx): DiagramQuestion {
  const diagram = pickUnused(ctx.rng, diagrams, ctx.used);
  const labels = diagram.slots.map((slot) => slot.label);

  return {
    id: questionId(ctx),
    kind: 'diagram',
    cat: 'Completare lo schema',
    points: ctx.points,
    q:
      `Completa lo schema «${diagram.title}» collocando le etichette al posto giusto. ` +
      '<b>Attenzione:</b> l’elenco contiene più etichette delle posizioni disponibili.',
    topic: diagram.topic,
    diagramId: diagram.id,
    // Insieme, non elenco: nella traduzione degli indirizzi l'etichetta
    // «Offset» va in due posizioni diverse — è proprio il punto della figura —
    // e mostrarla due volte nel menu sarebbe solo confusione.
    options: shuffle(ctx.rng, [...new Set([...labels, ...diagram.distractors])]),
    slots: diagram.slots.map((slot) => ({ id: slot.id, label: slot.label })),
    bankId: diagram.id,
  };
}
