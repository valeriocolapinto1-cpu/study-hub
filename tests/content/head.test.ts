/**
 * Metadati delle pagine compilate: Content-Security-Policy (tools/integrations/csp.mjs), dati
 * strutturati JSON-LD, immagini di anteprima, meta per iOS e manifest della PWA.
 *
 * Gira dopo `npm run build` (job `build` della CI, con REQUIRE_DIST=1). Senza dist/ e senza
 * REQUIRE_DIST (es. `npm test` in locale o il job `unit`) non c'è nulla da controllare.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const DIST = join(process.cwd(), 'dist');
const BASE = '/study-hub/';
const hasDist = existsSync(join(DIST, 'index.html'));

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? htmlFiles(p) : e.name.endsWith('.html') ? [p] : [];
  });
}
const pages = hasDist
  ? htmlFiles(DIST).map((f) => ({
      rel: relative(DIST, f).replace(/\\/g, '/'),
      html: readFileSync(f, 'utf8'),
    }))
  : [];
const page = (rel: string) => {
  const p = pages.find((x) => x.rel === rel);
  if (!p) throw new Error(`pagina mancante: ${rel}`);
  return p.html;
};

const attr = (tag: string, name: string) =>
  new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1]?.replaceAll('&quot;', '"').replaceAll('&amp;', '&');
const meta = (html: string, key: string) => {
  const tag = new RegExp(`<meta\\s+(?:name|property)="${key}"[^>]*>`).exec(html)?.[0];
  return tag ? attr(tag, 'content') : undefined;
};
const cspOf = (html: string) => {
  const tags = html.match(/<meta http-equiv="Content-Security-Policy"[^>]*>/g) ?? [];
  const content = tags[0] ? attr(tags[0], 'content') : undefined;
  const directives = new Map(
    (content ?? '').split(/;\s*/).map((d) => {
      const [name, ...sources] = d.trim().split(/\s+/);
      return [name!, sources];
    }),
  );
  return { count: tags.length, directives };
};
/** Script inline eseguibili (calcolo indipendente da csp.mjs). */
const inlineScripts = (html: string) =>
  [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter(([, attrs]) => !/\ssrc=/.test(attrs!) && !/type="application\/(ld\+)?json"/.test(attrs!))
    .map(([, , body]) => body!);
const hash = (s: string) => `'sha256-${createHash('sha256').update(s).digest('base64')}'`;
const jsonLd = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (m) => JSON.parse(m[1]!) as Record<string, unknown>,
  );
/** URL assoluto del sito → file in dist. */
const distFile = (url: string) => {
  const { pathname } = new URL(url);
  expect(pathname.startsWith(BASE), url).toBe(true);
  const rel = pathname.slice(BASE.length);
  return join(DIST, rel.endsWith('/') || rel === '' ? `${rel}index.html` : rel);
};

