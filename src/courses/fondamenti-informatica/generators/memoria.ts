/**
 * Generatori su IEEE 754, memoria virtuale, campi dell'indirizzo di cache,
 * cicli di pipeline e notazione RTN (dal sito originale: genIeee754,
 * genPageTranslate, genCacheFields, genPipelineCycles, genRtn).
 */
import { registerGenerator } from '../../../engine/generators/registry';
import { createRng, type Rng } from '../../../engine/random';
import {
  BIAS,
  decodeIeee754,
  fieldsToGroupedBits,
  fmtDecimal,
  realExponent,
  type Ieee754Fields,
} from '../lib/ieee754';
import { toBin, toHex } from '../lib/numeric';
import { bitsAnswer, hexAnswer, L, makeChoices, numericChoices } from '../lib/common';

const exact = (label: string, value: number) => ({ label, value, tol: 1e-9 });
const log2 = (n: number) => Math.round(Math.log2(n));

/**
 * Campi di un valore **esattamente rappresentabile**: si scelgono prima i
 * campi e poi si ricava il numero, così nessun arrotondamento può falsare la
 * risposta. La mantissa usa i 4 bit alti, per decimali leggibili.
 */
export function sampleIeeeFields(r: Rng): Ieee754Fields {
  return { sign: r.pick([0, 1] as const), exponent: r.int(-4, 6) + BIAS, mantissa: r.int(0, 15) << 19 };
}

export const ieee754 = registerGenerator({
  id: 'fondamenti-informatica/ieee-754',
  topic: 'virgola-mobile',
  objectives: ['virgola-mobile.1', 'virgola-mobile.2'],
  generate(seed, lang) {
    const r = createRng(seed);
    const f = sampleIeeeFields(r);
    const value = decodeIeee754(f);
    const real = realExponent(f);
    const num = (v: number) => fmtDecimal(v, lang);
    if (r.chance(0.5)) {
      return {
        statement: L(
          lang,
          `Codifica **${num(value)}** in IEEE 754 singola precisione. Qual è il campo **esponente** (8 bit)?`,
          `Encode **${num(value)}** in IEEE 754 single precision. What is the **exponent** field (8 bits)?`,
        ),
        steps: [
          {
            title: L(lang, 'Normalizza', 'Normalise'),
            body: L(
              lang,
              `${num(Math.abs(value))} = 1,… × 2^${real}: l'esponente reale è ${real}.`,
              `${num(Math.abs(value))} = 1.… × 2^${real}: the real exponent is ${real}.`,
            ),
          },
          {
            title: L(lang, 'Polarizza', 'Add the bias'),
            body: `${real} + ${BIAS} = ${f.exponent} = \`${toBin(f.exponent, 8)}\`.`,
          },
        ],
        answer: [bitsAnswer(L(lang, 'Campo esponente', 'Exponent field'), toBin(f.exponent, 8))],
      };
    }
    const sign = f.sign === 1 ? -1 : 1;
    // Errore più insidioso: dimenticare il bit implicito (0,M invece di 1,M).
    const withoutImplicit = sign * (f.mantissa / 2 ** 23) * 2 ** real;
    return {
      statement:
        L(
          lang,
          'Un numero in IEEE 754 singola precisione ha questa configurazione di bit (segno, esponente, mantissa). Quale valore rappresenta?',
          'A number in IEEE 754 single precision has this bit pattern (sign, exponent, mantissa). What value does it represent?',
        ) + `\n\n\`${fieldsToGroupedBits(f)}\``,
      steps: [
        {
          title: L(lang, 'Esponente', 'Exponent'),
          body: L(
            lang,
            `Esponente polarizzato ${f.exponent}, quindi reale ${f.exponent} − ${BIAS} = ${real}.`,
            `Biased exponent ${f.exponent}, so the real one is ${f.exponent} − ${BIAS} = ${real}.`,
          ),
        },
        {
          title: L(lang, 'Mantissa con il bit implicito', 'Mantissa with the hidden bit'),
          body: L(
            lang,
            `Si rimette «1,» davanti alla mantissa e si sposta la virgola di ${real} posizioni: ${num(value)}.`,
            `Put “1.” back in front of the mantissa and move the point by ${real} positions: ${num(value)}.`,
          ),
        },
      ],
      answer: [],
      choices: makeChoices(r, num(value), [
        num(withoutImplicit),
        num(-value),
        num(value * 2),
        num(value / 2),
      ]),
    };
  },
});

