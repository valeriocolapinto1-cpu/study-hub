// Problemi brevi: (1) domande applicate alle prove d'esame, (2) allenamento per passo dell'esercizio d'analisi.
// Formato comune: { kind, titolo, blocco, studio, testo, campi:[{key,label,tipo,atteso,...}], soluzione:[html], inst? }
// Tutti i valori attesi sono calcolati con aritmetica esatta (o dal motore del circuito), mai da un LLM.
import { Rational } from './rational.js';
import { Cx } from './complex.js';
import { makeRng } from './rng.js';
import { compareExpr, gradeNumber } from './grader/exercise.js';
import { thevenin } from './solver/network.js';
import { solve } from './solver/mna.js';
import { wave } from './solver/netlist.js';
import { generate } from './generator.js';

const R = (x, y) => (y === undefined ? Rational.from(x) : Rational.from(x).div(Rational.from(y)));
const L = (x) => R(x).toLatex();
const dec = (x) => (R(x).d === 1n ? L(x) : `${L(x)}\\ (\\approx ${R(x).toDecimal(3).replace(',', '{,}')})`);
const num = (key, label, atteso, extra = {}) => ({ key, label, tipo: 'num', atteso, ...extra });

// ───────────────────────── Domande applicate ─────────────────────────
const APPLIED = {};

APPLIED.thevenin = {
  titolo: 'Equivalente di Thevenin/Norton', blocco: 'VI', studio: ['VI-02', 'VI-03'],
  build(rng) {
    const vs = rng.int(2, 12), r1 = rng.int(1, 5), r2 = rng.int(1, 5), r3 = rng.int(1, 5);
    const c = { elements: [
      { id: 'V1', type: 'V', a: 'in', b: '0', wave: wave(vs) },
      { id: 'R1', type: 'R', a: 'in', b: 'p', r: R(r1) }, { id: 'R2', type: 'R', a: 'p', b: '0', r: R(r2) }, { id: 'R3', type: 'R', a: 'p', b: 'b', r: R(r3) }] };
    const t = thevenin(c, 'b', '0');
    const layout = { term: { 'V1.a': [40, 80], 'V1.b': [40, 200], 'R1.a': [40, 80], 'R1.b': [130, 80], 'R2.a': [130, 80], 'R2.b': [130, 200], 'R3.a': [130, 80], 'R3.b': [230, 80] },
      paths: { in: [[40, 80]], p: [[130, 80]], b: [[230, 80]] }, width: 280, height: 240, out: [230, 80] };
    return { inst: { circuit: c, layout }, outLabel: 'V_{AB}',
      testo: `Nel circuito in figura (valori in V e Ω) determinare l'equivalente di Thevenin e di Norton visto dai morsetti $A$–$B$ (il morsetto $A$ è il nodo a destra, $B$ è il riferimento).`,
      campi: [num('vth', '$V_{th}$ [V]', t.vth.re), num('rth', '$R_{th}$ [Ω]', t.zth.re), num('in', '$I_N$ [A]', t.isc.re)],
      soluzione: [`$V_{th}$: porta a vuoto, nessuna corrente in $R_3$; partitore: $V_{th}=V_1\\dfrac{R_2}{R_1+R_2}=${dec(t.vth.re)}\\,\\mathrm V$.`,
        `$R_{th}$: generatore spento (corto); $R_{th}=R_3+R_1\\parallel R_2=${dec(t.zth.re)}\\,\\Omega$.`, `Norton: $I_N=V_{th}/R_{th}=${dec(t.isc.re)}\\,\\mathrm A$.`] };
  },
};

