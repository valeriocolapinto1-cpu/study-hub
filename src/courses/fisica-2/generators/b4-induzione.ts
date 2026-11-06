/** Blocco 4 — Induzione elettromagnetica, induttanza, energia (template del sito originale). */
import { defineTemplate, C0, EPS0, MU0, PI, S, pick, step } from './lib';

defineTemplate({
  id: 'b4-rl-apertura',
  blocco: 'b4',
  topic: 'campi-variabili',
  objectives: ['campi-variabili.4'],
  tema: { it: "Circuito RL: apertura dell'interruttore", en: 'RL circuit: opening the switch' },
  make(r, { t, P, Un }) {
    const E = step(r, 6, 24, 3),
      R1 = step(r, 10, 100, 10),
      R2 = step(r, 10, 100, 10),
      L = step(r, 10, 200, 10) * 1e-3;
    const I0 = E / R1,
      tau = L / R2,
      W = 0.5 * L * I0 * I0,
      Vpk = I0 * R2,
      Itau = I0 * Math.exp(-1);
    return {
      statement: t(
        S`Un generatore di tensione ideale ($\mathcal E=${Un(E, 'V')}$), un interruttore $T$ e una resistenza $R_1=${Un(R1, '\\Omega')}$ sono in serie e alimentano il parallelo formato da un'induttanza ideale $L=${P(L, 'H')}$ e da una resistenza $R_2=${Un(R2, '\\Omega')}$. Il circuito è a regime con $T$ chiuso quando, a $t=0$, $T$ viene aperto. Calcolare: a) la corrente nell'induttanza prima dell'apertura; b) l'espressione di $i_L(t)$ per $t>0$ e il suo valore a $t=\tau$; c) la tensione ai capi di $R_2$ subito dopo l'apertura; d) l'energia totale dissipata in $R_2$.`,
        S`An ideal voltage generator ($\mathcal E=${Un(E, 'V')}$), a switch $T$ and a resistance $R_1=${Un(R1, '\\Omega')}$ are in series and feed the parallel of an ideal inductance $L=${P(L, 'H')}$ and a resistance $R_2=${Un(R2, '\\Omega')}$. The circuit is at steady state with $T$ closed when, at $t=0$, $T$ is opened. Compute: a) the current in the inductance before opening; b) the expression of $i_L(t)$ for $t>0$ and its value at $t=\tau$; c) the voltage across $R_2$ just after opening; d) the total energy dissipated in $R_2$.`,
      ),
      steps: [
        t(
          S`A regime l'induttanza ideale è un corto circuito e cortocircuita $R_2$: $i_L(0^-)=\mathcal E/R_1$.`,
          S`At steady state the ideal inductance is a short circuit and shorts $R_2$: $i_L(0^-)=\mathcal E/R_1$.`,
        ),
        t(
          S`La corrente nell'induttanza è continua: dopo l'apertura $L\dfrac{di}{dt}+R_2i=0\Rightarrow i_L(t)=I_0e^{-t/\tau}$ con $\tau=L/R_2=${Un(tau * 1e3, 'ms')}$.`,
          S`The current in the inductance is continuous: after opening $L\dfrac{di}{dt}+R_2i=0\Rightarrow i_L(t)=I_0e^{-t/\tau}$ with $\tau=L/R_2=${Un(tau * 1e3, 'ms')}$.`,
        ),
        t(
          S`$|V_{R_2}(0^+)|=I_0R_2$; energia dissipata $=\tfrac12LI_0^2$ (tutta quella accumulata). Risultati: $I_0=${P(I0, 'A')}$, $i_L(\tau)=${P(Itau, 'A')}$, $|V_{R_2}(0^+)|=${Un(Vpk, 'V')}$, $W=${P(W, 'J')}$.`,
          S`$|V_{R_2}(0^+)|=I_0R_2$; dissipated energy $=\tfrac12LI_0^2$ (all that was stored). Results: $I_0=${P(I0, 'A')}$, $i_L(\tau)=${P(Itau, 'A')}$, $|V_{R_2}(0^+)|=${Un(Vpk, 'V')}$, $W=${P(W, 'J')}$.`,
        ),
      ],
      answer: [
        { label: 'I₀', value: I0, unit: 'A' },
        { label: 'i_L(τ)', value: Itau, unit: 'A' },
        { label: '|V_R₂(0⁺)|', value: Vpk, unit: 'V' },
        { label: 'W', value: W, unit: 'J' },
      ],
      parametri: { E, R1, R2, L },
      valori: { I0, tau, W, Vpk, Itau },
    };
  },
});

