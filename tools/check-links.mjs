#!/usr/bin/env node
/**
 * Verifica i link interni del sito compilato (dist/): ogni href/src che punta
 * al sito deve risolvere a un file esistente; nessun riferimento a legacy/.
 * Uso: node tools/check-links.mjs  (dopo npm run build)
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, dirname } from 'node:path';
import { BASE, SITE } from './site-base.mjs';

const DIST = resolve(import.meta.dirname, '../dist');
if (!existsSync(DIST)) {
  console.error('dist/ non esiste: esegui prima npm run build');
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );

const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));
const ATTR = /\s(?:href|src|action)=("([^"]*)"|'([^']*)')/g;
const SRCSET = /\ssrcset=("([^"]*)")/g;
const problems = [];

const resolveTarget = (from, raw) => {
  const url = raw.trim();
  if (!url || url.startsWith('#') || /^(mailto:|tel:|data:|javascript:)/i.test(url)) return null;
  let pathname;
  if (/^https?:\/\//i.test(url)) {
    const u = new URL(url);
    if (`${u.protocol}//${u.host}` !== new URL(SITE).origin) return null; // esterno
    pathname = u.pathname;
  } else if (url.startsWith('//')) {
    return null;
  } else if (url.startsWith('/')) {
    pathname = new URL(url, 'http://x').pathname;
  } else {
    const fromUrl = `/${relative(DIST, from).split('\\').join('/')}`;
    pathname = new URL(url, `http://x${BASE.slice(0, -1)}${fromUrl}`).pathname;
  }
  return decodeURIComponent(pathname);
};

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const rel = relative(DIST, file);
  const urls = [...html.matchAll(ATTR)].map((m) => m[2] ?? m[3] ?? '');
  for (const m of html.matchAll(SRCSET)) urls.push(...m[2].split(',').map((s) => s.trim().split(/\s+/)[0]));
  for (const url of urls) {
    if (/(^|\/)legacy\//.test(url)) problems.push(`${rel}: riferimento a legacy/: ${url}`);
    const pathname = resolveTarget(file, url);
    if (pathname === null) continue;
    if (!pathname.startsWith(BASE)) {
      problems.push(`${rel}: link fuori dal percorso base: ${url}`);
      continue;
    }
    let target = join(DIST, pathname.slice(BASE.length));
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
    if (!existsSync(target)) problems.push(`${rel}: link interrotto: ${url}`);
    else if (pathname.endsWith('/') === false && !/\.[a-z0-9]+$/i.test(pathname))
      problems.push(`${rel}: manca la barra finale: ${url}`);
  }
}

if (existsSync(join(dirname(DIST), 'dist', 'legacy'))) problems.push('dist/legacy non deve esistere');

if (problems.length) {
  console.error(
    `Link interni non validi (${problems.length}):\n${problems.map((p) => `  - ${p}`).join('\n')}`,
  );
  process.exit(1);
}
console.log(`Link interni verificati in ${htmlFiles.length} pagine.`);
