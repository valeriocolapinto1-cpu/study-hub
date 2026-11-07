/**
 * Generatori di reti logiche (dal sito originale: genGate, genTruthToExpr,
 * genKarnaugh). La soluzione modello non è mai la funzione di partenza: è
 * ricalcolata dal minimizzatore esatto, quindi è minima per costruzione.
 */
import { registerGenerator } from '../../../engine/generators/registry';
import { createRng, type Rng } from '../../../engine/random';
import {
  coversMinterm,
  literalCount,
  minimalCover,
  sopToString,
  termToString,
  varNames,
  type Implicant,
} from '../lib/boolean';
import { L, makeChoices } from '../lib/common';
import { kmapSvg, truthTableSvg, type Bit } from '../lib/figures';

/** Uscite nell'ordine AB = 00, 01, 10, 11. */
export const GATES = {
  AND: [0, 0, 0, 1],
  OR: [0, 1, 1, 1],
  NAND: [1, 1, 1, 0],
  NOR: [1, 0, 0, 0],
  XOR: [0, 1, 1, 0],
  XNOR: [1, 0, 0, 1],
} as const satisfies Record<string, readonly (0 | 1)[]>;
const GATE_NAMES = Object.keys(GATES) as (keyof typeof GATES)[];

export const portaLogica = registerGenerator({
  id: 'fondamenti-informatica/porta-logica',
  topic: 'algebra-di-boole',
  objectives: ['algebra-di-boole.1'],
  generate(seed, lang) {
    const r = createRng(seed);
    const name = r.pick(GATE_NAMES);
    const table = GATES[name];
    const others = r.shuffle(GATE_NAMES.filter((g) => g !== name));
    const ones = table.flatMap((y, i) => (y ? [i.toString(2).padStart(2, '0')] : []));
    return {
      statement: L(
        lang,
        'Quale porta logica realizza questa tabella di verità?',
        'Which logic gate implements this truth table?',
      ),
      figure: { svg: truthTableSvg(['A', 'B'], table, lang) },
      steps: [
        {
          title: L(lang, 'Leggi la colonna d’uscita', 'Read the output column'),
          body: L(
            lang,
            `L'uscita vale 1 per AB = ${ones.join(', ')}: è la colonna di **${name}** (AND 0001, OR 0111, NAND 1110, NOR 1000, XOR 0110, XNOR 1001).`,
            `The output is 1 for AB = ${ones.join(', ')}: it is the column of **${name}** (AND 0001, OR 0111, NAND 1110, NOR 1000, XOR 0110, XNOR 1001).`,
          ),
        },
      ],
      answer: [],
      choices: makeChoices(r, name, others),
    };
  },
});

/** Funzione casuale non costante su `vars` variabili. */
function randomOnSet(r: Rng, vars: number): Set<number> {
  const cells = 1 << vars;
  for (;;) {
    const on = new Set(Array.from({ length: cells }, (_, m) => m).filter(() => r.chance(0.5)));
    if (on.size > 0 && on.size < cells) return on;
  }
}

const rowsOf = (vars: number, on: ReadonlySet<number>, dc: ReadonlySet<number> = new Set()): Bit[] =>
  Array.from({ length: 1 << vars }, (_, m) => (on.has(m) ? 1 : dc.has(m) ? 'x' : 0));

/** Valuta una copertura su tutte le combinazioni. */
const covers = (cover: readonly Implicant[], m: number) => cover.some((imp) => coversMinterm(imp, m));
const literalsOf = (cover: readonly Implicant[], vars: number) =>
  cover.reduce((s, imp) => s + literalCount(imp, vars), 0);

/**
 * Distrattori della crocetta: la forma canonica (equivalente ma non minima),
 * un letterale negato al posto sbagliato, un termine dimenticato, la funzione
 * complementare. Una forma equivalente e altrettanto compatta della minima
 * sarebbe una risposta giusta segnata come sbagliata: si scarta.
 */