defineTemplate({
  id: 'b4-spira-b-variabile',
  blocco: 'b4',
  topic: 'campi-variabili',
  objectives: ['campi-variabili.1', 'campi-variabili.5'],
  tema: {
    it: 'Spira circolare in un campo B(t) che cresce esponenzialmente',
    en: 'Circular loop in an exponentially growing field B(t)',
  },
  make(r, { t, P, Un, cm }) {
    const a = step(r, 2, 8, 1) * 1e-2,
      lam = step(r, 0.05, 0.5, 0.05),
      B0 = step(r, 5, 50, 5) * 1e-3,
      tau = step(r, 5, 50, 5) * 1e-3;
    const Rr = 2 * PI * a * lam,
      e0 = (PI * a * a * B0) / tau,
      i0 = e0 / Rr,
      Wj = (e0 * e0 * tau) / (2 * Rr),
      Q = (PI * a * a * B0) / Rr;
    return {
      statement: t(
        S`Una spira circolare di raggio $a=${cm(a)}$, con resistenza per unità di lunghezza $\lambda=${Un(lam, '\\Omega/m')}$, è immersa in un campo magnetico uniforme, ortogonale al suo piano, che varia secondo $B(t)=B_0\left(1-e^{-t/\tau}\right)$ con $B_0=${P(B0, 'T')}$ e $\tau=${P(tau, 's')}$. Calcolare: a) la resistenza della spira; b) la f.e.m. indotta e la corrente a $t=0$ (con il verso rispetto a $\vec B$); c) la carica totale che circola nella spira per $t\ge 0$; d) il calore complessivamente sviluppato per effetto Joule.`,
        S`A circular loop of radius $a=${cm(a)}$, with resistance per unit length $\lambda=${Un(lam, '\\Omega/m')}$, is immersed in a uniform magnetic field, perpendicular to its plane, that varies as $B(t)=B_0\left(1-e^{-t/\tau}\right)$ with $B_0=${P(B0, 'T')}$ and $\tau=${P(tau, 's')}$. Compute: a) the resistance of the loop; b) the induced emf and the current at $t=0$ (with the direction relative to $\vec B$); c) the total charge flowing in the loop for $t\ge 0$; d) the total heat produced by Joule heating.`,
      ),
      steps: [
        t(
          S`$R=2\pi a\lambda$. Flusso $\Phi=\pi a^2B(t)$, quindi $\mathcal E_i=-\dfrac{d\Phi}{dt}=-\dfrac{\pi a^2B_0}{\tau}e^{-t/\tau}$.`,
          S`$R=2\pi a\lambda$. Flux $\Phi=\pi a^2B(t)$, so $\mathcal E_i=-\dfrac{d\Phi}{dt}=-\dfrac{\pi a^2B_0}{\tau}e^{-t/\tau}$.`,
        ),
        t(
          S`Per Lenz la corrente induce un campo che si oppone all'aumento del flusso (verso orario se $\vec B$ è uscente dal foglio); $i(t)=\dfrac{|\mathcal E_i|}{R}$.`,
          S`By Lenz the current induces a field opposing the increase of flux (clockwise if $\vec B$ points out of the page); $i(t)=\dfrac{|\mathcal E_i|}{R}$.`,
        ),
        t(
          S`$Q=\int_0^\infty i\,dt=\dfrac{\pi a^2B_0}{R}$ e $W=\int_0^\infty R i^2dt=\dfrac{\mathcal E_0^2\tau}{2R}$. Risultati: $R=${Un(Rr, '\\Omega')}$, $|\mathcal E_i(0)|=${P(e0, 'V')}$, $i(0)=${P(i0, 'A')}$, $Q=${P(Q, 'C')}$, $W_J=${P(Wj, 'J')}$.`,
          S`$Q=\int_0^\infty i\,dt=\dfrac{\pi a^2B_0}{R}$ and $W=\int_0^\infty R i^2dt=\dfrac{\mathcal E_0^2\tau}{2R}$. Results: $R=${Un(Rr, '\\Omega')}$, $|\mathcal E_i(0)|=${P(e0, 'V')}$, $i(0)=${P(i0, 'A')}$, $Q=${P(Q, 'C')}$, $W_J=${P(Wj, 'J')}$.`,
        ),
      ],
      answer: [
        { label: 'R', value: Rr, unit: 'Ω' },
        { label: '|ℰ(0)|', value: e0, unit: 'V' },
        { label: 'i(0)', value: i0, unit: 'A' },
        { label: 'Q', value: Q, unit: 'C' },
        { label: 'W_J', value: Wj, unit: 'J' },
      ],
      parametri: { a, lam, B0, tau },
      valori: { Rr, e0, i0, Wj, Q },
    };
  },
});

