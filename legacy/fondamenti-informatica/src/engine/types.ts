import type { TopicId } from '~/content/types';

export type { TopicId };

/**
 * Tipi del motore d'esame.
 *
 * Ogni quesito è **serializzabile**: niente funzioni sugli oggetti, così una
 * prova può essere salvata, ricaricata o esportata in JSON (§14). È il motivo
 * per cui `normalize` è un'etichetta e non una funzione di normalizzazione.
 */

/**
 * `mc`, `fill`, `diagram` ed `expr` sono auto-corretti; `self` si risolve su
 * carta e si autovaluta.
 *
 * `diagram` ed `expr` esistono perché la prova vera li ha: due «completare
 * l'immagine» e due «da tabella di verità a espressione logica» su dodici
 * quesiti. Nessuno dei due ha bisogno dell'autovalutazione — le etichette si
 * confrontano una per una, e l'espressione si legge e si verifica su tutte le
 * combinazioni — quindi entrambi danno un voto oggettivo.
 */
export type QuestionKind = 'mc' | 'fill' | 'self' | 'diagram' | 'expr';

/** Riga di uno snippet assembly: la UI colora l'etichetta, non il testo. */
export interface AsmLine {
  /** Etichetta di salto, es. "CICLO:". */
  label?: string;
  text: string;
  /** Commento in coda, reso con il colore dei commenti. */
  comment?: string;
}

/**
 * Dati strutturati per il rendering. Servono a tenere la logica di dominio
 * fuori dai componenti: la UI riceve una tabella o una mappa già calcolata e
 * si limita a disegnarla.
 */
export type QuestionPayload =
  | {
      type: 'truthTable';
      vars: string[];
      rows: { in: number[]; out: 0 | 1 }[];
    }
  | {
      type: 'kmap';
      vars: string[];
      /** Righe già pronte da disegnare, indifferenze incluse. */
      rows: { in: number[]; out: 0 | 1 | 'x' }[];
      /** Combinazioni con uscita 1. */
      minterms: number[];
      /** Combinazioni indifferenti (x). */
      dontCares: number[];
    }
  | { type: 'asm'; lines: AsmLine[] };

interface QuestionBase {
  id: string;
  kind: QuestionKind;
  /** Etichetta della categoria mostrata sopra al quesito. */
  cat: string;
  points: number;
  /** Testo del quesito; può contenere markup inline. */
  q: string;
  /**
   * Modulo di studio dell'argomento. È anche il rimando mostrato sotto al
   * quesito: da un errore si arriva in un clic alla teoria che lo spiega.
   */
  topic: TopicId;
  payload?: QuestionPayload;
  /**
   * Id della voce di banca da cui nasce il quesito, quando ne esiste una.
   * Aggancio per la ripetizione dilazionata (§14): permette di tracciare gli
   * esiti per domanda, non solo per esame.
   */
  bankId?: string;
}

export interface McQuestion extends QuestionBase {
  kind: 'mc';
  options: string[];
  /** Indice della risposta esatta in `options`. */
  correct: number;
  /** Spiegazione mostrata in fase di correzione. */
  hint?: string;
}

export interface FillQuestion extends QuestionBase {
  kind: 'fill';
  answer: string;
  /** Come normalizzare la risposta prima del confronto. */
  normalize: 'bin' | 'hex' | 'dec';
  placeholder?: string;
  hint?: string;
}

export interface SelfQuestion extends QuestionBase {
  kind: 'self';
  /** Soluzione modello rivelata dopo il tentativo. */
  model: string;
}

/**
 * «Completare l'immagine»: uno schema con alcune etichette da collocare.
 *
 * Gli slot e le opzioni sono **copiati dentro il quesito**, non risolti a
 * correzione contro `content/diagrams.ts`: così la prova resta serializzabile
 * e correggibile per conto proprio, come tutti gli altri quesiti.
 */
export interface DiagramQuestion extends QuestionBase {
  kind: 'diagram';
  diagramId: string;
  /** Etichette proposte, già mescolate: le giuste più i distrattori. */
  options: string[];
  /** Posizioni da riempire, con l'etichetta corretta. */
  slots: { id: string; label: string }[];
}

/**
 * «Da tabella di verità a espressione logica».
 *
 * Il quesito porta la funzione, non la risposta: la correzione legge
 * l'espressione scritta e la confronta con la SOP minima esatta, quindi
 * qualunque forma corretta viene accettata.
 */
export interface ExprQuestion extends QuestionBase {
  kind: 'expr';
  vars: number;
  minterms: number[];
  dontCares: number[];
  /** Semplificazione mostrata a correzione avvenuta. */
  model: string;
}

export type Question =
  | McQuestion
  | FillQuestion
  | SelfQuestion
  | DiagramQuestion
  | ExprQuestion;

export type ExamMode = 'full' | 'quick' | 'binary' | 'logic';

export interface Exam {
  id: string;
  mode: ExamMode;
  /** Seme del generatore: rigenerare con lo stesso seme dà la stessa prova. */
  seed: number;
  createdAt: number;
  questions: Question[];
  /** Somma dei punti. Per `full` vale esattamente 30. */
  totalPoints: number;
}

/** Autovalutazione di un quesito `self`: pieno, parziale, niente. */
export type SelfGrade = 1 | 0.5 | 0;

export type Answer =
  | { kind: 'mc'; choice: number | null }
  | { kind: 'fill'; text: string }
  | { kind: 'self'; grade: SelfGrade | null }
  /** Etichetta scelta per ogni slot, indicizzata per id di slot. */
  | { kind: 'diagram'; picks: Record<string, string> }
  | { kind: 'expr'; text: string };

export type Outcome = 'correct' | 'partial' | 'wrong' | 'blank';

export interface QuestionResult {
  id: string;
  bankId?: string;
  outcome: Outcome;
  earned: number;
  max: number;
}

export interface ExamResult {
  examId: string;
  mode: ExamMode;
  finishedAt: number;
  results: QuestionResult[];
  earned: number;
  total: number;
  /** Voto in trentesimi. Presente solo per la modalità `full`. */
  score30?: number;
  /** Lode: solo a punteggio pieno. */
  lode: boolean;
  percent: number;
}
