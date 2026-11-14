/**
 * Service worker a build-time (unico per tutto il sito).
 *
 * Dopo la build (e dopo Pagefind) analizza dist/ e produce:
 *   - dist/sw.js: src/pwa/sw-core.js + src/pwa/sw.js preceduti dal manifest
 *     (shell e corsi, ogni file con revisione = hash del contenuto e dimensione);
 *   - dist/offline-summary.json: dimensione e numero di file di ogni corso per lingua
 *     (lo legge "Scarica per l'offline" per mostrare la stima prima di scaricare);
 *   - dist/version.json: commit e data della build (tools/build-info.mjs) e versione del
 *     service worker; mai in cache, lo legge src/scripts/pwa.ts per cercare aggiornamenti.
 *
 * Shell (precache all'installazione): pagine globali, 404, radice, manifest, icone,
 * indice di ricerca, con tutte le risorse che richiamano. Corso (scaricabile su richiesta):
 * le pagine sotto /<lingua>/anno-N/<corso>/ e le risorse che usano e che non sono già
 * nella shell. Le risorse si trovano seguendo gli attributi dell'HTML, gli `url()` dei CSS
 * e gli import dei moduli JS.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildInfo } from '../build-info.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const COURSE_RE = /^(it|en)\/anno-\d+\/([a-z0-9-]+)\//;
/** Pagine di servizio non messe in cache (strumenti di sviluppo). */
const EXCLUDED_PAGES = [/^it\/stile\//];
/** File di dist mai messi in cache. */
const EXCLUDED_FILES = [
  /^sw\.js$/,
  /^sitemap.*\.xml$/,
  /^robots\.txt$/,
  /\.map$/,
  /^offline-summary\.json$/,
  /^version\.json$/,
];
/** Sottoinsiemi di font non necessari per testi italiani e inglesi (restano in cache solo se usati). */
const SKIP_FONT = /(latin-ext|cyrillic|greek|vietnamese|hebrew|devanagari|arabic)/;

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else out.push(p);
  }
  return out;
}

/**
 * Riferimenti locali contenuti in un file. Con `dynamic` segue anche gli `import()`
 * dei moduli JS (caricati solo in certi casi, es. KaTeX per i testi generati).
 */
