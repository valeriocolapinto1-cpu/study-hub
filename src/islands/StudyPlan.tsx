/** @jsxImportSource preact */
/** Piano di studio fino alla data d'esame: carico giornaliero, priorità ai punti deboli, ripasso e simulazioni. */
import { useEffect, useMemo, useState } from 'preact/hooks';
import { buildStudyPlan, type PlanTask } from '../engine/mastery';
import { DAY_MS } from '../engine/fsrs';
import { loadSrs } from '../engine/progress';
import { read, update } from '../engine/storage';
import { effectiveExamDate, useExamDates, useMastery, type MasteryProps } from './lib/course-state';
import { t, type Lang } from './lib/i18n';
import './islands.css';

export interface StudyPlanProps extends MasteryProps {
  lang: Lang;
  suggestedDates: string[];
  /** La prova prevede uno scritto (simulazioni nel piano). */
  mockExams: boolean;
  mockMinutes?: number;
  examPath: string;
  exercisesPath: string;
  theoryPath: string;
  reviewPath: string;
}

interface Settings {
  dailyMinutes?: number;
}

export default function StudyPlan(props: StudyPlanProps) {
  const { lang, courseId, topics } = props;
  const { mastery, now } = useMastery(props);
  const [dates] = useExamDates();
  const [all, setAll] = useState(false);
  const [settings, setSettings] = useState<Settings>({});
  useEffect(() => setSettings(read<Settings>(courseId, 'settings', {})), [courseId]);
  const daily = settings.dailyMinutes ?? 90;
  const { date } = now ? effectiveExamDate(courseId, props.suggestedDates, now, dates) : { date: null };
  const dailyReviews = useMemo(() => {
    if (!now) return 0;
    const cards = Object.values(loadSrs(courseId).cards);
    const dueSoon = cards.filter((c) => c.due <= now + 7 * DAY_MS).length;
    const fresh = Math.max(0, Object.keys(props.cardObjectives).length - cards.length);
    return Math.ceil(dueSoon / 7) + Math.min(10, fresh);
  }, [now, courseId]);
  const plan =
    mastery && date
      ? buildStudyPlan({
          topics,
          mastery,
          examDate: date,
          now,
          dailyMinutes: daily,
          dailyReviews,
          mockExams: props.mockExams,
          ...(props.mockMinutes ? { mockMinutes: props.mockMinutes } : {}),
        })
      : null;
  const title = Object.fromEntries(topics.map((tp) => [tp.id, tp.title]));
  const locale = lang === 'it' ? 'it-IT' : 'en-GB';

  const label = (task: PlanTask) =>
    task.kind === 'ripassa'
      ? t(lang, 'plan.task.ripassa', { n: task.cards ?? 0 })
      : task.kind === 'prova'
        ? t(lang, 'plan.task.prova')
        : t(lang, `plan.task.${task.kind}`, { topic: title[task.topic!] ?? task.topic! });
  const href = (task: PlanTask) =>
    task.kind === 'ripassa'
      ? props.reviewPath
      : task.kind === 'prova'
        ? props.examPath
        : task.kind === 'studia'
          ? `${props.theoryPath}${task.topic}/`
          : `${props.exercisesPath}${task.topic}/`;

  return (
    <section class="sh-plan" aria-labelledby="sh-plan-h" aria-busy={!mastery}>
      <h2 id="sh-plan-h">{t(lang, 'plan.title')}</h2>
      <label class="sh-filter">
        <span>{t(lang, 'plan.dailyMinutes')}</span>
        <input
          class="sh-input"
          type="number"
          min={15}
          max={600}
          step={15}
          value={daily}
          onChange={(e) => {
            const v = Math.max(15, Math.min(600, Number((e.target as HTMLInputElement).value) || 90));
            setSettings(update<Settings>(courseId, 'settings', {}, (s) => ({ ...s, dailyMinutes: v })));
          }}
        />
      </label>
      {now > 0 && !date && <p class="sh-muted">{t(lang, 'plan.noDate')}</p>}
      {plan && plan.days.length === 0 && (
        <p class="sh-muted">{plan.daysLeft === 0 && date ? t(lang, 'date.today') : t(lang, 'plan.past')}</p>
      )}
      {plan && plan.days.length > 0 && (
        <>
          <p>
            {t(lang, 'plan.daysLeft', { n: plan.daysLeft })}{' '}
            {t(lang, 'plan.required', { min: plan.requiredMinutesPerDay })}
          </p>
          {plan.overloaded && <p class="sh-alert sh-alert--warning">{t(lang, 'plan.overloaded')}</p>}
          <ol class="sh-days">
            {(all ? plan.days : plan.days.slice(0, 7)).map((d, i) => {
              const [y, m, dd] = d.date.split('-').map(Number) as [number, number, number];
              return (
                <li key={d.date} class="sh-day" aria-current={i === 0 ? 'date' : undefined}>
                  <h3 class="sh-day__date">
                    {i === 0 ? `${t(lang, 'plan.today')} · ` : ''}
                    <time dateTime={d.date}>
                      {new Date(y, m - 1, dd).toLocaleDateString(locale, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </time>
                    <span class="sh-muted"> · {t(lang, 'plan.minutes', { n: d.minutes })}</span>
                  </h3>
                  {d.tasks.length === 0 ? (
                    <p class="sh-muted">{t(lang, 'plan.rest')}</p>
                  ) : (
                    <ul>
                      {d.tasks.map((task, k) => (
                        <li key={k} class={`sh-task sh-task--${task.kind}`}>
                          <a href={href(task)}>{label(task)}</a>{' '}
                          <span class="sh-muted">({t(lang, 'plan.minutes', { n: task.minutes })})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
          {plan.days.length > 7 && (
            <button type="button" class="btn btn--ghost" aria-expanded={all} onClick={() => setAll(!all)}>
              {t(lang, all ? 'plan.showLess' : 'plan.showAll')}
            </button>
          )}
        </>
      )}
    </section>
  );
}
