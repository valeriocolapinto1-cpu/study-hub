/**
 * Testo e soluzione in 8 passi dell'esercizio d'analisi, in italiano e in inglese, calcolati dal
 * risolutore esatto (LaTeX per KaTeX). È la procedura del sito originale.
 */
import type { Lang } from '../../../engine/generators/registry';
import type { Rational } from './rational';
import { byId, type Element } from './netlist';
import type { AnalysisSolution, Instance } from './exercise';

const q = (x: Rational) => x.toLatex();
export const withDec = (x: Rational, lang: Lang) =>
  x.d === 1n ? q(x) : `${q(x)}\\ (\\approx ${x.toDecimal(3, lang === 'it' ? '{,}' : '.')})`;
const sgn = (x: Rational) => (x.sign() < 0 ? '-' : '+');
const coef = (x: Rational, f: string) => `${x.abs().eq(1) ? '' : q(x.abs())}${f}`;

export function preLatex(sol: AnalysisSolution): string {
  const w = sol.pre.omega;
  const wt = w ? (w.eq(1) ? 't' : `${q(w)}\\,t`) : 't';
  const parts: string[] = [];
  if (!sol.pre.dc.isZero()) parts.push(q(sol.pre.dc));
  const push = (x: Rational, f: string) => {
    if (x.isZero()) return;
    parts.push(`${parts.length ? ` ${sgn(x)} ` : x.sign() < 0 ? '-' : ''}${coef(x, f)}`);
  };
  push(sol.pre.cos, `\\cos(${wt})`);
  push(sol.pre.sin, `\\sin(${wt})`);
  return parts.length ? parts.join('') : '0';
}
export function postLatex(sol: AnalysisSolution): string {
  const k = sol.k;
  const kk = k.eq(1) ? '' : k.eq(-1) ? '-' : q(k);
  return `${kk}e^{-t/${q(sol.tau)}}`;
}
export const answerLatex = (sol: AnalysisSolution) =>
  `v_{out}(t)=\\begin{cases}${preLatex(sol)} & t<0\\\\ ${postLatex(sol)} & t>0\\end{cases}`;

/** Espressione del generatore, es. «3 + 2\cos(2t)». */
export function sourceLatex(e: Element & { type: 'V' | 'I' }, omega: Rational | null): string {
  const parts: string[] = [];
  const { dc, ac } = e.wave;
  if (!dc.isZero()) parts.push(q(dc));
  if (!ac.isZero()) {
    const w = omega ? (omega.eq(1) ? 't' : `${q(omega)}t`) : 't';
    if (ac.im.isZero()) parts.push(`${ac.re.eq(1) ? '' : ac.re.eq(-1) ? '-' : q(ac.re)}\\cos(${w})`);
    else {
      const a = ac.im.neg();
      parts.push(`${a.eq(1) ? '' : a.eq(-1) ? '-' : q(a)}\\sin(${w})`);
    }
  }
  return (parts.join(' + ') || '0').replace('+ -', '- ');
}

const T = {
  it: {
    intro: 'Nel circuito normalizzato in figura (valori in Ω, F, H, V)',
    nullore: 'il nullore è ideale',
    B: 'il doppio bipolo è descritto dalla matrice indicata (correnti entranti nelle porte)',
    C: 'il trasformatore è ideale',
    G: 'il generatore controllato è un VCCS lineare con transconduttanza in S',
    tipoMix: 'una componente continua e una sinusoidale',
    tipoAc: 'una sinusoide',
    tipoDc: 'una costante',
    gens: (tipo: string, desc: string) =>
      `I generatori valgono, per $t<0$ (regime già raggiunto), ${tipo}: ${desc}; per $t>0$ i generatori indipendenti sono nulli.`,
    ask: "Determinare l'andamento della tensione $v_{out}(t)$ per **tutto l'asse dei tempi**.",
  },
  en: {
    intro: 'In the normalised circuit of the figure (values in Ω, F, H, V)',
    nullore: 'the nullor is ideal',
    B: 'the two-port is described by the given matrix (currents entering the ports)',
    C: 'the transformer is ideal',
    G: 'the controlled source is a linear VCCS with transconductance in S',
    tipoMix: 'a DC and a sinusoidal component',
    tipoAc: 'a sinusoid',
    tipoDc: 'a constant',
    gens: (tipo: string, desc: string) =>
      `For $t<0$ (steady state already reached) the sources are ${tipo}: ${desc}; for $t>0$ the independent sources are zero.`,
    ask: 'Find the voltage $v_{out}(t)$ over **the whole time axis**.',
  },
};

