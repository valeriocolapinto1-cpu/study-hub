/**
 * Peso delle pagine compilate: i dati delle isole (carte, esercizi, soluzioni) non stanno nell'HTML
 * ma in `dati/*.json`, scaricati quando servono. Nessuna pagina supera 300 KB tranne quelle
 * elencate sotto, che per natura mostrano molto contenuto già reso (formule, figure).
 * Richiede `npm run build`; in CI (REQUIRE_DIST=1) l'assenza di dist/ è un errore.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIST = resolve(import.meta.dirname, '../../dist');
const MAX = 300 * 1024;

/** Eccezioni esplicite: pagine di contenuto (non isole che caricano dati). */
const EXEMPT: [RegExp, string][] = [
  [/\/formulario\/(stampa\/)?index\.html$/, 'formulari e relative stampe'],
  [/\/teoria\/[^/]+\/stampa\/index\.html$/, 'stampa della teoria di un argomento'],
  [/\/teoria\/[^/]+\/index\.html$/, 'teoria di un argomento (MDX con formule rese)'],
  [
    /\/esercizi\/[^/]+\/index\.html$/,
    "esercizi di un argomento (enunciati e figure nell'HTML, soluzioni in dati/)",
  ],
  [/\/stile\//, 'pagine di prova del design system'],
];

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : [],
  );

const have = existsSync(DIST);
if (!have && process.env.REQUIRE_DIST) throw new Error('dist/ mancante: esegui prima `npm run build`');

describe.skipIf(!have)('peso delle pagine HTML', () => {
  it('nessuna pagina oltre 300 KB, salvo le eccezioni elencate', () => {
    const big = walk(DIST)
      .map((f) => ({ rel: relative(DIST, f).split('\\').join('/'), size: statSync(f).size }))
      .filter((f) => f.size > MAX && !EXEMPT.some(([re]) => re.test(`/${f.rel}`)))
      .map((f) => `${f.rel}: ${Math.round(f.size / 1024)} KB`);
    expect(big).toEqual([]);
  });

  it('le isole di ripasso, indice esercizi, esame e progressi non incorporano i dati', () => {
    for (const lang of ['it', 'en'])
      for (const [anno, id] of [
        ['anno-1', 'fisica-1'],
        ['anno-2', 'fisica-2'],
        ['anno-2', 'teoria-circuiti'],
        ['anno-1', 'fondamenti-informatica'],
      ] as const)
        for (const sezione of ['ripasso', 'esercizi', 'esame', 'progressi'])
          expect(
            statSync(join(DIST, lang, anno, id, sezione, 'index.html')).size,
            `${lang}/${anno}/${id}/${sezione}`,
          ).toBeLessThan(200 * 1024);
  });

  it('i JSON delle isole non contengono MathML duplicato', () => {
    const data = join(DIST, 'it/anno-2/fisica-2/dati');
    for (const f of readdirSync(data).filter((n) => n.endsWith('.json')))
      expect(JSON.stringify(JSON.parse(readFileSync(join(data, f), 'utf8')))).not.toContain('katex-mathml');
  });
});
