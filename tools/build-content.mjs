// Genera data/studio/*.json, data/formulario.json e aggiorna i flag "contenuto" del syllabus.
// Uso: node tools/build-content.mjs
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
const dir = new URL('./content/', import.meta.url);
const root = new URL('../', import.meta.url);
mkdirSync(new URL('data/studio/', root), { recursive: true });
const studio = {};
const forms = [];
for (const f of readdirSync(dir).sort()) {
  if (/^blocco.*\.mjs$/.test(f)) { const m = await import(new URL(f, dir)); for (const v of Object.values(m)) Object.assign(studio, v); }
  if (/^formulario-.*\.mjs$/.test(f)) { const m = await import(new URL(f, dir)); for (const v of Object.values(m)) forms.push(...v); }
}
for (const [id, c] of Object.entries(studio)) writeFileSync(new URL(`data/studio/${id}.json`, root), JSON.stringify({ id, ...c }, null, 1));
const keys = ['id', 'blocco', 'titolo', 'formula', 'simboli', 'uso', 'errore', 'studio'];
const voci = forms.map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i]])));
writeFileSync(new URL('data/formulario.json', root), JSON.stringify({ _nota: 'Generato da tools/build-content.mjs', voci }, null, 1));
const syl = JSON.parse(readFileSync(new URL('data/syllabus.json', root), 'utf8'));
for (const a of syl.argomenti) a.contenuto = Object.prototype.hasOwnProperty.call(studio, a.id);
writeFileSync(new URL('data/syllabus.json', root), JSON.stringify(syl, null, 1));
console.log(Object.keys(studio).length, 'pagine di studio,', voci.length, 'voci di formulario');
