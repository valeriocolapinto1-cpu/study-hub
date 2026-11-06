/**
 * Indice di ricerca Pagefind a build-time.
 *
 * Un indice per lingua (dist/pagefind/it/, dist/pagefind/en/) con lo stemming
 * giusto per ciascuna: l'interfaccia cerca nella lingua della pagina o in entrambe.
 * Pagine: solo il contenuto marcato `data-pagefind-body` (BaseLayout), con i filtri
 * `tipo` e `corso`. In più i record di dist/search-records.json (formule, esercizi,
 * flashcard), che il file poi elimina.
 */
import { readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import * as pagefind from 'pagefind';

export const RECORDS_FILE = 'search-records.json';

/**
 * @param {string} distDir cartella della build
 * @param {string} base percorso base del sito con barra finale (es. "/study-hub/")
 * @param {{ info(msg: string): void; warn(msg: string): void }} logger
 */
export async function buildSearchIndex(distDir, base, logger) {
  const recordsPath = join(distDir, RECORDS_FILE);
  /** @type {{ url: string; language: string; content: string; meta: Record<string,string>; filters: Record<string,string[]> }[]} */
  let records = [];
  try {
    records = JSON.parse(await readFile(recordsPath, 'utf8'));
    await rm(recordsPath);
  } catch {
    logger.warn(`${RECORDS_FILE} non trovato: indicizzo solo le pagine`);
  }

  for (const lang of ['it', 'en']) {
    const { index, errors } = await pagefind.createIndex({ forceLanguage: lang });
    if (!index) throw new Error(`Pagefind: ${errors.join('; ')}`);
    const pages = await index.addDirectory({ path: distDir, glob: `${lang}/**/*.html` });
    if (pages.errors.length) throw new Error(`Pagefind: ${pages.errors.join('; ')}`);
    let extra = 0;
    for (const r of records) {
      if (r.language !== lang) continue;
      // Gli URL delle pagine sono relativi alla radice di dist: togli la base anche dai record.
      const url = r.url.startsWith(base) ? `/${r.url.slice(base.length)}` : r.url;
      const res = await index.addCustomRecord({ ...r, url });
      if (res.errors.length) throw new Error(`Pagefind (record ${r.url}): ${res.errors.join('; ')}`);
      extra++;
    }
    const out = await index.writeFiles({ outputPath: join(distDir, 'pagefind', lang) });
    if (out.errors.length) throw new Error(`Pagefind: ${out.errors.join('; ')}`);
    // Solo l'API JS serve: via l'interfaccia predefinita di Pagefind (il sito ha la sua).
    const outDir = join(distDir, 'pagefind', lang);
    for (const f of await readdir(outDir))
      if (
        /^pagefind-(component-|modular-)?ui\.(js|css)$|^pagefind-highlight\.js$|^wasm\.unknown\.pagefind$/.test(
          f,
        )
      )
        await rm(join(outDir, f));
    logger.info(`ricerca ${lang}: ${pages.page_count} pagine + ${extra} record`);
  }
  await pagefind.close();
}
