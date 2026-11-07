/**
 * I 45 schemi del sito originale (disegni originali, ridisegnati da zero:
 * vedi COMPLIANCE del repository legacy). Etichette e scritte in italiano e
 * inglese; le etichette degli slot sono quelle da collocare nell'esercizio
 * «completa lo schema». File generato dalla conversione dei contenuti legacy.
 */
import type { Diagram } from './types';

export const DIAGRAMS: Diagram[] = [
  {
    id: 'unita-funzionali',
    topic: 'processore',
    width: 620,
    height: 330,
    title: {
      it: 'Unità funzionali di un calcolatore',
      en: 'Functional units of a computer',
    },
    slots: [
      {
        id: 'mem',
        x: 310,
        y: 45,
        label: {
          it: 'Memoria',
          en: 'Memory',
        },
      },
      {
        id: 'net',
        x: 310,
        y: 190,
        label: {
          it: 'Rete di interconnessione',
          en: 'Interconnection network',
        },
      },
      {
        id: 'in',
        x: 90,
        y: 130,
        label: {
          it: 'Ingresso',
          en: 'Input',
        },
      },
      {
        id: 'out',
        x: 90,
        y: 235,
        label: {
          it: 'Uscita',
          en: 'Output',
        },
      },
      {
        id: 'alu',
        x: 530,
        y: 130,
        label: {
          it: 'Aritmetica e logica',
          en: 'Arithmetic and logic',
        },
      },
      {
        id: 'ctrl',
        x: 530,
        y: 235,
        label: {
          it: 'Controllo',
          en: 'Control',
        },
      },
    ],
    distractors: [
      {
        it: 'Cache',
      },
      {
        it: 'Registri',
        en: 'Registers',
      },
      {
        it: 'Disco',
        en: 'Disk',
      },
      {
        it: 'Bus dati',
        en: 'Data bus',
      },
      {
        it: 'Interruzioni',
        en: 'Interrupts',
      },
    ],
    svg: {
      it: '<rect class="dg-group" x="20" y="95" width="140" height="180" rx="8"/>\n      <text class="dg-text" x="90" y="292" font-size="12">I/O</text>\n      <rect class="dg-group" x="460" y="95" width="140" height="180" rx="8"/>\n      <text class="dg-text" x="530" y="292" font-size="12">Processore</text>\n      <rect class="dg-box" x="240" y="20" width="140" height="52" rx="6"/>\n      <rect class="dg-box" x="240" y="150" width="140" height="80" rx="6"/>\n      <rect class="dg-box" x="35" y="105" width="110" height="52" rx="6"/>\n      <rect class="dg-box" x="35" y="210" width="110" height="52" rx="6"/>\n      <rect class="dg-box" x="475" y="105" width="110" height="52" rx="6"/>\n      <rect class="dg-box" x="475" y="210" width="110" height="52" rx="6"/>\n      <line class="dg-line" x1="310" y1="72" x2="310" y2="150"/>\n      <line class="dg-line" x1="145" y1="190" x2="240" y2="190"/>\n      <line class="dg-line" x1="380" y1="190" x2="475" y2="190"/>\n      <line class="dg-line" x1="90" y1="157" x2="90" y2="210"/>\n      <line class="dg-line" x1="145" y1="131" x2="180" y2="131"/>\n      <line class="dg-line" x1="180" y1="131" x2="180" y2="236"/>\n      <line class="dg-line" x1="180" y1="236" x2="145" y2="236"/>\n      <line class="dg-line" x1="530" y1="157" x2="530" y2="210"/>',
      en: '<rect class="dg-group" x="20" y="95" width="140" height="180" rx="8"/>\n      <text class="dg-text" x="90" y="292" font-size="12">I/O</text>\n      <rect class="dg-group" x="460" y="95" width="140" height="180" rx="8"/>\n      <text class="dg-text" x="530" y="292" font-size="12">Processor</text>\n      <rect class="dg-box" x="240" y="20" width="140" height="52" rx="6"/>\n      <rect class="dg-box" x="240" y="150" width="140" height="80" rx="6"/>\n      <rect class="dg-box" x="35" y="105" width="110" height="52" rx="6"/>\n      <rect class="dg-box" x="35" y="210" width="110" height="52" rx="6"/>\n      <rect class="dg-box" x="475" y="105" width="110" height="52" rx="6"/>\n      <rect class="dg-box" x="475" y="210" width="110" height="52" rx="6"/>\n      <line class="dg-line" x1="310" y1="72" x2="310" y2="150"/>\n      <line class="dg-line" x1="145" y1="190" x2="240" y2="190"/>\n      <line class="dg-line" x1="380" y1="190" x2="475" y2="190"/>\n      <line class="dg-line" x1="90" y1="157" x2="90" y2="210"/>\n      <line class="dg-line" x1="145" y1="131" x2="180" y2="131"/>\n      <line class="dg-line" x1="180" y1="131" x2="180" y2="236"/>\n      <line class="dg-line" x1="180" y1="236" x2="145" y2="236"/>\n      <line class="dg-line" x1="530" y1="157" x2="530" y2="210"/>',
    },
  },
  {
    id: 'processore-3bus',
    topic: 'processore',
    width: 620,
    height: 400,
    title: {
      it: 'Percorso dati a tre bus',
      en: 'Three-bus datapath',
    },
    slots: [
      {
        id: 'busa',
        x: 60,
        y: 22,
        label: {
          it: 'Bus A',
        },
      },
      {
        id: 'busb',
        x: 150,
        y: 22,
        label: {
          it: 'Bus B',
        },
      },
      {
        id: 'busc',
        x: 240,
        y: 22,
        label: {
          it: 'Bus C',
        },
      },
      {
        id: 'pc',
        x: 420,
        y: 62,
        label: {
          it: 'PC',
        },
      },
      {
        id: 'banco',
        x: 420,
        y: 132,
        label: {
          it: 'Banco registri',
          en: 'Register file',
        },
      },
      {
        id: 'alu',
        x: 420,
        y: 202,
        label: {
          it: 'ALU',
        },
      },
      {
        id: 'temp',
        x: 420,
        y: 262,
        label: {
          it: 'Registri temporanei',
          en: 'Temporary registers',
        },
      },
      {
        id: 'ir',
        x: 420,
        y: 322,
        label: {
          it: 'IR',
        },
      },
      {
        id: 'iface',
        x: 420,
        y: 372,
        label: {
          it: 'Interfaccia processore-memoria',
          en: 'Processor–memory interface',
        },
      },
    ],
    distractors: [
      {
        it: 'Cache',
      },
      {
        it: 'MAR',
      },
      {
        it: 'TLB',
      },
      {
        it: 'Generatore indirizzi',
        en: 'Address generator',
      },
      {
        it: 'Controllo',
        en: 'Control',
      },
    ],
    svg: {
      it: '<line class="dg-line" x1="60" y1="40" x2="60" y2="395"/>\n      <line class="dg-line" x1="150" y1="40" x2="150" y2="395"/>\n      <line class="dg-line" x1="240" y1="40" x2="240" y2="395"/>\n      <rect class="dg-box" x="300" y="42" width="240" height="40" rx="6"/>\n      <rect class="dg-box" x="300" y="112" width="240" height="40" rx="6"/>\n      <path class="dg-box" d="M320 182 h200 l-30 40 h-140 z"/>\n      <rect class="dg-box" x="300" y="242" width="240" height="40" rx="6"/>\n      <rect class="dg-box" x="300" y="302" width="240" height="40" rx="6"/>\n      <rect class="dg-box" x="300" y="352" width="240" height="40" rx="6"/>\n      <line class="dg-line" x1="60" y1="62" x2="300" y2="62"/>\n      <line class="dg-line" x1="150" y1="132" x2="300" y2="132"/>\n      <line class="dg-line" x1="240" y1="132" x2="300" y2="132"/>\n      <line class="dg-line" x1="60" y1="202" x2="320" y2="202"/>\n      <line class="dg-line" x1="150" y1="212" x2="330" y2="212"/>\n      <line class="dg-line" x1="240" y1="262" x2="300" y2="262"/>\n      <line class="dg-line" x1="60" y1="322" x2="300" y2="322"/>\n      <line class="dg-line" x1="150" y1="372" x2="300" y2="372"/>',
      en: '<line class="dg-line" x1="60" y1="40" x2="60" y2="395"/>\n      <line class="dg-line" x1="150" y1="40" x2="150" y2="395"/>\n      <line class="dg-line" x1="240" y1="40" x2="240" y2="395"/>\n      <rect class="dg-box" x="300" y="42" width="240" height="40" rx="6"/>\n      <rect class="dg-box" x="300" y="112" width="240" height="40" rx="6"/>\n      <path class="dg-box" d="M320 182 h200 l-30 40 h-140 z"/>\n      <rect class="dg-box" x="300" y="242" width="240" height="40" rx="6"/>\n      <rect class="dg-box" x="300" y="302" width="240" height="40" rx="6"/>\n      <rect class="dg-box" x="300" y="352" width="240" height="40" rx="6"/>\n      <line class="dg-line" x1="60" y1="62" x2="300" y2="62"/>\n      <line class="dg-line" x1="150" y1="132" x2="300" y2="132"/>\n      <line class="dg-line" x1="240" y1="132" x2="300" y2="132"/>\n      <line class="dg-line" x1="60" y1="202" x2="320" y2="202"/>\n      <line class="dg-line" x1="150" y1="212" x2="330" y2="212"/>\n      <line class="dg-line" x1="240" y1="262" x2="300" y2="262"/>\n      <line class="dg-line" x1="60" y1="322" x2="300" y2="322"/>\n      <line class="dg-line" x1="150" y1="372" x2="300" y2="372"/>',
    },
  },
  {
    id: 'cache-set-associativa',
    topic: 'gerarchia-di-memoria',
    width: 640,
    height: 420,
    title: {
      it: 'Cache a corrispondenza associativa a gruppi',
      en: 'Set-associative cache',
    },
    slots: [
      {
        id: 'cache',
        x: 120,
        y: 22,
        label: {
          it: 'Cache',
        },
      },
      {
        id: 'centrale',
        x: 500,
        y: 22,
        label: {
          it: 'Memoria centrale',
          en: 'Main memory',
        },
      },
      {
        id: 'gruppo',
        x: 40,
        y: 90,
        label: {
          it: 'Gruppo',
          en: 'Set',
        },
      },
      {
        id: 'blocco',
        x: 120,
        y: 90,
        label: {
          it: 'Blocco',
          en: 'Block',
        },
      },
      {
        id: 'etichetta',
        x: 120,
        y: 332,
        label: {
          it: 'Etichetta',
          en: 'Tag',
        },
      },
      {
        id: 'posizione',
        x: 240,
        y: 332,
        label: {
          it: 'Posizione',
          en: 'Position',
        },
      },
      {
        id: 'spiazzamento',
        x: 350,
        y: 332,
        label: {
          it: 'Spiazzamento',
          en: 'Displacement',
        },
      },
      {
        id: 'indirizzo',
        x: 235,
        y: 390,
        label: {
          it: 'Indirizzo di memoria centrale',
          en: 'Main memory address',
        },
      },
    ],
    distractors: [
      {
        it: 'Tag',
      },
      {
        it: 'Frame',
      },
      {
        it: 'Pagina',
        en: 'Page',
      },
      {
        it: 'Offset di pagina',
        en: 'Page offset',
      },
      {
        it: 'Dato',
        en: 'Data',
      },
    ],
    svg: {
      it: '<rect class="dg-group" x="20" y="105" width="200" height="200" rx="8"/>\n      <rect class="dg-group" x="400" y="40" width="200" height="265" rx="8"/>\n      <rect class="dg-box" x="70" y="115" width="140" height="30" rx="4"/>\n      <rect class="dg-box" x="70" y="150" width="140" height="30" rx="4"/>\n      <rect class="dg-box" x="70" y="200" width="140" height="30" rx="4"/>\n      <rect class="dg-box" x="70" y="235" width="140" height="30" rx="4"/>\n      <text class="dg-text" x="140" y="192" font-size="11">⋮</text>\n      <text class="dg-text" x="40" y="136" font-size="11">0</text>\n      <text class="dg-text" x="40" y="256" font-size="11">k</text>\n      <rect class="dg-box" x="415" y="55" width="170" height="26" rx="4"/>\n      <rect class="dg-box" x="415" y="86" width="170" height="26" rx="4"/>\n      <rect class="dg-box" x="415" y="150" width="170" height="26" rx="4"/>\n      <rect class="dg-box" x="415" y="240" width="170" height="26" rx="4"/>\n      <rect class="dg-box" x="415" y="271" width="170" height="26" rx="4"/>\n      <text class="dg-text" x="500" y="132" font-size="11">⋮</text>\n      <text class="dg-text" x="500" y="222" font-size="11">⋮</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="400" y1="163" x2="225" y2="163"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="400" y1="255" x2="225" y2="222"/>\n      <rect class="dg-box" x="60" y="318" width="120" height="28" rx="4"/>\n      <rect class="dg-box" x="185" y="318" width="110" height="28" rx="4"/>\n      <rect class="dg-box" x="300" y="318" width="100" height="28" rx="4"/>\n      <line class="dg-line" x1="60" y1="358" x2="400" y2="358"/>',
      en: '<rect class="dg-group" x="20" y="105" width="200" height="200" rx="8"/>\n      <rect class="dg-group" x="400" y="40" width="200" height="265" rx="8"/>\n      <rect class="dg-box" x="70" y="115" width="140" height="30" rx="4"/>\n      <rect class="dg-box" x="70" y="150" width="140" height="30" rx="4"/>\n      <rect class="dg-box" x="70" y="200" width="140" height="30" rx="4"/>\n      <rect class="dg-box" x="70" y="235" width="140" height="30" rx="4"/>\n      <text class="dg-text" x="140" y="192" font-size="11">⋮</text>\n      <text class="dg-text" x="40" y="136" font-size="11">0</text>\n      <text class="dg-text" x="40" y="256" font-size="11">k</text>\n      <rect class="dg-box" x="415" y="55" width="170" height="26" rx="4"/>\n      <rect class="dg-box" x="415" y="86" width="170" height="26" rx="4"/>\n      <rect class="dg-box" x="415" y="150" width="170" height="26" rx="4"/>\n      <rect class="dg-box" x="415" y="240" width="170" height="26" rx="4"/>\n      <rect class="dg-box" x="415" y="271" width="170" height="26" rx="4"/>\n      <text class="dg-text" x="500" y="132" font-size="11">⋮</text>\n      <text class="dg-text" x="500" y="222" font-size="11">⋮</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="400" y1="163" x2="225" y2="163"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="400" y1="255" x2="225" y2="222"/>\n      <rect class="dg-box" x="60" y="318" width="120" height="28" rx="4"/>\n      <rect class="dg-box" x="185" y="318" width="110" height="28" rx="4"/>\n      <rect class="dg-box" x="300" y="318" width="100" height="28" rx="4"/>\n      <line class="dg-line" x1="60" y1="358" x2="400" y2="358"/>',
    },
  },
  {
    id: 'gerarchia-memoria',
    topic: 'gerarchia-di-memoria',
    width: 560,
    height: 350,
    title: {
      it: 'Gerarchia di memoria',
      en: 'Memory hierarchy',
    },
    slots: [
      {
        id: 'reg',
        x: 280,
        y: 40,
        label: {
          it: 'Registri',
          en: 'Registers',
        },
      },
      {
        id: 'l1',
        x: 280,
        y: 100,
        label: {
          it: 'Cache primaria (L1)',
          en: 'Primary cache (L1)',
        },
      },
      {
        id: 'l2',
        x: 280,
        y: 160,
        label: {
          it: 'Cache secondaria (L2)',
          en: 'Secondary cache (L2)',
        },
      },
      {
        id: 'main',
        x: 280,
        y: 220,
        label: {
          it: 'Memoria principale',
          en: 'Main memory',
        },
      },
      {
        id: 'sec',
        x: 280,
        y: 285,
        label: {
          it: 'Memoria secondaria',
          en: 'Secondary memory',
        },
      },
    ],
    distractors: [
      {
        it: 'TLB',
      },
      {
        it: 'Tabella delle pagine',
        en: 'Page table',
      },
      {
        it: 'Buffer di scrittura',
        en: 'Write buffer',
      },
      {
        it: 'ROM',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="200" y="22" width="160" height="36" rx="6"/>\n      <rect class="dg-box" x="180" y="82" width="200" height="36" rx="6"/>\n      <rect class="dg-box" x="160" y="142" width="240" height="36" rx="6"/>\n      <rect class="dg-box" x="140" y="202" width="280" height="36" rx="6"/>\n      <rect class="dg-box" x="120" y="262" width="320" height="46" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="70" y1="300" x2="70" y2="30"/>\n      <text class="dg-text" x="70" y="322" font-size="11">più veloce</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="500" y1="30" x2="500" y2="300"/>\n      <text class="dg-text" x="500" y="322" font-size="11">più capiente</text>',
      en: '<rect class="dg-box" x="200" y="22" width="160" height="36" rx="6"/>\n      <rect class="dg-box" x="180" y="82" width="200" height="36" rx="6"/>\n      <rect class="dg-box" x="160" y="142" width="240" height="36" rx="6"/>\n      <rect class="dg-box" x="140" y="202" width="280" height="36" rx="6"/>\n      <rect class="dg-box" x="120" y="262" width="320" height="46" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="70" y1="300" x2="70" y2="30"/>\n      <text class="dg-text" x="70" y="322" font-size="11">faster</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="500" y1="30" x2="500" y2="300"/>\n      <text class="dg-text" x="500" y="322" font-size="11">larger</text>',
    },
  },
  {
    id: 'memoria-virtuale-tlb',
    topic: 'memoria-virtuale',
    width: 620,
    height: 320,
    title: {
      it: 'Traduzione dell’indirizzo virtuale',
      en: 'Virtual address translation',
    },
    slots: [
      {
        id: 'vpage',
        x: 110,
        y: 52,
        label: {
          it: 'Numero di pagina',
          en: 'Page number',
        },
      },
      {
        id: 'voff',
        x: 265,
        y: 52,
        label: {
          it: 'Offset',
        },
      },
      {
        id: 'tlb',
        x: 150,
        y: 160,
        label: {
          it: 'TLB',
        },
      },
      {
        id: 'pt',
        x: 400,
        y: 160,
        label: {
          it: 'Tabella delle pagine',
          en: 'Page table',
        },
      },
      {
        id: 'frame',
        x: 110,
        y: 268,
        label: {
          it: 'Numero di frame',
          en: 'Frame number',
        },
      },
      {
        id: 'poff',
        x: 265,
        y: 268,
        label: {
          it: 'Offset',
        },
      },
    ],
    distractors: [
      {
        it: 'Etichetta',
        en: 'Tag',
      },
      {
        it: 'Indice di cache',
        en: 'Cache index',
      },
      {
        it: 'Blocco',
        en: 'Block',
      },
      {
        it: 'Registro di stato',
        en: 'Status register',
      },
    ],
    svg: {
      it: '<text class="dg-text dg-start" x="24" y="20" font-size="12">Indirizzo virtuale</text>\n      <rect class="dg-box" x="40" y="34" width="140" height="36" rx="4"/>\n      <rect class="dg-box" x="190" y="34" width="150" height="36" rx="4"/>\n      <rect class="dg-box" x="70" y="128" width="160" height="60" rx="6"/>\n      <rect class="dg-box" x="320" y="128" width="160" height="60" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="110" y1="70" x2="110" y2="128"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="230" y1="158" x2="320" y2="158"/>\n      <text class="dg-text" x="275" y="150" font-size="10">miss</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="110" y1="188" x2="110" y2="250"/>\n      <line class="dg-line" x1="400" y1="188" x2="400" y2="215"/>\n      <line class="dg-line" x1="400" y1="215" x2="150" y2="215"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="150" y1="215" x2="150" y2="250"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="265" y1="70" x2="265" y2="250"/>\n      <text class="dg-text dg-start" x="24" y="304" font-size="12">Indirizzo fisico</text>\n      <rect class="dg-box" x="40" y="250" width="140" height="36" rx="4"/>\n      <rect class="dg-box" x="190" y="250" width="150" height="36" rx="4"/>',
      en: '<text class="dg-text dg-start" x="24" y="20" font-size="12">Virtual address</text>\n      <rect class="dg-box" x="40" y="34" width="140" height="36" rx="4"/>\n      <rect class="dg-box" x="190" y="34" width="150" height="36" rx="4"/>\n      <rect class="dg-box" x="70" y="128" width="160" height="60" rx="6"/>\n      <rect class="dg-box" x="320" y="128" width="160" height="60" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="110" y1="70" x2="110" y2="128"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="230" y1="158" x2="320" y2="158"/>\n      <text class="dg-text" x="275" y="150" font-size="10">miss</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="110" y1="188" x2="110" y2="250"/>\n      <line class="dg-line" x1="400" y1="188" x2="400" y2="215"/>\n      <line class="dg-line" x1="400" y1="215" x2="150" y2="215"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="150" y1="215" x2="150" y2="250"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="265" y1="70" x2="265" y2="250"/>\n      <text class="dg-text dg-start" x="24" y="304" font-size="12">Physical address</text>\n      <rect class="dg-box" x="40" y="250" width="140" height="36" rx="4"/>\n      <rect class="dg-box" x="190" y="250" width="150" height="36" rx="4"/>',
    },
  },
  {
    id: 'pipeline-5-stadi',
    topic: 'pipeline',
    width: 660,
    height: 220,
    title: {
      it: 'Percorso dati a pipeline di cinque stadi',
      en: 'Five-stage pipelined datapath',
    },
    slots: [
      {
        id: 'f',
        x: 75,
        y: 95,
        label: {
          it: 'Prelievo (F)',
          en: 'Fetch (F)',
        },
      },
      {
        id: 'd',
        x: 195,
        y: 95,
        label: {
          it: 'Decodifica (D)',
          en: 'Decode (D)',
        },
      },
      {
        id: 'e',
        x: 315,
        y: 95,
        label: {
          it: 'Esecuzione (E)',
          en: 'Execute (E)',
        },
      },
      {
        id: 'm',
        x: 435,
        y: 95,
        label: {
          it: 'Memoria (M)',
          en: 'Memory (M)',
        },
      },
      {
        id: 'w',
        x: 555,
        y: 95,
        label: {
          it: 'Scrittura (W)',
          en: 'Write-back (W)',
        },
      },
    ],
    distractors: [
      {
        it: 'Interruzione',
        en: 'Interrupt',
      },
      {
        it: 'Arbitraggio',
        en: 'Arbitration',
      },
      {
        it: 'Rinvio',
        en: 'Forwarding',
      },
      {
        it: 'Predizione',
        en: 'Prediction',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="25" y="60" width="100" height="70" rx="6"/>\n      <rect class="dg-box" x="145" y="60" width="100" height="70" rx="6"/>\n      <rect class="dg-box" x="265" y="60" width="100" height="70" rx="6"/>\n      <rect class="dg-box" x="385" y="60" width="100" height="70" rx="6"/>\n      <rect class="dg-box" x="505" y="60" width="100" height="70" rx="6"/>\n      <rect class="dg-box" x="128" y="50" width="14" height="90" rx="2"/>\n      <rect class="dg-box" x="248" y="50" width="14" height="90" rx="2"/>\n      <rect class="dg-box" x="368" y="50" width="14" height="90" rx="2"/>\n      <rect class="dg-box" x="488" y="50" width="14" height="90" rx="2"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="0" y1="95" x2="25" y2="95"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="605" y1="95" x2="640" y2="95"/>\n      <line class="dg-line" x1="25" y1="170" x2="605" y2="170"/>\n      <text class="dg-text" x="315" y="190" font-size="11">registri di stadio · un colpo di clock per stadio</text>',
      en: '<rect class="dg-box" x="25" y="60" width="100" height="70" rx="6"/>\n      <rect class="dg-box" x="145" y="60" width="100" height="70" rx="6"/>\n      <rect class="dg-box" x="265" y="60" width="100" height="70" rx="6"/>\n      <rect class="dg-box" x="385" y="60" width="100" height="70" rx="6"/>\n      <rect class="dg-box" x="505" y="60" width="100" height="70" rx="6"/>\n      <rect class="dg-box" x="128" y="50" width="14" height="90" rx="2"/>\n      <rect class="dg-box" x="248" y="50" width="14" height="90" rx="2"/>\n      <rect class="dg-box" x="368" y="50" width="14" height="90" rx="2"/>\n      <rect class="dg-box" x="488" y="50" width="14" height="90" rx="2"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="0" y1="95" x2="25" y2="95"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="605" y1="95" x2="640" y2="95"/>\n      <line class="dg-line" x1="25" y1="170" x2="605" y2="170"/>\n      <text class="dg-text" x="315" y="190" font-size="11">stage registers · one clock cycle per stage</text>',
    },
  },
  {
    id: 'interfaccia-io',
    topic: 'input-output',
    width: 620,
    height: 300,
    title: {
      it: 'Interfaccia di un dispositivo di I/O',
      en: 'Interface of an I/O device',
    },
    slots: [
      {
        id: 'proc',
        x: 80,
        y: 60,
        label: {
          it: 'Processore',
          en: 'Processor',
        },
      },
      {
        id: 'bus',
        x: 310,
        y: 128,
        label: {
          it: 'Bus',
        },
      },
      {
        id: 'data',
        x: 420,
        y: 60,
        label: {
          it: 'DATA',
        },
      },
      {
        id: 'status',
        x: 420,
        y: 118,
        label: {
          it: 'STATUS',
        },
      },
      {
        id: 'control',
        x: 420,
        y: 176,
        label: {
          it: 'CONTROL',
        },
      },
      {
        id: 'dev',
        x: 420,
        y: 258,
        label: {
          it: 'Dispositivo',
          en: 'Device',
        },
      },
    ],
    distractors: [
      {
        it: 'ALU',
      },
      {
        it: 'Cache',
      },
      {
        it: 'DMA',
      },
      {
        it: 'Registro indice',
        en: 'Index register',
      },
      {
        it: 'PC',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="20" y="40" width="120" height="44" rx="6"/>\n      <rect class="dg-box" x="20" y="120" width="120" height="44" rx="6"/>\n      <text class="dg-text" x="80" y="147" font-size="12">Memoria</text>\n      <line class="dg-line" x1="140" y1="62" x2="230" y2="62"/>\n      <line class="dg-line" x1="140" y1="142" x2="230" y2="142"/>\n      <line class="dg-line" x1="230" y1="40" x2="230" y2="220"/>\n      <line class="dg-line" x1="240" y1="40" x2="240" y2="220"/>\n      <line class="dg-line" x1="250" y1="40" x2="250" y2="220"/>\n      <rect class="dg-group" x="330" y="30" width="180" height="170" rx="8"/>\n      <rect class="dg-box" x="350" y="42" width="140" height="34" rx="4"/>\n      <rect class="dg-box" x="350" y="100" width="140" height="34" rx="4"/>\n      <rect class="dg-box" x="350" y="158" width="140" height="34" rx="4"/>\n      <text class="dg-text" x="420" y="216" font-size="11">interfaccia</text>\n      <line class="dg-line" x1="250" y1="62" x2="350" y2="62"/>\n      <line class="dg-line" x1="250" y1="118" x2="350" y2="118"/>\n      <line class="dg-line" x1="250" y1="176" x2="350" y2="176"/>\n      <rect class="dg-box" x="350" y="240" width="140" height="40" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="420" y1="200" x2="420" y2="240"/>',
      en: '<rect class="dg-box" x="20" y="40" width="120" height="44" rx="6"/>\n      <rect class="dg-box" x="20" y="120" width="120" height="44" rx="6"/>\n      <text class="dg-text" x="80" y="147" font-size="12">Memory</text>\n      <line class="dg-line" x1="140" y1="62" x2="230" y2="62"/>\n      <line class="dg-line" x1="140" y1="142" x2="230" y2="142"/>\n      <line class="dg-line" x1="230" y1="40" x2="230" y2="220"/>\n      <line class="dg-line" x1="240" y1="40" x2="240" y2="220"/>\n      <line class="dg-line" x1="250" y1="40" x2="250" y2="220"/>\n      <rect class="dg-group" x="330" y="30" width="180" height="170" rx="8"/>\n      <rect class="dg-box" x="350" y="42" width="140" height="34" rx="4"/>\n      <rect class="dg-box" x="350" y="100" width="140" height="34" rx="4"/>\n      <rect class="dg-box" x="350" y="158" width="140" height="34" rx="4"/>\n      <text class="dg-text" x="420" y="216" font-size="11">interface</text>\n      <line class="dg-line" x1="250" y1="62" x2="350" y2="62"/>\n      <line class="dg-line" x1="250" y1="118" x2="350" y2="118"/>\n      <line class="dg-line" x1="250" y1="176" x2="350" y2="176"/>\n      <rect class="dg-box" x="350" y="240" width="140" height="40" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="420" y1="200" x2="420" y2="240"/>',
    },
  },
  {
    id: 'sommatore-ripple',
    topic: 'aritmetica-hardware',
    width: 740,
    height: 240,
    title: {
      it: 'Sommatore a propagazione di riporto',
      en: 'Ripple-carry adder',
    },
    slots: [
      {
        id: 'fa',
        x: 545,
        y: 118,
        label: {
          it: 'Sommatore completo',
          en: 'Full adder',
        },
      },
      {
        id: 'cin',
        x: 690,
        y: 78,
        label: {
          it: 'Riporto entrante',
          en: 'Carry in',
        },
      },
      {
        id: 'cout',
        x: 55,
        y: 118,
        label: {
          it: 'Riporto uscente',
          en: 'Carry out',
        },
      },
      {
        id: 'sum',
        x: 545,
        y: 205,
        label: {
          it: 'Bit di somma',
          en: 'Sum bits',
        },
      },
      {
        id: 'ops',
        x: 545,
        y: 30,
        label: {
          it: 'Bit degli addendi',
          en: 'Operand bits',
        },
      },
    ],
    distractors: [
      {
        it: 'Overflow',
      },
      {
        it: 'Bit di segno',
        en: 'Sign bit',
      },
      {
        it: 'Semisommatore',
        en: 'Half adder',
      },
      {
        it: 'Registro',
        en: 'Register',
      },
    ],
    svg: {
      it: '<g transform="translate(60,0)">\n      <rect class="dg-box" x="80" y="90" width="90" height="60" rx="6"/>\n      <rect class="dg-box" x="200" y="90" width="90" height="60" rx="6"/>\n      <rect class="dg-box" x="320" y="90" width="90" height="60" rx="6"/>\n      <rect class="dg-box" x="440" y="90" width="90" height="60" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="530" y1="120" x2="575" y2="120" transform="rotate(180 552 120)"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="440" y1="120" x2="410" y2="120"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="320" y1="120" x2="290" y2="120"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="200" y1="120" x2="170" y2="120"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="80" y1="120" x2="55" y2="120"/>\n      <line class="dg-line" x1="105" y1="60" x2="105" y2="90"/>\n      <line class="dg-line" x1="145" y1="60" x2="145" y2="90"/>\n      <line class="dg-line" x1="225" y1="60" x2="225" y2="90"/>\n      <line class="dg-line" x1="265" y1="60" x2="265" y2="90"/>\n      <line class="dg-line" x1="345" y1="60" x2="345" y2="90"/>\n      <line class="dg-line" x1="385" y1="60" x2="385" y2="90"/>\n      <line class="dg-line" x1="465" y1="60" x2="465" y2="90"/>\n      <line class="dg-line" x1="505" y1="60" x2="505" y2="90"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="125" y1="150" x2="125" y2="185"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="245" y1="150" x2="245" y2="185"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="365" y1="150" x2="365" y2="185"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="485" y1="150" x2="485" y2="185"/>\n      </g>',
      en: '<g transform="translate(60,0)">\n      <rect class="dg-box" x="80" y="90" width="90" height="60" rx="6"/>\n      <rect class="dg-box" x="200" y="90" width="90" height="60" rx="6"/>\n      <rect class="dg-box" x="320" y="90" width="90" height="60" rx="6"/>\n      <rect class="dg-box" x="440" y="90" width="90" height="60" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="530" y1="120" x2="575" y2="120" transform="rotate(180 552 120)"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="440" y1="120" x2="410" y2="120"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="320" y1="120" x2="290" y2="120"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="200" y1="120" x2="170" y2="120"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="80" y1="120" x2="55" y2="120"/>\n      <line class="dg-line" x1="105" y1="60" x2="105" y2="90"/>\n      <line class="dg-line" x1="145" y1="60" x2="145" y2="90"/>\n      <line class="dg-line" x1="225" y1="60" x2="225" y2="90"/>\n      <line class="dg-line" x1="265" y1="60" x2="265" y2="90"/>\n      <line class="dg-line" x1="345" y1="60" x2="345" y2="90"/>\n      <line class="dg-line" x1="385" y1="60" x2="385" y2="90"/>\n      <line class="dg-line" x1="465" y1="60" x2="465" y2="90"/>\n      <line class="dg-line" x1="505" y1="60" x2="505" y2="90"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="125" y1="150" x2="125" y2="185"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="245" y1="150" x2="245" y2="185"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="365" y1="150" x2="365" y2="185"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="485" y1="150" x2="485" y2="185"/>\n      </g>',
    },
  },
  {
    id: 'processore-memoria',
    topic: 'processore',
    width: 620,
    height: 360,
    title: {
      it: 'Processore e memoria principale',
      en: 'Processor and main memory',
    },
    slots: [
      {
        id: 'mem',
        x: 310,
        y: 42,
        label: {
          it: 'Memoria principale',
          en: 'Main memory',
        },
      },
      {
        id: 'iface',
        x: 310,
        y: 140,
        label: {
          it: 'Interfaccia processore-memoria',
          en: 'Processor–memory interface',
        },
      },
      {
        id: 'pc',
        x: 135,
        y: 202,
        label: {
          it: 'PC',
        },
      },
      {
        id: 'ir',
        x: 135,
        y: 252,
        label: {
          it: 'IR',
        },
      },
      {
        id: 'regs',
        x: 310,
        y: 240,
        label: {
          it: 'Registri generali',
          en: 'General-purpose registers',
        },
      },
      {
        id: 'ctrl',
        x: 485,
        y: 202,
        label: {
          it: 'Controllo',
          en: 'Control',
        },
      },
      {
        id: 'alu',
        x: 485,
        y: 270,
        label: {
          it: 'ALU',
        },
      },
    ],
    distractors: [
      {
        it: 'Cache',
      },
      {
        it: 'TLB',
      },
      {
        it: 'Disco',
        en: 'Disk',
      },
      {
        it: 'Bus di sistema',
        en: 'System bus',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="230" y="20" width="160" height="44" rx="6"/>\n      <line class="dg-line" x1="310" y1="64" x2="310" y2="120"/>\n      <rect class="dg-group" x="60" y="110" width="500" height="230" rx="10"/>\n      <rect class="dg-box" x="230" y="120" width="160" height="40" rx="6"/>\n      <rect class="dg-box" x="90" y="185" width="90" height="34" rx="4"/>\n      <rect class="dg-box" x="90" y="235" width="90" height="34" rx="4"/>\n      <rect class="dg-box" x="250" y="185" width="120" height="110" rx="4"/>\n      <rect class="dg-box" x="430" y="185" width="110" height="34" rx="4"/>\n      <rect class="dg-box" x="430" y="250" width="110" height="40" rx="4"/>\n      <text class="dg-text" x="310" y="330" font-size="12">Processore</text>',
      en: '<rect class="dg-box" x="230" y="20" width="160" height="44" rx="6"/>\n      <line class="dg-line" x1="310" y1="64" x2="310" y2="120"/>\n      <rect class="dg-group" x="60" y="110" width="500" height="230" rx="10"/>\n      <rect class="dg-box" x="230" y="120" width="160" height="40" rx="6"/>\n      <rect class="dg-box" x="90" y="185" width="90" height="34" rx="4"/>\n      <rect class="dg-box" x="90" y="235" width="90" height="34" rx="4"/>\n      <rect class="dg-box" x="250" y="185" width="120" height="110" rx="4"/>\n      <rect class="dg-box" x="430" y="185" width="110" height="34" rx="4"/>\n      <rect class="dg-box" x="430" y="250" width="110" height="40" rx="4"/>\n      <text class="dg-text" x="310" y="330" font-size="12">Processor</text>',
    },
  },
  {
    id: 'sistema-calcolo',
    topic: 'input-output',
    width: 620,
    height: 300,
    title: {
      it: 'Un sistema di calcolo',
      en: 'A computer system',
    },
    slots: [
      {
        id: 'proc',
        x: 180,
        y: 47,
        label: {
          it: 'Processore',
          en: 'Processor',
        },
      },
      {
        id: 'mem',
        x: 440,
        y: 47,
        label: {
          it: 'Memoria',
          en: 'Memory',
        },
      },
      {
        id: 'net',
        x: 310,
        y: 147,
        label: {
          it: 'Rete di interconnessione',
          en: 'Interconnection network',
        },
      },
      {
        id: 'io1',
        x: 180,
        y: 247,
        label: {
          it: 'Dispositivo di I/O 1',
          en: 'I/O device 1',
        },
      },
      {
        id: 'ion',
        x: 440,
        y: 247,
        label: {
          it: 'Dispositivo di I/O n',
          en: 'I/O device n',
        },
      },
    ],
    distractors: [
      {
        it: 'Cache',
      },
      {
        it: 'Controllore DMA',
        en: 'DMA controller',
      },
      {
        it: 'Registro di stato',
        en: 'Status register',
      },
      {
        it: 'ALU',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="110" y="25" width="140" height="44" rx="6"/>\n      <rect class="dg-box" x="370" y="25" width="140" height="44" rx="6"/>\n      <rect class="dg-box" x="60" y="125" width="500" height="44" rx="6"/>\n      <rect class="dg-box" x="110" y="225" width="140" height="44" rx="6"/>\n      <rect class="dg-box" x="370" y="225" width="140" height="44" rx="6"/>\n      <line class="dg-line" x1="180" y1="69" x2="180" y2="125"/>\n      <line class="dg-line" x1="440" y1="69" x2="440" y2="125"/>\n      <line class="dg-line" x1="180" y1="169" x2="180" y2="225"/>\n      <line class="dg-line" x1="440" y1="169" x2="440" y2="225"/>\n      <text class="dg-text" x="310" y="252" font-size="14">· · ·</text>',
      en: '<rect class="dg-box" x="110" y="25" width="140" height="44" rx="6"/>\n      <rect class="dg-box" x="370" y="25" width="140" height="44" rx="6"/>\n      <rect class="dg-box" x="60" y="125" width="500" height="44" rx="6"/>\n      <rect class="dg-box" x="110" y="225" width="140" height="44" rx="6"/>\n      <rect class="dg-box" x="370" y="225" width="140" height="44" rx="6"/>\n      <line class="dg-line" x1="180" y1="69" x2="180" y2="125"/>\n      <line class="dg-line" x1="440" y1="69" x2="440" y2="125"/>\n      <line class="dg-line" x1="180" y1="169" x2="180" y2="225"/>\n      <line class="dg-line" x1="440" y1="169" x2="440" y2="225"/>\n      <text class="dg-text" x="310" y="252" font-size="14">· · ·</text>',
    },
  },
  {
    id: 'registri-controllo',
    topic: 'interruzioni-ed-eccezioni',
    width: 640,
    height: 290,
    title: {
      it: 'Registri di controllo del processore',
      en: 'Processor control registers',
    },
    slots: [
      {
        id: 'ps',
        x: 555,
        y: 56,
        label: {
          it: 'PS',
        },
      },
      {
        id: 'ips',
        x: 555,
        y: 116,
        label: {
          it: 'IPS',
        },
      },
      {
        id: 'ien',
        x: 555,
        y: 176,
        label: {
          it: 'IENABLE',
        },
      },
      {
        id: 'ipend',
        x: 555,
        y: 236,
        label: {
          it: 'IPENDING',
        },
      },
    ],
    distractors: [
      {
        it: 'MAR',
      },
      {
        it: 'MDR',
      },
      {
        it: 'IR',
      },
      {
        it: 'TLB',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="40" y="40" width="420" height="32" rx="4"/>\n      <rect class="dg-box" x="400" y="40" width="60" height="32" rx="4"/>\n      <text class="dg-text" x="430" y="61" font-size="11">IE</text>\n      <rect class="dg-box" x="40" y="100" width="420" height="32" rx="4"/>\n      <rect class="dg-box" x="400" y="100" width="60" height="32" rx="4"/>\n      <text class="dg-text" x="430" y="121" font-size="11">IE</text>\n      <rect class="dg-box" x="40" y="160" width="420" height="32" rx="4"/>\n      <text class="dg-text" x="300" y="181" font-size="11">TIM · DISP · KBD</text>\n      <rect class="dg-box" x="40" y="220" width="420" height="32" rx="4"/>\n      <text class="dg-text" x="300" y="241" font-size="11">TIM · DISP · KBD</text>\n      <text class="dg-text dg-start" x="24" y="24" font-size="11">bit 31 … 0</text>',
      en: '<rect class="dg-box" x="40" y="40" width="420" height="32" rx="4"/>\n      <rect class="dg-box" x="400" y="40" width="60" height="32" rx="4"/>\n      <text class="dg-text" x="430" y="61" font-size="11">IE</text>\n      <rect class="dg-box" x="40" y="100" width="420" height="32" rx="4"/>\n      <rect class="dg-box" x="400" y="100" width="60" height="32" rx="4"/>\n      <text class="dg-text" x="430" y="121" font-size="11">IE</text>\n      <rect class="dg-box" x="40" y="160" width="420" height="32" rx="4"/>\n      <text class="dg-text" x="300" y="181" font-size="11">TIM · DISP · KBD</text>\n      <rect class="dg-box" x="40" y="220" width="420" height="32" rx="4"/>\n      <text class="dg-text" x="300" y="241" font-size="11">TIM · DISP · KBD</text>\n      <text class="dg-text dg-start" x="24" y="24" font-size="11">bit 31 … 0</text>',
    },
  },
  {
    id: 'catena-software',
    topic: 'dal-sorgente-all-esecuzione',
    width: 620,
    height: 470,
    title: {
      it: 'Dal sorgente al programma oggetto',
      en: 'From source to object program',
    },
    slots: [
      {
        id: 'src',
        x: 280,
        y: 37,
        label: {
          it: 'File sorgente',
          en: 'Source file',
        },
      },
      {
        id: 'comp',
        x: 280,
        y: 110,
        label: {
          it: 'Compilatore',
          en: 'Compiler',
        },
      },
      {
        id: 'asm',
        x: 280,
        y: 182,
        label: {
          it: 'Sorgente assembly',
          en: 'Assembly source',
        },
      },
      {
        id: 'assr',
        x: 280,
        y: 250,
        label: {
          it: 'Assemblatore',
          en: 'Assembler',
        },
      },
      {
        id: 'obj',
        x: 280,
        y: 317,
        label: {
          it: 'File oggetto',
          en: 'Object file',
        },
      },
      {
        id: 'lib',
        x: 90,
        y: 317,
        label: {
          it: 'Libreria',
          en: 'Library',
        },
      },
      {
        id: 'link',
        x: 280,
        y: 380,
        label: {
          it: 'Collegatore',
          en: 'Linker',
        },
      },
      {
        id: 'prog',
        x: 280,
        y: 443,
        label: {
          it: 'Programma oggetto',
          en: 'Object program',
        },
      },
    ],
    distractors: [
      {
        it: 'Caricatore',
        en: 'Loader',
      },
      {
        it: 'Sistema operativo',
        en: 'Operating system',
      },
      {
        it: 'Tabella dei simboli',
        en: 'Symbol table',
      },
      {
        it: 'Interprete',
        en: 'Interpreter',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="200" y="20" width="160" height="34" rx="16"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="54" x2="280" y2="90"/>\n      <rect class="dg-box" x="210" y="90" width="140" height="40" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="130" x2="280" y2="165"/>\n      <rect class="dg-box" x="200" y="165" width="160" height="34" rx="16"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="199" x2="280" y2="230"/>\n      <rect class="dg-box" x="210" y="230" width="140" height="40" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="270" x2="280" y2="300"/>\n      <rect class="dg-box" x="200" y="300" width="160" height="34" rx="16"/>\n      <rect class="dg-box" x="20" y="300" width="140" height="34" rx="16"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="160" y1="317" x2="205" y2="360"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="334" x2="280" y2="360"/>\n      <rect class="dg-box" x="210" y="360" width="140" height="40" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="400" x2="280" y2="426"/>\n      <rect class="dg-box" x="200" y="426" width="160" height="34" rx="16"/>',
      en: '<rect class="dg-box" x="200" y="20" width="160" height="34" rx="16"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="54" x2="280" y2="90"/>\n      <rect class="dg-box" x="210" y="90" width="140" height="40" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="130" x2="280" y2="165"/>\n      <rect class="dg-box" x="200" y="165" width="160" height="34" rx="16"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="199" x2="280" y2="230"/>\n      <rect class="dg-box" x="210" y="230" width="140" height="40" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="270" x2="280" y2="300"/>\n      <rect class="dg-box" x="200" y="300" width="160" height="34" rx="16"/>\n      <rect class="dg-box" x="20" y="300" width="140" height="34" rx="16"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="160" y1="317" x2="205" y2="360"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="334" x2="280" y2="360"/>\n      <rect class="dg-box" x="210" y="360" width="140" height="40" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="400" x2="280" y2="426"/>\n      <rect class="dg-box" x="200" y="426" width="160" height="34" rx="16"/>',
    },
  },
  {
    id: 'componenti-processore',
    topic: 'processore',
    width: 620,
    height: 360,
    title: {
      it: 'Componenti principali di un processore',
      en: 'Main components of a processor',
    },
    slots: [
      {
        id: 'rf',
        x: 145,
        y: 75,
        label: {
          it: 'Banco dei registri',
          en: 'Register file',
        },
      },
      {
        id: 'cc',
        x: 465,
        y: 65,
        label: {
          it: 'Circuiteria di controllo',
          en: 'Control circuitry',
        },
      },
      {
        id: 'ir',
        x: 465,
        y: 148,
        label: {
          it: 'IR',
        },
      },
      {
        id: 'alu',
        x: 145,
        y: 192,
        label: {
          it: 'ALU',
        },
      },
      {
        id: 'iag',
        x: 465,
        y: 212,
        label: {
          it: 'Generatore indirizzi',
          en: 'Address generator',
        },
      },
      {
        id: 'pc',
        x: 465,
        y: 245,
        label: {
          it: 'PC',
        },
      },
      {
        id: 'pmi',
        x: 310,
        y: 312,
        label: {
          it: 'Interfaccia processore-memoria',
          en: 'Processor–memory interface',
        },
      },
    ],
    distractors: [
      {
        it: 'Cache',
      },
      {
        it: 'MAR',
      },
      {
        it: 'Unità in virgola mobile',
        en: 'Floating-point unit',
      },
      {
        it: 'TLB',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="60" y="30" width="170" height="90" rx="6"/>\n      <rect class="dg-box" x="380" y="30" width="170" height="70" rx="6"/>\n      <rect class="dg-box" x="380" y="130" width="170" height="36" rx="4"/>\n      <path class="dg-box" d="M60 170 h170 l-30 50 h-110 z"/>\n      <rect class="dg-box" x="380" y="190" width="170" height="72" rx="6"/>\n      <rect class="dg-box" x="415" y="230" width="100" height="28" rx="4"/>\n      <rect class="dg-box" x="140" y="290" width="340" height="44" rx="6"/>\n      <line class="dg-line" x1="145" y1="120" x2="145" y2="170"/>\n      <line class="dg-line" x1="145" y1="220" x2="145" y2="290"/>\n      <line class="dg-line" x1="465" y1="166" x2="465" y2="190"/>',
      en: '<rect class="dg-box" x="60" y="30" width="170" height="90" rx="6"/>\n      <rect class="dg-box" x="380" y="30" width="170" height="70" rx="6"/>\n      <rect class="dg-box" x="380" y="130" width="170" height="36" rx="4"/>\n      <path class="dg-box" d="M60 170 h170 l-30 50 h-110 z"/>\n      <rect class="dg-box" x="380" y="190" width="170" height="72" rx="6"/>\n      <rect class="dg-box" x="415" y="230" width="100" height="28" rx="4"/>\n      <rect class="dg-box" x="140" y="290" width="340" height="44" rx="6"/>\n      <line class="dg-line" x1="145" y1="120" x2="145" y2="170"/>\n      <line class="dg-line" x1="145" y1="220" x2="145" y2="290"/>\n      <line class="dg-line" x1="465" y1="166" x2="465" y2="190"/>',
    },
  },
  {
    id: 'cinque-stadi',
    topic: 'processore',
    width: 480,
    height: 420,
    title: {
      it: 'Organizzazione a cinque stadi',
      en: 'Five-stage organisation',
    },
    slots: [
      {
        id: 's1',
        x: 280,
        y: 44,
        label: {
          it: 'Prelievo istruzione',
          en: 'Instruction fetch',
        },
      },
      {
        id: 's2',
        x: 280,
        y: 124,
        label: {
          it: 'Lettura registri sorgente',
          en: 'Source register read',
        },
      },
      {
        id: 's3',
        x: 280,
        y: 204,
        label: {
          it: 'ALU',
        },
      },
      {
        id: 's4',
        x: 280,
        y: 284,
        label: {
          it: 'Accesso in memoria',
          en: 'Memory access',
        },
      },
      {
        id: 's5',
        x: 280,
        y: 364,
        label: {
          it: 'Scrittura nel registro',
          en: 'Register write-back',
        },
      },
    ],
    distractors: [
      {
        it: 'Refresh della DRAM',
        en: 'DRAM refresh',
      },
      {
        it: 'Arbitraggio del bus',
        en: 'Bus arbitration',
      },
      {
        it: 'Traduzione dell’indirizzo',
        en: 'Address translation',
      },
      {
        it: 'Normalizzazione',
        en: 'Normalisation',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="200" y="20" width="160" height="48" rx="6"/>\n      <rect class="dg-box" x="200" y="100" width="160" height="48" rx="6"/>\n      <rect class="dg-box" x="200" y="180" width="160" height="48" rx="6"/>\n      <rect class="dg-box" x="200" y="260" width="160" height="48" rx="6"/>\n      <rect class="dg-box" x="200" y="340" width="160" height="48" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="68" x2="280" y2="100"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="148" x2="280" y2="180"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="228" x2="280" y2="260"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="308" x2="280" y2="340"/>\n      <text class="dg-text dg-start" x="20" y="48" font-size="11">Stadio 1</text>\n      <text class="dg-text dg-start" x="20" y="128" font-size="11">Stadio 2</text>\n      <text class="dg-text dg-start" x="20" y="208" font-size="11">Stadio 3</text>\n      <text class="dg-text dg-start" x="20" y="288" font-size="11">Stadio 4</text>\n      <text class="dg-text dg-start" x="20" y="368" font-size="11">Stadio 5</text>',
      en: '<rect class="dg-box" x="200" y="20" width="160" height="48" rx="6"/>\n      <rect class="dg-box" x="200" y="100" width="160" height="48" rx="6"/>\n      <rect class="dg-box" x="200" y="180" width="160" height="48" rx="6"/>\n      <rect class="dg-box" x="200" y="260" width="160" height="48" rx="6"/>\n      <rect class="dg-box" x="200" y="340" width="160" height="48" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="68" x2="280" y2="100"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="148" x2="280" y2="180"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="228" x2="280" y2="260"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="280" y1="308" x2="280" y2="340"/>\n      <text class="dg-text dg-start" x="20" y="48" font-size="11">Stage 1</text>\n      <text class="dg-text dg-start" x="20" y="128" font-size="11">Stage 2</text>\n      <text class="dg-text dg-start" x="20" y="208" font-size="11">Stage 3</text>\n      <text class="dg-text dg-start" x="20" y="288" font-size="11">Stage 4</text>\n      <text class="dg-text dg-start" x="20" y="368" font-size="11">Stage 5</text>',
    },
  },
  {
    id: 'datapath',
    topic: 'processore',
    width: 560,
    height: 470,
    title: {
      it: 'Percorso dei dati di un processore',
      en: 'Datapath of a processor',
    },
    slots: [
      {
        id: 'rf',
        x: 280,
        y: 60,
        label: {
          it: 'Banco dei registri',
          en: 'Register file',
        },
      },
      {
        id: 'ra',
        x: 215,
        y: 142,
        label: {
          it: 'RA',
        },
      },
      {
        id: 'rb',
        x: 345,
        y: 142,
        label: {
          it: 'RB',
        },
      },
      {
        id: 'muxb',
        x: 350,
        y: 192,
        label: {
          it: 'MuxB',
        },
      },
      {
        id: 'alu',
        x: 285,
        y: 248,
        label: {
          it: 'ALU',
        },
      },
      {
        id: 'rz',
        x: 215,
        y: 322,
        label: {
          it: 'RZ',
        },
      },
      {
        id: 'rm',
        x: 345,
        y: 322,
        label: {
          it: 'RM',
        },
      },
      {
        id: 'muxy',
        x: 235,
        y: 377,
        label: {
          it: 'MuxY',
        },
      },
      {
        id: 'ry',
        x: 235,
        y: 432,
        label: {
          it: 'RY',
        },
      },
    ],
    distractors: [
      {
        it: 'MAR',
      },
      {
        it: 'MDR',
      },
      {
        it: 'IR',
      },
      {
        it: 'PC',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="180" y="20" width="200" height="80" rx="6"/>\n      <rect class="dg-box" x="170" y="125" width="90" height="34" rx="4"/>\n      <rect class="dg-box" x="300" y="125" width="90" height="34" rx="4"/>\n      <path class="dg-box" d="M300 180 h100 l-20 25 h-60 z"/>\n      <path class="dg-box" d="M170 225 h230 l-40 55 h-150 z"/>\n      <rect class="dg-box" x="170" y="305" width="90" height="34" rx="4"/>\n      <rect class="dg-box" x="300" y="305" width="90" height="34" rx="4"/>\n      <path class="dg-box" d="M170 365 h130 l-25 25 h-80 z"/>\n      <rect class="dg-box" x="190" y="415" width="90" height="34" rx="4"/>\n      <line class="dg-line" x1="215" y1="100" x2="215" y2="125"/>\n      <line class="dg-line" x1="345" y1="100" x2="345" y2="125"/>\n      <line class="dg-line" x1="215" y1="159" x2="215" y2="225"/>\n      <line class="dg-line" x1="345" y1="159" x2="345" y2="180"/>\n      <line class="dg-line" x1="350" y1="205" x2="350" y2="225"/>\n      <line class="dg-line" x1="215" y1="280" x2="215" y2="305"/>\n      <line class="dg-line" x1="345" y1="280" x2="345" y2="305"/>\n      <line class="dg-line" x1="215" y1="339" x2="215" y2="365"/>\n      <line class="dg-line" x1="235" y1="390" x2="235" y2="415"/>\n      <line class="dg-line" x1="450" y1="322" x2="450" y2="60"/>\n      <line class="dg-line" x1="390" y1="322" x2="450" y2="322"/>\n      <line class="dg-line" x1="380" y1="60" x2="450" y2="60"/>\n      <text class="dg-text dg-start" x="410" y="352" font-size="10">verso la memoria</text>',
      en: '<rect class="dg-box" x="180" y="20" width="200" height="80" rx="6"/>\n      <rect class="dg-box" x="170" y="125" width="90" height="34" rx="4"/>\n      <rect class="dg-box" x="300" y="125" width="90" height="34" rx="4"/>\n      <path class="dg-box" d="M300 180 h100 l-20 25 h-60 z"/>\n      <path class="dg-box" d="M170 225 h230 l-40 55 h-150 z"/>\n      <rect class="dg-box" x="170" y="305" width="90" height="34" rx="4"/>\n      <rect class="dg-box" x="300" y="305" width="90" height="34" rx="4"/>\n      <path class="dg-box" d="M170 365 h130 l-25 25 h-80 z"/>\n      <rect class="dg-box" x="190" y="415" width="90" height="34" rx="4"/>\n      <line class="dg-line" x1="215" y1="100" x2="215" y2="125"/>\n      <line class="dg-line" x1="345" y1="100" x2="345" y2="125"/>\n      <line class="dg-line" x1="215" y1="159" x2="215" y2="225"/>\n      <line class="dg-line" x1="345" y1="159" x2="345" y2="180"/>\n      <line class="dg-line" x1="350" y1="205" x2="350" y2="225"/>\n      <line class="dg-line" x1="215" y1="280" x2="215" y2="305"/>\n      <line class="dg-line" x1="345" y1="280" x2="345" y2="305"/>\n      <line class="dg-line" x1="215" y1="339" x2="215" y2="365"/>\n      <line class="dg-line" x1="235" y1="390" x2="235" y2="415"/>\n      <line class="dg-line" x1="450" y1="322" x2="450" y2="60"/>\n      <line class="dg-line" x1="390" y1="322" x2="450" y2="322"/>\n      <line class="dg-line" x1="380" y1="60" x2="450" y2="60"/>\n      <text class="dg-text dg-start" x="410" y="352" font-size="10">to memory</text>',
    },
  },
  {
    id: 'controllo-cablato',
    topic: 'processore',
    width: 640,
    height: 320,
    title: {
      it: 'Generazione dei segnali di controllo',
      en: 'Control signal generation',
    },
    slots: [
      {
        id: 'ir',
        x: 100,
        y: 58,
        label: {
          it: 'IR',
        },
      },
      {
        id: 'dec',
        x: 110,
        y: 150,
        label: {
          it: 'Decodificatore di istruzione',
          en: 'Instruction decoder',
        },
      },
      {
        id: 'step',
        x: 295,
        y: 50,
        label: {
          it: 'Contatore di passo',
          en: 'Step counter',
        },
      },
      {
        id: 'clk',
        x: 470,
        y: 50,
        label: {
          it: 'Clock',
        },
      },
      {
        id: 'gen',
        x: 315,
        y: 155,
        label: {
          it: 'Generatore dei segnali',
          en: 'Signal generator',
        },
      },
      {
        id: 'ext',
        x: 520,
        y: 128,
        label: {
          it: 'Ingressi esterni',
          en: 'External inputs',
        },
      },
      {
        id: 'cond',
        x: 520,
        y: 183,
        label: {
          it: 'Segnali di condizione',
          en: 'Condition signals',
        },
      },
    ],
    distractors: [
      {
        it: 'Microprogramma',
        en: 'Microprogram',
      },
      {
        it: 'ALU',
      },
      {
        it: 'Memoria di controllo',
        en: 'Control store',
      },
      {
        it: 'MDR',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="40" y="40" width="120" height="36" rx="4"/>\n      <rect class="dg-box" x="40" y="120" width="140" height="60" rx="6"/>\n      <rect class="dg-box" x="230" y="30" width="130" height="40" rx="4"/>\n      <rect class="dg-box" x="420" y="30" width="100" height="40" rx="4"/>\n      <rect class="dg-box" x="230" y="110" width="170" height="90" rx="6"/>\n      <rect class="dg-box" x="450" y="110" width="140" height="36" rx="4"/>\n      <rect class="dg-box" x="450" y="165" width="140" height="36" rx="4"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="100" y1="76" x2="100" y2="120"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="180" y1="150" x2="230" y2="150"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="420" y1="50" x2="360" y2="50"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="295" y1="70" x2="295" y2="110"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="450" y1="128" x2="400" y2="128"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="450" y1="183" x2="400" y2="183"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="315" y1="200" x2="315" y2="250"/>\n      <text class="dg-text" x="315" y="272" font-size="12">Segnali di controllo</text>',
      en: '<rect class="dg-box" x="40" y="40" width="120" height="36" rx="4"/>\n      <rect class="dg-box" x="40" y="120" width="140" height="60" rx="6"/>\n      <rect class="dg-box" x="230" y="30" width="130" height="40" rx="4"/>\n      <rect class="dg-box" x="420" y="30" width="100" height="40" rx="4"/>\n      <rect class="dg-box" x="230" y="110" width="170" height="90" rx="6"/>\n      <rect class="dg-box" x="450" y="110" width="140" height="36" rx="4"/>\n      <rect class="dg-box" x="450" y="165" width="140" height="36" rx="4"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="100" y1="76" x2="100" y2="120"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="180" y1="150" x2="230" y2="150"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="420" y1="50" x2="360" y2="50"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="295" y1="70" x2="295" y2="110"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="450" y1="128" x2="400" y2="128"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="450" y1="183" x2="400" y2="183"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="315" y1="200" x2="315" y2="250"/>\n      <text class="dg-text" x="315" y="272" font-size="12">Control signals</text>',
    },
  },
  {
    id: 'controllo-microprogrammato',
    topic: 'processore',
    width: 520,
    height: 340,
    title: {
      it: 'Unità di controllo microprogrammata',
      en: 'Microprogrammed control unit',
    },
    slots: [
      {
        id: 'ir',
        x: 75,
        y: 145,
        label: {
          it: 'IR',
        },
      },
      {
        id: 'gen',
        x: 290,
        y: 95,
        label: {
          it: 'Generatore indirizzi microistruzione',
          en: 'Microinstruction address generator',
        },
      },
      {
        id: 'upc',
        x: 290,
        y: 141,
        label: {
          it: 'μPC',
        },
      },
      {
        id: 'cs',
        x: 290,
        y: 255,
        label: {
          it: 'Memoria di controllo',
          en: 'Control store',
        },
      },
    ],
    distractors: [
      {
        it: 'Decodificatore cablato',
        en: 'Hardwired decoder',
      },
      {
        it: 'Contatore di passo',
        en: 'Step counter',
      },
      {
        it: 'ALU',
      },
      {
        it: 'Banco dei registri',
        en: 'Register file',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="40" y="100" width="70" height="90" rx="4"/>\n      <rect class="dg-box" x="180" y="60" width="220" height="110" rx="6"/>\n      <rect class="dg-box" x="240" y="125" width="100" height="32" rx="4"/>\n      <rect class="dg-box" x="180" y="220" width="220" height="70" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="110" y1="145" x2="180" y2="145"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="290" y1="170" x2="290" y2="220"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="240" y1="290" x2="240" y2="320"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="340" y1="290" x2="340" y2="320"/>\n      <text class="dg-text" x="290" y="335" font-size="11">Segnali di controllo</text>',
      en: '<rect class="dg-box" x="40" y="100" width="70" height="90" rx="4"/>\n      <rect class="dg-box" x="180" y="60" width="220" height="110" rx="6"/>\n      <rect class="dg-box" x="240" y="125" width="100" height="32" rx="4"/>\n      <rect class="dg-box" x="180" y="220" width="220" height="70" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="110" y1="145" x2="180" y2="145"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="290" y1="170" x2="290" y2="220"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="240" y1="290" x2="240" y2="320"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="340" y1="290" x2="340" y2="320"/>\n      <text class="dg-text" x="290" y="335" font-size="11">Control signals</text>',
    },
  },
  {
    id: 'superscalare',
    topic: 'pipeline',
    width: 640,
    height: 300,
    title: {
      it: 'Processore superscalare con due unità di esecuzione',
      en: 'Superscalar processor with two execution units',
    },
    slots: [
      {
        id: 'fetch',
        x: 90,
        y: 45,
        label: {
          it: 'Unità di prelievo',
          en: 'Fetch unit',
        },
      },
      {
        id: 'queue',
        x: 350,
        y: 45,
        label: {
          it: 'Coda delle istruzioni',
          en: 'Instruction queue',
        },
      },
      {
        id: 'disp',
        x: 90,
        y: 175,
        label: {
          it: 'Unità di distribuzione',
          en: 'Dispatch unit',
        },
      },
      {
        id: 'arit',
        x: 360,
        y: 120,
        label: {
          it: 'Unità aritmetica',
          en: 'Arithmetic unit',
        },
      },
      {
        id: 'ls',
        x: 360,
        y: 230,
        label: {
          it: 'Unità load/store',
          en: 'Load/store unit',
        },
      },
      {
        id: 'wr',
        x: 560,
        y: 175,
        label: {
          it: 'Scrittura dei risultati',
          en: 'Result write-back',
        },
      },
    ],
    distractors: [
      {
        it: 'Predittore di salto',
        en: 'Branch predictor',
      },
      {
        it: 'Cache di primo livello',
        en: 'First-level cache',
      },
      {
        it: 'TLB',
      },
      {
        it: 'Contatore di passo',
        en: 'Step counter',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="30" y="25" width="120" height="40" rx="6"/>\n      <rect class="dg-box" x="250" y="25" width="200" height="40" rx="6"/>\n      <line class="dg-line" x1="290" y1="25" x2="290" y2="65"/>\n      <line class="dg-line" x1="330" y1="25" x2="330" y2="65"/>\n      <line class="dg-line" x1="370" y1="25" x2="370" y2="65"/>\n      <line class="dg-line" x1="410" y1="25" x2="410" y2="65"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="150" y1="45" x2="250" y2="45"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="90" y1="65" x2="90" y2="155"/>\n      <rect class="dg-box" x="30" y="155" width="120" height="40" rx="6"/>\n      <rect class="dg-box" x="270" y="100" width="180" height="40" rx="6"/>\n      <rect class="dg-box" x="270" y="210" width="180" height="40" rx="6"/>\n      <rect class="dg-box" x="220" y="100" width="20" height="40" rx="3"/>\n      <rect class="dg-box" x="220" y="210" width="20" height="40" rx="3"/>\n      <rect class="dg-box" x="480" y="100" width="20" height="40" rx="3"/>\n      <rect class="dg-box" x="480" y="210" width="20" height="40" rx="3"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="150" y1="165" x2="220" y2="120"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="150" y1="185" x2="220" y2="230"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="450" y1="120" x2="480" y2="120"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="450" y1="230" x2="480" y2="230"/>\n      <rect class="dg-box" x="500" y="155" width="120" height="40" rx="6"/>\n      <line class="dg-line" x1="500" y1="120" x2="560" y2="120"/>\n      <line class="dg-line" x1="500" y1="230" x2="560" y2="230"/>\n      <line class="dg-line" x1="560" y1="120" x2="560" y2="155"/>\n      <line class="dg-line" x1="560" y1="195" x2="560" y2="230"/>',
      en: '<rect class="dg-box" x="30" y="25" width="120" height="40" rx="6"/>\n      <rect class="dg-box" x="250" y="25" width="200" height="40" rx="6"/>\n      <line class="dg-line" x1="290" y1="25" x2="290" y2="65"/>\n      <line class="dg-line" x1="330" y1="25" x2="330" y2="65"/>\n      <line class="dg-line" x1="370" y1="25" x2="370" y2="65"/>\n      <line class="dg-line" x1="410" y1="25" x2="410" y2="65"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="150" y1="45" x2="250" y2="45"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="90" y1="65" x2="90" y2="155"/>\n      <rect class="dg-box" x="30" y="155" width="120" height="40" rx="6"/>\n      <rect class="dg-box" x="270" y="100" width="180" height="40" rx="6"/>\n      <rect class="dg-box" x="270" y="210" width="180" height="40" rx="6"/>\n      <rect class="dg-box" x="220" y="100" width="20" height="40" rx="3"/>\n      <rect class="dg-box" x="220" y="210" width="20" height="40" rx="3"/>\n      <rect class="dg-box" x="480" y="100" width="20" height="40" rx="3"/>\n      <rect class="dg-box" x="480" y="210" width="20" height="40" rx="3"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="150" y1="165" x2="220" y2="120"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="150" y1="185" x2="220" y2="230"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="450" y1="120" x2="480" y2="120"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="450" y1="230" x2="480" y2="230"/>\n      <rect class="dg-box" x="500" y="155" width="120" height="40" rx="6"/>\n      <line class="dg-line" x1="500" y1="120" x2="560" y2="120"/>\n      <line class="dg-line" x1="500" y1="230" x2="560" y2="230"/>\n      <line class="dg-line" x1="560" y1="120" x2="560" y2="155"/>\n      <line class="dg-line" x1="560" y1="195" x2="560" y2="230"/>',
    },
  },
  {
    id: 'bus-singolo',
    topic: 'input-output',
    width: 620,
    height: 280,
    title: {
      it: 'Struttura a bus singolo',
      en: 'Single-bus structure',
    },
    slots: [
      {
        id: 'proc',
        x: 160,
        y: 45,
        label: {
          it: 'Processore',
          en: 'Processor',
        },
      },
      {
        id: 'mem',
        x: 450,
        y: 45,
        label: {
          it: 'Memoria',
          en: 'Memory',
        },
      },
      {
        id: 'bus',
        x: 60,
        y: 140,
        label: {
          it: 'Bus',
        },
      },
      {
        id: 'io1',
        x: 160,
        y: 235,
        label: {
          it: 'Dispositivo di I/O 1',
          en: 'I/O device 1',
        },
      },
      {
        id: 'ion',
        x: 450,
        y: 235,
        label: {
          it: 'Dispositivo di I/O n',
          en: 'I/O device n',
        },
      },
    ],
    distractors: [
      {
        it: 'Cache',
      },
      {
        it: 'Rete di interconnessione',
        en: 'Interconnection network',
      },
      {
        it: 'Controllore DMA',
        en: 'DMA controller',
      },
      {
        it: 'Ponte PCI',
        en: 'PCI bridge',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="90" y="25" width="140" height="44" rx="6"/>\n      <rect class="dg-box" x="380" y="25" width="140" height="44" rx="6"/>\n      <line class="dg-line" x1="120" y1="140" x2="580" y2="140"/>\n      <line class="dg-line" x1="160" y1="69" x2="160" y2="140"/>\n      <line class="dg-line" x1="450" y1="69" x2="450" y2="140"/>\n      <line class="dg-line" x1="160" y1="140" x2="160" y2="213"/>\n      <line class="dg-line" x1="450" y1="140" x2="450" y2="213"/>\n      <rect class="dg-box" x="90" y="213" width="140" height="44" rx="6"/>\n      <rect class="dg-box" x="380" y="213" width="140" height="44" rx="6"/>\n      <text class="dg-text" x="305" y="240" font-size="14">· · ·</text>',
      en: '<rect class="dg-box" x="90" y="25" width="140" height="44" rx="6"/>\n      <rect class="dg-box" x="380" y="25" width="140" height="44" rx="6"/>\n      <line class="dg-line" x1="120" y1="140" x2="580" y2="140"/>\n      <line class="dg-line" x1="160" y1="69" x2="160" y2="140"/>\n      <line class="dg-line" x1="450" y1="69" x2="450" y2="140"/>\n      <line class="dg-line" x1="160" y1="140" x2="160" y2="213"/>\n      <line class="dg-line" x1="450" y1="140" x2="450" y2="213"/>\n      <rect class="dg-box" x="90" y="213" width="140" height="44" rx="6"/>\n      <rect class="dg-box" x="380" y="213" width="140" height="44" rx="6"/>\n      <text class="dg-text" x="305" y="240" font-size="14">· · ·</text>',
    },
  },
  {
    id: 'interfaccia-ingresso',
    topic: 'input-output',
    width: 620,
    height: 330,
    title: {
      it: 'Interfaccia di I/O per un dispositivo di ingresso',
      en: 'I/O interface for an input device',
    },
    slots: [
      {
        id: 'addr',
        x: 130,
        y: 190,
        label: {
          it: 'Decodificatore di indirizzo',
          en: 'Address decoder',
        },
      },
      {
        id: 'ctrl',
        x: 310,
        y: 190,
        label: {
          it: 'Circuiti di controllo',
          en: 'Control circuits',
        },
      },
      {
        id: 'regs',
        x: 490,
        y: 190,
        label: {
          it: 'Registri dati, stato e controllo',
          en: 'Data, status and control registers',
        },
      },
      {
        id: 'dev',
        x: 310,
        y: 295,
        label: {
          it: 'Dispositivo di ingresso',
          en: 'Input device',
        },
      },
    ],
    distractors: [
      {
        it: 'Controllore DMA',
        en: 'DMA controller',
      },
      {
        it: 'Cache',
      },
      {
        it: 'ALU',
      },
      {
        it: 'Contatore di programma',
        en: 'Program counter',
      },
    ],
    svg: {
      it: '<line class="dg-line" x1="40" y1="40" x2="580" y2="40"/>\n      <line class="dg-line" x1="40" y1="65" x2="580" y2="65"/>\n      <line class="dg-line" x1="40" y1="90" x2="580" y2="90"/>\n      <text class="dg-text dg-start" x="440" y="36" font-size="10">linee indirizzi</text>\n      <text class="dg-text dg-start" x="440" y="61" font-size="10">linee dati</text>\n      <text class="dg-text dg-start" x="440" y="86" font-size="10">linee di controllo</text>\n      <rect class="dg-group" x="60" y="150" width="500" height="90" rx="8"/>\n      <rect class="dg-box" x="80" y="165" width="100" height="60" rx="4"/>\n      <rect class="dg-box" x="255" y="165" width="110" height="60" rx="4"/>\n      <rect class="dg-box" x="415" y="165" width="130" height="60" rx="4"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="130" y1="40" x2="130" y2="165"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="310" y1="90" x2="310" y2="165"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="490" y1="65" x2="490" y2="165"/>\n      <rect class="dg-box" x="230" y="273" width="160" height="44" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="310" y1="273" x2="310" y2="240"/>',
      en: '<line class="dg-line" x1="40" y1="40" x2="580" y2="40"/>\n      <line class="dg-line" x1="40" y1="65" x2="580" y2="65"/>\n      <line class="dg-line" x1="40" y1="90" x2="580" y2="90"/>\n      <text class="dg-text dg-start" x="440" y="36" font-size="10">address lines</text>\n      <text class="dg-text dg-start" x="440" y="61" font-size="10">data lines</text>\n      <text class="dg-text dg-start" x="440" y="86" font-size="10">control lines</text>\n      <rect class="dg-group" x="60" y="150" width="500" height="90" rx="8"/>\n      <rect class="dg-box" x="80" y="165" width="100" height="60" rx="4"/>\n      <rect class="dg-box" x="255" y="165" width="110" height="60" rx="4"/>\n      <rect class="dg-box" x="415" y="165" width="130" height="60" rx="4"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="130" y1="40" x2="130" y2="165"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="310" y1="90" x2="310" y2="165"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="490" y1="65" x2="490" y2="165"/>\n      <rect class="dg-box" x="230" y="273" width="160" height="44" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="310" y1="273" x2="310" y2="240"/>',
    },
  },
  {
    id: 'usb-albero',
    topic: 'input-output',
    width: 620,
    height: 340,
    title: {
      it: 'Struttura ad albero dell’USB',
      en: 'USB tree structure',
    },
    slots: [
      {
        id: 'host',
        x: 310,
        y: 35,
        label: {
          it: 'Calcolatore ospite',
          en: 'Host computer',
        },
      },
      {
        id: 'root',
        x: 310,
        y: 110,
        label: {
          it: 'Hub radice',
          en: 'Root hub',
        },
      },
      {
        id: 'hub1',
        x: 160,
        y: 190,
        label: {
          it: 'Hub',
        },
      },
      {
        id: 'hub2',
        x: 460,
        y: 190,
        label: {
          it: 'Hub',
        },
      },
      {
        id: 'dev1',
        x: 90,
        y: 290,
        label: {
          it: 'Dispositivo di I/O',
          en: 'I/O device',
        },
      },
      {
        id: 'dev2',
        x: 250,
        y: 290,
        label: {
          it: 'Dispositivo di I/O',
          en: 'I/O device',
        },
      },
    ],
    distractors: [
      {
        it: 'Ponte PCI',
        en: 'PCI bridge',
      },
      {
        it: 'Controllore DMA',
        en: 'DMA controller',
      },
      {
        it: 'Memoria principale',
        en: 'Main memory',
      },
      {
        it: 'Arbitro del bus',
        en: 'Bus arbiter',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="220" y="16" width="180" height="40" rx="6"/>\n      <line class="dg-line" x1="310" y1="56" x2="310" y2="88"/>\n      <ellipse class="dg-box" cx="310" cy="110" rx="60" ry="26"/>\n      <line class="dg-line" x1="310" y1="136" x2="160" y2="168"/>\n      <line class="dg-line" x1="310" y1="136" x2="460" y2="168"/>\n      <ellipse class="dg-box" cx="160" cy="190" rx="45" ry="22"/>\n      <ellipse class="dg-box" cx="460" cy="190" rx="45" ry="22"/>\n      <line class="dg-line" x1="160" y1="212" x2="90" y2="268"/>\n      <line class="dg-line" x1="160" y1="212" x2="250" y2="268"/>\n      <line class="dg-line" x1="460" y1="212" x2="400" y2="268"/>\n      <line class="dg-line" x1="460" y1="212" x2="530" y2="268"/>\n      <rect class="dg-box" x="30" y="268" width="120" height="40" rx="6"/>\n      <rect class="dg-box" x="190" y="268" width="120" height="40" rx="6"/>\n      <rect class="dg-box" x="340" y="268" width="120" height="40" rx="6"/>\n      <rect class="dg-box" x="470" y="268" width="120" height="40" rx="6"/>',
      en: '<rect class="dg-box" x="220" y="16" width="180" height="40" rx="6"/>\n      <line class="dg-line" x1="310" y1="56" x2="310" y2="88"/>\n      <ellipse class="dg-box" cx="310" cy="110" rx="60" ry="26"/>\n      <line class="dg-line" x1="310" y1="136" x2="160" y2="168"/>\n      <line class="dg-line" x1="310" y1="136" x2="460" y2="168"/>\n      <ellipse class="dg-box" cx="160" cy="190" rx="45" ry="22"/>\n      <ellipse class="dg-box" cx="460" cy="190" rx="45" ry="22"/>\n      <line class="dg-line" x1="160" y1="212" x2="90" y2="268"/>\n      <line class="dg-line" x1="160" y1="212" x2="250" y2="268"/>\n      <line class="dg-line" x1="460" y1="212" x2="400" y2="268"/>\n      <line class="dg-line" x1="460" y1="212" x2="530" y2="268"/>\n      <rect class="dg-box" x="30" y="268" width="120" height="40" rx="6"/>\n      <rect class="dg-box" x="190" y="268" width="120" height="40" rx="6"/>\n      <rect class="dg-box" x="340" y="268" width="120" height="40" rx="6"/>\n      <rect class="dg-box" x="470" y="268" width="120" height="40" rx="6"/>',
    },
  },
  {
    id: 'pci-sistema',
    topic: 'input-output',
    width: 640,
    height: 380,
    title: {
      it: 'Uso di un bus PCI in un sistema',
      en: 'Use of a PCI bus in a system',
    },
    slots: [
      {
        id: 'proc',
        x: 250,
        y: 35,
        label: {
          it: 'Processore',
          en: 'Processor',
        },
      },
      {
        id: 'bridge',
        x: 250,
        y: 120,
        label: {
          it: 'Ponte PCI',
          en: 'PCI bridge',
        },
      },
      {
        id: 'mem',
        x: 470,
        y: 120,
        label: {
          it: 'Memoria principale',
          en: 'Main memory',
        },
      },
      {
        id: 'bus',
        x: 90,
        y: 195,
        label: {
          it: 'Bus PCI',
          en: 'PCI bus',
        },
      },
      {
        id: 'disk',
        x: 130,
        y: 260,
        label: {
          it: 'Controllore del disco',
          en: 'Disk controller',
        },
      },
      {
        id: 'eth',
        x: 320,
        y: 260,
        label: {
          it: 'Ethernet',
        },
      },
      {
        id: 'usb',
        x: 500,
        y: 260,
        label: {
          it: 'Hub USB',
          en: 'USB hub',
        },
      },
    ],
    distractors: [
      {
        it: 'Cache di secondo livello',
        en: 'Second-level cache',
      },
      {
        it: 'TLB',
      },
      {
        it: 'Unità di controllo',
        en: 'Control unit',
      },
      {
        it: 'Registro di stato',
        en: 'Status register',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="180" y="16" width="140" height="40" rx="6"/>\n      <line class="dg-line" x1="250" y1="56" x2="250" y2="100"/>\n      <rect class="dg-box" x="180" y="100" width="140" height="40" rx="6"/>\n      <rect class="dg-box" x="390" y="100" width="160" height="40" rx="6"/>\n      <line class="dg-line" x1="320" y1="120" x2="390" y2="120"/>\n      <line class="dg-line" x1="250" y1="140" x2="250" y2="195"/>\n      <line class="dg-line" x1="40" y1="195" x2="600" y2="195"/>\n      <line class="dg-line" x1="130" y1="195" x2="130" y2="240"/>\n      <line class="dg-line" x1="320" y1="195" x2="320" y2="240"/>\n      <line class="dg-line" x1="500" y1="195" x2="500" y2="240"/>\n      <rect class="dg-box" x="60" y="240" width="140" height="40" rx="6"/>\n      <rect class="dg-box" x="255" y="240" width="130" height="40" rx="6"/>\n      <rect class="dg-box" x="435" y="240" width="130" height="40" rx="6"/>\n      <line class="dg-line" x1="130" y1="280" x2="130" y2="315"/>\n      <rect class="dg-box" x="80" y="315" width="100" height="36" rx="4"/>\n      <text class="dg-text" x="130" y="338" font-size="11">Disco</text>\n      <line class="dg-line" x1="500" y1="280" x2="500" y2="315"/>\n      <rect class="dg-box" x="440" y="315" width="120" height="36" rx="4"/>\n      <text class="dg-text" x="500" y="338" font-size="11">Tastiera · mouse</text>',
      en: '<rect class="dg-box" x="180" y="16" width="140" height="40" rx="6"/>\n      <line class="dg-line" x1="250" y1="56" x2="250" y2="100"/>\n      <rect class="dg-box" x="180" y="100" width="140" height="40" rx="6"/>\n      <rect class="dg-box" x="390" y="100" width="160" height="40" rx="6"/>\n      <line class="dg-line" x1="320" y1="120" x2="390" y2="120"/>\n      <line class="dg-line" x1="250" y1="140" x2="250" y2="195"/>\n      <line class="dg-line" x1="40" y1="195" x2="600" y2="195"/>\n      <line class="dg-line" x1="130" y1="195" x2="130" y2="240"/>\n      <line class="dg-line" x1="320" y1="195" x2="320" y2="240"/>\n      <line class="dg-line" x1="500" y1="195" x2="500" y2="240"/>\n      <rect class="dg-box" x="60" y="240" width="140" height="40" rx="6"/>\n      <rect class="dg-box" x="255" y="240" width="130" height="40" rx="6"/>\n      <rect class="dg-box" x="435" y="240" width="130" height="40" rx="6"/>\n      <line class="dg-line" x1="130" y1="280" x2="130" y2="315"/>\n      <rect class="dg-box" x="80" y="315" width="100" height="36" rx="4"/>\n      <text class="dg-text" x="130" y="338" font-size="11">Disk</text>\n      <line class="dg-line" x1="500" y1="280" x2="500" y2="315"/>\n      <rect class="dg-box" x="440" y="315" width="120" height="36" rx="4"/>\n      <text class="dg-text" x="500" y="338" font-size="11">Keyboard · mouse</text>',
    },
  },
  {
    id: 'chip-memoria',
    topic: 'gerarchia-di-memoria',
    width: 620,
    height: 360,
    title: {
      it: 'Organizzazione delle celle in un chip di memoria',
      en: 'Cell organisation in a memory chip',
    },
    slots: [
      {
        id: 'dec',
        x: 80,
        y: 165,
        label: {
          it: 'Decodificatore di indirizzo',
          en: 'Address decoder',
        },
      },
      {
        id: 'cells',
        x: 350,
        y: 130,
        label: {
          it: 'Celle di memoria',
          en: 'Memory cells',
        },
      },
      {
        id: 'sense',
        x: 350,
        y: 275,
        label: {
          it: 'Circuiti di lettura/scrittura',
          en: 'Read/write circuits',
        },
      },
      {
        id: 'word',
        x: 350,
        y: 45,
        label: {
          it: 'Linee di parola',
          en: 'Word lines',
        },
      },
      {
        id: 'data',
        x: 350,
        y: 335,
        label: {
          it: 'Linee dati di ingresso/uscita',
          en: 'Data input/output lines',
        },
      },
    ],
    distractors: [
      {
        it: 'Contatore di refresh',
        en: 'Refresh counter',
      },
      {
        it: 'Etichetta',
        en: 'Tag',
      },
      {
        it: 'Registro dati',
        en: 'Data register',
      },
      {
        it: 'Multiplexer di colonna',
        en: 'Column multiplexer',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="30" y="80" width="100" height="170" rx="6"/>\n      <text class="dg-text dg-start" x="16" y="110" font-size="10">A₀…A₃</text>\n      <rect class="dg-group" x="180" y="70" width="380" height="160" rx="8"/>\n      <rect class="dg-box" x="210" y="90" width="34" height="30" rx="3"/>\n      <rect class="dg-box" x="300" y="90" width="34" height="30" rx="3"/>\n      <rect class="dg-box" x="390" y="90" width="34" height="30" rx="3"/>\n      <rect class="dg-box" x="480" y="90" width="34" height="30" rx="3"/>\n      <rect class="dg-box" x="210" y="170" width="34" height="30" rx="3"/>\n      <rect class="dg-box" x="300" y="170" width="34" height="30" rx="3"/>\n      <rect class="dg-box" x="390" y="170" width="34" height="30" rx="3"/>\n      <rect class="dg-box" x="480" y="170" width="34" height="30" rx="3"/>\n      <line class="dg-line" x1="130" y1="105" x2="560" y2="105"/>\n      <line class="dg-line" x1="130" y1="185" x2="560" y2="185"/>\n      <text class="dg-text" x="350" y="152" font-size="12">⋮</text>\n      <rect class="dg-box" x="210" y="255" width="80" height="40" rx="4"/>\n      <rect class="dg-box" x="320" y="255" width="80" height="40" rx="4"/>\n      <rect class="dg-box" x="430" y="255" width="80" height="40" rx="4"/>\n      <line class="dg-line" x1="227" y1="200" x2="227" y2="255"/>\n      <line class="dg-line" x1="360" y1="200" x2="360" y2="255"/>\n      <line class="dg-line" x1="497" y1="200" x2="497" y2="255"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="250" y1="295" x2="250" y2="325"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="360" y1="295" x2="360" y2="325"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="470" y1="295" x2="470" y2="325"/>',
      en: '<rect class="dg-box" x="30" y="80" width="100" height="170" rx="6"/>\n      <text class="dg-text dg-start" x="16" y="110" font-size="10">A₀…A₃</text>\n      <rect class="dg-group" x="180" y="70" width="380" height="160" rx="8"/>\n      <rect class="dg-box" x="210" y="90" width="34" height="30" rx="3"/>\n      <rect class="dg-box" x="300" y="90" width="34" height="30" rx="3"/>\n      <rect class="dg-box" x="390" y="90" width="34" height="30" rx="3"/>\n      <rect class="dg-box" x="480" y="90" width="34" height="30" rx="3"/>\n      <rect class="dg-box" x="210" y="170" width="34" height="30" rx="3"/>\n      <rect class="dg-box" x="300" y="170" width="34" height="30" rx="3"/>\n      <rect class="dg-box" x="390" y="170" width="34" height="30" rx="3"/>\n      <rect class="dg-box" x="480" y="170" width="34" height="30" rx="3"/>\n      <line class="dg-line" x1="130" y1="105" x2="560" y2="105"/>\n      <line class="dg-line" x1="130" y1="185" x2="560" y2="185"/>\n      <text class="dg-text" x="350" y="152" font-size="12">⋮</text>\n      <rect class="dg-box" x="210" y="255" width="80" height="40" rx="4"/>\n      <rect class="dg-box" x="320" y="255" width="80" height="40" rx="4"/>\n      <rect class="dg-box" x="430" y="255" width="80" height="40" rx="4"/>\n      <line class="dg-line" x1="227" y1="200" x2="227" y2="255"/>\n      <line class="dg-line" x1="360" y1="200" x2="360" y2="255"/>\n      <line class="dg-line" x1="497" y1="200" x2="497" y2="255"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="250" y1="295" x2="250" y2="325"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="360" y1="295" x2="360" y2="325"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="470" y1="295" x2="470" y2="325"/>',
    },
  },
  {
    id: 'dram-sincrona',
    topic: 'gerarchia-di-memoria',
    width: 640,
    height: 380,
    title: {
      it: 'DRAM sincrona',
      en: 'Synchronous DRAM',
    },
    slots: [
      {
        id: 'refresh',
        x: 100,
        y: 40,
        label: {
          it: 'Contatore di refresh',
          en: 'Refresh counter',
        },
      },
      {
        id: 'rowlatch',
        x: 100,
        y: 120,
        label: {
          it: 'Latch indirizzo di riga',
          en: 'Row address latch',
        },
      },
      {
        id: 'rowdec',
        x: 280,
        y: 120,
        label: {
          it: 'Decodificatore di riga',
          en: 'Row decoder',
        },
      },
      {
        id: 'array',
        x: 500,
        y: 120,
        label: {
          it: 'Matrice di celle',
          en: 'Cell array',
        },
      },
      {
        id: 'collatch',
        x: 100,
        y: 215,
        label: {
          it: 'Contatore indirizzo di colonna',
          en: 'Column address counter',
        },
      },
      {
        id: 'coldec',
        x: 280,
        y: 215,
        label: {
          it: 'Decodificatore di colonna',
          en: 'Column decoder',
        },
      },
      {
        id: 'rw',
        x: 500,
        y: 215,
        label: {
          it: 'Circuiti di lettura/scrittura',
          en: 'Read/write circuits',
        },
      },
      {
        id: 'mode',
        x: 130,
        y: 320,
        label: {
          it: 'Registro di modo e temporizzazione',
          en: 'Mode register and timing control',
        },
      },
      {
        id: 'dreg',
        x: 470,
        y: 320,
        label: {
          it: 'Registri dati',
          en: 'Data registers',
        },
      },
    ],
    distractors: [
      {
        it: 'Etichetta',
        en: 'Tag',
      },
      {
        it: 'TLB',
      },
      {
        it: 'Unità di controllo',
        en: 'Control unit',
      },
      {
        it: 'Sommatore',
        en: 'Adder',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="40" y="22" width="120" height="36" rx="4"/>\n      <rect class="dg-box" x="40" y="100" width="120" height="40" rx="4"/>\n      <rect class="dg-box" x="210" y="100" width="140" height="40" rx="4"/>\n      <rect class="dg-box" x="400" y="90" width="200" height="60" rx="6"/>\n      <rect class="dg-box" x="40" y="195" width="120" height="40" rx="4"/>\n      <rect class="dg-box" x="210" y="195" width="140" height="40" rx="4"/>\n      <rect class="dg-box" x="400" y="195" width="200" height="40" rx="4"/>\n      <rect class="dg-box" x="40" y="300" width="180" height="40" rx="4"/>\n      <rect class="dg-box" x="390" y="300" width="160" height="40" rx="4"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="100" y1="58" x2="100" y2="100"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="160" y1="120" x2="210" y2="120"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="350" y1="120" x2="400" y2="120"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="160" y1="215" x2="210" y2="215"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="350" y1="215" x2="400" y2="215"/>\n      <line class="dg-line" x1="500" y1="150" x2="500" y2="195"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="500" y1="235" x2="500" y2="300"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="220" y1="320" x2="390" y2="320"/>\n      <text class="dg-text dg-start" x="16" y="270" font-size="10">RAS · CAS · R/W · CS</text>',
      en: '<rect class="dg-box" x="40" y="22" width="120" height="36" rx="4"/>\n      <rect class="dg-box" x="40" y="100" width="120" height="40" rx="4"/>\n      <rect class="dg-box" x="210" y="100" width="140" height="40" rx="4"/>\n      <rect class="dg-box" x="400" y="90" width="200" height="60" rx="6"/>\n      <rect class="dg-box" x="40" y="195" width="120" height="40" rx="4"/>\n      <rect class="dg-box" x="210" y="195" width="140" height="40" rx="4"/>\n      <rect class="dg-box" x="400" y="195" width="200" height="40" rx="4"/>\n      <rect class="dg-box" x="40" y="300" width="180" height="40" rx="4"/>\n      <rect class="dg-box" x="390" y="300" width="160" height="40" rx="4"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="100" y1="58" x2="100" y2="100"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="160" y1="120" x2="210" y2="120"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="350" y1="120" x2="400" y2="120"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="160" y1="215" x2="210" y2="215"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="350" y1="215" x2="400" y2="215"/>\n      <line class="dg-line" x1="500" y1="150" x2="500" y2="195"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="500" y1="235" x2="500" y2="300"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="220" y1="320" x2="390" y2="320"/>\n      <text class="dg-text dg-start" x="16" y="270" font-size="10">RAS · CAS · R/W · CS</text>',
    },
  },
  {
    id: 'dma-sistema',
    topic: 'input-output',
    width: 620,
    height: 360,
    title: {
      it: 'Uso dei controllori DMA in un sistema',
      en: 'Use of DMA controllers in a system',
    },
    slots: [
      {
        id: 'proc',
        x: 200,
        y: 35,
        label: {
          it: 'Processore',
          en: 'Processor',
        },
      },
      {
        id: 'bridge',
        x: 200,
        y: 120,
        label: {
          it: 'Ponte',
          en: 'Bridge',
        },
      },
      {
        id: 'mem',
        x: 450,
        y: 120,
        label: {
          it: 'Memoria principale',
          en: 'Main memory',
        },
      },
      {
        id: 'bus',
        x: 80,
        y: 200,
        label: {
          it: 'Bus PCI',
          en: 'PCI bus',
        },
      },
      {
        id: 'dma1',
        x: 180,
        y: 255,
        label: {
          it: 'Controllore disco/DMA',
          en: 'Disk/DMA controller',
        },
      },
      {
        id: 'dma2',
        x: 430,
        y: 255,
        label: {
          it: 'Controllore DMA',
          en: 'DMA controller',
        },
      },
      {
        id: 'eth',
        x: 430,
        y: 330,
        label: {
          it: 'Interfaccia Ethernet',
          en: 'Ethernet interface',
        },
      },
    ],
    distractors: [
      {
        it: 'Cache',
      },
      {
        it: 'TLB',
      },
      {
        it: 'Registro di stato',
        en: 'Status register',
      },
      {
        it: 'ALU',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="130" y="16" width="140" height="40" rx="6"/>\n      <line class="dg-line" x1="200" y1="56" x2="200" y2="100"/>\n      <rect class="dg-box" x="130" y="100" width="140" height="40" rx="6"/>\n      <rect class="dg-box" x="370" y="100" width="160" height="40" rx="6"/>\n      <line class="dg-line" x1="270" y1="120" x2="370" y2="120"/>\n      <line class="dg-line" x1="200" y1="140" x2="200" y2="200"/>\n      <line class="dg-line" x1="40" y1="200" x2="580" y2="200"/>\n      <line class="dg-line" x1="180" y1="200" x2="180" y2="235"/>\n      <line class="dg-line" x1="430" y1="200" x2="430" y2="235"/>\n      <rect class="dg-box" x="100" y="235" width="160" height="40" rx="6"/>\n      <rect class="dg-box" x="360" y="235" width="140" height="40" rx="6"/>\n      <line class="dg-line" x1="140" y1="275" x2="140" y2="305"/>\n      <line class="dg-line" x1="220" y1="275" x2="220" y2="305"/>\n      <rect class="dg-box" x="105" y="305" width="70" height="34" rx="4"/>\n      <rect class="dg-box" x="185" y="305" width="70" height="34" rx="4"/>\n      <text class="dg-text" x="140" y="327" font-size="11">Disco</text>\n      <text class="dg-text" x="220" y="327" font-size="11">Disco</text>\n      <line class="dg-line" x1="430" y1="275" x2="430" y2="310"/>\n      <rect class="dg-box" x="360" y="310" width="140" height="38" rx="4"/>',
      en: '<rect class="dg-box" x="130" y="16" width="140" height="40" rx="6"/>\n      <line class="dg-line" x1="200" y1="56" x2="200" y2="100"/>\n      <rect class="dg-box" x="130" y="100" width="140" height="40" rx="6"/>\n      <rect class="dg-box" x="370" y="100" width="160" height="40" rx="6"/>\n      <line class="dg-line" x1="270" y1="120" x2="370" y2="120"/>\n      <line class="dg-line" x1="200" y1="140" x2="200" y2="200"/>\n      <line class="dg-line" x1="40" y1="200" x2="580" y2="200"/>\n      <line class="dg-line" x1="180" y1="200" x2="180" y2="235"/>\n      <line class="dg-line" x1="430" y1="200" x2="430" y2="235"/>\n      <rect class="dg-box" x="100" y="235" width="160" height="40" rx="6"/>\n      <rect class="dg-box" x="360" y="235" width="140" height="40" rx="6"/>\n      <line class="dg-line" x1="140" y1="275" x2="140" y2="305"/>\n      <line class="dg-line" x1="220" y1="275" x2="220" y2="305"/>\n      <rect class="dg-box" x="105" y="305" width="70" height="34" rx="4"/>\n      <rect class="dg-box" x="185" y="305" width="70" height="34" rx="4"/>\n      <text class="dg-text" x="140" y="327" font-size="11">Disk</text>\n      <text class="dg-text" x="220" y="327" font-size="11">Disk</text>\n      <line class="dg-line" x1="430" y1="275" x2="430" y2="310"/>\n      <rect class="dg-box" x="360" y="310" width="140" height="38" rx="4"/>',
    },
  },
  {
    id: 'cache-diretta',
    topic: 'gerarchia-di-memoria',
    width: 620,
    height: 400,
    title: {
      it: 'Cache a mappatura diretta',
      en: 'Direct-mapped cache',
    },
    slots: [
      {
        id: 'cache',
        x: 140,
        y: 30,
        label: {
          it: 'Cache',
        },
      },
      {
        id: 'centrale',
        x: 470,
        y: 30,
        label: {
          it: 'Memoria centrale',
          en: 'Main memory',
        },
      },
      {
        id: 'tag',
        x: 45,
        y: 100,
        label: {
          it: 'Etichetta',
          en: 'Tag',
        },
      },
      {
        id: 'blocco',
        x: 160,
        y: 100,
        label: {
          it: 'Blocco',
          en: 'Block',
        },
      },
      {
        id: 'ftag',
        x: 130,
        y: 350,
        label: {
          it: 'Etichetta',
          en: 'Tag',
        },
      },
      {
        id: 'fblocco',
        x: 265,
        y: 350,
        label: {
          it: 'Blocco',
          en: 'Block',
        },
      },
      {
        id: 'fword',
        x: 375,
        y: 350,
        label: {
          it: 'Parola',
          en: 'Word',
        },
      },
      {
        id: 'ind',
        x: 250,
        y: 388,
        label: {
          it: 'Indirizzo di memoria centrale',
          en: 'Main memory address',
        },
      },
    ],
    distractors: [
      {
        it: 'Gruppo',
        en: 'Set',
      },
      {
        it: 'Frame',
      },
      {
        it: 'Pagina',
        en: 'Page',
      },
      {
        it: 'Spiazzamento di pagina',
        en: 'Page offset',
      },
    ],
    svg: {
      it: '<rect class="dg-group" x="20" y="115" width="230" height="180" rx="8"/>\n      <rect class="dg-box" x="20" y="125" width="60" height="28" rx="3"/>\n      <rect class="dg-box" x="90" y="125" width="150" height="28" rx="3"/>\n      <rect class="dg-box" x="20" y="160" width="60" height="28" rx="3"/>\n      <rect class="dg-box" x="90" y="160" width="150" height="28" rx="3"/>\n      <rect class="dg-box" x="20" y="250" width="60" height="28" rx="3"/>\n      <rect class="dg-box" x="90" y="250" width="150" height="28" rx="3"/>\n      <text class="dg-text" x="160" y="215" font-size="11">⋮</text>\n      <rect class="dg-group" x="380" y="55" width="200" height="245" rx="8"/>\n      <rect class="dg-box" x="395" y="70" width="170" height="26" rx="3"/>\n      <rect class="dg-box" x="395" y="101" width="170" height="26" rx="3"/>\n      <rect class="dg-box" x="395" y="165" width="170" height="26" rx="3"/>\n      <rect class="dg-box" x="395" y="255" width="170" height="26" rx="3"/>\n      <text class="dg-text" x="480" y="147" font-size="11">⋮</text>\n      <text class="dg-text" x="480" y="215" font-size="11">⋮</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="380" y1="178" x2="255" y2="174"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="380" y1="268" x2="255" y2="264"/>\n      <rect class="dg-box" x="70" y="332" width="120" height="28" rx="4"/>\n      <rect class="dg-box" x="200" y="332" width="130" height="28" rx="4"/>\n      <rect class="dg-box" x="340" y="332" width="90" height="28" rx="4"/>\n      <line class="dg-line" x1="70" y1="372" x2="430" y2="372"/>',
      en: '<rect class="dg-group" x="20" y="115" width="230" height="180" rx="8"/>\n      <rect class="dg-box" x="20" y="125" width="60" height="28" rx="3"/>\n      <rect class="dg-box" x="90" y="125" width="150" height="28" rx="3"/>\n      <rect class="dg-box" x="20" y="160" width="60" height="28" rx="3"/>\n      <rect class="dg-box" x="90" y="160" width="150" height="28" rx="3"/>\n      <rect class="dg-box" x="20" y="250" width="60" height="28" rx="3"/>\n      <rect class="dg-box" x="90" y="250" width="150" height="28" rx="3"/>\n      <text class="dg-text" x="160" y="215" font-size="11">⋮</text>\n      <rect class="dg-group" x="380" y="55" width="200" height="245" rx="8"/>\n      <rect class="dg-box" x="395" y="70" width="170" height="26" rx="3"/>\n      <rect class="dg-box" x="395" y="101" width="170" height="26" rx="3"/>\n      <rect class="dg-box" x="395" y="165" width="170" height="26" rx="3"/>\n      <rect class="dg-box" x="395" y="255" width="170" height="26" rx="3"/>\n      <text class="dg-text" x="480" y="147" font-size="11">⋮</text>\n      <text class="dg-text" x="480" y="215" font-size="11">⋮</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="380" y1="178" x2="255" y2="174"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="380" y1="268" x2="255" y2="264"/>\n      <rect class="dg-box" x="70" y="332" width="120" height="28" rx="4"/>\n      <rect class="dg-box" x="200" y="332" width="130" height="28" rx="4"/>\n      <rect class="dg-box" x="340" y="332" width="90" height="28" rx="4"/>\n      <line class="dg-line" x1="70" y1="372" x2="430" y2="372"/>',
    },
  },
  {
    id: 'cache-associativa',
    topic: 'gerarchia-di-memoria',
    width: 620,
    height: 380,
    title: {
      it: 'Cache completamente associativa',
      en: 'Fully associative cache',
    },
    slots: [
      {
        id: 'cache',
        x: 140,
        y: 30,
        label: {
          it: 'Cache',
        },
      },
      {
        id: 'centrale',
        x: 470,
        y: 30,
        label: {
          it: 'Memoria centrale',
          en: 'Main memory',
        },
      },
      {
        id: 'tag',
        x: 45,
        y: 100,
        label: {
          it: 'Etichetta',
          en: 'Tag',
        },
      },
      {
        id: 'blocco',
        x: 160,
        y: 100,
        label: {
          it: 'Blocco',
          en: 'Block',
        },
      },
      {
        id: 'ftag',
        x: 165,
        y: 330,
        label: {
          it: 'Etichetta',
          en: 'Tag',
        },
      },
      {
        id: 'fword',
        x: 340,
        y: 330,
        label: {
          it: 'Parola',
          en: 'Word',
        },
      },
      {
        id: 'ind',
        x: 250,
        y: 366,
        label: {
          it: 'Indirizzo di memoria centrale',
          en: 'Main memory address',
        },
      },
    ],
    distractors: [
      {
        it: 'Gruppo',
        en: 'Set',
      },
      {
        it: 'Indice',
        en: 'Index',
      },
      {
        it: 'Frame',
      },
      {
        it: 'Numero di pagina',
        en: 'Page number',
      },
    ],
    svg: {
      it: '<rect class="dg-group" x="20" y="115" width="230" height="170" rx="8"/>\n      <rect class="dg-box" x="20" y="125" width="60" height="28" rx="3"/>\n      <rect class="dg-box" x="90" y="125" width="150" height="28" rx="3"/>\n      <rect class="dg-box" x="20" y="160" width="60" height="28" rx="3"/>\n      <rect class="dg-box" x="90" y="160" width="150" height="28" rx="3"/>\n      <rect class="dg-box" x="20" y="245" width="60" height="28" rx="3"/>\n      <rect class="dg-box" x="90" y="245" width="150" height="28" rx="3"/>\n      <text class="dg-text" x="160" y="212" font-size="11">⋮</text>\n      <rect class="dg-group" x="380" y="55" width="200" height="235" rx="8"/>\n      <rect class="dg-box" x="395" y="70" width="170" height="26" rx="3"/>\n      <rect class="dg-box" x="395" y="101" width="170" height="26" rx="3"/>\n      <rect class="dg-box" x="395" y="170" width="170" height="26" rx="3"/>\n      <rect class="dg-box" x="395" y="250" width="170" height="26" rx="3"/>\n      <text class="dg-text" x="480" y="150" font-size="11">⋮</text>\n      <text class="dg-text" x="480" y="220" font-size="11">⋮</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="380" y1="183" x2="255" y2="174"/>\n      <text class="dg-text dg-start" x="270" y="300" font-size="10">il blocco può stare in QUALSIASI posizione</text>\n      <rect class="dg-box" x="90" y="312" width="150" height="28" rx="4"/>\n      <rect class="dg-box" x="290" y="312" width="100" height="28" rx="4"/>\n      <line class="dg-line" x1="90" y1="352" x2="390" y2="352"/>',
      en: '<rect class="dg-group" x="20" y="115" width="230" height="170" rx="8"/>\n      <rect class="dg-box" x="20" y="125" width="60" height="28" rx="3"/>\n      <rect class="dg-box" x="90" y="125" width="150" height="28" rx="3"/>\n      <rect class="dg-box" x="20" y="160" width="60" height="28" rx="3"/>\n      <rect class="dg-box" x="90" y="160" width="150" height="28" rx="3"/>\n      <rect class="dg-box" x="20" y="245" width="60" height="28" rx="3"/>\n      <rect class="dg-box" x="90" y="245" width="150" height="28" rx="3"/>\n      <text class="dg-text" x="160" y="212" font-size="11">⋮</text>\n      <rect class="dg-group" x="380" y="55" width="200" height="235" rx="8"/>\n      <rect class="dg-box" x="395" y="70" width="170" height="26" rx="3"/>\n      <rect class="dg-box" x="395" y="101" width="170" height="26" rx="3"/>\n      <rect class="dg-box" x="395" y="170" width="170" height="26" rx="3"/>\n      <rect class="dg-box" x="395" y="250" width="170" height="26" rx="3"/>\n      <text class="dg-text" x="480" y="150" font-size="11">⋮</text>\n      <text class="dg-text" x="480" y="220" font-size="11">⋮</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="380" y1="183" x2="255" y2="174"/>\n      <text class="dg-text dg-start" x="270" y="300" font-size="10">the block can go in ANY position</text>\n      <rect class="dg-box" x="90" y="312" width="150" height="28" rx="4"/>\n      <rect class="dg-box" x="290" y="312" width="100" height="28" rx="4"/>\n      <line class="dg-line" x1="90" y1="352" x2="390" y2="352"/>',
    },
  },
  {
    id: 'memoria-virtuale-org',
    topic: 'memoria-virtuale',
    width: 520,
    height: 420,
    title: {
      it: 'Organizzazione della memoria virtuale',
      en: 'Virtual memory organisation',
    },
    slots: [
      {
        id: 'proc',
        x: 260,
        y: 35,
        label: {
          it: 'Processore',
          en: 'Processor',
        },
      },
      {
        id: 'mmu',
        x: 260,
        y: 130,
        label: {
          it: 'MMU',
        },
      },
      {
        id: 'cache',
        x: 260,
        y: 225,
        label: {
          it: 'Cache',
        },
      },
      {
        id: 'mem',
        x: 260,
        y: 315,
        label: {
          it: 'Memoria principale',
          en: 'Main memory',
        },
      },
      {
        id: 'disk',
        x: 260,
        y: 395,
        label: {
          it: 'Disco',
          en: 'Disk',
        },
      },
    ],
    distractors: [
      {
        it: 'Registro di stato',
        en: 'Status register',
      },
      {
        it: 'ALU',
      },
      {
        it: 'Controllore di interruzione',
        en: 'Interrupt controller',
      },
      {
        it: 'Banco dei registri',
        en: 'Register file',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="170" y="16" width="180" height="40" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="260" y1="56" x2="260" y2="110"/>\n      <text class="dg-text dg-start" x="275" y="88" font-size="10">indirizzo virtuale</text>\n      <rect class="dg-box" x="200" y="110" width="120" height="40" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="260" y1="150" x2="260" y2="205"/>\n      <text class="dg-text dg-start" x="275" y="182" font-size="10">indirizzo fisico</text>\n      <rect class="dg-box" x="170" y="205" width="180" height="40" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="260" y1="245" x2="260" y2="295"/>\n      <rect class="dg-box" x="150" y="295" width="220" height="40" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="260" y1="335" x2="260" y2="375"/>\n      <text class="dg-text dg-start" x="275" y="360" font-size="10">trasferimento DMA</text>\n      <rect class="dg-box" x="180" y="375" width="160" height="40" rx="6"/>\n      <line class="dg-line" x1="120" y1="36" x2="120" y2="315"/>\n      <line class="dg-line" x1="120" y1="36" x2="170" y2="36"/>\n      <line class="dg-line" x1="120" y1="225" x2="170" y2="225"/>\n      <line class="dg-line" x1="120" y1="315" x2="150" y2="315"/>\n      <text class="dg-text dg-start" x="20" y="180" font-size="10">dati</text>',
      en: '<rect class="dg-box" x="170" y="16" width="180" height="40" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="260" y1="56" x2="260" y2="110"/>\n      <text class="dg-text dg-start" x="275" y="88" font-size="10">virtual address</text>\n      <rect class="dg-box" x="200" y="110" width="120" height="40" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="260" y1="150" x2="260" y2="205"/>\n      <text class="dg-text dg-start" x="275" y="182" font-size="10">physical address</text>\n      <rect class="dg-box" x="170" y="205" width="180" height="40" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="260" y1="245" x2="260" y2="295"/>\n      <rect class="dg-box" x="150" y="295" width="220" height="40" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="260" y1="335" x2="260" y2="375"/>\n      <text class="dg-text dg-start" x="275" y="360" font-size="10">DMA transfer</text>\n      <rect class="dg-box" x="180" y="375" width="160" height="40" rx="6"/>\n      <line class="dg-line" x1="120" y1="36" x2="120" y2="315"/>\n      <line class="dg-line" x1="120" y1="36" x2="170" y2="36"/>\n      <line class="dg-line" x1="120" y1="225" x2="170" y2="225"/>\n      <line class="dg-line" x1="120" y1="315" x2="150" y2="315"/>\n      <text class="dg-text dg-start" x="20" y="180" font-size="10">data</text>',
    },
  },
  {
    id: 'sommatore-sottrattore',
    topic: 'aritmetica-hardware',
    width: 620,
    height: 300,
    title: {
      it: 'Circuito di addizione e sottrazione',
      en: 'Addition and subtraction circuit',
    },
    slots: [
      {
        id: 'adder',
        x: 290,
        y: 150,
        label: {
          it: 'Sommatore a n bit',
          en: 'n-bit adder',
        },
      },
      {
        id: 'xor',
        x: 470,
        y: 70,
        label: {
          it: 'Porte XOR di inversione',
          en: 'Inverting XOR gates',
        },
      },
      {
        id: 'ctrl',
        x: 560,
        y: 30,
        label: {
          it: 'Controllo Add/Sub',
          en: 'Add/Sub control',
        },
      },
      {
        id: 'cin',
        x: 555,
        y: 150,
        label: {
          it: 'Riporto entrante',
          en: 'Carry in',
        },
      },
      {
        id: 'cout',
        x: 55,
        y: 150,
        label: {
          it: 'Riporto uscente',
          en: 'Carry out',
        },
      },
      {
        id: 'sum',
        x: 290,
        y: 265,
        label: {
          it: 'Bit di somma',
          en: 'Sum bits',
        },
      },
    ],
    distractors: [
      {
        it: 'Overflow',
      },
      {
        it: 'Moltiplicatore',
        en: 'Multiplier',
      },
      {
        it: 'Registro accumulatore',
        en: 'Accumulator register',
      },
      {
        it: 'Decodificatore',
        en: 'Decoder',
      },
    ],
    svg: {
      it: '<path class="dg-box" d="M120 120 h340 l-40 60 h-260 z"/>\n      <rect class="dg-box" x="410" y="50" width="34" height="34" rx="4"/>\n      <rect class="dg-box" x="460" y="50" width="34" height="34" rx="4"/>\n      <rect class="dg-box" x="510" y="50" width="34" height="34" rx="4"/>\n      <line class="dg-line" x1="427" y1="84" x2="427" y2="120"/>\n      <line class="dg-line" x1="477" y1="84" x2="477" y2="120"/>\n      <line class="dg-line" x1="527" y1="84" x2="527" y2="120"/>\n      <line class="dg-line" x1="560" y1="46" x2="560" y2="67"/>\n      <line class="dg-line" x1="410" y1="67" x2="560" y2="67"/>\n      <line class="dg-line" x1="560" y1="67" x2="560" y2="150"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="560" y1="150" x2="460" y2="150"/>\n      <line class="dg-line" x1="180" y1="90" x2="180" y2="120"/>\n      <line class="dg-line" x1="240" y1="90" x2="240" y2="120"/>\n      <line class="dg-line" x1="300" y1="90" x2="300" y2="120"/>\n      <text class="dg-text dg-start" x="140" y="84" font-size="10">x₀ … x₍ₙ₋₁₎</text>\n      <text class="dg-text dg-start" x="400" y="40" font-size="10">y₀ … y₍ₙ₋₁₎</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="120" y1="150" x2="70" y2="150"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="240" y1="180" x2="240" y2="240"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="290" y1="180" x2="290" y2="240"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="340" y1="180" x2="340" y2="240"/>',
      en: '<path class="dg-box" d="M120 120 h340 l-40 60 h-260 z"/>\n      <rect class="dg-box" x="410" y="50" width="34" height="34" rx="4"/>\n      <rect class="dg-box" x="460" y="50" width="34" height="34" rx="4"/>\n      <rect class="dg-box" x="510" y="50" width="34" height="34" rx="4"/>\n      <line class="dg-line" x1="427" y1="84" x2="427" y2="120"/>\n      <line class="dg-line" x1="477" y1="84" x2="477" y2="120"/>\n      <line class="dg-line" x1="527" y1="84" x2="527" y2="120"/>\n      <line class="dg-line" x1="560" y1="46" x2="560" y2="67"/>\n      <line class="dg-line" x1="410" y1="67" x2="560" y2="67"/>\n      <line class="dg-line" x1="560" y1="67" x2="560" y2="150"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="560" y1="150" x2="460" y2="150"/>\n      <line class="dg-line" x1="180" y1="90" x2="180" y2="120"/>\n      <line class="dg-line" x1="240" y1="90" x2="240" y2="120"/>\n      <line class="dg-line" x1="300" y1="90" x2="300" y2="120"/>\n      <text class="dg-text dg-start" x="140" y="84" font-size="10">x₀ … x₍ₙ₋₁₎</text>\n      <text class="dg-text dg-start" x="400" y="40" font-size="10">y₀ … y₍ₙ₋₁₎</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="120" y1="150" x2="70" y2="150"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="240" y1="180" x2="240" y2="240"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="290" y1="180" x2="290" y2="240"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="340" y1="180" x2="340" y2="240"/>',
    },
  },
  {
    id: 'carry-lookahead',
    topic: 'aritmetica-hardware',
    width: 640,
    height: 320,
    title: {
      it: 'Sommatore con riporto anticipato',
      en: 'Carry-lookahead adder',
    },
    slots: [
      {
        id: 'b3',
        x: 100,
        y: 90,
        label: {
          it: 'Cella B',
          en: 'B cell',
        },
      },
      {
        id: 'b0',
        x: 520,
        y: 90,
        label: {
          it: 'Cella B',
          en: 'B cell',
        },
      },
      {
        id: 'logic',
        x: 320,
        y: 220,
        label: {
          it: 'Logica di riporto anticipato',
          en: 'Carry-lookahead logic',
        },
      },
      {
        id: 'g',
        x: 235,
        y: 290,
        label: {
          it: 'Segnale di generazione G',
          en: 'Generate signal G',
        },
      },
      {
        id: 'p',
        x: 430,
        y: 290,
        label: {
          it: 'Segnale di propagazione P',
          en: 'Propagate signal P',
        },
      },
      {
        id: 'c4',
        x: 55,
        y: 90,
        label: {
          it: 'Riporto uscente',
          en: 'Carry out',
        },
      },
      {
        id: 'c0',
        x: 595,
        y: 90,
        label: {
          it: 'Riporto entrante',
          en: 'Carry in',
        },
      },
    ],
    distractors: [
      {
        it: 'Multiplexer',
      },
      {
        it: 'Registro di stato',
        en: 'Status register',
      },
      {
        it: 'Traboccamento',
        en: 'Overflow',
      },
      {
        it: 'Decodificatore',
        en: 'Decoder',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="60" y="65" width="90" height="50" rx="6"/>\n      <rect class="dg-box" x="200" y="65" width="90" height="50" rx="6"/>\n      <rect class="dg-box" x="340" y="65" width="90" height="50" rx="6"/>\n      <rect class="dg-box" x="480" y="65" width="90" height="50" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="200" y1="90" x2="150" y2="90"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="340" y1="90" x2="290" y2="90"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="480" y1="90" x2="430" y2="90"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="60" y1="90" x2="20" y2="90"/>\n      <line class="dg-line" x1="600" y1="90" x2="570" y2="90"/>\n      <line class="dg-line" x1="80" y1="40" x2="80" y2="65"/>\n      <line class="dg-line" x1="120" y1="40" x2="120" y2="65"/>\n      <line class="dg-line" x1="220" y1="40" x2="220" y2="65"/>\n      <line class="dg-line" x1="260" y1="40" x2="260" y2="65"/>\n      <line class="dg-line" x1="360" y1="40" x2="360" y2="65"/>\n      <line class="dg-line" x1="400" y1="40" x2="400" y2="65"/>\n      <line class="dg-line" x1="500" y1="40" x2="500" y2="65"/>\n      <line class="dg-line" x1="540" y1="40" x2="540" y2="65"/>\n      <line class="dg-line" x1="105" y1="115" x2="105" y2="195"/>\n      <line class="dg-line" x1="245" y1="115" x2="245" y2="195"/>\n      <line class="dg-line" x1="385" y1="115" x2="385" y2="195"/>\n      <line class="dg-line" x1="525" y1="115" x2="525" y2="195"/>\n      <rect class="dg-box" x="60" y="195" width="510" height="50" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="235" y1="245" x2="235" y2="275"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="430" y1="245" x2="430" y2="275"/>\n      <text class="dg-text dg-start" x="20" y="140" font-size="10">s₃ … s₀ (bit di somma)</text>',
      en: '<rect class="dg-box" x="60" y="65" width="90" height="50" rx="6"/>\n      <rect class="dg-box" x="200" y="65" width="90" height="50" rx="6"/>\n      <rect class="dg-box" x="340" y="65" width="90" height="50" rx="6"/>\n      <rect class="dg-box" x="480" y="65" width="90" height="50" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="200" y1="90" x2="150" y2="90"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="340" y1="90" x2="290" y2="90"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="480" y1="90" x2="430" y2="90"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="60" y1="90" x2="20" y2="90"/>\n      <line class="dg-line" x1="600" y1="90" x2="570" y2="90"/>\n      <line class="dg-line" x1="80" y1="40" x2="80" y2="65"/>\n      <line class="dg-line" x1="120" y1="40" x2="120" y2="65"/>\n      <line class="dg-line" x1="220" y1="40" x2="220" y2="65"/>\n      <line class="dg-line" x1="260" y1="40" x2="260" y2="65"/>\n      <line class="dg-line" x1="360" y1="40" x2="360" y2="65"/>\n      <line class="dg-line" x1="400" y1="40" x2="400" y2="65"/>\n      <line class="dg-line" x1="500" y1="40" x2="500" y2="65"/>\n      <line class="dg-line" x1="540" y1="40" x2="540" y2="65"/>\n      <line class="dg-line" x1="105" y1="115" x2="105" y2="195"/>\n      <line class="dg-line" x1="245" y1="115" x2="245" y2="195"/>\n      <line class="dg-line" x1="385" y1="115" x2="385" y2="195"/>\n      <line class="dg-line" x1="525" y1="115" x2="525" y2="195"/>\n      <rect class="dg-box" x="60" y="195" width="510" height="50" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="235" y1="245" x2="235" y2="275"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="430" y1="245" x2="430" y2="275"/>\n      <text class="dg-text dg-start" x="20" y="140" font-size="10">s₃ … s₀ (sum bits)</text>',
    },
  },
  {
    id: 'moltiplicatore-sequenziale',
    topic: 'aritmetica-hardware',
    width: 620,
    height: 340,
    title: {
      it: 'Moltiplicatore binario sequenziale',
      en: 'Sequential binary multiplier',
    },
    slots: [
      {
        id: 'a',
        x: 200,
        y: 45,
        label: {
          it: 'Registro A (prodotto parziale)',
          en: 'Register A (partial product)',
        },
      },
      {
        id: 'q',
        x: 470,
        y: 45,
        label: {
          it: 'Registro Q (moltiplicatore)',
          en: 'Register Q (multiplier)',
        },
      },
      {
        id: 'shift',
        x: 480,
        y: 100,
        label: {
          it: 'Scorrimento a destra',
          en: 'Shift right',
        },
      },
      {
        id: 'adder',
        x: 175,
        y: 185,
        label: {
          it: 'Sommatore a n bit',
          en: 'n-bit adder',
        },
      },
      {
        id: 'mux',
        x: 350,
        y: 185,
        label: {
          it: 'Multiplexer',
        },
      },
      {
        id: 'm',
        x: 200,
        y: 285,
        label: {
          it: 'Registro M (moltiplicando)',
          en: 'Register M (multiplicand)',
        },
      },
      {
        id: 'seq',
        x: 520,
        y: 240,
        label: {
          it: 'Sequenziatore di controllo',
          en: 'Control sequencer',
        },
      },
    ],
    distractors: [
      {
        it: 'Cache',
      },
      {
        it: 'Decodificatore di riga',
        en: 'Row decoder',
      },
      {
        it: 'ALU in virgola mobile',
        en: 'Floating-point ALU',
      },
      {
        it: 'MAR',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="60" y="28" width="40" height="34" rx="4"/>\n      <text class="dg-text" x="80" y="50" font-size="11">C</text>\n      <rect class="dg-box" x="110" y="28" width="180" height="34" rx="4"/>\n      <rect class="dg-box" x="380" y="28" width="180" height="34" rx="4"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="560" y1="45" x2="590" y2="45"/>\n      <line class="dg-line" x1="290" y1="45" x2="380" y2="45"/>\n      <path class="dg-box" d="M100 160 h150 l-25 50 h-100 z"/>\n      <rect class="dg-box" x="300" y="165" width="100" height="40" rx="4"/>\n      <rect class="dg-box" x="110" y="265" width="180" height="40" rx="4"/>\n      <ellipse class="dg-box" cx="520" cy="240" rx="80" ry="45"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="175" y1="160" x2="175" y2="62"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="200" y1="265" x2="200" y2="215"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="300" y1="185" x2="255" y2="185"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="440" y1="215" x2="400" y2="195"/>\n      <line class="dg-line" x1="470" y1="62" x2="470" y2="195"/>\n      <text class="dg-text dg-start" x="300" y="120" font-size="10">controllo somma/non somma</text>',
      en: '<rect class="dg-box" x="60" y="28" width="40" height="34" rx="4"/>\n      <text class="dg-text" x="80" y="50" font-size="11">C</text>\n      <rect class="dg-box" x="110" y="28" width="180" height="34" rx="4"/>\n      <rect class="dg-box" x="380" y="28" width="180" height="34" rx="4"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="560" y1="45" x2="590" y2="45"/>\n      <line class="dg-line" x1="290" y1="45" x2="380" y2="45"/>\n      <path class="dg-box" d="M100 160 h150 l-25 50 h-100 z"/>\n      <rect class="dg-box" x="300" y="165" width="100" height="40" rx="4"/>\n      <rect class="dg-box" x="110" y="265" width="180" height="40" rx="4"/>\n      <ellipse class="dg-box" cx="520" cy="240" rx="80" ry="45"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="175" y1="160" x2="175" y2="62"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="200" y1="265" x2="200" y2="215"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="300" y1="185" x2="255" y2="185"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="440" y1="215" x2="400" y2="195"/>\n      <line class="dg-line" x1="470" y1="62" x2="470" y2="195"/>\n      <text class="dg-text dg-start" x="300" y="120" font-size="10">add/no-add control</text>',
    },
  },
  {
    id: 'divisione-binaria',
    topic: 'aritmetica-hardware',
    width: 620,
    height: 320,
    title: {
      it: 'Circuito per la divisione binaria',
      en: 'Binary division circuit',
    },
    slots: [
      {
        id: 'a',
        x: 175,
        y: 60,
        label: {
          it: 'Registro A (resto parziale)',
          en: 'Register A (partial remainder)',
        },
      },
      {
        id: 'q',
        x: 440,
        y: 60,
        label: {
          it: 'Registro Q (dividendo)',
          en: 'Register Q (dividend)',
        },
      },
      {
        id: 'shift',
        x: 545,
        y: 25,
        label: {
          it: 'Scorrimento a sinistra',
          en: 'Shift left',
        },
      },
      {
        id: 'adder',
        x: 150,
        y: 165,
        label: {
          it: 'Sommatore a n+1 bit',
          en: '(n+1)-bit adder',
        },
      },
      {
        id: 'm',
        x: 200,
        y: 265,
        label: {
          it: 'Registro M (divisore)',
          en: 'Register M (divisor)',
        },
      },
      {
        id: 'seq',
        x: 490,
        y: 200,
        label: {
          it: 'Sequenziatore di controllo',
          en: 'Control sequencer',
        },
      },
      {
        id: 'quot',
        x: 545,
        y: 105,
        label: {
          it: 'Impostazione del quoziente',
          en: 'Quotient setting',
        },
      },
    ],
    distractors: [
      {
        it: 'Moltiplicatore',
        en: 'Multiplier',
      },
      {
        it: 'Normalizzazione',
        en: 'Normalisation',
      },
      {
        it: 'Registro di stato',
        en: 'Status register',
      },
      {
        it: 'Cache',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="70" y="42" width="210" height="36" rx="4"/>\n      <rect class="dg-box" x="340" y="42" width="200" height="36" rx="4"/>\n      <line class="dg-line" x1="280" y1="60" x2="340" y2="60"/>\n      <line class="dg-line" x1="70" y1="25" x2="540" y2="25"/>\n      <line class="dg-line" x1="70" y1="25" x2="70" y2="42"/>\n      <path class="dg-box" d="M90 140 h130 l-25 50 h-80 z"/>\n      <rect class="dg-box" x="110" y="245" width="180" height="40" rx="4"/>\n      <ellipse class="dg-box" cx="490" cy="200" rx="80" ry="45"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="150" y1="140" x2="150" y2="78"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="200" y1="245" x2="200" y2="190"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="410" y1="180" x2="230" y2="170"/>\n      <line class="dg-line" x1="440" y1="78" x2="440" y2="155"/>\n      <text class="dg-text dg-start" x="300" y="135" font-size="10">somma / sottrazione</text>',
      en: '<rect class="dg-box" x="70" y="42" width="210" height="36" rx="4"/>\n      <rect class="dg-box" x="340" y="42" width="200" height="36" rx="4"/>\n      <line class="dg-line" x1="280" y1="60" x2="340" y2="60"/>\n      <line class="dg-line" x1="70" y1="25" x2="540" y2="25"/>\n      <line class="dg-line" x1="70" y1="25" x2="70" y2="42"/>\n      <path class="dg-box" d="M90 140 h130 l-25 50 h-80 z"/>\n      <rect class="dg-box" x="110" y="245" width="180" height="40" rx="4"/>\n      <ellipse class="dg-box" cx="490" cy="200" rx="80" ry="45"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="150" y1="140" x2="150" y2="78"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="200" y1="245" x2="200" y2="190"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="410" y1="180" x2="230" y2="170"/>\n      <line class="dg-line" x1="440" y1="78" x2="440" y2="155"/>\n      <text class="dg-text dg-start" x="300" y="135" font-size="10">add / subtract</text>',
    },
  },
  {
    id: 'ieee-formati',
    topic: 'virgola-mobile',
    width: 640,
    height: 300,
    title: {
      it: 'Formati IEEE in virgola mobile',
      en: 'IEEE floating-point formats',
    },
    slots: [
      {
        id: 's32',
        x: 55,
        y: 75,
        label: {
          it: 'Segno (1 bit)',
          en: 'Sign (1 bit)',
        },
      },
      {
        id: 'e32',
        x: 150,
        y: 75,
        label: {
          it: 'Esponente in eccesso 127 (8 bit)',
          en: 'Excess-127 exponent (8 bits)',
        },
      },
      {
        id: 'm32',
        x: 420,
        y: 75,
        label: {
          it: 'Mantissa (23 bit)',
          en: 'Mantissa (23 bits)',
        },
      },
      {
        id: 's64',
        x: 55,
        y: 215,
        label: {
          it: 'Segno (1 bit)',
          en: 'Sign (1 bit)',
        },
      },
      {
        id: 'e64',
        x: 160,
        y: 215,
        label: {
          it: 'Esponente in eccesso 1023 (11 bit)',
          en: 'Excess-1023 exponent (11 bits)',
        },
      },
      {
        id: 'm64',
        x: 430,
        y: 215,
        label: {
          it: 'Mantissa (52 bit)',
          en: 'Mantissa (52 bits)',
        },
      },
    ],
    distractors: [
      {
        it: 'Bit implicito',
        en: 'Hidden bit',
      },
      {
        it: 'Riporto',
        en: 'Carry',
      },
      {
        it: 'Etichetta',
        en: 'Tag',
      },
      {
        it: 'Spiazzamento',
        en: 'Displacement',
      },
    ],
    svg: {
      it: '<text class="dg-text dg-start" x="20" y="30" font-size="11">Singola precisione — 32 bit</text>\n      <rect class="dg-box" x="30" y="50" width="50" height="40" rx="3"/>\n      <rect class="dg-box" x="80" y="50" width="140" height="40" rx="3"/>\n      <rect class="dg-box" x="220" y="50" width="390" height="40" rx="3"/>\n      <text class="dg-text" x="320" y="120" font-size="11">valore = ± 1,M × 2^(E − 127)</text>\n      <text class="dg-text dg-start" x="20" y="170" font-size="11">Doppia precisione — 64 bit</text>\n      <rect class="dg-box" x="30" y="190" width="50" height="40" rx="3"/>\n      <rect class="dg-box" x="80" y="190" width="160" height="40" rx="3"/>\n      <rect class="dg-box" x="240" y="190" width="370" height="40" rx="3"/>\n      <text class="dg-text" x="320" y="262" font-size="11">valore = ± 1,M × 2^(E − 1023)</text>',
      en: '<text class="dg-text dg-start" x="20" y="30" font-size="11">Single precision — 32 bits</text>\n      <rect class="dg-box" x="30" y="50" width="50" height="40" rx="3"/>\n      <rect class="dg-box" x="80" y="50" width="140" height="40" rx="3"/>\n      <rect class="dg-box" x="220" y="50" width="390" height="40" rx="3"/>\n      <text class="dg-text" x="320" y="120" font-size="11">value = ± 1.M × 2^(E − 127)</text>\n      <text class="dg-text dg-start" x="20" y="170" font-size="11">Double precision — 64 bits</text>\n      <rect class="dg-box" x="30" y="190" width="50" height="40" rx="3"/>\n      <rect class="dg-box" x="80" y="190" width="160" height="40" rx="3"/>\n      <rect class="dg-box" x="240" y="190" width="370" height="40" rx="3"/>\n      <text class="dg-text" x="320" y="262" font-size="11">value = ± 1.M × 2^(E − 1023)</text>',
    },
  },
  {
    id: 'fp-somma',
    topic: 'virgola-mobile',
    width: 620,
    height: 420,
    title: {
      it: 'Unità di addizione in virgola mobile',
      en: 'Floating-point addition unit',
    },
    slots: [
      {
        id: 'sub',
        x: 130,
        y: 45,
        label: {
          it: 'Sottrattore degli esponenti',
          en: 'Exponent subtractor',
        },
      },
      {
        id: 'swap',
        x: 430,
        y: 45,
        label: {
          it: 'Scambio delle mantisse',
          en: 'Mantissa swap',
        },
      },
      {
        id: 'shift',
        x: 430,
        y: 125,
        label: {
          it: 'Scorrimento della mantissa minore',
          en: 'Shift of the smaller mantissa',
        },
      },
      {
        id: 'ctrl',
        x: 130,
        y: 175,
        label: {
          it: 'Rete di controllo',
          en: 'Control network',
        },
      },
      {
        id: 'add',
        x: 430,
        y: 215,
        label: {
          it: 'Sommatore delle mantisse',
          en: 'Mantissa adder',
        },
      },
      {
        id: 'lead',
        x: 250,
        y: 290,
        label: {
          it: 'Rivelatore di zeri iniziali',
          en: 'Leading-zero detector',
        },
      },
      {
        id: 'norm',
        x: 470,
        y: 320,
        label: {
          it: 'Normalizzazione e arrotondamento',
          en: 'Normalisation and rounding',
        },
      },
      {
        id: 'expo',
        x: 130,
        y: 370,
        label: {
          it: 'Esponente del risultato',
          en: 'Result exponent',
        },
      },
    ],
    distractors: [
      {
        it: 'Moltiplicatore',
        en: 'Multiplier',
      },
      {
        it: 'Registro di stato',
        en: 'Status register',
      },
      {
        it: 'Decodificatore',
        en: 'Decoder',
      },
      {
        it: 'Contatore di refresh',
        en: 'Refresh counter',
      },
    ],
    svg: {
      it: '<path class="dg-box" d="M60 25 h140 l-25 40 h-90 z"/>\n      <rect class="dg-box" x="350" y="25" width="160" height="40" rx="6"/>\n      <rect class="dg-box" x="350" y="105" width="160" height="40" rx="6"/>\n      <ellipse class="dg-box" cx="130" cy="175" rx="90" ry="45"/>\n      <path class="dg-box" d="M350 195 h160 l-25 40 h-110 z"/>\n      <rect class="dg-box" x="180" y="270" width="140" height="40" rx="6"/>\n      <rect class="dg-box" x="390" y="300" width="160" height="40" rx="6"/>\n      <path class="dg-box" d="M60 350 h140 l-25 40 h-90 z"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="200" y1="45" x2="350" y2="45"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="430" y1="65" x2="430" y2="105"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="430" y1="145" x2="430" y2="195"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="130" y1="65" x2="130" y2="130"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="220" y1="175" x2="350" y2="215"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="390" y1="235" x2="320" y2="285"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="320" y1="290" x2="390" y2="315"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="180" y1="290" x2="130" y2="345"/>\n      <text class="dg-text dg-start" x="20" y="18" font-size="10">E_A, E_B</text>\n      <text class="dg-text dg-start" x="530" y="18" font-size="10">M_A, M_B</text>',
      en: '<path class="dg-box" d="M60 25 h140 l-25 40 h-90 z"/>\n      <rect class="dg-box" x="350" y="25" width="160" height="40" rx="6"/>\n      <rect class="dg-box" x="350" y="105" width="160" height="40" rx="6"/>\n      <ellipse class="dg-box" cx="130" cy="175" rx="90" ry="45"/>\n      <path class="dg-box" d="M350 195 h160 l-25 40 h-110 z"/>\n      <rect class="dg-box" x="180" y="270" width="140" height="40" rx="6"/>\n      <rect class="dg-box" x="390" y="300" width="160" height="40" rx="6"/>\n      <path class="dg-box" d="M60 350 h140 l-25 40 h-90 z"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="200" y1="45" x2="350" y2="45"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="430" y1="65" x2="430" y2="105"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="430" y1="145" x2="430" y2="195"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="130" y1="65" x2="130" y2="130"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="220" y1="175" x2="350" y2="215"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="390" y1="235" x2="320" y2="285"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="320" y1="290" x2="390" y2="315"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="180" y1="290" x2="130" y2="345"/>\n      <text class="dg-text dg-start" x="20" y="18" font-size="10">E_A, E_B</text>\n      <text class="dg-text dg-start" x="530" y="18" font-size="10">M_A, M_B</text>',
    },
  },
  {
    id: 'soc-blocchi',
    topic: 'input-output',
    width: 640,
    height: 340,
    title: {
      it: 'Sistema su singolo chip (SoC)',
      en: 'System on a chip (SoC)',
    },
    slots: [
      {
        id: 'proc',
        x: 90,
        y: 45,
        label: {
          it: 'Processore',
          en: 'Processor',
        },
      },
      {
        id: 'mem',
        x: 250,
        y: 45,
        label: {
          it: 'Memoria su chip',
          en: 'On-chip memory',
        },
      },
      {
        id: 'timer',
        x: 410,
        y: 45,
        label: {
          it: 'Timer',
        },
      },
      {
        id: 'irqc',
        x: 560,
        y: 45,
        label: {
          it: 'Controllore delle interruzioni',
          en: 'Interrupt controller',
        },
      },
      {
        id: 'net',
        x: 320,
        y: 140,
        label: {
          it: 'Rete di interconnessione',
          en: 'Interconnection network',
        },
      },
      {
        id: 'pio',
        x: 110,
        y: 215,
        label: {
          it: 'Interfaccia parallela',
          en: 'Parallel interface',
        },
      },
      {
        id: 'adc',
        x: 400,
        y: 215,
        label: {
          it: 'Convertitore A/D',
          en: 'A/D converter',
        },
      },
      {
        id: 'sensore',
        x: 400,
        y: 285,
        label: {
          it: 'Sensore',
          en: 'Sensor',
        },
      },
    ],
    distractors: [
      {
        it: 'Controllore DMA',
        en: 'DMA controller',
      },
      {
        it: 'Cache',
      },
      {
        it: 'TLB',
      },
      {
        it: 'Ponte PCI',
        en: 'PCI bridge',
      },
    ],
    svg: {
      it: '<rect class="dg-group" x="20" y="20" width="600" height="200" rx="10"/>\n      <rect class="dg-box" x="35" y="25" width="110" height="40" rx="6"/>\n      <rect class="dg-box" x="185" y="25" width="130" height="40" rx="6"/>\n      <rect class="dg-box" x="350" y="25" width="120" height="40" rx="6"/>\n      <rect class="dg-box" x="500" y="25" width="120" height="40" rx="6"/>\n      <line class="dg-line" x1="90" y1="65" x2="90" y2="120"/>\n      <line class="dg-line" x1="250" y1="65" x2="250" y2="120"/>\n      <line class="dg-line" x1="410" y1="65" x2="410" y2="120"/>\n      <line class="dg-line" x1="560" y1="65" x2="560" y2="120"/>\n      <rect class="dg-box" x="35" y="120" width="585" height="40" rx="6"/>\n      <rect class="dg-box" x="45" y="195" width="130" height="40" rx="4"/>\n      <rect class="dg-box" x="200" y="195" width="110" height="40" rx="4"/>\n      <rect class="dg-box" x="335" y="195" width="130" height="40" rx="4"/>\n      <rect class="dg-box" x="490" y="195" width="130" height="40" rx="4"/>\n      <line class="dg-line" x1="110" y1="160" x2="110" y2="195"/>\n      <line class="dg-line" x1="255" y1="160" x2="255" y2="195"/>\n      <line class="dg-line" x1="400" y1="160" x2="400" y2="195"/>\n      <line class="dg-line" x1="555" y1="160" x2="555" y2="195"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="400" y1="235" x2="400" y2="265"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="555" y1="235" x2="555" y2="265"/>\n      <rect class="dg-box" x="330" y="265" width="140" height="38" rx="4"/>\n      <rect class="dg-box" x="500" y="265" width="130" height="38" rx="4"/>\n      <text class="dg-text" x="255" y="222" font-size="10">seriale</text>\n      <text class="dg-text" x="555" y="222" font-size="10">D/A</text>\n      <text class="dg-text" x="565" y="289" font-size="10">attuatore</text>\n      <text class="dg-text dg-start" x="30" y="15" font-size="10">un solo chip</text>',
      en: '<rect class="dg-group" x="20" y="20" width="600" height="200" rx="10"/>\n      <rect class="dg-box" x="35" y="25" width="110" height="40" rx="6"/>\n      <rect class="dg-box" x="185" y="25" width="130" height="40" rx="6"/>\n      <rect class="dg-box" x="350" y="25" width="120" height="40" rx="6"/>\n      <rect class="dg-box" x="500" y="25" width="120" height="40" rx="6"/>\n      <line class="dg-line" x1="90" y1="65" x2="90" y2="120"/>\n      <line class="dg-line" x1="250" y1="65" x2="250" y2="120"/>\n      <line class="dg-line" x1="410" y1="65" x2="410" y2="120"/>\n      <line class="dg-line" x1="560" y1="65" x2="560" y2="120"/>\n      <rect class="dg-box" x="35" y="120" width="585" height="40" rx="6"/>\n      <rect class="dg-box" x="45" y="195" width="130" height="40" rx="4"/>\n      <rect class="dg-box" x="200" y="195" width="110" height="40" rx="4"/>\n      <rect class="dg-box" x="335" y="195" width="130" height="40" rx="4"/>\n      <rect class="dg-box" x="490" y="195" width="130" height="40" rx="4"/>\n      <line class="dg-line" x1="110" y1="160" x2="110" y2="195"/>\n      <line class="dg-line" x1="255" y1="160" x2="255" y2="195"/>\n      <line class="dg-line" x1="400" y1="160" x2="400" y2="195"/>\n      <line class="dg-line" x1="555" y1="160" x2="555" y2="195"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="400" y1="235" x2="400" y2="265"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="555" y1="235" x2="555" y2="265"/>\n      <rect class="dg-box" x="330" y="265" width="140" height="38" rx="4"/>\n      <rect class="dg-box" x="500" y="265" width="130" height="38" rx="4"/>\n      <text class="dg-text" x="255" y="222" font-size="10">serial</text>\n      <text class="dg-text" x="555" y="222" font-size="10">D/A</text>\n      <text class="dg-text" x="565" y="289" font-size="10">actuator</text>\n      <text class="dg-text dg-start" x="30" y="15" font-size="10">a single chip</text>',
    },
  },
  {
    id: 'multiprocessore-uma',
    topic: 'prestazioni-e-parallelismo',
    width: 620,
    height: 300,
    title: {
      it: 'Multiprocessore a memoria condivisa (UMA)',
      en: 'Shared-memory multiprocessor (UMA)',
    },
    slots: [
      {
        id: 'p1',
        x: 110,
        y: 40,
        label: {
          it: 'Processore',
          en: 'Processor',
        },
      },
      {
        id: 'pn',
        x: 500,
        y: 40,
        label: {
          it: 'Processore',
          en: 'Processor',
        },
      },
      {
        id: 'net',
        x: 310,
        y: 150,
        label: {
          it: 'Rete di interconnessione',
          en: 'Interconnection network',
        },
      },
      {
        id: 'm1',
        x: 110,
        y: 260,
        label: {
          it: 'Memoria',
          en: 'Memory',
        },
      },
      {
        id: 'mn',
        x: 500,
        y: 260,
        label: {
          it: 'Memoria',
          en: 'Memory',
        },
      },
    ],
    distractors: [
      {
        it: 'Cache privata',
        en: 'Private cache',
      },
      {
        it: 'Controllore DMA',
        en: 'DMA controller',
      },
      {
        it: 'Bus PCI',
        en: 'PCI bus',
      },
      {
        it: 'Unità di controllo',
        en: 'Control unit',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="60" y="20" width="100" height="40" rx="6"/>\n      <rect class="dg-box" x="240" y="20" width="100" height="40" rx="6"/>\n      <rect class="dg-box" x="450" y="20" width="100" height="40" rx="6"/>\n      <text class="dg-text" x="395" y="45" font-size="14">· · ·</text>\n      <ellipse class="dg-box" cx="310" cy="150" rx="270" ry="42"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="110" y1="60" x2="110" y2="120"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="290" y1="60" x2="290" y2="112"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="500" y1="60" x2="500" y2="120"/>\n      <rect class="dg-box" x="60" y="240" width="100" height="40" rx="6"/>\n      <rect class="dg-box" x="240" y="240" width="100" height="40" rx="6"/>\n      <rect class="dg-box" x="450" y="240" width="100" height="40" rx="6"/>\n      <text class="dg-text" x="395" y="265" font-size="14">· · ·</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="110" y1="182" x2="110" y2="240"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="290" y1="188" x2="290" y2="240"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="500" y1="182" x2="500" y2="240"/>',
      en: '<rect class="dg-box" x="60" y="20" width="100" height="40" rx="6"/>\n      <rect class="dg-box" x="240" y="20" width="100" height="40" rx="6"/>\n      <rect class="dg-box" x="450" y="20" width="100" height="40" rx="6"/>\n      <text class="dg-text" x="395" y="45" font-size="14">· · ·</text>\n      <ellipse class="dg-box" cx="310" cy="150" rx="270" ry="42"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="110" y1="60" x2="110" y2="120"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="290" y1="60" x2="290" y2="112"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="500" y1="60" x2="500" y2="120"/>\n      <rect class="dg-box" x="60" y="240" width="100" height="40" rx="6"/>\n      <rect class="dg-box" x="240" y="240" width="100" height="40" rx="6"/>\n      <rect class="dg-box" x="450" y="240" width="100" height="40" rx="6"/>\n      <text class="dg-text" x="395" y="265" font-size="14">· · ·</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="110" y1="182" x2="110" y2="240"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="290" y1="188" x2="290" y2="240"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="500" y1="182" x2="500" y2="240"/>',
    },
  },
  {
    id: 'cmos-struttura',
    topic: 'tempi-e-tecnologia',
    width: 520,
    height: 340,
    title: {
      it: 'Struttura di un circuito CMOS',
      en: 'Structure of a CMOS circuit',
    },
    slots: [
      {
        id: 'pu',
        x: 300,
        y: 90,
        label: {
          it: 'Rete di pull-up (pMOS)',
          en: 'Pull-up network (pMOS)',
        },
      },
      {
        id: 'pd',
        x: 300,
        y: 240,
        label: {
          it: 'Rete di pull-down (nMOS)',
          en: 'Pull-down network (nMOS)',
        },
      },
      {
        id: 'vdd',
        x: 300,
        y: 25,
        label: {
          it: 'Alimentazione',
          en: 'Supply',
        },
      },
      {
        id: 'gnd',
        x: 300,
        y: 315,
        label: {
          it: 'Massa',
          en: 'Ground',
        },
      },
      {
        id: 'out',
        x: 460,
        y: 165,
        label: {
          it: 'Uscita',
          en: 'Output',
        },
      },
      {
        id: 'in',
        x: 60,
        y: 165,
        label: {
          it: 'Ingressi',
          en: 'Inputs',
        },
      },
    ],
    distractors: [
      {
        it: 'Condensatore di memoria',
        en: 'Storage capacitor',
      },
      {
        it: 'Resistenza di carico',
        en: 'Load resistor',
      },
      {
        it: 'Clock',
      },
      {
        it: 'Riporto',
        en: 'Carry',
      },
    ],
    svg: {
      it: '<line class="dg-line" x1="180" y1="45" x2="420" y2="45"/>\n      <line class="dg-line" x1="300" y1="45" x2="300" y2="65"/>\n      <rect class="dg-box" x="200" y="65" width="200" height="50" rx="6"/>\n      <line class="dg-line" x1="300" y1="115" x2="300" y2="215"/>\n      <rect class="dg-box" x="200" y="215" width="200" height="50" rx="6"/>\n      <line class="dg-line" x1="300" y1="265" x2="300" y2="295"/>\n      <line class="dg-line" x1="240" y1="295" x2="360" y2="295"/>\n      <line class="dg-line" x1="260" y1="305" x2="340" y2="305"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="300" y1="165" x2="420" y2="165"/>\n      <line class="dg-line" x1="120" y1="90" x2="200" y2="90"/>\n      <line class="dg-line" x1="120" y1="240" x2="200" y2="240"/>\n      <line class="dg-line" x1="120" y1="90" x2="120" y2="240"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="90" y1="165" x2="120" y2="165"/>',
      en: '<line class="dg-line" x1="180" y1="45" x2="420" y2="45"/>\n      <line class="dg-line" x1="300" y1="45" x2="300" y2="65"/>\n      <rect class="dg-box" x="200" y="65" width="200" height="50" rx="6"/>\n      <line class="dg-line" x1="300" y1="115" x2="300" y2="215"/>\n      <rect class="dg-box" x="200" y="215" width="200" height="50" rx="6"/>\n      <line class="dg-line" x1="300" y1="265" x2="300" y2="295"/>\n      <line class="dg-line" x1="240" y1="295" x2="360" y2="295"/>\n      <line class="dg-line" x1="260" y1="305" x2="340" y2="305"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="300" y1="165" x2="420" y2="165"/>\n      <line class="dg-line" x1="120" y1="90" x2="200" y2="90"/>\n      <line class="dg-line" x1="120" y1="240" x2="200" y2="240"/>\n      <line class="dg-line" x1="120" y1="90" x2="120" y2="240"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="90" y1="165" x2="120" y2="165"/>',
    },
  },
  {
    id: 'master-slave',
    topic: 'circuiti-sequenziali',
    width: 620,
    height: 280,
    title: {
      it: 'Flip-flop D master-slave',
      en: 'Master-slave D flip-flop',
    },
    slots: [
      {
        id: 'master',
        x: 230,
        y: 45,
        label: {
          it: 'Master',
        },
      },
      {
        id: 'slave',
        x: 430,
        y: 45,
        label: {
          it: 'Slave',
        },
      },
      {
        id: 'd',
        x: 45,
        y: 105,
        label: {
          it: 'Ingresso D',
          en: 'D input',
        },
      },
      {
        id: 'clk',
        x: 55,
        y: 220,
        label: {
          it: 'Clock',
        },
      },
      {
        id: 'inv',
        x: 330,
        y: 220,
        label: {
          it: 'Invertitore del clock',
          en: 'Clock inverter',
        },
      },
      {
        id: 'q',
        x: 575,
        y: 105,
        label: {
          it: 'Uscita Q',
          en: 'Q output',
        },
      },
    ],
    distractors: [
      {
        it: 'Preset',
      },
      {
        it: 'Clear',
      },
      {
        it: 'Abilitazione',
        en: 'Enable',
      },
      {
        it: 'Riporto',
        en: 'Carry',
      },
    ],
    svg: {
      it: '<rect class="dg-group" x="140" y="25" width="360" height="140" rx="10"/>\n      <rect class="dg-box" x="170" y="70" width="120" height="80" rx="6"/>\n      <rect class="dg-box" x="370" y="70" width="120" height="80" rx="6"/>\n      <text class="dg-text dg-start" x="178" y="95" font-size="11">D      Q</text>\n      <text class="dg-text dg-start" x="178" y="140" font-size="11">Clk</text>\n      <text class="dg-text dg-start" x="378" y="95" font-size="11">D      Q</text>\n      <text class="dg-text dg-start" x="378" y="140" font-size="11">Clk</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="80" y1="105" x2="170" y2="105"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="290" y1="105" x2="370" y2="105"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="490" y1="105" x2="545" y2="105"/>\n      <line class="dg-line" x1="90" y1="220" x2="230" y2="220"/>\n      <line class="dg-line" x1="230" y1="220" x2="230" y2="150"/>\n      <line class="dg-line" x1="290" y1="220" x2="380" y2="220"/>\n      <line class="dg-line" x1="430" y1="220" x2="430" y2="150"/>\n      <text class="dg-text dg-start" x="180" y="200" font-size="10">clock diretto</text>\n      <text class="dg-text dg-start" x="390" y="200" font-size="10">clock invertito</text>',
      en: '<rect class="dg-group" x="140" y="25" width="360" height="140" rx="10"/>\n      <rect class="dg-box" x="170" y="70" width="120" height="80" rx="6"/>\n      <rect class="dg-box" x="370" y="70" width="120" height="80" rx="6"/>\n      <text class="dg-text dg-start" x="178" y="95" font-size="11">D      Q</text>\n      <text class="dg-text dg-start" x="178" y="140" font-size="11">Clk</text>\n      <text class="dg-text dg-start" x="378" y="95" font-size="11">D      Q</text>\n      <text class="dg-text dg-start" x="378" y="140" font-size="11">Clk</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="80" y1="105" x2="170" y2="105"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="290" y1="105" x2="370" y2="105"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="490" y1="105" x2="545" y2="105"/>\n      <line class="dg-line" x1="90" y1="220" x2="230" y2="220"/>\n      <line class="dg-line" x1="230" y1="220" x2="230" y2="150"/>\n      <line class="dg-line" x1="290" y1="220" x2="380" y2="220"/>\n      <line class="dg-line" x1="430" y1="220" x2="430" y2="150"/>\n      <text class="dg-text dg-start" x="180" y="200" font-size="10">direct clock</text>\n      <text class="dg-text dg-start" x="390" y="200" font-size="10">inverted clock</text>',
    },
  },
  {
    id: 'registro-scorrimento',
    topic: 'circuiti-sequenziali',
    width: 640,
    height: 240,
    title: {
      it: 'Registro a scorrimento',
      en: 'Shift register',
    },
    slots: [
      {
        id: 'in',
        x: 45,
        y: 70,
        label: {
          it: 'Ingresso seriale',
          en: 'Serial input',
        },
      },
      {
        id: 'f1',
        x: 145,
        y: 70,
        label: {
          it: 'Flip-flop D',
        },
      },
      {
        id: 'f4',
        x: 505,
        y: 70,
        label: {
          it: 'Flip-flop D',
        },
      },
      {
        id: 'out',
        x: 595,
        y: 70,
        label: {
          it: 'Uscita seriale',
          en: 'Serial output',
        },
      },
      {
        id: 'clk',
        x: 55,
        y: 185,
        label: {
          it: 'Clock',
        },
      },
    ],
    distractors: [
      {
        it: 'Latch trasparente',
        en: 'Transparent latch',
      },
      {
        it: 'Contatore',
        en: 'Counter',
      },
      {
        it: 'Decodificatore',
        en: 'Decoder',
      },
      {
        it: 'Multiplexer',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="100" y="45" width="90" height="70" rx="6"/>\n      <rect class="dg-box" x="220" y="45" width="90" height="70" rx="6"/>\n      <rect class="dg-box" x="340" y="45" width="90" height="70" rx="6"/>\n      <rect class="dg-box" x="460" y="45" width="90" height="70" rx="6"/>\n      <text class="dg-text dg-start" x="108" y="68" font-size="11">D    Q</text>\n      <text class="dg-text dg-start" x="228" y="68" font-size="11">D    Q</text>\n      <text class="dg-text dg-start" x="348" y="68" font-size="11">D    Q</text>\n      <text class="dg-text dg-start" x="468" y="68" font-size="11">D    Q</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="70" y1="70" x2="100" y2="70"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="190" y1="70" x2="220" y2="70"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="310" y1="70" x2="340" y2="70"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="430" y1="70" x2="460" y2="70"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="550" y1="70" x2="575" y2="70"/>\n      <line class="dg-line" x1="90" y1="185" x2="560" y2="185"/>\n      <line class="dg-line" x1="145" y1="185" x2="145" y2="115"/>\n      <line class="dg-line" x1="265" y1="185" x2="265" y2="115"/>\n      <line class="dg-line" x1="385" y1="185" x2="385" y2="115"/>\n      <line class="dg-line" x1="505" y1="185" x2="505" y2="115"/>',
      en: '<rect class="dg-box" x="100" y="45" width="90" height="70" rx="6"/>\n      <rect class="dg-box" x="220" y="45" width="90" height="70" rx="6"/>\n      <rect class="dg-box" x="340" y="45" width="90" height="70" rx="6"/>\n      <rect class="dg-box" x="460" y="45" width="90" height="70" rx="6"/>\n      <text class="dg-text dg-start" x="108" y="68" font-size="11">D    Q</text>\n      <text class="dg-text dg-start" x="228" y="68" font-size="11">D    Q</text>\n      <text class="dg-text dg-start" x="348" y="68" font-size="11">D    Q</text>\n      <text class="dg-text dg-start" x="468" y="68" font-size="11">D    Q</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="70" y1="70" x2="100" y2="70"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="190" y1="70" x2="220" y2="70"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="310" y1="70" x2="340" y2="70"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="430" y1="70" x2="460" y2="70"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="550" y1="70" x2="575" y2="70"/>\n      <line class="dg-line" x1="90" y1="185" x2="560" y2="185"/>\n      <line class="dg-line" x1="145" y1="185" x2="145" y2="115"/>\n      <line class="dg-line" x1="265" y1="185" x2="265" y2="115"/>\n      <line class="dg-line" x1="385" y1="185" x2="385" y2="115"/>\n      <line class="dg-line" x1="505" y1="185" x2="505" y2="115"/>',
    },
  },
  {
    id: 'contatore-3bit',
    topic: 'circuiti-sequenziali',
    width: 620,
    height: 250,
    title: {
      it: 'Contatore binario a 3 bit',
      en: '3-bit binary counter',
    },
    slots: [
      {
        id: 'one',
        x: 45,
        y: 60,
        label: {
          it: 'Ingresso costante 1',
          en: 'Constant input 1',
        },
      },
      {
        id: 'f0',
        x: 150,
        y: 60,
        label: {
          it: 'Flip-flop T',
        },
      },
      {
        id: 'q0',
        x: 240,
        y: 145,
        label: {
          it: 'Q₀ (bit meno significativo)',
          en: 'Q₀ (least significant bit)',
        },
      },
      {
        id: 'q2',
        x: 545,
        y: 145,
        label: {
          it: 'Q₂ (bit più significativo)',
          en: 'Q₂ (most significant bit)',
        },
      },
      {
        id: 'clk',
        x: 55,
        y: 200,
        label: {
          it: 'Clock',
        },
      },
    ],
    distractors: [
      {
        it: 'Registro a scorrimento',
        en: 'Shift register',
      },
      {
        it: 'Decodificatore',
        en: 'Decoder',
      },
      {
        it: 'Azzeramento asincrono',
        en: 'Asynchronous reset',
      },
      {
        it: 'Multiplexer',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="100" y="35" width="100" height="70" rx="6"/>\n      <rect class="dg-box" x="270" y="35" width="100" height="70" rx="6"/>\n      <rect class="dg-box" x="440" y="35" width="100" height="70" rx="6"/>\n      <text class="dg-text dg-start" x="108" y="58" font-size="11">T    Q</text>\n      <text class="dg-text dg-start" x="278" y="58" font-size="11">T    Q</text>\n      <text class="dg-text dg-start" x="448" y="58" font-size="11">T    Q</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="70" y1="60" x2="100" y2="60"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="200" y1="60" x2="270" y2="60"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="370" y1="60" x2="440" y2="60"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="200" y1="105" x2="200" y2="130"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="370" y1="105" x2="370" y2="130"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="540" y1="105" x2="540" y2="130"/>\n      <line class="dg-line" x1="90" y1="200" x2="560" y2="200"/>\n      <line class="dg-line" x1="150" y1="200" x2="150" y2="105"/>\n      <line class="dg-line" x1="320" y1="200" x2="320" y2="105"/>\n      <line class="dg-line" x1="490" y1="200" x2="490" y2="105"/>',
      en: '<rect class="dg-box" x="100" y="35" width="100" height="70" rx="6"/>\n      <rect class="dg-box" x="270" y="35" width="100" height="70" rx="6"/>\n      <rect class="dg-box" x="440" y="35" width="100" height="70" rx="6"/>\n      <text class="dg-text dg-start" x="108" y="58" font-size="11">T    Q</text>\n      <text class="dg-text dg-start" x="278" y="58" font-size="11">T    Q</text>\n      <text class="dg-text dg-start" x="448" y="58" font-size="11">T    Q</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="70" y1="60" x2="100" y2="60"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="200" y1="60" x2="270" y2="60"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="370" y1="60" x2="440" y2="60"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="200" y1="105" x2="200" y2="130"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="370" y1="105" x2="370" y2="130"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="540" y1="105" x2="540" y2="130"/>\n      <line class="dg-line" x1="90" y1="200" x2="560" y2="200"/>\n      <line class="dg-line" x1="150" y1="200" x2="150" y2="105"/>\n      <line class="dg-line" x1="320" y1="200" x2="320" y2="105"/>\n      <line class="dg-line" x1="490" y1="200" x2="490" y2="105"/>',
    },
  },
  {
    id: 'decoder-2-4',
    topic: 'reti-combinatorie',
    width: 560,
    height: 330,
    title: {
      it: 'Decodificatore a due ingressi e quattro uscite',
      en: 'Two-input, four-output decoder',
    },
    slots: [
      {
        id: 'x1',
        x: 40,
        y: 40,
        label: {
          it: 'Ingresso x₁',
          en: 'Input x₁',
        },
      },
      {
        id: 'x2',
        x: 40,
        y: 290,
        label: {
          it: 'Ingresso x₂',
          en: 'Input x₂',
        },
      },
      {
        id: 'inv',
        x: 175,
        y: 165,
        label: {
          it: 'Invertitori',
          en: 'Inverters',
        },
      },
      {
        id: 'and',
        x: 330,
        y: 165,
        label: {
          it: 'Porte AND',
          en: 'AND gates',
        },
      },
      {
        id: 'out',
        x: 505,
        y: 165,
        label: {
          it: 'Uscite (una sola attiva)',
          en: 'Outputs (only one active)',
        },
      },
    ],
    distractors: [
      {
        it: 'Multiplexer',
      },
      {
        it: 'Buffer tri-state',
      },
      {
        it: 'Flip-flop',
      },
      {
        it: 'Sommatore',
        en: 'Adder',
      },
    ],
    svg: {
      it: '<line class="dg-line" x1="70" y1="40" x2="200" y2="40"/>\n      <line class="dg-line" x1="70" y1="290" x2="200" y2="290"/>\n      <path class="dg-box" d="M150 145 h40 l16 20 l-16 20 h-40 z"/>\n      <path class="dg-box" d="M150 205 h40 l16 20 l-16 20 h-40 z"/>\n      <rect class="dg-box" x="290" y="40" width="80" height="42" rx="20"/>\n      <rect class="dg-box" x="290" y="112" width="80" height="42" rx="20"/>\n      <rect class="dg-box" x="290" y="184" width="80" height="42" rx="20"/>\n      <rect class="dg-box" x="290" y="256" width="80" height="42" rx="20"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="370" y1="61" x2="450" y2="61"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="370" y1="133" x2="450" y2="133"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="370" y1="205" x2="450" y2="205"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="370" y1="277" x2="450" y2="277"/>\n      <line class="dg-line" x1="230" y1="61" x2="290" y2="61"/>\n      <line class="dg-line" x1="230" y1="133" x2="290" y2="133"/>\n      <line class="dg-line" x1="230" y1="205" x2="290" y2="205"/>\n      <line class="dg-line" x1="230" y1="277" x2="290" y2="277"/>\n      <text class="dg-text dg-start" x="460" y="65" font-size="10">0</text>\n      <text class="dg-text dg-start" x="460" y="137" font-size="10">1</text>\n      <text class="dg-text dg-start" x="460" y="209" font-size="10">2</text>\n      <text class="dg-text dg-start" x="460" y="281" font-size="10">3</text>',
      en: '<line class="dg-line" x1="70" y1="40" x2="200" y2="40"/>\n      <line class="dg-line" x1="70" y1="290" x2="200" y2="290"/>\n      <path class="dg-box" d="M150 145 h40 l16 20 l-16 20 h-40 z"/>\n      <path class="dg-box" d="M150 205 h40 l16 20 l-16 20 h-40 z"/>\n      <rect class="dg-box" x="290" y="40" width="80" height="42" rx="20"/>\n      <rect class="dg-box" x="290" y="112" width="80" height="42" rx="20"/>\n      <rect class="dg-box" x="290" y="184" width="80" height="42" rx="20"/>\n      <rect class="dg-box" x="290" y="256" width="80" height="42" rx="20"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="370" y1="61" x2="450" y2="61"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="370" y1="133" x2="450" y2="133"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="370" y1="205" x2="450" y2="205"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="370" y1="277" x2="450" y2="277"/>\n      <line class="dg-line" x1="230" y1="61" x2="290" y2="61"/>\n      <line class="dg-line" x1="230" y1="133" x2="290" y2="133"/>\n      <line class="dg-line" x1="230" y1="205" x2="290" y2="205"/>\n      <line class="dg-line" x1="230" y1="277" x2="290" y2="277"/>\n      <text class="dg-text dg-start" x="460" y="65" font-size="10">0</text>\n      <text class="dg-text dg-start" x="460" y="137" font-size="10">1</text>\n      <text class="dg-text dg-start" x="460" y="209" font-size="10">2</text>\n      <text class="dg-text dg-start" x="460" y="281" font-size="10">3</text>',
    },
  },
  {
    id: 'mux-4-1',
    topic: 'reti-combinatorie',
    width: 560,
    height: 320,
    title: {
      it: 'Multiplexer a quattro ingressi',
      en: 'Four-input multiplexer',
    },
    slots: [
      {
        id: 'data',
        x: 65,
        y: 130,
        label: {
          it: 'Ingressi dati',
          en: 'Data inputs',
        },
      },
      {
        id: 'mux',
        x: 300,
        y: 130,
        label: {
          it: 'Multiplexer',
        },
      },
      {
        id: 'out',
        x: 500,
        y: 130,
        label: {
          it: 'Uscita z',
          en: 'Output z',
        },
      },
      {
        id: 'sel',
        x: 300,
        y: 280,
        label: {
          it: 'Ingressi di selezione',
          en: 'Select inputs',
        },
      },
    ],
    distractors: [
      {
        it: 'Decodificatore',
        en: 'Decoder',
      },
      {
        it: 'Buffer tri-state',
      },
      {
        it: 'Registro',
        en: 'Register',
      },
      {
        it: 'Sommatore completo',
        en: 'Full adder',
      },
    ],
    svg: {
      it: '<path class="dg-box" d="M230 45 h140 l-25 170 h-90 z"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="120" y1="70" x2="230" y2="70"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="120" y1="110" x2="230" y2="110"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="120" y1="150" x2="230" y2="150"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="120" y1="190" x2="230" y2="190"/>\n      <text class="dg-text dg-start" x="90" y="74" font-size="10">x₁</text>\n      <text class="dg-text dg-start" x="90" y="114" font-size="10">x₂</text>\n      <text class="dg-text dg-start" x="90" y="154" font-size="10">x₃</text>\n      <text class="dg-text dg-start" x="90" y="194" font-size="10">x₄</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="370" y1="130" x2="460" y2="130"/>\n      <line class="dg-line" x1="275" y1="215" x2="275" y2="255"/>\n      <line class="dg-line" x1="325" y1="215" x2="325" y2="255"/>\n      <text class="dg-text dg-start" x="262" y="248" font-size="10">w₁</text>\n      <text class="dg-text dg-start" x="330" y="248" font-size="10">w₂</text>',
      en: '<path class="dg-box" d="M230 45 h140 l-25 170 h-90 z"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="120" y1="70" x2="230" y2="70"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="120" y1="110" x2="230" y2="110"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="120" y1="150" x2="230" y2="150"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="120" y1="190" x2="230" y2="190"/>\n      <text class="dg-text dg-start" x="90" y="74" font-size="10">x₁</text>\n      <text class="dg-text dg-start" x="90" y="114" font-size="10">x₂</text>\n      <text class="dg-text dg-start" x="90" y="154" font-size="10">x₃</text>\n      <text class="dg-text dg-start" x="90" y="194" font-size="10">x₄</text>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="370" y1="130" x2="460" y2="130"/>\n      <line class="dg-line" x1="275" y1="215" x2="275" y2="255"/>\n      <line class="dg-line" x1="325" y1="215" x2="325" y2="255"/>\n      <text class="dg-text dg-start" x="262" y="248" font-size="10">w₁</text>\n      <text class="dg-text dg-start" x="330" y="248" font-size="10">w₂</text>',
    },
  },
  {
    id: 'pld-blocchi',
    topic: 'tempi-e-tecnologia',
    width: 640,
    height: 280,
    title: {
      it: 'Schema a blocchi di un PLD',
      en: 'Block diagram of a PLD',
    },
    slots: [
      {
        id: 'in',
        x: 90,
        y: 130,
        label: {
          it: 'Buffer di ingresso e invertitori',
          en: 'Input buffers and inverters',
        },
      },
      {
        id: 'andarr',
        x: 290,
        y: 80,
        label: {
          it: 'Piano AND',
          en: 'AND plane',
        },
      },
      {
        id: 'orarr',
        x: 290,
        y: 200,
        label: {
          it: 'Piano OR',
          en: 'OR plane',
        },
      },
      {
        id: 'outbuf',
        x: 500,
        y: 200,
        label: {
          it: 'Buffer di uscita',
          en: 'Output buffers',
        },
      },
      {
        id: 'terms',
        x: 400,
        y: 130,
        label: {
          it: 'Termini prodotto',
          en: 'Product terms',
        },
      },
    ],
    distractors: [
      {
        it: 'Blocco logico riconfigurabile',
        en: 'Reconfigurable logic block',
      },
      {
        it: 'Memoria di controllo',
        en: 'Control store',
      },
      {
        it: 'Flip-flop',
      },
      {
        it: 'Clock',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="30" y="95" width="130" height="70" rx="6"/>\n      <rect class="dg-box" x="230" y="45" width="130" height="70" rx="6"/>\n      <rect class="dg-box" x="230" y="165" width="130" height="70" rx="6"/>\n      <rect class="dg-box" x="440" y="165" width="130" height="70" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="160" y1="130" x2="230" y2="90"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="290" y1="115" x2="290" y2="165"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="360" y1="200" x2="440" y2="200"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="570" y1="200" x2="615" y2="200"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="15" y1="130" x2="30" y2="130"/>\n      <text class="dg-text dg-start" x="14" y="118" font-size="10">x₁ … xₙ</text>\n      <text class="dg-text dg-start" x="580" y="188" font-size="10">f₁ … f_m</text>',
      en: '<rect class="dg-box" x="30" y="95" width="130" height="70" rx="6"/>\n      <rect class="dg-box" x="230" y="45" width="130" height="70" rx="6"/>\n      <rect class="dg-box" x="230" y="165" width="130" height="70" rx="6"/>\n      <rect class="dg-box" x="440" y="165" width="130" height="70" rx="6"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="160" y1="130" x2="230" y2="90"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="290" y1="115" x2="290" y2="165"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="360" y1="200" x2="440" y2="200"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="570" y1="200" x2="615" y2="200"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="15" y1="130" x2="30" y2="130"/>\n      <text class="dg-text dg-start" x="14" y="118" font-size="10">x₁ … xₙ</text>\n      <text class="dg-text dg-start" x="580" y="188" font-size="10">f₁ … f_m</text>',
    },
  },
  {
    id: 'fpga',
    topic: 'tempi-e-tecnologia',
    width: 520,
    height: 420,
    title: {
      it: 'Schema concettuale di una FPGA',
      en: 'Conceptual diagram of an FPGA',
    },
    slots: [
      {
        id: 'iotop',
        x: 260,
        y: 30,
        label: {
          it: 'Blocchi di I/O',
          en: 'I/O blocks',
        },
      },
      {
        id: 'ioleft',
        x: 45,
        y: 210,
        label: {
          it: 'Blocchi di I/O',
          en: 'I/O blocks',
        },
      },
      {
        id: 'logic',
        x: 200,
        y: 210,
        label: {
          it: 'Blocco logico',
          en: 'Logic block',
        },
      },
      {
        id: 'sw',
        x: 335,
        y: 275,
        label: {
          it: 'Interruttore di interconnessione',
          en: 'Interconnection switch',
        },
      },
      {
        id: 'wires',
        x: 260,
        y: 390,
        label: {
          it: 'Fili di interconnessione',
          en: 'Interconnection wires',
        },
      },
    ],
    distractors: [
      {
        it: 'Memoria di controllo',
        en: 'Control store',
      },
      {
        it: 'Piano AND fisso',
        en: 'Fixed AND plane',
      },
      {
        it: 'Cache',
      },
      {
        it: 'Sommatore',
        en: 'Adder',
      },
    ],
    svg: {
      it: '<rect class="dg-box" x="90" y="15" width="340" height="34" rx="4"/>\n      <rect class="dg-box" x="90" y="330" width="340" height="34" rx="4"/>\n      <rect class="dg-box" x="25" y="70" width="34" height="250" rx="4"/>\n      <rect class="dg-box" x="460" y="70" width="34" height="250" rx="4"/>\n      <rect class="dg-box" x="150" y="140" width="46" height="46" rx="4"/>\n      <rect class="dg-box" x="270" y="140" width="46" height="46" rx="4"/>\n      <rect class="dg-box" x="150" y="250" width="46" height="46" rx="4"/>\n      <rect class="dg-box" x="270" y="250" width="46" height="46" rx="4"/>\n      <rect class="dg-box" x="370" y="140" width="46" height="46" rx="4"/>\n      <rect class="dg-box" x="370" y="250" width="46" height="46" rx="4"/>\n      <line class="dg-line" x1="120" y1="80" x2="120" y2="320"/>\n      <line class="dg-line" x1="235" y1="80" x2="235" y2="320"/>\n      <line class="dg-line" x1="345" y1="80" x2="345" y2="320"/>\n      <line class="dg-line" x1="440" y1="80" x2="440" y2="320"/>\n      <line class="dg-line" x1="70" y1="115" x2="450" y2="115"/>\n      <line class="dg-line" x1="70" y1="220" x2="450" y2="220"/>\n      <line class="dg-line" x1="70" y1="320" x2="450" y2="320"/>\n      <text class="dg-text" x="260" y="410" font-size="11">griglia programmabile</text>',
      en: '<rect class="dg-box" x="90" y="15" width="340" height="34" rx="4"/>\n      <rect class="dg-box" x="90" y="330" width="340" height="34" rx="4"/>\n      <rect class="dg-box" x="25" y="70" width="34" height="250" rx="4"/>\n      <rect class="dg-box" x="460" y="70" width="34" height="250" rx="4"/>\n      <rect class="dg-box" x="150" y="140" width="46" height="46" rx="4"/>\n      <rect class="dg-box" x="270" y="140" width="46" height="46" rx="4"/>\n      <rect class="dg-box" x="150" y="250" width="46" height="46" rx="4"/>\n      <rect class="dg-box" x="270" y="250" width="46" height="46" rx="4"/>\n      <rect class="dg-box" x="370" y="140" width="46" height="46" rx="4"/>\n      <rect class="dg-box" x="370" y="250" width="46" height="46" rx="4"/>\n      <line class="dg-line" x1="120" y1="80" x2="120" y2="320"/>\n      <line class="dg-line" x1="235" y1="80" x2="235" y2="320"/>\n      <line class="dg-line" x1="345" y1="80" x2="345" y2="320"/>\n      <line class="dg-line" x1="440" y1="80" x2="440" y2="320"/>\n      <line class="dg-line" x1="70" y1="115" x2="450" y2="115"/>\n      <line class="dg-line" x1="70" y1="220" x2="450" y2="220"/>\n      <line class="dg-line" x1="70" y1="320" x2="450" y2="320"/>\n      <text class="dg-text" x="260" y="410" font-size="11">programmable grid</text>',
    },
  },
  {
    id: 'macchina-stati',
    topic: 'circuiti-sequenziali',
    width: 620,
    height: 320,
    title: {
      it: 'Modello formale di una macchina a stati finiti',
      en: 'Formal model of a finite-state machine',
    },
    slots: [
      {
        id: 'comb',
        x: 310,
        y: 70,
        label: {
          it: 'Logica combinatoria',
          en: 'Combinational logic',
        },
      },
      {
        id: 'in',
        x: 60,
        y: 40,
        label: {
          it: 'Ingresso x',
          en: 'Input x',
        },
      },
      {
        id: 'out',
        x: 560,
        y: 40,
        label: {
          it: 'Uscita z',
          en: 'Output z',
        },
      },
      {
        id: 'ff',
        x: 310,
        y: 205,
        label: {
          it: 'Elementi di ritardo (flip-flop)',
          en: 'Delay elements (flip-flops)',
        },
      },
      {
        id: 'present',
        x: 70,
        y: 150,
        label: {
          it: 'Stato presente',
          en: 'Present state',
        },
      },
      {
        id: 'next',
        x: 550,
        y: 150,
        label: {
          it: 'Stato futuro',
          en: 'Next state',
        },
      },
    ],
    distractors: [
      {
        it: 'Decodificatore',
        en: 'Decoder',
      },
      {
        it: 'Bus dati',
        en: 'Data bus',
      },
      {
        it: 'Memoria di controllo',
        en: 'Control store',
      },
      {
        it: 'Multiplexer',
      },
    ],
    svg: {
      it: '<rect class="dg-group" x="170" y="30" width="280" height="90" rx="8"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="90" y1="40" x2="170" y2="40"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="450" y1="40" x2="530" y2="40"/>\n      <line class="dg-line" x1="170" y1="80" x2="120" y2="80"/>\n      <line class="dg-line" x1="120" y1="80" x2="120" y2="185"/>\n      <line class="dg-line" x1="450" y1="80" x2="500" y2="80"/>\n      <line class="dg-line" x1="500" y1="80" x2="500" y2="185"/>\n      <rect class="dg-box" x="250" y="185" width="60" height="40" rx="4"/>\n      <rect class="dg-box" x="330" y="185" width="60" height="40" rx="4"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="500" y1="205" x2="390" y2="205"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="250" y1="205" x2="120" y2="205"/>\n      <text class="dg-text" x="310" y="270" font-size="11">un ciclo di clock di ritardo</text>',
      en: '<rect class="dg-group" x="170" y="30" width="280" height="90" rx="8"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="90" y1="40" x2="170" y2="40"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="450" y1="40" x2="530" y2="40"/>\n      <line class="dg-line" x1="170" y1="80" x2="120" y2="80"/>\n      <line class="dg-line" x1="120" y1="80" x2="120" y2="185"/>\n      <line class="dg-line" x1="450" y1="80" x2="500" y2="80"/>\n      <line class="dg-line" x1="500" y1="80" x2="500" y2="185"/>\n      <rect class="dg-box" x="250" y="185" width="60" height="40" rx="4"/>\n      <rect class="dg-box" x="330" y="185" width="60" height="40" rx="4"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="500" y1="205" x2="390" y2="205"/>\n      <line class="dg-line" marker-end="url(#aefin-arrow)" x1="250" y1="205" x2="120" y2="205"/>\n      <text class="dg-text" x="310" y="270" font-size="11">one clock cycle of delay</text>',
    },
  },
];
