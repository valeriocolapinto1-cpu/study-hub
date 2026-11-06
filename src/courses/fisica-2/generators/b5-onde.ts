/** Blocco 5 — Onde elettromagnetiche e ottica (template del sito originale). */
import { defineTemplate, C0, EPS0, PI, S, pick, step } from './lib';

defineTemplate({
  id: 'b5-stella',
  blocco: 'b5',
  topic: 'onde-elettromagnetiche',
  objectives: ['onde-elettromagnetiche.4'],
  tema: { it: 'Radiazione emessa da una stella', en: 'Radiation emitted by a star' },
  make(r, { t, Un }) {
    const Rs = step(r, 0.5, 3, 0.5) * 6.96e8, d = step(r, 0.8, 3, 0.1) * 1.496e11, Ed = step(r, 500, 1200, 50);
    const Id = 0.5 * C0 * EPS0 * Ed * Ed, Pw = 4 * PI * d * d * Id, Is = Pw / (4 * PI * Rs * Rs), Es = (Ed * d) / Rs, Bs = Es / C0;
    return {
      statement: t(
        S`Una stella di raggio $R_s=${Un(Rs, 'm')}$ irradia onde elettromagnetiche in modo isotropo. Una sonda posta a distanza $d=${Un(d, 'm')}$ dal centro della stella registra un campo elettrico di ampiezza $E_d=${Un(Ed, 'V/m')}$. Trascurando assorbimenti lungo il tragitto, calcolare: a) l'intensità media $I$ a distanza $d$; b) la potenza totale emessa; c) l'intensità media e le ampiezze dei campi $\vec E$ e $\vec B$ sulla superficie della stella.`,
        S`A star of radius $R_s=${Un(Rs, 'm')}$ radiates electromagnetic waves isotropically. A probe at distance $d=${Un(d, 'm')}$ from the centre of the star records an electric field of amplitude $E_d=${Un(Ed, 'V/m')}$. Neglecting absorption along the way, compute: a) the average intensity $I$ at distance $d$; b) the total emitted power; c) the average intensity and the amplitudes of the fields $\vec E$ and $\vec B$ at the surface of the star.`,
      ),
      steps: [
        t(S`Per un'onda piana (approssimazione locale) $I=\tfrac12c\varepsilon_0E_0^2$.`, S`For a plane wave (local approximation) $I=\tfrac12c\varepsilon_0E_0^2$.`),
        t(S`Potenza totale $P=I\cdot4\pi d^2$ (conservazione dell'energia attraverso sfere concentriche).`, S`Total power $P=I\cdot4\pi d^2$ (energy conservation through concentric spheres).`),
        t(S`Alla superficie $I_s=\dfrac{P}{4\pi R_s^2}$; poiché $I\propto E_0^2$ si ha $E_0\propto 1/r$: $E_s=E_d\dfrac{d}{R_s}$ e $B_s=E_s/c$. Risultati: $I=${Un(Id, 'W/m^2')}$, $P=${Un(Pw, 'W')}$, $I_s=${Un(Is, 'W/m^2')}$, $E_s=${Un(Es, 'V/m')}$, $B_s=${Un(Bs, 'T')}$.`, S`At the surface $I_s=\dfrac{P}{4\pi R_s^2}$; since $I\propto E_0^2$, $E_0\propto 1/r$: $E_s=E_d\dfrac{d}{R_s}$ and $B_s=E_s/c$. Results: $I=${Un(Id, 'W/m^2')}$, $P=${Un(Pw, 'W')}$, $I_s=${Un(Is, 'W/m^2')}$, $E_s=${Un(Es, 'V/m')}$, $B_s=${Un(Bs, 'T')}$.`),
      ],
      answer: [
        { label: 'I', value: Id, unit: 'W/m²' },
        { label: 'P', value: Pw, unit: 'W' },
        { label: 'I_s', value: Is, unit: 'W/m²' },
        { label: 'E_s', value: Es, unit: 'V/m' },
        { label: 'B_s', value: Bs, unit: 'T' },
      ],
      parametri: { Rs, d, Ed },
      valori: { Id, Pw, Is, Es, Bs },
    };
  },
});

