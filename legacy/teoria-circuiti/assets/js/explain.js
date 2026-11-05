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

const TXT_IDEAL = { B: 'il doppio bipolo è descritto dalla matrice indicata (correnti entranti nelle porte)', C: 'il trasformatore è ideale' };
function idealText(inst) {
  const parts = [];
  if (inst.circuit.elements.some((e) => e.type === 'N')) parts.push('il nullore è ideale');
  if (TXT_IDEAL[inst.template]) parts.push(TXT_IDEAL[inst.template]);
  if (inst.circuit.elements.some((e) => e.type === 'G')) parts.push('il generatore controllato è lineare (VCCS) con transconduttanza in S');
  return parts.length ? ', ' + parts.join('; ') : '';
}
export function statement(inst, sol) {
  const gens = inst.circuit.elements.filter((e) => e.type === 'V' || e.type === 'I');
  const desc = gens.map((e) => `${e.id}(t) = ${sourceLabel(e, inst.omega).replace(/ V$/, e.type === 'V' ? ' V' : ' A')}`).join(', ');
  const tipo = sol.hasAc && sol.hasDc ? 'una componente continua e una sinusoidale' : sol.hasAc ? 'una sinusoide' : 'una costante';
  return `Nel circuito normalizzato rappresentato in figura (valori in Ω, F, H, V)${idealText(inst)}. I generatori valgono, per $t<0$ (regime già raggiunto), ${tipo}: ${desc}; per $t>0$ i generatori indipendenti sono nulli. `
    + `Determinare l'andamento della tensione $v_{out}(t)$ per <strong>tutto l'asse dei tempi</strong>.`;
}

const NULLORE = {
  inv_rc: 'Il nullatore tra $x$ e massa impone $v_x=0$ e corrente nulla: la corrente $V_g/R_1$ attraversa $R_f$ ed è fornita dal noratore. Il nullore si comporta come un <em>generatore di tensione</em> $V_y=-\\dfrac{R_f}{R_1}V_g$ (invertente); il generatore pilota non vede altro che $R_1$ verso massa virtuale.',
  inv_fb: 'Il nullatore tra $x$ e massa impone $v_x=0$ e corrente nulla: tutta la corrente di ingresso $V_g/R_1$ passa nel parallelo $R_f\\parallel C$ ed è fornita dal noratore. L\'uscita è $v_y=-Z_f\\,I_{in}$.',
  inv_l: 'Il nullatore tra $x$ e massa impone $v_x=0$ e corrente nulla: la corrente d\'ingresso attraversa la serie $R_1+L$ e poi $R_f$, fornita dal noratore. L\'uscita è $v_y=-R_f\\,I_{in}$.',
  v2i: 'Il nullatore tra l\'ingresso e il nodo $y$ impone $v_y=V_g$ e corrente d\'ingresso nulla: la tensione $V_g$ è riportata su $R_s$ e la corrente $I=V_g/R_s$ è fornita dal noratore. Il nullore si comporta come un <em>generatore di corrente</em> verso il carico; il generatore pilota non eroga corrente.',
};

function firstStep(inst, sol) {
  const els = inst.circuit.elements, t = [];
  const m = (q) => q.toString();
  const hasN = els.some((e) => e.type === 'N');
  if (inst.template === 'A') t.push(NULLORE[inst.variant]);
  else if (hasN) t.push('Il nullatore tra $x$ e massa impone $v_x=0$ e corrente nulla: la corrente $V_g/R_n$ attraversa $R_f$ ed è fornita dal noratore. Il nullore si comporta come un <em>generatore di tensione</em> $V_y=-\\dfrac{R_f}{R_n}V_g$, che alimenta il resto del circuito.');
  if (inst.template === 'B') {
    const p = els.find((e) => e.type === 'P');
    t.push(`Il doppio bipolo è descritto dalla matrice $${p.kind}=\\begin{pmatrix}${m(p.m[0][0])}&${m(p.m[0][1])}\\\\ ${m(p.m[1][0])}&${m(p.m[1][1])}\\end{pmatrix}$ (correnti entranti nelle porte). Si riduce con ${p.kind === 'Z' ? 'Thevenin' : 'Norton'} la parte vista dai morsetti dell'elemento con memoria: $V_{th}$ con la porta a vuoto, $R_{th}$ con gli indipendenti spenti e un generatore di prova ($V/I$).`);
  } else if (inst.template === 'C') {
    const tr = els.find((e) => e.type === 'T');
    t.push(`Trasformatore ideale con $n=${tr.n.toLatex()}$: $v_1=n\\,v_2$, $i_1=-i_2/n$. Il carico alla porta 2 è visto dalla porta 1 come $n^2Z$ (impedenza riportata), e le grandezze si riportano con $v_2=v_1/n$, $i_2=-n\\,i_1$.`);
  }
  if (els.some((e) => e.type === 'G')) t.push('Il generatore controllato <strong>resta</strong> nel circuito quando si spengono gli indipendenti: non va mai spento.');
  t.push('Con la parte difficile sostituita dal suo equivalente restano resistori e un solo elemento con memoria.');
  return { titolo: 'Semplifica la parte difficile', testo: t };
}

