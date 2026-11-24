/** @jsxImportSource preact */
/**
 * Prova in corso: barra con tempo e consegna, navigatore delle domande, domanda corrente
 * (crocette, campi numerici o traccia aperta). Tastiera: ← / → fra le domande fuori dai
 * campi, «?» per l'elenco delle scorciatoie.
 */
import type { Ref } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { answerHelpKey } from '../../engine/course-data';
import { formatClock, type Exam, type ExamAnswer } from '../../engine/exam';
import { formatNumber } from '../../engine/units';
import type { QuestionContent } from '../lib/exam-content';
import { t, type Lang } from '../lib/i18n';
import { ignoreKey, openKeys } from '../lib/hooks';
import { isAnswered } from './answered';
import { TexText } from '../lib/TexText';

/** Elenco delle scorciatoie (HTML statico di CourseExam.astro). */
const KEYS_ID = 'sh-exam-keys';

export interface ExamRunningProps {
  lang: Lang;
  exam: Exam;
  contents: QuestionContent[];
  answers: (ExamAnswer | undefined)[];
  current: number;
  remaining: number;
  topicTitle: Record<string, string>;
  setAnswer: (index: number, a: ExamAnswer) => void;
  go: (index: number) => void;
  onSubmit: () => void;
  headingRef: Ref<HTMLHeadingElement>;
}

