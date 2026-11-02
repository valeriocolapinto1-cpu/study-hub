// Parser sicuro di espressioni (nessun eval): frazioni, decimali, cos/sin/exp, e^(...), u(t), implicita moltiplicazione,
// ampiezza-fase con gradi (30°), costanti pi ed e. Restituisce una funzione (env) => numero.
export class ParseError extends Error { constructor(m) { super(m); this.name = 'ParseError'; } }

const FUNCS = {
  cos: Math.cos, sin: Math.sin, tan: Math.tan, exp: Math.exp, sqrt: Math.sqrt, ln: Math.log, log: Math.log, abs: Math.abs,
  atan: Math.atan, u: (x) => (x > 0 ? 1 : 0), step: (x) => (x > 0 ? 1 : 0), heaviside: (x) => (x > 0 ? 1 : 0),
};
const CONSTS = { pi: Math.PI, e: Math.E };
const VARS = new Set(['t', 'w', 's', 'tau', 'k', 'x']);

export function normalize(src) {
  return String(src).trim()
    .replace(/[−–—]/g, '-').replace(/[·×⋅]/g, '*').replace(/÷/g, '/').replace(/²/g, '^2').replace(/³/g, '^3')
    .replace(/√/g, 'sqrt').replace(/π/g, 'pi').replace(/ω/g, 'w').replace(/τ/g, 'tau')
    .replace(/u\s*_\s*\{\s*-\s*1\s*\}|u₋₁|u_-1|u_\{-1\}/g, 'u')
    .replace(/(\d+(?:[.,]\d+)?)\s*°/g, '($1*pi/180)').replace(/(\d+(?:[.,]\d+)?)\s*deg\b/g, '($1*pi/180)')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/\\cdot/g, '*').replace(/\\left|\\right/g, '').replace(/\{/g, '(').replace(/\}/g, ')');
}

function tokenize(s) {
  const out = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const txt = s.slice(i, j); if ((txt.match(/\./g) || []).length > 1 || txt === '.') throw new ParseError('numero non valido: ' + txt);
      out.push({ k: 'n', v: parseFloat(txt) }); i = j; continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let j = i; while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
      out.push({ k: 'id', v: s.slice(i, j) }); i = j; continue;
    }
    if ('+-*/^()'.includes(c)) { out.push({ k: c }); i++; continue; }
    throw new ParseError(`carattere non ammesso: «${c}»`);
  }
  return out;
}

/** Spezza identificatori attaccati come «cost», «wt», «2pit» in funzioni/costanti/variabili note. */
function splitIdent(id) {
  if (FUNCS[id] || CONSTS[id] !== undefined || VARS.has(id)) return [id];
  const names = [...Object.keys(FUNCS), ...Object.keys(CONSTS), ...VARS].sort((a, b) => b.length - a.length);
  const res = []; let rest = id;
  while (rest) {
    const m = names.find((n) => rest.startsWith(n));
    if (!m) throw new ParseError(`simbolo sconosciuto: «${id}»`);
    res.push(m); rest = rest.slice(m.length);
  }
  return res;
}

export function compile(src) {
  const text = normalize(src);
  if (!text) throw new ParseError('espressione vuota');
  if (text.length > 200) throw new ParseError('espressione troppo lunga');
  const raw = tokenize(text); const toks = [];
  for (const t of raw) {
    if (t.k !== 'id') { toks.push(t); continue; }
    const parts = splitIdent(t.v.toLowerCase());
    parts.forEach((p, idx) => { if (idx > 0 && FUNCS[parts[idx]] === undefined) { /* moltiplicazione implicita tra parti */ } toks.push({ k: 'id', v: p }); });
  }
  let pos = 0, depth = 0;
  const peek = () => toks[pos];
  const eat = (k) => { if (!peek() || peek().k !== k) throw new ParseError(`atteso «${k}»`); return toks[pos++]; };
  const startsAtom = (t) => t && (t.k === 'n' || t.k === 'id' || t.k === '(');

  function expr() {
    let l = term();
    while (peek() && (peek().k === '+' || peek().k === '-')) {
      const op = toks[pos++].k; const r = term(); const a = l;
      l = op === '+' ? (env) => a(env) + r(env) : (env) => a(env) - r(env);
    }
    return l;
  }
  function term() {
    let l = unary();
    for (;;) {
      const t = peek();
      if (t && (t.k === '*' || t.k === '/')) {
        pos++; const r = unary(); const a = l;
        l = t.k === '*' ? (env) => a(env) * r(env) : (env) => a(env) / r(env);
      } else if (startsAtom(t)) { // moltiplicazione implicita
        const r = unary(); const a = l; l = (env) => a(env) * r(env);
      } else break;
    }
    return l;
  }
  function unary() {
    const t = peek();
    if (t && t.k === '-') { pos++; const f = unary(); return (env) => -f(env); }
    if (t && t.k === '+') { pos++; return unary(); }
    return power();
  }
  function power() {
    const b = atom();
    if (peek() && peek().k === '^') {
      pos++; const e = unary();
      return (env) => Math.pow(b(env), e(env));
    }
    return b;
  }
  function atom() {
    if (++depth > 40) throw new ParseError('espressione troppo annidata');
    const t = peek();
    if (!t) throw new ParseError('espressione incompleta');
    let f;
    if (t.k === 'n') { pos++; const v = t.v; f = () => v; }
    else if (t.k === '(') { pos++; const inner = expr(); eat(')'); f = inner; }
    else if (t.k === 'id') {
      pos++;
      if (FUNCS[t.v]) {
        const fn = FUNCS[t.v];
        let arg;
        if (peek() && peek().k === '(') { pos++; arg = expr(); eat(')'); } else arg = power(); // «cos t»
        f = (env) => fn(arg(env));
      } else if (CONSTS[t.v] !== undefined) { const v = CONSTS[t.v]; f = () => v; }
      else if (VARS.has(t.v)) { const n = t.v; f = (env) => { const x = env[n]; if (x === undefined) throw new ParseError(`variabile «${n}» non definita`); return x; }; }
      else throw new ParseError(`simbolo sconosciuto: «${t.v}»`);
    } else throw new ParseError(`token inatteso «${t.k}»`);
    depth--;
    return f;
  }
  const f = expr();
  if (pos < toks.length) throw new ParseError('testo in eccesso dopo l\'espressione');
  return f;
}

export function evaluate(src, env = {}) {
  const v = compile(src)(env);
  if (!Number.isFinite(v)) throw new ParseError('valore non finito');
  return v;
}

const UNIT = /\s*(rad\/s|ohm|hz|var|va|[vaΩfhswj])\s*$/i;
/** Numero da testo: «3/4», «-0,25», «2e-3»? (no), «12 V». */
export function parseNumber(src) {
  let s = normalize(src);
  s = s.replace(UNIT, '');
  return evaluate(s, {});
}