defineTemplate({
  id: 'b4-barretta-rotaie',
  blocco: 'b4',
  topic: 'campi-variabili',
  objectives: ['campi-variabili.1'],
  tema: {
    it: 'Barretta trascinata su rotaie in un campo magnetico',
    en: 'Bar pulled along rails in a magnetic field',
  },
  make(r, { t, P, Un, cm }) {
    const B = step(r, 0.1, 1, 0.1),
      h = step(r, 10, 50, 5) * 1e-2,
      R = step(r, 0.1, 2, 0.1),
      F = step(r, 0.1, 2, 0.1),
      m = step(r, 20, 200, 20) * 1e-3;
    const vL = (F * R) / (B * B * h * h),
      I = F / (B * h),
      Pw = F * vL,
      tau = (m * R) / (B * B * h * h);
    return {
      statement: t(
        S`Due rotaie conduttrici parallele, distanti $h=${cm(h)}$ e unite a un'estremità da un tratto di resistenza totale $R=${Un(R, '\\Omega')}$ (le rotaie e la barretta hanno resistenza trascurabile), giacciono in un piano ortogonale a un campo magnetico uniforme $B=${Un(B, 'T')}$. Una barretta conduttrice di massa $m=${Un(m * 1e3, 'g')}$, appoggiata trasversalmente sulle rotaie, è trascinata con una forza costante $F=${Un(F, 'N')}$ parallela alle rotaie (attrito trascurabile). Calcolare: a) la velocità limite $v_L$; b) la corrente e la potenza dissipata in $R$ a regime; c) la costante di tempo con cui si raggiunge $v_L$.`,
        S`Two parallel conducting rails, $h=${cm(h)}$ apart and joined at one end by a section of total resistance $R=${Un(R, '\\Omega')}$ (rails and bar have negligible resistance), lie in a plane perpendicular to a uniform magnetic field $B=${Un(B, 'T')}$. A conducting bar of mass $m=${Un(m * 1e3, 'g')}$, lying across the rails, is pulled by a constant force $F=${Un(F, 'N')}$ parallel to the rails (negligible friction). Compute: a) the terminal velocity $v_L$; b) the current and the power dissipated in $R$ at steady state; c) the time constant with which $v_L$ is reached.`,
      ),
      steps: [
        t(
          S`Con velocità $v$: f.e.m. $\mathcal E=Bhv$, corrente $i=\dfrac{Bhv}{R}$, forza frenante $F_m=iBh=\dfrac{B^2h^2v}{R}$.`,
          S`With speed $v$: emf $\mathcal E=Bhv$, current $i=\dfrac{Bhv}{R}$, braking force $F_m=iBh=\dfrac{B^2h^2v}{R}$.`,
        ),
        t(
          S`Equazione del moto $m\dot v=F-\dfrac{B^2h^2}{R}v$: velocità limite quando $F_m=F$, cioè $v_L=\dfrac{FR}{B^2h^2}$; $v(t)=v_L\left(1-e^{-t/\tau}\right)$ con $\tau=\dfrac{mR}{B^2h^2}$.`,
          S`Equation of motion $m\dot v=F-\dfrac{B^2h^2}{R}v$: terminal velocity when $F_m=F$, that is $v_L=\dfrac{FR}{B^2h^2}$; $v(t)=v_L\left(1-e^{-t/\tau}\right)$ with $\tau=\dfrac{mR}{B^2h^2}$.`,
        ),
        t(
          S`A regime $i=F/(Bh)$ e la potenza dissipata $Ri^2=F v_L$ è uguale a quella della forza esterna. Risultati: $v_L=${Un(vL, 'm/s')}$, $i=${P(I, 'A')}$, $P=${P(Pw, 'W')}$, $\tau=${P(tau, 's')}$.`,
          S`At steady state $i=F/(Bh)$ and the dissipated power $Ri^2=F v_L$ equals that of the external force. Results: $v_L=${Un(vL, 'm/s')}$, $i=${P(I, 'A')}$, $P=${P(Pw, 'W')}$, $\tau=${P(tau, 's')}$.`,
        ),
      ],
      answer: [
        { label: 'v_L', value: vL, unit: 'm/s' },
        { label: 'i', value: I, unit: 'A' },
        { label: 'P', value: Pw, unit: 'W' },
        { label: 'τ', value: tau, unit: 's' },
      ],
      parametri: { B, h, R, F, m },
      valori: { vL, I, P: Pw, tau },
    };
  },
});

