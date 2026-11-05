import { describe, expect, it } from 'vitest';
import { topics } from '~/content';
import { simLoop, simMulCmp, simShift } from './asmSim';
import { coverCost, minimalCover, type Implicant } from './boolean';
import {
  buildExam,
  EXAM_MODES,
  questionCountFor,
  reachableGenerators,
  totalPointsFor,
} from './buildExam';
import { GENERATORS, type GeneratorId } from './generators';
import { normalizeFill } from './grade';
import { mulberry32 } from './rng';
import type {
  AsmLine,
  DiagramQuestion,
  Exam,
  ExprQuestion,
  FillQuestion,
  McQuestion,
  Question,
} from './types';

/**
 * I moduli esistenti. Ogni quesito generato deve rimandare a uno di questi:
 * il rimando è un collegamento interno, non più il capitolo di un libro, e un
 * argomento inventato produrrebbe un link rotto sotto al quesito.
 */
const TOPIC_IDS = new Set<string>(topics.map((topic) => topic.id));

/** Genera N quesiti con un generatore, su semi diversi. */
function sample(gen: GeneratorId, count: number): Question[] {
  return Array.from({ length: count }, (_, i) => {
    const rng = mulberry32(1000 + i);
    return GENERATORS[gen]({ rng, points: 2, used: new Set(), seq: 1 });
  });
}

const ALL_GENERATORS = Object.keys(GENERATORS) as GeneratorId[];

describe('invarianti comuni a tutti i generatori', () => {
  it.each(ALL_GENERATORS)('«%s» produce quesiti ben formati', (gen) => {
    for (const question of sample(gen, 120)) {
      expect(question.q.trim()).not.toBe('');
      expect(TOPIC_IDS.has(question.topic), `${gen}: modulo "${question.topic}"`).toBe(true);
      expect(question.points).toBeGreaterThan(0);

      if (question.kind === 'mc') {
        // Il bug del prototipo: opzioni collassate a 3, o distrattori
        // identici alla risposta esatta ma marcati come sbagliati.
        expect(question.options).toHaveLength(4);
        expect(new Set(question.options).size).toBe(4);
        expect(question.correct).toBeGreaterThanOrEqual(0);
        expect(question.correct).toBeLessThan(4);
      }

      if (question.kind === 'fill') {
        expect(question.answer).not.toBe('');
        // La risposta attesa deve sopravvivere alla propria normalizzazione.
        expect(normalizeFill(question.answer, question.normalize)).toBe(question.answer);
      }

      if (question.kind === 'self') {
        expect(question.model.trim()).not.toBe('');
      }
    }
  });
});

describe('genMC', () => {
  it('fa seguire l’indice corretto alle opzioni rimescolate', () => {
    // La risposta esatta compare fra le opzioni e l'indice la individua.
    for (const question of sample('mc', 200) as McQuestion[]) {
      expect(question.options[question.correct]).toBeDefined();
      expect(question.bankId).toBeDefined();
    }
  });

  it('distribuisce la risposta esatta su tutte le posizioni', () => {
    // Con lo shuffle distorto del prototipo questa distribuzione era sbilanciata.
    const counts = [0, 0, 0, 0];
    for (const question of sample('mc', 800) as McQuestion[]) {
      counts[question.correct] = (counts[question.correct] ?? 0) + 1;
    }
    for (const count of counts) {
      expect(count).toBeGreaterThan(120); // ~200 attesi per posizione
    }
  });
});

describe('genGate', () => {
  const TABLES: Record<string, number[]> = {
    AND: [0, 0, 0, 1],
    OR: [0, 1, 1, 1],
    NAND: [1, 1, 1, 0],
    NOR: [1, 0, 0, 0],
    XOR: [0, 1, 1, 0],
    XNOR: [1, 0, 0, 1],
  };

  it('nomina la porta che realizza davvero la tabella mostrata', () => {
    for (const question of sample('gate', 200) as McQuestion[]) {
      expect(question.payload?.type).toBe('truthTable');
      if (question.payload?.type !== 'truthTable') continue;

      const shown = question.payload.rows.map((row) => row.out);
      const named = question.options[question.correct] as string;
      expect(TABLES[named], `porta sconosciuta: ${named}`).toEqual(shown);
    }
  });
});

