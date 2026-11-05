import type { TopicId } from './types';

/**
 * Le definizioni che l'esame chiede di saper enunciare.
 *
 * Regola di scrittura: `short` è **una frase**, quella che scriveresti sul
 * foglio. `detail` aggiunge la precisazione che fa la differenza fra una
 * risposta sufficiente e una giusta. Se una voce non sta in una frase, non è
 * una definizione: è un modulo di studio.
 */
export interface Definition {
  id: string;
  term: string;
  short: string;
  detail?: string;
  topic: TopicId;
}

export const definitions: Definition[] = [
  // ── numeri ──
  {
    id: 'def-cp2',
    term: 'Complemento a 2',
    short:
      'Rappresentazione con segno in cui il negativo di x si ottiene invertendo tutti i bit di x e sommando 1.',
    detail:
      'Il bit più significativo ha peso <b>negativo</b> (−2ᴺ⁻¹). Ha una sola codifica dello zero e intervallo asimmetrico: da −2ᴺ⁻¹ a +2ᴺ⁻¹−1.',
    topic: 'bin',
  },
  {
    id: 'def-overflow',
    term: 'Overflow',
    short: 'Il risultato di un’operazione esce dall’intervallo rappresentabile con i bit disponibili.',
    detail:
      'In CP2 si verifica sommando due operandi <b>concordi</b> e ottenendo segno opposto; in hardware è lo <b>XOR fra riporto entrante e uscente</b> dal bit di segno. Il solo riporto uscente non è overflow.',
    topic: 'bin',
  },
  {
    id: 'def-estensione-segno',
    term: 'Estensione del segno',
    short: 'Portare un numero in CP2 su più bit replicando a sinistra il bit di segno.',
    topic: 'bin',
  },
  {
    id: 'def-posizionale',
    term: 'Notazione posizionale',
    short: 'Notazione in cui il valore di una cifra dipende dalla posizione, che pesa una potenza della base.',
    detail: 'Richiede b simboli e, indispensabile, uno <b>zero</b> per indicare la posizione vuota.',
    topic: 'bin',
  },

  // ── logica ──
  {
    id: 'def-completo',
    term: 'Insieme funzionalmente completo',
    short: 'Insieme di operatori con cui si può esprimere qualunque funzione booleana.',
    detail:
      '{AND, OR} <b>non</b> lo è: manca la negazione. NAND da solo e NOR da solo lo sono.',
    topic: 'bool',
  },
  {
    id: 'def-demorgan',
    term: 'Teoremi di De Morgan',
    short:
      'La negazione di un prodotto è la somma delle negazioni, e la negazione di una somma è il prodotto delle negazioni.',
    detail: 'Valgono anche per più di due fattori.',
    topic: 'bool',
  },
  {
    id: 'def-mintermine',
    term: 'Mintermine',
    short:
      'Prodotto in cui compaiono tutte le variabili, dirette o negate, corrispondente a una riga della tabella di verità.',
    detail: 'La somma dei mintermini delle righe a 1 è la forma canonica SOP.',
    topic: 'bool',
  },
  {
    id: 'def-sop',
    term: 'SOP (somma di prodotti)',
    short: 'Espressione formata da termini prodotto messi in OR.',
    topic: 'bool',
  },
  {
    id: 'def-implicante',
    term: 'Implicante primo',
    short: 'Gruppo valido di 1 nella mappa che non può essere ingrandito ulteriormente.',
    detail:
      'È <b>essenziale</b> se copre almeno un 1 che nessun altro implicante primo copre: quelli vanno presi per forza.',
    topic: 'karnaugh',
  },
  {
    id: 'def-indifferenza',
    term: 'Condizione di indifferenza',
    short: 'Combinazione d’ingresso che non si presenta mai, o la cui uscita è irrilevante.',
    detail:
      'Si prende a 1 solo quando allarga un gruppo, e si valuta <b>una per una</b>: mai coprirne una da sola.',
    topic: 'karnaugh',
  },

  // ── reti combinatorie e tempi ──
  {
    id: 'def-decoder',
    term: 'Decodificatore',
    short: 'Rete con n ingressi e 2ⁿ uscite che attiva la sola uscita corrispondente al numero in ingresso.',
    topic: 'comb',
  },
  {
    id: 'def-mux',
    term: 'Multiplexer',
    short: 'Rete che porta in uscita uno fra 2ⁿ ingressi dati, scelto da n linee di selezione.',
    detail: 'Con n selezioni realizza qualunque funzione di n variabili: gli ingressi dati sono la colonna delle uscite.',
    topic: 'comb',
  },
  {
    id: 'def-tristate',
    term: 'Buffer tri-state',
    short:
      'Buffer la cui uscita, oltre a 0 e 1, può assumere lo stato di alta impedenza, scollegandosi dal filo.',
    detail: 'È ciò che permette a più dispositivi di condividere un bus senza cortocircuitarsi.',
    topic: 'comb',
  },
  {
    id: 'def-ritardo',
    term: 'Ritardo di propagazione',
    short:
      'Tempo che intercorre fra l’istante in cui l’ingresso attraversa il 50% dell’escursione e quello in cui lo fa l’uscita.',
    detail:
      'In una cascata di porte i ritardi si <b>sommano</b>: il ritardo della rete è quello del <b>cammino critico</b>, il percorso più lento, ed è lui a fissare il periodo minimo di clock.',
    topic: 'tech',
  },
  {
    id: 'def-fanout',
    term: 'Fan-out',
    short: 'Numero di ingressi di altre porte che una singola uscita può pilotare.',
    topic: 'tech',
  },

  // ── aritmetica ──
  {
    id: 'def-fulladder',
    term: 'Sommatore completo',
    short:
      'Rete a tre ingressi (due addendi e il riporto entrante) che produce somma e riporto uscente.',
    detail: 's = a ⊕ b ⊕ c<sub>in</sub>; c<sub>out</sub> = a·b + c<sub>in</sub>·(a ⊕ b).',
    topic: 'arith',
  },
  {
    id: 'def-ripple',
    term: 'Sommatore ripple-carry',
    short: 'Sommatori completi in cascata, con il riporto che si propaga da uno stadio al successivo.',
    detail: 'Semplice, ma il ritardo cresce linearmente col numero di bit.',
    topic: 'arith',
  },
  {
    id: 'def-lookahead',
    term: 'Carry-lookahead',
    short:
      'Tecnica che calcola tutti i riporti in parallelo dalle funzioni di generazione e propagazione, invece di aspettarli.',
    detail: 'G = a·b (genera), P = a ⊕ b (propaga), c<sub>i+1</sub> = G<sub>i</sub> + P<sub>i</sub>·c<sub>i</sub>.',
    topic: 'arith',
  },

  // ── sequenziali ──
  {
    id: 'def-flipflop',
    term: 'Flip-flop',
    short: 'Elemento bistabile che memorizza un bit e commuta solo sul fronte del clock.',
    detail: 'Il <b>latch</b> è invece sensibile al livello: mentre l’abilitazione è alta resta trasparente.',
    topic: 'ff',
  },
  {
    id: 'def-masterslave',
    term: 'Master-slave',
    short:
      'Due latch in serie con clock opposti, mai trasparenti insieme, così l’uscita cambia in un solo istante.',
    detail: 'Evita le corse e le inconsistenze di lettura-scrittura sui registri.',
    topic: 'ff',
  },
  {
    id: 'def-setup',
    term: 'Tempo di setup',
    short: 'Intervallo in cui il dato deve essere già stabile prima del fronte di clock.',
    topic: 'ff',
  },

  // ── processore ──
  {
    id: 'def-pc',
    term: 'Program Counter (PC)',
    short: 'Registro che contiene l’indirizzo della prossima istruzione da prelevare.',
    detail: 'Si incrementa subito dopo il prelievo; i salti lo sovrascrivono.',
    topic: 'cpu',
  },
  {
    id: 'def-ir',
    term: 'Instruction Register (IR)',
    short: 'Registro che trattiene l’istruzione prelevata durante la decodifica.',
    topic: 'cpu',
  },
  {
    id: 'def-marmdr',
    term: 'MAR e MDR',
    short:
      'Registri d’interfaccia verso la memoria: MAR contiene l’indirizzo, MDR il dato in transito.',
    topic: 'cpu',
  },
  {
    id: 'def-rtn',
    term: 'RTN',
    short:
      'Notazione dei trasferimenti fra registri, in cui le parentesi quadre significano «contenuto di».',
    detail: '<code>Add R1,R2,R3</code> → <code>R1 ← [R2]+[R3]</code>: la destinazione non ha parentesi.',
    topic: 'cpu',
  },
  {
    id: 'def-controllo',
    term: 'Unità di controllo cablata / microprogrammata',
    short:
      'Cablata: rete sequenziale su misura, veloce ma rigida. Microprogrammata: segnali letti da una memoria di controllo, flessibile ma più lenta.',
    topic: 'cpu',
  },

  // ── ISA ──
  {
    id: 'def-risc',
    term: 'RISC',
    short:
      'Architettura con istruzioni semplici di lunghezza fissa e modello load/store: solo Load e Store toccano la memoria.',
    topic: 'isa',
  },
  {
    id: 'def-cisc',
    term: 'CISC',
    short:
      'Architettura con istruzioni complesse di lunghezza variabile, che possono operare direttamente su operandi in memoria.',
    topic: 'isa',
  },
  {
    id: 'def-indicizzato',
    term: 'Indirizzamento indicizzato',
    short: 'L’indirizzo dell’operando è la somma di un registro base e di uno spiazzamento costante.',
    topic: 'isa',
  },
  {
    id: 'def-pila',
    term: 'Pila (stack)',
    short:
      'Struttura LIFO in memoria, gestita dallo stack pointer, su cui viaggiano indirizzo di ritorno, parametri e variabili locali.',
    detail: 'È ciò che rende possibili annidamento e ricorsione, che il solo link register non regge.',
    topic: 'isa',
  },
  {
    id: 'def-linker',
    term: 'Compilatore, linker, loader',
    short:
      'Il compilatore traduce in linguaggio macchina, il linker combina i file oggetto risolvendo i riferimenti esterni, il loader porta il programma in memoria.',
    topic: 'isa',
  },

  // ── interruzioni e I/O ──
  {
    id: 'def-interruzione',
    term: 'Interruzione',
    short:
      'Segnale hardware asincrono, generato da un dispositivo esterno sulle linee di controllo del bus.',
    detail: 'Il processore termina l’istruzione in corso, salva lo stato ed esegue la ISR.',
    topic: 'irq',
  },
  {
    id: 'def-eccezione',
    term: 'Eccezione',
    short:
      'Evento sincrono generato dal processore durante l’esecuzione: divisione per zero, overflow, codice illegale, chiamata di sistema.',
    detail: 'Sincrona significa riproducibile: rieseguendo lo stesso programma si ripresenta nello stesso punto.',
    topic: 'irq',
  },
  {
    id: 'def-isr',
    term: 'ISR',
    short: 'Routine di servizio eseguita in risposta a un’interruzione.',
    topic: 'irq',
  },
  {
    id: 'def-vettorializzata',
    term: 'Interruzione vettorializzata',
    short:
      'Il dispositivo fornisce un identificatore con cui si indicizza la tabella dei vettori e si salta direttamente alla routine giusta.',
    topic: 'irq',
  },
  {
    id: 'def-dma',
    term: 'DMA',
    short:
      'Trasferimento di un blocco fra periferica e memoria eseguito da un controllore dedicato, senza impegnare il processore.',
    detail: 'Genera una sola interruzione a fine blocco, ma può rendere obsoleta la copia in cache.',
    topic: 'io',
  },
  {
    id: 'def-memorymapped',
    term: 'I/O memory-mapped',
    short:
      'I registri delle interfacce occupano indirizzi dello spazio di memoria e si usano con Load e Store.',
    topic: 'io',
  },
  {
    id: 'def-handshake',
    term: 'Handshake',
    short:
      'Scambio di segnali «dato valido» / «preso» che sincronizza due dispositivi senza clock comune.',
    detail: 'Il trasferimento procede al passo del più lento dei due.',
    topic: 'io',
  },
  {
    id: 'def-buffer',
    term: 'Buffer',
    short: 'Memoria intermedia che compensa la differenza di velocità fra due dispositivi.',
    topic: 'io',
  },

  // ── pipeline ──
  {
    id: 'def-pipeline',
    term: 'Pipelining',
    short:
      'Sovrapposizione delle fasi di istruzioni diverse su stadi hardware distinti, come in una catena di montaggio.',
    detail: 'Non migliora la latenza della singola istruzione: migliora il <b>throughput</b>.',
    topic: 'pipe',
  },
  {
    id: 'def-hazard',
    term: 'Hazard',
    short:
      'Situazione che impedisce alla pipeline di procedere di un’istruzione per ciclo: strutturale, sui dati o di controllo.',
    topic: 'pipe',
  },
  {
    id: 'def-forwarding',
    term: 'Operand forwarding',
    short:
      'Inoltro del risultato direttamente dall’uscita della ALU allo stadio che lo richiede, senza attendere la scrittura in registro.',
    topic: 'pipe',
  },
  {
    id: 'def-cpi',
    term: 'CPI',
    short: 'Numero medio di cicli di clock per istruzione; compare nell’equazione T = (N × S)/R.',
    topic: 'pipe',
  },

  // ── memoria ──
  {
    id: 'def-ram',
    term: 'RAM',
    short:
      'Memoria in cui il tempo di accesso a un dato <b>non dipende dalla sua posizione</b>.',
    detail:
      'Da non tradurre «ad accesso casuale»: la definizione richiesta è quella sul tempo di accesso, contrapposta a nastri e dischi.',
    topic: 'mem',
  },
  {
    id: 'def-localita',
    term: 'Località temporale e spaziale',
    short:
      'Temporale: un dato usato di recente sarà riusato a breve. Spaziale: si accederà presto a indirizzi vicini.',
    detail: 'La località spaziale è il motivo per cui la cache trasferisce blocchi e non singole parole.',
    topic: 'mem',
  },
  {
    id: 'def-hitmiss',
    term: 'Cache hit / miss',
    short: 'Hit: il dato cercato è in cache. Miss: non c’è e va recuperato dal livello inferiore.',
    topic: 'mem',
  },
  {
    id: 'def-misspenalty',
    term: 'Miss penalty',
    short: 'Ritardo aggiuntivo pagato quando un accesso fallisce in cache.',
    detail: 'Tempo medio di accesso = t<sub>hit</sub> + miss rate × miss penalty.',
    topic: 'mem',
  },
  {
    id: 'def-mappature',
    term: 'Mappature della cache',
    short:
      'Diretta: una sola linea possibile. Associativa: qualunque linea. Set-associativa: insieme fisso, linea libera al suo interno.',
    topic: 'mem',
  },
  {
    id: 'def-lru',
    term: 'LRU',
    short: 'Politica di sostituzione che scarta il blocco non usato da più tempo.',
    topic: 'mem',
  },
  {
    id: 'def-writeback',
    term: 'Write-back / write-through',
    short:
      'Write-through scrive subito anche in memoria; write-back solo allo sfratto della linea, marcata da un dirty bit.',
    topic: 'mem',
  },
  {
    id: 'def-sramdram',
    term: 'SRAM e DRAM',
    short:
      'SRAM: cella a latch, veloce, senza refresh, usata per le cache. DRAM: cella a condensatore, densa ed economica, da rinfrescare.',
    topic: 'mem',
  },

  // ── memoria virtuale ──
  {
    id: 'def-memoriavirtuale',
    term: 'Memoria virtuale',
    short:
      'Meccanismo che dà a ogni processo uno spazio di indirizzi logico proprio, mappato sulla memoria fisica e sul disco.',
    topic: 'vm',
  },
  {
    id: 'def-tlb',
    term: 'TLB',
    short: 'Piccola cache delle traduzioni pagina→frame usate di recente.',
    detail: 'Senza, ogni accesso ne costerebbe due: uno per la tabella delle pagine e uno per il dato.',
    topic: 'vm',
  },
  {
    id: 'def-pagefault',
    term: 'Page fault',
    short:
      'Eccezione sollevata quando la pagina richiesta non è in memoria: il sistema la carica da disco e riesegue l’istruzione.',
    topic: 'vm',
  },

  // ── virgola mobile ──
  {
    id: 'def-ieee754',
    term: 'IEEE 754',
    short:
      'Standard della virgola mobile: segno, esponente polarizzato e mantissa con bit implicito.',
    detail: 'Singola precisione: 1 + 8 + 23 bit, bias 127. Doppia: 1 + 11 + 52, bias 1023.',
    topic: 'ieee',
  },
  {
    id: 'def-bias',
    term: 'Esponente polarizzato (bias)',
    short:
      'Esponente memorizzato come valore reale + bias, così da rappresentare esponenti negativi senza un secondo segno.',
    topic: 'ieee',
  },
  // ── software e prestazioni ──
  {
    id: 'def-tabella-simboli',
    term: 'Tabella dei simboli',
    short:
      'Struttura costruita dall\u2019assemblatore nella prima passata, che associa a ogni etichetta l\u2019indirizzo a cui corrisponde.',
    detail:
      '\u00c8 la ragione per cui servono <b>due passate</b>: senza, un salto in avanti non potrebbe essere tradotto, perch\u00e9 cita un\u2019etichetta non ancora incontrata.',
    topic: 'sw',
  },
  {
    id: 'def-riferimento-esterno',
    term: 'Riferimento esterno',
    short:
      'Nome che un modulo usa ma non definisce: resta un \u00abbuco\u00bb nel codice oggetto finch\u00e9 il collegatore non lo risolve.',
    topic: 'sw',
  },
  {
    id: 'def-rilocazione',
    term: 'Rilocazione',
    short:
      'Correzione degli indirizzi assoluti di un programma quando viene caricato a un indirizzo diverso da quello previsto.',
    detail:
      'Con la <b>memoria virtuale</b> il problema quasi sparisce: ogni processo vede sempre lo stesso spazio virtuale, indipendentemente da dove si trovi in memoria fisica.',
    topic: 'sw',
  },
  {
    id: 'def-chiamata-sistema',
    term: 'Chiamata di sistema',
    short:
      'Richiesta di un servizio al sistema operativo, che fa passare il processore in modalit\u00e0 supervisore attraverso un punto d\u2019ingresso controllato.',
    detail:
      '\u00c8 uno dei <b>tre</b> soli modi in cui il sistema operativo riprende il controllo, insieme a interruzione ed eccezione.',
    topic: 'sw',
  },
  {
    id: 'def-equazione-prestazioni',
    term: 'Equazione delle prestazioni',
    short:
      'Il tempo di esecuzione vale T = (N \u00d7 S) / R: istruzioni eseguite, per cicli medi per istruzione, diviso la frequenza di clock.',
    detail:
      'I tre fattori non sono indipendenti: ridurre N con istruzioni pi\u00f9 complesse alza S, e alzare R obbliga a pipeline pi\u00f9 profonde. La sola frequenza <b>non</b> misura le prestazioni.',
    topic: 'perf',
  },
  {
    id: 'def-amdahl',
    term: 'Legge di Amdahl',
    short:
      'Migliorando di un fattore k una frazione f del tempo, il guadagno complessivo \u00e8 1 / ((1 \u2212 f) + f/k).',
    detail:
      'La parte non migliorata mette un <b>tetto</b> invalicabile: con f = 0,6 non si supera 2,5\u00d7 nemmeno con k infinito.',
    topic: 'perf',
  },
  {
    id: 'def-benchmark',
    term: 'Benchmark',
    short:
      'Programma reale usato per confrontare macchine, con il risultato espresso come rapporto rispetto a una macchina di riferimento.',
    detail:
      'Le suite SPEC riassumono i punteggi con la <b>media geometrica</b>, che a differenza di quella aritmetica non cambia ordinamento al cambiare della macchina di riferimento.',
    topic: 'perf',
  },
  {
    id: 'def-coerenza-cache',
    term: 'Coerenza delle cache',
    short:
      'Garanzia che tutte le copie di uno stesso blocco nelle cache dei vari core rappresentino lo stesso valore.',
    detail:
      'I protocolli di <i>snooping</i> fanno sorvegliare il bus a ogni cache: quando un core scrive un blocco, le altre copie vengono invalidate. Lo stesso problema lo crea il <b>DMA</b>, che scrive in memoria alle spalle del processore.',
    topic: 'perf',
  },
];