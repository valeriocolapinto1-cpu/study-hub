/**
 * Domande applicate delle prove storiche (parte numerica delle tre domande) e allenamento per
 * singolo passo dell'esercizio d'analisi, dal sito originale. Valori attesi calcolati con
 * aritmetica esatta (o dal risolutore del circuito), testi in italiano e in inglese.
 */
import { registerGenerator, type GeneratedExercise, type Lang } from '../../../engine/generators/registry';
import { createRng, deriveSeed, type Rng } from '../../../engine/random';
import { Rational, R } from '../lib/rational';
import { thevenin, solve } from '../lib/mna';
import { wave, type Circuit } from '../lib/netlist';
import { generateInstance } from '../lib/generate';
import { withDec } from '../lib/explain';
import { instanceNetlist, kitNetlist } from '../lib/kit';
import { nz } from '../lib/templates';

type Build = (rng: Rng, lang: Lang) => GeneratedExercise;
const L = (x: Rational | number | string) => R(x).toLatex();
const tr = (lang: Lang, it: string, en: string) => (lang === 'it' ? it : en);
const step = (lang: Lang, it: string, en: string, body: string) => ({ title: tr(lang, it, en), body });
const n = (x: Rational | number) => (typeof x === 'number' ? x : x.toNumber());
const decN = (x: number, lang: Lang) => x.toFixed(4).replace('.', lang === 'it' ? '{,}' : '.');

const thev: Build = (rng, lang) => {
  const vs = rng.int(2, 12);
  const [r1, r2, r3] = [rng.int(1, 5), rng.int(1, 5), rng.int(1, 5)];
  const c: Circuit = {
    elements: [
      { id: 'V1', type: 'V', a: 'in', b: '0', wave: wave(vs) },
      { id: 'R1', type: 'R', a: 'in', b: 'p', r: R(r1) },
      { id: 'R2', type: 'R', a: 'p', b: '0', r: R(r2) },
      { id: 'R3', type: 'R', a: 'p', b: 'b', r: R(r3) },
    ],
  };
  const t = thevenin(c, 'b', '0');
  const [vth, rth, isc] = [t.vth.re, t.zth.re, t.isc!.re];
  const net = { ...kitNetlist(c), ports: [{ id: 'AB', plus: 'b', minus: '0', label: 'A–B' }] };
  return {
    statement: tr(
      lang,
      `Nel circuito in figura (valori in V e Ω) determinare l'equivalente di Thevenin e di Norton visto dai morsetti $A$–$B$ ($A$ è il nodo a destra, $B$ il riferimento).`,
      `In the circuit of the figure (values in V and Ω) find the Thévenin and Norton equivalents seen from terminals $A$–$B$ ($A$ is the right-hand node, $B$ the reference).`,
    ),
    figure: { netlist: net },
    steps: [
      step(
        lang,
        'Tensione a vuoto',
        'Open-circuit voltage',
        tr(
          lang,
          `Porta a vuoto: in $R_3$ non passa corrente; partitore $V_{th}=V_1\\dfrac{R_2}{R_1+R_2}=${withDec(vth, lang)}\\,\\mathrm V$.`,
          `Port open: no current flows in $R_3$; divider $V_{th}=V_1\\dfrac{R_2}{R_1+R_2}=${withDec(vth, lang)}\\,\\mathrm V$.`,
        ),
      ),
      step(
        lang,
        'Resistenza equivalente',
        'Equivalent resistance',
        tr(
          lang,
          `Generatore spento (corto): $R_{th}=R_3+R_1\\parallel R_2=${withDec(rth, lang)}\\,\\Omega$.`,
          `Source off (short): $R_{th}=R_3+R_1\\parallel R_2=${withDec(rth, lang)}\\,\\Omega$.`,
        ),
      ),
      step(lang, 'Norton', 'Norton', `$I_N=V_{th}/R_{th}=${withDec(isc, lang)}\\,\\mathrm A$.`),
    ],
    answer: [
      { label: '$V_{th}$', value: n(vth), unit: 'V' },
      { label: '$R_{th}$', value: n(rth), unit: 'Ω' },
      { label: '$I_N$', value: n(isc), unit: 'A' },
    ],
  };
};

const maxTrasf: Build = (rng, lang) => {
  const vp = rng.int(2, 12);
  const r = rng.int(1, 5);
  const x = rng.int(-4, 4);
  const pmax = R(vp * vp, 8 * r);
  const z = `${r}${x >= 0 ? '+' : '-'}j${Math.abs(x)}`;
  const zc = `${r}${-x >= 0 ? '+' : '-'}j${Math.abs(x)}`;
  return {
    statement: tr(
      lang,
      `Un bipolo in regime sinusoidale ha equivalente di Thevenin con $\\dot V_{th}=${vp}\\,\\mathrm V$ (ampiezza di **picco**) e $Z_{th}=${z}\\,\\Omega$. Determinare l'impedenza di carico $Z_L$ che massimizza la potenza attiva assorbita e il valore massimo $P_{max}$.`,
      `A one-port in sinusoidal steady state has a Thévenin equivalent with $\\dot V_{th}=${vp}\\,\\mathrm V$ (**peak** amplitude) and $Z_{th}=${z}\\,\\Omega$. Find the load impedance $Z_L$ maximising the absorbed active power and the maximum value $P_{max}$.`,
    ),
    steps: [
      step(
        lang,
        'Adattamento coniugato',
        'Conjugate matching',
        tr(
          lang,
          `Il massimo si ha per $Z_L=Z_{th}^{*}=${zc}\\,\\Omega$: la reattanza totale si annulla e $R_L=R_{th}$.`,
          `The maximum occurs for $Z_L=Z_{th}^{*}=${zc}\\,\\Omega$: the total reactance vanishes and $R_L=R_{th}$.`,
        ),
      ),
      step(
        lang,
        'Potenza massima',
        'Maximum power',
        tr(
          lang,
          `Con valori di picco $P_{max}=\\dfrac{|V_{th}|^2}{8R_{th}}=\\dfrac{${vp * vp}}{${8 * r}}=${withDec(pmax, lang)}\\,\\mathrm W$ (con valori efficaci sarebbe $|V_{th}|^2/(4R_{th})$).`,
          `With peak values $P_{max}=\\dfrac{|V_{th}|^2}{8R_{th}}=\\dfrac{${vp * vp}}{${8 * r}}=${withDec(pmax, lang)}\\,\\mathrm W$ (with RMS values it would be $|V_{th}|^2/(4R_{th})$).`,
        ),
      ),
    ],
    answer: [
      { label: tr(lang, '$\\mathrm{Re}\\{Z_L\\}$', '$\\mathrm{Re}\\{Z_L\\}$'), value: r, unit: 'Ω' },
      { label: '$\\mathrm{Im}\\{Z_L\\}$', value: -x, unit: 'Ω' },
      { label: '$P_{max}$', value: n(pmax), unit: 'W' },
    ],
  };
};

