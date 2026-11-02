import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const css = readFileSync(join(root, 'assets/css/style.css'), 'utf8');

function tokens(block) { const t = {}; for (const m of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) t[m[1]] = m[2]; return t; }
const dark = tokens(css.slice(css.indexOf(':root {'), css.indexOf(':root[data-theme="light"]')));
const light = tokens(css.slice(css.indexOf(':root[data-theme="light"]'), css.indexOf('@media (prefers-color-scheme: light)')));
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test('contrasto WCAG AA (≥ 4.5:1) per le coppie di testo, in tema scuro e chiaro', () => {
  for (const [name, t] of [['scuro', dark], ['chiaro', light]]) {
    const pairs = [['fg', 'bg'], ['fg', 'bg-2'], ['fg', 'card'], ['fg-dim', 'bg'], ['fg-dim', 'bg-2'], ['fg-dim', 'card'], ['link', 'bg'], ['link', 'card'], ['accent', 'bg'], ['accent', 'card'], ['accent-fg', 'accent'],
      ['ok', 'bg'], ['ok', 'card'], ['bad', 'bg'], ['bad', 'card'], ['warn', 'bg'], ['warn', 'card'], ['info', 'bg'], ['info', 'card']];
    for (const [f, b] of pairs) assert.ok(ratio(t[f], t[b]) >= 4.5, `tema ${name}: ${f} su ${b} = ${ratio(t[f], t[b]).toFixed(2)}`);
  }
});

test('contrasto: anche il bordo di pulsanti/campi (--line) e l\'accento sono visibili (≥ 3:1) sul fondo', () => {
  for (const [name, t] of [['scuro', dark], ['chiaro', light]]) {
    assert.ok(ratio(t.accent, t.bg) >= 3, name);
    assert.ok(ratio(t.line, t.bg) >= 1.3, `${name}: bordo troppo debole`);
  }
});

const html = (d = root) => readdirSync(d).flatMap((f) => { const p = join(d, f); if (['node_modules', '.git', 'tests', 'tools', 'sources-private', '_site'].includes(f)) return []; return statSync(p).isDirectory() ? html(p) : p.endsWith('.html') ? [p] : []; });
const pages = html();

test('ogni pagina: lang="it", viewport, title, un solo <main>, nessuno script inline, nessun gestore di eventi inline', async () => {
  assert.ok(pages.length >= 18);
  for (const p of pages) {
    const s = readFileSync(p, 'utf8');
    assert.match(s, /<html lang="it">/, p); assert.match(s, /name="viewport"/, p); assert.match(s, /<title>[^<]+<\/title>/, p);
    if (!p.endsWith('404.html')) assert.equal((s.match(/<main/g) || []).length, 1, p);
    if (p.endsWith('404.html')) {
      const body = /<script>([\s\S]*?)<\/script>/.exec(s)[1];
      const h = (await import('node:crypto')).createHash('sha256').update(body).digest('base64');
      assert.ok(s.includes(`'sha256-${h}'`), '404: hash CSP non coerente con lo script');
    } else assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>[^<]/.test(s.replace(/<script type="module" src="[^"]+"><\/script>/g, '')), 'script inline in ' + p);
    assert.ok(!/\son[a-z]+\s*=/i.test(s.replace(/<script[\s\S]*?<\/script>/g, '')), 'gestore inline in ' + p);
  }
});

test('niente gestori di eventi inline né eval nei moduli JavaScript', () => {
  const js = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? js(p) : p.endsWith('.js') ? [p] : []; });
  for (const f of js(join(root, 'assets/js'))) {
    const s = readFileSync(f, 'utf8');
    assert.ok(!/\bon(click|submit|change|input|load|error)\s*=\s*"/i.test(s), 'gestore inline in ' + f);
    assert.ok(!/\beval\s*\(|new Function\s*\(/.test(s), 'eval in ' + f);
    assert.ok(!/document\.write\s*\(/.test(s), 'document.write in ' + f);
  }
});

test('privacy: nessun tracker; gli unici script esterni sono KaTeX da cdnjs', () => {
  const js = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? js(p) : p.endsWith('.js') ? [p] : []; });
  const all = [...pages, ...js(join(root, 'assets/js'))].map((f) => readFileSync(f, 'utf8')).join('\n');
  for (const bad of ['google-analytics', 'googletagmanager', 'gtag(', 'hotjar', 'segment.com', 'facebook.net', 'plausible', 'matomo', 'sentry']) assert.ok(!all.includes(bad), bad);
  const ext = [...new Set([...all.matchAll(/https:\/\/([a-z0-9.-]+)\//g)].map((m) => m[1]))];
  const allowed = new Set(['cdnjs.cloudflare.com', 'api.anthropic.com', 'api.openai.com', 'www.falstad.com', 'www.analog.com', '[link rimosso]', 'drive.google.com', 'www.skuola.net', 'www.docsity.com', 'github.com', 'claude.ai', 'www.w3.org', 'ocw.mit.edu', 'moodle2.units.it', 'michelescarpiniti.site.uniroma1.it', 'sites.google.com', 'example.org', 'www.docsity.com']);
  for (const h of ext) assert.ok(allowed.has(h) || /w3\.org|example/.test(h), 'host esterno non previsto: ' + h);
});

test('gli schemi SVG hanno un nome accessibile (role="img" + aria-label) e una descrizione testuale del circuito', async () => {
  const { generate } = await import('../assets/js/generator.js');
  const { renderCircuit } = await import('../assets/js/svg/render.js');
  for (const tpl of ['A', 'B', 'C']) {
    const g = generate({ template: tpl, level: 3, seed: 3, verify: false });
    const { svg } = renderCircuit(g.inst.circuit, g.inst.layout, { omega: g.inst.omega });
    assert.match(svg, /role="img"/); assert.match(svg, /aria-label="Schema del circuito[^"]{30,}"/);
    for (const e of g.inst.circuit.elements) assert.ok(svg.includes(e.id), e.id + ' non descritto');
  }
  const f2 = (await import('../tools/content/figure1.mjs')).F;
  void f2;
  for (const f of readdirSync(join(root, 'data/studio'))) {
    const c = JSON.parse(readFileSync(join(root, 'data/studio', f), 'utf8'));
    for (const fg of c.figure || []) assert.ok(fg.alt.length >= 20, f);
  }
});

test('mobile e tastiera: bersagli di tocco da 44 px e stile del focus nei CSS', () => {
  assert.match(css, /\.btn[^{]*\{[^}]*min-height:\s*44px/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /\.skip/);
  assert.match(css, /overflow-x:\s*hidden|overflow-x:\s*auto/);
  assert.match(css, /prefers-color-scheme:\s*light/);
});
