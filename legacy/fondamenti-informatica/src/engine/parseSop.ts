import {
  compareCost,
  coverCost,
  coversMinterm,
  minimalCover,
  sopToString,
  varNames,
  type CoverCost,
  type Implicant,
} from './boolean';

/**
 * Lettura di una somma di prodotti scritta a mano.
 *
 * Serve alla palestra «Verità &amp; Karnaugh»: l'esercizio non ha senso se la
 * risposta va autovalutata, quindi l'espressione scritta dallo studente viene
 * letta, valutata su tutte le combinazioni e confrontata con la funzione
 * richiesta. Così si distinguono i tre esiti che contano: sbagliata, giusta ma
 * non minima, minima.
 *
 * La notazione accettata è volutamente larga, perché sul foglio ognuno scrive
 * come gli viene: `A'B + !C`, `Ā·B + ¬C`, `a b + not c` sono la stessa cosa.
 */

/** Separatori di prodotto: sul foglio si scrive in tutti questi modi. */
const IGNORED = /[\s·*&∧.()]/u;
/** Somma logica. */
const PLUS = /[+|∨∪]/u;
/**
 * Un letterale: negazioni prefisse, la variabile, negazioni postfisse.
 * Sticky, così il ciclo sa esattamente dove si è fermato e può indicare il
 * carattere che non ha capito.
 */
const LITERAL = /([!~¬/]*)([A-Za-z01])(['’̄̅¯]*)/y;

export type SopParse =
  | { ok: true; terms: Implicant[] }
  | { ok: false; error: string };

/**
 * Espressione → cubi. Un termine è un prodotto di letterali; `1` è il termine
 * senza vincoli, `0` un termine che non copre nulla e viene scartato.
 */
export function parseSop(input: string, vars: number): SopParse {
  const names = varNames(vars);
  // NFD scompone «Ā» in A + macron: così la barra sopra la lettera, scritta
  // come carattere precomposto o come segno combinante, è lo stesso letterale.
  const text = input
    .normalize('NFD')
    .replace(/\bnot\b/gi, '!')
    .replace(/\band\b/gi, '·')
    .replace(/\bor\b/gi, '+')
    // Via gli spazi: la giustapposizione è già un prodotto, quindi «A B» e
    // «AB» sono la stessa cosa, e «! A» resta una negazione applicata ad A.
    .replace(/\s+/g, '');

  const terms: Implicant[] = [];
  let mask = 0;
  let bits = 0;
  let literals = 0;
  let constantZero = false;

  const flush = (): string | null => {
    if (literals === 0 && !constantZero) return 'termine vuoto: c’è un «+» di troppo';
    if (!constantZero) terms.push({ mask, bits });
    mask = 0;
    bits = 0;
    literals = 0;
    constantZero = false;
    return null;
  };

  let i = 0;
  while (i < text.length) {
    const ch = text[i] as string;

    if (IGNORED.test(ch)) {
      i += 1;
      continue;
    }

    if (PLUS.test(ch)) {
      const error = flush();
      if (error) return { ok: false, error };
      i += 1;
      continue;
    }

    LITERAL.lastIndex = i;
    const token = LITERAL.exec(text);
    if (!token) {
      return {
        ok: false,
        error: `non capisco «${ch}»: dopo una negazione ci vuole una variabile (${names.join(', ')})`,
      };
    }
    i = LITERAL.lastIndex;

    const [, prefix = '', symbol = '', suffix = ''] = token;
    // Doppia negazione: conta la parità, non il numero di segni.
    const negated = (prefix.length + suffix.length) % 2 === 1;

    if (symbol === '1') {
      // Elemento neutro del prodotto: non aggiunge vincoli, ma il termine
      // esiste. «0» negato è 1 e viceversa.
      if (negated) constantZero = true;
      else literals = Math.max(literals, 1);
      continue;
    }
    if (symbol === '0') {
      if (negated) literals = Math.max(literals, 1);
      else constantZero = true;
      continue;
    }

    const upper = symbol.toUpperCase();
    const index = names.indexOf(upper);
    if (index < 0) {
      return { ok: false, error: `«${symbol}» non è una variabile: usa ${names.join(', ')}` };
    }

    const bit = 1 << (vars - 1 - index);
    const wantsOne = !negated;
    if (mask & bit) {
      // A·Ā vale 0: meglio dirlo che accettare un termine che non copre nulla.
      if (((bits & bit) !== 0) !== wantsOne) {
        return { ok: false, error: `il termine contiene ${upper} e il suo complemento: vale 0` };
      }
    } else {
      mask |= bit;
      literals += 1;
    }
    if (wantsOne) bits |= bit;
    else bits &= ~bit;
  }

  const error = flush();
  if (error) return { ok: false, error };

  return { ok: true, terms };
}

/** Celle coperte dall'espressione. */
export function sopMinterms(terms: readonly Implicant[], vars: number): Set<number> {
  const out = new Set<number>();
  for (let m = 0; m < 1 << vars; m++) {
    if (terms.some((term) => coversMinterm(term, m))) out.add(m);
  }
  return out;
}

export type SopStatus = 'empty' | 'error' | 'wrong' | 'correct' | 'minimal';

export interface SopVerdict {
  status: SopStatus;
  message: string;
  /** Costo dell'espressione scritta, quando è leggibile. */
  cost?: CoverCost;
  /** Costo della SOP minima esatta. */
  best?: CoverCost;
  /** Una SOP minima, mostrata solo su richiesta. */
  bestText?: string;
  /** Prima combinazione su cui l'espressione sbaglia, per il controesempio. */
  counterExample?: { minterm: number; expected: 0 | 1; got: 0 | 1 };
}

/**
 * Giudizio completo su un'espressione.
 *
 * Le indifferenze non entrano nel confronto: su quelle celle qualunque uscita
 * va bene, ed è proprio sfruttandole che si scende di costo.
 */
export function judgeSop(
  input: string,
  onSet: ReadonlySet<number>,
  dontCares: ReadonlySet<number>,
  vars: number,
): SopVerdict {
  if (input.trim() === '') return { status: 'empty', message: '' };

  const parsed = parseSop(input, vars);
  if (!parsed.ok) return { status: 'error', message: parsed.error };

  const covered = sopMinterms(parsed.terms, vars);
  for (let m = 0; m < 1 << vars; m++) {
    if (dontCares.has(m)) continue;
    const expected = onSet.has(m) ? 1 : 0;
    const got = covered.has(m) ? 1 : 0;
    if (expected !== got) {
      return {
        status: 'wrong',
        message:
          got === 1
            ? 'Copre una combinazione che deve valere 0.'
            : 'Lascia scoperta una combinazione che deve valere 1.',
        counterExample: { minterm: m, expected, got },
      };
    }
  }

  const best = minimalCover(onSet, dontCares, vars);
  const bestCost = coverCost(best, vars);
  const cost = coverCost(parsed.terms, vars);
  const bestText = sopToString(best, vars);

  if (compareCost(cost, bestCost) <= 0) {
    return { status: 'minimal', message: 'Corretta e minima.', cost, best: bestCost, bestText };
  }

  return {
    status: 'correct',
    message: `Corretta, ma non minima: ${cost.terms} termini e ${cost.literals} letterali contro ${bestCost.terms} e ${bestCost.literals}.`,
    cost,
    best: bestCost,
    bestText,
  };
}
