import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { shareKatexPaths, STAR_SYMBOL } from '../../src/lib/katex-sprite';

const render = (tex: string) => katex.renderToString(tex, { displayMode: true, output: 'htmlAndMathml' });

describe('shareKatexPaths', () => {
  it('condivide i tracciati ripetuti e lascia quelli unici', () => {
    const a = render('\\vec E = \\frac{\\vec F}{q_0}');
    const b = render('\\sqrt{2}');
    const { htmls, sprite } = shareKatexPaths([a, b]);
    // la freccia di \vec compare due volte: un solo <path> nello sprite, due <use>
    expect(sprite.match(/<path id="kp-\d+"/g)).toHaveLength(1);
    expect(htmls[0]!.match(/<use href="#kp-0"\/>/g)).toHaveLength(2);
    expect(htmls[0]).not.toContain('<path');
    // la radice compare una volta sola: resta inline
    expect(htmls[1]).toContain('<path d="');
    expect(htmls[1]).not.toContain('<use');
    // il MathML resta intatto e l'xmlns superfluo sparisce
    expect(htmls[0]).toContain(a.slice(a.indexOf('<math'), a.indexOf('</math>')));
    expect(htmls.join('')).not.toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('aggiunge i simboli richiesti e non crea sprite vuoti', () => {
    expect(shareKatexPaths([render('x^2')]).sprite).toBe('');
    const { sprite } = shareKatexPaths([render('x')], [STAR_SYMBOL]);
    expect(sprite).toContain('<symbol id="i-star" viewBox="0 0 24 24">');
    expect(sprite).toContain('aria-hidden="true"');
  });
});
