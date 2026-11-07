/** Generatori su sistemi di punti, corpo rigido e urti (area C dell'originale). */
import { registerGenerator } from '../../../engine/generators/registry';
import { createRng } from '../../../engine/random';
import * as Fig from '../lib/figures';
import { G, L, ans, exercise, num, q, rad, step } from '../lib/gen';

export const filoCheSiAccorcia = registerGenerator({
  id: 'fisica-1/momento-angolare-filo',
  topic: 'momento-angolare',
  objectives: ['momento-angolare.4', 'momento-angolare.7'],
  generate(seed, lang) {
    const r = createRng(seed);
    const m = r.nice(0.05, 1, 2);
    const r1 = r.nice(0.3, 1.5, 2);
    const v1 = r.nice(0.5, 4, 2);
    const r2 = Number((r1 * r.float(0.25, 0.7)).toPrecision(2));
    const v2 = (v1 * r1) / r2;
    const dK = 0.5 * m * (v2 * v2 - v1 * v1);
    const T = (m * v2 * v2) / r2;
    return exercise(
      L(
        lang,
        `Una pallina di massa $m = ${q(m, 'kg', lang)}$ ruota su un piano orizzontale liscio, legata a un filo che passa per un foro al centro: raggio $r_1 = ${q(r1, 'm', lang)}$, velocità $v_1 = ${q(v1, 'm/s', lang)}$. Tirando lentamente il filo il raggio diventa $r_2 = ${q(r2, 'm', lang)}$. Calcola la nuova velocità, la variazione di energia cinetica e la tensione finale.`,
        `A ball of mass $m = ${q(m, 'kg', lang)}$ rotates on a smooth horizontal plane, tied to a string through a hole at the centre: radius $r_1 = ${q(r1, 'm', lang)}$, speed $v_1 = ${q(v1, 'm/s', lang)}$. Slowly pulling the string, the radius becomes $r_2 = ${q(r2, 'm', lang)}$. Find the new speed, the change in kinetic energy and the final tension.`,
      ),
      [
        step(
          lang,
          [
            'Forza centrale',
            `La tensione punta al foro: $L = mvr$ si conserva, $v_2 = v_1 r_1/r_2 = ${q(v2, 'm/s', lang)}$.`,
          ],
          [
            'Central force',
            `The tension points at the hole: $L = mvr$ is conserved, $v_2 = v_1 r_1/r_2 = ${q(v2, 'm/s', lang)}$.`,
          ],
        ),
        step(
          lang,
          [
            'Energia e tensione',
            `$\\Delta K = \\tfrac12 m(v_2^2 - v_1^2) = ${q(dK, 'J', lang)}$ (lavoro di chi tira); $T = mv_2^2/r_2 = ${q(T, 'N', lang)}$.`,
          ],
          [
            'Energy and tension',
            `$\\Delta K = \\tfrac12 m(v_2^2 - v_1^2) = ${q(dK, 'J', lang)}$ (work of whoever pulls); $T = mv_2^2/r_2 = ${q(T, 'N', lang)}$.`,
          ],
        ),
      ],
      [ans('v₂', v2, 'm/s'), ans('ΔK', dK, 'J'), ans('T', T, 'N')],
      Fig.stringThroughHole({ r1: 2.5, r2: (2.5 * r2) / r1 }),
    );
  },
});

