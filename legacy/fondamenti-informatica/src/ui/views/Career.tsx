import type { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { topics, topicById, TOPIC_GROUPS } from '~/content';
import { readingMinutes } from '~/content/outline';
import type { Topic, TopicId } from '~/content/types';
import { hrefFor } from '~/lib/router';
import { fmtNumber } from '~/lib/i18n';
import {
  isStudied,
  resetCareer,
  setStudiedMany,
  toggleStudied,
  useProgress,
  type ProgressData,
} from '~/store/progress';

/** «17 agosto» — la data basta, l'ora non serve a nessuno. */
function shortDate(at: number): string {
  return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long' }).format(new Date(at));
}

function Row({ topic, progress }: { topic: Topic; progress: ProgressData }): JSX.Element {
  const done = isStudied(progress, topic.id);
  const at = progress.done[topic.id];
  const opened = progress.visited.includes(topic.id);
  const index = topics.findIndex((item) => item.id === topic.id);

  return (
    <li class={`car-row${done ? ' done' : ''}`}>
      <button
        type="button"
        class="car-check"
        role="switch"
        aria-checked={done}
        aria-label={`${topic.title}: ${done ? 'studiato' : 'da studiare'}`}
        onClick={() => toggleStudied(topic.id)}
      >
        {done ? '✓' : ''}
      </button>
      <div class="car-body">
        <a class="car-t" href={hrefFor('study', topic.id)}>
          <span class="car-n">{String(index + 1).padStart(2, '0')}</span>
          {topic.title}
        </a>
      </div>
      {/* Lo stato sta in fondo alla riga, non sotto al titolo: la riga è
          larga più di mille pixel e sprecarne ottocento per poi andare a
          capo era il modo più rumoroso di dire due parole. */}
      <div class="car-meta">
        <span class={`car-state${done ? ' on' : ''}`}>
          {done && at !== undefined
            ? `studiato il ${shortDate(at)}`
            : opened
              ? 'aperto, non segnato'
              : 'mai aperto'}
        </span>
        <span class="car-dim">
          {readingMinutes(topic.body)} min · {topic.exercises.length} esercizi
        </span>
      </div>
    </li>
  );
}

export function Career(): JSX.Element {
  const progress = useProgress();
  const [confirming, setConfirming] = useState(false);

  const done = topics.filter((topic) => isStudied(progress, topic.id));
  const percent = Math.round((done.length / topics.length) * 100);

  const remaining = useMemo(
    () =>
      topics
        .filter((topic) => !isStudied(progress, topic.id))
        .reduce((sum, topic) => sum + readingMinutes(topic.body), 0),
    [progress],
  );

  const allIds: TopicId[] = topics.map((topic) => topic.id);

  return (
    <section class="view">
      <p class="eyebrow">Carriera di studio</p>
      <h1 class="h">A che punto sei</h1>
      <p class="lead">
        Segna un modulo come studiato quando lo hai capito davvero — non quando lo hai aperto.
        Aprire una pagina è automatico e non vuol dire niente; questa spunta la metti tu, ed è
        l'unica che conta.
      </p>

      <div class="car-hero">
        <div class="car-big">
          {done.length}
          <span class="car-den">/ {topics.length}</span>
        </div>
        <div class="car-side">
          <div class="car-bar" role="img" aria-label={`${percent} per cento del programma`}>
            <span style={`width:${percent}%`} />
          </div>
          <div class="car-note">
            <b>{percent}%</b> del programma ·{' '}
            {remaining > 0
              ? `restano circa ${fmtNumber(remaining)} minuti di lettura`
              : 'programma completo'}
          </div>
        </div>
      </div>

      {TOPIC_GROUPS.map((group) => {
        const inGroup = group.topicIds
          .map((id) => topicById(id))
          .filter((topic): topic is Topic => topic !== undefined);
        const groupDone = inGroup.filter((topic) => isStudied(progress, topic.id)).length;
        const allDone = groupDone === inGroup.length;

        return (
          <div key={group.id}>
            <h2 class="sec">
              {group.title}
              <span class={`car-count${allDone ? ' full' : ''}`}>
                {groupDone}/{inGroup.length}
              </span>
            </h2>
            <p class="lead">{group.note}</p>
            <ul class="car-list">
              {inGroup.map((topic) => (
                <Row key={topic.id} topic={topic} progress={progress} />
              ))}
            </ul>
            <button
              type="button"
              class="btn ghost mini"
              onClick={() => setStudiedMany(group.topicIds, !allDone)}
            >
              {allDone ? 'Togli la spunta a tutto il blocco' : 'Segna tutto il blocco'}
            </button>
          </div>
        );
      })}

      <h2 class="sec">E adesso</h2>
      <div class="btn-row" style="margin-top:0">
        <a class="btn primary" href={hrefFor('exam', 'full')}>
          Prova d'esame completa ▶
        </a>
        <a class="btn ghost" href={hrefFor('study')}>
          Torna ai moduli
        </a>
        <a class="btn ghost" href={hrefFor('dash')}>
          Quanto sei pronto ▸
        </a>
        <button
          type="button"
          class="btn ghost"
          onClick={() => setStudiedMany(allIds, true)}
        >
          Segna tutto
        </button>
      </div>

      {/* L'azzeramento sta su una riga sua e in tono minore: è l'unica azione
          della pagina che toglie qualcosa, e non va offerta come le altre. */}
      <div class="btn-row" style="margin-top:14px;align-items:center">
        {confirming ? (
          <>
            <button
              type="button"
              class="btn danger"
              onClick={() => {
                resetCareer();
                setConfirming(false);
              }}
            >
              Confermi? Azzera la carriera
            </button>
            <button type="button" class="btn quiet" onClick={() => setConfirming(false)}>
              Annulla
            </button>
          </>
        ) : (
          <button type="button" class="btn quiet" onClick={() => setConfirming(true)}>
            Azzera la carriera
          </button>
        )}
        <p class="fn" style="margin:0">
          Toglie solo le spunte: lo storico delle prove d'esame resta.
        </p>
      </div>
    </section>
  );
}