export function ExamRunning(p: ExamRunningProps) {
  const { lang, exam, contents, answers, current, remaining } = p;
  const q = exam.questions[current]!;
  const c = contents[current]!;
  const ans = answers[current];
  const total = exam.questions.length;
  const answeredCount = exam.questions.filter((qq) => isAnswered(answers[qq.index], qq.category)).length;

  // Indice e navigazione letti al momento del tasto: un tasto premuto subito dopo il cambio di
  // domanda (prima che un effetto si riesegua) non deve trovare l'indice precedente.
  const live = useRef({ current, total, go: p.go });
  live.current = { current, total, go: p.go };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (ignoreKey(e)) return;
      const { current: at, total: n, go } = live.current;
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (step && at + step >= 0 && at + step < n) {
        e.preventDefault();
        go(at + step);
      } else if (e.key === '?') {
        e.preventDefault();
        openKeys(KEYS_ID);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section class="sh-exam sh-exam--running" aria-label={t(lang, 'page.exam.title')}>
      <div class="sh-exam__bar">
        {exam.durationMin !== null && (
          <p class={`sh-timer ${remaining < 5 * 60_000 ? 'is-low' : ''}`}>
            <span>{t(lang, 'exam.timeLeft')}: </span>
            <time>{formatClock(remaining)}</time>
          </p>
        )}
        <p class="sh-muted">
          {answeredCount}/{total}
        </p>
        <button
          type="button"
          class="btn btn--sm sh-keys-btn"
          popovertarget={KEYS_ID}
          aria-keyshortcuts="?"
          aria-label={t(lang, 'engine.keys')}
        >
          ?
        </button>
        <button type="button" class="btn btn--primary" onClick={p.onSubmit}>
          {t(lang, 'exam.submit')}
        </button>
      </div>
      <nav aria-label={t(lang, 'exam.navigator')}>
        <ol class="sh-nav">
          {exam.questions.map((qq) => {
            const done = isAnswered(answers[qq.index], qq.category);
            return (
              <li key={qq.index}>
                <button
                  type="button"
                  class={`sh-nav__btn ${done ? 'is-done' : ''}`}
                  aria-current={qq.index === current ? 'step' : undefined}
                  aria-label={`${t(lang, 'exam.question', { n: qq.index + 1, total })}, ${t(lang, done ? 'exam.answered' : 'exam.unanswered')}`}
                  onClick={() => p.go(qq.index)}
                >
                  {qq.index + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <article class="sh-card sh-question" aria-labelledby="sh-q-h">
        <h2 id="sh-q-h" ref={p.headingRef} tabIndex={-1}>
          {t(lang, 'exam.question', { n: q.index + 1, total })} · <TexText text={q.label} tex={q.labelTex} />
          <span class="sh-muted">
            {' '}
            · {t(lang, 'exam.points', { points: formatNumber(q.points, { lang }) })}
          </span>
        </h2>
        <p class="sh-muted">{p.topicTitle[q.topic]}</p>
        <div class="prose" dangerouslySetInnerHTML={{ __html: c.statementHtml }} />
        {c.figureSvg && (
          <figure
            class="sh-figure"
            aria-label={t(lang, 'exercise.figure')}
            dangerouslySetInnerHTML={{ __html: c.figureSvg }}
          />
        )}
        <Answer lang={lang} index={q.index} content={c} ans={ans} setAnswer={p.setAnswer} />
        <div class="sh-actions">
          <button type="button" class="btn" disabled={q.index === 0} onClick={() => p.go(q.index - 1)}>
            {t(lang, 'exam.prev')}
          </button>
          <button
            type="button"
            class="btn"
            disabled={q.index === total - 1}
            onClick={() => p.go(q.index + 1)}
          >
            {t(lang, 'exam.next')}
          </button>
        </div>
      </article>
    </section>
  );
}

interface AnswerProps {
  lang: Lang;
  index: number;
  content: QuestionContent;
  ans: ExamAnswer | undefined;
  setAnswer: (index: number, a: ExamAnswer) => void;
}

/** Spazio della risposta: crocette, campi con unità o traccia di una domanda aperta. */
function Answer({ lang, index, content: c, ans, setAnswer }: AnswerProps) {
  if (c.choices?.length) {
    const multi = c.choices.filter((x) => x.correct).length > 1;
    const sel = ans?.choices ?? [];
    return (
      <fieldset class="sh-choices">
        <legend>{t(lang, multi ? 'exercise.chooseMany' : 'exercise.choose')}</legend>
        {c.choices.map((ch, i) => {
          const on = sel.includes(i);
          return (
            <label class="sh-choice" key={`${index}-${i}`}>
              <input
                type={multi ? 'checkbox' : 'radio'}
                name={`sh-q${index}`}
                aria-label={ch.label}
                checked={on}
                onChange={() =>
                  setAnswer(index, { choices: multi ? (on ? sel.filter((x) => x !== i) : [...sel, i]) : [i] })
                }
              />
              <span dangerouslySetInnerHTML={{ __html: ch.html }} />
            </label>
          );
        })}
      </fieldset>
    );
  }
  if (c.answer.length > 0)
    return (
      <div class="sh-fields">
        {c.answer.map((a, i) => (
          <div class="sh-field" key={`${index}-${i}`}>
            <label for={`sh-q${index}-f${i}`}>
              <TexText text={a.label} html={a.labelHtml} />
            </label>
            <div class="sh-field__row">
              <input
                id={`sh-q${index}-f${i}`}
                class="sh-input"
                type="text"
                autoComplete="off"
                spellcheck={false}
                aria-describedby="sh-exam-help"
                value={ans?.fields?.[i] ?? ''}
                onInput={(e) => {
                  const fields = [...(ans?.fields ?? [])];
                  fields[i] = (e.target as HTMLInputElement).value;
                  setAnswer(index, { fields });
                }}
              />
              {a.unit && <span class="sh-field__unit">{a.unit}</span>}
            </div>
          </div>
        ))}
        <p id="sh-exam-help" class="sh-help">
          {t(lang, answerHelpKey(c.answer))}
        </p>
      </div>
    );
  return (
    <div class="sh-field">
      <p class="sh-help">{t(lang, 'exam.openSelf')}</p>
      <label for={`sh-q${index}-open`}>{t(lang, 'exam.notes')}</label>
      <textarea
        id={`sh-q${index}-open`}
        class="sh-input"
        rows={5}
        value={ans?.fields?.[0] ?? ''}
        onInput={(e) => setAnswer(index, { fields: [(e.target as HTMLTextAreaElement).value] })}
      />
    </div>
  );
}
