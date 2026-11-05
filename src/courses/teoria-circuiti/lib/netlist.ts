/**
 * Netlist interna esatta dei generatori (valori razionali). È la stessa descrizione letta dal
 * risolutore esatto, dal simulatore indipendente e dal convertitore verso la netlist del kit
 * (`toKitNetlist`, disegnata da <Circuit> / renderSchematic).
 */
import { Rational } from './rational';
import { Cx } from './complex';

export const GND = '0';
export interface Wave {
  dc: Rational;
  /** Fasore di picco nella convenzione del coseno: A cos(ωt) → A, A sin(ωt) → −jA. */
  ac: Cx;
}
export const wave = (dc: Rational | number | string = 0, ac: Cx | Rational | number = 0): Wave => ({
  dc: Rational.from(dc),
  ac: Cx.from(ac),
});

type Two = { id: string; a: string; b: string };
export type Element =
  | (Two & { type: 'R'; r: Rational })
  | (Two & { type: 'C'; c: Rational; v0?: Rational })
  | (Two & { type: 'L'; l: Rational; i0?: Rational })
  | (Two & { type: 'V'; wave: Wave })
  | (Two & { type: 'I'; wave: Wave })
  | (Two & { type: 'G'; cp: string; cn: string; gm: Rational })
  | { type: 'T'; id: string; p1a: string; p1b: string; p2a: string; p2b: string; n: Rational }
  | { type: 'N'; id: string; na: string; nb: string; ra: string; rb: string }
  | {
      type: 'P';
      id: string;
      p1a: string;
      p1b: string;
      p2a: string;
      p2b: string;
      kind: 'Z' | 'Y';
      m: Rational[][];
    };
export interface Circuit {
  elements: Element[];
}

export const NODE_FIELDS: Record<Element['type'], string[]> = {
  R: ['a', 'b'],
  C: ['a', 'b'],
  L: ['a', 'b'],
  V: ['a', 'b'],
  I: ['a', 'b'],
  G: ['a', 'b', 'cp', 'cn'],
  T: ['p1a', 'p1b', 'p2a', 'p2b'],
  N: ['na', 'nb', 'ra', 'rb'],
  P: ['p1a', 'p1b', 'p2a', 'p2b'],
};

export function validate(c: Circuit): true {
  const ids = new Set<string>();
  for (const e of c.elements) {
    if (!e.id || ids.has(e.id)) throw new Error('id elemento mancante o duplicato: ' + e.id);
    ids.add(e.id);
  }
  return true;
}
export function nodesOf(c: Circuit): string[] {
  const s = new Set<string>([GND]);
  for (const e of c.elements)
    for (const f of NODE_FIELDS[e.type]) s.add(String((e as unknown as Record<string, string>)[f]));
  return [...s];
}
export const byId = (c: Circuit, id: string) => c.elements.find((e) => e.id === id);
export const clone = (c: Circuit): Circuit => ({ elements: c.elements.map((e) => ({ ...e })) });
/** Elementi che introducono una corrente incognita nell'analisi nodale modificata. */
export const HAS_CURRENT = new Set(['V', 'L', 'N']);
