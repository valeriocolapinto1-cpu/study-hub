// Testo dell'esercizio e soluzione passo-passo in italiano (LaTeX per KaTeX), calcolata dal motore esatto.
import { sourceLabel } from './svg/render.js';
import { byId } from './solver/netlist.js';

const q = (x) => x.toLatex();
const withDec = (x) => (x.d === 1n ? q(x) : `${q(x)}\\ (\\approx ${x.toDecimal(3).replace(',', '{,}')})`);
const sgn = (x) => (x.sign() < 0 ? '-' : '+');
const coef = (x, f) => `${x.abs().eq(1) ? '' : q(x.abs())}${f}`;

/** Parte t<0 come espressione LaTeX nella forma  A + B cos(ωt) + C sin(ωt). */
export function preLatex(sol) {
  const w = sol.pre.omega;
  const wt = w ? (w.eq(1) ? 't' : `${q(w)}\\,t`) : 't';
  const terms = [];
  if (!sol.pre.dc.isZero()) terms.push(sol.pre.dc);
  const parts = [];
  if (!sol.pre.dc.isZero()) parts.push(q(sol.pre.dc));
  const push = (x, f) => { if (x.isZero()) return; parts.push(`${parts.length ? ` ${sgn(x)} ` : (x.sign() < 0 ? '-' : '')}${coef(x, f)}`); };
  push(sol.pre.cos, `\\cos(${wt})`); push(sol.pre.sin, `\\sin(${wt})`);
  void terms;
  return parts.length ? parts.join('') : '0';
}
export function postLatex(sol) {
  const k = sol.post.k, t = sol.post.tau;
  const kk = k.eq(1) ? '' : k.eq(-1) ? '-' : q(k);
  return `${kk}e^{-t/${q(t)}}`;
}
export function answerLatex(sol) {
  return `v_{out}(t)=\\begin{cases}${preLatex(sol)} & t<0\\\\ ${postLatex(sol)} & t>0\\end{cases}`;
}

export function statement(inst, sol) {
  const gens = inst.circuit.elements.filter((e) => e.type === 'V' || e.type === 'I');
  const desc = gens.map((e) => `${e.id}(t) = ${sourceLabel(e, inst.omega).replace(/ V$/, e.type === 'V' ? ' V' : ' A')}`).join(', ');
  const tipo = sol.hasAc && sol.hasDc ? 'una componente continua e una sinusoidale' : sol.hasAc ? 'una sinusoide' : 'una costante';
  return `Nel circuito normalizzato rappresentato in figura (valori in Ω, F, H, V) il nullore è ideale. I generatori valgono, per $t<0$ (regime già raggiunto), ${tipo}: ${desc}; per $t>0$ i generatori indipendenti sono nulli. `
    + `Determinare l'andamento della tensione $v_{out}(t)$ per <strong>tutto l'asse dei tempi</strong>.`;
}

const NULLORE = {
  inv_rc: 'Il nullatore tra $x$ e massa impone $v_x=0$ e corrente nulla: la corrente $V_g/R_1$ attraversa $R_f$ ed è fornita dal noratore. Il nullore si comporta come un <em>generatore di tensione</em> $V_y=-\\dfrac{R_f}{R_1}V_g$ (invertente); il generatore pilota non vede altro che $R_1$ verso massa virtuale.',
  inv_fb: 'Il nullatore tra $x$ e massa impone $v_x=0$ e corrente nulla: tutta la corrente di ingresso $V_g/R_1$ passa nel parallelo $R_f\\parallel C$ ed è fornita dal noratore. L\'uscita è $v_y=-Z_f\\,I_{in}$.',
  inv_l: 'Il nullatore tra $x$ e massa impone $v_x=0$ e corrente nulla: la corrente d\'ingresso attraversa la serie $R_1+L$ e poi $R_f$, fornita dal noratore. L\'uscita è $v_y=-R_f\\,I_{in}$.',
  v2i: 'Il nullatore tra l\'ingresso e il nodo $y$ impone $v_y=V_g$ e corrente d\'ingresso nulla: la tensione $V_g$ è riportata su $R_s$ e la corrente $I=V_g/R_s$ è fornita dal noratore. Il nullore si comporta come un <em>generatore di corrente</em> verso il carico; il generatore pilota non eroga corrente.',
};

