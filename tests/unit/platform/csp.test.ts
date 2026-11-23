import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  APPS_SCRIPT_ORIGINS,
  BASE_POLICY,
  TURNSTILE_ORIGIN,
  injectCsp,
  inlineScripts,
  policyFor,
  sha256,
} from '../../../tools/integrations/csp.mjs';

const directives = (policy: string) =>
  new Map(
    policy.split(/;\s*/).map((d) => {
      const [name, ...sources] = d.trim().split(/\s+/);
      return [name!, sources];
    }),
  );
const metaContent = (html: string) =>
  /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/.exec(html)?.[1]?.replaceAll('&quot;', '"');

describe('CSP: script inline', () => {
  it('prende solo gli script eseguibili senza src', () => {
    const html = `<script>a()</script><script type="module">b()</script>
      <script src="/x.js"></script><script type="application/json">{"c":1}</script>
      <script type="application/ld+json">{"@type":"WebSite"}</script>
      <script type="speculationrules">{}</script><script type="text/javascript">d()</script>`;
    expect(inlineScripts(html)).toEqual(['a()', 'b()', '{}', 'd()']);
  });

  it('hash SHA-256 in base64 come lo calcola il browser', () => {
    const expected = createHash('sha256').update('alert(1)').digest('base64');
    expect(sha256('alert(1)')).toBe(`'sha256-${expected}'`);
  });
});

describe('CSP: politica', () => {
  it("script solo dal sito e con hash: mai 'unsafe-inline' o 'unsafe-eval'", () => {
    const d = directives(policyFor('it/index.html', ['x()']));
    expect(d.get('script-src')).toEqual(["'self'", "'wasm-unsafe-eval'", sha256('x()')]);
    expect(d.get('object-src')).toEqual(["'none'"]);
    expect(d.get('frame-src')).toEqual(["'none'"]);
    expect(d.get('connect-src')).toEqual(["'self'"]);
    expect(d.get('base-uri')).toEqual(["'self'"]);
  });

  it('Turnstile e Apps Script solo nella pagina Contribuisci', () => {
    for (const rel of ['it/contribuisci/index.html', 'en/contribuisci/index.html']) {
      const d = directives(policyFor(rel, []));
      expect(d.get('script-src')).toContain(TURNSTILE_ORIGIN);
      expect(d.get('frame-src')).toEqual([TURNSTILE_ORIGIN]);
      expect(d.get('connect-src')).toEqual(["'self'", ...APPS_SCRIPT_ORIGINS]);
    }
    const other = policyFor('it/chi-sono/index.html', []);
    expect(other).not.toContain('cloudflare');
    expect(other).not.toContain('google');
  });

  it('non modifica la politica comune (copia per pagina)', () => {
    policyFor('it/contribuisci/index.html', ['y()']);
    expect(BASE_POLICY['frame-src']).toEqual(["'none'"]);
    expect(BASE_POLICY['script-src']).toEqual(["'self'", "'wasm-unsafe-eval'"]);
  });

  it('i domini esterni coincidono con quelli usati dal modulo Contribuisci', () => {
    // Turnstile si carica da src/islands/contribute/turnstile.ts (modulo del form Contribuisci).
    const form = readFileSync(join(process.cwd(), 'src/islands/contribute/turnstile.ts'), 'utf8');
    const src = /TURNSTILE_SRC = '([^']+)'/.exec(form)?.[1];
    expect(src && new URL(src).origin).toBe(TURNSTILE_ORIGIN);
    // L'endpoint pubblicato di Apps Script è script.google.com (risposta da googleusercontent).
    expect(APPS_SCRIPT_ORIGINS).toEqual([
      'https://script.google.com',
      'https://script.googleusercontent.com',
    ]);
  });
});

describe('CSP: inserimento nel meta', () => {
  const page = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>x</title><script>t()</script></head><body><script type="module">m()</script></body></html>`;

  it('subito dopo <meta charset>, prima di ogni script, con tutti gli hash', () => {
    const out = injectCsp(page, 'it/index.html');
    expect(out.indexOf('Content-Security-Policy')).toBeGreaterThan(out.indexOf('charset'));
    expect(out.indexOf('Content-Security-Policy')).toBeLessThan(out.indexOf('<title>'));
    const d = directives(metaContent(out)!);
    expect(d.get('script-src')).toEqual(expect.arrayContaining([sha256('t()'), sha256('m()')]));
  });

  it('idempotente: una seconda passata sostituisce il meta', () => {
    const twice = injectCsp(injectCsp(page, 'it/index.html'), 'it/index.html');
    expect(twice.match(/Content-Security-Policy/g)).toHaveLength(1);
    expect(twice).toBe(injectCsp(page, 'it/index.html'));
  });

  it('senza <meta charset> va in testa a <head>; senza <head> è un errore', () => {
    const out = injectCsp('<html><head><title>x</title></head></html>', 'x.html');
    expect(out).toMatch(/^<html><head><meta http-equiv="Content-Security-Policy"/);
    expect(() => injectCsp('<p>x</p>', 'x.html')).toThrow(/head/);
  });
});
