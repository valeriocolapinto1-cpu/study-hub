import type { ExamAnswer } from '../../engine/exam';

/** Una domanda conta come risposta se ha una scelta, un campo compilato o (aperta) un'autovalutazione. */
export function isAnswered(a: ExamAnswer | undefined, category: string): boolean {
  if (!a) return false;
  if (a.choices?.length) return true;
  if (a.fields?.some((f) => f.trim() !== '')) return true;
  return category === 'open' && a.self !== undefined;
}
