/** Blocco 2 — Corrente elettrica stazionaria e circuiti (template del sito originale). */
import { defineTemplate, EPS0, S, pick, step } from './lib';

defineTemplate({
  id: 'b2-rc-scarica-tempi',
  blocco: 'b2',
  topic: 'corrente-stazionaria',
  objectives: ['corrente-stazionaria.7'],
  tema: { it: 'Scarica di un condensatore: tempi caratteristici ed energia', en: 'Capacitor discharge: characteristic times and energy' },
  make(r, { t, P, Un }) {
    const C = step(r, 1, 20, 1) * 1e-6, R = step(r, 1, 50, 1) * 1e3, V0 = step(r, 5, 50, 5), tau = R * C;
    const tQ = tau * Math.LN2, tU = (tau * Math.LN2) / 2, U0 = 0.5 * C * V0 * V0, Ut = U0 * (1 - Math.exp(-2));
    return {
      statement: t(
        S`Un condensatore di capacità $C=${P(C, 'F')}$, caricato alla tensione $V_0=${Un(V0, 'V')}$, si scarica attraverso una resistenza $R=${P(R, '\\Omega')}$. Calcolare: a) i tempi $t_Q$, $t_V$ e $t_U$ necessari per dimezzare, rispettivamente, la carica, la tensione ai capi del condensatore e l'energia immagazzinata; b) l'energia totale dissipata in $R$; c) l'energia dissipata in $R$ fino all'istante $t=\tau=RC$.`,
        S`A capacitor of capacitance $C=${P(C, 'F')}$, charged to the voltage $V_0=${Un(V0, 'V')}$, discharges through a resistance $R=${P(R, '\\Omega')}$. Compute: a) the times $t_Q$, $t_V$ and $t_U$ needed to halve, respectively, the charge, the voltage across the capacitor and the stored energy; b) the total energy dissipated in $R$; c) the energy dissipated in $R$ up to the instant $t=\tau=RC$.`,
      ),
      steps: [
        t(S`$Q(t)=Q_0e^{-t/\tau}$, $V(t)=V_0e^{-t/\tau}$, $U(t)=U_0e^{-2t/\tau}$, con $\tau=RC=${Un(tau * 1e3, 'ms')}$.`, S`$Q(t)=Q_0e^{-t/\tau}$, $V(t)=V_0e^{-t/\tau}$, $U(t)=U_0e^{-2t/\tau}$, with $\tau=RC=${Un(tau * 1e3, 'ms')}$.`),
        t(S`Dimezzamento: $t_Q=t_V=\tau\ln2$; per l'energia $e^{-2t/\tau}=\tfrac12\Rightarrow t_U=\tfrac{\tau}{2}\ln 2$.`, S`Halving: $t_Q=t_V=\tau\ln2$; for the energy $e^{-2t/\tau}=\tfrac12\Rightarrow t_U=\tfrac{\tau}{2}\ln 2$.`),
        t(S`Energia totale dissipata $=U_0=\tfrac12CV_0^2$; fino a $t=\tau$: $U_0-U(\tau)=U_0\left(1-e^{-2}\right)$. Risultati: $t_Q=t_V=${P(tQ, 's')}$, $t_U=${P(tU, 's')}$, $U_0=${P(U0, 'J')}$, $E_{diss}(\tau)=${P(Ut, 'J')}$.`, S`Total dissipated energy $=U_0=\tfrac12CV_0^2$; up to $t=\tau$: $U_0-U(\tau)=U_0\left(1-e^{-2}\right)$. Results: $t_Q=t_V=${P(tQ, 's')}$, $t_U=${P(tU, 's')}$, $U_0=${P(U0, 'J')}$, $E_{diss}(\tau)=${P(Ut, 'J')}$.`),
      ],
      answer: [
        { label: 't_Q = t_V', value: tQ, unit: 's' },
        { label: 't_U', value: tU, unit: 's' },
        { label: 'U₀', value: U0, unit: 'J' },
        { label: 'E_diss(τ)', value: Ut, unit: 'J' },
      ],
      parametri: { C, R, V0 },
      valori: { tau, tQ, tV: tQ, tU, U0, Ut },
    };
  },
});

