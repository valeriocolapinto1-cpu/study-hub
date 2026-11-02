import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = new URL('../', import.meta.url).pathname;
const pages = (d = root) => readdirSync(d).flatMap((f) => { const p = join(d, f); if (['node_modules', '.git', 'tests', 'tools', 'sources-private', '_site'].includes(f)) return []; return statSync(p).isDirectory() ? pages(p) : p.endsWith('.html') ? [p] : []; });

test('CSP: ogni pagina ha una Content-Security-Policy compatibile con KaTeX e con i provider AI, senza unsafe-eval né script inline', () => {
  for (const p of pages()) {
    const s = readFileSync(p, 'utf8');
    const m = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(s);
    assert.ok(m, 'CSP mancante in ' + p);
    const csp = m[1];
    assert.ok(!/unsafe-eval/.test(csp), p);
    assert.ok(!/script-src[^;]*unsafe-inline/.test(csp), p);
    assert.match(csp, /object-src 'none'|default-src 'none'/);
    if (!p.endsWith('404.html')) {
      assert.match(csp, /script-src 'self' https:\/\/cdnjs\.cloudflare\.com/);
      assert.match(csp, /style-src [^;]*cdnjs\.cloudflare\.com/); // KaTeX css
      assert.match(csp, /font-src [^;]*cdnjs\.cloudflare\.com/); // KaTeX font
      assert.match(csp, /connect-src 'self' https:/); // chiamate al provider AI scelto
    }
  }
});

test('manifest PWA valido e icona presente', () => {
  const m = JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8'));
  for (const k of ['name', 'short_name', 'start_url', 'display', 'icons']) assert.ok(m[k], k);
  assert.equal(m.start_url, './');
  for (const i of m.icons) assert.ok(existsSync(join(root, i.src)), i.src);
  for (const p of pages().filter((x) => !x.endsWith('404.html'))) assert.match(readFileSync(p, 'utf8'), /rel="manifest"/);
});

test('service worker: elenco file aggiornato, copre pagine/dati/moduli, non intercetta i provider AI', () => {
  execFileSync('node', [join(root, 'tools/build-sw.mjs'), '--check'], { stdio: 'pipe' });
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  const files = JSON.parse(/const FILES = (\[[\s\S]*?\]);/.exec(sw)[1]);
  for (const f of ['./', './index.html', './assets/js/app.js', './assets/css/style.css', './data/syllabus.json', './data/studio/III-01.json', './prova/index.html', './esercizi/index.html', './formulario/index.html', './assets/js/solver/mna.js', './404.html']) assert.ok(files.includes(f), f);
  assert.ok(!files.some((f) => /sources-private|tests\/|node_modules/.test(f)));
  assert.ok(files.every((f) => existsSync(join(root, f === './' ? 'index.html' : f))));
  assert.match(sw, /if \(!same && !cdn\) return;/); // api.anthropic.com & co. non passano dal service worker
  assert.ok(!/anthropic|openai/.test(sw));
});

test('registrazione del service worker non obbligatoria: protetta da try/catch', () => {
  const app = readFileSync(join(root, 'assets/js/app.js'), 'utf8');
  assert.match(app, /function registerSW\(\)[\s\S]*try[\s\S]*catch/);
  assert.match(app, /\.catch\(\(\) => \{\}\)/);
});

test('tutti i percorsi nelle pagine sono relativi (compatibili con https://utente.github.io/repo/)', () => {
  for (const p of pages()) {
    const s = readFileSync(p, 'utf8');
    for (const m of s.matchAll(/(?:href|src)="(\/[^"/][^"]*)"/g)) assert.fail(`${p}: percorso assoluto ${m[1]}`);
  }
  for (const f of ['assets/js/ui.js']) assert.match(readFileSync(join(root, f), 'utf8'), /new URL\('\.\.\/\.\.\/', import\.meta\.url\)/);
  assert.ok(existsSync(join(root, '.nojekyll')) && existsSync(join(root, '404.html')));
});

test('check-links: nessun link interno rotto', () => {
  execFileSync('node', [join(root, 'tools/check-links/check.mjs')], { stdio: 'pipe' });
});

test('menu semplificato: 5 voci e pagina «Altro» con tutte le altre pagine raggiungibili', async () => {
  const { NAV_ITEMS } = await import('../assets/js/app.js').catch(() => ({ NAV_ITEMS: null }));
  const src = readFileSync(join(root, 'assets/js/app.js'), 'utf8');
  const nav = /const NAV = \[([\s\S]*?)\n\];/.exec(src)[1];
  assert.equal((nav.match(/label:/g) || []).length, 5);
  const altro = readFileSync(join(root, 'altro/index.html'), 'utf8');
  for (const d of ['formulario', 'teoria', 'progresso', 'piano', 'appunti', 'corso', 'esame', 'archivio', 'risorse', 'simulatori', 'faq', 'impostazioni']) assert.ok(altro.includes(`href="../${d}/"`), d);
  void NAV_ITEMS;
});
