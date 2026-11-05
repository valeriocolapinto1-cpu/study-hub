import type { Topic, TopicId } from '../types';

import { bin } from './bin';
import { bool } from './bool';
import { comb } from './comb';
import { karnaugh } from './karnaugh';
import { arith } from './arith';
import { ff } from './ff';
import { tech } from './tech';
import { cpu } from './cpu';
import { isa } from './isa';
import { irq } from './irq';
import { io } from './io';
import { pipe } from './pipe';
import { mem } from './mem';
import { vm } from './vm';
import { ieee } from './ieee';
import { sw } from './sw';
import { perf } from './perf';

/**
 * Moduli di studio, uno per file in questa cartella.
 *
 * L'ordine è **pedagogico**, non alfabetico, ed è quello in cui conviene
 * studiare: dai numeri alla logica, dalla logica alle reti, dalle reti al
 * processore, dal processore alla memoria.
 *
 * PER AGGIUNGERE UN MODULO: crea il file qui accanto, aggiungi il suo id a
 * `TopicId` in `../types.ts` e inseriscilo nell'elenco al punto giusto. I test
 * pretendono poi almeno tre crocette e una domanda aperta sull'argomento.
 */
export const topics: Topic[] = [
  bin,
  bool,
  comb,
  karnaugh,
  arith,
  ff,
  tech,
  cpu,
  isa,
  sw,
  irq,
  io,
  pipe,
  mem,
  vm,
  perf,
  ieee,
];

/**
 * Il programma diviso in blocchi, per non trovarsi davanti diciassette schede
 * tutte uguali. I blocchi seguono l'ordine dell'elenco qui sopra e lo coprono
 * per intero: è il «percorso» consigliato, dal basso verso l'alto.
 */
export interface TopicGroup {
  id: string;
  title: string;
  /** A cosa serve questo blocco, in una riga. */
  note: string;
  topicIds: TopicId[];
}

export const TOPIC_GROUPS: TopicGroup[] = [
  {
    id: 'fondamenta',
    title: 'Numeri e logica',
    note: 'Le due fondamenta: come si scrivono i numeri e come si combinano i bit. Tutto il resto ci poggia sopra.',
    topicIds: ['bin', 'bool'],
  },
  {
    id: 'reti',
    title: 'Reti logiche',
    note: 'Dalla tabella di verità al circuito: blocchi standard, minimizzazione, aritmetica in hardware, memoria elementare e tempi.',
    topicIds: ['comb', 'karnaugh', 'arith', 'ff', 'tech'],
  },
  {
    id: 'processore',
    title: 'Il processore',
    note: 'Che cosa c’è dentro, che istruzioni capisce e come ci arriva un programma scritto da te.',
    topicIds: ['cpu', 'isa', 'sw'],
  },
  {
    id: 'esterno',
    title: 'Interruzioni e I/O',
    note: 'Come il processore parla con il mondo, e come reagisce a chi lo chiama.',
    topicIds: ['irq', 'io'],
  },
  {
    id: 'memoria',
    title: 'Pipeline e memoria',
    note: 'I due meccanismi che decidono davvero la velocità di un calcolatore.',
    topicIds: ['pipe', 'mem', 'vm'],
  },
  {
    id: 'oltre',
    title: 'Prestazioni e virgola mobile',
    note: 'Misurare le prestazioni senza farsi ingannare, e rappresentare i numeri reali.',
    topicIds: ['perf', 'ieee'],
  },
];
