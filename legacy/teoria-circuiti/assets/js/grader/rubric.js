// Correzione di base (offline) delle risposte aperte di teoria, con rubrica. Nessuna rete, nessun LLM.
// Normalizza il testo (minuscole, accenti, simboli unicode e LaTeX leggero), applica uno stemming italiano semplice,
// tollera un refuso nelle parole lunghe e confronta con i criteri della rubrica.

const UNI = [[/≤/g, ' <= '], [/≥/g, ' >= '], [/≠/g, ' != '], [/ω/gi, ' omega '], [/φ/gi, ' phi '], [/τ/gi, ' tau '], [/μ/g, ' mu '], [/Σ|∑/g, ' sum '], [/√/g, ' sqrt '],
  [/[−–—]/g, '-'], [/[·×⋅]/g, '*'], [/→|⇒|⟹/g, ' implica '], [/∞/g, ' infinito '], [/π/gi, ' pi '], [/Ω/g, ' ohm '], [/∥/g, ' parallelo '], [/ᵀ/g, '^T'], [/²/g, '^2'], [/₀/g, '0'], [/₁/g, '1'], [/₂/g, '2']];
const LATEX = [[/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)'], [/\\dfrac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)'], [/\\sqrt\s*\{([^{}]*)\}/g, ' sqrt($1) '], [/\\(omega|phi|tau|mu|alpha|beta|lambda|pi|sigma|theta)\b/gi, ' $1 '],
  [/\\(left|right|mathrm|mathbf|text|operatorname|displaystyle)\b/g, ''], [/\\cdot|\\times/g, '*'], [/\\(le|leq)\b/g, ' <= '], [/\\(ge|geq)\b/g, ' >= '], [/\\sum/g, ' sum '], [/\\infty/g, ' infinito '],
  [/\\(parallel)\b/g, ' parallelo '], [/\\Rightarrow|\\implies/g, ' implica '], [/\\([a-zA-Z]+)/g, ' $1 '], [/[$]/g, ' ']];

export function normalizeText(s) {
  let t = String(s ?? '');
  for (const [r, to] of LATEX) t = t.replace(r, to);
  for (const [r, to] of UNI) t = t.replace(r, to);
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const SUFFIX = ['azioni', 'azione', 'amente', 'mente', 'abili', 'abile', 'ibili', 'ibile', 'atori', 'atore', 'anti', 'ante', 'enti', 'ente', 'zioni', 'zione', 'ando', 'endo', 'ata', 'ato', 'ati', 'ate', 'ita', 'ito', 'iti', 'ite', 'osa', 'oso', 'ale', 'ali', 'ico', 'ica', 'ici', 'ice', 'are', 'ere', 'ire', 'ano', 'ono', 'iva', 'ivo', 'ive', 'ivi'];
export function stem(w) {
  if (/^\d/.test(w) || w.length <= 3) return w;
  for (const s of SUFFIX) if (w.length - s.length >= 4 && w.endsWith(s)) return w.slice(0, -s.length);
  if (w.length > 4 && /[aeiou]$/.test(w)) return w.slice(0, -1);
  return w;
}
const STOP = new Set(['di', 'a', 'da', 'in', 'un', 'una', 'uno', 'il', 'lo', 'la', 'le', 'i', 'gli', 'l', 'e', 'o', 'del', 'dello', 'della', 'dei', 'degli', 'delle', 'al', 'alla', 'ai', 'alle', 'con', 'per', 'che', 'si', 'ed', 'ha', 'sono', 'su', 'se', 'ma', 'come', 'anche', 'quindi', 'cioe', 'ad', 'nel', 'nella', 'dal', 'dalla', 'tra', 'fra']);
export function tokens(s) {
  return normalizeText(s).split(/[^a-z0-9]+/).filter((w) => w && !STOP.has(w)).map(stem);
}
function lev1(a, b) { // distanza di edit ≤ 1 (inserzione, cancellazione, sostituzione, scambio adiacente)
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    let d = 0, i = 0; const diff = [];
    for (; i < a.length; i++) if (a[i] !== b[i]) { d++; diff.push(i); if (d > 2) return false; }
    if (d === 1) return true;
    return d === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]];
  }
  const [s, l] = a.length < b.length ? [a, b] : [b, a];
  let i = 0; while (i < s.length && s[i] === l[i]) i++;
  return s.slice(i) === l.slice(i + 1);
}
const same = (a, b) => a === b || (a.length >= 6 && b.length >= 6 && lev1(a, b));

