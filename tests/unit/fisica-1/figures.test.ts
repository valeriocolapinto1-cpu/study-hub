/**
 * Figure di Fisica 1: ogni esercizio statico che descrive una situazione fisica ha una figura
 * del kit valida; ogni generatore restituisce una figura valida, coerente con i parametri del seme,
 * che si disegna in entrambe le lingue.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { listGenerators, runGenerator } from '../../../src/engine/generators/registry';
import { parseDiagram } from '../../../src/figures/schemas';
import { renderDiagram } from '../../../src/figures/render';
import type { DiagramType } from '../../../src/figures/types';
import '../../../src/courses/fisica-1/generators/oscillazioni';
import '../../../src/courses/fisica-1/generators/energia';
import '../../../src/courses/fisica-1/generators/rigido';
import '../../../src/courses/fisica-1/generators/termodinamica';

const DIR = resolve('src/content/exercises/fisica-1');
/**
 * Esercizi statici senza figura, con il motivo. Fino alla revisione 2 era vuota; R2 ha aggiunto
 * crocette concettuali e calcoli senza una situazione da disegnare.
 */
const NO_FIGURE: Record<string, string> = {
  'r2-mcv-3': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-ma-2': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-ma-3': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-omm-3': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-sr-3': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-sr-4': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-os-2': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-os-3': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-ris-2': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-ris-3': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-ris-4': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-lec-2': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-lec-3': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-fc-3': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-fc-4': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-fnc-2': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-fnc-3': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-mang-2': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-mang-3': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-mang-4': "dati astronomici: la figura di un'ellisse quasi circolare non aggiungerebbe informazioni",
  'r2-cm-2': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-mi-1': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-mi-2':
    'confronto fra quattro forme notevoli: la figura sarebbe un catalogo, non la situazione di un problema',
  'r2-mi-4': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-tma-1': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-tma-3': 'conti su un sistema descritto dai dati, senza una geometria particolare da disegnare',
  'r2-koe-1': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-mcr-1': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-mcr-4': 'conti su un sistema descritto dai dati, senza una geometria particolare da disegnare',
  'r2-stat-3': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-stat-4': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-ecr-1': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-ecr-2': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-pf-2': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-pf-3': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-rp-3': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-uc-3': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-pb-2': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-stv-1': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-stv-2': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-tcg-1': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-tcg-2': 'calcolo sullo stato di un gas, senza trasformazioni da disegnare nel piano pV',
  'r2-tcg-3': 'calcolo sullo stato di un gas, senza trasformazioni da disegnare nel piano pV',
  'r2-lgp-1': 'calcolo sullo stato di un gas, senza trasformazioni da disegnare nel piano pV',
  'r2-lgp-2': 'calcolo sullo stato di un gas, senza trasformazioni da disegnare nel piano pV',
  'r2-lgp-3': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-eq-1': 'calcolo sullo stato di un gas, senza trasformazioni da disegnare nel piano pV',
  'r2-eq-2': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-eq-3': 'calcolo sullo stato di un gas, senza trasformazioni da disegnare nel piano pV',
  'r2-eq-4': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-cmol-1': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-cmol-2': 'calcolo sullo stato di un gas, senza trasformazioni da disegnare nel piano pV',
  'r2-cmol-3': 'calcolo sullo stato di un gas, senza trasformazioni da disegnare nel piano pV',
  'r2-cmol-4': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-pp-4': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-sp-2': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-sp-3': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-cc-1': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-tc-1': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-tc-2': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-dc-1': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-dc-2': 'crocetta concettuale (R2): nessuna situazione da disegnare',
  'r2-ent-1': 'espansione libera: non è una trasformazione quasi-statica e non ha una curva nel piano pV',
  'r2-ent-2': 'scambio di calore fra due corpi: la situazione è descritta completamente dai dati',
  'r2-ent-3': 'calcolo sullo stato di un gas, senza trasformazioni da disegnare nel piano pV',
  'r2-ent-4': 'crocetta concettuale (R2): nessuna situazione da disegnare',
};

interface Ex {
  id: string;
  kind: string;
  figure?: { diagram?: { type: DiagramType; params: unknown } };
}
const statics: Ex[] = readdirSync(DIR)
  .filter((f) => f.endsWith('.yaml'))
  .flatMap((f) => parse(readFileSync(join(DIR, f), 'utf8')) as Ex[])
  .filter((e) => e.kind !== 'generated');

describe('figure degli esercizi statici di Fisica 1', () => {
  it('ogni esercizio ha una figura del kit (o un motivo nella whitelist)', () => {
    const missing = statics.filter((e) => !e.figure?.diagram && !NO_FIGURE[e.id]).map((e) => e.id);
    expect(missing).toEqual([]);
    for (const id of Object.keys(NO_FIGURE)) expect(statics.some((e) => e.id === id)).toBe(true);
  });

  it.each(statics.filter((e) => e.figure?.diagram).map((e) => [e.id, e.figure!.diagram!] as const))(
    '%s: parametri validi, figura disegnabile in IT ed EN',
    (_id, d) => {
      parseDiagram(d.type, d.params);
      const it_ = renderDiagram(d.type, d.params as never, { lang: 'it' });
      const en = renderDiagram(d.type, d.params as never, { lang: 'en' });
      expect(it_.svg).toMatch(/^<svg[^>]+role="img"/);
      expect(it_.svg).not.toMatch(/NaN|undefined|Infinity/);
      expect(en.description).not.toEqual(it_.description);
    },
  );
});

const ids = listGenerators('fisica-1').map((g) => g.id);
const SEEDS = [1, 7, 42, 1234, 99991];

describe('figure dei generatori di Fisica 1', () => {
  it('tutti i generatori sono coperti', () => {
    expect(ids.length).toBe(27);
  });

  it.each(ids)('%s: figura valida per più semi, deterministica, disegnabile', (id) => {
    for (const seed of SEEDS) {
      const ex = runGenerator(id, seed, 'it');
      const d = ex.figure?.diagram;
      expect(d, `${id} senza figura`).toBeDefined();
      parseDiagram(d!.type, d!.params);
      expect(runGenerator(id, seed, 'en').figure).toEqual(ex.figure);
      const svg = renderDiagram(d!.type, d!.params as never, { lang: 'en' }).svg;
      expect(svg).not.toMatch(/NaN|undefined|Infinity/);
    }
  });

  it('i parametri della figura seguono quelli dell’enunciato', () => {
    for (const seed of SEEDS) {
      const piano = runGenerator('fisica-1/piano-scabro', seed, 'it');
      const th = Number(/inclinato di \$(\d+)°/.exec(piano.statement)?.[1]);
      expect(piano.figure?.diagram).toMatchObject({ type: 'inclined-plane', params: { angle: th } });

      const pend = runGenerator('fisica-1/pendolo', seed, 'it');
      const p = pend.figure!.diagram!.params as { angle: number };
      expect(pend.statement).toContain(`${p.angle}°`);

      const urto = runGenerator('fisica-1/urto-elastico', seed, 'it');
      const c = urto.figure!.diagram!.params as { after: Array<{ v: number }> };
      // velocità dopo l'urto nella figura = risposte (3 cifre significative)
      expect(c.after[0]!.v).toBeCloseTo(urto.answer[0]!.value as number, 2);
      expect(c.after[1]!.v).toBeCloseTo(urto.answer[1]!.value as number, 2);
    }
  });
});
