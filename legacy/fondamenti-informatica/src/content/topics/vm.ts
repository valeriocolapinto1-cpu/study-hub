import type { Topic } from '../types';

export const vm: Topic = {
    id: 'vm',
    title: 'Memoria virtuale & TLB',
    blurb: 'Spazio logico e fisico, paginazione, page fault, traduzione degli indirizzi.',
    trapIds: ['trap-ram'],
    prereq: ['mem'],
    diagramIds: ['memoria-virtuale-tlb'],
    summary: [
      'La memoria virtuale separa gli indirizzi che il programma usa da quelli fisici: ogni processo vede il proprio spazio, e i processi sono isolati fra loro.',
      '<b>Paginazione</b>: pagine (virtuali) e frame (fisici) della <b>stessa</b> dimensione. Nella traduzione l\'<b>offset non cambia</b>.',
      'La <b>tabella delle pagine</b> mappa numero di pagina → numero di frame, con i bit di validità, protezione, modificato e uso.',
      '<b>Page fault</b>: la pagina non è in memoria. È un\'eccezione gestita dal sistema operativo, che carica la pagina da disco — non è un errore del programma.',
      'Il <b>TLB</b> è una cache delle traduzioni: senza, ogni accesso in memoria ne costerebbe due (prima la tabella, poi il dato).',
    ],
    checks: [
      {
        q: 'Pagine da 4 KiB e indirizzo virtuale a 32 bit: quanti bit di offset, e quante pagine?',
        a: 'Offset <b>12 bit</b>, perché 4096 = 2¹². Restano 20 bit per il numero di pagina, quindi <b>2²⁰ = 1 048 576</b> pagine.',
      },
      {
        q: 'Perché nella traduzione l\'offset resta identico?',
        a: 'Perché pagina e frame hanno la stessa dimensione: la traduzione cambia <b>quale blocco</b> si sta guardando, non la posizione dentro il blocco. Si traduce solo la parte alta dell\'indirizzo.',
      },
      {
        q: 'TLB miss e page fault sono la stessa cosa?',
        a: 'No. Il <b>TLB miss</b> dice solo che la traduzione non era nella cache delle traduzioni: la pagina può benissimo essere in memoria, e si va a leggere la tabella. Il <b>page fault</b> dice che la pagina non è in memoria fisica e va caricata da disco: costa milioni di volte di più.',
      },
    ],
    body: `
    <h4>Da dove si parte</h4>
    <p><b>Cosa serve sapere prima:</b> la gerarchia di memoria e il funzionamento della cache, dal modulo su <a href="#/study/mem">memoria e cache</a>. L’idea è la stessa, applicata un piano più in basso.</p>
    <p><b>Che problema risolve.</b> Due problemi insieme. Il primo: i programmi vorrebbero più memoria di quella installata. Il secondo, più sottile: se più programmi girano insieme e usano indirizzi assoluti, si pestano i piedi — e uno può leggere o rovinare i dati dell’altro. La memoria virtuale risolve entrambi con una sola idea: <b>gli indirizzi che il programma usa non sono quelli fisici</b>. Fra i due c’è una traduzione, controllata dal sistema operativo, che può mandare una pagina su disco quando la memoria finisce e può negare l’accesso a ciò che non è tuo.</p>
    <p><b>Le parole nuove.</b> Un <b>indirizzo virtuale</b> è quello che il programma produce; un <b>indirizzo fisico</b> è quello che arriva alla memoria. Una <b>pagina</b> è un blocco dello spazio virtuale, un <b>frame</b> il blocco fisico che la ospita: hanno la stessa dimensione. La <b>tabella delle pagine</b> è la mappa fra le due. Il <b>TLB</b> è una piccola cache delle traduzioni più recenti. Un <b>page fault</b> è l’eccezione che scatta quando la pagina richiesta non è in memoria.</p>
    <h4>Il problema</h4>
    <p>I programmi possono essere più grandi della memoria fisica, e più programmi devono coesistere senza pestarsi i piedi. La <b>memoria virtuale</b> risolve entrambe le cose: ogni processo lavora su uno spazio di indirizzi <b>logico</b> tutto suo, che il sistema mappa sulla memoria <b>fisica</b> disponibile, appoggiandosi al disco per ciò che non ci sta.</p>

    <h4>Paginazione</h4>
    <p>Lo spazio logico è diviso in <b>pagine</b> di dimensione fissa, la memoria fisica in <b>frame</b> della stessa dimensione. Una pagina qualsiasi può stare in un frame qualsiasi: non serve contiguità, quindi non c'è frammentazione esterna.</p>
    <p>L'indirizzo virtuale si spezza in due campi:</p>
    <pre>| numero di pagina | offset nella pagina |
        ↓ tradotto           ↓ invariato
| numero di frame  | offset nella pagina |</pre>
    <p>L'offset non viene toccato: pagina e frame hanno la stessa dimensione, quindi cambia solo la parte alta dell'indirizzo.</p>

    <h4>La tabella delle pagine</h4>
    <p>Contiene, per ogni pagina, il frame che la ospita più alcuni bit di controllo: <b>valid</b> (la pagina è in memoria?), <b>dirty</b> (è stata modificata?), <b>bit di protezione</b> (lettura/scrittura/esecuzione), bit di riferimento per le politiche di sostituzione. Ogni processo ha la propria tabella: è così che si ottiene l'<b>isolamento</b> fra processi, e condividendo deliberatamente alcune voci si ottiene la <b>condivisione</b> di codice o dati.</p>

    <h4>Page fault</h4>
    <p>Se il bit valid è 0 la pagina non è in memoria: si solleva un'<b>eccezione</b> di page fault. Il sistema operativo sceglie una vittima (tipicamente con criteri LRU), la riscrive su disco <b>solo se</b> è dirty, carica la pagina richiesta e fa <b>rieseguire</b> l'istruzione interrotta. Il costo è quello di un accesso a disco: milioni di cicli, ordini di grandezza più di un cache miss. Per questo la sostituzione si può permettere algoritmi sofisticati in software.</p>

    <h4>Il TLB</h4>
    <p>La tabella delle pagine sta in memoria: tradurre un indirizzo richiederebbe un accesso in più <b>per ogni</b> accesso: si raddoppierebbe il costo di tutto. Il <b>TLB</b> (Translation Lookaside Buffer) è una piccola cache completamente o set-associativa delle traduzioni usate di recente.</p>
    <ol>
      <li>Il processore emette un indirizzo virtuale.</li>
      <li>Si cerca il numero di pagina nel TLB. <b>TLB hit</b> → il frame è immediato.</li>
      <li><b>TLB miss</b> → si legge la tabella delle pagine in memoria e si aggiorna il TLB.</li>
      <li>Se anche la tabella dice «non valida» → page fault.</li>
    </ol>
    <p>Funziona per la stessa ragione della cache: la <b>località</b>. Un programma insiste su poche pagine per volta, quindi anche un TLB di poche decine di voci raggiunge percentuali di successo altissime.</p>

    <h4>Rapporto con la cache</h4>
    <p>Sono due meccanismi distinti che si sommano: il TLB accelera la <b>traduzione</b> degli indirizzi, la cache accelera l'<b>accesso ai dati</b>. Un accesso può quindi fare TLB hit e cache miss, o viceversa. Da tenere separati anche a parole: la cache sta fra CPU e memoria principale, la memoria virtuale fra memoria principale e disco.</p>
    <h4>Tabelle a più livelli</h4>
    <p>Una tabella con una voce per ogni pagina dello spazio virtuale è impraticabile: con indirizzi a 32 bit e pagine da 4 KiB servono 2²⁰ voci per processo, cioè megabyte di tabella — quasi tutti riferiti a pagine mai usate, perché nessun programma occupa davvero tutto lo spazio.</p>
    <p>La soluzione è spezzare la traduzione in due (o più) passaggi. Il numero di pagina si divide in due campi: il primo indicizza una <b>directory</b>, che punta a una tabella di secondo livello; il secondo indicizza quella tabella, che contiene il frame.</p>
    <pre>indirizzo virtuale a 32 bit, pagine da 4 KiB:

┌──────────┬──────────┬────────────┐
│ dir 10   │ tab 10   │ offset 12  │
└──────────┴──────────┴────────────┘

directory (1024 voci) → tabella (1024 voci) → frame</pre>
    <p>Il guadagno: le tabelle di secondo livello si allocano <b>solo per le zone davvero usate</b>. Un processo che usa qualche megabyte ha una directory e due o tre tabelle, cioè poche decine di kilobyte invece di megabyte. Il prezzo è un accesso in memoria in più per ogni traduzione non presente nel TLB — motivo per cui il TLB, con i suoi tassi di successo del 99 %, diventa ancora più importante.</p>

    <h4>Sostituzione delle pagine</h4>
    <p>Quando la memoria fisica è piena e serve caricare una pagina, bisogna sfrattarne una. La scelta conta molto, perché ogni errore costa un accesso al disco:</p>
    <ul>
      <li><b>Ottimale</b>: sfratta la pagina che verrà usata più tardi nel futuro. Non è realizzabile — richiede di conoscere il futuro — ma serve da termine di paragone teorico.</li>
      <li><b>LRU</b> (meno recentemente usata): approssima l’ottimale scommettendo sulla località temporale. Realizzarla in modo esatto richiederebbe di aggiornare un ordinamento a ogni accesso, troppo costoso.</li>
      <li><b>Clock</b> (o seconda chance): l’approssimazione usata davvero. Ogni pagina ha un <b>bit di uso</b> che l’hardware mette a 1 a ogni accesso; il sistema operativo scorre le pagine in circolo, azzerando i bit che trova a 1 e sfrattando la prima che trova già a 0.</li>
      <li><b>FIFO</b>: sfratta la più vecchia. Semplice ma cieca, può buttare fuori una pagina usatissima.</li>
    </ul>
    <p>Se la pagina sfrattata è stata modificata (bit <i>dirty</i> a 1) va prima riscritta su disco, quindi il fault costa il doppio. Per questo, a parità di condizioni, conviene sfrattare pagine pulite.</p>

    <h4>Thrashing e insieme di lavoro</h4>
    <p>Se i processi attivi richiedono complessivamente più pagine di quante ce ne stiano in memoria, il sistema entra in <b>thrashing</b>: ogni pagina caricata ne sfratta un’altra che serve subito dopo, e la macchina passa il tempo a spostare pagine invece di calcolare. Il sintomo è inconfondibile — disco al massimo, processore quasi fermo.</p>
    <p>La difesa si basa sulla nozione di <b>insieme di lavoro</b> (working set): l’insieme delle pagine che un processo ha usato nell’ultimo intervallo di tempo. Se il sistema riesce a tenere in memoria l’insieme di lavoro di ogni processo attivo, i fault restano rari; quando non ci riesce, la contromisura è ridurre il numero di processi attivi, sospendendone alcuni per intero.</p>

    <h4>Segmentazione, in breve</h4>
    <p>La paginazione divide lo spazio in blocchi tutti uguali, senza guardare che cosa contengono. La <b>segmentazione</b> lo divide invece in parti di dimensione variabile che corrispondono a unità logiche: il codice, i dati, la pila. Il vantaggio è che i permessi si applicano a entità con un senso — il segmento di codice è di sola lettura ed eseguibile, quello dei dati scrivibile e non eseguibile.</p>
    <p>Lo svantaggio è la <b>frammentazione esterna</b>: segmenti di dimensioni diverse lasciano buchi inutilizzabili. I sistemi reali combinano le due cose — segmenti divisi in pagine — prendendo la protezione dall’una e la gestione semplice della memoria dall’altra.</p>
    <h4>Esempio svolto</h4>
    <p><b>Traduci l'indirizzo virtuale <code>0x00403ABC</code>,</b> con pagine da 4 KiB, e sapendo che la pagina cercata sta nel frame <code>0x25</code>.</p>
    <pre>pagine da 4 KiB = 2¹² byte      →  offset = 12 bit = 3 cifre esadecimali

0x00403ABC  =  0x00403 | ABC
               ↑ pagina  ↑ offset

pagina 0x00403  →  tabella delle pagine  →  frame 0x25

indirizzo fisico = frame · 4096 + offset
                 = 0x25 &lt;&lt; 12  |  0xABC
                 = <b>0x00025ABC</b></pre>
    <p>Le ultime tre cifre esadecimali <b>non cambiano</b>: sono l'offset, e la traduzione tocca solo la parte alta. È il controllo immediato per capire se l'esercizio è stato svolto bene.</p>
    <p><b>Quanti accessi in memoria costa?</b> Senza TLB: uno per leggere la tabella delle pagine, uno per il dato — il doppio del necessario. Con un TLB che va a segno nel 99 % dei casi, il costo medio torna praticamente a un accesso solo.</p>

    <h4>Errori tipici</h4>
    <ul>
      <li>Tradurre <b>anche</b> l'offset: pagina e frame hanno la stessa dimensione, quindi la posizione interna resta identica.</li>
      <li>Confondere TLB miss e page fault: il primo costa un accesso in più, il secondo un accesso al <b>disco</b>, cioè milioni di volte tanto.</li>
      <li>Dimenticare che la tabella delle pagine sta in memoria: è la ragione per cui il TLB esiste.</li>
    </ul>`,
    exercises: [
      {
        id: 'ex-vm-1',
        level: 'base',
        q: 'Pagine da <b>4 KiB</b>. Traduci l’indirizzo virtuale <code>0x0002A7F4</code> sapendo che la pagina cercata sta nel frame <code>0x0C3</code>.',
        hint: 'Prima separa offset e numero di pagina contando i bit. Con pagine da 4 KiB il taglio cade su un confine comodo in esadecimale.',
        solution: `<pre>4 KiB = 2¹² byte  →  offset = 12 bit = 3 cifre esadecimali

0x0002A7F4  =  0x0002A | 7F4
               ↑ pagina  ↑ offset

pagina 0x0002A  →  (tabella delle pagine)  →  frame 0x0C3

fisico = 0x0C3 &lt;&lt; 12  |  0x7F4  =  <b>0x000C37F4</b></pre><p>Verifica immediata: le ultime <b>tre cifre esadecimali sono rimaste 7F4</b>. Se in un esercizio cambiano, la traduzione è sbagliata: pagina e frame hanno la stessa dimensione, quindi la posizione interna non può cambiare.</p>`,
      },
      {
        id: 'ex-vm-2',
        level: 'base',
        q: 'Indirizzi virtuali a <b>32 bit</b>, pagine da <b>4 KiB</b>, ogni voce della tabella delle pagine occupa <b>4 byte</b>. Quanto occupa la tabella di un processo? E se i processi attivi sono 100?',
        hint: 'Il numero di voci è il numero di pagine dello spazio virtuale, non di quelle effettivamente usate.',
        solution: `<pre>numero di pagine = 2³² / 2¹² = 2²⁰ = 1 048 576 voci
dimensione = 2²⁰ × 4 byte = <b>4 MiB</b> per processo

100 processi → 100 × 4 MiB = <b>400 MiB</b> di sole tabelle</pre><p>Un risultato assurdo: le tabelle occuperebbero più della memoria che devono gestire, e per giunta la maggior parte delle voci si riferisce a pagine <b>mai usate</b>, perché nessun processo occupa davvero 4 GiB.</p><p>Da qui le due soluzioni reali: la tabella a <b>più livelli</b>, in cui si allocano solo i rami effettivamente usati, e la tabella <b>invertita</b>, che ha una voce per frame fisico invece che per pagina virtuale — quindi cresce con la memoria installata e non con lo spazio di indirizzamento.</p>`,
      },
      {
        id: 'ex-vm-3',
        level: 'esame',
        q: 'Un accesso in memoria può risolversi in tre modi: <b>TLB hit</b>, <b>TLB miss</b> senza page fault, <b>page fault</b>. Descrivi che cosa succede in ciascun caso e quanto costa, in ordine di grandezza.',
        hint: 'Chiediti ogni volta dove si trova la traduzione e dove si trova il dato: sono due domande diverse.',
        solution: `<pre>TLB HIT
  la traduzione è nel TLB → indirizzo fisico immediato → si legge il dato
  costo: ~1 accesso in memoria (il dato), il TLB è quasi istantaneo

TLB MISS, pagina presente
  la traduzione non è nel TLB → si legge la tabella delle pagine in
  memoria → si aggiorna il TLB → si legge il dato
  costo: ~2 accessi in memoria

PAGE FAULT
  la voce dice «non valida»: la pagina non è in memoria fisica.
  Eccezione → il sistema operativo sceglie un frame, eventualmente
  riscrive su disco quello sfrattato se dirty, carica la pagina,
  aggiorna la tabella, e l'istruzione viene RIESEGUITA
  costo: ~10 ms, cioè MILIONI di cicli</pre><p>I tre casi non sono alternative dello stesso ordine: fra il secondo e il terzo ci sono cinque ordini di grandezza. È il motivo per cui il tasso di page fault deve restare bassissimo, mentre un TLB miss ogni tanto è del tutto tollerabile.</p>`,
      },
      {
        id: 'ex-vm-4',
        level: 'esame',
        q: 'TLB con tasso di successo <b>99 %</b>, accesso alla memoria 100 cicli, TLB trascurabile. Il tasso di page fault è <b>0,001 %</b> e un fault costa 10 ms su un processore a <b>1 GHz</b>. Calcola il numero medio di cicli per accesso.',
        hint: 'Calcola prima il contributo delle traduzioni, poi quello dei page fault convertendo i millisecondi in cicli. Guarda quale dei due domina.',
        solution: `<pre>TLB hit  (99 %):   100 cicli          (solo il dato)
TLB miss (1 %):    200 cicli          (tabella + dato)

media senza fault = 0,99×100 + 0,01×200 = 99 + 2 = 101 cicli

un page fault = 10 ms × 1 GHz = 10⁷ cicli
contributo    = 0,00001 × 10⁷ = <b>100 cicli</b>

totale ≈ 101 + 100 = <b>201 cicli</b> per accesso</pre><p>Il risultato sorprendente: un page fault ogni <b>centomila</b> accessi <b>raddoppia</b> il tempo medio. Un evento rarissimo domina la media, perché il suo costo è cinque ordini di grandezza sopra tutto il resto.</p><p>È la lezione generale della gerarchia di memoria: quando le penalità sono enormi, ciò che conta non è il caso tipico ma la <b>frequenza dei casi catastrofici</b>. E spiega perché il sistema operativo lavora tanto sulle politiche di sostituzione delle pagine.</p>`,
      },
      {
        id: 'ex-vm-5',
        level: 'esame',
        q: 'Un programma tenta di scrivere in una pagina marcata di <b>sola lettura</b>. Descrivi che cosa accade, passo per passo, e a che cosa serve questo meccanismo.',
        hint: 'La verifica non la fa il programma né il compilatore: la fanno i bit di protezione nella voce della tabella delle pagine, controllati dall’hardware a ogni accesso.',
        solution: `<pre>1. il programma esegue una Store verso un indirizzo virtuale
2. l'unità di gestione della memoria traduce l'indirizzo e legge
   i bit di protezione della voce corrispondente
3. il bit «scrivibile» è a 0, ma l'accesso è in scrittura:
   → violazione
4. viene sollevata un'ECCEZIONE (violazione di protezione),
   sincrona rispetto all'istruzione
5. il controllo passa al sistema operativo, che tipicamente
   termina il processo — il classico «segmentation fault»</pre><p>A che serve: a <b>isolare</b> i processi e a proteggere ciò che non deve cambiare. Il codice di un programma è mappato in sola lettura, così un difetto non può riscrivere le proprie istruzioni; le pagine di un processo non sono raggiungibili da un altro, perché semplicemente non compaiono nella sua tabella.</p><p>Lo stesso meccanismo, usato in positivo, abilita la <b>copia su scrittura</b>: due processi condividono le stesse pagine fisiche marcate in sola lettura, e solo quando uno prova a scrivere l’eccezione fa creare al sistema operativo una copia privata. È così che le chiamate di creazione di un processo diventano economiche.</p>`,
      },
    ],
  };