defineTemplate({
  id: 'b5-laser',
  blocco: 'b5',
  topic: 'onde-elettromagnetiche',
  objectives: ['onde-elettromagnetiche.4'],
  tema: { it: 'Fascio laser: intensità, campi e pressione di radiazione', en: 'Laser beam: intensity, fields and radiation pressure' },
  make(r, { t, P, Un, mm }) {
    const W = step(r, 1, 5, 0.5) * 1e-3, dd = step(r, 2, 8, 1) * 1e-3;
    const A = (PI * dd * dd) / 4, I = W / A, E0 = Math.sqrt((2 * I) / (C0 * EPS0)), B0 = E0 / C0, pr = I / C0, F = W / C0;
    return {
      statement: t(
        S`Un puntatore laser emette un fascio cilindrico di potenza media $\bar W=${P(W, 'W')}$. Sullo schermo la luce illumina un cerchio di diametro $d=${mm(dd)}$. Determinare: a) l'intensità media del fascio; b) le ampiezze massime dei campi $\vec E$ e $\vec B$; c) la pressione di radiazione e la forza esercitata se lo schermo assorbe completamente la luce.`,
        S`A laser pointer emits a cylindrical beam of average power $\bar W=${P(W, 'W')}$. On the screen the light illuminates a circle of diameter $d=${mm(dd)}$. Find: a) the average intensity of the beam; b) the peak amplitudes of the fields $\vec E$ and $\vec B$; c) the radiation pressure and the force exerted if the screen absorbs the light completely.`,
      ),
      steps: [
        S`$I=\dfrac{\bar W}{\pi d^2/4}$.`,
        t(S`$I=\tfrac12c\varepsilon_0E_0^2\Rightarrow E_0=\sqrt{\dfrac{2I}{c\varepsilon_0}}$ e $B_0=E_0/c$.`, S`$I=\tfrac12c\varepsilon_0E_0^2\Rightarrow E_0=\sqrt{\dfrac{2I}{c\varepsilon_0}}$ and $B_0=E_0/c$.`),
        t(S`Per assorbimento totale la pressione è $p=I/c$ e la forza $F=pA=\bar W/c$. Risultati: $I=${Un(I, 'W/m^2')}$, $E_0=${Un(E0, 'V/m')}$, $B_0=${Un(B0, 'T')}$, $p=${Un(pr, 'Pa')}$, $F=${Un(F, 'N')}$.`, S`For total absorption the pressure is $p=I/c$ and the force $F=pA=\bar W/c$. Results: $I=${Un(I, 'W/m^2')}$, $E_0=${Un(E0, 'V/m')}$, $B_0=${Un(B0, 'T')}$, $p=${Un(pr, 'Pa')}$, $F=${Un(F, 'N')}$.`),
      ],
      answer: [
        { label: 'I', value: I, unit: 'W/m²' },
        { label: 'E₀', value: E0, unit: 'V/m' },
        { label: 'B₀', value: B0, unit: 'T' },
        { label: 'p', value: pr, unit: 'Pa' },
        { label: 'F', value: F, unit: 'N' },
      ],
      parametri: { W, d: dd },
      valori: { I, E0, B0, pr, F },
    };
  },
});

