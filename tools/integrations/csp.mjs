/**
 * Content-Security-Policy in `<meta http-equiv>` (GitHub Pages non permette intestazioni HTTP),
 * aggiunta a ogni pagina di dist dopo la build, prima di ricerca e service worker.
 *
 * - `script-src 'self'` più l'hash SHA-256 di ogni script inline eseguibile della pagina (tema in
 *   Head.astro, runtime delle isole e direttive `client:*` di Astro, script piccoli che Vite mette
 *   inline): niente `'unsafe-inline'`. `'wasm-unsafe-eval'` serve a Pagefind (WebAssembly).
 * - `style-src 'unsafe-inline'`: KaTeX e i simulatori scrivono attributi `style` nell'HTML, che con
 *   un hash nella direttiva verrebbero bloccati; gli stili non eseguono codice.
 * - Domini esterni solo dove servono: il Worker del tutor AI (e Turnstile, se ha una sitekey) solo nelle pagine che contengono la sua
 *   configurazione (`data-tutor-endpoint`, src/components/course/Tutor.astro), cioè solo quando
 *   `SITE.tutor.endpoint` è impostato: altrimenti nessuna pagina cambia. La pagina Contribuisci
 *   (R14) ha solo un link al Google Form: un link non è una richiesta e non richiede nessuna
 *   sorgente in più (prima c'erano Turnstile e Apps Script).
 *
 * Il meta va prima di ogni script: subito dopo `<meta charset>` (o in testa a `<head>`).
 * In sviluppo (`astro dev`) non c'è CSP: si verifica sulla build (tests/content/csp.test.ts, e2e).
 */
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

export const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';

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

/**
 * Aggiunte per pagina (percorso relativo a dist, con `/`): `{ test: RegExp, add: { direttiva: [sorgenti] } }`.
 * Oggi nessuna: era la pagina Contribuisci con Turnstile e Apps Script, sostituiti da un link (R14).
 */
export const PAGE_POLICIES = [];

/**
 * Aggiunte decise dal contenuto della pagina: il tutor AI (R12). L'origine del Worker viene
 * dall'attributo `data-tutor-endpoint` della configurazione; deve essere https (o http su localhost).
 */
export const HTML_POLICIES = [
  {
    match: /<script\b[^>]*\bdata-tutor-endpoint="([^"]+)"[^>]*>/i,
    add: (m) => {
      const origin = tutorOrigin(m[1]);
      const turnstile = /\bdata-tutor-turnstile\b/i.test(m[0]);
      return {
        'connect-src': [origin],
        ...(turnstile ? { 'script-src': [TURNSTILE_ORIGIN], 'frame-src': [TURNSTILE_ORIGIN] } : {}),
      };
    },
  },
];

/** Origine del Worker, validata (niente sorgenti CSP arbitrarie da un attributo). */
export function tutorOrigin(raw) {
  const url = new URL(raw.replaceAll('&amp;', '&'));
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:'))
    throw new Error(`CSP: origine del tutor non sicura: ${raw}`);
  return url.origin;
}

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
export function policyFor(rel, scripts, html = '') {
  const policy = Object.fromEntries(Object.entries(BASE_POLICY).map(([k, v]) => [k, [...v]]));
  const extend = (add) => {
    for (const [directive, sources] of Object.entries(add)) {
      const list = (policy[directive] ?? []).filter((s) => s !== "'none'");
      policy[directive] = [...new Set([...list, ...sources])];
    }
  };
  for (const page of PAGE_POLICIES) if (page.test.test(rel)) extend(page.add);
  for (const rule of HTML_POLICIES) {
    const m = rule.match.exec(html);
    if (m) extend(rule.add(m));
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
  const meta = `<meta http-equiv="Content-Security-Policy" content="${escapeAttr(policyFor(rel, inlineScripts(clean), clean))}">`;
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