export function steps(inst, sol) {
  const mem = byId(inst.circuit, inst.memory);
  const isC = mem.type === 'C';
  const xs = isC ? 'v_C' : 'i_L';
  const w = sol.pre.omega;
  const out = [];
  out.push(firstStep(inst, sol));
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

// ───────────── Modalità guidata: suggerimenti a gradini lungo gli 8 passi ─────────────
import { evalSolution } from './solver/exercise.js';

const HINT1 = {
  A: 'Sostituisci il nullore con i suoi vincoli: tensione e corrente nulle al nullatore, tensione e corrente libere al noratore. Chiediti se si comporta da generatore di tensione ($V=R\\,I_g$) o di corrente ($I=V_g/R$).',
  B: 'Riduci con Thevenin (o Norton) la parte di circuito vista dai morsetti dell\'elemento con memoria: scrivi le equazioni del doppio bipolo (matrice $Z$ o $Y$) con la porta a vuoto e poi con i generatori indipendenti spenti e un generatore di prova.',
  C: 'Usa le equazioni del trasformatore ideale $v_1=n\\,v_2$, $i_1=-i_2/n$ e riporta il resto del circuito da una porta all\'altra (impedenza riportata $n^2Z$).',
};
export function guidedSteps(inst, sol) {
  const full = steps(inst, sol);
  const x = sol.xKind === 'vC' ? 'v_C' : 'i_L';
  const N = (key, label, atteso) => ({ key, label, tipo: 'num', atteso });
  const pre = (t) => evalSolution(sol, t - 1e-12 > 0 ? -t : t), post = (t) => evalSolution(sol, t);
  void pre;
  const camp2 = [];
  if (sol.hasDc) camp2.push(N('dc', 'componente continua di $v_{out}$ per $t<0$', sol.pre.dc));
  if (sol.hasAc) { camp2.push(N('cos', 'coefficiente di $\\cos(\\omega_0 t)$', sol.pre.cos), N('sin', 'coefficiente di $\\sin(\\omega_0 t)$', sol.pre.sin)); }
  return [
    { n: 1, titolo: full[0].titolo, suggerimento: HINT1[inst.template] || HINT1.A, campi: [], soluzione: full[0].testo },
    { n: 2, titolo: full[1].titolo, suggerimento: 'Per $t<0$ il circuito è in regime. Continua: $C$ aperto e $L$ corto. Sinusoidale: fasori a $\\omega_0$ (impedenze $j\\omega L$, $1/(j\\omega C)$). Se ci sono entrambi, analizza separatamente e somma <em>nel tempo</em>.', campi: camp2, soluzione: full[1].testo },
    { n: 3, titolo: full[2].titolo, suggerimento: `Calcola $${x}$ in regime e valutala all'istante $t=0$: in regime sinusoidale serve la parte reale del fasore, non il modulo. Ricorda che $${x}$ è continua.`, campi: [N('x0', `$${x}(0^-)$`, sol.x0)], soluzione: full[2].testo },
    { n: 4, titolo: full[3].titolo, suggerimento: 'Spegni i generatori indipendenti (tensione → corto, corrente → aperto), lascia i controllati e il nullore. Collega un generatore di prova ai morsetti dell\'elemento con memoria e calcola $V/I$.', campi: [N('req', '$R_{eq}$ [Ω]', sol.req)], soluzione: full[3].testo },
    { n: 5, titolo: full[4].titolo, suggerimento: `$\\tau=R_{eq}C$ oppure $L/R_{eq}$. $K=v_{out}(0^+)$: sostituisci l'elemento con memoria con un generatore pari alla condizione iniziale, a generatori indipendenti spenti, e calcola $v_{out}$.`, campi: [N('tau', '$\\tau$ [s]', sol.tau), N('k', '$K=v_{out}(0^+)$', sol.k)], soluzione: full[4].testo },
    { n: 6, titolo: full[5].titolo, suggerimento: 'Con $V_{out}(s)=K/(s+1/\\tau)$ l\'antitrasformata è $K e^{-t/\\tau}u_{-1}(t)$.', campi: [{ key: 'post', label: '$v_{out}(t)$ per $t>0$', tipo: 'expr', region: 'pos', atteso: post }], soluzione: full[5].testo },
    { n: 7, titolo: full[6].titolo, suggerimento: 'Scrivi entrambe le espressioni: per $t<0$ la risposta di regime, per $t>0$ quella transitoria.', campi: [{ key: 'pre', label: '$v_{out}(t)$ per $t<0$', tipo: 'expr', region: 'neg', atteso: (t) => evalSolution(sol, t) }], soluzione: full[6].testo },
    { n: 8, titolo: full[7].titolo, suggerimento: 'Controlla: $\\tau>0$; $v_C$ (o $i_L$) continua in $t=0$; $v_{out}$ in generale no; segni e ordini di grandezza.', campi: [], soluzione: full[7].testo },
  ];
}
