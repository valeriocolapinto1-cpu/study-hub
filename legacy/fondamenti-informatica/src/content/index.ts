import { mcq } from './mcq';
import { open } from './open';
import { asmWrite } from './asmWrite';
import { diagrams } from './diagrams';
import { topics, TOPIC_GROUPS } from './topics';
import { traps } from './traps';
import { links } from './links';
import type { Topic, TopicId, Trap } from './types';

export { mcq, open, asmWrite, topics, TOPIC_GROUPS, traps, links };
export type { TopicGroup } from './topics';
export type * from './types';

/**
 * Le voci che il motore può pescare e che, una volta viste in una prova,
 * finiscono nello storico per `bankId`.
 *
 * Serve un denominatore onesto per «quanta parte della banca hai già
 * affrontato»: contarlo qui, dalle stesse liste che il motore usa, evita che
 * il numero resti indietro quando si aggiungono domande. Le domande
 * *generate* — Karnaugh, tabella di verità → espressione — non ci sono: non
 * hanno un `bankId` perché ogni volta sono diverse, quindi non sono
 * «affrontabili» una volta per tutte.
 */
export const BANK_IDS: ReadonlySet<string> = new Set([
  ...mcq.map((item) => item.id),
  ...open.map((item) => item.id),
  ...asmWrite.map((item) => item.id),
  ...diagrams.map((item) => item.id),
]);

/** Soglie minime richieste dalla specifica dei contenuti. */
const MINIMUMS = {
  mcq: 40,
  open: 12,
  asmWrite: 2,
  topics: 17,
  traps: 5,
  links: 6,
} as const;

function duplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  return [...dupes];
}

/**
 * Controlli di integrità sul content layer. Ritorna la lista dei problemi
 * (vuota se tutto a posto) invece di lanciare: i test la asseriscono e in dev
 * viene stampata in console, così un refuso in una domanda si vede subito
 * senza far crashare l'app.
 */
export function validateContent(): string[] {
  const problems: string[] = [];

  // — conteggi minimi —
  const banks = { mcq, open, asmWrite, topics, traps, links };
  for (const [name, min] of Object.entries(MINIMUMS)) {
    const size = banks[name as keyof typeof banks].length;
    if (size < min) problems.push(`banca "${name}": ${size} voci, ne servono almeno ${min}`);
  }

  // — id univoci dentro ogni banca —
  for (const [name, bank] of Object.entries(banks)) {
    const dupes = duplicates(bank.map((item) => item.id));
    if (dupes.length) problems.push(`banca "${name}": id duplicati → ${dupes.join(', ')}`);
  }

  // — ogni voce rimanda a un modulo che esiste davvero —
  //
  // Ha sostituito il vecchio «ogni voce cita Hamacher», ed è un controllo più
  // severo: prima bastava che una stringa contenesse una parola, adesso il
  // rimando è una destinazione dentro il sito e un id sbagliato è un
  // collegamento rotto che il test intercetta.
  const knownTopics = new Set<string>(topics.map((topic) => topic.id));
  for (const item of [...mcq, ...open, ...asmWrite, ...diagrams]) {
    if (!knownTopics.has(item.topic)) {
      problems.push(`"${item.id}": rimanda al modulo "${item.topic}", che non esiste`);
    }
  }

  // — crocette ben formate —
  for (const item of mcq) {
    if (item.options.length !== 4) {
      problems.push(`"${item.id}": ${item.options.length} alternative, devono essere 4`);
    }
    if (item.correct < 0 || item.correct >= item.options.length) {
      problems.push(`"${item.id}": indice della risposta esatta (${item.correct}) fuori range`);
    }
    if (new Set(item.options).size !== item.options.length) {
      problems.push(`"${item.id}": alternative duplicate`);
    }
    if (!item.q.trim()) problems.push(`"${item.id}": testo vuoto`);
  }

  // — risposte modello presenti —
  for (const item of [...open, ...asmWrite]) {
    if (!item.model.trim()) problems.push(`"${item.id}": risposta modello mancante`);
  }

  // — le trappole richiamate dai moduli esistono davvero —
  const trapIds = new Set(traps.map((trap) => trap.id));
  for (const topic of topics) {
    for (const id of topic.trapIds) {
      if (!trapIds.has(id)) problems.push(`modulo "${topic.id}": trappola sconosciuta "${id}"`);
    }
  }

  return problems;
}

/** Trappole di un modulo, risolte contro la banca. */
export function trapsForTopic(topic: Topic): Trap[] {
  return topic.trapIds
    .map((id) => traps.find((trap) => trap.id === id))
    .filter((trap): trap is Trap => trap !== undefined);
}

export function topicById(id: string): Topic | undefined {
  return topics.find((topic) => topic.id === id);
}

/** Titoli dei moduli, per etichettare un quesito con la sua area. */
export const TOPIC_TITLES: Record<TopicId, string> = Object.fromEntries(
  topics.map((topic) => [topic.id, topic.title]),
) as Record<TopicId, string>;

if (import.meta.env.DEV) {
  const problems = validateContent();
  if (problems.length) {
    console.warn(`[content] ${problems.length} problemi:\n- ${problems.join('\n- ')}`);
  }
}