defineTemplate({
  id: 'b2-dielettrico-perdite',
  blocco: 'b2',
  topic: 'corrente-stazionaria',
  objectives: ['corrente-stazionaria.7'],
  tema: { it: 'Condensatore piano con dielettrico con perdite', en: 'Parallel-plate capacitor with a lossy dielectric' },
  make(r, { t, P, Un, mm, sig }) {
    const er = step(r, 2, 8, 1), rho = pick(r, [1e8, 3e8, 1e9, 3e9, 1e10]), Sx = step(r, 100, 500, 50) * 1e-4, d = step(r, 0.5, 2, 0.5) * 1e-3, Q0 = step(r, 1, 10, 1) * 1e-6;
    const tau = EPS0 * er * rho, C = (EPS0 * er * Sx) / d, I0 = Q0 / tau, t10 = tau * Math.log(10), U0 = (Q0 * Q0) / (2 * C);
    return {
      statement: t(
        S`Le armature di un condensatore piano, di area $S=${Un(Sx * 1e4, 'cm^2')}$ e distanti $d=${mm(d)}$, racchiudono come isolante un materiale non ideale, che conduce debolmente: permittività relativa $\varepsilon_r=${sig(er, 2)}$, resistività $\rho=${Un(rho, '\\Omega\\,m')}$. Inizialmente il condensatore ha carica $Q_0=${P(Q0, 'C')}$ e viene lasciato isolato. Calcolare: a) la costante di tempo di scarica; b) la corrente iniziale di dispersione; c) il tempo dopo il quale la carica si riduce al 10% di $Q_0$; d) l'energia totale dissipata.`,
        S`The plates of a parallel-plate capacitor, of area $S=${Un(Sx * 1e4, 'cm^2')}$ and $d=${mm(d)}$ apart, enclose as insulator a non-ideal material that conducts weakly: relative permittivity $\varepsilon_r=${sig(er, 2)}$, resistivity $\rho=${Un(rho, '\\Omega\\,m')}$. Initially the capacitor has charge $Q_0=${P(Q0, 'C')}$ and is left isolated. Compute: a) the discharge time constant; b) the initial leakage current; c) the time after which the charge has dropped to 10% of $Q_0$; d) the total dissipated energy.`,
      ),
      steps: [
        t(S`Resistenza di dispersione $R=\rho d/S$ e capacità $C=\varepsilon_0\varepsilon_r S/d$: $\tau=RC=\varepsilon_0\varepsilon_r\rho$ (non dipende dalla geometria).`, S`Leakage resistance $R=\rho d/S$ and capacitance $C=\varepsilon_0\varepsilon_r S/d$: $\tau=RC=\varepsilon_0\varepsilon_r\rho$ (independent of the geometry).`),
        t(S`$Q(t)=Q_0e^{-t/\tau}$, quindi $I_0=Q_0/\tau$ e $Q=0{,}1\,Q_0$ per $t=\tau\ln10$.`, S`$Q(t)=Q_0e^{-t/\tau}$, so $I_0=Q_0/\tau$ and $Q=0.1\,Q_0$ for $t=\tau\ln10$.`),
        t(S`Tutta l'energia iniziale va in calore: $U_0=\dfrac{Q_0^2}{2C}$. Risultati: $\tau=${P(tau, 's')}$, $I_0=${P(I0, 'A')}$, $t_{10\%}=${P(t10, 's')}$, $U_0=${P(U0, 'J')}$.`, S`All the initial energy turns into heat: $U_0=\dfrac{Q_0^2}{2C}$. Results: $\tau=${P(tau, 's')}$, $I_0=${P(I0, 'A')}$, $t_{10\%}=${P(t10, 's')}$, $U_0=${P(U0, 'J')}$.`),
      ],
      answer: [
        { label: 'τ', value: tau, unit: 's' },
        { label: 'I₀', value: I0, unit: 'A' },
        { label: 't₁₀%', value: t10, unit: 's' },
        { label: 'U₀', value: U0, unit: 'J' },
      ],
      parametri: { er, rho, S: Sx, d, Q0 },
      valori: { tau, C, I0, t10, U0 },
    };
  },
});

