import { describe, expect, it } from 'vitest';
import { judgeSop, parseSop, sopMinterms } from './parseSop';
import { minimalCover, coverCost } from './boolean';

/** Insieme dei mintermini a 1 di una funzione, valutata a forza bruta. */
function onSetOf(vars: number, f: (bits: number[]) => boolean): Set<number> {
  const out = new Set<number>();
  for (let m = 0; m < 1 << vars; m++) {
    const bits = Array.from({ length: vars }, (_, i) => (m >> (vars - 1 - i)) & 1);
    if (f(bits)) out.add(m);
  }
  return out;
}

describe('parseSop', () => {
  it('legge le notazioni equivalenti della stessa espressione', () => {
    const forms = ["A'B + C", 'ĀB + C', '!A·B + C', 'not a and b or c', '/A*B|C'];
    const reference = parseSop("A'B + C", 3);
    expect(reference.ok).toBe(true);
    if (!reference.ok) return;
    const expected = sopMinterms(reference.terms, 3);

    for (const form of forms) {
      const parsed = parseSop(form, 3);
      expect(parsed.ok, form).toBe(true);
      if (!parsed.ok) continue;
      expect([...sopMinterms(parsed.terms, 3)], form).toEqual([...expected]);
    }
  });

  it('vale davvero Ā·B + C sulle otto combinazioni', () => {
    const parsed = parseSop("A'B + C", 3);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const expected = onSetOf(3, ([a, b, c]) => (!a && b === 1) || c === 1);
    expect([...sopMinterms(parsed.terms, 3)].sort((x, y) => x - y)).toEqual(
      [...expected].sort((x, y) => x - y),
    );
  });

  it('il termine costante 1 copre tutto, lo 0 non copre nulla', () => {
    const one = parseSop('1', 3);
    expect(one.ok && sopMinterms(one.terms, 3).size).toBe(8);
    const zero = parseSop('0', 3);
    expect(zero.ok && sopMinterms(zero.terms, 3).size).toBe(0);
  });

  it('rifiuta con un messaggio utile ciò che non è leggibile', () => {
    expect(parseSop('A + Z', 3)).toMatchObject({ ok: false });
    expect(parseSop('A + + B', 3)).toMatchObject({ ok: false });
    expect(parseSop("'A", 3)).toMatchObject({ ok: false });
    expect(parseSop("A·A'", 3)).toMatchObject({ ok: false });
    expect(parseSop('A + B!', 3)).toMatchObject({ ok: false });
  });

  it('A·A è A: la ripetizione non conta due letterali', () => {
    const parsed = parseSop('AAB', 3);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(coverCost(parsed.terms, 3)).toEqual({ terms: 1, literals: 2 });
  });
});

describe('judgeSop', () => {
  const vars = 3;
  // Y = A·B + C, funzione di riferimento.
  const onSet = onSetOf(vars, ([a, b, c]) => (a === 1 && b === 1) || c === 1);
  const none = new Set<number>();

  it('riconosce la forma minima', () => {
    expect(judgeSop('AB + C', onSet, none, vars).status).toBe('minimal');
  });

  it('accetta ma segnala una forma corretta e ridondante', () => {
    const verdict = judgeSop("AB + C·A + C·A' + AB", onSet, none, vars);
    expect(verdict.status).toBe('correct');
    expect(verdict.message).toMatch(/non minima/);
  });

  it('boccia una forma sbagliata indicando la combinazione', () => {
    const verdict = judgeSop('A + C', onSet, none, vars);
    expect(verdict.status).toBe('wrong');
    expect(verdict.counterExample).toBeDefined();
    // A=1,B=0,C=0 → m = 4: l'espressione dà 1, la funzione 0.
    expect(verdict.counterExample?.minterm).toBe(4);
  });

  it('le indifferenze non fanno testo, e permettono di scendere di costo', () => {
    // Y = 1 sui mintermini 0 e 1, indifferente su 2 e 3 (2 variabili).
    const on = new Set([0, 1]);
    const dc = new Set([2, 3]);
    expect(judgeSop('1', on, dc, 2).status).toBe('minimal');
    expect(judgeSop("A'", on, dc, 2).status).toBe('correct');
  });

  it('il giudizio «minima» coincide sempre con il costo del minimizzatore esatto', () => {
    for (let mask = 1; mask < 256; mask++) {
      const on = new Set<number>();
      for (let m = 0; m < 8; m++) if (mask & (1 << m)) on.add(m);
      const best = minimalCover(on, none, 3);
      const text = best
        .map((term) => {
          const parts: string[] = [];
          for (let i = 0; i < 3; i++) {
            const bit = 1 << (2 - i);
            if (!(term.mask & bit)) continue;
            const name = 'ABC'[i] as string;
            parts.push(term.bits & bit ? name : `${name}'`);
          }
          return parts.length ? parts.join('') : '1';
        })
        .join(' + ');
      expect(judgeSop(text, on, none, 3).status, text).toBe('minimal');
    }
  });
});