defineTemplate({
  id: 'b4-sbarra-rotante',
  blocco: 'b4',
  topic: 'campi-variabili',
  objectives: ['campi-variabili.1', 'campi-variabili.7'],
  tema: {
    it: 'Sbarra conduttrice in rotazione in un campo magnetico',
    en: 'Conducting bar rotating in a magnetic field',
  },
  make(r, { t, P, Un, cm }) {
    const l = step(r, 20, 80, 10) * 1e-2,
      w = step(r, 20, 200, 20),
      B = step(r, 0.05, 0.5, 0.05),
      R = step(r, 0.1, 2, 0.1);
    const e = 0.5 * B * w * l * l,
      I = e / R,
      Pp = (e * e) / R,
      M = Pp / w;
    return {
      statement: t(
        S`Una sbarra metallica di lunghezza $l=${cm(l)}$ ruota con velocità angolare costante $\omega=${Un(w, 'rad/s')}$ intorno a un suo estremo $A$, in un piano ortogonale a un campo magnetico uniforme $B=${Un(B, 'T')}$. L'estremo libero striscia su una guida circolare conduttrice collegata ad $A$ tramite una resistenza $R=${Un(R, '\\Omega')}$ (resistenza della sbarra e dei contatti trascurabile). Calcolare: a) la f.e.m. indotta fra i due estremi; b) la corrente; c) la potenza dissipata e il momento della forza esterna necessario per mantenere $\omega$ costante.`,
        S`A metal bar of length $l=${cm(l)}$ rotates with constant angular velocity $\omega=${Un(w, 'rad/s')}$ about one of its ends $A$, in a plane perpendicular to a uniform magnetic field $B=${Un(B, 'T')}$. The free end slides on a circular conducting guide connected to $A$ through a resistance $R=${Un(R, '\\Omega')}$ (resistance of the bar and of the contacts negligible). Compute: a) the emf induced between the two ends; b) the current; c) the dissipated power and the torque of the external force needed to keep $\omega$ constant.`,
      ),
      steps: [
        t(
          S`Un elemento $dr$ a distanza $r$ da $A$ ha velocità $\omega r$: $d\mathcal E=B\omega r\,dr$, quindi $\mathcal E=\int_0^l B\omega r\,dr=\tfrac12B\omega l^2$ (anche da $\mathcal E=-\dot\Phi$, con $\Phi=\tfrac12Bl^2\theta$).`,
          S`An element $dr$ at distance $r$ from $A$ has speed $\omega r$: $d\mathcal E=B\omega r\,dr$, so $\mathcal E=\int_0^l B\omega r\,dr=\tfrac12B\omega l^2$ (also from $\mathcal E=-\dot\Phi$, with $\Phi=\tfrac12Bl^2\theta$).`,
        ),
        S`$i=\mathcal E/R$, $P=\mathcal E^2/R$.`,
        t(
          S`A $\omega$ costante la potenza meccanica uguaglia quella dissipata: $M\omega=P\Rightarrow M=P/\omega$. Risultati: $\mathcal E=${P(e, 'V')}$, $i=${P(I, 'A')}$, $P=${P(Pp, 'W')}$, $M=${P(M, 'N\\,m')}$.`,
          S`At constant $\omega$ the mechanical power equals the dissipated one: $M\omega=P\Rightarrow M=P/\omega$. Results: $\mathcal E=${P(e, 'V')}$, $i=${P(I, 'A')}$, $P=${P(Pp, 'W')}$, $M=${P(M, 'N\\,m')}$.`,
        ),
      ],
      answer: [
        { label: 'ℰ', value: e, unit: 'V' },
        { label: 'i', value: I, unit: 'A' },
        { label: 'P', value: Pp, unit: 'W' },
        { label: 'M', value: M, unit: 'N·m' },
      ],
      parametri: { l, w, B, R },
      valori: { e, I, Pp, M },
    };
  },
});