defineTemplate({
  id: 'b2-partitore-apertura',
  blocco: 'b2',
  topic: 'corrente-stazionaria',
  objectives: ['corrente-stazionaria.7', 'corrente-stazionaria.5'],
  tema: { it: "Scarica di un condensatore dopo l'apertura dell'interruttore", en: 'Capacitor discharge after the switch opens' },
  make(r, { t, P, Un, sig }) {
    const E = step(r, 6, 30, 3), R1 = step(r, 1, 10, 1) * 1e3, R2 = step(r, 1, 10, 1) * 1e3, C = step(r, 1, 20, 1) * 1e-6;
    const v0 = (E * R2) / (R1 + R2), tau = R2 * C, Ud = 0.5 * C * v0 * v0, Ptau = (v0 * Math.exp(-1)) ** 2 / R2;
    return {
      statement: t(
        S`Un generatore di tensione ideale ($\mathcal E=${Un(E, 'V')}$) alimenta, tramite un interruttore $T$ e una resistenza $R_1=${P(R1, '\\Omega')}$ in serie, il parallelo formato da una resistenza $R_2=${P(R2, '\\Omega')}$ e da un condensatore $C=${P(C, 'F')}$. Il circuito è a regime con $T$ chiuso quando, a $t=0$, $T$ viene aperto. Calcolare: a) la tensione ai capi del condensatore prima dell'apertura; b) l'andamento $V_C(t)$ per $t>0$; c) l'energia totale dissipata in $R_2$ dopo l'apertura; d) la potenza dissipata in $R_2$ all'istante $t=\tau$.`,
        S`An ideal voltage generator ($\mathcal E=${Un(E, 'V')}$) feeds, through a switch $T$ and a series resistance $R_1=${P(R1, '\\Omega')}$, the parallel of a resistance $R_2=${P(R2, '\\Omega')}$ and a capacitor $C=${P(C, 'F')}$. The circuit is at steady state with $T$ closed when, at $t=0$, $T$ is opened. Compute: a) the voltage across the capacitor before opening; b) the behaviour $V_C(t)$ for $t>0$; c) the total energy dissipated in $R_2$ after opening; d) the power dissipated in $R_2$ at the instant $t=\tau$.`,
      ),
      steps: [
        t(S`A regime il condensatore è un circuito aperto: $V_C(0)=\mathcal E\dfrac{R_2}{R_1+R_2}$ (partitore).`, S`At steady state the capacitor is an open circuit: $V_C(0)=\mathcal E\dfrac{R_2}{R_1+R_2}$ (divider).`),
        t(S`Dopo l'apertura il condensatore si scarica solo su $R_2$: $V_C(t)=V_C(0)\,e^{-t/\tau}$ con $\tau=R_2C=${Un(tau * 1e3, 'ms')}$, cioè $V_C(t)=${sig(v0, 3)}\,e^{-t/\tau}\ \mathrm{V}$.`, S`After opening the capacitor discharges only through $R_2$: $V_C(t)=V_C(0)\,e^{-t/\tau}$ with $\tau=R_2C=${Un(tau * 1e3, 'ms')}$, that is $V_C(t)=${sig(v0, 3)}\,e^{-t/\tau}\ \mathrm{V}$.`),
        t(S`L'energia dissipata in $R_2$ è tutta l'energia immagazzinata: $\tfrac12CV_C(0)^2$. Potenza $p(t)=V_C(t)^2/R_2$; in $t=\tau$: $p=V_C(0)^2e^{-2}/R_2$. Risultati: $V_C(0)=${Un(v0, 'V')}$, $E_{R_2}=${P(Ud, 'J')}$, $p(\tau)=${P(Ptau, 'W')}$.`, S`The energy dissipated in $R_2$ is all the stored energy: $\tfrac12CV_C(0)^2$. Power $p(t)=V_C(t)^2/R_2$; at $t=\tau$: $p=V_C(0)^2e^{-2}/R_2$. Results: $V_C(0)=${Un(v0, 'V')}$, $E_{R_2}=${P(Ud, 'J')}$, $p(\tau)=${P(Ptau, 'W')}$.`),
      ],
      answer: [
        { label: 'V_C(0)', value: v0, unit: 'V' },
        { label: 'τ', value: tau, unit: 's' },
        { label: 'E_R₂', value: Ud, unit: 'J' },
        { label: 'p(τ)', value: Ptau, unit: 'W' },
      ],
      parametri: { E, R1, R2, C },
      valori: { v0, tau, Ud, Ptau },
    };
  },
});

