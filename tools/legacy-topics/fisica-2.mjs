#!/usr/bin/env node
// Estrae dal sito originale di Fisica Generale II l'elenco ESATTO degli argomenti.
//
// Nel sito originale la teoria è divisa in capitoli (i 7 blocchi del programma ufficiale, data/programma.json)
// e ogni capitolo in sezioni (le sezioni del programma: 1a, 1b, 1c, 2, 3a, 3b, …), ciascuna con il proprio titolo
// <h2> in data/teoria/<blocco>.html. Gli argomenti del nuovo sito sono queste sezioni, nello stesso ordine e con
// gli stessi titoli; il gruppo di ogni argomento è il capitolo (blocco) del programma.
//
//   node tools/legacy-topics/fisica-2.mjs [cartella-legacy]   → stampa l'elenco in JSON
//
// Il test di CI confronta questo elenco con src/content/topics/fisica-2/.
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

/** id stabili (kebab-case) degli argomenti, indicizzati per id di sezione del programma originale */
export const TOPIC_IDS = {
  b1a: 'elettrostatica-nel-vuoto',
  b1b: 'conduttori-capacita',
  b1c: 'dielettrici',
  b2a: 'corrente-stazionaria',
  b3a: 'magnetostatica-nel-vuoto',
  b3b: 'magnetismo-nella-materia',
  b4a: 'campi-variabili',
  b5a: 'onde-elettromagnetiche',
  b5b: 'radiazione-materia',
  b6a: 'fisica-moderna',
  b7a: 'laboratorio-misura',
};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');

/**
 * @param {string} [legacyDir] cartella del sito originale (default: legacy/fisica-2)
 * @returns {{ id: string, legacyId: string, order: number, title: string, group: { id: string, order: number, title: string } }[]}
 */
function legacyTopics(legacyDir = path.join(ROOT, 'legacy/fisica-2')) {
  const programma = JSON.parse(readFileSync(path.join(legacyDir, 'data/programma.json'), 'utf8'));
  const out = [];
  for (const b of programma.blocchi) {
    const html = readFileSync(path.join(legacyDir, `data/teoria/${b.id}.html`), 'utf8');
    // ogni sezione del capitolo: <section class="t-sec" id="b1a"> … <h2>1a · Titolo</h2>
    const re = /<section[^>]*\bid="([a-z0-9]+)"[^>]*>\s*<h2[^>]*>([\s\S]*?)<\/h2>/g;
    const found = [...html.matchAll(re)].map((m) => ({ id: m[1], title: decode(m[2].replace(/<[^>]+>/g, '')).trim() }));
    const sezioni = b.sezioni.map((s) => s.id);
    if (found.map((f) => f.id).join() !== sezioni.join()) {
      throw new Error(`Capitolo ${b.id}: sezioni della teoria (${found.map((f) => f.id)}) diverse dal programma (${sezioni})`);
    }
    for (const f of found) {
      if (!TOPIC_IDS[f.id]) throw new Error(`Sezione ${f.id} senza id stabile in TOPIC_IDS`);
      out.push({
        id: TOPIC_IDS[f.id],
        legacyId: f.id,
        order: out.length + 1,
        // il sito originale mostra il titolo senza il numero di sezione ("1a · ")
        title: f.title.replace(/^\d\w?\s·\s/, ''),
        group: { id: `cap-${b.numero}`, order: b.numero, title: b.titolo },
      });
    }
  }
  return out;
}

/** Contratto di tools/legacy-topics: [{ title, group }] nell'ordine originale. */
export default function extract(legacyDir) {
  return legacyTopics(legacyDir).map((t) => ({ title: t.title, group: t.group.title, id: t.id }));
}
export { legacyTopics };

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  console.log(JSON.stringify(legacyTopics(process.argv[2] ? path.resolve(process.argv[2]) : undefined), null, 2));
}
