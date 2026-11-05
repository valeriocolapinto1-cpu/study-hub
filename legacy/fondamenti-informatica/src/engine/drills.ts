import { addTwos, toBin, toHex } from './numeric';
import {
  loopListing,
  mulCmpListing,
  shiftListing,
  simLoop,
  simMulCmp,
  simShift,
  type LoopProgram,
  type MulCmpProgram,
  type ShiftProgram,
} from './asmSim';
import type { AsmLine, TopicId } from './types';

/**
 * Esercizi guidati della pagina Allenamento.
 *
 * Differenza rispetto ai vecchi «strumenti»: qui non si vede il risultato, si
 * scrive il **procedimento**, e ogni passaggio viene corretto per conto suo.
 * Chi sbaglia l'inversione dei bit lo scopre al passo 2, non guardando un
 * numero finale che non torna.
 *
 * Sono funzioni pure: la UI riceve una lista di passi e si limita a
 * disegnarli, quindi i passaggi si possono testare senza montare componenti.
 */

export type StepKind = 'bin' | 'hex' | 'dec' | 'yesno';

export interface DrillStep {
  id: string;
  /** Testo del passo; può contenere markup inline. */
  prompt: string;
  /** Come si fa: mostrato su richiesta, prima di rivelare la risposta. */
  hint: string;
  /** Risposta attesa, già in forma canonica. */
  answer: string;
  kind: StepKind;
  /** Larghezza attesa, per i passi binari: serve alla UI come promemoria. */
  width?: number;
}

export interface Drill {
  title: string;
  /** Riga di contesto sotto al titolo. */
  recap: string;
  /** Modulo di studio che spiega il procedimento: la UI ci rimanda. */
  topic: TopicId;
  steps: DrillStep[];
  /** Codice da eseguire a mente, quando l'esercizio ne ha uno. */
  listing?: AsmLine[];
}

/**
 * Forma canonica di una risposta, per confrontare intenzioni e non battiture.
 * `bin` tiene solo 0 e 1 (così «1111 0110» vale «11110110»), `hex` normalizza
 * prefisso e maiuscole, `dec` tiene cifre e segno, `yesno` accetta le varie
 * forme di sì/no che vengono spontanee.
 */
export function normalizeStep(input: string, kind: StepKind): string {
  const trimmed = input.trim();
  switch (kind) {
    case 'bin':
      return trimmed.replace(/[^01]/g, '');
    case 'hex':
      return trimmed.toUpperCase().replace(/^0X/, '').replace(/[^0-9A-F]/g, '');
    case 'dec': {
      const cleaned = trimmed.replace(/[^0-9+-]/g, '').replace(/^\+/, '');
      // «-0» e «0» sono lo stesso numero: senza questa riga il passo sul
      // risultato di una somma che fa zero risulterebbe sbagliato.
      return cleaned === '-0' ? '0' : cleaned;
    }
    case 'yesno': {
      const low = trimmed.toLowerCase();
      if (/^(s|sì|si|y|yes|1|v|vero|preso)/.test(low)) return 'sì';
      if (/^(n|no|f|falso|0)/.test(low)) return 'no';
      return low;
    }
  }
}

/** Il passo è stato risolto? Una risposta vuota non è né giusta né sbagliata. */
export function checkStep(step: DrillStep, input: string): boolean | null {
  const given = normalizeStep(input, step.kind);
  if (given === '') return null;
  return given === normalizeStep(step.answer, step.kind);
}

/** Quanti passi risolti su quanti, per la barra di avanzamento. */
export function drillProgress(drill: Drill, inputs: Record<string, string>): number {
  return drill.steps.filter((step) => checkStep(step, inputs[step.id] ?? '') === true).length;
}

/** Inverte i bit di una stringa binaria: complemento a 1. */
export function invertBits(bits: string): string {
  return [...bits].map((bit) => (bit === '0' ? '1' : '0')).join('');
}

// ─────────────────────────── complemento a 2 ───────────────────────────

/**
 * Il procedimento «a mano» chiesto all'esame: modulo, inversione, +1.
 * Sui positivi il CP2 coincide con il binario puro, quindi il drill cambia
 * forma e chiede il negativo come ultimo passo: è lì che si sbaglia.
 */
