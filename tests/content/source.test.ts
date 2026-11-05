/** Regole sul codice sorgente: niente URL assoluti scritti a mano, glossario valido. */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT = resolve(import.meta.dirname, '../..');
const SRC = join(ROOT, 'src');
/** Unico file autorizzato a contenere URL del progetto e dei repository originali. */
const ALLOWED = new Set(['src/config/site.ts']);

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walk(join(dir, e.name))
      : /\.(astro|tsx?|mjs|js|css|mdx?|json|ya?ml)$/.test(e.name)
        ? [join(dir, e.name)]
        : [],
  );

const FORBIDDEN: [RegExp, string][] = [
  [/["'`(]\/study-hub\//, 'percorso base "/study-hub/" scritto a mano (usa localizePath/withBase)'],
  [/valeriocolapinto1-cpu\.github\.io/, 'dominio del sito scritto a mano (usa Astro.site)'],
  [
    /teoria-dei-circuiti-ingegneria-elettronica|fondamenti-di-informatica-AEFIN|fisica-2-ingegneria-elettronica|orale-fisica-1-ingegneria-elettronica/i,
    'URL di un repository originale (usa LEGACY_REPOS)',
  ],
  [/github\.com\/valeriocolapinto1-cpu/, 'URL del repository scritto a mano (usa SITE.repo)'],
];

describe('sorgenti', () => {
  it('non contengono URL assoluti del sito o dei repository legacy fuori da src/config/site.ts', () => {
    const problems: string[] = [];
    for (const file of walk(SRC)) {
      const rel = relative(ROOT, file).split('\\').join('/');
      if (ALLOWED.has(rel)) continue;
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          for (const [re, msg] of FORBIDDEN) if (re.test(line)) problems.push(`${rel}:${i + 1}: ${msg}`);
        });
    }
    expect(problems).toEqual([]);
  });

  it('il glossario è valido e senza duplicati', () => {
    const glossary = parse(readFileSync(join(SRC, 'i18n/glossary.yaml'), 'utf8')) as {
      it: string;
      en: string;
      note?: string;
    }[];
    expect(Array.isArray(glossary)).toBe(true);
    const seen = new Set<string>();
    for (const g of glossary) {
      expect(typeof g.it === 'string' && g.it.length > 0, JSON.stringify(g)).toBe(true);
      expect(typeof g.en === 'string' && g.en.length > 0, JSON.stringify(g)).toBe(true);
      expect(seen.has(g.it.toLowerCase()), `duplicato: ${g.it}`).toBe(false);
      seen.add(g.it.toLowerCase());
    }
  });
});
