import { describe, expect, it } from 'vitest';
import { buildExam } from './buildExam';
import { gradeExam, normalizeFill, verdictMessage } from './grade';
import { minimalCover, sopToString } from './boolean';
import type { Answer, DiagramQuestion, Exam, ExprQuestion, SelfGrade } from './types';

/** Le etichette giuste, tutte al posto giusto. */
function correctPicks(question: DiagramQuestion): Record<string, string> {
  return Object.fromEntries(question.slots.map((slot) => [slot.id, slot.label]));
}

/** La SOP minima della funzione posta dal quesito, in forma testuale. */
function minimalAnswer(question: ExprQuestion): string {
  const cover = minimalCover(
    new Set(question.minterms),
    new Set(question.dontCares),
    question.vars,
  );
  // `sopToString` rende la negazione con una barra sopra la lettera (un
  // <span>), che il parser non vede: la riscrivo con l'apostrofo.
  return sopToString(cover, question.vars).replace(
    /<span class="ovl">([A-Z])<\/span>/g,
    "$1'",
  );
}

/** Risposte tutte esatte, con l'autovalutazione al livello indicato. */
function answersFor(exam: Exam, selfGrade: SelfGrade = 1): Record<string, Answer> {
  const answers: Record<string, Answer> = {};
  for (const question of exam.questions) {
    if (question.kind === 'mc') answers[question.id] = { kind: 'mc', choice: question.correct };
    else if (question.kind === 'fill') {
      answers[question.id] = { kind: 'fill', text: question.answer };
    } else if (question.kind === 'diagram') {
      answers[question.id] = { kind: 'diagram', picks: correctPicks(question) };
    } else if (question.kind === 'expr') {
      answers[question.id] = { kind: 'expr', text: minimalAnswer(question) };
    } else answers[question.id] = { kind: 'self', grade: selfGrade };
  }
  return answers;
}

describe('normalizzazione delle risposte brevi', () => {
  it('ignora spazi e separatori nel binario', () => {
    expect(normalizeFill(' 0110 ', 'bin')).toBe('0110');
    expect(normalizeFill('0110 1010', 'bin')).toBe('01101010');
    expect(normalizeFill('0110', 'bin')).toBe('0110');
  });

  it('accetta l’esadecimale minuscolo e il prefisso 0x', () => {
    expect(normalizeFill('1f', 'hex')).toBe('1F');
    expect(normalizeFill('0x1F', 'hex')).toBe('1F');
    expect(normalizeFill(' ff ', 'hex')).toBe('FF');
  });

  it('tiene il segno nei decimali', () => {
    expect(normalizeFill(' -128 ', 'dec')).toBe('-128');
  });
});

