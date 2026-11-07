/**
 * Generatori sui numeri binari (dal motore del sito originale:
 * genCP2, genArith, genHex, genMaxRange e la palestra «binario a mano»).
 */
import { registerGenerator } from '../../../engine/generators/registry';
import { createRng } from '../../../engine/random';
import { addTwos, cp2Valid, rangeFor, toBin, toHex } from '../lib/numeric';
import {
  bitsAnswer,
  group4,
  hexAnswer,
  L,
  makeChoices,
  numericChoices,
  pre,
  yesNoAnswer,
} from '../lib/common';

const WIDTHS = [4, 8] as const;
const TOPIC = 'numeri-binari';

/** 45 = 32 + 8 + 4 + 1 */
function powerSum(n: number): string {
  const parts: number[] = [];
  for (let p = 1; p <= n; p *= 2) if (n & p) parts.push(p);
  return parts.reverse().join(' + ') || '0';
}

const invert = (bits: string) => [...bits].map((b) => (b === '0' ? '1' : '0')).join('');

export const cp2 = registerGenerator({
  id: 'fondamenti-informatica/complemento-a-2',
  topic: TOPIC,
  objectives: ['numeri-binari.2'],
  generate(seed, lang) {
    const r = createRng(seed);
    const bits = r.pick(WIDTHS);
    const { min, max } = rangeFor(bits, true);
    let n = r.int(min, max);
    if (n === 0) n = min;
    const answer = toBin(n, bits);
    const steps =
      n >= 0
        ? [
            {
              title: L(lang, 'Il numero è positivo', 'The number is positive'),
              body: L(
                lang,
                `${n} = ${powerSum(n)}: si scrive in binario e si riempie di zeri a sinistra fino a ${bits} bit. Il bit di segno resta 0.`,
                `${n} = ${powerSum(n)}: write it in binary and pad with zeros on the left up to ${bits} bits. The sign bit stays 0.`,
              ),
            },
            { title: L(lang, 'Risultato', 'Result'), body: `\`${group4(answer)}\`` },
          ]
        : [
            {
              title: L(lang, 'Modulo in binario', 'Magnitude in binary'),
              body: L(
                lang,
                `|${n}| = ${powerSum(-n)} → \`${group4(toBin(-n, bits))}\` su ${bits} bit.`,
                `|${n}| = ${powerSum(-n)} → \`${group4(toBin(-n, bits))}\` on ${bits} bits.`,
              ),
            },
            {
              title: L(lang, 'Inverti tutti i bit', 'Invert every bit'),
              body: `\`${group4(invert(toBin(-n, bits)))}\``,
            },
            {
              title: L(lang, 'Somma 1', 'Add 1'),
              body: L(
                lang,
                `\`${group4(answer)}\`. Verifica: il bit più significativo pesa −${2 ** (bits - 1)}, e −${2 ** (bits - 1)} + ${n + 2 ** (bits - 1)} = ${n}.`,
                `\`${group4(answer)}\`. Check: the most significant bit weighs −${2 ** (bits - 1)}, and −${2 ** (bits - 1)} + ${n + 2 ** (bits - 1)} = ${n}.`,
              ),
            },
          ];
    return {
      statement: L(
        lang,
        `Scrivi **${n}** in complemento a 2 su **${bits} bit**.`,
        `Write **${n}** in two's complement on **${bits} bits**.`,
      ),
      steps,
      answer: [bitsAnswer(L(lang, `CP2 su ${bits} bit`, `${bits}-bit two's complement`), answer)],
    };
  },
});

