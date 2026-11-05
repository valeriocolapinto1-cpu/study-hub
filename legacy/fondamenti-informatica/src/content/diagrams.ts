import type { TopicId } from './types';

/**
 * Schemi da completare.
 *
 * Sono disegni **di questo sito**: rappresentano strutture standard
 * dell'architettura dei calcolatori — un multiplexer, una cache a mappatura
 * diretta, una pipeline a cinque stadi — cioè informazione tecnica che
 * qualunque testo descrive allo stesso modo perché nessuno l'ha inventata.
 * Nessuna illustrazione altrui è ricalcata: la struttura di un decodificatore
 * è un fatto, il modo particolare in cui un editore l'ha impaginata no.
 *
 * REGOLA PER CHI NE AGGIUNGE UNO — tre domande, e se una risposta è «sì» lo
 * schema va rifatto:
 *
 *  1. usa etichette o sigle prese da un testo dove esisterebbe un nome comune?
 *  2. ricalca l'impaginazione di una tavola precisa, invece della struttura
 *     logica che qualsiasi testo userebbe per quel concetto?
 *  3. contiene i valori di un esempio svolto altrui — numeri, indirizzi, il
 *     dispositivo scelto da qualcun altro per illustrare il concetto?
 *
 * È la terza che è meno ovvia. Uno schema chiamato «la sveglia su chip», con
 * il timer dei minuti e il timer del tono, non descrive un sistema su singolo
 * chip: descrive **l'esempio con cui un autore ha scelto di spiegarlo**. Al
 * suo posto c'è ora `soc-blocchi`, che mostra la stessa struttura — processore,
 * memoria, timer e interfacce su una rete di interconnessione — senza vestirla
 * dell'esempio di nessuno.
 *
 * Le etichette sono dati, così lo stesso disegno serve sia da figura sia da
 * esercizio: se ne nascondono alcune e si chiede di ricollocarle.
 *
 * Le coordinate sono nel sistema del `viewBox`: la UI le converte in
 * percentuali, quindi lo schema resta leggibile a qualunque larghezza.
 */
export interface DiagramSlot {
  id: string;
  /** Centro dell'etichetta, in coordinate viewBox. */
  x: number;
  y: number;
  /** L'etichetta giusta per questa posizione. */
  label: string;
}

export interface Diagram {
  id: string;
  title: string;
  topic: TopicId;
  width: number;
  height: number;
  /** Disegno di base, senza le etichette da indovinare. */
  svg: string;
  slots: DiagramSlot[];
  /** Etichette plausibili ma sbagliate, per non rendere il quiz una formalità. */
  distractors: string[];
}

/* Abbreviazioni per non ripetere gli attributi in ogni rettangolo. */
const B = 'class="dg-box"';
const L = 'class="dg-line"';
const A = 'class="dg-line" marker-end="url(#aefin-arrow)"';
const T = 'class="dg-text"';
/** Testo ancorato a sinistra: per le scritte di bordo. */
const TS = 'class="dg-text dg-start"';
const G = 'class="dg-group"';

