// Figure di Teoria dei Circuiti: ogni esercizio che descrive un circuito, un segnale o un
// diagramma ha una figura (netlist o kit), i generatori la costruiscono dai parametri del seme.
import { describe, expect, it } from 'vitest';
import '../../../src/courses/teoria-circuiti/generators/analisi';
import '../../../src/courses/teoria-circuiti/generators/applicate';
import { listGenerators, runGenerator } from '../../../src/engine/generators/registry';
import { checkFigure, exercisesOf, flatten } from './helpers';

const all = exercisesOf('teoria-circuiti');

/** Esercizi statici senza figura, raggruppati per motivo. */
const SENZA_FIGURA: Record<string, string[]> = {
  'la figura darebbe la risposta (poli rispetto all’asse immaginario, modulo o fase del filtro, valore in t = 0)':
    ['q-v-014', 'q-v-015', 'q-v-016', 'q-v-004', 'q-iii-021', 'q-v-028', 'q-v-030', 'q-v-033', 'q-v-047'],
  'convenzioni dei segni e bilanci senza un circuito specifico (la figura ripeterebbe i dati)': [
    'q-i-006',
    'q-i-010',
  ],
  'albero-coalbero: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-ii-005', 'q-ii-006', 'q-ii-007', 'q-ii-008', 'q-ii-009', 'q-ii-010', 'q-ii-041'],
  'altre-rappresentazioni-doppi-bipoli: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-vi-023', 'q-vi-024'],
  'applicabilita-fasori: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-iii-016', 'q-iii-017', 'q-iii-018'],
  'circuiti-dominio-laplace: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-iv-027', 'q-iv-028'],
  'circuiti-primo-ordine: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-iii-001', 'q-iii-002', 'q-iii-004', 'q-iii-005'],
  'circuiti-risonanti: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-v-034', 'q-v-035', 'q-v-036', 'q-v-037', 'q-v-039', 'q-v-040', 'q-v-041', 'q-v-044', 'q-v-048'],
  'condizioni-iniziali-generatori: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-iv-029', 'q-iv-030', 'q-iv-031', 'q-iv-032', 'q-iv-037'],
  'connessioni-doppi-bipoli: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-vi-025', 'q-vi-026', 'q-vi-027', 'q-vi-044'],
  'conservazione-potenza-complessa: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-iii-030', 'q-iii-031', 'q-iii-032'],
  'doppi-bipoli-z-y: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-vi-017', 'q-vi-018', 'q-vi-019', 'q-vi-020', 'q-vi-021', 'q-vi-022', 'q-vi-043'],
  'energia-e-bipoli-reali: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-i-023', 'q-i-025', 'q-i-026'],
  'equazioni-integro-differenziali: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-iv-025', 'q-iv-026'],
  'fasori-e-laplace: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-v-024', 'q-v-025'],
  'fasori: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-iii-006', 'q-iii-007', 'q-iii-008', 'q-iii-009', 'q-iii-038'],
  'fratti-semplici: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-iv-016', 'q-iv-017', 'q-iv-018', 'q-iv-019', 'q-iv-020', 'q-iv-034', 'q-iv-036'],
  'funzioni-di-rete: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-v-001', 'q-v-002', 'q-v-003'],
  'generatori-controllati: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-i-027', 'q-i-028', 'q-i-029'],
  'grafo-maglie-tagli: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-ii-001', 'q-ii-002', 'q-ii-003', 'q-ii-004', 'q-ii-046'],
  'impedenza-ammettenza: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-iii-011', 'q-iii-012', 'q-iii-014', 'q-iii-015', 'q-iii-039', 'q-iii-043'],
  'laplace-definizione-proprieta: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-iv-001', 'q-iv-002', 'q-iv-003', 'q-iv-004', 'q-iv-005', 'q-iv-006', 'q-iv-007', 'q-iv-039'],
  'leggi-di-kirchhoff: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-i-005', 'q-i-007', 'q-i-008', 'q-i-040'],
  'linearita-passivita-causalita: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-i-013', 'q-i-014', 'q-i-015', 'q-i-016'],
  'massimo-trasferimento-potenza: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-vi-031', 'q-vi-033', 'q-vi-034', 'q-vi-035', 'q-vi-036', 'q-vi-037', 'q-vi-045'],
  'matrici-a-b: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-ii-011', 'q-ii-012', 'q-ii-013', 'q-ii-014', 'q-ii-015', 'q-ii-016', 'q-ii-040', 'q-ii-042'],
  'metodo-dei-nodi: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-ii-029', 'q-ii-030', 'q-ii-031', 'q-ii-032', 'q-ii-045'],
  'metodo-delle-maglie: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-ii-033', 'q-ii-034', 'q-ii-035', 'q-ii-036'],
  'modellamento-costanti-concentrate: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-i-001', 'q-i-002', 'q-i-003', 'q-i-004'],
  'nullore-e-amplificatore-operazionale: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-i-033', 'q-i-034', 'q-i-037', 'q-i-038', 'q-i-039', 'q-i-044', 'q-i-045'],
  'poli-complessi-coniugati: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-iv-023', 'q-iv-024'],
  'porta-e-bipolo: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-i-009', 'q-i-011', 'q-i-012'],
  'potenza-complessa: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    [
      'q-iii-022',
      'q-iii-023',
      'q-iii-025',
      'q-iii-026',
      'q-iii-027',
      'q-iii-028',
      'q-iii-029',
      'q-iii-041',
      'q-iii-044',
    ],
  'prove-validita-connessioni: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-vi-028', 'q-vi-029', 'q-vi-030'],
  'relazioni-costitutive: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-i-017', 'q-i-018', 'q-i-019', 'q-i-020', 'q-i-021', 'q-i-022', 'q-i-041', 'q-i-042', 'q-i-046'],
  'reti-n-porte: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-vi-016', 'q-vi-038'],
  'rifasamento: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-iii-033', 'q-iii-034', 'q-iii-036', 'q-iii-042'],
  'risposta-impulsiva-convoluzione: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-v-005', 'q-v-006', 'q-v-007', 'q-v-008', 'q-v-009', 'q-v-045'],
  'risposta-in-frequenza-filtri: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-v-026', 'q-v-027', 'q-v-029', 'q-v-032', 'q-v-043'],
  'risposta-libera-forzata: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-v-010', 'q-v-011', 'q-v-012'],
  'risposta-transitoria-permanente: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-v-020', 'q-v-021', 'q-v-022', 'q-v-023'],
  'serie-parallelo-partitori: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-ii-028', 'q-ii-044', 'q-ii-047'],
  'sovrapposizione-frequenze-diverse: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-iii-019', 'q-iii-020', 'q-iii-040'],
  'stabilita-poli: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-v-013', 'q-v-017', 'q-v-018', 'q-v-019', 'q-v-042', 'q-v-046'],
  'tensioni-correnti-indipendenti: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-ii-017', 'q-ii-018', 'q-ii-019', 'q-ii-039'],
  'teorema-di-norton: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-vi-012', 'q-vi-013', 'q-vi-015', 'q-vi-040', 'q-vi-047'],
  'teorema-di-sostituzione: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-vi-001', 'q-vi-002', 'q-vi-003'],
  'teorema-di-tellegen: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-ii-020', 'q-ii-021', 'q-ii-022', 'q-ii-023', 'q-ii-024', 'q-ii-038', 'q-ii-043'],
  'teorema-di-thevenin: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    [
      'q-vi-004',
      'q-vi-005',
      'q-vi-006',
      'q-vi-008',
      'q-vi-009',
      'q-vi-010',
      'q-vi-011',
      'q-vi-039',
      'q-vi-042',
      'q-vi-046',
    ],
  'trasformate-notevoli: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    [
      'q-iv-008',
      'q-iv-009',
      'q-iv-010',
      'q-iv-011',
      'q-iv-012',
      'q-iv-013',
      'q-iv-014',
      'q-iv-015',
      'q-iv-035',
      'q-iv-038',
    ],
  'trasformatore-ideale: crocette concettuali (definizioni, enunciati, proprietà, formule) senza un circuito o un segnale da disegnare':
    ['q-i-030', 'q-i-032', 'q-i-043'],
};
/** Generatori senza figura, con il motivo. */
const GENERATORI_SENZA_FIGURA: Record<string, string> = {
  'teoria-circuiti/stabilita-parametro':
    'polinomio con un parametro libero: i poli dipendono da k e disegnarli per un valore darebbe la risposta',
};

const eccezioni = flatten(SENZA_FIGURA);

describe('teoria-circuiti: figure degli esercizi statici', () => {
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

describe('teoria-circuiti: figure dei generatori', () => {
  const SEEDS = [1, 7, 42, 1234, 99991];
  for (const g of listGenerators('teoria-circuiti'))
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
