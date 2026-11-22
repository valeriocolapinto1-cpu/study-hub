/** Contenuto delle domande di una prova (statiche, generate, flashcard), condiviso da ExamRunner e dalla stampa. */
import type { AnswerItemData, ChoiceData, CourseIndex, StepData } from '../../engine/course-data';
import type { Exam, ExamQuestion, ResolvedQuestion } from '../../engine/exam';
import { choiceOrder, deriveSeed } from '../../engine/random';
import type { Lang } from '../../config/site';
import { generatedContent, staticContent } from '../ExercisePlayer';
import { loadCard, loadExercise } from './course-data-client';

export interface QuestionContent {
  statementHtml: string;
  figureSvg?: string | undefined;
  steps: StepData[];
  answer: AnswerItemData[];
  choices?: ChoiceData[] | undefined;
}

/**
 * Testi di una domanda: i generati si eseguono nel browser, gli altri si leggono da
 * `dati/<argomento>.json` (scaricato una volta per argomento). Gli errori di rete sono `LoadError`.
 * Le alternative delle crocette sono rimescolate con il seme della prova (`examSeed`): le risposte
 * salvate sono indici in quest'ordine, che si ricostruisce identico alla ripresa e in stampa.
 */
export async function resolveQuestion(
  index: CourseIndex,
  q: ExamQuestion,
  lang: Lang,
  answerTitle: string,
  examSeed = 0,
): Promise<QuestionContent> {
  const c = await questionContent(index, q, lang, answerTitle);
  if (!c.choices?.length) return c;
  const order = choiceOrder(c.choices, deriveSeed('scelte', examSeed, q.index, q.ref.id));
  return { ...c, choices: order.map((i) => c.choices![i]!) };
}

async function questionContent(
  index: CourseIndex,
  q: ExamQuestion,
  lang: Lang,
  answerTitle: string,
): Promise<QuestionContent> {
  if (q.ref.type === 'card') {
    const meta = index.cards.find((x) => x.id === q.ref.id);
    if (!meta) throw new Error(`carta sconosciuta: ${q.ref.id}`);
    const c = await loadCard(index.paths, meta);
    return {
      statementHtml: c.frontHtml,
      steps: [{ titleHtml: answerTitle, bodyHtml: c.backHtml }],
      answer: [],
    };
  }
  const e = index.exercises.find((x) => x.id === q.ref.id);
  if (!e) throw new Error(`esercizio sconosciuto: ${q.ref.id}`);
  if (e.kind === 'generated' && e.generator)
    return generatedContent(index.id, e.generator, q.seed ?? 1, lang);
  return staticContent(await loadExercise(index.paths, e));
}

export function resolveExam(
  index: CourseIndex,
  exam: Exam,
  lang: Lang,
  answerTitle: string,
): Promise<QuestionContent[]> {
  return Promise.all(
    exam.questions.map((q) => resolveQuestion(index, q, lang, answerTitle, exam.config.seed)),
  );
}

export const toResolved = (c: QuestionContent | undefined): ResolvedQuestion | undefined =>
  c ? { answer: c.answer, ...(c.choices ? { choices: c.choices } : {}) } : undefined;
