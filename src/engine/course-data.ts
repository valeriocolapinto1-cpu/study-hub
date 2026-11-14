/**
 * Forma "di consegna" dei dati di un corso alle isole: già localizzata nella
 * lingua della pagina e con i testi ricchi già resi in HTML (KaTeX a
 * build-time). La produce `src/lib/course-data.ts` dalle content collections.
 *
 * Nel browser i dati arrivano divisi: `<corso>/dati/indice.json` (`CourseIndex`: meta, id,
 * argomenti, obiettivi, tipo; niente HTML) e `<corso>/dati/<argomento>.json` (`TopicData`:
 * HTML di carte ed esercizi di un solo argomento), scaricati quando servono.
 */
import type { Lang } from '../config/site';

export interface ObjectiveInfo {
  id: string;
  text: string;
}

export interface TopicInfo {
  id: string;
  order: number;
  title: string;
  objectives: ObjectiveInfo[];
  group?: string;
}

export interface AnswerItemData {
  label: string;
  /** Etichetta resa in HTML (matematica KaTeX), se contiene markup. */
  labelHtml?: string;
  value: number | string;
  unit?: string;
  tol?: number;
  kind?: 'number' | 'complex' | 'text';
  accept?: string[];
}

export interface ChoiceData {
  html: string;
  /** Testo semplice per il nome accessibile (le scelte di sole formule non ne hanno uno). */
  label?: string;
  correct: boolean;
  explanationHtml?: string;
}

export interface StepData {
  titleHtml: string;
  bodyHtml: string;
}

/** Categoria di una domanda d'esame ricavata dall'esercizio. */
export type ExerciseCategory = 'numeric' | 'choice' | 'open';

export interface ExerciseData {
  id: string;
  topic: string;
  objectives: string[];
  difficulty: 1 | 2 | 3;
  kind: 'static' | 'generated';
  /** `<courseId>/<nome>` per gli esercizi generati. */
  generator?: string;
  /** Anteprima in testo semplice (elenchi, aria-label). */
  title: string;
  statementHtml?: string;
  /** SVG della figura (le netlist sono già rese a build-time da src/sim/circuits/schematic.ts). */
  figureSvg?: string;
  steps: StepData[];
  answer: AnswerItemData[];
  choices?: ChoiceData[];
  /** Mostrato in italiano perché manca la traduzione. */
  fallback?: boolean;
  /**
   * Generati: seme della variante già resa a build-time nei campi sopra. L'isola la mostra
   * senza scaricare generatori e KaTeX finché non si chiede una nuova variante.
   */
  pregeneratedSeed?: number;
  /**
   * Versione "leggera" nelle props di una pagina: i corpi dei passi e le spiegazioni delle scelte
   * sono vuoti e l'isola li scarica da `dati/<argomento>.json` solo quando servono.
   */
  lean?: boolean;
}

export interface CardData {
  id: string;
  topic: string;
  objectives: string[];
  kind: 'definizione' | 'formula' | 'orale' | 'concetto';
  frontHtml: string;
  backHtml: string;
  fallback?: boolean;
}

/** Esercizio nell'indice del corso: solo metadati, nessun HTML. */
export interface ExerciseIndex {
  id: string;
  topic: string;
  objectives: string[];
  difficulty: 1 | 2 | 3;
  kind: 'static' | 'generated';
  generator?: string;
  /** Anteprima in testo semplice. */
  title: string;
  /** L'esercizio ha un enunciato statico (i generati no: il titolo è l'argomento). */
  hasStatement: boolean;
  category: ExerciseCategory;
}

/** Carta nell'indice del corso: solo metadati, nessun HTML. */
export interface CardIndex {
  id: string;
  topic: string;
  objectives: string[];
  kind: CardData['kind'];
}

/** Contenuto HTML di un argomento (`dati/<argomento>.json`). */
export interface TopicData {
  exercises: ExerciseData[];
  cards: CardData[];
}

export interface ExamPartData {
  label: string;
  points?: number;
  kind: string;
}

export interface CoursePaths {
  overview: string;
  theory: string;
  exercises: string;
  review: string;
  exam: string;
  progress: string;
  data: string;
  print: string;
}

export interface CourseSummary {
  id: string;
  lang: Lang;
  year: number;
  title: string;
  examFormat: 'scritto' | 'orale' | 'scritto+orale';
  durationMin?: number;
  structure: ExamPartData[];
  examDates: string[];
  paths: CoursePaths;
}

/** `dati/indice.json`: tutto ciò che serve a elenchi, code e prove prima di scaricare i testi. */
export interface CourseIndex extends CourseSummary {
  topics: TopicInfo[];
  exercises: ExerciseIndex[];
  cards: CardIndex[];
}

export interface CourseData extends CourseSummary {
  topics: TopicInfo[];
  exercises: ExerciseData[];
  cards: CardData[];
}

/** Categoria d'esame di un esercizio: scelte → `choice`, risposte o generato → `numeric`, altrimenti `open`. */
export function exerciseCategory(e: Pick<ExerciseData, 'kind' | 'answer' | 'choices'>): ExerciseCategory {
  if (e.choices && e.choices.length > 0) return 'choice';
  if (e.answer.length > 0 || e.kind === 'generated') return 'numeric';
  return 'open';
}

/** URL di un file dati del corso: `<paths.data>/indice.json` o `<paths.data>/<argomento>.json`. */
export const dataUrl = (base: string, name: string): string => `${base}/${name}.json`;
export const INDEX_NAME = 'indice';

/** Mappa id → obiettivi (per padronanza e piano di studio, senza i testi). */
export function objectivesIndex(
  items: ReadonlyArray<{ id: string; objectives: string[] }>,
): Record<string, string[]> {
  return Object.fromEntries(items.map((i) => [i.id, i.objectives]));
}

/** Chiave dell'aiuto sotto i campi di risposta: testuale se tutti i campi sono testuali (codici, nomi, sì/no). */
export const answerHelpKey = (
  answers: readonly AnswerItemData[],
): 'exercise.answerHelp' | 'exercise.answerHelpText' =>
  answers.length > 0 && answers.every((a) => a.kind === 'text')
    ? 'exercise.answerHelpText'
    : 'exercise.answerHelp';
