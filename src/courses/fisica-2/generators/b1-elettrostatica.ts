/** Blocco 1 — Elettrostatica nel vuoto, conduttori, dielettrici (template del sito originale). */
import { defineTemplate, EPS0, K, PI, S, pick, step } from './lib';

defineTemplate({
  id: 'b1-sfera-rho-kr',
  blocco: 'b1',
  topic: 'elettrostatica-nel-vuoto',
  objectives: ['elettrostatica-nel-vuoto.4'],
  tema: { it: 'Campo di un guscio sferico con densità ρ = k·r', en: 'Field of a spherical shell with density ρ = k·r' },
  make(r, { t, P, Un, cm }) {
    const a = step(r, 0.02, 0.06, 0.01), b = +(a + step(r, 0.02, 0.05, 0.01)).toFixed(4), k = step(r, 1e-3, 6e-3, 0.5e-3);
    const r1 = a / 2, r2 = (a + b) / 2, r3 = 2 * b;
    const Qt = PI * k * (b ** 4 - a ** 4);
    const E = (x: number) => (x <= a ? 0 : x <= b ? (k * (x ** 4 - a ** 4)) / (4 * EPS0 * x * x) : Qt / (4 * PI * EPS0 * x * x));
    const v = { Q: Qt, E1: E(r1), E2: E(r2), E3: E(r3) };
    return {
      statement: t(
        S`Nel vuoto, fra due superfici sferiche concentriche di raggi $a=${cm(a)}$ (interna) e $b=${cm(b)}$ (esterna), è presente una carica con densità di volume $\rho(r)=k\,r$, dove $r$ è la distanza dal centro comune e $k=${Un(k, 'C/m^4')}$. Determinare: a) la carica totale $Q$; b) l'andamento di $E(r)$ nelle tre regioni dello spazio; c) il valore di $E$ nei punti $r_1=${cm(r1)}$, $r_2=${cm(r2)}$ e $r_3=${cm(r3)}$.`,
        S`In vacuum, between two concentric spherical surfaces of radii $a=${cm(a)}$ (inner) and $b=${cm(b)}$ (outer), there is a charge with volume density $\rho(r)=k\,r$, where $r$ is the distance from the common centre and $k=${Un(k, 'C/m^4')}$. Find: a) the total charge $Q$; b) the behaviour of $E(r)$ in the three regions of space; c) the value of $E$ at the points $r_1=${cm(r1)}$, $r_2=${cm(r2)}$ and $r_3=${cm(r3)}$.`,
      ),
      steps: [
        t(S`Per la simmetria sferica $\vec E=E(r)\,\hat r$ e il teorema di Gauss dà $E(r)\,4\pi r^2=Q_{int}(r)/\varepsilon_0$.`, S`By spherical symmetry $\vec E=E(r)\,\hat r$ and Gauss's theorem gives $E(r)\,4\pi r^2=Q_{int}(r)/\varepsilon_0$.`),
        t(S`Carica contenuta in una sfera di raggio $r$ con $a<r<b$: $Q_{int}=\int_a^r k r'\,4\pi r'^2\,dr'=\pi k\,(r^4-a^4)$. Per $r>b$: $Q=\pi k\,(b^4-a^4)$.`, S`Charge inside a sphere of radius $r$ with $a<r<b$: $Q_{int}=\int_a^r k r'\,4\pi r'^2\,dr'=\pi k\,(r^4-a^4)$. For $r>b$: $Q=\pi k\,(b^4-a^4)$.`),
        t(S`Quindi $E=0$ per $r<a$; $E=\dfrac{k\,(r^4-a^4)}{4\varepsilon_0 r^2}$ per $a<r<b$; $E=\dfrac{k\,(b^4-a^4)}{4\varepsilon_0 r^2}$ per $r>b$. Risultati: $Q=${P(v.Q, 'C')}$, $E(r_1)=0$, $E(r_2)=${Un(v.E2, 'V/m')}$, $E(r_3)=${Un(v.E3, 'V/m')}$.`, S`Hence $E=0$ for $r<a$; $E=\dfrac{k\,(r^4-a^4)}{4\varepsilon_0 r^2}$ for $a<r<b$; $E=\dfrac{k\,(b^4-a^4)}{4\varepsilon_0 r^2}$ for $r>b$. Results: $Q=${P(v.Q, 'C')}$, $E(r_1)=0$, $E(r_2)=${Un(v.E2, 'V/m')}$, $E(r_3)=${Un(v.E3, 'V/m')}$.`),
      ],
      answer: [
        { label: 'Q', value: v.Q, unit: 'C' },
        { label: 'E(r₂)', value: v.E2, unit: 'V/m' },
        { label: 'E(r₃)', value: v.E3, unit: 'V/m' },
      ],
      parametri: { a, b, k },
      valori: v,
    };
  },
});

