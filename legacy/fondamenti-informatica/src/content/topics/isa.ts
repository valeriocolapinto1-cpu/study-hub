import type { Topic } from '../types';

export const isa: Topic = {
    id: 'isa',
    title: 'RISC vs CISC, indirizzamento & assembly',
    blurb: 'ISA, modi di indirizzamento, RTN, sottoprogrammi e pile.',
    trapIds: ['trap-rtn'],
    prereq: ['cpu'],
    summary: [
      '<b>RISC</b>: istruzioni di lunghezza fissa, solo load/store accedono alla memoria, molti registri. <b>CISC</b>: istruzioni di lunghezza variabile, operandi in memoria, microcodice.',
      'Modi di indirizzamento da riconoscere: immediato, a registro, diretto, indiretto, <b>base + spiazzamento</b>, indicizzato, relativo al PC.',
      'I salti condizionati leggono i <b>flag</b> (Z, N, V, C) oppure confrontano direttamente due registri.',
      'Sottoprogrammi: l\'indirizzo di ritorno va in un registro o sulla <b>pila</b>; la pila serve anche a parametri, variabili locali e salvataggio dei registri.',
      '<b>Big-endian / little-endian</b>: ordine dei byte dentro la parola. Conta quando si leggono dati scritti da un\'altra macchina.',
    ],
    checks: [
      {
        q: 'Che cosa fa <code>Load R1, 20(R2)</code>?',
        a: 'È base + spiazzamento: calcola l\'indirizzo <code>[R2] + 20</code> e carica in R1 il <b>contenuto</b> di quella cella. R2 non viene modificato, e lo spiazzamento è una costante nell\'istruzione.',
      },
      {
        q: 'Perché i RISC usano istruzioni di lunghezza fissa?',
        a: 'Perché prelievo e decodifica diventano regolari: ogni istruzione occupa lo stesso spazio e i campi stanno sempre nelle stesse posizioni. È la condizione che rende efficiente la pipeline.',
      },
      {
        q: 'Perché l\'indirizzo di ritorno finisce sulla pila e non sempre in un registro?',
        a: 'Con le chiamate annidate un singolo registro verrebbe sovrascritto dalla seconda chiamata. La pila, essendo LIFO, conserva un indirizzo di ritorno per ogni livello di annidamento.',
      },
    ],
    body: `
    <h4>Da dove si parte</h4>
    <p><b>Cosa serve sapere prima:</b> com’è fatto un processore e che cosa sono PC, IR e registri generali, dal modulo sul <a href="#/study/cpu">processore</a>.</p>
    <p><b>Che problema risolve.</b> Il processore esegue istruzioni: ma <i>quali</i>? Quante ne servono, come si scrivono, come si dice a un’istruzione dove prendere i dati? L’<b>architettura del repertorio di istruzioni</b> è il contratto fra hardware e software: tutto ciò che un programmatore deve sapere della macchina, e tutto ciò che il costruttore si impegna a mantenere. È il livello a cui si decide se avere poche istruzioni semplici o molte complesse — la contrapposizione RISC/CISC.</p>
    <p><b>Le parole nuove.</b> Un <b>mnemonico</b> è il nome leggibile di un’istruzione (<code>Add</code>) al posto del suo codice binario. Il <b>codice operativo</b> (opcode) è il campo che dice quale operazione è. Un <b>modo di indirizzamento</b> è la regola con cui l’istruzione indica dove sta un operando: il valore stesso, un registro, una cella, o un calcolo. La <b>pila</b> (stack) è un’area di memoria gestita con la regola «ultimo entrato, primo uscito», usata per le chiamate di procedura.</p>
    <h4>RISC</h4>
    <ul>
      <li>Istruzioni semplici, di <b>lunghezza fissa</b> (una parola): la decodifica è immediata e il prelievo prevedibile.</li>
      <li>Modello <b>load/store</b>: solo <code>Load</code> e <code>Store</code> toccano la memoria; tutte le altre operano fra registri. Niente operazioni memoria-memoria.</li>
      <li>Pochi modi di indirizzamento, molti registri generali.</li>
      <li>Il compilatore fa più lavoro, l'hardware meno: circuito veloce e adatto alla pipeline. Esempi: ARM, Nios II.</li>
    </ul>

    <h4>CISC</h4>
    <ul>
      <li>Istruzioni complesse, di <b>lunghezza variabile</b>; una sola istruzione può leggere dalla memoria, calcolare e riscrivere.</li>
      <li>Molti modi di indirizzamento; programmi più corti in numero di istruzioni.</li>
      <li>Decodifica onerosa e durata variabile: la pipeline è più difficile da riempire. Esempi: Intel IA-32, ColdFire.</li>
    </ul>
    <p>Il confronto giusto non è «quale è più veloce» ma <b>dove si sposta la complessità</b>: nel compilatore (RISC) o nell'hardware (CISC).</p>

    <h4>Modi di indirizzamento</h4>
    <p>Rispondono alla domanda: dove sta l'operando?</p>
    <ul>
      <li><b>Immediato</b> — il valore è nell'istruzione. <code>Move R1, #5</code> → <code>R1 ← 5</code></li>
      <li><b>Registro</b> — l'operando è in un registro. <code>Move R1, R2</code> → <code>R1 ← [R2]</code></li>
      <li><b>Assoluto/diretto</b> — l'istruzione contiene l'indirizzo. <code>Load R1, LOC</code> → <code>R1 ← [LOC]</code></li>
      <li><b>Indiretto da registro</b> — il registro contiene l'indirizzo. <code>Load R1, (R2)</code> → <code>R1 ← [[R2]]</code></li>
      <li><b>Indicizzato / base+spiazzamento</b> — indirizzo = registro + costante. <code>Load R1, 8(R2)</code> → <code>R1 ← [[R2]+8]</code>. È il modo con cui si accede ai campi di una struttura e agli elementi di un vettore.</li>
      <li><b>Autoincremento / autodecremento</b> — come l'indiretto, ma il registro avanza da solo dopo (o prima) dell'accesso: scorre un vettore senza istruzioni aggiuntive.</li>
      <li><b>Relativo al PC</b> — indirizzo = PC + spiazzamento. Usato dai salti, rende il codice rilocabile.</li>
    </ul>

    <h4>Salti e condizioni</h4>
    <p>Un salto <b>incondizionato</b> sovrascrive il PC. Un salto <b>condizionato</b> lo fa solo se una condizione sui flag è verificata: tipicamente si esegue prima un <code>CMP</code> (una sottrazione che aggiorna i flag senza salvare il risultato) e poi un <code>BEQ</code>, <code>BGT</code>, <code>BLT</code>… Il confronto e il salto sono due istruzioni distinte.</p>

    <h4>Sottoprogrammi</h4>
    <p>Una chiamata deve ricordare <b>dove tornare</b>. Due meccanismi:</p>
    <ul>
      <li><b>Link register</b>: l'istruzione di chiamata salva il PC di ritorno in un registro dedicato. Rapido, ma un solo livello: se la subroutine ne chiama un'altra, il valore viene sovrascritto.</li>
      <li><b>Pila</b>: l'indirizzo di ritorno viene impilato. Supporta <b>annidamento e ricorsione</b>, che il solo link register non regge.</li>
    </ul>

    <h4>La pila</h4>
    <p>Struttura LIFO in memoria, gestita dallo <b>stack pointer</b> (SP) che punta alla cima. Cresce tipicamente verso gli indirizzi <b>bassi</b>:</p>
    <pre><span class="cm">; push di R1</span>
      Sub  SP, SP, #4
      Store R1, (SP)
<span class="cm">; pop in R1</span>
      Load R1, (SP)
      Add  SP, SP, #4</pre>
    <p>Sulla pila viaggiano indirizzo di ritorno, parametri, variabili locali e i registri che la subroutine deve preservare: l'insieme si chiama <b>record di attivazione</b>.</p>

    <h4>Un programma completo</h4>
    <pre><span class="cm">; moltiplicazione tramite somme successive (stile RISC)</span>
      Load  LOC1, NUM1
      Load  LOC2, NUM2
      Clear LOC3
<span class="lb">CICLO:</span> Sub   LOC2, LOC2, 1
      Add   LOC3, LOC3, LOC1
      Branch_if_[LOC2]&gt;0  CICLO
      Store LOC3, RES</pre>
    <p>Da leggere così: si azzera l'accumulatore, si somma il moltiplicando tante volte quanto vale il moltiplicatore, decrementando il contatore a ogni giro. Il salto è <b>in coda</b>, quindi il corpo viene eseguito almeno una volta.</p>

    <h4>Ordinamento dei byte</h4>
    <p><b>Big endian</b>: il byte più significativo all'indirizzo più basso — il bit di segno si trova quindi all'inizio. <b>Little endian</b>: il meno significativo per primo. Conta quando si scambiano dati fra macchine diverse o si accede a una parola byte per byte.</p>

    <h4>Dalla sorgente all'esecuzione</h4>
    <p>Il <b>compilatore</b> traduce in linguaggio macchina producendo file oggetto; il <b>linker</b> li combina risolvendo i riferimenti esterni; il <b>loader</b> porta il programma in memoria applicando lo spiazzamento necessario. Sono tre passaggi distinti, e all'esame vengono chiesti separatamente.</p>
    <h4>Esempio svolto</h4>
    <p><b>Somma dei primi n elementi di un vettore</b>, con i modi di indirizzamento evidenziati:</p>
    <pre>      Move  R2, #NUM      ; <b>immediato</b>: R2 ← indirizzo del vettore
      Move  R3, N         ; <b>diretto</b>: R3 ← contenuto della cella N
      Clear R1
CICLO: Add   R1, (R2)      ; <b>indiretto</b>: R1 ← [R1] + contenuto puntato da R2
      Add   R2, #4        ; avanza di una parola
      Sub   R3, #1
      Branch&gt;0 CICLO      ; <b>relativo al PC</b>
      Move  SOMMA, R1</pre>
    <p>Quattro modi diversi in sette righe, ed è questo che l'esame vuole vedere riconosciuto. Attenzione alla differenza fra <code>#NUM</code> (l'<b>indirizzo</b>) e <code>NUM</code> (il <b>contenuto</b>): è l'errore che costa più punti in assoluto.</p>
    <p>Con l'indirizzamento base+spiazzamento le due righe centrali diventano una sola, usando un indice che cresce: <code>Add R1, VETT(R2)</code> con <code>R2</code> che avanza di 4.</p>

    <h4>Errori tipici</h4>
    <ul>
      <li>Confondere indirizzo e contenuto: <code>Move R2, #NUM</code> mette in R2 <b>l'indirizzo</b>; senza cancelletto ci mette il valore contenuto lì.</li>
      <li>Avanzare il puntatore di 1 invece che della dimensione della parola (4 byte se le parole sono a 32 bit e la memoria è indirizzata al byte).</li>
      <li>Dimenticare di inizializzare l'accumulatore, o mettere il salto <b>prima</b> dell'aggiornamento del contatore.</li>
    </ul>`,
    exercises: [
      {
        id: 'ex-isa-1',
        level: 'base',
        q: 'Per ciascuna istruzione, di’ quale <b>modo di indirizzamento</b> usa e che cosa finisce in R1: <code>Move R1,#5</code> · <code>Move R1,5</code> · <code>Move R1,(R2)</code> · <code>Move R1,20(R2)</code> · <code>Move R1,(R2)+</code>.',
        hint: 'La domanda da farsi ogni volta è: il campo scritto nell’istruzione è il <b>dato</b>, l’<b>indirizzo del dato</b>, o l’indirizzo di dove sta l’indirizzo?',
        solution: `<pre>Move R1, #5       <b>immediato</b>   → R1 = 5 (la costante è nell'istruzione)
Move R1, 5        <b>diretto</b>      → R1 = contenuto della cella 5
Move R1, (R2)     <b>indiretto</b>    → R1 = contenuto della cella il cui
                                 indirizzo sta in R2
Move R1, 20(R2)   <b>base+spiazz.</b> → R1 = contenuto della cella [R2]+20;
                                 R2 non cambia
Move R1, (R2)+    <b>autoincremento</b> → come l'indiretto, ma dopo l'accesso
                                 R2 avanza alla parola successiva</pre><p>Il cancelletto è la differenza fra <i>il numero 5</i> e <i>quello che c’è nella casella 5</i>. L’autoincremento esiste perché scorrere un vettore è l’operazione più frequente in assoluto: risparmia un’istruzione di somma a ogni giro.</p>`,
      },
      {
        id: 'ex-isa-2',
        level: 'base',
        q: 'Traduci in assembly questo ciclo: <code>somma = 0; for (i = 0; i &lt; 10; i++) somma += i;</code>',
        hint: 'Servono due registri (accumulatore e contatore) e un salto condizionato in coda. Occhio a dove metti il confronto.',
        solution: `<pre>      Clear  R1              ; R1 = somma
      Clear  R2              ; R2 = i
CICLO: Add    R1, R1, R2      ; somma += i
      Add    R2, R2, #1      ; i++
      Cmp    R2, #10
      Branch&lt;  CICLO         ; se i &lt; 10 ripeti
      Move   SOMMA, R1</pre><p>Il salto è <b>in coda</b>, quindi il corpo viene eseguito almeno una volta: qui va bene perché il ciclo parte da i = 0 e deve girare di sicuro. Se il numero di iterazioni potesse essere zero, servirebbe un controllo anche <b>prima</b> del corpo.</p><p>Il risultato è 0+1+…+9 = 45. Un modo per verificare a mente una traduzione è sempre questo: eseguirla su un caso piccolo e confrontare con la formula.</p>`,
      },
      {
        id: 'ex-isa-3',
        level: 'esame',
        q: 'Scrivi un programma che trova il <b>valore massimo</b> in un vettore di N interi che comincia all’indirizzo <code>VETT</code>.',
        hint: 'Un registro tiene il massimo provvisorio, inizializzato al primo elemento; poi si scorre confrontando. Ricorda di avanzare il puntatore della dimensione della parola.',
        solution: `<pre>      Move   R2, #VETT       ; puntatore al vettore
      Move   R3, N           ; quanti elementi
      Move   R1, (R2)        ; massimo provvisorio = primo elemento
      Add    R2, R2, #4      ; passa al secondo
      Sub    R3, R3, #1      ; ne resta uno in meno da esaminare

CICLO: Move   R4, (R2)        ; elemento corrente
      Cmp    R4, R1
      Branch≤ AVANTI         ; se non è maggiore, lascia stare
      Move   R1, R4          ; nuovo massimo
AVANTI: Add    R2, R2, #4
      Sub    R3, R3, #1
      Branch&gt;0 CICLO

      Move   MAX, R1</pre><p>Tre punti che l’esame guarda: il massimo è inizializzato al <b>primo elemento</b> e non a zero (altrimenti su un vettore tutto negativo la risposta sarebbe sbagliata); il puntatore avanza di <b>4</b> perché le parole sono a 32 bit su memoria indirizzata al byte; il contatore parte da N−1 perché il primo elemento è già stato consumato.</p>`,
      },
      {
        id: 'ex-isa-4',
        level: 'esame',
        q: 'Il programma A chiama la procedura B, che a sua volta chiama C. Mostra come cambia la <b>pila</b> e spiega perché non basterebbe un registro per l’indirizzo di ritorno.',
        hint: 'Ogni chiamata deposita qualcosa e ogni ritorno lo toglie, nell’ordine inverso. Prova a immaginare cosa accadrebbe con un solo registro.',
        solution: `<pre>A chiama B →  pila:  [ ritorno in A ]                 ← SP

B chiama C →  pila:  [ ritorno in A ]
                     [ ritorno in B ]                 ← SP

C ritorna  →  si estrae «ritorno in B», si salta lì
              pila:  [ ritorno in A ]                 ← SP

B ritorna  →  si estrae «ritorno in A», si salta lì
              pila:  vuota</pre><p>Con un <b>solo registro</b> di ritorno, la chiamata da B a C lo sovrascriverebbe: al momento di tornare da C si tornerebbe correttamente in B, ma l’indirizzo di rientro in A sarebbe perduto e il programma non saprebbe più dove andare.</p><p>La pila risolve perché è <b>LIFO</b>, e le chiamate sono per natura annidate: l’ultima aperta è la prima a chiudersi. Oltre all’indirizzo di ritorno, sulla pila viaggiano i parametri, le variabili locali e i registri che la procedura deve preservare — l’insieme si chiama <b>record di attivazione</b>.</p>`,
      },
      {
        id: 'ex-isa-5',
        level: 'esame',
        q: 'La parola <code>0x12345678</code> viene scritta a partire dall’indirizzo 100. Mostra il contenuto dei byte 100-103 in <b>big-endian</b> e in <b>little-endian</b>. Poi: leggendo un solo byte all’indirizzo 100, che cosa si ottiene nei due casi?',
        hint: 'Big-endian mette per primo il byte «grande», cioè il più significativo. Little-endian fa il contrario. L’indirizzo della parola resta 100 in entrambi i casi.',
        solution: `<pre>            100   101   102   103
big-endian   12    34    56    78
little-endian 78    56    34    12</pre><p>Leggendo un byte all’indirizzo 100 si ottiene <code>0x12</code> in big-endian e <code>0x78</code> in little-endian: lo <b>stesso indirizzo</b> restituisce dati diversi.</p><p>Perché conta: finché i dati restano nella stessa macchina la convenzione è invisibile. Diventa un problema quando si scambiano dati binari — un file, un pacchetto di rete, un dispositivo — fra macchine con convenzioni opposte. Per questo i protocolli di rete fissano un ordine (il <i>network byte order</i>, big-endian) e le macchine little-endian convertono in ingresso e in uscita.</p>`,
      },
    ],
  };
