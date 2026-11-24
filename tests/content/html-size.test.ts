/**
 * Peso delle pagine compilate: nessun HTML in dist/ oltre 300 KB, tranne le pagine di stampa e le
 * eccezioni elencate qui sotto (motivate). I formulari sono divisi per capitolo (una pagina ciascuno,
 * revisione 2, R4) e hanno anche un limite proprio; il formulario completo è solo in stampa. I testi delle isole stanno in
 * `dati/<argomento>.json`, non nelle props (docs/ENGINE.md, «Dati per le isole»).
 *
 * Gira dopo `npm run build` (job `build` della CI, con REQUIRE_DIST=1). Senza dist/ e senza
 * REQUIRE_DIST (es. `npm test` in locale o il job `unit`) non c'è nulla da misurare.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIST = join(process.cwd(), 'dist');
const LIMIT = 300 * 1024;

/**
 * Categoria esclusa: pagine di stampa (tutto il contenuto in una pagina, compreso il formulario
 * completo `formulario/stampa/`, fino a ~1 MB per Fisica II). Esclusione consapevole: chi stampa
 * vuole tutto, e la pagina non è nel percorso di studio (ci si arriva dal pulsante «stampa»).
 */
const EXCLUDED = [/\/stampa\//];

/** Pagine del formulario (indice e capitoli), fuori dalla stampa. */
const FORMULARY = /^(it|en)\/anno-\d+\/[^/]+\/formulario\/(?!stampa\/)/;

/** Eccezioni puntuali, con il motivo. Un'eccezione che rientra nel limite va tolta. */
const EXCEPTIONS: Record<string, string> = {
  // catalogo delle figure (pagina di prova, noindex): ospita di proposito tutte le figure del kit
  'it/stile/figure/index.html': 'catalogo figure',
  'en/stile/figure/index.html': 'catalogo figure',
  // teoria statica lunga: ~260 KB di KaTeX (HTML + MathML, che nelle pagine statiche resta)
  'it/anno-2/fisica-2/teoria/elettrostatica-nel-vuoto/index.html': 'teoria con molte formule',
  'en/anno-2/fisica-2/teoria/elettrostatica-nel-vuoto/index.html': 'teoria con molte formule',
  'it/anno-2/fisica-2/teoria/magnetostatica-nel-vuoto/index.html': 'teoria con molte formule',
  'en/anno-2/fisica-2/teoria/magnetostatica-nel-vuoto/index.html': 'teoria con molte formule',
  'it/anno-2/fisica-2/teoria/campi-variabili/index.html': 'teoria con molte formule',
  'en/anno-2/fisica-2/teoria/campi-variabili/index.html': 'teoria con molte formule',
  // esercizi con molte etichette dei campi in KaTeX (revisione 2, R10: `i_L(τ)`, `|V_{R_2}(0^+)|`…, ~9 KB)
  'it/anno-2/fisica-2/esercizi/campi-variabili/index.html': 'etichette dei campi in KaTeX',
};

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? htmlFiles(p) : e.name.endsWith('.html') ? [p] : [];
  });
}

const hasDist = existsSync(join(DIST, 'index.html'));

describe('peso delle pagine HTML', () => {
  it('dist/ esiste quando è richiesto (CI)', () => {
    if (process.env.REQUIRE_DIST) expect(hasDist, 'manca dist/: esegui npm run build').toBe(true);
  });

  it.runIf(hasDist)(`nessuna pagina oltre ${LIMIT / 1024} KB salvo stampa ed eccezioni`, () => {
    const sizes = new Map(
      htmlFiles(DIST).map((f) => [relative(DIST, f).replace(/\\/g, '/'), statSync(f).size]),
    );
    const over = [...sizes]
      .filter(([rel, size]) => size > LIMIT && !EXCLUDED.some((re) => re.test(rel)) && !(rel in EXCEPTIONS))
      .map(([rel, size]) => `${rel}: ${Math.round(size / 1024)} KB`);
    expect(over).toEqual([]);
    const stale = Object.keys(EXCEPTIONS).filter((rel) => (sizes.get(rel) ?? 0) <= LIMIT);
    expect(stale, 'eccezioni non più necessarie (o pagine rinominate): toglile').toEqual([]);
  });

  it.runIf(hasDist)(`formulari: indice e ogni capitolo entro ${LIMIT / 1024} KB, nessuna eccezione`, () => {
    const pages = htmlFiles(DIST)
      .map((f) => [relative(DIST, f).replace(/\\/g, '/'), statSync(f).size] as const)
      .filter(([rel]) => FORMULARY.test(rel));
    // indice + almeno un capitolo per ognuno dei 4 corsi, nelle due lingue
    expect(pages.length).toBeGreaterThanOrEqual(16);
    expect(pages.filter(([rel]) => rel in EXCEPTIONS)).toEqual([]);
    // Un capitolo oltre il limite non va escluso: si alleggeriscono le voci o si divide il capitolo.
    const over = pages
      .filter(([, size]) => size > LIMIT)
      .map(([rel, size]) => `${rel}: ${Math.round(size / 1024)} KB`);
    expect(over).toEqual([]);
  });

  it.runIf(hasDist)('dati delle isole: indice senza HTML, testi per argomento senza MathML', () => {
    const courses = readdirSync(join(DIST, 'it')).filter((d) => d.startsWith('anno-'));
    let checked = 0;
    for (const anno of courses)
      for (const course of readdirSync(join(DIST, 'it', anno))) {
        const dir = join(DIST, 'it', anno, course, 'dati');
        if (!existsSync(dir)) continue;
        const files = readdirSync(dir);
        expect(files).toContain('indice.json');
        expect(existsSync(join(DIST, 'it', anno, course, 'dati.json'))).toBe(false);
        for (const f of files) {
          const text = readFileSync(join(dir, f), 'utf8');
          expect(text, `${course}/dati/${f}`).not.toContain('katex-mathml');
          if (f === 'indice.json') expect(text, `${course}/dati/indice.json`).not.toMatch(/Html"|<span|<svg/);
        }
        checked++;
      }
    expect(checked).toBeGreaterThan(0);
  });
});