defineTemplate({
  id: 'b1-cilindro-rho-ar',
  blocco: 'b1',
  topic: 'elettrostatica-nel-vuoto',
  objectives: ['elettrostatica-nel-vuoto.4', 'elettrostatica-nel-vuoto.6'],
  tema: { it: 'Cilindro indefinito con densità ρ = A·r', en: 'Infinite cylinder with density ρ = A·r' },
  make(r, { t, P, Un, cm }) {
    const R = step(r, 0.02, 0.08, 0.01), A = step(r, 1e-3, 6e-3, 0.5e-3);
    const Eint = (x: number) => (A * x * x) / (3 * EPS0), Eout = (x: number) => (A * R ** 3) / (3 * EPS0 * x);
    const dV = (A * R ** 3) / (9 * EPS0) + (A * R ** 3 * Math.log(2)) / (3 * EPS0);
    const v = { E_meta: Eint(R / 2), E_2R: Eout(2 * R), dV, lambda: (2 * PI * A * R ** 3) / 3 };
    return {
      statement: t(
        S`Un cilindro indefinito di raggio $R=${cm(R)}$, posto nel vuoto, contiene una carica con densità di volume $\rho=A\,r$, dove $r$ è la distanza dall'asse e $A=${Un(A, 'C/m^4')}$. Ricavare: a) il campo elettrico $E(r)$ dentro e fuori dal cilindro; b) i valori di $E$ a $r=R/2$ e $r=2R$; c) la differenza di potenziale $V(0)-V(2R)$ fra un punto dell'asse e un punto a distanza $2R$ dall'asse.`,
        S`An infinite cylinder of radius $R=${cm(R)}$, in vacuum, contains a charge with volume density $\rho=A\,r$, where $r$ is the distance from the axis and $A=${Un(A, 'C/m^4')}$. Derive: a) the electric field $E(r)$ inside and outside the cylinder; b) the values of $E$ at $r=R/2$ and $r=2R$; c) the potential difference $V(0)-V(2R)$ between a point on the axis and a point at distance $2R$ from the axis.`,
      ),
      steps: [
        t(S`Gauss su un cilindro coassiale di raggio $r$ e altezza $h$: $E\,2\pi r h=Q_{int}/\varepsilon_0$.`, S`Gauss on a coaxial cylinder of radius $r$ and height $h$: $E\,2\pi r h=Q_{int}/\varepsilon_0$.`),
        t(S`Per $r<R$: $Q_{int}/h=\int_0^r A r'\,2\pi r'\,dr'=\tfrac{2}{3}\pi A r^3$, quindi $E=\dfrac{A r^2}{3\varepsilon_0}$. Per $r>R$: $E=\dfrac{A R^3}{3\varepsilon_0 r}$.`, S`For $r<R$: $Q_{int}/h=\int_0^r A r'\,2\pi r'\,dr'=\tfrac{2}{3}\pi A r^3$, so $E=\dfrac{A r^2}{3\varepsilon_0}$. For $r>R$: $E=\dfrac{A R^3}{3\varepsilon_0 r}$.`),
        t(S`$V(0)-V(2R)=\int_0^R\dfrac{A r^2}{3\varepsilon_0}dr+\int_R^{2R}\dfrac{A R^3}{3\varepsilon_0 r}dr=\dfrac{A R^3}{9\varepsilon_0}\left(1+3\ln 2\right)$. Risultati: $E(R/2)=${Un(v.E_meta, 'V/m')}$, $E(2R)=${Un(v.E_2R, 'V/m')}$, $V(0)-V(2R)=${P(dV, 'V')}$.`, S`$V(0)-V(2R)=\int_0^R\dfrac{A r^2}{3\varepsilon_0}dr+\int_R^{2R}\dfrac{A R^3}{3\varepsilon_0 r}dr=\dfrac{A R^3}{9\varepsilon_0}\left(1+3\ln 2\right)$. Results: $E(R/2)=${Un(v.E_meta, 'V/m')}$, $E(2R)=${Un(v.E_2R, 'V/m')}$, $V(0)-V(2R)=${P(dV, 'V')}$.`),
      ],
      answer: [
        { label: 'E(R/2)', value: v.E_meta, unit: 'V/m' },
        { label: 'E(2R)', value: v.E_2R, unit: 'V/m' },
        { label: 'V(0) − V(2R)', value: dV, unit: 'V' },
      ],
      parametri: { R, A },
      valori: v,
    };
  },
});

