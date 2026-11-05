import type { JSX } from 'preact';
import { topics } from '~/content';
import { hrefFor } from '~/lib/router';
import { computeStats, useProgress } from '~/store/progress';
import { storage } from '~/store/storage';
import { DatapathHero } from '~/ui/components/DatapathHero';
import { Preparation } from '~/ui/components/Preparation';
import { TopicCard } from './Study';

/**
 * I dodici quesiti della prova reale, nell'ordine in cui escono.
 *
 * Stavano in un paragrafo con dodici grassetti dentro: l'informazione c'era ma
 * andava letta tutta per contare. Qui si conta con l'occhio.
 */
const EXAM_BREAKDOWN = [
  { count: 4, label: 'crocette' },
  { count: 2, label: 'schemi da completare' },
  { count: 2, label: 'tabella di verità → espressione' },
  { count: 1, label: 'sintesi di rete con Karnaugh' },
  { count: 2, label: 'domande aperte' },
  { count: 1, label: 'programma assembly' },
] as const;

/**
 * Riquadro di statistica. Con `href` diventa un collegamento vero: il
 * contatore dei moduli studiati porta alla carriera, che prima era un bottone
 * spaiato su una riga tutta sua.
 */
function Stat({
  value,
  unit,
  label,
  href,
}: {
  value: string;
  unit?: string;
  label: string;
  href?: string;
}): JSX.Element {
  const inner = (
    <>
      <div class={`n${value === '—' ? ' empty' : ''}`}>
        {value}
        {unit && <span class="u">{unit}</span>}
      </div>
      <div class="l">{label}</div>
    </>
  );

  return href ? (
    <a class="stat link" href={href}>
      {inner}
    </a>
  ) : (
    <div class="stat">{inner}</div>
  );
}

export function Dashboard(): JSX.Element {
  const progress = useProgress();
  const stats = computeStats(progress);

  return (
    <section class="view">
      <div class="hero">
        <DatapathHero />
        <div class="hero-grid">
          <div class="hero-body">
            <span class="chip">
              <span class="dot" aria-hidden="true" />
              architettura degli elaboratori · prova da 1 ora
            </span>
            <h1 class="h" style="margin-top:14px">
              Allena l'esame,
              <br />
              non solo la teoria.
            </h1>
            <p class="lead">
              Genera una prova di autovalutazione — 12 quesiti, punteggio su 30 — con
              complemento a 2, sintesi di reti combinatorie con Karnaugh, schemi da completare e
              assembly. Ogni quesito rimanda al modulo che spiega l'argomento, così da uno
              sbaglio si arriva alla teoria invece che a un punto in meno.
            </p>
            <div class="btn-row">
              <a class="btn primary" href={hrefFor('exam', 'full')}>
                ▶ Genera esame completo
              </a>
              <a class="btn ghost" href={hrefFor('study')}>
                Apri i moduli di studio
              </a>
            </div>
          </div>

          <aside class="hero-card">
            <p class="hero-card-t">Com'è fatta la prova</p>
            <ul class="qbreak">
              {EXAM_BREAKDOWN.map((row) => (
                <li key={row.label}>
                  <span class="qb-n">{row.count}</span>
                  <span>{row.label}</span>
                </li>
              ))}
            </ul>
            <p class="qb-foot">
              <b>12</b> quesiti · <b>1</b> ora · sufficienza a <b>18/30</b>
              {/* Il chiarimento sta addosso al numero, non tre schermate più in
                  basso: è la parte che si legge come se fosse ufficiale. */}
              <span class="qb-warn">struttura scelta da questo sito, non di un corso reale</span>
            </p>
          </aside>
        </div>
      </div>

      <Preparation />

      <div class="stats">
        <Stat value={String(stats.examsTaken)} label="Esami svolti" />
        <Stat
          value={stats.best === null ? '—' : String(stats.best)}
          unit={stats.best === null ? undefined : '/30'}
          label="Miglior voto"
        />
        <Stat
          value={stats.average === null ? '—' : String(stats.average)}
          unit={stats.average === null ? undefined : '/30'}
          label="Media"
        />
        <Stat
          value={String(stats.studiedCount)}
          unit={`/${topics.length}`}
          label="Moduli studiati ▸"
          href={hrefFor('carriera')}
        />
      </div>

      {!storage.persistent && (
        <div class="disclaim">
          ⚠︎ Lo spazio di archiviazione del browser non è disponibile (navigazione privata o
          cookie bloccati): l'app funziona, ma statistiche e progressi non sopravvivono alla
          chiusura della scheda.
        </div>
      )}

      <h2 class="sec">Perché la prova è fatta così</h2>
      <div class="panel narrow">
        <p class="lead">
          <b>Questa struttura è una scelta di questo sito</b>, non il formato dell'esame di
          qualcuno. Dodici quesiti in un'ora perché è la densità a cui si smette di rispondere
          con calma e si comincia a decidere in fretta — che è la differenza vera fra sapere una
          cosa e saperla usare. Punteggio su 30 perché è la scala con cui sei abituato a
          misurarti, e <b>2,5 punti</b> a quesito perché trenta diviso dodici fa quello.
        </p>
        <p class="lead" style="margin-top:10px">
          Se ti stai preparando a un esame vero, <b>il tuo corso vince su questa pagina</b>:
          numero di quesiti, durata, punteggi e argomenti li stabilisce lui, e li trovi sulle sue
          pagine ufficiali. Qui alleni il procedimento — convertire, minimizzare, tradurre un
          indirizzo, leggere un listato — che è la parte che non cambia da un corso all'altro.
        </p>
        <p class="lead" style="margin-top:10px">
          Il mix cambia a ogni generazione, quindi due prove di fila non si somigliano: non si
          impara a memoria l'ordine dei quesiti. Gli <a href={hrefFor('ref')}>schemi</a> sono la
          parte che si prepara disegnando invece che rileggendo, e si possono{' '}
          <a href={hrefFor('train')}>completare a vuoto</a> quante volte serve.
        </p>
      </div>

      <h2 class="sec">Riprendi da dove eri</h2>
      <div class="cards">
        {topics.slice(0, 4).map((topic, index) => (
          <TopicCard key={topic.id} topic={topic} index={index} />
        ))}
      </div>

      <div class="disclaim">
        ⚠︎ <b>Strumento di studio indipendente</b>, scritto da uno studente:{' '}
        <b>non è il sito di nessun corso e di nessuna università</b>, nessuno l'ha rivisto o
        approvato. Programma, regole della prova, punteggi e date valgono solo quelli del{' '}
        <b>tuo</b> corso: verificali sulle sue pagine ufficiali, e in caso di differenza ha
        ragione lui.
        <br />
        Domande, spiegazioni ed esercizi sono <b>scritti qui</b> e gli schemi disegnati da zero:
        non riproducono prove d'esame reali né il materiale di nessun testo. Essendo scritti da
        una persona sola, possono contenere errori:{' '}
        <a href={hrefFor('note')}>segnalali</a> e vengono corretti.
        <br />
        Nessun account e nessun server: quello che fai resta nel tuo browser e non viene inviato
        a nessuno.
      </div>
    </section>
  );
}