defineTemplate({
  id: 'b4-mutua-filo-spira',
  blocco: 'b4',
  topic: 'campi-variabili',
  objectives: ['campi-variabili.3'],
  tema: {
    it: 'Mutua induzione fra un filo e una spira quadrata',
    en: 'Mutual inductance between a wire and a square loop',
  },
  make(r, { t, P, Un, cm }) {
    const a = step(r, 5, 20, 5) * 1e-2,
      d = step(r, 2, 10, 2) * 1e-2,
      kk = step(r, 10, 100, 10),
      R = step(r, 0.1, 2, 0.1);
    const M = ((MU0 * a) / (2 * PI)) * Math.log((d + a) / d),
      e = M * kk,
      i = e / R;
    return {
      statement: t(
        S`Una spira quadrata di lato $a=${cm(a)}$ e resistenza $R=${Un(R, '\\Omega')}$ giace nel piano di un lungo filo rettilineo, con due lati paralleli al filo; il lato più vicino dista $d=${cm(d)}$ dal filo. Calcolare: a) il coefficiente di mutua induzione $M$; b) la f.e.m. indotta nella spira se nel filo la corrente cresce linearmente, $I(t)=k\,t$ con $k=${Un(kk, 'A/s')}$; c) la corrente nella spira e il suo verso.`,
        S`A square loop of side $a=${cm(a)}$ and resistance $R=${Un(R, '\\Omega')}$ lies in the plane of a long straight wire, with two sides parallel to the wire; the nearest side is at distance $d=${cm(d)}$ from the wire. Compute: a) the mutual-inductance coefficient $M$; b) the emf induced in the loop if the current in the wire grows linearly, $I(t)=k\,t$ with $k=${Un(kk, 'A/s')}$; c) the current in the loop and its direction.`,
      ),
      steps: [
        t(
          S`Flusso del campo del filo sulla spira: $\Phi=\int_d^{d+a}\dfrac{\mu_0I}{2\pi x}a\,dx=\dfrac{\mu_0a}{2\pi}\ln\dfrac{d+a}{d}\,I$, quindi $M=\dfrac{\mu_0a}{2\pi}\ln\dfrac{d+a}{d}$.`,
          S`Flux of the wire's field through the loop: $\Phi=\int_d^{d+a}\dfrac{\mu_0I}{2\pi x}a\,dx=\dfrac{\mu_0a}{2\pi}\ln\dfrac{d+a}{d}\,I$, so $M=\dfrac{\mu_0a}{2\pi}\ln\dfrac{d+a}{d}$.`,
        ),
        t(
          S`$|\mathcal E|=M\left|\dfrac{dI}{dt}\right|=Mk$ (costante).`,
          S`$|\mathcal E|=M\left|\dfrac{dI}{dt}\right|=Mk$ (constant).`,
        ),
        t(
          S`Per Lenz la corrente indotta si oppone all'aumento di flusso: $i=\mathcal E/R$, con campo opposto a quello del filo dentro la spira. Risultati: $M=${P(M, 'H')}$, $|\mathcal E|=${P(e, 'V')}$, $i=${P(i, 'A')}$.`,
          S`By Lenz the induced current opposes the increase of flux: $i=\mathcal E/R$, with a field opposite to the wire's inside the loop. Results: $M=${P(M, 'H')}$, $|\mathcal E|=${P(e, 'V')}$, $i=${P(i, 'A')}$.`,
        ),
      ],
      answer: [
        { label: 'M', value: M, unit: 'H' },
        { label: '|ℰ|', value: e, unit: 'V' },
        { label: 'i', value: i, unit: 'A' },
      ],
      parametri: { a, d, k: kk, R },
      valori: { M, e, i },
    };
  },
});