defineTemplate({
  id: 'b1-anello-velocita',
  blocco: 'b1',
  topic: 'elettrostatica-nel-vuoto',
  objectives: ['elettrostatica-nel-vuoto.6'],
  tema: { it: 'Carica che attraversa il centro di un anello carico', en: 'Charge crossing the centre of a charged ring' },
  make(r, { t, P, Un, cm }) {
    const R = step(r, 0.03, 0.1, 0.01), lam = step(r, 5e-9, 20e-9, 1e-9), q = step(r, 1e-9, 5e-9, 0.5e-9), m = step(r, 1, 9, 1) * 1e-6;
    const V0 = lam / (2 * EPS0), v0 = Math.sqrt((q * lam) / (EPS0 * m));
    return {
      statement: t(
        S`Un anello sottile di raggio $R=${cm(R)}$ porta una carica distribuita uniformemente con densità lineare $\lambda=${P(lam, 'C/m')}$. Una particella puntiforme di carica $q=${P(q, 'C')}$ e massa $m=${Un(m * 1e6, 'mg')}$, che può scorrere soltanto sull'asse dell'anello, viene lanciata dall'infinito con velocità iniziale $v_0$. Calcolare: a) il potenziale al centro dell'anello; b) il valore minimo di $v_0$ affinché la particella superi il centro dell'anello ($z=0$).`,
        S`A thin ring of radius $R=${cm(R)}$ carries a uniformly distributed charge with linear density $\lambda=${P(lam, 'C/m')}$. A point particle of charge $q=${P(q, 'C')}$ and mass $m=${Un(m * 1e6, 'mg')}$, which can only slide along the axis of the ring, is launched from infinity with initial speed $v_0$. Compute: a) the potential at the centre of the ring; b) the minimum value of $v_0$ for the particle to get past the centre of the ring ($z=0$).`,
      ),
      steps: [
        t(S`Sull'asse $V(z)=\dfrac{1}{4\pi\varepsilon_0}\dfrac{Q}{\sqrt{R^2+z^2}}$ con $Q=2\pi R\lambda$; al centro $V(0)=\dfrac{\lambda}{2\varepsilon_0}$.`, S`On the axis $V(z)=\dfrac{1}{4\pi\varepsilon_0}\dfrac{Q}{\sqrt{R^2+z^2}}$ with $Q=2\pi R\lambda$; at the centre $V(0)=\dfrac{\lambda}{2\varepsilon_0}$.`),
        t(S`Le cariche sono dello stesso segno: la particella è respinta e serve $\tfrac12 m v_0^2\ge q\,V(0)$ (il potenziale è massimo in $z=0$).`, S`The charges have the same sign: the particle is repelled and one needs $\tfrac12 m v_0^2\ge q\,V(0)$ (the potential is maximum at $z=0$).`),
        t(S`$v_{0,min}=\sqrt{\dfrac{2qV(0)}{m}}=\sqrt{\dfrac{q\lambda}{\varepsilon_0 m}}$, indipendente da $R$. Risultati: $V(0)=${P(V0, 'V')}$, $v_{0,min}=${Un(v0, 'm/s')}$.`, S`$v_{0,min}=\sqrt{\dfrac{2qV(0)}{m}}=\sqrt{\dfrac{q\lambda}{\varepsilon_0 m}}$, independent of $R$. Results: $V(0)=${P(V0, 'V')}$, $v_{0,min}=${Un(v0, 'm/s')}$.`),
      ],
      answer: [
        { label: 'V(0)', value: V0, unit: 'V' },
        { label: 'v₀,min', value: v0, unit: 'm/s' },
      ],
      parametri: { R, lam, q, m },
      valori: { V0, v0 },
    };
  },
});

