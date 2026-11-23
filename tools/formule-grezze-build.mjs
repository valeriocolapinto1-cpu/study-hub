#!/usr/bin/env node
/**
 * Controllo statico delle formule grezze sulla build (dist/): testo visibile dell'HTML (pagine e stampe, con
 * l'HTML già reso delle isole) e testi dei dati delle isole (`dati/*.json`, caricati nel browser). Vedi tools/formule-grezze-regole.mjs.
 * Uso: node tools/formule-grezze-build.mjs [cartella=dist]  → JSON { file: [frammenti] }, uscita 1 se ce ne sono.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { testoVisibile } from './formule-grezze-html.mjs';
import { formuleGrezze } from './formule-grezze-regole.mjs';

function file(dir, est) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? file(p, est) : e.name.endsWith(est) ? [p] : [];
  });
}

/** Stringhe di un valore JSON (props serializzate di Astro comprese), con la chiave che le contiene. */
function stringhe(v, chiave = '', out = []) {
  if (typeof v === 'string') out.push([chiave, v]);
  else if (Array.isArray(v)) for (const x of v) stringhe(x, chiave, out);
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) stringhe(x, k, out);
  return out;
}

/** Chiavi dei dati che non sono testo da leggere (identificatori, URL, sorgenti TeX resi dal client). */
const CHIAVI_NON_TESTO = new Set([
  'tex',
  'labelTex',
  'id',
  'href',
  'url',
  'detailsUrl',
  'src',
  'courseId',
  'topic',
  'lang',
  'generator',
]);

const testoDiStringa = (s) => (/<[a-z][^>]*>/i.test(s) ? testoVisibile(s) : s);

export function controllaBuild(dist) {
  const risultati = {};
  const segna = (f, testo) => {
    const t = formuleGrezze(testo);
    if (!t.length) return;
    const insieme = (risultati[relative(dist, f)] ??= new Set());
    for (const x of t) insieme.add(x);
  };
  for (const f of file(dist, '.html')) {
    const html = readFileSync(f, 'utf8');
    segna(f, testoVisibile(html));
  }
  for (const f of file(dist, '.json').filter((p) => /[\\/]dati[\\/]/.test(p))) {
    for (const [k, s] of stringhe(JSON.parse(readFileSync(f, 'utf8'))))
      if (!CHIAVI_NON_TESTO.has(k)) segna(f, testoDiStringa(s));
  }
  return Object.fromEntries(Object.entries(risultati).map(([k, v]) => [k, [...v]]));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dist = resolve(process.argv[2] ?? 'dist');
  const r = controllaBuild(dist);
  const n = Object.keys(r).length;
  console.error(`${n} file con formule grezze, ${new Set(Object.values(r).flat()).size} frammenti`);
  console.log(JSON.stringify(r, null, 1));
  process.exit(n ? 1 : 0);
}