export const barca = registerGenerator({
  id: 'fisica-1/centro-di-massa-barca',
  topic: 'centro-di-massa',
  objectives: ['centro-di-massa.5', 'centro-di-massa.7'],
  generate(seed, lang) {
    const r = createRng(seed);
    const m = r.nice(40, 100, 2);
    const M = r.nice(50, 400, 2);
    const Lb = r.nice(2, 8, 2);
    const db = (-m * Lb) / (m + M);
    const du = (M * Lb) / (m + M);
    return exercise(
      L(
        lang,
        `Una persona di massa $m = ${q(m, 'kg', lang)}$ cammina da un'estremità all'altra di una barca di massa $M = ${q(M, 'kg', lang)}$ e lunghezza $${q(Lb, 'm', lang)}$, inizialmente ferma in acqua calma (attrito trascurabile). Di quanto si sposta la barca? E la persona, rispetto alla riva?`,
        `A person of mass $m = ${q(m, 'kg', lang)}$ walks from one end to the other of a boat of mass $M = ${q(M, 'kg', lang)}$ and length $${q(Lb, 'm', lang)}$, initially at rest in calm water (negligible friction). How far does the boat move? And the person, relative to the shore?`,
      ),
      [
        step(
          lang,
          [
            'Il CM resta fermo',
            `Nessuna forza esterna orizzontale: $m\\Delta x_p + M\\Delta x_b = 0$, con $\\Delta x_p - \\Delta x_b = L$.`,
          ],
          [
            'The CM stays still',
            `No external horizontal force: $m\\Delta x_p + M\\Delta x_b = 0$, with $\\Delta x_p - \\Delta x_b = L$.`,
          ],
        ),
        step(
          lang,
          [
            'Spostamenti',
            `$\\Delta x_b = -\\dfrac{mL}{m+M} = ${q(db, 'm', lang)}$, $\\Delta x_p = \\dfrac{ML}{m+M} = ${q(du, 'm', lang)}$.`,
          ],
          [
            'Displacements',
            `$\\Delta x_b = -\\dfrac{mL}{m+M} = ${q(db, 'm', lang)}$, $\\Delta x_p = \\dfrac{ML}{m+M} = ${q(du, 'm', lang)}$.`,
          ],
        ),
      ],
      [ans(L(lang, 'Δx barca', 'Δx boat'), db, 'm'), ans(L(lang, 'Δx persona', 'Δx person'), du, 'm')],
      Fig.boat(),
    );
  },
});

export const astaConMasse = registerGenerator({
  id: 'fisica-1/momenti-di-inerzia',
  topic: 'momenti-di-inerzia',
  objectives: ['momenti-di-inerzia.3', 'momenti-di-inerzia.5'],
  generate(seed, lang) {
    const r = createRng(seed);
    const M = r.nice(0.5, 5, 2);
    const Lr = r.nice(0.4, 2, 2);
    const m = r.nice(0.1, 2, 2);
    const Icm = (M * Lr * Lr) / 12 + 2 * m * (Lr / 2) ** 2;
    const Iend = Icm + (M + 2 * m) * (Lr / 2) ** 2;
    return exercise(
      L(
        lang,
        `Un'asta omogenea di massa $M = ${q(M, 'kg', lang)}$ e lunghezza $L = ${q(Lr, 'm', lang)}$ porta due masse puntiformi $m = ${q(m, 'kg', lang)}$ alle estremità. Calcola il momento d'inerzia rispetto all'asse perpendicolare per il centro e rispetto all'asse parallelo per un'estremità.`,
        `A uniform rod of mass $M = ${q(M, 'kg', lang)}$ and length $L = ${q(Lr, 'm', lang)}$ carries two point masses $m = ${q(m, 'kg', lang)}$ at its ends. Find the moment of inertia about the perpendicular axis through the centre and about the parallel axis through one end.`,
      ),
      [
        step(
          lang,
          ['Asse centrale', `$I_{cm} = \\tfrac{1}{12}ML^2 + 2m(L/2)^2 = ${q(Icm, 'kg·m²', lang)}$.`],
          ['Central axis', `$I_{cm} = \\tfrac{1}{12}ML^2 + 2m(L/2)^2 = ${q(Icm, 'kg·m²', lang)}$.`],
        ),
        step(
          lang,
          [
            'Huygens-Steiner',
            `Il CM del sistema è al centro: $I = I_{cm} + (M + 2m)(L/2)^2 = ${q(Iend, 'kg·m²', lang)}$.`,
          ],
          [
            'Huygens–Steiner',
            `The CM of the system is at the centre: $I = I_{cm} + (M + 2m)(L/2)^2 = ${q(Iend, 'kg·m²', lang)}$.`,
          ],
        ),
      ],
      [ans('I_cm', Icm, 'kg·m²'), ans(L(lang, 'I estremo', 'I end'), Iend, 'kg·m²')],
      Fig.rodWithMasses(),
    );
  },
});