APPLIED.max_trasferimento = {
  titolo: 'Massimo trasferimento di potenza attiva', blocco: 'VI', studio: ['VI-09'],
  build(rng) {
    const vp = rng.int(2, 12), r = rng.int(1, 5), x = rng.int(-4, 4);
    const pmax = R(vp * vp, 8 * r);
    return { testo: `Un bipolo in regime sinusoidale ha equivalente di Thevenin con $\\dot V_{th}=${vp}\\,\\mathrm V$ (ampiezza di <em>picco</em>) e $Z_{th}=${r}${x >= 0 ? '+' : '-'}j${Math.abs(x)}\\,\\Omega$. Determinare l'impedenza di carico $Z_L$ che massimizza la potenza attiva assorbita e il valore massimo $P_{max}$.`,
      campi: [num('re', 'Re$\\{Z_L\\}$ [Ω]', R(r)), num('im', 'Im$\\{Z_L\\}$ [Ω]', R(-x)), num('p', '$P_{max}$ [W]', pmax)],
      soluzione: [`Il massimo si ha per $Z_L=Z_{th}^{*}=${r}${-x >= 0 ? '+' : '-'}j${Math.abs(x)}\\,\\Omega$ (la reattanza si annulla, $R_L=R_{th}$).`, `Con valori di picco: $P_{max}=\\dfrac{|V_{th}|^2}{8R_{th}}=\\dfrac{${vp * vp}}{${8 * r}}=${dec(pmax)}\\,\\mathrm W$ (con valori efficaci sarebbe $|V_{th}|^2/(4R_{th})$).`] };
  },
};

APPLIED.filtro = {
  titolo: 'Risposta in frequenza e frequenza di taglio', blocco: 'V', studio: ['V-07'],
  build(rng) {
    const kind = rng.pick(['rc_lp', 'rc_hp', 'rl_lp', 'rl_hp']);
    const r = rng.int(1, 6), x = rng.int(1, 6); // x = C o L
    const wc = kind.startsWith('rc') ? R(1, r * x) : R(r, x);
    const desc = { rc_lp: `un $R=${r}\\,\\Omega$ in serie, con $C=${x}\\,\\mathrm F$ in parallelo all'uscita`, rc_hp: `un condensatore $C=${x}\\,\\mathrm F$ in serie, con $R=${r}\\,\\Omega$ in parallelo all'uscita`,
      rl_lp: `un induttore $L=${x}\\,\\mathrm H$ in serie, con $R=${r}\\,\\Omega$ in parallelo all'uscita`, rl_hp: `un $R=${r}\\,\\Omega$ in serie, con $L=${x}\\,\\mathrm H$ in parallelo all'uscita` }[kind];
    const tipo = kind.endsWith('lp') ? 0 : 1;
    return { testo: `Un filtro del primo ordine è formato da ${desc}; l'uscita è la tensione sull'elemento in parallelo. Determinare la pulsazione di taglio a 3 dB e il tipo di filtro.`,
      campi: [num('wc', '$\\omega_c$ [rad/s]', wc), { key: 'tipo', label: 'Tipo di filtro', tipo: 'scelta', opzioni: ['passa-basso', 'passa-alto'], atteso: tipo }],
      soluzione: [`$H(s)$ è del primo ordine con polo in $s=-\\omega_c$.`, `${kind.startsWith('rc') ? '$\\omega_c=\\dfrac{1}{RC}$' : '$\\omega_c=\\dfrac{R}{L}$'}$=${dec(wc)}\\,\\mathrm{rad/s}$ (a $\\omega_c$ il modulo scende di $3\\,\\mathrm{dB}$, cioè $|H|=|H|_{max}/\\sqrt2$).`, `Tipo: ${tipo === 0 ? 'passa-basso' : 'passa-alto'}.`] };
  },
};

APPLIED.risonanza = {
  titolo: 'Circuito risonante: ω₀, Q, banda', blocco: 'V', studio: ['V-08'],
  build(rng) {
    const serie = rng.chance(0.5), l = rng.int(1, 4), w0 = rng.int(1, 5), r = rng.int(1, 6);
    const c = R(1, l * w0 * w0);
    const q = serie ? R(w0 * l, r) : R(r, w0 * l);
    const band = R(w0).div(q);
    return { testo: `Un circuito RLC ${serie ? 'serie' : 'parallelo'} ha $R=${r}\\,\\Omega$, $L=${l}\\,\\mathrm H$, $C=${L(c)}\\,\\mathrm F$. Determinare la pulsazione di risonanza, il fattore di merito $Q$ e la banda a 3 dB.`,
      campi: [num('w0', '$\\omega_0$ [rad/s]', R(w0)), num('q', '$Q$', q), num('b', '$B$ [rad/s]', band)],
      soluzione: [`$\\omega_0=\\dfrac{1}{\\sqrt{LC}}=\\dfrac{1}{\\sqrt{${l}\\cdot${L(c)}}}=${w0}\\,\\mathrm{rad/s}$.`, serie ? `$Q=\\dfrac{\\omega_0L}{R}=${dec(q)}$.` : `$Q=\\dfrac{R}{\\omega_0L}=${dec(q)}$.`, `$B=\\dfrac{\\omega_0}{Q}=${dec(band)}\\,\\mathrm{rad/s}$.`] };
  },
};