defineTemplate({
  id: 'b1-filo-finito',
  blocco: 'b1',
  topic: 'elettrostatica-nel-vuoto',
  objectives: ['elettrostatica-nel-vuoto.2'],
  tema: { it: 'Campo di un filo rettilineo finito carico', en: 'Field of a charged finite straight wire' },
  make(r, { t, P, Un, cm }) {
    const L = step(r, 0.1, 0.4, 0.05), Q = step(r, 2e-9, 10e-9, 1e-9), f = pick(r, [0.5, 1, 2]), D = f * L;
    const lam = Q / L, w = Math.sqrt(D * D + L * L);
    const Ex = (K * lam * L) / (D * w), Ey = -K * lam * (1 / D - 1 / w);
    const v = { Ex, Ey, E: Math.hypot(Ex, Ey) };
    return {
      statement: t(
        S`Un segmento rettilineo lungo $L=${cm(L)}$ giace sull'asse $y$ con un estremo in $O$ e porta una carica totale $Q=${P(Q, 'C')}$ ripartita con densità costante. Calcolare le componenti $E_x$ ed $E_y$ del campo elettrico nel punto $P=(D,0)$, con $D=${cm(D)}$, e il modulo di $\vec E$ in $P$.`,
        S`A straight segment of length $L=${cm(L)}$ lies on the $y$ axis with one end at $O$ and carries a total charge $Q=${P(Q, 'C')}$ spread with constant density. Compute the components $E_x$ and $E_y$ of the electric field at the point $P=(D,0)$, with $D=${cm(D)}$, and the magnitude of $\vec E$ at $P$.`,
      ),
      steps: [
        t(S`Elemento $dq=\lambda\,dy'$ in $(0,y')$, con $\lambda=Q/L$. La distanza da $P$ è $\sqrt{D^2+y'^2}$.`, S`Element $dq=\lambda\,dy'$ at $(0,y')$, with $\lambda=Q/L$. Its distance from $P$ is $\sqrt{D^2+y'^2}$.`),
        S`$E_x=\dfrac{\lambda}{4\pi\varepsilon_0}\int_0^L\dfrac{D\,dy'}{(D^2+y'^2)^{3/2}}=\dfrac{\lambda}{4\pi\varepsilon_0}\dfrac{L}{D\sqrt{D^2+L^2}}$.`,
        t(S`$E_y=-\dfrac{\lambda}{4\pi\varepsilon_0}\int_0^L\dfrac{y'\,dy'}{(D^2+y'^2)^{3/2}}=-\dfrac{\lambda}{4\pi\varepsilon_0}\left(\dfrac1D-\dfrac{1}{\sqrt{D^2+L^2}}\right)$ (verso $-y$ per $Q>0$). Risultati: $E_x=${Un(Ex, 'V/m')}$, $E_y=${Un(Ey, 'V/m')}$, $|\vec E|=${Un(v.E, 'V/m')}$.`, S`$E_y=-\dfrac{\lambda}{4\pi\varepsilon_0}\int_0^L\dfrac{y'\,dy'}{(D^2+y'^2)^{3/2}}=-\dfrac{\lambda}{4\pi\varepsilon_0}\left(\dfrac1D-\dfrac{1}{\sqrt{D^2+L^2}}\right)$ (towards $-y$ for $Q>0$). Results: $E_x=${Un(Ex, 'V/m')}$, $E_y=${Un(Ey, 'V/m')}$, $|\vec E|=${Un(v.E, 'V/m')}$.`),
      ],
      answer: [
        { label: 'Eₓ', value: Ex, unit: 'V/m' },
        { label: 'E_y', value: Ey, unit: 'V/m' },
        { label: '|E|', value: v.E, unit: 'V/m' },
      ],
      parametri: { L, Q, D },
      valori: v,
    };
  },
});

defineTemplate({
  id: 'b1-condensatore-cilindrico',
  blocco: 'b1',
  topic: 'dielettrici',
  objectives: ['dielettrici.6', 'dielettrici.7'],
  tema: { it: 'Condensatore cilindrico con dielettrico: massima tensione ed energia', en: 'Cylindrical capacitor with dielectric: maximum voltage and energy' },
  make(r, { t, P, Un, mm, sig }) {
    const R1 = step(r, 0.002, 0.006, 0.001), R2 = R1 * step(r, 2, 5, 0.5), L = step(r, 0.5, 2, 0.25), er = step(r, 2, 6, 0.5), Ed = step(r, 10, 40, 5) * 1e6;
    const lnR = Math.log(R2 / R1), C = (2 * PI * EPS0 * er * L) / lnR, Vmax = Ed * R1 * lnR, Umax = 0.5 * C * Vmax ** 2;
    const v = { C, Vmax, Qmax: C * Vmax, Umax };
    return {
      statement: t(
        S`Un condensatore cilindrico ha raggio interno $R_1=${mm(R1)}$, raggio esterno $R_2=${mm(R2)}$ e lunghezza $L=${Un(L, 'm')}$ ($L\gg R_2$: si trascurano gli effetti di bordo). Il volume fra le armature è occupato per intero da un isolante con permittività relativa $\varepsilon_r=${sig(er, 2)}$, che si perfora se il campo supera $E_d=${Un(Ed / 1e6, 'MV/m')}$. Calcolare: a) la capacità; b) la massima tensione applicabile; c) la massima energia elettrostatica immagazzinabile.`,
        S`A cylindrical capacitor has inner radius $R_1=${mm(R1)}$, outer radius $R_2=${mm(R2)}$ and length $L=${Un(L, 'm')}$ ($L\gg R_2$: edge effects are neglected). The volume between the plates is entirely filled with an insulator of relative permittivity $\varepsilon_r=${sig(er, 2)}$, which breaks down if the field exceeds $E_d=${Un(Ed / 1e6, 'MV/m')}$. Compute: a) the capacitance; b) the maximum voltage that can be applied; c) the maximum electrostatic energy that can be stored.`,
      ),
      steps: [
        t(S`Con carica per unità di lunghezza $\lambda$: $E(r)=\dfrac{\lambda}{2\pi\varepsilon_0\varepsilon_r r}$, massimo in $r=R_1$.`, S`With charge per unit length $\lambda$: $E(r)=\dfrac{\lambda}{2\pi\varepsilon_0\varepsilon_r r}$, maximum at $r=R_1$.`),
        t(S`$V=\dfrac{\lambda}{2\pi\varepsilon_0\varepsilon_r}\ln\dfrac{R_2}{R_1}$, quindi $C=\dfrac{2\pi\varepsilon_0\varepsilon_r L}{\ln(R_2/R_1)}$.`, S`$V=\dfrac{\lambda}{2\pi\varepsilon_0\varepsilon_r}\ln\dfrac{R_2}{R_1}$, hence $C=\dfrac{2\pi\varepsilon_0\varepsilon_r L}{\ln(R_2/R_1)}$.`),
        t(S`Il limite è $E(R_1)\le E_d$: $V_{max}=E_d R_1\ln\dfrac{R_2}{R_1}$ e $U_{max}=\tfrac12 C V_{max}^2$. Risultati: $C=${P(C, 'F')}$, $V_{max}=${P(Vmax, 'V')}$, $U_{max}=${P(Umax, 'J')}$.`, S`The limit is $E(R_1)\le E_d$: $V_{max}=E_d R_1\ln\dfrac{R_2}{R_1}$ and $U_{max}=\tfrac12 C V_{max}^2$. Results: $C=${P(C, 'F')}$, $V_{max}=${P(Vmax, 'V')}$, $U_{max}=${P(Umax, 'J')}$.`),
      ],
      answer: [
        { label: 'C', value: C, unit: 'F' },
        { label: 'V_max', value: Vmax, unit: 'V' },
        { label: 'U_max', value: Umax, unit: 'J' },
      ],
      parametri: { R1, R2, L, er, Ed },
      valori: v,
    };
  },
});

