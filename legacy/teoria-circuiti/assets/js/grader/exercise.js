// Correzione delle risposte numeriche e simboliche degli esercizi: SEMPRE con il motore esatto, mai con un LLM.
import { compile, parseNumber, ParseError } from './expr.js';
import { evalSolution } from '../solver/exercise.js';

const SAMPLES_NEG = [-6.3, -3.7, -2.1, -1.1, -0.45, -0.1];
const SAMPLES_POS = [0.05, 0.4, 1.3, 2.6, 4.1, 7.7];

function sampleCompare(userFn, wantFn, samples, tol) {
  const want = samples.map(wantFn);
  const scale = Math.max(...want.map(Math.abs), 1e-9);
  let max = 0;
  for (let i = 0; i < samples.length; i++) {
    let got; try { got = userFn(samples[i]); } catch (e) { return { ok: false, err: Infinity, scale }; }
    if (!Number.isFinite(got)) return { ok: false, err: Infinity, scale };
    max = Math.max(max, Math.abs(got - want[i]) / scale);
  }
  return { ok: max <= tol, err: max, scale };
}

/** Confronta un'espressione utente in t con una funzione attesa, su punti campione di una regione ('neg' | 'pos'). */
export function compareExpr(userSrc, wantFn, region, { tol = 5e-3, env = {} } = {}) {
  let f;
  try { f = compile(userSrc); } catch (e) { if (e instanceof ParseError) return { ok: false, parseError: e.message }; throw e; }
  const samples = region === 'neg' ? SAMPLES_NEG : SAMPLES_POS;
  const r = sampleCompare((t) => f({ t, ...env }), wantFn, samples, tol);
  return { ...r, f };
}

export function gradeNumber(userSrc, want, { tol = 3e-3 } = {}) {
  let got;
  try { got = parseNumber(userSrc); } catch (e) { if (e instanceof ParseError) return { ok: false, parseError: e.message }; throw e; }
  const w = typeof want === 'number' ? want : want.toNumber();
  const ok = Math.abs(got - w) <= tol * Math.max(Math.abs(w), 1e-9) + 1e-12;
  return { ok, got, want: w };
}

/** Correzione completa dell'esercizio «v_out(t) su tutto l'asse dei tempi» (due regioni). */
export function gradeAnswer(sol, { pre, post }, opts = {}) {
  const out = { pre: null, post: null, score: 0, hints: [] };
  const w = sol.pre.omega ? sol.pre.omega.toNumber() : 0;
  const wantPre = (t) => evalSolution(sol, t), wantPost = (t) => evalSolution(sol, t);
  out.pre = compareExpr(pre ?? '', wantPre, 'neg', { ...opts, env: { w } });
  out.post = compareExpr(post ?? '', wantPost, 'pos', { ...opts, env: { w } });
  if (out.pre.ok) out.score += 0.5;
  if (out.post.ok) out.score += 0.5;
  // suggerimenti mirati
  if (!out.pre.ok && !out.pre.parseError) {
    const f = out.pre.f;
    const dcOnly = (t) => sol.pre.dc.toNumber(), acOnly = (t) => wantPre(t) - sol.pre.dc.toNumber();
    const f2 = (fn) => sampleCompare((t) => f({ t, w }), fn, SAMPLES_NEG, 5e-3).ok;
    if (sol.hasAc && sol.hasDc && f2(dcOnly)) out.hints.push('Per t<0 hai considerato solo la componente continua: manca quella sinusoidale (somma le risposte nel tempo).');
    else if (sol.hasAc && sol.hasDc && f2(acOnly)) out.hints.push('Per t<0 manca la componente continua.');
    else if (f2((t) => -wantPre(t))) out.hints.push('Per t<0 il segno è invertito: controlla le convenzioni.');
  }
  if (!out.post.ok && !out.post.parseError) {
    const f = out.post.f;
    try {
      const k0 = f({ t: 1e-9, w }), k1 = f({ t: 1, w }), kk = sol.post.k.toNumber(), tt = sol.post.tau.toNumber();
      const tauEst = k0 !== 0 && k1 / k0 > 0 ? -1 / Math.log(k1 / k0) : NaN;
      const kOk = Math.abs(k0 - kk) <= 5e-3 * Math.abs(kk), tOk = Math.abs(tauEst - tt) <= 2e-2 * tt;
      out.post.kEst = k0; out.post.tauEst = tauEst;
      if (kOk && !tOk) out.hints.push('Per t>0 il valore iniziale K è corretto ma la costante di tempo no: ricontrolla R_eq (generatori indipendenti spenti, controllati no).');
      else if (!kOk && tOk) out.hints.push('Per t>0 la costante di tempo è corretta ma K no: ricontrolla la condizione iniziale (valore a t=0) e il calcolo di v_out(0⁺).');
      else if (Math.abs(k0 - evalSolution(sol, -1e-9)) <= 5e-3 * Math.max(Math.abs(kk), 1e-9) && !kOk) out.hints.push('Hai imposto la continuità di v_out: in generale è continua solo la variabile di stato (v_C o i_L).');
    } catch (e) { /* nessun suggerimento */ }
  }
  return out;
}