APPLIED.stabilita = {
  titolo: 'Stabilità al variare di un parametro', blocco: 'V', studio: ['V-04'],
  build(rng) {
    if (rng.chance(0.5)) {
      const a = rng.int(1, 6), b = rng.int(1, 5);
      return { testo: `Un sistema ha funzione di rete con denominatore $D(s)=s^2+(k-${a})\\,s+${b}$. Determinare l'estremo inferiore $k_{min}$ tale che il sistema sia asintoticamente stabile per $k>k_{min}$.`,
        campi: [num('k', '$k_{min}$', R(a))],
        soluzione: ['Per un polinomio di 2º grado tutte le radici hanno parte reale negativa se e solo se tutti i coefficienti sono dello stesso segno.', `Serve $k-${a}>0$ (il termine noto $${b}>0$): $k>${a}$.`] };
    }
    const a = rng.int(2, 6), b = rng.int(2, 6);
    return { testo: `Il denominatore è $D(s)=s^3+${a}s^2+${b}s+k$. Determinare il valore $k_{max}$ oltre il quale il sistema non è più asintoticamente stabile (con $k>0$).`,
      campi: [num('k', '$k_{max}$', R(a * b))],
      soluzione: ['Criterio di Routh (o di Hurwitz) per un polinomio di 3º grado $s^3+a_2s^2+a_1s+a_0$: stabile se $a_2,a_1,a_0>0$ e $a_2a_1>a_0$.', `Qui $a_2a_1=${a}\\cdot${b}=${a * b}$, quindi $0<k<${a * b}$.`] };
  },
};

APPLIED.impulsiva = {
  titolo: 'Risposta impulsiva', blocco: 'V', studio: ['V-02'],
  build(rng) {
    const rc = rng.chance(0.5), r = rng.int(1, 6), x = rng.int(1, 4);
    const a = rc ? R(1, r * x) : R(r, x); // polo in -a
    const k = a; // h(t) = a e^{-a t}
    return { testo: rc ? `Un circuito RC serie ($R=${r}\\,\\Omega$, $C=${x}\\,\\mathrm F$) ha come uscita la tensione sul condensatore. Determinare la risposta impulsiva $h(t)$ per $t>0$ (scrivi ad esempio <code>2*e^(-t/3)</code>).`
      : `Un circuito RL serie ($R=${r}\\,\\Omega$, $L=${x}\\,\\mathrm H$) ha come uscita la tensione sul resistore. Determinare la risposta impulsiva $h(t)$ per $t>0$ (scrivi ad esempio <code>2*e^(-t/3)</code>).`,
      campi: [{ key: 'h', label: '$h(t)$, $t>0$', tipo: 'expr', region: 'pos', atteso: (t) => k.toNumber() * Math.exp(-a.toNumber() * t), risposta: `(${k})*e^(-(${a})*t)` }],
      soluzione: [rc ? `$H(s)=\\dfrac{1/(RC)}{s+1/(RC)}=\\dfrac{${L(a)}}{s+${L(a)}}$.` : `$H(s)=\\dfrac{R/L}{s+R/L}=\\dfrac{${L(a)}}{s+${L(a)}}$.`, `$h(t)=\\mathcal L^{-1}\\{H(s)\\}=${L(k)}\\,e^{-${L(a)}t}\\,u_{-1}(t)$.`] };
  },
};

