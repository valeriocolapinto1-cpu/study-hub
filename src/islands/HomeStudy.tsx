/** @jsxImportSource preact */
/**
 * Home, parte per chi torna: ripasso del giorno di tutti i corsi, esercizi risolti
 * per corso, prossimo esame e appunti recenti. Tutto dallo storage locale; i testi
 * arrivano dalle props (nessun dizionario nel bundle, per restare nel budget JS).
 * La sezione è nascosta via CSS a chi non ha ancora dati (html:not([data-returning])),
 * impostato prima del disegno da uno script inline della home.
 */
import { useEffect, useState } from 'preact/hooks';
import type { CourseIndex } from '../engine/course-data';
import { dataUrl, INDEX_NAME } from '../engine/course-data';
import { buildQueue } from '../engine/fsrs';
import { daysUntil } from '../engine/mastery';
import { allNotes } from '../engine/notes';
import { exerciseStatus, loadProgress, loadSrs } from '../engine/progress';
import { GLOBAL_SCOPE, read, subscribe } from '../engine/storage';
import { fetchJson } from './lib/hooks';
import './platform.css';

export interface HomeCourse {
  id: string;
  title: string;
  examDates: string[];
  /** Cartella dei dati del corso (`paths.data`): gli id di carte ed esercizi arrivano da `indice.json`. */
  dataUrl: string;
  paths: { overview: string; review: string; progress: string; exercises: string };
}

export interface HomeStudyProps {
  lang: 'it' | 'en';
  base: string;
  courses: HomeCourse[];
  reviewPath: string;
  notesPath: string;
  texts: Record<string, string>;
}

interface Row {
  id: string;
  due: number;
  solved: number;
  exam: { date: string; days: number } | null;
}
interface RecentNote {
  key: string;
  label: string;
  text: string;
  course: string;
  href: string | null;
  updatedAt: number;
}

const fmt = (s: string | undefined, p: Record<string, string | number>) =>
  (s ?? '').replace(/\{(\w+)\}/g, (m, k: string) => (k in p ? String(p[k]) : m));

