/** Blocco 3 — Magnetostatica nel vuoto e nella materia (template del sito originale). */
import { defineTemplate, MU0, PI, S, step } from './lib';

defineTemplate({
  id: 'b3-coassiale',
  blocco: 'b3',
  topic: 'magnetostatica-nel-vuoto',
  objectives: ['magnetostatica-nel-vuoto.4'],
  tema: { it: 'Campo magnetico di un cavo coassiale', en: 'Magnetic field of a coaxial cable' },
  make(r, { t, P, Un, mm }) {
    const a = step(r, 1, 3, 0.5) * 1e-3,
      b = a * step(r, 2, 3, 0.5),
      c = b * step(r, 1.2, 1.5, 0.1),
      I = step(r, 5, 50, 5);
    const B = (x: number) =>
      x < a
        ? (MU0 * I * x) / (2 * PI * a * a)
        : x < b
          ? (MU0 * I) / (2 * PI * x)
          : x < c
            ? (MU0 * I * (c * c - x * x)) / (2 * PI * x * (c * c - b * b))
            : 0;
    const rs = [a / 2, (a + b) / 2, (b + c) / 2, 2 * c] as const;
    const v = { B1: B(rs[0]), B2: B(rs[1]), B3: B(rs[2]), B4: B(rs[3]) };
    return {
      statement: t(
        S`Un cavo coassiale è formato da un conduttore cilindrico pieno di raggio $a=${mm(a)}$ e da un conduttore tubolare coassiale di raggio interno $b=${mm(b)}$ ed esterno $c=${mm(c)}$. Nei due conduttori scorre la stessa corrente $I=${Un(I, 'A')}$ in versi opposti, distribuita uniformemente sulle sezioni. Ricavare l'espressione di $B(r)$ nelle quattro regioni e calcolarne il valore nei punti $r_1=${mm(rs[0])}$, $r_2=${mm(rs[1])}$, $r_3=${mm(rs[2])}$, $r_4=${mm(rs[3])}$.`,
        S`A coaxial cable consists of a solid cylindrical conductor of radius $a=${mm(a)}$ and a coaxial tubular conductor of inner radius $b=${mm(b)}$ and outer radius $c=${mm(c)}$. The same current $I=${Un(I, 'A')}$ flows in opposite directions in the two conductors, uniformly distributed over the cross-sections. Derive the expression of $B(r)$ in the four regions and compute its value at the points $r_1=${mm(rs[0])}$, $r_2=${mm(rs[1])}$, $r_3=${mm(rs[2])}$, $r_4=${mm(rs[3])}$.`,
      ),
      steps: [
        t(
          S`Per simmetria $B$ è azimutale e la legge di Ampère dà $B\,2\pi r=\mu_0 I_{conc}(r)$.`,
          S`By symmetry $B$ is azimuthal and Ampère's law gives $B\,2\pi r=\mu_0 I_{conc}(r)$.`,
        ),
        S`$r<a$: $I_{conc}=I r^2/a^2\Rightarrow B=\dfrac{\mu_0 I r}{2\pi a^2}$; $a<r<b$: $B=\dfrac{\mu_0 I}{2\pi r}$.`,
        t(
          S`$b<r<c$: $I_{conc}=I-I\dfrac{r^2-b^2}{c^2-b^2}\Rightarrow B=\dfrac{\mu_0 I}{2\pi r}\dfrac{c^2-r^2}{c^2-b^2}$; $r>c$: corrente totale nulla, $B=0$. Risultati: $B(r_1)=${P(v.B1, 'T')}$, $B(r_2)=${P(v.B2, 'T')}$, $B(r_3)=${P(v.B3, 'T')}$, $B(r_4)=0$.`,
          S`$b<r<c$: $I_{conc}=I-I\dfrac{r^2-b^2}{c^2-b^2}\Rightarrow B=\dfrac{\mu_0 I}{2\pi r}\dfrac{c^2-r^2}{c^2-b^2}$; $r>c$: zero total current, $B=0$. Results: $B(r_1)=${P(v.B1, 'T')}$, $B(r_2)=${P(v.B2, 'T')}$, $B(r_3)=${P(v.B3, 'T')}$, $B(r_4)=0$.`,
        ),
      ],
      answer: [
        { label: 'B(r₁)', value: v.B1, unit: 'T' },
        { label: 'B(r₂)', value: v.B2, unit: 'T' },
        { label: 'B(r₃)', value: v.B3, unit: 'T' },
      ],
      parametri: { a, b, c, I },
      valori: v,
    };
  },
});

