/** @jsxImportSource preact */
/** Mappa della preparazione: argomenti → obiettivi con livello di padronanza, punti deboli, link a teoria ed esercizi. */
import type { CoursePaths } from '../engine/course-data';
import { LEVEL_KEYS, overallMastery, topicMastery, weakSpots } from '../engine/mastery';
import { useMastery, type MasteryProps } from './lib/course-state';
import { t, type Lang } from './lib/i18n';
import './islands.css';

export interface MasteryMapProps extends MasteryProps {
  lang: Lang;
  paths: Pick<CoursePaths, 'theory' | 'exercises'>;
}

const pct = (v: number) => Math.round(v * 100);

export default function MasteryMap(props: MasteryMapProps) {
  const { lang, topics, paths } = props;
  const { mastery } = useMastery(props);
  const tm = topicMastery(topics, mastery ?? {});
  const weak = mastery ? weakSpots(mastery) : [];
  const objText = Object.fromEntries(
    topics.flatMap((tp) => tp.objectives.map((o) => [o.id, { text: o.text, topic: tp.id }])),
  );
  const overall = mastery ? pct(overallMastery(mastery)) : 0;

  return (
    <section class="sh-mastery" aria-labelledby="sh-mastery-h" aria-busy={!mastery}>
      <h2 id="sh-mastery-h">{t(lang, 'mastery.title')}</h2>
      <p class="sh-help">{t(lang, 'mastery.legend')}</p>
      <p class="sh-overall">
        <span>{t(lang, 'mastery.overall')}</span>
        <meter
          min={0}
          max={100}
          low={40}
          high={70}
          optimum={100}
          value={overall}
          aria-label={`${t(lang, 'mastery.overall')}: ${overall}%`}
        />
        <strong>{overall}%</strong>
      </p>

      <h3>{t(lang, 'mastery.weak')}</h3>
      {weak.length === 0 ? (
        <p class="sh-muted">{t(lang, 'mastery.noWeak')}</p>
      ) : (
        <ul class="sh-weak">
          {weak.map((w) => (
            <li key={w.id}>
              <span>{objText[w.id]?.text ?? w.id}</span>{' '}
              <span class="sh-tag sh-level--1">{pct(w.value)}%</span>{' '}
              {objText[w.id] && (
                <a href={`${paths.exercises}${objText[w.id]!.topic}/`}>{t(lang, 'mastery.exercises')}</a>
              )}
            </li>
          ))}
        </ul>
      )}

      <ol class="sh-topics">
        {tm.map((tp) => {
          const info = topics.find((x) => x.id === tp.id)!;
          return (
            <li key={tp.id} class="sh-topic" data-level={tp.level}>
              <details>
                <summary>
                  <span class="sh-topic__title">{info.title}</span>
                  <span class={`sh-tag sh-level--${tp.level}`}>
                    {t(lang, `mastery.level.${LEVEL_KEYS[tp.level]}`)}
                  </span>
                  <meter
                    min={0}
                    max={100}
                    low={40}
                    high={70}
                    optimum={100}
                    value={pct(tp.value)}
                    aria-label={`${info.title}: ${pct(tp.value)}%`}
                  />
                </summary>
                <ul class="sh-objectives" aria-label={t(lang, 'mastery.objectives')}>
                  {tp.objectives.map((o) => (
                    <li key={o.id} data-level={o.level}>
                      <span>{objText[o.id]?.text}</span>
                      <span class={`sh-tag sh-level--${o.level}`}>
                        {t(lang, `mastery.level.${LEVEL_KEYS[o.level]}`)}
                        {o.evidence > 0 && ` · ${pct(o.value)}%`}
                      </span>
                    </li>
                  ))}
                </ul>
                <p class="sh-actions">
                  <a class="btn btn--ghost" href={`${paths.theory}${tp.id}/`}>
                    {t(lang, 'mastery.theory')}
                  </a>
                  <a class="btn btn--ghost" href={`${paths.exercises}${tp.id}/`}>
                    {t(lang, 'mastery.exercises')}
                  </a>
                </p>
              </details>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
