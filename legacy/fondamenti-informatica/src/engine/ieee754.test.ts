import { describe, expect, it } from 'vitest';
import {
  BIAS,
  bitsToFields,
  decodeIeee754,
  encodeIeee754,
  fieldsToBits,
  fieldsToGroupedBits,
  fmtDecimal,
  realExponent,
} from './ieee754';
import { sampleIeeeFields } from './generators/ieee';
import { mulberry32 } from './rng';

describe('IEEE 754 singola precisione', () => {
  it('codifica −6,5 come da esempio del modulo di studio', () => {
    const fields = encodeIeee754(-6.5);
    expect(fields.sign).toBe(1);
    expect(fields.exponent).toBe(129); // esponente reale 2, + bias 127
    expect(realExponent(fields)).toBe(2);
    expect(fieldsToGroupedBits(fields)).toBe('1 10000001 10100000000000000000000');
  });

  it('codifica casi noti', () => {
    expect(fieldsToGroupedBits(encodeIeee754(1))).toBe('0 01111111 00000000000000000000000');
    expect(fieldsToGroupedBits(encodeIeee754(2))).toBe('0 10000000 00000000000000000000000');
    expect(fieldsToGroupedBits(encodeIeee754(0.5))).toBe('0 01111110 00000000000000000000000');
    // Lo zero ha esponente e mantissa nulli; il segno resta distinto.
    expect(encodeIeee754(0)).toEqual({ sign: 0, exponent: 0, mantissa: 0 });
  });

  it('riconosce i valori speciali', () => {
    expect(encodeIeee754(Number.POSITIVE_INFINITY)).toEqual({
      sign: 0,
      exponent: 255,
      mantissa: 0,
    });
    const nan = encodeIeee754(Number.NaN);
    expect(nan.exponent).toBe(255);
    expect(nan.mantissa).not.toBe(0);
  });

  it('fa round-trip fra campi, bit e valore', () => {
    const rng = mulberry32(2024);
    for (let i = 0; i < 500; i++) {
      const fields = sampleIeeeFields(rng);
      const value = decodeIeee754(fields);

      // Il valore campionato è esattamente rappresentabile: ricodificandolo
      // si devono riottenere gli stessi campi, senza arrotondamenti.
      expect(encodeIeee754(value), `valore ${value}`).toEqual(fields);
      // E i 32 bit si rileggono nei campi di partenza.
      expect(bitsToFields(fieldsToBits(fields))).toEqual(fields);
    }
  });

  it('i valori campionati hanno una rappresentazione decimale finita', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 200; i++) {
      const value = decodeIeee754(sampleIeeeFields(rng));
      // Sono razionali diadici: nessuna coda di 999… o di 000…1
      expect(fmtDecimal(value)).not.toMatch(/\d{10}/);
      expect(Number.isFinite(value)).toBe(true);
    }
  });

  it('usa il bias 127', () => {
    expect(BIAS).toBe(127);
    expect(encodeIeee754(1).exponent - BIAS).toBe(0);
  });
});
