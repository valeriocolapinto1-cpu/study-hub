import type { Topic } from '../types';

export const io: Topic = {
  id: 'io',
  title: 'Input/Output, DMA & bus',
  blurb: 'I/O programmato, memory-mapped, handshake, DMA, bus e standard seriali.',
  trapIds: [],
    prereq: ['irq'],
    diagramIds: ['interfaccia-io'],
    summary: [
      'Ogni dispositivo espone tre registri: <b>dati</b>, <b>stato</b>, <b>controllo</b>. Programmare l\'I/O significa leggere e scrivere quei registri.',
      '<b>Memory-mapped</b>: i registri occupano indirizzi di memoria e si usano le normali load/store. <b>Isolato</b>: spazio separato e istruzioni dedicate (IN/OUT).',
      'Tre modi di trasferire: <b>programmato</b> (attesa attiva), <b>a interruzione</b>, <b>DMA</b>.',
      'Il <b>DMA</b> trasferisce blocchi direttamente da e verso la memoria e interrompe solo alla fine: ruba cicli al processore ma gli evita di gestire ogni parola.',
      '<b>Handshake</b>: due segnali, richiesta e conferma, per sincronizzare parti a velocità diverse.',
      'Il <b>bus</b> ha tre gruppi di linee — dati, indirizzi, controllo; gli standard moderni (PCI Express, USB) sono seriali e a pacchetti.',
    ],
    checks: [
      {
        q: 'Perché l\'I/O programmato spreca tempo di processore?',
        a: 'Perché il processore interroga in continuazione il registro di stato in attesa che il dispositivo sia pronto (<b>busy waiting</b>): in quel tempo non fa nient\'altro, e la periferica è ordini di grandezza più lenta.',
      },
      {
        q: 'Che cosa fa il DMA che l\'I/O a interruzione da solo non fa?',
        a: 'Trasferisce l\'<b>intero blocco</b> senza far passare i dati per il processore: una sola interruzione a fine blocco invece di una per ogni parola. Il processore interviene per impostare il trasferimento e alla fine.',
      },
      {
        q: 'Qual è il vantaggio del memory-mapped I/O, e qual è il prezzo?',
        a: 'Vantaggio: nessuna istruzione speciale — tutte le istruzioni di accesso alla memoria, con tutti i modi di indirizzamento, valgono anche per i dispositivi. Prezzo: una parte dello spazio di indirizzamento non è più disponibile per la memoria.',
      },
    ],
  body: `
    <h4>Da dove si parte</h4>
    <p><b>Cosa serve sapere prima:</b> le interruzioni e le routine di servizio, dal modulo su <a href="#/study/irq">interruzioni ed eccezioni</a>.</p>
    <p><b>Che problema risolve.</b> Un calcolatore che non comunica con l’esterno non serve a niente: deve leggere tastiere, scrivere su schermi, salvare su dischi, spedire in rete. Il guaio è che questi dispositivi sono <b>lentissimi</b> rispetto al processore — fra un tasto premuto e il successivo passano milioni di cicli — e ognuno funziona a modo suo. Serve quindi un modo uniforme di parlare con oggetti diversissimi, e una strategia per non sprecare tempo aspettandoli.</p>
    <p><b>Le parole nuove.</b> Un’<b>interfaccia</b> (o controllore) è il circuito che sta fra il bus e il dispositivo e ne nasconde i dettagli, esponendo dei registri. <b>Memory-mapped</b> significa che quei registri hanno indirizzi di memoria come le celle normali. Il <b>DMA</b> (Direct Memory Access) è un componente che trasferisce dati fra dispositivo e memoria <i>senza</i> passare per il processore. L’<b>handshake</b> è il protocollo a due segnali con cui due parti si sincronizzano senza conoscere le rispettive velocità.</p>
    <h4>Il problema dell'I/O</h4>
    <p>Processore e memoria lavorano in nanosecondi, una tastiera in decimi di secondo, un disco
    in millisecondi. Tutta l'organizzazione dell'I/O nasce da questo <b>divario di velocità</b>:
    il problema non è scambiare i dati, è farlo senza che la macchina resti ferma ad aspettare.</p>

    <h4>L'interfaccia di un dispositivo</h4>
    <p>Il processore non parla con la periferica ma con la sua <b>interfaccia</b>, che espone
    tipicamente tre registri:</p>
    <ul>
      <li><b>DATA</b> — il dato in transito;</li>
      <li><b>STATUS</b> — i bit di stato: dato pronto, dispositivo occupato, errore;</li>
      <li><b>CONTROL</b> — i comandi e le abilitazioni, per esempio «genera interruzione quando
      sei pronto».</li>
    </ul>

    <h4>Dove vivono quei registri: memory-mapped o isolato</h4>
    <ul>
      <li><b>Memory-mapped I/O</b>: i registri dell'interfaccia occupano indirizzi dello stesso
      spazio della memoria. Non servono istruzioni speciali — si leggono e scrivono con
      <code>Load</code> e <code>Store</code>. In cambio si consuma spazio di indirizzamento.</li>
      <li><b>I/O isolato</b>: spazio di indirizzi separato e istruzioni dedicate (<code>IN</code>,
      <code>OUT</code>), con una linea di controllo che distingue i due spazi.</li>
    </ul>
    <p>I RISC adottano quasi sempre il memory-mapped, coerentemente con il modello load/store.</p>

    <h4>Tre modi di trasferire</h4>
    <ol>
      <li><b>I/O programmato (polling)</b>: il processore interroga ciclicamente il bit di stato
      finché il dispositivo non è pronto, poi trasferisce la parola. Semplicissimo, ma il
      processore <b>brucia</b> tutto il tempo dell'attesa in un ciclo vuoto.</li>
      <li><b>Guidato da interruzioni</b>: il processore fa altro; è il dispositivo a chiamare
      quando è pronto. Si paga il costo del cambio di contesto, ma non si spreca attesa.</li>
      <li><b>DMA</b>: per blocchi grandi anche un'interruzione per parola sarebbe troppo. Un
      controllore dedicato trasferisce <b>l'intero blocco</b> fra periferica e memoria da solo, e
      manda <b>una sola</b> interruzione alla fine.</li>
    </ol>

    <h4>DMA in dettaglio</h4>
    <p>Il processore programma il controllore scrivendone i registri — indirizzo di partenza in
    memoria, numero di parole, direzione — e poi lo lascia lavorare. Il controllore diventa a sua
    volta <b>padrone del bus</b> per il tempo necessario: quando ne ha bisogno lo richiede, e il
    processore glielo cede. Sottraendo cicli di bus alla CPU si parla di <i>cycle stealing</i>;
    trasferendo un blocco intero in un colpo solo, di modalità <i>burst</i>.</p>
    <p>Effetto collaterale importante: se il DMA scrive in memoria, la copia che la <b>cache</b>
    tiene di quei dati diventa obsoleta. È il problema della coerenza, che va gestito
    invalidando le linee interessate.</p>

    <h4>Handshake</h4>
    <p>Due dispositivi a velocità diverse si sincronizzano con uno scambio di segnali: chi manda
    alza «dato valido», chi riceve risponde «preso», e solo allora il primo abbassa. Il
    trasferimento procede al passo del <b>più lento</b> dei due, senza bisogno di un clock comune:
    è la differenza fra bus <b>asincrono</b> (a handshake) e <b>sincrono</b> (tutto scandito da un
    clock, più veloce ma vincolato dai tempi del dispositivo peggiore).</p>

    <h4>Il bus</h4>
    <p>Un bus trasporta <b>dati, indirizzi e segnali di controllo</b>. Poiché più dispositivi lo
    condividono, serve l'<b>arbitraggio</b>: un meccanismo che stabilisca chi ha diritto di
    parlare quando due lo chiedono insieme. Le uscite dei dispositivi sono <b>tri-state</b>,
    così chi non parla si scollega elettricamente.</p>
    <p>Un <b>buffer</b> interposto compensa la differenza di ritmo fra due dispositivi,
    accumulando i dati in attesa che il più lento li consumi.</p>

    <h4>Seriale contro parallelo</h4>
    <p>Il parallelo manda più bit insieme su fili distinti: veloce sulle distanze brevi, ma i fili
    costano e i segnali arrivano leggermente sfasati (<i>skew</i>), il che ne limita la lunghezza e
    la frequenza. Il seriale manda un bit per volta: meno fili, meno interferenze, frequenze molto
    più alte. Per questo gli standard moderni sono seriali — <b>USB</b>, <b>PCI Express</b> —
    mentre il parallelo è rimasto dentro il chip.</p>

    <h4>Nei sistemi embedded</h4>
    <p>Gli stessi meccanismi con periferiche minuscole: un <b>timer</b> con i suoi registri di
    conteggio e di stato, che genera un'interruzione periodica ed è la base della multiprogrammazione;
    un <b>display a sette segmenti</b>, dove una rete combinatoria traduce la cifra binaria
    nell'accensione dei segmenti — un classico esercizio di sintesi con tabella di verità.</p>
    <h4>Esempio svolto</h4>
    <p><b>Leggere un settore di 512 byte da disco: quanto costa al processore?</b> Confrontiamo i tre modi, supponendo che il dispositivo consegni una parola (4 byte) per volta, cioè 128 parole.</p>
    <pre>I/O programmato   128 attese attive: il processore resta bloccato
                  per l'intera durata del trasferimento

A interruzione    128 interruzioni, una per parola: ogni volta
                  salvataggio stato + ISR + ripristino (decine di cicli)

DMA               1 sola interruzione, a blocco completato.
                  Il processore imposta indirizzo, conteggio e verso,
                  poi fa altro; il controllore ruba qualche ciclo di bus</pre>
    <p>Con 128 parole la differenza è già netta; con un file da un megabyte l'I/O a interruzione è semplicemente impraticabile. È per questo che dischi e rete usano il DMA e la tastiera no: con la tastiera le interruzioni sono poche e rare, e il DMA sarebbe complicazione inutile.</p>

    <h4>Errori tipici</h4>
    <ul>
      <li>Dire che il DMA «elimina le interruzioni»: ne resta una, quella di fine blocco — che è proprio il punto.</li>
      <li>Dimenticare che il DMA scrivendo in memoria può rendere <b>obsoleta</b> la copia in cache: è il problema della coerenza.</li>
      <li>Confondere memory-mapped I/O (dove stanno i registri) con il modo di trasferire (programmato, a interruzione, DMA): sono due scelte indipendenti.</li>
    </ul>`,
  exercises: [
    {
      id: 'ex-io-1',
      level: 'base',
      q: 'Che cosa contengono i tre registri di un’interfaccia (dati, stato, controllo)? Scrivi la sequenza di operazioni per stampare un carattere in <b>I/O programmato</b>.',
      hint: 'Il processore non «parla» col dispositivo: legge e scrive i suoi registri. Prima di scrivere un dato bisogna sapere se il dispositivo è pronto ad accettarlo.',
      solution: `<pre>DATI       il byte da trasferire, in un verso o nell'altro
STATO      bit di sola lettura: pronto, occupato, errore
CONTROLLO  bit scritti dal processore: avvia, abilita interruzioni,
           modo di funzionamento</pre><p>Sequenza per stampare un carattere:</p><pre>ATTENDI: leggi il registro di STATO
         il bit PRONTO è 0?  → torna ad ATTENDI
         scrivi il carattere nel registro DATI
         (il dispositivo azzera PRONTO e comincia a stampare)</pre><p>Quel ciclo di attesa è il <b>busy waiting</b>: il processore gira a vuoto per tutto il tempo di stampa, che rispetto ai suoi tempi è un’eternità. Funziona, è semplicissimo, e spreca tutto.</p>`,
    },
    {
      id: 'ex-io-2',
      level: 'base',
      q: 'Il registro di stato di una periferica è mappato in memoria all’indirizzo <code>0xFFFF0000</code>, con il bit 0 che segnala «pronto». Scrivi il codice di attesa e spiega perché con l’I/O <b>memory-mapped</b> non servono istruzioni speciali.',
      hint: 'Se il registro ha un indirizzo di memoria, tutte le istruzioni che accedono alla memoria funzionano anche su di lui.',
      solution: `<pre>      Move   R2, #0xFFFF0000     ; indirizzo del registro di stato
ATTESA: Move   R1, (R2)            ; una normale Load!
      And    R1, R1, #1          ; isola il bit 0
      Branch=0 ATTESA            ; non pronto → riprova</pre><p>Non c’è nessuna istruzione di I/O: si usano <code>Move</code> e <code>And</code>, le stesse che si userebbero su una variabile. È il vantaggio del <b>memory-mapped</b>: un solo spazio di indirizzi, un solo repertorio, tutti i modi di indirizzamento disponibili anche sui dispositivi.</p><p>Il prezzo è che quegli indirizzi non sono più utilizzabili per la memoria vera, e che il sistema operativo deve proteggerli — altrimenti qualunque programma potrebbe pilotare l’hardware con una semplice <code>Move</code>. Nell’I/O <b>isolato</b>, invece, servono istruzioni dedicate (IN/OUT), tipicamente privilegiate, e lo spazio di memoria resta intatto.</p>`,
    },
    {
      id: 'ex-io-3',
      level: 'esame',
      q: 'Un disco trasferisce a 100 MB/s e consegna parole da 4 byte. Con l’I/O <b>guidato da interruzioni</b>, quante interruzioni al secondo servirebbero? Se ogni interruzione costa 500 cicli su un processore a 2 GHz, quanta CPU resterebbe libera?',
      hint: 'Una interruzione per parola. Calcola quante parole al secondo, poi quanti cicli costano in tutto e confrontali con quelli disponibili.',
      solution: `<pre>parole al secondo = 100 MB/s ÷ 4 B = 25 × 10⁶ interruzioni/s

cicli spesi = 25 × 10⁶ × 500 = 12,5 × 10⁹ cicli/s
cicli disponibili a 2 GHz    =  2   × 10⁹ cicli/s</pre><p>Servirebbero <b>sei volte</b> i cicli che il processore possiede: il trasferimento è semplicemente <b>impossibile</b> con l’I/O a interruzione, indipendentemente da quanto sia efficiente la routine.</p><p>Con il <b>DMA</b> il conto cambia natura: una sola interruzione a fine blocco, e il processore paga solo i cicli di bus «rubati» dal controllore mentre trasferisce. Ecco perché ogni disco e ogni scheda di rete usano il DMA, mentre la tastiera — poche decine di eventi al secondo — non ne ha alcun bisogno.</p>`,
    },
    {
      id: 'ex-io-4',
      level: 'esame',
      q: 'Descrivi la sequenza dei segnali in un <b>handshake completo</b> (a quattro fasi) fra un dispositivo che invia e uno che riceve, e spiega perché non basterebbe un segnale solo.',
      hint: 'Servono due segnali: uno dice «c’è un dato», l’altro «l’ho preso». Il ciclo si chiude quando entrambi tornano a riposo.',
      solution: `<pre>1. il mittente mette il dato sulle linee e alza REQUEST
2. il ricevente legge il dato e alza ACKNOWLEDGE
3. il mittente, visto ACK, abbassa REQUEST
   (e può togliere il dato dalle linee)
4. il ricevente, visto REQ basso, abbassa ACKNOWLEDGE
   → entrambi a riposo, pronti per il dato successivo</pre><p>Con un <b>solo</b> segnale il mittente non saprebbe quando togliere il dato: dovrebbe tenerlo per un tempo fisso, calcolato sul ricevente più lento immaginabile. L’handshake sostituisce quell’ipotesi con una <b>conferma esplicita</b>, e per questo funziona fra parti a velocità qualsiasi e indipendenti dal clock.</p><p>Le quattro fasi (invece di due) servono a garantire che il ciclo successivo parta da uno stato pulito: senza il ritorno a riposo di entrambi i segnali, due trasferimenti consecutivi potrebbero confondersi.</p>`,
    },
    {
      id: 'ex-io-5',
      level: 'esame',
      q: 'Un controllore DMA scrive 4 KiB in memoria mentre il processore lavora. Che cosa può andare storto con la <b>cache</b>, e come si evita?',
      hint: 'Il DMA scrive direttamente in memoria, senza passare per la cache. Chiediti che cosa succede se il processore ha in cache una copia di quelle celle.',
      solution: '<p>Il problema è la <b>coerenza</b>. Se il processore ha in cache una copia di una di quelle celle, la copia diventa <b>obsoleta</b>: leggendola otterrebbe il vecchio valore, non quello appena scritto dal DMA. La situazione simmetrica è altrettanto pericolosa — con la politica <i>write-back</i>, il dato aggiornato può trovarsi solo in cache e il DMA leggerebbe dalla memoria un valore vecchio.</p><p>Le contromisure, dalla più semplice alla più raffinata:</p><ul><li><b>Invalidare</b> le linee di cache corrispondenti al buffer prima o dopo il trasferimento: se ne occupa il sistema operativo nel driver.</li><li>Dichiarare <b>non memorizzabile in cache</b> l’area usata per i buffer di I/O.</li><li><b>Snooping</b>: il controllore di cache sorveglia il bus e invalida da sé le linee toccate dal DMA. È la soluzione hardware, la stessa usata per la coerenza fra le cache di più core.</li></ul>',
    },
  ],
};
