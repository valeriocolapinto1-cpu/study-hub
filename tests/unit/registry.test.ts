import { afterEach, describe, expect, it } from 'vitest';
import {
  clearGenerators,
  getGenerator,
  listGenerators,
  registerGenerator,
  runGenerator,
  type GeneratorDefinition,
} from '../../src/engine/generators/registry';
import { createRng } from '../../src/engine/random';

const ohm: GeneratorDefinition = {
  id: 'esempio/legge-di-ohm',
  topic: 'resistori',
  objectives: ['resistori.1'],
  generate(seed, lang) {
    const r = createRng(seed);
    const R = r.int(1, 10) * 100;
    const I = r.int(1, 9) / 1000;
    const V = R * I;
    return {
      statement:
        lang === 'it'
          ? `Calcola la tensione su R = ${R} Ω con I = ${I} A.`
          : `Find the voltage across R = ${R} Ω with I = ${I} A.`,
      steps: [{ title: lang === 'it' ? 'Legge di Ohm' : "Ohm's law", body: `V = R I = ${V} V` }],
      answer: [{ label: 'V', value: V, unit: 'V' }],
    };
  },
};

describe('registro dei generatori', () => {
  afterEach(() => clearGenerators());

  it('registra, elenca e genera in modo deterministico', () => {
    registerGenerator(ohm);
    expect(getGenerator('esempio/legge-di-ohm')).toBe(ohm);
    expect(listGenerators('esempio')).toHaveLength(1);
    expect(listGenerators('altro')).toHaveLength(0);
    const a = runGenerator('esempio/legge-di-ohm', 123, 'it');
    const b = runGenerator('esempio/legge-di-ohm', 123, 'it');
    expect(a).toEqual(b);
    expect(runGenerator('esempio/legge-di-ohm', 123, 'en').statement).toMatch(/^Find/);
  });

  it('rifiuta definizioni non valide o duplicate', () => {
    registerGenerator(ohm);
    expect(() => registerGenerator({ ...ohm })).toThrow(/già registrato/);
    expect(() => registerGenerator({ ...ohm, id: 'senza-corso' })).toThrow();
    expect(() => registerGenerator({ ...ohm, id: 'esempio/x', objectives: ['altro.1'] })).toThrow();
    expect(() => registerGenerator({ ...ohm, id: 'esempio/y', objectives: [] })).toThrow();
  });

  it('valida l’uscita dei generatori', () => {
    registerGenerator({
      ...ohm,
      id: 'esempio/rotto',
      generate: () => ({ statement: '', steps: [], answer: [] }),
    });
    expect(() => runGenerator('esempio/rotto', 1, 'it')).toThrow(/testo vuoto/);
    expect(() => runGenerator('esempio/inesistente', 1, 'it')).toThrow(/sconosciuto/);
  });
});
