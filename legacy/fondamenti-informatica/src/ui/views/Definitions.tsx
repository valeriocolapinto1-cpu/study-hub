import type { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { TOPIC_TITLES } from '~/content';
import { definitions } from '~/content/definitions';
import type { Definition } from '~/content/definitions';
import type { TopicId } from '~/content/types';
import { TopicRef } from '~/ui/components/TopicRef';
import { Rich } from '~/ui/components/Rich';

/** Ordine alfabetico italiano: «è» accanto a «e», non in fondo. */
const collator = new Intl.Collator('it-IT', { sensitivity: 'base' });

/** Toglie i tag prima di cercare, così «bit» non matcha `<b>it`. */
function plain(html: string): string {
  return html.replace(/<[^>]+>/g, ' ');
}

export function matches(definition: Definition, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = plain(
    `${definition.term} ${definition.short} ${definition.detail ?? ''}`,
  ).toLowerCase();
  // Tutte le parole devono comparire: «cache miss» non deve pescare ogni voce
  // che contiene «cache».
  return needle.split(/\s+/).every((word) => haystack.includes(word));
}

export function filterDefinitions(
  all: readonly Definition[],
  query: string,
  topic: TopicId | 'all',
): Definition[] {
  return all
    .filter((definition) => (topic === 'all' ? true : definition.topic === topic))
    .filter((definition) => matches(definition, query))
    .sort((a, b) => collator.compare(a.term, b.term));
}

function DefinitionCard({ definition }: { definition: Definition }): JSX.Element {
  return (
    <article class="def">
      <h3 class="def-t">{definition.term}</h3>
      <Rich class="def-s" html={definition.short} />
      {definition.detail && <Rich class="def-d" html={definition.detail} />}
      <div class="def-f">
        <TopicRef class="def-topic" topic={definition.topic} />
      </div>
    </article>
  );
}

export function Definitions(): JSX.Element {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<TopicId | 'all'>('all');

  // Solo gli argomenti che hanno davvero una voce: un filtro che dà zero
  // risultati è rumore.
  const usedTopics = useMemo(() => {
    const ids = [...new Set(definitions.map((definition) => definition.topic))];
    return ids.sort((a, b) => collator.compare(TOPIC_TITLES[a], TOPIC_TITLES[b]));
  }, []);

  const shown = useMemo(() => filterDefinitions(definitions, query, topic), [query, topic]);

  return (
    <section class="view">
      <p class="eyebrow">Formulario</p>
      <h1 class="h">Definizioni</h1>
      <p class="lead">
        I termini che conviene saper enunciare senza pensarci. La prima frase è la definizione
        da scrivere sul foglio; il resto è la precisazione che separa una risposta sufficiente da
        una giusta. {definitions.length} voci.
      </p>

      <div class="panel" style="margin-top:14px">
        <div class="field">
          <label for="def-q">Cerca</label>
          <input
            id="def-q"
            type="search"
            style="width:230px"
            autocomplete="off"
            placeholder="es. miss penalty, hazard, TLB…"
            value={query}
            onInput={(event) => setQuery((event.target as HTMLInputElement).value)}
          />
        </div>
        <div class="def-filters" role="group" aria-label="Filtra per argomento">
          <button
            type="button"
            class={`def-chip${topic === 'all' ? ' on' : ''}`}
            aria-pressed={topic === 'all'}
            onClick={() => setTopic('all')}
          >
            Tutti
          </button>
          {usedTopics.map((id) => (
            <button
              key={id}
              type="button"
              class={`def-chip${topic === id ? ' on' : ''}`}
              aria-pressed={topic === id}
              onClick={() => setTopic(id)}
            >
              {TOPIC_TITLES[id]}
            </button>
          ))}
        </div>
      </div>

      <p class="fn" style="margin-top:14px" aria-live="polite">
        {shown.length === 0
          ? 'Nessuna definizione con questi filtri.'
          : `${shown.length} ${shown.length === 1 ? 'voce' : 'voci'}`}
      </p>

      <div class="deflist">
        {shown.map((definition) => (
          <DefinitionCard key={definition.id} definition={definition} />
        ))}
      </div>

      <div class="disclaim">
        Definizioni scritte per questo sito. Sono la formulazione più breve che regga: se una
        non ti torna, il rimando accanto apre il modulo che la spiega per esteso.
      </div>
    </section>
  );
}
