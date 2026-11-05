import type { Topic } from '../types';
import { ovl } from './_ovl';

export const karnaugh: Topic = {
    id: 'karnaugh',
    title: 'Sintesi & mappe di Karnaugh',
    blurb: 'Dalla tabella di verità al circuito minimo. Esce quasi sempre.',
    trapIds: ['trap-and-assoc'],
    prereq: ['bool'],
    summary: [
      'Le colonne vanno in ordine <b>Gray</b> — 00, 01, 11, 10 — perché fra celle vicine deve cambiare un solo bit. Sbagliare l\'ordine invalida tutti i raggruppamenti.',
      'Gruppi di 1, 2, 4, 8 celle: <b>mai 3</b>. Ogni raddoppio elimina una variabile, quindi accorcia il termine di un letterale.',
      'Gruppi il più grandi possibile, <b>sovrapponibili</b>, con adiacenza <b>circolare</b>: bordi opposti e i quattro angoli sono vicini.',
      'Implicante <b>primo</b> = gruppo non allargabile. <b>Essenziale</b> = copre un 1 che nessun altro primo copre: quelli vanno presi per forza.',
      'Le <b>indifferenze</b> si prendono a 1 solo se allargano un gruppo, valutandole una per una.',
    ],
    checks: [
      {
        q: 'Perché un gruppo di 3 celle non è valido?',
        a: 'Perché la semplificazione funziona solo se il gruppo è un sottocubo di 2ᵏ celle: allora esattamente k variabili cambiano e spariscono. Con 3 celle non esiste nessuna variabile che cambi in tutte le combinazioni, quindi il termine non si semplifica.',
      },
      {
        q: 'Che differenza c\'è fra una SOP corretta e una SOP minima?',
        a: 'Corretta = copre esattamente gli stessi mintermini della funzione. Minima = lo fa con il minor numero di termini e, a parità, di letterali. All\'esame una risposta corretta ma non minima perde punti.',
      },
      {
        q: 'Quando conviene raggruppare gli zeri invece degli uni?',
        a: 'Quando gli zeri sono pochi: raggruppandoli si ottiene la SOP di Ȳ e, negando con De Morgan, una POS spesso più corta della SOP.',
      },
    ],
    body: `
    <h4>Da dove si parte</h4>
    <p><b>Cosa serve sapere prima:</b> tabelle di verità, mintermini e forma SOP, dal modulo su <a href="#/study/bool">algebra di Boole</a>.</p>
    <p><b>Che problema risolve.</b> Da una tabella di verità si ricava sempre una SOP, scrivendo un termine per ogni riga a 1. Ma quella forma è quasi sempre <b>più lunga del necessario</b>: più termini significano più porte, più costo, più consumo e più ritardo. Semplificare con l’algebra funziona, però richiede di indovinare quali raccoglimenti tentare. La mappa di Karnaugh trasforma quell’intuizione in una procedura <b>visiva</b>: i termini semplificabili diventano celle vicine, e semplificare diventa «cerchia i gruppi più grandi».</p>
    <p><b>Le parole nuove.</b> Il <b>codice Gray</b> è un ordinamento in cui fra due valori consecutivi cambia un solo bit: è il motivo per cui le colonne vanno 00, 01, 11, 10. Un <b>implicante</b> è un gruppo valido di celle a 1; è <b>primo</b> se non si può allargare, <b>essenziale</b> se è l’unico a coprire una certa cella. Un’<b>indifferenza</b> (don’t care, scritta <code>x</code>) è una combinazione che non si presenta mai o il cui valore d’uscita non interessa: si può usare come 1 o come 0, a piacere.</p>
    <h4>Idea</h4>
    <p>La mappa dispone i mintermini in celle adiacenti secondo il <b>codice Gray</b>: fra due celle vicine cambia <b>una sola variabile</b>. Raggruppando gli <code>1</code> in blocchi di dimensione potenza di 2 si eliminano le variabili che cambiano dentro il gruppo, e restano solo quelle costanti.</p>

    <h4>Come si dispone la mappa</h4>
    <p>L'ordine delle colonne <b>non</b> è 00, 01, 10, 11 ma <b>00, 01, 11, 10</b>: è questa la sequenza in cui cambia un bit alla volta. A 4 variabili si applica lo stesso ordine anche alle righe:</p>
    <pre>        CD
       00  01  11  10
AB 00 | m0  m1  m3  m2
   01 | m4  m5  m7  m6
   11 | m12 m13 m15 m14
   10 | m8  m9  m11 m10</pre>
    <p>Sbagliare l'ordine è l'errore più comune: la mappa smette di essere adiacente e i raggruppamenti risultano invalidi.</p>

    <h4>Regole di raggruppamento</h4>
    <ul>
      <li>I gruppi hanno dimensione 1, 2, 4, 8… mai 3 o 6.</li>
      <li>Si fanno <b>più grandi possibile</b>: un gruppo di 2ᵏ celle elimina k variabili, quindi ogni raddoppio accorcia il termine di un letterale.</li>
      <li>I gruppi possono <b>sovrapporsi</b>: una cella già coperta può entrare in un altro gruppo se questo permette di allargarlo.</li>
      <li>L'adiacenza è <b>circolare</b>: prima e ultima colonna sono vicine, così come prima e ultima riga (wrap-around). I quattro angoli di una mappa a 4 variabili formano un gruppo valido.</li>
      <li>Ogni <code>1</code> deve finire in almeno un gruppo, e non si devono coprire zeri.</li>
    </ul>

    <h4>Implicanti primi ed essenziali</h4>
    <p>Un <b>implicante</b> è un gruppo valido; è <b>primo</b> se non può essere ingrandito ulteriormente. È <b>essenziale</b> se copre almeno un <code>1</code> che nessun altro implicante primo copre: gli essenziali vanno presi per forza. Si completa poi la copertura con il minor numero di implicanti primi rimanenti.</p>

    <h4>Perché funziona: l’adiacenza è algebra</h4>
    <p>La mappa sembra un trucco visivo, ma sotto c’è un solo teorema. Prendiamo due celle vicine, che per costruzione differiscono in <b>una sola</b> variabile — diciamo A. I due mintermini corrispondenti si scrivono X·A e X·Ā, dove X è il prodotto delle variabili che <i>non</i> cambiano:</p>
    <pre>X·A + X·Ā = X·(A + Ā) = X·1 = X</pre>
    <p>La variabile che cambia <b>sparisce</b>. Ecco perché un gruppo di 2 celle elimina una variabile, uno di 4 ne elimina due (si applica il teorema due volte), uno di 8 ne elimina tre. E si capisce anche perché i gruppi devono avere dimensione potenza di 2: solo così le celle formano un insieme in cui, per ogni variabile «interna», compaiono <b>entrambe</b> le polarità in tutte le combinazioni delle altre. Con 3 celle non accade, e il raccoglimento non si può fare.</p>
    <p>Lo stesso argomento spiega l’ordinamento Gray delle colonne: la vicinanza sulla mappa deve corrispondere alla differenza di un solo bit, altrimenti la formula di sopra non si applica e cerchiare celle contigue produce termini sbagliati.</p>

    <h4>La procedura, in cinque passi</h4>
    <p>All’esame conviene seguirla sempre nello stesso ordine, invece di cercare gruppi a caso:</p>
    <ol>
      <li><b>Riempi la mappa</b> dalla tabella di verità, controllando l’ordine Gray delle intestazioni. Un errore qui invalida tutto il resto.</li>
      <li><b>Cerca i gruppi più grandi possibile</b>, partendo da quelli di 8, poi 4, poi 2, poi le celle isolate. Ricorda i bordi e gli angoli.</li>
      <li><b>Individua gli implicanti essenziali</b>: per ogni 1, conta da quanti gruppi è coperto. Se da uno solo, quel gruppo è obbligatorio — segnalo.</li>
      <li><b>Completa la copertura</b> scegliendo, fra i gruppi rimasti, il minor numero possibile che copra gli 1 ancora scoperti.</li>
      <li><b>Scrivi i termini</b>: per ogni gruppo, il prodotto delle variabili che restano costanti, negate dove valgono 0.</li>
    </ol>
    <p>Alla fine, due controlli veloci: ogni 1 è coperto? nessun gruppo copre uno 0? Se entrambe le risposte sono sì, la forma è <b>corretta</b>; la minimalità dipende dall’aver fatto bene i passi 2-4.</p>

    <h4>Quando la regola degli essenziali non basta</h4>
    <p>Esistono mappe in cui <b>nessun</b> implicante è essenziale, perché ogni 1 è coperto da almeno due gruppi. Si chiamano <b>cicliche</b>. Lì il passo 3 non produce nulla e bisogna scegliere per tentativi, verificando quale combinazione dia il costo minore. Sono i casi in cui esistono <b>più soluzioni minime diverse</b>, tutte ugualmente accettabili: se la tua non coincide con quella del docente, controlla il numero di termini e di letterali prima di darti torto.</p>

    <h4>Oltre le quattro variabili</h4>
    <p>A cinque variabili la mappa diventa due mappe a quattro affiancate, una per E = 0 e una per E = 1: sono adiacenti «in profondità», cioè celle nella stessa posizione delle due mappe formano un gruppo valido. Si riesce a gestire, ma è scomodo; da sei in su la rappresentazione visiva perde senso.</p>
    <p>Per quei casi esiste il metodo di <b>Quine-McCluskey</b>: la stessa idea — combinare termini che differiscono di un bit — eseguita in modo tabellare e sistematico, quindi programmabile. È l’algoritmo che sta dentro gli strumenti di sintesi automatica, ed è anche quello che il simulatore di questo sito usa per verificare che la soluzione mostrata sia davvero minima.</p>
    <h4>Esempio svolto</h4>
    <p>Sia <code>Y(A,B,C) = 1</code> per i mintermini 1, 3, 5, 7 — cioè ogni volta che <code>C = 1</code>, indipendentemente da A e B. Il gruppo di 4 celle elimina due variabili e la SOP minima è semplicemente:</p>
    <pre>Y = C          (1 termine, 1 letterale)</pre>
    <p>Scrivere <code>Y = ${ovl('A')}·C + A·C</code> è <b>corretto ma non minimo</b>: l'assorbimento lo riduce a <code>C</code>, e all'esame la non-minimalità viene penalizzata.</p>

    <h4>Le indifferenze (x)</h4>
    <p>Sono combinazioni che non si presentano mai, o il cui valore d'uscita è irrilevante. Si possono prendere <b>come 1 quando aiutano ad allargare un gruppo</b>, oppure lasciare a 0 quando non servono: si valutano <b>una per una</b>, non tutte insieme, e non vanno mai coperte da sole (un gruppo di sole indifferenze è inutile).</p>

    <h4>POS dalla mappa</h4>
    <p>Raggruppando gli <b>zeri</b> invece degli uni si ottiene ${ovl('Y')}; negando con De Morgan si ricava la forma POS. Talvolta è più corta della SOP: se la mappa ha pochi zeri, conviene provarla.</p>

    <h4>Dal risultato al circuito</h4>
    <p>Ogni termine prodotto diventa una porta AND, la somma finale una porta OR, le variabili negate degli invertitori. Nel disegno <b>scomponi in porte a 2 ingressi</b>: un prodotto di tre letterali si realizza con due AND in cascata.</p>
    <p>Allenati nel Simulatore → drill «Reti combinatorie»: la soluzione mostrata è calcolata da un minimizzatore esatto, quindi è sempre davvero minima.</p>
    <h4>Errori tipici</h4>
    <ul>
      <li>Scrivere le colonne in ordine 00, 01, 10, 11: la mappa perde l'adiacenza e <b>tutti</b> i raggruppamenti diventano sbagliati.</li>
      <li>Fermarsi a una copertura corretta ma non minima, per non aver visto un gruppo più grande o l'adiacenza ai bordi.</li>
      <li>Coprire un gruppo di sole indifferenze: non serve a nulla, perché nessun 1 viene coperto.</li>
      <li>Dimenticare gli implicanti <b>essenziali</b>: vanno presi per primi, e spesso da soli chiudono quasi tutta la copertura.</li>
    </ul>`,
    exercises: [
      {
        id: 'ex-kar-1',
        level: 'base',
        q: 'Minimizza con la mappa di Karnaugh <code>Y(A,B,C) = Σm(1,2,3,6)</code>.',
        hint: 'Disegna la mappa con le colonne in ordine 00, 01, 11, 10. Poi cerca i gruppi più grandi possibile, ricordando che possono sovrapporsi.',
        solution: `<pre>        BC
      00  01  11  10
A 0 │  0   1   1   1
  1 │  0   0   0   1</pre><p>Gruppi individuabili: <code>m1,m3</code> (riga A=0, colonne con C=1) → <b>Ā·C</b>; <code>m2,m3</code> (riga A=0, colonne con B=1) → <b>Ā·B</b>; <code>m2,m6</code> (colonna BC=10, entrambe le righe) → <b>B·C̄</b>.</p><p>Quali sono <b>essenziali</b>? m1 è coperto solo da Ā·C, m6 solo da B·C̄: entrambi obbligatori. Presi quei due, restano coperti anche m3 e m2, quindi Ā·B non serve.</p><pre>Y = <b>Ā·C + B·C̄</b>      (2 termini, 4 letterali)</pre>`,
      },
      {
        id: 'ex-kar-2',
        level: 'base',
        q: 'Minimizza <code>Y(A,B,C,D) = Σm(0,2,8,10)</code>.',
        hint: 'Segna i quattro mintermini sulla mappa a 4 variabili e guarda <b>dove finiscono</b>. L’adiacenza è circolare: i bordi opposti si toccano.',
        solution: `<pre>          CD
       00  01  11  10
AB 00 │  1   0   0   1
   01 │  0   0   0   0
   11 │  0   0   0   0
   10 │  1   0   0   1</pre><p>I quattro 1 stanno nei <b>quattro angoli</b>. Non è un caso: prima e ultima riga sono adiacenti (AB = 00 e 10 differiscono di un bit), e così prima e ultima colonna. I quattro angoli formano quindi un gruppo di 4 celle valido.</p><p>Dentro il gruppo A cambia (0 e 1) e C cambia (0 e 1); restano costanti B = 0 e D = 0:</p><pre>Y = <b>B̄·D̄</b>      (1 termine, 2 letterali)</pre><p>Chi non usa il wrap-around scrive quattro termini di quattro letterali invece di uno di due.</p>`,
      },
      {
        id: 'ex-kar-3',
        level: 'esame',
        q: 'Minimizza <code>Y(A,B,C,D) = Σm(1,3,7,11,15) + d(0,2,5)</code>, dove <code>d</code> sono le <b>indifferenze</b>.',
        hint: 'Le indifferenze si prendono come 1 <b>solo se allargano un gruppo</b>. Valutale una per una: quelle che non servono restano 0.',
        solution: `<pre>          CD
       00  01  11  10
AB 00 │  x   1   1   x
   01 │  0   x   1   0
   11 │  0   0   1   0
   10 │  0   0   1   0</pre><p>Primo gruppo evidente: la colonna <code>CD = 11</code> per intero — m3, m7, m15, m11 — dove restano costanti C = 1 e D = 1:</p><pre>C·D</pre><p>Resta scoperto m1. Da solo darebbe Ā·B̄·C̄·D, quattro letterali. Ma prendendo le indifferenze m0 e m2 (più m3, già a 1) si forma il quadrato della riga AB = 00:</p><pre>Ā·B̄        ← copre m0, m1, m2, m3</pre><p>L’indifferenza m5 invece non aiuta nessun gruppo e resta a 0.</p><pre>Y = <b>C·D + Ā·B̄</b>      (2 termini, 4 letterali)</pre><p>Senza sfruttare le indifferenze si sarebbe ottenuto <code>C·D + Ā·B̄·C̄·D</code>: corretto, ma con due letterali in più — cioè meno punti.</p>`,
      },
      {
        id: 'ex-kar-4',
        level: 'esame',
        q: 'Minimizza <code>Y(A,B,C) = Σm(0,1,2,5,6,7)</code>. Quanti implicanti <b>essenziali</b> ci sono?',
        hint: 'Elenca tutti gli implicanti primi e, per ogni mintermine, conta da quanti è coperto. Un mintermine coperto da un solo primo rende quel primo essenziale.',
        solution: `<pre>        BC
      00  01  11  10
A 0 │  1   1   0   1
  1 │  0   1   1   1</pre><p>Implicanti primi (tutte coppie, nessun gruppo di 4 è possibile):</p><pre>Ā·B̄ (m0,m1)   Ā·C̄ (m0,m2)   B̄·C (m1,m5)
B·C̄ (m2,m6)   A·C  (m5,m7)   A·B  (m6,m7)</pre><p>Ogni mintermine è coperto da <b>esattamente due</b> primi: m0 da Ā·B̄ e Ā·C̄, m1 da Ā·B̄ e B̄·C, e così via. Quindi <b>nessun implicante è essenziale</b>: la mappa è <i>ciclica</i>, ed è il caso in cui la regola «prendi gli essenziali» non basta.</p><p>Si sceglie allora una copertura minima per tentativi: servono tre termini, e ce ne sono due possibili, entrambe accettabili.</p><pre>Y = Ā·B̄ + B·C̄ + A·C      oppure      Y = Ā·C̄ + B̄·C + A·B</pre>`,
      },
      {
        id: 'ex-kar-5',
        level: 'esame',
        q: 'Per la stessa funzione dell’esercizio precedente — <code>Y(A,B,C) = Σm(0,1,2,5,6,7)</code> — ricava la forma <b>POS</b> raggruppando gli zeri. È più corta della SOP?',
        hint: 'Raggruppando gli zeri si minimizza Ȳ. Poi si nega il risultato con De Morgan per tornare a Y.',
        solution: '<p>Gli zeri sono due soli: m3 (011) e m4 (100). Non sono adiacenti — differiscono in tutti e tre i bit — quindi restano due termini isolati:</p><pre>Ȳ = Ā·B·C + A·B̄·C̄</pre><p>Negando con De Morgan (il complemento di una somma di prodotti è un prodotto di somme, con ogni letterale invertito):</p><pre>Y = (A + B̄ + C̄) · (Ā + B + C)      (2 termini, 6 letterali)</pre><p>Confronto con la SOP minima trovata prima (3 termini, 6 letterali): la POS usa <b>un termine in meno</b> a parità di letterali. Con pochi zeri conviene quasi sempre provarla, ed è per questo che il raggruppamento degli zeri va sempre tentato prima di consegnare.</p>',
      },
    ],
  };
