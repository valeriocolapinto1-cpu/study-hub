#!/usr/bin/env node
/**
 * Server statico di dist/ sotto il percorso base, come GitHub Pages:
 * index.html per le cartelle, 404.html per il resto, compressione gzip dei file di testo (GitHub Pages
 * comprime HTML, CSS, JS e JSON: senza, Lighthouse misurerebbe trasferimenti molto più grandi del reale).
 * Usato da Playwright e Lighthouse CI.
 * Uso: node tools/serve-dist.mjs [porta] [cartella, default dist]
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createGzip } from 'node:zlib';
import { extname, join, normalize, resolve } from 'node:path';
import { BASE } from './site-base.mjs';

const DIST = resolve(import.meta.dirname, '..', process.argv[3] ?? 'dist');
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 4321);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.wasm': 'application/wasm',
  '.pagefind': 'application/octet-stream',
  '.pf_meta': 'application/octet-stream',
};

const COMPRESSIBLE = /^(text\/|application\/(json|manifest\+json|xml))|^image\/svg/;

const send = (req, res, status, file) => {
  const type = TYPES[extname(file)] ?? 'application/octet-stream';
  const gzip = COMPRESSIBLE.test(type) && /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''));
  res.writeHead(status, {
    'content-type': type,
    'cache-control': file.includes('/_astro/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    vary: 'accept-encoding',
    ...(gzip ? { 'content-encoding': 'gzip' } : {}),
  });
  const stream = createReadStream(file);
  if (gzip) stream.pipe(createGzip()).pipe(res);
  else stream.pipe(res);
};

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === BASE.slice(0, -1)) {
    res.writeHead(301, { location: BASE });
    return res.end();
  }
  if (!pathname.startsWith(BASE)) return send(req, res, 404, join(DIST, '404.html'));
  const rel = normalize(pathname.slice(BASE.length)).replace(/^(\.\.[/\\])+/, '');
  let file = join(DIST, rel);
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!pathname.endsWith('/')) {
      res.writeHead(301, { location: `${pathname}/${url.search}` });
      return res.end();
    }
    file = join(file, 'index.html');
  }
  if (!file.startsWith(DIST) || !existsSync(file)) return send(req, res, 404, join(DIST, '404.html'));
  return send(req, res, 200, file);
}).listen(PORT, () => console.log(`dist/ servito su http://localhost:${PORT}${BASE}`));
