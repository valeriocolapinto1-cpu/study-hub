import { describe, it, expect } from 'vitest';
import * as U from '../../../src/engine/units';

describe('parseNumber', () => {
  it.each([
    ['1,5', 1.5],
    ['1.5', 1.5],
    ['-2', -2],
    ['+3', 3],
    ['.5', 0.5],
    [',25', 0.25],
    ['1.5e-3', 1.5e-3],
    ['1,5E3', 1500],
    ['1,5·10^-3', 1.5e-3],
    ['2 x 10^4', 2e4],
    ['3×10⁻²', 0.03],
    ['10^3', 1000],
    ['-10^-2', -0.01],
    ['1.234,5', 1234.5],
    ['1,234.5', 1234.5],
    ['1.234.567', 1234567],
    ['1 234', 1234],
    ['1/4', 0.25],
    ['−7', -7],
    ['2*10^(3)', 2000],
  ])('%s → %d', (s, v) => {
    expect(U.parseNumber(s)).toBeCloseTo(v as number, 12);
  });
  it.each(['', 'abc', '1.2.3,4,5', '1/0', '1,2,3', 'e5', '--1', '1..2', '+'])('rifiuta %s', (s) => {
    expect(U.parseNumber(s)).toBeNull();
  });
});

describe('unità', () => {
  it('prefissi e alias', () => {
    expect(U.parseQuantity('4,7 kΩ')?.si).toBeCloseTo(4700);
    expect(U.parseQuantity('4700 ohm')?.si).toBeCloseTo(4700);
    expect(U.parseQuantity('10µF')?.si).toBeCloseTo(1e-5);
    expect(U.parseQuantity('10 uF')?.si).toBeCloseTo(1e-5);
    expect(U.parseQuantity('3 mA')?.si).toBeCloseTo(3e-3);
    expect(U.parseQuantity('2 min')?.si).toBe(120);
    expect(U.parseQuantity('1 h')?.si).toBe(3600);
    expect(U.parseQuantity('1 KiB')?.si).toBe(8192);
    expect(U.parseQuantity('1 kB')?.si).toBe(8000);
    expect(U.parseQuantity('5 dam')?.si).toBe(50);
    expect(U.parseQuantity('1,2e-3 A')?.si).toBeCloseTo(1.2e-3);
    expect(U.parseQuantity('2·10^3 V')?.si).toBe(2000);
    expect(U.parseQuantity('50 %')?.si).toBe(0.5);
    expect(U.parseQuantity('12')?.unit).toBe('');
  });
  it('unità composte', () => {
    expect(U.sameDimension('V/m', 'N/C')).toBe(true);
    expect(U.sameDimension('kg·m²/s²', 'J')).toBe(true);
    expect(U.sameDimension('kg*m^2/s^2', 'J')).toBe(true);
    expect(U.sameDimension('Ω·m', 'V·m/A')).toBe(true);
    expect(U.sameDimension('1/s', 'Hz')).toBe(true);
    expect(U.sameDimension('Hz', 'rad/s')).toBe(false);
    expect(U.sameDimension('W', 'V A')).toBe(true);
    expect(U.sameDimension('F', 'C/V')).toBe(true);
    expect(U.sameDimension('H', 'Wb/A')).toBe(true);
    expect(U.sameDimension('T', 'Wb/m^2')).toBe(true);
    expect(U.sameDimension('m.s^-1', 'm/s')).toBe(true);
    expect(U.convert(36, 'km/h', 'm/s')).toBeCloseTo(10);
    expect(U.convert(1, 'kWh', 'J')).toBeCloseTo(3.6e6);
    expect(U.convert(1, 'eV', 'J')).toBeCloseTo(1.602e-19, 22);
    expect(U.convert(180, '°', 'rad')).toBeCloseTo(Math.PI);
    expect(U.convert(0, '°C', 'K')).toBeCloseTo(273.15);
    expect(U.convert(212, '°F', '°C')).toBeCloseTo(100);
    expect(U.convert(60, 'rpm', 'rad/s')).toBeCloseTo(2 * Math.PI);
    expect(U.convert(1, 'MiB', 'KiB')).toBe(1024);
    expect(U.convert(1, 'atm', 'bar')).toBeCloseTo(1.01325);
    expect(U.convert(1, 'L', 'm^3')).toBeCloseTo(1e-3);
  });
  it('errori', () => {
    expect(U.parseUnit('xyz')).toBeNull();
    expect(U.parseUnit('V/')).toBeNull();
    expect(U.parseUnit('V V^x')).toBeNull();
    expect(U.parseQuantity('3 parsec')).toBeNull();
    expect(U.parseQuantity('abc V')).toBeNull();
    expect(() => U.convert(1, 'V', 'A')).toThrow();
    expect(() => U.convert(1, 'zz', 'A')).toThrow();
    expect(() => U.convert(1, 'A', 'zz')).toThrow();
    expect(() => U.toSI(1, 'zz')).toThrow();
    expect(U.toSI(2, 'kV')).toBe(2000);
  });
});