const filtro: Build = (rng, lang) => {
  const kind = rng.pick(['rc_lp', 'rc_hp', 'rl_lp', 'rl_hp'] as const);
  const r = rng.int(1, 6);
  const x = rng.int(1, 6);
  const wc = kind.startsWith('rc') ? R(1, r * x) : R(r, x);
  const lp = kind.endsWith('lp');
  const desc = {
    rc_lp: tr(
      lang,
      `un resistore $R=${r}\\,\\Omega$ in serie e un condensatore $C=${x}\\,\\mathrm F$ in parallelo all'uscita`,
      `a series resistor $R=${r}\\,\\Omega$ and a capacitor $C=${x}\\,\\mathrm F$ across the output`,
    ),
    rc_hp: tr(
      lang,
      `un condensatore $C=${x}\\,\\mathrm F$ in serie e un resistore $R=${r}\\,\\Omega$ in parallelo all'uscita`,
      `a series capacitor $C=${x}\\,\\mathrm F$ and a resistor $R=${r}\\,\\Omega$ across the output`,
    ),
    rl_lp: tr(
      lang,
      `un induttore $L=${x}\\,\\mathrm H$ in serie e un resistore $R=${r}\\,\\Omega$ in parallelo all'uscita`,
      `a series inductor $L=${x}\\,\\mathrm H$ and a resistor $R=${r}\\,\\Omega$ across the output`,
    ),
    rl_hp: tr(
      lang,
      `un resistore $R=${r}\\,\\Omega$ in serie e un induttore $L=${x}\\,\\mathrm H$ in parallelo all'uscita`,
      `a series resistor $R=${r}\\,\\Omega$ and an inductor $L=${x}\\,\\mathrm H$ across the output`,
    ),
  }[kind];
  const tipo = lp ? tr(lang, 'passa-basso', 'low-pass') : tr(lang, 'passa-alto', 'high-pass');
  return {
    statement: tr(
      lang,
      `Un filtro del primo ordine è formato da ${desc}; l'uscita è la tensione sull'elemento in parallelo. Determinare la pulsazione di taglio a 3 dB e il modulo della risposta in continua $|H(0)|$ (che dice il tipo di filtro).`,
      `A first-order filter is made of ${desc}; the output is the voltage across the parallel element. Find the 3 dB cut-off angular frequency and the DC magnitude $|H(0)|$ (which tells the type of filter).`,
    ),
    steps: [
      step(
        lang,
        'Funzione di rete',
        'Network function',
        tr(
          lang,
          `$H(s)$ è del primo ordine con polo in $s=-\\omega_c$.`,
          `$H(s)$ is first order with a pole at $s=-\\omega_c$.`,
        ),
      ),
      step(
        lang,
        'Taglio',
        'Cut-off',
        `${kind.startsWith('rc') ? '$\\omega_c=\\dfrac{1}{RC}$' : '$\\omega_c=\\dfrac{R}{L}$'}$=${withDec(wc, lang)}\\,\\mathrm{rad/s}$ ${tr(lang, '(a $\\omega_c$ il modulo vale $|H|_{max}/\\sqrt2$, cioè $-3\\,\\mathrm{dB}$).', '(at $\\omega_c$ the magnitude is $|H|_{max}/\\sqrt2$, i.e. $-3\\,\\mathrm{dB}$).')}`,
      ),
      step(
        lang,
        'Tipo',
        'Type',
        tr(
          lang,
          `In continua ${kind.startsWith('rc') ? 'il condensatore è aperto' : "l'induttore è un corto"}: $|H(0)|=${lp ? 1 : 0}$, quindi è un ${tipo}.`,
          `In DC ${kind.startsWith('rc') ? 'the capacitor is open' : 'the inductor is a short'}: $|H(0)|=${lp ? 1 : 0}$, so it is a ${tipo}.`,
        ),
      ),
    ],
    answer: [
      { label: '$\\omega_c$', value: n(wc), unit: 'rad/s' },
      { label: '$|H(0)|$', value: lp ? 1 : 0 },
    ],
  };
};

const risonanza: Build = (rng, lang) => {
  const serie = rng.chance(0.5);
  const l = rng.int(1, 4);
  const w0 = rng.int(1, 5);
  const r = rng.int(1, 6);
  const c = R(1, l * w0 * w0);
  const qf = serie ? R(w0 * l, r) : R(r, w0 * l);
  const band = R(w0).div(qf);
  const tipo = serie ? tr(lang, 'serie', 'series') : tr(lang, 'parallelo', 'parallel');
  return {
    statement: tr(
      lang,
      `Un circuito RLC ${tipo} ha $R=${r}\\,\\Omega$, $L=${l}\\,\\mathrm H$, $C=${L(c)}\\,\\mathrm F$. Determinare la pulsazione di risonanza, il fattore di merito $Q$ e la banda a 3 dB.`,
      `A ${tipo} RLC circuit has $R=${r}\\,\\Omega$, $L=${l}\\,\\mathrm H$, $C=${L(c)}\\,\\mathrm F$. Find the resonant angular frequency, the quality factor $Q$ and the 3 dB bandwidth.`,
    ),
    steps: [
      step(
        lang,
        'Risonanza',
        'Resonance',
        `$\\omega_0=\\dfrac{1}{\\sqrt{LC}}=\\dfrac{1}{\\sqrt{${l}\\cdot${L(c)}}}=${w0}\\,\\mathrm{rad/s}$.`,
      ),
      step(
        lang,
        'Fattore di merito',
        'Quality factor',
        serie
          ? `$Q=\\dfrac{\\omega_0L}{R}=${withDec(qf, lang)}$.`
          : `$Q=\\dfrac{R}{\\omega_0L}=${withDec(qf, lang)}$.`,
      ),
      step(lang, 'Banda', 'Bandwidth', `$B=\\dfrac{\\omega_0}{Q}=${withDec(band, lang)}\\,\\mathrm{rad/s}$.`),
    ],
    answer: [
      { label: '$\\omega_0$', value: w0, unit: 'rad/s' },
      { label: '$Q$', value: n(qf) },
      { label: '$B$', value: n(band), unit: 'rad/s' },
    ],
  };
};

