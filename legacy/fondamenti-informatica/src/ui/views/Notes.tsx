import type { JSX } from 'preact';
import { hrefFor } from '~/lib/router';
import { OWNER, REPO_URL, hasOwnerContact } from '~/lib/site';
import { storage } from '~/store/storage';

/**
 * Note, privacy e licenza.
 *
 * Una pagina sola al posto di «privacy policy» e «termini di servizio», che
 * qui sarebbero due moduli vuoti: non c'è un servizio da regolare, non c'è un
 * account da chiudere, non c'è un dato da chiedere indietro. Quello che serve
 * davvero è dire con precisione che cosa il sito **non** fa, da chi non è
 * approvato, e a chi si scrive se qualcosa non va.
 *
 * Se un giorno il sito dovesse caricare qualcosa da fuori — un servizio di
 * statistiche, un font remoto, qualsiasi cosa — questa pagina va **riscritta**,
 * non ritoccata: «nessun cookie, nessun servizio esterno» diventerebbe falso, e
 * un'informativa che promette il contrario di quel che succede è peggio di
 * nessuna informativa.
 */
export function Notes(): JSX.Element {
  return (
    <section class="view">
      <p class="eyebrow">Trasparenza</p>
      <h1 class="h">Note, privacy e licenza</h1>
      <p class="lead">
        Che cos'è questo sito, che cosa non è, che cosa salva e a chi appartiene quello che ci
        trovi dentro. In breve: è materiale di studio scritto da uno studente, non tocca nessun
        server e non sa chi sei.
      </p>

      <h2 class="sec">Non è il sito di nessun corso</h2>
      <div class="panel narrow">
        <p class="lead">
          È scritto da uno studente per studiare, ed è <b>indipendente</b>: non appartiene a
          nessuna università, a nessun corso e a nessun docente, nessuno di loro l'ha
          commissionato, rivisto o approvato, e non c'è nessun legame da nessuna parte.
        </p>
        <p class="lead" style="margin-top:10px">
          Copre il programma standard di Architettura degli Elaboratori, che è più o meno lo
          stesso in tutte le facoltà di ingegneria e informatica — ma «più o meno» non basta a
          preparare un esame: <b>programma, regole della prova, punteggi e date valgono solo
          quelli del tuo corso</b>. Verificali sulle sue pagine ufficiali, e in caso di
          differenza ha ragione lui.
        </p>
        <p class="lead" style="margin-top:10px">
          La prova che il simulatore genera — 12 quesiti, un'ora, punteggio su 30 — è una{' '}
          <b>struttura scelta da questo sito</b> perché è una misura utile per capire a che punto
          sei: non è, e non riproduce, il formato dell'esame di nessuno.
        </p>
      </div>

      <h2 class="sec">Che cosa viene salvato</h2>
      <div class="panel narrow">
        <p class="lead">
          <b>Niente esce da questo browser.</b> Non c'è un server a cui mandare qualcosa: il sito
          è fatto di file statici, e tutto quello che fai — le prove svolte, i voti, le spunte
          della carriera — resta nella memoria locale del browser, sul tuo dispositivo.
        </p>
        <ul class="lead" style="margin:10px 0 0;padding-left:20px">
          <li>Nessun account, nessuna registrazione, nessuna email chiesta.</li>
          <li>
            <b>Nessun cookie</b> e nessuna statistica di traffico: non c'è niente da accettare
            perché non c'è niente che ti segua.
          </li>
          <li>
            Nessun servizio esterno a cui il browser si colleghi mentre navighi: anche i
            caratteri tipografici sono ospitati qui, non presi da un CDN.
          </li>
          <li>
            L'unico spazio usato è il <code>localStorage</code> del browser, per i tuoi
            progressi. Lo svuoti dalle impostazioni del browser, oppure{' '}
            <a href={hrefFor('carriera')}>azzerando la carriera</a>.
          </li>
        </ul>
        {!storage.persistent && (
          <p class="fn" style="margin-top:12px">
            In questo momento l'archiviazione locale non è disponibile (navigazione privata o
            cookie bloccati): il sito funziona lo stesso, ma i progressi si perdono chiudendo la
            scheda.
          </p>
        )}
      </div>

      <h2 class="sec">Da dove vengono i contenuti</h2>
      <div class="panel narrow">
        <p class="lead">
          Spiegazioni, domande, definizioni ed esercizi sono <b>scritti per questo sito</b>, e i{' '}
          <a href={hrefFor('ref')}>45 schemi</a> disegnati da zero in SVG. Non c'è materiale
          copiato da un libro, da una dispensa o da una prova d'esame: né testo, né immagini, né
          la struttura di un indice altrui.
        </p>
        <p class="lead" style="margin-top:10px">
          Gli schemi rappresentano strutture standard — un multiplexer, una cache a mappatura
          diretta, una pipeline a cinque stadi — che qualunque testo descrive allo stesso modo
          perché sono <b>informazione tecnica</b>, non l'invenzione di qualcuno. Il criterio con
          cui sono stati verificati uno per uno è scritto per esteso in{' '}
          <a href={`${REPO_URL}/blob/main/COMPLIANCE.md`} target="_blank" rel="noopener noreferrer">
            COMPLIANCE.md
          </a>
          .
        </p>
        <p class="lead" style="margin-top:10px">
          I libri consigliati stanno <a href={hrefFor('ref')}>in bibliografia</a> come letture: è
          un elenco di titoli, non un rimando a contenuti riprodotti qui.
        </p>
      </div>

      <h2 class="sec">Se qualcosa non deve stare qui</h2>
      <div class="panel narrow">
        <p class="lead">
          Se possiedi diritti su qualcosa che compare in questo sito e ritieni che non debba
          esserci, scrivilo: <b>viene rimosso senza discutere</b>, e la verifica viene fatta
          dopo, non prima. Lo stesso vale se ti sembra che il sito dica qualcosa di inesatto su
          una persona, un corso o un'istituzione.
        </p>
        <div class="btn-row" style="margin-top:14px">
          <a
            class="btn primary"
            href={`${REPO_URL}/issues/new`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Apri una segnalazione ▶
          </a>
          {hasOwnerContact() && (
            <a class="btn ghost" href={`mailto:${OWNER.email}`}>
              Scrivi in privato
            </a>
          )}
          {hasOwnerContact() && (
            <a class="btn ghost" href={OWNER.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          )}
        </div>
        {hasOwnerContact() && (
          <p class="fn" style="margin-top:12px">
            Responsabile del sito: {OWNER.name} · {OWNER.email}
          </p>
        )}
      </div>

      <h2 class="sec">Hai trovato un errore?</h2>
      <div class="panel narrow">
        <p class="lead">
          Probabile: è materiale di studio scritto da una persona sola, non un libro passato per
          una revisione. Se una risposta è sbagliata, una definizione è imprecisa o uno schema
          non torna, segnalalo — è il modo in cui questo sito migliora.
        </p>
        <div class="btn-row" style="margin-top:14px">
          <a
            class="btn primary"
            href={`${REPO_URL}/issues/new`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Segnala un errore ▶
          </a>
          <a class="btn ghost" href={REPO_URL} target="_blank" rel="noopener noreferrer">
            Il codice sorgente
          </a>
        </div>
        <p class="fn" style="margin-top:12px">
          Il sito è aperto: puoi leggere come è fatto, controllare da dove viene ogni domanda e
          proporre correzioni.
        </p>
      </div>
    </section>
  );
}
