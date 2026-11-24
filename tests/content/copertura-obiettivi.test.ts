/**
 * Copertura degli obiettivi con esercizi (revisione 2, R2): per ogni corso, quanti obiettivi degli
 * argomenti non hanno nemmeno un esercizio. La soglia è il valore misurato dopo R2 e non può salire.
 *
 * Criterio (lo stesso dei numeri della revisione: TdC 52/147, Fisica 1 127/226, Fisica 2 18/69,
 * Fondamenti 4/78 prima di R2): un obiettivo `<argomento>.<n>` è coperto se compare nel campo
 * `objectives` di almeno una voce di `src/content/exercises/<corso>/*.yaml`, statica o generata.
 * Le flashcard non contano. Il denominatore sono tutti gli obiettivi di `src/content/topics/<corso>/`.
 *
 * Quando un corso guadagna copertura, abbassa la soglia al nuovo valore: il test segnala anche una
 * soglia rimasta più alta del necessario, così il valore registrato resta quello reale.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const ROOT = join(process.cwd(), 'src/content');

/** Obiettivi senza esercizi ammessi, per corso (massimo; valore misurato). */
const MAX_UNCOVERED: Record<string, number> = {
  'teoria-circuiti': 0,
  'fisica-1': 0,
  'fisica-2': 18,
  'fondamenti-informatica': 4,
};

const yamlFiles = (dir: string) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.yaml'))
    .sort()
    .map((f) => join(dir, f));

function uncoveredObjectives(course: string): { all: string[]; uncovered: string[] } {
  const all: string[] = [];
  for (const f of yamlFiles(join(ROOT, 'topics', course))) {
    const t = parse(readFileSync(f, 'utf8')) as { objectives?: { id: string }[] };
    for (const o of t.objectives ?? []) all.push(o.id);
  }
  const cited = new Set<string>();
  for (const f of yamlFiles(join(ROOT, 'exercises', course))) {
    const list = (parse(readFileSync(f, 'utf8')) ?? []) as { objectives?: string[] }[];
    for (const e of list) for (const o of e.objectives ?? []) cited.add(o);
  }
  return { all, uncovered: all.filter((o) => !cited.has(o)) };
}

describe('copertura degli obiettivi con esercizi (R2)', () => {
  for (const [course, max] of Object.entries(MAX_UNCOVERED)) {
    it(`${course}: al più ${max} obiettivi senza esercizi`, () => {
      const { all, uncovered } = uncoveredObjectives(course);
      expect(all.length).toBeGreaterThan(0);
      expect(uncovered.length, `scoperti: ${uncovered.join(', ')}`).toBeLessThanOrEqual(max);
      expect(
        uncovered.length,
        `soglia da abbassare: ${course} ha ${uncovered.length} obiettivi scoperti, non ${max}`,
      ).toBe(max);
    });
  }
});
