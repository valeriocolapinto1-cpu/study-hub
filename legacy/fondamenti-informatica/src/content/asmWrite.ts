import type { AsmWriteItem } from './types';

/**
 * Esercizi «scrivi un programma». Si svolgono su carta come all'esame: l'app
 * mostra la soluzione modello e raccoglie l'autovalutazione.
 */
export const asmWrite: AsmWriteItem[] = [
  {
    id: 'asmw-mul',
    topic: 'isa',
    q: 'Scrivi un programma in stile RISC che calcoli la moltiplicazione di due numeri in LOC1 e LOC2 tramite somme successive, salvando il risultato in LOC3.',
    model: `<pre>      Load  LOC1, NUM1
      Load  LOC2, NUM2
      Clear LOC3
<span class="lb">CICLO:</span> Sub   LOC2, LOC2, 1
      Add   LOC3, LOC3, LOC1
      Branch_if_[LOC2]&gt;0  CICLO
      Store LOC3, RES</pre>`,
  },
  {
    id: 'asmw-sum-list',
    topic: 'isa',
    q: "Scrivi un programma che sommi N valori contigui a partire dall'indirizzo LIST e salvi il totale in SUM.",
    model: `<pre>      Load  N, R1
      Move  R2, #LIST
      Clear R3
<span class="lb">L:</span>    Load  (R2), R4
      Add   R3, R3, R4
      Add   R2, R2, #4
      Sub   R1, R1, #1
      Branch_if_[R1]&gt;0  L
      Store R3, SUM</pre>`,
  },
];
