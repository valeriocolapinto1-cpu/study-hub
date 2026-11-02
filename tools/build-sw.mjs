#!/usr/bin/env node
// Rigenera l'elenco dei file in sw.js (e la versione, da un hash dei contenuti). Uso: node tools/build-sw.mjs [--check]
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
const root = new URL('../', import.meta.url).pathname;
const skip = new Set(['node_modules', '.git', '.github', 'tests', 'tools', 'sources-private', '_site', 'package.json', 'package-lock.json', 'README.md', 'CHECKLIST.md', '.gitignore', '.nojekyll', 'sw.js']);
const walk = (d) => readdirSync(d).sort().flatMap((f) => { if (skip.has(f)) return []; const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(root).map((p) => relative(root, p)).filter((p) => !p.endsWith('.png') || true);
const hash = createHash('sha256'); for (const f of files) { hash.update(f); hash.update(readFileSync(join(root, f))); }
const version = 'tdc-' + hash.digest('hex').slice(0, 10);
// le pagine «cartella» si servono anche come «./cartella/»
const list = ['./', ...files.map((f) => './' + f)];
const src = readFileSync(join(root, 'sw.js'), 'utf8');
const out = src.replace(/const VERSION = '[^']*';/, `const VERSION = '${version}';`).replace(/const FILES = \[[\s\S]*?\];/, `const FILES = ${JSON.stringify(list, null, 1)};`);
if (process.argv.includes('--check')) { if (out !== src) { console.error('sw.js non aggiornato: esegui node tools/build-sw.mjs'); process.exit(1); } console.log('sw.js aggiornato:', version, list.length, 'file'); process.exit(0); }
writeFileSync(join(root, 'sw.js'), out); console.log('sw.js scritto:', version, list.length, 'file');