export function statement(inst: Instance, sol: AnalysisSolution, lang: Lang): string {
  const t = T[lang];
  const els = inst.circuit.elements;
  const ideal: string[] = [];
  if (els.some((e) => e.type === 'N')) ideal.push(t.nullore);
  if (inst.template === 'B') {
    const p = els.find((e) => e.type === 'P')!;
    if (p.type === 'P')
      ideal.push(
        `${t.B}: $${p.kind}=\\begin{pmatrix}${q(p.m[0]![0]!)}&${q(p.m[0]![1]!)}\\\\ ${q(p.m[1]![0]!)}&${q(p.m[1]![1]!)}\\end{pmatrix}$`,
      );
  }
  if (inst.template === 'C') {
    const tr = els.find((e) => e.type === 'T')!;
    if (tr.type === 'T') ideal.push(`${t.C} ($n=${q(tr.n)}$)`);
  }
  if (els.some((e) => e.type === 'G')) {
    const g = els.find((e) => e.type === 'G')!;
    if (g.type === 'G') ideal.push(`${t.G} ($g_m=${q(g.gm)}$)`);
  }
  const gens = els.filter((e): e is Element & { type: 'V' | 'I' } => e.type === 'V' || e.type === 'I');
  const desc = gens
    .map((e) => `$${e.id.replace(/(\d+)$/, '_{$1}')}(t)=${sourceLatex(e, inst.omega)}\\,\\mathrm{${e.type}}$`)
    .join(', ');
  const tipo = sol.hasAc && sol.hasDc ? t.tipoMix : sol.hasAc ? t.tipoAc : t.tipoDc;
  return `${t.intro}${ideal.length ? ', ' + ideal.join('; ') : ''}. ${t.gens(tipo, desc)} ${t.ask}`;
}

const NULL_IT: Record<string, string> = {
  inv_rc:
    'Il nullatore tra $x$ e massa impone $v_x=0$ e corrente nulla: la corrente $V_g/R_1$ attraversa $R_f$ ed è fornita dal noratore. Il nullore si comporta come un **generatore di tensione** $V_y=-\\dfrac{R_f}{R_1}V_g$ (invertente).',
  inv_fb:
    "Il nullatore tra $x$ e massa impone $v_x=0$ e corrente nulla: tutta la corrente d'ingresso $V_g/R_1$ passa nel parallelo $R_f\\parallel C$ ed è fornita dal noratore. L'uscita è $v_y=-Z_f\\,I_{in}$.",
  inv_l:
    "Il nullatore tra $x$ e massa impone $v_x=0$ e corrente nulla: la corrente d'ingresso attraversa la serie $R_1+L$ e poi $R_f$, fornita dal noratore. L'uscita è $v_y=-R_f\\,I_{in}$.",
  v2i: "Il nullatore tra l'ingresso e il nodo $y$ impone $v_y=V_g$ e corrente d'ingresso nulla: la tensione $V_g$ è riportata su $R_s$ e la corrente $I=V_g/R_s$ è fornita dal noratore. Il nullore si comporta come un **generatore di corrente** verso il carico; il generatore pilota non eroga corrente.",
};
const NULL_EN: Record<string, string> = {
  inv_rc:
    'The nullator between $x$ and ground imposes $v_x=0$ and zero current: the current $V_g/R_1$ flows through $R_f$ and is supplied by the norator. The nullor behaves as a **voltage source** $V_y=-\\dfrac{R_f}{R_1}V_g$ (inverting).',
  inv_fb:
    'The nullator between $x$ and ground imposes $v_x=0$ and zero current: the whole input current $V_g/R_1$ flows through the parallel $R_f\\parallel C$ and is supplied by the norator. The output is $v_y=-Z_f\\,I_{in}$.',
  inv_l:
    'The nullator between $x$ and ground imposes $v_x=0$ and zero current: the input current flows through the series $R_1+L$ and then through $R_f$, supplied by the norator. The output is $v_y=-R_f\\,I_{in}$.',
  v2i: 'The nullator between the input and node $y$ imposes $v_y=V_g$ and zero input current: the voltage $V_g$ is copied across $R_s$ and the current $I=V_g/R_s$ is supplied by the norator. The nullor behaves as a **current source** towards the load; the driving source delivers no current.',
};

export interface Step {
  title: string;
  body: string;
}