APPLIED.doppi_bipoli = {
  titolo: 'Matrici Z e Y di un doppio bipolo', blocco: 'VI', studio: ['VI-05'],
  build(rng) {
    if (rng.chance(0.5)) {
      const a = rng.int(1, 5), b = rng.int(1, 5), c = rng.int(1, 5);
      return { testo: `Un doppio bipolo a «T» ha due resistori in serie ($R_a=${a}\\,\\Omega$ sulla porta 1, $R_b=${b}\\,\\Omega$ sulla porta 2) e un resistore in derivazione $R_c=${c}\\,\\Omega$ verso il morsetto comune. Determinare la matrice delle impedenze $Z$ (correnti entranti nelle porte).`,
        campi: [num('z11', '$z_{11}$', R(a + c)), num('z12', '$z_{12}$', R(c)), num('z21', '$z_{21}$', R(c)), num('z22', '$z_{22}$', R(b + c))],
        soluzione: ['Si applica una corrente a una porta con l\'altra aperta.', `$z_{11}=R_a+R_c=${a + c}$, $z_{22}=R_b+R_c=${b + c}$.`, `Con la porta 2 aperta, $v_2=R_c\\,i_1$: $z_{21}=z_{12}=R_c=${c}$ (rete reciproca).`] };
    }
    const a = rng.int(1, 5), b = rng.int(1, 5), c = rng.int(1, 5);
    return { testo: `Un doppio bipolo a «π» ha un conduttore in derivazione sulla porta 1 ($G_a=${a}\\,\\mathrm S$), uno sulla porta 2 ($G_b=${b}\\,\\mathrm S$) e uno in serie tra i morsetti superiori ($G_c=${c}\\,\\mathrm S$). Determinare la matrice delle ammettenze $Y$.`,
      campi: [num('y11', '$y_{11}$', R(a + c)), num('y12', '$y_{12}$', R(-c)), num('y21', '$y_{21}$', R(-c)), num('y22', '$y_{22}$', R(b + c))],
      soluzione: ['Si applica una tensione a una porta con l\'altra in corto.', `$y_{11}=G_a+G_c=${a + c}$, $y_{22}=G_b+G_c=${b + c}$.`, `$y_{12}=y_{21}=-G_c=${-c}$ (la corrente di cortocircuito esce dalla porta 2).`] };
  },
};

const PYTH = [['4/5', '3/4', '3/5'], ['3/5', '4/3', '4/5'], ['12/13', '5/12', '5/13'], ['5/13', '12/5', '12/13'], ['15/17', '8/15', '8/17'], ['8/17', '15/8', '15/17']];
APPLIED.rifasamento = {
  titolo: 'Rifasamento', blocco: 'III', studio: ['III-08'],
  build(rng) {
    const [cos1, tan1] = rng.pick(PYTH.slice(0, 4)).slice(0, 2), p = rng.pick([100, 200, 400, 600]), v = rng.pick([10, 20, 50]), w = rng.pick([10, 100]);
    const second = rng.chance(0.5) ? ['1', '0'] : ['12/13', '5/12'];
    if (R(tan1).lt(second[1])) return APPLIED.rifasamento.build(rng);
    const c = R(p).mul(R(tan1).sub(second[1])).div(R(w * v * v));
    return { testo: `Un carico assorbe $P=${p}\\,\\mathrm W$ con tensione efficace $V=${v}\\,\\mathrm V$ a $\\omega=${w}\\,\\mathrm{rad/s}$ e fattore di potenza $\\cos\\varphi_1=${cos1}$ (induttivo). Calcolare la capacità $C$ in parallelo che porta il fattore di potenza a $\\cos\\varphi_2=${second[0]}$.`,
      campi: [num('c', '$C$ [F]', c)],
      soluzione: [`$\\tan\\varphi_1=${tan1}$, $\\tan\\varphi_2=${second[1]}$.`, `$C=\\dfrac{P(\\tan\\varphi_1-\\tan\\varphi_2)}{\\omega V^2}=\\dfrac{${p}\\,(${tan1}-${second[1]})}{${w}\\cdot${v * v}}=${dec(c)}\\,\\mathrm F$.`] };
  },
};

