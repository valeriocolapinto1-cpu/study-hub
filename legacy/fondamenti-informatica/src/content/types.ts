/**
 * Tipi del CONTENT LAYER.
 *
 * Le banche dati sono dati puri: nessun import dal motore, nessun accesso al
 * DOM. Aggiungere una domanda significa aggiungere un oggetto a un array in
 * questa cartella — non serve toccare il codice.
 *
 * `topic` è obbligatorio ovunque, ed è l'unico rimando che serve: ogni
 * quesito, definizione e schema punta al **modulo di questo sito** che spiega
 * l'argomento. Prima esisteva anche un campo `ref` con il capitolo del libro
 * di testo; era ridondante — il capitolo era una funzione dell'argomento — e
 * legava contenuti originali alla struttura di un'opera altrui. La bibliografia
 * sta dove deve stare: in fondo alle Note, come elenco di letture.
 */

/** Aree del programma. Servono anche a comporre i drill per argomento. */
export type TopicId =
  | 'bin' // numeri binari, basi, complemento a 2
  | 'bool' // algebra di Boole, porte, algebra degli insiemi
  | 'comb' // reti combinatorie notevoli: decoder, MUX, tri-state
  | 'karnaugh' // sintesi e minimizzazione
  | 'arith' // aritmetica hardware: sommatori, moltiplicazione
  | 'ff' // circuiti sequenziali, flip-flop, registri, contatori
  | 'tech' // ritardo di propagazione, CMOS, PLA/FPGA
  | 'cpu' // datapath e unità di controllo
  | 'isa' // RISC/CISC, assembly, indirizzamento
  | 'irq' // interruzioni ed eccezioni
  | 'io' // I/O, DMA, bus e standard
  | 'pipe' // pipeline e prestazioni
  | 'mem' // gerarchia di memoria e cache
  | 'vm' // memoria virtuale e TLB
  | 'ieee' // virgola mobile
  | 'sw' // dal codice sorgente all'eseguibile, ruolo del sistema operativo
  | 'perf'; // prestazioni, legge di Amdahl, parallelismo

/** Crocetta a risposta singola. */
export interface McqItem {
  id: string;
  topic: TopicId;
  /** Testo del quesito; può contenere markup inline (<b>, <code>). */
  q: string;
  /** Le alternative, nell'ordine d'autore: il motore le rimescola. */
  options: string[];
  /** Indice della risposta esatta dentro `options`. */
  correct: number;
}

/** Domanda aperta di teoria, con risposta modello per l'autovalutazione. */
export interface OpenItem {
  id: string;
  topic: TopicId;
  q: string;
  /** Risposta modello; può contenere markup inline. */
  model: string;
}

/** Esercizio «scrivi un programma», valutato dallo studente. */
export interface AsmWriteItem {
  id: string;
  topic: TopicId;
  q: string;
  /** Soluzione modello, tipicamente un blocco <pre>. */
  model: string;
}

/**
 * Domanda di autoverifica in fondo a un modulo.
 *
 * Non è una crocetta: è la domanda che ti fai da solo dopo aver letto, con la
 * risposta nascosta finché non hai provato a rispondere. Serve a scoprire se
 * hai capito o se hai solo riconosciuto il testo.
 */
export interface TopicCheck {
  q: string;
  a: string;
}

/**
 * Esercizio svolto in fondo a un modulo.
 *
 * Non è un quesito d'esame generato dal motore: è un esercizio **scritto**,
 * con il suo svolgimento passo per passo. Serve a imparare il procedimento,
 * non a essere valutati — per la valutazione c'è il simulatore.
 *
 * `hint` esiste perché guardare subito la soluzione non insegna niente: la
 * spinta iniziale permette di riprovare da soli prima di arrendersi.
 */
export interface TopicExercise {
  id: string;
  /** Testo, come lo troveresti sul foglio. */
  q: string;
  /** Da dove si comincia, senza dare la risposta. */
  hint: string;
  /** Svolgimento completo, passo per passo. */
  solution: string;
  /** `base` = per capire il meccanismo; `esame` = difficoltà e formato della prova. */
  level: 'base' | 'esame';
}

/** Scheda di studio. */
export interface Topic {
  id: TopicId;
  /** Titolo della scheda. */
  title: string;
  /** Riga di sintesi mostrata sulla card. */
  blurb: string;
  /**
   * «In due minuti»: i punti che devono restare in testa dopo la lettura.
   * Sono anche il ripasso dell'ultimo giorno, quando non c'è tempo di
   * rileggere tutto.
   */
  summary: string[];
  /** Corpo della teoria in HTML (riscritto in forma originale). */
  body: string;
  /** Domande di controllo, con risposta a scomparsa. */
  checks: TopicCheck[];
  /** Esercizi svolti: si prova, si chiede un aiuto, si confronta. */
  exercises: TopicExercise[];
  /** Trappole collegate, risolte contro la banca `traps`. */
  trapIds: string[];
  /** Moduli che conviene aver letto prima di questo. */
  prereq?: TopicId[];
  /** Schemi di `diagrams.ts` che illustrano il modulo. */
  diagramIds?: string[];
}

/**
 * Convenzione di notazione: un fatto sulla materia o sul modo di scriverla.
 *
 * Il campo `status` («verificata» / «da verificare») è caduto insieme a ciò
 * che lo rendeva necessario: quando queste voci riportavano che cosa una
 * persona reale si aspetta all'esame, dichiarare che nessuno l'aveva
 * confermato era il minimo. Adesso sono affermazioni che stanno in piedi da
 * sole, e un badge «da verificare» su un fatto suonerebbe soltanto insicuro.
 * Vedi la regola in testa a `traps.ts`.
 */
export interface Trap {
  id: string;
  title: string;
  body: string;
}

/**
 * Voce della bibliografia.
 *
 * Non ha un `url` e non è una svista: l'elenco conteneva anche pagine di
 * persone e archivi di terzi, ed è stato ridotto ai libri. Un titolo in
 * bibliografia si cita sempre; un collegamento tira dentro qualcuno che non ha
 * chiesto di esserci.
 */
export interface LinkItem {
  id: string;
  label: string;
  /** A che cosa serve quel libro, in una riga. */
  note: string;
}
