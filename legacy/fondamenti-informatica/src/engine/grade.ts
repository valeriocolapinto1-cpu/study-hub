import { judgeSop } from './parseSop';
import type {
  Answer,
  DiagramQuestion,
  Exam,
  ExamResult,
  FillQuestion,
  Outcome,
  Question,
  QuestionResult,
} from './types';

/**
 * Normalizza una risposta breve prima del confronto.
 * - `bin`: si tengono solo 0 e 1, così «0110» e «0110 » e «01 10» coincidono
 * - `hex`: maiuscolo, via il prefisso 0x e ogni altro carattere
 * - `dec`: cifre e segno meno
 */
export function normalizeFill(input: string, kind: FillQuestion['normalize']): string {
  const trimmed = input.trim();
  switch (kind) {
    case 'bin':
      return trimmed.replace(/[^01]/g, '');
    case 'hex':
      return trimmed.toUpperCase().replace(/^0X/, '').replace(/[^0-9A-F]/g, '');
    case 'dec':
      return trimmed.replace(/[^0-9-]/g, '');
  }
}

/** La risposta è vuota, cioè il quesito è stato saltato? */
function isBlank(answer: Answer | undefined): boolean {
  if (!answer) return true;
  switch (answer.kind) {
    case 'mc':
      return answer.choice === null;
    case 'fill':
    case 'expr':
      return answer.text.trim() === '';
    case 'self':
      return answer.grade === null;
    case 'diagram':
      return Object.values(answer.picks).every((label) => label === '');
  }
}

/**
 * Quante etichette sono al posto giusto.
 *
 * All'esame lo schema completato a metà non vale zero, quindi qui il punteggio
 * è **proporzionale agli slot indovinati**: è l'unico quesito con credito
 * parziale calcolato, non dichiarato.
 */
export function countMatchingSlots(
  question: DiagramQuestion,
  picks: Record<string, string>,
): number {
  return question.slots.filter((slot) => picks[slot.id] === slot.label).length;
}

function gradeQuestion(question: Question, answer: Answer | undefined): QuestionResult {
  const base = { id: question.id, max: question.points } as const;
  const bankId = question.bankId !== undefined ? { bankId: question.bankId } : {};

  if (isBlank(answer)) {
    return { ...base, ...bankId, outcome: 'blank', earned: 0 };
  }

  let outcome: Outcome = 'wrong';
  let earned = 0;

  if (question.kind === 'mc' && answer?.kind === 'mc') {
    const correct = answer.choice === question.correct;
    outcome = correct ? 'correct' : 'wrong';
    earned = correct ? question.points : 0;
  } else if (question.kind === 'fill' && answer?.kind === 'fill') {
    const given = normalizeFill(answer.text, question.normalize);
    const expected = normalizeFill(question.answer, question.normalize);
    const correct = given.length > 0 && given === expected;
    outcome = correct ? 'correct' : 'wrong';
    earned = correct ? question.points : 0;
  } else if (question.kind === 'diagram' && answer?.kind === 'diagram') {
    const right = countMatchingSlots(question, answer.picks);
    const total = question.slots.length;
    earned = total > 0 ? (question.points * right) / total : 0;
    outcome = right === total ? 'correct' : right > 0 ? 'partial' : 'wrong';
  } else if (question.kind === 'expr' && answer?.kind === 'expr') {
    // Il giudizio sta in un posto solo: la stessa funzione usata dalla
    // palestra «Verità & Karnaugh».
    const verdict = judgeSop(
      answer.text,
      new Set(question.minterms),
      new Set(question.dontCares),
      question.vars,
    );
    if (verdict.status === 'minimal') {
      outcome = 'correct';
      earned = question.points;
    } else if (verdict.status === 'correct') {
      // Corretta ma ridondante: all'esame è mezzo punto, non zero.
      outcome = 'partial';
      earned = question.points / 2;
    }
  } else if (question.kind === 'self' && answer?.kind === 'self' && answer.grade !== null) {
    // Autovalutazione: pieno, metà, niente.
    earned = question.points * answer.grade;
    outcome = answer.grade === 1 ? 'correct' : answer.grade === 0.5 ? 'partial' : 'wrong';
  }

  return { ...base, ...bankId, outcome, earned };
}

/**
 * Corregge una prova.
 *
 * Il voto in trentesimi esiste solo per la modalità `full`, l'unica che
 * replica il formato d'esame; le altre restituiscono una percentuale.
 * La **lode** richiede il punteggio pieno: tutte le crocette esatte e tutti
 * i quesiti aperti autovalutati «pieno».
 */
export function gradeExam(exam: Exam, answers: Record<string, Answer>): ExamResult {
  const results = exam.questions.map((question) => gradeQuestion(question, answers[question.id]));
  const earned = results.reduce((sum, result) => sum + result.earned, 0);
  const total = exam.totalPoints;

  const graded = exam.mode === 'full';
  const lode = graded && earned >= total;

  return {
    examId: exam.id,
    mode: exam.mode,
    finishedAt: Date.now(),
    results,
    earned,
    total,
    ...(graded ? { score30: Math.min(30, Math.round(earned)) } : {}),
    lode,
    percent: total > 0 ? Math.round((earned / total) * 100) : 0,
  };
}

/** Commento mostrato con l'esito. */
export function verdictMessage(result: ExamResult): string {
  if (result.score30 === undefined) {
    if (result.percent >= 80) return 'Ottimo ripasso.';
    if (result.percent >= 60) return 'Discreto — insisti sugli errori.';
    return 'Da consolidare: rivedi i moduli collegati.';
  }
  const vote = result.score30;
  if (result.lode) return 'Prova eccellente.';
  if (vote >= 27) return 'Ottimo. Ci sei.';
  if (vote >= 24) return 'Buon controllo della materia.';
  if (vote >= 18) return 'Superato. Rifinisci i punti deboli.';
  return 'Sotto il 18: ripassa e rigenera una prova.';
}
