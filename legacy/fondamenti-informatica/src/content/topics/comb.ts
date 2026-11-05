import type { Topic } from '../types';
import { ovl } from './_ovl';

export const comb: Topic = {
  id: 'comb',
  title: 'Reti combinatorie notevoli',
  blurb: 'Decoder, encoder, multiplexer, comparatori, buffer tri-state.',
  trapIds: ['trap-and-assoc'],
    prereq: ['bool'],
    summary: [
      'I blocchi standard esistono perché certe funzioni ricorrono sempre: sceglere, indirizzare, confrontare.',
      '<b>Decoder</b> n → 2ⁿ: attiva <b>una sola</b> uscita, quella indirizzata. È il selettore di righe di una memoria o di un registro.',
      '<b>MUX</b> 2ⁿ → 1: sceglie un ingresso con n segnali di selezione. Con i selettori collegati alle variabili e le costanti sugli ingressi realizza <b>qualunque</b> funzione di n variabili.',
      '<b>Comparatore</b>: l\'uguaglianza si costruisce con XNOR bit a bit e una AND finale.',
      '<b>Tri-state</b>: la terza condizione è l\'alta impedenza, cioè «staccato». È ciò che permette a più sorgenti di condividere un bus, una sola abilitata per volta.',
    ],
    checks: [
      {
        q: 'Come realizzi Y = A·B + C con un multiplexer a 3 selettori?',
        a: 'Si collegano A, B, C ai tre selettori e su ciascuno degli 8 ingressi dati si mette la costante 0 o 1 pari al valore della funzione per quel mintermine: gli ingressi dati <b>sono</b> la colonna d\'uscita della tabella di verità.',
      },
      {
        q: 'Perché due uscite non tri-state non possono essere collegate allo stesso filo?',
        a: 'Se una impone 0 e l\'altra 1 si crea un percorso diretto fra alimentazione e massa: valore d\'uscita indefinito e corrente elevata. Il tri-state consente a tutte tranne una di «staccarsi».',
      },
      {
        q: 'A che serve l\'ingresso di abilitazione di un decoder?',
        a: 'A spegnere tutte le uscite. Serve per comporre decoder grandi con decoder piccoli: i bit più significativi abilitano il blocco giusto, i meno significativi scelgono la riga.',
      },
    ],
  body: `
    <h4>Da dove si parte</h4>
    <p><b>Cosa serve sapere prima:</b> le porte logiche e le tabelle di verità, dal modulo su <a href="#/study/bool">algebra di Boole</a>.</p>
    <p><b>Che problema risolve.</b> Con AND, OR e NOT si può costruire qualunque funzione, ma partire ogni volta dalle porte è come costruire una casa mattone per mattone senza usare porte e finestre già fatte. Certe funzioni ricorrono in continuazione — «attiva la riga numero k», «lascia passare uno di questi otto segnali», «questi due numeri sono uguali?» — e conviene averle pronte come <b>blocchi</b> con un nome. Sono i mattoni con cui si disegnano memorie, processori e bus.</p>
    <p><b>Le parole nuove.</b> Una rete è <b>combinatoria</b> quando l’uscita dipende <i>solo</i> dagli ingressi presenti in questo istante: nessuna memoria, nessun passato (le reti con memoria arrivano nel modulo sui <a href="#/study/ff">flip-flop</a>). <b>Decodificare</b> significa trasformare un numero in «accendi la riga numero quel-numero»; <b>multiplare</b> significa scegliere uno fra più segnali. <b>Alta impedenza</b> è la terza condizione di un’uscita tri-state: non 0, non 1, ma «scollegato».</p>
    <h4>Perché esistono i blocchi standard</h4>
    <p>Ogni funzione si può sintetizzare da zero con la mappa di Karnaugh, ma alcune ricorrono
    così spesso da avere un nome e un simbolo propri. Riconoscerle fa risparmiare tempo: invece di
    minimizzare una tabella a 4 variabili si dice «è un multiplexer» e si passa oltre.</p>

    <h4>Decodificatore (decoder)</h4>
    <p>Ha <b>n ingressi</b> e <b>2ⁿ uscite</b>, e attiva <b>una sola</b> uscita per volta: quella
    il cui indice corrisponde al numero binario presentato in ingresso.</p>
    <pre>x₁ x₀ │ y₃ y₂ y₁ y₀
 0  0 │  0  0  0  1
 0  1 │  0  0  1  0
 1  0 │  0  1  0  0
 1  1 │  1  0  0  0</pre>
    <p>Ogni uscita è il <b>mintermine</b> corrispondente: <code>y₀ = ${ovl('x₁')}·${ovl('x₀')}</code>,
    <code>y₁ = ${ovl('x₁')}·x₀</code> e così via. Serve a selezionare una fra molte cose: un chip
    di memoria dato l'indirizzo, un registro dato il suo numero, una cifra di un display.</p>
    <p>Quasi sempre ha un ingresso di <b>abilitazione</b> (enable): se è a 0 tutte le uscite
    restano spente, il che permette di comporre decoder piccoli per farne uno grande.</p>

    <h4>Codificatore (encoder)</h4>
    <p>L'operazione inversa: 2ⁿ ingressi, n uscite, restituisce l'<b>indice</b> dell'ingresso
    attivo. Il problema è cosa fare se ne sono attivi due: il <b>priority encoder</b> lo risolve
    dando la precedenza all'indice più alto. È il circuito che decide quale richiesta di
    interruzione servire quando ne arrivano più d'una insieme.</p>

    <h4>Multiplexer (MUX)</h4>
    <p>Sceglie <b>uno fra 2ⁿ ingressi dati</b> e lo porta in uscita, in base a n linee di
    selezione. Con due ingressi dati e una selezione:</p>
    <pre>f = ${ovl('s')}·w₀ + s·w₁</pre>
    <p>È l'interruttore programmabile del circuito: dentro il processore serve a scegliere quale
    sorgente presentare alla ALU o quale valore scrivere nel PC. Il <b>demultiplexer</b> fa il
    contrario: instrada un unico ingresso verso l'uscita selezionata.</p>

    <h4>Sintetizzare una funzione qualsiasi con un MUX</h4>
    <p>Un multiplexer a n selezioni realizza <b>qualunque</b> funzione di n variabili: si collegano
    le variabili alle selezioni e si fissa ciascun ingresso dati al valore che la funzione assume
    in quella riga della tabella di verità. Gli ingressi dati sono, letteralmente, la colonna
    delle uscite.</p>
    <p>Con un MUX si può anche coprire una funzione di <b>n+1</b> variabili: si usano n variabili
    per le selezioni e a ogni ingresso dati si collega, invece di una costante, la variabile
    rimanente, il suo complemento, 0 oppure 1.</p>

    <h4>Comparatori</h4>
    <p>L'uguaglianza fra due bit è lo <b>XNOR</b>: vale 1 quando sono uguali. Per confrontare
    parole di n bit si mettono in AND gli XNOR di tutte le posizioni. Per stabilire quale dei due
    è maggiore si procede dal bit più significativo verso il basso, decidendo alla prima posizione
    in cui differiscono. In alternativa si sottrae e si leggono i flag: è ciò che fa l'istruzione
    <code>CMP</code>.</p>

    <h4>Buffer tri-state</h4>
    <p>Una porta normale ha due stati d'uscita, 0 e 1, e li impone sempre. Un <b>buffer
    tri-state</b> ne ha un terzo, l'<b>alta impedenza</b>: quando l'abilitazione è spenta l'uscita
    si <b>scollega</b> elettricamente, come se il filo fosse tagliato.</p>
    <p>Serve a far condividere un <b>bus</b> a più dispositivi. Su un bus a un certo istante deve
    parlare uno solo: tutti gli altri mettono le loro uscite in alta impedenza. Senza tri-state,
    due dispositivi che pilotano lo stesso filo con valori opposti creerebbero un cortocircuito.
    È il motivo per cui, nello schema del processore, i registri si affacciano sul bus interno
    attraverso questi buffer.</p>
    <h4>Demultiplexer: il decoder visto al contrario</h4>
    <p>Il multiplexer sceglie uno fra molti ingressi e lo porta su un’unica uscita. Il <b>demultiplexer</b> fa l’opposto: prende un ingresso e lo instrada su una fra molte uscite, secondo i selettori.</p>
    <p>La cosa interessante è che un demultiplexer <b>è</b> un decoder con l’abilitazione usata come ingresso dati: il decoder attiva l’uscita indirizzata, e se al posto della costante 1 gli si dà un segnale, quel segnale compare sull’uscita scelta e nient’altro. Un solo circuito, due usi.</p>
    <p>La coppia MUX-DEMUX è ciò che permette di condividere un collegamento: si multipla da una parte, si trasmette su un solo filo, si demultipla dall’altra. È il principio della multiplazione a divisione di tempo, dai bus interni alle linee di comunicazione.</p>

    <h4>Codificatore di priorità</h4>
    <p>Un codificatore semplice presuppone che sia attivo <b>un solo</b> ingresso: se se ne attivano due l’uscita è priva di senso. È un’ipotesi irrealistica — pensa a otto dispositivi che possono chiedere attenzione insieme.</p>
    <p>Il <b>codificatore di priorità</b> risolve stabilendo un ordine: se più ingressi sono attivi, l’uscita è l’indice del <b>più prioritario</b>. Ha inoltre un’uscita di validità che distingue «nessun ingresso attivo» da «è attivo l’ingresso 0», due situazioni che altrimenti darebbero lo stesso codice.</p>
    <p>È esattamente il circuito che serve nella gestione delle interruzioni per decidere quale dispositivo servire quando ne chiamano più d’uno, e nell’arbitraggio di un bus quando più unità lo richiedono insieme.</p>

    <h4>Una ROM è una tabella di verità</h4>
    <p>Una memoria di sola lettura con n bit di indirizzo e m bit di dato contiene 2ⁿ parole da m bit. Ma se al posto di «indirizzo» si legge «combinazione degli ingressi» e al posto di «parola» si legge «valore delle uscite», quella memoria è <b>letteralmente</b> una tabella di verità di n ingressi e m uscite.</p>
    <pre>indirizzo (ingressi)  →  contenuto (uscite)
   000                     0 1
   001                     1 1
   010                     1 0
   …</pre>
    <p>Dentro, una ROM è fatta proprio così: un <b>decoder</b> n→2ⁿ che attiva una riga, e una matrice di collegamenti che determina i bit di uscita. Realizzare una funzione logica con una ROM significa scriverne la tabella di verità e basta — nessuna minimizzazione, nessun disegno di porte.</p>
    <p>Il limite è la crescita esponenziale: con 8 ingressi bastano 256 parole, con 20 ne servirebbero un milione. Per questo le PLA fanno un passo indietro rispetto alla ROM: invece di generare <b>tutti</b> i mintermini, generano solo i termini prodotto che servono davvero — meno flessibilità, molta meno area.</p>

    <h4>Perché due livelli</h4>
    <p>Ogni funzione booleana si può scrivere in forma SOP, cioè come un livello di AND seguito da un livello di OR. Questo significa che, ignorando il fan-in, <b>qualunque</b> funzione è realizzabile con un ritardo di soli due livelli di porte — è il motivo per cui la forma a due livelli è il riferimento sia per il costo sia per la velocità, ed è la forma che PLA e mappe di Karnaugh producono.</p>
    <p>Nella pratica il fan-in è limitato: una AND a 12 ingressi non esiste, e va costruita con più porte in cascata, aggiungendo livelli e quindi ritardo. Il progetto reale è sempre un compromesso fra il numero di livelli (velocità) e il fan-in delle singole porte (fattibilità).</p>
    <h4>Esempio svolto</h4>
    <p><b>Realizza la funzione maggioranza (Y = 1 con almeno due ingressi a 1) in due modi.</b></p>
    <p><b>Con un MUX 8→1.</b> I tre ingressi A, B, C vanno ai <b>selettori</b>; sugli otto ingressi dati si mettono le costanti della colonna d'uscita, nell'ordine dei mintermini:</p>
    <pre>selettori: S₂S₁S₀ = A B C
ingressi dati: I₀…I₇ = 0, 0, 0, 1, 0, 1, 1, 1
                      (m0)        (m3)  (m5)(m6)(m7)</pre>
    <p>Nessuna porta logica: la tabella di verità <b>è</b> il cablaggio. È il motivo per cui un MUX a n selettori realizza qualunque funzione di n variabili.</p>
    <p><b>Con un decoder 3→8 e una OR.</b> Il decoder attiva l'uscita corrispondente alla combinazione presente; basta collegare a una OR le uscite dei mintermini a 1:</p>
    <pre>Y = m₃ + m₅ + m₆ + m₇</pre>
    <p>Il decoder genera <b>tutti</b> i mintermini, la OR sceglie quali servono. Con più funzioni delle stesse variabili si riusa lo stesso decoder cambiando solo le OR.</p>

    <h4>Errori tipici</h4>
    <ul>
      <li>Collegare le variabili agli ingressi <b>dati</b> del MUX invece che ai selettori: sono i selettori a scegliere, i dati sono le costanti della tabella.</li>
      <li>Dimenticare l'ordine dei mintermini: I₀ corrisponde a S = 000, I₇ a S = 111.</li>
      <li>Unire due uscite normali sullo stesso filo per «fare l'OR»: serve una porta, o dei buffer tri-state con una sola abilitazione attiva.</li>
    </ul>`,
  exercises: [
    {
      id: 'ex-comb-1',
      level: 'base',
      q: 'Costruisci un decodificatore <b>3→8</b> usando due decodificatori <b>2→4</b> con ingresso di abilitazione.',
      hint: 'Con tre bit di indirizzo, uno deve decidere <i>quale dei due</i> decoder lavora e gli altri due scelgono la riga dentro il blocco.',
      solution: `<pre>A₂ ──┬── EN del decoder ALTO   (uscite 4…7)
     └──▷o── EN del decoder BASSO (uscite 0…3)

A₁, A₀ ──── ingressi di ENTRAMBI i decoder</pre><p>Quando A₂ = 0 il primo decoder è abilitato e attiva una delle uscite 0-3 secondo A₁A₀; quando A₂ = 1 tocca al secondo, che copre le uscite 4-7. Serve un solo invertitore.</p><p>È esattamente lo schema con cui si compongono i banchi di memoria: i bit alti dell’indirizzo scelgono il chip, i bassi la cella al suo interno.</p>`,
    },
    {
      id: 'ex-comb-2',
      level: 'base',
      q: 'Realizza con un multiplexer <b>8→1</b> la funzione di <b>parità dispari</b> di tre bit: <code>Y = A ⊕ B ⊕ C</code>.',
      hint: 'I selettori prendono le variabili; sugli ingressi dati vanno le costanti della colonna d’uscita, nell’ordine dei mintermini da I₀ a I₇.',
      solution: `<pre>A B C │ Y      ingresso
0 0 0 │ 0      I₀ = 0
0 0 1 │ 1      I₁ = 1
0 1 0 │ 1      I₂ = 1
0 1 1 │ 0      I₃ = 0
1 0 0 │ 1      I₄ = 1
1 0 1 │ 0      I₅ = 0
1 1 0 │ 0      I₆ = 0
1 1 1 │ 1      I₇ = 1</pre><p>Collegamenti: S₂S₁S₀ = A B C, e gli otto ingressi dati alle costanti <code>0,1,1,0,1,0,0,1</code>. Nessuna porta logica: la tabella di verità <b>è</b> il cablaggio.</p>`,
    },
    {
      id: 'ex-comb-3',
      level: 'esame',
      q: 'Realizza <code>Y(A,B,C) = Σm(1,2,5,7)</code> con un multiplexer <b>4→1</b>, usando A e B come selettori.',
      hint: 'Con solo due selettori restano quattro ingressi per otto mintermini: ogni ingresso copre <b>due</b> righe, che differiscono per C. Su ciascuno va 0, 1, C oppure C̄.',
      solution: `<pre>A B │ C=0        C=1        ingresso
0 0 │ m0 = 0     m1 = 1     I₀ = C
0 1 │ m2 = 1     m3 = 0     I₁ = C̄
1 0 │ m4 = 0     m5 = 1     I₂ = C
1 1 │ m6 = 0     m7 = 1     I₃ = C</pre><p>Quindi: I₀ = C, I₁ = C̄ (serve un invertitore), I₂ = C, I₃ = C. Il circuito completo è un MUX 4→1, un invertitore e nulla più.</p><p>La regola generale: con n selettori e n+1 variabili, ogni ingresso vale una delle quattro funzioni della variabile residua — 0, 1, la variabile, la variabile negata.</p>`,
    },
    {
      id: 'ex-comb-4',
      level: 'esame',
      q: 'Progetta un comparatore di <b>uguaglianza</b> fra due numeri a 2 bit, A₁A₀ e B₁B₀. Poi aggiungi l’uscita «A maggiore di B».',
      hint: 'Due bit sono uguali quando il loro XOR è 0, cioè quando il loro <b>XNOR</b> è 1. Per il maggiore, ragiona a partire dal bit più significativo.',
      solution: '<p><b>Uguaglianza</b> — tutti i bit devono coincidere:</p><pre>EQ = (A₁ ⊙ B₁) · (A₀ ⊙ B₀)        dove ⊙ è lo XNOR</pre><p><b>Maggiore</b> — A > B se il bit alto di A è 1 e quello di B è 0; oppure se i bit alti sono uguali e il confronto si sposta su quelli bassi:</p><pre>GT = A₁·B̄₁ + (A₁ ⊙ B₁)·A₀·B̄₀</pre><p>La struttura si estende a n bit ripetendo lo stesso schema: è la ragione per cui i comparatori si costruiscono a cascata, dal bit più significativo verso il basso.</p>',
    },
    {
      id: 'ex-comb-5',
      level: 'esame',
      q: 'Quattro registri a 8 bit devono poter scrivere sullo stesso bus a 8 bit. Quanti buffer tri-state servono, quante abilitazioni possono essere attive contemporaneamente, e che cosa succede se per errore ne sono attive due?',
      hint: 'Il tri-state serve una linea per volta: conta quante linee ci sono in totale, non quanti registri.',
      solution: '<p>Ogni bit di ogni registro ha bisogno del proprio buffer: <b>4 × 8 = 32 buffer</b>, organizzati in quattro banchi da otto, ciascuno con una sola linea di abilitazione comune.</p><p>Le abilitazioni attive devono essere <b>al più una</b>: è proprio questa la condizione che rende possibile la condivisione del bus. Chi non è abilitato va in alta impedenza, cioè si «stacca» elettricamente dalla linea.</p><p>Se due banchi sono abilitati insieme e su un bit impongono valori opposti, si crea un percorso diretto fra alimentazione e massa: il valore sulla linea è indefinito e la corrente elevata può danneggiare i buffer. Per questo la selezione passa sempre da un <b>decodificatore</b>, che per costruzione attiva una sola uscita.</p>',
    },
  ],
};