defineTemplate({
  id: 'b3-cilindro-j-kr',
  blocco: 'b3',
  topic: 'magnetostatica-nel-vuoto',
  objectives: ['magnetostatica-nel-vuoto.4'],
  tema: { it: 'Cilindro con densità di corrente J = k·r', en: 'Cylinder with current density J = k·r' },
  make(r, { t, P, Un, mm }) {
    const R = step(r, 5, 20, 1) * 1e-3,
      I = step(r, 5, 30, 5),
      k = (3 * I) / (2 * PI * R ** 3);
    const Bin = (x: number) => (MU0 * k * x * x) / 3,
      Bout = (x: number) => (MU0 * I) / (2 * PI * x);
    const v = { B_meta: Bin(R / 2), B_2R: Bout(2 * R), B_R: Bin(R), I };
    return {
      statement: t(
        S`Una corrente stazionaria scorre in un conduttore cilindrico indefinito, di raggio $R=${mm(R)}$, con densità di corrente parallela all'asse $J=k\,r$, dove $r$ è la distanza dall'asse e $k=${Un(k, 'A/m^3')}$. Calcolare: a) la corrente totale $I$; b) la legge $B(r)$ del campo magnetico all'interno e all'esterno del conduttore; c) i valori di $B$ a $r=R/2$ e $r=2R$.`,
        S`A steady current flows in an infinite cylindrical conductor of radius $R=${mm(R)}$, with current density parallel to the axis $J=k\,r$, where $r$ is the distance from the axis and $k=${Un(k, 'A/m^3')}$. Compute: a) the total current $I$; b) the law $B(r)$ of the magnetic field inside and outside the conductor; c) the values of $B$ at $r=R/2$ and $r=2R$.`,
      ),
      steps: [
        S`$I=\int_0^R k r\,2\pi r\,dr=\dfrac{2\pi kR^3}{3}$.`,
        t(
          S`Ampère su una circonferenza di raggio $r<R$: $B\,2\pi r=\mu_0\dfrac{2\pi k r^3}{3}\Rightarrow B=\dfrac{\mu_0 k r^2}{3}$.`,
          S`Ampère on a circle of radius $r<R$: $B\,2\pi r=\mu_0\dfrac{2\pi k r^3}{3}\Rightarrow B=\dfrac{\mu_0 k r^2}{3}$.`,
        ),
        t(
          S`Per $r>R$ la corrente concatenata è $I$: $B=\dfrac{\mu_0 I}{2\pi r}$ (continuo in $r=R$). Risultati: $I=${Un(I, 'A')}$, $B(R/2)=${P(v.B_meta, 'T')}$, $B(2R)=${P(v.B_2R, 'T')}$.`,
          S`For $r>R$ the linked current is $I$: $B=\dfrac{\mu_0 I}{2\pi r}$ (continuous at $r=R$). Results: $I=${Un(I, 'A')}$, $B(R/2)=${P(v.B_meta, 'T')}$, $B(2R)=${P(v.B_2R, 'T')}$.`,
        ),
      ],
      answer: [
        { label: 'I', value: I, unit: 'A' },
        { label: 'B(R/2)', value: v.B_meta, unit: 'T' },
        { label: 'B(2R)', value: v.B_2R, unit: 'T' },
      ],
      parametri: { R, I, k },
      valori: v,
    };
  },
});