defineTemplate({
  id: 'b2-carica-chiusura',
  blocco: 'b2',
  topic: 'corrente-stazionaria',
  objectives: ['corrente-stazionaria.7', 'corrente-stazionaria.5'],
  tema: { it: "Carica di un condensatore dopo la chiusura dell'interruttore", en: 'Capacitor charging after the switch closes' },
  make(r, { t, P, Un }) {
    const E = step(r, 6, 30, 3), R1 = step(r, 1, 10, 1) * 1e3, R2 = step(r, 1, 10, 1) * 1e3, C = step(r, 1, 20, 1) * 1e-6;
    const vinf = (E * R2) / (R1 + R2), Rp = (R1 * R2) / (R1 + R2), tau = Rp * C, dU = 0.5 * C * vinf ** 2, t90 = tau * Math.log(10), I0 = E / R1;
    return {
      statement: t(
        S`Un generatore di tensione ideale ($\mathcal E=${Un(E, 'V')}$) è collegato, tramite un interruttore $T$ inizialmente aperto e una resistenza $R_1=${P(R1, '\\Omega')}$, al parallelo di una resistenza $R_2=${P(R2, '\\Omega')}$ e di un condensatore $C=${P(C, 'F')}$ inizialmente scarico. A $t=0$ si chiude $T$. Determinare: a) la corrente erogata dal generatore subito dopo la chiusura; b) la tensione finale sul condensatore; c) la costante di tempo e l'espressione di $V_C(t)$; d) la variazione di energia del condensatore; e) l'istante in cui $V_C$ raggiunge il 90% del valore finale.`,
        S`An ideal voltage generator ($\mathcal E=${Un(E, 'V')}$) is connected, through a switch $T$ initially open and a resistance $R_1=${P(R1, '\\Omega')}$, to the parallel of a resistance $R_2=${P(R2, '\\Omega')}$ and a capacitor $C=${P(C, 'F')}$, initially uncharged. At $t=0$ $T$ closes. Find: a) the current supplied by the generator just after closing; b) the final voltage across the capacitor; c) the time constant and the expression of $V_C(t)$; d) the change in the capacitor's energy; e) the instant at which $V_C$ reaches 90% of its final value.`,
      ),
      steps: [
        t(S`A $t=0^+$ il condensatore scarico è un corto circuito: $I(0^+)=\mathcal E/R_1$.`, S`At $t=0^+$ the uncharged capacitor is a short circuit: $I(0^+)=\mathcal E/R_1$.`),
        t(S`A regime: $V_C(\infty)=\mathcal E\dfrac{R_2}{R_1+R_2}$. Il condensatore vede la resistenza equivalente di Thevenin $R_p=R_1\|R_2$, quindi $\tau=R_pC=${Un(tau * 1e3, 'ms')}$.`, S`At steady state: $V_C(\infty)=\mathcal E\dfrac{R_2}{R_1+R_2}$. The capacitor sees the Thevenin equivalent resistance $R_p=R_1\|R_2$, so $\tau=R_pC=${Un(tau * 1e3, 'ms')}$.`),
        t(S`$V_C(t)=V_C(\infty)\left(1-e^{-t/\tau}\right)$; $\Delta U=\tfrac12CV_C(\infty)^2$; il 90% si raggiunge per $t=\tau\ln10$. Risultati: $I(0^+)=${P(I0, 'A')}$, $V_C(\infty)=${Un(vinf, 'V')}$, $\Delta U=${P(dU, 'J')}$, $t_{90}=${P(t90, 's')}$.`, S`$V_C(t)=V_C(\infty)\left(1-e^{-t/\tau}\right)$; $\Delta U=\tfrac12CV_C(\infty)^2$; 90% is reached at $t=\tau\ln10$. Results: $I(0^+)=${P(I0, 'A')}$, $V_C(\infty)=${Un(vinf, 'V')}$, $\Delta U=${P(dU, 'J')}$, $t_{90}=${P(t90, 's')}$.`),
      ],
      answer: [
        { label: 'I(0⁺)', value: I0, unit: 'A' },
        { label: 'V_C(∞)', value: vinf, unit: 'V' },
        { label: 'τ', value: tau, unit: 's' },
        { label: 'ΔU', value: dU, unit: 'J' },
        { label: 't₉₀', value: t90, unit: 's' },
      ],
      parametri: { E, R1, R2, C },
      valori: { vinf, tau, dU, t90, I0 },
    };
  },
});

