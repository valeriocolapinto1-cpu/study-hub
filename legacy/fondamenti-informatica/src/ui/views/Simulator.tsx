import type { JSX } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import {
  buildExam,
  EXAM_MODES,
  isExamMode,
  MODE_DESCRIPTIONS,
  MODE_LABELS,
  questionCountFor,
  totalPointsFor,
} from '~/engine/buildExam';
import { gradeExam, verdictMessage } from '~/engine/grade';
import type { Answer, Exam, ExamMode, ExamResult } from '~/engine/types';
import { recordExam, useProgress, type ExamRecord } from '~/store/progress';
import { QuestionCard } from '~/ui/components/QuestionCard';

/** «17 ago» — sullo storico basta il giorno. */
const SHORT_DATE = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' });

/**
 * Storico delle ultime prove.
 *
 * Sotto ai quattro formati la pagina finiva: un bottone e poi mezzo schermo
 * di vuoto. Qui ci va la cosa che serve davvero prima di rigenerare — come
 * sono andate le volte scorse — e finché non c'è, la riga che spiega come
 * viene corretta la prova.
 */
function Recent({ exams }: { exams: ExamRecord[] }): JSX.Element {
  const last = exams.slice(-6).reverse();

  return (
    <>
      <h2 class="sec">{last.length > 0 ? 'Le tue ultime prove' : 'Come viene corretta'}</h2>
      {last.length === 0 ? (
        <div class="panel narrow">
          <p class="lead">
            Crocette, schemi da completare, tabelle di verità e assembly si correggono da soli.
            Gli schemi valgono a <b>punteggio parziale</b>: metà etichette al posto giusto, metà
            punto. Le due domande aperte le valuti tu confrontando con la traccia della risposta:
            una risposta aperta la legge una persona, e qui la persona sei tu.
          </p>
        </div>
      ) : (
        <ul class="runs">
          {last.map((exam, index) => (
            <li key={`${exam.at}-${index}`} class="run">
              <span class="run-d">{SHORT_DATE.format(new Date(exam.at))}</span>
              <span class="run-m">{MODE_LABELS[exam.mode]}</span>
              <span class="run-s">
                {exam.score30 !== undefined ? (
                  <>
                    <b class={exam.score30 >= 18 ? 'ok' : 'ko'}>{exam.score30}</b>
                    <span class="run-den">/30</span>
                    {exam.lode && <span class="run-lode">e lode</span>}
                  </>
                ) : (
                  <>
                    <b class={exam.percent >= 60 ? 'ok' : 'ko'}>{exam.percent}</b>
                    <span class="run-den">%</span>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Setup({
  mode,
  onMode,
  onStart,
  exams,
}: {
  mode: ExamMode;
  onMode: (mode: ExamMode) => void;
  onStart: () => void;
  exams: ExamRecord[];
}): JSX.Element {
  return (
    <>
      <p class="eyebrow">Simulatore</p>
      <h1 class="h">Genera una prova</h1>
      <p class="lead">
        Ogni esame è generato al volo: numeri, tabelle di verità e snippet cambiano ogni volta.
        Scegli il formato.
      </p>

      <div class="exam-config" style="margin-top:20px" role="radiogroup" aria-label="Formato della prova">
        {EXAM_MODES.map((candidate) => (
          <label key={candidate} class={`opt${candidate === mode ? ' sel' : ''}`}>
            <input
              type="radio"
              name="exam-mode"
              class="sr-only"
              checked={candidate === mode}
              onChange={() => onMode(candidate)}
            />
            <div class="ol">
              {MODE_LABELS[candidate]} · {questionCountFor(candidate)} quesiti
            </div>
            <div class="od">{MODE_DESCRIPTIONS[candidate]}</div>
          </label>
        ))}
      </div>

      <div class="btn-row">
        <button type="button" class="btn primary" onClick={onStart}>
          Genera la prova ▶
        </button>
      </div>

      <Recent exams={exams} />
    </>
  );
}

function Scorecard({
  result,
  onRegenerate,
  onChangeFormat,
}: {
  result: ExamResult;
  onRegenerate: () => void;
  onChangeFormat: () => void;
}): JSX.Element {
  const graded = result.score30 !== undefined;

  return (
    <div class="scorecard" tabIndex={-1} id="esito">
      <div class="big">
        {graded ? result.score30 : result.percent}
        <span class="den">{graded ? '/30' : '%'}</span>
      </div>
      <div class="msg">{verdictMessage(result)}</div>
      {result.lode && <div class="lode">e lode 🏅</div>}
      <div class="btn-row" style="justify-content:center;margin-top:16px">
        <button type="button" class="btn primary" onClick={onRegenerate}>
          Rigenera prova ▶
        </button>
        <button type="button" class="btn ghost" onClick={onChangeFormat}>
          Cambia formato
        </button>
      </div>
    </div>
  );
}

export function Simulator({ mode: routeMode }: { mode: string | null }): JSX.Element {
  const [mode, setMode] = useState<ExamMode>('full');
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<ExamResult | null>(null);
  const progress = useProgress();

  const start = useCallback((next: ExamMode) => {
    setMode(next);
    setExam(buildExam(next));
    setAnswers({});
    setRevealed(new Set());
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // «Genera esame completo» dalla dashboard arriva come #/exam/full.
  useEffect(() => {
    if (routeMode && isExamMode(routeMode)) start(routeMode);
  }, [routeMode, start]);

  const answered = useMemo(
    () =>
      exam ? exam.questions.filter((question) => question.id in answers).length : 0,
    [exam, answers],
  );

  if (!exam) {
    return (
      <section class="view">
        <Setup
          mode={mode}
          onMode={setMode}
          onStart={() => start(mode)}
          exams={progress.exams}
        />
      </section>
    );
  }

  const submit = (): void => {
    const graded = gradeExam(exam, answers);
    setResult(graded);
    recordExam(graded);
    // Rivela le soluzioni modello rimaste chiuse.
    setRevealed(new Set(exam.questions.map((question) => question.id)));
    requestAnimationFrame(() => document.getElementById('esito')?.scrollIntoView({ block: 'start' }));
  };

  const resultFor = (id: string) => result?.results.find((entry) => entry.id === id);

  return (
    <section class="view">
      <div class="detail-head">
        <div>
          <p class="eyebrow">
            {MODE_LABELS[exam.mode]} · {exam.questions.length} quesiti ·{' '}
            {totalPointsFor(exam.mode)} punti
          </p>
          <h1 class="h" style="font-size:26px">
            {result ? 'Prova corretta' : 'Prova in corso'}
          </h1>
        </div>
        <button type="button" class="btn ghost mini" onClick={() => setExam(null)}>
          ← Nuovo
        </button>
      </div>

      {result && (
        <div style="margin-top:18px">
          <Scorecard
            result={result}
            onRegenerate={() => start(exam.mode)}
            onChangeFormat={() => setExam(null)}
          />
        </div>
      )}

      <div style="margin-top:14px">
        {exam.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            answer={answers[question.id]}
            onAnswer={(answer) => setAnswers((prev) => ({ ...prev, [question.id]: answer }))}
            result={resultFor(question.id)}
            revealed={revealed.has(question.id)}
            onReveal={() =>
              setRevealed((prev) => new Set(prev).add(question.id))
            }
          />
        ))}
      </div>

      {!result && (
        <div class="btn-row" style="margin-top:6px">
          <button type="button" class="btn primary" onClick={submit}>
            Correggi la prova ▶
          </button>
          <span class="lead" style="align-self:center;margin:0">
            {answered} di {exam.questions.length} completati
          </span>
        </div>
      )}
    </section>
  );
}