defineTemplate({
  id: 'b5-young',
  blocco: 'b5',
  topic: 'radiazione-materia',
  objectives: ['radiazione-materia.6'],
  tema: { it: 'Interferenza di Young con lastrina trasparente', en: "Young's interference with a transparent plate" },
  make(r, { t, P, Un, mm, sig }) {
    const lam = step(r, 400, 700, 50) * 1e-9, d = step(r, 0.1, 0.5, 0.05) * 1e-3, D = step(r, 1, 3, 0.5), n = step(r, 1.4, 1.7, 0.1), th = step(r, 5, 20, 5) * 1e-6;
    const dy = (lam * D) / d, y3 = 3 * dy, shift = (D * (n - 1) * th) / d, nfr = ((n - 1) * th) / lam;
    return {
      statement: t(
        S`In un esperimento di Young due fenditure sottili distano $d=${mm(d)}$ e lo schermo è a $D=${Un(D, 'm')}$ dalle fenditure ($D\gg d$). Si usa luce monocromatica di lunghezza d'onda $\lambda=${Un(lam * 1e9, 'nm')}$. Calcolare: a) la distanza fra due massimi consecutivi; b) la posizione del terzo massimo luminoso rispetto a quello centrale; c) di quanto si sposta la frangia centrale se davanti a una fenditura si pone una lamina trasparente di indice di rifrazione $n=${sig(n, 2)}$ e spessore $t=${Un(th * 1e6, '\\mu m')}$.`,
        S`In a Young experiment two thin slits are $d=${mm(d)}$ apart and the screen is at $D=${Un(D, 'm')}$ from the slits ($D\gg d$). Monochromatic light of wavelength $\lambda=${Un(lam * 1e9, 'nm')}$ is used. Compute: a) the distance between two consecutive maxima; b) the position of the third bright maximum relative to the central one; c) how far the central fringe shifts if a transparent plate of refractive index $n=${sig(n, 2)}$ and thickness $t=${Un(th * 1e6, '\\mu m')}$ is placed in front of one slit.`,
      ),
      steps: [
        t(S`Differenza di cammino $\Delta=d\sin\theta\simeq d\,y/D$; massimi per $\Delta=m\lambda$: $y_m=m\dfrac{\lambda D}{d}$, quindi $\Delta y=\dfrac{\lambda D}{d}$ e $y_3=3\Delta y$.`, S`Path difference $\Delta=d\sin\theta\simeq d\,y/D$; maxima for $\Delta=m\lambda$: $y_m=m\dfrac{\lambda D}{d}$, so $\Delta y=\dfrac{\lambda D}{d}$ and $y_3=3\Delta y$.`),
        t(S`La lamina aggiunge un cammino ottico $(n-1)t$: il massimo centrale si sposta verso il lato della lamina in modo che $d\,y/D=(n-1)t$.`, S`The plate adds an optical path $(n-1)t$: the central maximum shifts towards the side of the plate so that $d\,y/D=(n-1)t$.`),
        t(S`$\Delta y_{shift}=\dfrac{D(n-1)t}{d}$, pari a $\dfrac{(n-1)t}{\lambda}=${sig(nfr, 3)}$ interfrange. Risultati: $\Delta y=${P(dy, 'm')}$, $y_3=${P(y3, 'm')}$, $\Delta y_{shift}=${P(shift, 'm')}$.`, S`$\Delta y_{shift}=\dfrac{D(n-1)t}{d}$, equal to $\dfrac{(n-1)t}{\lambda}=${sig(nfr, 3)}$ fringe spacings. Results: $\Delta y=${P(dy, 'm')}$, $y_3=${P(y3, 'm')}$, $\Delta y_{shift}=${P(shift, 'm')}$.`),
      ],
      answer: [
        { label: 'Δy', value: dy, unit: 'm' },
        { label: 'y₃', value: y3, unit: 'm' },
        { label: 'Δy_shift', value: shift, unit: 'm' },
      ],
      parametri: { lam, d, D, n, t: th },
      valori: { dy, y3, shift, nfr },
    };
  },
});

