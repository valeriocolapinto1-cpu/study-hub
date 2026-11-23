/** @jsxImportSource preact */
/**
 * Sessione di ripasso FSRS: coda del corso o coda globale (più corsi), carta
 * fronte/retro, valutazione Again/Hard/Good/Easy con anteprima degli
 * intervalli, scorciatoie da tastiera, statistiche e previsione.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { indexUrl, type CardData, type CardMeta, type CourseIndex } from '../engine/course-data';
import {
  buildQueue,
  formatInterval,
  preview,
  stats,
  RATINGS,
  DAY_MS,
  type Rating,
  type SrsCard,
} from '../engine/fsrs';
import { loadSrs, reviewsOn, saveReview, type SrsState } from '../engine/progress';
import { GLOBAL_SCOPE, read, subscribe, update } from '../engine/storage';
import { examDateFor } from '../engine/mastery';
import { STUDIED_AREA, loadStudied, reviewableCards, type StudiedState } from '../engine/studied';
import { ignoreKey, openKeys, useNow, useRemote } from './lib/hooks';
import { loadCard, loadTopic } from './lib/course-data-client';
import { t, type Lang } from './lib/i18n';
import './islands.css';

export interface Deck {
  courseId: string;
  title: string;
  /** Cartella dei dati del corso (`…/dati/`): testi delle carte in `<argomento>.json`. */
  dataPath: string;
  /** Voci delle carte (pagina del corso); se mancano si leggono da `indice.json` (coda globale). */
  cards?: CardMeta[];
  /** Date d'appello suggerite (per non programmare ripassi oltre l'esame). */
  examDates?: string[];
  /** Indice della teoria del corso (invito a segnare come studiato un argomento). */
  theoryPath?: string;
}

export interface ReviewSessionProps {
  lang: Lang;
  decks: Deck[];
}

const SEP = '::';
/** Elenco delle scorciatoie (HTML statico di CourseReview.astro e della pagina /ripasso/). */
const KEYS_ID = 'sh-review-keys';
const RATING_KEYS: Record<Rating, string> = {
  1: 'review.again',
  2: 'review.hard',
  3: 'review.good',
  4: 'review.easy',
};

interface Settings {
  newPerDay?: number;
}

function examLimit(courseId: string, suggested: string[] | undefined, now: number): number | undefined {
  const personal = read<Record<string, string>>(GLOBAL_SCOPE, 'examDates', {})[courseId];
  const date = examDateFor(personal, suggested ?? [], now);
  if (!date) return undefined;
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const at = new Date(y, m - 1, d, 8).getTime();
  return at > now ? at : undefined;
}