export function cp2Drill(value: number, bits: number): Drill {
  const hexDigits = Math.ceil(bits / 4);
  const canonical = toBin(value, bits);

  if (value < 0) {
    const magnitude = toBin(Math.abs(value), bits);
    const inverted = invertBits(magnitude);
    return {
      title: `Rappresenta ${value} in complemento a 2 su ${bits} bit`,
      recap: 'Modulo → inverti → somma 1. Tre passaggi, sempre gli stessi.',
      topic: 'bin',
      steps: [
        {
          id: 'mag',
          prompt: `Scrivi il <b>modulo</b> ${Math.abs(value)} in binario su ${bits} bit.`,
          hint: `Divisioni successive per 2, oppure somma di potenze: ${Math.abs(value)} = ${powerSum(Math.abs(value))}.`,
          answer: magnitude,
          kind: 'bin',
          width: bits,
        },
        {
          id: 'inv',
          prompt: 'Inverti tutti i bit (complemento a 1).',
          hint: 'Ogni 0 diventa 1 e viceversa. La lunghezza non cambia.',
          answer: inverted,
          kind: 'bin',
          width: bits,
        },
        {
          id: 'cp2',
          prompt: 'Somma 1 al risultato: ecco il complemento a 2.',
          hint: 'Somma binaria: 1+1 = 0 con riporto. I riporti si propagano finché trovi uno 0.',
          answer: canonical,
          kind: 'bin',
          width: bits,
        },
        {
          id: 'hex',
          prompt: `Riscrivilo in esadecimale (${hexDigits} cifre).`,
          hint: 'Raggruppa i bit a quattro a quattro <b>da destra</b>: ogni gruppo è una cifra esadecimale.',
          answer: toHex(((value % 2 ** bits) + 2 ** bits) % 2 ** bits, hexDigits),
          kind: 'hex',
        },
      ],
    };
  }

  const negative = toBin(-value, bits);
  return {
    title: `Rappresenta ${value} in complemento a 2 su ${bits} bit`,
    recap: 'Sui positivi il CP2 è il binario puro: il lavoro vero è il negativo.',
    topic: 'bin',
    steps: [
      {
        id: 'mag',
        prompt: `Scrivi ${value} in binario su ${bits} bit.`,
        hint: `Somma di potenze di 2: ${value} = ${powerSum(value)}.`,
        answer: canonical,
        kind: 'bin',
        width: bits,
      },
      {
        id: 'hex',
        prompt: `Riscrivilo in esadecimale (${hexDigits} cifre).`,
        hint: 'Quattro bit per cifra, raggruppando da destra.',
        answer: toHex(value, hexDigits),
        kind: 'hex',
      },
      {
        id: 'neg',
        prompt: `Ora scrivi <b>−${value}</b> in complemento a 2: inverti e somma 1.`,
        hint: 'Scorciatoia da foglio: copia i bit da destra fino al primo 1 compreso, poi inverti tutti gli altri.',
        answer: negative,
        kind: 'bin',
        width: bits,
      },
    ],
  };
}

/** 13 → «8 + 4 + 1», per suggerire senza dare la risposta in binario. */
function powerSum(n: number): string {
  const parts: number[] = [];
  for (let p = 1; p <= n; p *= 2) if (n & p) parts.push(p);
  return parts.reverse().join(' + ');
}

// ────────────────────────── somma con i due flag ──────────────────────────

/**
 * Somma in CP2 con i due flag tenuti distinti: riporto uscente e overflow
 * sono cose diverse, e confonderli è la trappola classica.
 */
export function sumDrill(a: number, b: number, bits: number): Drill {
  const result = addTwos(a, b, bits);
  return {
    title: `Somma ${a} + ${b} in complemento a 2 su ${bits} bit`,
    recap: 'Riporto uscente e overflow sono due flag diversi: qui vanno dichiarati separatamente.',
    topic: 'arith',
    steps: [
      {
        id: 'a',
        prompt: `Scrivi ${a} in CP2 su ${bits} bit.`,
        hint: a < 0 ? 'Modulo, inverti, somma 1.' : 'Binario puro: il bit di segno resta 0.',
        answer: toBin(a, bits),
        kind: 'bin',
        width: bits,
      },
      {
        id: 'b',
        prompt: `Scrivi ${b} in CP2 su ${bits} bit.`,
        hint: b < 0 ? 'Modulo, inverti, somma 1.' : 'Binario puro: il bit di segno resta 0.',
        answer: toBin(b, bits),
        kind: 'bin',
        width: bits,
      },
      {
        id: 'sum',
        prompt: `Somma i due, tenendo solo ${bits} bit.`,
        hint: 'In CP2 la somma è la stessa dei numeri senza segno: si somma e basta, il segno viene da sé.',
        answer: result.binary,
        kind: 'bin',
        width: bits,
      },
      {
        id: 'carry',
        prompt: 'Esce un <b>riporto</b> dal bit più significativo?',
        hint: 'È il riporto che uscirebbe dalla colonna più a sinistra. In CP2 da solo non significa errore.',
        answer: result.carryOut ? 'sì' : 'no',
        kind: 'yesno',
      },
      {
        id: 'ovf',
        prompt: 'C’è <b>overflow</b>?',
        hint: 'Overflow = riporto entrante ≠ riporto uscente sul bit di segno. Equivale a: due addendi di segno uguale con risultato di segno opposto.',
        answer: result.overflow ? 'sì' : 'no',
        kind: 'yesno',
      },
      {
        id: 'dec',
        prompt: 'Che numero rappresenta il risultato, letto in CP2?',
        hint: result.overflow
          ? 'Attenzione: con overflow il valore letto <b>non</b> è la somma matematica.'
          : 'Senza overflow coincide con la somma dei due decimali.',
        answer: String(result.sum),
        kind: 'dec',
      },
    ],
  };
}

