/** @jsxImportSource preact */
/**
 * Elenco filtrabile degli esercizi di un corso (argomento, obiettivo, difficoltà, stato, testo).
 * Righe compatte raggruppate per capitolo e argomento (intestazioni con ancora `#t-<argomento>`,
 * richiamate dall'indice in cima alla pagina): titolo, difficoltà con icona, generato/statico, stato.
 */
import { useMemo, useState } from 'preact/hooks';
import type { TopicInfo } from '../engine/course-data';
import { exerciseStatus, loadProgress, type ExerciseStatus, type ProgressState } from '../engine/progress';
import { useStored } from './lib/hooks';
import { t, type Lang } from './lib/i18n';
import './islands.css';

export interface ExerciseSummary {
  id: string;
  topic: string;
  objectives: string[];
  difficulty: 1 | 2 | 3;
  title: string;
  generated: boolean;
}

export interface ExerciseListProps {
  lang: Lang;
  courseId: string;
  /** Percorso della sezione Esercizi: il link di una voce è `<percorso><argomento>/#<id>`. */
  exercisesPath: string;
  topics: TopicInfo[];
  /** Voci compatte (`packItem`): centinaia di oggetti nelle props di Astro pesavano il doppio. */
  items: string[];
}

const SEP = '|';

/** Voce compatta `id|argomento|obiettivi separati da spazi|difficoltà|g|titolo` (il titolo per ultimo: può contenere `|`). */
export const packItem = (it: ExerciseSummary): string =>
  [it.id, it.topic, it.objectives.join(' '), it.difficulty, it.generated ? 'g' : '', it.title].join(SEP);

export function unpackItem(s: string): ExerciseSummary {
  const parts = s.split(SEP);
  const [id = '', topic = '', objectives = '', difficulty = '1', generated = ''] = parts;
  return {
    id,
    topic,
    objectives: objectives ? objectives.split(' ') : [],
    difficulty: Number(difficulty) as 1 | 2 | 3,
    generated: generated === 'g',
    title: parts.slice(5).join(SEP),
  };
}

