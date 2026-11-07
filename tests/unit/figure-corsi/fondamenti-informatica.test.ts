// Figure di Fondamenti di Informatica: ogni esercizio con una struttura, un programma o un
// circuito logico da mostrare ha una figura (kit o SVG del corso), i generatori la costruiscono dai parametri del seme.
import { describe, expect, it } from 'vitest';
import '../../../src/courses/fondamenti-informatica/generators/assembly';
import '../../../src/courses/fondamenti-informatica/generators/logica';
import '../../../src/courses/fondamenti-informatica/generators/memoria';
import '../../../src/courses/fondamenti-informatica/generators/numeri';
import { listGenerators, runGenerator } from '../../../src/engine/generators/registry';
import { checkFigure, exercisesOf, flatten, theoryDiagrams } from './helpers';

const all = exercisesOf('fondamenti-informatica');

/** Esercizi statici senza figura, raggruppati per motivo. */
const SENZA_FIGURA: Record<string, string[]> = {
  'il disegno richiesto (tabella, schema, diagramma, pila, traccia, rappresentazione in bit) è la risposta': [
    'aritmetica-hardware-es-1',
    'aritmetica-hardware-es-2',
    'aritmetica-hardware-es-3',
    'aritmetica-hardware-es-4',
    'aritmetica-hardware-es-5',
    'algebra-di-boole-es-4',
    'circuiti-sequenziali-es-3',
    'dal-sorgente-all-esecuzione-es-1',
    'dal-sorgente-all-esecuzione-es-3',
    'gerarchia-di-memoria-es-1',
    'gerarchia-di-memoria-es-3',
    'input-output-es-4',
    'interruzioni-ed-eccezioni-es-3',
    'memoria-virtuale-es-2',
    'numeri-binari-es-1',
    'numeri-binari-es-2',
    'numeri-binari-es-3',
    'numeri-binari-es-4',
    'numeri-binari-es-5',
    'pipeline-es-1',
    'pipeline-es-3',
    'pipeline-es-4',
    'reti-combinatorie-es-1',
    'reti-combinatorie-es-2',
    'reti-combinatorie-es-4',
    'risc-cisc-assembly-es-4',
    'risc-cisc-assembly-es-5',
    'virgola-mobile-es-1',
    'virgola-mobile-es-3',
    'virgola-mobile-es-5',
  ],
  'calcolo con formule (tempi, prestazioni, consumi, percentuali) senza una struttura da disegnare': [
    'circuiti-sequenziali-es-5',
    'dal-sorgente-all-esecuzione-es-4',
    'gerarchia-di-memoria-es-2',
    'gerarchia-di-memoria-es-4',
    'input-output-es-3',
    'interruzioni-ed-eccezioni-es-4',
    'interruzioni-ed-eccezioni-es-5',
    'memoria-virtuale-es-4',
    'pipeline-es-2',
    'pipeline-es-5',
    'prestazioni-e-parallelismo-es-1',
    'prestazioni-e-parallelismo-es-2',
    'prestazioni-e-parallelismo-es-3',
    'prestazioni-e-parallelismo-es-4',
    'prestazioni-e-parallelismo-es-5',
    'processore-es-4',
    'tempi-e-tecnologia-es-2',
    'tempi-e-tecnologia-es-3',
    'tempi-e-tecnologia-es-4',
  ],
  'domanda descrittiva o di classificazione (spiegare, motivare, attribuire, dimostrare)': [
    'algebra-di-boole-es-2',
    'algebra-di-boole-es-3',
    'algebra-di-boole-es-5',
    'circuiti-sequenziali-es-1',
    'dal-sorgente-all-esecuzione-es-2',
    'dal-sorgente-all-esecuzione-es-5',
    'input-output-es-1',
    'input-output-es-2',
    'input-output-es-5',
    'interruzioni-ed-eccezioni-es-1',
    'interruzioni-ed-eccezioni-es-2',
    'memoria-virtuale-es-3',
    'memoria-virtuale-es-5',
    'processore-es-1',
    'processore-es-2',
    'processore-es-5',
    'reti-combinatorie-es-5',
    'risc-cisc-assembly-es-1',
    'tempi-e-tecnologia-es-5',
    'virgola-mobile-es-4',
  ],
  'algebra-di-boole: crocette concettuali (definizioni, confronti, proprietà) senza una configurazione da disegnare':
    ['mcq-bool-01', 'mcq-bool-02', 'mcq-bool-03', 'mcq-bool-04', 'mcq-bool-05', 'mcq-bool-06'],
  'aritmetica-hardware: crocette concettuali (definizioni, confronti, proprietà) senza una configurazione da disegnare':
    ['mcq-arith-01', 'mcq-arith-02', 'mcq-arith-03', 'mcq-arith-04', 'mcq-arith-05', 'mcq-arith-06'],
  'circuiti-sequenziali: crocette concettuali (definizioni, confronti, proprietà) senza una configurazione da disegnare':
    ['mcq-ff-01', 'mcq-ff-02', 'mcq-ff-03', 'mcq-ff-04', 'mcq-ff-05', 'mcq-ff-06'],
  'dal-sorgente-all-esecuzione: crocette concettuali (definizioni, confronti, proprietà) senza una configurazione da disegnare':
    ['mcq-sw-01', 'mcq-sw-02', 'mcq-sw-03', 'mcq-sw-04'],
  'gerarchia-di-memoria: crocette concettuali (definizioni, confronti, proprietà) senza una configurazione da disegnare':
    [
      'mcq-mem-01',
      'mcq-mem-02',
      'mcq-mem-03',
      'mcq-mem-04',
      'mcq-mem-05',
      'mcq-mem-06',
      'mcq-mem-07',
      'mcq-mem-08',
      'mcq-mem-09',
      'mcq-mem-10',
      'mcq-mem-11',
      'mcq-mem-12',
      'mcq-mem-13',
      'mcq-mem-14',
      'mcq-mem-15',
      'mcq-mem-16',
    ],
  'input-output: crocette concettuali (definizioni, confronti, proprietà) senza una configurazione da disegnare':
    ['mcq-io-01', 'mcq-io-02', 'mcq-io-03', 'mcq-io-04', 'mcq-io-05', 'mcq-io-06'],
  'interruzioni-ed-eccezioni: crocette concettuali (definizioni, confronti, proprietà) senza una configurazione da disegnare':
    [
      'mcq-irq-01',
      'mcq-irq-02',
      'mcq-irq-03',
      'mcq-irq-04',
      'mcq-irq-05',
      'mcq-irq-06',
      'mcq-irq-07',
      'mcq-irq-08',
      'mcq-irq-09',
      'mcq-irq-10',
      'mcq-irq-11',
      'mcq-irq-12',
      'mcq-irq-13',
      'mcq-irq-14',
    ],
  'mappe-di-karnaugh: crocette concettuali (definizioni, confronti, proprietà) senza una configurazione da disegnare':
    ['mcq-karnaugh-01', 'mcq-karnaugh-02', 'mcq-karnaugh-03', 'mcq-karnaugh-04'],
  'memoria-virtuale: crocette concettuali (definizioni, confronti, proprietà) senza una configurazione da disegnare':
    ['mcq-vm-01', 'mcq-vm-02', 'mcq-vm-03', 'mcq-vm-04', 'mcq-vm-05'],
  'numeri-binari: crocette concettuali (definizioni, confronti, proprietà) senza una configurazione da disegnare':
    [
      'mcq-bin-01',
      'mcq-bin-02',
      'mcq-bin-03',
      'mcq-bin-04',
      'mcq-bin-05',
      'mcq-bin-06',
      'mcq-bin-07',
      'mcq-bin-08',
      'mcq-bin-09',
      'mcq-bin-10',
      'mcq-bin-11',
      'mcq-bin-12',
    ],
  'pipeline: crocette concettuali (definizioni, confronti, proprietà) senza una configurazione da disegnare':
    ['mcq-pipe-01', 'mcq-pipe-02', 'mcq-pipe-05', 'mcq-pipe-06', 'mcq-pipe-07', 'mcq-pipe-08'],
  'prestazioni-e-parallelismo: crocette concettuali (definizioni, confronti, proprietà) senza una configurazione da disegnare':
    ['mcq-perf-01', 'mcq-perf-02', 'mcq-perf-03', 'mcq-perf-04'],
  'processore: crocette concettuali (definizioni, confronti, proprietà) senza una configurazione da disegnare':
    ['mcq-cpu-01', 'mcq-cpu-02', 'mcq-cpu-03', 'mcq-cpu-04', 'mcq-cpu-05', 'mcq-pipe-03', 'mcq-pipe-04'],
  'reti-combinatorie: crocette concettuali (definizioni, confronti, proprietà) senza una configurazione da disegnare':
    ['mcq-comb-01', 'mcq-comb-02', 'mcq-comb-03', 'mcq-comb-04', 'mcq-comb-05', 'mcq-comb-06'],
  'risc-cisc-assembly: crocette concettuali (definizioni, confronti, proprietà) senza una configurazione da disegnare':
    [
      'mcq-isa-01',
      'mcq-isa-02',
      'mcq-isa-03',
      'mcq-isa-04',
      'mcq-isa-05',
      'mcq-isa-06',
      'mcq-isa-07',
      'mcq-isa-08',
      'mcq-isa-09',
      'mcq-isa-10',
      'mcq-isa-11',
      'mcq-isa-12',
    ],
  'tempi-e-tecnologia: crocette concettuali (definizioni, confronti, proprietà) senza una configurazione da disegnare':
    ['mcq-tech-01', 'mcq-tech-02', 'mcq-tech-03', 'mcq-tech-04', 'mcq-tech-05', 'mcq-tech-06'],
  'virgola-mobile: crocette concettuali (definizioni, confronti, proprietà) senza una configurazione da disegnare':
    ['mcq-ieee-01', 'mcq-ieee-02', 'mcq-ieee-03', 'mcq-ieee-04', 'mcq-ieee-05'],
};
/** Generatori senza figura, con il motivo. */
const NUMERI = 'la risposta è la sequenza di bit (o la sua lettura): disegnarla darebbe la soluzione';
const GENERATORI_SENZA_FIGURA: Record<string, string> = {
  'fondamenti-informatica/complemento-a-2': NUMERI,
  'fondamenti-informatica/somma-cp2-overflow': NUMERI,
  'fondamenti-informatica/decimale-esadecimale': NUMERI,
  'fondamenti-informatica/intervallo-rappresentabile':
    'domanda su una formula (2ⁿ − 1, ±2ⁿ⁻¹), nessuna struttura da disegnare',
  'fondamenti-informatica/cp2-a-mano': NUMERI,
  'fondamenti-informatica/somma-con-flag': NUMERI,
  'fondamenti-informatica/notazione-rtn':
    'il disegno del trasferimento (verso e operandi) sarebbe la risposta alla crocetta',
};