defineTemplate({
  id: 'b5-spira-onda',
  blocco: 'b5',
  topic: 'onde-elettromagnetiche',
  objectives: ['onde-elettromagnetiche.2'],
  tema: { it: "F.e.m. indotta in una spira da un'onda piana", en: 'Emf induced in a loop by a plane wave' },
  make(r, { t, P, Un, ang }) {
    const I = step(r, 1, 100, 5), lam = step(r, 1, 10, 1), Sx = step(r, 50, 500, 50) * 1e-4, th = (pick(r, [0, 30, 45, 60]) * PI) / 180;
    const E0 = Math.sqrt((2 * I) / (C0 * EPS0)), B0 = E0 / C0, w = (2 * PI * C0) / lam, e0 = w * B0 * Sx * Math.cos(th);
    return {
      statement: t(
        S`Un'onda elettromagnetica piana sinusoidale, polarizzata linearmente, si propaga nel vuoto con intensità media $\bar I=${Un(I, 'W/m^2')}$ e lunghezza d'onda $\lambda=${Un(lam, 'm')}$. Una piccola spira di area $S=${Un(Sx * 1e4, 'cm^2')}$ (dimensioni $\ll\lambda$) è orientata in modo che la normale formi un angolo $\theta=${ang(th)}$ con la direzione del campo magnetico. Calcolare: a) le ampiezze $E_0$ e $B_0$; b) la pulsazione dell'onda; c) l'ampiezza della f.e.m. indotta nella spira.`,
        S`A linearly polarised sinusoidal plane electromagnetic wave travels in vacuum with average intensity $\bar I=${Un(I, 'W/m^2')}$ and wavelength $\lambda=${Un(lam, 'm')}$. A small loop of area $S=${Un(Sx * 1e4, 'cm^2')}$ (size $\ll\lambda$) is oriented so that its normal makes an angle $\theta=${ang(th)}$ with the direction of the magnetic field. Compute: a) the amplitudes $E_0$ and $B_0$; b) the angular frequency of the wave; c) the amplitude of the emf induced in the loop.`,
      ),
      steps: [
        S`$\bar I=\tfrac12c\varepsilon_0E_0^2\Rightarrow E_0=\sqrt{2\bar I/(c\varepsilon_0)}$; $B_0=E_0/c$.`,
        S`$\omega=2\pi f=\dfrac{2\pi c}{\lambda}$.`,
        t(S`Spira piccola ($\lambda\gg$ dimensioni): $B$ uniforme sulla spira, $\Phi=B_0S\cos\theta\cos\omega t$ e $|\mathcal E|_{max}=\omega B_0S\cos\theta=\dfrac{2\pi E_0S\cos\theta}{\lambda}$. Risultati: $E_0=${Un(E0, 'V/m')}$, $B_0=${Un(B0, 'T')}$, $\omega=${Un(w, 'rad/s')}$, $\mathcal E_{max}=${P(e0, 'V')}$.`, S`Small loop ($\lambda\gg$ size): $B$ uniform over the loop, $\Phi=B_0S\cos\theta\cos\omega t$ and $|\mathcal E|_{max}=\omega B_0S\cos\theta=\dfrac{2\pi E_0S\cos\theta}{\lambda}$. Results: $E_0=${Un(E0, 'V/m')}$, $B_0=${Un(B0, 'T')}$, $\omega=${Un(w, 'rad/s')}$, $\mathcal E_{max}=${P(e0, 'V')}$.`),
      ],
      answer: [
        { label: 'E₀', value: E0, unit: 'V/m' },
        { label: 'B₀', value: B0, unit: 'T' },
        { label: 'ω', value: w, unit: 'rad/s' },
        { label: 'ℰ_max', value: e0, unit: 'V' },
      ],
      parametri: { I, lam, S: Sx, theta: th },
      valori: { E0, B0, w, e0 },
    };
  },
});

