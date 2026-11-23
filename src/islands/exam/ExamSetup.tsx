/** @jsxImportSource preact */
/** Configurazione della prova: ripresa della sessione salvata, tipo, argomenti, durata e storico. */
import type { Ref } from 'preact';
import type { CourseSummary } from '../../engine/course-data';
import type { ExamMode, ExamRecord, ExamSession } from '../../engine/exam';
import { formatNumber } from '../../engine/units';
import { t, type Lang } from '../lib/i18n';
import { TexText } from '../lib/TexText';

export interface SetupForm {
  mode: ExamMode;
  topics: string[];
  count: number;
  timed: boolean;
  duration: number;
}

export interface ExamSetupProps {
  lang: Lang;
  course: CourseSummary;
  topicList: Array<{ id: string; title: string }>;
  form: SetupForm;
  patch: (p: Partial<SetupForm>) => void;
  pending: ExamSession | undefined;
  history: ExamRecord[];
  opening: boolean;
  error: string | null;
  loadFailed: boolean;
  retry: () => void;
  onStart: () => void;
  onResume: (s: ExamSession) => void;
  onDiscard: () => void;
  headingRef: Ref<HTMLHeadingElement>;
}

const clamp = (v: string, min: number, max: number) => Math.max(min, Math.min(max, Number(v) || min));

export function ExamSetup(p: ExamSetupProps) {
  const { lang, course, topicList, form, patch, pending, opening, error } = p;
  return (
    <section class="sh-exam" aria-labelledby="sh-exam-setup">
      <h2 id="sh-exam-setup" ref={p.headingRef} tabIndex={-1}>
        {t(lang, 'exam.setup')}
      </h2>
      {pending && (
        <div class="sh-alert sh-actions">
          <button
            type="button"
            class="btn btn--primary"
            disabled={opening}
            onClick={() => p.onResume(pending)}
          >
            {t(lang, 'exam.resume')}
          </button>
          <button type="button" class="btn btn--ghost" onClick={p.onDiscard}>
            {t(lang, 'exam.discard')}
          </button>
        </div>
      )}
      <form
        class="sh-form"
        onSubmit={(e) => {
          e.preventDefault();
          p.onStart();
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
                  checked={form.mode === m}
                  onChange={() => patch({ mode: m })}
                />
                <span>{t(lang, `exam.mode.${m}`)}</span>
              </label>
            ))}
        </fieldset>
        {form.mode === 'completa' && (
          <ol class="sh-structure">
            {course.structure.map((s, i) => (
              <li key={i}>
                <TexText text={s.label} tex={s.labelTex} />
                {s.points !== undefined && (
                  <span class="sh-muted"> · {t(lang, 'exam.points', { points: s.points })}</span>
                )}
              </li>
            ))}
          </ol>
        )}
        {form.mode !== 'completa' && (
          <>
            <fieldset>
              <legend>{t(lang, 'exam.topics')}</legend>
              <div class="sh-checkgrid">
                {topicList.map((tp) => (
                  <label class="sh-check" key={tp.id}>
                    <input
                      type="checkbox"
                      checked={form.topics.includes(tp.id)}
                      onChange={() =>
                        patch({
                          topics: form.topics.includes(tp.id)
                            ? form.topics.filter((x) => x !== tp.id)
                            : [...form.topics, tp.id],
                        })
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
                value={form.count}
                onChange={(e) => patch({ count: clamp((e.target as HTMLInputElement).value, 1, 50) })}
              />
            </label>
          </>
        )}
        <label class="sh-check">
          <input type="checkbox" checked={!form.timed} onChange={() => patch({ timed: !form.timed })} />
          <span>{t(lang, 'exam.noTimer')}</span>
        </label>
        {form.timed && (
          <label class="sh-filter">
            <span>{t(lang, 'exam.duration')}</span>
            <input
              class="sh-input"
              type="number"
              min={5}
              max={600}
              value={form.duration}
              onChange={(e) => patch({ duration: clamp((e.target as HTMLInputElement).value, 5, 600) })}
            />
          </label>
        )}
        {error && (
          <p class="sh-alert sh-alert--danger" role="alert">
            {error}
          </p>
        )}
        {!error && p.loadFailed && (
          <p class="sh-alert sh-alert--danger" role="alert">
            {t(lang, 'engine.loadError')}{' '}
            <button type="button" class="btn" onClick={p.retry}>
              {t(lang, 'engine.retry')}
            </button>
          </p>
        )}
        <div class="sh-actions">
          <button type="submit" class="btn btn--primary" disabled={opening}>
            {t(lang, 'exam.start')}
          </button>
          {opening && (
            <span class="sh-muted" role="status" aria-busy="true">
              {t(lang, 'engine.loading')}
            </span>
          )}
        </div>
      </form>
      <History lang={lang} history={p.history} />
    </section>
  );
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