APPLIED.potenze = {
  titolo: 'Potenze P, Q, S e impedenza', blocco: 'III', studio: ['III-06'],
  build(rng) {
    const [cs, , sn] = rng.pick(PYTH), vm = rng.pick([10, 20, 40]), im = rng.pick([2, 4, 5]);
    const half = R(vm * im, 2), P = half.mul(cs), Q = half.mul(sn), zmod = R(vm, im);
    return { testo: `In regime sinusoidale $v(t)=${vm}\\cos(\\omega t)\\,\\mathrm V$ e $i(t)=${im}\\cos(\\omega t-\\varphi)\\,\\mathrm A$ (convenzione degli utilizzatori) con $\\cos\\varphi=${cs}$, $\\sin\\varphi=${sn}$. Calcolare $P$, $Q$, il modulo di $S$ e l'impedenza $Z=R+jX$.`,
      campi: [num('p', '$P$ [W]', P), num('q', '$Q$ [var]', Q), num('s', '$|S|$ [VA]', half), num('r', '$R$ [Ω]', zmod.mul(cs)), num('x', '$X$ [Ω]', zmod.mul(sn))],
      soluzione: ['Con valori di picco: $P=\\tfrac12V_mI_m\\cos\\varphi$, $Q=\\tfrac12V_mI_m\\sin\\varphi$, $|S|=\\tfrac12V_mI_m$.', `$P=${dec(P)}$, $Q=${dec(Q)}$, $|S|=${dec(half)}$.`, `$Z=\\dfrac{V_m}{I_m}e^{j\\varphi}=${dec(zmod)}(${cs}+j${sn})$: $R=${dec(zmod.mul(cs))}$, $X=${dec(zmod.mul(sn))}$.`] };
  },
};

APPLIED.laplace_tratti = {
  titolo: 'Trasformata di Laplace di un segnale a tratti', blocco: 'IV', studio: ['IV-01', 'IV-02'],
  build(rng) {
    const T = rng.int(1, 3), a = rng.int(1, 6);
    if (rng.chance(0.5)) {
      const val = a * (1 - Math.exp(-T));
      return { testo: `Il segnale vale $x(t)=${a}$ per $0<t<${T}$ e $0$ altrove. Calcolare $X(1)$ (la trasformata di Laplace in $s=1$), con almeno 3 cifre significative.`,
        campi: [num('x', '$X(1)$', val, { tol: 5e-3 })],
        soluzione: [`$x(t)=${a}[u_{-1}(t)-u_{-1}(t-${T})]$, quindi $X(s)=${a}\\,\\dfrac{1-e^{-${T}s}}{s}$.`, `$X(1)=${a}(1-e^{-${T}})\\approx${val.toFixed(4).replace('.', '{,}')}$.`] };
    }
    const val = a * (1 - Math.exp(-T) * (1 + T));
    return { testo: `Il segnale è una rampa $x(t)=${a}\\,t$ per $0<t<${T}$ e $0$ altrove. Calcolare $X(1)$, con almeno 3 cifre significative.`,
      campi: [num('x', '$X(1)$', val, { tol: 5e-3 })],
      soluzione: [`$x(t)=${a}\\,[t\\,u_{-1}(t)-t\\,u_{-1}(t-${T})]$ e $t\\,u_{-1}(t-T)=(t-T)u_{-1}(t-T)+T\\,u_{-1}(t-T)$.`, `$X(s)=${a}\\left[\\dfrac1{s^2}-e^{-${T}s}\\left(\\dfrac1{s^2}+\\dfrac{${T}}{s}\\right)\\right]$.`, `$X(1)=${a}\\,[1-e^{-${T}}(1+${T})]\\approx${val.toFixed(4).replace('.', '{,}')}$.`] };
  },
};

APPLIED.opamp = {
  titolo: 'Guadagno di una configurazione con amplificatore operazionale', blocco: 'I', studio: ['I-09'],
  build(rng) {
    const kind = rng.pick(['inv', 'noninv', 'somm', 'diff']);
    const r1 = rng.int(1, 5), r2 = rng.int(1, 9), g = rng.nz(6), g2 = rng.nz(6);
    let vo, text, sol;
    if (kind === 'inv') { vo = R(-r2 * g, r1); text = `invertente con $R_1=${r1}\\,\\Omega$, $R_2=${r2}\\,\\Omega$ e $V_g=${g}\\,\\mathrm V$`; sol = `$v_o=-\\dfrac{R_2}{R_1}V_g=${dec(vo)}$.`; }
    else if (kind === 'noninv') { vo = R(r1 + r2, r1).mul(g); text = `non invertente con $R_1=${r1}\\,\\Omega$ (verso massa), $R_2=${r2}\\,\\Omega$ (retroazione) e $V_g=${g}\\,\\mathrm V$`; sol = `$v_o=\\left(1+\\dfrac{R_2}{R_1}\\right)V_g=${dec(vo)}$.`; }
    else if (kind === 'somm') { const r3 = rng.int(1, 5); vo = R(-r2).mul(R(g, r1).add(R(g2, r3))); text = `sommatore invertente con $R_0=${r2}\\,\\Omega$, $R_1=${r1}\\,\\Omega$, $R_2=${r3}\\,\\Omega$, $V_{g1}=${g}\\,\\mathrm V$, $V_{g2}=${g2}\\,\\mathrm V$`; sol = `$v_o=-R_0\\left(\\dfrac{V_{g1}}{R_1}+\\dfrac{V_{g2}}{R_2}\\right)=${dec(vo)}$.`; }
    else { vo = R(r2, r1).mul(g2 - g); text = `differenziale con rapporto $R_2/R_1=${r2}/${r1}$, $V_{g1}=${g}\\,\\mathrm V$, $V_{g2}=${g2}\\,\\mathrm V$`; sol = `$v_o=\\dfrac{R_2}{R_1}(V_{g2}-V_{g1})=${dec(vo)}$.`; }
    return { testo: `Con amplificatore operazionale ideale (nullore), configurazione ${text}. Calcolare la tensione di uscita $v_o$.`, campi: [num('vo', '$v_o$ [V]', vo)], soluzione: ['Nullatore: $v_d=0$ e correnti d\'ingresso nulle.', sol] };
  },
};