defineTemplate({
  id: 'b3-spira-semicerchio',
  blocco: 'b3',
  topic: 'magnetostatica-nel-vuoto',
  objectives: ['magnetostatica-nel-vuoto.3'],
  tema: {
    it: 'Campo al centro di un filo a U con semicerchio',
    en: 'Field at the centre of a U-shaped wire with a semicircle',
  },
  make(r, { t, P, Un, cm }) {
    const R = step(r, 2, 10, 1) * 1e-2,
      I = step(r, 1, 10, 1);
    const B = ((MU0 * I) / (4 * R)) * (1 + 2 / PI);
    const v = { B, Bsem: (MU0 * I) / (4 * R), Brett: (MU0 * I) / (4 * PI * R) };
    return {
      statement: t(
        S`Un filo percorso da una corrente $I=${Un(I, 'A')}$ è formato da un semicerchio di raggio $R=${cm(R)}$ e da due tratti rettilinei semi-infiniti, paralleli, ciascuno tangente al semicerchio nel proprio estremo (il filo ha la forma di una U allungata). La corrente percorre il semicerchio in senso orario. Calcolare il modulo, la direzione e il verso del campo di induzione magnetica nel centro $C$ del semicerchio.`,
        S`A wire carrying a current $I=${Un(I, 'A')}$ consists of a semicircle of radius $R=${cm(R)}$ and two parallel semi-infinite straight segments, each tangent to the semicircle at its end (the wire has the shape of an elongated U). The current flows clockwise along the semicircle. Compute the magnitude, direction and sense of the magnetic induction at the centre $C$ of the semicircle.`,
      ),
      steps: [
        t(
          S`Semicerchio: $B_1=\dfrac12\dfrac{\mu_0 I}{2R}=\dfrac{\mu_0 I}{4R}$.`,
          S`Semicircle: $B_1=\dfrac12\dfrac{\mu_0 I}{2R}=\dfrac{\mu_0 I}{4R}$.`,
        ),
        t(
          S`Ciascun tratto rettilineo semi-infinito, che termina nel piede della perpendicolare condotta da $C$ (distanza $R$): $B_2=\dfrac{\mu_0 I}{4\pi R}$.`,
          S`Each semi-infinite straight segment, ending at the foot of the perpendicular from $C$ (distance $R$): $B_2=\dfrac{\mu_0 I}{4\pi R}$.`,
        ),
        t(
          S`I tre contributi sono concordi (regola della mano destra): $B=\dfrac{\mu_0 I}{4R}\left(1+\dfrac2\pi\right)=${P(B, 'T')}$, ortogonale al piano del filo e, con corrente oraria, entrante nel foglio.`,
          S`The three contributions point the same way (right-hand rule): $B=\dfrac{\mu_0 I}{4R}\left(1+\dfrac2\pi\right)=${P(B, 'T')}$, perpendicular to the plane of the wire and, with clockwise current, into the page.`,
        ),
      ],
      answer: [{ label: 'B', value: B, unit: 'T' }],
      parametri: { R, I },
      valori: v,
    };
  },
});

