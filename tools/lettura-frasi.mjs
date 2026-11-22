#!/usr/bin/env node
/**
 * Estrae le frasi visibili delle pagine campione della revisione di lettura e le salva in
 * tests/e2e/lettura/frasi.json. Si esegue sulla build di PARTENZA, prima di cambiare la presentazione:
 * tests/e2e/lettura.spec.ts verifica poi che le pagine nuove contengano ancora tutte le frasi.
 * Uso: node tools/serve-dist.mjs 4400 <cartella-della-build> &
 *      node --experimental-strip-types tools/lettura-frasi.mjs 4400
 * Se un contenuto cambia davvero (testo corretto, argomento nuovo), si rigenera dalla build di main.
 */
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { PAGINE_LETTURA, righeVisibili } from '../tests/e2e/lettura/testo.ts';

const port = process.argv[2] ?? '4400';
const executablePath = process.env.PW_CHROMIUM_PATH;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const out = {};
for (const p of PAGINE_LETTURA) {
  await page.goto(`http://localhost:${port}/study-hub/${p.path}`, { waitUntil: 'networkidle' });
  // Blocchi <details> chiusi nel contenuto: la revisione non deve aggiungerne.
  const chiusi = await page.locator('main details:not([open])').count();
  out[p.name] = { chiusi, frasi: [...new Set(await righeVisibili(page))] };
}
await browser.close();
writeFileSync(
  new URL('../tests/e2e/lettura/frasi.json', import.meta.url),
  `${JSON.stringify(out, null, 1)}\n`,
);
console.log(
  Object.entries(out)
    .map(([k, v]) => `${k}: ${v.frasi.length} frasi, ${v.chiusi} details chiusi`)
    .join('\n'),
);