export const carrucola = registerGenerator({
  id: 'fisica-1/carrucola-massiva',
  topic: 'teorema-momento-angolare',
  objectives: ['teorema-momento-angolare.5', 'teorema-momento-angolare.7'],
  generate(seed, lang) {
    const r = createRng(seed);
    const m = r.nice(0.5, 10, 2);
    const M = r.nice(0.5, 10, 2);
    const R = r.nice(0.05, 0.4, 2);
    const h = r.nice(0.5, 3, 2);
    const a = (m * G) / (m + M / 2);
    const T = (M * a) / 2;
    const w = Math.sqrt(2 * a * h) / R;
    return exercise(
      L(
        lang,
        `Una massa $m = ${q(m, 'kg', lang)}$ pende da un filo avvolto su un disco di massa $M = ${q(M, 'kg', lang)}$ e raggio $R = ${q(R, 'm', lang)}$, libero di ruotare senza attrito. Partendo da fermo, calcola l'accelerazione della massa, la tensione del filo e la velocità angolare del disco dopo una discesa di $${q(h, 'm', lang)}$.`,
        `A mass $m = ${q(m, 'kg', lang)}$ hangs from a string wound on a disc of mass $M = ${q(M, 'kg', lang)}$ and radius $R = ${q(R, 'm', lang)}$, free to rotate without friction. Starting from rest, find the acceleration of the mass, the tension in the string and the angular velocity of the disc after a descent of $${q(h, 'm', lang)}$.`,
      ),
      [
        step(
          lang,
          [
            'Cardinali',
            `Massa: $mg - T = ma$; disco: $TR = \\tfrac12 MR^2\\,(a/R)$. Quindi $a = \\dfrac{mg}{m + M/2} = ${q(a, 'm/s²', lang)}$.`,
          ],
          [
            'Cardinal equations',
            `Mass: $mg - T = ma$; disc: $TR = \\tfrac12 MR^2\\,(a/R)$. Hence $a = \\dfrac{mg}{m + M/2} = ${q(a, 'm/s²', lang)}$.`,
          ],
        ),
        step(
          lang,
          [
            'Tensione e rotazione',
            `$T = \\tfrac12 Ma = ${q(T, 'N', lang)}$; $v = \\sqrt{2ah}$, $\\omega = v/R = ${q(w, 'rad/s', lang)}$.`,
          ],
          [
            'Tension and rotation',
            `$T = \\tfrac12 Ma = ${q(T, 'N', lang)}$; $v = \\sqrt{2ah}$, $\\omega = v/R = ${q(w, 'rad/s', lang)}$.`,
          ],
        ),
      ],
      [ans('a', a, 'm/s²'), ans('T', T, 'N'), ans('ω', w, 'rad/s')],
      Fig.pulley({ masses: [{ label: 'm', side: 'right' }] }),
    );
  },
});

const CORPI = [
  { beta: 2 / 5, it: 'una sfera piena', en: 'a solid sphere', b: '2/5' },
  { beta: 1 / 2, it: 'un cilindro pieno', en: 'a solid cylinder', b: '1/2' },
  { beta: 1, it: 'un anello sottile', en: 'a thin ring', b: '1' },
  { beta: 2 / 3, it: 'una sfera cava sottile', en: 'a thin spherical shell', b: '2/3' },
] as const;