defineTemplate({
  id: 'b2-ripartizione-cariche',
  blocco: 'b2',
  topic: 'corrente-stazionaria',
  objectives: ['corrente-stazionaria.7'],
  tema: { it: 'Due condensatori collegati attraverso una resistenza', en: 'Two capacitors connected through a resistor' },
  make(r, { t, P, Un }) {
    const C1 = step(r, 2, 10, 1) * 1e-6, f = pick(r, [1, 2, 3, 4]), C2 = f * C1, V0 = step(r, 20, 100, 10), R = step(r, 1, 20, 1) * 1e3;
    const Vf = (C1 * V0) / (C1 + C2), Q1 = C1 * Vf, Q2 = C2 * Vf, Wd = ((0.5 * C1 * C2) / (C1 + C2)) * V0 * V0, tau = (R * C1 * C2) / (C1 + C2), I0 = V0 / R;
    return {
      statement: t(
        S`Il condensatore $C_1=${P(C1, 'F')}$ è carico alla tensione $V_0=${Un(V0, 'V')}$; il condensatore $C_2=${P(C2, 'F')}$ è scarico. All'istante $t=0$ un interruttore collega i due condensatori attraverso una resistenza $R=${P(R, '\\Omega')}$. Calcolare: a) la corrente iniziale; b) la tensione e le cariche finali dei due condensatori; c) l'energia totale dissipata in $R$ e la costante di tempo del transitorio.`,
        S`Capacitor $C_1=${P(C1, 'F')}$ is charged to the voltage $V_0=${Un(V0, 'V')}$; capacitor $C_2=${P(C2, 'F')}$ is uncharged. At $t=0$ a switch connects the two capacitors through a resistance $R=${P(R, '\\Omega')}$. Compute: a) the initial current; b) the final voltage and charges of the two capacitors; c) the total energy dissipated in $R$ and the time constant of the transient.`,
      ),
      steps: [
        t(S`$I(0)=V_0/R$. La carica totale si conserva: $C_1V_0=(C_1+C_2)V_f$.`, S`$I(0)=V_0/R$. The total charge is conserved: $C_1V_0=(C_1+C_2)V_f$.`),
        S`$V_f=\dfrac{C_1V_0}{C_1+C_2}$, $Q_1=C_1V_f$, $Q_2=C_2V_f$.`,
        t(S`$W_{diss}=\tfrac12C_1V_0^2-\tfrac12(C_1+C_2)V_f^2=\dfrac12\dfrac{C_1C_2}{C_1+C_2}V_0^2$ (indipendente da $R$); $\tau=R\dfrac{C_1C_2}{C_1+C_2}$. Risultati: $I(0)=${P(I0, 'A')}$, $V_f=${Un(Vf, 'V')}$, $Q_1=${P(Q1, 'C')}$, $Q_2=${P(Q2, 'C')}$, $W_{diss}=${P(Wd, 'J')}$, $\tau=${P(tau, 's')}$.`, S`$W_{diss}=\tfrac12C_1V_0^2-\tfrac12(C_1+C_2)V_f^2=\dfrac12\dfrac{C_1C_2}{C_1+C_2}V_0^2$ (independent of $R$); $\tau=R\dfrac{C_1C_2}{C_1+C_2}$. Results: $I(0)=${P(I0, 'A')}$, $V_f=${Un(Vf, 'V')}$, $Q_1=${P(Q1, 'C')}$, $Q_2=${P(Q2, 'C')}$, $W_{diss}=${P(Wd, 'J')}$, $\tau=${P(tau, 's')}$.`),
      ],
      answer: [
        { label: 'I(0)', value: I0, unit: 'A' },
        { label: 'V_f', value: Vf, unit: 'V' },
        { label: 'Q₂', value: Q2, unit: 'C' },
        { label: 'W_diss', value: Wd, unit: 'J' },
        { label: 'τ', value: tau, unit: 's' },
      ],
      parametri: { C1, C2, V0, R },
      valori: { Vf, Q1, Q2, Wd, tau, I0 },
    };
  },
});