const stabilita: Build = (rng, lang) => {
  if (rng.chance(0.5)) {
    const a = rng.int(1, 6);
    const b = rng.int(1, 5);
    return {
      statement: tr(
        lang,
        `Un sistema ha funzione di rete con denominatore $D(s)=s^2+(k-${a})\\,s+${b}$. Determinare l'estremo inferiore $k_{min}$ tale che il sistema sia asintoticamente stabile per $k>k_{min}$.`,
        `A system has a network function with denominator $D(s)=s^2+(k-${a})\\,s+${b}$. Find the lower bound $k_{min}$ such that the system is asymptotically stable for $k>k_{min}$.`,
      ),
      steps: [
        step(
          lang,
          'Criterio',
          'Criterion',
          tr(
            lang,
            'Un polinomio di 2º grado ha tutte le radici a parte reale negativa se e solo se i coefficienti hanno tutti lo stesso segno.',
            'A second-degree polynomial has all its roots with negative real part if and only if all the coefficients have the same sign.',
          ),
        ),
        step(
          lang,
          'Condizione',
          'Condition',
          tr(
            lang,
            `Serve $k-${a}>0$ (il termine noto $${b}>0$): $k>${a}$.`,
            `$k-${a}>0$ is required (the constant term $${b}>0$): $k>${a}$.`,
          ),
        ),
      ],
      answer: [{ label: '$k_{min}$', value: a }],
    };
  }
  const a = rng.int(2, 6);
  const b = rng.int(2, 6);
  return {
    statement: tr(
      lang,
      `Il denominatore di una funzione di rete è $D(s)=s^3+${a}s^2+${b}s+k$. Determinare il valore $k_{max}$ oltre il quale il sistema non è più asintoticamente stabile (con $k>0$).`,
      `The denominator of a network function is $D(s)=s^3+${a}s^2+${b}s+k$. Find the value $k_{max}$ beyond which the system is no longer asymptotically stable (with $k>0$).`,
    ),
    steps: [
      step(
        lang,
        'Criterio di Routh',
        'Routh criterion',
        tr(
          lang,
          'Per $s^3+a_2s^2+a_1s+a_0$: stabile se $a_2,a_1,a_0>0$ e $a_2a_1>a_0$.',
          'For $s^3+a_2s^2+a_1s+a_0$: stable if $a_2,a_1,a_0>0$ and $a_2a_1>a_0$.',
        ),
      ),
      step(
        lang,
        'Condizione',
        'Condition',
        tr(
          lang,
          `Qui $a_2a_1=${a}\\cdot${b}=${a * b}$, quindi $0<k<${a * b}$.`,
          `Here $a_2a_1=${a}\\cdot${b}=${a * b}$, hence $0<k<${a * b}$.`,
        ),
      ),
    ],
    answer: [{ label: '$k_{max}$', value: a * b }],
  };
};

const impulsiva: Build = (rng, lang) => {
  const rc = rng.chance(0.5);
  const r = rng.int(1, 6);
  const x = rng.int(1, 4);
  const a = rc ? R(1, r * x) : R(r, x);
  return {
    statement: rc
      ? tr(
          lang,
          `Un circuito RC serie ($R=${r}\\,\\Omega$, $C=${x}\\,\\mathrm F$) ha come uscita la tensione sul condensatore. La risposta impulsiva per $t>0$ ha la forma $h(t)=K\\,e^{-at}$: determinare $K$ e $a$.`,
          `A series RC circuit ($R=${r}\\,\\Omega$, $C=${x}\\,\\mathrm F$) has the capacitor voltage as output. For $t>0$ the impulse response has the form $h(t)=K\\,e^{-at}$: find $K$ and $a$.`,
        )
      : tr(
          lang,
          `Un circuito RL serie ($R=${r}\\,\\Omega$, $L=${x}\\,\\mathrm H$) ha come uscita la tensione sul resistore. La risposta impulsiva per $t>0$ ha la forma $h(t)=K\\,e^{-at}$: determinare $K$ e $a$.`,
          `A series RL circuit ($R=${r}\\,\\Omega$, $L=${x}\\,\\mathrm H$) has the resistor voltage as output. For $t>0$ the impulse response has the form $h(t)=K\\,e^{-at}$: find $K$ and $a$.`,
        ),
    steps: [
      step(
        lang,
        'Funzione di rete',
        'Network function',
        rc
          ? `$H(s)=\\dfrac{1/(RC)}{s+1/(RC)}=\\dfrac{${L(a)}}{s+${L(a)}}$.`
          : `$H(s)=\\dfrac{R/L}{s+R/L}=\\dfrac{${L(a)}}{s+${L(a)}}$.`,
      ),
      step(
        lang,
        'Antitrasformata',
        'Inverse transform',
        `$h(t)=\\mathcal L^{-1}\\{H(s)\\}=${L(a)}\\,e^{-${L(a)}t}\\,u_{-1}(t)$.`,
      ),
    ],
    answer: [
      { label: '$K$', value: n(a), unit: '1/s' },
      { label: '$a$', value: n(a), unit: '1/s' },
    ],
  };
};