defineTemplate({
  id: 'b1-piano-serie',
  blocco: 'b1',
  topic: 'dielettrici',
  objectives: ['dielettrici.4', 'dielettrici.6'],
  tema: { it: 'Condensatore piano con due strati dielettrici', en: 'Parallel-plate capacitor with two dielectric layers' },
  make(r, { t, P, Un, mm, sig }) {
    const S0 = step(r, 100, 400, 50) * 1e-4, d1 = step(r, 1, 5, 0.5) * 1e-3, d2 = step(r, 1, 5, 0.5) * 1e-3;
    const e1 = step(r, 2, 8, 1), e2 = e1 + step(r, 1, 4, 1), Q = step(r, 5, 50, 5) * 1e-9;
    const C = (EPS0 * S0) / (d1 / e1 + d2 / e2), dV = Q / C, E1 = Q / (EPS0 * e1 * S0), E2 = Q / (EPS0 * e2 * S0), U = (Q * Q) / (2 * C);
    const v = { C, dV, E1, E2, U };
    return {
      statement: t(
        S`Fra le armature, ciascuna di area $S=${Un(S0 * 1e4, 'cm^2')}$, di un condensatore piano sono sovrapposte due lastre dielettriche parallele alle armature: la prima, spessa $d_1=${mm(d1)}$, ha $\varepsilon_{r1}=${sig(e1, 2)}$; la seconda, spessa $d_2=${mm(d2)}$, ha $\varepsilon_{r2}=${sig(e2, 2)}$. Le armature portano cariche $\pm Q$ con $Q=${P(Q, 'C')}$. Calcolare: a) la capacità; b) la differenza di potenziale fra le armature; c) il campo elettrico in ciascuno strato; d) l'energia immagazzinata.`,
        S`Between the plates, each of area $S=${Un(S0 * 1e4, 'cm^2')}$, of a parallel-plate capacitor two dielectric slabs parallel to the plates are stacked: the first, $d_1=${mm(d1)}$ thick, has $\varepsilon_{r1}=${sig(e1, 2)}$; the second, $d_2=${mm(d2)}$ thick, has $\varepsilon_{r2}=${sig(e2, 2)}$. The plates carry charges $\pm Q$ with $Q=${P(Q, 'C')}$. Compute: a) the capacitance; b) the potential difference between the plates; c) the electric field in each layer; d) the stored energy.`,
      ),
      steps: [
        t(S`$D=\sigma=Q/S$ si conserva attraversando l'interfaccia (normale alle armature): $E_i=\dfrac{Q}{\varepsilon_0\varepsilon_{ri}S}$.`, S`$D=\sigma=Q/S$ is conserved across the interface (normal to the plates): $E_i=\dfrac{Q}{\varepsilon_0\varepsilon_{ri}S}$.`),
        t(S`$\Delta V=E_1d_1+E_2d_2=\dfrac{Q}{\varepsilon_0 S}\left(\dfrac{d_1}{\varepsilon_{r1}}+\dfrac{d_2}{\varepsilon_{r2}}\right)$ (due condensatori in serie).`, S`$\Delta V=E_1d_1+E_2d_2=\dfrac{Q}{\varepsilon_0 S}\left(\dfrac{d_1}{\varepsilon_{r1}}+\dfrac{d_2}{\varepsilon_{r2}}\right)$ (two capacitors in series).`),
        t(S`$C=Q/\Delta V=\dfrac{\varepsilon_0 S}{d_1/\varepsilon_{r1}+d_2/\varepsilon_{r2}}$ e $U=\dfrac{Q^2}{2C}$. Risultati: $C=${P(C, 'F')}$, $\Delta V=${P(dV, 'V')}$, $E_1=${Un(E1, 'V/m')}$, $E_2=${Un(E2, 'V/m')}$, $U=${P(U, 'J')}$.`, S`$C=Q/\Delta V=\dfrac{\varepsilon_0 S}{d_1/\varepsilon_{r1}+d_2/\varepsilon_{r2}}$ and $U=\dfrac{Q^2}{2C}$. Results: $C=${P(C, 'F')}$, $\Delta V=${P(dV, 'V')}$, $E_1=${Un(E1, 'V/m')}$, $E_2=${Un(E2, 'V/m')}$, $U=${P(U, 'J')}$.`),
      ],
      answer: [
        { label: 'C', value: C, unit: 'F' },
        { label: 'ΔV', value: dV, unit: 'V' },
        { label: 'E₁', value: E1, unit: 'V/m' },
        { label: 'E₂', value: E2, unit: 'V/m' },
        { label: 'U', value: U, unit: 'J' },
      ],
      parametri: { S: S0, d1, d2, e1, e2, Q },
      valori: v,
    };
  },
});