defineTemplate({
  id: 'b4-solenoide-bobina',
  blocco: 'b4',
  topic: 'campi-variabili',
  objectives: ['campi-variabili.1', 'campi-variabili.5'],
  tema: {
    it: 'Bobina dentro un solenoide con corrente decrescente',
    en: 'Coil inside a solenoid with decreasing current',
  },
  make(r, { t, P, Un, cm, I_ }) {
    const n = step(r, 1000, 5000, 500),
      I0 = step(r, 1, 5, 0.5),
      tau = step(r, 5, 50, 5) * 1e-3,
      N = step(r, 10, 100, 10),
      dd = step(r, 1, 3, 0.5) * 1e-2,
      R = step(r, 1, 10, 1);
    const Phi0 = N * MU0 * n * dd * dd * I0,
      e0 = Phi0 / tau,
      i0 = e0 / R,
      Q = Phi0 / R;
    return {
      statement: t(
        S`All'interno di un solenoide indefinito con $n=${I_(n)}\ \mathrm{spire/m}$, percorso dalla corrente $I(t)=I_0e^{-t/\tau}$ con $I_0=${Un(I0, 'A')}$ e $\tau=${P(tau, 's')}$, è posta una bobina di $N=${I_(N)}$ spire quadrate di lato $d=${cm(dd)}$, con il piano ortogonale all'asse e resistenza complessiva $R=${Un(R, '\\Omega')}$. Calcolare: a) la f.e.m. indotta a $t=0$ e la sua espressione in funzione del tempo; b) la corrente massima nella bobina; c) la carica totale circolata per $t\ge0$.`,
        S`Inside an infinite solenoid with $n=${I_(n)}\ \mathrm{turns/m}$, carrying the current $I(t)=I_0e^{-t/\tau}$ with $I_0=${Un(I0, 'A')}$ and $\tau=${P(tau, 's')}$, there is a coil of $N=${I_(N)}$ square turns of side $d=${cm(dd)}$, with its plane perpendicular to the axis and total resistance $R=${Un(R, '\\Omega')}$. Compute: a) the induced emf at $t=0$ and its expression as a function of time; b) the maximum current in the coil; c) the total charge that flows for $t\ge0$.`,
      ),
      steps: [
        t(
          S`Nel solenoide $B(t)=\mu_0nI(t)$, uniforme; flusso concatenato dalla bobina $\Phi=N\mu_0nd^2I(t)$.`,
          S`In the solenoid $B(t)=\mu_0nI(t)$, uniform; flux linked with the coil $\Phi=N\mu_0nd^2I(t)$.`,
        ),
        t(
          S`$\mathcal E(t)=-\dfrac{d\Phi}{dt}=\dfrac{N\mu_0nd^2I_0}{\tau}e^{-t/\tau}$, massima a $t=0$; $i_{max}=\mathcal E(0)/R$.`,
          S`$\mathcal E(t)=-\dfrac{d\Phi}{dt}=\dfrac{N\mu_0nd^2I_0}{\tau}e^{-t/\tau}$, maximum at $t=0$; $i_{max}=\mathcal E(0)/R$.`,
        ),
        t(
          S`$Q=\int_0^\infty\dfrac{\mathcal E}{R}dt=\dfrac{N\mu_0nd^2I_0}{R}$ (variazione totale di flusso divisa per $R$). Risultati: $\mathcal E(0)=${P(e0, 'V')}$, $i_{max}=${P(i0, 'A')}$, $Q=${P(Q, 'C')}$.`,
          S`$Q=\int_0^\infty\dfrac{\mathcal E}{R}dt=\dfrac{N\mu_0nd^2I_0}{R}$ (total change of flux divided by $R$). Results: $\mathcal E(0)=${P(e0, 'V')}$, $i_{max}=${P(i0, 'A')}$, $Q=${P(Q, 'C')}$.`,
        ),
      ],
      answer: [
        { label: 'ℰ(0)', value: e0, unit: 'V' },
        { label: 'i_max', value: i0, unit: 'A' },
        { label: 'Q', value: Q, unit: 'C' },
      ],
      parametri: { n, I0, tau, N, d: dd, R },
      valori: { e0, i0, Q },
    };
  },
});

defineTemplate({
  id: 'b4-spira-rotante',
  blocco: 'b4',
  topic: 'campi-variabili',
  objectives: ['campi-variabili.7'],
  tema: {
    it: 'Bobina rotante in un campo uniforme (alternatore)',
    en: 'Coil rotating in a uniform field (alternator)',
  },
  make(r, { t, P, Un, cm, I_ }) {
    const N = step(r, 50, 300, 50),
      a = step(r, 3, 10, 1) * 1e-2,
      B = step(r, 20, 200, 20) * 1e-3,
      f = step(r, 20, 100, 10),
      R = step(r, 5, 50, 5);
    const w = 2 * PI * f,
      e0 = N * B * PI * a * a * w,
      Pm = (e0 * e0) / (2 * R),
      Mm = Pm / w;
    return {
      statement: t(
        S`Una bobina di $N=${I_(N)}$ spire circolari di raggio $a=${cm(a)}$ e resistenza complessiva $R=${Un(R, '\\Omega')}$ ruota con frequenza $f=${Un(f, 'Hz')}$ intorno a un diametro, immersa in un campo magnetico uniforme $B=${P(B, 'T')}$ ortogonale all'asse di rotazione. Calcolare: a) l'espressione e il valore massimo della f.e.m. indotta; b) la potenza media dissipata; c) il momento medio della coppia meccanica necessaria per mantenere la rotazione.`,
        S`A coil of $N=${I_(N)}$ circular turns of radius $a=${cm(a)}$ and total resistance $R=${Un(R, '\\Omega')}$ rotates with frequency $f=${Un(f, 'Hz')}$ about a diameter, immersed in a uniform magnetic field $B=${P(B, 'T')}$ perpendicular to the rotation axis. Compute: a) the expression and the maximum value of the induced emf; b) the average dissipated power; c) the average mechanical torque needed to keep it rotating.`,
      ),
      steps: [
        t(
          S`$\Phi(t)=NB\pi a^2\cos\omega t$ con $\omega=2\pi f$, quindi $\mathcal E(t)=NB\pi a^2\omega\sin\omega t$.`,
          S`$\Phi(t)=NB\pi a^2\cos\omega t$ with $\omega=2\pi f$, so $\mathcal E(t)=NB\pi a^2\omega\sin\omega t$.`,
        ),
        t(
          S`Potenza media: $\langle P\rangle=\dfrac{\mathcal E_0^2}{2R}$ (media di $\sin^2$ pari a $\tfrac12$).`,
          S`Average power: $\langle P\rangle=\dfrac{\mathcal E_0^2}{2R}$ (the average of $\sin^2$ is $\tfrac12$).`,
        ),
        t(
          S`A regime la potenza meccanica media uguaglia quella dissipata: $\langle M\rangle=\langle P\rangle/\omega$. Risultati: $\mathcal E_0=${Un(e0, 'V')}$, $\langle P\rangle=${P(Pm, 'W')}$, $\langle M\rangle=${P(Mm, 'N\\,m')}$.`,
          S`At steady state the average mechanical power equals the dissipated one: $\langle M\rangle=\langle P\rangle/\omega$. Results: $\mathcal E_0=${Un(e0, 'V')}$, $\langle P\rangle=${P(Pm, 'W')}$, $\langle M\rangle=${P(Mm, 'N\\,m')}$.`,
        ),
      ],
      answer: [
        { label: 'ℰ₀', value: e0, unit: 'V' },
        { label: '⟨P⟩', value: Pm, unit: 'W' },
        { label: '⟨M⟩', value: Mm, unit: 'N·m' },
      ],
      parametri: { N, a, B, f, R },
      valori: { w, e0, Pm, Mm },
    };
  },
});