const doppiBipoli: Build = (rng, lang) => {
  const [a, b, c] = [rng.int(1, 5), rng.int(1, 5), rng.int(1, 5)];
  if (rng.chance(0.5))
    return {
      statement: tr(
        lang,
        `Un doppio bipolo a «T» ha due resistori in serie ($R_a=${a}\\,\\Omega$ sulla porta 1, $R_b=${b}\\,\\Omega$ sulla porta 2) e un resistore in derivazione $R_c=${c}\\,\\Omega$ verso il morsetto comune. Determinare la matrice delle impedenze $Z$ (correnti entranti nelle porte).`,
        `A "T" two-port has two series resistors ($R_a=${a}\\,\\Omega$ at port 1, $R_b=${b}\\,\\Omega$ at port 2) and a shunt resistor $R_c=${c}\\,\\Omega$ to the common terminal. Find the impedance matrix $Z$ (currents entering the ports).`,
      ),
      steps: [
        step(
          lang,
          'Prove a vuoto',
          'Open-circuit tests',
          tr(
            lang,
            "Si applica una corrente a una porta con l'altra aperta.",
            'A current is applied to one port with the other open.',
          ),
        ),
        step(lang, 'Diagonale', 'Diagonal', `$z_{11}=R_a+R_c=${a + c}$, $z_{22}=R_b+R_c=${b + c}$.`),
        step(
          lang,
          'Fuori diagonale',
          'Off-diagonal',
          tr(
            lang,
            `Con la porta 2 aperta $v_2=R_c\\,i_1$: $z_{21}=z_{12}=R_c=${c}$ (rete reciproca).`,
            `With port 2 open $v_2=R_c\\,i_1$: $z_{21}=z_{12}=R_c=${c}$ (reciprocal network).`,
          ),
        ),
      ],
      answer: [
        { label: '$z_{11}$', value: a + c, unit: 'Ω' },
        { label: '$z_{12}$', value: c, unit: 'Ω' },
        { label: '$z_{21}$', value: c, unit: 'Ω' },
        { label: '$z_{22}$', value: b + c, unit: 'Ω' },
      ],
    };
  return {
    statement: tr(
      lang,
      `Un doppio bipolo a «π» ha un conduttore in derivazione sulla porta 1 ($G_a=${a}\\,\\mathrm S$), uno sulla porta 2 ($G_b=${b}\\,\\mathrm S$) e uno in serie tra i morsetti superiori ($G_c=${c}\\,\\mathrm S$). Determinare la matrice delle ammettenze $Y$.`,
      `A "π" two-port has a shunt conductance at port 1 ($G_a=${a}\\,\\mathrm S$), one at port 2 ($G_b=${b}\\,\\mathrm S$) and a series one between the upper terminals ($G_c=${c}\\,\\mathrm S$). Find the admittance matrix $Y$.`,
    ),
    steps: [
      step(
        lang,
        'Prove in corto',
        'Short-circuit tests',
        tr(
          lang,
          "Si applica una tensione a una porta con l'altra in corto.",
          'A voltage is applied to one port with the other shorted.',
        ),
      ),
      step(lang, 'Diagonale', 'Diagonal', `$y_{11}=G_a+G_c=${a + c}$, $y_{22}=G_b+G_c=${b + c}$.`),
      step(
        lang,
        'Fuori diagonale',
        'Off-diagonal',
        tr(
          lang,
          `$y_{12}=y_{21}=-G_c=${-c}$ (la corrente di cortocircuito esce dalla porta 2).`,
          `$y_{12}=y_{21}=-G_c=${-c}$ (the short-circuit current leaves port 2).`,
        ),
      ),
    ],
    answer: [
      { label: '$y_{11}$', value: a + c, unit: 'S' },
      { label: '$y_{12}$', value: -c, unit: 'S' },
      { label: '$y_{21}$', value: -c, unit: 'S' },
      { label: '$y_{22}$', value: b + c, unit: 'S' },
    ],
  };
};

const PYTH: [string, string, string][] = [
  ['4/5', '3/4', '3/5'],
  ['3/5', '4/3', '4/5'],
  ['12/13', '5/12', '5/13'],
  ['5/13', '12/5', '12/13'],
  ['15/17', '8/15', '8/17'],
  ['8/17', '15/8', '15/17'],
];
const rifasamento: Build = (rng, lang) => {
  for (;;) {
    const [cos1, tan1] = rng.pick(PYTH.slice(0, 4));
    const p = rng.pick([100, 200, 400, 600]);
    const v = rng.pick([10, 20, 50]);
    const w = rng.pick([10, 100]);
    const second = rng.chance(0.5) ? ['1', '0'] : ['12/13', '5/12'];
    if (R(tan1).lt(second[1]!)) continue;
    const c = R(p)
      .mul(R(tan1).sub(second[1]!))
      .div(R(w * v * v));
    return {
      statement: tr(
        lang,
        `Un carico assorbe $P=${p}\\,\\mathrm W$ con tensione efficace $V=${v}\\,\\mathrm V$ a $\\omega=${w}\\,\\mathrm{rad/s}$ e fattore di potenza $\\cos\\varphi_1=${L(cos1)}$ (induttivo). Calcolare la capacità $C$ in parallelo che porta il fattore di potenza a $\\cos\\varphi_2=${L(second[0]!)}$.`,
        `A load absorbs $P=${p}\\,\\mathrm W$ at RMS voltage $V=${v}\\,\\mathrm V$, $\\omega=${w}\\,\\mathrm{rad/s}$ and power factor $\\cos\\varphi_1=${L(cos1)}$ (inductive). Compute the parallel capacitance $C$ that brings the power factor to $\\cos\\varphi_2=${L(second[0]!)}$.`,
      ),
      steps: [
        step(
          lang,
          'Tangenti',
          'Tangents',
          `$\\tan\\varphi_1=${L(tan1)}$, $\\tan\\varphi_2=${L(second[1]!)}$.`,
        ),
        step(
          lang,
          'Capacità',
          'Capacitance',
          `$C=\\dfrac{P(\\tan\\varphi_1-\\tan\\varphi_2)}{\\omega V^2}=\\dfrac{${p}\\,(${L(tan1)}-${L(second[1]!)})}{${w}\\cdot${v * v}}=${withDec(c, lang)}\\,\\mathrm F$.`,
        ),
      ],
      answer: [{ label: '$C$', value: n(c), unit: 'F' }],
    };
  }
};

const potenze: Build = (rng, lang) => {
  const [cs, , sn] = rng.pick(PYTH);
  const vm = rng.pick([10, 20, 40]);
  const im = rng.pick([2, 4, 5]);
  const half = R(vm * im, 2);
  const P = half.mul(cs);
  const Q = half.mul(sn);
  const zmod = R(vm, im);
  return {
    statement: tr(
      lang,
      `In regime sinusoidale $v(t)=${vm}\\cos(\\omega t)\\,\\mathrm V$ e $i(t)=${im}\\cos(\\omega t-\\varphi)\\,\\mathrm A$ (convenzione degli utilizzatori) con $\\cos\\varphi=${L(cs)}$, $\\sin\\varphi=${L(sn)}$. Calcolare $P$, $Q$, il modulo di $S$ e l'impedenza $Z=R+jX$.`,
      `In sinusoidal steady state $v(t)=${vm}\\cos(\\omega t)\\,\\mathrm V$ and $i(t)=${im}\\cos(\\omega t-\\varphi)\\,\\mathrm A$ (passive sign convention) with $\\cos\\varphi=${L(cs)}$, $\\sin\\varphi=${L(sn)}$. Compute $P$, $Q$, the magnitude of $S$ and the impedance $Z=R+jX$.`,
    ),
    steps: [
      step(
        lang,
        'Formule (picco)',
        'Formulas (peak)',
        '$P=\\tfrac12V_mI_m\\cos\\varphi$, $Q=\\tfrac12V_mI_m\\sin\\varphi$, $|S|=\\tfrac12V_mI_m$.',
      ),
      step(
        lang,
        'Potenze',
        'Powers',
        `$P=${withDec(P, lang)}$, $Q=${withDec(Q, lang)}$, $|S|=${withDec(half, lang)}$.`,
      ),
      step(
        lang,
        'Impedenza',
        'Impedance',
        `$Z=\\dfrac{V_m}{I_m}e^{j\\varphi}=${withDec(zmod, lang)}\\,(${L(cs)}+j\\,${L(sn)})$: $R=${withDec(zmod.mul(cs), lang)}$, $X=${withDec(zmod.mul(sn), lang)}$.`,
      ),
    ],
    answer: [
      { label: '$P$', value: n(P), unit: 'W' },
      { label: '$Q$', value: n(Q), unit: 'var' },
      { label: '$|S|$', value: n(half), unit: 'VA' },
      { label: '$R$', value: n(zmod.mul(cs)), unit: 'Ω' },
      { label: '$X$', value: n(zmod.mul(sn)), unit: 'Ω' },
    ],
  };
};