defineTemplate({
  id: 'b1-piano-parallelo',
  blocco: 'b1',
  topic: 'dielettrici',
  objectives: ['dielettrici.5', 'dielettrici.6'],
  tema: { it: 'Condensatore piano riempito per metà da due dielettrici', en: 'Parallel-plate capacitor half-filled with two dielectrics' },
  make(r, { t, P, Un, mm, sig }) {
    const S0 = step(r, 100, 400, 50) * 1e-4, d = step(r, 1, 5, 0.5) * 1e-3, e1 = step(r, 2, 6, 1), e2 = e1 + step(r, 1, 4, 1), V = step(r, 10, 100, 10);
    const E = V / d, s1 = EPS0 * e1 * E, s2 = EPS0 * e2 * E, C = (EPS0 * (S0 / 2) * (e1 + e2)) / d, Q = C * V;
    const v = { E, s1, s2, C, Q };
    return {
      statement: t(
        S`Un condensatore piano ha armature quadrate di area $S=${Un(S0 * 1e4, 'cm^2')}$ poste a distanza $d=${mm(d)}$. Lo spazio fra di esse è diviso in due metà affiancate (ciascuna occupa metà dell'area): una contiene un dielettrico con $\varepsilon_{r1}=${sig(e1, 2)}$, l'altra un dielettrico con $\varepsilon_{r2}=${sig(e2, 2)}$. Fra le armature è applicata la differenza di potenziale $V=${Un(V, 'V')}$. Calcolare: 1) il campo elettrostatico; 2) le densità di carica libera sulle due metà dell'armatura; 3) la capacità e la carica totale.`,
        S`A parallel-plate capacitor has square plates of area $S=${Un(S0 * 1e4, 'cm^2')}$ at distance $d=${mm(d)}$. The space between them is split into two side-by-side halves (each occupying half of the area): one contains a dielectric with $\varepsilon_{r1}=${sig(e1, 2)}$, the other a dielectric with $\varepsilon_{r2}=${sig(e2, 2)}$. A potential difference $V=${Un(V, 'V')}$ is applied between the plates. Compute: 1) the electrostatic field; 2) the free charge densities on the two halves of the plate; 3) the capacitance and the total charge.`,
      ),
      steps: [
        t(S`Le armature sono equipotenziali e $\vec E$ è tangente all'interfaccia fra i due materiali, quindi $E_1=E_2=E=V/d$ (stessa componente tangenziale).`, S`The plates are equipotential and $\vec E$ is tangent to the interface between the two materials, so $E_1=E_2=E=V/d$ (same tangential component).`),
        t(S`$\sigma_i=D_i=\varepsilon_0\varepsilon_{ri}E$ sulla metà $i$ dell'armatura.`, S`$\sigma_i=D_i=\varepsilon_0\varepsilon_{ri}E$ on half $i$ of the plate.`),
        t(S`$Q=\sigma_1\tfrac{S}{2}+\sigma_2\tfrac{S}{2}$, cioè $C=\dfrac{\varepsilon_0 S}{2d}(\varepsilon_{r1}+\varepsilon_{r2})$ (due condensatori in parallelo). Risultati: $E=${Un(E, 'V/m')}$, $\sigma_1=${Un(s1, 'C/m^2')}$, $\sigma_2=${Un(s2, 'C/m^2')}$, $C=${P(C, 'F')}$, $Q=${P(Q, 'C')}$.`, S`$Q=\sigma_1\tfrac{S}{2}+\sigma_2\tfrac{S}{2}$, that is $C=\dfrac{\varepsilon_0 S}{2d}(\varepsilon_{r1}+\varepsilon_{r2})$ (two capacitors in parallel). Results: $E=${Un(E, 'V/m')}$, $\sigma_1=${Un(s1, 'C/m^2')}$, $\sigma_2=${Un(s2, 'C/m^2')}$, $C=${P(C, 'F')}$, $Q=${P(Q, 'C')}$.`),
      ],
      answer: [
        { label: 'E', value: E, unit: 'V/m' },
        { label: 'σ₁', value: s1, unit: 'C/m²' },
        { label: 'σ₂', value: s2, unit: 'C/m²' },
        { label: 'C', value: C, unit: 'F' },
        { label: 'Q', value: Q, unit: 'C' },
      ],
      parametri: { S: S0, d, e1, e2, V },
      valori: v,
    };
  },
});