defineTemplate({
  id: 'b5-angolo-limite-specchio',
  blocco: 'b5',
  topic: 'radiazione-materia',
  objectives: ['radiazione-materia.2'],
  tema: { it: 'Sorgente puntiforme in acqua sopra uno specchio: frazione di luce emergente', en: 'Point source in water above a mirror: fraction of light emerging' },
  make(r, { t, cm, ang, sig }) {
    const n = step(r, 1.3, 1.6, 0.05), H = step(r, 20, 80, 10) * 1e-2, h = H * pick(r, [0.25, 0.5]);
    const thc = Math.asin(1 / n), frac = 1 - Math.cos(thc);
    const rdir = h * Math.tan(thc), rref = (2 * H - h) * Math.tan(thc);
    return {
      statement: t(
        S`Uno strato d'acqua di indice di rifrazione $n=${sig(n, 3)}$ e profondità $H=${cm(H)}$ copre uno specchio piano molto esteso. A profondità $h=${cm(h)}$ dalla superficie libera è posta una sorgente puntiforme che emette isotropicamente. Trascurando assorbimento e coefficienti di riflessione parziale (Fresnel), calcolare: a) l'angolo limite per la riflessione totale; b) la percentuale della potenza emessa che esce dalla superficie libera nell'aria; c) i raggi dei due cerchi luminosi sulla superficie, dovuti alla luce diretta e a quella riflessa dallo specchio.`,
        S`A layer of water with refractive index $n=${sig(n, 3)}$ and depth $H=${cm(H)}$ covers a very large plane mirror. A point source emitting isotropically is placed at depth $h=${cm(h)}$ below the free surface. Neglecting absorption and partial reflection coefficients (Fresnel), compute: a) the critical angle for total internal reflection; b) the percentage of the emitted power that leaves the free surface into the air; c) the radii of the two bright circles on the surface, due to direct light and to light reflected by the mirror.`,
      ),
      steps: [
        t(S`Angolo limite acqua–aria: $\sin\theta_c=1/n$.`, S`Water–air critical angle: $\sin\theta_c=1/n$.`),
        t(S`Escono solo i raggi con incidenza $<\theta_c$: il cono verso l'alto copre la frazione $\dfrac{1-\cos\theta_c}{2}$ della potenza isotropa. I raggi emessi verso il basso sono riflessi dallo specchio e per simmetria equivalgono a quelli di una sorgente immagine: la frazione totale è $1-\cos\theta_c$.`, S`Only rays with incidence $<\theta_c$ get out: the upward cone covers the fraction $\dfrac{1-\cos\theta_c}{2}$ of the isotropic power. Rays emitted downwards are reflected by the mirror and by symmetry are equivalent to those of an image source: the total fraction is $1-\cos\theta_c$.`),
        t(S`Raggi dei cerchi: luce diretta $\rho_1=h\tan\theta_c$; luce riflessa (sorgente immagine a distanza $2H-h$ dalla superficie) $\rho_2=(2H-h)\tan\theta_c$. Risultati: $\theta_c=${ang(thc)}$, frazione $=${sig(frac * 100, 3)}\%$, $\rho_1=${cm(rdir)}$, $\rho_2=${cm(rref)}$.`, S`Radii of the circles: direct light $\rho_1=h\tan\theta_c$; reflected light (image source at distance $2H-h$ from the surface) $\rho_2=(2H-h)\tan\theta_c$. Results: $\theta_c=${ang(thc)}$, fraction $=${sig(frac * 100, 3)}\%$, $\rho_1=${cm(rdir)}$, $\rho_2=${cm(rref)}$.`),
      ],
      answer: [
        { label: 'θ_c', value: (thc * 180) / PI, unit: '°' },
        { label: t('frazione', 'fraction'), value: frac * 100, unit: '%' },
        { label: 'ρ₁', value: rdir, unit: 'm' },
        { label: 'ρ₂', value: rref, unit: 'm' },
      ],
      parametri: { n, H, h },
      valori: { thc, frac, rdir, rref },
    };
  },
});