const laplaceTratti: Build = (rng, lang) => {
  const T = rng.int(1, 3);
  const a = rng.int(1, 6);
  if (rng.chance(0.5)) {
    const val = a * (1 - Math.exp(-T));
    return {
      statement: tr(
        lang,
        `Il segnale vale $x(t)=${a}$ per $0<t<${T}$ e $0$ altrove. Calcolare $X(1)$, cioè la trasformata di Laplace in $s=1$, con almeno 3 cifre significative.`,
        `The signal is $x(t)=${a}$ for $0<t<${T}$ and $0$ elsewhere. Compute $X(1)$, i.e. the Laplace transform at $s=1$, to at least 3 significant figures.`,
      ),
      steps: [
        step(
          lang,
          'Gradini',
          'Steps',
          `$x(t)=${a}[u_{-1}(t)-u_{-1}(t-${T})]$, ${tr(lang, 'quindi', 'hence')} $X(s)=${a}\\,\\dfrac{1-e^{-${T}s}}{s}$.`,
        ),
        step(
          lang,
          'Valore in $s=1$',
          'Value at $s=1$',
          `$X(1)=${a}(1-e^{-${T}})\\approx${decN(val, lang)}$.`,
        ),
      ],
      answer: [{ label: '$X(1)$', value: val, tol: 0.005 }],
    };
  }
  const val = a * (1 - Math.exp(-T) * (1 + T));
  return {
    statement: tr(
      lang,
      `Il segnale è una rampa $x(t)=${a}\\,t$ per $0<t<${T}$ e $0$ altrove. Calcolare $X(1)$ con almeno 3 cifre significative.`,
      `The signal is a ramp $x(t)=${a}\\,t$ for $0<t<${T}$ and $0$ elsewhere. Compute $X(1)$ to at least 3 significant figures.`,
    ),
    steps: [
      step(
        lang,
        'Gradini',
        'Steps',
        `$x(t)=${a}\\,[t\\,u_{-1}(t)-t\\,u_{-1}(t-${T})]$ ${tr(lang, 'e', 'and')} $t\\,u_{-1}(t-T)=(t-T)u_{-1}(t-T)+T\\,u_{-1}(t-T)$.`,
      ),
      step(
        lang,
        'Trasformata',
        'Transform',
        `$X(s)=${a}\\left[\\dfrac1{s^2}-e^{-${T}s}\\left(\\dfrac1{s^2}+\\dfrac{${T}}{s}\\right)\\right]$.`,
      ),
      step(
        lang,
        'Valore in $s=1$',
        'Value at $s=1$',
        `$X(1)=${a}\\,[1-e^{-${T}}(1+${T})]\\approx${decN(val, lang)}$.`,
      ),
    ],
    answer: [{ label: '$X(1)$', value: val, tol: 0.005 }],
  };
};

const opamp: Build = (rng, lang) => {
  const kind = rng.pick(['inv', 'noninv', 'somm', 'diff'] as const);
  const r1 = rng.int(1, 5);
  const r2 = rng.int(1, 9);
  const g = nz(rng, 6);
  const g2 = nz(rng, 6);
  let vo: Rational;
  let text: string;
  let sol: string;
  if (kind === 'inv') {
    vo = R(-r2 * g, r1);
    text = tr(
      lang,
      `invertente con $R_1=${r1}\\,\\Omega$, $R_2=${r2}\\,\\Omega$ e $V_g=${g}\\,\\mathrm V$`,
      `inverting with $R_1=${r1}\\,\\Omega$, $R_2=${r2}\\,\\Omega$ and $V_g=${g}\\,\\mathrm V$`,
    );
    sol = `$v_o=-\\dfrac{R_2}{R_1}V_g=${withDec(vo, lang)}\\,\\mathrm V$.`;
  } else if (kind === 'noninv') {
    vo = R(r1 + r2, r1).mul(g);
    text = tr(
      lang,
      `non invertente con $R_1=${r1}\\,\\Omega$ (verso massa), $R_2=${r2}\\,\\Omega$ (retroazione) e $V_g=${g}\\,\\mathrm V$`,
      `non-inverting with $R_1=${r1}\\,\\Omega$ (to ground), $R_2=${r2}\\,\\Omega$ (feedback) and $V_g=${g}\\,\\mathrm V$`,
    );
    sol = `$v_o=\\left(1+\\dfrac{R_2}{R_1}\\right)V_g=${withDec(vo, lang)}\\,\\mathrm V$.`;
  } else if (kind === 'somm') {
    const r3 = rng.int(1, 5);
    vo = R(-r2).mul(R(g, r1).add(R(g2, r3)));
    text = tr(
      lang,
      `sommatore invertente con $R_0=${r2}\\,\\Omega$, $R_1=${r1}\\,\\Omega$, $R_2=${r3}\\,\\Omega$, $V_{g1}=${g}\\,\\mathrm V$, $V_{g2}=${g2}\\,\\mathrm V$`,
      `inverting summer with $R_0=${r2}\\,\\Omega$, $R_1=${r1}\\,\\Omega$, $R_2=${r3}\\,\\Omega$, $V_{g1}=${g}\\,\\mathrm V$, $V_{g2}=${g2}\\,\\mathrm V$`,
    );
    sol = `$v_o=-R_0\\left(\\dfrac{V_{g1}}{R_1}+\\dfrac{V_{g2}}{R_2}\\right)=${withDec(vo, lang)}\\,\\mathrm V$.`;
  } else {
    vo = R(r2, r1).mul(g2 - g);
    text = tr(
      lang,
      `differenziale con rapporto $R_2/R_1=${r2}/${r1}$, $V_{g1}=${g}\\,\\mathrm V$, $V_{g2}=${g2}\\,\\mathrm V$`,
      `difference amplifier with ratio $R_2/R_1=${r2}/${r1}$, $V_{g1}=${g}\\,\\mathrm V$, $V_{g2}=${g2}\\,\\mathrm V$`,
    );
    sol = `$v_o=\\dfrac{R_2}{R_1}(V_{g2}-V_{g1})=${withDec(vo, lang)}\\,\\mathrm V$.`;
  }
  return {
    statement: tr(
      lang,
      `Con amplificatore operazionale ideale (nullore), configurazione ${text}. Calcolare la tensione di uscita $v_o$.`,
      `With an ideal operational amplifier (nullor), ${text} configuration. Compute the output voltage $v_o$.`,
    ),
    steps: [
      step(
        lang,
        'Nullatore',
        'Nullator',
        tr(lang, "$v_d=0$ e correnti d'ingresso nulle.", '$v_d=0$ and zero input currents.'),
      ),
      step(lang, 'Uscita', 'Output', sol),
    ],
    answer: [{ label: '$v_o$', value: n(vo), unit: 'V' }],
  };
};

