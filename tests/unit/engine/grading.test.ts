import { describe, it, expect } from 'vitest';
import * as G from '../../../src/engine/grading';

const R = (value: number, unit?: string, extra: Partial<G.AnswerSpec> = {}): G.AnswerSpec => ({
  label: 'x',
  value,
  unit,
  ...extra,
});

describe('gradeField numerico', () => {
  it('tolleranza e unità', () => {
    expect(G.gradeField(R(4700, 'Ω'), '4,7 kΩ').status).toBe('correct');
    expect(G.gradeField(R(4700, 'Ω'), '4.72k ohm').status).toBe('correct');
    expect(G.gradeField(R(4.7, 'kΩ'), '4700 Ω').status).toBe('correct');
    expect(G.gradeField(R(4700, 'Ω'), '4700').feedback).toContain('unit-missing');
    expect(G.gradeField(R(4700, 'Ω'), '4700 V')).toMatchObject({ status: 'wrong', feedback: ['unit-wrong'] });
    expect(G.gradeField(R(10), '10.05').status).toBe('correct');
    expect(G.gradeField(R(10, undefined, { tol: 0.001 }), '10.05').status).toBe('wrong');
    expect(G.gradeField(R(0, 'V', { absTol: 0.01 }), '0.005 V').status).toBe('correct');
    expect(G.gradeField(R(300, 'K'), '26.85 °C').status).toBe('correct');
    expect(G.gradeField(R(1), '').status).toBe('blank');
    expect(G.gradeField(R(1), 'boh')).toMatchObject({ status: 'invalid', feedback: ['parse'] });
    expect(G.gradeField(R(2), '2+0j').status).toBe('correct');
    expect(G.gradeField({ label: 'x', value: '3', kind: 'number' }, '3').status).toBe('correct');
    expect(() => G.gradeField(R(1, 'zz'), '1')).toThrow();
  });
  it('diagnosi errori tipici', () => {
    const fb = (exp: number, s: string, unit?: string) => G.gradeField(R(exp, unit), s).feedback;
    expect(fb(5, '-5')).toContain('sign');
    expect(fb(100, '628.3')).toContain('factor-2pi');
    expect(fb(628.3, '100')).toContain('factor-2pi');
    expect(fb(10, '14.14')).toContain('factor-sqrt2');
    expect(fb(10, '20')).toContain('factor-2');
    expect(fb(4, '0.25')).toContain('reciprocal');
    expect(fb(4.7, '47')).toContain('magnitude');
    expect(fb(4.7, '-47')).toContain('magnitude');
    expect(fb(4700, '4.7', 'Ω')).toContain('unit-prefix');
    expect(fb(10, '10.3')).toContain('rounding');
    expect(fb(10, '77')).toEqual([]);
    expect(G.diagnoseNumber(NaN, 1)).toBeNull();
  });
  it('cifre significative', () => {
    expect(G.countSigFigs('0,0450')).toBe(3);
    expect(G.countSigFigs('1200')).toBe(2);
    expect(G.countSigFigs('1200.')).toBe(4);
    expect(G.countSigFigs('1.20e3 V')).toBe(3);
    expect(G.countSigFigs('0')).toBe(1);
    expect(G.countSigFigs('-3,14·10^2')).toBe(3);
    const spec = R(3.14159, undefined, { sigFigs: 3, tol: 1e-6 });
    expect(G.gradeField(spec, '3.14').status).toBe('correct');
    expect(G.gradeField(spec, '3.1')).toMatchObject({ status: 'wrong' });
    const spec2 = R(3.14159, undefined, { sigFigs: 4 });
    expect(G.gradeField(spec2, '3.14')).toMatchObject({ status: 'partial', feedback: ['sigfigs'] });
  });
});

describe('gradeField complesso', () => {
  const Z = (value: string | G.AnswerSpec['value'], unit?: string): G.AnswerSpec => ({
    label: 'Z',
    value,
    unit,
  });
  it('forme equivalenti', () => {
    expect(G.gradeField(Z('3+4j', 'Ω'), '5∠53.13° Ω').status).toBe('correct');
    expect(G.gradeField(Z({ re: 3000, im: 4000 }, 'Ω'), '3+4j kΩ').status).toBe('correct');
    expect(G.gradeField(Z('3+4j', 'Ω'), '3+j4').feedback).toContain('unit-missing');
    expect(G.gradeField(Z('3+4j', 'Ω'), '3+4j V').feedback).toEqual(['unit-wrong']);
    expect(G.gradeField(Z('3+4j'), 'xx').status).toBe('invalid');
    expect(G.gradeField({ label: 'v', value: 5, kind: 'complex' }, '5').status).toBe('correct');
  });
  it('diagnosi', () => {
    expect(G.gradeField(Z('3+4j'), '3-4j').feedback).toContain('conjugate');
    expect(G.gradeField(Z('3+4j'), '-3-4j').feedback).toContain('sign');
    expect(G.gradeField(Z('5∠30'), '5∠60').feedback).toContain('phase');
    expect(G.gradeField(Z('5∠0.5 rad'), '5∠0.5').feedback).toContain('deg-rad');
    expect(G.gradeField(Z('5∠30'), '50∠30').feedback).toEqual(['modulus', 'magnitude']);
    expect(G.gradeField(Z('5∠30'), '7∠30').feedback).toEqual(['modulus']);
    expect(G.gradeField(Z('5∠30'), '1+1j').feedback).toEqual([]);
    expect(() => G.gradeField(Z('xyz', undefined), '1')).not.toThrow();
  });
});

describe('testo, multipli, scelte', () => {
  it('testo', () => {
    expect(
      G.gradeField({ label: 't', value: 'Thévenin', accept: ['thevenin equivalent'] }, ' THEVENIN ').status,
    ).toBe('correct');
    expect(G.gradeField({ label: 't', value: 'Norton', kind: 'text' }, 'Thevenin').status).toBe('wrong');
  });
  it('gradeAnswers', () => {
    const specs = [R(1), { ...R(2), label: 'y' }];
    expect(G.gradeAnswers(specs, ['1', '2']).status).toBe('correct');
    expect(G.gradeAnswers(specs, ['1', '3'])).toMatchObject({ status: 'partial', score: 0.5 });
    expect(G.gradeAnswers(specs, { x: '', y: '' }).status).toBe('blank');
    expect(G.gradeAnswers(specs, ['9', '9']).status).toBe('wrong');
    expect(G.gradeAnswers(specs, ['?', '']).status).toBe('invalid');
    expect(G.gradeAnswers([], []).score).toBe(0);
  });
  it('gradeChoice', () => {
    expect(G.gradeChoice({ correct: 2 }, [2]).status).toBe('correct');
    expect(G.gradeChoice({ correct: 2 }, [1]).status).toBe('wrong');
    expect(G.gradeChoice({ correct: 2 }, []).status).toBe('blank');
    expect(G.gradeChoice({ correct: [0, 2] }, [0, 2]).status).toBe('correct');
    expect(G.gradeChoice({ correct: [0, 2] }, [0])).toMatchObject({ status: 'partial', score: 0.5 });
    expect(G.gradeChoice({ correct: [0, 2] }, [0, 1, 2, 3]).status).toBe('wrong');
    expect(G.gradeChoice({ correct: [1], multiple: true }, [1, 1]).status).toBe('correct');
  });
  it('testi feedback', () => {
    for (const code of Object.keys(G.FEEDBACK) as G.FeedbackCode[]) {
      expect(G.feedbackText(code, 'it').length).toBeGreaterThan(10);
      expect(G.feedbackText(code, 'en').length).toBeGreaterThan(10);
    }
  });
});
