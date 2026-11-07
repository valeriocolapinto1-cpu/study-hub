/**
 * Utilità comuni ai generatori di Fondamenti di Informatica: testi bilingui,
 * risposte testuali (binario, esadecimale, sì/no) e alternative di una
 * crocetta senza duplicati.
 */
import type { AnswerItem, Choice } from '../../../engine/generators/registry';
import type { Rng } from '../../../engine/random';

export type Lang = 'it' | 'en';

export const COURSE = 'fondamenti-informatica';

/** Sceglie il testo nella lingua richiesta. */
export const L = (lang: Lang, it: string, en: string): string => (lang === 'en' ? en : it);

/** Raggruppa le cifre a quattro a quattro partendo da destra: `11010011` → `1101 0011`. */
export function group4(digits: string): string {
  const out: string[] = [];
  for (let end = digits.length; end > 0; end -= 4) out.unshift(digits.slice(Math.max(0, end - 4), end));
  return out.join(' ');
}

/** Risposta binaria: si accettano le cifre attaccate o raggruppate a quattro. */
export function bitsAnswer(label: string, bits: string): AnswerItem {
  const grouped = group4(bits);
  return {
    label,
    value: bits,
    kind: 'text',
    ...(grouped !== bits ? { accept: [grouped] } : {}),
  };
}

/** Risposta esadecimale: `D3`, `0xD3`, `D3h`, `D3₁₆` (maiuscole e minuscole indifferenti). */
export function hexAnswer(label: string, hex: string): AnswerItem {
  return { label, value: hex, kind: 'text', accept: [`0x${hex}`, `${hex}h`, `${hex}16`, `${hex}₁₆`] };
}

/** Risposta sì/no, in entrambe le lingue. */
export function yesNoAnswer(label: string, yes: boolean, lang: Lang): AnswerItem {
  const it = yes ? ['sì', 'si', 's'] : ['no', 'n'];
  const en = yes ? ['yes', 'y'] : ['no', 'n'];
  const [value, ...accept] = lang === 'en' ? [...en, ...it] : [...it, ...en];
  return { label, value: value!, kind: 'text', accept: [...new Set(accept.filter((a) => a !== value))] };
}

/**
 * Alternative di una crocetta: la giusta più `count − 1` distrattori distinti,
 * rimescolate. Un distrattore uguale alla risposta viene scartato; se non ne
 * restano abbastanza è un errore del generatore (lo intercettano i test).
 */
export function makeChoices(
  rng: Rng,
  correct: string,
  distractors: readonly string[],
  count = 4,
  explanation?: string,
): Choice[] {
  const pool: string[] = [];
  for (const d of distractors) if (d !== correct && !pool.includes(d)) pool.push(d);
  if (pool.length < count - 1) throw new Error(`distrattori insufficienti: ${pool.length} per "${correct}"`);
  return rng.shuffle([correct, ...pool.slice(0, count - 1)]).map((text) => ({
    text,
    correct: text === correct,
    ...(text === correct && explanation ? { explanation } : {}),
  }));
}

/**
 * Alternative numeriche: prima i distrattori «buoni» (errori plausibili), poi,
 * se dopo la deduplica non bastano, valori vicini alla risposta.
 */
export function numericChoices(
  rng: Rng,
  answer: number,
  extras: readonly number[],
  count = 4,
  explanation?: string,
): Choice[] {
  const seen = new Set<number>([answer]);
  const pool: number[] = [];
  for (const v of extras) {
    if (!seen.has(v)) {
      seen.add(v);
      pool.push(v);
    }
  }
  for (let delta = 1; pool.length < count - 1; delta++) {
    for (const c of [answer + delta, answer - delta]) {
      if (pool.length < count - 1 && !seen.has(c)) {
        seen.add(c);
        pool.push(c);
      }
    }
  }
  return makeChoices(rng, String(answer), pool.map(String), count, explanation);
}

/** Blocco preformattato per il testo ricco (```). */
export const pre = (text: string): string => '```\n' + text + '\n```';
