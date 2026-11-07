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
 * Esercizi statici senza figura, con il motivo. Vuota: oggi tutti gli esercizi del corso
 * descrivono una situazione disegnabile (anche i calcoli sui gas hanno il loro piano pV).
 */
const NO_FIGURE: Record<string, string> = {};

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
