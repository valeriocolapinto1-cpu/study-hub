/** @jsxImportSource preact */
/** Elenco filtrabile degli esercizi di un corso (argomento, obiettivo, difficoltà, stato, testo). */
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
  href: string;
}

export interface ExerciseListProps {
  lang: Lang;
  courseId: string;
  topics: TopicInfo[];
  items: ExerciseSummary[];
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function ExerciseList({ lang, courseId, topics, items }: ExerciseListProps) {
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
        <ul class="sh-items">
          {filtered.map((it) => {
            const st = exerciseStatus(progress?.exercises[it.id]);
            return (
              <li class="sh-item" key={it.id} data-status={st}>
                <a class="sh-item__link" href={it.href}>
                  {it.title}
                </a>
                <span class="sh-item__meta">
                  <span>{topicTitle[it.topic]}</span>
                  <span class={`sh-tag sh-tag--d${it.difficulty}`}>
                    {t(lang, `engine.difficulty.${it.difficulty}`)}
                  </span>
                  {it.generated && <span class="sh-tag">{t(lang, 'engine.generated')}</span>}
                  <span class={`sh-tag sh-tag--${st}`}>{t(lang, `engine.status.${st}`)}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