defineTemplate({
  id: 'b3-toroide-traferro',
  blocco: 'b3',
  topic: 'magnetismo-nella-materia',
  objectives: ['magnetismo-nella-materia.5', 'magnetismo-nella-materia.2'],
  tema: { it: 'Toroide di ferro con traferro', en: 'Iron toroid with an air gap' },
  make(r, { t, P, Un, cm, mm, I_ }) {
    const Rm = step(r, 5, 15, 1) * 1e-2,
      L = step(r, 1, 3, 0.5) * 1e-2,
      d = step(r, 1, 4, 0.5) * 1e-3,
      N = step(r, 200, 1000, 100),
      I = step(r, 0.5, 3, 0.5),
      mur = step(r, 500, 3000, 500);
    const lfe = 2 * PI * Rm - d,
      B = (MU0 * N * I) / (d + lfe / mur),
      Hfe = B / (MU0 * mur),
      Ha = B / MU0,
      Phi = B * L * L,
      Ug = ((B * B) / (2 * MU0)) * L * L * d;
    const v = { B, Hfe, Ha, Phi, Ug };
    return {
      statement: t(
        S`Un toroide di ferro, di raggio medio $R=${cm(Rm)}$ e sezione quadrata di lato $L=${cm(L)}$, porta un avvolgimento di $N=${I_(N)}$ spire percorso dalla corrente $I=${Un(I, 'A')}$. Il nucleo ha permeabilità relativa $\mu_r=${I_(mur)}$ (costante) ed è interrotto da un'intercapedine d'aria (traferro) di larghezza $d=${mm(d)}$. Trascurando la dispersione del flusso e gli effetti di bordo, calcolare: a) il campo $B$ nel nucleo; b) i campi $H$ nel ferro e nel traferro; c) il flusso; d) l'energia magnetica immagazzinata nel traferro.`,
        S`An iron toroid of mean radius $R=${cm(Rm)}$ and square cross-section of side $L=${cm(L)}$ carries a winding of $N=${I_(N)}$ turns with current $I=${Un(I, 'A')}$. The core has relative permeability $\mu_r=${I_(mur)}$ (constant) and is interrupted by an air gap of width $d=${mm(d)}$. Neglecting flux leakage and edge effects, compute: a) the field $B$ in the core; b) the fields $H$ in the iron and in the gap; c) the flux; d) the magnetic energy stored in the gap.`,
      ),
      steps: [
        t(
          S`Il flusso si conserva e la sezione è costante, quindi $B$ è lo stesso nel ferro e nel traferro (componente normale continua).`,
          S`The flux is conserved and the cross-section is constant, so $B$ is the same in the iron and in the gap (continuous normal component).`,
        ),
        t(
          S`Ampère per $H$: $NI=H_{fe}\,(2\pi R-d)+H_0\,d$ con $H_{fe}=\dfrac{B}{\mu_0\mu_r}$, $H_0=\dfrac{B}{\mu_0}$, da cui $B=\dfrac{\mu_0NI}{d+(2\pi R-d)/\mu_r}$.`,
          S`Ampère for $H$: $NI=H_{fe}\,(2\pi R-d)+H_0\,d$ with $H_{fe}=\dfrac{B}{\mu_0\mu_r}$, $H_0=\dfrac{B}{\mu_0}$, hence $B=\dfrac{\mu_0NI}{d+(2\pi R-d)/\mu_r}$.`,
        ),
        t(
          S`$\Phi=BL^2$; energia nel traferro $U=\dfrac{B^2}{2\mu_0}L^2d$. Risultati: $B=${P(B, 'T')}$, $H_{fe}=${Un(Hfe, 'A/m')}$, $H_0=${Un(Ha, 'A/m')}$, $\Phi=${P(Phi, 'Wb')}$, $U=${P(Ug, 'J')}$.`,
          S`$\Phi=BL^2$; energy in the gap $U=\dfrac{B^2}{2\mu_0}L^2d$. Results: $B=${P(B, 'T')}$, $H_{fe}=${Un(Hfe, 'A/m')}$, $H_0=${Un(Ha, 'A/m')}$, $\Phi=${P(Phi, 'Wb')}$, $U=${P(Ug, 'J')}$.`,
        ),
      ],
      answer: [
        { label: 'B', value: B, unit: 'T' },
        { label: 'H_fe', value: Hfe, unit: 'A/m' },
        { label: 'H₀', value: Ha, unit: 'A/m' },
        { label: 'Φ', value: Phi, unit: 'Wb' },
        { label: 'U', value: Ug, unit: 'J' },
      ],
      parametri: { R: Rm, L, d, N, I, mur },
      valori: v,
    };
  },
});