export const sommaCp2 = registerGenerator({
  id: 'fondamenti-informatica/somma-cp2-overflow',
  topic: TOPIC,
  objectives: ['numeri-binari.5'],
  generate(seed, lang) {
    const r = createRng(seed);
    const bits = r.pick(WIDTHS);
    const { min, max } = rangeFor(bits, true);
    const a = r.int(min, max);
    const b = r.int(min, max);
    const plus = r.chance(0.5);
    const op = plus ? '+' : '−';
    const exact = plus ? a + b : a - b;
    const overflow = !cp2Valid(exact, bits);
    const ok = (v: number) => L(lang, `Risultato ${v}, nessun overflow`, `Result ${v}, no overflow`);
    const ovf = L(
      lang,
      `Overflow: il risultato esce dall'intervallo [${min}, ${max}]`,
      `Overflow: the result falls outside the range [${min}, ${max}]`,
    );
    const choices = makeChoices(r, overflow ? ovf : ok(exact), [
      overflow ? ok(exact) : ovf,
      ok(exact + 1),
      ok(exact - 1),
      L(lang, 'Errore di parità', 'Parity error'),
    ]);
    return {
      statement: L(
        lang,
        `In CP2 a ${bits} bit calcoli \`${toBin(a, bits)}\` ${op} \`${toBin(b, bits)}\` (${a} ${op} ${b}). Che cosa accade?`,
        `In ${bits}-bit two's complement you compute \`${toBin(a, bits)}\` ${op} \`${toBin(b, bits)}\` (${a} ${op} ${b}). What happens?`,
      ),
      steps: [
        {
          title: L(lang, 'Intervallo rappresentabile', 'Representable range'),
          body: L(
            lang,
            `Su ${bits} bit in CP2 si va da ${min} a ${max}.`,
            `On ${bits} bits in two's complement the range is ${min} to ${max}.`,
          ),
        },
        {
          title: L(lang, 'Risultato matematico', 'Mathematical result'),
          body: L(
            lang,
            `${a} ${op} ${b} = ${exact}: ${overflow ? 'fuori dall’intervallo, quindi **overflow**' : 'dentro l’intervallo, quindi nessun overflow'}.`,
            `${a} ${op} ${b} = ${exact}: ${overflow ? 'outside the range, hence **overflow**' : 'inside the range, so no overflow'}.`,
          ),
        },
      ],
      answer: [],
      choices,
    };
  },
});

export const esadecimale = registerGenerator({
  id: 'fondamenti-informatica/decimale-esadecimale',
  topic: TOPIC,
  objectives: ['numeri-binari.1'],
  generate(seed, lang) {
    const r = createRng(seed);
    const n = r.int(16, 255);
    const hex = toHex(n);
    return {
      statement: L(
        lang,
        `Converti **${n}** (decimale) in **esadecimale**.`,
        `Convert **${n}** (decimal) to **hexadecimal**.`,
      ),
      steps: [
        {
          title: L(lang, 'Dividi per 16', 'Divide by 16'),
          body: L(
            lang,
            `${n} = ${Math.floor(n / 16)}·16 + ${n % 16}: il quoziente dà la cifra alta, il resto quella bassa.`,
            `${n} = ${Math.floor(n / 16)}·16 + ${n % 16}: the quotient gives the high digit, the remainder the low one.`,
          ),
        },
        {
          title: L(lang, 'Verifica dal binario', 'Check through binary'),
          body: L(
            lang,
            `${n} = \`${group4(toBin(n, 8))}\`₂: ogni gruppo di quattro bit è una cifra, \`${hex}\`.`,
            `${n} = \`${group4(toBin(n, 8))}\`₂: each group of four bits is one digit, \`${hex}\`.`,
          ),
        },
      ],
      answer: [hexAnswer(L(lang, 'Esadecimale', 'Hexadecimal'), hex)],
    };
  },
});

export const intervallo = registerGenerator({
  id: 'fondamenti-informatica/intervallo-rappresentabile',
  topic: TOPIC,
  objectives: ['numeri-binari.3'],
  generate(seed, lang) {
    const r = createRng(seed);
    const bits = r.pick(WIDTHS);
    const u = rangeFor(bits, false);
    const s = rangeFor(bits, true);
    const variant = r.pick([
      {
        q: L(
          lang,
          `Qual è il massimo intero rappresentabile con ${bits} bit senza segno?`,
          `What is the largest integer representable with ${bits} unsigned bits?`,
        ),
        value: u.max,
      },
      {
        q: L(
          lang,
          `Qual è il massimo intero positivo in CP2 con ${bits} bit?`,
          `What is the largest positive integer in ${bits}-bit two's complement?`,
        ),
        value: s.max,
      },
      {
        q: L(
          lang,
          `Qual è il minimo (più negativo) rappresentabile in CP2 con ${bits} bit?`,
          `What is the smallest (most negative) value representable in ${bits}-bit two's complement?`,
        ),
        value: s.min,
      },
    ]);
    const v = variant.value;
    return {
      statement: variant.q,
      steps: [
        {
          title: L(lang, 'I due intervalli', 'The two ranges'),
          body: L(
            lang,
            `Con ${bits} bit: senza segno [${u.min}, ${u.max}], cioè 0 … 2ᴺ−1; CP2 [${s.min}, ${s.max}], cioè −2ᴺ⁻¹ … 2ᴺ⁻¹−1.`,
            `With ${bits} bits: unsigned [${u.min}, ${u.max}], i.e. 0 … 2ᴺ−1; two's complement [${s.min}, ${s.max}], i.e. −2ᴺ⁻¹ … 2ᴺ⁻¹−1.`,
          ),
        },
      ],
      answer: [],
      choices: numericChoices(r, v, [u.max, s.max, s.min, 2 ** (bits - 1), v + 1, v - 1, -v]),
    };
  },
});

