import type { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { links, traps, TOPIC_GROUPS, TOPIC_TITLES } from '~/content';
import { diagrams, type Diagram } from '~/content/diagrams';
import type { TopicId } from '~/content/types';
import { hrefFor } from '~/lib/router';
import { DiagramFigure } from '~/ui/components/DiagramFigure';
import { TrapNote } from '~/ui/components/TrapNote';

/**
 * Uno schema, con l'invito a esercitarsi a completarlo.
 *
 * Prima questa pagina era il **catalogo delle tavole del libro di testo**: 156
 * voci con numero di figura e descrizione, cioè la trascrizione di un indice
 * altrui, di cui solo 45 avevano un disegno vero. Le altre 111 erano righe che
 * dicevano «questa figura esiste, va' a cercarla sul libro»: non contenuto,
 * ma una mappa di un'opera che non è nostra.
 *
 * Adesso la pagina contiene solo ciò che il sito ha davvero: i 45 schemi
 * disegnati qui, raggruppati per area del programma invece che per capitolo.
 */
function DiagramEntry({ diagram }: { diagram: Diagram }): JSX.Element {
  return (
    <div class="figdraw">
      <div class="fn" style="margin-bottom:2px">
        {diagram.title}
      </div>
      <DiagramFigure diagram={diagram} />
      <a class="btn ghost mini" href={hrefFor('train', diagram.id)}>
        Esercitati a completarlo ▶
      </a>
    </div>
  );
}

export function References(): JSX.Element {
  const [group, setGroup] = useState<string | 'tutti'>('tutti');

  /** Gli argomenti di ciascun blocco, per risolvere uno schema al suo gruppo. */
  const groupOfTopic = useMemo(() => {
    const map = new Map<TopicId, string>();
    for (const item of TOPIC_GROUPS) {
      for (const id of item.topicIds) map.set(id, item.id);
    }
    return map;
  }, []);

  const shown = useMemo(
    () =>
      group === 'tutti'
        ? diagrams
        : diagrams.filter((diagram) => groupOfTopic.get(diagram.topic) === group),
    [group, groupOfTopic],
  );

  const groups = useMemo(
    () =>
      TOPIC_GROUPS.filter((item) =>
        shown.some((diagram) => groupOfTopic.get(diagram.topic) === item.id),
      ),
    [shown, groupOfTopic],
  );

  return (
    <section class="view">
      <p class="eyebrow">Cassetta degli attrezzi</p>
      <h1 class="h">Schemi &amp; convenzioni</h1>
      <p class="lead">
        <b>{diagrams.length} schemi</b> disegnati per questo sito, uno per ciascuno dei blocchi
        che un'architettura ti chiede di saper riconoscere e ridisegnare a mano. Ognuno si può
        usare in due modi: guardarlo per capire come sono collegate le parti, oppure{' '}
        <b>completarlo</b> — il disegno arriva con alcune etichette mancanti e un elenco da cui
        pescarle, che contiene qualche etichetta in più che non va da nessuna parte.
      </p>

      <div class="panel" style="margin-top:14px">
        <div class="def-filters" role="group" aria-label="Filtra per area del programma">
          <button
            type="button"
            class={`def-chip${group === 'tutti' ? ' on' : ''}`}
            aria-pressed={group === 'tutti'}
            onClick={() => setGroup('tutti')}
          >
            Tutte le aree
          </button>
          {TOPIC_GROUPS.map((item) => (
            <button
              key={item.id}
              type="button"
              class={`def-chip${group === item.id ? ' on' : ''}`}
              aria-pressed={group === item.id}
              onClick={() => setGroup(item.id)}
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>

      <p class="fn" style="margin-top:14px" aria-live="polite">
        {shown.length} {shown.length === 1 ? 'schema' : 'schemi'}
      </p>

      {groups.map((item) => {
        const inGroup = shown.filter((diagram) => groupOfTopic.get(diagram.topic) === item.id);
        return (
          <div key={item.id}>
            <h2 class="sec">{item.title}</h2>
            <p class="fn" style="margin:-4px 0 12px">
              {[...new Set(inGroup.map((diagram) => TOPIC_TITLES[diagram.topic]))].join(' · ')}
            </p>
            {inGroup.map((diagram) => (
              <DiagramEntry key={diagram.id} diagram={diagram} />
            ))}
          </div>
        );
      })}

      <h2 class="sec">Convenzioni di notazione</h2>
      <p class="lead">
        Come conviene scrivere le risposte perché si capiscano: sono <b>buone pratiche</b> di
        notazione, non le regole di nessun corso. Se il tuo corso usa convenzioni diverse, valgono
        le sue.
      </p>
      <div>
        {traps.map((trap) => (
          <TrapNote key={trap.id} trap={trap} />
        ))}
      </div>

      <h2 class="sec">Per approfondire</h2>
      <div class="panel">
        <ul class="linklist">
          {links.map((link) => (
            <li key={link.id}>
              <span>
                <b>{link.label}</b>
              </span>
              <span class="d">{link.note}</span>
            </li>
          ))}
        </ul>
      </div>

      <div class="disclaim">
        Gli schemi di questa pagina sono <b>disegnati da zero</b> per questo sito. Rappresentano
        strutture standard dell'architettura dei calcolatori — un multiplexer, una cache, una
        pipeline — che qualunque testo descrive allo stesso modo perché sono informazione
        tecnica, non l'invenzione di qualcuno: nessuna illustrazione altrui è riprodotta qui.
      </div>
    </section>
  );
}
