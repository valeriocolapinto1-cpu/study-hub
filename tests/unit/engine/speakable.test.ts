import { describe, expect, it } from 'vitest';

describe('proseText', () => {
  it('toglie la matematica e lascia la prosa', async () => {
    const { proseText } = await import('../../../src/engine/rich');
    expect(proseText('Una carica $q=2$ nC a $r=30$ cm: calcola **E**.')).toBe(
      'Una carica nC a cm: calcola E.',
    );
    expect(proseText('Campo $$E=\\frac{q}{r^2}$$ e \\(V\\) noti')).toBe('Campo e noti');
  });
});
