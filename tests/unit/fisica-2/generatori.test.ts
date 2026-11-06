// Generatori di Fisica Generale II (src/courses/fisica-2/generators): struttura, lingue, TeX e unità.
import assert from 'node:assert/strict';
import { describe, expect, test } from 'vitest';
import katex from 'katex';
import { C0, EPS0, K, MU0, TEMPLATES, runTemplate } from '../../../src/courses/fisica-2/generators/lib';
import '../../../src/courses/fisica-2/generators/b1-elettrostatica';
import '../../../src/courses/fisica-2/generators/b2-corrente';
import '../../../src/courses/fisica-2/generators/b3-magnetostatica';
import '../../../src/courses/fisica-2/generators/b4-induzione';
import '../../../src/courses/fisica-2/generators/b5-onde';
import { runGenerator } from '../../../src/engine/generators/registry';
import { parseUnit } from '../../../src/engine/units';

const SEEDS = Array.from({ length: 40 }, (_, i) => 1000 + i * 37);

describe('fisica-2: struttura dei generatori', () => {
  test('35 template (come nel sito originale), almeno 5 per blocco b1–b5', () => {
    const all = Object.values(TEMPLATES);
    expect(all).toHaveLength(35);
    for (const b of ['b1', 'b2', 'b3', 'b4', 'b5']) expect(all.filter((t) => t.blocco === b).length).toBeGreaterThanOrEqual(5);
  });
  test('ogni generatore produce testo, passi e risposte validi in IT ed EN, con TeX corretto e unità riconosciute', () => {
    for (const tpl of Object.values(TEMPLATES)) {
      for (const seed of SEEDS.slice(0, 15)) {
        for (const lang of ['it', 'en'] as const) {
          const ex = runGenerator(`fisica-2/${tpl.id}`, seed, lang);
          const txt = JSON.stringify(ex);
          assert.ok(!/NaN|undefined|Infinity|\[object/.test(txt), `${tpl.id} ${seed} ${lang}`);
          assert.ok(ex.statement.length > 80 && ex.steps.length >= 3 && ex.answer.length >= 1, tpl.id);
          for (const s of [ex.statement, ...ex.steps.map((x) => x.body)]) {
            assert.equal((s.match(/\$/g) ?? []).length % 2, 0, `delimitatori $ in ${tpl.id}`);
            for (const m of s.matchAll(/\$([^$]+)\$/g)) katex.renderToString(m[1]!, { throwOnError: true, strict: 'error' });
          }
          for (const a of ex.answer) {
            assert.ok(typeof a.value === 'number' && Number.isFinite(a.value), `${tpl.id} ${a.label}`);
            if (a.unit) parseUnit(a.unit);
          }
          if (lang === 'en') assert.ok(!/\{,\}/.test(txt), `virgola decimale italiana nel testo inglese di ${tpl.id}`);
        }
      }
    }
  });
  test('riproducibilità: stesso seme, stesso esercizio; semi diversi, parametri diversi', () => {
    const tpl = TEMPLATES['b3-coassiale']!;
    expect(runTemplate(tpl, 123, 'it')).toEqual(runTemplate(tpl, 123, 'it'));
    expect(runTemplate(tpl, 123, 'it').parametri).not.toEqual(runTemplate(tpl, 124, 'it').parametri);
    expect(runTemplate(tpl, 123, 'it').valori).toEqual(runTemplate(tpl, 123, 'en').valori);
  });
  test('le risposte coincidono con i valori calcolati', () => {
    expect(runTemplate(TEMPLATES['b1-filo-finito']!, 5, 'it').answer[2]!.value).toBe(runTemplate(TEMPLATES['b1-filo-finito']!, 5, 'it').valori.E);
    expect(C0 * C0 * EPS0 * MU0).toBeCloseTo(1, 8);
    expect(K).toBeCloseTo(8.98755e9, -4);
  });
});