export default function ReviewSession({ lang, decks }: ReviewSessionProps) {
  const remoteUrls = decks.filter((d) => !d.cards).map((d) => indexUrl({ data: d.dataPath }));
  const remote = useRemote<CourseIndex>(remoteUrls);
  const now = useNow(60_000);
  const [states, setStates] = useState<Record<string, SrsState>>({});
  const [studied, setStudied] = useState<Record<string, StudiedState>>({});
  const [settings, setSettings] = useState<Settings>({});
  const [flipped, setFlipped] = useState(false);
  const [doneToday, setDoneToday] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  // Esito dell'ultima valutazione per i lettori di schermo.
  const [announce, setAnnounce] = useState('');

  // Carte di tutti i mazzi, con id globale `<corso>::<carta>`.
  const allCards = useMemo(() => {
    const out = new Map<string, { courseId: string; title: string; dataPath: string; card: CardMeta }>();
    let r = 0;
    for (const d of decks) {
      const cards = d.cards ?? (remote.state === 'ready' ? (remote.data[r++]?.cards ?? []) : []);
      for (const c of cards)
        out.set(`${d.courseId}${SEP}${c.id}`, {
          courseId: d.courseId,
          title: d.title,
          dataPath: d.dataPath,
          card: c,
        });
    }
    return out;
  }, [decks, remote]);

  useEffect(() => {
    const load = () => {
      setStates(Object.fromEntries(decks.map((d) => [d.courseId, loadSrs(d.courseId)])));
      setStudied(Object.fromEntries(decks.map((d) => [d.courseId, loadStudied(d.courseId)])));
      setSettings(read<Settings>(GLOBAL_SCOPE, 'settings', {}));
    };
    load();
    const unsubs = decks.flatMap((d) => ['srs', STUDIED_AREA].map((a) => subscribe(d.courseId, a, load)));
    return () => unsubs.forEach((u) => u());
  }, [decks]);

  const cardsMap = useMemo(() => {
    const m: Record<string, SrsCard> = {};
    for (const [courseId, s] of Object.entries(states))
      for (const [id, c] of Object.entries(s.cards)) m[`${courseId}${SEP}${id}`] = c;
    return m;
  }, [states]);

  // Nel ripasso: le carte già viste e le nuove dei soli argomenti segnati come studiati (studied.ts).
  const { ids, waiting } = useMemo(() => {
    const out = { ids: [] as string[], waiting: 0 };
    if (!now) return out;
    for (const d of decks) {
      const prefix = `${d.courseId}${SEP}`;
      const cards = [...allCards.entries()]
        .filter(([, v]) => v.courseId === d.courseId)
        .map(([, v]) => ({ id: v.card.id, topic: v.card.topic }));
      const r = reviewableCards(
        cards,
        states[d.courseId]?.cards ?? {},
        studied[d.courseId] ?? { v: 1, topics: {} },
        now,
      );
      out.ids.push(...r.ids.map((id) => prefix + id));
      out.waiting += r.waiting;
    }
    return out;
  }, [allCards, states, studied, now, decks]);
  const anyStudied = Object.values(studied).some((s) => Object.keys(s.topics).length > 0);
  const newPerDay = settings.newPerDay ?? 20;
  // Nuove già introdotte oggi (prima valutazione oggi).
  const introducedToday = useMemo(() => {
    if (!now) return 0;
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    let n = 0;
    for (const [courseId, s] of Object.entries(states)) {
      const before = new Set(s.log.filter((e) => e.at < start.getTime()).map((e) => e.id));
      const today = new Set(s.log.filter((e) => e.at >= start.getTime()).map((e) => e.id));
      for (const id of today) if (!before.has(id) && allCards.has(`${courseId}${SEP}${id}`)) n++;
    }
    return n;
  }, [states, now, allCards]);
  const queue = useMemo(
    () => (now ? buildQueue(ids, cardsMap, now, { newLimit: Math.max(0, newPerDay - introducedToday) }) : []),
    [ids, cardsMap, now, newPerDay, introducedToday],
  );
  const st = useMemo(() => (now ? stats(ids, cardsMap, now) : null), [ids, cardsMap, now]);
  const reviewedToday = useMemo(
    () => (now ? Object.values(states).reduce((s, x) => s + reviewsOn(x, new Date(now)), 0) : 0),
    [states, now],
  );

  const current = queue[0];
  const info = current ? allCards.get(current.id) : undefined;

  // Testi della carta corrente da dati/<argomento>.json (in memoria per argomento); si anticipa la successiva.
  const [text, setText] = useState<{ id: string; card?: CardData; error?: boolean } | null>(null);
  const [textAttempt, setTextAttempt] = useState(0);
  const nextInfo = queue[1] ? allCards.get(queue[1].id) : undefined;
  useEffect(() => {
    if (!current || !info) return;
    let alive = true;
    setText((x) => (x?.id === current.id && x.card ? x : { id: current.id }));
    loadCard({ data: info.dataPath }, info.card)
      .then((card) => alive && setText({ id: current.id, card }))
      .catch(() => alive && setText({ id: current.id, error: true }));
    if (nextInfo) loadTopic({ data: nextInfo.dataPath }, nextInfo.card.topic).catch(() => {});
    return () => {
      alive = false;
    };
  }, [current?.id, info, textAttempt]);
  const shown = text?.id === current?.id ? text : null;
  const dueCount = queue.filter((q) => q.card.state !== 'new').length;
  const newCount = queue.length - dueCount;
  const limitFor = (courseId: string) =>
    examLimit(courseId, decks.find((d) => d.courseId === courseId)?.examDates, now || Date.now());
  const intervals =
    current && info
      ? preview(current.card, now, {
          ...(limitFor(info.courseId) ? { notAfter: limitFor(info.courseId)! } : {}),
        })
      : null;

  const rate = (rating: Rating) => {
    if (!current || !info || !flipped) return;
    const limit = limitFor(info.courseId);
    const next = saveReview(
      info.courseId,
      current.id.split(SEP)[1]!,
      rating,
      Date.now(),
      limit ? { notAfter: limit } : {},
    );
    setStates((s) => ({ ...s, [info.courseId]: next }));
    if (intervals)
      setAnnounce(
        t(lang, 'review.rated', {
          rating: t(lang, RATING_KEYS[rating]),
          interval: formatInterval(intervals[rating], lang),
        }),
      );
    setFlipped(false);
    setDoneToday((n) => n + 1);
    requestAnimationFrame(() => cardRef.current?.focus());
  };

  // Girata la carta, il focus va sulla risposta (che il lettore di schermo legge); Tab porta alle valutazioni.
  const flip = () => {
    setFlipped(true);
    requestAnimationFrame(() => backRef.current?.focus());
  };

  // useLayoutEffect: il listener con lo stato aggiornato è attivo subito dopo il render, non dopo il disegno;
  // con useEffect un tasto premuto fra render e disegno trovava ancora lo stato precedente (carta già girata).
  useLayoutEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (ignoreKey(e)) return;
      const el = e.target as HTMLElement | null;
      // Su pulsanti e link Spazio/Invio hanno già il comportamento nativo.
      if (
        (e.key === ' ' || e.key === 'Enter') &&
        !flipped &&
        current &&
        shown?.card &&
        !(el && /^(BUTTON|A|SUMMARY)$/.test(el.tagName))
      ) {
        e.preventDefault();
        flip();
      } else if (flipped && /^[1-4]$/.test(e.key)) {
        e.preventDefault();
        rate(Number(e.key) as Rating);
      } else if (e.key === '?' && current) {
        e.preventDefault();
        openKeys(KEYS_ID);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (remote.state === 'loading' && remoteUrls.length > 0)
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
  if (allCards.size === 0) return <p class="sh-muted">{t(lang, 'review.empty')}</p>;
  if (now > 0 && ids.length === 0) {
    const links = decks.filter((d) => d.theoryPath);
    return (
      // Stesso contenitore della sessione (spazio riservato in CSS): niente spostamenti all'idratazione.
      <section class="sh-review sh-review-start" aria-label={t(lang, 'review.title')}>
        <p class="sh-muted">
          {anyStudied && waiting > 0
            ? t(lang, 'review.waiting', { n: waiting })
            : t(lang, 'review.startStudied')}
        </p>
        {links.length > 0 && (
          <p class="sh-actions">
            {links.map((d) => (
              <a key={d.courseId} class="btn btn--primary" href={d.theoryPath}>
                {links.length > 1
                  ? t(lang, 'review.toTheoryOf', { course: d.title })
                  : t(lang, 'review.toTheory')}
              </a>
            ))}
          </p>
        )}
      </section>
    );
  }

  return (
    <section class="sh-review" aria-label={t(lang, 'review.title')}>
      <p class="sh-count" role="status" aria-live="polite">
        {now ? t(lang, 'review.remaining', { due: dueCount, new: newCount }) : t(lang, 'engine.loading')}
      </p>

      {now > 0 && !current && <p class="sh-alert sh-alert--success">{t(lang, 'review.done')}</p>}
      {waiting > 0 && <p class="sh-help">{t(lang, 'review.waiting', { n: waiting })}</p>}

      {current && info && (
        <div
          class={`sh-flashcard sh-card ${flipped ? 'is-flipped' : ''}`}
          ref={cardRef}
          tabIndex={-1}
          aria-label={t(lang, 'review.card', { n: doneToday + 1, total: doneToday + queue.length })}
        >
          <p class="sh-flashcard__meta">
            <span class="sh-tag">{t(lang, `review.kind.${info.card.kind}`)}</span>
            {decks.length > 1 && <span class="sh-tag">{info.title}</span>}
          </p>
          <div class="sh-flashcard__face">
            <h3 class="sh-visually-hidden">{t(lang, 'review.front')}</h3>
            {shown?.card ? (
              <div class="prose" dangerouslySetInnerHTML={{ __html: shown.card.frontHtml }} />
            ) : shown?.error ? (
              <p class="sh-alert sh-alert--danger" role="alert">
                {t(lang, 'engine.loadError')}{' '}
                <button type="button" class="btn" onClick={() => setTextAttempt((a) => a + 1)}>
                  {t(lang, 'engine.retry')}
                </button>
              </p>
            ) : (
              <p class="sh-muted" aria-busy="true">
                {t(lang, 'engine.loading')}
              </p>
            )}
          </div>
          {!shown?.card ? null : flipped ? (
            <div class="sh-flashcard__face sh-flashcard__back" ref={backRef} tabIndex={-1}>
              <h3 class="sh-visually-hidden">{t(lang, 'review.back')}</h3>
              <div class="prose" dangerouslySetInnerHTML={{ __html: shown.card.backHtml }} />
              <fieldset class="sh-ratings">
                <legend>{t(lang, 'review.rate')}</legend>
                {RATINGS.map((r) => (
                  <button
                    type="button"
                    key={r}
                    class={`btn sh-rating sh-rating--${r}`}
                    onClick={() => rate(r)}
                    aria-keyshortcuts={String(r)}
                  >
                    <span>{t(lang, RATING_KEYS[r])}</span>
                    {intervals && <small>{formatInterval(intervals[r], lang)}</small>}
                  </button>
                ))}
              </fieldset>
            </div>
          ) : (
            <div class="sh-actions">
              <button type="button" class="btn btn--primary" onClick={flip} aria-keyshortcuts="Space">
                {t(lang, 'review.showAnswer')}
              </button>
            </div>
          )}
          <div class="sh-keys-row">
            <p class="sh-help">{t(lang, 'review.keys')}</p>
            <button
              type="button"
              class="btn btn--sm sh-keys-btn"
              popovertarget={KEYS_ID}
              aria-keyshortcuts="?"
              aria-label={t(lang, 'engine.keys')}
            >
              ?
            </button>
          </div>
        </div>
      )}
      <p class="sh-visually-hidden" role="status">
        {announce}
      </p>

      {st && (
        <details class="sh-stats">
          <summary>{t(lang, 'review.stats')}</summary>
          <dl class="sh-dl">
            <div>
              <dt>{t(lang, 'review.stats.total')}</dt>
              <dd>{st.total}</dd>
            </div>
            <div>
              <dt>{t(lang, 'review.stats.learning')}</dt>
              <dd>{st.learning}</dd>
            </div>
            <div>
              <dt>{t(lang, 'review.stats.review')}</dt>
              <dd>{st.review}</dd>
            </div>
            <div>
              <dt>{t(lang, 'review.stats.today')}</dt>
              <dd>{reviewedToday}</dd>
            </div>
            <div>
              <dt>{t(lang, 'review.stats.retention')}</dt>
              <dd>{Math.round(st.averageRetention * 100)}%</dd>
            </div>
          </dl>
          <p>{t(lang, 'review.stats.forecast')}</p>
          <ol class="sh-forecast">
            {st.forecast.map((n, i) => {
              const d = new Date(now + i * DAY_MS);
              return (
                <li key={i}>
                  <span>{d.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-GB', { weekday: 'short' })}</span>
                  <span
                    class="sh-forecast__bar"
                    style={{ blockSize: `${Math.min(100, n * 5)}%` }}
                    aria-hidden="true"
                  />
                  <strong>{n}</strong>
                </li>
              );
            })}
          </ol>
          <label class="sh-filter">
            <span>{t(lang, 'review.newPerDay')}</span>
            <input
              class="sh-input"
              type="number"
              min={0}
              max={200}
              value={newPerDay}
              onChange={(e) => {
                const v = Math.max(0, Math.min(200, Number((e.target as HTMLInputElement).value) || 0));
                setSettings(update<Settings>(GLOBAL_SCOPE, 'settings', {}, (s) => ({ ...s, newPerDay: v })));
              }}
            />
          </label>
        </details>
      )}
    </section>
  );
}