APPLIED.topologia = {
  titolo: 'Grafo: albero, maglie e tagli fondamentali', blocco: 'II', studio: ['II-01', 'II-02', 'II-03'],
  build(rng) {
    const n = rng.int(4, 6);
    const edges = [];
    for (let v = 1; v < n; v++) edges.push([rng.int(0, v - 1), v]); // albero casuale
    const extra = rng.int(2, 4);
    let tries = 0;
    while (edges.length < n - 1 + extra && tries++ < 100) {
      const a = rng.int(0, n - 1), b = rng.int(0, n - 1);
      if (a !== b && !edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) edges.push([Math.min(a, b), Math.max(a, b)]);
    }
    const b = edges.length;
    return { testo: `Un circuito ha ${n} nodi (numerati da 0 a ${n - 1}) e ${b} rami, collegati come segue: ${edges.map(([x, y], i) => `$r_{${i + 1}}:\\ ${x}\\to${y}$`).join(', ')}. Il grafo è connesso. Quanti rami ha un albero, quante sono le maglie fondamentali e quanti i tagli fondamentali?`,
      campi: [num('t', 'Rami dell\'albero', R(n - 1)), num('m', 'Maglie fondamentali', R(b - n + 1)), num('c', 'Tagli fondamentali', R(n - 1))],
      soluzione: [`Un albero tocca tutti gli $n=${n}$ nodi senza maglie: ha $n-1=${n - 1}$ rami.`, `Il coalbero ha $b-n+1=${b - n + 1}$ rami: ciascuno chiude una maglia fondamentale.`, `Ogni ramo d'albero definisce un taglio fondamentale: ${n - 1}.`] };
  },
};

export const APPLIED_KINDS = Object.entries(APPLIED).map(([kind, v]) => ({ kind, titolo: v.titolo, blocco: v.blocco, studio: v.studio }));

export function generateApplied(kind, seed = 1) {
  const A = APPLIED[kind];
  if (!A) throw new Error('domanda ignota: ' + kind);
  const rng = makeRng(`applied|${kind}|${seed}`);
  return { kind, seed, titolo: A.titolo, blocco: A.blocco, studio: A.studio, ...A.build(rng) };
}

// ───────────────────────── Allenamento per passo ─────────────────────────
export const STEP_KINDS = [
  { kind: 'thevenin', titolo: 'Solo Thevenin: $V_{th}$ e $R_{th}$ ai morsetti dell\'elemento con memoria' },
  { kind: 'iniziale', titolo: 'Solo condizione iniziale: $v_C(0^-)$ o $i_L(0^-)$' },
  { kind: 'antitrasformata', titolo: 'Solo antitrasformata di una funzione razionale' },
  { kind: 'nullore', titolo: 'Solo equivalente del nullore' },
];