export const rotolamento = registerGenerator({
  id: 'fisica-1/rotolamento',
  topic: 'rotolamento-puro',
  objectives: ['rotolamento-puro.4', 'rotolamento-puro.5', 'rotolamento-puro.6'],
  generate(seed, lang) {
    const r = createRng(seed);
    const body = r.pick(CORPI);
    const th = r.int(10, 40);
    const s = r.nice(0.5, 5, 2);
    const a = (G * Math.sin(rad(th))) / (1 + body.beta);
    const v = Math.sqrt(2 * a * s);
    const mu = (body.beta / (1 + body.beta)) * Math.tan(rad(th));
    return exercise(
      L(
        lang,
        `${capital(body.it)} rotola senza strisciare lungo un piano inclinato di $${th}°$, partendo da fermo. Calcola l'accelerazione del centro di massa, la velocità dopo $${q(s, 'm', lang)}$ percorsi lungo il piano e il coefficiente di attrito statico minimo.`,
        `${capital(body.en)} rolls without slipping down a $${th}°$ incline, starting from rest. Find the acceleration of the centre of mass, the speed after $${q(s, 'm', lang)}$ along the plane and the minimum static friction coefficient.`,
      ),
      [
        step(
          lang,
          [
            'Accelerazione',
            `$\\beta = I_{cm}/MR^2 = ${body.b}$: $a = \\dfrac{g\\sin\\theta}{1+\\beta} = ${q(a, 'm/s²', lang)}$.`,
          ],
          [
            'Acceleration',
            `$\\beta = I_{cm}/MR^2 = ${body.b}$: $a = \\dfrac{g\\sin\\theta}{1+\\beta} = ${q(a, 'm/s²', lang)}$.`,
          ],
        ),
        step(
          lang,
          [
            'Velocità',
            `$v = \\sqrt{2as} = ${q(v, 'm/s', lang)}$ (stesso risultato con l'energia: l'attrito statico non lavora).`,
          ],
          [
            'Speed',
            `$v = \\sqrt{2as} = ${q(v, 'm/s', lang)}$ (same result from energy: static friction does no work).`,
          ],
        ),
        step(
          lang,
          [
            'Attrito',
            `$f_s = \\dfrac{\\beta}{1+\\beta}Mg\\sin\\theta \\le \\mu_s Mg\\cos\\theta \\Rightarrow \\mu_s \\ge ${num(mu, lang)}$.`,
          ],
          [
            'Friction',
            `$f_s = \\dfrac{\\beta}{1+\\beta}Mg\\sin\\theta \\le \\mu_s Mg\\cos\\theta \\Rightarrow \\mu_s \\ge ${num(mu, lang)}$.`,
          ],
        ),
      ],
      [ans('a', a, 'm/s²'), ans('v', v, 'm/s'), ans('μ_s min', mu)],
      Fig.rollingIncline({
        angle: th,
        style: body.beta === 1 ? 'ring' : body.beta === 1 / 2 ? 'disc' : 'sphere',
      }),
    );
  },
});
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const urtoElastico = registerGenerator({
  id: 'fisica-1/urto-elastico',
  topic: 'urti-centrali',
  objectives: ['urti-centrali.3', 'urti-centrali.4'],
  generate(seed, lang) {
    const r = createRng(seed);
    const m1 = r.nice(0.2, 5, 2);
    const m2 = r.nice(0.2, 5, 2);
    const v1 = r.nice(0.5, 6, 2);
    const v2 = r.chance(0.5) ? 0 : -r.nice(0.5, 4, 2);
    const S = m1 + m2;
    const u1 = ((m1 - m2) / S) * v1 + ((2 * m2) / S) * v2;
    const u2 = ((2 * m1) / S) * v1 + ((m2 - m1) / S) * v2;
    return exercise(
      L(
        lang,
        `Due carrelli su una rotaia liscia: $m_1 = ${q(m1, 'kg', lang)}$ con $v_1 = ${q(v1, 'm/s', lang)}$ e $m_2 = ${q(m2, 'kg', lang)}$ con $v_2 = ${q(v2, 'm/s', lang)}$ si urtano elasticamente. Calcola le velocità dopo l'urto.`,
        `Two carts on a smooth track: $m_1 = ${q(m1, 'kg', lang)}$ with $v_1 = ${q(v1, 'm/s', lang)}$ and $m_2 = ${q(m2, 'kg', lang)}$ with $v_2 = ${q(v2, 'm/s', lang)}$ collide elastically. Find the velocities after the collision.`,
      ),
      [
        step(
          lang,
          [
            'Due conservazioni',
            `Si conservano $P$ e $K$; equivalentemente $P$ e l'inversione della velocità relativa: $v_1' - v_2' = -(v_1 - v_2)$.`,
          ],
          [
            'Two conservation laws',
            `$P$ and $K$ are conserved; equivalently $P$ and the reversal of relative velocity: $v_1' - v_2' = -(v_1 - v_2)$.`,
          ],
        ),
        step(
          lang,
          [
            'Soluzione',
            `$v_1' = \\dfrac{m_1-m_2}{m_1+m_2}v_1 + \\dfrac{2m_2}{m_1+m_2}v_2 = ${q(u1, 'm/s', lang)}$, $v_2' = \\dfrac{2m_1}{m_1+m_2}v_1 + \\dfrac{m_2-m_1}{m_1+m_2}v_2 = ${q(u2, 'm/s', lang)}$.`,
          ],
          [
            'Solution',
            `$v_1' = \\dfrac{m_1-m_2}{m_1+m_2}v_1 + \\dfrac{2m_2}{m_1+m_2}v_2 = ${q(u1, 'm/s', lang)}$, $v_2' = \\dfrac{2m_1}{m_1+m_2}v_1 + \\dfrac{m_2-m_1}{m_1+m_2}v_2 = ${q(u2, 'm/s', lang)}$.`,
          ],
        ),
      ],
      [ans("v₁'", u1, 'm/s'), ans("v₂'", u2, 'm/s')],
      {
        type: 'collision',
        params: {
          unit: 'm/s',
          before: [
            { label: '1', mass: 'm_1', v: v1 },
            { label: '2', mass: 'm_2', v: v2 },
          ],
          after: [
            { label: '1', mass: 'm_1', v: Number(u1.toPrecision(3)) },
            { label: '2', mass: 'm_2', v: Number(u2.toPrecision(3)) },
          ],
        },
      },
    );
  },
});

