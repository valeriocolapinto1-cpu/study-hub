import type { Trap } from './types';

/**
 * Convenzioni di notazione: come conviene scrivere le risposte perché si
 * capiscano.
 *
 * Erano «le accortezze raccolte dagli appunti degli studenti», e prima ancora
 * «le trappole del docente»: affermazioni di terza mano su che cosa una
 * persona reale si aspetta, gradisce o considera sbagliato. Il badge «da
 * verificare» serviva ad ammettere che nessuno le aveva confermate — ma un
 * badge non rende innocua un'affermazione su una persona reale: la dichiara
 * incerta e la lascia lì.
 *
 * Quello che restava di utile, tolta la provenienza, era vero da sé: sono
 * fatti sulla notazione, che stanno in piedi senza appoggiarsi a nessuno.
 *
 * REGOLA PER CHI NE AGGIUNGE UNA: deve essere un'affermazione **verificabile
 * sulla notazione o sulla materia**, non su una persona, un corso o un esame.
 * Se per scriverla ti serve dire che qualcuno preferisce, pretende o penalizza
 * qualcosa, non va qui — e probabilmente non va da nessuna parte.
 */
export const traps: Trap[] = [
  {
    id: 'trap-and-assoc',
    title: 'Porte AND a più di due ingressi',
    body: "Una porta a tre o più ingressi è una comodità del disegno: in hardware si costruisce con porte a due ingressi. Scomporla nello schema mostra che conosci la struttura reale, ed è l'unico modo di far vedere quanti livelli di ritardo attraversa il segnale.",
  },
  {
    id: 'trap-ram',
    title: 'RAM non vuol dire «accesso casuale»',
    body: 'La sigla è un falso amico: <b>random access</b> non significa che l’accesso avvenga a caso, ma che il <b>tempo di accesso non dipende dalla posizione</b> del dato in memoria. Il contrario è l’accesso sequenziale di un nastro, dove per leggere la fine bisogna scorrere tutto.',
  },
  {
    id: 'trap-simboli',
    title: 'Simboli dell’algebra di Boole',
    body: 'In algebra di Boole la notazione corrente è <code>∧</code> e <code>∨</code> (oppure <code>·</code> e <code>+</code>); «AND» e «OR» per esteso appartengono alla descrizione dei circuiti. Le due si equivalgono: quello che conta è <b>non mescolarle nella stessa espressione</b>, perché una riga scritta metà in un modo e metà nell’altro si legge male.',
  },
  {
    id: 'trap-demorgan',
    title: 'De Morgan vale anche a più fattori',
    body: 'Le due leggi si ricordano su due variabili, ma valgono su quante ne vuoi: la negazione di un prodotto di <i>n</i> fattori è la somma delle <i>n</i> negazioni, e viceversa. Applicarle solo alle coppie è un errore che compare quando l’espressione si allunga.',
  },
  {
    id: 'trap-rtn',
    title: 'La forma della notazione RTN',
    body: 'Nel trasferimento fra registri le parentesi quadre indicano il <b>contenuto</b>, e stanno solo sulle sorgenti: <code>Add R1,R2,R3</code> diventa <code>R1 ← [R2]+[R3]</code>. Scrivere <code>[R1] ←</code> a sinistra significherebbe assegnare a un valore invece che a un registro.',
  },
];
