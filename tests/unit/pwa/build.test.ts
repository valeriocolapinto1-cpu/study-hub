import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildServiceWorker, extractRefs, publicUrl, resolveRef } from '../../../tools/integrations/pwa.mjs';

const BASE = '/study-hub/';
type Entry = [string, string, number];
interface Built {
  manifest: { version: string; shell: Entry[]; courses: Record<string, Record<string, Entry[]>> };
  summary: { version: string; courses: Record<string, Record<string, { files: number; bytes: number }>> };
}
const build = (dist: string) => buildServiceWorker(dist, BASE, silent) as unknown as Promise<Built>;
const silent = { info: () => undefined, warn: () => undefined };

function makeDist(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'sh-dist-'));
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), content);
  }
  return dir;
}

describe('analisi delle risorse', () => {
  it('estrae i riferimenti locali da HTML, CSS e JS', () => {
    const html =
      '<link href="/study-hub/_astro/a.css"><script src="/study-hub/_astro/b.js"></script>' +
      '<astro-island component-url="/study-hub/_astro/C.js" renderer-url="/study-hub/_astro/r.js"></astro-island>' +
      '<a href="https://example.org/">x</a><a href="#top">y</a><img srcset="/study-hub/i.png 1x, /study-hub/i2.png 2x">';
    expect(extractRefs('it/index.html', html).sort()).toEqual(
      [
        '/study-hub/_astro/C.js',
        '/study-hub/_astro/a.css',
        '/study-hub/_astro/b.js',
        '/study-hub/_astro/r.js',
        '/study-hub/i.png',
        '/study-hub/i2.png',
      ].sort(),
    );
    expect(
      extractRefs('_astro/a.css', '@font-face{src:url(./f.woff2) format("woff2"),url("./f.woff")}'),
    ).toEqual(['./f.woff2', './f.woff']);
    const js = 'import{a}from"./x.js";import"./y.js";const k=()=>import("./katex.js");';
    expect(extractRefs('_astro/m.js', js)).toEqual(['./x.js', './y.js', './katex.js']);
    expect(extractRefs('_astro/m.js', js, false)).toEqual(['./x.js', './y.js']);
  });

  it('risolve i percorsi e gli URL pubblici', () => {
    expect(resolveRef('_astro/m.js', './x.js', BASE)).toBe('_astro/x.js');
    expect(resolveRef('it/index.html', '/study-hub/_astro/a.css', BASE)).toBe('_astro/a.css');
    expect(resolveRef('it/index.html', '/altro/x.js', BASE)).toBe('');
    expect(resolveRef('a.js', '../../x.js', BASE)).toBe('');
    expect(publicUrl('index.html', BASE)).toBe('/study-hub/');
    expect(publicUrl('it/chi-sono/index.html', BASE)).toBe('/study-hub/it/chi-sono/');
    expect(publicUrl('_astro/a.css', BASE)).toBe('/study-hub/_astro/a.css');
  });
});

describe('buildServiceWorker', () => {
  it('separa shell e corsi e scrive sw.js e il riepilogo', async () => {
    const page = (extra: string) =>
      `<html><head><link rel="stylesheet" href="/study-hub/_astro/base.css"></head><body>${extra}</body></html>`;
    const dist = makeDist({
      'index.html': page(''),
      '404.html': page(''),
      'it/index.html': page('<script type="module" src="/study-hub/_astro/site.js"></script>'),
      'it/stile/index.html': page('<script src="/study-hub/_astro/stile.js"></script>'),
      'it/anno-1/fisica-1/index.html': page(
        '<astro-island component-url="/study-hub/_astro/Offline.js"></astro-island>',
      ),
      'it/anno-1/fisica-1/dati.json': '{}',
      'en/anno-1/fisica-1/index.html': page(''),
      '_astro/base.css':
        '@font-face{src:url(./serif-latin.woff2),url(./serif-latin.woff)}@font-face{src:url(./serif-cyrillic.woff2)}',
      '_astro/serif-latin.woff2': 'w2',
      '_astro/serif-latin.woff': 'w1',
      '_astro/serif-cyrillic.woff2': 'cy',
      '_astro/site.js': 'import"./shared.js";const s=()=>import("./SearchDialog.js");',
      '_astro/shared.js': 'x',
      '_astro/SearchDialog.js': 'y',
      '_astro/Offline.js': 'import"./shared.js";const k=()=>import("./katex.js");',
      '_astro/katex.js': 'k',
      '_astro/stile.js': 's',
      'pagefind/it/pagefind.js': 'pf',
      'site.webmanifest': '{}',
      'favicon.svg': '<svg/>',
      'sitemap-0.xml': '<x/>',
    });
    const { manifest, summary } = await build(dist);
    const shell = manifest.shell.map((e) => e[0]);
    expect(shell).toEqual(
      expect.arrayContaining([
        '/study-hub/',
        '/study-hub/404.html',
        '/study-hub/it/',
        '/study-hub/_astro/base.css',
        '/study-hub/_astro/serif-latin.woff2',
        '/study-hub/_astro/site.js',
        '/study-hub/_astro/shared.js',
        '/study-hub/pagefind/it/pagefind.js',
        '/study-hub/site.webmanifest',
        '/study-hub/favicon.svg',
      ]),
    );
    // Esclusi: pagina di stile, sottoinsiemi di font inutili, woff, moduli caricati a richiesta, sitemap.
    for (const u of [
      'it/stile/',
      '_astro/stile.js',
      'serif-cyrillic',
      'serif-latin.woff"',
      'SearchDialog',
      'sitemap',
    ])
      expect(JSON.stringify(shell)).not.toContain(u);
    const it = manifest.courses['fisica-1']!.it!.map((e) => e[0]);
    expect([...it].sort()).toEqual([
      '/study-hub/_astro/Offline.js',
      '/study-hub/_astro/katex.js',
      '/study-hub/it/anno-1/fisica-1/',
      '/study-hub/it/anno-1/fisica-1/dati.json',
    ]);
    expect(manifest.courses['fisica-1']!.en!.map((e) => e[0])).toEqual(['/study-hub/en/anno-1/fisica-1/']);
    expect(summary.courses['fisica-1']!.it!.files).toBe(4);
    const sw = readFileSync(join(dist, 'sw.js'), 'utf8');
    expect(sw).toContain(`const MANIFEST = {"version":"${manifest.version}"`);
    expect(sw).not.toMatch(/^export /m);
    expect(sw).toContain("self.addEventListener('fetch'");
    expect(JSON.parse(readFileSync(join(dist, 'offline-summary.json'), 'utf8')).version).toBe(
      manifest.version,
    );

    // La versione cambia solo se cambia un file.
    const again = await build(dist);
    expect(again.manifest.version).toBe(manifest.version);
    writeFileSync(join(dist, '_astro/shared.js'), 'x2');
    expect((await build(dist)).manifest.version).not.toBe(manifest.version);
  });
});