export function extractRefs(rel, text, dynamic = true) {
  const refs = new Set();
  const add = (raw) => {
    if (!raw || /^(?:[a-z]+:|\/\/|#|data:)/i.test(raw)) return;
    refs.add(raw.split('#')[0].split('?')[0]);
  };
  if (rel.endsWith('.html')) {
    for (const m of text.matchAll(
      /\s(?:src|href|component-url|renderer-url|before-hydration-url|poster|content)="([^"]+)"/g,
    ))
      add(m[1]);
    for (const m of text.matchAll(/\ssrcset="([^"]+)"/g))
      for (const part of m[1].split(',')) add(part.trim().split(/\s+/)[0]);
  } else if (rel.endsWith('.css')) {
    for (const m of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) add(m[1]);
  } else if (rel.endsWith('.js')) {
    for (const m of text.matchAll(/(?:\bfrom|\bimport)\s*(\(?)\s*["'`](\.{1,2}\/[^"'`]+)["'`]/g))
      if (dynamic || !m[1]) add(m[2]);
  }
  return [...refs];
}

/** Risolve un riferimento in un percorso relativo a dist ('' se fuori dal sito). */
export function resolveRef(fromRel, ref, base) {
  let abs;
  if (ref.startsWith('/')) {
    if (!ref.startsWith(base)) return '';
    abs = ref.slice(base.length);
  } else {
    abs = posix.normalize(posix.join(posix.dirname(fromRel), ref));
  }
  abs = decodeURIComponent(abs.replace(/^\/+/, ''));
  if (abs.startsWith('..')) return '';
  return abs;
}

/** URL pubblico di un file di dist: le pagine `x/index.html` diventano `x/`. */
export function publicUrl(rel, base) {
  if (rel === 'index.html') return base;
  if (rel.endsWith('/index.html')) return base + rel.slice(0, -'index.html'.length);
  return base + rel;
}

/**
 * @param {string} distDir
 * @param {string} base
 * @param {{ info(msg: string): void }} logger
 */
export async function buildServiceWorker(distDir, base, logger) {
  const files = (await walk(distDir)).map((p) => relative(distDir, p).split(sep).join('/'));
  const info = new Map();
  for (const rel of files) {
    if (EXCLUDED_FILES.some((re) => re.test(rel))) continue;
    const buf = await readFile(join(distDir, rel));
    info.set(rel, {
      rev: createHash('sha256').update(buf).digest('hex').slice(0, 12),
      size: buf.length,
      buf,
    });
  }

  const refsCache = new Map();
  const refsOf = (rel, dynamic) => {
    const key = `${dynamic ? 'd' : 's'}|${rel}`;
    if (!refsCache.has(key)) {
      const f = info.get(rel);
      const list = f && /\.(html|css|js)$/.test(rel) ? extractRefs(rel, f.buf.toString('utf8'), dynamic) : [];
      refsCache.set(
        key,
        list
          .map((r) => resolveRef(rel, r, base))
          .map((r) => (r.endsWith('/') || r === '' ? `${r}index.html` : r))
          // Le pagine collegate dai link non sono risorse della pagina: si seguono solo le risorse.
          .filter((r) => info.has(r) && !r.endsWith('.html'))
          .filter((r) => !(/\.(woff2?|ttf|otf)$/.test(r) && (!r.endsWith('.woff2') || SKIP_FONT.test(r)))),
      );
    }
    return refsCache.get(key);
  };
  // La shell segue solo gli import statici (i moduli caricati a richiesta finiscono nella
  // cache di passaggio quando servono); i corsi scaricati anche quelli dinamici.
  const closure = (roots, dynamic) => {
    const seen = new Set();
    const stack = [...roots];
    while (stack.length) {
      const r = stack.pop();
      if (seen.has(r)) continue;
      seen.add(r);
      for (const x of refsOf(r, dynamic)) if (!seen.has(x)) stack.push(x);
    }
    return seen;
  };

  const pages = [...info.keys()].filter(
    (r) => r.endsWith('.html') && !EXCLUDED_PAGES.some((re) => re.test(r)),
  );
  const coursePages = new Map();
  const shellRoots = [];
  for (const p of pages) {
    const m = COURSE_RE.exec(p);
    if (m) {
      const key = `${m[2]}|${m[1]}`;
      if (!coursePages.has(key)) coursePages.set(key, []);
      coursePages.get(key).push(p);
    } else shellRoots.push(p);
  }
  // Dati dei corsi (dati/*.json) vanno con il corso.
  for (const rel of info.keys()) {
    const m = COURSE_RE.exec(rel);
    if (m && !rel.endsWith('.html')) coursePages.get(`${m[2]}|${m[1]}`)?.push(rel);
  }
  for (const rel of info.keys())
    if (
      rel.startsWith('pagefind/') ||
      /^(site\.webmanifest|favicon\.svg|apple-touch-icon\.png|icon-[\w-]+\.png)$/.test(rel)
    )
      shellRoots.push(rel);

  const shell = closure(shellRoots, false);
  const entry = (rel) => [publicUrl(rel, base), info.get(rel).rev, info.get(rel).size];
  const courses = {};
  const summary = { courses: {} };
  for (const [key, roots] of [...coursePages.entries()].sort()) {
    const [id, lang] = key.split('|');
    const list = [...closure(roots, true)].filter((r) => !shell.has(r)).sort();
    courses[id] ??= {};
    courses[id][lang] = list.map(entry);
    summary.courses[id] ??= {};
    summary.courses[id][lang] = { files: list.length, bytes: list.reduce((s, r) => s + info.get(r).size, 0) };
  }
  const shellList = [...shell].sort().map(entry);
  const version = createHash('sha256')
    .update(JSON.stringify([shellList, courses]))
    .digest('hex')
    .slice(0, 12);
  const manifest = { version, base, shell: shellList, courses };
  summary.version = version;
  summary.shell = { files: shellList.length, bytes: shellList.reduce((s, e) => s + e[2], 0) };

  const core = (await readFile(join(ROOT, 'src/pwa/sw-core.js'), 'utf8')).replace(/^export\s+/gm, '');
  const main = await readFile(join(ROOT, 'src/pwa/sw.js'), 'utf8');
  const sw = `/* study-hub service worker · versione ${version} · generato da tools/integrations/pwa.mjs */\n'use strict';\nconst MANIFEST = ${JSON.stringify(manifest)};\n${core}\n${main}`;
  await writeFile(join(distDir, 'sw.js'), sw);
  await writeFile(join(distDir, 'offline-summary.json'), JSON.stringify(summary));
  await writeFile(join(distDir, 'version.json'), JSON.stringify({ ...buildInfo(), sw: version }));
  const kb = (n) => `${Math.round(n / 1024)} KB`;
  logger.info(
    `service worker ${version}: shell ${shellList.length} file (${kb(summary.shell.bytes)}), ` +
      Object.entries(summary.courses)
        .map(
          ([id, l]) =>
            `${id} ${Object.entries(l)
              .map(([lg, s]) => `${lg} ${kb(s.bytes)}`)
              .join('/')}`,
        )
        .join(', '),
  );
  return { manifest, summary };
}
