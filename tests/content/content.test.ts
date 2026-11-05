import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkContent, missingEnglish, type CheckOptions } from './lib';
import { compareTopicLists } from '../../tools/legacy-topics/compare.mjs';
import { loadAllGenerators } from '../../src/engine/generators';

const ROOT = resolve(import.meta.dirname, '../..');
const FIX = join(ROOT, 'tests/fixtures');
const whitelist = (
  JSON.parse(readFileSync(join(ROOT, 'tests/content/translation-whitelist.json'), 'utf8')) as {
    entries: string[];
  }
).entries;

describe('contenuti del sito (src/content)', () => {
  it('rispettano schema, riferimenti, traduzioni e argomenti legacy', async () => {
    const opts: CheckOptions = {
      contentDir: join(ROOT, 'src/content'),
      legacyDir: join(ROOT, 'legacy'),
      extractorsDir: join(ROOT, 'tools/legacy-topics'),
      generatorIds: new Set(loadAllGenerators().map((g) => g.id)),
      translationWhitelist: whitelist,
    };
    expect(await checkContent(opts)).toEqual([]);
  });
});

describe('controlli sui contenuti (fixture)', () => {
  const base: CheckOptions = {
    contentDir: join(FIX, 'content'),
    legacyDir: join(FIX, 'legacy'),
    extractorsDir: join(FIX, 'legacy-topics'),
    generatorIds: new Set(['esempio/legge-di-ohm']),
    translationWhitelist: [],
  };

  it('il corso d’esempio è valido', async () => {
    expect(await checkContent(base)).toEqual([]);
  });

  it('segnala i generatori non registrati', async () => {
    const errors = await checkContent({ ...base, generatorIds: new Set() });
    expect(errors.some((e) => e.includes('generatore non registrato'))).toBe(true);
  });

  it('segnala l’estrattore mancante', async () => {
    const errors = await checkContent({ ...base, extractorsDir: join(FIX, 'inesistente') });
    expect(errors.some((e) => e.includes("manca l'estrattore"))).toBe(true);
  });

  it('confronta gli argomenti con il sito originale', () => {
    const legacy = [
      { title: 'Resistori e legge di Ohm', group: 'Circuiti in continua' },
      { title: 'Condensatori', group: 'Circuiti in continua' },
    ];
    expect(compareTopicLists(legacy, [...legacy])).toEqual([]);
    expect(
      compareTopicLists(legacy, [
        { title: 'Resistori  e legge di Ohm', group: 'Circuiti in continua' },
        legacy[1]!,
      ]),
    ).toEqual([]);
    expect(compareTopicLists(legacy, [legacy[1]!, legacy[0]!])).toHaveLength(2);
    expect(compareTopicLists(legacy, [legacy[0]!])[0]).toMatch(/mancante/);
    expect(compareTopicLists(legacy, [...legacy, { title: 'Induttori' }])[0]).toMatch(/in più/);
    expect(compareTopicLists(legacy, [legacy[0]!, { title: 'Condensatori', group: 'Altro' }])[0]).toMatch(
      /gruppo/,
    );
    expect(compareTopicLists([], [])[0]).toMatch(/non ha trovato/);
  });

  it('individua i testi senza inglese', () => {
    expect(missingEnglish({ title: { it: 'a', en: 'b' }, steps: [{ body: { it: 'x' } }] })).toEqual([
      'steps.0.body',
    ]);
  });
});
