/**
 * Controlli comuni dei test di copertura delle figure dei corsi: ogni figura (kit o netlist)
 * è valida, si disegna in IT ed EN senza valori non numerici e ha una descrizione.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { expect } from 'vitest';
import type { ExerciseFigure } from '../../../src/engine/generators/registry';
import { parseDiagram, type DiagramSpec } from '../../../src/figures/schemas';
import { renderDiagram } from '../../../src/figures/render';
import { parseNetlist } from '../../../src/sim/circuits/netlist';
import { renderSchematic } from '../../../src/sim/circuits/schematic';

export interface Ex {
  id: string;
  kind: string;
  figure?: ExerciseFigure;
}

export const exercisesOf = (course: string): Ex[] => {
  const dir = `src/content/exercises/${course}`;
  return readdirSync(dir).flatMap((f) => parse(readFileSync(join(dir, f), 'utf8')) as Ex[]);
};

/** Le eccezioni sono raggruppate per motivo: `{ motivo: [id, …] }`. */
export const flatten = (groups: Record<string, string[]>): Map<string, string> =>
  new Map(Object.entries(groups).flatMap(([why, ids]) => ids.map((id) => [id, why] as const)));

export function checkFigure(fig: ExerciseFigure, where: string, lang: 'it' | 'en'): void {
  const kinds = [fig.netlist, fig.diagram, fig.svg].filter(Boolean).length;
  expect(kinds, where).toBe(1);
  if (fig.diagram) {
    const d = fig.diagram as DiagramSpec;
    parseDiagram(d.type, d.params);
    const r = renderDiagram(d.type as never, d.params as never, { lang });
    expect(r.svg, where).not.toMatch(/NaN|undefined|Infinity/);
    expect(r.description.length, where).toBeGreaterThan(20);
  }
  if (fig.netlist) {
    parseNetlist(fig.netlist);
    const r = renderSchematic(fig.netlist, { lang });
    expect(r.svg, where).not.toMatch(/NaN|undefined/);
  }
  if (fig.svg) {
    const raw = fig.svg as string | { it: string; en?: string };
    const svg = typeof raw === 'string' ? raw : lang === 'en' ? (raw.en ?? raw.it) : raw.it;
    expect(svg, where).toMatch(/^<svg[\s\S]*<\/svg>$/);
  }
}
