import type { Topic } from '../types';
import { ovl } from './_ovl';

export const bool: Topic = {
    id: 'bool',
    title: 'Algebra di Boole & porte logiche',
    blurb: 'Assiomi, De Morgan, SOP e POS, insiemi funzionalmente completi.',
    trapIds: ['trap-and-assoc', 'trap-simboli', 'trap-demorgan'],
    summary: [
      'Sei porte da riconoscere <b>a memoria</b> dalla tabella di verità: AND, OR, NOT, NAND, NOR, XOR.',
      '<b>De Morgan</b>: la negazione di un prodotto è la somma delle negazioni, e viceversa. È il teorema che serve per passare a sole NAND o sole NOR.',
      'NAND (o NOR) da sola è <b>funzionalmente completa</b>: con quella si costruisce qualunque rete.',
      'Dalla tabella: <b>SOP</b> = un termine prodotto per ogni riga a 1; <b>POS</b> = un termine somma per ogni riga a 0.',
      'L\'algebra degli <b>insiemi</b> è la stessa algebra: ∪ ↔ OR, ∩ ↔ AND, complemento ↔ NOT. Le proprietà (commutativa, associativa, distributiva) valgono identiche.',
    ],
    checks: [
      {
        q: 'Scrivi NOT, AND e OR usando solo porte NAND.',
        a: 'NOT a = <code>a NAND a</code>. AND: <code>(a NAND b) NAND (a NAND b)</code>, cioè si nega la NAND. OR: <code>(a NAND a) NAND (b NAND b)</code>, che è De Morgan applicato.',
      },
      {
        q: 'Una funzione di 3 variabili vale 1 su tre righe: quanti termini ha la SOP canonica e quanti la POS canonica?',
        a: 'Tre la SOP (un mintermine per ogni riga a 1) e cinque la POS (un maxtermine per ognuna delle 8 − 3 righe a 0). Le due forme descrivono la stessa funzione con costi diversi.',
      },
      {
        q: 'Vale a + a·b = a? Perché?',
        a: 'Sì, è l\'<b>assorbimento</b>: se a = 1 la somma fa 1 comunque, se a = 0 anche a·b vale 0. Riconoscerlo serve a scartare i termini ridondanti prima ancora di disegnare la mappa.',
      },
    ],
    body: `
    <h4>Da dove si parte</h4>
    <p><b>Cosa serve sapere prima:</b> che un segnale elettrico può valere solo 0 o 1 (lo hai visto nel modulo sui <a href="#/study/bin">numeri binari</a>). Nient’altro.</p>
    <p><b>Che problema risolve.</b> Abbiamo dei fili che valgono 0 o 1 e vogliamo costruirci sopra qualcosa che <b>decida</b>: accendi il motore se la porta è chiusa <i>e</i> il pulsante è premuto <i>ma non</i> se è scattato l’allarme. Serve un’algebra per scrivere e manipolare frasi di questo tipo, e serve che a ogni operazione dell’algebra corrisponda un pezzo di circuito. L’algebra di Boole è esattamente questo: una matematica con due soli valori, in cui ogni formula è un circuito e ogni circuito è una formula.</p>
    <p><b>Le parole nuove.</b> Una <b>porta logica</b> è il circuito elementare che realizza un’operazione (AND, OR, NOT…). Una <b>tabella di verità</b> elenca l’uscita per <i>tutte</i> le combinazioni degli ingressi: con n ingressi ha 2ⁿ righe, e descrive la funzione senza ambiguità. Un <b>letterale</b> è una variabile o la sua negazione (A oppure Ā). Un <b>mintermine</b> è un prodotto che vale 1 su <b>una sola</b> riga della tabella. <b>SOP</b> significa somma di prodotti (OR di AND), <b>POS</b> prodotto di somme (AND di OR).</p>
    <h4>Le porte fondamentali</h4>
    <p>Su due ingressi <code>A</code> e <code>B</code> le uscite valgono, nell'ordine 00, 01, 10, 11:</p>
    <pre>AND  (A∧B)   0 0 0 1      NAND   1 1 1 0
OR   (A∨B)   0 1 1 1      NOR    1 0 0 0
XOR  (A⊕B)   0 1 1 0      XNOR   1 0 0 1</pre>
    <p>Il NOT ha un solo ingresso e inverte. Si legge una tabella di verità «per righe»: la porta è quella la cui colonna di uscita coincide riga per riga.</p>

    <h4>Assiomi e teoremi che servono davvero</h4>
    <ul>
      <li><b>Commutatività</b>: <code>A∧B = B∧A</code>, <code>A∨B = B∨A</code></li>
      <li><b>Associatività</b>: <code>(A∧B)∧C = A∧(B∧C)</code>, e lo stesso per ∨</li>
      <li>Identità: <code>A∧1 = A</code>, <code>A∨0 = A</code></li>
      <li>Annullamento: <code>A∧0 = 0</code>, <code>A∨1 = 1</code></li>
      <li>Idempotenza: <code>A∧A = A</code>, <code>A∨A = A</code></li>
      <li>Complemento: <code>A∧${ovl('A')} = 0</code>, <code>A∨${ovl('A')} = 1</code></li>
      <li>Involuzione: ${ovl(ovl('A'))} <code>= A</code></li>
      <li><b>Assorbimento</b>: <code>A∨(A∧B) = A</code>, <code>A∧(A∨B) = A</code></li>
      <li>Distributività: <code>A∧(B∨C) = (A∧B)∨(A∧C)</code> e, cosa che sorprende chi viene dall'algebra ordinaria, anche <code>A∨(B∧C) = (A∨B)∧(A∨C)</code></li>
    </ul>
    <p>L'assorbimento è il teorema che fa collassare le espressioni ridondanti: <code>A ∨ (A∧${ovl('B')}) = A</code>. È esattamente ciò che rende <b>non minima</b> una SOP scritta senza raggruppare.</p>

    <h4>De Morgan</h4>
    <p>${ovl('A·B')} = ${ovl('A')} + ${ovl('B')} &nbsp;e&nbsp; ${ovl('A+B')} = ${ovl('A')} · ${ovl('B')}. In parole: la negazione di un prodotto è la somma delle negazioni, e viceversa.</p>
    <p>Valgono anche per più di due fattori: ${ovl('A·B·C')} = ${ovl('A')}+${ovl('B')}+${ovl('C')}. Il modo pratico di applicarli è «spezza la barra e cambia l'operatore».</p>

    <h4>Insiemi funzionalmente completi</h4>
    <p>Con soli <code>AND</code> e <code>OR</code> (∧, ∨) non si sintetizza qualsiasi funzione: manca la negazione, e non si ottiene combinandoli — qualunque composizione di AND e OR è una funzione <b>monotòna</b>, mentre il NOT non lo è.</p>
    <p>Sono invece <b>universali</b> sia <code>NAND</code> sia <code>NOR</code>, da soli. Con il NAND:</p>
    <ul>
      <li><code>NOT A</code> = A NAND A</li>
      <li><code>A AND B</code> = NOT(A NAND B) = (A NAND B) NAND (A NAND B)</li>
      <li><code>A OR B</code> = ${ovl('A')} NAND ${ovl('B')} (per De Morgan)</li>
    </ul>
    <p>Avendo NOT, AND e OR si costruisce qualunque rete combinatoria: ecco perché basta un solo tipo di porta.</p>

    <h4>Dalla tabella all'espressione: SOP e POS</h4>
    <p>Ogni funzione si scrive in due forme canoniche:</p>
    <ul>
      <li><b>SOP</b> (somma di prodotti): un <b>mintermine</b> per ogni riga con uscita 1, in cui ogni variabile compare diretta se vale 1, negata se vale 0. Si sommano i mintermini.</li>
      <li><b>POS</b> (prodotto di somme): un <b>maxtermine</b> per ogni riga con uscita 0, con le variabili invertite rispetto al mintermine. Si moltiplicano i maxtermini.</li>
    </ul>
    <p>La forma canonica è sempre corretta ma quasi mai minima: minimizzarla è il lavoro della mappa di Karnaugh.</p>

    <h4>L'algebra booleana degli insiemi</h4>
    <p>La stessa struttura algebrica descrive due mondi diversi: la logica della commutazione e
    gli insiemi. Le operazioni si corrispondono una a una:</p>
    <pre>logica          insiemi                significato
A ∨ B  (OR)     A ∪ B  (unione)        sta in almeno uno dei due
A ∧ B  (AND)    A ∩ B  (intersezione)  sta in entrambi
NOT A           complemento di A        tutto ciò che non sta in A
1               insieme universo
0               insieme vuoto
A ⊕ B  (XOR)    differenza simmetrica   sta in uno solo dei due</pre>
    <p>Ecco perché le stesse leggi valgono di là: De Morgan diventa «il complemento dell'unione è
    l'intersezione dei complementi», e i diagrammi di Venn sono una dimostrazione visiva dei
    teoremi booleani. All'esame la domanda arriva in entrambe le direzioni: quale operazione
    insiemistica corrisponde all'OR (l'<b>unione</b>), e quale proprietà è fondamentale
    nell'algebra di Boole (la <b>commutatività</b> — l'AND è associativo e commutativo come l'OR,
    contrariamente a quanto suggeriscono certe abitudini di disegno).</p>

    <h4>XOR, che torna spesso</h4>
    <p><code>A⊕0 = A</code>, <code>A⊕1 = ${ovl('A')}</code>, <code>A⊕A = 0</code>. Lo XOR vale 1 quando gli ingressi sono <b>diversi</b>, quindi è il rilevatore di disuguaglianza (e lo XNOR il comparatore di uguaglianza). È anche il generatore di parità e, come si è visto, il rilevatore di overflow in CP2.</p>
    <h4>Esempio svolto</h4>
    <p><b>Funzione maggioranza:</b> Y vale 1 quando almeno due dei tre ingressi valgono 1.</p>
    <pre>A B C │ Y
0 0 0 │ 0      Righe a 1: 011, 101, 110, 111
0 0 1 │ 0
0 1 0 │ 0
0 1 1 │ 1
1 0 0 │ 0
1 0 1 │ 1
1 1 0 │ 1
1 1 1 │ 1</pre>
    <p>SOP canonica — un termine per ogni riga a 1:</p>
    <pre>Y = Ā·B·C + A·B̄·C + A·B·C̄ + A·B·C</pre>
    <p>Si semplifica raccogliendo, e il trucco è <b>riusare</b> l'ultimo termine tre volte (è lecito: <code>x + x = x</code>):</p>
    <pre>Y = (Ā·B·C + A·B·C) + (A·B̄·C + A·B·C) + (A·B·C̄ + A·B·C)
  = B·C·(Ā + A) + A·C·(B̄ + B) + A·B·(C̄ + C)
  = <b>A·B + A·C + B·C</b></pre>
    <p>Da quattro termini di tre letterali a tre termini di due: la funzione è la stessa, il circuito è quasi la metà.</p>

    <h4>Errori tipici</h4>
    <ul>
      <li>Applicare De Morgan a metà: <code>A·B</code> negato è <code>Ā + B̄</code> — cambia <b>anche</b> l'operatore, non solo le variabili.</li>
      <li>Scambiare SOP e POS: la SOP guarda le righe a <b>1</b>, la POS quelle a <b>0</b> (e lì le variabili si scrivono negate).</li>
      <li>Dimenticare che <code>x + x = x</code>: è proprio ciò che permette di riusare un mintermine in più raccoglimenti.</li>
    </ul>`,
    exercises: [
      {
        id: 'ex-bool-1',
        level: 'base',
        q: 'Una funzione di tre variabili vale 1 sulle righe <code>000</code>, <code>010</code>, <code>101</code>, <code>111</code>. Scrivi la forma SOP e la forma POS, poi semplifica la SOP.',
        hint: 'La SOP prende una riga a 1 per volta; la POS prende le righe a 0 e <b>nega</b> ogni variabile rispetto alla SOP. Per semplificare, raccogli guardando quali variabili restano costanti.',
        solution: `<pre>A B C │ Y
0 0 0 │ 1
0 0 1 │ 0
0 1 0 │ 1
0 1 1 │ 0
1 0 0 │ 0
1 0 1 │ 1
1 1 0 │ 0
1 1 1 │ 1</pre><p><b>SOP</b> — un termine per ogni riga a 1, con la variabile negata dove vale 0:</p><pre>Y = Ā·B̄·C̄ + Ā·B·C̄ + A·B̄·C + A·B·C</pre><p><b>POS</b> — un termine somma per ogni riga a 0, con la variabile negata dove vale 1:</p><pre>Y = (A+B+C̄)·(A+B̄+C̄)·(Ā+B+C)·(Ā+B̄+C)</pre><p><b>Semplificazione</b>: nei primi due termini B compare una volta negata e una no, quindi sparisce; idem negli ultimi due.</p><pre>Y = Ā·C̄·(B̄ + B) + A·C·(B̄ + B) = Ā·C̄ + A·C</pre><p>Che è la funzione «A e C sono uguali», cioè lo <b>XNOR</b> di A e C: B non conta affatto.</p>`,
      },
      {
        id: 'ex-bool-2',
        level: 'base',
        q: 'Dimostra che <code>A + Ā·B = A + B</code>.',
        hint: 'Due strade: la tabella di verità (otto righe, quattro qui) oppure l’algebra, aggiungendo un termine che non cambia nulla.',
        solution: `<p><b>Per tabella</b>:</p><pre>A B │ Ā·B │ A + Ā·B │ A + B
0 0 │  0  │    0    │   0
0 1 │  1  │    1    │   1
1 0 │  0  │    1    │   1
1 1 │  0  │    1    │   1</pre><p>Le due colonne coincidono. <b>Per algebra</b>, sfruttando A = A + A·B (assorbimento):</p><pre>A + Ā·B = A + A·B + Ā·B = A + B·(A + Ā) = A + B·1 = A + B</pre><p>Intuizione: se A vale 1 la somma vale 1 comunque; se A vale 0, allora Ā·B si riduce a B. In entrambi i casi il risultato è «A oppure B».</p>`,
      },
      {
        id: 'ex-bool-3',
        level: 'esame',
        q: 'Nega l’espressione <code>Y = (A + B̄)·(C + D)</code> e portala in somma di prodotti.',
        hint: 'De Morgan due volte: prima sul prodotto esterno, poi dentro ciascuna somma. Ricorda che cambia anche l’operatore, non solo le variabili.',
        solution: `<pre>Ȳ = [ (A + B̄)·(C + D) ]̅

primo De Morgan (il prodotto diventa somma):
Ȳ = (A + B̄)̅ + (C + D)̅

secondo De Morgan (dentro le parentesi):
(A + B̄)̅ = Ā·B
(C + D)̅ = C̄·D̄

Ȳ = <b>Ā·B + C̄·D̄</b></pre><p>Controllo su un caso: con A=0, B=1, C=0, D=0 l’espressione di partenza vale (0+0)·(0+0) = 0, quindi Ȳ deve valere 1 — e infatti Ā·B = 1·1 = 1 ✓.</p>`,
      },
      {
        id: 'ex-bool-4',
        level: 'esame',
        q: 'Realizza <code>Y = A·B + C</code> usando <b>solo porte NAND</b>. Quante ne servono?',
        hint: 'Parti dalla forma negata due volte: <code>Y = (Ȳ)̅</code>. Una NAND con i due ingressi uniti è un NOT.',
        solution: `<p>Si applica la doppia negazione e poi De Morgan:</p><pre>Y = A·B + C = [ (A·B)̅ · C̄ ]̅</pre><p>che è esattamente la NAND fra <code>(A·B)̅</code> e <code>C̄</code>. Servono <b>tre</b> NAND:</p><pre>N1 = A NAND B          → vale (A·B)̅
N2 = C NAND C          → vale C̄  (NOT con ingressi uniti)
Y  = N1 NAND N2        → vale A·B + C</pre><p>Verifica con A=1, B=1, C=0: N1 = 0, N2 = 1, Y = (0·1)̅ = 1 ✓. E con A=0, B=1, C=0: N1 = 1, N2 = 1, Y = (1·1)̅ = 0 ✓.</p>`,
      },
      {
        id: 'ex-bool-5',
        level: 'esame',
        q: 'In un’aula, <b>A</b> è l’insieme di chi ha superato Analisi e <b>B</b> quello di chi ha superato Fisica. Traduci in algebra booleana: «ha superato <b>esattamente uno</b> dei due esami» e «non ne ha superato nessuno». Semplifica dove possibile.',
        hint: 'Insiemi e algebra di Boole sono la stessa struttura: unione ↔ OR, intersezione ↔ AND, complemento ↔ NOT. Traduci la frase in insiemi e poi sostituisci gli operatori.',
        solution: '<p><b>Esattamente uno</b> significa «A e non B, oppure B e non A»:</p><pre>(A ∩ B̄) ∪ (Ā ∩ B)   →   A·B̄ + Ā·B   =   A ⊕ B</pre><p>È la definizione stessa dello <b>XOR</b>, che infatti si chiama anche «somma disgiuntiva».</p><p><b>Nessuno dei due</b> è il complemento dell’unione:</p><pre>(A ∪ B)̅   →   (A + B)̅   =   Ā·B̄</pre><p>e il passaggio dall’una all’altra forma è <b>De Morgan</b>: il complemento di un’unione è l’intersezione dei complementi. È lo stesso teorema che si usa sui circuiti, scritto con simboli diversi.</p>',
      },
    ],
  };