/** Palestra «binario a mano»: modulo → inverti → somma 1 → esadecimale. */
export const cp2AMano = registerGenerator({
  id: 'fondamenti-informatica/cp2-a-mano',
  topic: TOPIC,
  objectives: ['numeri-binari.2', 'numeri-binari.1'],
  generate(seed, lang) {
    const r = createRng(seed);
    const bits = r.pick([8, 8, 6] as const);
    const magnitude = r.int(1, 2 ** (bits - 1) - 1);
    const negative = r.chance(0.7);
    const value = negative ? -magnitude : magnitude;
    const hexDigits = Math.ceil(bits / 4);
    const canonical = toBin(value, bits);
    if (negative) {
      const mag = toBin(magnitude, bits);
      const inv = invert(mag);
      const hex = toHex(((value % 2 ** bits) + 2 ** bits) % 2 ** bits, hexDigits);
      return {
        statement: L(
          lang,
          `Rappresenta **${value}** in complemento a 2 su **${bits} bit**, un passaggio alla volta: modulo, inversione, somma di 1, esadecimale (${hexDigits} cifre).`,
          `Represent **${value}** in two's complement on **${bits} bits**, one step at a time: magnitude, inversion, adding 1, hexadecimal (${hexDigits} digits).`,
        ),
        steps: [
          {
            title: L(lang, 'Modulo', 'Magnitude'),
            body: L(
              lang,
              `${magnitude} = ${powerSum(magnitude)} → \`${mag}\`.`,
              `${magnitude} = ${powerSum(magnitude)} → \`${mag}\`.`,
            ),
          },
          {
            title: L(lang, 'Inversione (complemento a 1)', "Inversion (ones' complement)"),
            body: L(
              lang,
              `Ogni 0 diventa 1 e viceversa: \`${inv}\`.`,
              `Every 0 becomes 1 and vice versa: \`${inv}\`.`,
            ),
          },
          {
            title: L(lang, 'Somma 1', 'Add 1'),
            body: L(
              lang,
              `1 + 1 = 0 con riporto, e i riporti si propagano fino al primo 0: \`${canonical}\`.`,
              `1 + 1 = 0 with a carry, and carries ripple up to the first 0: \`${canonical}\`.`,
            ),
          },
          {
            title: L(lang, 'Esadecimale', 'Hexadecimal'),
            body: L(
              lang,
              `Raggruppa da destra a quattro a quattro: \`${group4(canonical)}\` → \`${hex}\`.`,
              `Group four by four from the right: \`${group4(canonical)}\` → \`${hex}\`.`,
            ),
          },
        ],
        answer: [
          bitsAnswer(L(lang, 'Modulo', 'Magnitude'), mag),
          bitsAnswer(L(lang, 'Bit invertiti', 'Inverted bits'), inv),
          bitsAnswer(L(lang, 'Complemento a 2', "Two's complement"), canonical),
          hexAnswer(L(lang, 'Esadecimale', 'Hexadecimal'), hex),
        ],
      };
    }
    const neg = toBin(-value, bits);
    return {
      statement: L(
        lang,
        `Scrivi **${value}** in complemento a 2 su **${bits} bit**, poi in esadecimale (${hexDigits} cifre); infine scrivi **−${value}** in complemento a 2.`,
        `Write **${value}** in two's complement on **${bits} bits**, then in hexadecimal (${hexDigits} digits); finally write **−${value}** in two's complement.`,
      ),
      steps: [
        {
          title: L(lang, 'Positivo: binario puro', 'Positive: plain binary'),
          body: L(
            lang,
            `${value} = ${powerSum(value)} → \`${canonical}\`.`,
            `${value} = ${powerSum(value)} → \`${canonical}\`.`,
          ),
        },
        {
          title: L(lang, 'Esadecimale', 'Hexadecimal'),
          body: L(
            lang,
            `Quattro bit per cifra, da destra: \`${toHex(value, hexDigits)}\`.`,
            `Four bits per digit, from the right: \`${toHex(value, hexDigits)}\`.`,
          ),
        },
        {
          title: L(lang, 'Il negativo', 'The negative'),
          body: L(
            lang,
            `Inverti e somma 1 (scorciatoia: copia i bit da destra fino al primo 1 compreso, poi inverti gli altri): \`${neg}\`.`,
            `Invert and add 1 (shortcut: copy the bits from the right up to and including the first 1, then invert the rest): \`${neg}\`.`,
          ),
        },
      ],
      answer: [
        bitsAnswer(L(lang, `${value} in CP2`, `${value} in two's complement`), canonical),
        hexAnswer(L(lang, 'Esadecimale', 'Hexadecimal'), toHex(value, hexDigits)),
        bitsAnswer(L(lang, `−${value} in CP2`, `−${value} in two's complement`), neg),
      ],
    };
  },
});

