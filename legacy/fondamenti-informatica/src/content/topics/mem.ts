import type { Topic } from '../types';

export const mem: Topic = {
    id: 'mem',
    title: 'Gerarchia di memoria & cache',
    blurb: 'SRAM/DRAM, località, mappature, politiche di scrittura, tempo medio di accesso.',
    trapIds: ['trap-ram'],
    prereq: ['cpu'],
    diagramIds: ['gerarchia-memoria', 'cache-set-associativa'],
    summary: [
      'La gerarchia esiste perché non si può avere insieme veloce, capiente ed economico: registri, cache L1/L2/L3, memoria centrale, memoria di massa.',
      '<b>SRAM</b>: bistabile, veloce e costosa → cache. <b>DRAM</b>: condensatore, densa ed economica, va <b>rinfrescata</b> → memoria centrale.',
      'La cache funziona per <b>località temporale</b> (ciò che serve ora servirà ancora) e <b>spaziale</b> (serviranno gli indirizzi vicini): per questo si trasferiscono <b>blocchi</b>.',
      'Mappatura <b>diretta</b>, <b>completamente associativa</b>, <b>associativa a gruppi</b>: cambia quante posizioni può occupare un blocco. L\'indirizzo si spezza in <b>etichetta · indice · spiazzamento</b>.',
      'Tempo medio di accesso = hit time + (miss rate × miss penalty). Il miss penalty è enorme: è lì che si perdono le prestazioni.',
      'Scrittura: <b>write-through</b> (semplice, molto traffico) o <b>write-back</b> (bit <i>dirty</i>, si scrive solo allo sfratto).',
    ],
    checks: [
      {
        q: 'Perché la cache trasferisce blocchi e non singole parole?',
        a: 'Per la <b>località spaziale</b>: il costo di un accesso è dominato dalla latenza, non dalla quantità di dati, quindi conviene portarsi dietro le celle vicine, che con ogni probabilità serviranno subito dopo.',
      },
      {
        q: 'Cache da 8 KiB, blocchi da 32 byte, 4 vie, indirizzi a 32 bit: come si spezza l\'indirizzo?',
        a: 'Spiazzamento <b>5 bit</b> (32 = 2⁵). Gruppi = 8192 / (32 × 4) = 64 → indice <b>6 bit</b>. Etichetta = 32 − 5 − 6 = <b>21 bit</b>. I tre campi sommano sempre all\'ampiezza dell\'indirizzo: è il controllo che conviene fare sempre.',
      },
      {
        q: 'A che serve il bit dirty nella politica write-back?',
        a: 'Segna che il blocco in cache è stato modificato e non coincide più con la memoria. Allo sfratto si riscrivono <b>solo</b> i blocchi dirty: gli altri si buttano, perché la copia in memoria è già giusta.',
      },
    ],
    body: `
    <h4>Da dove si parte</h4>
    <p><b>Cosa serve sapere prima:</b> che il processore legge istruzioni e dati dalla memoria tramite MAR e MDR, dal modulo sul <a href="#/study/cpu">processore</a>.</p>
    <p><b>Che problema risolve.</b> Il processore vorrebbe una memoria enorme, velocissima ed economica. Non esiste: le memorie veloci sono piccole e costose, quelle capienti sono lente. Il divario è drammatico — un accesso alla memoria centrale costa decine o centinaia di cicli, durante i quali il processore non fa nulla. La soluzione non è un componente ma un’<b>organizzazione</b>: più livelli di memoria, dal piccolissimo e istantaneo all’enorme e lento, gestiti in modo che il dato che serve si trovi quasi sempre vicino. Funziona per una ragione statistica, non magica: i programmi non accedono alla memoria a caso.</p>
    <p><b>Le parole nuove.</b> La <b>cache</b> è la memoria piccola e veloce interposta fra processore e memoria centrale. Un <b>hit</b> è quando il dato cercato c’è, un <b>miss</b> quando manca; il <b>miss penalty</b> è il tempo perso in quel caso. Un <b>blocco</b> (o linea) è l’unità di trasferimento fra i livelli, tipicamente qualche decina di byte. La <b>località</b> è la tendenza dei programmi a riusare gli stessi dati (temporale) e quelli vicini (spaziale).</p>
    <h4>La gerarchia</h4>
    <p>Scendendo dai registri alla memoria secondaria la capacità cresce e il costo per bit cala, ma il tempo di accesso peggiora di ordini di grandezza:</p>
    <pre>registri  →  cache L1  →  cache L2  →  memoria principale  →  disco
 più veloce, più costosa, più piccola  ⟶  più lenta, più economica, più grande</pre>
    <p>Una sola memoria grande e veloce sarebbe proibitiva per costo e comunque <b>più lenta</b>: indirizzare molte celle allunga la decodifica. Meglio più livelli.</p>

    <h4>SRAM e DRAM</h4>
    <ul>
      <li><b>SRAM</b>: la cella è un latch a transistor. Veloce, <b>non richiede refresh</b>, ma occupa molto spazio e costa: si usa per le cache.</li>
      <li><b>DRAM</b>: la cella è un condensatore con un transistor. Densa ed economica, ma il condensatore si <b>scarica per correnti di dispersione</b> e va <b>rinfrescato</b> periodicamente. È la memoria principale.</li>
    </ul>
    <p>Le DRAM <b>sincrone</b> allineano gli accessi al clock e trasferiscono raffiche di parole consecutive, ammortizzando il costo dell'indirizzamento su tutto il blocco.</p>
    <p>Sulla RAM, attenzione a come la si definisce: la sigla non va tradotta «ad accesso casuale». Il punto è che il <b>tempo di accesso non dipende dalla posizione</b> del dato, a differenza di un nastro o di un disco.</p>

    <h4>Perché la cache funziona: la località</h4>
    <ul>
      <li><b>Temporale</b>: un dato usato di recente sarà probabilmente riusato a breve (le variabili di un ciclo).</li>
      <li><b>Spaziale</b>: se si accede a un indirizzo, quelli vicini saranno probabilmente richiesti a breve (gli elementi di un vettore, le istruzioni in sequenza).</li>
    </ul>
    <p>La località spaziale è il motivo per cui la cache non trasferisce singole parole ma <b>blocchi</b> (linee) di parole contigue.</p>

    <h4>Hit, miss e il costo del miss</h4>
    <ul>
      <li><b>Hit</b>: il dato è in cache, accesso rapido.</li>
      <li><b>Miss</b>: non c'è, si scende nella gerarchia; il ritardo aggiuntivo è la <b>miss penalty</b>.</li>
    </ul>
    <p>Il tempo medio di accesso è quello che conta davvero:</p>
    <pre>t_medio = t_hit + miss_rate × miss_penalty</pre>
    <p>Con un hit rate del 95%, un hit da 1 ns e una penalità da 100 ns si ottiene <code>1 + 0,05·100 = 6 ns</code>: un miss su venti costa già cinque volte il tempo di un hit. Ecco perché anche piccoli miglioramenti dell'hit rate contano molto.</p>

    <h4>Come si mappa un blocco</h4>
    <p>L'indirizzo si scompone in tre campi: <b>tag</b>, <b>indice</b> (quale linea o insieme) e <b>offset</b> (quale parola dentro il blocco).</p>
    <ul>
      <li><b>Diretta</b>: ogni blocco ha una sola linea possibile, scelta dall'indice. Confronto di un solo tag, hardware minimo — ma due blocchi che mappano sulla stessa linea si sfrattano a vicenda anche con la cache semivuota (<b>conflitti</b>).</li>
      <li><b>Completamente associativa</b>: un blocco può andare ovunque. Sfrutta al meglio lo spazio, ma richiede di confrontare il tag con <b>tutte</b> le linee: costosa e più lenta.</li>
      <li><b>Set-associativa a n vie</b>: compromesso. La cache è divisa in insiemi; l'indice sceglie l'insieme, il blocco va in una qualsiasi delle n linee al suo interno. Si confrontano n tag.</li>
    </ul>

    <h4>Sostituzione</h4>
    <p>Quando l'insieme è pieno bisogna sfrattare qualcuno. <b>LRU</b> (least recently used) scarta il blocco non usato da più tempo ed è il più comune, perché aderisce alla località temporale. Alternative: <b>LFU</b> (meno usato in assoluto), FIFO, casuale — più economiche da realizzare, meno efficaci.</p>

    <h4>Politiche di scrittura</h4>
    <ul>
      <li><b>Write-through</b>: si scrive contemporaneamente in cache e in memoria. Semplice e sempre coerente, ma genera molto traffico.</li>
      <li><b>Write-back</b>: si scrive solo in cache e si marca la linea con un <b>dirty bit</b>; la memoria viene aggiornata solo quando la linea è sfrattata. Molto meno traffico, ma la memoria è temporaneamente non aggiornata.</li>
    </ul>

    <h4>Memorie a sola lettura</h4>
    <p><b>ROM</b> scritta in fabbrica; <b>PROM</b> programmabile una volta; <b>EPROM</b> cancellabile con <b>raggi ultravioletti</b>; <b>EEPROM</b> cancellabile <b>elettricamente</b>, byte per byte; <b>Flash</b>, evoluzione della EEPROM che cancella a blocchi. La coppia EPROM/EEPROM è chiesta spesso: il discrimine è UV contro elettrico.</p>
    <h4>Esempio svolto</h4>
    <p><b>Cache da 16 KiB, blocchi da 64 byte, associativa a 2 vie, indirizzi a 32 bit: come si spezza l'indirizzo?</b></p>
    <pre>spiazzamento = log₂(64)                     = <b>6 bit</b>
numero di blocchi = 16384 / 64              = 256
numero di gruppi  = 256 / 2 vie             = 128
indice        = log₂(128)                   = <b>7 bit</b>
etichetta     = 32 − 6 − 7                  = <b>19 bit</b></pre>
    <p>Controllo che vale sempre: 19 + 7 + 6 = 32, cioè i tre campi <b>sommano all'ampiezza dell'indirizzo</b>. Se non torna, c'è un errore prima.</p>
    <p><b>E quanto vale il tempo medio di accesso?</b> Con hit time 1 ciclo, miss rate 4 % e miss penalty 100 cicli:</p>
    <pre>t_medio = 1 + 0,04 × 100 = <b>5 cicli</b></pre>
    <p>Il 4 % di miss quintuplica il tempo medio: è il miss penalty a dominare, non l'hit time. Dimezzare il miss rate al 2 % porta a 3 cicli — un guadagno molto maggiore di qualunque ritocco all'hit time.</p>

    <h4>Errori tipici</h4>
    <ul>
      <li>Confondere il numero di <b>blocchi</b> con quello dei <b>gruppi</b>: con n vie, i gruppi sono i blocchi diviso n, e l'indice si calcola sui gruppi.</li>
      <li>Calcolare lo spiazzamento sul numero di parole invece che di byte, quando la memoria è indirizzata al byte.</li>
      <li>Dimenticare la verifica della somma dei campi: è il controllo che intercetta quasi tutti gli errori di questo esercizio.</li>
    </ul>`,
    exercises: [
      {
        id: 'ex-mem-1',
        level: 'base',
        q: 'Cache da <b>32 KiB</b> a mappatura <b>diretta</b>, blocchi da <b>16 byte</b>, indirizzi a <b>32 bit</b>. Come si spezza l’indirizzo?',
        hint: 'Tre campi, sempre nello stesso ordine: etichetta, indice, spiazzamento. Si parte dal fondo, cioè dallo spiazzamento.',
        solution: `<pre>spiazzamento = log₂(16 byte)              = <b>4 bit</b>
numero di blocchi = 32768 / 16            = 2048
indice = log₂(2048)                       = <b>11 bit</b>
etichetta = 32 − 11 − 4                   = <b>17 bit</b></pre><p>Controllo obbligatorio: 17 + 11 + 4 = 32 ✓, i tre campi sommano all’ampiezza dell’indirizzo.</p><p>Nella mappatura diretta l’indice individua <b>una sola</b> linea possibile, quindi si confronta una sola etichetta: hardware minimo e risposta rapidissima. Il prezzo sono i <b>conflitti</b>: due blocchi con lo stesso indice si sfrattano a vicenda anche se il resto della cache è vuoto.</p>`,
      },
      {
        id: 'ex-mem-2',
        level: 'base',
        q: 'Una cache ha tempo di accesso 2 ns, miss rate 5 % e penalità di miss 80 ns. Qual è il <b>tempo medio di accesso</b>? E se il miss rate scendesse al 2 %?',
        hint: 'Il tempo medio è quello dell’hit più, in proporzione ai miss, la penalità aggiuntiva.',
        solution: `<pre>t_medio = t_hit + miss_rate × miss_penalty

con 5 %:  2 + 0,05 × 80 = 2 + 4 = <b>6 ns</b>
con 2 %:  2 + 0,02 × 80 = 2 + 1,6 = <b>3,6 ns</b></pre><p>Un miss su venti <b>triplica</b> il tempo medio rispetto all’hit. Dimezzare e più il miss rate lo riporta quasi al valore ideale.</p><p>La morale progettuale: conviene molto di più lavorare sul <b>miss rate</b> (cache più grande, più associativa, blocchi di dimensione adeguata) o sulla <b>penalità</b> (cache di secondo livello) che non sull’hit time. E si vede anche perché la memoria virtuale con page fault da milioni di cicli richiede un tasso di fault bassissimo per essere praticabile.</p>`,
      },
      {
        id: 'ex-mem-3',
        level: 'esame',
        q: 'Stessa cache dell’esercizio 1 — 32 KiB, blocchi da 16 byte, indirizzi a 32 bit — ma <b>associativa a 4 vie</b>. Come cambiano i campi? E che problema risolve l’associatività?',
        hint: 'Con n vie l’indice non individua più un blocco ma un <b>gruppo</b> di n blocchi. Conta quanti gruppi ci sono.',
        solution: `<pre>spiazzamento = log₂(16)                   = <b>4 bit</b>   (invariato)
numero di blocchi = 32768 / 16            = 2048
numero di gruppi  = 2048 / 4 vie          = 512
indice = log₂(512)                        = <b>9 bit</b>
etichetta = 32 − 9 − 4                    = <b>19 bit</b></pre><p>Rispetto alla mappatura diretta l’indice <b>perde 2 bit</b> e l’etichetta li guadagna: 19 + 9 + 4 = 32 ✓.</p><p>Il problema risolto sono i <b>conflitti</b>. Con la mappatura diretta due blocchi che condividono l’indice non possono coesistere: un ciclo che accede alternativamente a due indirizzi «sfortunati» produce un miss a ogni accesso, con la cache quasi vuota. Con quattro vie ce ne stanno quattro nello stesso gruppo.</p><p>Il costo: quattro confronti di etichetta in parallelo invece di uno (più hardware, hit time leggermente più alto) e la necessità di una politica di <b>sostituzione</b>, che nella mappatura diretta non serve perché non c’è scelta.</p>`,
      },
      {
        id: 'ex-mem-4',
        level: 'esame',
        q: 'Su 1000 istruzioni, il 20 % sono <code>store</code>. Il miss rate è 5 % e il 30 % dei blocchi sfrattati è <i>dirty</i>. I blocchi sono da 16 byte, le parole da 4. Confronta il <b>traffico verso la memoria</b> con write-through e con write-back.',
        hint: 'Conta separatamente il traffico in lettura (il caricamento dei blocchi dopo un miss, uguale nei due casi) e quello in scrittura, che è ciò che distingue le due politiche.',
        solution: `<pre>LETTURE (uguali nei due casi)
  miss = 1000 × 5 % = 50  →  50 blocchi × 16 B = 800 byte

WRITE-THROUGH: ogni store scrive anche in memoria
  200 store × 4 byte = 800 byte
  traffico totale = 800 + 800 = <b>1600 byte</b>

WRITE-BACK: si riscrive solo il blocco sfrattato se dirty
  50 sfratti × 30 % = 15 blocchi × 16 B = 240 byte
  traffico totale = 800 + 240 = <b>1040 byte</b></pre><p>Il write-back genera qui il <b>35 % di traffico in meno</b>, e il divario cresce quando un blocco viene scritto più volte prima di essere sfrattato: il write-through paga <b>ogni</b> scrittura, il write-back una sola volta per blocco.</p><p>Che cosa si perde: con il write-back la memoria è temporaneamente <b>non aggiornata</b>, il che complica la vita a DMA e multiprocessori (è il problema della coerenza) e rende necessario un bit <i>dirty</i> per ogni blocco.</p>`,
      },
      {
        id: 'ex-mem-5',
        level: 'esame',
        q: 'Cache associativa a <b>2 vie</b> con <b>2 gruppi</b> (quattro blocchi in tutto), politica <b>LRU</b>. Il gruppo si sceglie con «numero di blocco modulo 2». Traccia gli accessi ai blocchi <code>0, 1, 2, 0, 3, 1, 2, 4, 0</code> indicando hit e miss.',
        hint: 'Per ogni accesso: calcola il gruppo, guarda se il blocco c’è, e aggiorna l’ordine di uso. Si sfratta solo quando il gruppo è pieno.',
        solution: `<pre>accesso  gruppo  contenuto dopo        esito
   0       0     g0: [0]               MISS
   1       1     g1: [1]               MISS
   2       0     g0: [0, 2]            MISS
   0       0     g0: [2, 0]            HIT   (0 diventa il più recente)
   3       1     g1: [1, 3]            MISS
   1       1     g1: [3, 1]            HIT
   2       0     g0: [0, 2]            HIT
   4       0     g0: [2, 4]            MISS  → sfratta 0 (meno recente)
   0       0     g0: [4, 0]            MISS  → sfratta 2</pre><p>Bilancio: <b>6 miss e 3 hit</b>. I primi quattro miss sono <i>obbligatori</i> (il blocco non era mai stato caricato); gli ultimi due sono di <b>capacità/conflitto</b>, causati dallo sfratto.</p><p>Nota l’ultimo passaggio: al momento di caricare il blocco 4, nel gruppo 0 c’erano 0 e 2, usati rispettivamente al quarto e al settimo accesso. LRU sfratta il <b>meno recentemente usato</b>, cioè lo 0 — che però viene richiesto subito dopo. È il caso in cui LRU sbaglia previsione: nessuna politica reale può indovinare sempre, perché il futuro non lo conosce.</p>`,
      },
    ],
  };