/** Stato: spunta (risolto), mezzo cerchio (tentato), cerchio vuoto (da fare). Il testo è accanto. */
function StatusIcon({ status }: { status: ExerciseStatus }) {
  return (
    <svg class="ex-row__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="8.5" />
      {status === 'risolto' && <path d="m8.2 12.3 2.6 2.6 5-5.4" />}
      {status === 'tentato' && <path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" class="ex-row__half" />}
    </svg>
  );
}

/** Difficoltà: tre tacche crescenti, piene fino al livello. */
function DifficultyIcon({ level }: { level: 1 | 2 | 3 }) {
  return (
    <svg class="ex-diff__icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={1 + i * 5}
          y={10 - i * 3.5}
          width="3.5"
          height={5 + i * 3.5}
          rx="1"
          class={i < level ? 'on' : 'off'}
        />
      ))}
    </svg>
  );
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function ExerciseList({
  lang,
  courseId,
  exercisesPath,
  topics,
  items: packed,
}: ExerciseListProps) {
  const items = useMemo(() => packed.map(unpackItem), [packed]);
  const [topic, setTopic] = useState('');
  const [objective, setObjective] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState<'' | ExerciseStatus>('');
  const [query, setQuery] = useState('');
  const [progress] = useStored<ProgressState | null>(
    courseId,
    'progress',
    () => loadProgress(courseId),
    null,
  );
  const topicTitle = useMemo(() => Object.fromEntries(topics.map((tp) => [tp.id, tp.title])), [topics]);
  const objectives = topic ? (topics.find((tp) => tp.id === topic)?.objectives ?? []) : [];

  const filtered = items.filter((it) => {
    if (topic && it.topic !== topic) return false;
    if (objective && !it.objectives.includes(objective)) return false;
    if (difficulty && String(it.difficulty) !== difficulty) return false;
    if (status && exerciseStatus(progress?.exercises[it.id]) !== status) return false;
    if (query && !norm(`${it.title} ${topicTitle[it.topic] ?? ''}`).includes(norm(query))) return false;
    return true;
  });
  const active = !!(topic || objective || difficulty || status || query);

  // Capitoli → argomenti → esercizi, nell'ordine degli argomenti; gruppi vuoti omessi.
  const groups: { title: string | undefined; topics: { topic: TopicInfo; items: ExerciseSummary[] }[] }[] =
    [];
  for (const tp of topics) {
    const rows = filtered.filter((it) => it.topic === tp.id);
    if (rows.length === 0) continue;
    const last = groups.at(-1);
    if (last && last.title === tp.group) last.topics.push({ topic: tp, items: rows });
    else groups.push({ title: tp.group, topics: [{ topic: tp, items: rows }] });
  }

  return (
    <section class="sh-list" aria-label={t(lang, 'page.exercises.title')}>
      <form
        class="sh-filters"
        role="search"
        onSubmit={(e) => e.preventDefault()}
        aria-label={t(lang, 'list.filters')}
      >
        <label class="sh-filter sh-filter--wide">
          <span>{t(lang, 'list.search')}</span>
          <input
            class="sh-input"
            type="search"
            value={query}
            placeholder={t(lang, 'list.searchPlaceholder')}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="sh-filter">
          <span>{t(lang, 'engine.topic')}</span>
          <select
            class="sh-input"
            value={topic}
            onChange={(e) => {
              setTopic((e.target as HTMLSelectElement).value);
              setObjective('');
            }}
          >
            <option value="">{t(lang, 'engine.all')}</option>
            {topics.map((tp) => (
              <option value={tp.id} key={tp.id}>
                {tp.title}
              </option>
            ))}
          </select>
        </label>
        <label class="sh-filter">
          <span>{t(lang, 'engine.objective')}</span>
          <select
            class="sh-input"
            value={objective}
            disabled={!topic}
            onChange={(e) => setObjective((e.target as HTMLSelectElement).value)}
          >
            <option value="">{t(lang, 'engine.all')}</option>
            {objectives.map((o) => (
              <option value={o.id} key={o.id}>
                {o.text}
              </option>
            ))}
          </select>
        </label>
        <label class="sh-filter">
          <span>{t(lang, 'engine.difficulty')}</span>
          <select
            class="sh-input"
            value={difficulty}
            onChange={(e) => setDifficulty((e.target as HTMLSelectElement).value)}
          >
            <option value="">{t(lang, 'engine.all')}</option>
            {[1, 2, 3].map((d) => (
              <option value={String(d)} key={d}>
                {t(lang, `engine.difficulty.${d}`)}
              </option>
            ))}
          </select>
        </label>
        <label class="sh-filter">
          <span>{t(lang, 'engine.status')}</span>
          <select
            class="sh-input"
            value={status}
            onChange={(e) => setStatus((e.target as HTMLSelectElement).value as ExerciseStatus)}
          >
            <option value="">{t(lang, 'engine.all')}</option>
            {(['nuovo', 'tentato', 'risolto'] as const).map((s) => (
              <option value={s} key={s}>
                {t(lang, `engine.status.${s}`)}
              </option>
            ))}
          </select>
        </label>
        {active && (
          <button
            type="button"
            class="btn btn--ghost"
            onClick={() => {
              setTopic('');
              setObjective('');
              setDifficulty('');
              setStatus('');
              setQuery('');
            }}
          >
            {t(lang, 'list.reset')}
          </button>
        )}
      </form>
      <p class="sh-count" role="status" aria-live="polite">
        {t(lang, 'list.results', { n: filtered.length })}
      </p>
      {filtered.length === 0 ? (
        <p class="sh-muted">{t(lang, 'list.none')}</p>
      ) : (
        groups.map((g, gi) => (
          <section class="ex-chapter" key={gi} aria-labelledby={g.title ? `ex-ch-${gi}` : undefined}>
            {g.title && (
              <h2 class="ex-chapter__title" id={`ex-ch-${gi}`}>
                {g.title}
              </h2>
            )}
            {g.topics.map(({ topic: tp, items: rows }) => (
              <section class="ex-topic" key={tp.id} id={`t-${tp.id}`} aria-labelledby={`t-${tp.id}-h`}>
                <h3 class="ex-topic__title" id={`t-${tp.id}-h`}>
                  <a href={`${exercisesPath}${tp.id}/`}>{tp.title}</a>{' '}
                  <span class="sh-muted">({rows.length})</span>
                </h3>
                <ul class="ex-rows">
                  {rows.map((it) => {
                    const st = exerciseStatus(progress?.exercises[it.id]);
                    return (
                      <li class="ex-row" key={it.id} data-status={st}>
                        <StatusIcon status={st} />
                        <span class="ex-row__body">
                          <a class="ex-row__title" href={`${exercisesPath}${it.topic}/#${it.id}`}>
                            {it.title}
                          </a>{' '}
                          <span class="ex-row__meta">
                            <span class={`ex-diff ex-diff--${it.difficulty}`}>
                              <DifficultyIcon level={it.difficulty} />
                              {t(lang, `engine.difficulty.${it.difficulty}`)}
                            </span>
                            <span class="ex-kind">
                              {t(lang, it.generated ? 'engine.generated' : 'list.static')}
                            </span>
                            <span class={`ex-status ex-status--${st}`}>{t(lang, `engine.status.${st}`)}</span>
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </section>
        ))
      )}
    </section>
  );
}
