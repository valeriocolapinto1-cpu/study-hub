import { describe, expect, it } from 'vitest';
import { formatBytes } from '../../../src/lib/format-bytes';

describe('formatBytes', () => {
  it('usa l’unità adatta e i separatori della lingua', () => {
    expect(formatBytes(500, 'it')).toBe('500 B');
    expect(formatBytes(2048, 'en')).toBe('2 KB');
    expect(formatBytes(1.5 * 1024 * 1024, 'it')).toBe('1,5 MB');
    expect(formatBytes(2.5 * 1024 ** 3, 'en')).toBe('2.5 GB');
  });
});
