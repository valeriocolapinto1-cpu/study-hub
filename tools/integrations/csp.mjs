/**
 * Content-Security-Policy in `<meta http-equiv>` (GitHub Pages non permette intestazioni HTTP),
 * aggiunta a ogni pagina di dist dopo la build, prima di ricerca e service worker.
 *
 * - `script-src 'self'` più l'hash SHA-256 di ogni script inline eseguibile della pagina (tema in
 *   Head.astro, runtime delle isole e direttive `client:*` di Astro, script piccoli che Vite mette
 *   inline): niente `'unsafe-inline'`. `'wasm-unsafe-eval'` serve a Pagefind (WebAssembly).
 * - `style-src 'unsafe-inline'`: KaTeX e i simulatori scrivono attributi `style` nell'HTML, che con
 *   un hash nella direttiva verrebbero bloccati; gli stili non eseguono codice.
 * - Domini esterni solo dove servono: Turnstile (script e iframe) e Google Apps Script (invio)
 *   nella pagina Contribuisci (src/islands/ContributeForm.tsx, src/lib/contribute/upload.ts).
 *
 * Il meta va prima di ogni script: subito dopo `<meta charset>` (o in testa a `<head>`).
 * In sviluppo (`astro dev`) non c'è CSP: si verifica sulla build (tests/content/csp.test.ts, e2e).
 */
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

export const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';
export const APPS_SCRIPT_ORIGINS = ['https://script.google.com', 'https://script.googleusercontent.com'];

/** Politica comune a tutte le pagine. */
export const BASE_POLICY = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'wasm-unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'"],
  'media-src': ["'self'", 'blob:'],
  'worker-src': ["'self'"],
  'manifest-src': ["'self'"],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

/** Aggiunte per pagina (percorso relativo a dist, con `/`). */
export const PAGE_POLICIES = [
  {
    test: /^(it|en)\/contribuisci\/index\.html$/,
    add: {
      'script-src': [TURNSTILE_ORIGIN],
      'frame-src': [TURNSTILE_ORIGIN],
      'connect-src': APPS_SCRIPT_ORIGINS,
    },
  },
];

/** Tipi di `<script>` eseguiti dal browser (gli altri, come JSON e JSON-LD, sono dati). */
const EXECUTABLE = /^(?:|text\/javascript|application\/javascript|module|speculationrules)$/i;

/** Contenuti degli script inline eseguibili di una pagina. */
export function inlineScripts(html) {
  const out = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attrs = m[1] ?? '';
    if (/\ssrc\s*=/i.test(attrs)) continue;
    const type = /\stype\s*=\s*["']?([^"'\s>]*)/i.exec(attrs)?.[1] ?? '';
    if (!EXECUTABLE.test(type.trim())) continue;
    out.push(m[2] ?? '');
  }
  return out;
}

export const sha256 = (text) => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;

/** Politica (testo del meta) di una pagina, dato il suo percorso e i suoi script inline. */
export function policyFor(rel, scripts) {
  const policy = Object.fromEntries(Object.entries(BASE_POLICY).map(([k, v]) => [k, [...v]]));
  for (const page of PAGE_POLICIES) {
    if (!page.test.test(rel)) continue;
    for (const [directive, sources] of Object.entries(page.add)) {
      const list = (policy[directive] ?? []).filter((s) => s !== "'none'");
      policy[directive] = [...new Set([...list, ...sources])];
    }
  }
  policy['script-src'] = [...new Set([...policy['script-src'], ...scripts.map(sha256)])];
  return Object.entries(policy)
    .map(([k, v]) => `${k} ${v.join(' ')}`)
    .join('; ');
}

const escapeAttr = (s) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
const META_RE = /<meta\s+http-equiv="content-security-policy"[^>]*>/i;

/** Aggiunge (o sostituisce) il meta della CSP subito dopo `<meta charset>`. */
export function injectCsp(html, rel) {
  const clean = html.replace(META_RE, '');
  const meta = `<meta http-equiv="Content-Security-Policy" content="${escapeAttr(policyFor(rel, inlineScripts(clean)))}">`;
  const charset = /<meta\s+charset=["']?[\w-]+["']?\s*\/?>/i.exec(clean);
  if (charset) {
    const at = charset.index + charset[0].length;
    return clean.slice(0, at) + meta + clean.slice(at);
  }
  const head = /<head\b[^>]*>/i.exec(clean);
  if (!head) throw new Error(`CSP: <head> mancante in ${rel}`);
  const at = head.index + head[0].length;
  return clean.slice(0, at) + meta + clean.slice(at);
}

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith('.html')) yield path;
  }
}

/** Applica la CSP a tutte le pagine di dist. */
export async function applyCsp(dist, logger) {
  let pages = 0;
  const hashes = new Set();
  for await (const file of htmlFiles(dist)) {
    const rel = relative(dist, file).split(sep).join('/');
    const html = await readFile(file, 'utf8');
    for (const s of inlineScripts(html)) hashes.add(sha256(s));
    await writeFile(file, injectCsp(html, rel));
    pages++;
  }
  logger?.info?.(`CSP: ${pages} pagine, ${hashes.size} script inline distinti`);
}
