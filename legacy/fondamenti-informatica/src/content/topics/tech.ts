import type { Topic } from '../types';

export const tech: Topic = {
  id: 'tech',
  title: 'Tempi, tecnologia & dispositivi programmabili',
  blurb: 'Ritardo di propagazione, cammino critico, fan-in/fan-out, CMOS, PLA e FPGA.',
  trapIds: [],
    prereq: ['bool'],
    summary: [
      '<b>Ritardo di propagazione</b> t<sub>PD</sub>: tempo fra la variazione dell\'ingresso e quella dell\'uscita, misurato al 50% dell\'escursione.',
      'In cascata i ritardi <b>si sommano</b> lungo il cammino: il più lungo è il <b>cammino critico</b> e fissa la frequenza massima di clock.',
      '<b>Fan-in</b> = quanti ingressi ha una porta. <b>Fan-out</b> = quante porte può pilotare: più carico, più capacità, più ritardo.',
      'Una porta <b>CMOS</b> ha una rete di pull-up a pMOS e una di pull-down a nMOS, complementari: a riposo non c\'è percorso fra alimentazione e massa, quindi il consumo statico è quasi nullo.',
      'Logica programmabile: <b>PLA/PAL</b> (piani AND-OR), <b>CPLD</b> e <b>FPGA</b> (celle e interconnessioni riconfigurabili).',
    ],
    checks: [
      {
        q: 'Perché il cammino critico determina la frequenza di clock?',
        a: 'Perché il periodo deve bastare al segnale per attraversare il percorso combinatorio più lungo e arrivare stabile al flip-flop prima del setup. Se il clock è più veloce, il dato campionato è quello sbagliato.',
      },
      {
        q: 'Un buffer aggiunge ritardo: perché a volte si mette lo stesso?',
        a: 'Per pilotare un fan-out elevato: il buffer isola la capacità di carico e la ripartisce, riducendo il ritardo complessivo del ramo rispetto a una porta debole che carica tutto da sola.',
      },
      {
        q: 'Perché il CMOS consuma quasi solo quando commuta?',
        a: 'Perché a regime una delle due reti è aperta: non esiste un percorso continuo fra alimentazione e massa. La corrente scorre solo mentre le capacità si caricano e si scaricano, quindi il consumo dinamico cresce con la frequenza.',
      },
    ],
  body: `
    <h4>Da dove si parte</h4>
    <p><b>Cosa serve sapere prima:</b> che cos’è una porta logica (<a href="#/study/bool">algebra di Boole</a>) e che i circuiti sequenziali sono scanditi da un clock (<a href="#/study/ff">flip-flop</a>).</p>
    <p><b>Che problema risolve.</b> Finora le porte sono state trattate come oggetti ideali: metti gli ingressi, l’uscita appare. Nella realtà l’uscita appare <b>dopo</b>, perché i transistor devono caricare e scaricare delle capacità, e quel ritardo si accumula lungo la catena. È da qui che nasce il limite alla frequenza di clock: non da quanto è «potente» il processore, ma da quanto impiega il segnale più lento ad attraversare la logica fra due registri. Questo modulo spiega da dove viene quel numero, e come si costruiscono fisicamente le porte.</p>
    <p><b>Le parole nuove.</b> Il <b>ritardo di propagazione</b> è il tempo fra la variazione dell’ingresso e quella dell’uscita. Il <b>cammino critico</b> è il percorso più lento fra due registri, e fissa il periodo minimo. Il <b>fan-in</b> è il numero di ingressi di una porta, il <b>fan-out</b> quante porte una singola uscita può pilotare. <b>CMOS</b> è la tecnologia con cui si costruiscono oggi quasi tutte le porte, fatta di transistor complementari.</p>
    <h4>Ritardo di propagazione</h4>
    <p>Una porta logica non commuta all'istante: il segnale impiega un tempo a farsi strada nei
    transistor. Il <b>ritardo di propagazione</b> è l'intervallo fra il momento in cui l'ingresso
    attraversa il 50% dell'escursione e il momento in cui l'uscita fa altrettanto.</p>
    <pre>ingresso   ──────╲__________
                  ╲ 50%
                   │← t_p →│
uscita     ────────────╲______
                        ╲ 50%</pre>
    <p>Da non confondere con il <b>tempo di transizione</b>, che è quanto ci mette il segnale a
    passare dal 10% al 90% del suo valore: quello descrive la <i>pendenza</i> del fronte, il
    ritardo descrive lo <i>spostamento nel tempo</i>.</p>

    <h4>Porte in cascata: il cammino critico</h4>
    <p>È la domanda che esce all'esame. Quando più porte sono in cascata, <b>i ritardi si
    sommano</b>: l'uscita finale è valida solo dopo che il segnale ha attraversato tutta la
    catena. Il ritardo complessivo di una rete combinatoria è quello del suo <b>cammino
    critico</b>, cioè il percorso ingresso→uscita più lento fra tutti.</p>
    <p>Due conseguenze pratiche:</p>
    <ul>
      <li>Il <b>periodo minimo di clock</b> è dettato dal cammino critico fra due registri, più il
      tempo di setup del secondo. Non si può alzare la frequenza oltre quel limite.</li>
      <li>Minimizzare una funzione non serve solo a spendere meno porte: una SOP a due livelli
      (AND poi OR) ha un cammino corto, mentre un'espressione annidata in cinque livelli è
      corrispondentemente più lenta. È un altro motivo per cui la forma minima conta.</li>
    </ul>
    <p>Un ripple-carry a n bit è lento proprio per questo: il riporto attraversa n stadi in fila.</p>

    <h4>Fan-in e fan-out</h4>
    <ul>
      <li><b>Fan-in</b>: quanti ingressi ha una porta. Non può crescere a piacere — più ingressi
      significano transistor in serie, quindi porta più lenta. È la ragione tecnica per cui le
      porte a molti ingressi si realizzano come alberi di porte a 2 ingressi.</li>
      <li><b>Fan-out</b>: quante altre porte può pilotare un'uscita. Superato il limite la
      commutazione rallenta e i livelli logici si degradano; si rimedia inserendo dei buffer.</li>
    </ul>

    <h4>Come è fatta una porta: CMOS</h4>
    <p>La tecnologia dominante usa coppie complementari di transistor: i <b>PMOS</b> conducono
    quando l'ingresso è basso, gli <b>NMOS</b> quando è alto. In un inverter CMOS il PMOS collega
    l'uscita all'alimentazione e l'NMOS a massa: qualunque sia l'ingresso, <b>uno solo dei due
    conduce</b>.</p>
    <p>Il vantaggio è il consumo: a riposo non c'è cammino diretto fra alimentazione e massa,
    quindi la corrente scorre quasi solo <b>durante</b> le commutazioni. È il motivo per cui il
    consumo di un circuito digitale cresce con la frequenza di clock.</p>
    <p>La caratteristica di trasferimento è ripida attorno alla soglia: piccole variazioni
    d'ingresso a metà scala producono grandi variazioni d'uscita. È questa non-linearità a
    rigenerare i livelli logici e a impedire che il rumore si accumuli lungo la catena.</p>

    <h4>Dispositivi logici programmabili</h4>
    <p>Invece di fabbricare un chip su misura si può usare un dispositivo generico e configurarlo:</p>
    <ul>
      <li><b>PLA</b> (Programmable Logic Array): una matrice di AND seguita da una matrice di OR,
      entrambe programmabili. È la struttura della somma di prodotti resa hardware: ogni riga
      della matrice AND è un termine prodotto, la matrice OR li somma.</li>
      <li><b>PAL</b>: come la PLA ma con la matrice OR fissa — meno flessibile, più economica e
      veloce.</li>
      <li><b>CPLD</b>: più blocchi tipo PAL su un unico chip, uniti da una rete di interconnessione
      programmabile.</li>
      <li><b>FPGA</b>: una scacchiera di piccoli <b>blocchi logici</b> (tipicamente tabelle di
      verità memorizzate, dette look-up table, più un flip-flop) immersi in una rete di
      collegamenti programmabili, con blocchi di I/O sul bordo. Permette di realizzare reti
      complesse, sequenziali comprese, e di riconfigurarle.</li>
    </ul>
    <p>Il compromesso di fondo è sempre lo stesso: un circuito dedicato è più veloce e più
    efficiente, uno programmabile è disponibile subito e si corregge senza rifare il chip.</p>
    <h4>Esempio svolto</h4>
    <p><b>Qual è la frequenza massima di questo stadio?</b> Fra due registri c'è una rete combinatoria il cui cammino più lungo attraversa quattro porte da 2 ns ciascuna; il flip-flop ha tempo di propagazione 1 ns e tempo di setup 1 ns.</p>
    <pre>periodo minimo = t_propagazione + t_cammino_critico + t_setup
               = 1 ns + (4 × 2 ns) + 1 ns
               = 10 ns

f_max = 1 / 10 ns = <b>100 MHz</b></pre>
    <p>Ora si spezza la rete in due stadi da due porte, mettendo in mezzo un registro:</p>
    <pre>periodo = 1 + (2 × 2) + 1 = 6 ns   →   f_max ≈ 167 MHz</pre>
    <p>La frequenza sale del 67 %, non del 100 %: i tempi del flip-flop restano e ora si pagano due volte. È il limite che spiega perché non conviene spingere una pipeline oltre un certo numero di stadi.</p>

    <h4>Errori tipici</h4>
    <ul>
      <li>Sommare i ritardi di rami <b>paralleli</b>: il ritardo della rete è quello del cammino più lungo, non la somma di tutti.</li>
      <li>Confondere il ritardo di propagazione (fra i 50 % di ingresso e uscita) con il tempo di <b>transizione</b> (dal 10 % al 90 % dell'uscita).</li>
      <li>Dimenticare setup e propagazione del flip-flop nel calcolo del periodo: il combinatorio non è tutto il tempo disponibile.</li>
    </ul>`,
  exercises: [
    {
      id: 'ex-tech-1',
      level: 'base',
      q: 'Tre porte hanno ritardo 3 ns, 2 ns e 4 ns. Qual è il ritardo totale se sono <b>in cascata</b>? E se le prime due lavorano <b>in parallelo</b> e la terza riceve entrambe le uscite?',
      hint: 'In cascata i ritardi si sommano perché il segnale le attraversa una dopo l’altra. In parallelo no: il risultato è pronto quando è pronto il <b>più lento</b> dei due rami.',
      solution: `<pre>in cascata:   3 + 2 + 4 = <b>9 ns</b>

in parallelo: max(3, 2) + 4 = 3 + 4 = <b>7 ns</b></pre><p>È l’errore più comune dell’argomento: sommare anche i rami paralleli, ottenendo 9 ns anche nel secondo caso. Il ritardo di una rete è quello del suo <b>cammino critico</b>, cioè il percorso ingresso→uscita più lento, non la somma di tutti i ritardi presenti.</p>`,
    },
    {
      id: 'ex-tech-2',
      level: 'base',
      q: 'Una porta ha ritardo 1,5 ns quando pilota un solo ingresso, e ogni carico aggiuntivo aggiunge 0,2 ns. Quanto ritarda se pilota <b>otto</b> ingressi?',
      hint: 'Il carico è capacitivo: ogni ingresso collegato è una capacità in più da caricare, e caricare più capacità richiede più tempo.',
      solution: '<pre>t = 1,5 + (8 − 1) × 0,2 = 1,5 + 1,4 = <b>2,9 ns</b></pre><p>Quasi il doppio. Quando il fan-out è alto conviene inserire un <b>buffer</b>: paradossalmente si aggiunge un ritardo (quello del buffer) ma se ne toglie di più, perché la porta originale si trova a pilotare un solo ingresso e il buffer è progettato per erogare più corrente.</p><p>È lo stesso ragionamento per cui i segnali di clock, che devono raggiungere migliaia di flip-flop, viaggiano su un <i>albero</i> di buffer e non su un filo unico.</p>',
    },
    {
      id: 'ex-tech-3',
      level: 'esame',
      q: 'Un sommatore a 16 bit va inserito fra due registri. Con il <b>ripple-carry</b> ogni stadio costa 2 ns; con il <b>carry-lookahead</b> l’intera somma costa 6 ns. Il resto dello stadio (propagazione del flip-flop più setup) costa 3 ns. Calcola la frequenza massima nei due casi.',
      hint: 'Il periodo minimo è la somma di tutto ciò che deve accadere fra due fronti di clock consecutivi.',
      solution: `<pre>RIPPLE-CARRY
T ≥ 3 + (16 × 2) = 3 + 32 = 35 ns
f_max = 1 / 35 ns ≈ <b>28,6 MHz</b>

CARRY-LOOKAHEAD
T ≥ 3 + 6 = 9 ns
f_max = 1 / 9 ns ≈ <b>111 MHz</b></pre><p>Quasi quattro volte tanto. Il prezzo è in <b>area</b>: la logica di lookahead richiede molte più porte, e cresce rapidamente con il numero di bit — per questo nei sommatori larghi si usano blocchi di lookahead a 4 bit messi in cascata, che è un compromesso fra le due soluzioni.</p><p>Nota che il termine fisso di 3 ns non sparisce mai: è il motivo per cui, oltre un certo punto, accorciare il combinatorio smette di pagare.</p>`,
    },
    {
      id: 'ex-tech-4',
      level: 'esame',
      q: 'Un circuito CMOS consuma 4 W a 1 GHz con alimentazione 1,0 V. Quanto consumerà a <b>2 GHz</b> a parità di tensione? E a 2 GHz con la tensione alzata a <b>1,2 V</b>?',
      hint: 'Il consumo dinamico è proporzionale a f·C·V². La capacità non cambia: cambiano frequenza e tensione, e la tensione pesa al quadrato.',
      solution: `<pre>P ∝ f · C · V²

a 2 GHz, 1,0 V:   P = 4 × (2/1) = <b>8 W</b>

a 2 GHz, 1,2 V:   P = 8 × (1,2/1,0)² = 8 × 1,44 = <b>11,5 W</b></pre><p>Raddoppiare la frequenza raddoppia il consumo; alzare la tensione del 20 % lo aumenta di un altro 44 %. E in pratica salire di frequenza <b>richiede</b> più tensione, perché i transistor devono commutare più in fretta: le due cose vanno insieme, e il consumo cresce quasi con il cubo.</p><p>È esattamente questa curva ad aver fermato la corsa ai gigahertz e spostato l’industria sul <b>multicore</b>: due core a 1 GHz consumano circa quanto uno a 1 GHz raddoppiato in area, ma molto meno di uno a 2 GHz.</p>`,
    },
    {
      id: 'ex-tech-5',
      level: 'esame',
      q: 'Devi realizzare quattro funzioni logiche di otto variabili in un <b>prototipo</b> che verrà modificato più volte prima di essere definitivo. Scegli fra PLA, CPLD e FPGA, motivando.',
      hint: 'La domanda non è quale sia il più potente, ma quale costi meno <b>modificare</b>.',
      solution: '<p>La scelta è la <b>FPGA</b>. Le ragioni, nell’ordine che conta:</p><ul><li><b>Riconfigurabile</b> quante volte si vuole: una modifica costa una nuova programmazione, non un nuovo dispositivo. In un prototipo che cambia, è il criterio decisivo.</li><li><b>Capienza</b>: quattro funzioni di otto variabili stanno comodamente in una FPGA anche piccola, mentre una PLA con otto ingressi ha un numero limitato di termini prodotto e potrebbe non bastare.</li><li>Le <b>PLA/PAL</b> hanno piani AND-OR di dimensione fissa e, nelle versioni a fusibili, si programmano <b>una volta sola</b>: perfette per la produzione di una versione definitiva, non per un prototipo.</li><li>Il <b>CPLD</b> è la via di mezzo: riconfigurabile e con ritardi molto prevedibili, ma con meno risorse di una FPGA.</li></ul><p>Se la domanda fosse stata «grande volume di produzione, progetto congelato», la risposta sarebbe l’opposta: lì il costo unitario premia le soluzioni fisse, fino ad arrivare al circuito integrato dedicato.</p>',
    },
  ],
};