defineTemplate({
  id: 'b4-toroide-l',
  blocco: 'b4',
  topic: 'campi-variabili',
  objectives: ['campi-variabili.3', 'campi-variabili.6'],
  tema: {
    it: 'Autoinduzione di un toroide a sezione quadrata',
    en: 'Self-inductance of a toroid with square cross-section',
  },
  make(r, { t, P, Un, cm, I_ }) {
    const Rm = step(r, 5, 15, 1) * 1e-2,
      a = step(r, 1, 3, 0.5) * 1e-2,
      N = step(r, 100, 800, 100),
      mur = step(r, 200, 2000, 200),
      I = step(r, 0.5, 3, 0.5);
    const L = ((MU0 * mur * N * N * a) / (2 * PI)) * Math.log((Rm + a / 2) / (Rm - a / 2)),
      U = 0.5 * L * I * I,
      Phi = L * I;
    return {
      statement: t(
        S`Un toroide di materiale con permeabilità relativa $\mu_r=${I_(mur)}$ ha sezione quadrata di lato $a=${cm(a)}$ e raggio medio $R=${cm(Rm)}$. Su di esso sono avvolte $N=${I_(N)}$ spire. Determinare: a) il coefficiente di autoinduzione; b) il flusso concatenato e l'energia magnetica quando nell'avvolgimento passa la corrente $I=${Un(I, 'A')}$.`,
        S`A toroid made of a material with relative permeability $\mu_r=${I_(mur)}$ has a square cross-section of side $a=${cm(a)}$ and mean radius $R=${cm(Rm)}$. $N=${I_(N)}$ turns are wound on it. Find: a) the self-inductance; b) the linked flux and the magnetic energy when the current $I=${Un(I, 'A')}$ flows in the winding.`,
      ),
      steps: [
        t(
          S`Per Ampère nel materiale $B(r)=\dfrac{\mu_0\mu_rNI}{2\pi r}$, con $r\in[R-a/2,\,R+a/2]$.`,
          S`By Ampère in the material $B(r)=\dfrac{\mu_0\mu_rNI}{2\pi r}$, with $r\in[R-a/2,\,R+a/2]$.`,
        ),
        t(
          S`Flusso in una spira: $\Phi_1=\int B\,a\,dr=\dfrac{\mu_0\mu_rNIa}{2\pi}\ln\dfrac{R+a/2}{R-a/2}$; flusso concatenato $\Phi=N\Phi_1=LI$.`,
          S`Flux through one turn: $\Phi_1=\int B\,a\,dr=\dfrac{\mu_0\mu_rNIa}{2\pi}\ln\dfrac{R+a/2}{R-a/2}$; linked flux $\Phi=N\Phi_1=LI$.`,
        ),
        t(
          S`$L=\dfrac{\mu_0\mu_rN^2a}{2\pi}\ln\dfrac{R+a/2}{R-a/2}$ e $U=\tfrac12LI^2$. Risultati: $L=${P(L, 'H')}$, $\Phi=${P(Phi, 'Wb')}$, $U=${P(U, 'J')}$.`,
          S`$L=\dfrac{\mu_0\mu_rN^2a}{2\pi}\ln\dfrac{R+a/2}{R-a/2}$ and $U=\tfrac12LI^2$. Results: $L=${P(L, 'H')}$, $\Phi=${P(Phi, 'Wb')}$, $U=${P(U, 'J')}$.`,
        ),
      ],
      answer: [
        { label: 'L', value: L, unit: 'H' },
        { label: 'Φ', value: Phi, unit: 'Wb' },
        { label: 'U', value: U, unit: 'J' },
      ],
      parametri: { R: Rm, a, N, mur, I },
      valori: { L, U, Phi },
    };
  },
});

