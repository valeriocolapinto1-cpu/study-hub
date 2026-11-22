/** @jsxImportSource preact */
/**
 * Home, parte per chi torna: ripasso del giorno di tutti i corsi, esercizi risolti
 * per corso, prossimo esame e appunti recenti. Tutto dallo storage locale; gli id di
 * esercizi e carte arrivano da `dati/indice.json`, scaricato solo per i corsi con dati
 * locali (per scartare gli id che non esistono più). I testi arrivano dalle props
 * (nessun dizionario nel bundle, per restare nel budget JS).
 * La sezione è nascosta via CSS a chi non ha ancora dati (html:not([data-returning])),
 * impostato prima del disegno da uno script inline della home.
 */
import { useEffect, useState } from 'preact/hooks';
import { buildQueue } from '../engine/fsrs';
import { daysUntil, examDateFor } from '../engine/mastery';
import { allNotes } from '../engine/notes';
import { exerciseStatus, loadProgress, loadSrs } from '../engine/progress';
import { GLOBAL_SCOPE, read, subscribe } from '../engine/storage';
import { indexUrl, type CourseIndex } from '../engine/course-data';
import { fetchJson } from './lib/hooks';
import './platform.css';

export interface HomeCourse {
  id: string;
  title: string;
  examDates: string[];
  exerciseCount: number;
  cardCount: number;
  paths: { overview: string; review: string; progress: string; exercises: string; data: string };
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

/** Id noti di un corso (dall'indice), `error` se non scaricabile. */
type Known = { exercises: Set<string>; cards: Set<string> } | 'error';

export default function HomeStudy({ lang, base, courses, reviewPath, notesPath, texts: T }: HomeStudyProps) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [known, setKnown] = useState<Record<string, Known>>({});
  const [waiting, setWaiting] = useState(0);
  const [notes, setNotes] = useState<RecentNote[]>([]);
  const [lastPage, setLastPage] = useState<{ href: string; title: string; courseTitle?: string } | null>(
    null,
  );
  const titles = Object.fromEntries(courses.map((c) => [c.id, c.title]));
  const locale = lang === 'it' ? 'it-IT' : 'en-GB';
  const dateFmt = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    });

  // Indici dei soli corsi con dati locali (chi arriva per la prima volta non scarica nulla).
  useEffect(() => {
    const withData = courses.filter((c) => {
      const srs = loadSrs(c.id);
      return Object.keys(srs.cards).length > 0 || Object.keys(loadProgress(c.id).exercises).length > 0;
    });
    setWaiting(withData.length);
    for (const c of withData)
      fetchJson<CourseIndex>(indexUrl(c.paths))
        .then((ix) => ({
          exercises: new Set(ix.exercises.map((e) => e.id)),
          cards: new Set(ix.cards.map((x) => x.id)),
        }))
        .catch((): Known => 'error')
        .then((k) => {
          setKnown((m) => ({ ...m, [c.id]: k }));
          setWaiting((n) => n - 1);
        });
  }, []);

  useEffect(() => {
    const load = () => {
      const now = Date.now();
      const newPerDay = read<{ newPerDay?: number }>(GLOBAL_SCOPE, 'settings', {}).newPerDay ?? 20;
      const personal = read<Record<string, string>>(GLOBAL_SCOPE, 'examDates', {});
      setRows(
        courses.map((c) => {
          const srs = loadSrs(c.id);
          const progress = loadProgress(c.id);
          const k = known[c.id];
          // Senza indice (in arrivo o non scaricabile) si contano gli id salvati.
          const cardIds = Object.keys(srs.cards).filter((id) => !k || k === 'error' || k.cards.has(id));
          const exerciseIds = Object.keys(progress.exercises).filter(
            (id) => !k || k === 'error' || k.exercises.has(id),
          );
          const studied = cardIds.length;
          const due = studied ? buildQueue(cardIds, srs.cards, now, { newLimit: 0 }).length : 0;
          const fresh = studied ? Math.min(newPerDay, Math.max(0, c.cardCount - studied)) : 0;
          const date = examDateFor(personal[c.id], c.examDates, now);
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
    const last = read<{ href?: unknown; title?: unknown; courseTitle?: unknown } | null>(
      GLOBAL_SCOPE,
      'lastStudy',
      null,
    );
    setLastPage(
      last && typeof last.href === 'string' && last.href.startsWith('/') && typeof last.title === 'string'
        ? {
            href: last.href,
            title: last.title,
            ...(typeof last.courseTitle === 'string' ? { courseTitle: last.courseTitle } : {}),
          }
        : null,
    );
    const subs = [
      subscribe(GLOBAL_SCOPE, 'examDates', load),
      ...courses.flatMap((c) => ['srs', 'progress', 'notes'].map((a) => subscribe(c.id, a, load))),
    ];
    return () => subs.forEach((u) => u());
  }, [known]);

  const totalDue = rows?.reduce((s, r) => s + r.due, 0) ?? 0;
  const next = rows?.filter((r) => r.exam).sort((a, b) => a.exam!.days - b.exam!.days)[0];
  const daysText = (d: number) => (d === 0 ? T.today : fmt(d === 1 ? T.inOneDay : T.inDays, { n: d }));

  return (
    <section class="pf-home-study" aria-labelledby="pf-home-study-h" aria-busy={rows ? 'false' : 'true'}>
      <h2 id="pf-home-study-h">{T.title}</h2>
      <div class="pf-home-study__stats">
        <div class="pf-stat pf-stat--resume">
          <p class="pf-stat__label">{T.lastPage}</p>
          {lastPage ? (
            <>
              <p class="pf-stat__value pf-stat__value--text">
                <a href={lastPage.href}>{lastPage.title}</a>
              </p>
              {lastPage.courseTitle && <p class="pf-stat__note">{lastPage.courseTitle}</p>}
            </>
          ) : (
            <p class="pf-stat__note">{T.noLastPage}</p>
          )}
        </div>
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

      {waiting > 0 ? (
        <p class="pf-stat__note" aria-busy="true">
          {T.loading}
        </p>
      ) : (
        Object.values(known).includes('error') && (
          <p class="pf-stat__note" role="alert">
            {T.loadError}
          </p>
        )
      )}

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
            const total = c.exerciseCount;
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