export const traduzioneIndirizzi = registerGenerator({
  id: 'fondamenti-informatica/traduzione-indirizzi',
  topic: 'memoria-virtuale',
  objectives: ['memoria-virtuale.1'],
  generate(seed, lang) {
    const r = createRng(seed);
    if (r.chance(0.6)) {
      const offsetBits = r.pick([8, 10, 12] as const);
      const pageSize = 2 ** offsetBits;
      const page = r.int(1, 15);
      const frame = r.int(16, 63);
      const offset = r.int(1, pageSize - 1);
      const virtual = page * pageSize + offset;
      const physical = frame * pageSize + offset;
      return {
        statement: L(
          lang,
          `Con pagine da **${pageSize} byte**, l'indirizzo virtuale \`0x${toHex(virtual)}\` cade nella pagina **${page}**, mappata sul frame **${frame}**. Qual è l'offset, e qual è l'indirizzo fisico in esadecimale?`,
          `With **${pageSize}-byte** pages, the virtual address \`0x${toHex(virtual)}\` falls in page **${page}**, mapped to frame **${frame}**. What is the offset, and what is the physical address in hexadecimal?`,
        ),
        steps: [
          {
            title: L(lang, 'L’offset non si traduce', 'The offset is not translated'),
            body: `0x${toHex(virtual)} mod ${pageSize} = ${offset}.`,
          },
          {
            title: L(lang, 'Pagina → frame', 'Page → frame'),
            body: L(
              lang,
              `Si sostituisce solo il numero di pagina con quello di frame: ${frame} · ${pageSize} + ${offset} = ${physical} = 0x${toHex(physical)}.`,
              `Only the page number is replaced by the frame number: ${frame} · ${pageSize} + ${offset} = ${physical} = 0x${toHex(physical)}.`,
            ),
          },
        ],
        answer: [
          exact(L(lang, 'Offset (decimale)', 'Offset (decimal)'), offset),
          hexAnswer(
            L(lang, 'Indirizzo fisico (esadecimale)', 'Physical address (hexadecimal)'),
            toHex(physical),
          ),
        ],
      };
    }
    const kib = r.pick([1, 2, 4, 8, 16] as const);
    const bits = log2(kib * 1024);
    const vaBits = r.pick([32, 36, 40] as const);
    return {
      statement: L(
        lang,
        `Con pagine da **${kib} KiB** e indirizzi virtuali da **${vaBits} bit**, quanti bit formano l'**offset** e quanti il **numero di pagina**?`,
        `With **${kib} KiB** pages and **${vaBits}-bit** virtual addresses, how many bits form the **offset** and how many the **page number**?`,
      ),
      steps: [
        {
          title: L(lang, 'Offset', 'Offset'),
          body: L(
            lang,
            `${kib} KiB = ${kib * 1024} byte = 2^${bits}: servono ${bits} bit per indicare un byte dentro la pagina.`,
            `${kib} KiB = ${kib * 1024} bytes = 2^${bits}: ${bits} bits are needed to address a byte within the page.`,
          ),
        },
        {
          title: L(lang, 'Numero di pagina', 'Page number'),
          body: `${vaBits} − ${bits} = ${vaBits - bits}.`,
        },
      ],
      answer: [
        exact(L(lang, 'Bit di offset', 'Offset bits'), bits),
        exact(L(lang, 'Bit del numero di pagina', 'Page-number bits'), vaBits - bits),
      ],
    };
  },
});

