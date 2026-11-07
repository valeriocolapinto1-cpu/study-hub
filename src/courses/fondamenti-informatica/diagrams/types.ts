/** Testo di uno schema: l'inglese manca solo per sigle e simboli identici nelle due lingue. */
export interface DText {
  it: string;
  en?: string;
}

export interface DiagramSlot {
  id: string;
  /** Centro dell'etichetta, in coordinate del viewBox. */
  x: number;
  y: number;
  label: DText;
}

export interface Diagram {
  id: string;
  /** Argomento (id del sito nuovo). */
  topic: string;
  width: number;
  height: number;
  title: DText;
  slots: DiagramSlot[];
  /** Etichette plausibili ma sbagliate, per l'esercizio. */
  distractors: DText[];
  /** Disegno di base senza le etichette degli slot, con le scritte già nella lingua. */
  svg: { it: string; en: string };
}