describe('correzione della prova completa', () => {
  it('30/30 e lode con tutto esatto', () => {
    const exam = buildExam('full', 11);
    const result = gradeExam(exam, answersFor(exam, 1));

    expect(result.earned).toBe(30);
    expect(result.score30).toBe(30);
    expect(result.lode).toBe(true);
    expect(verdictMessage(result)).toBe('Prova eccellente.');
  });

  it('niente lode se i quesiti da svolgere sono solo parziali', () => {
    const exam = buildExam('full', 11);
    const result = gradeExam(exam, answersFor(exam, 0.5));

    // I quattro `self` valgono 2,5 ciascuno: a metà si perdono 5 punti.
    expect(result.earned).toBe(25);
    expect(result.score30).toBe(25);
    expect(result.lode).toBe(false);
  });

  it('lo schema completato a metà vale metà punti, non zero', () => {
    const exam = buildExam('full', 11);
    const schema = exam.questions.find(
      (question): question is DiagramQuestion => question.kind === 'diagram',
    );
    expect(schema).toBeDefined();
    if (!schema) return;

    const half = Math.floor(schema.slots.length / 2);
    const picks = Object.fromEntries(
      schema.slots.map((slot, index) => [slot.id, index < half ? slot.label : 'Registro di stato']),
    );

    const result = gradeExam(exam, { [schema.id]: { kind: 'diagram', picks } });
    const graded = result.results.find((item) => item.id === schema.id);

    expect(graded?.outcome).toBe('partial');
    expect(graded?.earned).toBeCloseTo((schema.points * half) / schema.slots.length, 10);
  });

  it('uno schema tutto sbagliato è «wrong», uno intoccato è «in bianco»', () => {
    const exam = buildExam('full', 11);
    const schema = exam.questions.find(
      (question): question is DiagramQuestion => question.kind === 'diagram',
    );
    if (!schema) return;

    const wrong = Object.fromEntries(schema.slots.map((slot) => [slot.id, 'Registro di stato']));
    expect(
      gradeExam(exam, { [schema.id]: { kind: 'diagram', picks: wrong } }).results.find(
        (item) => item.id === schema.id,
      )?.outcome,
    ).toBe('wrong');

    const empty = Object.fromEntries(schema.slots.map((slot) => [slot.id, '']));
    expect(
      gradeExam(exam, { [schema.id]: { kind: 'diagram', picks: empty } }).results.find(
        (item) => item.id === schema.id,
      )?.outcome,
    ).toBe('blank');
  });

  it('l’espressione corretta ma ridondante prende metà punteggio', () => {
    const exam = buildExam('full', 11);
    const espressione = exam.questions.find(
      (question): question is ExprQuestion => question.kind === 'expr',
    );
    expect(espressione).toBeDefined();
    if (!espressione) return;

    const grade = (text: string): { outcome: string; earned: number } => {
      const result = gradeExam(exam, { [espressione.id]: { kind: 'expr', text } });
      const item = result.results.find((entry) => entry.id === espressione.id);
      return { outcome: item?.outcome ?? '?', earned: item?.earned ?? -1 };
    };

    // Minima: pieno.
    expect(grade(minimalAnswer(espressione))).toEqual({
      outcome: 'correct',
      earned: espressione.points,
    });

    // Forma canonica: stessa funzione, molti più letterali. Metà punteggio.
    const canonical = espressione.minterms
      .map((m) =>
        Array.from({ length: espressione.vars }, (_, i) => {
          const name = String.fromCharCode(65 + i);
          return (m >> (espressione.vars - 1 - i)) & 1 ? name : `${name}'`;
        }).join(''),
      )
      .join(' + ');
    const redundant = grade(canonical);
    // A meno che la minima non sia già la canonica, cioè nessun gruppo si
    // poteva raccogliere.
    if (redundant.earned !== espressione.points) {
      expect(redundant.outcome).toBe('partial');
      expect(redundant.earned).toBeCloseTo(espressione.points / 2, 10);
    }

    // Sbagliata: zero.
    const wrong = grade(espressione.minterms.length === 1 << espressione.vars ? '0' : '1');
    expect(wrong.earned).toBe(0);
    expect(wrong.outcome).toBe('wrong');

    // Illeggibile: zero, non un errore.
    expect(grade('A +').earned).toBe(0);
  });

  it('senza risposte il punteggio è zero e i quesiti risultano in bianco', () => {
    const exam = buildExam('full', 3);
    const result = gradeExam(exam, {});

    expect(result.earned).toBe(0);
    expect(result.score30).toBe(0);
    expect(result.lode).toBe(false);
    expect(result.results.every((entry) => entry.outcome === 'blank')).toBe(true);
  });

  it('distingue una risposta sbagliata da una non data', () => {
    const exam = buildExam('binary', 5);
    const first = exam.questions[0];
    if (!first) throw new Error('prova vuota');

    const wrong = gradeExam(exam, { [first.id]: { kind: 'fill', text: 'xxxx' } });
    expect(wrong.results[0]?.outcome).toBe('wrong');

    const blank = gradeExam(exam, { [first.id]: { kind: 'fill', text: '   ' } });
    expect(blank.results[0]?.outcome).toBe('blank');
  });

  it('accetta la forma non normalizzata della risposta esatta', () => {
    const exam = buildExam('binary', 9);
    const answers: Record<string, Answer> = {};
    for (const question of exam.questions) {
      if (question.kind !== 'fill') continue;
      // Spazi in mezzo e in coda: devono essere ininfluenti.
      answers[question.id] = { kind: 'fill', text: ` ${question.answer.replace(/(.{2})/g, '$1 ')} ` };
    }
    const result = gradeExam(exam, answers);
    const fills = result.results.filter((entry) =>
      exam.questions.some((q) => q.id === entry.id && q.kind === 'fill'),
    );
    expect(fills.every((entry) => entry.outcome === 'correct')).toBe(true);
  });

  it('il voto in trentesimi esiste solo per la prova completa', () => {
    const quick = buildExam('quick', 4);
    const result = gradeExam(quick, answersFor(quick));

    expect(result.score30).toBeUndefined();
    expect(result.percent).toBe(100);
    expect(result.lode).toBe(false);
  });

  it('riporta la percentuale anche sulla prova completa', () => {
    const exam = buildExam('full', 2);
    const result = gradeExam(exam, answersFor(exam, 0));
    // I quattro `self` a zero: restano 20 punti su 30.
    expect(result.earned).toBe(20);
    expect(result.percent).toBe(67);
    expect(verdictMessage(result)).toBe('Superato. Rifinisci i punti deboli.');
  });

  it('conserva il riferimento alla voce di banca, per la ripetizione dilazionata', () => {
    const exam = buildExam('full', 8);
    const result = gradeExam(exam, answersFor(exam));
    const withBank = result.results.filter((entry) => entry.bankId !== undefined);
    expect(withBank.length).toBeGreaterThan(0);
  });
});