defineTemplate({
  id: 'b5-onda-piana',
  blocco: 'b5',
  topic: 'onde-elettromagnetiche',
  objectives: ['onde-elettromagnetiche.2', 'onde-elettromagnetiche.4'],
  tema: { it: 'Onda piana: grandezze caratteristiche, intensità e pressione', en: 'Plane wave: characteristic quantities, intensity and pressure' },
  make(r, { t, P, Un }) {
    const f = step(r, 50, 500, 50) * 1e6, E0 = step(r, 10, 100, 10);
    const lam = C0 / f, k = (2 * PI) / lam, w = 2 * PI * f, B0 = E0 / C0, I = 0.5 * C0 * EPS0 * E0 * E0, uavg = 0.5 * EPS0 * E0 * E0, pabs = I / C0;
    return {
      statement: t(
        S`Nel vuoto viaggia, nella direzione dell'asse $x$, un'onda elettromagnetica piana con campo elettrico polarizzato lungo $y$: $\vec E=E_0\cos(kx-\omega t)\,\hat y$, con $E_0=${Un(E0, 'V/m')}$ e frequenza $f=${Un(f / 1e6, 'MHz')}$. Determinare: a) lunghezza d'onda, numero d'onda e pulsazione; b) l'espressione del campo magnetico (ampiezza e direzione); c) l'intensità media e la densità media di energia; d) la pressione di radiazione su una superficie perfettamente assorbente ortogonale alla propagazione.`,
        S`A plane electromagnetic wave travels in vacuum along the $x$ axis with its electric field polarised along $y$: $\vec E=E_0\cos(kx-\omega t)\,\hat y$, with $E_0=${Un(E0, 'V/m')}$ and frequency $f=${Un(f / 1e6, 'MHz')}$. Find: a) wavelength, wave number and angular frequency; b) the expression of the magnetic field (amplitude and direction); c) the average intensity and the average energy density; d) the radiation pressure on a perfectly absorbing surface perpendicular to the propagation.`,
      ),
      steps: [
        t(S`$\lambda=c/f$, $k=2\pi/\lambda$, $\omega=2\pi f$.`, S`$\lambda=c/f$, $k=2\pi/\lambda$, $\omega=2\pi f$.`),
        t(S`Per un'onda piana $\vec B=\dfrac{\hat x\times\vec E}{c}$: $\vec B=\dfrac{E_0}{c}\cos(kx-\omega t)\,\hat z$.`, S`For a plane wave $\vec B=\dfrac{\hat x\times\vec E}{c}$: $\vec B=\dfrac{E_0}{c}\cos(kx-\omega t)\,\hat z$.`),
        t(S`$\bar I=\tfrac12c\varepsilon_0E_0^2$, $\bar u=\tfrac12\varepsilon_0E_0^2$ (metà elettrica e metà magnetica); $p=\bar I/c$ per assorbimento totale. Risultati: $\lambda=${Un(lam, 'm')}$, $k=${Un(k, 'rad/m')}$, $\omega=${Un(w, 'rad/s')}$, $B_0=${P(B0, 'T')}$, $\bar I=${Un(I, 'W/m^2')}$, $\bar u=${Un(uavg, 'J/m^3')}$, $p=${Un(pabs, 'Pa')}$.`, S`$\bar I=\tfrac12c\varepsilon_0E_0^2$, $\bar u=\tfrac12\varepsilon_0E_0^2$ (half electric and half magnetic); $p=\bar I/c$ for total absorption. Results: $\lambda=${Un(lam, 'm')}$, $k=${Un(k, 'rad/m')}$, $\omega=${Un(w, 'rad/s')}$, $B_0=${P(B0, 'T')}$, $\bar I=${Un(I, 'W/m^2')}$, $\bar u=${Un(uavg, 'J/m^3')}$, $p=${Un(pabs, 'Pa')}$.`),
      ],
      answer: [
        { label: 'λ', value: lam, unit: 'm' },
        { label: 'B₀', value: B0, unit: 'T' },
        { label: 'Ī', value: I, unit: 'W/m²' },
        { label: 'ū', value: uavg, unit: 'J/m³' },
        { label: 'p', value: pabs, unit: 'Pa' },
      ],
      parametri: { f, E0 },
      valori: { lam, k, w, B0, I, uavg, pabs },
    };
  },
});
