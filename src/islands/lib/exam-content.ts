/** Contenuto delle domande di una prova (statiche, generate, flashcard), condiviso da ExamRunner e dalla stampa. */
import type { AnswerItemData, ChoiceData, CourseData, StepData } from '../../engine/course-data';
import type { Exam, ExamQuestion, ResolvedQuestion } from '../../engine/exam';
import type { Lang } from '../../config/site';
import { generatedContent, staticContent } from '../ExercisePlayer';

export interface QuestionContent {
  statementHtml: string;
  figureSvg?: string | undefined;
  steps: StepData[];
  answer: AnswerItemData[];
  choices?: ChoiceData[] | undefined;
}

export async function resolveQuestion(
  data: CourseData,
  q: ExamQuestion,
  lang: Lang,
  answerTitle: string,
): Promise<QuestionContent> {
  if (q.ref.type === 'card') {
    const c = data.cards.find((x) => x.id === q.ref.id);
    if (!c) throw new Error(`carta sconosciuta: ${q.ref.id}`);
    return {
      statementHtml: c.frontHtml,
      steps: [{ titleHtml: answerTitle, bodyHtml: c.backHtml }],
      answer: [],
    };
  }
  const e = data.exercises.find((x) => x.id === q.ref.id);
  if (!e) throw new Error(`esercizio sconosciuto: ${q.ref.id}`);
  if (e.kind === 'generated' && e.generator) return generatedContent(data.id, e.generator, q.seed ?? 1, lang);
  return staticContent(e);
}

export function resolveExam(
  data: CourseData,
  exam: Exam,
  lang: Lang,
  answerTitle: string,
): Promise<QuestionContent[]> {
  return Promise.all(exam.questions.map((q) => resolveQuestion(data, q, lang, answerTitle)));
}

export const toResolved = (c: QuestionContent | undefined): ResolvedQuestion | undefined =>
  c ? { answer: c.answer, ...(c.choices ? { choices: c.choices } : {}) } : undefined;