defineTemplate({
  id: 'b4-rapporto-densita',
  blocco: 'b4',
  topic: 'campi-variabili',
  objectives: ['campi-variabili.2', 'campi-variabili.6'],
  tema: {
    it: 'Campi indotti in un solenoide: rapporto fra densità di energia',
    en: 'Induced fields in a solenoid: ratio of energy densities',
  },
  make(r, { t, P, Un, cm, sig, I_ }) {
    const n = step(r, 1000, 5000, 500),
      I0 = step(r, 1, 5, 0.5),
      tau = step(r, 0.1, 5, 0.1) * 1e-3,
      a = step(r, 1, 3, 0.5) * 1e-2,
      rr = a * pick(r, [0.5, 0.8]);
    const B0 = MU0 * n * I0,
      E0 = ((rr / 2) * MU0 * n * I0) / tau,
      ratio = (EPS0 * E0 * E0) / 2 / ((B0 * B0) / (2 * MU0));
    return {
      statement: t(
        S`In un solenoide molto lungo, di raggio $a=${cm(a)}$ e con $n=${I_(n)}\ \mathrm{spire/m}$, la corrente varia lentamente nel tempo come $I(t)=I_0e^{-t/\tau}$ con $I_0=${Un(I0, 'A')}$ e $\tau=${P(tau, 's')}$. Determinare, a $t=0$ e in un punto interno a distanza $r=${cm(rr)}$ dall'asse: a) il campo magnetico; b) il campo elettrico indotto (modulo); c) il rapporto fra la densità di energia elettrica e quella magnetica.`,
        S`In a very long solenoid of radius $a=${cm(a)}$ with $n=${I_(n)}\ \mathrm{turns/m}$, the current varies slowly in time as $I(t)=I_0e^{-t/\tau}$ with $I_0=${Un(I0, 'A')}$ and $\tau=${P(tau, 's')}$. Find, at $t=0$ and at an inner point at distance $r=${cm(rr)}$ from the axis: a) the magnetic field; b) the induced electric field (magnitude); c) the ratio between the electric and the magnetic energy densities.`,
      ),
      steps: [
        t(
          S`Campo magnetico (quasi stazionario): $B=\mu_0nI(t)$, uniforme dentro il solenoide.`,
          S`Magnetic field (quasi-steady): $B=\mu_0nI(t)$, uniform inside the solenoid.`,
        ),
        t(
          S`Faraday su una circonferenza di raggio $r$: $E\,2\pi r=-\pi r^2\dot B\Rightarrow E=\dfrac r2\,\mu_0n\,\dfrac{I_0}{\tau}e^{-t/\tau}$ (campo azimutale).`,
          S`Faraday on a circle of radius $r$: $E\,2\pi r=-\pi r^2\dot B\Rightarrow E=\dfrac r2\,\mu_0n\,\dfrac{I_0}{\tau}e^{-t/\tau}$ (azimuthal field).`,
        ),
        t(
          S`$\dfrac{u_E}{u_B}=\dfrac{\varepsilon_0E^2/2}{B^2/2\mu_0}=\varepsilon_0\mu_0\dfrac{E^2}{B^2}=\left(\dfrac{r}{2c\tau}\right)^2$: ben inferiore a 1, quindi nell'ipotesi quasi stazionaria l'energia elettrica è trascurabile. Risultati: $B=${P(B0, 'T')}$, $E=${Un(E0, 'V/m')}$, $u_E/u_B=${sig(ratio, 3)}$.`,
          S`$\dfrac{u_E}{u_B}=\dfrac{\varepsilon_0E^2/2}{B^2/2\mu_0}=\varepsilon_0\mu_0\dfrac{E^2}{B^2}=\left(\dfrac{r}{2c\tau}\right)^2$: far below 1, so in the quasi-steady approximation the electric energy is negligible. Results: $B=${P(B0, 'T')}$, $E=${Un(E0, 'V/m')}$, $u_E/u_B=${sig(ratio, 3)}$.`,
        ),
      ],
      answer: [
        { label: 'B', value: B0, unit: 'T' },
        { label: 'E', value: E0, unit: 'V/m' },
        { label: 'u_E/u_B', value: ratio },
      ],
      parametri: { n, I0, tau, a, r: rr },
      valori: { B0, E0, ratio, ratio_formula: (rr / (2 * C0 * tau)) ** 2 },
    };
  },
});
