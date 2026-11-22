import { describe, expect, it } from 'vitest';
import { hasTex, texInlineHtml, texToPlain } from '../../src/lib/inline-tex';

describe('texToPlain: matematica in testo semplice (metadati, titoli, opzioni)', () => {
  it.each([
    ['calcolo di $V_{th}$ e $Z_{th}$', 'calcolo di Vth e Zth'],
    ['A $f=50\\,\\mathrm{Hz}$ la lunghezza', 'A f=50 Hz la lunghezza'],
    ['onda $\\lambda$ verso $A\\to B$', 'onda λ verso A→B'],
    ['Adattamento coniugato $Z_L=Z_{th}^*$', 'Adattamento coniugato ZL=Zth∗'],
    ['$$x^2+1$$ fine', 'x2+1 fine'],
    ['costo 5\\$ e basta', 'costo 5$ e basta'],
    ['nessuna formula', 'nessuna formula'],
  ])('%s', (input, expected) => {
    expect(texToPlain(input).replace(/\s+/g, ' ')).toBe(expected);
  });
});

describe('texInlineHtml: KaTeX a build-time, il resto solo con escape', () => {
  it('rende la formula e lascia il testo com’è', () => {
    const html = texInlineHtml('calcolo di $V_{th}$ <b> *non* corsivo');
    expect(html).toContain('class="katex"');
    expect(html).toContain('&lt;b&gt; *non* corsivo');
    expect(html).toContain('<annotation encoding="application/x-tex">V_{th}</annotation>');
  });
  it('hasTex', () => {
    expect(hasTex('a $x$ b')).toBe(true);
    expect(hasTex('5 $ e 6 euro')).toBe(false);
  });
});