/** La frase `phrase` compare nella risposta: tutti i suoi termini entro una finestra (ordine libero). */
export function phraseMatches(phrase, toks) {
  const p = tokens(phrase);
  if (!p.length) return false;
  const width = p.length + 4;
  for (let start = 0; start < toks.length; start++) {
    const win = toks.slice(start, start + width);
    if (p.every((w) => win.some((x) => same(x, w)))) return true;
  }
  return false;
}

/** Forma canonica di una formula: minuscole, senza spazi né delimitatori, simboli uniformati. */
export function canonFormula(s) {
  return normalizeText(s).replace(/[\s${}_]/g, '').replace(/\*/g, '').replace(/\\/g, '').replace(/[()]/g, '');
}

/**
 * Correzione con rubrica.
 * rubrica = { max, criteri:[{id, desc, peso, any_of:[frasi], all_of?:[frasi], formule?:[canoniche]}], forbidden?:[{id, any_of, msg, penalita?}] }
 */
export function gradeWithRubric(answer, rubrica) {
  const text = String(answer ?? '');
  const toks = tokens(text);
  const canon = canonFormula(text);
  const out = { criteri: [], errori: [], mancanti: [], punteggio: 0, max: rubrica.max, confidenza: 0, parole: toks.length };
  let sum = 0;
  for (const c of rubrica.criteri) {
    const anyOk = !c.any_of || c.any_of.length === 0 || c.any_of.some((p) => phraseMatches(p, toks));
    const allOk = !c.all_of || c.all_of.every((p) => phraseMatches(p, toks));
    const fOk = !c.formule || c.formule.length === 0 || c.formule.some((f) => canon.includes(canonFormula(f)));
    // se ci sono sia frasi sia formule, basta che una delle due famiglie sia soddisfatta
    const hasPh = (c.any_of && c.any_of.length) || (c.all_of && c.all_of.length);
    const hasF = c.formule && c.formule.length;
    let ok;
    if (hasPh && hasF) ok = (anyOk && allOk) || fOk; else if (hasF) ok = fOk; else ok = anyOk && allOk;
    out.criteri.push({ id: c.id, desc: c.desc, peso: c.peso, ok });
    if (ok) sum += c.peso; else out.mancanti.push({ id: c.id, desc: c.desc });
  }
  let pen = 0;
  for (const f of rubrica.forbidden || []) {
    if ((f.any_of || []).some((p) => phraseMatches(p, toks)) || (f.formule || []).some((x) => canon.includes(canonFormula(x)))) {
      out.errori.push({ id: f.id, msg: f.msg }); pen += f.penalita ?? 1;
    }
  }
  out.punteggio = Math.max(0, Math.min(rubrica.max, sum - pen));
  // confidenza: risposte molto brevi o con parole ma nessun criterio sono poco affidabili da valutare con parole chiave
  const matched = out.criteri.filter((c) => c.ok).length;
  let conf = 0.9;
  if (toks.length < 12) conf = 0.5;
  if (toks.length >= 30 && matched === 0) conf = 0.35; // possibile parafrasi non riconosciuta
  const frac = out.punteggio / rubrica.max;
  if (frac > 0.3 && frac < 0.7) conf = Math.min(conf, 0.65);
  if (out.errori.length) conf = Math.min(conf, 0.7);
  out.confidenza = Math.round(conf * 100) / 100;
  return out;
}
