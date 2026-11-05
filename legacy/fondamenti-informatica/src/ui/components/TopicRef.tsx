import type { JSX } from 'preact';
import { TOPIC_TITLES } from '~/content';
import type { TopicId } from '~/content/types';
import { hrefFor } from '~/lib/router';

interface Props {
  topic: TopicId;
  /** Classe della vecchia didascalia, così il foglio di stile resta valido. */
  class?: string;
}

/**
 * Il rimando in fondo a un quesito, a un esercizio o a uno schema.
 *
 * Prima qui c'era il capitolo del libro di testo — una destinazione che il
 * sito non poteva aprire e che legava contenuti originali alla struttura di
 * un'opera altrui. Adesso punta al **modulo di questo sito** che spiega
 * l'argomento: da una risposta sbagliata si arriva alla teoria in un clic,
 * invece di leggere il numero di un capitolo e chiudere la pagina.
 *
 * La destinazione si ricava da `topic`, che ogni voce ha già: non è un dato
 * in più da tenere allineato a mano.
 */
export function TopicRef({ topic, class: className }: Props): JSX.Element {
  return (
    <a
      class={className ? `topic-ref ${className}` : 'topic-ref'}
      href={hrefFor('study', topic)}
      title={`Apri il modulo «${TOPIC_TITLES[topic]}»`}
    >
      {TOPIC_TITLES[topic]} ↗
    </a>
  );
}