const eccezioni = flatten(SENZA_FIGURA);
const MIN_TEORIA = 0;

describe('fondamenti-informatica: figure degli esercizi statici', () => {
  const statics = all.filter((e) => e.kind === 'static');
  it('ogni esercizio con un circuito o un grafico da mostrare ha una figura (eccezioni motivate)', () => {
    expect(statics.filter((e) => !e.figure && !eccezioni.has(e.id)).map((e) => e.id)).toEqual([]);
  });
  it('l’elenco delle eccezioni è esatto', () => {
    for (const id of eccezioni.keys()) {
      const e = statics.find((x) => x.id === id);
      expect(e, id).toBeDefined();
      expect(e!.figure, `${id} ha una figura: toglierlo dalle eccezioni`).toBeUndefined();
    }
  });
  for (const e of statics.filter((x) => x.figure))
    it(`${e.id}: figura valida in IT ed EN`, () => {
      checkFigure(e.figure!, e.id, 'it');
      checkFigure(e.figure!, e.id, 'en');
    });
});

describe('fondamenti-informatica: figure dei generatori', () => {
  const SEEDS = [1, 7, 42, 1234, 99991];
  for (const g of listGenerators('fondamenti-informatica'))
    it(`${g.id}: figura dai parametri del seme`, () => {
      for (const seed of SEEDS)
        for (const lang of ['it', 'en'] as const) {
          const ex = runGenerator(g.id, seed, lang);
          if (g.id in GENERATORI_SENZA_FIGURA) {
            expect(ex.figure, `${g.id}: ha una figura, toglierlo dalle eccezioni`).toBeUndefined();
            continue;
          }
          expect(ex.figure, `${g.id} ${seed}`).toBeDefined();
          checkFigure(ex.figure!, `${g.id} ${seed} ${lang}`, lang);
        }
    });
});

describe('fondamenti-informatica: figure della teoria', () => {
  const diagrams = theoryDiagrams('fondamenti-informatica');
  it('le pagine IT ed EN hanno le stesse figure del kit', () => {
    const per = (lang: string) =>
      diagrams.filter((d) => d.file.endsWith(`.${lang}.mdx`)).map((d) => `${d.file.split('.')[0]}:${d.type}`);
    expect(per('en')).toEqual(per('it'));
    expect(diagrams.length).toBeGreaterThanOrEqual(MIN_TEORIA);
  });
  for (const d of diagrams)
    it(`${d.file}: ${d.type} valido`, () => {
      checkFigure(
        { diagram: { type: d.type, params: d.params } as never },
        d.file,
        d.file.includes('.en.') ? 'en' : 'it',
      );
    });
});