describe('formattazione', () => {
  it('numeri', () => {
    expect(U.formatNumber(1.5)).toBe('1,5');
    expect(U.formatNumber(1.5, { lang: 'en' })).toBe('1.5');
    expect(U.formatNumber(0)).toBe('0');
    expect(U.formatNumber(1.23456e-7, { digits: 3 })).toBe('1,23·10^-7');
    expect(U.formatNumber(2e9, { lang: 'en' })).toBe('2·10^9');
    expect(U.formatNumber(Infinity)).toBe('Infinity');
  });
  it('SI', () => {
    expect(U.formatSI(4700, 'Ω')).toBe('4,7 kΩ');
    expect(U.formatSI(1e-5, 'F', { lang: 'en' })).toBe('10 µF');
    expect(U.formatSI(0.5, 'A')).toBe('500 mA');
    expect(U.formatSI(0, 'V')).toBe('0 V');
    expect(U.formatSI(12, '')).toBe('12');
    expect(U.formatSI(3, 'min')).toBe('3 min');
    expect(U.formatSI(1e-18, 'F')).toBe('0,001 fF');
  });
});

describe('complessi', () => {
  const close = (z: U.Complex | null, re: number, im: number) => {
    expect(z).not.toBeNull();
    expect(z!.re).toBeCloseTo(re, 6);
    expect(z!.im).toBeCloseTo(im, 6);
  };
  it.each([
    ['3+4j', 3, 4],
    ['3 + j4', 3, 4],
    ['3-4i', 3, -4],
    ['-j2', 0, -2],
    ['j', 0, 1],
    ['2,5', 2.5, 0],
    ['(3+4j)', 3, 4],
    ['4j+3', 3, 4],
    ['1e-3+2e-3j', 1e-3, 2e-3],
    ['j*2', 0, 2],
    ['-i', 0, -1],
    ['5∠53.1301024°', 3, 4],
    ['5∠53,1301024', 3, 4],
    ['2∠90', 0, 2],
    ['1∠π/2', 0, 1],
    ['1∠-pi/2', 0, -1],
    ['2∠1.5707963 rad', 0, 2],
    ['2 /_ 180', -2, 0],
    ['∠0', 1, 0],
    ['1∠2π', 1, 0],
    ['2e^(j30°)', Math.sqrt(3), 1],
    ['e^{j·1.5707963}', 0, 1],
    ['2 exp(-j1.5707963)', 0, -2],
    ['3e^(j)', 3 * Math.cos(1), 3 * Math.sin(1)],
  ])('%s', (s, re, im) => close(U.parseComplex(s as string), re as number, im as number));
  it.each([
    '',
    '3+4',
    '3+4j+5',
    'jj',
    '3j4j',
    'abc',
    '5∠',
    'x∠30',
    '1∠2πx',
    '1∠3π/0',
    'e^(jx)',
    '3+4jx',
    '1+2+3',
  ])('rifiuta %s', (s) => {
    expect(U.parseComplex(s)).toBeNull();
  });
  it('aritmetica', () => {
    const a = U.complex(3, 4);
    const b = U.complex(1, -2);
    expect(U.cAdd(a, b)).toEqual({ re: 4, im: 2 });
    expect(U.cSub(a, b)).toEqual({ re: 2, im: 6 });
    expect(U.cMul(a, b)).toEqual({ re: 11, im: -2 });
    close(U.cDiv(a, b), -1, 2);
    expect(() => U.cDiv(a, U.complex(0))).toThrow();
    expect(U.cAbs(a)).toBe(5);
    expect(U.cConj(a)).toEqual({ re: 3, im: -4 });
    close(U.cParallel(U.complex(2), U.complex(2)), 1, 0);
    close(U.cScale(a, 2), 6, 8);
    expect(U.wrapAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
    expect(U.wrapAngle(-3 * Math.PI)).toBeCloseTo(Math.PI);
  });
  it('grandezze complesse', () => {
    const q = U.parseComplexQuantity('10∠30° V');
    expect(q?.unit).toBe('V');
    expect(U.cAbs(q!.si)).toBeCloseTo(10);
    const z = U.parseComplexQuantity('3+4j kΩ');
    expect(z?.si.re).toBeCloseTo(3000);
    expect(U.parseComplexQuantity('(2-j) Ω')?.value).toEqual({ re: 2, im: -1 });
    expect(U.parseComplexQuantity('3+4j')?.unit).toBe('');
    expect(U.parseComplexQuantity('3+4j zz')).toBeNull();
    expect(U.parseComplexQuantity('???')).toBeNull();
  });
  it('formattazione complessi', () => {
    expect(U.formatComplex({ re: 3, im: 4 })).toBe('3 + j4');
    expect(U.formatComplex({ re: 3, im: -4 }, { imaginary: 'i', lang: 'en' })).toBe('3 − i4');
    expect(U.formatComplex({ re: 0, im: -2 })).toBe('−j2');
    expect(U.formatComplex({ re: 0, im: 2 })).toBe('j2');
    expect(U.formatComplex({ re: 2, im: 0 })).toBe('2');
    expect(U.formatComplex({ re: 3, im: 4 }, { form: 'polar' })).toBe('5 ∠ 53,13°');
    expect(U.formatComplex({ re: 3, im: 0 }, { form: 'polar' })).toBe('3 ∠ 0°');
  });
});
