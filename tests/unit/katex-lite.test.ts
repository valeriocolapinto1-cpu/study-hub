/** KaTeX senza MathML nei dati delle isole: TeX come nome accessibile, HTML visivo intatto. */
import { describe, expect, it } from 'vitest';
import { richHtml, richInline } from '../../src/lib/rich-server';
import { stripMathml } from '../../src/lib/katex-lite';

describe('stripMathml', () => {
  it('toglie il MathML e mette role="img" + aria-label con il TeX', () => {
    const full = richHtml('Vale $\\frac{a}{b} < c$ e $$E = mc^2$$');
    expect(full).toContain('katex-mathml');
    const lite = stripMathml(full);
    expect(lite).not.toContain('katex-mathml');
    expect(lite).not.toContain('<math');
    expect(lite).toContain('<span class="katex" role="img" aria-label="\\frac{a}{b} &lt; c">');
    expect(lite).toContain('aria-label="E = mc^2"');
    expect(lite).toContain('katex-display');
    // la parte visiva è la stessa
    const visual = (h: string) => h.match(/<span class="katex-html"[\s\S]*?(?=<span class="katex"|$)/g)?.join('');
    expect(visual(lite)).toBe(visual(full));
    expect(lite.length).toBeLessThan(full.length * 0.9);
  });

  it('virgolette nel TeX restano valide dentro l’attributo', () => {
    const lite = stripMathml(richInline('$\\text{"x"}$'));
    expect(lite).toMatch(/aria-label="\\text\{&quot;x&quot;\}"/);
  });

  it('testo senza formule invariato', () => {
    expect(stripMathml('<p>ciao</p>')).toBe('<p>ciao</p>');
  });
});
