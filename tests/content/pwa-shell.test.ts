/**
 * Service worker sul sito compilato: la prima installazione (shell in precache) resta leggera
 * e ogni corso scaricato per l'offline porta con sé l'indice di ricerca della sua lingua.
 *
 * Gira dopo `npm run build` (job `build` della CI, con REQUIRE_DIST=1). Senza dist/ e senza
 * REQUIRE_DIST (es. `npm test` in locale o il job `unit`) non c'è nulla da misurare.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIST = join(process.cwd(), 'dist');
/** Limiti della prima installazione (richieste e byte scaricati dal service worker). */
const MAX_FILES = 200;
const MAX_BYTES = 1_500_000;
/** sw.js si riscarica a ogni controllo di aggiornamento: gli elenchi dei file stanno nei JSON a parte. */
const MAX_SW_BYTES = 15_000;

type Entry = [string, string, number];
interface Manifest {
  version: string;
  base: string;
  shell: Entry[];
  courses: Record<string, Record<string, Entry[]>>;
}

const hasSw = existsSync(join(DIST, 'sw.js'));

interface Published {
  version: string;
  base: string;
  shell: Entry[];
  courses: Record<string, Record<string, string>>;
}

const readJson = <T>(file: string) => JSON.parse(readFileSync(join(DIST, file), 'utf8')) as T;

/** `SW` in testa a dist/sw.js: versione, base e nome del manifest. */
function readSw(): { version: string; base: string; manifest: string } {
  const sw = readFileSync(join(DIST, 'sw.js'), 'utf8');
  const m = /^const SW = (.*);$/m.exec(sw);
  if (!m) throw new Error('SW non trovato in dist/sw.js');
  return JSON.parse(m[1]!);
}

/** Manifest con gli elenchi dei corsi letti dai rispettivi file. */
function readManifest(): Manifest {
  const pub = readJson<Published>(readSw().manifest);
  const courses: Manifest['courses'] = {};
  for (const [id, langs] of Object.entries(pub.courses))
    for (const [lang, file] of Object.entries(langs)) (courses[id] ??= {})[lang] = readJson<Entry[]>(file);
  return { ...pub, courses };
}

describe('service worker del sito compilato', () => {
  it('dist/sw.js esiste quando è richiesto (CI)', () => {
    if (process.env.REQUIRE_DIST) expect(hasSw, 'manca dist/sw.js: esegui npm run build').toBe(true);
  });

  it.runIf(hasSw)(`sw.js piccolo (al più ${MAX_SW_BYTES / 1000} KB) e manifest a parte`, () => {
    const bytes = statSync(join(DIST, 'sw.js')).size;
    expect(bytes, 'dist/sw.js troppo grande').toBeLessThanOrEqual(MAX_SW_BYTES);
    const sw = readSw();
    const manifest = readJson<Published>(sw.manifest);
    // La versione è in sw.js: a ogni pubblicazione cambia e il browser installa il worker nuovo.
    expect(manifest.version).toBe(sw.version);
    expect(sw.manifest).toMatch(/^sw-manifest\.[a-f0-9]{12}\.json$/);
    for (const langs of Object.values(manifest.courses))
      for (const file of Object.values(langs))
        expect(file).toMatch(/^sw-course\.[a-z0-9-]+\.(it|en)\.[a-f0-9]{12}\.json$/);
    // Manifest ed elenchi non sono file da mettere in cache.
    const urls = [manifest.shell, ...Object.values(readManifest().courses).flatMap((l) => Object.values(l))]
      .flat()
      .map((e) => e[0]);
    expect(urls.filter((u) => /\/sw(-manifest|-course)?\./.test(u))).toEqual([]);
  });

  it.runIf(hasSw)(`prima installazione: al più ${MAX_FILES} file e ${MAX_BYTES / 1e6} MB`, () => {
    const { shell, base } = readManifest();
    const bytes = shell.reduce((s, e) => s + e[2], 0);
    expect(shell.length).toBeLessThanOrEqual(MAX_FILES);
    expect(bytes).toBeLessThanOrEqual(MAX_BYTES);
    // Niente indice di ricerca né pagine di prova nella shell.
    expect(shell.filter((e) => e[0].startsWith(`${base}pagefind/`))).toEqual([]);
    expect(shell.filter((e) => /\/stile\//.test(e[0]))).toEqual([]);
    const summary = JSON.parse(readFileSync(join(DIST, 'offline-summary.json'), 'utf8'));
    expect(summary.shell).toEqual({ files: shell.length, bytes });
  });

  it.runIf(hasSw)('ogni corso scaricato contiene dati delle isole e indice di ricerca della lingua', () => {
    const { courses, base } = readManifest();
    expect(Object.keys(courses).length).toBeGreaterThan(0);
    for (const [id, langs] of Object.entries(courses))
      for (const [lang, entries] of Object.entries(langs)) {
        const urls = new Set(entries.map((e) => e[0]));
        const label = `${id} (${lang})`;
        // Dati delle isole: ogni file non HTML sotto il percorso del corso va con il corso.
        const coursePath = [...urls].find((u) => new RegExp(`^${base}${lang}/anno-\\d+/${id}/$`).test(u));
        expect(coursePath, `${label}: panoramica`).toBeDefined();
        const datiDir = join(DIST, coursePath!.slice(base.length), 'dati');
        if (existsSync(datiDir))
          for (const f of readdirSync(datiDir))
            expect(urls.has(`${coursePath}dati/${f}`), `${label}: dati/${f}`).toBe(true);
        // Indice della lingua: tutti i file tranne i frammenti, più i frammenti del corso.
        const pf = join(DIST, 'pagefind', lang);
        for (const f of readdirSync(pf, { withFileTypes: true })) {
          if (f.isFile())
            expect(urls.has(`${base}pagefind/${lang}/${f.name}`), `${label}: ${f.name}`).toBe(true);
          else if (f.name !== 'fragment')
            for (const g of readdirSync(join(pf, f.name)))
              expect(urls.has(`${base}pagefind/${lang}/${f.name}/${g}`), `${label}: ${f.name}/${g}`).toBe(
                true,
              );
        }
        expect(
          [...urls].some((u) => u.startsWith(`${base}pagefind/${lang}/fragment/`)),
          `${label}: frammenti`,
        ).toBe(true);
        const other = lang === 'it' ? 'en' : 'it';
        expect(
          [...urls].some((u) => u.startsWith(`${base}pagefind/${other}/`)),
          `${label}: altra lingua`,
        ).toBe(false);
      }
  });
});
