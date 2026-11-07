import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import itDict from '../../src/i18n/it.json';
import { ISLAND_NAMESPACES } from '../../src/i18n/island-namespaces.mjs';
import { filterIslandKeys } from '../../tools/vite/island-i18n.mjs';
import { t } from '../../src/islands/lib/i18n';

const dir = new URL('../../src/islands/', import.meta.url);
const KEYS = new Set(Object.keys(itDict));
const PREFIXES = new Set(Object.keys(itDict).map((k) => k.split('.')[0]));

describe('dizionario delle isole', () => {
  it('ogni chiave letterale usata dalle isole con t() è nei namespace inclusi', () => {
    const missing: string[] = [];
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.tsx'))) {
      const src = readFileSync(new URL(file, dir), 'utf8');
      if (!src.includes("from './lib/i18n'")) continue;
      // Chiavi intere ('exam.setup') e prefissi dei template (`engine.status.${s}`).
      for (const m of src.matchAll(/['`]([a-zA-Z]+)\.([\w.-]*)/g)) {
        const [, ns, rest] = m;
        if (!PREFIXES.has(ns!) || (!KEYS.has(`${ns}.${rest}`) && !src.includes(`${ns}.${rest}\${`))) continue;
        if (!ISLAND_NAMESPACES.includes(ns!)) missing.push(`${file}: ${ns}.${rest}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('il dizionario ridotto è molto più piccolo e t() funziona', () => {
    expect(JSON.stringify(filterIslandKeys(itDict)).length).toBeLessThan(JSON.stringify(itDict).length / 2);
    expect(t('en', 'exam.setup')).not.toBe('exam.setup');
  });
});