export function steps(inst: Instance, sol: AnalysisSolution, lang: Lang): Step[] {
  const it = lang === 'it';
  const mem = byId(inst.circuit, inst.memory)!;
  const isC = mem.type === 'C';
  const xs = isC ? 'v_C' : 'i_L';
  const w = sol.pre.omega;
  const D = (x: Rational) => withDec(x, lang);
  const els = inst.circuit.elements;
  const s1: string[] = [];
  if (inst.template === 'A') s1.push((it ? NULL_IT : NULL_EN)[inst.variant]!);
  else if (els.some((e) => e.type === 'N'))
    s1.push(
      it
        ? 'Il nullatore tra $x$ e massa impone $v_x=0$ e corrente nulla: la corrente $V_g/R_n$ attraversa $R_f$ ed è fornita dal noratore. Il nullore si comporta come un **generatore di tensione** $V_y=-\\dfrac{R_f}{R_n}V_g$, che alimenta il resto del circuito.'
        : 'The nullator between $x$ and ground imposes $v_x=0$ and zero current: the current $V_g/R_n$ flows through $R_f$ and is supplied by the norator. The nullor behaves as a **voltage source** $V_y=-\\dfrac{R_f}{R_n}V_g$ feeding the rest of the circuit.',
    );
  if (inst.template === 'B') {
    const p = els.find((e) => e.type === 'P');
    if (p?.type === 'P')
      s1.push(
        it
          ? `Il doppio bipolo è descritto dalla matrice $${p.kind}$ (correnti entranti nelle porte). Si riduce con ${p.kind === 'Z' ? 'Thevenin' : 'Norton'} la parte vista dai morsetti dell'elemento con memoria: $V_{th}$ con la porta a vuoto, $R_{th}$ con gli indipendenti spenti e un generatore di prova ($V/I$).`
          : `The two-port is described by the $${p.kind}$ matrix (currents entering the ports). The part seen from the terminals of the memory element is reduced with ${p.kind === 'Z' ? 'Thévenin' : 'Norton'}: $V_{th}$ with the port open, $R_{th}$ with the independent sources off and a test source ($V/I$).`,
      );
  } else if (inst.template === 'C') {
    const tr = els.find((e) => e.type === 'T');
    if (tr?.type === 'T')
      s1.push(
        it
          ? `Trasformatore ideale con $n=${q(tr.n)}$: $v_1=n\\,v_2$, $i_1=-i_2/n$. Il carico alla porta 2 è visto dalla porta 1 come $n^2Z$ (impedenza riportata); le grandezze si riportano con $v_2=v_1/n$, $i_2=-n\\,i_1$.`
          : `Ideal transformer with $n=${q(tr.n)}$: $v_1=n\\,v_2$, $i_1=-i_2/n$. The load at port 2 is seen from port 1 as $n^2Z$ (reflected impedance); quantities are transferred with $v_2=v_1/n$, $i_2=-n\\,i_1$.`,
      );
  }
  if (els.some((e) => e.type === 'G'))
    s1.push(
      it
        ? 'Il generatore controllato **resta** nel circuito quando si spengono gli indipendenti: non va mai spento.'
        : 'The controlled source **stays** in the circuit when the independent sources are switched off: it is never switched off.',
    );
  s1.push(
    it
      ? 'Sostituita la parte difficile con il suo equivalente, restano resistori e un solo elemento con memoria.'
      : 'Once the hard part is replaced by its equivalent, only resistors and a single memory element remain.',
  );
  const s2: string[] = [];
  if (sol.hasDc)
    s2.push(
      it
        ? `Componente continua (${isC ? '$C$ aperto' : '$L$ in corto'}): $v_{out}^{dc}=${D(sol.pre.dc)}$, $${xs}^{dc}=${D(sol.xDc)}$.`
        : `DC component (${isC ? '$C$ open' : '$L$ shorted'}): $v_{out}^{dc}=${D(sol.pre.dc)}$, $${xs}^{dc}=${D(sol.xDc)}$.`,
    );
  if (sol.hasAc) {
    const wl = w!.eq(1) ? '' : q(w!);
    const time = `${sol.pre.cos.isZero() ? '' : q(sol.pre.cos) + '\\cos(' + wl + 't)'}${sol.pre.sin.isZero() ? '' : (sol.pre.sin.sign() < 0 ? '-' : sol.pre.cos.isZero() ? '' : '+') + coef(sol.pre.sin, '\\sin(' + wl + 't)')}`;
    s2.push(
      it
        ? `Componente sinusoidale a $\\omega_0=${q(w!)}\\,\\mathrm{rad/s}$ (fasori: $\\cos\\to$ fasore reale, $\\sin\\to -j$): $\\dot V_{out}=${sol.pre.phasor.toLatex()}$, quindi nel tempo $${time}$.`
        : `Sinusoidal component at $\\omega_0=${q(w!)}\\,\\mathrm{rad/s}$ (phasors: $\\cos\\to$ real phasor, $\\sin\\to -j$): $\\dot V_{out}=${sol.pre.phasor.toLatex()}$, hence in time $${time}$.`,
    );
  }
  if (sol.hasAc && sol.hasDc)
    s2.push(
      it
        ? 'I due generatori hanno frequenze diverse: si analizzano **separatamente** e si sommano le risposte _nel tempo_ (mai i fasori a frequenze diverse).'
        : 'The two sources have different frequencies: they are analysed **separately** and the responses are added _in time_ (never phasors at different frequencies).',
    );
  s2.push(it ? `Per $t<0$: $v_{out}(t)=${preLatex(sol)}$.` : `For $t<0$: $v_{out}(t)=${preLatex(sol)}$.`);
  const x0expr = sol.hasAc
    ? `${D(sol.xDc)}${sol.xAc.re.isZero() ? '' : ` ${sgn(sol.xAc.re)} ${D(sol.xAc.re.abs())}`}=${D(sol.x0)}`
    : D(sol.x0);
  const s3 = [
    `$${xs}(0^-)=${x0expr}$${sol.hasAc ? (it ? ' (in regime sinusoidale serve il **valore a $t=0$**, cioè la parte reale del fasore, non il modulo).' : ' (in sinusoidal steady state you need the **value at $t=0$**, i.e. the real part of the phasor, not its magnitude).') : '.'}`,
    it
      ? `La grandezza $${xs}$ è continua: $${xs}(0^+)=${xs}(0^-)=${q(sol.x0)}$.`
      : `The quantity $${xs}$ is continuous: $${xs}(0^+)=${xs}(0^-)=${q(sol.x0)}$.`,
  ];
  const s4 = [
    it
      ? `I generatori indipendenti si spengono (tensione → corto, corrente → aperto); il nullore e i controllati restano. ${isC ? 'Il condensatore diventa $\\dfrac{1}{sC}$ in serie con un generatore $\\dfrac{v_C(0^-)}{s}$' : "L'induttore diventa $sL$ in serie con un generatore $L\\,i_L(0^-)$"}.`
      : `The independent sources are switched off (voltage → short, current → open); the nullor and the controlled sources stay. ${isC ? 'The capacitor becomes $\\dfrac{1}{sC}$ in series with a source $\\dfrac{v_C(0^-)}{s}$' : 'The inductor becomes $sL$ in series with a source $L\\,i_L(0^-)$'}.`,
    it
      ? `Resistenza vista dai morsetti dell'elemento con memoria (generatore di prova, indipendenti spenti): $R_{eq}=${D(sol.req)}$.`
      : `Resistance seen from the terminals of the memory element (test source, independent sources off): $R_{eq}=${D(sol.req)}$.`,
  ];
  const tauExpr =
    mem.type === 'C'
      ? `R_{eq}C=${q(sol.req)}\\cdot${q(mem.c)}`
      : mem.type === 'L'
        ? `\\dfrac{L}{R_{eq}}=\\dfrac{${q(mem.l)}}{${q(sol.req)}}`
        : '';
  const s5 = [
    `$\\tau=${tauExpr}=${D(sol.tau)}$.`,
    `$V_{out}(s)=\\dfrac{K}{s+1/\\tau}=\\dfrac{${q(sol.k)}}{s+${q(sol.tau.inv())}}$, ${it ? 'con' : 'with'} $K=v_{out}(0^+)=${D(sol.k)}$.`,
  ];
  const s6 = [`$v_{out}(t)=${postLatex(sol)}\\,u_{-1}(t)$.`];
  const s7 = [`$${answerLatex(sol)}$`];
  const jump = !sol.pre.dc.add(sol.pre.cos).eq(sol.k);
  const s8 = [
    it
      ? `$\\tau=${D(sol.tau)}>0$ ✓. $${xs}$ è continua in $t=0$ ✓.`
      : `$\\tau=${D(sol.tau)}>0$ ✓. $${xs}$ is continuous at $t=0$ ✓.`,
    it
      ? `$v_{out}(0^-)=${q(sol.pre.dc.add(sol.pre.cos))}$ e $v_{out}(0^+)=${q(sol.k)}$: ${jump ? `la tensione d'uscita **non è continua** (in generale lo è solo $${xs}$).` : 'in questo caso coincidono.'}`
      : `$v_{out}(0^-)=${q(sol.pre.dc.add(sol.pre.cos))}$ and $v_{out}(0^+)=${q(sol.k)}$: ${jump ? `the output voltage **is not continuous** (in general only $${xs}$ is).` : 'in this case they coincide.'}`,
  ];
  const titles = it
    ? [
        'Semplifica la parte difficile',
        'Regime per $t<0$',
        'Condizione iniziale',
        'Circuito per $t>0$ (modello di Laplace)',
        'Calcolo di $V_{out}(s)$',
        'Antitrasformata',
        "Risposta su tutto l'asse dei tempi",
        'Verifica',
      ]
    : [
        'Simplify the hard part',
        'Steady state for $t<0$',
        'Initial condition',
        'Circuit for $t>0$ (Laplace model)',
        'Computing $V_{out}(s)$',
        'Inverse transform',
        'Response over the whole time axis',
        'Check',
      ];
  return [s1, s2, s3, s4, s5, s6, s7, s8].map((b, i) => ({ title: titles[i]!, body: b.join('\n\n') }));
}
