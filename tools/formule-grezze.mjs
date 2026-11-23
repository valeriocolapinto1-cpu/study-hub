#!/usr/bin/env node
/**
 * Misura delle formule grezze nel testo visibile (revisione 2, R10): apre ogni pagina della build servita
 * da tools/serve-dist.mjs, aspetta le isole, apre i <details> e cerca nel testo di <main> fuori da KaTeX,
 * codice e figure `$…$`, comandi TeX, pedici `x_…` ed esponenti `^{…}`.
 * Uso: node tools/formule-grezze.mjs [porta=4321] [filtro percorso] > rapporto.json
 */
import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { chromium } from 'playwright';
import { BASE } from './site-base.mjs';
import { formuleGrezze } from './formule-grezze-regole.mjs';

const PORT = Number(process.argv[2] ?? 4321);
const FILTRO = process.argv[3] ?? '';
const DIST = resolve(import.meta.dirname, '..', 'dist');

function pagine(dir) {
  const out = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...pagine(p));
    else if (n === 'index.html') out.push(relative(DIST, dir).replaceAll('\\', '/'));
  }
  return out;
}

const elenco = ['it', 'en']
  .flatMap((l) => pagine(join(DIST, l)))
  .filter((p) => p.includes(FILTRO))
  .sort();

const browser = await chromium.launch();
const ctx = await browser.newContext({ serviceWorkers: 'block' });
const risultati = {};
let i = 0;
async function lavora() {
  const page = await ctx.newPage();
  while (i < elenco.length) {
    const p = elenco[i++];
    try {
      await page.goto(`http://localhost:${PORT}${BASE}${p}/`, { waitUntil: 'networkidle', timeout: 60_000 });
      await page
        .waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0, null, {
          timeout: 15_000,
        })
        .catch(() => {});
      await page.waitForTimeout(300);
      const testo = await page.evaluate(() => {
        for (const d of document.querySelectorAll('details')) d.open = true;
        const main = document.querySelector('main') ?? document.body;
        const c = main.cloneNode(true);
        for (const el of c.querySelectorAll('.katex, pre, code, script, style, svg, template, [data-tex-ok]'))
          el.remove();
        document.body.append(c);
        const t = c.innerText;
        c.remove();
        return t;
      });
      const trovati = formuleGrezze(testo);
      if (trovati.length) risultati[p] = trovati;
    } catch (e) {
      risultati[p] = [`ERRORE: ${e.message.split('\n')[0]}`];
    }
  }
  await page.close();
}
await Promise.all(Array.from({ length: 6 }, lavora));
await browser.close();
const frammenti = new Set(Object.values(risultati).flat());
console.error(
  `${elenco.length} pagine, ${Object.keys(risultati).length} con formule grezze, ${frammenti.size} frammenti`,
);
console.log(JSON.stringify(risultati, null, 1));
