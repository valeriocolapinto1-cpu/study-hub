import type { Topic } from '../types';
import { ovl } from './_ovl';

export const arith: Topic = {
  id: 'arith',
  title: 'Aritmetica hardware: sommatori & moltiplicazione',
  blurb: 'Semisommatore, sommatore completo, ripple-carry, carry-lookahead, moltiplicazione.',
  trapIds: ['trap-and-assoc'],
    prereq: ['bin', 'comb'],
    diagramIds: ['sommatore-ripple'],
    summary: [
      '<b>Semisommatore</b>: S = A ⊕ B, riporto = A · B. <b>Sommatore completo</b>: aggiunge il riporto entrante, S = A ⊕ B ⊕ Cin.',
      '<b>Ripple-carry</b>: n sommatori completi in cascata. Semplice, ma il ritardo cresce <b>linearmente</b> con n perché il riporto deve attraversarli tutti.',
      '<b>Carry-lookahead</b>: G = A·B (genera), P = A ⊕ B (propaga); i riporti si calcolano in parallelo. Ritardo quasi costante, molte più porte.',
      'Un solo circuito per somma e sottrazione: A − B = A + B̅ + 1, cioè si invertono i bit di B e si forza a 1 il riporto entrante.',
      'Moltiplicazione = <b>somme e spostamenti</b>; l\'algoritmo di Booth tratta i numeri in complemento a 2 senza casi particolari.',
    ],
    checks: [
      {
        q: 'Perché il ripple-carry è lento, e quanto?',
        a: 'Il riporto di ogni stadio dipende da quello precedente, quindi il risultato è pronto solo dopo che il riporto ha attraversato tutti gli stadi: il ritardo è circa n volte quello di un sommatore completo, cioè cresce <b>linearmente</b> col numero di bit.',
      },
      {
        q: 'Che cosa significa che uno stadio «genera» o «propaga» il riporto?',
        a: '<b>Genera</b> se produce un riporto da solo, indipendentemente da quello entrante: succede quando A = B = 1, cioè G = A·B. <b>Propaga</b> se lascia passare il riporto entrante: succede quando A ⊕ B = 1. Da queste due funzioni si ricavano tutti i riporti in parallelo.',
      },
      {
        q: 'Come si esegue una sottrazione avendo solo un sommatore?',
        a: 'Si invertono i bit del sottraendo e si mette a 1 il riporto entrante del primo stadio: invertire + 1 è esattamente il complemento a 2, quindi A + (−B) senza circuiti aggiuntivi.',
      },
    ],
  body: `
    <h4>Da dove si parte</h4>
    <p><b>Cosa serve sapere prima:</b> il complemento a 2 dal modulo sui <a href="#/study/bin">numeri binari</a>, e le porte logiche di base dal modulo su <a href="#/study/bool">algebra di Boole</a>.</p>
    <p><b>Che problema risolve.</b> Sappiamo <i>rappresentare</i> i numeri, ma un calcolatore deve anche <i>calcolare</i>. Qui si costruisce il circuito che somma davvero — a partire da porte AND, OR e XOR — e si scopre che sommare è facile, mentre <b>sommare in fretta</b> è il vero problema di progetto: il riporto deve attraversare tutti i bit, e questo mette un limite alla frequenza dell’intero processore.</p>
    <p><b>Le parole nuove.</b> Il <b>riporto</b> (carry) è il «me ne porto uno» della somma in colonna. Un <b>semisommatore</b> somma due bit; un <b>sommatore completo</b> ne somma due più il riporto entrante, ed è il mattone da cui si costruisce tutto. <b>Ripple-carry</b> vuol dire «a propagazione di riporto»: i sommatori in fila, ognuno che aspetta il precedente. <b>Carry-lookahead</b> significa «riporto anticipato»: calcolarlo in parallelo invece di aspettarlo.</p>
    <h4>Semisommatore (half adder)</h4>
    <p>Somma <b>due</b> bit e produce somma e riporto. Non accetta un riporto entrante, ed è per
    questo che si chiama «mezzo»:</p>
    <pre>a  b │  s   c
0  0 │  0   0
0  1 │  1   0
1  0 │  1   0
1  1 │  0   1</pre>
    <p>Si legge direttamente dalla tabella: <code>s = a ⊕ b</code> e <code>c = a · b</code>. La
    somma è uno XOR perché vale 1 quando i bit sono <b>diversi</b>; il riporto è un AND perché
    esce solo quando sono entrambi 1.</p>

    <h4>Sommatore completo (full adder)</h4>
    <p>Per sommare numeri di più bit ogni stadio deve accettare anche il <b>riporto entrante</b>
    <code>c<sub>i</sub></code> prodotto dallo stadio precedente. Con tre ingressi:</p>
    <ul>
      <li><code>s<sub>i</sub> = a<sub>i</sub> ⊕ b<sub>i</sub> ⊕ c<sub>i</sub></code> — la somma
      vale 1 quando il numero di ingressi a 1 è <b>dispari</b>.</li>
      <li><code>c<sub>i+1</sub> = a<sub>i</sub>·b<sub>i</sub> + c<sub>i</sub>·(a<sub>i</sub> ⊕ b<sub>i</sub>)</code>
      — il riporto esce se entrambi gli addendi valgono 1, oppure se ne vale uno e c'era già un
      riporto entrante.</li>
    </ul>
    <p>Si realizza con due semisommatori più una OR. Nel disegno ricordati di scomporre in porte
    a 2 ingressi.</p>

    <h4>Ripple-carry: semplice ma lento</h4>
    <p>Mettendo n sommatori completi in cascata, con il riporto uscente di ciascuno collegato al
    riporto entrante del successivo, si ottiene un sommatore a n bit:</p>
    <pre>   a₃b₃      a₂b₂      a₁b₁      a₀b₀
    │ │       │ │       │ │       │ │
  ┌─▼─▼─┐   ┌─▼─▼─┐   ┌─▼─▼─┐   ┌─▼─▼─┐
c₄│ FA  │◄c₃│ FA  │◄c₂│ FA  │◄c₁│ FA  │◄ c₀
  └──┬──┘   └──┬──┘   └──┬──┘   └──┬──┘
     s₃        s₂        s₁        s₀</pre>
    <p>Il difetto è nel nome: il riporto <b>si propaga a ondate</b>. Lo stadio più significativo
    non può produrre il risultato definitivo finché non gli arriva il riporto, che ha attraversato
    tutti gli stadi precedenti. Il ritardo cresce <b>linearmente con n</b>: raddoppiare i bit
    raddoppia il tempo di somma. È il caso peggiore che detta il periodo di clock.</p>

    <h4>Carry-lookahead: calcolare i riporti in anticipo</h4>
    <p>L'idea è non aspettare il riporto ma <b>prevederlo</b>. Per ogni posizione si definiscono
    due funzioni che dipendono solo dagli operandi, quindi disponibili subito:</p>
    <ul>
      <li><b>Generate</b> <code>G<sub>i</sub> = a<sub>i</sub> · b<sub>i</sub></code> — questa
      posizione <i>genera</i> un riporto per conto suo, qualunque cosa arrivi da destra.</li>
      <li><b>Propagate</b> <code>P<sub>i</sub> = a<sub>i</sub> ⊕ b<sub>i</sub></code> — questa
      posizione <i>propaga</i> il riporto che riceve.</li>
    </ul>
    <p>Da cui <code>c<sub>i+1</sub> = G<sub>i</sub> + P<sub>i</sub>·c<sub>i</sub></code>.
    Espandendo la ricorsione si esprime <b>ogni</b> riporto direttamente in funzione di
    <code>c<sub>0</sub></code>:</p>
    <pre>c₁ = G₀ + P₀c₀
c₂ = G₁ + P₁G₀ + P₁P₀c₀
c₃ = G₂ + P₂G₁ + P₂P₁G₀ + P₂P₁P₀c₀</pre>
    <p>Tutti i riporti si calcolano <b>in parallelo</b>, con due soli livelli di porte: il ritardo
    diventa quasi indipendente da n. Il prezzo è il numero di porte, che cresce rapidamente —
    perciò si costruiscono blocchi da 4 bit e li si mette in cascata, applicando lo stesso schema
    un livello più su (lookahead gerarchico).</p>

    <h4>Sommatore/sottrattore unico</h4>
    <p>In complemento a 2 la sottrazione è la somma dell'opposto, e l'opposto è «inverti e
    aggiungi 1». Basta quindi un segnale di controllo <code>Sub</code>:</p>
    <ul>
      <li>ogni bit di B passa per uno XOR con <code>Sub</code>: se <code>Sub = 1</code> viene
      invertito, se vale 0 passa intatto;</li>
      <li><code>Sub</code> entra anche come riporto iniziale <code>c<sub>0</sub></code>,
      fornendo il «+1».</li>
    </ul>
    <p>Un solo circuito fa entrambe le operazioni: è la ragione pratica per cui si usa il
    complemento a 2 e non il modulo e segno.</p>

    <h4>Moltiplicazione per somme e spostamenti</h4>
    <p>Il metodo è quello che si usa a mano: per ogni bit del moltiplicatore, se vale 1 si somma
    il moltiplicando opportunamente <b>spostato</b>, altrimenti si somma zero.</p>
    <pre>    1 1 0 1   (13)
  × 1 0 1 1   (11)
  ─────────
    1 1 0 1     ← bit 0 = 1
   1 1 0 1      ← bit 1 = 1, spostato di 1
  0 0 0 0       ← bit 2 = 0
 1 1 0 1        ← bit 3 = 1, spostato di 3
 ───────────
 1 0 0 0 1 1 1 1   (143)</pre>
    <p>In hardware si realizza con una matrice di sommatori (<i>array multiplier</i>), oppure in
    modo sequenziale con un accumulatore e un registro a scorrimento — che è esattamente ciò che
    fa il programma assembly «moltiplicazione tramite somme ripetute». Il prodotto di due numeri
    a n bit occupa <b>2n bit</b>.</p>
    <p>Con i numeri con segno la somma-e-sposta ingenua sbaglia: serve l'estensione del segno sui
    prodotti parziali, oppure l'algoritmo di <b>Booth</b>, che ricodifica il moltiplicatore
    guardando coppie di bit adiacenti e sostituisce lunghe sequenze di 1 con una sottrazione più
    una somma.</p>

    <h4>Divisione</h4>
    <p>Anche qui si imita il procedimento a mano: si confronta il divisore con il resto parziale,
    si sottrae quando ci sta e si scrive 1 nel quoziente, altrimenti si scrive 0. Nella variante
    <b>restoring</b> la sottrazione si esegue sempre e, se il risultato è negativo, si ripristina
    il resto sommando indietro il divisore; nella <b>non-restoring</b> si evita il ripristino
    alternando somme e sottrazioni. La divisione per zero è tipicamente un'<b>eccezione</b>.</p>

    <h4>Perché conta all'esame</h4>
    <p>Questa è la parte che collega l'algebra di Boole al processore: la ALU è fatta così, e le
    domande sul <b>ritardo</b> nascono qui — un ripple-carry a 32 bit è lento perché il riporto
    attraversa 32 stadi in cascata, ed è questo cammino a fissare il periodo minimo di clock.
    L'espressione ${ovl('a')}·b + a·${ovl('b')} che riconosci come XOR è la somma del
    semisommatore.</p>
    <h4>Esempio svolto</h4>
    <p><b>Somma 5 + 6 su 4 bit con un ripple-carry, mostrando i riporti.</b></p>
    <pre>riporti:  0 1 1 0
   A   =    0 1 0 1   (5)
   B   =    0 1 1 0   (6)
  ────────────────────
   S   =    1 0 1 1   (−5 letto in CP2!)</pre>
    <p>Il riporto <b>entrante</b> nel bit di segno è 1, quello <b>uscente</b> è 0: 1 ⊕ 0 = 1, quindi <b>overflow</b>. Ed è giusto: su 4 bit il massimo è +7, e 11 non ci sta. Il risultato letto in CP2 vale −5 e non ha senso — la macchina non se ne accorge da sola, per questo esiste il flag.</p>
    <p><b>Ora 5 − 6 con lo stesso circuito.</b> Si invertono i bit di B e si forza a 1 il riporto entrante:</p>
    <pre>B = 0110  →  B̄ = 1001,  Cin = 1

  0101 + 1001 + 1 = 1111  =  −1 ✓
riporto uscente 0, riporto entrante nel segno 0  →  nessun overflow</pre>
    <p>Un unico sommatore fa entrambe le operazioni: la linea di controllo che sceglie somma o sottrazione pilota sia gli XOR che invertono B, sia il riporto entrante.</p>

    <h4>Errori tipici</h4>
    <ul>
      <li>Invertire B e dimenticare il riporto entrante a 1: si sottrae B+1 invece di B.</li>
      <li>Dichiarare overflow guardando solo il riporto uscente: serve lo <b>XOR</b> dei due riporti sul bit di segno.</li>
      <li>Nella moltiplicazione, sommare i prodotti parziali senza <b>estendere il segno</b> quando si lavora in complemento a 2 (è il problema che l'algoritmo di Booth risolve).</li>
    </ul>`,
  exercises: [
    {
      id: 'ex-arith-1',
      level: 'base',
      q: 'Compila la tabella di verità del <b>semisommatore</b> e ricava le espressioni della somma S e del riporto C.',
      hint: 'Due ingressi, quattro righe. Guarda quali righe danno S = 1 e quali danno C = 1: sono due funzioni che conosci già.',
      solution: `<pre>A B │ S  C
0 0 │ 0  0
0 1 │ 1  0
1 0 │ 1  0
1 1 │ 0  1</pre><p>La colonna S vale 1 quando gli ingressi sono <b>diversi</b>: è lo XOR. La colonna C vale 1 solo quando entrambi valgono 1: è l’AND.</p><pre>S = A ⊕ B        C = A · B</pre><p>Si chiama «semi» perché non ha il riporto entrante: non si può quindi metterne due in cascata. Aggiungendo Cin si ottiene il sommatore completo, con S = A ⊕ B ⊕ Cin e Cout = A·B + Cin·(A ⊕ B).</p>`,
    },
    {
      id: 'ex-arith-2',
      level: 'base',
      q: 'Esegui <code>1011 + 0110</code> su 4 bit mostrando i riporti. Poi interpreta il risultato <b>come numeri senza segno</b> e <b>come numeri in complemento a 2</b>: in quale dei due casi c’è un errore?',
      hint: 'I bit sono gli stessi: cambia solo come li leggi. Il riporto uscente e l’overflow segnalano problemi <b>diversi</b>, uno per ciascuna interpretazione.',
      solution: `<pre>riporti: 1 1 1 0
   A  =    1 0 1 1
   B  =    0 1 1 0
  ─────────────────
   S  =  1 0 0 0 1   ← il primo 1 è il riporto uscente</pre><p><b>Senza segno</b>: 11 + 6 = 17, ma su 4 bit il massimo è 15. Il risultato troncato vale 0001 = 1: sbagliato, e il <b>riporto uscente = 1</b> è proprio il campanello d’allarme per l’aritmetica senza segno.</p><p><b>In complemento a 2</b>: 1011 = −5 e 0110 = +6, quindi il risultato atteso è +1 — ed è esattamente 0001. Nessun errore. Il flag di overflow lo conferma: riporto entrante nel bit di segno = 1, riporto uscente = 1, quindi 1 ⊕ 1 = <b>0</b>.</p><p>Stessi bit, stesso circuito, due verdetti opposti: è il motivo per cui il processore calcola <b>entrambi</b> i flag e lascia al programma decidere quale guardare.</p>`,
    },
    {
      id: 'ex-arith-3',
      level: 'esame',
      q: 'Con un sommatore/sottrattore a 5 bit, calcola <code>7 − 12</code> in complemento a 2. Mostra i valori in ingresso al sommatore e i due flag.',
      hint: 'La sottrazione non esiste come circuito a parte: si invertono i bit del sottraendo e si forza a 1 il riporto entrante.',
      solution: `<pre>7  = 0 0111
12 = 0 1100      →  invertito: 1 0011,  Cin = 1

  0 0111
+ 1 0011
+      1
─────────
  1 1011</pre><p>Il risultato su 5 bit è 11011: bit più significativo a 1, quindi negativo. Rileggendolo — inverti (00100) e somma 1 (00101 = 5) — vale <b>−5</b>, ed è giusto.</p><pre>riporto uscente = 0
riporto entrante nel bit di segno = 0
overflow = 0 ⊕ 0 = 0</pre><p>Nessun overflow, come deve essere: gli operandi effettivi (+7 e −12) hanno segno opposto, quindi il risultato non può uscire dall’intervallo.</p>`,
    },
    {
      id: 'ex-arith-4',
      level: 'esame',
      q: 'Per <code>A = 1101</code> e <code>B = 0111</code> con riporto entrante 0, calcola i segnali <b>generate</b> e <b>propagate</b> di ogni bit e i riporti c₁…c₄ con le formule del carry-lookahead. Ricava poi la somma.',
      hint: 'Per ogni posizione: gᵢ = aᵢ·bᵢ, pᵢ = aᵢ ⊕ bᵢ. Poi cᵢ₊₁ = gᵢ + pᵢ·cᵢ, applicata a catena ma calcolabile in parallelo.',
      solution: `<pre>bit      3    2    1    0
A        1    1    0    1
B        0    1    1    1
─────────────────────────
g = a·b  0    1    0    1
p = a⊕b  1    0    1    0</pre><p>Riporti, partendo da c₀ = 0:</p><pre>c₁ = g₀ + p₀·c₀ = 1 + 0·0 = 1
c₂ = g₁ + p₁·c₁ = 0 + 1·1 = 1
c₃ = g₂ + p₂·c₂ = 1 + 0·1 = 1
c₄ = g₃ + p₃·c₃ = 0 + 1·1 = 1   ← riporto uscente</pre><p>Somma, con sᵢ = pᵢ ⊕ cᵢ:</p><pre>s₀ = 0⊕0 = 0    s₁ = 1⊕1 = 0    s₂ = 0⊕1 = 1    s₃ = 1⊕1 = 0

S = 0100,  riporto uscente 1</pre><p>Controllo: 13 + 7 = 20 = 1 0100₂ ✓. Il punto dell’esercizio è che c₃ e c₄ si ottengono da g e p <b>senza aspettare</b> gli stadi precedenti: è questo che rende il lookahead veloce, al prezzo di molte più porte.</p>`,
    },
    {
      id: 'ex-arith-5',
      level: 'esame',
      q: 'Moltiplica <code>1101 × 0101</code> (numeri senza segno) con il metodo delle <b>somme e spostamenti</b>, mostrando i prodotti parziali.',
      hint: 'Un prodotto parziale per ogni bit del moltiplicatore: vale il moltiplicando se il bit è 1, zero se è 0, e va spostato a sinistra di tante posizioni quant’è il peso del bit.',
      solution: `<pre>moltiplicando 1101 (13),  moltiplicatore 0101 (5)

bit 0 = 1  →   0000 1101      (spostato di 0)
bit 1 = 0  →   0000 0000      (spostato di 1)
bit 2 = 1  →   0011 0100      (spostato di 2)
bit 3 = 0  →   0000 0000      (spostato di 3)
              ───────────
 somma    =    0100 0001</pre><p>0100 0001₂ = 65 = 13 × 5 ✓.</p><p>Due osservazioni da esame. Il risultato di una moltiplicazione fra numeri a n bit occupa <b>2n bit</b>: per questo i processori scrivono il prodotto in due registri o in un registro doppio. E il metodo funziona così com’è solo per numeri <b>senza segno</b>: con il complemento a 2 i prodotti parziali andrebbero estesi in segno, ed è il problema che l’algoritmo di Booth risolve elegantemente.</p>`,
    },
  ],
};
