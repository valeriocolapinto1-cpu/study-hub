import { describe, expect, it } from 'vitest';
import { answerHelpKey } from '../../../src/engine/course-data';

describe('answerHelpKey', () => {
  it('sceglie l’aiuto testuale solo se tutti i campi sono testuali', () => {
    expect(answerHelpKey([{ label: 'a', value: 'AD', kind: 'text' }])).toBe('exercise.answerHelpText');
    expect(
      answerHelpKey([
        { label: 'a', value: 'AD', kind: 'text' },
        { label: 'b', value: 3 },
      ]),
    ).toBe('exercise.answerHelp');
    expect(answerHelpKey([])).toBe('exercise.answerHelp');
  });
});
