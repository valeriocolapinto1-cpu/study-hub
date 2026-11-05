import type { Topic } from '../types';

export const sw: Topic = {
  id: 'sw',
  title: 'Dal sorgente all’esecuzione',
  blurb: 'Assemblatore, collegatore, caricatore e il ruolo del sistema operativo.',
  trapIds: ['trap-simboli'],
  prereq: ['isa'],
  summary: [
    'Quattro passaggi, sempre gli stessi: <b>compilazione → assemblaggio → collegamento → caricamento</b>. Ognuno produce un file e ne consuma un altro.',
    'L’<b>assemblatore</b> traduce mnemonici in codici operativi e risolve le etichette. Serve <b>due passate</b> perché un salto in avanti cita un’etichetta non ancora incontrata.',
    'Le <b>direttive</b> (<code>ORIGIN</code>, <code>DATAWORD</code>, <code>RESERVE</code>, <code>EQU</code>, <code>END</code>) non producono istruzioni: dicono all’assemblatore dove mettere le cose.',
    'Il <b>collegatore</b> unisce i moduli e le librerie, risolvendo i riferimenti esterni; il <b>caricatore</b> porta il programma in memoria e ne sistema gli indirizzi.',
    'Il <b>sistema operativo</b> non esegue il programma: gli dà memoria, tempo di processore e accesso ai dispositivi, e interviene su chiamata di sistema, interruzione o eccezione.',
  ],
  body: `
    <h4>Da dove si parte</h4>
    <p><b>Cosa serve sapere prima:</b> che cos’è un’istruzione assembly e come si usano le etichette per i salti, dal modulo sul <a href="#/study/isa">repertorio di istruzioni</a>.</p>
    <p><b>Che problema risolve.</b> Il processore esegue numeri binari, non parole. Fra il testo che scrivi e i bit che il processore preleva dalla memoria c’è una catena di programmi che traducono, mettono insieme e caricano — e ognuno di loro risolve un problema preciso. Sapere <b>chi fa che cosa</b> serve a capire i messaggi d’errore, a sapere perché un programma non parte, e a rispondere alla domanda d’esame «descrivi il percorso dal sorgente all’esecuzione».</p>
    <p><b>Le parole nuove.</b> Un <b>modulo oggetto</b> è il risultato della traduzione di un singolo file: codice macchina con dei buchi al posto dei nomi che non conosce. Un <b>riferimento esterno</b> è uno di quei buchi. La <b>rilocazione</b> è la correzione degli indirizzi quando il programma viene messo in memoria in un posto diverso da quello previsto. La <b>modalità supervisore</b> è lo stato privilegiato del processore in cui gira il sistema operativo, e in cui sono permesse istruzioni vietate ai programmi normali.</p>
    <h4>La catena, in ordine</h4>
    <p>Fra quello che scrivi e quello che il processore esegue ci sono quattro traduzioni. Il <b>compilatore</b> porta un linguaggio ad alto livello in assembly; l'<b>assemblatore</b> porta l'assembly in codice oggetto; il <b>collegatore</b> (linker) mette insieme più moduli oggetto e le librerie; il <b>caricatore</b> (loader) copia il risultato in memoria e lo avvia. Ogni passo ha un input e un output ben definiti, e all'esame conviene saperli nominare nell'ordine giusto.</p>
    <p>Un'alternativa è l'<b>interprete</b>, che non produce un eseguibile ma esegue il sorgente istruzione per istruzione: più lento, ma indipendente dalla macchina e comodo per il debug. Compilare significa spendere tempo una volta sola; interpretare significa spenderlo a ogni esecuzione.</p>

    <h4>L’assemblatore e il problema delle etichette</h4>
    <p>L'assemblatore fa due cose: sostituisce ogni mnemonico con il suo <b>codice operativo</b> e sostituisce ogni <b>etichetta</b> con un indirizzo. La seconda è meno banale della prima, perché un salto in avanti nomina un'etichetta che l'assemblatore non ha ancora visto.</p>
    <p>Per questo si lavora in <b>due passate</b>. Nella prima si scorre il sorgente tenendo un contatore di posizione e si costruisce la <b>tabella dei simboli</b>: per ogni etichetta, l'indirizzo a cui corrisponde. Nella seconda si genera il codice, e a quel punto ogni etichetta ha già il suo valore. Un'etichetta usata ma mai definita è l'errore classico: «simbolo non definito».</p>

    <h4>Le direttive</h4>
    <p>Non tutte le righe di un sorgente assembly diventano istruzioni. Le <b>direttive</b> parlano all'assemblatore, non al processore:</p>
    <ul>
      <li><code>ORIGIN 1000</code> — le righe seguenti vanno collocate a partire dall'indirizzo 1000.</li>
      <li><code>DATAWORD 42</code> — riserva una parola e la inizializza a 42.</li>
      <li><code>RESERVE 100</code> — riserva 100 byte senza inizializzarli.</li>
      <li><code>N EQU 32</code> — dà un nome a una costante; non occupa memoria.</li>
      <li><code>END INIZIO</code> — fine del sorgente e punto di partenza dell'esecuzione.</li>
    </ul>
    <p>Domanda ricorrente: «<code>DATAWORD</code> genera un'istruzione?» No. Genera <b>un dato</b> in memoria. È la differenza fra ciò che il processore esegue e ciò che legge.</p>

    <h4>Collegamento: perché serve</h4>
    <p>Un programma reale è fatto di più file, e usa funzioni che stanno altrove. Ogni modulo viene assemblato per conto suo, quindi al suo interno restano dei buchi: i <b>riferimenti esterni</b>, cioè i nomi che quel modulo usa ma non definisce. Il collegatore mette in fila i moduli, calcola la posizione definitiva di ciascuno e <b>riempie i buchi</b> con gli indirizzi giusti (rilocazione).</p>
    <p>Il collegamento può essere <b>statico</b> — la libreria finisce dentro l'eseguibile, che diventa grande ma autosufficiente — o <b>dinamico</b>, con la libreria caricata a runtime e condivisa fra i processi: eseguibili più piccoli, aggiornabili senza ricompilare, ma dipendenti dalla presenza della libreria giusta.</p>

    <h4>Caricamento e rilocazione</h4>
    <p>Il caricatore copia l'eseguibile in memoria, prepara la pila e salta al punto d'ingresso. Se il programma non finisce all'indirizzo per cui era stato pensato, gli indirizzi assoluti al suo interno vanno corretti: è la <b>rilocazione</b>. Con la memoria virtuale il problema quasi sparisce, perché ogni processo vede sempre lo stesso spazio di indirizzi virtuali indipendentemente da dove sta davvero in memoria fisica.</p>

    <h4>Che cosa fa il sistema operativo</h4>
    <p>Il sistema operativo non «esegue» il programma: è un programma anche lui, e mentre il tuo gira lui è fermo. Interviene in tre casi soltanto — <b>chiamata di sistema</b> (il programma chiede un servizio), <b>interruzione</b> (un dispositivo chiama), <b>eccezione</b> (l'istruzione in corso fallisce) — ed è per questo che il capitolo sulle interruzioni e quello sul software si tengono insieme.</p>
    <p>I suoi compiti sono quattro: assegnare la <b>memoria</b>, ripartire il <b>tempo di processore</b> fra i processi, mediare l'accesso ai <b>dispositivi</b>, e proteggere i processi l'uno dall'altro. La protezione poggia sull'hardware: la <b>modalità supervisore</b> permette istruzioni che in modalità utente sono vietate, e il passaggio avviene solo attraverso i punti di ingresso controllati appena elencati.</p>

    <h4>Come esce all’esame</h4>
    <p>Tipicamente come domanda aperta («descrivi il percorso dal sorgente all'esecuzione») o come crocetta sul compito di uno dei quattro strumenti. Le risposte che valgono pieno nominano <b>tabella dei simboli</b>, <b>due passate</b>, <b>riferimenti esterni</b> e <b>rilocazione</b>: sono le quattro parole che dimostrano di aver capito il meccanismo e non solo l'elenco.</p>
    <h4>Esempio svolto</h4>
    <p><b>Che cosa contiene la tabella dei simboli dopo la prima passata?</b> Sorgente, con parole da 4 byte:</p>
    <pre>          ORIGIN 100
INIZIO:   Move   R1, #0        ; indirizzo 100
          Move   R2, N         ; indirizzo 104
CICLO:    Add    R1, R1, #1    ; indirizzo 108
          Sub    R2, R2, #1    ; indirizzo 112
          Branch&gt;0 CICLO       ; indirizzo 116  ← salto ALL'INDIETRO
          Branch  FINE         ; indirizzo 120  ← salto IN AVANTI
N:        DATAWORD 10          ; indirizzo 124
FINE:     ...                  ; indirizzo 128</pre>
    <p>Alla fine della prima passata:</p>
    <pre>INIZIO → 100     CICLO → 108     N → 124     FINE → 128</pre>
    <p>Nella riga a 116 l'etichetta <code>CICLO</code> era già nota, ma in quella a 120 <code>FINE</code> no: alla prima passata l'assemblatore non poteva ancora tradurla. Con la tabella completa, la seconda passata genera il codice senza incertezze. Nota anche che <code>N: DATAWORD 10</code> occupa memoria come tutto il resto, ma è un <b>dato</b>: se l'esecuzione ci finisse sopra, il processore proverebbe a interpretarlo come istruzione.</p>

    <h4>Errori tipici</h4>
    <ul>
      <li>Pensare che <code>DATAWORD</code> o <code>RESERVE</code> generino istruzioni: producono dati, e nel conteggio degli indirizzi occupano spazio come tutto il resto.</li>
      <li>Scambiare i ruoli: il <b>collegatore</b> risolve i riferimenti fra moduli, il <b>caricatore</b> mette in memoria e avvia.</li>
      <li>Dire che il sistema operativo «controlla ogni istruzione»: la CPU è una sola, e mentre gira il programma utente il SO è fermo.</li>
    </ul>`,
  checks: [
    {
      q: 'Perché l’assemblatore ha bisogno di due passate?',
      a: 'Perché un salto in avanti nomina un’etichetta che, al momento in cui la si incontra, non ha ancora un indirizzo. La <b>prima passata</b> percorre il sorgente solo per costruire la tabella dei simboli; la <b>seconda</b> genera il codice, quando ogni etichetta è già risolta.',
    },
    {
      q: 'Che differenza c’è fra il lavoro del collegatore e quello del caricatore?',
      a: 'Il <b>collegatore</b> unisce più moduli oggetto e le librerie risolvendo i riferimenti esterni: produce un eseguibile. Il <b>caricatore</b> prende quell’eseguibile, lo mette in memoria, sistema gli indirizzi se serve e lo avvia.',
    },
    {
      q: 'Il sistema operativo è in esecuzione mentre gira il tuo programma?',
      a: 'No: è un programma anche lui e la CPU è una sola. Riprende il controllo solo in tre casi — <b>chiamata di sistema</b>, <b>interruzione</b>, <b>eccezione</b> — e in ognuno il passaggio avviene attraverso un punto d’ingresso controllato, con cambio in modalità supervisore.',
    },
  ],
  exercises: [
    {
      id: 'ex-sw-1',
      level: 'base',
      q: 'Dato questo sorgente, elenca gli indirizzi assegnati a ogni riga e scrivi la <b>tabella dei simboli</b>. Le parole sono a 32 bit e la memoria è indirizzata al byte.',
      hint: 'Tieni un contatore di posizione che parte dal valore di ORIGIN e cresce di 4 a ogni istruzione. Le etichette non occupano spazio: nominano l’indirizzo della riga su cui stanno.',
      solution: `<pre>          ORIGIN 200
PARTE:    Move  R1, #0        ; 200
          Move  R2, CONT      ; 204
GIRO:     Add   R1, R1, R2    ; 208
          Sub   R2, R2, #1    ; 212
          Branch&gt;0 GIRO       ; 216
          Move  TOT, R1       ; 220
CONT:     DATAWORD 8          ; 224
TOT:      RESERVE 4           ; 228
          END PARTE</pre><p>Tabella dei simboli al termine della prima passata:</p><pre>PARTE → 200      GIRO → 208      CONT → 224      TOT → 228</pre><p>Attenzione a due cose: <code>DATAWORD</code> e <code>RESERVE</code> <b>occupano memoria</b> e fanno avanzare il contatore esattamente come le istruzioni; <code>ORIGIN</code> e <code>END</code> no, perché sono istruzioni per l’assemblatore e non finiscono in memoria.</p>`,
    },
    {
      id: 'ex-sw-2',
      level: 'base',
      q: 'L’assemblatore segnala «simbolo <code>FINE</code> non definito». In quale delle due passate se ne accorge, e perché non prima?',
      hint: 'Chiediti che cosa fa ciascuna passata e quando l’assemblatore è in grado di sapere che un’etichetta <b>non</b> esiste.',
      solution: '<p>Se ne accorge nella <b>seconda</b> passata, cioè quando prova a tradurre l’istruzione che nomina <code>FINE</code> e non trova la voce nella tabella dei simboli.</p><p>Non può accorgersene prima perché durante la prima passata l’etichetta potrebbe semplicemente <b>essere più avanti</b>: incontrare un riferimento a un nome ancora ignoto è la situazione normale, non un errore. Solo a scansione conclusa la tabella è completa, e da quel momento un nome assente è davvero assente.</p><p>È lo stesso motivo per cui esistono due passate: la prima <b>raccoglie</b>, la seconda <b>usa</b>. Un assemblatore a una sola passata dovrebbe tenere una lista dei riferimenti in sospeso e tornare a correggerli alla fine — che è, di fatto, una seconda passata mascherata.</p>',
    },
    {
      id: 'ex-sw-3',
      level: 'esame',
      q: 'Con <code>ORIGIN 100</code>, calcola l’indirizzo di ogni riga: due istruzioni, poi <code>RESERVE 20</code>, poi <code>DATAWORD 7</code>, poi un’altra istruzione, infine l’etichetta <code>DOPO</code>. Parole a 32 bit, memoria al byte.',
      hint: '<code>RESERVE</code> prende il numero di <b>byte</b> indicato, non di parole. Le istruzioni ne occupano 4 ciascuna.',
      solution: `<pre>          ORIGIN 100
          Move R1, #0        →  100
          Move R2, #1        →  104
BUFFER:   RESERVE 20         →  108   (occupa 108…127)
COST:     DATAWORD 7         →  128
          Add  R1, R1, R2    →  132
DOPO:     ...                →  136</pre><p>Il punto delicato è <code>RESERVE 20</code>: riserva venti <b>byte</b>, cioè cinque parole, quindi il contatore salta da 108 a 128. Chi lo legge come «venti parole» sbaglia tutti gli indirizzi successivi; chi lo legge come «una riga come le altre» avanza di 4 e sbaglia comunque.</p><p>Nota anche che <code>RESERVE</code> <b>non inizializza</b>: quei venti byte contengono valori indefiniti finché il programma non ci scrive.</p>`,
    },
    {
      id: 'ex-sw-4',
      level: 'esame',
      q: 'Una libreria grafica occupa 2 MB. Cinque programmi la usano e sono in esecuzione contemporaneamente. Quanta memoria serve con collegamento <b>statico</b> e quanta con collegamento <b>dinamico</b>?',
      hint: 'Con lo statico la libreria entra dentro ogni eseguibile. Con il dinamico esiste una copia sola, condivisa.',
      solution: `<pre>STATICO    5 programmi × 2 MB = <b>10 MB</b> di codice di libreria in memoria
           (più 2 MB dentro ciascun file eseguibile su disco)

DINAMICO   una copia sola = <b>2 MB</b>, mappata nello spazio di indirizzi
           di tutti e cinque i processi</pre><p>Il dinamico vince anche sull’<b>aggiornamento</b>: correggere un difetto nella libreria significa sostituire un file, senza ricollegare i cinque programmi.</p><p>Che cosa costa: l’eseguibile non è più autosufficiente. Se la libreria manca, è di versione sbagliata o è stata sostituita in modo incompatibile, il programma non parte o si comporta male — il classico «manca una DLL». Lo statico paga spazio per comprare indipendenza.</p>`,
    },
    {
      id: 'ex-sw-5',
      level: 'esame',
      q: 'Attribuisci ciascun messaggio d’errore allo strumento che lo produce — compilatore, assemblatore, collegatore, caricatore o esecuzione: «manca il punto e virgola» · «simbolo <code>stampa</code> non definito» · «indirizzo non allineato» · «riferimento esterno <code>sqrt</code> irrisolto» · «memoria insufficiente per caricare il programma».',
      hint: 'Ogni strumento vede solo una cosa: il compilatore la sintassi, l’assemblatore un modulo per volta, il collegatore i rapporti fra moduli, il caricatore la memoria disponibile.',
      solution: `<pre>«manca il punto e virgola»            → <b>compilatore</b> (analisi sintattica)
«simbolo stampa non definito»          → <b>assemblatore</b> (etichetta assente
                                         dentro QUESTO modulo)
«riferimento esterno sqrt irrisolto»   → <b>collegatore</b> (nessun modulo o
                                         libreria lo definisce)
«memoria insufficiente per caricare»   → <b>caricatore</b>
«indirizzo non allineato»              → <b>esecuzione</b> (eccezione
                                         sollevata dall'hardware)</pre><p>La coppia che si confonde più spesso è la seconda con la terza. Se il nome dovrebbe stare <b>nello stesso file</b> ed è assente, se ne accorge l’assemblatore in seconda passata. Se il nome è dichiarato esterno e va cercato <b>in un altro modulo</b>, l’assemblatore lascia il buco e la palla passa al collegatore.</p>`,
    },
  ],
};
