import { describe, expect, it } from 'vitest';
import { checkStep, cp2Drill, invertBits, loopDrill, mulCmpDrill, normalizeStep, shiftDrill, sumDrill } from './drills';
import { addTwos, fromBinCP2, toBin } from './numeric';
import { simLoop, simMulCmp, simShift } from './asmSim';

describe('normalizeStep', () => {
  it('ignora la formattazione, non il contenuto', () => {
    expect(normalizeStep('1111 0110', 'bin')).toBe('11110110');
    expect(normalizeStep(' 0xF6 ', 'hex')).toBe('F6');
    expect(normalizeStep('-0', 'dec')).toBe('0');
    expect(normalizeStep('+12', 'dec')).toBe('12');
  });

  it('accetta le varie forme di sì e no', () => {
    for (const yes of ['sì', 'si', 'S', 'yes', '1', 'vero']) {
      expect(normalizeStep(yes, 'yesno'), yes).toBe('sì');
    }
    for (const no of ['no', 'N', 'falso', '0']) {
      expect(normalizeStep(no, 'yesno'), no).toBe('no');
    }
  });
});

describe('checkStep', () => {
  const step = cp2Drill(-10, 8).steps[0]!;

  it('una risposta vuota non è né giusta né sbagliata', () => {
    expect(checkStep(step, '   ')).toBeNull();
  });

  it('corregge il singolo passaggio', () => {
    expect(checkStep(step, '0000 1010')).toBe(true);
    expect(checkStep(step, '00001011')).toBe(false);
  });
});

describe('cp2Drill', () => {
  it('sui negativi guida modulo → inversione → +1 e chiude sul valore giusto', () => {
    const drill = cp2Drill(-10, 8);
    const [mag, inv, cp2, hex] = drill.steps;
    expect(mag?.answer).toBe('00001010');
    expect(inv?.answer).toBe(invertBits(mag!.answer));
    expect(cp2?.answer).toBe('11110110');
    expect(fromBinCP2(cp2!.answer, 8)).toBe(-10);
    expect(hex?.answer).toBe('F6');
  });

  it('ogni passo intermedio è coerente con il successivo, per ogni valore su 8 bit', () => {
    for (let value = -128; value <= 127; value++) {
      const drill = cp2Drill(value, 8);
      const final = drill.steps.find((step) => step.id === (value < 0 ? 'cp2' : 'mag'));
      expect(final?.answer, String(value)).toBe(toBin(value, 8));
      for (const step of drill.steps) {
        if (step.kind === 'bin' && step.width) {
          expect(step.answer.length, `${value} · ${step.id}`).toBe(step.width);
        }
      }
    }
  });

  it('sui positivi chiede anche il negativo, che è il passaggio difficile', () => {
    const drill = cp2Drill(20, 8);
    const neg = drill.steps.find((step) => step.id === 'neg');
    expect(neg?.answer).toBe(toBin(-20, 8));
  });
});

describe('sumDrill', () => {
  it('tiene distinti riporto uscente e overflow', () => {
    // −1 + 1 su 4 bit: esce il riporto ma non c'è overflow.
    const drill = sumDrill(-1, 1, 4);
    expect(drill.steps.find((step) => step.id === 'carry')?.answer).toBe('sì');
    expect(drill.steps.find((step) => step.id === 'ovf')?.answer).toBe('no');

    // 7 + 1 su 4 bit: overflow senza riporto uscente.
    const other = sumDrill(7, 1, 4);
    expect(other.steps.find((step) => step.id === 'carry')?.answer).toBe('no');
    expect(other.steps.find((step) => step.id === 'ovf')?.answer).toBe('sì');
  });

  it('le risposte coincidono con il sommatore su tutte le coppie a 4 bit', () => {
    for (let a = -8; a <= 7; a++) {
      for (let b = -8; b <= 7; b++) {
        const drill = sumDrill(a, b, 4);
        const expected = addTwos(a, b, 4);
        const answers = Object.fromEntries(drill.steps.map((step) => [step.id, step.answer]));
        expect(answers.sum, `${a}+${b}`).toBe(expected.binary);
        expect(answers.carry).toBe(expected.carryOut ? 'sì' : 'no');
        expect(answers.ovf).toBe(expected.overflow ? 'sì' : 'no');
        expect(answers.dec).toBe(String(expected.sum));
      }
    }
  });
});

describe('drill assembly', () => {
  it('le risposte vengono dal simulatore, non sono scritte a mano', () => {
    const loop = loopDrill({ start: 20, step: 3 });
    const simulated = simLoop({ start: 20, step: 3 });
    expect(loop.steps.find((step) => step.id === 'iter')?.answer).toBe(String(simulated.iterations));
    expect(loop.steps.find((step) => step.id === 'r1')?.answer).toBe(String(simulated.finalR1));
    expect(loop.listing?.length).toBeGreaterThan(0);

    const mul = mulCmpDrill({ a: 6, b: 7, cmp: 42, add: 5 });
    const mulSim = simMulCmp({ a: 6, b: 7, cmp: 42, add: 5 });
    expect(mul.steps.find((step) => step.id === 'branch')?.answer).toBe('sì');
    expect(mul.steps.find((step) => step.id === 'r3')?.answer).toBe(String(mulSim.r3));

    const shift = shiftDrill({ value: 5, left: 3, right: 2 });
    const shiftSim = simShift({ value: 5, left: 3, right: 2 });
    expect(shift.steps.find((step) => step.id === 'res')?.answer).toBe(String(shiftSim.result));
  });

  it('ogni passo ha id univoco, testo e suggerimento', () => {
    const drills = [
      cp2Drill(-42, 8),
      sumDrill(3, -9, 8),
      loopDrill({ start: 12, step: 5 }),
      mulCmpDrill({ a: 3, b: 4, cmp: 10, add: 2 }),
      shiftDrill({ value: 9, left: 2, right: 1 }),
    ];
    for (const drill of drills) {
      const ids = drill.steps.map((step) => step.id);
      expect(new Set(ids).size, drill.title).toBe(ids.length);
      for (const step of drill.steps) {
        expect(step.prompt.trim().length, step.id).toBeGreaterThan(10);
        expect(step.hint.trim().length, step.id).toBeGreaterThan(10);
        expect(step.answer.trim()).not.toBe('');
      }
    }
  });
});
