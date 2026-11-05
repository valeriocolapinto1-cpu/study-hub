/** @jsxImportSource preact */
/** Riepilogo multi-corso per la home: ripasso del giorno, esercizi risolti, prossimo esame. */
import { useEffect, useState } from 'preact/hooks';
import { buildQueue } from '../engine/fsrs';
import { daysUntil } from '../engine/mastery';
import { exerciseStatus, loadProgress, loadSrs } from '../engine/progress';
import { GLOBAL_SCOPE, read, subscribe } from '../engine/storage';
import { effectiveExamDate } from './lib/course-state';
import { t, type Lang } from './lib/i18n';
import './islands.css';

export interface DashboardCourse {
  id: string;
  title: string;
  examDates: string[];
  exerciseIds: string[];
  cardIds: string[];
  paths: { overview: string; review: string; progress: string };
}

export interface ProgressDashboardProps {
  lang: Lang;
  courses: DashboardCourse[];
  /** Pagina del ripasso globale. */
  reviewPath: string;
}

interface Row {
  id: string;
  due: number;
  solved: number;
  started: boolean;
  exam: { date: string; days: number } | null;
}

export default function ProgressDashboard({ lang, courses, reviewPath }: ProgressDashboardProps) {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    const load = () => {
      const now = Date.now();
      const newPerDay = read<{ newPerDay?: number }>(GLOBAL_SCOPE, 'settings', {}).newPerDay ?? 20;
      setRows(
        courses.map((c) => {
          const srs = loadSrs(c.id);
          const progress = loadProgress(c.id);
          const studied = Object.keys(srs.cards).length;
          const due = studied ? buildQueue(c.cardIds, srs.cards, now, { newLimit: 0 }).length : 0;
          const { date } = effectiveExamDate(c.id, c.examDates, now);
          const days = date ? daysUntil(date, now) : null;
          return {
            id: c.id,
            due: due + (studied ? Math.min(newPerDay, Math.max(0, c.cardIds.length - studied)) : 0),
            solved: c.exerciseIds.filter((id) => exerciseStatus(progress.exercises[id]) === 'risolto').length,
            started: studied > 0 || Object.keys(progress.exercises).length > 0,
            exam: date && days !== null && days >= 0 ? { date, days } : null,
          };
        }),
      );
    };
    load();
    const subs = [
      subscribe(GLOBAL_SCOPE, 'examDates', load),
      ...courses.flatMap((c) => ['srs', 'progress'].map((a) => subscribe(c.id, a, load))),
    ];
    return () => subs.forEach((u) => u());
  }, [courses]);

  const totalDue = rows?.reduce((s, r) => s + r.due, 0) ?? 0;
  const anyStarted = rows?.some((r) => r.started) ?? false;
  const next = rows?.filter((r) => r.exam).sort((a, b) => a.exam!.days - b.exam!.days)[0];
  const byId = Object.fromEntries(courses.map((c) => [c.id, c]));

  return (
    <section class="sh-dashboard" aria-labelledby="sh-dash-h" aria-busy={!rows}>
      <h2 id="sh-dash-h">{t(lang, 'dash.title')}</h2>
      <div class="sh-dashboard__summary">
        <p class="sh-stat">
          <span class="sh-stat__label">{t(lang, 'dash.reviewToday')}</span>
          <strong class="sh-stat__value">{rows ? totalDue : '—'}</strong>
          {totalDue > 0 && (
            <a class="btn btn--primary" href={reviewPath}>
              {t(lang, 'dash.reviewAll')}
            </a>
          )}
        </p>
        <p class="sh-stat">
          <span class="sh-stat__label">{t(lang, 'dash.nextExam')}</span>
          <strong class="sh-stat__value">
            {next
              ? `${byId[next.id]?.title} · ${t(lang, next.exam!.days === 0 ? 'date.today' : 'date.countdown', { n: next.exam!.days })}`
              : t(lang, 'dash.noExam')}
          </strong>
        </p>
      </div>
      {rows && !anyStarted && <p class="sh-muted">{t(lang, 'dash.empty')}</p>}
      <ul class="sh-dashboard__courses">
        {courses.map((c) => {
          const r = rows?.find((x) => x.id === c.id);
          return (
            <li key={c.id} class="sh-card">
              <h3>
                <a href={c.paths.overview}>{c.title}</a>
              </h3>
              <p>{t(lang, 'dash.solved', { n: r?.solved ?? 0, total: c.exerciseIds.length })}</p>
              <p>
                <a href={c.paths.review}>
                  {t(lang, 'dash.reviewToday')}: {r?.due ?? 0}
                </a>
              </p>
              <p>
                <a href={c.paths.progress}>
                  {r?.exam ? t(lang, 'date.countdown', { n: r.exam.days }) : t(lang, 'dash.noExam')}
                </a>
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