defineTemplate({
  id: 'b3-spira-filo-carica',
  blocco: 'b3',
  topic: 'campi-variabili',
  objectives: ['campi-variabili.5'],
  tema: {
    it: 'Spira che si allontana da un filo: carica circolata',
    en: 'Loop moving away from a wire: charge that flows',
  },
  make(r, { t, P, Un, cm }) {
    const I = step(r, 5, 30, 5),
      h = step(r, 5, 20, 5) * 1e-2,
      l = step(r, 5, 15, 5) * 1e-2,
      R = step(r, 0.1, 1, 0.1),
      d1 = step(r, 2, 5, 1) * 1e-2,
      d2 = d1 + step(r, 5, 15, 5) * 1e-2;
    const Phi = (d: number) => ((MU0 * I * h) / (2 * PI)) * Math.log((d + l) / d),
      Q = (Phi(d1) - Phi(d2)) / R;
    const v = { Phi1: Phi(d1), Phi2: Phi(d2), Q };
    return {
      statement: t(
        S`Una spira rettangolare di lati $h=${cm(h)}$ (parallelo al filo) e $l=${cm(l)}$ e resistenza $R=${Un(R, '\\Omega')}$ giace nel piano di un conduttore rettilineo molto lungo, attraversato dalla corrente continua $I=${Un(I, 'A')}$. Il lato parallelo più vicino al filo dista $d_1=${cm(d1)}$. La spira viene allontanata dal filo, restando nel piano, fino a $d_2=${cm(d2)}$. Calcolare: a) il flusso concatenato nelle due posizioni; b) la carica totale che circola nella spira; c) il verso della corrente indotta.`,
        S`A rectangular loop with sides $h=${cm(h)}$ (parallel to the wire) and $l=${cm(l)}$ and resistance $R=${Un(R, '\\Omega')}$ lies in the plane of a very long straight conductor carrying the direct current $I=${Un(I, 'A')}$. The parallel side closest to the wire is at $d_1=${cm(d1)}$. The loop is moved away from the wire, staying in the plane, up to $d_2=${cm(d2)}$. Compute: a) the linked flux in the two positions; b) the total charge that flows in the loop; c) the direction of the induced current.`,
      ),
      steps: [
        S`$B(x)=\dfrac{\mu_0I}{2\pi x}$: $\Phi(d)=\int_d^{d+l}\dfrac{\mu_0I}{2\pi x}h\,dx=\dfrac{\mu_0Ih}{2\pi}\ln\dfrac{d+l}{d}$.`,
        t(
          S`Legge di Faraday–Neumann: $i=-\dfrac{1}{R}\dfrac{d\Phi}{dt}$, quindi $Q=\int i\,dt=\dfrac{\Phi_1-\Phi_2}{R}$ (indipendente dal tempo impiegato, legge di Felici).`,
          S`Faraday–Neumann law: $i=-\dfrac{1}{R}\dfrac{d\Phi}{dt}$, so $Q=\int i\,dt=\dfrac{\Phi_1-\Phi_2}{R}$ (independent of the time taken, Felici's law).`,
        ),
        t(
          S`Il flusso diminuisce: per la legge di Lenz la corrente indotta genera un campo concorde con quello del filo dentro la spira, per opporsi alla diminuzione. Risultati: $\Phi_1=${P(v.Phi1, 'Wb')}$, $\Phi_2=${P(v.Phi2, 'Wb')}$, $Q=${P(Q, 'C')}$.`,
          S`The flux decreases: by Lenz's law the induced current produces, inside the loop, a field in the same direction as the wire's, to oppose the decrease. Results: $\Phi_1=${P(v.Phi1, 'Wb')}$, $\Phi_2=${P(v.Phi2, 'Wb')}$, $Q=${P(Q, 'C')}$.`,
        ),
      ],
      answer: [
        { label: 'Φ₁', value: v.Phi1, unit: 'Wb' },
        { label: 'Φ₂', value: v.Phi2, unit: 'Wb' },
        { label: 'Q', value: Q, unit: 'C' },
      ],
      parametri: { I, h, l, R, d1, d2 },
      valori: v,
    };
  },
});
