#!/usr/bin/env node
/**
 * Server statico di dist/ sotto il percorso base, come GitHub Pages:
 * index.html per le cartelle, 404.html per il resto. Usato da Playwright e Lighthouse CI.
 * Uso: node tools/serve-dist.mjs [porta] [cartella, default dist]
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
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
};

const send = (res, status, file) => {
  res.writeHead(status, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    'cache-control': file.includes('/_astro/') ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  createReadStream(file).pipe(res);
};

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === BASE.slice(0, -1)) {
    res.writeHead(301, { location: BASE });
    return res.end();
  }
  if (!pathname.startsWith(BASE)) return send(res, 404, join(DIST, '404.html'));
  const rel = normalize(pathname.slice(BASE.length)).replace(/^(\.\.[/\\])+/, '');
  let file = join(DIST, rel);
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!pathname.endsWith('/')) {
      res.writeHead(301, { location: `${pathname}/${url.search}` });
      return res.end();
    }
    file = join(file, 'index.html');
  }
  if (!file.startsWith(DIST) || !existsSync(file)) return send(res, 404, join(DIST, '404.html'));
  return send(res, 200, file);
}).listen(PORT, () => console.log(`dist/ servito su http://localhost:${PORT}${BASE}`));