describe('sito compilato: intestazione delle pagine', () => {
  it('dist/ esiste quando è richiesto (CI)', () => {
    if (process.env.REQUIRE_DIST) expect(hasDist, 'manca dist/: esegui npm run build').toBe(true);
  });

  it.runIf(hasDist)(
    'CSP in ogni pagina: una sola, prima degli script, con l’hash di ogni script inline',
    () => {
      const problems: string[] = [];
      for (const { rel, html } of pages) {
        const { count, directives } = cspOf(html);
        if (count !== 1) {
          problems.push(`${rel}: ${count} meta CSP`);
          continue;
        }
        if (html.indexOf('Content-Security-Policy') > html.indexOf('<script'))
          problems.push(`${rel}: CSP dopo il primo script`);
        const scriptSrc = directives.get('script-src') ?? [];
        if (scriptSrc[0] !== "'self'") problems.push(`${rel}: script-src senza 'self' in testa`);
        for (const bad of ["'unsafe-inline'", "'unsafe-eval'", '*', 'https:', 'data:'])
          if (scriptSrc.includes(bad)) problems.push(`${rel}: script-src con ${bad}`);
        for (const s of inlineScripts(html))
          if (!scriptSrc.includes(hash(s)))
            problems.push(`${rel}: script inline senza hash (${s.slice(0, 40)}…)`);
        if (directives.get('object-src')?.join(' ') !== "'none'") problems.push(`${rel}: object-src`);
        const external = [...directives.values()].flat().filter((s) => /^https?:/.test(s));
        if (external.length > 0) problems.push(`${rel}: domini esterni ${external.join(' ')}`);
      }
      expect(problems).toEqual([]);
    },
  );

  it.runIf(hasDist)('Contribuisci: solo un link al modulo, nessuno script o richiesta esterna (R14)', () => {
    for (const lang of ['it', 'en']) {
      const html = page(`${lang}/contribuisci/index.html`);
      const { directives } = cspOf(html);
      expect(directives.get('connect-src')).toEqual(["'self'"]);
      expect(directives.get('frame-src')).toEqual(["'none'"]);
      expect(html).not.toMatch(/challenges\.cloudflare\.com|script\.google/);
    }
  });

  it.runIf(hasDist)('script del tema piccolo e identico in tutte le pagine', () => {
    const themes = new Set(
      pages.flatMap(({ html }) => inlineScripts(html).filter((s) => s.includes('sh:v1:global:theme'))),
    );
    expect(themes.size).toBe(1);
    const [script] = [...themes];
    expect(script!.length).toBeLessThan(700);
    expect(script).toContain('theme-color');
  });

  it.runIf(hasDist)('JSON-LD valido in ogni pagina (si analizza come JSON, con @context e @type)', () => {
    let blocks = 0;
    for (const { rel, html } of pages)
      for (const ld of jsonLd(html)) {
        blocks++;
        expect(ld['@context'], rel).toBe('https://schema.org');
        expect(typeof ld['@type'], rel).toBe('string');
      }
    expect(blocks).toBeGreaterThan(pages.length / 2);
  });

  it.runIf(hasDist)('home: WebSite con SearchAction verso la ricerca della lingua', () => {
    for (const lang of ['it', 'en']) {
      const site = jsonLd(page(`${lang}/index.html`)).find((x) => x['@type'] === 'WebSite');
      expect(site, lang).toBeDefined();
      expect(site!.url).toBe(`https://valeriocolapinto1-cpu.github.io${BASE}${lang}/`);
      const action = site!.potentialAction as { target: { urlTemplate: string }; 'query-input': string };
      expect(action.target.urlTemplate).toBe(`${site!.url as string}?q={search_term_string}`);
      expect(action['query-input']).toBe('required name=search_term_string');
    }
  });

  it.runIf(hasDist)(
    'panoramica di ogni corso: Course; percorsi: BreadcrumbList coerente con la pagina',
    () => {
      const overviews = pages.filter(({ rel }) => /^(it|en)\/anno-\d\/[^/]+\/index\.html$/.test(rel));
      expect(overviews.length).toBeGreaterThanOrEqual(8);
      for (const { rel, html } of overviews) {
        const course = jsonLd(html).find((x) => x['@type'] === 'Course');
        expect(course, rel).toBeDefined();
        expect(existsSync(distFile(course!.image as string)), rel).toBe(true);
        expect((course!.teaches as string[]).length, rel).toBeGreaterThan(0);
      }
      let withCrumbs = 0;
      for (const { rel, html } of pages) {
        const nav = /<nav class="breadcrumbs"[\s\S]*?<\/nav>/.exec(html)?.[0];
        if (!nav) continue;
        withCrumbs++;
        const list = jsonLd(html).find((x) => x['@type'] === 'BreadcrumbList');
        const items = (list?.itemListElement ?? []) as { position: number; name: string; item?: string }[];
        expect(items.length, rel).toBe((nav.match(/<li/g) ?? []).length);
        items.forEach((it, i) => expect(it.position, rel).toBe(i + 1));
        expect(items.at(-1)?.item, rel).toBe(
          new URL(rel.replace(/index\.html$/, ''), `https://x${BASE}`).href.replace(
            'https://x',
            'https://valeriocolapinto1-cpu.github.io',
          ),
        );
      }
      expect(withCrumbs).toBeGreaterThan(100);
    },
  );

  it.runIf(hasDist)('anteprime 1200×630: del sito e del corso, file esistenti', async () => {
    const samples = {
      'it/index.html': 'og/it/sito.png',
      'en/privacy/index.html': 'og/en/sito.png',
      'it/anno-2/teoria-circuiti/teoria/teorema-di-thevenin/index.html': 'og/it/teoria-circuiti.png',
      'en/anno-1/fisica-1/index.html': 'og/en/fisica-1.png',
    };
    for (const [rel, image] of Object.entries(samples)) {
      const html = page(rel);
      expect(meta(html, 'og:image'), rel).toBe(`https://valeriocolapinto1-cpu.github.io${BASE}${image}`);
      expect(meta(html, 'twitter:card'), rel).toBe('summary_large_image');
      expect(meta(html, 'og:image:width')).toBe('1200');
      expect(meta(html, 'og:image:height')).toBe('630');
    }
    const images = readdirSync(join(DIST, 'og'), { recursive: true }).filter((f) =>
      String(f).endsWith('.png'),
    );
    expect(images.length).toBe(10);
    for (const f of images) {
      const { width, height, format } = await sharp(join(DIST, 'og', String(f))).metadata();
      expect([width, height, format], String(f)).toEqual([1200, 630, 'png']);
    }
  });

  it.runIf(hasDist)('iOS e barra del browser: app web, barra di stato, aree sicure', () => {
    const html = page('it/index.html');
    expect(meta(html, 'viewport')).toContain('viewport-fit=cover');
    expect(meta(html, 'apple-mobile-web-app-capable')).toBe('yes');
    expect(meta(html, 'apple-mobile-web-app-status-bar-style')).toBe('black-translucent');
    expect(meta(html, 'theme-color')).toBe('#05060c');
    // Lo script del tema legge il meta: deve venire dopo.
    expect(html.indexOf('name="theme-color"')).toBeLessThan(html.indexOf('sh:v1:global:theme'));
  });
});

