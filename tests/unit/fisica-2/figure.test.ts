// Figure di Fisica Generale II: ogni esercizio che descrive una situazione fisica disegnabile ha una
// figura (kit `src/figures` o netlist), i generatori la costruiscono dai parametri del seme.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { TEMPLATES } from '../../../src/courses/fisica-2/generators/lib';
import '../../../src/courses/fisica-2/generators/b1-elettrostatica';
import '../../../src/courses/fisica-2/generators/b2-corrente';
import '../../../src/courses/fisica-2/generators/b3-magnetostatica';
import '../../../src/courses/fisica-2/generators/b4-induzione';
import '../../../src/courses/fisica-2/generators/b5-onde';
import { runGenerator, type ExerciseFigure } from '../../../src/engine/generators/registry';
import { parseDiagram, type DiagramSpec } from '../../../src/figures/schemas';
import { renderDiagram } from '../../../src/figures/render';
import { parseNetlist } from '../../../src/sim/circuits/netlist';
import { renderSchematic } from '../../../src/sim/circuits/schematic';

const DIR = 'src/content/exercises/fisica-2';
interface Ex {
  id: string;
  kind: string;
  figure?: ExerciseFigure;
}
const all: Ex[] = readdirSync(DIR).flatMap((f) => parse(readFileSync(join(DIR, f), 'utf8')) as Ex[]);

/**
 * Esercizi statici senza figura, con il motivo. Domande concettuali o formali (nessuna situazione da
 * disegnare), statistica di laboratorio, oppure casi in cui la figura darebbe la risposta alla crocetta.
 */
const SENZA_FIGURA: Record<string, string> = {
  'quiz-q101': 'enunciato generale del teorema di Gauss, nessuna configurazione',
  'quiz-q102': 'la figura del conduttore mostrerebbe la risposta (campo nullo dentro)',
  'quiz-q104': 'forma locale di un’equazione di Maxwell',
  'quiz-q107': 'condizioni al contorno in forma astratta',
  'quiz-q201': 'equazione di continuità',
  'quiz-q202': 'legge di Ohm in forma locale',
  'quiz-q203': 'ordine di grandezza',
  'quiz-q205': 'lo schema del metodo voltamperometrico è la risposta',
  'quiz-q206': 'definizione dell’equivalente di Thevenin',
  'quiz-q211': 'filo di lunghezza e sezione date: la figura non aggiunge nulla',
  'quiz-q302': 'significato di ∇·B = 0',
  'quiz-q305': 'enunciato della legge di Ampère',
  'quiz-q306': 'definizione di paramagnetismo',
  'quiz-q307': 'condizioni al contorno in forma astratta',
  'quiz-q401': 'enunciato della legge di Lenz',
  'quiz-q402': 'forma locale della legge di Faraday',
  'quiz-q403': 'motivazione storica della corrente di spostamento',
  'quiz-q404': 'formula dell’energia di un induttore',
  'quiz-q405': 'enunciato della legge di Felici',
  'quiz-q406': 'proprietà del coefficiente di mutua induzione',
  'quiz-q412': 'densità di energia, nessuna geometria',
  'quiz-q501': 'la figura dell’onda mostrerebbe la risposta (E ⊥ B, in fase)',
  'quiz-q502': 'definizione del vettore di Poynting',
  'quiz-q503': 'dipendenza della potenza irraggiata (formula)',
  'quiz-q504': 'la figura mostrerebbe la risposta (verso del passaggio)',
  'quiz-q505': 'la figura mostrerebbe la risposta (polarizzazione a Brewster)',
  'quiz-q601': 'definizione dell’effetto Meissner',
  'quiz-q602': 'invarianti relativistici',
  'quiz-q603': 'trasformazione dei campi: risposta concettuale',
  'quiz-q604': 'transizione superconduttiva',
  'quiz-q701': 'statistica delle misure',
  'quiz-q702': 'definizione di errore sistematico',
  'quiz-q703': 'il grafico richiesto è la risposta',
  'quiz-q704': 'propagazione delle incertezze',
  'quiz-q705': 'propagazione delle incertezze',
  'quiz-q706': 'compatibilità di misure',
};

function checkFigure(fig: ExerciseFigure, where: string, lang: 'it' | 'en' = 'it'): void {
  const kinds = [fig.netlist, fig.diagram, fig.svg].filter(Boolean).length;
  expect(kinds, where).toBe(1);
  if (fig.diagram) {
    const d = fig.diagram as DiagramSpec;
    parseDiagram(d.type, d.params);
    const r = renderDiagram(d.type as never, d.params as never, { lang });
    expect(r.svg, where).not.toMatch(/NaN|undefined|Infinity/);
    expect(r.description.length, where).toBeGreaterThan(30);
  }
  if (fig.netlist) {
    parseNetlist(fig.netlist);
    const r = renderSchematic(fig.netlist, { lang });
    expect(r.svg, where).not.toMatch(/NaN|undefined/);
  }
}

describe('fisica-2: figure degli esercizi statici', () => {
  const statics = all.filter((e) => e.kind === 'static');
  it('ogni esercizio con una situazione fisica ha una figura (eccezioni motivate)', () => {
    const missing = statics.filter((e) => !e.figure && !(e.id in SENZA_FIGURA)).map((e) => e.id);
    expect(missing).toEqual([]);
  });
  it('l’elenco delle eccezioni è esatto', () => {
    for (const id of Object.keys(SENZA_FIGURA)) {
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

describe('fisica-2: figure dei generatori', () => {
  const SEEDS = [1, 7, 42, 1234, 99991];
  for (const tpl of Object.values(TEMPLATES))
    it(`${tpl.id}: figura dai parametri del seme`, () => {
      expect(tpl.figure, `${tpl.id} senza figura`).toBeDefined();
      for (const seed of SEEDS)
        for (const lang of ['it', 'en'] as const) {
          const ex = runGenerator(`fisica-2/${tpl.id}`, seed, lang);
          expect(ex.figure, `${tpl.id} ${seed}`).toBeDefined();
          checkFigure(ex.figure!, `${tpl.id} ${seed} ${lang}`, lang);
        }
    });

  it('le etichette seguono i parametri del seme', () => {
    const a = runGenerator('fisica-2/b4-barretta-rotaie', 3, 'it');
    const b = runGenerator('fisica-2/b4-barretta-rotaie', 4, 'it');
    const la = JSON.stringify(a.figure);
    const lb = JSON.stringify(b.figure);
    expect(la).not.toBe(lb);
    const h = /h=([\d{},]+)\\,\\mathrm\{cm\}/.exec(a.statement)?.[1]?.replace('{,}', ',');
    expect(h).toBeDefined();
    expect(la).toContain(`h = ${h} cm`);
  });
});