const topologia: Build = (rng, lang) => {
  const nn = rng.int(4, 6);
  const edges: [number, number][] = [];
  for (let v = 1; v < nn; v++) edges.push([rng.int(0, v - 1), v]);
  const extra = rng.int(2, 4);
  let tries = 0;
  while (edges.length < nn - 1 + extra && tries++ < 100) {
    const a = rng.int(0, nn - 1);
    const b = rng.int(0, nn - 1);
    if (a !== b && !edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a)))
      edges.push([Math.min(a, b), Math.max(a, b)]);
  }
  const b = edges.length;
  const list = edges.map(([x, y], i) => `$r_{${i + 1}}:\\ ${x}\\to${y}$`).join(', ');
  return {
    statement: tr(
      lang,
      `Un circuito ha ${nn} nodi (numerati da 0 a ${nn - 1}) e ${b} rami, collegati come segue: ${list}. Il grafo è connesso. Quanti rami ha un albero, quante sono le maglie fondamentali e quanti i tagli fondamentali?`,
      `A circuit has ${nn} nodes (numbered 0 to ${nn - 1}) and ${b} branches, connected as follows: ${list}. The graph is connected. How many branches does a tree have, and how many fundamental loops and fundamental cut sets are there?`,
    ),
    steps: [
      step(
        lang,
        'Albero',
        'Tree',
        tr(
          lang,
          `Un albero tocca tutti gli $n=${nn}$ nodi senza maglie: ha $n-1=${nn - 1}$ rami.`,
          `A tree touches all $n=${nn}$ nodes without loops: it has $n-1=${nn - 1}$ branches.`,
        ),
      ),
      step(
        lang,
        'Maglie fondamentali',
        'Fundamental loops',
        tr(
          lang,
          `Il coalbero ha $b-n+1=${b - nn + 1}$ rami: ciascuno chiude una maglia fondamentale.`,
          `The cotree has $b-n+1=${b - nn + 1}$ branches: each closes a fundamental loop.`,
        ),
      ),
      step(
        lang,
        'Tagli fondamentali',
        'Fundamental cut sets',
        tr(
          lang,
          `Ogni ramo d'albero definisce un taglio fondamentale: ${nn - 1}.`,
          `Each tree branch defines a fundamental cut set: ${nn - 1}.`,
        ),
      ),
    ],
    answer: [
      { label: tr(lang, "rami dell'albero", 'tree branches'), value: nn - 1 },
      { label: tr(lang, 'maglie fondamentali', 'fundamental loops'), value: b - nn + 1 },
      { label: tr(lang, 'tagli fondamentali', 'fundamental cut sets'), value: nn - 1 },
    ],
  };
};

// ---------------------------------------------------------------- allenamento per passo
const passoThevenin: Build = (rng, lang) => {
  const { inst } = generateInstance(rng.pick(['A', 'B', 'C'] as const), 1, rng.int(1, 1e9));
  const mem = inst.circuit.elements.find((e) => e.id === inst.memory)!;
  if (mem.type !== 'C' && mem.type !== 'L') throw new Error('memoria assente');
  const t = thevenin(inst.circuit, mem.a, mem.b, { without: mem.id });
  return {
    statement: tr(
      lang,
      `Nel circuito in figura (regime continuo) togli l'elemento con memoria $${mem.id.replace(/(\d)/, '_$1')}$ e determina l'equivalente di Thevenin visto ai suoi morsetti (dal nodo ${mem.a} verso il nodo ${mem.b}).`,
      `In the circuit of the figure (DC steady state) remove the memory element $${mem.id.replace(/(\d)/, '_$1')}$ and find the Thévenin equivalent seen at its terminals (from node ${mem.a} towards node ${mem.b}).`,
    ),
    figure: { netlist: instanceNetlist(inst) },
    steps: [
      step(
        lang,
        'Tensione a vuoto',
        'Open-circuit voltage',
        tr(
          lang,
          `Elemento con memoria rimosso, generatori accesi: $V_{th}=${withDec(t.vth.re, lang)}\\,\\mathrm V$.`,
          `Memory element removed, sources on: $V_{th}=${withDec(t.vth.re, lang)}\\,\\mathrm V$.`,
        ),
      ),
      step(
        lang,
        'Generatore di prova',
        'Test source',
        tr(
          lang,
          `Indipendenti spenti (i controllati e il nullore restano), generatore di prova $V/I$: $R_{th}=${withDec(t.zth.re, lang)}\\,\\Omega$.`,
          `Independent sources off (controlled sources and nullor stay), test source $V/I$: $R_{th}=${withDec(t.zth.re, lang)}\\,\\Omega$.`,
        ),
      ),
    ],
    answer: [
      { label: '$V_{th}$', value: n(t.vth.re), unit: 'V' },
      { label: '$R_{th}$', value: n(t.zth.re), unit: 'Ω' },
    ],
  };
};
const passoIniziale =
  (level: 2 | 3): Build =>
  (rng, lang) => {
    const { inst, sol } = generateInstance(rng.pick(['A', 'B', 'C'] as const), level, rng.int(1, 1e9));
    const xs = sol.xKind === 'vC' ? 'v_C' : 'i_L';
    const parts = [
      sol.hasDc
        ? tr(
            lang,
            `Continua (${sol.xKind === 'vC' ? 'C aperto' : 'L in corto'}): $${xs}^{dc}=${withDec(sol.xDc, lang)}$.`,
            `DC (${sol.xKind === 'vC' ? 'C open' : 'L shorted'}): $${xs}^{dc}=${withDec(sol.xDc, lang)}$.`,
          )
        : tr(lang, 'Nessuna componente continua.', 'No DC component.'),
      tr(
        lang,
        `Fasori a $\\omega_0$: $\\dot X=${sol.xAc.toLatex()}$; il valore a $t=0$ è la parte reale, $${withDec(sol.xAc.re, lang)}$.`,
        `Phasors at $\\omega_0$: $\\dot X=${sol.xAc.toLatex()}$; the value at $t=0$ is the real part, $${withDec(sol.xAc.re, lang)}$.`,
      ),
      tr(
        lang,
        `Somma nel tempo: $${xs}(0^-)=${withDec(sol.x0, lang)}$.`,
        `Sum in time: $${xs}(0^-)=${withDec(sol.x0, lang)}$.`,
      ),
    ];
    return {
      statement: tr(
        lang,
        `Nel circuito in figura il regime per $t<0$ è già raggiunto, con $\\omega_0=${L(sol.omega!)}\\,\\mathrm{rad/s}$. Determinare $${xs}(0^-)$ (valore all'istante $t=0$).`,
        `In the circuit of the figure the steady state for $t<0$ has been reached, with $\\omega_0=${L(sol.omega!)}\\,\\mathrm{rad/s}$. Find $${xs}(0^-)$ (value at the instant $t=0$).`,
      ),
      figure: { netlist: instanceNetlist(inst) },
      steps: parts.map((p, i) =>
        step(lang, ['Continua', 'Sinusoide', 'Somma'][i]!, ['DC', 'Sinusoid', 'Sum'][i]!, p),
      ),
      answer: [{ label: `$${xs}(0^-)$`, value: n(sol.x0), unit: sol.xKind === 'vC' ? 'V' : 'A' }],
    };
  };
