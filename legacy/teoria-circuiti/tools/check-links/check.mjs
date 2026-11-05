#!/usr/bin/env node
// Controlla i link del sito. Uso:
//   node tools/check-links/check.mjs              → link interni (file e ancore) e riferimenti negli JSON
//   node tools/check-links/check.mjs --external   → controlla anche gli URL esterni (richiede rete)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';

const root = resolve(new URL('../../', import.meta.url).pathname);
const external = process.argv.includes('--external');
const errors = [], urls = new Set();
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); if (['node_modules', '.git', 'sources-private', 'tests', '_site'].includes(f)) return []; return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(root);

function checkInternal(from, href) {
  if (!href || /^(mailto:|tel:|data:|javascript:|#)/.test(href)) return;
  if (/^https?:\/\//.test(href)) { urls.add(href); return; }
  if (href.startsWith('/')) { errors.push(`${relative(root, from)}: link assoluto ${href} (usare percorsi relativi)`); return; }
  const clean = href.split('#')[0].split('?')[0]; if (!clean) return;
  let target = resolve(dirname(from), clean);
  if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
  if (!existsSync(target)) errors.push(`${relative(root, from)}: link interno rotto → ${href}`);
}
for (const f of files.filter((f) => f.endsWith('.html'))) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/(?:href|src)="([^"]+)"/g)) checkInternal(f, m[1]);
}
// riferimenti nei dati
const syl = JSON.parse(readFileSync(join(root, 'data/syllabus.json'), 'utf8'));
for (const a of syl.argomenti) { const t = join(root, 'studio'); if (!existsSync(t)) errors.push('manca studio/'); if (a.contenuto && !existsSync(join(root, 'data/studio', a.id + '.json'))) errors.push(`manca data/studio/${a.id}.json`); }
for (const f of ['data/risorse.json', 'data/archivio.json']) { const t = readFileSync(join(root, f), 'utf8'); for (const m of t.matchAll(/"(https?:\/\/[^"]+)"/g)) urls.add(m[1]); }
const ids = new Set(syl.argomenti.map((a) => a.id));
for (const r of JSON.parse(readFileSync(join(root, 'data/risorse.json'), 'utf8')).risorse) for (const id of [...r.copre, ...r.non_copre]) if (!ids.has(id)) errors.push(`risorse.json: argomento ignoto ${id} in ${r.id}`);

let ext = [];
if (external) {
  for (const u of urls) {
    try { const c = new AbortController(); const t = setTimeout(() => c.abort(), 15000); const r = await fetch(u, { method: 'GET', redirect: 'follow', signal: c.signal, headers: { 'user-agent': 'tdc-check-links' } }); clearTimeout(t); if (r.status >= 400) ext.push(`${u} → HTTP ${r.status}`); }
    catch (e) { ext.push(`${u} → ${e.name === 'AbortError' ? 'timeout' : e.message}`); }
  }
}
console.log(`Controllati ${files.filter((f) => f.endsWith('.html')).length} file HTML, ${urls.size} URL esterni${external ? ' (verificati)' : ' (non verificati: usa --external)'}.`);
for (const e of errors) console.log('ERRORE', e);
for (const e of ext) console.log('ESTERNO', e);
process.exit(errors.length ? 1 : 0);
