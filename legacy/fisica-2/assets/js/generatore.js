/* Generatore di esercizi e prove di Fisica Generale II.
 *
 * Non contiene testi d'esame di terzi: ogni esercizio è un TEMPLATE scritto per questo sito, con parametri casuali
 * (riproducibili da un seme) e soluzione calcolata. I template ricalcano la TIPOLOGIA degli appelli passati
 * (stessi blocchi di programma, stesse grandezze richieste, stesso livello), non i loro testi né i loro dati.
 * La composizione di una prova (quanti esercizi per blocco, quante domande di teoria) segue le strutture degli
 * appelli registrate in data/appelli.json.
 *
 * Uso in browser:  Generatore.generaEsercizio(seme, 'b3')   Generatore.generaProva(seme, appelli, 'misto')
 * Uso in Node:     const G = require('./generatore.js')    (vedi tools/genera-prova.mjs e tests/generatore.test.mjs)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Generatore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const S = String.raw;
  const EPS0 = 8.8541878128e-12, MU0 = 4e-7 * Math.PI, C0 = 299792458, K = 1 / (4 * Math.PI * EPS0);
  const PI = Math.PI;

  /* ---------- numeri casuali riproducibili ---------- */
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  /* valore "tondo" in [a, b] con passo s */
  const step = (r, a, b, s) => +(a + s * Math.floor(r() * (Math.round((b - a) / s) + 1))).toFixed(10);
  const shuffle = (r, arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- formattazione in TeX ---------- */
  const dec = (s) => s.replace('.', '{,}');
  function sig(x, n = 3) {
    if (x === 0) return '0';
    const a = Math.abs(x);
    if (a >= 1e4 || a < 1e-2) {
      let e = Math.floor(Math.log10(a));
      let m = x / Math.pow(10, e);
      let ms = m.toPrecision(n);
      if (Math.abs(parseFloat(ms)) >= 10) { e += 1; m = x / Math.pow(10, e); ms = m.toPrecision(n); }
      return dec(ms) + S`\times10^{${e}}`;
    }
    const dp = Math.max(0, n - 1 - Math.floor(Math.log10(a)));
    return dec(x.toFixed(dp));
  }
  const PREF = [[1e-12, 'p'], [1e-9, 'n'], [1e-6, S`\mu `], [1e-3, 'm'], [1, ''], [1e3, 'k'], [1e6, 'M'], [1e9, 'G']];
  /* grandezza con prefisso SI adatto: P(2.5e-9,'C') → 2{,}50\,\mathrm{nC} */
  function P(x, unit, n = 3) {
    if (x === 0) return S`0\,\mathrm{${unit}}`;
    const a = Math.abs(x);
    let best = PREF[4];
    for (const p of PREF) if (a >= p[0] * 0.99999) best = p;
    return `${sig(x / best[0], n)}\\,\\mathrm{${best[1]}${unit}}`;
  }
  /* grandezza senza prefisso (utile per unità composte) */
  const Un = (x, unit, n = 3) => `${sig(x, n)}\\,\\mathrm{${unit}}`;
  const trim = (t) => (t.includes('{,}') ? t.replace(/0+$/, '').replace(/\{,\}$/, '') : t);
  const cm = (x) => `${trim(sig(x * 100, 3))}\\,\\mathrm{cm}`;
  const mm = (x) => `${trim(sig(x * 1000, 3))}\\,\\mathrm{mm}`;
  const I_ = (x) => String(Math.round(x));
  const ang = (rad) => `${sig(rad * 180 / PI, 3)}^\\circ`;

  /* ---------- registro dei template ---------- */
  const T = {};
  function def(id, blocco, tema, fn) { T[id] = { id, blocco, tema, fn }; }

  /* =====================================================================
   * BLOCCO 1 — Elettrostatica nel vuoto, conduttori, dielettrici
   * ===================================================================== */

  def('b1-sfera-rho-kr', 'b1', 'Campo di un guscio sferico con densità ρ = k·r', (r) => {
    const a = step(r, 0.02, 0.06, 0.01), b = +(a + step(r, 0.02, 0.05, 0.01)).toFixed(4), k = step(r, 1e-3, 6e-3, 0.5e-3);
    const r1 = a / 2, r2 = (a + b) / 2, r3 = 2 * b;
    const Qt = PI * k * (b ** 4 - a ** 4);
    const Ein = (x) => (x <= a ? 0 : x <= b ? k * (x ** 4 - a ** 4) / (4 * EPS0 * x * x) : Qt / (4 * PI * EPS0 * x * x));
    const v = { Q: Qt, E1: Ein(r1), E2: Ein(r2), E3: Ein(r3) };
    return {
      testo: S`Nel vuoto, fra due superfici sferiche concentriche di raggi $a=${cm(a)}$ (interna) e $b=${cm(b)}$ (esterna), è presente una carica con densità di volume $\rho(r)=k\,r$, dove $r$ è la distanza dal centro comune e $k=${Un(k, 'C/m^4')}$. Determinare: a) la carica totale $Q$; b) l'andamento di $E(r)$ nelle tre regioni dello spazio; c) il valore di $E$ nei punti $r_1=${cm(r1)}$, $r_2=${cm(r2)}$ e $r_3=${cm(r3)}$.`,
      passi: [
        S`Per la simmetria sferica $\vec E=E(r)\,\hat r$ e il teorema di Gauss dà $E(r)\,4\pi r^2=Q_{int}(r)/\varepsilon_0$.`,
        S`Carica contenuta in una sfera di raggio $r$ con $a<r<b$: $Q_{int}=\int_a^r k r'\,4\pi r'^2\,dr'=\pi k\,(r^4-a^4)$. Per $r>b$: $Q=\pi k\,(b^4-a^4)$.`,
        S`Quindi $E=0$ per $r<a$; $E=\dfrac{k\,(r^4-a^4)}{4\varepsilon_0 r^2}$ per $a<r<b$; $E=\dfrac{k\,(b^4-a^4)}{4\varepsilon_0 r^2}$ per $r>b$.`,
      ],
      risultati: [S`Q=${P(v.Q, 'C')}`, S`E(r_1)=0`, S`E(r_2)=${Un(v.E2, 'V/m')}`, S`E(r_3)=${Un(v.E3, 'V/m')}`],
      parametri: { a, b, k }, valori: v,
    };
  });

  def('b1-cilindro-rho-Ar', 'b1', 'Cilindro indefinito con densità ρ = A·r', (r) => {
    const R = step(r, 0.02, 0.08, 0.01), A = step(r, 1e-3, 6e-3, 0.5e-3);
    const Eint = (x) => A * x * x / (3 * EPS0), Eout = (x) => A * R ** 3 / (3 * EPS0 * x);
    const dV = A * R ** 3 / (9 * EPS0) + A * R ** 3 * Math.log(2) / (3 * EPS0);
    const v = { E_meta: Eint(R / 2), E_2R: Eout(2 * R), dV, lambda: 2 * PI * A * R ** 3 / 3 };
    return {
      testo: S`Un cilindro indefinito di raggio $R=${cm(R)}$, posto nel vuoto, contiene una carica con densità di volume $\rho=A\,r$, dove $r$ è la distanza dall'asse e $A=${Un(A, 'C/m^4')}$. Ricavare: a) il campo elettrico $E(r)$ dentro e fuori dal cilindro; b) i valori di $E$ a $r=R/2$ e $r=2R$; c) la differenza di potenziale $V(0)-V(2R)$ fra un punto dell'asse e un punto a distanza $2R$ dall'asse.`,
      passi: [
        S`Gauss su un cilindro coassiale di raggio $r$ e altezza $h$: $E\,2\pi r h=Q_{int}/\varepsilon_0$.`,
        S`Per $r<R$: $Q_{int}/h=\int_0^r A r'\,2\pi r'\,dr'=\tfrac{2}{3}\pi A r^3$, quindi $E=\dfrac{A r^2}{3\varepsilon_0}$. Per $r>R$: $E=\dfrac{A R^3}{3\varepsilon_0 r}$.`,
        S`$V(0)-V(2R)=\int_0^R\dfrac{A r^2}{3\varepsilon_0}dr+\int_R^{2R}\dfrac{A R^3}{3\varepsilon_0 r}dr=\dfrac{A R^3}{9\varepsilon_0}\left(1+3\ln 2\right)$.`,
      ],
      risultati: [S`E(R/2)=${Un(v.E_meta, 'V/m')}`, S`E(2R)=${Un(v.E_2R, 'V/m')}`, S`V(0)-V(2R)=${P(v.dV, 'V')}`],
      parametri: { R, A }, valori: v,
    };
  });

  def('b1-anello-velocita', 'b1', 'Carica che attraversa il centro di un anello carico', (r) => {
    const R = step(r, 0.03, 0.10, 0.01), lam = step(r, 5e-9, 20e-9, 1e-9), q = step(r, 1e-9, 5e-9, 0.5e-9), m = step(r, 1, 9, 1) * 1e-6;
    const V0 = lam / (2 * EPS0), v0 = Math.sqrt(q * lam / (EPS0 * m));
    return {
      testo: S`Un anello sottile di raggio $R=${cm(R)}$ porta una carica distribuita uniformemente con densità lineare $\lambda=${P(lam, 'C/m')}$. Una particella puntiforme di carica $q=${P(q, 'C')}$ e massa $m=${Un(m * 1e6, 'mg')}$, che può scorrere soltanto sull'asse dell'anello, viene lanciata dall'infinito con velocità iniziale $v_0$. Calcolare: a) il potenziale al centro dell'anello; b) il valore minimo di $v_0$ affinché la particella superi il centro dell'anello ($z=0$).`,
      passi: [
        S`Sull'asse $V(z)=\dfrac{1}{4\pi\varepsilon_0}\dfrac{Q}{\sqrt{R^2+z^2}}$ con $Q=2\pi R\lambda$; al centro $V(0)=\dfrac{\lambda}{2\varepsilon_0}$.`,
        S`Le cariche sono dello stesso segno: la particella è respinta e serve $\tfrac12 m v_0^2\ge q\,V(0)$ (il potenziale è massimo in $z=0$).`,
        S`$v_{0,min}=\sqrt{\dfrac{2qV(0)}{m}}=\sqrt{\dfrac{q\lambda}{\varepsilon_0 m}}$, indipendente da $R$.`,
      ],
      risultati: [S`V(0)=${P(V0, 'V')}`, S`v_{0,min}=${Un(v0, 'm/s')}`],
      parametri: { R, lam, q, m }, valori: { V0, v0 },
    };
  });

  def('b1-filo-finito', 'b1', 'Campo di un filo rettilineo finito carico', (r) => {
    const L = step(r, 0.10, 0.40, 0.05), Q = step(r, 2e-9, 10e-9, 1e-9), f = pick(r, [0.5, 1, 2]), D = f * L;
    const lam = Q / L, w = Math.sqrt(D * D + L * L);
    const Ex = K * lam * L / (D * w), Ey = -K * lam * (1 / D - 1 / w);
    const v = { Ex, Ey, E: Math.hypot(Ex, Ey) };
    return {
      testo: S`Un segmento rettilineo lungo $L=${cm(L)}$ giace sull'asse $y$ con un estremo in $O$ e porta una carica totale $Q=${P(Q, 'C')}$ ripartita con densità costante. Calcolare le componenti $E_x$ ed $E_y$ del campo elettrico nel punto $P=(D,0)$, con $D=${cm(D)}$, e il modulo di $\vec E$ in $P$.`,
      passi: [
        S`Elemento $dq=\lambda\,dy'$ in $(0,y')$, con $\lambda=Q/L$. La distanza da $P$ è $\sqrt{D^2+y'^2}$.`,
        S`$E_x=\dfrac{\lambda}{4\pi\varepsilon_0}\int_0^L\dfrac{D\,dy'}{(D^2+y'^2)^{3/2}}=\dfrac{\lambda}{4\pi\varepsilon_0}\dfrac{L}{D\sqrt{D^2+L^2}}$.`,
        S`$E_y=-\dfrac{\lambda}{4\pi\varepsilon_0}\int_0^L\dfrac{y'\,dy'}{(D^2+y'^2)^{3/2}}=-\dfrac{\lambda}{4\pi\varepsilon_0}\left(\dfrac1D-\dfrac{1}{\sqrt{D^2+L^2}}\right)$ (verso $-y$ per $Q>0$).`,
      ],
      risultati: [S`E_x=${Un(Ex, 'V/m')}`, S`E_y=${Un(Ey, 'V/m')}`, S`|\vec E|=${Un(v.E, 'V/m')}`],
      parametri: { L, Q, D }, valori: v,
    };
  });

  def('b1-condensatore-cilindrico', 'b1', 'Condensatore cilindrico con dielettrico: massima tensione ed energia', (r) => {
    const R1 = step(r, 0.002, 0.006, 0.001), R2 = R1 * step(r, 2, 5, 0.5), L = step(r, 0.5, 2, 0.25), er = step(r, 2, 6, 0.5), Ed = step(r, 10, 40, 5) * 1e6;
    const lnR = Math.log(R2 / R1), C = 2 * PI * EPS0 * er * L / lnR, Vmax = Ed * R1 * lnR, Umax = 0.5 * C * Vmax ** 2;
    const v = { C, Vmax, Qmax: C * Vmax, Umax };
    return {
      testo: S`Un condensatore cilindrico ha raggio interno $R_1=${mm(R1)}$, raggio esterno $R_2=${mm(R2)}$ e lunghezza $L=${Un(L, 'm')}$ ($L\gg R_2$: si trascurano gli effetti di bordo). Il volume fra le armature è occupato per intero da un isolante con permittività relativa $\varepsilon_r=${sig(er, 2)}$, che si perfora se il campo supera $E_d=${Un(Ed / 1e6, 'MV/m')}$. Calcolare: a) la capacità; b) la massima tensione applicabile; c) la massima energia elettrostatica immagazzinabile.`,
      passi: [
        S`Con carica per unità di lunghezza $\lambda$: $E(r)=\dfrac{\lambda}{2\pi\varepsilon_0\varepsilon_r r}$, massimo in $r=R_1$.`,
        S`$V=\dfrac{\lambda}{2\pi\varepsilon_0\varepsilon_r}\ln\dfrac{R_2}{R_1}$, quindi $C=\dfrac{2\pi\varepsilon_0\varepsilon_r L}{\ln(R_2/R_1)}$.`,
        S`Il limite è $E(R_1)\le E_d$: $V_{max}=E_d R_1\ln\dfrac{R_2}{R_1}$ e $U_{max}=\tfrac12 C V_{max}^2$.`,
      ],
      risultati: [S`C=${P(C, 'F')}`, S`V_{max}=${P(Vmax, 'V')}`, S`U_{max}=${P(Umax, 'J')}`],
      parametri: { R1, R2, L, er, Ed }, valori: v,
    };
  });

  def('b1-piano-serie', 'b1', 'Condensatore piano con due strati dielettrici', (r) => {
    const S0 = step(r, 100, 400, 50) * 1e-4, d1 = step(r, 1, 5, 0.5) * 1e-3, d2 = step(r, 1, 5, 0.5) * 1e-3;
    const e1 = step(r, 2, 8, 1), e2 = e1 + step(r, 1, 4, 1), Q = step(r, 5, 50, 5) * 1e-9;
    const C = EPS0 * S0 / (d1 / e1 + d2 / e2), dV = Q / C, E1 = Q / (EPS0 * e1 * S0), E2 = Q / (EPS0 * e2 * S0), U = Q * Q / (2 * C);
    const v = { C, dV, E1, E2, U };
    return {
      testo: S`Fra le armature, ciascuna di area $S=${Un(S0 * 1e4, 'cm^2')}$, di un condensatore piano sono sovrapposte due lastre dielettriche parallele alle armature: la prima, spessa $d_1=${mm(d1)}$, ha $\varepsilon_{r1}=${sig(e1, 2)}$; la seconda, spessa $d_2=${mm(d2)}$, ha $\varepsilon_{r2}=${sig(e2, 2)}$. Le armature portano cariche $\pm Q$ con $Q=${P(Q, 'C')}$. Calcolare: a) la capacità; b) la differenza di potenziale fra le armature; c) il campo elettrico in ciascuno strato; d) l'energia immagazzinata.`,
      passi: [
        S`$D=\sigma=Q/S$ si conserva attraversando l'interfaccia (normale alle armature): $E_i=\dfrac{Q}{\varepsilon_0\varepsilon_{ri}S}$.`,
        S`$\Delta V=E_1d_1+E_2d_2=\dfrac{Q}{\varepsilon_0 S}\left(\dfrac{d_1}{\varepsilon_{r1}}+\dfrac{d_2}{\varepsilon_{r2}}\right)$ (due condensatori in serie).`,
        S`$C=Q/\Delta V=\dfrac{\varepsilon_0 S}{d_1/\varepsilon_{r1}+d_2/\varepsilon_{r2}}$ e $U=\dfrac{Q^2}{2C}$.`,
      ],
      risultati: [S`C=${P(C, 'F')}`, S`\Delta V=${P(dV, 'V')}`, S`E_1=${Un(E1, 'V/m')},\; E_2=${Un(E2, 'V/m')}`, S`U=${P(U, 'J')}`],
      parametri: { S: S0, d1, d2, e1, e2, Q }, valori: v,
    };
  });

  def('b1-piano-parallelo', 'b1', 'Condensatore piano riempito per metà da due dielettrici', (r) => {
    const S0 = step(r, 100, 400, 50) * 1e-4, d = step(r, 1, 5, 0.5) * 1e-3, e1 = step(r, 2, 6, 1), e2 = e1 + step(r, 1, 4, 1), V = step(r, 10, 100, 10);
    const E = V / d, s1 = EPS0 * e1 * E, s2 = EPS0 * e2 * E, C = EPS0 * (S0 / 2) * (e1 + e2) / d, Q = C * V;
    const v = { E, s1, s2, C, Q };
    return {
      testo: S`Un condensatore piano ha armature quadrate di area $S=${Un(S0 * 1e4, 'cm^2')}$ poste a distanza $d=${mm(d)}$. Lo spazio fra di esse è diviso in due metà affiancate (ciascuna occupa metà dell'area): una contiene un dielettrico con $\varepsilon_{r1}=${sig(e1, 2)}$, l'altra un dielettrico con $\varepsilon_{r2}=${sig(e2, 2)}$. Fra le armature è applicata la differenza di potenziale $V=${Un(V, 'V')}$. Calcolare: 1) il campo elettrostatico; 2) le densità di carica libera sulle due metà dell'armatura; 3) la capacità e la carica totale.`,
      passi: [
        S`Le armature sono equipotenziali e $\vec E$ è tangente all'interfaccia fra i due materiali, quindi $E_1=E_2=E=V/d$ (stessa componente tangenziale).`,
        S`$\sigma_i=D_i=\varepsilon_0\varepsilon_{ri}E$ sulla metà $i$ dell'armatura.`,
        S`$Q=\sigma_1\tfrac{S}{2}+\sigma_2\tfrac{S}{2}$, cioè $C=\dfrac{\varepsilon_0 S}{2d}(\varepsilon_{r1}+\varepsilon_{r2})$ (due condensatori in parallelo).`,
      ],
      risultati: [S`E=${Un(E, 'V/m')}`, S`\sigma_1=${Un(s1, 'C/m^2')},\;\sigma_2=${Un(s2, 'C/m^2')}`, S`C=${P(C, 'F')},\; Q=${P(Q, 'C')}`],
      parametri: { S: S0, d, e1, e2, V }, valori: v,
    };
  });

  def('b1-conduttori-sferici', 'b1', 'Conduttori sferici concentrici collegati da un filo', (r) => {
    const R1 = step(r, 0.02, 0.04, 0.005), R2 = R1 + step(r, 0.02, 0.04, 0.005), R3 = R2 + step(r, 0.01, 0.02, 0.005);
    const Q1 = step(r, 2, 10, 1) * 1e-9, Q2 = pick(r, [-1, 1]) * step(r, 2, 8, 1) * 1e-9, Qt = Q1 + Q2;
    const V1i = K * (Q1 / R1 - Q1 / R2 + Qt / R3), Vf = K * Qt / R3, Wd = K * Q1 * Q1 / 2 * (1 / R1 - 1 / R2);
    const v = { V1i, Vf, Qext: Qt, Wd };
    return {
      testo: S`Una sfera conduttrice di raggio $R_1=${cm(R1)}$ e carica $Q_1=${P(Q1, 'C')}$ occupa il centro della cavità di un conduttore sferico cavo, con raggio interno $R_2=${cm(R2)}$ e raggio esterno $R_3=${cm(R3)}$, la cui carica complessiva è $Q_2=${P(Q2, 'C')}$. Calcolare: a) il potenziale della sfera interna; b) le cariche sulla sfera interna, sulla superficie interna e su quella esterna del guscio dopo che sfera e guscio vengono collegati con un filo conduttore; c) il potenziale finale; d) l'energia dissipata nel processo.`,
      passi: [
        S`Prima del collegamento: induzione completa, quindi $-Q_1$ sulla superficie interna del guscio e $Q_1+Q_2$ su quella esterna. $V_1=K\left[\dfrac{Q_1}{R_1}-\dfrac{Q_1}{R_2}+\dfrac{Q_1+Q_2}{R_3}\right]$.`,
        S`Dopo il collegamento sfera e guscio formano un unico conduttore: dentro la cavità non c'è campo, quindi sulla sfera e sulla superficie interna la carica è 0 e tutta la carica $Q_1+Q_2$ sta sulla superficie esterna; $V_f=K\dfrac{Q_1+Q_2}{R_3}$.`,
        S`L'energia fuori dal guscio non cambia; si perde l'energia del campo nella cavità: $W_d=\dfrac{K Q_1^2}{2}\left(\dfrac1{R_1}-\dfrac1{R_2}\right)$.`,
      ],
      risultati: [S`V_1=${P(V1i, 'V')}`, S`q_{sfera}=0,\; q_{int}=0,\; q_{ext}=${P(Qt, 'C')}`, S`V_f=${P(Vf, 'V')}`, S`W_d=${P(Wd, 'J')}`],
      parametri: { R1, R2, R3, Q1, Q2 }, valori: v,
    };
  });

  def('b1-lavoro-anello-asse', 'b1', 'Lavoro per spostare una carica dal centro di un anello a un punto dell\'asse', (r) => {
    const R = step(r, 0.03, 0.08, 0.01), q = step(r, 2, 10, 1) * 1e-9, Qp = step(r, 1, 5, 1) * 1e-9, m = pick(r, [Math.sqrt(3), 2, 3]);
    const d = m * R, W = K * q * Qp * (1 / Math.sqrt(R * R + d * d) - 1 / R);
    const mTxt = m === Math.sqrt(3) ? S`\sqrt3` : String(m);
    return {
      testo: S`Una carica $q=${P(q, 'C')}$ è distribuita uniformemente su una circonferenza di raggio $R=${cm(R)}$, nel vuoto. Nel centro $O$ si trova una carica puntiforme $Q=${P(Qp, 'C')}$. Calcolare il lavoro che deve compiere un agente esterno per portare $Q$, molto lentamente, da $O$ a un punto $P$ sull'asse della circonferenza a distanza $d=${mTxt}\,R=${cm(d)}$ da $O$.`,
      passi: [
        S`Sull'asse $V(z)=\dfrac{q}{4\pi\varepsilon_0\sqrt{R^2+z^2}}$; in $O$: $V(O)=\dfrac{q}{4\pi\varepsilon_0 R}$.`,
        S`Il lavoro esterno è $W=Q\,[V(P)-V(O)]=\dfrac{qQ}{4\pi\varepsilon_0}\left(\dfrac{1}{\sqrt{R^2+d^2}}-\dfrac1R\right)$.`,
        S`Il segno negativo indica che è il campo a compiere lavoro (le cariche sono dello stesso segno e si respingono).`,
      ],
      risultati: [S`W=${P(W, 'J')}`],
      parametri: { R, q, Q: Qp, d }, valori: { W },
    };
  });

  /* =====================================================================
   * BLOCCO 2 — Corrente elettrica stazionaria e circuiti
   * ===================================================================== */

  def('b2-rc-scarica-tempi', 'b2', 'Scarica di un condensatore: tempi caratteristici ed energia', (r) => {
    const C = step(r, 1, 20, 1) * 1e-6, R = step(r, 1, 50, 1) * 1e3, V0 = step(r, 5, 50, 5), tau = R * C;
    const tQ = tau * Math.LN2, tU = tau * Math.LN2 / 2, U0 = 0.5 * C * V0 * V0, Ut = U0 * (1 - Math.exp(-2));
    const v = { tau, tQ, tV: tQ, tU, U0, Ut };
    return {
      testo: S`Un condensatore di capacità $C=${P(C, 'F')}$, caricato alla tensione $V_0=${Un(V0, 'V')}$, si scarica attraverso una resistenza $R=${P(R, '\\Omega')}$. Calcolare: a) i tempi $t_Q$, $t_V$ e $t_U$ necessari per dimezzare, rispettivamente, la carica, la tensione ai capi del condensatore e l'energia immagazzinata; b) l'energia totale dissipata in $R$; c) l'energia dissipata in $R$ fino all'istante $t=\tau=RC$.`,
      passi: [
        S`$Q(t)=Q_0e^{-t/\tau}$, $V(t)=V_0e^{-t/\tau}$, $U(t)=U_0e^{-2t/\tau}$, con $\tau=RC=${Un(tau * 1e3, 'ms')}$.`,
        S`Dimezzamento: $t_Q=t_V=\tau\ln2$; per l'energia $e^{-2t/\tau}=\tfrac12\Rightarrow t_U=\tfrac{\tau}{2}\ln 2$.`,
        S`Energia totale dissipata $=U_0=\tfrac12CV_0^2$; fino a $t=\tau$: $U_0-U(\tau)=U_0\left(1-e^{-2}\right)$.`,
      ],
      risultati: [S`t_Q=t_V=${P(tQ, 's')},\; t_U=${P(tU, 's')}`, S`U_0=${P(U0, 'J')}`, S`E_{diss}(\tau)=${P(Ut, 'J')}`],
      parametri: { C, R, V0 }, valori: v,
    };
  });

  def('b2-dielettrico-perdite', 'b2', 'Condensatore piano con dielettrico con perdite', (r) => {
    const er = step(r, 2, 8, 1), rho = pick(r, [1e8, 3e8, 1e9, 3e9, 1e10]), Sx = step(r, 100, 500, 50) * 1e-4, d = step(r, 0.5, 2, 0.5) * 1e-3, Q0 = step(r, 1, 10, 1) * 1e-6;
    const tau = EPS0 * er * rho, C = EPS0 * er * Sx / d, I0 = Q0 / tau, t10 = tau * Math.log(10), U0 = Q0 * Q0 / (2 * C);
    const v = { tau, C, I0, t10, U0 };
    return {
      testo: S`Le armature di un condensatore piano, di area $S=${Un(Sx * 1e4, 'cm^2')}$ e distanti $d=${mm(d)}$, racchiudono come isolante un materiale non ideale, che conduce debolmente: permittività relativa $\varepsilon_r=${sig(er, 2)}$, resistività $\rho=${Un(rho, '\\Omega\\,m')}$. Inizialmente il condensatore ha carica $Q_0=${P(Q0, 'C')}$ e viene lasciato isolato. Calcolare: a) la costante di tempo di scarica; b) la corrente iniziale di dispersione; c) il tempo dopo il quale la carica si riduce al 10% di $Q_0$; d) l'energia totale dissipata.`,
      passi: [
        S`Resistenza di dispersione $R=\rho d/S$ e capacità $C=\varepsilon_0\varepsilon_r S/d$: $\tau=RC=\varepsilon_0\varepsilon_r\rho$ (non dipende dalla geometria).`,
        S`$Q(t)=Q_0e^{-t/\tau}$, quindi $I_0=Q_0/\tau$ e $Q=0{,}1\,Q_0$ per $t=\tau\ln10$.`,
        S`Tutta l'energia iniziale va in calore: $U_0=\dfrac{Q_0^2}{2C}$.`,
      ],
      risultati: [S`\tau=${P(tau, 's')}`, S`I_0=${P(I0, 'A')}`, S`t_{10\%}=${P(t10, 's')}`, S`U_0=${P(U0, 'J')}`],
      parametri: { er, rho, S: Sx, d, Q0 }, valori: v,
    };
  });

  def('b2-partitore-apertura', 'b2', 'Scarica di un condensatore dopo l\'apertura dell\'interruttore', (r) => {
    const E = step(r, 6, 30, 3), R1 = step(r, 1, 10, 1) * 1e3, R2 = step(r, 1, 10, 1) * 1e3, C = step(r, 1, 20, 1) * 1e-6;
    const v0 = E * R2 / (R1 + R2), tau = R2 * C, Ud = 0.5 * C * v0 * v0, Ptau = (v0 * Math.exp(-1)) ** 2 / R2;
    const v = { v0, tau, Ud, Ptau };
    return {
      testo: S`Un generatore di tensione ideale ($\mathcal E=${Un(E, 'V')}$) alimenta, tramite un interruttore $T$ e una resistenza $R_1=${P(R1, '\\Omega')}$ in serie, il parallelo formato da una resistenza $R_2=${P(R2, '\\Omega')}$ e da un condensatore $C=${P(C, 'F')}$. Il circuito è a regime con $T$ chiuso quando, a $t=0$, $T$ viene aperto. Calcolare: a) la tensione ai capi del condensatore prima dell'apertura; b) l'andamento $V_C(t)$ per $t>0$; c) l'energia totale dissipata in $R_2$ dopo l'apertura; d) la potenza dissipata in $R_2$ all'istante $t=\tau$.`,
      passi: [
        S`A regime il condensatore è un circuito aperto: $V_C(0)=\mathcal E\dfrac{R_2}{R_1+R_2}$ (partitore).`,
        S`Dopo l'apertura il condensatore si scarica solo su $R_2$: $V_C(t)=V_C(0)\,e^{-t/\tau}$ con $\tau=R_2C=${Un(tau * 1e3, 'ms')}$.`,
        S`L'energia dissipata in $R_2$ è tutta l'energia immagazzinata: $\tfrac12CV_C(0)^2$. Potenza $p(t)=V_C(t)^2/R_2$; in $t=\tau$: $p=V_C(0)^2e^{-2}/R_2$.`,
      ],
      risultati: [S`V_C(0)=${Un(v0, 'V')}`, S`V_C(t)=${sig(v0, 3)}\,e^{-t/${sig(tau * 1e3, 3)}\,\mathrm{ms}}\ \mathrm{V}`, S`E_{R_2}=${P(Ud, 'J')}`, S`p(\tau)=${P(Ptau, 'W')}`],
      parametri: { E, R1, R2, C }, valori: v,
    };
  });

  def('b2-carica-chiusura', 'b2', 'Carica di un condensatore dopo la chiusura dell\'interruttore', (r) => {
    const E = step(r, 6, 30, 3), R1 = step(r, 1, 10, 1) * 1e3, R2 = step(r, 1, 10, 1) * 1e3, C = step(r, 1, 20, 1) * 1e-6;
    const vinf = E * R2 / (R1 + R2), Rp = R1 * R2 / (R1 + R2), tau = Rp * C, dU = 0.5 * C * vinf ** 2, t90 = tau * Math.log(10), I0 = E / R1;
    const v = { vinf, tau, dU, t90, I0 };
    return {
      testo: S`Un generatore di tensione ideale ($\mathcal E=${Un(E, 'V')}$) è collegato, tramite un interruttore $T$ inizialmente aperto e una resistenza $R_1=${P(R1, '\\Omega')}$, al parallelo di una resistenza $R_2=${P(R2, '\\Omega')}$ e di un condensatore $C=${P(C, 'F')}$ inizialmente scarico. A $t=0$ si chiude $T$. Determinare: a) la corrente erogata dal generatore subito dopo la chiusura; b) la tensione finale sul condensatore; c) la costante di tempo e l'espressione di $V_C(t)$; d) la variazione di energia del condensatore; e) l'istante in cui $V_C$ raggiunge il 90% del valore finale.`,
      passi: [
        S`A $t=0^+$ il condensatore scarico è un corto circuito: $I(0^+)=\mathcal E/R_1$.`,
        S`A regime: $V_C(\infty)=\mathcal E\dfrac{R_2}{R_1+R_2}$. Il condensatore vede la resistenza equivalente di Thevenin $R_p=R_1\|R_2$, quindi $\tau=R_pC=${Un(tau * 1e3, 'ms')}$.`,
        S`$V_C(t)=V_C(\infty)\left(1-e^{-t/\tau}\right)$; $\Delta U=\tfrac12CV_C(\infty)^2$; il 90% si raggiunge per $t=\tau\ln10$.`,
      ],
      risultati: [S`I(0^+)=${P(I0, 'A')}`, S`V_C(\infty)=${Un(vinf, 'V')}`, S`\tau=${P(tau, 's')}`, S`\Delta U=${P(dU, 'J')}`, S`t_{90}=${P(t90, 's')}`],
      parametri: { E, R1, R2, C }, valori: v,
    };
  });

  def('b2-ripartizione-cariche', 'b2', 'Due condensatori collegati attraverso una resistenza', (r) => {
    const C1 = step(r, 2, 10, 1) * 1e-6, f = pick(r, [1, 2, 3, 4]), C2 = f * C1, V0 = step(r, 20, 100, 10), R = step(r, 1, 20, 1) * 1e3;
    const Vf = C1 * V0 / (C1 + C2), Q1 = C1 * Vf, Q2 = C2 * Vf, Wd = 0.5 * C1 * C2 / (C1 + C2) * V0 * V0, tau = R * C1 * C2 / (C1 + C2), I0 = V0 / R;
    const v = { Vf, Q1, Q2, Wd, tau, I0 };
    return {
      testo: S`Il condensatore $C_1=${P(C1, 'F')}$ è carico alla tensione $V_0=${Un(V0, 'V')}$; il condensatore $C_2=${P(C2, 'F')}$ è scarico. All'istante $t=0$ un interruttore collega i due condensatori attraverso una resistenza $R=${P(R, '\\Omega')}$. Calcolare: a) la corrente iniziale; b) la tensione e le cariche finali dei due condensatori; c) l'energia totale dissipata in $R$ e la costante di tempo del transitorio.`,
      passi: [
        S`$I(0)=V_0/R$. La carica totale si conserva: $C_1V_0=(C_1+C_2)V_f$.`,
        S`$V_f=\dfrac{C_1V_0}{C_1+C_2}$, $Q_1=C_1V_f$, $Q_2=C_2V_f$.`,
        S`$W_{diss}=\tfrac12C_1V_0^2-\tfrac12(C_1+C_2)V_f^2=\dfrac12\dfrac{C_1C_2}{C_1+C_2}V_0^2$ (indipendente da $R$); $\tau=R\dfrac{C_1C_2}{C_1+C_2}$.`,
      ],
      risultati: [S`I(0)=${P(I0, 'A')}`, S`V_f=${Un(Vf, 'V')},\; Q_1=${P(Q1, 'C')},\; Q_2=${P(Q2, 'C')}`, S`W_{diss}=${P(Wd, 'J')},\; \tau=${P(tau, 's')}`],
      parametri: { C1, C2, V0, R }, valori: v,
    };
  });

  def('b2-ponte', 'b2', 'Ponte di Wheatstone: condizione di equilibrio e corrente nel galvanometro', (r) => {
    const R1 = step(r, 100, 1000, 100), R2 = step(r, 100, 1000, 100), R3 = step(r, 100, 1000, 100), R0 = step(r, 20, 100, 10), E = step(r, 3, 12, 1), dl = pick(r, [0.02, 0.05, 0.1]);
    const Rx = R2 * R3 / R1, Rx2 = Rx * (1 + dl);
    const Vth = E * (R2 / (R1 + R2) - Rx2 / (R3 + Rx2)), Rth = R1 * R2 / (R1 + R2) + R3 * Rx2 / (R3 + Rx2), I0 = Vth / (Rth + R0);
    const v = { Rx, I0 };
    return {
      testo: S`Quattro resistori formano un ponte: $R_1=${Un(R1, '\\Omega')}$ collega i nodi $A$ e $C$, $R_2=${Un(R2, '\\Omega')}$ collega $C$ e $B$, $R_3=${Un(R3, '\\Omega')}$ collega $A$ e $D$, la resistenza incognita $R_x$ collega $D$ e $B$. Un galvanometro di resistenza $R_0=${Un(R0, '\\Omega')}$ è inserito fra $C$ e $D$ e un generatore ideale $\mathcal E=${Un(E, 'V')}$ è collegato fra $A$ e $B$. Determinare: a) il valore di $R_x$ per cui la corrente nel galvanometro è nulla; b) la corrente nel galvanometro se $R_x$ si scosta dal valore di equilibrio del $${I_(dl * 100)}\,\%$ in più.`,
      passi: [
        S`Equilibrio: $V_C=V_D$. Con $V_B=0$: $V_C=\mathcal E\dfrac{R_2}{R_1+R_2}$, $V_D=\mathcal E\dfrac{R_x}{R_3+R_x}$.`,
        S`Uguagliando: $R_2R_3=R_1R_x$, cioè $R_x=\dfrac{R_2R_3}{R_1}$.`,
        S`Fuori equilibrio si usa Thevenin ai capi $C$–$D$: $V_{th}=\mathcal E\left(\dfrac{R_2}{R_1+R_2}-\dfrac{R_x'}{R_3+R_x'}\right)$, $R_{th}=R_1\|R_2+R_3\|R_x'$, $I_0=\dfrac{V_{th}}{R_{th}+R_0}$ (il segno indica il verso).`,
      ],
      risultati: [S`R_x=${Un(Rx, '\\Omega')}`, S`I_0=${P(I0, 'A')}`],
      parametri: { R1, R2, R3, R0, E, dl }, valori: v,
    };
  });

  /* =====================================================================
   * BLOCCO 3 — Magnetostatica, materiali magnetici
   * ===================================================================== */

  def('b3-coassiale', 'b3', 'Campo magnetico di un cavo coassiale', (r) => {
    const a = step(r, 1, 3, 0.5) * 1e-3, b = a * step(r, 2, 3, 0.5), c = b * step(r, 1.2, 1.5, 0.1), I = step(r, 5, 50, 5);
    const B = (x) => (x < a ? MU0 * I * x / (2 * PI * a * a) : x < b ? MU0 * I / (2 * PI * x) : x < c ? MU0 * I * (c * c - x * x) / (2 * PI * x * (c * c - b * b)) : 0);
    const rs = [a / 2, (a + b) / 2, (b + c) / 2, 2 * c];
    const v = { B1: B(rs[0]), B2: B(rs[1]), B3: B(rs[2]), B4: B(rs[3]) };
    return {
      testo: S`Un cavo coassiale è formato da un conduttore cilindrico pieno di raggio $a=${mm(a)}$ e da un conduttore tubolare coassiale di raggio interno $b=${mm(b)}$ ed esterno $c=${mm(c)}$. Nei due conduttori scorre la stessa corrente $I=${Un(I, 'A')}$ in versi opposti, distribuita uniformemente sulle sezioni. Ricavare l'espressione di $B(r)$ nelle quattro regioni e calcolarne il valore nei punti $r_1=${mm(rs[0])}$, $r_2=${mm(rs[1])}$, $r_3=${mm(rs[2])}$, $r_4=${mm(rs[3])}$.`,
      passi: [
        S`Per simmetria $B$ è azimutale e la legge di Ampère dà $B\,2\pi r=\mu_0 I_{conc}(r)$.`,
        S`$r<a$: $I_{conc}=I r^2/a^2\Rightarrow B=\dfrac{\mu_0 I r}{2\pi a^2}$; $a<r<b$: $B=\dfrac{\mu_0 I}{2\pi r}$.`,
        S`$b<r<c$: $I_{conc}=I-I\dfrac{r^2-b^2}{c^2-b^2}\Rightarrow B=\dfrac{\mu_0 I}{2\pi r}\dfrac{c^2-r^2}{c^2-b^2}$; $r>c$: corrente totale nulla, $B=0$.`,
      ],
      risultati: [S`B(r_1)=${P(v.B1, 'T')}`, S`B(r_2)=${P(v.B2, 'T')}`, S`B(r_3)=${P(v.B3, 'T')}`, S`B(r_4)=0`],
      parametri: { a, b, c, I }, valori: v,
    };
  });

  def('b3-cilindro-J-kr', 'b3', 'Cilindro con densità di corrente J = k·r', (r) => {
    const R = step(r, 5, 20, 1) * 1e-3, I = step(r, 5, 30, 5), k = 3 * I / (2 * PI * R ** 3);
    const Bin = (x) => MU0 * k * x * x / 3, Bout = (x) => MU0 * I / (2 * PI * x);
    const v = { B_meta: Bin(R / 2), B_2R: Bout(2 * R), B_R: Bin(R), I };
    return {
      testo: S`Una corrente stazionaria scorre in un conduttore cilindrico indefinito, di raggio $R=${mm(R)}$, con densità di corrente parallela all'asse $J=k\,r$, dove $r$ è la distanza dall'asse e $k=${Un(k, 'A/m^3')}$. Calcolare: a) la corrente totale $I$; b) la legge $B(r)$ del campo magnetico all'interno e all'esterno del conduttore; c) i valori di $B$ a $r=R/2$ e $r=2R$.`,
      passi: [
        S`$I=\int_0^R k r\,2\pi r\,dr=\dfrac{2\pi kR^3}{3}$.`,
        S`Ampère su una circonferenza di raggio $r<R$: $B\,2\pi r=\mu_0\dfrac{2\pi k r^3}{3}\Rightarrow B=\dfrac{\mu_0 k r^2}{3}$.`,
        S`Per $r>R$ la corrente concatenata è $I$: $B=\dfrac{\mu_0 I}{2\pi r}$ (continuo in $r=R$).`,
      ],
      risultati: [S`I=${Un(I, 'A')}`, S`B(R/2)=${P(v.B_meta, 'T')}`, S`B(2R)=${P(v.B_2R, 'T')}`],
      parametri: { R, I, k }, valori: v,
    };
  });

  def('b3-spira-semicerchio', 'b3', 'Campo al centro di un filo a U con semicerchio', (r) => {
    const R = step(r, 2, 10, 1) * 1e-2, I = step(r, 1, 10, 1);
    const B = MU0 * I / (4 * R) * (1 + 2 / PI);
    const v = { B, Bsem: MU0 * I / (4 * R), Brett: MU0 * I / (4 * PI * R) };
    return {
      testo: S`Un filo percorso da una corrente $I=${Un(I, 'A')}$ è formato da un semicerchio di raggio $R=${cm(R)}$ e da due tratti rettilinei semi-infiniti, paralleli, ciascuno tangente al semicerchio nel proprio estremo (il filo ha la forma di una U allungata). La corrente percorre il semicerchio in senso orario. Calcolare il modulo, la direzione e il verso del campo di induzione magnetica nel centro $C$ del semicerchio.`,
      passi: [
        S`Semicerchio: $B_1=\dfrac12\dfrac{\mu_0 I}{2R}=\dfrac{\mu_0 I}{4R}$.`,
        S`Ciascun tratto rettilineo semi-infinito, che termina nel piede della perpendicolare condotta da $C$ (distanza $R$): $B_2=\dfrac{\mu_0 I}{4\pi R}$.`,
        S`I tre contributi sono concordi (regola della mano destra): $B=\dfrac{\mu_0 I}{4R}\left(1+\dfrac2\pi\right)$, ortogonale al piano del filo e, con corrente oraria, entrante nel foglio.`,
      ],
      risultati: [S`B=${P(B, 'T')}`, S`\text{direzione: } \perp \text{ al piano; verso: entrante}`],
      parametri: { R, I }, valori: v,
    };
  });

  def('b3-toroide-traferro', 'b3', 'Toroide di ferro con traferro', (r) => {
    const Rm = step(r, 5, 15, 1) * 1e-2, L = step(r, 1, 3, 0.5) * 1e-2, d = step(r, 1, 4, 0.5) * 1e-3, N = step(r, 200, 1000, 100), I = step(r, 0.5, 3, 0.5), mur = step(r, 500, 3000, 500);
    const lfe = 2 * PI * Rm - d, B = MU0 * N * I / (d + lfe / mur), Hfe = B / (MU0 * mur), Ha = B / MU0, Phi = B * L * L, Ug = B * B / (2 * MU0) * L * L * d;
    const v = { B, Hfe, Ha, Phi, Ug };
    return {
      testo: S`Un toroide di ferro, di raggio medio $R=${cm(Rm)}$ e sezione quadrata di lato $L=${cm(L)}$, porta un avvolgimento di $N=${I_(N)}$ spire percorso dalla corrente $I=${Un(I, 'A')}$. Il nucleo ha permeabilità relativa $\mu_r=${I_(mur)}$ (costante) ed è interrotto da un'intercapedine d'aria (traferro) di larghezza $d=${mm(d)}$. Trascurando la dispersione del flusso e gli effetti di bordo, calcolare: a) il campo $B$ nel nucleo; b) i campi $H$ nel ferro e nel traferro; c) il flusso; d) l'energia magnetica immagazzinata nel traferro.`,
      passi: [
        S`Il flusso si conserva e la sezione è costante, quindi $B$ è lo stesso nel ferro e nel traferro (componente normale continua).`,
        S`Ampère per $H$: $NI=H_{fe}\,(2\pi R-d)+H_0\,d$ con $H_{fe}=\dfrac{B}{\mu_0\mu_r}$, $H_0=\dfrac{B}{\mu_0}$, da cui $B=\dfrac{\mu_0NI}{d+(2\pi R-d)/\mu_r}$.`,
        S`$\Phi=BL^2$; energia nel traferro $U=\dfrac{B^2}{2\mu_0}L^2d$.`,
      ],
      risultati: [S`B=${P(B, 'T')}`, S`H_{fe}=${Un(Hfe, 'A/m')},\; H_0=${Un(Ha, 'A/m')}`, S`\Phi=${P(Phi, 'Wb')}`, S`U_{traf}=${P(Ug, 'J')}`],
      parametri: { R: Rm, L, d, N, I, mur }, valori: v,
    };
  });

  def('b3-spira-filo-carica', 'b3', 'Spira che si allontana da un filo: carica circolata', (r) => {
    const I = step(r, 5, 30, 5), h = step(r, 5, 20, 5) * 1e-2, l = step(r, 5, 15, 5) * 1e-2, R = step(r, 0.1, 1, 0.1), d1 = step(r, 2, 5, 1) * 1e-2, d2 = d1 + step(r, 5, 15, 5) * 1e-2;
    const Phi = (d) => MU0 * I * h / (2 * PI) * Math.log((d + l) / d), dPhi = Phi(d1) - Phi(d2), Q = dPhi / R;
    const v = { Phi1: Phi(d1), Phi2: Phi(d2), Q };
    return {
      testo: S`Una spira rettangolare di lati $h=${cm(h)}$ (parallelo al filo) e $l=${cm(l)}$ e resistenza $R=${Un(R, '\\Omega')}$ giace nel piano di un conduttore rettilineo molto lungo, attraversato dalla corrente continua $I=${Un(I, 'A')}$. Il lato parallelo più vicino al filo dista $d_1=${cm(d1)}$. La spira viene allontanata dal filo, restando nel piano, fino a $d_2=${cm(d2)}$. Calcolare: a) il flusso concatenato nelle due posizioni; b) la carica totale che circola nella spira; c) il verso della corrente indotta.`,
      passi: [
        S`$B(x)=\dfrac{\mu_0I}{2\pi x}$: $\Phi(d)=\int_d^{d+l}\dfrac{\mu_0I}{2\pi x}h\,dx=\dfrac{\mu_0Ih}{2\pi}\ln\dfrac{d+l}{d}$.`,
        S`Legge di Faraday–Neumann: $i=-\dfrac{1}{R}\dfrac{d\Phi}{dt}$, quindi $Q=\int i\,dt=\dfrac{\Phi_1-\Phi_2}{R}$ (indipendente dal tempo impiegato).`,
        S`Il flusso diminuisce: per la legge di Lenz la corrente indotta genera un campo concorde con quello del filo dentro la spira, per opporsi alla diminuzione.`,
      ],
      risultati: [S`\Phi_1=${P(v.Phi1, 'Wb')},\; \Phi_2=${P(v.Phi2, 'Wb')}`, S`Q=${P(Q, 'C')}`],
      parametri: { I, h, l, R, d1, d2 }, valori: v,
    };
  });

  /* =====================================================================
   * BLOCCO 4 — Induzione elettromagnetica, induttanza, energia
   * ===================================================================== */

  def('b4-rl-apertura', 'b4', 'Circuito RL: apertura dell\'interruttore', (r) => {
    const E = step(r, 6, 24, 3), R1 = step(r, 10, 100, 10), R2 = step(r, 10, 100, 10), L = step(r, 10, 200, 10) * 1e-3;
    const I0 = E / R1, tau = L / R2, W = 0.5 * L * I0 * I0, Vpk = I0 * R2, Itau = I0 * Math.exp(-1);
    const v = { I0, tau, W, Vpk, Itau };
    return {
      testo: S`Un generatore di tensione ideale ($\mathcal E=${Un(E, 'V')}$), un interruttore $T$ e una resistenza $R_1=${Un(R1, '\\Omega')}$ sono in serie e alimentano il parallelo formato da un'induttanza ideale $L=${P(L, 'H')}$ e da una resistenza $R_2=${Un(R2, '\\Omega')}$. Il circuito è a regime con $T$ chiuso quando, a $t=0$, $T$ viene aperto. Calcolare: a) la corrente nell'induttanza prima dell'apertura; b) l'espressione di $i_L(t)$ per $t>0$ e il suo valore a $t=\tau$; c) la tensione ai capi di $R_2$ subito dopo l'apertura; d) l'energia totale dissipata in $R_2$.`,
      passi: [
        S`A regime l'induttanza ideale è un corto circuito e cortocircuita $R_2$: $i_L(0^-)=\mathcal E/R_1$.`,
        S`La corrente nell'induttanza è continua: dopo l'apertura $L\dfrac{di}{dt}+R_2i=0\Rightarrow i_L(t)=I_0e^{-t/\tau}$ con $\tau=L/R_2=${Un(tau * 1e3, 'ms')}$.`,
        S`$|V_{R_2}(0^+)|=I_0R_2$; energia dissipata $=\tfrac12LI_0^2$ (tutta quella accumulata).`,
      ],
      risultati: [S`I_0=${P(I0, 'A')}`, S`i_L(\tau)=${P(Itau, 'A')}`, S`|V_{R_2}(0^+)|=${Un(Vpk, 'V')}`, S`W=${P(W, 'J')}`],
      parametri: { E, R1, R2, L }, valori: v,
    };
  });

  def('b4-spira-B-variabile', 'b4', 'Spira circolare in un campo B(t) che cresce esponenzialmente', (r) => {
    const a = step(r, 2, 8, 1) * 1e-2, lam = step(r, 0.05, 0.5, 0.05), B0 = step(r, 5, 50, 5) * 1e-3, tau = step(r, 5, 50, 5) * 1e-3;
    const Rr = 2 * PI * a * lam, e0 = PI * a * a * B0 / tau, i0 = e0 / Rr, Wj = e0 * e0 * tau / (2 * Rr), Q = PI * a * a * B0 / Rr;
    const v = { Rr, e0, i0, Wj, Q };
    return {
      testo: S`Una spira circolare di raggio $a=${cm(a)}$, con resistenza per unità di lunghezza $\lambda=${Un(lam, '\\Omega/m')}$, è immersa in un campo magnetico uniforme, ortogonale al suo piano, che varia secondo $B(t)=B_0\left(1-e^{-t/\tau}\right)$ con $B_0=${P(B0, 'T')}$ e $\tau=${P(tau, 's')}$. Calcolare: a) la resistenza della spira; b) la f.e.m. indotta e la corrente a $t=0$ (con il verso rispetto a $\vec B$); c) la carica totale che circola nella spira per $t\ge 0$; d) il calore complessivamente sviluppato per effetto Joule.`,
      passi: [
        S`$R=2\pi a\lambda$. Flusso $\Phi=\pi a^2B(t)$, quindi $\mathcal E_i=-\dfrac{d\Phi}{dt}=-\dfrac{\pi a^2B_0}{\tau}e^{-t/\tau}$.`,
        S`Per Lenz la corrente induce un campo che si oppone all'aumento del flusso (verso orario se $\vec B$ è uscente dal foglio); $i(t)=\dfrac{|\mathcal E_i|}{R}$.`,
        S`$Q=\int_0^\infty i\,dt=\dfrac{\pi a^2B_0}{R}$ e $W=\int_0^\infty R i^2dt=\dfrac{\mathcal E_0^2\tau}{2R}$.`,
      ],
      risultati: [S`R=${Un(Rr, '\\Omega')}`, S`|\mathcal E_i(0)|=${P(e0, 'V')},\; i(0)=${P(i0, 'A')}`, S`Q=${P(Q, 'C')}`, S`W_J=${P(Wj, 'J')}`],
      parametri: { a, lam, B0, tau }, valori: v,
    };
  });

  def('b4-barretta-rotaie', 'b4', 'Barretta trascinata su rotaie in un campo magnetico', (r) => {
    const B = step(r, 0.1, 1, 0.1), h = step(r, 10, 50, 5) * 1e-2, R = step(r, 0.1, 2, 0.1), F = step(r, 0.1, 2, 0.1), m = step(r, 20, 200, 20) * 1e-3;
    const vL = F * R / (B * B * h * h), I = F / (B * h), P_ = F * vL, tau = m * R / (B * B * h * h);
    const v = { vL, I, P: P_, tau };
    return {
      testo: S`Due rotaie conduttrici parallele, distanti $h=${cm(h)}$ e unite a un'estremità da un tratto di resistenza totale $R=${Un(R, '\\Omega')}$ (le rotaie e la barretta hanno resistenza trascurabile), giacciono in un piano ortogonale a un campo magnetico uniforme $B=${Un(B, 'T')}$. Una barretta conduttrice di massa $m=${Un(m * 1e3, 'g')}$, appoggiata trasversalmente sulle rotaie, è trascinata con una forza costante $F=${Un(F, 'N')}$ parallela alle rotaie (attrito trascurabile). Calcolare: a) la velocità limite $v_L$; b) la corrente e la potenza dissipata in $R$ a regime; c) la costante di tempo con cui si raggiunge $v_L$.`,
      passi: [
        S`Con velocità $v$: f.e.m. $\mathcal E=Bhv$, corrente $i=\dfrac{Bhv}{R}$, forza frenante $F_m=iBh=\dfrac{B^2h^2v}{R}$.`,
        S`Equazione del moto $m\dot v=F-\dfrac{B^2h^2}{R}v$: velocità limite quando $F_m=F$, cioè $v_L=\dfrac{FR}{B^2h^2}$; $v(t)=v_L\left(1-e^{-t/\tau}\right)$ con $\tau=\dfrac{mR}{B^2h^2}$.`,
        S`A regime $i=F/(Bh)$ e la potenza dissipata $Ri^2=F v_L$ è uguale a quella della forza esterna.`,
      ],
      risultati: [S`v_L=${Un(vL, 'm/s')}`, S`i=${P(I, 'A')},\; P=${P(P_, 'W')}`, S`\tau=${P(tau, 's')}`],
      parametri: { B, h, R, F, m }, valori: v,
    };
  });

  def('b4-sbarra-rotante', 'b4', 'Sbarra conduttrice in rotazione in un campo magnetico', (r) => {
    const l = step(r, 20, 80, 10) * 1e-2, w = step(r, 20, 200, 20), B = step(r, 0.05, 0.5, 0.05), R = step(r, 0.1, 2, 0.1);
    const e = 0.5 * B * w * l * l, I = e / R, Pp = e * e / R, M = Pp / w;
    const v = { e, I, Pp, M };
    return {
      testo: S`Una sbarra metallica di lunghezza $l=${cm(l)}$ ruota con velocità angolare costante $\omega=${Un(w, 'rad/s')}$ intorno a un suo estremo $A$, in un piano ortogonale a un campo magnetico uniforme $B=${Un(B, 'T')}$. L'estremo libero striscia su una guida circolare conduttrice collegata ad $A$ tramite una resistenza $R=${Un(R, '\\Omega')}$ (resistenza della sbarra e dei contatti trascurabile). Calcolare: a) la f.e.m. indotta fra i due estremi; b) la corrente; c) la potenza dissipata e il momento della forza esterna necessario per mantenere $\omega$ costante.`,
      passi: [
        S`Un elemento $dr$ a distanza $r$ da $A$ ha velocità $\omega r$: $d\mathcal E=B\omega r\,dr$, quindi $\mathcal E=\int_0^l B\omega r\,dr=\tfrac12B\omega l^2$ (anche da $\mathcal E=-\dot\Phi$, con $\Phi=\tfrac12Bl^2\theta$).`,
        S`$i=\mathcal E/R$ e $P=\mathcal E^2/R$.`,
        S`A $\omega$ costante la potenza meccanica uguaglia quella dissipata: $M\omega=P\Rightarrow M=P/\omega$.`,
      ],
      risultati: [S`\mathcal E=${P(e, 'V')}`, S`i=${P(I, 'A')}`, S`P=${P(Pp, 'W')},\; M=${P(M, 'N\\,m')}`],
      parametri: { l, w, B, R }, valori: v,
    };
  });

  def('b4-mutua-filo-spira', 'b4', 'Mutua induzione fra un filo e una spira quadrata', (r) => {
    const a = step(r, 5, 20, 5) * 1e-2, d = step(r, 2, 10, 2) * 1e-2, kk = step(r, 10, 100, 10), R = step(r, 0.1, 2, 0.1);
    const M = MU0 * a / (2 * PI) * Math.log((d + a) / d), e = M * kk, i = e / R;
    const v = { M, e, i };
    return {
      testo: S`Una spira quadrata di lato $a=${cm(a)}$ e resistenza $R=${Un(R, '\\Omega')}$ giace nel piano di un lungo filo rettilineo, con due lati paralleli al filo; il lato più vicino dista $d=${cm(d)}$ dal filo. Calcolare: a) il coefficiente di mutua induzione $M$; b) la f.e.m. indotta nella spira se nel filo la corrente cresce linearmente, $I(t)=k\,t$ con $k=${Un(kk, 'A/s')}$; c) la corrente nella spira e il suo verso.`,
      passi: [
        S`Flusso del campo del filo sulla spira: $\Phi=\int_d^{d+a}\dfrac{\mu_0I}{2\pi x}a\,dx=\dfrac{\mu_0a}{2\pi}\ln\dfrac{d+a}{d}\,I$, quindi $M=\dfrac{\mu_0a}{2\pi}\ln\dfrac{d+a}{d}$.`,
        S`$|\mathcal E|=M\left|\dfrac{dI}{dt}\right|=Mk$ (costante).`,
        S`Per Lenz la corrente indotta si oppone all'aumento di flusso: $i=\mathcal E/R$, con campo opposto a quello del filo dentro la spira.`,
      ],
      risultati: [S`M=${P(M, 'H')}`, S`|\mathcal E|=${P(e, 'V')}`, S`i=${P(i, 'A')}`],
      parametri: { a, d, k: kk, R }, valori: v,
    };
  });

  def('b4-solenoide-bobina', 'b4', 'Bobina dentro un solenoide con corrente decrescente', (r) => {
    const n = step(r, 1000, 5000, 500), I0 = step(r, 1, 5, 0.5), tau = step(r, 5, 50, 5) * 1e-3, N = step(r, 10, 100, 10), dd = step(r, 1, 3, 0.5) * 1e-2, R = step(r, 1, 10, 1);
    const Phi0 = N * MU0 * n * dd * dd * I0, e0 = Phi0 / tau, i0 = e0 / R, Q = Phi0 / R;
    const v = { e0, i0, Q };
    return {
      testo: S`All'interno di un solenoide indefinito con $n=${I_(n)}\ \mathrm{spire/m}$, percorso dalla corrente $I(t)=I_0e^{-t/\tau}$ con $I_0=${Un(I0, 'A')}$ e $\tau=${P(tau, 's')}$, è posta una bobina di $N=${I_(N)}$ spire quadrate di lato $d=${cm(dd)}$, con il piano ortogonale all'asse e resistenza complessiva $R=${Un(R, '\\Omega')}$. Calcolare: a) la f.e.m. indotta a $t=0$ e la sua espressione in funzione del tempo; b) la corrente massima nella bobina; c) la carica totale circolata per $t\ge0$.`,
      passi: [
        S`Nel solenoide $B(t)=\mu_0nI(t)$, uniforme; flusso concatenato dalla bobina $\Phi=N\mu_0nd^2I(t)$.`,
        S`$\mathcal E(t)=-\dfrac{d\Phi}{dt}=\dfrac{N\mu_0nd^2I_0}{\tau}e^{-t/\tau}$, massima a $t=0$; $i_{max}=\mathcal E(0)/R$.`,
        S`$Q=\int_0^\infty\dfrac{\mathcal E}{R}dt=\dfrac{N\mu_0nd^2I_0}{R}$ (variazione totale di flusso divisa per $R$).`,
      ],
      risultati: [S`\mathcal E(0)=${P(e0, 'V')}`, S`i_{max}=${P(i0, 'A')}`, S`Q=${P(Q, 'C')}`],
      parametri: { n, I0, tau, N, d: dd, R }, valori: v,
    };
  });

  def('b4-spira-rotante', 'b4', 'Bobina rotante in un campo uniforme (alternatore)', (r) => {
    const N = step(r, 50, 300, 50), a = step(r, 3, 10, 1) * 1e-2, B = step(r, 20, 200, 20) * 1e-3, f = step(r, 20, 100, 10), R = step(r, 5, 50, 5);
    const w = 2 * PI * f, e0 = N * B * PI * a * a * w, Pm = e0 * e0 / (2 * R), Mm = Pm / w;
    const v = { w, e0, Pm, Mm };
    return {
      testo: S`Una bobina di $N=${I_(N)}$ spire circolari di raggio $a=${cm(a)}$ e resistenza complessiva $R=${Un(R, '\\Omega')}$ ruota con frequenza $f=${Un(f, 'Hz')}$ intorno a un diametro, immersa in un campo magnetico uniforme $B=${P(B, 'T')}$ ortogonale all'asse di rotazione. Calcolare: a) l'espressione e il valore massimo della f.e.m. indotta; b) la potenza media dissipata; c) il momento medio della coppia meccanica necessaria per mantenere la rotazione.`,
      passi: [
        S`$\Phi(t)=NB\pi a^2\cos\omega t$ con $\omega=2\pi f$, quindi $\mathcal E(t)=NB\pi a^2\omega\sin\omega t$.`,
        S`Potenza media: $\langle P\rangle=\dfrac{\mathcal E_0^2}{2R}$ (media di $\sin^2$ pari a $\tfrac12$).`,
        S`A regime la potenza meccanica media uguaglia quella dissipata: $\langle M\rangle=\langle P\rangle/\omega$.`,
      ],
      risultati: [S`\mathcal E_0=${Un(e0, 'V')}`, S`\langle P\rangle=${P(Pm, 'W')}`, S`\langle M\rangle=${P(Mm, 'N\\,m')}`],
      parametri: { N, a, B, f, R }, valori: v,
    };
  });

  def('b4-toroide-L', 'b4', 'Autoinduzione di un toroide a sezione quadrata', (r) => {
    const Rm = step(r, 5, 15, 1) * 1e-2, a = step(r, 1, 3, 0.5) * 1e-2, N = step(r, 100, 800, 100), mur = step(r, 200, 2000, 200), I = step(r, 0.5, 3, 0.5);
    const L = MU0 * mur * N * N * a / (2 * PI) * Math.log((Rm + a / 2) / (Rm - a / 2)), U = 0.5 * L * I * I, Phi = L * I;
    const v = { L, U, Phi };
    return {
      testo: S`Un toroide di materiale con permeabilità relativa $\mu_r=${I_(mur)}$ ha sezione quadrata di lato $a=${cm(a)}$ e raggio medio $R=${cm(Rm)}$. Su di esso sono avvolte $N=${I_(N)}$ spire. Determinare: a) il coefficiente di autoinduzione; b) il flusso concatenato e l'energia magnetica quando nell'avvolgimento passa la corrente $I=${Un(I, 'A')}$.`,
      passi: [
        S`Per Ampère nel materiale $B(r)=\dfrac{\mu_0\mu_rNI}{2\pi r}$, con $r\in[R-a/2,\,R+a/2]$.`,
        S`Flusso in una spira: $\Phi_1=\int B\,a\,dr=\dfrac{\mu_0\mu_rNIa}{2\pi}\ln\dfrac{R+a/2}{R-a/2}$; flusso concatenato $\Phi=N\Phi_1=LI$.`,
        S`$L=\dfrac{\mu_0\mu_rN^2a}{2\pi}\ln\dfrac{R+a/2}{R-a/2}$ e $U=\tfrac12LI^2$.`,
      ],
      risultati: [S`L=${P(L, 'H')}`, S`\Phi=${P(Phi, 'Wb')}`, S`U=${P(U, 'J')}`],
      parametri: { R: Rm, a, N, mur, I }, valori: v,
    };
  });

  def('b4-rapporto-densita', 'b4', 'Campi indotti in un solenoide: rapporto fra densità di energia', (r) => {
    const n = step(r, 1000, 5000, 500), I0 = step(r, 1, 5, 0.5), tau = step(r, 0.1, 5, 0.1) * 1e-3, a = step(r, 1, 3, 0.5) * 1e-2, rr = a * pick(r, [0.5, 0.8]);
    const B0 = MU0 * n * I0, E0 = rr / 2 * MU0 * n * I0 / tau, ratio = (EPS0 * E0 * E0 / 2) / (B0 * B0 / (2 * MU0));
    const v = { B0, E0, ratio, ratio_formula: (rr / (2 * C0 * tau)) ** 2 };
    return {
      testo: S`In un solenoide molto lungo, di raggio $a=${cm(a)}$ e con $n=${I_(n)}\ \mathrm{spire/m}$, la corrente varia lentamente nel tempo come $I(t)=I_0e^{-t/\tau}$ con $I_0=${Un(I0, 'A')}$ e $\tau=${P(tau, 's')}$. Determinare, a $t=0$ e in un punto interno a distanza $r=${cm(rr)}$ dall'asse: a) il campo magnetico; b) il campo elettrico indotto (modulo); c) il rapporto fra la densità di energia elettrica e quella magnetica.`,
      passi: [
        S`Campo magnetico (quasi stazionario): $B=\mu_0nI(t)$, uniforme dentro il solenoide.`,
        S`Faraday su una circonferenza di raggio $r$: $E\,2\pi r=-\pi r^2\dot B\Rightarrow E=\dfrac r2\,\mu_0n\,\dfrac{I_0}{\tau}e^{-t/\tau}$ (campo azimutale).`,
        S`$\dfrac{u_E}{u_B}=\dfrac{\varepsilon_0E^2/2}{B^2/2\mu_0}=\varepsilon_0\mu_0\dfrac{E^2}{B^2}=\left(\dfrac{r}{2c\tau}\right)^2$: ben inferiore a 1, quindi nell'ipotesi quasi stazionaria l'energia elettrica è trascurabile.`,
      ],
      risultati: [S`B=${P(B0, 'T')}`, S`E=${Un(E0, 'V/m')}`, S`u_E/u_B=${sig(ratio, 3)}`],
      parametri: { n, I0, tau, a, r: rr }, valori: v,
    };
  });

  /* =====================================================================
   * BLOCCO 5 — Onde elettromagnetiche e ottica
   * ===================================================================== */

  def('b5-stella', 'b5', 'Radiazione emessa da una stella', (r) => {
    const Rs = step(r, 0.5, 3, 0.5) * 6.96e8, d = step(r, 0.8, 3, 0.1) * 1.496e11, Ed = step(r, 500, 1200, 50);
    const Id = 0.5 * C0 * EPS0 * Ed * Ed, Pw = 4 * PI * d * d * Id, Is = Pw / (4 * PI * Rs * Rs), Es = Ed * d / Rs, Bs = Es / C0;
    const v = { Id, Pw, Is, Es, Bs };
    return {
      testo: S`Una stella di raggio $R_s=${Un(Rs, 'm')}$ irradia onde elettromagnetiche in modo isotropo. Una sonda posta a distanza $d=${Un(d, 'm')}$ dal centro della stella registra un campo elettrico di ampiezza $E_d=${Un(Ed, 'V/m')}$. Trascurando assorbimenti lungo il tragitto, calcolare: a) l'intensità media $I$ a distanza $d$; b) la potenza totale emessa; c) l'intensità media e le ampiezze dei campi $\vec E$ e $\vec B$ sulla superficie della stella.`,
      passi: [
        S`Per un'onda piana (approssimazione locale) $I=\tfrac12c\varepsilon_0E_0^2$.`,
        S`Potenza totale $P=I\cdot4\pi d^2$ (conservazione dell'energia attraverso sfere concentriche).`,
        S`Alla superficie $I_s=\dfrac{P}{4\pi R_s^2}$; poiché $I\propto E_0^2$ si ha $E_0\propto 1/r$: $E_s=E_d\dfrac{d}{R_s}$ e $B_s=E_s/c$.`,
      ],
      risultati: [S`I=${Un(Id, 'W/m^2')}`, S`P=${Un(Pw, 'W')}`, S`I_s=${Un(Is, 'W/m^2')}`, S`E_s=${Un(Es, 'V/m')},\; B_s=${Un(Bs, 'T')}`],
      parametri: { Rs, d, Ed }, valori: v,
    };
  });

  def('b5-laser', 'b5', 'Fascio laser: intensità, campi e pressione di radiazione', (r) => {
    const W = step(r, 1, 5, 0.5) * 1e-3, dd = step(r, 2, 8, 1) * 1e-3;
    const A = PI * dd * dd / 4, I = W / A, E0 = Math.sqrt(2 * I / (C0 * EPS0)), B0 = E0 / C0, pr = I / C0, F = W / C0;
    const v = { I, E0, B0, pr, F };
    return {
      testo: S`Un puntatore laser emette un fascio cilindrico di potenza media $\bar W=${P(W, 'W')}$. Sullo schermo la luce illumina un cerchio di diametro $d=${mm(dd)}$. Determinare: a) l'intensità media del fascio; b) le ampiezze massime dei campi $\vec E$ e $\vec B$; c) la pressione di radiazione e la forza esercitata se lo schermo assorbe completamente la luce.`,
      passi: [
        S`$I=\dfrac{\bar W}{\pi d^2/4}$.`,
        S`$I=\tfrac12c\varepsilon_0E_0^2\Rightarrow E_0=\sqrt{\dfrac{2I}{c\varepsilon_0}}$ e $B_0=E_0/c$.`,
        S`Per assorbimento totale la pressione è $p=I/c$ e la forza $F=pA=\bar W/c$.`,
      ],
      risultati: [S`I=${Un(I, 'W/m^2')}`, S`E_0=${Un(E0, 'V/m')},\; B_0=${Un(B0, 'T')}`, S`p=${Un(pr, 'Pa')},\; F=${Un(F, 'N')}`],
      parametri: { W, d: dd }, valori: v,
    };
  });

  def('b5-young', 'b5', 'Interferenza di Young con lastrina trasparente', (r) => {
    const lam = step(r, 400, 700, 50) * 1e-9, d = step(r, 0.1, 0.5, 0.05) * 1e-3, D = step(r, 1, 3, 0.5), n = step(r, 1.4, 1.7, 0.1), t = step(r, 5, 20, 5) * 1e-6;
    const dy = lam * D / d, y3 = 3 * dy, shift = D * (n - 1) * t / d, nfr = (n - 1) * t / lam;
    const v = { dy, y3, shift, nfr };
    return {
      testo: S`In un esperimento di Young due fenditure sottili distano $d=${mm(d)}$ e lo schermo è a $D=${Un(D, 'm')}$ dalle fenditure ($D\gg d$). Si usa luce monocromatica di lunghezza d'onda $\lambda=${Un(lam * 1e9, 'nm')}$. Calcolare: a) la distanza fra due massimi consecutivi; b) la posizione del terzo massimo luminoso rispetto a quello centrale; c) di quanto si sposta la frangia centrale se davanti a una fenditura si pone una lamina trasparente di indice di rifrazione $n=${sig(n, 2)}$ e spessore $t=${Un(t * 1e6, '\\mu m')}$.`,
      passi: [
        S`Differenza di cammino $\Delta=d\sin\theta\simeq d\,y/D$; massimi per $\Delta=m\lambda$: $y_m=m\dfrac{\lambda D}{d}$, quindi $\Delta y=\dfrac{\lambda D}{d}$ e $y_3=3\Delta y$.`,
        S`La lamina aggiunge un cammino ottico $(n-1)t$: il massimo centrale si sposta verso il lato della lamina in modo che $d\,y/D=(n-1)t$.`,
        S`$\Delta y_{shift}=\dfrac{D(n-1)t}{d}$, pari a $\dfrac{(n-1)t}{\lambda}$ interfrange.`,
      ],
      risultati: [S`\Delta y=${P(dy, 'm')}`, S`y_3=${P(y3, 'm')}`, S`\Delta y_{shift}=${P(shift, 'm')}\ (${sig(nfr, 3)}\ \text{frange})`],
      parametri: { lam, d, D, n, t }, valori: v,
    };
  });

  def('b5-spira-onda', 'b5', 'F.e.m. indotta in una spira da un\'onda piana', (r) => {
    const I = step(r, 1, 100, 5), lam = step(r, 1, 10, 1), Sx = step(r, 50, 500, 50) * 1e-4, th = pick(r, [0, 30, 45, 60]) * PI / 180;
    const E0 = Math.sqrt(2 * I / (C0 * EPS0)), B0 = E0 / C0, w = 2 * PI * C0 / lam, e0 = w * B0 * Sx * Math.cos(th);
    const v = { E0, B0, w, e0 };
    return {
      testo: S`Un'onda elettromagnetica piana sinusoidale, polarizzata linearmente, si propaga nel vuoto con intensità media $\bar I=${Un(I, 'W/m^2')}$ e lunghezza d'onda $\lambda=${Un(lam, 'm')}$. Una piccola spira di area $S=${Un(Sx * 1e4, 'cm^2')}$ (dimensioni $\ll\lambda$) è orientata in modo che la normale formi un angolo $\theta=${ang(th)}$ con la direzione del campo magnetico. Calcolare: a) le ampiezze $E_0$ e $B_0$; b) la pulsazione dell'onda; c) l'ampiezza della f.e.m. indotta nella spira.`,
      passi: [
        S`$\bar I=\tfrac12c\varepsilon_0E_0^2\Rightarrow E_0=\sqrt{2\bar I/(c\varepsilon_0)}$; $B_0=E_0/c$.`,
        S`$\omega=2\pi f=\dfrac{2\pi c}{\lambda}$.`,
        S`Spira piccola ($\lambda\gg$ dimensioni): $B$ uniforme sulla spira, $\Phi=B_0S\cos\theta\cos\omega t$ e $|\mathcal E|_{max}=\omega B_0S\cos\theta=\dfrac{2\pi E_0S\cos\theta}{\lambda}$.`,
      ],
      risultati: [S`E_0=${Un(E0, 'V/m')},\; B_0=${Un(B0, 'T')}`, S`\omega=${Un(w, 'rad/s')}`, S`\mathcal E_{max}=${P(e0, 'V')}`],
      parametri: { I, lam, S: Sx, theta: th }, valori: v,
    };
  });

  def('b5-angolo-limite-specchio', 'b5', 'Sorgente puntiforme in acqua sopra uno specchio: frazione di luce emergente', (r) => {
    const n = step(r, 1.30, 1.60, 0.05), H = step(r, 20, 80, 10) * 1e-2, h = H * pick(r, [0.25, 0.5]);
    const thc = Math.asin(1 / n), frac = 1 - Math.cos(thc);
    const rdir = h * Math.tan(thc), rref = (2 * H - h) * Math.tan(thc);
    const v = { thc, frac, rdir, rref };
    return {
      testo: S`Uno strato d'acqua di indice di rifrazione $n=${sig(n, 3)}$ e profondità $H=${cm(H)}$ copre uno specchio piano molto esteso. A profondità $h=${cm(h)}$ dalla superficie libera è posta una sorgente puntiforme che emette isotropicamente. Trascurando assorbimento e coefficienti di riflessione parziale (Fresnel), calcolare: a) l'angolo limite per la riflessione totale; b) la percentuale della potenza emessa che esce dalla superficie libera nell'aria; c) i raggi dei due cerchi luminosi sulla superficie, dovuti alla luce diretta e a quella riflessa dallo specchio.`,
      passi: [
        S`Angolo limite acqua–aria: $\sin\theta_c=1/n$.`,
        S`Escono solo i raggi con incidenza $<\theta_c$: il cono verso l'alto copre la frazione $\dfrac{1-\cos\theta_c}{2}$ della potenza isotropa. I raggi emessi verso il basso sono riflessi dallo specchio e per simmetria equivalgono a quelli di una sorgente immagine: la frazione totale è $1-\cos\theta_c$.`,
        S`Raggi dei cerchi: luce diretta $\rho_1=h\tan\theta_c$; luce riflessa (sorgente immagine a distanza $2H-h$ dalla superficie) $\rho_2=(2H-h)\tan\theta_c$.`,
      ],
      risultati: [S`\theta_c=${ang(thc)}`, S`\text{frazione}=${sig(frac * 100, 3)}\%`, S`\rho_1=${cm(rdir)},\;\rho_2=${cm(rref)}`],
      parametri: { n, H, h }, valori: v,
    };
  });

  def('b5-onda-piana', 'b5', 'Onda piana: grandezze caratteristiche, intensità e pressione', (r) => {
    const f = step(r, 50, 500, 50) * 1e6, E0 = step(r, 10, 100, 10);
    const lam = C0 / f, k = 2 * PI / lam, w = 2 * PI * f, B0 = E0 / C0, I = 0.5 * C0 * EPS0 * E0 * E0, uavg = 0.5 * EPS0 * E0 * E0, pabs = I / C0;
    const v = { lam, k, w, B0, I, uavg, pabs };
    return {
      testo: S`Nel vuoto viaggia, nella direzione dell'asse $x$, un'onda elettromagnetica piana con campo elettrico polarizzato lungo $y$: $\vec E=E_0\cos(kx-\omega t)\,\hat y$, con $E_0=${Un(E0, 'V/m')}$ e frequenza $f=${Un(f / 1e6, 'MHz')}$. Determinare: a) lunghezza d'onda, numero d'onda e pulsazione; b) l'espressione del campo magnetico (ampiezza e direzione); c) l'intensità media e la densità media di energia; d) la pressione di radiazione su una superficie perfettamente assorbente ortogonale alla propagazione.`,
      passi: [
        S`$\lambda=c/f$, $k=2\pi/\lambda$, $\omega=2\pi f$.`,
        S`Per un'onda piana $\vec B=\dfrac{\hat x\times\vec E}{c}$: $\vec B=\dfrac{E_0}{c}\cos(kx-\omega t)\,\hat z$.`,
        S`$\bar I=\tfrac12c\varepsilon_0E_0^2$, $\bar u=\tfrac12\varepsilon_0E_0^2$ (metà elettrica e metà magnetica); $p=\bar I/c$ per assorbimento totale.`,
      ],
      risultati: [S`\lambda=${Un(lam, 'm')},\; k=${Un(k, 'rad/m')},\; \omega=${Un(w, 'rad/s')}`, S`B_0=${P(B0, 'T')}\ (\hat z)`, S`\bar I=${Un(I, 'W/m^2')},\; \bar u=${Un(uavg, 'J/m^3')}`, S`p=${Un(pabs, 'Pa')}`],
      parametri: { f, E0 }, valori: v,
    };
  });

  /* =====================================================================
   * DOMANDE DI TEORIA (scritte per il sito, sul programma e nello stile dei quesiti d'esame)
   * ===================================================================== */
  const TEORIA = {
    b1: [
      ['Enunciare il teorema di Gauss per il campo elettrico e ricavare il campo di una distribuzione piana indefinita di carica.', ['enunciato in forma integrale e locale (prima equazione di Maxwell)', 'scelta della superficie gaussiana e uso della simmetria', 'risultato $E=\\sigma/2\\varepsilon_0$ e discontinuità del campo']],
      ['Calcolare l\'energia elettrostatica immagazzinata in un insieme di cariche puntiformi e collegarla all\'energia per unità di volume del campo.', ['lavoro per assemblare il sistema carica per carica', 'espressione $U=\\tfrac12\\sum q_iV_i$', 'densità $u=\\tfrac12\\varepsilon_0E^2$ per un condensatore piano']],
      ['Discutere l\'equilibrio elettrostatico di un conduttore: dove si dispongono le cariche e perché il campo interno è nullo.', ['campo nullo e potenziale costante nel conduttore', 'cariche sulla superficie (Gauss)', 'teorema di Coulomb $E=\\sigma/\\varepsilon_0$ vicino alla superficie']],
      ['Ricavare la capacità di un condensatore sferico e discutere l\'effetto di un dielettrico.', ['campo fra le armature e differenza di potenziale', 'capacità $C=4\\pi\\varepsilon_0\\dfrac{R_1R_2}{R_2-R_1}$', 'fattore $\\varepsilon_r$ e polarizzazione del dielettrico']],
      ['Definire il vettore polarizzazione e ricavare le cariche di polarizzazione; enunciare la legge di Gauss per $\\vec D$.', ['$\\sigma_p=\\vec P\\cdot\\hat n$ e $\\rho_p=-\\nabla\\cdot\\vec P$', '$\\vec D=\\varepsilon_0\\vec E+\\vec P$ e $\\nabla\\cdot\\vec D=\\rho_{libera}$', 'caso lineare $\\vec D=\\varepsilon_0\\varepsilon_r\\vec E$']],
      ['Forza e momento meccanico che un campo elettrico esterno esercita su un dipolo.', ['momento di dipolo $\\vec p$', 'momento della forza $\\vec M=\\vec p\\times\\vec E$ ed energia $U=-\\vec p\\cdot\\vec E$', 'forza in un campo non uniforme']],
    ],
    b2: [
      ['Ricavare la legge di Ohm in forma microscopica e l\'espressione dell\'effetto Joule.', ['$\\vec J=\\sigma\\vec E$ e $R=\\rho\\ell/S$', 'potenza per unità di volume $\\vec J\\cdot\\vec E$', '$P=Ri^2$ per un conduttore filiforme']],
      ['Ricavare l\'equazione di continuità della carica e discuterne il significato nel caso stazionario.', ['bilancio della carica in un volume', '$\\nabla\\cdot\\vec J+\\partial\\rho/\\partial t=0$', 'caso stazionario: $\\nabla\\cdot\\vec J=0$ e leggi di Kirchhoff']],
      ['Studiare la carica di un condensatore attraverso una resistenza: equazione del circuito, costante di tempo e andamento di $V(t)$.', ['equazione del circuito (maglia)', 'soluzione esponenziale e $\\tau=RC$', 'bilancio energetico: energia dissipata ed energia immagazzinata']],
      ['Teorema di Thevenin: formulazione, calcolo del generatore equivalente e un esempio di applicazione.', ['generatore equivalente di tensione e resistenza equivalente', 'come si calcolano $V_{th}$ e $R_{th}$', 'esempio con due resistori e un generatore']],
      ['Spiegare come il ponte di Wheatstone misura una resistenza incognita, deducendo la condizione di equilibrio.', ['schema a ponte e galvanometro', 'condizione $R_1R_x=R_2R_3$', 'sensibilità e applicazioni']],
    ],
    b3: [
      ['Enunciare la legge di Biot–Savart e ricavare il campo sull\'asse di una spira circolare.', ['forma della legge e direzione del campo', 'integrazione sulla spira', 'caso limite al centro e a grande distanza (dipolo magnetico)']],
      ['Enunciare il teorema di Ampère e ricavare il campo di un solenoide indefinito.', ['circuitazione di $\\vec B$ e corrente concatenata', 'campo uniforme interno e nullo esterno', '$B=\\mu_0nI$']],
      ['Determinare la forza di Lorentz e descrivere il moto di una carica in un campo magnetico uniforme.', ['$\\vec F=q\\vec v\\times\\vec B$ e lavoro nullo', 'moto circolare e raggio di Larmor', 'moto elicoidale con velocità iniziale obliqua']],
      ['Forze e momento meccanico su una spira rettangolare percorsa da corrente in un campo magnetico uniforme.', ['forza totale nulla', 'momento $\\vec M=\\vec m\\times\\vec B$ con $\\vec m=I\\vec S$', 'energia potenziale $U=-\\vec m\\cdot\\vec B$']],
      ['Descrivere l\'effetto Hall e ricavare la tensione di Hall.', ['geometria e deflessione dei portatori', 'equilibrio $qE_H=qv_dB$', '$V_H=\\dfrac{IB}{nqt}$ e uso per ricavare il segno e la densità dei portatori']],
      ['Classificare i materiali in base alla risposta a un campo magnetico (dia-, para-, ferromagneti) e scrivere le condizioni di raccordo di $\\vec B$ e $\\vec H$.', ['dia-, para-, ferromagnetismo e suscettività', 'definizione di $\\vec H$ e $\\vec M$', 'continuità di $B_n$ e $H_t$ all\'interfaccia']],
    ],
    b4: [
      ['Enunciare la legge di Faraday–Neumann–Lenz e ricavare la terza equazione di Maxwell.', ['f.e.m. indotta e legge di Lenz', 'forma integrale e passaggio alla forma locale con Stokes', 'campo elettrico non conservativo']],
      ['Definire il coefficiente di autoinduzione e ricavarlo per un solenoide di grande lunghezza.', ['$\\Phi=LI$ e f.e.m. autoindotta', 'flusso concatenato del solenoide', '$L=\\mu_0n^2\\ell S$']],
      ['Energia immagazzinata in un\'induttanza e densità di energia magnetica in funzione di $B$.', ['lavoro del generatore contro la f.e.m. autoindotta', '$U=\\tfrac12LI^2$', 'densità $B^2/2\\mu_0$ dal caso del solenoide']],
      ['Perché la legge di Ampère va completata? Introdurre la corrente di spostamento e scrivere l\'equazione di Ampère–Maxwell.', ['condensatore in carica e inconsistenza della legge di Ampère', '$\\vec J_s=\\varepsilon_0\\partial\\vec E/\\partial t$', 'equazione di Ampère–Maxwell completa']],
      ['Definire il concetto di mutua induzione e ricavare il coefficiente di mutua induzione fra due solenoidi coassiali.', ['flusso di un circuito concatenato con l\'altro', 'reciprocità $M_{12}=M_{21}$', 'calcolo per i due solenoidi']],
      ['Mostrare, con una sbarra mobile in un campo magnetico, che la f.e.m. di Faraday discende dalla forza di Lorentz.', ['sbarra in moto in un campo $\\vec B$ uniforme', 'campo elettromotore $\\vec v\\times\\vec B$', 'confronto con $-d\\Phi/dt$']],
    ],
    b5: [
      ['Dalle equazioni di Maxwell dedurre il teorema di Poynting e interpretare fisicamente il vettore $\\vec S$.', ['teorema di Poynting (bilancio dell\'energia)', '$\\vec S=\\vec E\\times\\vec H$', 'flusso di energia per un\'onda piana e intensità']],
      ['Elencare e giustificare le proprietà delle onde elettromagnetiche piane nel vuoto (trasversalità, rapporto $E/B$, velocità, energia).', ['ortogonalità di $\\vec E$, $\\vec B$ e direzione di propagazione', '$E=cB$ e velocità $c=1/\\sqrt{\\varepsilon_0\\mu_0}$', 'densità di energia, intensità e polarizzazione']],
      ['Leggi di Snell: deduzione e discussione del caso di riflessione totale interna.', ['principio di Fermat o condizioni di continuità all\'interfaccia', 'legge di Snell', 'angolo limite $\\sin\\theta_c=n_2/n_1$']],
      ['Illustrare l\'esperimento di Young e ricavare la posizione dei massimi di interferenza.', ['schema con due fenditure coerenti', 'differenza di cammino e condizione di massimo', 'interfrangia $\\lambda D/d$']],
      ['Ricavare l\'equazione delle onde elettromagnetiche nel vuoto dalle equazioni di Maxwell.', ['rotore del rotore e uso di $\\nabla\\cdot\\vec E=0$', 'equazione di d\'Alembert per $\\vec E$ e $\\vec B$', 'velocità di propagazione']],
    ],
  };

  /* =====================================================================
   * API
   * ===================================================================== */
  const BLOCCHI = ['b1', 'b2', 'b3', 'b4', 'b5'];
  const lista = (b) => Object.values(T).filter((t) => !b || t.blocco === b);

  /* esercizio da un seme; il template è scelto dal seme (o forzato con tplId) */
  function generaEsercizio(seme, blocco, tplId) {
    const r = rng(seme >>> 0);
    const cand = lista(blocco);
    if (!cand.length) throw new Error('blocco senza template: ' + blocco);
    const tpl = tplId ? T[tplId] : pick(r, cand);
    const out = tpl.fn(rng((seme * 2654435761) >>> 0));
    return { id: tpl.id, blocco: tpl.blocco, tema: tpl.tema, seme, ...out };
  }

  function generaTeoria(seme, blocco) {
    const r = rng((seme ^ 0x9e3779b9) >>> 0);
    const bank = TEORIA[blocco] || TEORIA.b1;
    const [testo, traccia] = pick(r, bank);
    return { blocco, testo, traccia, seme };
  }

  /* Composizione di una prova.
   * - 'misto': 4 blocchi di esercizi distinti + 2 domande di teoria di blocchi distinti
   * - 'appello': ricalca la struttura (blocchi) di un appello storico scelto a caso fra quelli registrati in data/appelli.json
   * - 'orale': 3 domande di teoria di blocchi diversi */
  function generaProva(seme, appelli, tipo) {
    const r = rng(seme >>> 0);
    let eserBlocchi, teorBlocchi, modello = null;
    if (tipo === 'appello') {
      const complete = (appelli && appelli.appelli ? appelli.appelli : []).filter((a) => a.esercizi.length === 4 && a.teoria.length >= 2);
      modello = complete.length ? pick(r, complete) : null;
      eserBlocchi = modello ? modello.esercizi.map((e) => e.blocco) : ['b1', 'b2', 'b3', 'b4'];
      teorBlocchi = modello ? modello.teoria.slice(0, 2).map((q) => q.blocco) : ['b1', 'b4'];
    } else if (tipo === 'orale') {
      eserBlocchi = [];
      teorBlocchi = shuffle(r, BLOCCHI).slice(0, 3);
    } else {
      eserBlocchi = shuffle(r, BLOCCHI).slice(0, 4).sort();
      teorBlocchi = shuffle(r, BLOCCHI).slice(0, 2);
    }
    const usati = new Set();
    const esercizi = eserBlocchi.map((b, i) => {
      let s = (seme * 31 + i * 977 + 11) >>> 0, e = generaEsercizio(s, b);
      for (let k = 0; k < 20 && usati.has(e.id); k++) { s = (s + 7919) >>> 0; e = generaEsercizio(s, b); }
      usati.add(e.id);
      return e;
    });
    const teoria = teorBlocchi.map((b, i) => generaTeoria((seme * 17 + i * 313 + 5) >>> 0, b));
    return { seme, tipo, modello: modello ? { id: modello.id, data: modello.data, titolo: modello.titolo } : null, esercizi, teoria };
  }

  return { generaEsercizio, generaTeoria, generaProva, lista, BLOCCHI, templates: T, rng, constants: { EPS0, MU0, C0, K } };
});