// ─────────────────────────── esecuzione a mente ───────────────────────────

export type AsmDrillKind = 'loop' | 'mulcmp' | 'shift';

export function loopDrill(program: LoopProgram): Drill {
  const { iterations, finalR1 } = simLoop(program);
  return {
    title: 'Ciclo con contatore',
    recap: 'Il salto è in coda: il corpo viene eseguito almeno una volta.',
    topic: 'isa',
    listing: loopListing(program),
    steps: [
      {
        id: 'first',
        prompt: 'Dopo il <b>primo</b> passaggio dal corpo, quanto vale R1?',
        hint: `Si parte da ${program.start} e si sottrae ${program.step}.`,
        answer: String(program.start - program.step),
        kind: 'dec',
      },
      {
        id: 'iter',
        prompt: 'Quante volte viene eseguito il corpo del ciclo? (valore finale di R2)',
        hint: 'Si esce quando R1 non è più &gt; 0: conta anche il giro che porta R1 a zero o sotto.',
        answer: String(iterations),
        kind: 'dec',
      },
      {
        id: 'r1',
        prompt: 'Con quale valore di R1 si esce?',
        hint: 'Può essere negativo se lo step non divide il valore iniziale.',
        answer: String(finalR1),
        kind: 'dec',
      },
    ],
  };
}

export function mulCmpDrill(program: MulCmpProgram): Drill {
  const { r3, branchTaken } = simMulCmp(program);
  return {
    title: 'Prodotto, confronto e salto condizionato',
    recap: 'La ADD finale viene eseguita solo se il salto NON viene preso.',
    topic: 'isa',
    listing: mulCmpListing(program),
    steps: [
      {
        id: 'mul',
        prompt: 'Quanto vale R3 subito dopo la MUL?',
        hint: `La MUL scrive in R3 il prodotto dei due registri: ${program.a} × ${program.b}.`,
        answer: String(program.a * program.b),
        kind: 'dec',
      },
      {
        id: 'branch',
        prompt: `Il salto BEQ viene preso? (CMP con ${program.cmp})`,
        hint: 'BEQ salta quando il confronto dà uguaglianza, cioè quando la sottrazione dà zero.',
        answer: branchTaken ? 'sì' : 'no',
        kind: 'yesno',
      },
      {
        id: 'r3',
        prompt: 'Valore finale di R3.',
        hint: branchTaken
          ? 'Salto preso: la ADD è saltata.'
          : `Salto non preso: si esegue anche ADD R3, R3, #${program.add}.`,
        answer: String(r3),
        kind: 'dec',
      },
    ],
  };
}

export function shiftDrill(program: ShiftProgram): Drill {
  const { afterLeft, result } = simShift(program);
  return {
    title: 'Shift logici',
    recap: 'LSL moltiplica per 2ⁿ, LSR è una divisione intera per 2ⁿ: il resto si perde.',
    topic: 'isa',
    listing: shiftListing(program),
    steps: [
      {
        id: 'left',
        prompt: 'Quanto vale R1 dopo la LSL?',
        hint: `Uno shift a sinistra di ${program.left} moltiplica per 2^${program.left}: ${program.value} × ${2 ** program.left}.`,
        answer: String(afterLeft),
        kind: 'dec',
      },
      {
        id: 'bin',
        prompt: 'Scrivi quel valore in binario su 16 bit.',
        hint: 'Uno shift a sinistra aggiunge zeri in coda: i bit sono gli stessi, spostati.',
        answer: toBin(afterLeft % 2 ** 16, 16),
        kind: 'bin',
        width: 16,
      },
      {
        id: 'res',
        prompt: 'Valore finale dopo la LSR.',
        hint: `Divisione intera per 2^${program.right}: la parte frazionaria si butta.`,
        answer: String(result),
        kind: 'dec',
      },
    ],
  };
}
