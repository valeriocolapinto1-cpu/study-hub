/** @jsxImportSource preact */
/**
 * Pagina di stampa di una prova (testo o soluzioni). I parametri sono nella
 * query (`printQuery`): la prova si ricostruisce in modo deterministico dal
 * seme e dai riferimenti delle domande, poi si apre la finestra di stampa
 * (il browser offre "Salva come PDF").
 */
import { useEffect, useState } from 'preact/hooks';
import type { CourseData } from '../engine/course-data';
import { assembleExam, parsePrintQuery, type Exam, type PrintParams } from '../engine/exam';
import { formatNumber } from '../engine/units';
import { fetchJson } from './lib/hooks';
import { resolveExam, type QuestionContent } from './lib/exam-content';
import { formatExpected } from './ExercisePlayer';
import { t, type Lang } from './lib/i18n';
import './islands.css';

export interface PrintExamProps {
  lang: Lang;
  /** id corso → URL di dati.json nella lingua della pagina. */
  dataUrls: Record<string, string>;
}

type State =
  | { kind: 'loading' }
  | { kind: 'error'; key: string }
  | { kind: 'ready'; params: PrintParams; data: CourseData; exam: Exam; contents: QuestionContent[] };

export default function PrintExam({ lang, dataUrls }: PrintExamProps) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  useEffect(() => {
    const params = parsePrintQuery(location.search);
    const url = params ? dataUrls[params.course] : undefined;
    if (!params || !url) return setState({ kind: 'error', key: 'print.invalid' });
    void (async () => {
      try {
        const data = await fetchJson<CourseData>(url);
        const exam = assembleExam(
          {
            id: data.id,
            structure: data.structure,
            ...(data.durationMin ? { durationMin: data.durationMin } : {}),
            examFormat: data.examFormat,
          },
          data,
          params.config,
          undefined,
          params.refs,
        );
        const contents = await resolveExam(data, exam, lang, t(lang, 'review.back'));
        setState({ kind: 'ready', params, data, exam, contents });
        document.title = `${t(lang, params.part === 'soluzioni' ? 'print.solutions' : 'print.title')} — ${data.title}`;
      } catch {
        setState({ kind: 'error', key: 'engine.loadError' });
      }
    })();
  }, []);

  useEffect(() => {
    if (state.kind !== 'ready') return;
    // Attende font e formule prima di aprire la stampa.
    const id = setTimeout(() => void document.fonts?.ready.then(() => window.print()), 300);
    return () => clearTimeout(id);
  }, [state.kind]);

  if (state.kind === 'loading') return <p aria-busy="true">{t(lang, 'engine.loading')}</p>;
  if (state.kind === 'error')
    return (
      <p class="sh-alert sh-alert--danger" role="alert">
        {t(lang, state.key)}
      </p>
    );
  const { params, data, exam, contents } = state;
  const solutions = params.part === 'soluzioni';
  return (
    <article class="sh-print">
      <header class="sh-print__head">
        <p class="eyebrow">{data.title}</p>
        <h1>{t(lang, solutions ? 'print.solutions' : 'print.title')}</h1>
        <p class="sh-print__meta">
          <span>{t(lang, 'print.seed', { seed: exam.config.seed.toString(36).toUpperCase() })}</span>
          {exam.durationMin !== null && <span>{t(lang, 'print.duration', { n: exam.durationMin })}</span>}
          <span>{t(lang, 'exam.points', { points: formatNumber(exam.totalPoints, { lang }) })}</span>
        </p>
        {!solutions && (
          <dl class="sh-print__fields">
            <div>
              <dt>{t(lang, 'print.name')}</dt>
              <dd />
            </div>
            <div>
              <dt>{t(lang, 'print.date')}</dt>
              <dd />
            </div>
          </dl>
        )}
      </header>
      <ol class="sh-print__questions">
        {exam.questions.map((q) => {
          const c = contents[q.index]!;
          return (
            <li key={q.index} class="sh-print__q">
              <h2>
                {q.label}{' '}
                <span class="sh-muted">
                  ({t(lang, 'exam.points', { points: formatNumber(q.points, { lang }) })})
                </span>
              </h2>
              <div class="prose" dangerouslySetInnerHTML={{ __html: c.statementHtml }} />
              {c.figureSvg && <figure class="sh-figure" dangerouslySetInnerHTML={{ __html: c.figureSvg }} />}
              {c.choices?.length ? (
                <ol class="sh-print__choices" type="a">
                  {c.choices.map((ch, i) => (
                    <li key={i} class={solutions && ch.correct ? 'is-correct' : ''}>
                      <span dangerouslySetInnerHTML={{ __html: ch.html }} />
                      {solutions && ch.correct && <strong> ✓</strong>}
                    </li>
                  ))}
                </ol>
              ) : null}
              {solutions ? (
                <div class="sh-print__solution">
                  {c.answer.length > 0 && (
                    <p>
                      <strong>{t(lang, 'print.answer')}:</strong>{' '}
                      {c.answer.map((a) => `${a.label} = ${formatExpected(a, lang)}`).join('; ')}
                    </p>
                  )}
                  <ol class="sh-steps">
                    {c.steps.map((s, i) => (
                      <li key={i} class="sh-step">
                        <p class="sh-step__title" dangerouslySetInnerHTML={{ __html: s.titleHtml }} />
                        <div class="prose" dangerouslySetInnerHTML={{ __html: s.bodyHtml }} />
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                !c.choices?.length && (
                  <div class="sh-print__space" aria-label={t(lang, 'print.answerSpace')} />
                )
              )}
            </li>
          );
        })}
      </ol>
    </article>
  );
}