export default function HomeStudy({ lang, base, courses, reviewPath, notesPath, texts: T }: HomeStudyProps) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [notes, setNotes] = useState<RecentNote[]>([]);
  const [indexes, setIndexes] = useState<Record<string, CourseIndex> | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const titles = Object.fromEntries(courses.map((c) => [c.id, c.title]));
  const locale = lang === 'it' ? 'it-IT' : 'en-GB';
  const dateFmt = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    });

  // Gli indici dei corsi si scaricano solo per chi ha già dati di studio (la sezione è altrimenti nascosta).
  useEffect(() => {
    if (document.documentElement.dataset.returning === undefined) return;
    let alive = true;
    setFailed(false);
    Promise.all(courses.map((c) => fetchJson<CourseIndex>(dataUrl(c.dataUrl, INDEX_NAME))))
      .then((list) => alive && setIndexes(Object.fromEntries(courses.map((c, i) => [c.id, list[i]!]))))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [attempt]);

  useEffect(() => {
    const load = () => {
      const now = Date.now();
      const newPerDay = read<{ newPerDay?: number }>(GLOBAL_SCOPE, 'settings', {}).newPerDay ?? 20;
      const personal = read<Record<string, string>>(GLOBAL_SCOPE, 'examDates', {});
      setRows(
        indexes &&
          courses.map((c) => {
            const cardIds = indexes[c.id]!.cards.map((x) => x.id);
            const exerciseIds = indexes[c.id]!.exercises.map((x) => x.id);
            const srs = loadSrs(c.id);
            const progress = loadProgress(c.id);
            const studied = Object.keys(srs.cards).length;
            const due = studied ? buildQueue(cardIds, srs.cards, now, { newLimit: 0 }).length : 0;
            const fresh = studied ? Math.min(newPerDay, Math.max(0, cardIds.length - studied)) : 0;
            const date =
              personal[c.id] ?? [...c.examDates].sort().find((d) => (daysUntil(d, now) ?? -1) >= 0) ?? null;
            const days = date ? daysUntil(date, now) : null;
            return {
              id: c.id,
              due: due + fresh,
              solved: exerciseIds.filter((id) => exerciseStatus(progress.exercises[id]) === 'risolto').length,
              exam: date && days !== null && days >= 0 ? { date, days } : null,
            };
          }),
      );
      setNotes(
        allNotes()
          .filter((n) => n.text.trim())
          .slice(0, 3)
          .map((n) => ({
            key: `${n.scope}:${n.id}`,
            label: n.label ?? n.id,
            text: n.text.length > 160 ? `${n.text.slice(0, 160)}…` : n.text,
            course: titles[n.scope] ?? '',
            href: n.page ? `${base}${lang}/${n.page.replace(/^\/+|\/+$/g, '')}/`.replace(/\/\/$/, '/') : null,
            updatedAt: n.updatedAt,
          })),
      );
    };
    load();
    const subs = [
      subscribe(GLOBAL_SCOPE, 'examDates', load),
      ...courses.flatMap((c) => ['srs', 'progress', 'notes'].map((a) => subscribe(c.id, a, load))),
    ];
    return () => subs.forEach((u) => u());
  }, [indexes]);

  const totalDue = rows?.reduce((s, r) => s + r.due, 0) ?? 0;
  const next = rows?.filter((r) => r.exam).sort((a, b) => a.exam!.days - b.exam!.days)[0];
  const daysText = (d: number) => (d === 0 ? T.today : fmt(d === 1 ? T.inOneDay : T.inDays, { n: d }));

  return (
    <section class="pf-home-study" aria-labelledby="pf-home-study-h" aria-busy={rows ? 'false' : 'true'}>
      <h2 id="pf-home-study-h">{T.title}</h2>
      {failed && (
        <p class="pf-stat__note" role="alert">
          {T.loadError}{' '}
          <button type="button" class="btn btn--sm" onClick={() => setAttempt((n) => n + 1)}>
            {T.retry}
          </button>
        </p>
      )}
      <div class="pf-home-study__stats">
        <div class="pf-stat">
          <p class="pf-stat__label">{T.reviewToday}</p>
          <p class="pf-stat__value">{rows ? fmt(totalDue === 1 ? T.card : T.cards, { n: totalDue }) : '—'}</p>
          {totalDue > 0 ? (
            <a class="btn btn--primary btn--sm" href={reviewPath}>
              {T.reviewAll}
            </a>
          ) : (
            rows && <p class="pf-stat__note">{T.reviewNone}</p>
          )}
        </div>
        <div class="pf-stat">
          <p class="pf-stat__label">{T.nextExam}</p>
          {next?.exam ? (
            <>
              <p class="pf-stat__value">{daysText(next.exam.days)}</p>
              <p class="pf-stat__note">
                <a href={courses.find((c) => c.id === next.id)?.paths.progress}>{titles[next.id]}</a> ·{' '}
                {dateFmt(next.exam.date)}
              </p>
            </>
          ) : (
            <>
              <p class="pf-stat__value">—</p>
              <p class="pf-stat__note">{T.noExam}</p>
            </>
          )}
        </div>
      </div>

      <table class="pf-home-study__table">
        <caption class="visually-hidden">{T.tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{T.course}</th>
            <th scope="col" class="num">
              {T.colReview}
            </th>
            <th scope="col">{T.colSolved}</th>
            <th scope="col">{T.colExam}</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => {
            const r = rows?.find((x) => x.id === c.id);
            const total = indexes?.[c.id]?.exercises.length ?? 0;
            const pct = r && total ? Math.round((r.solved / total) * 100) : 0;
            return (
              <tr key={c.id} data-course={c.id}>
                <th scope="row">
                  <a href={c.paths.overview}>{c.title}</a>
                </th>
                <td class="num">{r ? <a href={c.paths.review}>{r.due}</a> : '—'}</td>
                <td>
                  <span class="pf-home-study__solved">
                    <span class="pf-meter" aria-hidden="true">
                      <span class="pf-meter__fill" style={{ inlineSize: `${pct}%` }} />
                    </span>
                    <a href={c.paths.exercises}>{fmt(T.solved, { n: r?.solved ?? 0, total })}</a>
                  </span>
                </td>
                <td>
                  <a href={c.paths.progress}>{r?.exam ? daysText(r.exam.days) : T.setDate}</a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {notes.length > 0 && (
        <div class="pf-home-study__notes">
          <h3>{T.recentNotes}</h3>
          <ul>
            {notes.map((n) => (
              <li key={n.key}>
                <p class="pf-home-study__note-head">
                  {n.href ? <a href={n.href}>{n.label}</a> : <span>{n.label}</span>}
                  {n.course && <span class="muted"> · {n.course}</span>}
                </p>
                <p class="pf-home-study__note-text">{n.text}</p>
              </li>
            ))}
          </ul>
          <p>
            <a href={notesPath}>{T.allNotes}</a>
          </p>
        </div>
      )}
    </section>
  );
}
