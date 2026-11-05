import type { Topic } from '../types';

export const ff: Topic = {
    id: 'ff',
    title: 'Circuiti sequenziali & flip-flop',
    blurb: 'Latch, flip-flop D/JK/T, master-slave, registri e contatori.',
    trapIds: [],
    prereq: ['bool'],
    summary: [
      '<b>Combinatorio</b>: l\'uscita dipende solo dagli ingressi adesso. <b>Sequenziale</b>: dipende anche dallo <b>stato</b>, cioè dal passato.',
      '<b>Latch</b> = sensibile al <b>livello</b> (trasparente finché l\'abilitazione è attiva). <b>Flip-flop</b> = sensibile al <b>fronte</b>.',
      'SR ha la combinazione proibita S = R = 1; il D la elimina; il JK la usa per commutare; il T commuta a comando.',
      '<b>Master-slave</b>: due latch in cascata con clock opposti — il dato entra su un fronte ed esce sull\'altro, quindi si campiona una volta per periodo.',
      'Registri a scorrimento e contatori si costruiscono con flip-flop D o T; l\'accesso può essere seriale o parallelo.',
      '<b>Setup</b> e <b>hold</b> vanno rispettati attorno al fronte: violarli porta a metastabilità, cioè a un\'uscita che non si decide.',
    ],
    checks: [
      {
        q: 'Perché un latch D trasparente non basta a costruire un registro di pipeline?',
        a: 'Perché finché l\'abilitazione è alta l\'uscita insegue l\'ingresso: il dato può attraversare più stadi nello stesso colpo di clock. Il flip-flop campiona <b>solo sul fronte</b>, quindi ogni stadio avanza di un passo per periodo.',
      },
      {
        q: 'Che differenza c\'è fra setup time e hold time?',
        a: 'Il <b>setup</b> è quanto tempo prima del fronte il dato deve essere già stabile; l\'<b>hold</b> è quanto deve restarlo dopo il fronte. Sono due vincoli diversi e vanno rispettati entrambi.',
      },
      {
        q: 'Come si ottiene un contatore modulo 10 da un contatore binario a 4 bit?',
        a: 'Si rileva con una porta la configurazione 1010 e la si usa per azzerare il contatore: si contano così i valori da 0 a 9 e si riparte.',
      },
    ],
    body: `
    <h4>Da dove si parte</h4>
    <p><b>Cosa serve sapere prima:</b> le porte logiche dal modulo su <a href="#/study/bool">algebra di Boole</a>. Aiuta aver visto le <a href="#/study/comb">reti combinatorie</a>, ma non è indispensabile.</p>
    <p><b>Che problema risolve.</b> Finora ogni circuito visto dimentica tutto: cambia l’ingresso, cambia l’uscita, e del passato non resta traccia. Ma un calcolatore deve <b>ricordare</b>: il valore di un registro, il contenuto di una cella, il punto del programma a cui è arrivato. Serve un circuito che, tolto l’ingresso, <b>mantenga</b> il valore. Si ottiene con un’idea sola: prendere l’uscita e riportarla all’ingresso, creando un anello che si sostiene da sé. Da lì nascono latch, flip-flop, registri e contatori — e con essi la nozione di <b>stato</b>.</p>
    <p><b>Le parole nuove.</b> Lo <b>stato</b> è ciò che il circuito ricorda. La <b>retroazione</b> è l’uscita riportata all’ingresso. Il <b>clock</b> è il segnale periodico che scandisce quando aggiornare lo stato; il <b>livello</b> è il suo valore (alto o basso), il <b>fronte</b> è l’istante in cui cambia. Un circuito <b>trasparente</b> lascia passare l’ingresso all’uscita mentre è abilitato; uno sensibile al fronte campiona solo nell’istante del cambiamento.</p>
    <h4>Combinatorio vs sequenziale</h4>
    <p>In una rete <b>combinatoria</b> l'uscita dipende solo dagli ingressi attuali. In una rete <b>sequenziale</b> dipende anche dallo <b>stato</b>, cioè dalla storia passata: serve un elemento di memoria, ottenuto con la <b>retroazione</b> (l'uscita rientra come ingresso).</p>

    <h4>Il latch SR</h4>
    <p>Due porte NOR retroazionate incrociate. Con <code>S=1, R=0</code> l'uscita va a 1 (set); con <code>S=0, R=1</code> va a 0 (reset); con <code>S=R=0</code> <b>mantiene</b> lo stato precedente — è la memoria. La combinazione <code>S=R=1</code> è <b>proibita</b>: forza entrambe le uscite allo stesso valore e, al rilascio, lo stato finale è imprevedibile (dipende da quale porta commuta prima).</p>

    <h4>Il latch D e il problema della trasparenza</h4>
    <p>Il latch D elimina lo stato proibito generando <code>R</code> come negazione di <code>S</code>: c'è un solo ingresso dato. Con un segnale di abilitazione (<b>gated latch</b>) il dato passa solo quando il clock è alto — ma finché resta alto il latch è <b>trasparente</b>: ogni variazione dell'ingresso attraversa il dispositivo. In una rete retroazionata questo provoca corse e stati instabili.</p>

    <h4>Flip-flop: il fronte, non il livello</h4>
    <p>Un <b>flip-flop</b> è un elemento bistabile che memorizza <b>1 bit</b> e commuta solo sul <b>fronte</b> del clock (edge-triggered), non sul livello. L'istante di campionamento è quindi puntuale e prevedibile.</p>
    <ul>
      <li><b>Sincroni</b>: cambiano stato solo al fronte di clock.</li>
      <li><b>Asincroni</b>: reagiscono immediatamente agli ingressi, senza clock. Tipici gli ingressi di preset/clear, che agiscono comunque.</li>
    </ul>

    <h4>Master-slave</h4>
    <p>Due latch D in serie con clock opposti: il <b>master</b> campiona l'ingresso mentre il clock è alto, lo <b>slave</b> ne trasferisce il valore in uscita quando il clock commuta. Poiché i due stadi <b>non sono mai trasparenti contemporaneamente</b>, l'ingresso non può attraversare il dispositivo nello stesso ciclo: si evitano le corse e l'uscita cambia in un solo istante ben definito.</p>

    <h4>I tipi che escono all'esame</h4>
    <ul>
      <li><b>D</b>: <code>Q⁺ = D</code>. È il registro elementare.</li>
      <li><b>JK</b>: <code>J=K=0</code> mantiene, <code>J=1,K=0</code> set, <code>J=0,K=1</code> reset, <code>J=K=1</code> <b>commuta</b> (toggle). Non ha combinazioni proibite.</li>
      <li><b>T</b>: <code>T=0</code> mantiene, <code>T=1</code> commuta. È un JK con gli ingressi uniti; è il mattone dei contatori.</li>
    </ul>

    <h4>Registri e contatori</h4>
    <p>N flip-flop D in parallelo sullo stesso clock formano un <b>registro</b> a N bit. Collegandoli in cascata, con l'uscita di uno nell'ingresso del successivo, si ottiene un <b>registro a scorrimento</b> (shift register), usato per moltiplicare/dividere per 2 e per la conversione serie-parallelo.</p>
    <p>Un <b>contatore</b> si costruisce con flip-flop T. Nella versione <b>asincrona</b> (ripple) il clock di ogni stadio è l'uscita del precedente: semplice, ma i ritardi si accumulano e le uscite non cambiano tutte insieme. Nella versione <b>sincrona</b> tutti condividono lo stesso clock e la logica combinatoria decide chi commuta: più veloce e senza stati spuri.</p>

    <h4>Varianti che escono all'esame</h4>
    <ul>
      <li><b>Latch SR con NAND</b>: stessa struttura del NOR ma con la logica invertita — gli
      ingressi sono attivi <b>bassi</b> e la combinazione proibita è <code>S=R=0</code>.</li>
      <li><b>Registro a scorrimento ad accesso parallelo</b>: oltre a scorrere, può essere
      caricato in un colpo solo su tutti i bit. Un multiplexer davanti a ogni flip-flop sceglie
      fra «prendi dal vicino» (scorrimento) e «prendi dall'ingresso parallelo» (caricamento).
      È il ponte fra formato seriale e parallelo.</li>
      <li><b>Contatore su/giù</b>: la logica combinatoria fra gli stadi viene commutata da una
      linea di direzione, così lo stesso circuito conta in avanti o all'indietro.</li>
    </ul>

    <h4>Tempi</h4>
    <p>Il dato deve essere stabile un po' <b>prima</b> del fronte (<i>setup time</i>) e restare stabile un po' <b>dopo</b> (<i>hold time</i>). Il periodo minimo di clock è vincolato dal ritardo di propagazione più lungo fra due registri, più il setup.</p>
    <h4>Esempio svolto</h4>
    <p><b>Stesso ingresso, due componenti diversi.</b> Il clock è alto nella prima metà del periodo; D cambia due volte <i>durante</i> quella metà:</p>
    <pre>clock   ‾‾‾|___|‾‾‾|___
D       0  1 0 1   1
latch D 0  1 0 1   1     ← trasparente: insegue D per tutto il livello alto
FF-D ↑  0  1 1 1   1     ← campiona SOLO sul fronte di salita</pre>
    <p>Il latch ha seguito ogni variazione; il flip-flop ha registrato solo il valore presente <b>sul fronte</b>. È esattamente la ragione per cui i registri di una pipeline sono flip-flop: garantiscono un avanzamento per periodo, qualunque cosa faccia il combinatorio nel frattempo.</p>
    <p><b>Contatore modulo 6</b> (0…5) con flip-flop D: si conta in binario su 3 bit e si rileva con una AND la configurazione <code>110</code> (cioè 6), usandone l'uscita per azzerare il contatore. Il conteggio diventa 0,1,2,3,4,5,0,… — e lo stesso schema con <code>1010</code> dà il modulo 10.</p>

    <h4>Errori tipici</h4>
    <ul>
      <li>Dire «il latch è più lento»: non è una questione di velocità ma di <b>quando</b> campiona — livello contro fronte.</li>
      <li>Dimenticare che nel JK la combinazione J = K = 1 <b>commuta</b> lo stato invece di essere proibita: è il motivo per cui esiste.</li>
      <li>Costruire un contatore asincrono (ogni flip-flop pilotato dall'uscita del precedente) e stupirsi dei <b>glitch</b>: i ritardi si sommano e le uscite non cambiano tutte insieme.</li>
    </ul>`,
    exercises: [
      {
        id: 'ex-ff-1',
        level: 'base',
        q: 'Come si ottiene un flip-flop <b>D</b> partendo da uno <b>SR</b>? Che cosa si guadagna?',
        hint: 'Il problema dello SR è la combinazione S = R = 1. Basta rendere impossibile che i due ingressi valgano lo stesso valore.',
        solution: `<pre>D ──┬────────── S
    └──▷o────── R        (un solo invertitore)</pre><p>Con S = D e R = D̄ gli ingressi sono sempre opposti: le combinazioni possibili diventano due — S=1,R=0 (imposta) e S=0,R=1 (azzera) — e la combinazione proibita <b>non è più raggiungibile</b>.</p><p>Il guadagno è che il componente diventa utilizzabile senza precauzioni: qualunque valore di D produce un comportamento definito, cioè «al prossimo fronte l’uscita diventa D». È il motivo per cui i registri si costruiscono con flip-flop D e non con SR.</p>`,
      },
      {
        id: 'ex-ff-2',
        level: 'base',
        q: 'Un flip-flop <b>JK</b> ha J = K = 1 in modo permanente e riceve un clock a 100 MHz. Che segnale esce da Q?',
        hint: 'Guarda che cosa fa il JK con quella combinazione, e conta quanti fronti servono perché l’uscita torni al valore di partenza.',
        solution: `<p>Con J = K = 1 il JK <b>commuta</b> a ogni fronte attivo: 0 → 1 → 0 → 1…</p><pre>clock  ↑    ↑    ↑    ↑    ↑    ↑
Q      1    0    1    0    1    0</pre><p>Servono <b>due</b> fronti perché Q completi un periodo, quindi l’uscita è un’onda quadra a <b>50 MHz</b>: il flip-flop funziona da <b>divisore di frequenza per 2</b>.</p><p>Mettendone n in cascata si divide per 2ⁿ — ed è esattamente la struttura di un contatore asincrono, dove ogni stadio è pilotato dall’uscita del precedente.</p>`,
      },
      {
        id: 'ex-ff-3',
        level: 'esame',
        q: 'Progetta un <b>contatore modulo 6</b> sincrono (conta 0…5 e riparte) a partire da un contatore binario a 3 bit.',
        hint: 'Tre bit contano fino a 7. Serve rilevare il primo valore <b>di troppo</b> e usarlo per riportare il contatore a zero.',
        solution: "<p>Il conteggio deve essere 000, 001, 010, 011, 100, 101 e poi tornare a 000. Il primo valore da non raggiungere è <b>6 = 110</b>.</p><pre>RESET = Q₂ · Q₁ · Q̄₀        (vale 1 quando l'uscita è 110)</pre><p>Il segnale RESET va all’ingresso di azzeramento <b>sincrono</b> del contatore: al fronte successivo l’uscita torna a 000.</p><p>Nota da esame: se l’azzeramento fosse <b>asincrono</b>, il valore 110 comparirebbe per un istante brevissimo prima di sparire — un <i>glitch</i> che può ingannare la logica a valle. Con l’azzeramento sincrono lo stato 110 non viene mai raggiunto. Lo stesso schema con <code>Q₃·Q₁</code> (cioè 1010) dà il contatore modulo 10, quello dei display decimali.</p>",
      },
      {
        id: 'ex-ff-4',
        level: 'esame',
        q: 'Un registro a scorrimento a 4 bit contiene <code>1011</code> e scorre <b>a destra</b>. Entrano in serie, un bit per colpo di clock, i valori 1, 0, 1. Scrivi il contenuto dopo ogni colpo.',
        hint: 'A ogni colpo tutti i bit si spostano di una posizione: il nuovo bit entra dalla parte opposta a quella in cui esce l’ultimo.',
        solution: `<pre>partenza          1 0 1 1

colpo 1, entra 1  1 1 0 1     (esce 1)
colpo 2, entra 0  0 1 1 0     (esce 1)
colpo 3, entra 1  1 0 1 1     (esce 0)</pre><p>Dopo tre colpi il contenuto è tornato a 1011 per pura coincidenza dei bit immessi — non c’è nessun ciclo automatico, a meno che l’uscita non venga <b>riportata all’ingresso</b>: in quel caso si ottiene un registro circolare, che ripete il contenuto ogni 4 colpi.</p><p>Da ricordare: con accesso <b>seriale</b> servono n colpi per caricare n bit, con accesso <b>parallelo</b> uno solo. La conversione fra i due è proprio ciò che fa un registro a scorrimento a caricamento parallelo, usato in ogni interfaccia seriale.</p>`,
      },
      {
        id: 'ex-ff-5',
        level: 'esame',
        q: 'In uno stadio sincrono: ritardo di propagazione del flip-flop 2 ns, rete combinatoria 7 ns nel cammino più lungo e 1 ns in quello più corto, setup 1,5 ns, hold 0,5 ns. Qual è la <b>frequenza massima</b>? Il vincolo di hold è rispettato?',
        hint: 'Due vincoli distinti: il periodo dipende dal cammino <b>più lungo</b>, il vincolo di hold dal <b>più corto</b> — e non dipende dal periodo.',
        solution: `<p><b>Frequenza massima</b>, dal cammino lungo:</p><pre>T ≥ t_propagazione + t_combinatorio_max + t_setup
  ≥ 2 + 7 + 1,5 = 10,5 ns

f_max = 1 / 10,5 ns ≈ <b>95 MHz</b></pre><p><b>Vincolo di hold</b>, dal cammino corto: il dato nuovo non deve arrivare al flip-flop successivo prima che sia passato il tempo di hold dal fronte.</p><pre>t_propagazione + t_combinatorio_min ≥ t_hold
2 + 1 = 3 ns  ≥  0,5 ns   ✓ rispettato</pre><p>Attenzione: rallentare il clock <b>non</b> risolve una violazione di hold, perché il vincolo non contiene il periodo. Si corregge solo allungando il cammino corto (per esempio inserendo dei buffer) — ed è per questo che le violazioni di hold sono considerate più gravi di quelle di setup.</p>`,
      },
    ],
  };
