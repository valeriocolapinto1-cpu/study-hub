import { GENERATORS, type GeneratorId } from './generators';
import { mulberry32, randomSeed, shuffle, type Rng } from './rng';
import type { Exam, ExamMode, Question } from './types';

/**
 * Un blocco della prova.
 *
 * `gen` fissa il generatore; `drawFrom` ne **estrae `count` senza
 * reinserimento** da un insieme di generatori equivalenti. L'estrazione senza
 * reinserimento è deliberata: pescando indipendentemente slot per slot capitava
 * una prova con quattro quesiti di pipeline su sei crocette e nessuno sulle
 * altre aree — irrealistico. Così ogni prova copre argomenti distinti.
 */
type Slot =
  | { gen: GeneratorId; points: number }
  | { drawFrom: readonly GeneratorId[]; count: number; points: number };

const repeat = (gen: GeneratorId, points: number, times: number): Slot[] =>
  Array.from({ length: times }, () => ({ gen, points }));

/**
 * Le crocette dell'esame: in maggioranza teoria, ma anche quesiti calcolati su
 * binario, porte, assembly, processore, memoria virtuale, cache, pipeline e
 * virgola mobile.
 *
 * `mc` compare tre volte perché la teoria è l'esito più probabile — come nella
 * prova reale — e perché, essendo l'estrazione senza reinserimento, è l'unico
 * modo per far comparire più di una crocetta teorica nella stessa prova.
 *
 * `cp2`, `gate` e `asmSnippet` stanno qui e non più in slot fissi: nel formato
 * vero le crocette pescano da tutto il programma, non c'è una casella
 * riservata al complemento a 2.
 */
const CROCETTE: readonly GeneratorId[] = [
  'mc',
  'mc',
  'mc',
  'cp2',
  'gate',
  'asmSnippet',
  'rtn',
  'ieee754',
  'pageTranslate',
  'cacheFields',
  'pipelineCycles',
];

/** Quanti quesiti produce un blocco. */
const slotSize = (slot: Slot): number => ('gen' in slot ? 1 : slot.count);

/**
 * Espande i blocchi nei singoli quesiti, sciogliendo le estrazioni.
 * Usa l'`rng` della prova, quindi resta riproducibile per seme.
 */
function expandSlots(slots: readonly Slot[], rng: Rng): { gen: GeneratorId; points: number }[] {
  const flat: { gen: GeneratorId; points: number }[] = [];
  for (const slot of slots) {
    if ('gen' in slot) {
      flat.push({ gen: slot.gen, points: slot.points });
      continue;
    }
    if (slot.drawFrom.length < slot.count) {
      throw new Error(
        `blueprint incoerente: si estraggono ${slot.count} generatori da un insieme di ${slot.drawFrom.length}`,
      );
    }
    for (const gen of shuffle(rng, slot.drawFrom).slice(0, slot.count)) {
      flat.push({ gen, points: slot.points });
    }
  }
  return flat;
}

/**
 * Struttura delle prove.
 *
 * `full` è la prova di autovalutazione **di questo sito** — non il formato
 * dell'esame di qualcuno: 4 crocette, 2 «completare l'immagine», 2 «da tabella
 * di verità a espressione», 1 sintesi di rete combinatoria, 2 domande aperte,
 * 1 programma assembly.
 *
 * Il mix è scelto perché copre le quattro cose che si sanno fare o non si sanno
 * fare — convertire, minimizzare, leggere uno schema, eseguire un listato — e
 * perché mescola quesiti auto-correggibili e quesiti da autovalutare, che
 * allenano due cose diverse.
 *
 * Punti uniformi: 12 × 2,5 = **30**. Trenta è la scala su cui uno studente sa
 * leggersi; dodici quesiti è la densità a cui si smette di rispondere con
 * calma. La somma è verificata da un test, quindi cambiare i pesi qui non può
 * rompere il totale di nascosto.
 */