defineTemplate({
  id: 'b1-conduttori-sferici',
  blocco: 'b1',
  topic: 'conduttori-capacita',
  objectives: ['conduttori-capacita.2', 'conduttori-capacita.5'],
  tema: { it: 'Conduttori sferici concentrici collegati da un filo', en: 'Concentric spherical conductors joined by a wire' },
  make(r, { t, P, cm }) {
    const R1 = step(r, 0.02, 0.04, 0.005), R2 = R1 + step(r, 0.02, 0.04, 0.005), R3 = R2 + step(r, 0.01, 0.02, 0.005);
    const Q1 = step(r, 2, 10, 1) * 1e-9, Q2 = pick(r, [-1, 1]) * step(r, 2, 8, 1) * 1e-9, Qt = Q1 + Q2;
    const V1i = K * (Q1 / R1 - Q1 / R2 + Qt / R3), Vf = (K * Qt) / R3, Wd = ((K * Q1 * Q1) / 2) * (1 / R1 - 1 / R2);
    const v = { V1i, Vf, Qext: Qt, Wd };
    return {
      statement: t(
        S`Una sfera conduttrice di raggio $R_1=${cm(R1)}$ e carica $Q_1=${P(Q1, 'C')}$ occupa il centro della cavità di un conduttore sferico cavo, con raggio interno $R_2=${cm(R2)}$ e raggio esterno $R_3=${cm(R3)}$, la cui carica complessiva è $Q_2=${P(Q2, 'C')}$. Calcolare: a) il potenziale della sfera interna; b) le cariche sulla sfera interna, sulla superficie interna e su quella esterna del guscio dopo che sfera e guscio vengono collegati con un filo conduttore; c) il potenziale finale; d) l'energia dissipata nel processo.`,
        S`A conducting sphere of radius $R_1=${cm(R1)}$ and charge $Q_1=${P(Q1, 'C')}$ sits at the centre of the cavity of a hollow spherical conductor, with inner radius $R_2=${cm(R2)}$ and outer radius $R_3=${cm(R3)}$, whose total charge is $Q_2=${P(Q2, 'C')}$. Compute: a) the potential of the inner sphere; b) the charges on the inner sphere, on the inner surface and on the outer surface of the shell after the sphere and the shell are joined by a conducting wire; c) the final potential; d) the energy dissipated in the process.`,
      ),
      steps: [
        t(S`Prima del collegamento: induzione completa, quindi $-Q_1$ sulla superficie interna del guscio e $Q_1+Q_2$ su quella esterna. $V_1=K\left[\dfrac{Q_1}{R_1}-\dfrac{Q_1}{R_2}+\dfrac{Q_1+Q_2}{R_3}\right]$.`, S`Before the connection: complete induction, so $-Q_1$ on the inner surface of the shell and $Q_1+Q_2$ on the outer one. $V_1=K\left[\dfrac{Q_1}{R_1}-\dfrac{Q_1}{R_2}+\dfrac{Q_1+Q_2}{R_3}\right]$.`),
        t(S`Dopo il collegamento sfera e guscio formano un unico conduttore: dentro la cavità non c'è campo, quindi sulla sfera e sulla superficie interna la carica è 0 e tutta la carica $Q_1+Q_2$ sta sulla superficie esterna; $V_f=K\dfrac{Q_1+Q_2}{R_3}$.`, S`After the connection sphere and shell form a single conductor: there is no field inside the cavity, so the charge on the sphere and on the inner surface is 0 and all the charge $Q_1+Q_2$ lies on the outer surface; $V_f=K\dfrac{Q_1+Q_2}{R_3}$.`),
        t(S`L'energia fuori dal guscio non cambia; si perde l'energia del campo nella cavità: $W_d=\dfrac{K Q_1^2}{2}\left(\dfrac1{R_1}-\dfrac1{R_2}\right)$. Risultati: $V_1=${P(V1i, 'V')}$, $q_{ext}=${P(Qt, 'C')}$, $V_f=${P(Vf, 'V')}$, $W_d=${P(Wd, 'J')}$.`, S`The energy outside the shell does not change; the energy of the field in the cavity is lost: $W_d=\dfrac{K Q_1^2}{2}\left(\dfrac1{R_1}-\dfrac1{R_2}\right)$. Results: $V_1=${P(V1i, 'V')}$, $q_{ext}=${P(Qt, 'C')}$, $V_f=${P(Vf, 'V')}$, $W_d=${P(Wd, 'J')}$.`),
      ],
      answer: [
        { label: 'V₁', value: V1i, unit: 'V' },
        { label: 'q_ext', value: Qt, unit: 'C' },
        { label: 'V_f', value: Vf, unit: 'V' },
        { label: 'W_d', value: Wd, unit: 'J' },
      ],
      parametri: { R1, R2, R3, Q1, Q2 },
      valori: v,
    };
  },
});

