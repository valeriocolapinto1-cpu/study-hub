#!/usr/bin/env node
// Elenca tutti i punti marcati «DA VERIFICARE» nei dati e nelle pagine. Uso: node tools/list-da-verificare.mjs [--md]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
const root = new URL('../', import.meta.url).pathname;
const skip = new Set(['node_modules', '.git', 'tests', 'sources-private', '_site', 'sw.js', 'CHECKLIST.md']);
const walk = (d) => readdirSync(d).flatMap((f) => { if (skip.has(f)) return []; const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\\\\/g, '\\').replace(/\s+/g, ' ').trim();
const out = [];
for (const f of walk(root).filter((p) => /\.(json|html|js|mjs|md)$/.test(p))) {
  if (/data\/studio\//.test(f) || /tools\/content\//.test(f)) { /* dedup: contenuti generati */ if (/data\/studio\//.test(f)) continue; }
  const rel = relative(root, f);
  if (rel === 'README.md' || rel.startsWith('assets/js/ui.js') || rel.startsWith('assets/js/pages/faq.js') || rel.startsWith('tools/list-da-verificare')) continue;
  const s = readFileSync(f, 'utf8');
  for (const m of s.matchAll(/[^.\n]{0,140}DA VERIFICARE[^.\n]{0,100}/g)) out.push({ file: rel, testo: strip(m[0]).slice(0, 200) });
}
const seen = new Set(); const uniq = out.filter((o) => { const k = o.testo; if (seen.has(k)) return false; seen.add(k); return true; });
if (process.argv.includes('--md')) for (const o of uniq) console.log(`- ${o.testo} _(${o.file})_`);
else for (const o of uniq) console.log(`${o.file}: ${o.testo}`);
console.error(`\n${uniq.length} punti DA VERIFICARE`);