const BLUEPRINTS: Record<ExamMode, Slot[]> = {
  full: [
    { drawFrom: CROCETTE, count: 4, points: 2.5 },
    ...repeat('diagramLabel', 2.5, 2),
    ...repeat('truthToExpr', 2.5, 2),
    { gen: 'karnaugh', points: 2.5 },
    ...repeat('open', 2.5, 2),
    { gen: 'asmWrite', points: 2.5 },
  ],

  // Ripasso lampo: solo quesiti auto-correggibili.
  quick: [
    { drawFrom: CROCETTE, count: 3, points: 2 },
    { gen: 'cp2', points: 2 },
    { gen: 'hex', points: 2 },
    { gen: 'gate', points: 2 },
    { gen: 'arith', points: 2 },
    { gen: 'maxRange', points: 2 },
  ],

  // Drill sul binario con segno.
  binary: [...repeat('cp2', 2, 4), ...repeat('arith', 2, 3), ...repeat('maxRange', 2, 3)],

  // Drill sulle reti combinatorie.
  logic: [
    ...repeat('gate', 2, 5),
    { gen: 'mc', points: 2 },
    ...repeat('karnaugh', 5, 2),
  ],
};

export const EXAM_MODES = Object.keys(BLUEPRINTS) as ExamMode[];

export const MODE_LABELS: Record<ExamMode, string> = {
  full: 'Esame completo',
  quick: 'Quiz lampo',
  binary: 'Drill complemento a 2',
  logic: 'Drill reti combinatorie',
};

export const MODE_DESCRIPTIONS: Record<ExamMode, string> = {
  full:
    'Prova intera su 30: crocette, due schemi da completare, due tabelle di verità da tradurre ' +
    'in espressione, sintesi combinatoria, domande aperte e un programma assembly.',
  quick: 'Solo domande auto-correggibili. Voto rapido, per ripasso mirato.',
  binary: 'Esercizi generati sul binario con segno. La parte che «non deve avere dubbi».',
  logic: 'Riconoscimento porte + sintesi con Karnaugh dalla tabella di verità.',
};

/**
 * I generatori che una prova può effettivamente pescare.
 *
 * Esiste per un test: un generatore registrato ma assente da ogni blueprint è
 * codice morto, e nel prototipo era proprio il caso di `genHex`. Il confronto
 * con le chiavi di `GENERATORS` impedisce che succeda di nuovo.
 */
export function reachableGenerators(): Set<GeneratorId> {
  const reachable = new Set<GeneratorId>();
  for (const slots of Object.values(BLUEPRINTS)) {
    for (const slot of slots) {
      if ('gen' in slot) reachable.add(slot.gen);
      else for (const id of slot.drawFrom) reachable.add(id);
    }
  }
  return reachable;
}

/** Punti totali previsti da una modalità, senza generare la prova. */
export function totalPointsFor(mode: ExamMode): number {
  return BLUEPRINTS[mode].reduce((sum, slot) => sum + slotSize(slot) * slot.points, 0);
}

export function questionCountFor(mode: ExamMode): number {
  return BLUEPRINTS[mode].reduce((sum, slot) => sum + slotSize(slot), 0);
}

export function isExamMode(value: string): value is ExamMode {
  return value in BLUEPRINTS;
}

/**
 * Costruisce una prova. Con lo stesso `seed` produce la stessa prova, il che
 * rende i test riproducibili e permetterà di salvare e rigiocare un esame.
 */
export function buildExam(mode: ExamMode, seed: number = randomSeed()): Exam {
  const rng = mulberry32(seed);
  const used = new Set<string>();

  const questions: Question[] = expandSlots(BLUEPRINTS[mode], rng).map((slot, index) =>
    GENERATORS[slot.gen]({ rng, points: slot.points, used, seq: index + 1 }),
  );

  return {
    id: `exam-${seed.toString(36)}`,
    mode,
    seed,
    createdAt: Date.now(),
    questions,
    totalPoints: questions.reduce((sum, question) => sum + question.points, 0),
  };
}
