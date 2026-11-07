/** @jsxImportSource preact */
/**
 * Simulazione d'esame: configurazione, timer, navigazione tra le domande,
 * consegna, correzione automatica (autovalutazione per le domande aperte),
 * analisi per argomento/obiettivo, storico e PDF di prova e soluzioni
 * (pagina di stampa dedicata). La sessione in corso sopravvive al ricaricamento.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { CourseData, CourseSummary } from '../engine/course-data';
import {
  analyze,
  assembleExam,
  examRefs,
  formatClock,
  gradeExam,
  loadExamState,
  printQuery,
  remainingMs,
  replaceRecord,
  saveRecord,
  saveSession,
  toRecord,
  type Exam,
  type ExamAnswer,
  type ExamConfig,
  type ExamMode,
  type ExamRecord,
  type ExamSession,
  type ExamState,
} from '../engine/exam';
import { computeMastery } from '../engine/mastery';
import { loadProgress, loadSrs } from '../engine/progress';
import { answerHelpKey, objectivesIndex } from '../engine/course-data';
import { randomSeed } from '../engine/random';
import { formatNumber } from '../engine/units';
import { resolveExam, toResolved, type QuestionContent } from './lib/exam-content';
import { formatExpected } from './ExercisePlayer';
import { useNow, useRemote } from './lib/hooks';
import { t, type Lang } from './lib/i18n';
import './islands.css';

export interface ExamRunnerProps {
  lang: Lang;
  course: CourseSummary;
}

type Phase = 'setup' | 'running' | 'result';

export default function ExamRunner({ lang, course }: ExamRunnerProps) {
  const remote = useRemote<CourseData>([course.paths.data]);
  const data = remote.state === 'ready' ? remote.data[0]! : null;
  const [phase, setPhase] = useState<Phase>('setup');
  const [examState, setExamState] = useState<ExamState | null>(null);
  const [mode, setMode] = useState<ExamMode>(course.structure.length > 0 ? 'completa' : 'personalizzata');
  const [topics, setTopics] = useState<string[]>([]);
  const [count, setCount] = useState(6);
  const [timed, setTimed] = useState(true);
  const [duration, setDuration] = useState(course.durationMin ?? 120);
  const [exam, setExam] = useState<Exam | null>(null);
  const [contents, setContents] = useState<QuestionContent[]>([]);
  const [session, setSessionState] = useState<ExamSession | null>(null);
  // Copia sincrona della sessione: più modifiche prima del render non si sovrascrivono.
  const sessionRef = useRef<ExamSession | null>(null);
  const setSession = (s: ExamSession | null) => {
    sessionRef.current = s;
    setSessionState(s);
  };
  const [record, setRecord] = useState<ExamRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const now = useNow(phase === 'running' ? 1000 : 0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => setExamState(loadExamState(course.id)), [course.id]);

  const topicTitle = useMemo(
    () => Object.fromEntries((data?.topics ?? []).map((tp) => [tp.id, tp.title])),
    [data],
  );
  const objectiveText = useMemo(
    () => Object.fromEntries((data?.topics ?? []).flatMap((tp) => tp.objectives.map((o) => [o.id, o.text]))),
    [data],
  );

  const open = async (config: ExamConfig, refs: string[] | undefined, resume?: ExamSession) => {
    if (!data) return;
    setError(null);
    const weakness =
      config.mode === 'mirata'
        ? Object.fromEntries(
            Object.values(
              computeMastery({
                objectives: data.topics.flatMap((tp) => tp.objectives.map((o) => o.id)),
                exerciseObjectives: objectivesIndex(data.exercises),
                cardObjectives: objectivesIndex(data.cards),
                progress: loadProgress(course.id),
                srs: loadSrs(course.id),
                exams: loadExamState(course.id).history,
                now: Date.now(),
              }),
            ).map((m) => [m.id, m.value]),
          )
        : undefined;
    const e = assembleExam(
      {
        id: course.id,
        structure: course.structure,
        ...(course.durationMin ? { durationMin: course.durationMin } : {}),
        examFormat: course.examFormat,
      },
      data,
      config,
      weakness,
      refs,
    );
    if (e.questions.length === 0) {
      setError(t(lang, 'exam.empty'));
      return;
    }
    try {
      const c = await resolveExam(data, e, lang, t(lang, 'review.back'));
      const s: ExamSession = resume ?? {
        config,
        startedAt: Date.now(),
        answers: [],
        current: 0,
        refs: examRefs(e),
      };
      setExam(e);
      setContents(c);
      setSession(s);
      saveSession(course.id, s);
      setPhase('running');
      setTimeUp(false);
      requestAnimationFrame(() => headingRef.current?.focus());
    } catch {
      setError(t(lang, 'exercise.generatorError'));
    }
  };

  const start = () =>
    open(
      {
        mode,
        seed: randomSeed(),
        ...(topics.length && mode !== 'completa' ? { topics } : {}),
        ...(mode !== 'completa' ? { count } : {}),
        durationMin: timed ? duration : null,
      },
      undefined,
    );

  const setAnswer = (index: number, a: ExamAnswer) => {
    const cur = sessionRef.current;
    if (!cur) return;
    const answers = [...cur.answers];
    answers[index] = { ...answers[index], ...a };
    const next = { ...cur, answers };
    setSession(next);
    saveSession(course.id, next);
  };
  const go = (i: number) => {
    const cur = sessionRef.current;
    if (!cur) return;
    const next = { ...cur, current: i };
    setSession(next);
    saveSession(course.id, next);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const result = useMemo(
    () =>
      exam && session && phase === 'result'
        ? gradeExam(exam, contents.map(toResolved), session.answers)
        : null,
    [exam, session, contents, phase],
  );

  const submit = (auto = false) => {
    if (!exam || !session) return;
    const blank = exam.questions.filter((q) => !isAnswered(session.answers[q.index], q.category)).length;
    if (!auto && blank > 0 && !window.confirm(t(lang, 'exam.confirmSubmit', { n: blank }))) return;
    const r = gradeExam(exam, contents.map(toResolved), session.answers);
    const rec = toRecord(exam, r, session.startedAt, Date.now());
    setExamState(saveRecord(course.id, rec));
    setRecord(rec);
    setPhase('result');
    setTimeUp(auto);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  // Aggiorna l'esito registrato dopo ogni autovalutazione.
  useEffect(() => {
    if (phase !== 'result' || !result || !record || !exam || !session) return;
    if (result.earned === record.earned) return;
    const updated = {
      ...toRecord(exam, result, session.startedAt, record.at),
      id: record.id,
      durationMs: record.durationMs,
    };
    setRecord(updated);
    setExamState(replaceRecord(course.id, updated));
  }, [result]);

  const remaining =
    exam && session ? remainingMs(session.startedAt, exam.durationMin, now || Date.now()) : Infinity;
  useEffect(() => {
    if (phase === 'running' && now > 0 && remaining === 0) submit(true);
  }, [remaining, phase, now]);

  if (remote.state === 'loading')
    return (
      <p class="sh-muted" aria-busy="true">
        {t(lang, 'engine.loading')}
      </p>
    );
  if (remote.state === 'error')
    return (
      <p class="sh-alert sh-alert--danger" role="alert">
        {t(lang, 'engine.loadError')}{' '}
        <button type="button" class="btn" onClick={remote.retry}>
          {t(lang, 'engine.retry')}
        </button>
      </p>
    );

  const printHref = (part: 'prova' | 'soluzioni') =>
    exam
      ? `${course.paths.print}${printQuery({ course: course.id, config: exam.config, part, refs: examRefs(exam) })}`
      : '#';

  // ───────── configurazione ─────────
  if (phase === 'setup' || !exam || !session) {
    const pending = examState?.session;
    return (
      <section class="sh-exam" aria-labelledby="sh-exam-setup">
        <h2 id="sh-exam-setup" ref={headingRef} tabIndex={-1}>
          {t(lang, 'exam.setup')}
        </h2>
        {pending && (
          <div class="sh-alert sh-actions">
            <button
              type="button"
              class="btn btn--primary"
              onClick={() => open(pending.config, pending.refs, pending)}
            >
              {t(lang, 'exam.resume')}
            </button>
            <button
              type="button"
              class="btn btn--ghost"
              onClick={() => {
                saveSession(course.id, undefined);
                setExamState(loadExamState(course.id));
              }}
            >
              {t(lang, 'exam.discard')}
            </button>
          </div>
        )}
        <form
          class="sh-form"
          onSubmit={(e) => {
            e.preventDefault();
            void start();
          }}
        >
          <fieldset>
            <legend>{t(lang, 'exam.mode')}</legend>
            {(['completa', 'personalizzata', 'mirata'] as const)
              .filter((m) => m !== 'completa' || course.structure.length > 0)
              .map((m) => (
                <label class="sh-check" key={m}>
                  <input
                    type="radio"
                    name="sh-mode"
                    value={m}
                    checked={mode === m}
                    onChange={() => setMode(m)}
                  />
                  <span>{t(lang, `exam.mode.${m}`)}</span>
                </label>
              ))}
          </fieldset>
          {mode === 'completa' && (
            <ol class="sh-structure">
              {course.structure.map((p, i) => (
                <li key={i}>
                  {p.label}
                  {p.points !== undefined && (
                    <span class="sh-muted"> · {t(lang, 'exam.points', { points: p.points })}</span>
                  )}
                </li>
              ))}
            </ol>
          )}
          {mode !== 'completa' && (
            <>
              <fieldset>
                <legend>{t(lang, 'exam.topics')}</legend>
                <div class="sh-checkgrid">
                  {(data?.topics ?? []).map((tp) => (
                    <label class="sh-check" key={tp.id}>
                      <input
                        type="checkbox"
                        checked={topics.includes(tp.id)}
                        onChange={() =>
                          setTopics(
                            topics.includes(tp.id) ? topics.filter((x) => x !== tp.id) : [...topics, tp.id],
                          )
                        }
                      />
                      <span>{tp.title}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label class="sh-filter">
                <span>{t(lang, 'exam.count')}</span>
                <input
                  class="sh-input"
                  type="number"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) =>
                    setCount(Math.max(1, Math.min(50, Number((e.target as HTMLInputElement).value) || 1)))
                  }
                />
              </label>
            </>
          )}
          <label class="sh-check">
            <input type="checkbox" checked={!timed} onChange={() => setTimed(!timed)} />
            <span>{t(lang, 'exam.noTimer')}</span>
          </label>
          {timed && (
            <label class="sh-filter">
              <span>{t(lang, 'exam.duration')}</span>
              <input
                class="sh-input"
                type="number"
                min={5}
                max={600}
                value={duration}
                onChange={(e) =>
                  setDuration(Math.max(5, Math.min(600, Number((e.target as HTMLInputElement).value) || 5)))
                }
              />
            </label>
          )}
          {error && (
            <p class="sh-alert sh-alert--danger" role="alert">
              {error}
            </p>
          )}
          <div class="sh-actions">
            <button type="submit" class="btn btn--primary">
              {t(lang, 'exam.start')}
            </button>
          </div>
        </form>
        <History lang={lang} history={examState?.history ?? []} />
      </section>
    );
  }

  const q = exam.questions[session.current]!;
  const c = contents[session.current]!;
  const ans = session.answers[session.current];

  // ───────── esito ─────────
  if (phase === 'result' && result) {
    const an = analyze(result);
    return (
      <section class="sh-exam" aria-labelledby="sh-exam-result">
        <h2 id="sh-exam-result" ref={headingRef} tabIndex={-1}>
          {t(lang, 'exam.result')}
        </h2>
        {timeUp && <p class="sh-alert sh-alert--warning">{t(lang, 'exam.timeUp')}</p>}
        <p class="sh-score" role="status">
          {t(lang, 'exam.score', {
            earned: formatNumber(result.earned, { lang, digits: 3 }),
            total: formatNumber(result.total, { lang }),
            percent: formatNumber(result.percent, { lang, digits: 3 }),
          })}
          {result.grade30 !== undefined && (
            <strong class="sh-grade">
              {' '}
              {t(lang, 'exam.grade', { grade: result.grade30 })} {result.lode && t(lang, 'exam.lode')}
            </strong>
          )}
        </p>
        <div class="sh-actions">
          <a class="btn" href={printHref('prova')} target="_blank" rel="noopener">
            {t(lang, 'exam.printExam')}
          </a>
          <a class="btn" href={printHref('soluzioni')} target="_blank" rel="noopener">
            {t(lang, 'exam.printSolutions')}
          </a>
          <button
            type="button"
            class="btn btn--primary"
            onClick={() => {
              setPhase('setup');
              setExam(null);
              setRecord(null);
            }}
          >
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
        {an.objectives.filter((o) => o.percent < 70).length > 0 && (
          <>
            <h3>{t(lang, 'exam.weakObjectives')}</h3>
            <ul>
              {an.objectives
                .filter((o) => o.percent < 70)
                .slice(0, 6)
                .map((o) => (
                  <li key={o.id}>
                    {objectiveText[o.id] ?? o.id} — {o.percent}%
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
            const a = session.answers[qq.index];
            return (
              <li key={qq.index} class={`sh-card sh-qresult is-${r.status}`}>
                <h4>
                  {qq.label} · {formatNumber(r.earned, { lang, digits: 3 })}/{qq.points} ·{' '}
                  <span class={`sh-tag sh-tag--${r.status}`}>{t(lang, `exercise.${r.status}`)}</span>
                </h4>
                <div class="prose" dangerouslySetInnerHTML={{ __html: cc.statementHtml }} />
                {cc.answer.length > 0 && !cc.choices?.length && (
                  <ul class="sh-expected">
                    {cc.answer.map((x, i) => (
                      <li key={i}>
                        {x.label}: <code>{a?.fields?.[i] || '—'}</code> → {formatExpected(x, lang)}
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
                        onClick={() => setAnswer(qq.index, { self: v })}
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

  // ───────── prova in corso ─────────
  const answeredCount = exam.questions.filter((qq) =>
    isAnswered(session.answers[qq.index], qq.category),
  ).length;
  return (
    <section class="sh-exam sh-exam--running" aria-label={t(lang, 'page.exam.title')}>
      <div class="sh-exam__bar">
        {exam.durationMin !== null && (
          <p class={`sh-timer ${remaining < 5 * 60_000 ? 'is-low' : ''}`}>
            <span>{t(lang, 'exam.timeLeft')}: </span>
            <time aria-live={remaining < 60_000 ? 'assertive' : 'off'}>{formatClock(remaining)}</time>
          </p>
        )}
        <p class="sh-muted">
          {answeredCount}/{exam.questions.length}
        </p>
        <button type="button" class="btn btn--primary" onClick={() => submit(false)}>
          {t(lang, 'exam.submit')}
        </button>
      </div>
      <nav aria-label={t(lang, 'exam.navigator')}>
        <ol class="sh-nav">
          {exam.questions.map((qq) => {
            const done = isAnswered(session.answers[qq.index], qq.category);
            return (
              <li key={qq.index}>
                <button
                  type="button"
                  class={`sh-nav__btn ${done ? 'is-done' : ''}`}
                  aria-current={qq.index === session.current ? 'step' : undefined}
                  aria-label={`${t(lang, 'exam.question', { n: qq.index + 1, total: exam.questions.length })}, ${t(lang, done ? 'exam.answered' : 'exam.unanswered')}`}
                  onClick={() => go(qq.index)}
                >
                  {qq.index + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <article class="sh-card sh-question" aria-labelledby="sh-q-h">
        <h2 id="sh-q-h" ref={headingRef} tabIndex={-1}>
          {t(lang, 'exam.question', { n: q.index + 1, total: exam.questions.length })} · {q.label}
          <span class="sh-muted">
            {' '}
            · {t(lang, 'exam.points', { points: formatNumber(q.points, { lang }) })}
          </span>
        </h2>
        <p class="sh-muted">{topicTitle[q.topic]}</p>
        <div class="prose" dangerouslySetInnerHTML={{ __html: c.statementHtml }} />
        {c.figureSvg && (
          <figure
            class="sh-figure"
            aria-label={t(lang, 'exercise.figure')}
            dangerouslySetInnerHTML={{ __html: c.figureSvg }}
          />
        )}
        {c.choices?.length ? (
          <fieldset class="sh-choices">
            <legend>
              {t(
                lang,
                c.choices.filter((x) => x.correct).length > 1 ? 'exercise.chooseMany' : 'exercise.choose',
              )}
            </legend>
            {c.choices.map((ch, i) => {
              const multi = c.choices!.filter((x) => x.correct).length > 1;
              const sel = ans?.choices ?? [];
              const on = sel.includes(i);
              return (
                <label class="sh-choice" key={`${q.index}-${i}`}>
                  <input
                    type={multi ? 'checkbox' : 'radio'}
                    name={`sh-q${q.index}`}
                    aria-label={ch.label}
                    checked={on}
                    onChange={() =>
                      setAnswer(q.index, {
                        choices: multi ? (on ? sel.filter((x) => x !== i) : [...sel, i]) : [i],
                      })
                    }
                  />
                  <span dangerouslySetInnerHTML={{ __html: ch.html }} />
                </label>
              );
            })}
          </fieldset>
        ) : c.answer.length > 0 ? (
          <div class="sh-fields">
            {c.answer.map((a, i) => (
              <div class="sh-field" key={`${q.index}-${i}`}>
                <label for={`sh-q${q.index}-f${i}`}>{a.label}</label>
                <div class="sh-field__row">
                  <input
                    id={`sh-q${q.index}-f${i}`}
                    class="sh-input"
                    type="text"
                    autoComplete="off"
                    spellcheck={false}
                    aria-describedby="sh-exam-help"
                    value={ans?.fields?.[i] ?? ''}
                    onInput={(e) => {
                      const fields = [...(ans?.fields ?? [])];
                      fields[i] = (e.target as HTMLInputElement).value;
                      setAnswer(q.index, { fields });
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
        ) : (
          <div class="sh-field">
            <p class="sh-help">{t(lang, 'exam.openSelf')}</p>
            <label for={`sh-q${q.index}-open`}>{t(lang, 'exam.notes')}</label>
            <textarea
              id={`sh-q${q.index}-open`}
              class="sh-input"
              rows={5}
              value={ans?.fields?.[0] ?? ''}
              onInput={(e) => setAnswer(q.index, { fields: [(e.target as HTMLTextAreaElement).value] })}
            />
          </div>
        )}
        <div class="sh-actions">
          <button type="button" class="btn" disabled={q.index === 0} onClick={() => go(q.index - 1)}>
            {t(lang, 'exam.prev')}
          </button>
          <button
            type="button"
            class="btn"
            disabled={q.index === exam.questions.length - 1}
            onClick={() => go(q.index + 1)}
          >
            {t(lang, 'exam.next')}
          </button>
        </div>
      </article>
    </section>
  );
}

function isAnswered(a: ExamAnswer | undefined, category: string): boolean {
  if (!a) return false;
  if (a.choices?.length) return true;
  if (a.fields?.some((f) => f.trim() !== '')) return true;
  return category === 'open' && a.self !== undefined;
}

function History({ lang, history }: { lang: Lang; history: ExamRecord[] }) {
  return (
    <section class="sh-history" aria-labelledby="sh-exam-history">
      <h3 id="sh-exam-history">{t(lang, 'exam.history')}</h3>
      {history.length === 0 ? (
        <p class="sh-muted">{t(lang, 'exam.noHistory')}</p>
      ) : (
        <ol class="sh-items" reversed>
          {[...history]
            .reverse()
            .slice(0, 10)
            .map((r) => (
              <li key={r.id} class="sh-item">
                <time dateTime={new Date(r.at).toISOString()}>
                  {new Date(r.at).toLocaleString(lang === 'it' ? 'it-IT' : 'en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </time>
                <span>{t(lang, `exam.mode.${r.config.mode}`)}</span>
                <strong>
                  {r.grade30 !== undefined
                    ? `${r.grade30}/30`
                    : `${formatNumber(r.percent, { lang, digits: 3 })}%`}
                </strong>
              </li>
            ))}
        </ol>
      )}
    </section>
  );
}
