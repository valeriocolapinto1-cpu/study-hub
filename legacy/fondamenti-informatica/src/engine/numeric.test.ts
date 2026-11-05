import { describe, expect, it } from 'vitest';
import { addTwos, cp2Valid, fromBinCP2, rangeFor, subTwos, toBin, toHex } from './numeric';

describe('complemento a 2', () => {
  it('scrive i positivi con zeri a sinistra', () => {
    expect(toBin(5, 4)).toBe('0101');
    expect(toBin(5, 8)).toBe('00000101');
    expect(toBin(0, 4)).toBe('0000');
  });

  it('scrive i negativi in complemento a 2', () => {
    expect(toBin(-1, 4)).toBe('1111');
    expect(toBin(-8, 4)).toBe('1000');
    expect(toBin(-10, 8)).toBe('11110110');
    expect(toBin(-128, 8)).toBe('10000000');
  });

  it('lo zero ha una sola codifica', () => {
    expect(toBin(0, 8)).toBe(toBin(-0, 8));
  });

  it('rilegge quello che ha scritto, su tutto l’intervallo', () => {
    for (const bits of [4, 8]) {
      const { min, max } = rangeFor(bits, true);
      for (let n = min; n <= max; n++) {
        expect(fromBinCP2(toBin(n, bits), bits), `${n} su ${bits} bit`).toBe(n);
      }
    }
  });

  it('conosce gli intervalli rappresentabili', () => {
    expect(rangeFor(8, false)).toEqual({ min: 0, max: 255 });
    expect(rangeFor(8, true)).toEqual({ min: -128, max: 127 });
    expect(rangeFor(4, true)).toEqual({ min: -8, max: 7 });
    expect(rangeFor(32, false).max).toBe(4294967295);
  });

  it('rifiuta ampiezze fuori scala invece di perdere precisione', () => {
    expect(() => toBin(1, 0)).toThrow(RangeError);
    expect(() => toBin(1, 64)).toThrow(RangeError);
  });

  it('valida l’appartenenza all’intervallo', () => {
    expect(cp2Valid(127, 8)).toBe(true);
    expect(cp2Valid(128, 8)).toBe(false);
    expect(cp2Valid(-128, 8)).toBe(true);
    expect(cp2Valid(-129, 8)).toBe(false);
  });
});

describe('esadecimale', () => {
  it('converte in maiuscolo', () => {
    expect(toHex(255)).toBe('FF');
    expect(toHex(33)).toBe('21');
    expect(toHex(16)).toBe('10');
    expect(toHex(10, 2)).toBe('0A');
  });
});

describe('somma in CP2: overflow e carry sono cose diverse', () => {
  it('somma senza overflow', () => {
    const r = addTwos(3, 4, 4);
    expect(r.sum).toBe(7);
    expect(r.binary).toBe('0111');
    expect(r.overflow).toBe(false);
  });

  it('rileva overflow fra due positivi', () => {
    // 7 + 1 = 8, fuori da [-8, 7]: il risultato «diventa» negativo.
    const r = addTwos(7, 1, 4);
    expect(r.overflow).toBe(true);
    expect(r.sum).toBe(-8);
  });

  it('rileva overflow fra due negativi', () => {
    const r = addTwos(-8, -1, 4);
    expect(r.overflow).toBe(true);
    expect(r.sum).toBe(7);
  });

  it('carry uscente senza overflow: il caso che fa perdere punti', () => {
    // -1 + 1 = 0. C'è riporto uscente, ma nessun overflow.
    const r = addTwos(-1, 1, 4);
    expect(r.carryOut).toBe(true);
    expect(r.overflow).toBe(false);
    expect(r.sum).toBe(0);
  });

  it('overflow senza carry uscente: il caso speculare', () => {
    // 4 + 4 = 8 su 4 bit: overflow, ma nessun riporto fuori dal bit di segno.
    const r = addTwos(4, 4, 4);
    expect(r.overflow).toBe(true);
    expect(r.carryOut).toBe(false);
  });

  it('lo XOR dei riporti coincide con la regola dei segni, su tutte le coppie', () => {
    for (const bits of [4, 8]) {
      const { min, max } = rangeFor(bits, true);
      for (let a = min; a <= max; a++) {
        for (let b = min; b <= max; b++) {
          const r = addTwos(a, b, bits);
          // Regola d'esame: overflow ⇔ operandi concordi e risultato discorde.
          const bySign = a >= 0 === b >= 0 && r.sum >= 0 !== a >= 0;
          expect(r.overflow, `${a} + ${b} su ${bits} bit`).toBe(bySign);
          // Il risultato letto in CP2 è sempre congruo modulo 2^bits.
          expect((((a + b) % 2 ** bits) + 2 ** bits) % 2 ** bits).toBe(
            ((r.sum % 2 ** bits) + 2 ** bits) % 2 ** bits,
          );
        }
      }
    }
  });

  it('la sottrazione è la somma dell’opposto', () => {
    const r = subTwos(-8, 1, 4);
    expect(r.overflow).toBe(true); // -8 - 1 = -9, fuori intervallo
    expect(subTwos(5, 3, 4).sum).toBe(2);
  });
});