export function generateStep(kind, { level = 1, seed = 1, template = 'any' } = {}) {
  const rng = makeRng(`step|${kind}|${level}|${seed}`);
  if (kind === 'antitrasformata') return antitrasformata(rng, level, seed);
  if (kind === 'nullore') {
    const g = generate({ template: 'A', level: 1, seed, verify: false });
    const c = g.inst.circuit, s = solve(c);
    const isV2I = g.inst.variant === 'v2i';
    const val = isV2I ? s.i('Rs') : s.v('y');
    const vin = c.elements.find((e) => e.id === 'V1').wave.dc;
    return { kind, seed, inst: g.inst, titolo: 'Equivalente del nullore', blocco: 'I', studio: ['I-09'],
      testo: isV2I ? `Nel circuito in figura il nullore è ideale e $V_1=${L(vin)}\\,\\mathrm V$. Il nullore si comporta come un generatore di corrente verso il carico: determinare la corrente $I$ che attraversa $R_s$.`
        : `Nel circuito in figura il nullore è ideale e $V_1=${L(vin)}\\,\\mathrm V$ (regime continuo). Il nullore si comporta come un generatore di tensione: determinare la tensione $V_y$ del nodo $y$ rispetto a massa.`,
      campi: [num('v', isV2I ? '$I$ [A]' : '$V_y$ [V]', val.re)],
      soluzione: isV2I ? ['Nullatore: $v_y=V_1$ e corrente d\'ingresso nulla.', `$I=V_1/R_s=${dec(val.re)}\\,\\mathrm A$ (fornita dal noratore).`] : ['Nullatore: $v_x=0$ (massa virtuale), corrente nulla.', `La corrente $V_1/R_1$ attraversa $R_f$: $V_y=-\\dfrac{R_f}{R_1}V_1=${dec(val.re)}\\,\\mathrm V$.`] };
  }
  const tpl = template === 'any' ? 'any' : template;
  const g = generate({ template: tpl, level: kind === 'thevenin' ? 1 : level, seed, verify: false });
  const c = g.inst.circuit, mem = c.elements.find((e) => e.id === g.inst.memory);
  if (kind === 'thevenin') {
    const t = thevenin(c, mem.a, mem.b, { without: mem.id });
    return { kind, seed, inst: g.inst, titolo: 'Thevenin ai morsetti della memoria', blocco: 'VI', studio: ['VI-02'],
      testo: `Nel circuito in figura (regime continuo) togli l'elemento con memoria ${mem.id} e determina l'equivalente di Thevenin visto ai suoi morsetti (nodo ${mem.a} verso ${mem.b}).`,
      campi: [num('vth', '$V_{th}$ [V]', t.vth.re), num('rth', '$R_{th}$ [Ω]', t.zth.re)],
      soluzione: ['$V_{th}$: elemento con memoria rimosso, generatori accesi (C aperto, L corto).', `$V_{th}=${dec(t.vth.re)}\\,\\mathrm V$.`, '$R_{th}$: generatori indipendenti spenti (i controllati restano), generatore di prova $V/I$.', `$R_{th}=${dec(t.zth.re)}\\,\\Omega$.`] };
  }
  // iniziale
  const sol = g.sol;
  const xs = sol.xKind === 'vC' ? 'v_C' : 'i_L';
  return { kind, seed, inst: g.inst, titolo: 'Condizione iniziale', blocco: 'III', studio: ['III-02', 'I-05'],
    testo: `Nel circuito in figura il regime per $t<0$ è già raggiunto${sol.hasAc ? `, con $\\omega_0=${L(sol.omega)}\\,\\mathrm{rad/s}$` : ''}. Determinare $${xs}(0^-)$ (valore all'istante $t=0$).`,
    campi: [num('x0', `$${xs}(0^-)$`, sol.x0)],
    soluzione: [sol.hasDc ? `Continua: ${sol.xKind === 'vC' ? 'C aperto' : 'L corto'}, $${xs}^{dc}=${dec(sol.xDc)}$.` : 'Nessuna componente continua.', sol.hasAc ? `Fasori a $\\omega_0$: $\\dot X=${sol.xAc.toLatex()}$; il valore a $t=0$ è la parte reale: $${dec(sol.xAc.re)}$.` : 'Nessuna componente sinusoidale.', `Somma nel tempo: $${xs}(0^-)=${dec(sol.x0)}$.`] };
}