export const diagrams: Diagram[] = [
  {
    id: 'unita-funzionali',
    title: 'Unità funzionali di un calcolatore',
    topic: 'cpu',
    width: 620,
    height: 330,
    slots: [
      { id: 'mem', x: 310, y: 45, label: 'Memoria' },
      { id: 'net', x: 310, y: 190, label: 'Rete di interconnessione' },
      { id: 'in', x: 90, y: 130, label: 'Ingresso' },
      { id: 'out', x: 90, y: 235, label: 'Uscita' },
      { id: 'alu', x: 530, y: 130, label: 'Aritmetica e logica' },
      { id: 'ctrl', x: 530, y: 235, label: 'Controllo' },
    ],
    distractors: ['Cache', 'Registri', 'Disco', 'Bus dati', 'Interruzioni'],
    svg: `
      <rect ${G} x="20" y="95" width="140" height="180" rx="8"/>
      <text ${T} x="90" y="292" font-size="12">I/O</text>
      <rect ${G} x="460" y="95" width="140" height="180" rx="8"/>
      <text ${T} x="530" y="292" font-size="12">Processore</text>

      <rect ${B} x="240" y="20" width="140" height="52" rx="6"/>
      <rect ${B} x="240" y="150" width="140" height="80" rx="6"/>
      <rect ${B} x="35" y="105" width="110" height="52" rx="6"/>
      <rect ${B} x="35" y="210" width="110" height="52" rx="6"/>
      <rect ${B} x="475" y="105" width="110" height="52" rx="6"/>
      <rect ${B} x="475" y="210" width="110" height="52" rx="6"/>

      <line ${L} x1="310" y1="72" x2="310" y2="150"/>
      <line ${L} x1="145" y1="190" x2="240" y2="190"/>
      <line ${L} x1="380" y1="190" x2="475" y2="190"/>
      <line ${L} x1="90" y1="157" x2="90" y2="210"/>
      <line ${L} x1="145" y1="131" x2="180" y2="131"/>
      <line ${L} x1="180" y1="131" x2="180" y2="236"/>
      <line ${L} x1="180" y1="236" x2="145" y2="236"/>
      <line ${L} x1="530" y1="157" x2="530" y2="210"/>`,
  },

  {
    id: 'processore-3bus',
    title: 'Percorso dati a tre bus',
    topic: 'cpu',
    width: 620,
    height: 400,
    slots: [
      { id: 'busa', x: 60, y: 22, label: 'Bus A' },
      { id: 'busb', x: 150, y: 22, label: 'Bus B' },
      { id: 'busc', x: 240, y: 22, label: 'Bus C' },
      { id: 'pc', x: 420, y: 62, label: 'PC' },
      { id: 'banco', x: 420, y: 132, label: 'Banco registri' },
      { id: 'alu', x: 420, y: 202, label: 'ALU' },
      { id: 'temp', x: 420, y: 262, label: 'Registri temporanei' },
      { id: 'ir', x: 420, y: 322, label: 'IR' },
      { id: 'iface', x: 420, y: 372, label: 'Interfaccia processore-memoria' },
    ],
    distractors: ['Cache', 'MAR', 'TLB', 'Generatore indirizzi', 'Controllo'],
    svg: `
      <line ${L} x1="60" y1="40" x2="60" y2="395"/>
      <line ${L} x1="150" y1="40" x2="150" y2="395"/>
      <line ${L} x1="240" y1="40" x2="240" y2="395"/>

      <rect ${B} x="300" y="42" width="240" height="40" rx="6"/>
      <rect ${B} x="300" y="112" width="240" height="40" rx="6"/>
      <path ${B} d="M320 182 h200 l-30 40 h-140 z"/>
      <rect ${B} x="300" y="242" width="240" height="40" rx="6"/>
      <rect ${B} x="300" y="302" width="240" height="40" rx="6"/>
      <rect ${B} x="300" y="352" width="240" height="40" rx="6"/>

      <line ${L} x1="60" y1="62" x2="300" y2="62"/>
      <line ${L} x1="150" y1="132" x2="300" y2="132"/>
      <line ${L} x1="240" y1="132" x2="300" y2="132"/>
      <line ${L} x1="60" y1="202" x2="320" y2="202"/>
      <line ${L} x1="150" y1="212" x2="330" y2="212"/>
      <line ${L} x1="240" y1="262" x2="300" y2="262"/>
      <line ${L} x1="60" y1="322" x2="300" y2="322"/>
      <line ${L} x1="150" y1="372" x2="300" y2="372"/>`,
  },

  {
    id: 'cache-set-associativa',
    title: 'Cache a corrispondenza associativa a gruppi',
    topic: 'mem',
    width: 640,
    height: 420,
    slots: [
      { id: 'cache', x: 120, y: 22, label: 'Cache' },
      { id: 'centrale', x: 500, y: 22, label: 'Memoria centrale' },
      { id: 'gruppo', x: 40, y: 90, label: 'Gruppo' },
      { id: 'blocco', x: 120, y: 90, label: 'Blocco' },
      { id: 'etichetta', x: 120, y: 332, label: 'Etichetta' },
      { id: 'posizione', x: 240, y: 332, label: 'Posizione' },
      { id: 'spiazzamento', x: 350, y: 332, label: 'Spiazzamento' },
      { id: 'indirizzo', x: 235, y: 390, label: 'Indirizzo di memoria centrale' },
    ],
    distractors: ['Tag', 'Frame', 'Pagina', 'Offset di pagina', 'Dato'],
    svg: `
      <rect ${G} x="20" y="105" width="200" height="200" rx="8"/>
      <rect ${G} x="400" y="40" width="200" height="265" rx="8"/>

      <rect ${B} x="70" y="115" width="140" height="30" rx="4"/>
      <rect ${B} x="70" y="150" width="140" height="30" rx="4"/>
      <rect ${B} x="70" y="200" width="140" height="30" rx="4"/>
      <rect ${B} x="70" y="235" width="140" height="30" rx="4"/>
      <text ${T} x="140" y="192" font-size="11">⋮</text>
      <text ${T} x="40" y="136" font-size="11">0</text>
      <text ${T} x="40" y="256" font-size="11">k</text>

      <rect ${B} x="415" y="55" width="170" height="26" rx="4"/>
      <rect ${B} x="415" y="86" width="170" height="26" rx="4"/>
      <rect ${B} x="415" y="150" width="170" height="26" rx="4"/>
      <rect ${B} x="415" y="240" width="170" height="26" rx="4"/>
      <rect ${B} x="415" y="271" width="170" height="26" rx="4"/>
      <text ${T} x="500" y="132" font-size="11">⋮</text>
      <text ${T} x="500" y="222" font-size="11">⋮</text>

      <line ${A} x1="400" y1="163" x2="225" y2="163"/>
      <line ${A} x1="400" y1="255" x2="225" y2="222"/>

      <rect ${B} x="60" y="318" width="120" height="28" rx="4"/>
      <rect ${B} x="185" y="318" width="110" height="28" rx="4"/>
      <rect ${B} x="300" y="318" width="100" height="28" rx="4"/>
      <line ${L} x1="60" y1="358" x2="400" y2="358"/>`,
  },

  {
    id: 'gerarchia-memoria',
    title: 'Gerarchia di memoria',
    topic: 'mem',
    width: 560,
    height: 350,
    slots: [
      { id: 'reg', x: 280, y: 40, label: 'Registri' },
      { id: 'l1', x: 280, y: 100, label: 'Cache primaria (L1)' },
      { id: 'l2', x: 280, y: 160, label: 'Cache secondaria (L2)' },
      { id: 'main', x: 280, y: 220, label: 'Memoria principale' },
      { id: 'sec', x: 280, y: 285, label: 'Memoria secondaria' },
    ],
    distractors: ['TLB', 'Tabella delle pagine', 'Buffer di scrittura', 'ROM'],
    svg: `
      <rect ${B} x="200" y="22" width="160" height="36" rx="6"/>
      <rect ${B} x="180" y="82" width="200" height="36" rx="6"/>
      <rect ${B} x="160" y="142" width="240" height="36" rx="6"/>
      <rect ${B} x="140" y="202" width="280" height="36" rx="6"/>
      <rect ${B} x="120" y="262" width="320" height="46" rx="6"/>

      <line ${A} x1="70" y1="300" x2="70" y2="30"/>
      <text ${T} x="70" y="322" font-size="11">più veloce</text>
      <line ${A} x1="500" y1="30" x2="500" y2="300"/>
      <text ${T} x="500" y="322" font-size="11">più capiente</text>`,
  },

  {
    id: 'memoria-virtuale-tlb',
    title: 'Traduzione dell’indirizzo virtuale',
    topic: 'vm',
    width: 620,
    height: 320,
    slots: [
      { id: 'vpage', x: 110, y: 52, label: 'Numero di pagina' },
      { id: 'voff', x: 265, y: 52, label: 'Offset' },
      { id: 'tlb', x: 150, y: 160, label: 'TLB' },
      { id: 'pt', x: 400, y: 160, label: 'Tabella delle pagine' },
      { id: 'frame', x: 110, y: 268, label: 'Numero di frame' },
      { id: 'poff', x: 265, y: 268, label: 'Offset' },
    ],
    distractors: ['Etichetta', 'Indice di cache', 'Blocco', 'Registro di stato'],
    svg: `
      <text ${TS} x="24" y="20" font-size="12">Indirizzo virtuale</text>
      <rect ${B} x="40" y="34" width="140" height="36" rx="4"/>
      <rect ${B} x="190" y="34" width="150" height="36" rx="4"/>

      <rect ${B} x="70" y="128" width="160" height="60" rx="6"/>
      <rect ${B} x="320" y="128" width="160" height="60" rx="6"/>

      <line ${A} x1="110" y1="70" x2="110" y2="128"/>
      <line ${A} x1="230" y1="158" x2="320" y2="158"/>
      <text ${T} x="275" y="150" font-size="10">miss</text>
      <line ${A} x1="110" y1="188" x2="110" y2="250"/>
      <line ${L} x1="400" y1="188" x2="400" y2="215"/>
      <line ${L} x1="400" y1="215" x2="150" y2="215"/>
      <line ${A} x1="150" y1="215" x2="150" y2="250"/>
      <line ${A} x1="265" y1="70" x2="265" y2="250"/>

      <text ${TS} x="24" y="304" font-size="12">Indirizzo fisico</text>
      <rect ${B} x="40" y="250" width="140" height="36" rx="4"/>
      <rect ${B} x="190" y="250" width="150" height="36" rx="4"/>`,
  },

  {
    id: 'pipeline-5-stadi',
    title: 'Percorso dati a pipeline di cinque stadi',
    topic: 'pipe',
    width: 660,
    height: 220,
    slots: [
      { id: 'f', x: 75, y: 95, label: 'Prelievo (F)' },
      { id: 'd', x: 195, y: 95, label: 'Decodifica (D)' },
      { id: 'e', x: 315, y: 95, label: 'Esecuzione (E)' },
      { id: 'm', x: 435, y: 95, label: 'Memoria (M)' },
      { id: 'w', x: 555, y: 95, label: 'Scrittura (W)' },
    ],
    distractors: ['Interruzione', 'Arbitraggio', 'Rinvio', 'Predizione'],
    svg: `
      <rect ${B} x="25" y="60" width="100" height="70" rx="6"/>
      <rect ${B} x="145" y="60" width="100" height="70" rx="6"/>
      <rect ${B} x="265" y="60" width="100" height="70" rx="6"/>
      <rect ${B} x="385" y="60" width="100" height="70" rx="6"/>
      <rect ${B} x="505" y="60" width="100" height="70" rx="6"/>

      <rect ${B} x="128" y="50" width="14" height="90" rx="2"/>
      <rect ${B} x="248" y="50" width="14" height="90" rx="2"/>
      <rect ${B} x="368" y="50" width="14" height="90" rx="2"/>
      <rect ${B} x="488" y="50" width="14" height="90" rx="2"/>

      <line ${A} x1="0" y1="95" x2="25" y2="95"/>
      <line ${A} x1="605" y1="95" x2="640" y2="95"/>
      <line ${L} x1="25" y1="170" x2="605" y2="170"/>
      <text ${T} x="315" y="190" font-size="11">registri di stadio · un colpo di clock per stadio</text>`,
  },

  {
    id: 'interfaccia-io',
    title: 'Interfaccia di un dispositivo di I/O',
    topic: 'io',
    width: 620,
    height: 300,
    slots: [
      { id: 'proc', x: 80, y: 60, label: 'Processore' },
      { id: 'bus', x: 310, y: 128, label: 'Bus' },
      { id: 'data', x: 420, y: 60, label: 'DATA' },
      { id: 'status', x: 420, y: 118, label: 'STATUS' },
      { id: 'control', x: 420, y: 176, label: 'CONTROL' },
      { id: 'dev', x: 420, y: 258, label: 'Dispositivo' },
    ],
    distractors: ['ALU', 'Cache', 'DMA', 'Registro indice', 'PC'],
    svg: `
      <rect ${B} x="20" y="40" width="120" height="44" rx="6"/>
      <rect ${B} x="20" y="120" width="120" height="44" rx="6"/>
      <text ${T} x="80" y="147" font-size="12">Memoria</text>

      <line ${L} x1="140" y1="62" x2="230" y2="62"/>
      <line ${L} x1="140" y1="142" x2="230" y2="142"/>
      <line ${L} x1="230" y1="40" x2="230" y2="220"/>
      <line ${L} x1="240" y1="40" x2="240" y2="220"/>
      <line ${L} x1="250" y1="40" x2="250" y2="220"/>

      <rect ${G} x="330" y="30" width="180" height="170" rx="8"/>
      <rect ${B} x="350" y="42" width="140" height="34" rx="4"/>
      <rect ${B} x="350" y="100" width="140" height="34" rx="4"/>
      <rect ${B} x="350" y="158" width="140" height="34" rx="4"/>
      <text ${T} x="420" y="216" font-size="11">interfaccia</text>

      <line ${L} x1="250" y1="62" x2="350" y2="62"/>
      <line ${L} x1="250" y1="118" x2="350" y2="118"/>
      <line ${L} x1="250" y1="176" x2="350" y2="176"/>

      <rect ${B} x="350" y="240" width="140" height="40" rx="6"/>
      <line ${A} x1="420" y1="200" x2="420" y2="240"/>`,
  },

  {
    id: 'sommatore-ripple',
    title: 'Sommatore a propagazione di riporto',
    topic: 'arith',
    width: 740,
    height: 240,
    slots: [
      { id: 'fa', x: 545, y: 118, label: 'Sommatore completo' },
      { id: 'cin', x: 690, y: 78, label: 'Riporto entrante' },
      { id: 'cout', x: 55, y: 118, label: 'Riporto uscente' },
      { id: 'sum', x: 545, y: 205, label: 'Bit di somma' },
      { id: 'ops', x: 545, y: 30, label: 'Bit degli addendi' },
    ],
    distractors: ['Overflow', 'Bit di segno', 'Semisommatore', 'Registro'],
    svg: `
      <g transform="translate(60,0)">
      <rect ${B} x="80" y="90" width="90" height="60" rx="6"/>
      <rect ${B} x="200" y="90" width="90" height="60" rx="6"/>
      <rect ${B} x="320" y="90" width="90" height="60" rx="6"/>
      <rect ${B} x="440" y="90" width="90" height="60" rx="6"/>

      <line ${A} x1="530" y1="120" x2="575" y2="120" transform="rotate(180 552 120)"/>
      <line ${A} x1="440" y1="120" x2="410" y2="120"/>
      <line ${A} x1="320" y1="120" x2="290" y2="120"/>
      <line ${A} x1="200" y1="120" x2="170" y2="120"/>
      <line ${A} x1="80" y1="120" x2="55" y2="120"/>

      <line ${L} x1="105" y1="60" x2="105" y2="90"/>
      <line ${L} x1="145" y1="60" x2="145" y2="90"/>
      <line ${L} x1="225" y1="60" x2="225" y2="90"/>
      <line ${L} x1="265" y1="60" x2="265" y2="90"/>
      <line ${L} x1="345" y1="60" x2="345" y2="90"/>
      <line ${L} x1="385" y1="60" x2="385" y2="90"/>
      <line ${L} x1="465" y1="60" x2="465" y2="90"/>
      <line ${L} x1="505" y1="60" x2="505" y2="90"/>

      <line ${A} x1="125" y1="150" x2="125" y2="185"/>
      <line ${A} x1="245" y1="150" x2="245" y2="185"/>
      <line ${A} x1="365" y1="150" x2="365" y2="185"/>
      <line ${A} x1="485" y1="150" x2="485" y2="185"/>
      </g>`,
  },
  {
    id: 'processore-memoria',
    title: 'Processore e memoria principale',
    topic: 'cpu',
    width: 620,
    height: 360,
    slots: [
      { id: 'mem', x: 310, y: 42, label: 'Memoria principale' },
      { id: 'iface', x: 310, y: 140, label: 'Interfaccia processore-memoria' },
      { id: 'pc', x: 135, y: 202, label: 'PC' },
      { id: 'ir', x: 135, y: 252, label: 'IR' },
      { id: 'regs', x: 310, y: 240, label: 'Registri generali' },
      { id: 'ctrl', x: 485, y: 202, label: 'Controllo' },
      { id: 'alu', x: 485, y: 270, label: 'ALU' },
    ],
    distractors: ['Cache', 'TLB', 'Disco', 'Bus di sistema'],
    svg: `
      <rect ${B} x="230" y="20" width="160" height="44" rx="6"/>
      <line ${L} x1="310" y1="64" x2="310" y2="120"/>
      <rect ${G} x="60" y="110" width="500" height="230" rx="10"/>
      <rect ${B} x="230" y="120" width="160" height="40" rx="6"/>
      <rect ${B} x="90" y="185" width="90" height="34" rx="4"/>
      <rect ${B} x="90" y="235" width="90" height="34" rx="4"/>
      <rect ${B} x="250" y="185" width="120" height="110" rx="4"/>
      <rect ${B} x="430" y="185" width="110" height="34" rx="4"/>
      <rect ${B} x="430" y="250" width="110" height="40" rx="4"/>
      <text ${T} x="310" y="330" font-size="12">Processore</text>`,
  },

  {
    id: 'sistema-calcolo',
    title: 'Un sistema di calcolo',
    topic: 'io',
    width: 620,
    height: 300,
    slots: [
      { id: 'proc', x: 180, y: 47, label: 'Processore' },
      { id: 'mem', x: 440, y: 47, label: 'Memoria' },
      { id: 'net', x: 310, y: 147, label: 'Rete di interconnessione' },
      { id: 'io1', x: 180, y: 247, label: 'Dispositivo di I/O 1' },
      { id: 'ion', x: 440, y: 247, label: 'Dispositivo di I/O n' },
    ],
    distractors: ['Cache', 'Controllore DMA', 'Registro di stato', 'ALU'],
    svg: `
      <rect ${B} x="110" y="25" width="140" height="44" rx="6"/>
      <rect ${B} x="370" y="25" width="140" height="44" rx="6"/>
      <rect ${B} x="60" y="125" width="500" height="44" rx="6"/>
      <rect ${B} x="110" y="225" width="140" height="44" rx="6"/>
      <rect ${B} x="370" y="225" width="140" height="44" rx="6"/>
      <line ${L} x1="180" y1="69" x2="180" y2="125"/>
      <line ${L} x1="440" y1="69" x2="440" y2="125"/>
      <line ${L} x1="180" y1="169" x2="180" y2="225"/>
      <line ${L} x1="440" y1="169" x2="440" y2="225"/>
      <text ${T} x="310" y="252" font-size="14">· · ·</text>`,
  },

  {
    id: 'registri-controllo',
    title: 'Registri di controllo del processore',
    topic: 'irq',
    width: 640,
    height: 290,
    slots: [
      { id: 'ps', x: 555, y: 56, label: 'PS' },
      { id: 'ips', x: 555, y: 116, label: 'IPS' },
      { id: 'ien', x: 555, y: 176, label: 'IENABLE' },
      { id: 'ipend', x: 555, y: 236, label: 'IPENDING' },
    ],
    distractors: ['MAR', 'MDR', 'IR', 'TLB'],
    svg: `
      <rect ${B} x="40" y="40" width="420" height="32" rx="4"/>
      <rect ${B} x="400" y="40" width="60" height="32" rx="4"/>
      <text ${T} x="430" y="61" font-size="11">IE</text>
      <rect ${B} x="40" y="100" width="420" height="32" rx="4"/>
      <rect ${B} x="400" y="100" width="60" height="32" rx="4"/>
      <text ${T} x="430" y="121" font-size="11">IE</text>
      <rect ${B} x="40" y="160" width="420" height="32" rx="4"/>
      <text ${T} x="300" y="181" font-size="11">TIM · DISP · KBD</text>
      <rect ${B} x="40" y="220" width="420" height="32" rx="4"/>
      <text ${T} x="300" y="241" font-size="11">TIM · DISP · KBD</text>
      <text ${TS} x="24" y="24" font-size="11">bit 31 … 0</text>`,
  },

  {
    id: 'catena-software',
    title: 'Dal sorgente al programma oggetto',
    topic: 'sw',
    width: 620,
    height: 470,
    slots: [
      { id: 'src', x: 280, y: 37, label: 'File sorgente' },
      { id: 'comp', x: 280, y: 110, label: 'Compilatore' },
      { id: 'asm', x: 280, y: 182, label: 'Sorgente assembly' },
      { id: 'assr', x: 280, y: 250, label: 'Assemblatore' },
      { id: 'obj', x: 280, y: 317, label: 'File oggetto' },
      { id: 'lib', x: 90, y: 317, label: 'Libreria' },
      { id: 'link', x: 280, y: 380, label: 'Collegatore' },
      { id: 'prog', x: 280, y: 443, label: 'Programma oggetto' },
    ],
    distractors: ['Caricatore', 'Sistema operativo', 'Tabella dei simboli', 'Interprete'],
    svg: `
      <rect ${B} x="200" y="20" width="160" height="34" rx="16"/>
      <line ${A} x1="280" y1="54" x2="280" y2="90"/>
      <rect ${B} x="210" y="90" width="140" height="40" rx="6"/>
      <line ${A} x1="280" y1="130" x2="280" y2="165"/>
      <rect ${B} x="200" y="165" width="160" height="34" rx="16"/>
      <line ${A} x1="280" y1="199" x2="280" y2="230"/>
      <rect ${B} x="210" y="230" width="140" height="40" rx="6"/>
      <line ${A} x1="280" y1="270" x2="280" y2="300"/>
      <rect ${B} x="200" y="300" width="160" height="34" rx="16"/>
      <rect ${B} x="20" y="300" width="140" height="34" rx="16"/>
      <line ${A} x1="160" y1="317" x2="205" y2="360"/>
      <line ${A} x1="280" y1="334" x2="280" y2="360"/>
      <rect ${B} x="210" y="360" width="140" height="40" rx="6"/>
      <line ${A} x1="280" y1="400" x2="280" y2="426"/>
      <rect ${B} x="200" y="426" width="160" height="34" rx="16"/>`,
  },

  {
    id: 'componenti-processore',
    title: 'Componenti principali di un processore',
    topic: 'cpu',
    width: 620,
    height: 360,
    slots: [
      { id: 'rf', x: 145, y: 75, label: 'Banco dei registri' },
      { id: 'cc', x: 465, y: 65, label: 'Circuiteria di controllo' },
      { id: 'ir', x: 465, y: 148, label: 'IR' },
      { id: 'alu', x: 145, y: 192, label: 'ALU' },
      { id: 'iag', x: 465, y: 212, label: 'Generatore indirizzi' },
      { id: 'pc', x: 465, y: 245, label: 'PC' },
      { id: 'pmi', x: 310, y: 312, label: 'Interfaccia processore-memoria' },
    ],
    distractors: ['Cache', 'MAR', 'Unità in virgola mobile', 'TLB'],
    svg: `
      <rect ${B} x="60" y="30" width="170" height="90" rx="6"/>
      <rect ${B} x="380" y="30" width="170" height="70" rx="6"/>
      <rect ${B} x="380" y="130" width="170" height="36" rx="4"/>
      <path ${B} d="M60 170 h170 l-30 50 h-110 z"/>
      <rect ${B} x="380" y="190" width="170" height="72" rx="6"/>
      <rect ${B} x="415" y="230" width="100" height="28" rx="4"/>
      <rect ${B} x="140" y="290" width="340" height="44" rx="6"/>
      <line ${L} x1="145" y1="120" x2="145" y2="170"/>
      <line ${L} x1="145" y1="220" x2="145" y2="290"/>
      <line ${L} x1="465" y1="166" x2="465" y2="190"/>`,
  },

  {
    id: 'cinque-stadi',
    title: 'Organizzazione a cinque stadi',
    topic: 'cpu',
    width: 480,
    height: 420,
    slots: [
      { id: 's1', x: 280, y: 44, label: 'Prelievo istruzione' },
      { id: 's2', x: 280, y: 124, label: 'Lettura registri sorgente' },
      { id: 's3', x: 280, y: 204, label: 'ALU' },
      { id: 's4', x: 280, y: 284, label: 'Accesso in memoria' },
      { id: 's5', x: 280, y: 364, label: 'Scrittura nel registro' },
    ],
    distractors: [
      'Refresh della DRAM',
      'Arbitraggio del bus',
      'Traduzione dell’indirizzo',
      'Normalizzazione',
    ],
    svg: `
      <rect ${B} x="200" y="20" width="160" height="48" rx="6"/>
      <rect ${B} x="200" y="100" width="160" height="48" rx="6"/>
      <rect ${B} x="200" y="180" width="160" height="48" rx="6"/>
      <rect ${B} x="200" y="260" width="160" height="48" rx="6"/>
      <rect ${B} x="200" y="340" width="160" height="48" rx="6"/>
      <line ${A} x1="280" y1="68" x2="280" y2="100"/>
      <line ${A} x1="280" y1="148" x2="280" y2="180"/>
      <line ${A} x1="280" y1="228" x2="280" y2="260"/>
      <line ${A} x1="280" y1="308" x2="280" y2="340"/>
      <text ${TS} x="20" y="48" font-size="11">Stadio 1</text>
      <text ${TS} x="20" y="128" font-size="11">Stadio 2</text>
      <text ${TS} x="20" y="208" font-size="11">Stadio 3</text>
      <text ${TS} x="20" y="288" font-size="11">Stadio 4</text>
      <text ${TS} x="20" y="368" font-size="11">Stadio 5</text>`,
  },

  {
    id: 'datapath',
    title: 'Percorso dei dati di un processore',
    topic: 'cpu',
    width: 560,
    height: 470,
    slots: [
      { id: 'rf', x: 280, y: 60, label: 'Banco dei registri' },
      { id: 'ra', x: 215, y: 142, label: 'RA' },
      { id: 'rb', x: 345, y: 142, label: 'RB' },
      { id: 'muxb', x: 350, y: 192, label: 'MuxB' },
      { id: 'alu', x: 285, y: 248, label: 'ALU' },
      { id: 'rz', x: 215, y: 322, label: 'RZ' },
      { id: 'rm', x: 345, y: 322, label: 'RM' },
      { id: 'muxy', x: 235, y: 377, label: 'MuxY' },
      { id: 'ry', x: 235, y: 432, label: 'RY' },
    ],
    distractors: ['MAR', 'MDR', 'IR', 'PC'],
    svg: `
      <rect ${B} x="180" y="20" width="200" height="80" rx="6"/>
      <rect ${B} x="170" y="125" width="90" height="34" rx="4"/>
      <rect ${B} x="300" y="125" width="90" height="34" rx="4"/>
      <path ${B} d="M300 180 h100 l-20 25 h-60 z"/>
      <path ${B} d="M170 225 h230 l-40 55 h-150 z"/>
      <rect ${B} x="170" y="305" width="90" height="34" rx="4"/>
      <rect ${B} x="300" y="305" width="90" height="34" rx="4"/>
      <path ${B} d="M170 365 h130 l-25 25 h-80 z"/>
      <rect ${B} x="190" y="415" width="90" height="34" rx="4"/>
      <line ${L} x1="215" y1="100" x2="215" y2="125"/>
      <line ${L} x1="345" y1="100" x2="345" y2="125"/>
      <line ${L} x1="215" y1="159" x2="215" y2="225"/>
      <line ${L} x1="345" y1="159" x2="345" y2="180"/>
      <line ${L} x1="350" y1="205" x2="350" y2="225"/>
      <line ${L} x1="215" y1="280" x2="215" y2="305"/>
      <line ${L} x1="345" y1="280" x2="345" y2="305"/>
      <line ${L} x1="215" y1="339" x2="215" y2="365"/>
      <line ${L} x1="235" y1="390" x2="235" y2="415"/>
      <line ${L} x1="450" y1="322" x2="450" y2="60"/>
      <line ${L} x1="390" y1="322" x2="450" y2="322"/>
      <line ${L} x1="380" y1="60" x2="450" y2="60"/>
      <text ${TS} x="410" y="352" font-size="10">verso la memoria</text>`,
  },

  {
    id: 'controllo-cablato',
    title: 'Generazione dei segnali di controllo',
    topic: 'cpu',
    width: 640,
    height: 320,
    slots: [
      { id: 'ir', x: 100, y: 58, label: 'IR' },
      { id: 'dec', x: 110, y: 150, label: 'Decodificatore di istruzione' },
      { id: 'step', x: 295, y: 50, label: 'Contatore di passo' },
      { id: 'clk', x: 470, y: 50, label: 'Clock' },
      { id: 'gen', x: 315, y: 155, label: 'Generatore dei segnali' },
      { id: 'ext', x: 520, y: 128, label: 'Ingressi esterni' },
      { id: 'cond', x: 520, y: 183, label: 'Segnali di condizione' },
    ],
    distractors: ['Microprogramma', 'ALU', 'Memoria di controllo', 'MDR'],
    svg: `
      <rect ${B} x="40" y="40" width="120" height="36" rx="4"/>
      <rect ${B} x="40" y="120" width="140" height="60" rx="6"/>
      <rect ${B} x="230" y="30" width="130" height="40" rx="4"/>
      <rect ${B} x="420" y="30" width="100" height="40" rx="4"/>
      <rect ${B} x="230" y="110" width="170" height="90" rx="6"/>
      <rect ${B} x="450" y="110" width="140" height="36" rx="4"/>
      <rect ${B} x="450" y="165" width="140" height="36" rx="4"/>
      <line ${A} x1="100" y1="76" x2="100" y2="120"/>
      <line ${A} x1="180" y1="150" x2="230" y2="150"/>
      <line ${A} x1="420" y1="50" x2="360" y2="50"/>
      <line ${A} x1="295" y1="70" x2="295" y2="110"/>
      <line ${A} x1="450" y1="128" x2="400" y2="128"/>
      <line ${A} x1="450" y1="183" x2="400" y2="183"/>
      <line ${A} x1="315" y1="200" x2="315" y2="250"/>
      <text ${T} x="315" y="272" font-size="12">Segnali di controllo</text>`,
  },

  {
    id: 'controllo-microprogrammato',
    title: 'Unità di controllo microprogrammata',
    topic: 'cpu',
    width: 520,
    height: 340,
    slots: [
      { id: 'ir', x: 75, y: 145, label: 'IR' },
      { id: 'gen', x: 290, y: 95, label: 'Generatore indirizzi microistruzione' },
      { id: 'upc', x: 290, y: 141, label: 'μPC' },
      { id: 'cs', x: 290, y: 255, label: 'Memoria di controllo' },
    ],
    distractors: [
      'Decodificatore cablato',
      'Contatore di passo',
      'ALU',
      'Banco dei registri',
    ],
    svg: `
      <rect ${B} x="40" y="100" width="70" height="90" rx="4"/>
      <rect ${B} x="180" y="60" width="220" height="110" rx="6"/>
      <rect ${B} x="240" y="125" width="100" height="32" rx="4"/>
      <rect ${B} x="180" y="220" width="220" height="70" rx="6"/>
      <line ${A} x1="110" y1="145" x2="180" y2="145"/>
      <line ${A} x1="290" y1="170" x2="290" y2="220"/>
      <line ${A} x1="240" y1="290" x2="240" y2="320"/>
      <line ${A} x1="340" y1="290" x2="340" y2="320"/>
      <text ${T} x="290" y="335" font-size="11">Segnali di controllo</text>`,
  },
  {
    id: 'superscalare',
    title: 'Processore superscalare con due unità di esecuzione',
    topic: 'pipe',
    width: 640,
    height: 300,
    slots: [
      { id: 'fetch', x: 90, y: 45, label: 'Unità di prelievo' },
      { id: 'queue', x: 350, y: 45, label: 'Coda delle istruzioni' },
      { id: 'disp', x: 90, y: 175, label: 'Unità di distribuzione' },
      { id: 'arit', x: 360, y: 120, label: 'Unità aritmetica' },
      { id: 'ls', x: 360, y: 230, label: 'Unità load/store' },
      { id: 'wr', x: 560, y: 175, label: 'Scrittura dei risultati' },
    ],
    distractors: ['Predittore di salto', 'Cache di primo livello', 'TLB', 'Contatore di passo'],
    svg: `
      <rect ${B} x="30" y="25" width="120" height="40" rx="6"/>
      <rect ${B} x="250" y="25" width="200" height="40" rx="6"/>
      <line ${L} x1="290" y1="25" x2="290" y2="65"/>
      <line ${L} x1="330" y1="25" x2="330" y2="65"/>
      <line ${L} x1="370" y1="25" x2="370" y2="65"/>
      <line ${L} x1="410" y1="25" x2="410" y2="65"/>
      <line ${A} x1="150" y1="45" x2="250" y2="45"/>
      <line ${A} x1="90" y1="65" x2="90" y2="155"/>
      <rect ${B} x="30" y="155" width="120" height="40" rx="6"/>
      <rect ${B} x="270" y="100" width="180" height="40" rx="6"/>
      <rect ${B} x="270" y="210" width="180" height="40" rx="6"/>
      <rect ${B} x="220" y="100" width="20" height="40" rx="3"/>
      <rect ${B} x="220" y="210" width="20" height="40" rx="3"/>
      <rect ${B} x="480" y="100" width="20" height="40" rx="3"/>
      <rect ${B} x="480" y="210" width="20" height="40" rx="3"/>
      <line ${A} x1="150" y1="165" x2="220" y2="120"/>
      <line ${A} x1="150" y1="185" x2="220" y2="230"/>
      <line ${A} x1="450" y1="120" x2="480" y2="120"/>
      <line ${A} x1="450" y1="230" x2="480" y2="230"/>
      <rect ${B} x="500" y="155" width="120" height="40" rx="6"/>
      <line ${L} x1="500" y1="120" x2="560" y2="120"/>
      <line ${L} x1="500" y1="230" x2="560" y2="230"/>
      <line ${L} x1="560" y1="120" x2="560" y2="155"/>
      <line ${L} x1="560" y1="195" x2="560" y2="230"/>`,
  },

  {
    id: 'bus-singolo',
    title: 'Struttura a bus singolo',
    topic: 'io',
    width: 620,
    height: 280,
    slots: [
      { id: 'proc', x: 160, y: 45, label: 'Processore' },
      { id: 'mem', x: 450, y: 45, label: 'Memoria' },
      { id: 'bus', x: 60, y: 140, label: 'Bus' },
      { id: 'io1', x: 160, y: 235, label: 'Dispositivo di I/O 1' },
      { id: 'ion', x: 450, y: 235, label: 'Dispositivo di I/O n' },
    ],
    distractors: ['Cache', 'Rete di interconnessione', 'Controllore DMA', 'Ponte PCI'],
    svg: `
      <rect ${B} x="90" y="25" width="140" height="44" rx="6"/>
      <rect ${B} x="380" y="25" width="140" height="44" rx="6"/>
      <line ${L} x1="120" y1="140" x2="580" y2="140"/>
      <line ${L} x1="160" y1="69" x2="160" y2="140"/>
      <line ${L} x1="450" y1="69" x2="450" y2="140"/>
      <line ${L} x1="160" y1="140" x2="160" y2="213"/>
      <line ${L} x1="450" y1="140" x2="450" y2="213"/>
      <rect ${B} x="90" y="213" width="140" height="44" rx="6"/>
      <rect ${B} x="380" y="213" width="140" height="44" rx="6"/>
      <text ${T} x="305" y="240" font-size="14">· · ·</text>`,
  },

  {
    id: 'interfaccia-ingresso',
    title: 'Interfaccia di I/O per un dispositivo di ingresso',
    topic: 'io',
    width: 620,
    height: 330,
    slots: [
      { id: 'addr', x: 130, y: 190, label: 'Decodificatore di indirizzo' },
      { id: 'ctrl', x: 310, y: 190, label: 'Circuiti di controllo' },
      { id: 'regs', x: 490, y: 190, label: 'Registri dati, stato e controllo' },
      { id: 'dev', x: 310, y: 295, label: 'Dispositivo di ingresso' },
    ],
    distractors: ['Controllore DMA', 'Cache', 'ALU', 'Contatore di programma'],
    svg: `
      <line ${L} x1="40" y1="40" x2="580" y2="40"/>
      <line ${L} x1="40" y1="65" x2="580" y2="65"/>
      <line ${L} x1="40" y1="90" x2="580" y2="90"/>
      <text ${TS} x="440" y="36" font-size="10">linee indirizzi</text>
      <text ${TS} x="440" y="61" font-size="10">linee dati</text>
      <text ${TS} x="440" y="86" font-size="10">linee di controllo</text>
      <rect ${G} x="60" y="150" width="500" height="90" rx="8"/>
      <rect ${B} x="80" y="165" width="100" height="60" rx="4"/>
      <rect ${B} x="255" y="165" width="110" height="60" rx="4"/>
      <rect ${B} x="415" y="165" width="130" height="60" rx="4"/>
      <line ${A} x1="130" y1="40" x2="130" y2="165"/>
      <line ${A} x1="310" y1="90" x2="310" y2="165"/>
      <line ${A} x1="490" y1="65" x2="490" y2="165"/>
      <rect ${B} x="230" y="273" width="160" height="44" rx="6"/>
      <line ${A} x1="310" y1="273" x2="310" y2="240"/>`,
  },

  {
    id: 'usb-albero',
    title: 'Struttura ad albero dell’USB',
    topic: 'io',
    width: 620,
    height: 340,
    slots: [
      { id: 'host', x: 310, y: 35, label: 'Calcolatore ospite' },
      { id: 'root', x: 310, y: 110, label: 'Hub radice' },
      { id: 'hub1', x: 160, y: 190, label: 'Hub' },
      { id: 'hub2', x: 460, y: 190, label: 'Hub' },
      { id: 'dev1', x: 90, y: 290, label: 'Dispositivo di I/O' },
      { id: 'dev2', x: 250, y: 290, label: 'Dispositivo di I/O' },
    ],
    distractors: ['Ponte PCI', 'Controllore DMA', 'Memoria principale', 'Arbitro del bus'],
    svg: `
      <rect ${B} x="220" y="16" width="180" height="40" rx="6"/>
      <line ${L} x1="310" y1="56" x2="310" y2="88"/>
      <ellipse ${B} cx="310" cy="110" rx="60" ry="26"/>
      <line ${L} x1="310" y1="136" x2="160" y2="168"/>
      <line ${L} x1="310" y1="136" x2="460" y2="168"/>
      <ellipse ${B} cx="160" cy="190" rx="45" ry="22"/>
      <ellipse ${B} cx="460" cy="190" rx="45" ry="22"/>
      <line ${L} x1="160" y1="212" x2="90" y2="268"/>
      <line ${L} x1="160" y1="212" x2="250" y2="268"/>
      <line ${L} x1="460" y1="212" x2="400" y2="268"/>
      <line ${L} x1="460" y1="212" x2="530" y2="268"/>
      <rect ${B} x="30" y="268" width="120" height="40" rx="6"/>
      <rect ${B} x="190" y="268" width="120" height="40" rx="6"/>
      <rect ${B} x="340" y="268" width="120" height="40" rx="6"/>
      <rect ${B} x="470" y="268" width="120" height="40" rx="6"/>`,
  },

  {
    id: 'pci-sistema',
    title: 'Uso di un bus PCI in un sistema',
    topic: 'io',
    width: 640,
    height: 380,
    slots: [
      { id: 'proc', x: 250, y: 35, label: 'Processore' },
      { id: 'bridge', x: 250, y: 120, label: 'Ponte PCI' },
      { id: 'mem', x: 470, y: 120, label: 'Memoria principale' },
      { id: 'bus', x: 90, y: 195, label: 'Bus PCI' },
      { id: 'disk', x: 130, y: 260, label: 'Controllore del disco' },
      { id: 'eth', x: 320, y: 260, label: 'Ethernet' },
      { id: 'usb', x: 500, y: 260, label: 'Hub USB' },
    ],
    distractors: ['Cache di secondo livello', 'TLB', 'Unità di controllo', 'Registro di stato'],
    svg: `
      <rect ${B} x="180" y="16" width="140" height="40" rx="6"/>
      <line ${L} x1="250" y1="56" x2="250" y2="100"/>
      <rect ${B} x="180" y="100" width="140" height="40" rx="6"/>
      <rect ${B} x="390" y="100" width="160" height="40" rx="6"/>
      <line ${L} x1="320" y1="120" x2="390" y2="120"/>
      <line ${L} x1="250" y1="140" x2="250" y2="195"/>
      <line ${L} x1="40" y1="195" x2="600" y2="195"/>
      <line ${L} x1="130" y1="195" x2="130" y2="240"/>
      <line ${L} x1="320" y1="195" x2="320" y2="240"/>
      <line ${L} x1="500" y1="195" x2="500" y2="240"/>
      <rect ${B} x="60" y="240" width="140" height="40" rx="6"/>
      <rect ${B} x="255" y="240" width="130" height="40" rx="6"/>
      <rect ${B} x="435" y="240" width="130" height="40" rx="6"/>
      <line ${L} x1="130" y1="280" x2="130" y2="315"/>
      <rect ${B} x="80" y="315" width="100" height="36" rx="4"/>
      <text ${T} x="130" y="338" font-size="11">Disco</text>
      <line ${L} x1="500" y1="280" x2="500" y2="315"/>
      <rect ${B} x="440" y="315" width="120" height="36" rx="4"/>
      <text ${T} x="500" y="338" font-size="11">Tastiera · mouse</text>`,
  },

  {
    id: 'chip-memoria',
    title: 'Organizzazione delle celle in un chip di memoria',
    topic: 'mem',
    width: 620,
    height: 360,
    slots: [
      { id: 'dec', x: 80, y: 165, label: 'Decodificatore di indirizzo' },
      { id: 'cells', x: 350, y: 130, label: 'Celle di memoria' },
      { id: 'sense', x: 350, y: 275, label: 'Circuiti di lettura/scrittura' },
      { id: 'word', x: 350, y: 45, label: 'Linee di parola' },
      { id: 'data', x: 350, y: 335, label: 'Linee dati di ingresso/uscita' },
    ],
    distractors: ['Contatore di refresh', 'Etichetta', 'Registro dati', 'Multiplexer di colonna'],
    svg: `
      <rect ${B} x="30" y="80" width="100" height="170" rx="6"/>
      <text ${TS} x="16" y="110" font-size="10">A₀…A₃</text>
      <rect ${G} x="180" y="70" width="380" height="160" rx="8"/>
      <rect ${B} x="210" y="90" width="34" height="30" rx="3"/>
      <rect ${B} x="300" y="90" width="34" height="30" rx="3"/>
      <rect ${B} x="390" y="90" width="34" height="30" rx="3"/>
      <rect ${B} x="480" y="90" width="34" height="30" rx="3"/>
      <rect ${B} x="210" y="170" width="34" height="30" rx="3"/>
      <rect ${B} x="300" y="170" width="34" height="30" rx="3"/>
      <rect ${B} x="390" y="170" width="34" height="30" rx="3"/>
      <rect ${B} x="480" y="170" width="34" height="30" rx="3"/>
      <line ${L} x1="130" y1="105" x2="560" y2="105"/>
      <line ${L} x1="130" y1="185" x2="560" y2="185"/>
      <text ${T} x="350" y="152" font-size="12">⋮</text>
      <rect ${B} x="210" y="255" width="80" height="40" rx="4"/>
      <rect ${B} x="320" y="255" width="80" height="40" rx="4"/>
      <rect ${B} x="430" y="255" width="80" height="40" rx="4"/>
      <line ${L} x1="227" y1="200" x2="227" y2="255"/>
      <line ${L} x1="360" y1="200" x2="360" y2="255"/>
      <line ${L} x1="497" y1="200" x2="497" y2="255"/>
      <line ${A} x1="250" y1="295" x2="250" y2="325"/>
      <line ${A} x1="360" y1="295" x2="360" y2="325"/>
      <line ${A} x1="470" y1="295" x2="470" y2="325"/>`,
  },

  {
    id: 'dram-sincrona',
    title: 'DRAM sincrona',
    topic: 'mem',
    width: 640,
    height: 380,
    slots: [
      { id: 'refresh', x: 100, y: 40, label: 'Contatore di refresh' },
      { id: 'rowlatch', x: 100, y: 120, label: 'Latch indirizzo di riga' },
      { id: 'rowdec', x: 280, y: 120, label: 'Decodificatore di riga' },
      { id: 'array', x: 500, y: 120, label: 'Matrice di celle' },
      { id: 'collatch', x: 100, y: 215, label: 'Contatore indirizzo di colonna' },
      { id: 'coldec', x: 280, y: 215, label: 'Decodificatore di colonna' },
      { id: 'rw', x: 500, y: 215, label: 'Circuiti di lettura/scrittura' },
      { id: 'mode', x: 130, y: 320, label: 'Registro di modo e temporizzazione' },
      { id: 'dreg', x: 470, y: 320, label: 'Registri dati' },
    ],
    distractors: ['Etichetta', 'TLB', 'Unità di controllo', 'Sommatore'],
    svg: `
      <rect ${B} x="40" y="22" width="120" height="36" rx="4"/>
      <rect ${B} x="40" y="100" width="120" height="40" rx="4"/>
      <rect ${B} x="210" y="100" width="140" height="40" rx="4"/>
      <rect ${B} x="400" y="90" width="200" height="60" rx="6"/>
      <rect ${B} x="40" y="195" width="120" height="40" rx="4"/>
      <rect ${B} x="210" y="195" width="140" height="40" rx="4"/>
      <rect ${B} x="400" y="195" width="200" height="40" rx="4"/>
      <rect ${B} x="40" y="300" width="180" height="40" rx="4"/>
      <rect ${B} x="390" y="300" width="160" height="40" rx="4"/>
      <line ${A} x1="100" y1="58" x2="100" y2="100"/>
      <line ${A} x1="160" y1="120" x2="210" y2="120"/>
      <line ${A} x1="350" y1="120" x2="400" y2="120"/>
      <line ${A} x1="160" y1="215" x2="210" y2="215"/>
      <line ${A} x1="350" y1="215" x2="400" y2="215"/>
      <line ${L} x1="500" y1="150" x2="500" y2="195"/>
      <line ${A} x1="500" y1="235" x2="500" y2="300"/>
      <line ${A} x1="220" y1="320" x2="390" y2="320"/>
      <text ${TS} x="16" y="270" font-size="10">RAS · CAS · R/W · CS</text>`,
  },

  {
    id: 'dma-sistema',
    title: 'Uso dei controllori DMA in un sistema',
    topic: 'io',
    width: 620,
    height: 360,
    slots: [
      { id: 'proc', x: 200, y: 35, label: 'Processore' },
      { id: 'bridge', x: 200, y: 120, label: 'Ponte' },
      { id: 'mem', x: 450, y: 120, label: 'Memoria principale' },
      { id: 'bus', x: 80, y: 200, label: 'Bus PCI' },
      { id: 'dma1', x: 180, y: 255, label: 'Controllore disco/DMA' },
      { id: 'dma2', x: 430, y: 255, label: 'Controllore DMA' },
      { id: 'eth', x: 430, y: 330, label: 'Interfaccia Ethernet' },
    ],
    distractors: ['Cache', 'TLB', 'Registro di stato', 'ALU'],
    svg: `
      <rect ${B} x="130" y="16" width="140" height="40" rx="6"/>
      <line ${L} x1="200" y1="56" x2="200" y2="100"/>
      <rect ${B} x="130" y="100" width="140" height="40" rx="6"/>
      <rect ${B} x="370" y="100" width="160" height="40" rx="6"/>
      <line ${L} x1="270" y1="120" x2="370" y2="120"/>
      <line ${L} x1="200" y1="140" x2="200" y2="200"/>
      <line ${L} x1="40" y1="200" x2="580" y2="200"/>
      <line ${L} x1="180" y1="200" x2="180" y2="235"/>
      <line ${L} x1="430" y1="200" x2="430" y2="235"/>
      <rect ${B} x="100" y="235" width="160" height="40" rx="6"/>
      <rect ${B} x="360" y="235" width="140" height="40" rx="6"/>
      <line ${L} x1="140" y1="275" x2="140" y2="305"/>
      <line ${L} x1="220" y1="275" x2="220" y2="305"/>
      <rect ${B} x="105" y="305" width="70" height="34" rx="4"/>
      <rect ${B} x="185" y="305" width="70" height="34" rx="4"/>
      <text ${T} x="140" y="327" font-size="11">Disco</text>
      <text ${T} x="220" y="327" font-size="11">Disco</text>
      <line ${L} x1="430" y1="275" x2="430" y2="310"/>
      <rect ${B} x="360" y="310" width="140" height="38" rx="4"/>`,
  },

  {
    id: 'cache-diretta',
    title: 'Cache a mappatura diretta',
    topic: 'mem',
    width: 620,
    height: 400,
    slots: [
      { id: 'cache', x: 140, y: 30, label: 'Cache' },
      { id: 'centrale', x: 470, y: 30, label: 'Memoria centrale' },
      { id: 'tag', x: 45, y: 100, label: 'Etichetta' },
      { id: 'blocco', x: 160, y: 100, label: 'Blocco' },
      { id: 'ftag', x: 130, y: 350, label: 'Etichetta' },
      { id: 'fblocco', x: 265, y: 350, label: 'Blocco' },
      { id: 'fword', x: 375, y: 350, label: 'Parola' },
      { id: 'ind', x: 250, y: 388, label: 'Indirizzo di memoria centrale' },
    ],
    distractors: ['Gruppo', 'Frame', 'Pagina', 'Spiazzamento di pagina'],
    svg: `
      <rect ${G} x="20" y="115" width="230" height="180" rx="8"/>
      <rect ${B} x="20" y="125" width="60" height="28" rx="3"/>
      <rect ${B} x="90" y="125" width="150" height="28" rx="3"/>
      <rect ${B} x="20" y="160" width="60" height="28" rx="3"/>
      <rect ${B} x="90" y="160" width="150" height="28" rx="3"/>
      <rect ${B} x="20" y="250" width="60" height="28" rx="3"/>
      <rect ${B} x="90" y="250" width="150" height="28" rx="3"/>
      <text ${T} x="160" y="215" font-size="11">⋮</text>
      <rect ${G} x="380" y="55" width="200" height="245" rx="8"/>
      <rect ${B} x="395" y="70" width="170" height="26" rx="3"/>
      <rect ${B} x="395" y="101" width="170" height="26" rx="3"/>
      <rect ${B} x="395" y="165" width="170" height="26" rx="3"/>
      <rect ${B} x="395" y="255" width="170" height="26" rx="3"/>
      <text ${T} x="480" y="147" font-size="11">⋮</text>
      <text ${T} x="480" y="215" font-size="11">⋮</text>
      <line ${A} x1="380" y1="178" x2="255" y2="174"/>
      <line ${A} x1="380" y1="268" x2="255" y2="264"/>
      <rect ${B} x="70" y="332" width="120" height="28" rx="4"/>
      <rect ${B} x="200" y="332" width="130" height="28" rx="4"/>
      <rect ${B} x="340" y="332" width="90" height="28" rx="4"/>
      <line ${L} x1="70" y1="372" x2="430" y2="372"/>`,
  },

  {
    id: 'cache-associativa',
    title: 'Cache completamente associativa',
    topic: 'mem',
    width: 620,
    height: 380,
    slots: [
      { id: 'cache', x: 140, y: 30, label: 'Cache' },
      { id: 'centrale', x: 470, y: 30, label: 'Memoria centrale' },
      { id: 'tag', x: 45, y: 100, label: 'Etichetta' },
      { id: 'blocco', x: 160, y: 100, label: 'Blocco' },
      { id: 'ftag', x: 165, y: 330, label: 'Etichetta' },
      { id: 'fword', x: 340, y: 330, label: 'Parola' },
      { id: 'ind', x: 250, y: 366, label: 'Indirizzo di memoria centrale' },
    ],
    distractors: ['Gruppo', 'Indice', 'Frame', 'Numero di pagina'],
    svg: `
      <rect ${G} x="20" y="115" width="230" height="170" rx="8"/>
      <rect ${B} x="20" y="125" width="60" height="28" rx="3"/>
      <rect ${B} x="90" y="125" width="150" height="28" rx="3"/>
      <rect ${B} x="20" y="160" width="60" height="28" rx="3"/>
      <rect ${B} x="90" y="160" width="150" height="28" rx="3"/>
      <rect ${B} x="20" y="245" width="60" height="28" rx="3"/>
      <rect ${B} x="90" y="245" width="150" height="28" rx="3"/>
      <text ${T} x="160" y="212" font-size="11">⋮</text>
      <rect ${G} x="380" y="55" width="200" height="235" rx="8"/>
      <rect ${B} x="395" y="70" width="170" height="26" rx="3"/>
      <rect ${B} x="395" y="101" width="170" height="26" rx="3"/>
      <rect ${B} x="395" y="170" width="170" height="26" rx="3"/>
      <rect ${B} x="395" y="250" width="170" height="26" rx="3"/>
      <text ${T} x="480" y="150" font-size="11">⋮</text>
      <text ${T} x="480" y="220" font-size="11">⋮</text>
      <line ${A} x1="380" y1="183" x2="255" y2="174"/>
      <text ${TS} x="270" y="300" font-size="10">il blocco può stare in QUALSIASI posizione</text>
      <rect ${B} x="90" y="312" width="150" height="28" rx="4"/>
      <rect ${B} x="290" y="312" width="100" height="28" rx="4"/>
      <line ${L} x1="90" y1="352" x2="390" y2="352"/>`,
  },

  {
    id: 'memoria-virtuale-org',
    title: 'Organizzazione della memoria virtuale',
    topic: 'vm',
    width: 520,
    height: 420,
    slots: [
      { id: 'proc', x: 260, y: 35, label: 'Processore' },
      { id: 'mmu', x: 260, y: 130, label: 'MMU' },
      { id: 'cache', x: 260, y: 225, label: 'Cache' },
      { id: 'mem', x: 260, y: 315, label: 'Memoria principale' },
      { id: 'disk', x: 260, y: 395, label: 'Disco' },
    ],
    distractors: ['Registro di stato', 'ALU', 'Controllore di interruzione', 'Banco dei registri'],
    svg: `
      <rect ${B} x="170" y="16" width="180" height="40" rx="6"/>
      <line ${A} x1="260" y1="56" x2="260" y2="110"/>
      <text ${TS} x="275" y="88" font-size="10">indirizzo virtuale</text>
      <rect ${B} x="200" y="110" width="120" height="40" rx="6"/>
      <line ${A} x1="260" y1="150" x2="260" y2="205"/>
      <text ${TS} x="275" y="182" font-size="10">indirizzo fisico</text>
      <rect ${B} x="170" y="205" width="180" height="40" rx="6"/>
      <line ${A} x1="260" y1="245" x2="260" y2="295"/>
      <rect ${B} x="150" y="295" width="220" height="40" rx="6"/>
      <line ${A} x1="260" y1="335" x2="260" y2="375"/>
      <text ${TS} x="275" y="360" font-size="10">trasferimento DMA</text>
      <rect ${B} x="180" y="375" width="160" height="40" rx="6"/>
      <line ${L} x1="120" y1="36" x2="120" y2="315"/>
      <line ${L} x1="120" y1="36" x2="170" y2="36"/>
      <line ${L} x1="120" y1="225" x2="170" y2="225"/>
      <line ${L} x1="120" y1="315" x2="150" y2="315"/>
      <text ${TS} x="20" y="180" font-size="10">dati</text>`,
  },
  {
    id: 'sommatore-sottrattore',
    title: 'Circuito di addizione e sottrazione',
    topic: 'arith',
    width: 620,
    height: 300,
    slots: [
      { id: 'adder', x: 290, y: 150, label: 'Sommatore a n bit' },
      { id: 'xor', x: 470, y: 70, label: 'Porte XOR di inversione' },
      { id: 'ctrl', x: 560, y: 30, label: 'Controllo Add/Sub' },
      { id: 'cin', x: 555, y: 150, label: 'Riporto entrante' },
      { id: 'cout', x: 55, y: 150, label: 'Riporto uscente' },
      { id: 'sum', x: 290, y: 265, label: 'Bit di somma' },
    ],
    distractors: ['Overflow', 'Moltiplicatore', 'Registro accumulatore', 'Decodificatore'],
    svg: `
      <path ${B} d="M120 120 h340 l-40 60 h-260 z"/>
      <rect ${B} x="410" y="50" width="34" height="34" rx="4"/>
      <rect ${B} x="460" y="50" width="34" height="34" rx="4"/>
      <rect ${B} x="510" y="50" width="34" height="34" rx="4"/>
      <line ${L} x1="427" y1="84" x2="427" y2="120"/>
      <line ${L} x1="477" y1="84" x2="477" y2="120"/>
      <line ${L} x1="527" y1="84" x2="527" y2="120"/>
      <line ${L} x1="560" y1="46" x2="560" y2="67"/>
      <line ${L} x1="410" y1="67" x2="560" y2="67"/>
      <line ${L} x1="560" y1="67" x2="560" y2="150"/>
      <line ${A} x1="560" y1="150" x2="460" y2="150"/>
      <line ${L} x1="180" y1="90" x2="180" y2="120"/>
      <line ${L} x1="240" y1="90" x2="240" y2="120"/>
      <line ${L} x1="300" y1="90" x2="300" y2="120"/>
      <text ${TS} x="140" y="84" font-size="10">x₀ … x₍ₙ₋₁₎</text>
      <text ${TS} x="400" y="40" font-size="10">y₀ … y₍ₙ₋₁₎</text>
      <line ${A} x1="120" y1="150" x2="70" y2="150"/>
      <line ${A} x1="240" y1="180" x2="240" y2="240"/>
      <line ${A} x1="290" y1="180" x2="290" y2="240"/>
      <line ${A} x1="340" y1="180" x2="340" y2="240"/>`,
  },

  {
    id: 'carry-lookahead',
    title: 'Sommatore con riporto anticipato',
    topic: 'arith',
    width: 640,
    height: 320,
    slots: [
      { id: 'b3', x: 100, y: 90, label: 'Cella B' },
      { id: 'b0', x: 520, y: 90, label: 'Cella B' },
      { id: 'logic', x: 320, y: 220, label: 'Logica di riporto anticipato' },
      { id: 'g', x: 235, y: 290, label: 'Segnale di generazione G' },
      { id: 'p', x: 430, y: 290, label: 'Segnale di propagazione P' },
      { id: 'c4', x: 55, y: 90, label: 'Riporto uscente' },
      { id: 'c0', x: 595, y: 90, label: 'Riporto entrante' },
    ],
    distractors: ['Multiplexer', 'Registro di stato', 'Traboccamento', 'Decodificatore'],
    svg: `
      <rect ${B} x="60" y="65" width="90" height="50" rx="6"/>
      <rect ${B} x="200" y="65" width="90" height="50" rx="6"/>
      <rect ${B} x="340" y="65" width="90" height="50" rx="6"/>
      <rect ${B} x="480" y="65" width="90" height="50" rx="6"/>
      <line ${A} x1="200" y1="90" x2="150" y2="90"/>
      <line ${A} x1="340" y1="90" x2="290" y2="90"/>
      <line ${A} x1="480" y1="90" x2="430" y2="90"/>
      <line ${A} x1="60" y1="90" x2="20" y2="90"/>
      <line ${L} x1="600" y1="90" x2="570" y2="90"/>
      <line ${L} x1="80" y1="40" x2="80" y2="65"/>
      <line ${L} x1="120" y1="40" x2="120" y2="65"/>
      <line ${L} x1="220" y1="40" x2="220" y2="65"/>
      <line ${L} x1="260" y1="40" x2="260" y2="65"/>
      <line ${L} x1="360" y1="40" x2="360" y2="65"/>
      <line ${L} x1="400" y1="40" x2="400" y2="65"/>
      <line ${L} x1="500" y1="40" x2="500" y2="65"/>
      <line ${L} x1="540" y1="40" x2="540" y2="65"/>
      <line ${L} x1="105" y1="115" x2="105" y2="195"/>
      <line ${L} x1="245" y1="115" x2="245" y2="195"/>
      <line ${L} x1="385" y1="115" x2="385" y2="195"/>
      <line ${L} x1="525" y1="115" x2="525" y2="195"/>
      <rect ${B} x="60" y="195" width="510" height="50" rx="6"/>
      <line ${A} x1="235" y1="245" x2="235" y2="275"/>
      <line ${A} x1="430" y1="245" x2="430" y2="275"/>
      <text ${TS} x="20" y="140" font-size="10">s₃ … s₀ (bit di somma)</text>`,
  },

  {
    id: 'moltiplicatore-sequenziale',
    title: 'Moltiplicatore binario sequenziale',
    topic: 'arith',
    width: 620,
    height: 340,
    slots: [
      { id: 'a', x: 200, y: 45, label: 'Registro A (prodotto parziale)' },
      { id: 'q', x: 470, y: 45, label: 'Registro Q (moltiplicatore)' },
      { id: 'shift', x: 480, y: 100, label: 'Scorrimento a destra' },
      { id: 'adder', x: 175, y: 185, label: 'Sommatore a n bit' },
      { id: 'mux', x: 350, y: 185, label: 'Multiplexer' },
      { id: 'm', x: 200, y: 285, label: 'Registro M (moltiplicando)' },
      { id: 'seq', x: 520, y: 240, label: 'Sequenziatore di controllo' },
    ],
    distractors: ['Cache', 'Decodificatore di riga', 'ALU in virgola mobile', 'MAR'],
    svg: `
      <rect ${B} x="60" y="28" width="40" height="34" rx="4"/>
      <text ${T} x="80" y="50" font-size="11">C</text>
      <rect ${B} x="110" y="28" width="180" height="34" rx="4"/>
      <rect ${B} x="380" y="28" width="180" height="34" rx="4"/>
      <line ${A} x1="560" y1="45" x2="590" y2="45"/>
      <line ${L} x1="290" y1="45" x2="380" y2="45"/>
      <path ${B} d="M100 160 h150 l-25 50 h-100 z"/>
      <rect ${B} x="300" y="165" width="100" height="40" rx="4"/>
      <rect ${B} x="110" y="265" width="180" height="40" rx="4"/>
      <ellipse ${B} cx="520" cy="240" rx="80" ry="45"/>
      <line ${A} x1="175" y1="160" x2="175" y2="62"/>
      <line ${A} x1="200" y1="265" x2="200" y2="215"/>
      <line ${A} x1="300" y1="185" x2="255" y2="185"/>
      <line ${A} x1="440" y1="215" x2="400" y2="195"/>
      <line ${L} x1="470" y1="62" x2="470" y2="195"/>
      <text ${TS} x="300" y="120" font-size="10">controllo somma/non somma</text>`,
  },

  {
    id: 'divisione-binaria',
    title: 'Circuito per la divisione binaria',
    topic: 'arith',
    width: 620,
    height: 320,
    slots: [
      { id: 'a', x: 175, y: 60, label: 'Registro A (resto parziale)' },
      { id: 'q', x: 440, y: 60, label: 'Registro Q (dividendo)' },
      { id: 'shift', x: 545, y: 25, label: 'Scorrimento a sinistra' },
      { id: 'adder', x: 150, y: 165, label: 'Sommatore a n+1 bit' },
      { id: 'm', x: 200, y: 265, label: 'Registro M (divisore)' },
      { id: 'seq', x: 490, y: 200, label: 'Sequenziatore di controllo' },
      { id: 'quot', x: 545, y: 105, label: 'Impostazione del quoziente' },
    ],
    distractors: ['Moltiplicatore', 'Normalizzazione', 'Registro di stato', 'Cache'],
    svg: `
      <rect ${B} x="70" y="42" width="210" height="36" rx="4"/>
      <rect ${B} x="340" y="42" width="200" height="36" rx="4"/>
      <line ${L} x1="280" y1="60" x2="340" y2="60"/>
      <line ${L} x1="70" y1="25" x2="540" y2="25"/>
      <line ${L} x1="70" y1="25" x2="70" y2="42"/>
      <path ${B} d="M90 140 h130 l-25 50 h-80 z"/>
      <rect ${B} x="110" y="245" width="180" height="40" rx="4"/>
      <ellipse ${B} cx="490" cy="200" rx="80" ry="45"/>
      <line ${A} x1="150" y1="140" x2="150" y2="78"/>
      <line ${A} x1="200" y1="245" x2="200" y2="190"/>
      <line ${A} x1="410" y1="180" x2="230" y2="170"/>
      <line ${L} x1="440" y1="78" x2="440" y2="155"/>
      <text ${TS} x="300" y="135" font-size="10">somma / sottrazione</text>`,
  },

  {
    id: 'ieee-formati',
    title: 'Formati IEEE in virgola mobile',
    topic: 'ieee',
    width: 640,
    height: 300,
    slots: [
      { id: 's32', x: 55, y: 75, label: 'Segno (1 bit)' },
      { id: 'e32', x: 150, y: 75, label: 'Esponente in eccesso 127 (8 bit)' },
      { id: 'm32', x: 420, y: 75, label: 'Mantissa (23 bit)' },
      { id: 's64', x: 55, y: 215, label: 'Segno (1 bit)' },
      { id: 'e64', x: 160, y: 215, label: 'Esponente in eccesso 1023 (11 bit)' },
      { id: 'm64', x: 430, y: 215, label: 'Mantissa (52 bit)' },
    ],
    distractors: ['Bit implicito', 'Riporto', 'Etichetta', 'Spiazzamento'],
    svg: `
      <text ${TS} x="20" y="30" font-size="11">Singola precisione — 32 bit</text>
      <rect ${B} x="30" y="50" width="50" height="40" rx="3"/>
      <rect ${B} x="80" y="50" width="140" height="40" rx="3"/>
      <rect ${B} x="220" y="50" width="390" height="40" rx="3"/>
      <text ${T} x="320" y="120" font-size="11">valore = ± 1,M × 2^(E − 127)</text>
      <text ${TS} x="20" y="170" font-size="11">Doppia precisione — 64 bit</text>
      <rect ${B} x="30" y="190" width="50" height="40" rx="3"/>
      <rect ${B} x="80" y="190" width="160" height="40" rx="3"/>
      <rect ${B} x="240" y="190" width="370" height="40" rx="3"/>
      <text ${T} x="320" y="262" font-size="11">valore = ± 1,M × 2^(E − 1023)</text>`,
  },

  {
    id: 'fp-somma',
    title: 'Unità di addizione in virgola mobile',
    topic: 'ieee',
    width: 620,
    height: 420,
    slots: [
      { id: 'sub', x: 130, y: 45, label: 'Sottrattore degli esponenti' },
      { id: 'swap', x: 430, y: 45, label: 'Scambio delle mantisse' },
      { id: 'shift', x: 430, y: 125, label: 'Scorrimento della mantissa minore' },
      { id: 'ctrl', x: 130, y: 175, label: 'Rete di controllo' },
      { id: 'add', x: 430, y: 215, label: 'Sommatore delle mantisse' },
      { id: 'lead', x: 250, y: 290, label: 'Rivelatore di zeri iniziali' },
      { id: 'norm', x: 470, y: 320, label: 'Normalizzazione e arrotondamento' },
      { id: 'expo', x: 130, y: 370, label: 'Esponente del risultato' },
    ],
    distractors: ['Moltiplicatore', 'Registro di stato', 'Decodificatore', 'Contatore di refresh'],
    svg: `
      <path ${B} d="M60 25 h140 l-25 40 h-90 z"/>
      <rect ${B} x="350" y="25" width="160" height="40" rx="6"/>
      <rect ${B} x="350" y="105" width="160" height="40" rx="6"/>
      <ellipse ${B} cx="130" cy="175" rx="90" ry="45"/>
      <path ${B} d="M350 195 h160 l-25 40 h-110 z"/>
      <rect ${B} x="180" y="270" width="140" height="40" rx="6"/>
      <rect ${B} x="390" y="300" width="160" height="40" rx="6"/>
      <path ${B} d="M60 350 h140 l-25 40 h-90 z"/>
      <line ${A} x1="200" y1="45" x2="350" y2="45"/>
      <line ${A} x1="430" y1="65" x2="430" y2="105"/>
      <line ${A} x1="430" y1="145" x2="430" y2="195"/>
      <line ${A} x1="130" y1="65" x2="130" y2="130"/>
      <line ${A} x1="220" y1="175" x2="350" y2="215"/>
      <line ${A} x1="390" y1="235" x2="320" y2="285"/>
      <line ${A} x1="320" y1="290" x2="390" y2="315"/>
      <line ${A} x1="180" y1="290" x2="130" y2="345"/>
      <text ${TS} x="20" y="18" font-size="10">E_A, E_B</text>
      <text ${TS} x="530" y="18" font-size="10">M_A, M_B</text>`,
  },

  {
    id: 'soc-blocchi',
    title: 'Sistema su singolo chip (SoC)',
    topic: 'io',
    width: 640,
    height: 340,
    slots: [
      { id: 'proc', x: 90, y: 45, label: 'Processore' },
      { id: 'mem', x: 250, y: 45, label: 'Memoria su chip' },
      { id: 'timer', x: 410, y: 45, label: 'Timer' },
      { id: 'irqc', x: 560, y: 45, label: 'Controllore delle interruzioni' },
      { id: 'net', x: 320, y: 140, label: 'Rete di interconnessione' },
      { id: 'pio', x: 110, y: 215, label: 'Interfaccia parallela' },
      { id: 'adc', x: 400, y: 215, label: 'Convertitore A/D' },
      { id: 'sensore', x: 400, y: 285, label: 'Sensore' },
    ],
    distractors: ['Controllore DMA', 'Cache', 'TLB', 'Ponte PCI'],
    svg: `
      <rect ${G} x="20" y="20" width="600" height="200" rx="10"/>
      <rect ${B} x="35" y="25" width="110" height="40" rx="6"/>
      <rect ${B} x="185" y="25" width="130" height="40" rx="6"/>
      <rect ${B} x="350" y="25" width="120" height="40" rx="6"/>
      <rect ${B} x="500" y="25" width="120" height="40" rx="6"/>
      <line ${L} x1="90" y1="65" x2="90" y2="120"/>
      <line ${L} x1="250" y1="65" x2="250" y2="120"/>
      <line ${L} x1="410" y1="65" x2="410" y2="120"/>
      <line ${L} x1="560" y1="65" x2="560" y2="120"/>
      <rect ${B} x="35" y="120" width="585" height="40" rx="6"/>
      <rect ${B} x="45" y="195" width="130" height="40" rx="4"/>
      <rect ${B} x="200" y="195" width="110" height="40" rx="4"/>
      <rect ${B} x="335" y="195" width="130" height="40" rx="4"/>
      <rect ${B} x="490" y="195" width="130" height="40" rx="4"/>
      <line ${L} x1="110" y1="160" x2="110" y2="195"/>
      <line ${L} x1="255" y1="160" x2="255" y2="195"/>
      <line ${L} x1="400" y1="160" x2="400" y2="195"/>
      <line ${L} x1="555" y1="160" x2="555" y2="195"/>
      <line ${A} x1="400" y1="235" x2="400" y2="265"/>
      <line ${A} x1="555" y1="235" x2="555" y2="265"/>
      <rect ${B} x="330" y="265" width="140" height="38" rx="4"/>
      <rect ${B} x="500" y="265" width="130" height="38" rx="4"/>
      <text ${T} x="255" y="222" font-size="10">seriale</text>
      <text ${T} x="555" y="222" font-size="10">D/A</text>
      <text ${T} x="565" y="289" font-size="10">attuatore</text>
      <text ${TS} x="30" y="15" font-size="10">un solo chip</text>`,
  },

  {
    id: 'multiprocessore-uma',
    title: 'Multiprocessore a memoria condivisa (UMA)',
    topic: 'perf',
    width: 620,
    height: 300,
    slots: [
      { id: 'p1', x: 110, y: 40, label: 'Processore' },
      { id: 'pn', x: 500, y: 40, label: 'Processore' },
      { id: 'net', x: 310, y: 150, label: 'Rete di interconnessione' },
      { id: 'm1', x: 110, y: 260, label: 'Memoria' },
      { id: 'mn', x: 500, y: 260, label: 'Memoria' },
    ],
    distractors: ['Cache privata', 'Controllore DMA', 'Bus PCI', 'Unità di controllo'],
    svg: `
      <rect ${B} x="60" y="20" width="100" height="40" rx="6"/>
      <rect ${B} x="240" y="20" width="100" height="40" rx="6"/>
      <rect ${B} x="450" y="20" width="100" height="40" rx="6"/>
      <text ${T} x="395" y="45" font-size="14">· · ·</text>
      <ellipse ${B} cx="310" cy="150" rx="270" ry="42"/>
      <line ${A} x1="110" y1="60" x2="110" y2="120"/>
      <line ${A} x1="290" y1="60" x2="290" y2="112"/>
      <line ${A} x1="500" y1="60" x2="500" y2="120"/>
      <rect ${B} x="60" y="240" width="100" height="40" rx="6"/>
      <rect ${B} x="240" y="240" width="100" height="40" rx="6"/>
      <rect ${B} x="450" y="240" width="100" height="40" rx="6"/>
      <text ${T} x="395" y="265" font-size="14">· · ·</text>
      <line ${A} x1="110" y1="182" x2="110" y2="240"/>
      <line ${A} x1="290" y1="188" x2="290" y2="240"/>
      <line ${A} x1="500" y1="182" x2="500" y2="240"/>`,
  },
  {
    id: 'cmos-struttura',
    title: 'Struttura di un circuito CMOS',
    topic: 'tech',
    width: 520,
    height: 340,
    slots: [
      { id: 'pu', x: 300, y: 90, label: 'Rete di pull-up (pMOS)' },
      { id: 'pd', x: 300, y: 240, label: 'Rete di pull-down (nMOS)' },
      { id: 'vdd', x: 300, y: 25, label: 'Alimentazione' },
      { id: 'gnd', x: 300, y: 315, label: 'Massa' },
      { id: 'out', x: 460, y: 165, label: 'Uscita' },
      { id: 'in', x: 60, y: 165, label: 'Ingressi' },
    ],
    distractors: ['Condensatore di memoria', 'Resistenza di carico', 'Clock', 'Riporto'],
    svg: `
      <line ${L} x1="180" y1="45" x2="420" y2="45"/>
      <line ${L} x1="300" y1="45" x2="300" y2="65"/>
      <rect ${B} x="200" y="65" width="200" height="50" rx="6"/>
      <line ${L} x1="300" y1="115" x2="300" y2="215"/>
      <rect ${B} x="200" y="215" width="200" height="50" rx="6"/>
      <line ${L} x1="300" y1="265" x2="300" y2="295"/>
      <line ${L} x1="240" y1="295" x2="360" y2="295"/>
      <line ${L} x1="260" y1="305" x2="340" y2="305"/>
      <line ${A} x1="300" y1="165" x2="420" y2="165"/>
      <line ${L} x1="120" y1="90" x2="200" y2="90"/>
      <line ${L} x1="120" y1="240" x2="200" y2="240"/>
      <line ${L} x1="120" y1="90" x2="120" y2="240"/>
      <line ${A} x1="90" y1="165" x2="120" y2="165"/>`,
  },

  {
    id: 'master-slave',
    title: 'Flip-flop D master-slave',
    topic: 'ff',
    width: 620,
    height: 280,
    slots: [
      { id: 'master', x: 230, y: 45, label: 'Master' },
      { id: 'slave', x: 430, y: 45, label: 'Slave' },
      { id: 'd', x: 45, y: 105, label: 'Ingresso D' },
      { id: 'clk', x: 55, y: 220, label: 'Clock' },
      { id: 'inv', x: 330, y: 220, label: 'Invertitore del clock' },
      { id: 'q', x: 575, y: 105, label: 'Uscita Q' },
    ],
    distractors: ['Preset', 'Clear', 'Abilitazione', 'Riporto'],
    svg: `
      <rect ${G} x="140" y="25" width="360" height="140" rx="10"/>
      <rect ${B} x="170" y="70" width="120" height="80" rx="6"/>
      <rect ${B} x="370" y="70" width="120" height="80" rx="6"/>
      <text ${TS} x="178" y="95" font-size="11">D      Q</text>
      <text ${TS} x="178" y="140" font-size="11">Clk</text>
      <text ${TS} x="378" y="95" font-size="11">D      Q</text>
      <text ${TS} x="378" y="140" font-size="11">Clk</text>
      <line ${A} x1="80" y1="105" x2="170" y2="105"/>
      <line ${A} x1="290" y1="105" x2="370" y2="105"/>
      <line ${A} x1="490" y1="105" x2="545" y2="105"/>
      <line ${L} x1="90" y1="220" x2="230" y2="220"/>
      <line ${L} x1="230" y1="220" x2="230" y2="150"/>
      <line ${L} x1="290" y1="220" x2="380" y2="220"/>
      <line ${L} x1="430" y1="220" x2="430" y2="150"/>
      <text ${TS} x="180" y="200" font-size="10">clock diretto</text>
      <text ${TS} x="390" y="200" font-size="10">clock invertito</text>`,
  },

  {
    id: 'registro-scorrimento',
    title: 'Registro a scorrimento',
    topic: 'ff',
    width: 640,
    height: 240,
    slots: [
      { id: 'in', x: 45, y: 70, label: 'Ingresso seriale' },
      { id: 'f1', x: 145, y: 70, label: 'Flip-flop D' },
      { id: 'f4', x: 505, y: 70, label: 'Flip-flop D' },
      { id: 'out', x: 595, y: 70, label: 'Uscita seriale' },
      { id: 'clk', x: 55, y: 185, label: 'Clock' },
    ],
    distractors: ['Latch trasparente', 'Contatore', 'Decodificatore', 'Multiplexer'],
    svg: `
      <rect ${B} x="100" y="45" width="90" height="70" rx="6"/>
      <rect ${B} x="220" y="45" width="90" height="70" rx="6"/>
      <rect ${B} x="340" y="45" width="90" height="70" rx="6"/>
      <rect ${B} x="460" y="45" width="90" height="70" rx="6"/>
      <text ${TS} x="108" y="68" font-size="11">D    Q</text>
      <text ${TS} x="228" y="68" font-size="11">D    Q</text>
      <text ${TS} x="348" y="68" font-size="11">D    Q</text>
      <text ${TS} x="468" y="68" font-size="11">D    Q</text>
      <line ${A} x1="70" y1="70" x2="100" y2="70"/>
      <line ${A} x1="190" y1="70" x2="220" y2="70"/>
      <line ${A} x1="310" y1="70" x2="340" y2="70"/>
      <line ${A} x1="430" y1="70" x2="460" y2="70"/>
      <line ${A} x1="550" y1="70" x2="575" y2="70"/>
      <line ${L} x1="90" y1="185" x2="560" y2="185"/>
      <line ${L} x1="145" y1="185" x2="145" y2="115"/>
      <line ${L} x1="265" y1="185" x2="265" y2="115"/>
      <line ${L} x1="385" y1="185" x2="385" y2="115"/>
      <line ${L} x1="505" y1="185" x2="505" y2="115"/>`,
  },

  {
    id: 'contatore-3bit',
    title: 'Contatore binario a 3 bit',
    topic: 'ff',
    width: 620,
    height: 250,
    slots: [
      { id: 'one', x: 45, y: 60, label: 'Ingresso costante 1' },
      { id: 'f0', x: 150, y: 60, label: 'Flip-flop T' },
      { id: 'q0', x: 240, y: 145, label: 'Q₀ (bit meno significativo)' },
      { id: 'q2', x: 545, y: 145, label: 'Q₂ (bit più significativo)' },
      { id: 'clk', x: 55, y: 200, label: 'Clock' },
    ],
    distractors: ['Registro a scorrimento', 'Decodificatore', 'Azzeramento asincrono', 'Multiplexer'],
    svg: `
      <rect ${B} x="100" y="35" width="100" height="70" rx="6"/>
      <rect ${B} x="270" y="35" width="100" height="70" rx="6"/>
      <rect ${B} x="440" y="35" width="100" height="70" rx="6"/>
      <text ${TS} x="108" y="58" font-size="11">T    Q</text>
      <text ${TS} x="278" y="58" font-size="11">T    Q</text>
      <text ${TS} x="448" y="58" font-size="11">T    Q</text>
      <line ${A} x1="70" y1="60" x2="100" y2="60"/>
      <line ${A} x1="200" y1="60" x2="270" y2="60"/>
      <line ${A} x1="370" y1="60" x2="440" y2="60"/>
      <line ${A} x1="200" y1="105" x2="200" y2="130"/>
      <line ${A} x1="370" y1="105" x2="370" y2="130"/>
      <line ${A} x1="540" y1="105" x2="540" y2="130"/>
      <line ${L} x1="90" y1="200" x2="560" y2="200"/>
      <line ${L} x1="150" y1="200" x2="150" y2="105"/>
      <line ${L} x1="320" y1="200" x2="320" y2="105"/>
      <line ${L} x1="490" y1="200" x2="490" y2="105"/>`,
  },

  {
    id: 'decoder-2-4',
    title: 'Decodificatore a due ingressi e quattro uscite',
    topic: 'comb',
    width: 560,
    height: 330,
    slots: [
      { id: 'x1', x: 40, y: 40, label: 'Ingresso x₁' },
      { id: 'x2', x: 40, y: 290, label: 'Ingresso x₂' },
      { id: 'inv', x: 175, y: 165, label: 'Invertitori' },
      { id: 'and', x: 330, y: 165, label: 'Porte AND' },
      { id: 'out', x: 505, y: 165, label: 'Uscite (una sola attiva)' },
    ],
    distractors: ['Multiplexer', 'Buffer tri-state', 'Flip-flop', 'Sommatore'],
    svg: `
      <line ${L} x1="70" y1="40" x2="200" y2="40"/>
      <line ${L} x1="70" y1="290" x2="200" y2="290"/>
      <path ${B} d="M150 145 h40 l16 20 l-16 20 h-40 z"/>
      <path ${B} d="M150 205 h40 l16 20 l-16 20 h-40 z"/>
      <rect ${B} x="290" y="40" width="80" height="42" rx="20"/>
      <rect ${B} x="290" y="112" width="80" height="42" rx="20"/>
      <rect ${B} x="290" y="184" width="80" height="42" rx="20"/>
      <rect ${B} x="290" y="256" width="80" height="42" rx="20"/>
      <line ${A} x1="370" y1="61" x2="450" y2="61"/>
      <line ${A} x1="370" y1="133" x2="450" y2="133"/>
      <line ${A} x1="370" y1="205" x2="450" y2="205"/>
      <line ${A} x1="370" y1="277" x2="450" y2="277"/>
      <line ${L} x1="230" y1="61" x2="290" y2="61"/>
      <line ${L} x1="230" y1="133" x2="290" y2="133"/>
      <line ${L} x1="230" y1="205" x2="290" y2="205"/>
      <line ${L} x1="230" y1="277" x2="290" y2="277"/>
      <text ${TS} x="460" y="65" font-size="10">0</text>
      <text ${TS} x="460" y="137" font-size="10">1</text>
      <text ${TS} x="460" y="209" font-size="10">2</text>
      <text ${TS} x="460" y="281" font-size="10">3</text>`,
  },

  {
    id: 'mux-4-1',
    title: 'Multiplexer a quattro ingressi',
    topic: 'comb',
    width: 560,
    height: 320,
    slots: [
      { id: 'data', x: 65, y: 130, label: 'Ingressi dati' },
      { id: 'mux', x: 300, y: 130, label: 'Multiplexer' },
      { id: 'out', x: 500, y: 130, label: 'Uscita z' },
      { id: 'sel', x: 300, y: 280, label: 'Ingressi di selezione' },
    ],
    distractors: ['Decodificatore', 'Buffer tri-state', 'Registro', 'Sommatore completo'],
    svg: `
      <path ${B} d="M230 45 h140 l-25 170 h-90 z"/>
      <line ${A} x1="120" y1="70" x2="230" y2="70"/>
      <line ${A} x1="120" y1="110" x2="230" y2="110"/>
      <line ${A} x1="120" y1="150" x2="230" y2="150"/>
      <line ${A} x1="120" y1="190" x2="230" y2="190"/>
      <text ${TS} x="90" y="74" font-size="10">x₁</text>
      <text ${TS} x="90" y="114" font-size="10">x₂</text>
      <text ${TS} x="90" y="154" font-size="10">x₃</text>
      <text ${TS} x="90" y="194" font-size="10">x₄</text>
      <line ${A} x1="370" y1="130" x2="460" y2="130"/>
      <line ${L} x1="275" y1="215" x2="275" y2="255"/>
      <line ${L} x1="325" y1="215" x2="325" y2="255"/>
      <text ${TS} x="262" y="248" font-size="10">w₁</text>
      <text ${TS} x="330" y="248" font-size="10">w₂</text>`,
  },

  {
    id: 'pld-blocchi',
    title: 'Schema a blocchi di un PLD',
    topic: 'tech',
    width: 640,
    height: 280,
    slots: [
      { id: 'in', x: 90, y: 130, label: 'Buffer di ingresso e invertitori' },
      { id: 'andarr', x: 290, y: 80, label: 'Piano AND' },
      { id: 'orarr', x: 290, y: 200, label: 'Piano OR' },
      { id: 'outbuf', x: 500, y: 200, label: 'Buffer di uscita' },
      { id: 'terms', x: 400, y: 130, label: 'Termini prodotto' },
    ],
    distractors: ['Blocco logico riconfigurabile', 'Memoria di controllo', 'Flip-flop', 'Clock'],
    svg: `
      <rect ${B} x="30" y="95" width="130" height="70" rx="6"/>
      <rect ${B} x="230" y="45" width="130" height="70" rx="6"/>
      <rect ${B} x="230" y="165" width="130" height="70" rx="6"/>
      <rect ${B} x="440" y="165" width="130" height="70" rx="6"/>
      <line ${A} x1="160" y1="130" x2="230" y2="90"/>
      <line ${A} x1="290" y1="115" x2="290" y2="165"/>
      <line ${A} x1="360" y1="200" x2="440" y2="200"/>
      <line ${A} x1="570" y1="200" x2="615" y2="200"/>
      <line ${A} x1="15" y1="130" x2="30" y2="130"/>
      <text ${TS} x="14" y="118" font-size="10">x₁ … xₙ</text>
      <text ${TS} x="580" y="188" font-size="10">f₁ … f_m</text>`,
  },

  {
    id: 'fpga',
    title: 'Schema concettuale di una FPGA',
    topic: 'tech',
    width: 520,
    height: 420,
    slots: [
      { id: 'iotop', x: 260, y: 30, label: 'Blocchi di I/O' },
      { id: 'ioleft', x: 45, y: 210, label: 'Blocchi di I/O' },
      { id: 'logic', x: 200, y: 210, label: 'Blocco logico' },
      { id: 'sw', x: 335, y: 275, label: 'Interruttore di interconnessione' },
      { id: 'wires', x: 260, y: 390, label: 'Fili di interconnessione' },
    ],
    distractors: ['Memoria di controllo', 'Piano AND fisso', 'Cache', 'Sommatore'],
    svg: `
      <rect ${B} x="90" y="15" width="340" height="34" rx="4"/>
      <rect ${B} x="90" y="330" width="340" height="34" rx="4"/>
      <rect ${B} x="25" y="70" width="34" height="250" rx="4"/>
      <rect ${B} x="460" y="70" width="34" height="250" rx="4"/>
      <rect ${B} x="150" y="140" width="46" height="46" rx="4"/>
      <rect ${B} x="270" y="140" width="46" height="46" rx="4"/>
      <rect ${B} x="150" y="250" width="46" height="46" rx="4"/>
      <rect ${B} x="270" y="250" width="46" height="46" rx="4"/>
      <rect ${B} x="370" y="140" width="46" height="46" rx="4"/>
      <rect ${B} x="370" y="250" width="46" height="46" rx="4"/>
      <line ${L} x1="120" y1="80" x2="120" y2="320"/>
      <line ${L} x1="235" y1="80" x2="235" y2="320"/>
      <line ${L} x1="345" y1="80" x2="345" y2="320"/>
      <line ${L} x1="440" y1="80" x2="440" y2="320"/>
      <line ${L} x1="70" y1="115" x2="450" y2="115"/>
      <line ${L} x1="70" y1="220" x2="450" y2="220"/>
      <line ${L} x1="70" y1="320" x2="450" y2="320"/>
      <text ${T} x="260" y="410" font-size="11">griglia programmabile</text>`,
  },

  {
    id: 'macchina-stati',
    title: 'Modello formale di una macchina a stati finiti',
    topic: 'ff',
    width: 620,
    height: 320,
    slots: [
      { id: 'comb', x: 310, y: 70, label: 'Logica combinatoria' },
      { id: 'in', x: 60, y: 40, label: 'Ingresso x' },
      { id: 'out', x: 560, y: 40, label: 'Uscita z' },
      { id: 'ff', x: 310, y: 205, label: 'Elementi di ritardo (flip-flop)' },
      { id: 'present', x: 70, y: 150, label: 'Stato presente' },
      { id: 'next', x: 550, y: 150, label: 'Stato futuro' },
    ],
    distractors: ['Decodificatore', 'Bus dati', 'Memoria di controllo', 'Multiplexer'],
    svg: `
      <rect ${G} x="170" y="30" width="280" height="90" rx="8"/>
      <line ${A} x1="90" y1="40" x2="170" y2="40"/>
      <line ${A} x1="450" y1="40" x2="530" y2="40"/>
      <line ${L} x1="170" y1="80" x2="120" y2="80"/>
      <line ${L} x1="120" y1="80" x2="120" y2="185"/>
      <line ${L} x1="450" y1="80" x2="500" y2="80"/>
      <line ${L} x1="500" y1="80" x2="500" y2="185"/>
      <rect ${B} x="250" y="185" width="60" height="40" rx="4"/>
      <rect ${B} x="330" y="185" width="60" height="40" rx="4"/>
      <line ${A} x1="500" y1="205" x2="390" y2="205"/>
      <line ${A} x1="250" y1="205" x2="120" y2="205"/>
      <text ${T} x="310" y="270" font-size="11">un ciclo di clock di ritardo</text>`,
  },
];

export function diagramById(id: string): Diagram | undefined {
  return diagrams.find((diagram) => diagram.id === id);
}