describe('sito compilato: manifest della PWA', () => {
  const manifest = hasDist
    ? (JSON.parse(readFileSync(join(DIST, 'site.webmanifest'), 'utf8')) as Record<string, unknown>)
    : {};

  it.runIf(hasDist)('id stabile, lingua, avvio e ambito sulla base del sito', () => {
    expect(manifest).toMatchObject({
      id: BASE,
      start_url: BASE,
      scope: BASE,
      lang: 'it-IT',
      display: 'standalone',
    });
  });

  it.runIf(hasDist)('scorciatoie: ripasso e i quattro corsi, verso pagine esistenti', () => {
    const shortcuts = manifest.shortcuts as { name: string; url: string }[];
    expect(shortcuts).toHaveLength(5);
    expect(shortcuts[0]!.url).toBe(`${BASE}it/ripasso/`);
    for (const s of shortcuts)
      expect(existsSync(join(DIST, s.url.slice(BASE.length), 'index.html')), s.url).toBe(true);
  });

  it.runIf(hasDist)(
    'icone e schermate esistenti con le dimensioni dichiarate (stretta e larga)',
    async () => {
      const files = [
        ...(manifest.icons as { src: string; sizes: string }[]),
        ...(manifest.screenshots as { src: string; sizes: string }[]),
      ];
      for (const f of files) {
        const { width, height } = await sharp(join(DIST, f.src.slice(BASE.length))).metadata();
        expect(`${width}x${height}`, f.src).toBe(f.sizes);
      }
      const factors = (manifest.screenshots as { form_factor: string }[]).map((s) => s.form_factor);
      expect(new Set(factors)).toEqual(new Set(['narrow', 'wide']));
    },
  );

  it.runIf(hasDist)('anteprime e schermate fuori dalla cache del service worker', () => {
    const sw = readFileSync(join(DIST, 'sw.js'), 'utf8');
    const m = /^const SW = (.*);$/m.exec(sw);
    expect(m).not.toBeNull();
    const { manifest } = JSON.parse(m![1]!) as { manifest: string };
    const text = readFileSync(join(DIST, manifest), 'utf8');
    const lists = Object.values(
      (JSON.parse(text) as { courses: Record<string, Record<string, string>> }).courses,
    ).flatMap((l) => Object.values(l).map((f) => readFileSync(join(DIST, f), 'utf8')));
    for (const t of [text, ...lists]) expect(t).not.toMatch(/\/(og|screenshots)\//);
  });
});