describe('genAsmSnippet', () => {
  /** Rilegge i parametri dal listato mostrato e ri-esegue il programma. */
  function answerFromListing(lines: AsmLine[]): number {
    const text = lines.map((line) => line.text).join('\n');
    const num = (pattern: RegExp): number => {
      const match = text.match(pattern);
      if (!match?.[1]) throw new Error(`parametro non trovato: ${pattern} in\n${text}`);
      return Number(match[1]);
    };

    if (text.includes('Branch_if')) {
      return simLoop({
        start: num(/Move\s+R1,\s*#(-?\d+)/),
        step: num(/Sub\s+R1,\s*R1,\s*#(-?\d+)/),
      }).iterations;
    }
    if (text.includes('MUL')) {
      return simMulCmp({
        a: num(/MOV\s+R1,\s*#(-?\d+)/),
        b: num(/MOV\s+R2,\s*#(-?\d+)/),
        cmp: num(/CMP\s+R3,\s*#(-?\d+)/),
        add: num(/ADD\s+R3,\s*R3,\s*#(-?\d+)/),
      }).r3;
    }
    return simShift({
      value: num(/MOV\s+R1,\s*#(-?\d+)/),
      left: num(/LSL\s+R1,\s*R1,\s*#(-?\d+)/),
      right: num(/LSR\s+R1,\s*R1,\s*#(-?\d+)/),
    }).result;
  }

  it('la risposta esatta è quella che si ottiene eseguendo il codice mostrato', () => {
    for (const question of sample('asmSnippet', 300) as McQuestion[]) {
      expect(question.payload?.type).toBe('asm');
      if (question.payload?.type !== 'asm') continue;

      const simulated = answerFromListing(question.payload.lines);
      expect(Number(question.options[question.correct])).toBe(simulated);
    }
  });

  it('usa tutti e tre i template', () => {
    const seen = new Set<string>();
    for (const question of sample('asmSnippet', 200)) {
      if (question.payload?.type !== 'asm') continue;
      const text = question.payload.lines.map((line) => line.text).join(' ');
      seen.add(text.includes('Branch_if') ? 'loop' : text.includes('MUL') ? 'mulcmp' : 'shift');
    }
    expect([...seen].sort()).toEqual(['loop', 'mulcmp', 'shift']);
  });
});

describe('genKarnaugh', () => {
  it('mostra una funzione non banale, a 3 o 4 variabili', () => {
    const widths = new Set<number>();
    for (const question of sample('karnaugh', 200)) {
      expect(question.payload?.type).toBe('kmap');
      if (question.payload?.type !== 'kmap') continue;

      const { vars, minterms, dontCares, rows } = question.payload;
      widths.add(vars.length);

      expect(minterms.length).toBeGreaterThan(0);
      expect(minterms.length).toBeLessThan(2 ** vars.length);
      expect(rows).toHaveLength(2 ** vars.length);

      // Le righe mostrate coincidono con on-set e indifferenze.
      rows.forEach((row, m) => {
        const expected = minterms.includes(m) ? 1 : dontCares.includes(m) ? 'x' : 0;
        expect(row.out, `riga ${m}`).toBe(expected);
      });
      // On-set e indifferenze sono insiemi disgiunti.
      expect(minterms.filter((m) => dontCares.includes(m))).toEqual([]);
    }
    expect([...widths].sort()).toEqual([3, 4]);
  });

  it('introduce indifferenze solo a 4 variabili', () => {
    let withDontCares = 0;
    for (const question of sample('karnaugh', 200)) {
      if (question.payload?.type !== 'kmap') continue;
      if (question.payload.vars.length === 3) {
        expect(question.payload.dontCares).toEqual([]);
      } else if (question.payload.dontCares.length > 0) {
        withDontCares++;
      }
    }
    expect(withDontCares).toBeGreaterThan(0);
  });

  it('la soluzione modello è una SOP MINIMA, non solo corretta', () => {
    // È il bug del prototipo: implicanti che si assorbivano davano
    // «Y = A + A·B̄», corretta ma non minima.
    for (const question of sample('karnaugh', 200)) {
      if (question.payload?.type !== 'kmap') continue;
      const { vars, minterms, dontCares } = question.payload;

      const cover: Implicant[] = minimalCover(
        new Set(minterms),
        new Set(dontCares),
        vars.length,
      );
      const cost = coverCost(cover, vars.length);

      // Il modello dichiara il numero di termini: deve essere quello minimo.
      const declared =
        question.kind === 'self' ? question.model.match(/\((\d+) termin[ei]\)/) : null;
      expect(declared?.[1], `modello senza conteggio: ${question.q}`).toBeDefined();
      expect(Number(declared?.[1])).toBe(cost.terms);
    }
  });
});

/** Via il markup: i quesiti contengono HTML inline. */
const plain = (html: string): string => html.replace(/<[^>]+>/g, '');

const num = (text: string, pattern: RegExp): number => {
  const match = text.match(pattern);
  if (!match?.[1]) throw new Error(`non trovato ${pattern} in:\n${text}`);
  return Number(match[1]);
};

describe('genCacheFields', () => {
  it('i tre campi sommano sempre all’ampiezza dell’indirizzo', () => {
    for (const question of sample('cacheFields', 300) as McQuestion[]) {
      const text = plain(question.q);
      const blockBytes = num(text, /blocchi da (\d+) byte/);
      const sets = num(text, /(\d+) (?:insiemi|linee)/);
      const addressBits = num(text, /indirizzi da (\d+) bit/);

      const offset = Math.log2(blockBytes);
      const index = Math.log2(sets);
      const tag = addressBits - index - offset;

      // I campi devono essere interi e la scomposizione completa.
      expect(Number.isInteger(offset) && Number.isInteger(index)).toBe(true);
      expect(tag + index + offset).toBe(addressBits);
      expect(tag).toBeGreaterThan(0);

      // La risposta indicata come esatta è quella del campo chiesto.
      const field = text.match(/campo (tag|indice|offset nel blocco)\?/)?.[1];
      const expected = field === 'tag' ? tag : field === 'indice' ? index : offset;
      expect(Number(question.options[question.correct]), `campo ${field}`).toBe(expected);
    }
  });
});

describe('genPageTranslate', () => {
  it('conserva l’offset e ricalcola l’indirizzo fisico dal frame', () => {
    let translations = 0;
    let offsetQuestions = 0;

    for (const question of sample('pageTranslate', 300) as FillQuestion[]) {
      const text = plain(question.q);

      if (question.cat === 'Memoria virtuale · traduzione') {
        translations++;
        const pageSize = num(text, /pagine da (\d+) byte/);
        const virtual = Number.parseInt(
          text.match(/0x([0-9A-F]+)/)?.[1] ?? (() => { throw new Error('no VA'); })(),
          16,
        );
        const page = num(text, /pagina (\d+)/);
        const frame = num(text, /frame (\d+)/);

        const offset = virtual % pageSize;
        expect(Math.floor(virtual / pageSize), 'pagina dichiarata').toBe(page);
        // L'offset sopravvive alla traduzione: cambia solo la parte alta.
        const physical = frame * pageSize + offset;
        expect(Number.parseInt(question.answer, 16)).toBe(physical);
        expect(physical % pageSize).toBe(offset);
      } else {
        offsetQuestions++;
        const kib = num(text, /pagine da (\d+) KiB/);
        expect(Number(question.answer)).toBe(Math.log2(kib * 1024));
      }
    }

    expect(translations).toBeGreaterThan(0);
    expect(offsetQuestions).toBeGreaterThan(0);
  });
});

describe('genPipelineCycles', () => {
  it('conta i cicli come k + (n − 1)', () => {
    for (const question of sample('pipelineCycles', 300) as FillQuestion[]) {
      const text = plain(question.q);
      const stages = num(text, /(\d+) stadi/);
      const instructions = num(text, /(\d+) istruzioni/);

      const pipelined = stages + instructions - 1;
      const expected =
        question.cat === 'Pipeline · cicli' ? pipelined : stages * instructions - pipelined;

      expect(Number(question.answer), `k=${stages} n=${instructions}`).toBe(expected);
    }
  });
});

describe('genRtn', () => {
  it('la risposta esatta mette le parentesi solo sulle sorgenti', () => {
    for (const question of sample('rtn', 200) as McQuestion[]) {
      const right = plain(question.options[question.correct] as string);
      const [destination, sources] = right.split('←').map((part) => part.trim());

      // La destinazione si scrive, non si legge: mai fra parentesi quadre.
      expect(destination, right).not.toMatch(/[[\]]/);
      // Ogni registro o etichetta a destra è un contenuto, quindi fra parentesi.
      expect(sources, right).toMatch(/\[/);
      for (const operand of (sources ?? '').split('+').map((s) => s.trim())) {
        expect(operand, `operando non fra parentesi in "${right}"`).toMatch(/^\[.+\]$/);
      }
    }
  });
});

describe('buildExam', () => {
  it('la prova completa ha 12 quesiti e vale esattamente 30 punti', () => {
    for (let seed = 0; seed < 500; seed++) {
      const exam = buildExam('full', seed);
      expect(exam.questions, `seme ${seed}`).toHaveLength(12);
      expect(exam.totalPoints, `seme ${seed}`).toBe(30);
    }
  });

  it('rispetta il mix del formato reale, su ogni seme', () => {
    // 4 crocette · 2 «completare l'immagine» · 2 tabella→espressione ·
    // 1 sintesi combinatoria · 2 aperte · 1 programma assembly.
    for (let seed = 0; seed < 500; seed++) {
      const kinds = buildExam('full', seed).questions.map((question) => question.kind);
      const count = (kind: string): number => kinds.filter((k) => k === kind).length;

      expect(count('diagram'), `seme ${seed}`).toBe(2);
      expect(count('expr'), `seme ${seed}`).toBe(2);
      // Karnaugh, due aperte e l'assembly da scrivere: gli unici da svolgere
      // su carta e autovalutare.
      expect(count('self'), `seme ${seed}`).toBe(4);
      // Le quattro crocette: `mc` oppure `fill`, mai altro.
      expect(count('mc') + count('fill'), `seme ${seed}`).toBe(4);
    }
  });

  it('i due schemi da completare non sono mai lo stesso', () => {
    for (let seed = 0; seed < 500; seed++) {
      const schemi = buildExam('full', seed).questions.filter(
        (question): question is DiagramQuestion => question.kind === 'diagram',
      );
      expect(new Set(schemi.map((question) => question.diagramId)).size, `seme ${seed}`).toBe(2);

      for (const question of schemi) {
        // Ogni etichetta giusta deve essere fra le opzioni, altrimenti il
        // quesito è irrisolvibile; e ci devono essere distrattori, altrimenti
        // si risolve per esclusione.
        for (const slot of question.slots) {
          expect(question.options, `${question.diagramId}/${slot.id}`).toContain(slot.label);
        }
        // Più etichette che posizioni: senza distrattori la risposta si
        // troverebbe per esclusione.
        expect(question.options.length).toBeGreaterThan(
          new Set(question.slots.map((slot) => slot.label)).size,
        );
        expect(new Set(question.options).size).toBe(question.options.length);
      }
    }
  });

  it('il «tabella → espressione» pone una funzione non costante', () => {
    for (let seed = 0; seed < 300; seed++) {
      const espressioni = buildExam('full', seed).questions.filter(
        (question): question is ExprQuestion => question.kind === 'expr',
      );
      for (const question of espressioni) {
        const cells = 1 << question.vars;
        expect(question.minterms.length).toBeGreaterThan(0);
        expect(question.minterms.length).toBeLessThan(cells);
        expect(question.payload?.type).toBe('truthTable');
        // La soluzione modello mostra il procedimento, non solo il risultato.
        expect(question.model).toMatch(/forma canonica/i);
        expect(question.model).toMatch(/Forma minima/);
      }
    }
  });

  it.each(EXAM_MODES)('la modalità «%s» è coerente con il proprio blueprint', (mode) => {
    for (let seed = 0; seed < 60; seed++) {
      const exam = buildExam(mode, seed);
      expect(exam.questions).toHaveLength(questionCountFor(mode));
      expect(exam.totalPoints).toBe(totalPointsFor(mode));
      expect(new Set(exam.questions.map((question) => question.id)).size).toBe(
        exam.questions.length,
      );
    }
  });

  it('non ripete la stessa voce di banca nella stessa prova', () => {
    // Il prototipo poteva pescare due volte la stessa crocetta.
    for (let seed = 0; seed < 200; seed++) {
      const exam = buildExam('full', seed);
      const bankIds = exam.questions
        .map((question) => question.bankId)
        .filter((id): id is string => id !== undefined);
      expect(new Set(bankIds).size, `seme ${seed}`).toBe(bankIds.length);
    }
  });

  it('è riproducibile: stesso seme, stessa prova', () => {
    const strip = (exam: Exam): string =>
      JSON.stringify({ ...exam, createdAt: 0 });
    expect(strip(buildExam('full', 42))).toBe(strip(buildExam('full', 42)));
  });

  it('è rigenerabile: semi diversi, contenuti diversi', () => {
    const first = buildExam('full', 1).questions.map((question) => question.q).join();
    const second = buildExam('full', 2).questions.map((question) => question.q).join();
    expect(first).not.toBe(second);
  });

  it('nessun generatore registrato è codice morto', () => {
    // L'errore trovato nel prototipo: `genHex` esisteva ma nessuna modalità
    // poteva pescarlo. Il confronto è strutturale, non a campione.
    const reachable = reachableGenerators();
    for (const id of Object.keys(GENERATORS) as GeneratorId[]) {
      expect(reachable.has(id), `generatore mai raggiungibile da una prova: ${id}`).toBe(true);
    }
  });

  it('i nuovi quesiti calcolati compaiono davvero nelle prove', () => {
    const cats = new Set<string>();
    for (let seed = 0; seed < 400; seed++) {
      for (const question of buildExam('full', seed).questions) cats.add(question.cat);
    }
    for (const cat of [
      'RTN · notazione',
      'IEEE 754 · codifica',
      'IEEE 754 · decodifica',
      'Memoria virtuale · traduzione',
      'Memoria virtuale · indirizzi',
      'Cache · campi indirizzo',
      'Pipeline · cicli',
      'Pipeline · prestazioni',
    ]) {
      expect(cats.has(cat), `categoria mai generata in 400 prove: ${cat}`).toBe(true);
    }
  });

  it('non concentra le crocette su un solo argomento', () => {
    // Pescando con reinserimento capitava una prova con quattro quesiti di
    // pipeline su sei crocette e nessuno sulle altre aree. L'estrazione senza
    // reinserimento lo rende impossibile: ogni generatore calcolato esce una
    // volta sola, quindi le famiglie sono distinte.
    for (let seed = 0; seed < 300; seed++) {
      const crocette = buildExam('full', seed).questions.slice(0, 4);
      const families = crocette
        .map((question) => question.cat.split(' · ')[0] as string)
        .filter((family) => family !== 'Crocetta');

      expect(new Set(families).size, `seme ${seed}: ${families.join(', ')}`).toBe(families.length);
      // La teoria può ripetersi, ma non oltre le tre voci `mc` del pool.
      const theory = crocette.filter((question) => question.cat === 'Crocetta').length;
      expect(theory).toBeLessThanOrEqual(3);
    }
  });

  it('due prove consecutive differiscono nel mix di crocette, non solo nei numeri', () => {
    const mix = (seed: number): string =>
      buildExam('full', seed)
        .questions.slice(0, 4)
        .map((question) => question.cat)
        .join('|');
    // Su venti semi il mix delle quattro crocette non può essere sempre uguale.
    const distinct = new Set(Array.from({ length: 20 }, (_, seed) => mix(seed)));
    expect(distinct.size).toBeGreaterThan(1);
  });
});
