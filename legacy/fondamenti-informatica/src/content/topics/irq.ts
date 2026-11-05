import type { Topic } from '../types';

export const irq: Topic = {
    id: 'irq',
    title: 'Interruzioni, eccezioni & I/O',
    blurb: 'ISR, priorità e annidamento, vettorializzazione, polling vs interrupt, DMA.',
    trapIds: [],
    prereq: ['isa'],
    summary: [
      '<b>Interruzione</b> = evento esterno, asincrono, non legato all\'istruzione in corso. <b>Eccezione</b> = evento generato dall\'istruzione stessa (overflow, istruzione illegale, page fault).',
      'Sequenza: si finisce l\'istruzione corrente → si salvano PC e stato → si mascherano le interruzioni → si salta alla <b>ISR</b> → si ritorna con un\'istruzione dedicata che ripristina tutto.',
      '<b>Priorità</b> e <b>mascheramento</b> decidono chi può interrompere chi: l\'annidamento è ammesso solo verso priorità più alte.',
      'Individuare la sorgente: <b>polling</b> dei registri di stato (tempo proporzionale al numero di dispositivi) o interruzioni <b>vettorizzate</b> (il dispositivo fornisce l\'indirizzo della routine).',
      'La ISR deve salvare e ripristinare i registri che usa: il programma interrotto non deve accorgersi di nulla.',
    ],
    checks: [
      {
        q: 'Qual è la differenza sostanziale fra interruzione ed eccezione?',
        a: 'L\'interruzione è <b>asincrona</b> e viene da fuori: capita fra un\'istruzione e l\'altra, indipendentemente da cosa si stia eseguendo. L\'eccezione è <b>sincrona</b>: la provoca l\'istruzione in corso, e rieseguendo lo stesso programma si ripresenta nello stesso punto.',
      },
      {
        q: 'Perché all\'ingresso della routine di servizio le interruzioni vengono in genere disabilitate?',
        a: 'Per proteggere il salvataggio dello stato: una seconda richiesta di pari priorità, accolta prima che PC e registri siano al sicuro, li sovrascriverebbe e il ritorno non sarebbe più possibile.',
      },
      {
        q: 'Vettorizzate o polling: qual è il vantaggio delle prime?',
        a: 'Il dispositivo fornisce da sé l\'indirizzo della propria routine, quindi il tempo di individuazione è <b>costante</b> e non dipende da quanti dispositivi ci sono. Col polling si interrogano in sequenza e il tempo cresce con il numero.',
      },
    ],
    body: `
    <h4>Da dove si parte</h4>
    <p><b>Cosa serve sapere prima:</b> il ciclo prelievo-decodifica-esecuzione (<a href="#/study/cpu">processore</a>) e le chiamate di procedura con la pila (<a href="#/study/isa">repertorio di istruzioni</a>).</p>
    <p><b>Che problema risolve.</b> Il processore esegue un’istruzione dopo l’altra e non guarda mai fuori. Ma il mondo esterno non aspetta: un tasto viene premuto, un pacchetto arriva, un timer scade. Come fa il processore ad accorgersene senza passare la vita a controllare? La risposta è ribaltare la direzione: non è il processore a chiedere, è il dispositivo a <b>chiamare</b>. Da qui nascono le interruzioni — e con lo stesso meccanismo si gestiscono anche gli errori che un’istruzione può provocare.</p>
    <p><b>Le parole nuove.</b> Una <b>ISR</b> (Interrupt Service Routine) è la procedura che risponde a una richiesta. <b>Mascherare</b> un’interruzione significa dire temporaneamente «non ora». Un <b>vettore</b> di interruzione è l’indirizzo della routine da eseguire, fornito dal dispositivo stesso. <b>Asincrono</b> vuol dire «non legato all’istruzione in corso», <b>sincrono</b> il contrario. Il <b>contesto</b> è l’insieme di PC, stato e registri che permette di riprendere il programma interrotto come se nulla fosse.</p>
    <h4>Interruzioni</h4>
    <p>Segnali <b>hardware asincroni</b> che viaggiano sulle <b>linee di controllo</b> del bus, generati da dispositivi esterni. Sono asincroni nel senso che arrivano in un istante scorrelato dal programma in esecuzione.</p>

    <h4>Che cosa succede, nell'ordine</h4>
    <ol>
      <li>Il dispositivo alza la linea di richiesta.</li>
      <li>Il processore termina l'istruzione <b>in corso</b> — non la interrompe a metà.</li>
      <li>Salva lo <b>stato</b>: PC e registro di stato, più i registri che la routine userà.</li>
      <li>Disabilita (o abbassa) le interruzioni allo stesso livello, per non essere interrotto subito.</li>
      <li>Carica nel PC l'indirizzo della <b>ISR</b> (Interrupt Service Routine) ed esegue.</li>
      <li>Invia il riscontro al dispositivo, ripristina lo stato e riprende dall'istruzione successiva.</li>
    </ol>

    <h4>Priorità e annidamento</h4>
    <p>Con più dispositivi serve un ordine. A ogni sorgente si assegna un <b>livello di priorità</b>: una richiesta più urgente può interrompere una ISR in corso (<b>annidamento</b>), una meno urgente aspetta. Il processore mantiene un livello corrente e accetta solo le richieste superiori. Le interruzioni possono anche essere <b>mascherate</b> singolarmente.</p>

    <h4>Come si individua chi ha chiamato</h4>
    <ul>
      <li><b>Polling</b>: il processore interroga i dispositivi in sequenza finché trova quello che ha alzato la richiesta. Semplice, ma il tempo cresce con il numero di dispositivi.</li>
      <li><b>Vettorializzazione</b>: il dispositivo mette sul bus un identificatore, con cui il processore indicizza una <b>tabella dei vettori</b> e salta direttamente alla ISR giusta. Più veloce e indipendente dal numero di dispositivi.</li>
    </ul>

    <h4>Eccezioni</h4>
    <p>Eventi <b>sincroni</b>, generati dal processore durante l'esecuzione: divisione per zero, overflow, codice operativo illegale, violazione di protezione, chiamate di sistema. Sincroni perché riproducibili — rieseguendo lo stesso programma sugli stessi dati si ripresentano nello stesso punto.</p>
    <p>Un'eccezione è sollevata, per esempio, se un processo tenta di accedere alla memoria di altri utenti, di modificare la modalità del sistema o la priorità di altri processi.</p>

    <h4>Interruzioni vs eccezioni, in breve</h4>
    <pre>                interruzione        eccezione
origine         dispositivo esterno processore
sincronia       asincrona           sincrona
riproducibile   no                  sì
tipico uso      I/O, timer          errori, system call</pre>

    <h4>Il debugger</h4>
    <ul>
      <li><b>Trace mode</b>: un'eccezione dopo <b>ogni</b> istruzione → esecuzione passo-passo, si ispeziona lo stato a ogni passo.</li>
      <li><b>Breakpoint</b>: l'eccezione scatta solo in punti scelti → il programma corre a piena velocità fino al successivo.</li>
    </ul>

    <h4>I/O programmato e DMA</h4>
    <p>Nell'I/O <b>programmato</b> il processore trasferisce ogni parola personalmente: semplice ma spreca tempo di CPU. Con il <b>DMA</b> (Direct Memory Access) un controllore dedicato sposta interi blocchi fra periferica e memoria <b>senza</b> il processore, che riceve una sola interruzione a trasferimento concluso. È il meccanismo con cui si legge da disco senza paralizzare la macchina.</p>

    <h4>Bus e buffer</h4>
    <p>Un bus trasporta <b>dati, indirizzi e segnali di controllo</b>. Quando due dispositivi lavorano a velocità diverse si interpone un <b>buffer</b>, che compensa lo scarto accumulando i dati. La trasmissione può essere <b>parallela</b> (più bit insieme, corta distanza) o <b>seriale</b> (un bit per volta, come USB: meno fili, meno interferenze, distanze maggiori).</p>
    <p>Le interruzioni sono essenziali nei sistemi <b>real-time</b>, dove un evento deve essere servito entro un tempo massimo, e nei sistemi <b>multitasking</b>, dove il timer che scandisce i cambi di contesto è esso stesso una sorgente di interruzione.</p>
    <h4>Esempio svolto</h4>
    <p><b>Due dispositivi chiamano, con priorità diverse.</b> Il programma principale è in esecuzione; il disco (priorità 2) chiede attenzione, e mentre la sua routine è in corso arriva il timer (priorità 5, più alta):</p>
    <pre>t₀  programma principale in esecuzione
t₁  richiesta disco (p2)   → finisce l'istruzione in corso,
                             salva PC e stato, maschera ≤ 2, salta a ISR_disco
t₂  ISR_disco in esecuzione
t₃  richiesta timer (p5)   → 5 &gt; 2, quindi è accolta:
                             salva PC e stato dell'ISR_disco, salta a ISR_timer
t₄  ISR_timer finisce      → ripristina e torna dentro ISR_disco
t₅  ISR_disco finisce      → ripristina e torna al programma principale</pre>
    <p>Due punti da notare. L'interruzione è servita <b>fra</b> due istruzioni, mai a metà: il processore completa quella in corso. E l'annidamento è ammesso solo verso l'alto: se al tempo t₃ avesse chiamato un altro dispositivo di priorità 2, sarebbe rimasto in attesa perché la maschera lo esclude.</p>

    <h4>Errori tipici</h4>
    <ul>
      <li>Dire che l'interruzione «blocca l'istruzione a metà»: viene servita al confine fra due istruzioni, ed è ciò che rende possibile riprendere esattamente da dove si era.</li>
      <li>Dimenticare che l'ISR deve <b>salvare i registri che usa</b>: il programma interrotto non deve accorgersi di nulla.</li>
      <li>Confondere la priorità con l'ordine di arrivo: chi ha priorità maggiore passa avanti anche se ha chiesto dopo.</li>
    </ul>`,
    exercises: [
      {
        id: 'ex-irq-1',
        level: 'base',
        q: 'All’ingresso di una routine di servizio, che cosa va salvato e <b>chi</b> lo salva: l’hardware o il programmatore?',
        hint: 'Alcune cose devono essere già al sicuro prima che parta la prima istruzione della routine; altre dipendono da quali registri la routine userà, e quello l’hardware non può saperlo.',
        solution: `<pre>SALVA L'HARDWARE, automaticamente:
  · il PC (l'indirizzo di ritorno)
  · il registro di stato (i flag e il livello di priorità)

SALVA LA ROUTINE, con istruzioni esplicite:
  · tutti i registri generali che intende usare
  · e li ripristina prima dell'istruzione di ritorno</pre><p>La divisione è obbligata: PC e stato vanno protetti <b>prima</b> che qualunque istruzione della routine possa alterarli, quindi ci pensa l’hardware. Quali registri generali servano dipende invece dal codice della routine, e solo chi lo scrive lo sa.</p><p>La regola che ne consegue: il programma interrotto <b>non deve accorgersi di nulla</b>. Se una routine dimentica di ripristinare un registro, il programma principale riprende con un valore alterato — e il difetto è quasi impossibile da riprodurre, perché dipende dall’istante in cui è arrivata l’interruzione.</p>`,
      },
      {
        id: 'ex-irq-2',
        level: 'base',
        q: 'Classifica ciascun evento come <b>interruzione</b> o <b>eccezione</b>: tasto premuto · divisione per zero · pacchetto di rete arrivato · istruzione non riconosciuta · timer scaduto · accesso a una pagina non presente · overflow aritmetico · disco pronto.',
        hint: 'La domanda decisiva è: l’evento è provocato dall’istruzione che si sta eseguendo, oppure sarebbe accaduto comunque?',
        solution: `<pre>INTERRUZIONI (esterne, asincrone)     ECCEZIONI (interne, sincrone)
  · tasto premuto                       · divisione per zero
  · pacchetto di rete arrivato          · istruzione non riconosciuta
  · timer scaduto                       · pagina non presente (page fault)
  · disco pronto                        · overflow aritmetico</pre><p>Il criterio: le interruzioni della colonna di sinistra sarebbero arrivate lo stesso qualunque istruzione fosse in corso, e capitano <b>fra</b> due istruzioni. Le eccezioni di destra le provoca l’istruzione stessa, e rieseguendo lo stesso programma con gli stessi dati si ripresentano <b>nello stesso punto</b>.</p><p>Il page fault è il caso interessante: sembra un evento «di sistema», ma è un’eccezione a tutti gli effetti — è l’accesso in memoria appena tentato a provocarlo, e dopo che il sistema operativo ha caricato la pagina l’istruzione viene <b>rieseguita</b>.</p>`,
      },
      {
        id: 'ex-irq-3',
        level: 'esame',
        q: 'Il programma principale è in esecuzione. Arriva una richiesta dal disco (priorità 2); mentre la sua routine è in corso arrivano, nell’ordine, il timer (priorità 5) e la stampante (priorità 1). Scrivi l’ordine in cui vengono servite e disegna l’annidamento.',
        hint: 'Una richiesta interrompe la routine in corso solo se ha priorità <b>maggiore</b>. Le altre restano in attesa, non vengono perse.',
        solution: `<pre>t₀  programma principale
t₁  disco (p2)      → accolta: maschera portata a 2
t₂    ISR disco
t₃    timer (p5)    → 5 &gt; 2, accolta: interrompe l'ISR disco
t₄      ISR timer
t₅      stampante (p1) → 1 &lt; 5, NON accolta: resta in attesa
t₆      ISR timer finisce → si torna dentro ISR disco
t₇    ISR disco finisce → maschera torna a 0, e ora la
                          stampante può essere servita
t₈  ISR stampante
t₉  programma principale</pre><p>Ordine di servizio: <b>disco → timer → (ripresa disco) → stampante → programma</b>.</p><p>Due punti che l’esame verifica: la richiesta della stampante <b>non si perde</b>, resta pendente finché la maschera scende sotto la sua priorità; e l’annidamento è ammesso solo verso l’alto, altrimenti una catena di richieste di pari livello riempirebbe la pila senza fine.</p>`,
      },
      {
        id: 'ex-irq-4',
        level: 'esame',
        q: 'Un sistema ha 20 dispositivi. Con il <b>polling</b> ogni interrogazione costa 2 μs; con le interruzioni <b>vettorizzate</b> l’individuazione costa 0,5 μs indipendentemente dal numero. Calcola il tempo di individuazione medio e nel caso peggiore, e commenta.',
        hint: 'Col polling si interrogano i dispositivi in sequenza finché non si trova quello che ha chiamato: la posizione nella lista determina il costo.',
        solution: `<pre>POLLING
  caso migliore  (1º della lista):  1 × 2 μs =  2 μs
  caso medio     (10,5º):        10,5 × 2 μs = 21 μs
  caso peggiore  (20º):            20 × 2 μs = 40 μs

VETTORIZZATE
  sempre:                                     0,5 μs</pre><p>Con le vettorizzate il costo è <b>costante</b> perché è il dispositivo a fornire l’indirizzo della propria routine: non c’è nessuna ricerca da fare. Col polling il costo cresce linearmente con il numero di dispositivi, e nel caso peggiore qui è ottanta volte tanto.</p><p>Il polling conserva però un vantaggio: l’ordine di interrogazione <b>è</b> una priorità, decisa dal software e modificabile senza toccare l’hardware. Nei sistemi con pochi dispositivi resta una scelta legittima proprio per la sua semplicità.</p>`,
      },
      {
        id: 'ex-irq-5',
        level: 'esame',
        q: 'Clock a 500 MHz. L’istruzione più lunga dura 12 cicli, il salvataggio automatico dello stato 8 cicli, il corpo della routine 40 cicli, il ripristino 8 cicli. Qual è la <b>latenza massima</b> fra la richiesta e l’inizio effettivo del servizio? E il tempo totale di gestione?',
        hint: 'La latenza è l’attesa <b>prima</b> di iniziare a servire: nel caso peggiore la richiesta arriva subito dopo l’inizio dell’istruzione più lunga.',
        solution: `<pre>periodo di clock = 1 / 500 MHz = 2 ns

LATENZA MASSIMA = fine istruzione in corso + salvataggio
                = (12 + 8) cicli × 2 ns = <b>40 ns</b>

TEMPO TOTALE    = 12 + 8 + 40 + 8 = 68 cicli × 2 ns = <b>136 ns</b></pre><p>Perché la latenza conta: in un sistema di controllo in tempo reale è il ritardo massimo con cui si può reagire a un evento fisico, e va confrontato con la scadenza imposta dal processo controllato.</p><p>Come si riduce: accorciando l’istruzione più lunga (i RISC nascono anche per questo, con istruzioni di durata uniforme), oppure rendendo <b>interrompibili</b> le istruzioni lunghe — cosa che complica il ripristino, perché bisogna poter riprendere l’istruzione a metà.</p>`,
      },
    ],
  };
