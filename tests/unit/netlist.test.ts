import { describe, expect, it } from 'vitest';
import { EXAMPLES } from '../../src/sim/circuits/examples';
import { normalizeNetlist } from '../../src/sim/circuits/model';
import { Netlist, parseNetlist, type NetlistInput } from '../../src/sim/circuits/netlist';
import { formatSI, parseSI } from '../../src/sim/units';

const strip = (x: unknown): unknown => JSON.parse(JSON.stringify(x));

describe('prefissi SI', () => {
  it('lettura', () => {
    expect(parseSI('4.7k')).toBeCloseTo(4700);
    expect(parseSI('4,7 kΩ')).toBeCloseTo(4700);
    expect(parseSI('10u')).toBeCloseTo(1e-5);
    expect(parseSI('10 µF')).toBeCloseTo(1e-5);
    expect(parseSI('2m')).toBeCloseTo(2e-3);
    expect(parseSI('1meg')).toBeCloseTo(1e6);
    expect(parseSI('3M')).toBeCloseTo(3e6);
    expect(parseSI('1e-3')).toBeCloseTo(1e-3);
    expect(() => parseSI('abc')).toThrow();
  });
  it('scrittura', () => {
    expect(formatSI(4700, 'Ω', { sep: ' ' })).toBe('4,7 kΩ');
    expect(formatSI(4700, 'Ω', { sep: ' ', lang: 'en' })).toBe('4.7 kΩ');
    expect(formatSI(1e-5, 'F', { sep: ' ' })).toBe('10 µF');
    expect(formatSI(999.96, 'V', { sep: ' ' })).toBe('1 kV');
    expect(formatSI(-0.0123, 'A', { sep: ' ' })).toBe('−12,3 mA');
    expect(formatSI(0, 'V', { sep: ' ' })).toBe('0 V');
  });
});

describe('schema della netlist', () => {
  it('normalizzazione leggera e schema Zod danno lo stesso risultato', () => {
    for (const [name, net] of Object.entries(EXAMPLES)) {
      expect(strip(normalizeNetlist(net)), name).toEqual(strip(Netlist.parse(net)));
    }
  });
  it('valori con prefisso e alias della massa', () => {
    const n = parseNetlist({
      elements: [
        { type: 'R', id: 'R1', a: 'x', b: 'gnd', value: '2,2k' },
        { type: 'V', id: 'V1', a: 'x', b: 'massa', dc: 1 },
      ],
    });
    const r = n.elements[0]!;
    expect(r.type === 'R' && r.value).toBeCloseTo(2200);
    expect(r.type === 'R' && r.b).toBe('0');
  });
  it('errori leggibili', () => {
    const bad = (n: unknown, re: RegExp): void => expect(() => parseNetlist(n as NetlistInput)).toThrow(re);
    bad(
      {
        elements: [
          { type: 'R', id: 'R1', a: 'x', b: '0', value: 1 },
          { type: 'R', id: 'R1', a: 'x', b: '0', value: 2 },
        ],
      },
      /duplicato/,
    );
    bad({ elements: [{ type: 'H', id: 'H1', a: 'x', b: '0', ctrl: 'Rz', gain: 1 }] }, /inesistente/);
    bad({ elements: [{ type: 'R', id: 'R1', a: 'x', b: 'y', value: 1 }] }, /massa/);
    bad({ elements: [{ type: 'C', id: 'C1', a: 'x', b: '0', value: -1 }] }, /positivo/);
    bad(
      {
        elements: [
          { type: 'L', id: 'L1', a: 'x', b: '0', value: 1 },
          { type: 'K', id: 'K1', l1: 'L1', l2: 'R9', k: 0.5 },
        ],
      },
      /induttore/,
    );
    bad({ elements: [{ type: 'R', id: 'R1', a: 'x', b: '0', value: 'boh' }] }, /valore non valido/);
  });
});