export const campiCache = registerGenerator({
  id: 'fondamenti-informatica/campi-cache',
  topic: 'gerarchia-di-memoria',
  objectives: ['gerarchia-di-memoria.3'],
  generate(seed, lang) {
    const r = createRng(seed);
    const addressBits = r.pick([16, 32] as const);
    const blockBytes = r.pick([8, 16, 32, 64] as const);
    const ways = r.pick([1, 2, 4, 8] as const);
    const sets = r.pick([32, 64, 128, 256] as const);
    const offsetBits = log2(blockBytes);
    const indexBits = log2(sets);
    const tagBits = addressBits - indexBits - offsetBits;
    const total = sets * ways * blockBytes;
    const size = total >= 1024 ? `${total / 1024} KiB` : `${total} byte`;
    const layout =
      ways === 1
        ? L(lang, `a **mappatura diretta** con ${sets} linee`, `**direct-mapped** with ${sets} lines`)
        : L(
            lang,
            `**set-associativa a ${ways} vie** con ${sets} insiemi`,
            `**${ways}-way set-associative** with ${sets} sets`,
          );
    return {
      statement: L(
        lang,
        `Una cache ${layout}, blocchi da **${blockBytes} byte** (${size} in totale), indirizzi da **${addressBits} bit**. Quanti bit occupano **tag**, **indice** e **offset**?`,
        `A cache ${layout}, **${blockBytes}-byte** blocks (${size.replace('byte', 'bytes')} in total), **${addressBits}-bit** addresses. How many bits do the **tag**, **index** and **offset** take?`,
      ),
      steps: [
        { title: 'Offset', body: `log₂(${blockBytes}) = ${offsetBits}.` },
        {
          title: L(lang, 'Indice', 'Index'),
          body: L(
            lang,
            `log₂(${sets}) = ${indexBits}: l'indice sceglie ${ways === 1 ? 'la linea' : 'l’insieme'}, non la via.`,
            `log₂(${sets}) = ${indexBits}: the index selects the ${ways === 1 ? 'line' : 'set'}, not the way.`,
          ),
        },
        {
          title: 'Tag',
          body: L(
            lang,
            `${addressBits} − ${indexBits} − ${offsetBits} = ${tagBits}. I tre campi sommati fanno sempre l'ampiezza dell'indirizzo.`,
            `${addressBits} − ${indexBits} − ${offsetBits} = ${tagBits}. The three fields always add up to the address width.`,
          ),
        },
      ],
      answer: [
        exact('Tag', tagBits),
        exact(L(lang, 'Indice', 'Index'), indexBits),
        exact('Offset', offsetBits),
      ],
    };
  },
});

export const cicliPipeline = registerGenerator({
  id: 'fondamenti-informatica/cicli-pipeline',
  topic: 'pipeline',
  objectives: ['pipeline.1'],
  generate(seed, lang) {
    const r = createRng(seed);
    const k = r.int(4, 6);
    const n = r.int(6, 24);
    const pipelined = k + n - 1;
    const sequential = k * n;
    return {
      statement: L(
        lang,
        `Una pipeline a **${k} stadi** esegue **${n} istruzioni** senza stalli né salti. Quanti cicli servono con la pipeline, quanti senza (una istruzione alla volta), e quanti se ne risparmiano?`,
        `A **${k}-stage** pipeline executes **${n} instructions** with no stalls or branches. How many cycles are needed with the pipeline, how many without it (one instruction at a time), and how many are saved?`,
      ),
      steps: [
        {
          title: L(lang, 'Con la pipeline', 'With the pipeline'),
          body: L(
            lang,
            `La prima istruzione esce dopo ${k} cicli (riempimento), poi ne esce una per ciclo: ${k} + (${n} − 1) = ${pipelined}.`,
            `The first instruction completes after ${k} cycles (fill), then one completes per cycle: ${k} + (${n} − 1) = ${pipelined}.`,
          ),
        },
        {
          title: L(lang, 'Senza pipeline', 'Without the pipeline'),
          body: `${k} · ${n} = ${sequential}.`,
        },
        {
          title: L(lang, 'Risparmio', 'Saving'),
          body: L(
            lang,
            `${sequential} − ${pipelined} = ${sequential - pipelined} cicli; lo speedup ${sequential}/${pipelined} tende a ${k} per n grande.`,
            `${sequential} − ${pipelined} = ${sequential - pipelined} cycles; the speedup ${sequential}/${pipelined} tends to ${k} for large n.`,
          ),
        },
      ],
      answer: [
        exact(L(lang, 'Cicli con pipeline', 'Cycles with pipeline'), pipelined),
        exact(L(lang, 'Cicli senza pipeline', 'Cycles without pipeline'), sequential),
        exact(L(lang, 'Cicli risparmiati', 'Cycles saved'), sequential - pipelined),
      ],
    };
  },
});

