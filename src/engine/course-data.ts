/**
 * Forma "di consegna" dei dati di un corso alle isole: già localizzata nella
 * lingua della pagina e con i testi ricchi già resi in HTML (KaTeX a
 * build-time). La produce `src/lib/course-data.ts` dalle content collections;
 * la stessa forma è servita come JSON da `<corso>/dati.json` per le isole che
 * caricano i dati su richiesta (prova d'esame, stampa, ripasso globale).
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

export interface CourseData extends CourseSummary {
  topics: TopicInfo[];
  exercises: ExerciseData[];
  cards: CardData[];
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
