import type { JSX } from 'preact';
import { topics } from '~/content';
import { hrefFor } from '~/lib/router';

/**
 * Vista «non trovato».
 *
 * Serve a due casi diversi: un indirizzo che non è nessuna vista
 * (`#/qualcosa`) e un modulo che non esiste (`#/study/qualcosa`). In tutt'e
 * due prima ricadevi in silenzio sulla dashboard o sull'elenco dei moduli,
 * senza sapere che l'indirizzo era sbagliato — il tipo di vicolo cieco che
 * fa concludere «non c'è più» a chi arriva da un link salvato mesi fa.
 *
 * Non è una pagina di scuse: è una pagina che ti rimette in strada.
 */
export function NotFound({ what }: { what?: string }): JSX.Element {
  return (
    <section class="view nf">
      <p class="eyebrow">Errore 404</p>
      <h1 class="h">Questa pagina non c'è</h1>
      <p class="lead">
        {what ? (
          <>
            Non esiste nessun modulo che si chiami <code>{what}</code>. Può darsi che l'indirizzo
            sia stato scritto a mano, o che venga da un collegamento vecchio: i moduli sono{' '}
            {topics.length} e li trovi tutti qui sotto.
          </>
        ) : (
          <>
            L'indirizzo non corrisponde a nessuna sezione del sito. Il resto funziona: riparti da
            una di queste.
          </>
        )}
      </p>

      <div class="btn-row">
        <a class="btn primary" href={hrefFor('study')}>
          I moduli di studio ▶
        </a>
        <a class="btn ghost" href={hrefFor('dash')}>
          Torna alla home
        </a>
        <a class="btn ghost" href={hrefFor('exam')}>
          Genera una prova
        </a>
      </div>

      <h2 class="sec">Dove volevi andare?</h2>
      <ul class="nf-list">
        {topics.map((topic, index) => (
          <li key={topic.id}>
            <a href={hrefFor('study', topic.id)}>
              <span class="nf-n">{String(index + 1).padStart(2, '0')}</span>
              {topic.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