const passoNullore: Build = (rng, lang) => {
  const { inst } = generateInstance('A', 1, rng.int(1, 1e9));
  const c = inst.circuit;
  const s = solve(c);
  const v2i = inst.variant === 'v2i';
  const val = (v2i ? s.i('Rs') : s.v('y')) as import('../lib/complex').Cx;
  const v1 = c.elements.find((e) => e.id === 'V1');
  const vin = v1 && v1.type === 'V' ? v1.wave.dc : Rational.ZERO;
  return {
    statement: v2i
      ? tr(
          lang,
          `Nel circuito in figura il nullore è ideale e $V_1=${L(vin)}\\,\\mathrm V$. Il nullore si comporta come un generatore di corrente verso il carico: determinare la corrente $I$ che attraversa $R_s$.`,
          `In the circuit of the figure the nullor is ideal and $V_1=${L(vin)}\\,\\mathrm V$. The nullor behaves as a current source towards the load: find the current $I$ through $R_s$.`,
        )
      : tr(
          lang,
          `Nel circuito in figura il nullore è ideale e $V_1=${L(vin)}\\,\\mathrm V$ (regime continuo). Il nullore si comporta come un generatore di tensione: determinare la tensione $V_y$ del nodo $y$ rispetto a massa.`,
          `In the circuit of the figure the nullor is ideal and $V_1=${L(vin)}\\,\\mathrm V$ (DC steady state). The nullor behaves as a voltage source: find the voltage $V_y$ of node $y$ with respect to ground.`,
        ),
    figure: { netlist: instanceNetlist(inst) },
    steps: v2i
      ? [
          step(
            lang,
            'Nullatore',
            'Nullator',
            tr(lang, "$v_y=V_1$ e corrente d'ingresso nulla.", '$v_y=V_1$ and zero input current.'),
          ),
          step(
            lang,
            'Corrente',
            'Current',
            tr(
              lang,
              `$I=V_1/R_s=${withDec(val.re, lang)}\\,\\mathrm A$, fornita dal noratore.`,
              `$I=V_1/R_s=${withDec(val.re, lang)}\\,\\mathrm A$, supplied by the norator.`,
            ),
          ),
        ]
      : [
          step(
            lang,
            'Nullatore',
            'Nullator',
            tr(
              lang,
              '$v_x=0$ (massa virtuale) e corrente nulla.',
              '$v_x=0$ (virtual ground) and zero current.',
            ),
          ),
          step(
            lang,
            'Tensione',
            'Voltage',
            tr(
              lang,
              `La corrente $V_1/R_1$ attraversa $R_f$: $V_y=-\\dfrac{R_f}{R_1}V_1=${withDec(val.re, lang)}\\,\\mathrm V$.`,
              `The current $V_1/R_1$ flows through $R_f$: $V_y=-\\dfrac{R_f}{R_1}V_1=${withDec(val.re, lang)}\\,\\mathrm V$.`,
            ),
          ),
        ],
    answer: [{ label: v2i ? '$I$' : '$V_y$', value: n(val.re), unit: v2i ? 'A' : 'V' }],
  };
};
const antiSingolo: Build = (rng, lang) => {
  const a = rng.int(1, 6);
  const k = nz(rng, 9);
  return {
    statement: tr(
      lang,
      `Calcolare la trasformata inversa $f(t)=A\\,e^{-pt}$, per $t>0$, di $F(s)=\\dfrac{${k}}{s+${a}}$: determinare $A$ e $p$.`,
      `Compute the inverse transform $f(t)=A\\,e^{-pt}$, for $t>0$, of $F(s)=\\dfrac{${k}}{s+${a}}$: find $A$ and $p$.`,
    ),
    steps: [step(lang, 'Polo semplice', 'Simple pole', `$s=-${a}$: $f(t)=${k}\\,e^{-${a}t}u_{-1}(t)$.`)],
    answer: [
      { label: '$A$', value: k },
      { label: '$p$', value: a, unit: '1/s' },
    ],
  };
};
const antiFratti: Build = (rng, lang) => {
  const p = rng.int(1, 5);
  let q = rng.int(1, 5);
  while (q === p) q = rng.int(1, 6);
  const a = nz(rng, 6);
  const b = nz(rng, 6);
  const c1 = a + b;
  const c0 = a * q + b * p;
  const num = `${c1 === 1 ? '' : c1 === -1 ? '-' : c1}s${c0 >= 0 ? '+' : ''}${c0}`.replace(/^0s\+?/, '');
  return {
    statement: tr(
      lang,
      `Calcolare $f(t)=A\\,e^{-${p}t}+B\\,e^{-${q}t}$, per $t>0$, antitrasformata di $F(s)=\\dfrac{${num}}{(s+${p})(s+${q})}$: determinare $A$ e $B$.`,
      `Compute $f(t)=A\\,e^{-${p}t}+B\\,e^{-${q}t}$, for $t>0$, the inverse transform of $F(s)=\\dfrac{${num}}{(s+${p})(s+${q})}$: find $A$ and $B$.`,
    ),
    steps: [
      step(
        lang,
        'Residui',
        'Residues',
        `$A=\\left.\\dfrac{${num}}{s+${q}}\\right|_{s=-${p}}=${a}$, $B=\\left.\\dfrac{${num}}{s+${p}}\\right|_{s=-${q}}=${b}$.`,
      ),
      step(
        lang,
        'Antitrasformata',
        'Inverse transform',
        `$f(t)=${a}e^{-${p}t}${b >= 0 ? '+' : ''}${b}e^{-${q}t}$ ($t>0$).`,
      ),
    ],
    answer: [
      { label: '$A$', value: a },
      { label: '$B$', value: b },
    ],
  };
};
const antiOscill: Build = (rng, lang) => {
  const w = rng.int(1, 4);
  const a = nz(rng, 5);
  const b = nz(rng, 8);
  const ratio = R(b, w);
  return {
    statement: tr(
      lang,
      `Calcolare $f(t)=A\\cos(${w}t)+B\\sin(${w}t)$, per $t>0$, antitrasformata di $F(s)=\\dfrac{${a === 1 ? '' : a === -1 ? '-' : a}s${b >= 0 ? '+' : ''}${b}}{s^2+${w * w}}$: determinare $A$ e $B$.`,
      `Compute $f(t)=A\\cos(${w}t)+B\\sin(${w}t)$, for $t>0$, the inverse transform of $F(s)=\\dfrac{${a === 1 ? '' : a === -1 ? '-' : a}s${b >= 0 ? '+' : ''}${b}}{s^2+${w * w}}$: find $A$ and $B$.`,
    ),
    steps: [
      step(
        lang,
        'Trasformate notevoli',
        'Common transforms',
        `$\\mathcal L\\{\\cos\\omega t\\}=\\dfrac{s}{s^2+\\omega^2}$, $\\mathcal L\\{\\sin\\omega t\\}=\\dfrac{\\omega}{s^2+\\omega^2}$, $\\omega=${w}$.`,
      ),
      step(
        lang,
        'Scomposizione',
        'Splitting',
        `$F(s)=${a}\\dfrac{s}{s^2+${w * w}}+\\dfrac{${b}}{${w}}\\cdot\\dfrac{${w}}{s^2+${w * w}}$: $f(t)=${a}\\cos(${w}t)+${L(ratio)}\\sin(${w}t)$.`,
      ),
    ],
    answer: [
      { label: '$A$', value: a },
      { label: '$B$', value: n(ratio) },
    ],
  };
};