export const pendoloBalistico = registerGenerator({
  id: 'fisica-1/pendolo-balistico',
  topic: 'pendolo-balistico',
  objectives: ['pendolo-balistico.3', 'pendolo-balistico.5', 'pendolo-balistico.6'],
  generate(seed, lang) {
    const r = createRng(seed);
    const m = r.nice(0.005, 0.05, 2);
    const M = r.nice(0.5, 5, 2);
    const Lf = r.nice(0.5, 2.5, 2);
    const th = r.int(5, 40);
    const h = Lf * (1 - Math.cos(rad(th)));
    const V = Math.sqrt(2 * G * h);
    const v0 = ((m + M) / m) * V;
    const frac = M / (m + M);
    return exercise(
      L(
        lang,
        `Un proiettile di massa $m = ${q(m, 'kg', lang)}$ si conficca in un blocco di massa $M = ${q(M, 'kg', lang)}$ appeso a fili lunghi $L = ${q(Lf, 'm', lang)}$; il pendolo risale fino a $${th}°$. Calcola la velocità del blocco subito dopo l'urto, la velocità del proiettile e la frazione di energia dissipata.`,
        `A projectile of mass $m = ${q(m, 'kg', lang)}$ embeds itself in a block of mass $M = ${q(M, 'kg', lang)}$ hanging from strings of length $L = ${q(Lf, 'm', lang)}$; the pendulum swings up to $${th}°$. Find the speed of the block right after the collision, the speed of the projectile and the fraction of energy dissipated.`,
      ),
      [
        step(
          lang,
          [
            'Risalita (energia)',
            `$h = L(1-\\cos\\theta) = ${q(h, 'm', lang)}$, $V = \\sqrt{2gh} = ${q(V, 'm/s', lang)}$.`,
          ],
          [
            'Rise (energy)',
            `$h = L(1-\\cos\\theta) = ${q(h, 'm', lang)}$, $V = \\sqrt{2gh} = ${q(V, 'm/s', lang)}$.`,
          ],
        ),
        step(
          lang,
          [
            'Urto (quantità di moto)',
            `$mv_0 = (m+M)V \\Rightarrow v_0 = ${q(v0, 'm/s', lang)}$; frazione dissipata $M/(m+M) = ${num(frac, lang, 4)}$.`,
          ],
          [
            'Collision (momentum)',
            `$mv_0 = (m+M)V \\Rightarrow v_0 = ${q(v0, 'm/s', lang)}$; dissipated fraction $M/(m+M) = ${num(frac, lang, 4)}$.`,
          ],
        ),
      ],
      [
        ans('V', V, 'm/s'),
        ans('v₀', v0, 'm/s'),
        ans(L(lang, 'frazione dissipata', 'dissipated fraction'), frac, undefined, 0.002),
      ],
      Fig.ballisticPendulum({ angle: th }),
    );
  },
});