export function steps(inst, sol) {
  const mem = byId(inst.circuit, inst.memory);
  const isC = mem.type === 'C';
  const xs = isC ? 'v_C' : 'i_L';
  const w = sol.pre.omega;
  const out = [];
  out.push({ titolo: 'Semplifica la parte difficile (nullore)', testo: [NULLORE[inst.variant] || 'Sostituisci il nullore con i vincoli $v=0$, $i=0$ del nullatore.', 'Con il nullore sostituito dal suo equivalente restano resistori e un solo elemento con memoria.'] });
  const t2 = [];
  if (sol.hasDc) t2.push(`Componente continua (${isC ? '$C$ = aperto' : '$L$ = corto'}): $v_{out}^{dc}=${withDec(sol.pre.dc)}$, $${xs}^{dc}=${withDec(sol.xDc)}$.`);
  if (sol.hasAc) t2.push(`Componente sinusoidale a $\\omega_0=${q(w)}\\,\\mathrm{rad/s}$ (fasori, $\\cos\\to$ fasore reale, $\\sin\\to -j$): $\\dot V_{out}=${sol.pre.phasor.toLatex()}$, quindi la sua parte nel tempo è $${sol.pre.cos.isZero() ? '' : q(sol.pre.cos) + '\\cos(' + (w.eq(1) ? '' : q(w)) + 't)'}${sol.pre.sin.isZero() ? '' : (sol.pre.sin.sign() < 0 ? '-' : '+') + coef(sol.pre.sin, '\\sin(' + (w.eq(1) ? '' : q(w)) + 't)')}$.`);
  if (sol.hasAc && sol.hasDc) t2.push('I due generatori sono diversi per frequenza: si analizzano <strong>separatamente</strong> e si sommano le risposte <em>nel tempo</em> (mai i fasori a frequenze diverse).');
  t2.push(`Per $t<0$: $v_{out}(t)=${preLatex(sol)}$.`);
  out.push({ titolo: 'Regime per t < 0', testo: t2 });
  out.push({ titolo: 'Condizione iniziale', testo: [`$${xs}(0^-)=${sol.hasAc ? `${withDec(sol.xDc)}${sol.xAc.re.isZero() ? '' : ` ${sgn(sol.xAc.re)} ${withDec(sol.xAc.re.abs())}`}` : ''}${sol.hasAc ? '=' : ''}${withDec(sol.x0)}$ ${sol.hasAc ? '(in regime sinusoidale serve il <strong>valore a $t=0$</strong>, cioè la parte reale del fasore, non il modulo)' : ''}.`, `La grandezza $${xs}$ è continua: $${xs}(0^+)=${xs}(0^-)=${q(sol.x0)}$.`] });
  out.push({ titolo: 'Circuito per t > 0 (modello di Laplace)', testo: [`I generatori indipendenti si spengono (tensione → corto, corrente → aperto); il nullore resta. ${isC ? 'Il condensatore diventa $\\dfrac{1}{sC}$ in serie con un generatore $\\dfrac{v_C(0^-)}{s}$' : 'L\'induttore diventa $sL$ in serie con un generatore $L\\,i_L(0^-)$'}.`,
    `Resistenza vista dai morsetti dell'elemento con memoria (generatore di prova, indipendenti spenti): $R_{eq}=${withDec(sol.req)}$.`] });
  out.push({ titolo: 'Calcolo di V_out(s)', testo: [`$\\tau=${isC ? `R_{eq}C=${q(sol.req)}\\cdot${q(mem.c)}` : `\\dfrac{L}{R_{eq}}=\\dfrac{${q(mem.l)}}{${q(sol.req)}}`}=${withDec(sol.tau)}$.`, `$V_{out}(s)=\\dfrac{K}{s+1/\\tau}=\\dfrac{${q(sol.k)}}{s+${q(sol.tau.inv())}}$, con $K=v_{out}(0^+)=${withDec(sol.k)}$.`] });
  out.push({ titolo: 'Antitrasformata', testo: [`$v_{out}(t)=${postLatex(sol)}\\,u_{-1}(t)$.`] });
  out.push({ titolo: 'Risposta su tutto l\'asse dei tempi', testo: [`$${answerLatex(sol)}$`] });
  const jump = !sol.pre.dc.add(sol.pre.cos).eq(sol.k);
  out.push({ titolo: 'Verifica', testo: [`$\\tau=${withDec(sol.tau)}>0$ ✓. $${xs}$ è continua in $t=0$ ✓.`, `$v_{out}(0^-)=${q(sol.pre.dc.add(sol.pre.cos))}$ e $v_{out}(0^+)=${q(sol.k)}$: ${jump ? 'la tensione d\'uscita <strong>non è continua</strong> (non lo è in generale: è continua solo $' + xs + '$)' : 'in questo caso coincidono'}.`, 'Controlla segni e ordini di grandezza; puoi confrontare con una simulazione (CircuitJS o LTspice).'] });
  return out;
}
