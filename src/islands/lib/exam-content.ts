/** Contenuto delle domande di una prova (statiche, generate, flashcard), condiviso da ExamRunner e dalla stampa. */
import type { AnswerItemData, ChoiceData, CourseIndex, StepData, TopicData } from '../../engine/course-data';
import { dataUrl } from '../../engine/course-data';
import type { Exam, ExamQuestion, ResolvedQuestion } from '../../engine/exam';
import type { Lang } from '../../config/site';
import { generatedContent, staticContent } from '../ExercisePlayer';
import { fetchJson } from './hooks';

export interface QuestionContent {
  statementHtml: string;
  figureSvg?: string | undefined;
  steps: StepData[];
  answer: AnswerItemData[];
  choices?: ChoiceData[] | undefined;
}

/** Contenuto di una domanda: carte ed esercizi statici dal file dell'argomento, i generati dal generatore. */
export async function resolveQuestion(
  data: CourseIndex,
  q: ExamQuestion,
  lang: Lang,
  answerTitle: string,
): Promise<QuestionContent> {
  const topicFile = (topic: string) => fetchJson<TopicData>(dataUrl(data.paths.data, topic));
  if (q.ref.type === 'card') {
    const meta = data.cards.find((x) => x.id === q.ref.id);
    if (!meta) throw new Error(`carta sconosciuta: ${q.ref.id}`);
    const c = (await topicFile(meta.topic)).cards.find((x) => x.id === meta.id);
    if (!c) throw new Error(`carta mancante: ${meta.id}`);
    return {
      statementHtml: c.frontHtml,
      steps: [{ titleHtml: answerTitle, bodyHtml: c.backHtml }],
      answer: [],
    };
  }
  const meta = data.exercises.find((x) => x.id === q.ref.id);
  if (!meta) throw new Error(`esercizio sconosciuto: ${q.ref.id}`);
  if (meta.kind === 'generated' && meta.generator)
    return generatedContent(data.id, meta.generator, q.seed ?? 1, lang);
  const e = (await topicFile(meta.topic)).exercises.find((x) => x.id === meta.id);
  if (!e) throw new Error(`esercizio mancante: ${meta.id}`);
  return staticContent(e);
}

export function resolveExam(
  data: CourseIndex,
  exam: Exam,
  lang: Lang,
  answerTitle: string,
): Promise<QuestionContent[]> {
  return Promise.all(exam.questions.map((q) => resolveQuestion(data, q, lang, answerTitle)));
}

export const toResolved = (c: QuestionContent | undefined): ResolvedQuestion | undefined =>
  c ? { answer: c.answer, ...(c.choices ? { choices: c.choices } : {}) } : undefined;
