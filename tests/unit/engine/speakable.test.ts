import { describe, expect, it } from 'vitest';
import { speakableText } from '../../../src/engine/rich';

describe('speakableText', () => {
  it('rende leggibile una scelta con sola matematica', () => {
    expect(speakableText('$\\omega^4$')).toBe('omega^4');
    expect(speakableText('$\\dfrac{C_1C_2}{C_1+C_2}$')).toBe('(C_1C_2)/(C_1+C_2)');
    expect(speakableText('$\\nabla\\cdot\\vec E=\\rho/\\varepsilon_0$')).toBe('nabla· E=rho/varepsilon_0');
    expect(speakableText('$\\sigma/\\varepsilon_0$, perpendicolare')).toBe(
      'sigma/varepsilon_0, perpendicolare',
    );
    expect(speakableText('$1\\ \\mathrm{mA}$')).toBe('1 mA');
  });
});

describe('proseText', () => {
  it('toglie la matematica e lascia la prosa', async () => {
    const { proseText } = await import('../../../src/engine/rich');
    expect(proseText('Una carica $q=2$ nC a $r=30$ cm: calcola **E**.')).toBe(
      'Una carica nC a cm: calcola E.',
    );
    expect(proseText('Campo $$E=\\frac{q}{r^2}$$ e \\(V\\) noti')).toBe('Campo e noti');
  });
});