defineTemplate({
  id: 'b2-ponte',
  blocco: 'b2',
  topic: 'corrente-stazionaria',
  objectives: ['corrente-stazionaria.6', 'corrente-stazionaria.5'],
  tema: { it: 'Ponte di Wheatstone: condizione di equilibrio e corrente nel galvanometro', en: 'Wheatstone bridge: balance condition and galvanometer current' },
  make(r, { t, P, Un, I_ }) {
    const R1 = step(r, 100, 1000, 100), R2 = step(r, 100, 1000, 100), R3 = step(r, 100, 1000, 100), R0 = step(r, 20, 100, 10), E = step(r, 3, 12, 1), dl = pick(r, [0.02, 0.05, 0.1]);
    const Rx = (R2 * R3) / R1, Rx2 = Rx * (1 + dl);
    const Vth = E * (R2 / (R1 + R2) - Rx2 / (R3 + Rx2)), Rth = (R1 * R2) / (R1 + R2) + (R3 * Rx2) / (R3 + Rx2), I0 = Vth / (Rth + R0);
    return {
      statement: t(
        S`Quattro resistori formano un ponte: $R_1=${Un(R1, '\\Omega')}$ collega i nodi $A$ e $C$, $R_2=${Un(R2, '\\Omega')}$ collega $C$ e $B$, $R_3=${Un(R3, '\\Omega')}$ collega $A$ e $D$, la resistenza incognita $R_x$ collega $D$ e $B$. Un galvanometro di resistenza $R_0=${Un(R0, '\\Omega')}$ è inserito fra $C$ e $D$ e un generatore ideale $\mathcal E=${Un(E, 'V')}$ è collegato fra $A$ e $B$. Determinare: a) il valore di $R_x$ per cui la corrente nel galvanometro è nulla; b) la corrente nel galvanometro se $R_x$ si scosta dal valore di equilibrio del $${I_(dl * 100)}\,\%$ in più.`,
        S`Four resistors form a bridge: $R_1=${Un(R1, '\\Omega')}$ connects nodes $A$ and $C$, $R_2=${Un(R2, '\\Omega')}$ connects $C$ and $B$, $R_3=${Un(R3, '\\Omega')}$ connects $A$ and $D$, the unknown resistance $R_x$ connects $D$ and $B$. A galvanometer of resistance $R_0=${Un(R0, '\\Omega')}$ is inserted between $C$ and $D$ and an ideal generator $\mathcal E=${Un(E, 'V')}$ is connected between $A$ and $B$. Find: a) the value of $R_x$ for which the current in the galvanometer is zero; b) the current in the galvanometer if $R_x$ exceeds the balance value by $${I_(dl * 100)}\,\%$.`,
      ),
      steps: [
        t(S`Equilibrio: $V_C=V_D$. Con $V_B=0$: $V_C=\mathcal E\dfrac{R_2}{R_1+R_2}$, $V_D=\mathcal E\dfrac{R_x}{R_3+R_x}$.`, S`Balance: $V_C=V_D$. With $V_B=0$: $V_C=\mathcal E\dfrac{R_2}{R_1+R_2}$, $V_D=\mathcal E\dfrac{R_x}{R_3+R_x}$.`),
        t(S`Uguagliando: $R_2R_3=R_1R_x$, cioè $R_x=\dfrac{R_2R_3}{R_1}$.`, S`Equating: $R_2R_3=R_1R_x$, that is $R_x=\dfrac{R_2R_3}{R_1}$.`),
        t(S`Fuori equilibrio si usa Thevenin ai capi $C$–$D$: $V_{th}=\mathcal E\left(\dfrac{R_2}{R_1+R_2}-\dfrac{R_x'}{R_3+R_x'}\right)$, $R_{th}=R_1\|R_2+R_3\|R_x'$, $I_0=\dfrac{V_{th}}{R_{th}+R_0}$ (il segno indica il verso). Risultati: $R_x=${Un(Rx, '\\Omega')}$, $I_0=${P(I0, 'A')}$.`, S`Out of balance use Thevenin across $C$–$D$: $V_{th}=\mathcal E\left(\dfrac{R_2}{R_1+R_2}-\dfrac{R_x'}{R_3+R_x'}\right)$, $R_{th}=R_1\|R_2+R_3\|R_x'$, $I_0=\dfrac{V_{th}}{R_{th}+R_0}$ (the sign gives the direction). Results: $R_x=${Un(Rx, '\\Omega')}$, $I_0=${P(I0, 'A')}$.`),
      ],
      answer: [
        { label: 'Rₓ', value: Rx, unit: 'Ω' },
        { label: 'I₀ (C→D)', value: I0, unit: 'A' },
      ],
      parametri: { R1, R2, R3, R0, E, dl },
      valori: { Rx, I0 },
    };
  },
});