function distractorsFor(r: Rng, vars: number, on: ReadonlySet<number>, cover: Implicant[]): string[] {
  const full = (1 << vars) - 1;
  const candidates: Implicant[][] = [[...on].sort((a, b) => a - b).map((m) => ({ mask: full, bits: m }))];
  for (const imp of cover) {
    for (let i = 0; i < vars; i++) {
      const bit = 1 << i;
      if (imp.mask & bit)
        candidates.push(cover.map((c) => (c === imp ? { mask: imp.mask, bits: imp.bits ^ bit } : c)));
    }
  }
  if (cover.length > 1) candidates.push(cover.slice(1));
  const offSet = new Set(Array.from({ length: full + 1 }, (_, m) => m).filter((m) => !on.has(m)));
  candidates.push(minimalCover(offSet, new Set(), vars));
  const minLiterals = literalsOf(cover, vars);
  const ok = candidates.filter((c) => {
    const equivalent = Array.from({ length: full + 1 }, (_, m) => m).every((m) => covers(c, m) === on.has(m));
    return !equivalent || c.length > cover.length || literalsOf(c, vars) > minLiterals;
  });
  return r.shuffle(ok.map((c) => sopToString(c, vars)));
}

export const tabellaEspressione = registerGenerator({
  id: 'fondamenti-informatica/tabella-espressione',
  topic: 'algebra-di-boole',
  objectives: ['algebra-di-boole.4', 'algebra-di-boole.2'],
  generate(seed, lang) {
    const r = createRng(seed);
    const vars = r.int(0, 4) < 3 ? 2 : 3;
    const names = varNames(vars);
    const full = (1 << vars) - 1;
    let on = randomOnSet(r, vars);
    let cover = minimalCover(on, new Set(), vars);
    let distractors = distractorsFor(r, vars, on, cover);
    // Servono tre distrattori distinti dalla risposta: si ricampiona finché ci sono.
    for (let i = 0; i < 50; i++) {
      const correct = sopToString(cover, vars);
      if (new Set(distractors.filter((d) => d !== correct)).size >= 3) break;
      on = randomOnSet(r, vars);
      cover = minimalCover(on, new Set(), vars);
      distractors = distractorsFor(r, vars, on, cover);
    }
    const minterms = [...on].sort((a, b) => a - b);
    const correct = sopToString(cover, vars);
    const canonical = minterms.map((m) => termToString({ mask: full, bits: m }, vars)).join(' + ');
    const groups = cover
      .map((imp) => {
        const grouped = minterms.filter((m) => coversMinterm(imp, m));
        return `${grouped.map((m) => termToString({ mask: full, bits: m }, vars)).join(' + ')} = **${termToString(imp, vars)}**`;
      })
      .join('; ');
    return {
      statement: L(
        lang,
        `Quale espressione è la forma **minima** in somma di prodotti della funzione Y(${names.join(',')}) descritta dalla tabella?`,
        `Which expression is the **minimal** sum-of-products form of the function Y(${names.join(',')}) described by the table?`,
      ),
      figure: { svg: truthTableSvg(names, rowsOf(vars, on), lang) },
      steps: [
        {
          title: L(lang, 'Forma canonica', 'Canonical form'),
          body: L(
            lang,
            `Un termine per ogni riga a 1: Y = ${canonical}.`,
            `One term for every row at 1: Y = ${canonical}.`,
          ),
        },
        {
          title: L(lang, 'Raccoglimento', 'Factoring'),
          body: L(lang, `Si raccoglie ciò che cambia: ${groups}.`, `Factor out what changes: ${groups}.`),
        },
        {
          title: L(lang, 'Forma minima', 'Minimal form'),
          body: L(
            lang,
            `**Y = ${correct}**. La forma canonica è equivalente ma non minima; le altre non coincidono con la tabella su almeno una riga.`,
            `**Y = ${correct}**. The canonical form is equivalent but not minimal; the others differ from the table on at least one row.`,
          ),
        },
      ],
      answer: [],
      choices: makeChoices(r, correct, distractors),
    };
  },
});

/** Cubo casuale che fissa `fixed` delle `vars` variabili. */
function randomCube(r: Rng, vars: number, fixed: number): Implicant {
  let mask = 0;
  let bits = 0;
  for (const p of r.sample(
    Array.from({ length: vars }, (_, i) => i),
    fixed,
  )) {
    mask |= 1 << p;
    if (r.chance(0.5)) bits |= 1 << p;
  }
  return { mask, bits };
}

