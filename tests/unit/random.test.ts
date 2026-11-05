import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/engine/random';

describe('random', () => {
  it('è deterministico dato il seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
    expect(createRng(43).next()).not.toBe(seqA[0]);
  });

  it('produce valori negli intervalli richiesti', () => {
    const r = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const n = r.int(-3, 5);
      expect(n).toBeGreaterThanOrEqual(-3);
      expect(n).toBeLessThanOrEqual(5);
      expect(Number.isInteger(n)).toBe(true);
      const x = r.float(1, 2);
      expect(x).toBeGreaterThanOrEqual(1);
      expect(x).toBeLessThan(2);
    }
    expect(r.shuffle([1, 2, 3, 4]).sort()).toEqual([1, 2, 3, 4]);
    expect(() => r.pick([])).toThrow();
    expect(() => r.int(3, 1)).toThrow();
  });
});