const DEFS: { name: string; topic: string; objectives: string[]; build: Build }[] = [
  {
    name: 'thevenin-norton',
    topic: 'teorema-di-thevenin',
    objectives: ['teorema-di-thevenin.3'],
    build: thev,
  },
  {
    name: 'massimo-trasferimento',
    topic: 'massimo-trasferimento-potenza',
    objectives: ['massimo-trasferimento-potenza.2'],
    build: maxTrasf,
  },
  {
    name: 'filtro-primo-ordine',
    topic: 'risposta-in-frequenza-filtri',
    objectives: ['risposta-in-frequenza-filtri.2', 'risposta-in-frequenza-filtri.3'],
    build: filtro,
  },
  { name: 'risonanza', topic: 'circuiti-risonanti', objectives: ['circuiti-risonanti.1'], build: risonanza },
  {
    name: 'stabilita-parametro',
    topic: 'stabilita-poli',
    objectives: ['stabilita-poli.3'],
    build: stabilita,
  },
  {
    name: 'risposta-impulsiva',
    topic: 'risposta-impulsiva-convoluzione',
    objectives: ['risposta-impulsiva-convoluzione.2'],
    build: impulsiva,
  },
  { name: 'matrici-z-y', topic: 'doppi-bipoli-z-y', objectives: ['doppi-bipoli-z-y.2'], build: doppiBipoli },
  { name: 'rifasamento', topic: 'rifasamento', objectives: ['rifasamento.2'], build: rifasamento },
  { name: 'potenze', topic: 'potenza-complessa', objectives: ['potenza-complessa.3'], build: potenze },
  {
    name: 'laplace-segnale-a-tratti',
    topic: 'trasformate-notevoli',
    objectives: ['trasformate-notevoli.3'],
    build: laplaceTratti,
  },
  {
    name: 'amplificatore-operazionale',
    topic: 'nullore-e-amplificatore-operazionale',
    objectives: ['nullore-e-amplificatore-operazionale.3'],
    build: opamp,
  },
  {
    name: 'albero-maglie-tagli',
    topic: 'albero-coalbero',
    objectives: ['albero-coalbero.2'],
    build: topologia,
  },
  {
    name: 'passo-thevenin-memoria',
    topic: 'teorema-di-thevenin',
    objectives: ['teorema-di-thevenin.3'],
    build: passoThevenin,
  },
  { name: 'passo-condizione-iniziale-2', topic: 'fasori', objectives: ['fasori.1'], build: passoIniziale(2) },
  {
    name: 'passo-condizione-iniziale-3',
    topic: 'sovrapposizione-frequenze-diverse',
    objectives: ['sovrapposizione-frequenze-diverse.3'],
    build: passoIniziale(3),
  },
  {
    name: 'passo-nullore',
    topic: 'nullore-e-amplificatore-operazionale',
    objectives: ['nullore-e-amplificatore-operazionale.3'],
    build: passoNullore,
  },
  {
    name: 'antitrasformata-polo-semplice',
    topic: 'fratti-semplici',
    objectives: ['fratti-semplici.2'],
    build: antiSingolo,
  },
  {
    name: 'antitrasformata-fratti-semplici',
    topic: 'fratti-semplici',
    objectives: ['fratti-semplici.1', 'fratti-semplici.2'],
    build: antiFratti,
  },
  {
    name: 'antitrasformata-poli-complessi',
    topic: 'poli-complessi-coniugati',
    objectives: ['poli-complessi-coniugati.1'],
    build: antiOscill,
  },
];
for (const d of DEFS)
  registerGenerator({
    id: `teoria-circuiti/${d.name}`,
    topic: d.topic,
    objectives: d.objectives,
    generate: (seed, lang) => d.build(createRng(deriveSeed('tdc-app', d.name, seed)), lang),
  });

export const APPLIED_GENERATORS = DEFS.map((d) => `teoria-circuiti/${d.name}`);