/** Funzione da 1–2 cubi casuali (strutturata, non rumore), con qualche indifferenza a 4 variabili. */
export function sampleKarnaugh(r: Rng): { vars: number; on: Set<number>; dc: Set<number> } {
  const vars = r.pick([3, 4] as const);
  const cells = 1 << vars;
  for (;;) {
    const cubes = Array.from({ length: r.int(1, 2) }, () => randomCube(r, vars, r.int(1, vars - 1)));
    const on = new Set<number>();
    for (let m = 0; m < cells; m++) if (cubes.some((c) => (m & c.mask) === (c.bits & c.mask))) on.add(m);
    if (on.size === 0 || on.size === cells) continue;
    const zeros = Array.from({ length: cells }, (_, m) => m).filter((m) => !on.has(m));
    const howMany = vars === 4 ? Math.min(r.int(1, 3), zeros.length - 1) : 0;
    return { vars, on, dc: new Set(r.shuffle(zeros).slice(0, Math.max(0, howMany))) };
  }
}

export const karnaugh = registerGenerator({
  id: 'fondamenti-informatica/karnaugh',
  topic: 'mappe-di-karnaugh',
  objectives: ['mappe-di-karnaugh.2', 'mappe-di-karnaugh.3'],
  generate(seed, lang) {
    const r = createRng(seed);
    const { vars, on, dc } = sampleKarnaugh(r);
    const names = varNames(vars);
    const cover = minimalCover(on, dc, vars);
    const literals = cover.reduce((s, imp) => s + literalCount(imp, vars), 0);
    const minterms = [...on].sort((a, b) => a - b);
    const cares = [...dc].sort((a, b) => a - b);
    const groups = cover
      .map((imp) => {
        const cells = Array.from({ length: 1 << vars }, (_, m) => m).filter((m) => coversMinterm(imp, m));
        return `- ${L(lang, 'gruppo', 'group')} {${cells.join(', ')}} → **${termToString(imp, vars)}**`;
      })
      .join('\n');
    return {
      statement:
        L(
          lang,
          `Minimizza con la mappa di Karnaugh Y(${names.join(',')}) = Σm(${minterms.join(', ')})`,
          `Minimise with the Karnaugh map Y(${names.join(',')}) = Σm(${minterms.join(', ')})`,
        ) +
        (cares.length ? ` + d(${cares.join(', ')})` : '') +
        L(
          lang,
          '. Quanti **termini** ha la SOP minima, e quanti **letterali** in tutto? Scrivi poi l’espressione e confrontala con lo svolgimento.',
          '. How many **terms** does the minimal SOP have, and how many **literals** in total? Then write the expression and compare it with the solution.',
        ) +
        (cares.length
          ? L(
              lang,
              ' Le celle x sono indifferenze: usale solo dove allargano un gruppo.',
              ' The x cells are don’t cares: use them only where they enlarge a group.',
            )
          : ''),
      figure: { svg: kmapSvg(names, rowsOf(vars, on, dc), lang) },
      steps: [
        {
          title: L(lang, 'Gruppi', 'Groups'),
          body:
            L(
              lang,
              'Rettangoli di 1, 2, 4 o 8 celle adiacenti (anche ai bordi), i più grandi possibile, finché ogni 1 è coperto:',
              'Rectangles of 1, 2, 4 or 8 adjacent cells (wrapping around the edges), as large as possible, until every 1 is covered:',
            ) +
            '\n\n' +
            groups,
        },
        {
          title: L(lang, 'SOP minima', 'Minimal SOP'),
          body: L(
            lang,
            `**Y = ${sopToString(cover, vars)}** — ${cover.length} termin${cover.length === 1 ? 'e' : 'i'}, ${literals} letterali. Forme diverse sono equivalenti se coprono gli stessi 1 con lo stesso numero di termini e letterali. Nel disegno, scomponi le porte a più ingressi in porte a 2 ingressi.`,
            `**Y = ${sopToString(cover, vars)}** — ${cover.length} term${cover.length === 1 ? '' : 's'}, ${literals} literals. Different forms are equivalent if they cover the same 1s with the same number of terms and literals. In the drawing, break gates with more inputs into 2-input gates.`,
          ),
        },
      ],
      answer: [
        { label: L(lang, 'Termini', 'Terms'), value: cover.length, tol: 1e-9 },
        { label: L(lang, 'Letterali', 'Literals'), value: literals, tol: 1e-9 },
      ],
    };
  },
});