function antitrasformata(rng, level, seed) {
  const type = level === 1 ? 'singolo' : level === 2 ? 'fratti' : rng.pick(['fratti', 'oscill']);
  if (type === 'singolo') {
    const a = rng.int(1, 6), k = rng.nz(9);
    return { kind: 'antitrasformata', seed, titolo: 'Antitrasformata', blocco: 'IV', studio: ['IV-03'],
      testo: `Calcolare la trasformata inversa $f(t)$, per $t>0$, di $F(s)=\\dfrac{${k}}{s+${a}}$ (scrivi ad esempio <code>3*e^(-2t)</code>).`,
      campi: [{ key: 'f', label: '$f(t)$, $t>0$', tipo: 'expr', region: 'pos', atteso: (t) => k * Math.exp(-a * t), risposta: `${k}*e^(-${a}*t)` }],
      soluzione: [`Polo semplice in $s=-${a}$: $f(t)=${k}\\,e^{-${a}t}u_{-1}(t)$.`] };
  }
  if (type === 'fratti') {
    let p = rng.int(1, 5), q = rng.int(1, 5); while (q === p) q = rng.int(1, 6);
    const a = rng.nz(6), b = rng.nz(6);
    // F = a/(s+p) + b/(s+q) scritta come N/D
    const num2 = `${a + b}s${(a * q + b * p) >= 0 ? '+' : ''}${a * q + b * p}`;
    return { kind: 'antitrasformata', seed, titolo: 'Antitrasformata (fratti semplici)', blocco: 'IV', studio: ['IV-03'],
      testo: `Calcolare $f(t)$, per $t>0$, di $F(s)=\\dfrac{${num2}}{(s+${p})(s+${q})}$.`,
      campi: [{ key: 'f', label: '$f(t)$, $t>0$', tipo: 'expr', region: 'pos', atteso: (t) => a * Math.exp(-p * t) + b * Math.exp(-q * t), risposta: `(${a})*e^(-${p}*t)+(${b})*e^(-${q}*t)` }],
      soluzione: [`Fratti semplici: $F(s)=\\dfrac{A}{s+${p}}+\\dfrac{B}{s+${q}}$ con $A=\\left.\\dfrac{${num2}}{s+${q}}\\right|_{s=-${p}}=${a}$ e $B=\\left.\\dfrac{${num2}}{s+${p}}\\right|_{s=-${q}}=${b}$.`, `$f(t)=${a}e^{-${p}t}+${b}e^{-${q}t}$ (per $t>0$).`] };
  }
  const w = rng.int(1, 4), a = rng.nz(5), b = rng.nz(8);
  return { kind: 'antitrasformata', seed, titolo: 'Antitrasformata (poli complessi coniugati)', blocco: 'IV', studio: ['IV-04'],
    testo: `Calcolare $f(t)$, per $t>0$, di $F(s)=\\dfrac{${a}s${b >= 0 ? '+' : ''}${b}}{s^2+${w * w}}$.`,
    campi: [{ key: 'f', label: '$f(t)$, $t>0$', tipo: 'expr', region: 'pos', atteso: (t) => a * Math.cos(w * t) + (b / w) * Math.sin(w * t), risposta: `(${a})*cos(${w}*t)+(${b}/${w})*sin(${w}*t)` }],
    soluzione: [`$\\mathcal L\\{\\cos\\omega t\\}=\\dfrac{s}{s^2+\\omega^2}$ e $\\mathcal L\\{\\sin\\omega t\\}=\\dfrac{\\omega}{s^2+\\omega^2}$ con $\\omega=${w}$.`, `$F(s)=${a}\\dfrac{s}{s^2+${w * w}}+\\dfrac{${b}}{${w}}\\cdot\\dfrac{${w}}{s^2+${w * w}}$, quindi $f(t)=${a}\\cos(${w}t)+${L(R(b, w))}\\sin(${w}t)$.`] };
}

// ───────────────────────── Correzione ─────────────────────────
export function gradeProblem(p, answers) {
  const per = {}; let sum = 0;
  for (const c of p.campi) {
    const raw = (answers[c.key] ?? '').toString();
    let r;
    if (c.tipo === 'num') r = gradeNumber(raw, c.atteso, { tol: c.tol || 3e-3 });
    else if (c.tipo === 'scelta') r = { ok: Number(raw) === c.atteso && raw !== '' };
    else r = compareExpr(raw, c.atteso, c.region || 'pos');
    per[c.key] = { ok: !!r.ok, parseError: r.parseError || null };
    if (r.ok) sum += 1;
  }
  return { per, score: sum / p.campi.length };
}
void Cx;