export const pendoloFisico = registerGenerator({
  id: 'fisica-1/pendolo-fisico',
  topic: 'pendolo-fisico',
  objectives: ['pendolo-fisico.3', 'pendolo-fisico.4'],
  generate(seed, lang) {
    const r = createRng(seed);
    const Lr = r.nice(0.3, 2, 2);
    const d = Number((Lr * r.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5])).toPrecision(2));
    const ell = (Lr * Lr) / (12 * d) + d;
    const T = 2 * Math.PI * Math.sqrt(ell / G);
    return exercise(
      L(
        lang,
        `Un'asta omogenea lunga $L = ${q(Lr, 'm', lang)}$ oscilla in un piano verticale attorno a un asse orizzontale a distanza $d = ${q(d, 'm', lang)}$ dal centro. Calcola la lunghezza ridotta e il periodo delle piccole oscillazioni.`,
        `A uniform rod of length $L = ${q(Lr, 'm', lang)}$ swings in a vertical plane about a horizontal axis at distance $d = ${q(d, 'm', lang)}$ from its centre. Find the reduced length and the small-oscillation period.`,
      ),
      [
        step(
          lang,
          ['Momento d’inerzia', `Huygens-Steiner: $I = \\tfrac{1}{12}ML^2 + Md^2$.`],
          ['Moment of inertia', `Huygens–Steiner: $I = \\tfrac{1}{12}ML^2 + Md^2$.`],
        ),
        step(
          lang,
          [
            'Lunghezza ridotta e periodo',
            `$\\ell = \\dfrac{I}{Md} = \\dfrac{L^2}{12d} + d = ${q(ell, 'm', lang)}$, $T = 2\\pi\\sqrt{\\ell/g} = ${q(T, 's', lang)}$.`,
          ],
          [
            'Reduced length and period',
            `$\\ell = \\dfrac{I}{Md} = \\dfrac{L^2}{12d} + d = ${q(ell, 'm', lang)}$, $T = 2\\pi\\sqrt{\\ell/g} = ${q(T, 's', lang)}$.`,
          ],
        ),
      ],
      [ans('ℓ', ell, 'm'), ans('T', T, 's')],
      Fig.physicalPendulum({ shape: 'rod', dFrac: d / Lr }),
    );
  },
});

export const astaCheCade = registerGenerator({
  id: 'fisica-1/asta-che-cade',
  topic: 'energia-corpo-rigido',
  objectives: ['energia-corpo-rigido.3', 'energia-corpo-rigido.6'],
  generate(seed, lang) {
    const r = createRng(seed);
    const Lr = r.nice(0.3, 3, 2);
    const th = r.pick([0, 15, 30, 45, 60]);
    // Asta incernierata a un estremo, ferma a θ sopra l’orizzontale, che ruota fino alla verticale in basso (θ = 90° sarebbe equilibrio instabile).
    const drop = (Lr / 2) * (1 + Math.sin(rad(th)));
    const w = Math.sqrt((2 * G * drop) / ((Lr * Lr) / 3));
    const vEnd = w * Lr;
    return exercise(
      L(
        lang,
        `Un'asta omogenea lunga $L = ${q(Lr, 'm', lang)}$, incernierata senza attrito a un estremo, viene lasciata da ferma inclinata di $${th}°$ sopra l'orizzontale e ruota verso il basso. Calcola la velocità angolare e la velocità dell'estremo libero quando l'asta passa per la verticale (in basso).`,
        `A uniform rod of length $L = ${q(Lr, 'm', lang)}$, hinged without friction at one end, is released from rest at $${th}°$ above the horizontal and swings down. Find the angular velocity and the speed of the free end when the rod passes through the (lower) vertical.`,
      ),
      [
        step(
          lang,
          ['Quota del CM', `Il CM scende di $\\tfrac L2(1 + \\sin\\theta) = ${q(drop, 'm', lang)}$.`],
          ['Height of the CM', `The CM drops by $\\tfrac L2(1 + \\sin\\theta) = ${q(drop, 'm', lang)}$.`],
        ),
        step(
          lang,
          [
            'Energia',
            `$Mg\\,\\Delta z = \\tfrac12 \\cdot \\tfrac13 ML^2\\omega^2 \\Rightarrow \\omega = ${q(w, 'rad/s', lang)}$, $v = \\omega L = ${q(vEnd, 'm/s', lang)}$.`,
          ],
          [
            'Energy',
            `$Mg\\,\\Delta z = \\tfrac12 \\cdot \\tfrac13 ML^2\\omega^2 \\Rightarrow \\omega = ${q(w, 'rad/s', lang)}$, $v = \\omega L = ${q(vEnd, 'm/s', lang)}$.`,
          ],
        ),
      ],
      [ans('ω', w, 'rad/s'), ans(L(lang, 'v estremo', 'v end'), vEnd, 'm/s')],
      Fig.rodFalling({ angle: th }),
    );
  },
});