const RTN_CASES = [
  {
    instr: { it: 'Add R1, R2, R3', en: 'Add R1, R2, R3' },
    right: 'R1 ← [R2] + [R3]',
    wrong: ['R1 ← R2 + R3', '[R1] ← [R2] + [R3]', 'R3 ← [R1] + [R2]'],
    note: {
      it: 'La destinazione è R1 e si scrive senza parentesi: non si legge, si scrive.',
      en: 'The destination is R1 and is written without brackets: it is written, not read.',
    },
  },
  {
    instr: { it: 'Load R1, LOC', en: 'Load R1, LOC' },
    right: 'R1 ← [LOC]',
    wrong: ['[R1] ← LOC', 'LOC ← [R1]', 'R1 ← LOC'],
    note: {
      it: 'Si legge il contenuto di LOC e lo si porta in R1.',
      en: 'The contents of LOC are read and moved into R1.',
    },
  },
  {
    instr: { it: 'Store R1, LOC', en: 'Store R1, LOC' },
    right: 'LOC ← [R1]',
    wrong: ['R1 ← [LOC]', '[LOC] ← [R1]', 'LOC ← R1'],
    note: {
      it: 'Store scrive in memoria: la destinazione è LOC, la sorgente è il contenuto di R1.',
      en: 'Store writes to memory: the destination is LOC, the source is the contents of R1.',
    },
  },
  {
    instr: { it: 'Aumenta di [LOC] il valore in R1', en: 'Increase the value in R1 by [LOC]' },
    right: 'R1 ← [LOC] + [R1]',
    wrong: ['R1 ← LOC + R1', '[R1] ← [LOC] + [R1]', 'LOC ← [LOC] + [R1]'],
    note: {
      it: 'Entrambe le sorgenti si leggono, quindi entrambe hanno le parentesi.',
      en: 'Both sources are read, so both get brackets.',
    },
  },
] as const;

export const rtn = registerGenerator({
  id: 'fondamenti-informatica/notazione-rtn',
  topic: 'processore',
  objectives: ['processore.2'],
  generate(seed, lang) {
    const r = createRng(seed);
    const c = r.pick(RTN_CASES);
    const code = (s: string) => `\`${s}\``;
    return {
      statement: L(
        lang,
        `Come si scrive in RTN \`${c.instr.it}\`?`,
        `How do you write \`${c.instr.en}\` in RTN?`,
      ),
      steps: [
        {
          title: L(lang, 'Le parentesi quadre', 'Square brackets'),
          body: L(
            lang,
            `Le parentesi quadre significano «contenuto di». ${c.note.it}`,
            `Square brackets mean “contents of”. ${c.note.en}`,
          ),
        },
      ],
      answer: [],
      choices: makeChoices(r, code(c.right), c.wrong.map(code)),
    };
  },
});

export { numericChoices };
