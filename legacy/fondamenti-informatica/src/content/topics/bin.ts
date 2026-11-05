import type { Topic } from '../types';

export const bin: Topic = {
    id: 'bin',
    title: 'Numeri binari & complemento a 2',
    blurb: "Basi, rappresentazioni con segno, range, overflow. La parte più «spremuta» all'esame.",
    trapIds: ['trap-ram'],
    summary: [
      'Una notazione è <b>posizionale</b> quando il valore di una cifra dipende dalla posizione: il numero vale Σ cifra × base^posizione. Cambiare base è cambiare quel <i>peso</i>, non le regole.',
      'Una cifra esadecimale vale esattamente <b>4 bit</b> perché 16 = 2⁴: si converte a gruppi di quattro, sempre <b>partendo da destra</b>.',
      'In complemento a 2 il bit più significativo pesa <b>−2ᴺ⁻¹</b>. Negare = invertire tutti i bit e sommare 1.',
      'Su N bit l\'intervallo è −2ᴺ⁻¹ … +2ᴺ⁻¹−1: <b>asimmetrico</b>, con un solo zero.',
      '<b>Overflow ≠ riporto uscente.</b> L\'overflow è lo XOR fra riporto entrante e uscente dal bit di segno.',
    ],
    checks: [
      {
        q: 'Perché in complemento a 2 lo zero ha una sola codifica, mentre in modulo e segno ne ha due?',
        a: 'Perché il bit più significativo non è un\'etichetta di segno ma una <b>cifra di peso negativo</b>: lo zero si scrive in un modo solo. In modulo e segno il segno è un bit a parte, quindi esistono +0 e −0.',
      },
      {
        q: 'Sommando due numeri di segno opposto può esserci overflow?',
        a: 'No. Il risultato sta sempre fra i due addendi, quindi resta nell\'intervallo rappresentabile. L\'overflow può nascere <b>solo</b> sommando due numeri dello stesso segno.',
      },
      {
        q: 'Converti 1011 0110₂ in esadecimale e spiega perché il metodo funziona.',
        a: '<code>B6</code>. Si raggruppano i bit a quattro a quattro da destra: 1011 = B, 0110 = 6. Funziona perché 16 = 2⁴, quindi ogni gruppo di quattro bit è esattamente una cifra esadecimale.',
      },
    ],
    body: `
    <h4>Da dove si parte</h4>
    <p><b>Cosa serve sapere prima:</b> nulla. Questo è il primo modulo, e tutto il resto del corso vi poggia sopra. Basta saper contare e fare divisioni con il resto.</p>
    <p><b>Che problema risolve.</b> Un calcolatore è fatto di interruttori: ogni filo può essere solo alto o basso, acceso o spento, 1 o 0. Non esiste un filo «che vale 7». Se vogliamo che una macchina fatta così maneggi numeri, dobbiamo decidere <b>come scrivere un numero usando solo due simboli</b> — e come scrivere anche i numeri <b>negativi</b>, visto che non abbiamo un filo per il segno «−». Questo modulo risponde a entrambe le domande.</p>
    <p><b>Le parole nuove.</b> Un <b>bit</b> è una cifra binaria, cioè una casella che vale 0 o 1. Un <b>byte</b> sono otto bit. Il bit <b>più significativo</b> (MSB) è quello più a sinistra, quello che pesa di più; il <b>meno significativo</b> (LSB) è quello più a destra. Una <b>rappresentazione</b> è un accordo su come interpretare una sequenza di bit: gli stessi otto bit possono voler dire 200 oppure −56, a seconda dell’accordo che abbiamo scelto. Non c’è nulla nei bit che lo dica: lo sa il programma.</p>
    <h4>Basi e conversioni</h4>
    <p>Un numero in base <code>b</code> è una somma di cifre pesate: <code>1011₂ = 1·2³ + 0·2² + 1·2¹ + 1·2⁰ = 11</code>. Per convertire da decimale a binario si divide ripetutamente per 2 e si leggono i resti <b>dal basso verso l'alto</b>.</p>
    <p>Esadecimale e ottale servono solo ad accorciare la scrittura: una cifra hex vale <b>4 bit</b>, una ottale <b>3 bit</b>. Si converte raggruppando, senza passare dal decimale:</p>
    <pre>1011 0110₂  →  B    6    →  0xB6
   ↑    ↑        11   6</pre>
    <p>Da decimale a esadecimale conviene dividere per 16: <code>182 = 11·16 + 6 → B6</code>.</p>

    <h4>Che cosa rende «posizionale» una notazione</h4>
    <p>In una notazione posizionale il valore di una cifra dipende da <b>dove</b> sta: ogni
    posizione pesa una potenza della base. Servono due ingredienti, e solo due:</p>
    <ul>
      <li><b>b simboli</b> distinti per le cifre, da 0 a b−1;</li>
      <li>uno <b>zero</b>, per dire «questa posizione è vuota» — senza, non si distingue 12 da 102.</li>
    </ul>
    <p>Cambiare base significa cambiare quanti oggetti servono in una posizione prima di
    «riportare» a quella successiva. In base 10 si riporta a dieci, in base 2 a due, in base 20 a
    venti. La regola di conversione è sempre la stessa: <b>divisioni successive per la base</b>,
    leggendo i resti dal basso.</p>
    <p>Un sistema che usa gruppi di oggetti — sassolini su un abaco, punti e barre come nella
    numerazione Maya, che è <b>vigesimale</b> (base 20) — si adatta a un'altra base semplicemente
    ridefinendo <i>quando</i> un gruppo si converte in un simbolo di ordine superiore. Per passare
    a base 8 servono otto simboli e il riporto scatta a otto; per base 16 ne servono sedici e il
    riporto scatta a sedici. Il meccanismo posizionale non cambia: cambia solo la soglia di
    raggruppamento, e quanti simboli distinti bisogna inventare.</p>

    <h4>Rappresentazioni con segno</h4>
    <p>Con N bit si possono codificare 2ᴺ configurazioni: la domanda è come spenderle fra positivi e negativi.</p>
    <ul>
      <li><b>Modulo e segno</b>: il bit più significativo è il segno, il resto è il valore assoluto. Intervallo simmetrico, ma <b>due</b> codifiche dello zero (+0 e −0) e l'aritmetica richiede di confrontare i segni.</li>
      <li><b>Complemento a 1</b>: il negativo si ottiene invertendo tutti i bit. Ancora <b>due</b> zeri, e la somma richiede il riporto circolare.</li>
      <li><b>Complemento a 2</b>: il negativo si ottiene invertendo i bit e sommando 1. <b>Una sola</b> codifica dello zero e intervallo asimmetrico.</li>
    </ul>

    <h4>Perché all'esame si usa il complemento a 2</h4>
    <p>Non è una convenzione arbitraria: in CP2 la <b>sottrazione diventa una somma</b>, perché <code>A − B = A + (−B)</code> e il negativo è ottenibile con un invertitore e un riporto entrante. Serve quindi <b>un solo sommatore</b> per entrambe le operazioni, e non c'è nessun caso speciale da trattare sui segni.</p>
    <p>Il bit più significativo ha peso <b>negativo</b>: su 4 bit, <code>1011₂ = −8 + 0 + 2 + 1 = −5</code>. È il modo più rapido per leggere un CP2 senza fare l'inversione.</p>

    <h4>Range</h4>
    <ul>
      <li>Senza segno: da <code>0</code> a <code>2ᴺ−1</code> (con 8 bit → 0…255).</li>
      <li>CP2: da <code>−2ᴺ⁻¹</code> a <code>+2ᴺ⁻¹−1</code> (con 8 bit → −128…+127).</li>
      <li>CP1 e modulo-e-segno: da <code>−(2ᴺ⁻¹−1)</code> a <code>+2ᴺ⁻¹−1</code>, simmetrico.</li>
    </ul>
    <p>L'asimmetria del CP2 è la ragione per cui <code>−128</code> esiste su 8 bit ma <code>+128</code> no: il suo opposto non è rappresentabile, e invertire-e-sommare-1 su <code>10000000</code> restituisce sé stesso.</p>

    <h4>Estensione del segno</h4>
    <p>Per portare un CP2 da N a M bit (M &gt; N) si <b>replica il bit di segno</b> a sinistra, non si riempie di zeri: <code>1011</code> (−5 su 4 bit) diventa <code>11111011</code> su 8 bit. Riempire di zeri darebbe 251.</p>

    <h4>Overflow — e perché non è il riporto uscente</h4>
    <p>Si ha overflow quando il risultato esce dall'intervallo rappresentabile. Due regole equivalenti:</p>
    <ul>
      <li><b>Per segni</b>: sommando due operandi <b>concordi</b> si ottiene un risultato di segno opposto. Sommando due discordi l'overflow è impossibile. Nella sottrazione il caso a rischio è quello fra operandi <b>discordi</b>.</li>
      <li><b>In hardware</b>: <code>overflow = C<sub>in</sub> ⊕ C<sub>out</sub></code> sul bit di segno, cioè lo XOR fra il riporto che entra nel bit più significativo e quello che ne esce.</li>
    </ul>
    <p>Il <b>riporto uscente da solo non significa nulla</b> in CP2. Due controesempi da tenere a mente:</p>
    <pre>4 bit:  −1 + 1  →  1111 + 0001 = 0000   carry=1  overflow=0
4 bit:   4 + 4  →  0100 + 0100 = 1000   carry=0  overflow=1</pre>
    <p>Il carry out segnala overflow solo nell'aritmetica <b>senza segno</b>. Confonderli è una perdita di punti classica: nello Strumento «Sommatore binario» i due flag sono mostrati separati apposta.</p>

    <h4>Shift</h4>
    <p>Shift a sinistra di k posizioni ≈ moltiplicazione per 2ᵏ; shift a destra ≈ divisione intera per 2ᵏ. Attenzione al tipo di shift a destra:</p>
    <ul>
      <li><b>Logico</b>: entra 0 da sinistra. Corretto per i numeri senza segno.</li>
      <li><b>Aritmetico</b>: replica il bit di segno. Necessario in CP2, altrimenti un negativo diventa positivo.</li>
    </ul>
    <p>Eliminare il bit meno significativo di un intero senza segno equivale a dividerlo per 2.</p>
    <h4>Esempio svolto</h4>
    <p><b>Rappresenta −45 su 8 bit e verifica il risultato.</b></p>
    <pre>45 = 32 + 8 + 4 + 1        →  0010 1101
inverti tutti i bit        →  1101 0010
somma 1                    →  1101 0011   =  D3₁₆</pre>
    <p>Verifica: 45 + (−45) deve fare 0. <code>0010 1101 + 1101 0011 = 1 0000 0000</code>: gli otto bit bassi sono tutti zero, il nono è il <b>riporto uscente</b> che si scarta. Riporto uscente = 1, overflow = 0 — ed è la prova che i due flag sono cose diverse.</p>
    <p><b>Ora 45 − 60 su 8 bit.</b> Si somma il complemento a 2 di 60:</p>
    <pre>60 = 0011 1100  →  −60 = 1100 0100

  0010 1101   (45)
+ 1100 0100   (−60)
= 1111 0001   →  è negativo: inverti e +1 → 0000 1111 = 15, quindi −15 ✓</pre>
    <p>Riporto uscente 0, overflow 0: gli addendi hanno segno opposto, quindi l'overflow è <b>impossibile</b> per costruzione.</p>

    <h4>Errori tipici</h4>
    <ul>
      <li>Invertire i bit e <b>dimenticare il +1</b>: si ottiene il complemento a 1, che è un'altra rappresentazione.</li>
      <li>Estendere un numero negativo riempiendo di zeri: l'estensione del segno replica il <b>bit più significativo</b>, non lo zero.</li>
      <li>Chiamare overflow il riporto uscente. In complemento a 2 il riporto uscente da solo <b>non</b> segnala nulla.</li>
      <li>Raggruppare i bit per l'esadecimale partendo da sinistra: si parte sempre <b>da destra</b>, aggiungendo zeri in testa se serve.</li>
    </ul>`,
    exercises: [
      {
        id: 'ex-bin-1',
        level: 'base',
        q: 'Converti <b>173₁₀</b> in binario, ottale ed esadecimale.',
        hint: 'Per il binario, divisioni successive per 2 leggendo i resti dal basso — oppure la somma di potenze. Poi dal binario si passa a ottale e esadecimale <b>raggruppando i bit</b>, rispettivamente a tre a tre e a quattro a quattro, sempre partendo da destra.',
        solution: `<pre>173 = 128 + 32 + 8 + 4 + 1
    = 1010 1101₂

ottale      → 10 101 101 → 0 2 5 5   =  255₈
esadecimale → 1010 1101  → A D       =  AD₁₆</pre><p>Il raggruppamento funziona perché 8 = 2³ e 16 = 2⁴: tre bit sono esattamente una cifra ottale, quattro una esadecimale. Nel gruppo più a sinistra si aggiungono zeri in testa se non è completo.</p>`,
      },
      {
        id: 'ex-bin-2',
        level: 'base',
        q: 'Rappresenta <b>−87</b> in complemento a 2 su 8 bit e scrivi il risultato in esadecimale.',
        hint: 'Tre passaggi: il modulo in binario, l’inversione di tutti i bit, la somma di 1. Il segno non è un bit a parte da mettere «a mano».',
        solution: `<pre>87 = 64 + 16 + 4 + 2 + 1   →  0101 0111
inverti                    →  1010 1000
somma 1                    →  1010 1001  =  A9₁₆</pre><p>Verifica veloce: il bit più significativo è 1, quindi il numero è negativo. Rileggendolo — inverti e somma 1 — si torna a 0101 0111 = 87, quindi il valore è −87. ✓</p>`,
      },
      {
        id: 'ex-bin-3',
        level: 'esame',
        q: 'Su 8 bit, in complemento a 2, calcola <b>100 + 45</b>. Indica il valore che la macchina legge, il <b>riporto uscente</b> e il flag di <b>overflow</b>.',
        hint: 'Somma i due numeri come se fossero senza segno, poi guarda separatamente il riporto che <i>entra</i> nel bit di segno e quello che <i>esce</i>.',
        solution: `<pre>  0110 0100   (100)
+ 0010 1101   (45)
─────────────
  1001 0001</pre><p>Il risultato ha il bit più significativo a 1, quindi letto in complemento a 2 vale −111 (inverti e somma 1: 0110 1111 = 111). Ma 100 + 45 fa 145, che su 8 bit in CP2 <b>non è rappresentabile</b>: il massimo è +127.</p><pre>riporto uscente        = 0
riporto entrante segno = 1
overflow = 1 ⊕ 0       = <b>1</b></pre><p>Ecco perché i due flag vanno tenuti distinti: qui il riporto uscente è <b>zero</b> e ciononostante c’è overflow. La regola dei segni conferma: due addendi positivi con risultato negativo.</p>`,
      },
      {
        id: 'ex-bin-4',
        level: 'esame',
        q: 'Il numero <code>1011₂</code> è scritto in complemento a 2 su 4 bit. Quanto vale? Estendilo a 8 e a 16 bit.',
        hint: 'Prima leggi il valore: bit più significativo a 1 significa negativo. Poi ricorda che estendere non vuol dire riempire di zeri.',
        solution: `<p>Lettura: 1011 ha il MSB a 1 → negativo. Inverti (0100) e somma 1 (0101 = 5), quindi vale <b>−5</b>.</p><pre>4 bit    1011
8 bit    1111 1011
16 bit   1111 1111 1111 1011</pre><p>Si replica il <b>bit di segno</b>, non lo zero. Verifica su 8 bit: inverti (0000 0100) e somma 1 → 0000 0101 = 5, quindi −5 ✓. Con gli zeri avresti ottenuto 0000 1011 = +11, cioè un altro numero.</p>`,
      },
      {
        id: 'ex-bin-5',
        level: 'esame',
        q: 'Un abaco ha quattro aste, e su ogni asta si possono alzare da 0 a 4 palline. In che <b>base</b> conta? Scrivi <b>89₁₀</b> su quell’abaco e di’ qual è il numero più grande rappresentabile.',
        hint: 'Il numero di simboli disponibili per ogni posizione <b>è</b> la base. Poi si procede come per il binario, dividendo per la base invece che per 2.',
        solution: `<p>Ogni asta ha cinque configurazioni (0, 1, 2, 3, 4): le cifre disponibili sono cinque, quindi la base è <b>5</b>. Ogni asta pesa una potenza di 5: 1, 5, 25, 125.</p><pre>89 : 5 = 17  resto 4      ← cifra delle unità
17 : 5 =  3  resto 2
 3 : 5 =  0  resto 3      ← cifra più significativa

89₁₀ = 324₅ = 3·25 + 2·5 + 4 = 75 + 10 + 4 ✓</pre><p>Il più grande è 4444₅ = 5⁴ − 1 = <b>624</b>. Vale la regola generale: con n posizioni in base b si rappresentano bⁿ valori, da 0 a bⁿ − 1 — la stessa che dà 2⁸ = 256 valori su un byte.</p>`,
      },
    ],
  };
