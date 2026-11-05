// Registro dei template: ogni template costruisce un'istanza (netlist + layout) da un generatore con seed.
import * as A from './templateA.js';
import * as B from './templateB.js';
import * as C from './templateC.js';
export const TEMPLATES = { A, B, C };
export const TEMPLATE_INFO = {
  A: 'Nullore come generatore di tensione o di corrente',
  B: 'Doppio bipolo (matrice Z o Y) con Thevenin/Norton',
  C: 'Trasformatore ideale',
};