/** Palestra «somma con i due flag»: riporto uscente e overflow dichiarati separatamente. */
export const sommaConFlag = registerGenerator({
  id: 'fondamenti-informatica/somma-con-flag',
  topic: 'aritmetica-hardware',
  objectives: ['aritmetica-hardware.3'],
  generate(seed, lang) {
    const r = createRng(seed);
    const bits = r.pick([4, 8, 8] as const);
    const { min, max } = rangeFor(bits, true);
    // Metà delle volte si cerca un caso con overflow, che è quello istruttivo.
    let a = r.int(min, max);
    let b = r.int(min, max);
    if (r.chance(0.5)) {
      for (let i = 0; i < 40 && cp2Valid(a + b, bits); i++) {
        a = r.int(min, max);
        b = r.int(min, max);
      }
    }
    const res = addTwos(a, b, bits);
    const sumLine = `  ${toBin(a, bits)}   (${a})\n+ ${toBin(b, bits)}   (${b})\n= ${res.binary}`;
    return {
      statement: L(
        lang,
        `Somma **${a} + ${b}** in complemento a 2 su **${bits} bit**: scrivi i due operandi, la somma su ${bits} bit, se esce un riporto dal bit più significativo, se c'è overflow e il valore letto in CP2.`,
        `Add **${a} + ${b}** in two's complement on **${bits} bits**: write both operands, the ${bits}-bit sum, whether a carry leaves the most significant bit, whether there is overflow and the value read in two's complement.`,
      ),
      steps: [
        {
          title: L(lang, 'Operandi', 'Operands'),
          body: L(
            lang,
            `${a} → \`${toBin(a, bits)}\`, ${b} → \`${toBin(b, bits)}\` (${a < 0 || b < 0 ? 'i negativi: modulo, inverti, somma 1' : 'positivi: binario puro'}).`,
            `${a} → \`${toBin(a, bits)}\`, ${b} → \`${toBin(b, bits)}\` (${a < 0 || b < 0 ? 'negatives: magnitude, invert, add 1' : 'positives: plain binary'}).`,
          ),
        },
        { title: L(lang, 'Somma in colonna', 'Column addition'), body: pre(sumLine) },
        {
          title: L(lang, 'I due flag', 'The two flags'),
          body: L(
            lang,
            `Riporto uscente: ${res.carryOut ? '1' : '0'}. Overflow = riporto entrante ⊕ riporto uscente sul bit di segno = ${res.overflow ? '1' : '0'}${res.overflow ? `: ${a} + ${b} = ${a + b} non sta in [${min}, ${max}]` : ''}. Sono due flag diversi.`,
            `Carry-out: ${res.carryOut ? '1' : '0'}. Overflow = carry in ⊕ carry out of the sign bit = ${res.overflow ? '1' : '0'}${res.overflow ? `: ${a} + ${b} = ${a + b} does not fit in [${min}, ${max}]` : ''}. They are two different flags.`,
          ),
        },
        {
          title: L(lang, 'Valore letto', 'Value read'),
          body: res.overflow
            ? L(
                lang,
                `Con overflow il valore letto, ${res.sum}, **non** è la somma matematica.`,
                `With overflow the value read, ${res.sum}, is **not** the mathematical sum.`,
              )
            : L(
                lang,
                `Senza overflow coincide con la somma: ${res.sum}.`,
                `Without overflow it equals the sum: ${res.sum}.`,
              ),
        },
      ],
      answer: [
        bitsAnswer(L(lang, `${a} in CP2`, `${a} in two's complement`), toBin(a, bits)),
        bitsAnswer(L(lang, `${b} in CP2`, `${b} in two's complement`), toBin(b, bits)),
        bitsAnswer(L(lang, `Somma su ${bits} bit`, `${bits}-bit sum`), res.binary),
        yesNoAnswer(L(lang, 'Riporto uscente? (sì/no)', 'Carry-out? (yes/no)'), res.carryOut, lang),
        yesNoAnswer(L(lang, 'Overflow? (sì/no)', 'Overflow? (yes/no)'), res.overflow, lang),
        {
          label: L(lang, 'Valore letto in CP2', "Value read in two's complement"),
          value: res.sum,
          tol: 1e-9,
        },
      ],
    };
  },
});
