import type { JSX } from 'preact';
import { useEffect } from 'preact/hooks';
import { topicById } from '~/content';
import { hrefFor, NAV_VIEWS, useRoute, VIEWS, type Route, type ViewId } from '~/lib/router';
import { t } from '~/lib/i18n';
import { SITE_TITLE } from '~/lib/site';
import { Dashboard } from '~/ui/views/Dashboard';
import { Study } from '~/ui/views/Study';
import { Simulator } from '~/ui/views/Simulator';
import { Definitions } from '~/ui/views/Definitions';
import { Training } from '~/ui/views/Training';
import { References } from '~/ui/views/References';
import { Career } from '~/ui/views/Career';
import { Notes } from '~/ui/views/Notes';
import { NotFound } from '~/ui/views/NotFound';

const TAB_LABELS: Record<ViewId, string> = {
  dash: 'Dashboard',
  study: 'Studia',
  def: 'Definizioni',
  exam: 'Simulatore',
  train: 'Allenamento',
  ref: 'Schemi',
  carriera: 'Carriera',
  note: 'Note & privacy',
};

/** Descrizione per vista: è quella che finisce nell'anteprima di un link. */
const VIEW_DESCRIPTIONS: Record<ViewId, string> = {
  dash: 'Palestra di Architettura degli Elaboratori: diciassette moduli di teoria, ottantacinque esercizi svolti e un generatore di prove di autovalutazione che si correggono da sole.',
  study:
    'Diciassette moduli in ordine di studio, pensati per partire da zero: rampa d’ingresso, teoria distesa, esempio svolto, autoverifica e cinque esercizi con svolgimento.',
  def: 'I termini da saper enunciare, una frase ciascuno, con filtro per testo e per argomento.',
  exam: 'Genera una prova di autovalutazione: numeri, tabelle di verità, schemi e assembly cambiano a ogni generazione, e la correzione è automatica dove può esserlo.',
  train:
    'Quattro palestre che fanno fare il procedimento e correggono ogni passaggio: binario a mano, schemi da completare, verità e Karnaugh, assembly a mente.',
  ref: 'Quarantacinque schemi di architettura disegnati per questo sito, raggruppati per area del programma: si guardano per capire come sono collegate le parti, o si completano come esercizio.',
  carriera:
    'A che punto sei sul programma: una spunta per modulo, che metti tu quando lo hai capito davvero.',
  note: 'Che cos’è questo sito e che cosa non è, che cosa salva nel browser (niente cookie, niente tracciamento, nessun server) e a chi appartengono i contenuti.',
};

/**
 * Titolo e descrizione del documento, per vista.
 *
 * Il sito è una pagina sola: senza questo, ventiquattro schermate diverse
 * finiscono nella cronologia e nei preferiti con la stessa identica etichetta,
 * e chi tiene tre moduli aperti in tre schede non distingue quale sia quale.
 */
function useHead(route: Route): void {
  useEffect(() => {
    const topic =
      route.view === 'study' && route.param ? topicById(route.param) : undefined;
    const missingTopic = route.view === 'study' && route.param !== null && !topic;

    const name = !route.known || missingTopic ? 'Pagina non trovata' : (topic?.title ?? null);
    document.title =
      name === null && route.view === 'dash'
        ? SITE_TITLE
        : `${name ?? TAB_LABELS[route.view]} · ${SITE_TITLE}`;

    const description =
      !route.known || missingTopic
        ? "L'indirizzo non corrisponde a nessuna pagina del sito."
        : topic
          ? topic.blurb
          : VIEW_DESCRIPTIONS[route.view];
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [route.view, route.param, route.known]);
}

/** `active` è `null` sul 404: lì nessuna sezione è quella in cui ti trovi. */
function Header({ active }: { active: ViewId | null }): JSX.Element {
  return (
    <header class="top">
      <div class="top-inner">
        <div class="brand">
          <span class="glyph" aria-hidden="true">
            AE
          </span>
          <span class="brand-name">
            Architettura degli Elaboratori
            <small>teoria, esercizi svolti e prove</small>
          </span>
        </div>
        <nav class="tabs" aria-label={t('Sezioni del sito')}>
          {NAV_VIEWS.map((view) => (
            <a
              key={view}
              class={`tab${view === active ? ' active' : ''}`}
              href={hrefFor(view)}
              aria-current={view === active ? 'page' : undefined}
            >
              {TAB_LABELS[view]}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

/**
 * Chiusura del sito. Porta la mappa completa perché ogni vista è lunga: da
 * fondo modulo si riparte da qui invece di risalire fino alla barra in cima.
 */
function Footer(): JSX.Element {
  return (
    <footer class="site-footer">
      <div class="foot-inner">
        {/*
          La riserva sta qui e non solo in home: al Simulatore ci si arriva
          per collegamento diretto, e chi entra da lì non vedrebbe mai
          scritto che le domande non sono prove vere.
        */}
        <p class="foot-note" style="margin:0">
          AE·FIN — palestra di architettura degli elaboratori · strumento{' '}
          <b>indipendente</b> scritto da uno studente, non è il sito di nessun corso · le domande
          sono scritte qui, non sono prove d'esame reali · nessun dato esce dal tuo browser
        </p>
        <nav class="foot-nav" aria-label={t('Mappa del sito')}>
          {VIEWS.map((view) => (
            <a key={view} href={hrefFor(view)}>
              {TAB_LABELS[view]}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export function App(): JSX.Element {
  const route = useRoute();
  useHead(route);

  // Un modulo che non esiste è un 404 quanto una rotta che non esiste: prima
  // ricadeva sull'elenco dei moduli senza dire niente.
  const missingTopic =
    route.view === 'study' && route.param !== null && !topicById(route.param);

  return (
    <>
      {/* Il router vive nell'hash: un `href="#contenuto"` cambierebbe rotta
          invece di saltare, quindi il salto lo facciamo a mano. */}
      <a
        class="skip"
        href="#contenuto"
        onClick={(event) => {
          event.preventDefault();
          const target = document.getElementById('contenuto');
          target?.focus({ preventScroll: true });
          target?.scrollIntoView({ block: 'start' });
        }}
      >
        Salta al contenuto
      </a>
      <Header active={route.known && !missingTopic ? route.view : null} />
      <main class="shell-main" id="contenuto" tabIndex={-1}>
        {!route.known ? (
          <NotFound />
        ) : missingTopic ? (
          <NotFound what={route.param ?? undefined} />
        ) : (
          <>
            {route.view === 'dash' && <Dashboard />}
            {route.view === 'study' && <Study topicId={route.param} />}
            {route.view === 'exam' && <Simulator mode={route.param} />}
            {route.view === 'def' && <Definitions />}
            {route.view === 'train' && <Training focus={route.param} />}
            {route.view === 'ref' && <References />}
            {route.view === 'carriera' && <Career />}
            {route.view === 'note' && <Notes />}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
