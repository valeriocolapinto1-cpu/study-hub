import type { OpenItem } from './types';

/**
 * Domande aperte di teoria, con risposta modello per l'autovalutazione.
 * Ogni argomento del programma ne ha almeno una: lo impone un test.
 *
 * PER AGGIUNGERNE UNA: aggiungi una voce con `id` nuovo, `topic` fra quelli
 * di `types.ts` e un `model` che elenchi i punti che l'esame vuole sentire.
 */
export const open: OpenItem[] = [
  {
    id: 'open-irq-01',
    topic: 'irq',
    q: 'Spiega la differenza tra interruzioni ed eccezioni.',
    model:
      'Le interruzioni sono segnali hardware asincroni da dispositivi esterni (sulle linee di controllo del bus); le eccezioni sono eventi software sincroni generati dal processore (div/0, overflow, chiamate di sistema). Entrambe sospendono il programma, salvano lo stato e invocano una routine; le eccezioni sono più versatili e possono richiamare routine diverse. Cita ISR e salvataggio di PC/registri.',
  },
  {
    id: 'open-pipe-01',
    topic: 'pipe',
    q: "Che cos'è il pipelining e quale problema introduce?",
    model:
      'Sovrapposizione delle fasi (fetch, decode, execute, memory, write) di istruzioni diverse su unità dedicate → maggiore throughput. Introduce la dipendenza dai dati (stalli), mitigata con operand forwarding.',
  },
  {
    id: 'open-mem-01',
    topic: 'mem',
    q: 'Differenza tra RAM e cache, definendo località spaziale e temporale.',
    model:
      'Entrambe volatili. La cache è più piccola, veloce e costosa (SRAM), tiene copie dei dati frequenti. Nella RAM il tempo di accesso NON dipende dalla posizione del dato. Località temporale: dati usati di recente riusati a breve; spaziale: indirizzi vicini referenziati a breve.',
  },
  {
    id: 'open-mem-02',
    topic: 'mem',
    q: 'Quali sono le limitazioni di una cache L1 molto grande (rispetto ad aggiungere L2)?',
    model:
      'Costo elevato, maggiore spazio fisico e soprattutto minore velocità (indirizzi più grandi → accesso più lento). Meglio una gerarchia L1 piccola/veloce + L2 più grande/lenta.',
  },
  {
    id: 'open-isa-01',
    topic: 'isa',
    q: "Perché conviene aggiornare il PC all'istruzione successiva e non a quella corrente?",
    model:
      "Per la sequenzialità dell'esecuzione: dopo il fetch, incrementare il PC prepara la prossima istruzione senza ricalcolo, utile in pipeline (fetch anticipato). I salti (branch) caricano un nuovo indirizzo nel PC.",
  },

  // ───────── aggiunte per coprire i moduli scoperti ─────────
  {
    id: 'open-ff-01',
    topic: 'ff',
    q: "Che cos'è un flip-flop? Distingui dispositivi sincroni e asincroni.",
    model:
      "Un flip-flop è un elemento <b>bistabile</b> che memorizza 1 bit: realizzato con porte logiche retroazionate, mantiene uno dei due stati stabili finché un ingresso non lo commuta. È il mattone di registri e contatori. I dispositivi <b>sincroni</b> (edge-triggered) cambiano stato solo sul fronte del clock, quindi l'istante di commutazione è prevedibile; gli <b>asincroni</b> reagiscono immediatamente agli ingressi, senza clock.",
  },
  {
    id: 'open-ff-02',
    topic: 'ff',
    q: 'Descrivi il flip-flop master-slave e spiega perché serve la struttura a due stadi.',
    model:
      "Due latch D in serie: il <b>master</b> campiona l'ingresso mentre il clock è alto, lo <b>slave</b> ne trasferisce il valore in uscita quando il clock commuta. Poiché i due stadi non sono mai trasparenti contemporaneamente, l'ingresso non può «attraversare» il dispositivo nello stesso ciclo: si evita l'instabilità (corse) e l'uscita cambia in un solo istante ben definito, il fronte del clock.",
  },
  {
    id: 'open-isa-02',
    topic: 'isa',
    q: 'Confronta le architetture RISC e CISC.',
    model:
      "<b>RISC</b>: istruzioni semplici, di lunghezza fissa (una parola); modello <b>load/store</b> (i dati vanno portati in registro prima di essere elaborati, niente operazioni memoria-memoria); pochi modi di indirizzamento → decodifica semplice e circuito veloce, adatto alla pipeline. Esempi: ARM, Nios II. <b>CISC</b>: istruzioni complesse di lunghezza variabile, operazioni anche su operandi in memoria; i programmi risultano più corti ma la decodifica è più onerosa. Esempi: Intel IA-32, ColdFire.",
  },
  {
    id: 'open-bool-01',
    topic: 'bool',
    q: 'Enuncia i teoremi di De Morgan e spiega perché NAND e NOR sono universali.',
    model:
      "De Morgan: <span class=\"ovl\">A·B</span> = <span class=\"ovl\">A</span> + <span class=\"ovl\">B</span> e <span class=\"ovl\">A+B</span> = <span class=\"ovl\">A</span> · <span class=\"ovl\">B</span>; valgono anche per più di due fattori. Con soli ∧ e ∨ non si ottiene la negazione, quindi quell'insieme non è funzionalmente completo. NAND e NOR invece lo sono da soli: da ciascuno si ricava il NOT (collegando insieme gli ingressi) e, per De Morgan, anche AND e OR — quindi qualunque rete combinatoria.",
  },
  {
    id: 'open-mem-03',
    topic: 'mem',
    q: 'Descrivi la gerarchia di memoria e spiega perché conviene organizzarla a livelli.',
    model:
      "Dai registri alla cache (L1, L2), alla memoria principale DRAM, fino alla memoria secondaria: scendendo, la capacità cresce e il costo per bit cala, ma il tempo di accesso peggiora. La gerarchia funziona grazie alla <b>località</b>: i livelli alti tengono i dati usati di recente e quelli vicini, così la gran parte degli accessi si risolve in alto. Un solo livello grande e veloce sarebbe proibitivo per costo e comunque più lento, perché indirizzare molte celle rallenta l'accesso.",
  },
  {
    id: 'open-mem-04',
    topic: 'mem',
    q: 'Confronta le tre mappature della cache (diretta, associativa, set-associativa).',
    model:
      "<b>Diretta</b>: ogni blocco di memoria può andare in una sola linea di cache; hardware semplice e confronto immediato, ma blocchi che mappano sulla stessa linea si sfrattano a vicenda (conflitti) anche con la cache semivuota. <b>Associativa</b>: un blocco può andare in qualunque linea; sfrutta al meglio lo spazio, ma richiede di confrontare il tag con tutte le linee, quindi è costosa e più lenta. <b>Set-associativa</b>: compromesso: la cache è divisa in insiemi, il blocco va in un insieme fisso ma in una linea qualsiasi al suo interno. Serve una politica di sostituzione, tipicamente <b>LRU</b>.",
  },
  {
    id: 'open-irq-02',
    topic: 'irq',
    q: 'Come sfrutta un debugger il meccanismo delle eccezioni?',
    model:
      "Il debugger usa eccezioni generate dal processore per riprendere il controllo del programma sotto esame. In <b>trace mode</b> viene sollevata un'eccezione dopo <em>ogni</em> istruzione, così l'esecuzione procede passo-passo e si può ispezionare lo stato a ogni passo. Con i <b>breakpoint</b> l'eccezione scatta solo in punti scelti: il programma corre a piena velocità fino al breakpoint successivo. In entrambi i casi il controllo passa a una routine del debugger dopo il salvataggio dello stato.",
  },
  {
    id: 'open-bin-01',
    topic: 'bin',
    q: "Spiega la rappresentazione in complemento a 2 e come si rileva l'overflow.",
    model:
      "Per un positivo: binario con zeri a sinistra fino a N bit. Per <code>-x</code>: si scrive <code>x</code>, si invertono tutti i bit e si somma 1. Il bit più significativo indica il segno e lo zero ha <b>una sola</b> codifica; l'intervallo è asimmetrico, da −2ᴺ⁻¹ a +2ᴺ⁻¹−1. L'<b>overflow</b> nella somma si ha quando due operandi <b>concordi</b> danno un risultato di segno opposto (nella sottrazione, quando gli operandi sono discordi); in hardware si rileva con lo <b>XOR</b> tra il riporto entrante e quello uscente dal bit di segno. Attenzione a non confonderlo con il riporto uscente, che da solo non segnala overflow in CP2.",
  },
  {
    id: 'open-cpu-01',
    topic: 'cpu',
    q: "Descrivi il ciclo di prelievo di un'istruzione, nominando i registri coinvolti.",
    model:
      "In RTN: <code>MAR ← [PC]</code>, avvio della lettura, <code>PC ← [PC]+4</code>, <code>IR ← [MDR]</code>; segue la decodifica e poi l'esecuzione. <b>MAR</b> presenta l'indirizzo alla memoria e <b>MDR</b> raccoglie il dato: il processore non parla mai direttamente con la memoria. <b>IR</b> trattiene l'istruzione per la decodifica, <b>PC</b> punta alla prossima. L'incremento del PC avviene subito dopo l'invio dell'indirizzo, non a fine istruzione: l'esecuzione è sequenziale per default, quindi conviene preparare l'indirizzo successivo mentre la memoria risponde. I salti si limitano a sovrascrivere il PC.",
  },
  {
    id: 'open-cpu-02',
    topic: 'cpu',
    q: "Confronta unità di controllo cablata e microprogrammata, e datapath a bus singolo e a tre bus.",
    model:
      "L'unità <b>cablata</b> è una rete sequenziale progettata su misura: veloce, ma cambiare l'insieme di istruzioni richiede di riprogettare il circuito — scelta tipica dei RISC. La <b>microprogrammata</b> tiene i segnali di controllo in una memoria di controllo ed esegue un microprogramma: flessibile e adatta a ISA complessi, ma più lenta perché ogni passo costa una lettura — scelta storica dei CISC. Quanto al datapath: con un <b>bus singolo</b> si può fare un solo trasferimento per volta, quindi un'operazione fra registri richiede più cicli; con <b>tre bus</b> (due di lettura e uno di scrittura) entrambi gli operandi raggiungono la ALU e il risultato viene riscritto nello stesso ciclo — più hardware, ma è ciò che rende praticabile la pipeline.",
  },
  {
    id: 'open-vm-01',
    topic: 'vm',
    q: "Che cos'è la memoria virtuale? Spiega la traduzione di un indirizzo e il ruolo del TLB.",
    model:
      "Ogni processo lavora su uno spazio di indirizzi <b>logico</b> proprio, mappato dal sistema sulla memoria <b>fisica</b>, appoggiandosi al disco per ciò che non ci sta: si eseguono programmi più grandi della RAM e si isolano i processi fra loro. Con la <b>paginazione</b>, spazio logico e memoria fisica sono divisi in pagine e frame di uguale dimensione. L'indirizzo virtuale si spezza in numero di pagina + offset: solo il numero di pagina viene tradotto in numero di frame tramite la <b>tabella delle pagine</b>, mentre l'<b>offset resta invariato</b>. Poiché la tabella sta in memoria, tradurre costerebbe un accesso in più a ogni accesso: il <b>TLB</b> è una piccola cache associativa delle traduzioni recenti che elimina quasi sempre quel costo, sfruttando la località. Se la pagina non è in memoria (bit valid a 0) si ha un <b>page fault</b>: eccezione, caricamento da disco, riesecuzione dell'istruzione.",
  },
  {
    id: 'open-vm-02',
    topic: 'vm',
    q: 'Cache e memoria virtuale risolvono lo stesso problema? Motiva.',
    model:
      "No, e vanno tenute distinte anche a parole. Entrambe sfruttano la <b>località</b>, ma stanno a livelli diversi della gerarchia: la <b>cache</b> sta fra CPU e memoria principale e accelera l'<b>accesso ai dati</b>; la <b>memoria virtuale</b> sta fra memoria principale e disco e serve a dare a ogni processo uno spazio proprio più grande della RAM, con protezione e possibilità di condivisione. Anche i costi sono di ordini diversi: un cache miss costa decine di cicli e si gestisce in hardware, un page fault costa un accesso a disco — milioni di cicli — e viene gestito dal sistema operativo, che può quindi permettersi politiche di sostituzione sofisticate. Il <b>TLB</b> è l'anello che li avvicina: è una cache, ma delle traduzioni, non dei dati.",
  },
  {
    id: 'open-pipe-02',
    topic: 'pipe',
    q: "Elenca i tipi di hazard in una pipeline e spiega come si mitigano.",
    model:
      "<b>Strutturali</b>: due istruzioni contendono la stessa risorsa nello stesso ciclo (per esempio un unico accesso alla memoria conteso fra fetch e load); si risolvono duplicando la risorsa, come cache istruzioni e dati separate. <b>Sui dati</b>: un'istruzione ha bisogno di un risultato non ancora scritto in registro; si mitigano con l'<b>operand forwarding</b>, che inoltra il risultato direttamente dall'uscita della ALU allo stadio che lo richiede — resta però il caso <i>load-use</i>, dove il dato arriva dalla memoria uno stadio più tardi e uno stallo è inevitabile. <b>Di controllo</b>: dopo un salto non si sa quale istruzione prelevare, e quelle già entrate vanno scartate; si mitigano con la predizione (statica o dinamica), con il <i>delayed branch</i> e calcolando l'indirizzo di destinazione il prima possibile.",
  },
  {
    id: 'open-karnaugh-01',
    topic: 'karnaugh',
    q: 'Descrivi la minimizzazione con la mappa di Karnaugh e il ruolo delle indifferenze.',
    model:
      "La mappa dispone i mintermini in celle adiacenti secondo il <b>codice Gray</b>: fra celle vicine cambia una sola variabile. Si raggruppano gli <code>1</code> in blocchi di dimensione potenza di 2, il più grandi possibile: dentro un gruppo le variabili che cambiano si eliminano, e restano quelle costanti, che formano un implicante. L'unione degli implicanti scelti dà la SOP minima. Le celle sono adiacenti anche a bordo tavola (wrap-around). Le <b>indifferenze</b> (x) possono essere prese come 1 quando servono ad allargare un gruppo, o lasciate a 0 se non aiutano: si valutano una per una, non tutte insieme. Nel disegno finale scomponi in porte a 2 ingressi.",
  },

  {
    id: 'open-arith-01',
    topic: 'arith',
    q: 'Perché un sommatore ripple-carry è lento, e come lo risolve il carry-lookahead?',
    model:
      "Nel <b>ripple-carry</b> gli stadi sono in cascata: il riporto uscente di ciascun sommatore completo entra nel successivo, quindi lo stadio più significativo produce il risultato definitivo solo dopo che il riporto ha attraversato <b>tutti</b> gli stadi. Il ritardo cresce <b>linearmente con n</b>, e siccome questo è il cammino critico è lui a fissare il periodo minimo di clock. Il <b>carry-lookahead</b> non aspetta il riporto: lo calcola. Per ogni posizione definisce due funzioni che dipendono solo dagli operandi, quindi disponibili subito — <code>Gᵢ = aᵢ·bᵢ</code> (la posizione genera un riporto da sé) e <code>Pᵢ = aᵢ ⊕ bᵢ</code> (la posizione propaga quello che riceve) — da cui <code>cᵢ₊₁ = Gᵢ + Pᵢ·cᵢ</code>. Espandendo la ricorsione ogni riporto si esprime in funzione del solo <code>c₀</code>, quindi tutti i riporti si ottengono <b>in parallelo</b> con due livelli di porte. Il costo è il numero di porte, che esplode con n: per questo si fanno blocchi da 4 bit e si applica lo stesso schema a un livello superiore.",
  },
  {
    id: 'open-arith-02',
    topic: 'arith',
    q: 'Descrivi semisommatore e sommatore completo, e spiega come si ottiene un sommatore/sottrattore unico.',
    model:
      "Il <b>semisommatore</b> somma due bit: <code>s = a ⊕ b</code> (vale 1 quando sono diversi) e <code>c = a·b</code> (il riporto esce solo se sono entrambi 1). Non accetta riporto entrante, e per questo non basta oltre la posizione meno significativa. Il <b>sommatore completo</b> ha tre ingressi: <code>s = a ⊕ b ⊕ cᵢₙ</code>, cioè 1 quando il numero di ingressi a 1 è dispari, e <code>cₒᵤₜ = a·b + cᵢₙ·(a ⊕ b)</code>. Si costruisce con due semisommatori più una OR. Per il <b>sommatore/sottrattore</b> si sfrutta il fatto che in complemento a 2 <code>A − B = A + <span class=\"ovl\">B</span> + 1</code>: ogni bit di B passa per uno XOR con la linea di controllo <code>Sub</code>, che lo inverte quando vale 1, e la stessa linea entra come riporto iniziale fornendo il «+1». Un solo circuito fa entrambe le operazioni: è la ragione pratica per cui si usa il complemento a 2.",
  },
  {
    id: 'open-comb-01',
    topic: 'comb',
    q: 'Che cosa fanno decodificatore e multiplexer? Come si sintetizza una funzione con un MUX?',
    model:
      "Il <b>decodificatore</b> ha n ingressi e 2ⁿ uscite e ne attiva <b>una sola</b>, quella il cui indice corrisponde al numero presentato: ogni uscita è il mintermine corrispondente. Serve a selezionare una fra molte cose — un chip di memoria, un registro. Il <b>multiplexer</b> fa l'opposto sul lato dati: sceglie uno fra 2ⁿ ingressi in base a n linee di selezione, ed è l'interruttore programmabile del circuito (dentro il processore decide quale sorgente va alla ALU). Per <b>sintetizzare una funzione</b> di n variabili con un MUX a n selezioni si collegano le variabili alle selezioni e si fissa ciascun ingresso dati al valore che la funzione assume in quella riga: gli ingressi dati <i>sono</i> la colonna delle uscite della tabella di verità. Con lo stesso MUX si copre anche una funzione di n+1 variabili, collegando a ogni ingresso dati non una costante ma la variabile residua, il suo complemento, 0 oppure 1.",
  },
  {
    id: 'open-tech-01',
    topic: 'tech',
    q: 'Cosa si intende per ritardo di propagazione in una rete combinatoria formata da più porte in cascata?',
    model:
      "Il <b>ritardo di propagazione</b> di una singola porta è l'intervallo fra l'istante in cui l'ingresso attraversa il 50% dell'escursione e quello in cui l'uscita fa altrettanto: il segnale non commuta istantaneamente perché i transistor devono caricare e scaricare le capacità. Da non confondere con il <b>tempo di transizione</b>, che misura la ripidità del fronte (dal 10% al 90%). Quando più porte sono <b>in cascata</b> i ritardi si <b>sommano</b>: l'uscita finale è valida solo dopo che il segnale ha attraversato l'intera catena, e il ritardo della rete è quello del suo <b>cammino critico</b>, cioè il percorso ingresso→uscita più lento. Due conseguenze: il periodo minimo di clock è dettato dal cammino critico fra due registri più il tempo di setup, e una forma minima a due livelli (AND poi OR) è preferibile anche per velocità, non solo per numero di porte. È lo stesso motivo per cui un ripple-carry a n bit è lento: il riporto attraversa n stadi in fila.",
  },
  {
    id: 'open-io-01',
    topic: 'io',
    q: 'Confronta I/O programmato, guidato da interruzioni e DMA: quando conviene ciascuno?',
    model:
      "Tutti e tre risolvono lo stesso problema — il <b>divario di velocità</b> fra processore e periferiche. Nell'<b>I/O programmato</b> il processore interroga ciclicamente il bit di stato finché il dispositivo non è pronto (polling): semplicissimo da realizzare, ma brucia in un ciclo vuoto tutto il tempo dell'attesa; accettabile solo se il dispositivo è veloce o se non c'è altro da fare. Nell'I/O <b>guidato da interruzioni</b> il processore fa altro ed è il dispositivo a chiamare quando è pronto: si paga il costo del salvataggio dello stato e del cambio di contesto, ma non si spreca attesa — è la scelta normale per dispositivi lenti e sporadici come la tastiera. Con il <b>DMA</b> un controllore dedicato trasferisce da solo un <b>intero blocco</b> fra periferica e memoria, diventando temporaneamente padrone del bus, e manda <b>una sola</b> interruzione alla fine: indispensabile per il disco o la rete, dove un'interruzione per parola sarebbe insostenibile. Il DMA introduce però il problema della <b>coerenza</b>: scrivendo in memoria può rendere obsoleta la copia tenuta in cache.",
  },
  {
    id: 'open-sw-01',
    topic: 'sw',
    q: 'Descrivi il percorso che porta da un sorgente assembly a un programma in esecuzione, nominando gli strumenti coinvolti.',
    model:
      "Quattro passaggi. L'<b>assemblatore</b> traduce il sorgente in codice oggetto: sostituisce i mnemonici con i codici operativi e le etichette con gli indirizzi. Per farlo lavora in <b>due passate</b>, perch\u00e9 un salto in avanti cita un'etichetta non ancora incontrata: nella prima costruisce la <b>tabella dei simboli</b> tenendo un contatore di posizione, nella seconda genera il codice. Le <b>direttive</b> (<code>ORIGIN</code>, <code>DATAWORD</code>, <code>RESERVE</code>, <code>EQU</code>, <code>END</code>) non producono istruzioni: dicono all'assemblatore dove collocare le cose. Il <b>collegatore</b> unisce i moduli oggetto e le librerie, risolvendo i <b>riferimenti esterni</b> — i nomi che un modulo usa ma non definisce — e calcolando la posizione definitiva di ciascun modulo; il collegamento pu\u00f2 essere statico (libreria dentro l'eseguibile) o dinamico (caricata a runtime e condivisa). Il <b>caricatore</b> copia l'eseguibile in memoria, effettua se necessario la <b>rilocazione</b> degli indirizzi assoluti, prepara la pila e salta al punto d'ingresso. Da quel momento il programma \u00e8 in esecuzione e il <b>sistema operativo</b> resta fermo: riprende il controllo solo su chiamata di sistema, interruzione o eccezione.",
  },
  {
    id: 'open-perf-01',
    topic: 'perf',
    q: 'Un processore a frequenza pi\u00f9 alta \u00e8 necessariamente pi\u00f9 veloce? Motiva con l\u2019equazione delle prestazioni.',
    model:
      "No. Il tempo di esecuzione \u00e8 <b>T = (N \u00d7 S) / R</b>, dove N \u00e8 il numero di istruzioni eseguite, S il numero medio di cicli per istruzione e R la frequenza: la frequenza \u00e8 <b>uno solo</b> dei tre fattori. Una macchina a frequenza pi\u00f9 bassa pu\u00f2 risultare pi\u00f9 veloce se esegue meno istruzioni (repertorio pi\u00f9 espressivo o compilatore migliore) o se ha un S pi\u00f9 basso grazie a cache pi\u00f9 efficaci e a una pipeline con meno stalli. I tre fattori inoltre <b>non sono indipendenti</b>: ridurre N con istruzioni pi\u00f9 complesse tende ad alzare S, e alzare R accorcia il periodo obbligando a pipeline pi\u00f9 profonde, quindi a penalit\u00e0 maggiori sui salti. Per questo il confronto ha senso solo <b>a parit\u00e0 di programma</b> e si fa con i <b>benchmark</b> (per esempio le suite SPEC, riassunte con la media geometrica dei rapporti) e non con la frequenza o con i MIPS, che dipendono dal repertorio.",
  },
  {
    id: 'open-perf-02',
    topic: 'perf',
    q: 'Enuncia la legge di Amdahl e spiega perch\u00e9 mette un tetto al guadagno.',
    model:
      "Se una frazione <i>f</i> del tempo di esecuzione viene resa <i>k</i> volte pi\u00f9 veloce, il guadagno complessivo \u00e8 <b>1 / ((1 \u2212 f) + f/k)</b>. Il termine <code>(1 \u2212 f)</code> \u00e8 la parte <b>non</b> migliorata e resta invariato qualunque cosa si faccia: anche portando <i>k</i> all'infinito il guadagno non supera <b>1/(1 \u2212 f)</b>. Se per esempio il 40 % del tempo \u00e8 speso in codice non parallelizzabile, il tetto \u00e8 2,5\u00d7 per quanti core si aggiungano. Le conseguenze pratiche sono due: conviene ottimizzare solo ci\u00f2 che pesa davvero (e quindi <b>misurare prima</b> di ottimizzare), e nel calcolo parallelo l'aumento del numero di processori d\u00e0 rendimenti decrescenti, tanto pi\u00f9 rapidamente quanto pi\u00f9 grande \u00e8 la parte sequenziale e il costo di sincronizzazione.",
  },
];