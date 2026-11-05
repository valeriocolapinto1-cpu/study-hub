// Descrizione unica del circuito. Solutore, simulatore, spiegazioni, SPICE e disegno leggono questa struttura.
import { Rational } from '../rational.js';
import { Cx } from '../complex.js';

export const GND = '0';
const two = ['R', 'C', 'L', 'V', 'I', 'S'];
const FIELDS = {
  R: ['a', 'b', 'r'], C: ['a', 'b', 'c'], L: ['a', 'b', 'l'], V: ['a', 'b'], I: ['a', 'b'], S: ['a', 'b'],
  E: ['a', 'b', 'cp', 'cn', 'mu'], G: ['a', 'b', 'cp', 'cn', 'gm'], H: ['a', 'b', 'ctrl', 'rm'], F: ['a', 'b', 'ctrl', 'beta'],
  T: ['p1a', 'p1b', 'p2a', 'p2b', 'n'], N: ['na', 'nb', 'ra', 'rb'], P: ['p1a', 'p1b', 'p2a', 'p2b', 'kind', 'm'],
};
export const NODE_FIELDS = {
  R: ['a', 'b'], C: ['a', 'b'], L: ['a', 'b'], V: ['a', 'b'], I: ['a', 'b'], S: ['a', 'b'], E: ['a', 'b', 'cp', 'cn'], G: ['a', 'b', 'cp', 'cn'],
  H: ['a', 'b'], F: ['a', 'b'], T: ['p1a', 'p1b', 'p2a', 'p2b'], N: ['na', 'nb', 'ra', 'rb'], P: ['p1a', 'p1b', 'p2a', 'p2b'],
};
export const wave = (dc = 0, ac = 0) => ({ dc: Rational.from(dc), ac: Cx.from(ac) });

export function validate(circuit) {
  const ids = new Set();
  for (const e of circuit.elements) {
    if (!e.id || ids.has(e.id)) throw new Error('id elemento mancante o duplicato: ' + e.id);
    ids.add(e.id);
    if (!FIELDS[e.type]) throw new Error('tipo ignoto: ' + e.type);
    for (const f of FIELDS[e.type]) if (e[f] === undefined) throw new Error(`${e.id}: campo ${f} mancante`);
    if (e.type === 'V' || e.type === 'I') if (!e.wave) throw new Error(e.id + ': wave mancante');
  }
  for (const e of circuit.elements) if ((e.type === 'H' || e.type === 'F') && !ids.has(e.ctrl)) throw new Error(`${e.id}: controllo ${e.ctrl} inesistente`);
  return true;
}
export function nodesOf(circuit) {
  const s = new Set([GND]);
  for (const e of circuit.elements) for (const f of NODE_FIELDS[e.type]) s.add(String(e[f]));
  return [...s];
}
export const byId = (circuit, id) => circuit.elements.find((e) => e.id === id);
export const clone = (circuit) => ({ ...circuit, elements: circuit.elements.map((e) => ({ ...e })) });
/** Elementi che hanno una corrente tra le incognite (usabili come controllo per H, F). */
export const HAS_CURRENT = new Set(['V', 'L', 'S', 'E', 'H']);
export { two };