defineTemplate({
  id: 'b1-lavoro-anello-asse',
  blocco: 'b1',
  topic: 'elettrostatica-nel-vuoto',
  objectives: ['elettrostatica-nel-vuoto.6'],
  tema: { it: "Lavoro per spostare una carica dal centro di un anello a un punto dell'asse", en: 'Work to move a charge from the centre of a ring to a point on its axis' },
  make(r, { t, P, cm }) {
    const R = step(r, 0.03, 0.08, 0.01), q = step(r, 2, 10, 1) * 1e-9, Qp = step(r, 1, 5, 1) * 1e-9, m = pick(r, [Math.sqrt(3), 2, 3]);
    const d = m * R, W = K * q * Qp * (1 / Math.sqrt(R * R + d * d) - 1 / R);
    const mTxt = m === Math.sqrt(3) ? S`\sqrt3` : String(m);
    return {
      statement: t(
        S`Una carica $q=${P(q, 'C')}$ è distribuita uniformemente su una circonferenza di raggio $R=${cm(R)}$, nel vuoto. Nel centro $O$ si trova una carica puntiforme $Q=${P(Qp, 'C')}$. Calcolare il lavoro che deve compiere un agente esterno per portare $Q$, molto lentamente, da $O$ a un punto $P$ sull'asse della circonferenza a distanza $d=${mTxt}\,R=${cm(d)}$ da $O$.`,
        S`A charge $q=${P(q, 'C')}$ is uniformly distributed on a circle of radius $R=${cm(R)}$, in vacuum. A point charge $Q=${P(Qp, 'C')}$ sits at the centre $O$. Compute the work an external agent must do to bring $Q$, very slowly, from $O$ to a point $P$ on the axis of the circle at distance $d=${mTxt}\,R=${cm(d)}$ from $O$.`,
      ),
      steps: [
        t(S`Sull'asse $V(z)=\dfrac{q}{4\pi\varepsilon_0\sqrt{R^2+z^2}}$; in $O$: $V(O)=\dfrac{q}{4\pi\varepsilon_0 R}$.`, S`On the axis $V(z)=\dfrac{q}{4\pi\varepsilon_0\sqrt{R^2+z^2}}$; at $O$: $V(O)=\dfrac{q}{4\pi\varepsilon_0 R}$.`),
        t(S`Il lavoro esterno è $W=Q\,[V(P)-V(O)]=\dfrac{qQ}{4\pi\varepsilon_0}\left(\dfrac{1}{\sqrt{R^2+d^2}}-\dfrac1R\right)$.`, S`The external work is $W=Q\,[V(P)-V(O)]=\dfrac{qQ}{4\pi\varepsilon_0}\left(\dfrac{1}{\sqrt{R^2+d^2}}-\dfrac1R\right)$.`),
        t(S`Il segno negativo indica che è il campo a compiere lavoro (le cariche sono dello stesso segno e si respingono). Risultato: $W=${P(W, 'J')}$.`, S`The negative sign means that it is the field that does the work (the charges have the same sign and repel). Result: $W=${P(W, 'J')}$.`),
      ],
      answer: [{ label: 'W', value: W, unit: 'J' }],
      parametri: { R, q, Q: Qp, d },
      valori: { W },
    };
  },
});
