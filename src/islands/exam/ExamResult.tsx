/** @jsxImportSource preact */
/** Esito della prova: punteggio, stampa, analisi per argomento/obiettivo e correzione con autovalutazione. */
import type { Ref } from 'preact';
import type { CourseSummary } from '../../engine/course-data';
import { analyze, type Exam, type ExamAnswer, type ExamResult as Graded } from '../../engine/exam';
import { formatNumber } from '../../engine/units';
import type { QuestionContent } from '../lib/exam-content';
import { formatExpected } from '../lib/exercise-content';
import { t, type Lang } from '../lib/i18n';
import { TexText } from '../lib/TexText';

export interface ExamResultProps {
  lang: Lang;
  course: CourseSummary;
  exam: Exam;
  contents: QuestionContent[];
  answers: (ExamAnswer | undefined)[];
  result: Graded;
  timeUp: boolean;
  topicTitle: Record<string, string>;
  objectiveText: Record<string, { text: string; html?: string | undefined }>;
  printHref: (part: 'prova' | 'soluzioni') => string;
  onSelf: (index: number, self: 0 | 0.5 | 1) => void;
  onNew: () => void;
  headingRef: Ref<HTMLHeadingElement>;
}

const scoreOnly = (lang: Lang, result: Graded) =>
  t(lang, 'exam.score', {
    earned: formatNumber(result.earned, { lang, digits: 3 }),
    total: formatNumber(result.total, { lang }),
    percent: formatNumber(result.percent, { lang, digits: 3 }),
  });

/** Punteggio e voto in una riga (annuncio dell'esito). */
export function scoreText(lang: Lang, result: Graded): string {
  const score = scoreOnly(lang, result);
  return result.grade30 === undefined
    ? score
    : `${score} ${t(lang, 'exam.grade', { grade: result.grade30 })}${result.lode ? ` ${t(lang, 'exam.lode')}` : ''}`;
}

export function ExamResult(p: ExamResultProps) {
  const { lang, course, exam, contents, answers, result, topicTitle, objectiveText } = p;
  const an = analyze(result);
  const weak = an.objectives.filter((o) => o.percent < 70);
  return (
    <section class="sh-exam" aria-labelledby="sh-exam-result">
      <h2 id="sh-exam-result" ref={p.headingRef} tabIndex={-1}>
        {t(lang, 'exam.result')}
      </h2>
      {p.timeUp && <p class="sh-alert sh-alert--warning">{t(lang, 'exam.timeUp')}</p>}
      <p class="sh-score" role="status">
        {scoreOnly(lang, result)}
        {result.grade30 !== undefined && (
          <strong class="sh-grade">
            {' '}
            {t(lang, 'exam.grade', { grade: result.grade30 })} {result.lode && t(lang, 'exam.lode')}
          </strong>
        )}
      </p>
      <div class="sh-actions">
        <a class="btn" href={p.printHref('prova')} target="_blank" rel="noopener">
          {t(lang, 'exam.printExam')}
        </a>
        <a class="btn" href={p.printHref('soluzioni')} target="_blank" rel="noopener">
          {t(lang, 'exam.printSolutions')}
        </a>
        <button type="button" class="btn btn--primary" onClick={p.onNew}>
          {t(lang, 'exam.newExam')}
        </button>
      </div>

      <h3>{t(lang, 'exam.analysis')}</h3>
      <ul class="sh-bars">
        {an.topics.map((tp) => (
          <li key={tp.id}>
            <span>{topicTitle[tp.id] ?? tp.id}</span>
            <meter
              min={0}
              max={100}
              low={50}
              high={80}
              optimum={100}
              value={tp.percent}
              aria-label={`${topicTitle[tp.id] ?? tp.id}: ${tp.percent}%`}
            />
            <span>{tp.percent}%</span>
            <a href={`${course.paths.theory}${tp.id}/`}>{t(lang, 'exam.study')}</a>
            <a href={`${course.paths.exercises}${tp.id}/`}>{t(lang, 'exam.practice')}</a>
          </li>
        ))}
      </ul>
      {weak.length > 0 && (
        <>
          <h3>{t(lang, 'exam.weakObjectives')}</h3>
          <ul>
            {weak.slice(0, 6).map((o) => (
              <li key={o.id}>
                {objectiveText[o.id] ? (
                  <TexText text={objectiveText[o.id]!.text} html={objectiveText[o.id]!.html} />
                ) : (
                  o.id
                )}{' '}
                — {o.percent}%
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>{t(lang, 'exam.review')}</h3>
      <ol class="sh-review-list">
        {exam.questions.map((qq) => {
          const r = result.questions[qq.index]!;
          const cc = contents[qq.index]!;
          const a = answers[qq.index];
          return (
            <li key={qq.index} class={`sh-card sh-qresult is-${r.status}`}>
              <h4>
                <TexText text={qq.label} html={qq.labelHtml} /> ·{' '}
                {formatNumber(r.earned, { lang, digits: 3 })}/{qq.points} ·{' '}
                <span class={`sh-tag sh-tag--${r.status}`}>{t(lang, `exercise.${r.status}`)}</span>
              </h4>
              <div class="prose" dangerouslySetInnerHTML={{ __html: cc.statementHtml }} />
              {cc.answer.length > 0 && !cc.choices?.length && (
                <ul class="sh-expected">
                  {cc.answer.map((x, i) => (
                    <li key={i}>
                      <TexText text={x.label} html={x.labelHtml} />: <code>{a?.fields?.[i] || '—'}</code> →{' '}
                      {formatExpected(x, lang)}
                    </li>
                  ))}
                </ul>
              )}
              <details>
                <summary>{t(lang, 'exercise.solution')}</summary>
                <ol class="sh-steps">
                  {cc.steps.map((s, i) => (
                    <li key={i} class="sh-step">
                      <p class="sh-step__title" dangerouslySetInnerHTML={{ __html: s.titleHtml }} />
                      <div class="prose" dangerouslySetInnerHTML={{ __html: s.bodyHtml }} />
                    </li>
                  ))}
                </ol>
              </details>
              {qq.category === 'open' || (cc.answer.length === 0 && !cc.choices?.length) ? (
                <div class="sh-actions" role="group" aria-label={t(lang, 'exam.selfGrade')}>
                  {([0, 0.5, 1] as const).map((v) => (
                    <button
                      type="button"
                      key={v}
                      class={`btn ${a?.self === v ? 'btn--primary' : ''}`}
                      aria-pressed={a?.self === v}
                      onClick={() => p.onSelf(qq.index, v)}
                    >
                      {t(
                        lang,
                        v === 0 ? 'exercise.self.0' : v === 0.5 ? 'exercise.self.05' : 'exercise.self.1',
                      )}
                    </button>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
