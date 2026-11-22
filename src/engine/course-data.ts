/**
 * Forma "di consegna" dei dati di un corso alle isole: già localizzata nella
 * lingua della pagina e con i testi ricchi già resi in HTML (KaTeX a
 * build-time). La produce `src/lib/course-data.ts` dalle content collections
 * ed è servita in due parti:
 *  - `<corso>/dati/indice.json` (`CourseIndex`): meta, argomenti, obiettivi,
 *    id e tipo di esercizi e carte, niente HTML;
 *  - `<corso>/dati/<argomento>.json` (`TopicData`): testi HTML di esercizi e
 *    carte di un argomento, scaricati dalle isole solo quando servono.
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

/** Categoria di una domanda di prova: risposta numerica/testuale, scelta, aperta. */
export type QuestionCategory = 'numeric' | 'choice' | 'open';

/** Voce dell'indice: tutto ciò che serve per elenchi, filtri, prove e padronanza, senza HTML. */
export interface ExerciseMeta {
  id: string;
  topic: string;
  objectives: string[];
  difficulty: 1 | 2 | 3;
  kind: 'static' | 'generated';
  /** `<courseId>/<nome>` per gli esercizi generati. */
  generator?: string;
  /** Anteprima in testo semplice (elenchi, aria-label). */
  title: string;
  /** Tipo di domanda (scelta della prova d'esame). */
  category?: QuestionCategory;
  /** Mostrato in italiano perché manca la traduzione. */
  fallback?: boolean;
}

export interface ExerciseData extends ExerciseMeta {
  statementHtml?: string;
  /** SVG della figura (le netlist sono già rese a build-time da src/sim/circuits/schematic.ts). */
  figureSvg?: string;
  steps: StepData[];
  answer: AnswerItemData[];
  choices?: ChoiceData[];
  /**
   * Generati: seme della variante già resa a build-time nei campi sopra. L'isola la mostra
   * senza scaricare generatori e KaTeX finché non si chiede una nuova variante.
   */
  pregeneratedSeed?: number;
  /**
   * Versione leggera (pagina di un argomento): `steps` e spiegazioni delle scelte sono
   * omessi e si scaricano da questo URL (`dati/<argomento>.json`) quando servono.
   */
  detailsUrl?: string;
  /** Con `detailsUrl`: numero di passi della soluzione omessi. */
  stepCount?: number;
}

export interface CardMeta {
  id: string;
  topic: string;
  objectives: string[];
  kind: 'definizione' | 'formula' | 'orale' | 'concetto';
}

export interface CardData extends CardMeta {
  frontHtml: string;
  backHtml: string;
  fallback?: boolean;
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
  /** Cartella dei dati per le isole (`…/dati/`): `indice.json` e `<argomento>.json`. */
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

export interface CourseData extends CourseSummary {
  topics: TopicInfo[];
  exercises: ExerciseData[];
  cards: CardData[];
}

/** `dati/indice.json`: il corso senza testi HTML. */
export interface CourseIndex extends CourseSummary {
  topics: TopicInfo[];
  exercises: ExerciseMeta[];
  cards: CardMeta[];
}

/** `dati/<argomento>.json`: testi HTML di esercizi e carte di un argomento. */
export interface TopicData {
  topic: string;
  exercises: ExerciseData[];
  cards: CardData[];
}

/** Nome riservato dell'indice nella cartella dei dati (nessun argomento può chiamarsi così). */
export const INDEX_FILE = 'indice';
export const indexUrl = (paths: Pick<CoursePaths, 'data'>): string => `${paths.data}${INDEX_FILE}.json`;
export const topicDataUrl = (paths: Pick<CoursePaths, 'data'>, topic: string): string =>
  `${paths.data}${topic}.json`;

/** Categoria di un esercizio (scelta multipla, risposta verificabile, aperto). */
export function exerciseCategory(
  e: Pick<ExerciseData, 'kind'> & Partial<Pick<ExerciseData, 'choices' | 'answer' | 'category'>>,
): QuestionCategory {
  if (e.category) return e.category;
  if (e.choices && e.choices.length > 0) return 'choice';
  if ((e.answer?.length ?? 0) > 0 || e.kind === 'generated') return 'numeric';
  return 'open';
}

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
