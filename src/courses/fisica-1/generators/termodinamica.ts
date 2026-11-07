/** Generatori di fluidi e termodinamica (area D dell'originale). */
import { registerGenerator } from '../../../engine/generators/registry';
import { createRng } from '../../../engine/random';
import { G, L, R, ans, exercise, num, q, step } from '../lib/gen';

const P0 = 1.013e5;

export const stevino = registerGenerator({
  id: 'fisica-1/stevino',
  topic: 'legge-di-stevino',
  objectives: ['legge-di-stevino.4', 'legge-di-stevino.7'],
  generate(seed, lang) {
    const r = createRng(seed);
    const fluid = r.pick([
      { rho: 1000, it: 'acqua dolce', en: 'fresh water' },
      { rho: 1025, it: 'acqua di mare', en: 'sea water' },
      { rho: 800, it: 'olio', en: 'oil' },
    ] as const);
    const h = r.nice(1, 40, 2);
    const A = r.nice(0.005, 0.05, 2);
    const prel = fluid.rho * G * h;
    const p = P0 + prel;
    const F = prel * A;
    return exercise(
      L(
        lang,
        `In un serbatoio di ${fluid.it} ($\\rho = ${q(fluid.rho, 'kg/m³', lang, 4)}$), aperto all'atmosfera ($p_0 = ${q(P0, 'Pa', lang, 4)}$), calcola la pressione assoluta e quella relativa a $h = ${q(h, 'm', lang)}$ di profondità, e la forza netta su un oblò di area $${q(A, 'm²', lang)}$ con aria a pressione atmosferica dall'altra parte.`,
        `In a tank of ${fluid.en} ($\\rho = ${q(fluid.rho, 'kg/m³', lang, 4)}$), open to the atmosphere ($p_0 = ${q(P0, 'Pa', lang, 4)}$), find the absolute and gauge pressure at a depth $h = ${q(h, 'm', lang)}$, and the net force on a porthole of area $${q(A, 'm²', lang)}$ with air at atmospheric pressure on the other side.`,
      ),
      [
        step(
          lang,
          [
            'Stevino',
            `$p_{rel} = \\rho g h = ${q(prel, 'Pa', lang)}$, $p = p_0 + \\rho g h = ${q(p, 'Pa', lang)}$.`,
          ],
          [
            'Stevin',
            `$p_{gauge} = \\rho g h = ${q(prel, 'Pa', lang)}$, $p = p_0 + \\rho g h = ${q(p, 'Pa', lang)}$.`,
          ],
        ),
        step(
          lang,
          [
            'Forza sull’oblò',
            `La pressione atmosferica agisce da entrambe le parti: $F = p_{rel}A = ${q(F, 'N', lang)}$.`,
          ],
          [
            'Force on the porthole',
            `Atmospheric pressure acts on both sides: $F = p_{gauge}A = ${q(F, 'N', lang)}$.`,
          ],
        ),
      ],
      [
        ans(L(lang, 'p assoluta', 'absolute p'), p, 'Pa'),
        ans(L(lang, 'p relativa', 'gauge p'), prel, 'Pa'),
        ans('F', F, 'N'),
      ],
    );
  },
});

const GAS = [
  { M: 0.004, it: 'elio', en: 'helium' },
  { M: 0.028, it: 'azoto', en: 'nitrogen' },
  { M: 0.032, it: 'ossigeno', en: 'oxygen' },
  { M: 0.04, it: 'argon', en: 'argon' },
  { M: 0.002, it: 'idrogeno', en: 'hydrogen' },
] as const;

export const vqm = registerGenerator({
  id: 'fisica-1/velocita-quadratica-media',
  topic: 'teoria-cinetica-gas',
  objectives: ['teoria-cinetica-gas.6', 'teoria-cinetica-gas.7'],
  generate(seed, lang) {
    const r = createRng(seed);
    const gas = r.pick(GAS);
    const T = r.int(20, 120) * 5;
    const v = Math.sqrt((3 * R * T) / gas.M);
    const E = 1.5 * (R / 6.022e23) * T;
    return exercise(
      L(
        lang,
        `Calcola la velocità quadratica media delle molecole di ${gas.it} ($M = ${q(gas.M * 1000, 'g/mol', lang)}$) a $T = ${q(T, 'K', lang)}$ e l'energia cinetica traslazionale media di una molecola.`,
        `Find the root-mean-square speed of ${gas.en} molecules ($M = ${q(gas.M * 1000, 'g/mol', lang)}$) at $T = ${q(T, 'K', lang)}$ and the average translational kinetic energy of one molecule.`,
      ),
      [
        step(
          lang,
          ['Velocità', `$v_{qm} = \\sqrt{3RT/M} = ${q(v, 'm/s', lang)}$.`],
          ['Speed', `$v_{rms} = \\sqrt{3RT/M} = ${q(v, 'm/s', lang)}$.`],
        ),
        step(
          lang,
          [
            'Energia media',
            `$\\langle\\tfrac12 mv^2\\rangle = \\tfrac32 k_BT = ${q(E, 'J', lang)}$, uguale per ogni gas alla stessa temperatura.`,
          ],
          [
            'Average energy',
            `$\\langle\\tfrac12 mv^2\\rangle = \\tfrac32 k_BT = ${q(E, 'J', lang)}$, the same for every gas at the same temperature.`,
          ],
        ),
      ],
      [ans('v_qm', v, 'm/s'), ans('⟨K⟩', E, 'J')],
    );
  },
});

export const leggeCombinata = registerGenerator({
  id: 'fisica-1/legge-combinata',
  topic: 'legge-gas-perfetti',
  objectives: ['legge-gas-perfetti.4', 'legge-gas-perfetti.5'],
  generate(seed, lang) {
    const r = createRng(seed);
    const V1 = r.nice(1, 20, 2); // L
    const p1 = r.nice(0.8, 5, 2) * 1e5;
    const t1 = r.int(-10, 60);
    const t2 = r.int(-10, 200);
    const p2 = r.nice(0.8, 5, 2) * 1e5;
    const T1 = t1 + 273.15;
    const T2 = t2 + 273.15;
    const V2 = (V1 * p1 * T2) / (p2 * T1);
    const n = (p1 * V1 * 1e-3) / (R * T1);
    return exercise(
      L(
        lang,
        `Un gas perfetto occupa $${q(V1, 'L', lang)}$ a $${q(p1, 'Pa', lang)}$ e $${t1}\\ °\\text{C}$. Viene portato a $${q(p2, 'Pa', lang)}$ e $${t2}\\ °\\text{C}$. Calcola il numero di moli e il volume finale.`,
        `An ideal gas occupies $${q(V1, 'L', lang)}$ at $${q(p1, 'Pa', lang)}$ and $${t1}\\ °\\text{C}$. It is brought to $${q(p2, 'Pa', lang)}$ and $${t2}\\ °\\text{C}$. Find the number of moles and the final volume.`,
      ),
      [
        step(
          lang,
          [
            'Temperature assolute',
            `$T_1 = ${q(T1, 'K', lang, 5)}$, $T_2 = ${q(T2, 'K', lang, 5)}$; $n = p_1V_1/(RT_1) = ${q(n, 'mol', lang)}$.`,
          ],
          [
            'Absolute temperatures',
            `$T_1 = ${q(T1, 'K', lang, 5)}$, $T_2 = ${q(T2, 'K', lang, 5)}$; $n = p_1V_1/(RT_1) = ${q(n, 'mol', lang)}$.`,
          ],
        ),
        step(
          lang,
          [
            'Legge combinata',
            `$\\dfrac{p_1V_1}{T_1} = \\dfrac{p_2V_2}{T_2} \\Rightarrow V_2 = ${q(V2, 'L', lang)}$.`,
          ],
          [
            'Combined law',
            `$\\dfrac{p_1V_1}{T_1} = \\dfrac{p_2V_2}{T_2} \\Rightarrow V_2 = ${q(V2, 'L', lang)}$.`,
          ],
        ),
      ],
      [ans('n', n, 'mol'), ans('V₂', V2, 'L')],
    );
  },
});

export const caloriMolari = registerGenerator({
  id: 'fisica-1/calori-molari',
  topic: 'calori-molari',
  objectives: ['calori-molari.2', 'calori-molari.3', 'calori-molari.5'],
  generate(seed, lang) {
    const r = createRng(seed);
    const mono = r.chance(0.5);
    const f = mono ? 3 : 5;
    const n = r.nice(0.2, 5, 2);
    const dT = r.int(2, 30) * 5;
    const QV = (f / 2) * n * R * dT;
    const Qp = (f / 2 + 1) * n * R * dT;
    const W = n * R * dT;
    return exercise(
      L(
        lang,
        `Si scaldano $n = ${q(n, 'mol', lang)}$ di gas perfetto ${mono ? 'monoatomico' : 'biatomico'} di $\\Delta T = ${q(dT, 'K', lang)}$. Calcola il calore necessario a volume costante, a pressione costante e il lavoro compiuto dal gas nel secondo caso.`,
        `$n = ${q(n, 'mol', lang)}$ of ${mono ? 'monatomic' : 'diatomic'} ideal gas are heated by $\\Delta T = ${q(dT, 'K', lang)}$. Find the heat needed at constant volume, at constant pressure and the work done by the gas in the second case.`,
      ),
      [
        step(
          lang,
          ['Calori molari', `$c_V = \\tfrac{${f}}{2}R$, $c_p = c_V + R$ (Mayer).`],
          ['Molar heat capacities', `$c_V = \\tfrac{${f}}{2}R$, $c_p = c_V + R$ (Mayer).`],
        ),
        step(
          lang,
          [
            'Calori e lavoro',
            `$Q_V = nc_V\\Delta T = ${q(QV, 'J', lang)}$, $Q_p = nc_p\\Delta T = ${q(Qp, 'J', lang)}$, $W = nR\\Delta T = ${q(W, 'J', lang)}$.`,
          ],
          [
            'Heats and work',
            `$Q_V = nc_V\\Delta T = ${q(QV, 'J', lang)}$, $Q_p = nc_p\\Delta T = ${q(Qp, 'J', lang)}$, $W = nR\\Delta T = ${q(W, 'J', lang)}$.`,
          ],
        ),
      ],
      [ans('Q_V', QV, 'J'), ans('Q_p', Qp, 'J'), ans('W', W, 'J')],
    );
  },
});

export const isotermaAdiabatica = registerGenerator({
  id: 'fisica-1/espansione-isoterma-adiabatica',
  topic: 'primo-principio',
  objectives: ['primo-principio.4', 'primo-principio.5', 'primo-principio.6'],
  generate(seed, lang) {
    const r = createRng(seed);
    const mono = r.chance(0.5);
    const gamma = mono ? 5 / 3 : 7 / 5;
    const cv = mono ? 1.5 : 2.5;
    const n = r.nice(0.2, 3, 2);
    const T1 = r.int(25, 80) * 10;
    const k = r.pick([1.5, 2, 2.5, 3, 4]);
    const Wiso = n * R * T1 * Math.log(k);
    const T2 = T1 * k ** (1 - gamma);
    const Wad = n * cv * R * (T1 - T2);
    return exercise(
      L(
        lang,
        `$n = ${q(n, 'mol', lang)}$ di gas perfetto ${mono ? 'monoatomico' : 'biatomico'} a $T_1 = ${q(T1, 'K', lang)}$ si espandono reversibilmente fino a un volume ${num(k, lang)} volte quello iniziale. Calcola il lavoro compiuto se l'espansione è isoterma, e la temperatura finale e il lavoro se è adiabatica.`,
        `$n = ${q(n, 'mol', lang)}$ of ${mono ? 'monatomic' : 'diatomic'} ideal gas at $T_1 = ${q(T1, 'K', lang)}$ expand reversibly to ${num(k, lang)} times the initial volume. Find the work done if the expansion is isothermal, and the final temperature and the work if it is adiabatic.`,
      ),
      [
        step(
          lang,
          ['Isoterma', `$\\Delta U = 0$, $W = nRT\\ln(V_2/V_1) = ${q(Wiso, 'J', lang)}$.`],
          ['Isothermal', `$\\Delta U = 0$, $W = nRT\\ln(V_2/V_1) = ${q(Wiso, 'J', lang)}$.`],
        ),
        step(
          lang,
          [
            'Adiabatica',
            `$TV^{\\gamma-1} = \\text{cost}$ con $\\gamma = ${mono ? '5/3' : '7/5'}$: $T_2 = ${q(T2, 'K', lang)}$; $W = -\\Delta U = nc_V(T_1 - T_2) = ${q(Wad, 'J', lang)}$.`,
          ],
          [
            'Adiabatic',
            `$TV^{\\gamma-1} = \\text{const}$ with $\\gamma = ${mono ? '5/3' : '7/5'}$: $T_2 = ${q(T2, 'K', lang)}$; $W = -\\Delta U = nc_V(T_1 - T_2) = ${q(Wad, 'J', lang)}$.`,
          ],
        ),
      ],
      [
        ans(L(lang, 'W isoterma', 'isothermal W'), Wiso, 'J'),
        ans(L(lang, 'T₂ adiabatica', 'adiabatic T₂'), T2, 'K'),
        ans(L(lang, 'W adiabatica', 'adiabatic W'), Wad, 'J'),
      ],
    );
  },
});

export const macchinaTermica = registerGenerator({
  id: 'fisica-1/macchina-termica',
  topic: 'secondo-principio',
  objectives: ['secondo-principio.4', 'secondo-principio.5'],
  generate(seed, lang) {
    const r = createRng(seed);
    const Qc = r.nice(500, 5000, 2);
    const eta = r.nice(0.1, 0.45, 2);
    const W = Qc * eta;
    const Qf = Qc - W;
    const cop = Qf / W;
    return exercise(
      L(
        lang,
        `Una macchina termica assorbe $Q_C = ${q(Qc, 'J', lang)}$ per ciclo con rendimento $\\eta = ${num(eta, lang)}$. Calcola il lavoro per ciclo, il calore ceduto e il COP che avrebbe la stessa macchina fatta funzionare come frigorifero con gli stessi scambi invertiti.`,
        `A heat engine absorbs $Q_C = ${q(Qc, 'J', lang)}$ per cycle with efficiency $\\eta = ${num(eta, lang)}$. Find the work per cycle, the heat released and the COP the same machine would have run as a refrigerator with the same exchanges reversed.`,
      ),
      [
        step(
          lang,
          ['Lavoro', `$W = \\eta Q_C = ${q(W, 'J', lang)}$.`],
          ['Work', `$W = \\eta Q_C = ${q(W, 'J', lang)}$.`],
        ),
        step(
          lang,
          [
            'Ciclo: ΔU = 0',
            `$|Q_F| = Q_C - W = ${q(Qf, 'J', lang)}$; da frigorifero $\\text{COP} = |Q_F|/W = ${num(cop, lang)}$.`,
          ],
          [
            'Cycle: ΔU = 0',
            `$|Q_F| = Q_C - W = ${q(Qf, 'J', lang)}$; as a refrigerator $\\text{COP} = |Q_F|/W = ${num(cop, lang)}$.`,
          ],
        ),
      ],
      [ans('W', W, 'J'), ans('|Q_F|', Qf, 'J'), ans('COP', cop)],
    );
  },
});

export const carnot = registerGenerator({
  id: 'fisica-1/ciclo-di-carnot',
  topic: 'ciclo-di-carnot',
  objectives: ['ciclo-di-carnot.3', 'ciclo-di-carnot.5', 'ciclo-di-carnot.6'],
  generate(seed, lang) {
    const r = createRng(seed);
    const n = r.nice(0.1, 2, 2);
    const Tc = r.int(40, 100) * 10;
    const Tf = r.int(25, Math.min(Tc / 10 - 5, 40)) * 10;
    const k = r.pick([1.5, 2, 2.5, 3]);
    const Qc = n * R * Tc * Math.log(k);
    const eta = 1 - Tf / Tc;
    const W = eta * Qc;
    const Qf = Qc - W;
    return exercise(
      L(
        lang,
        `$n = ${q(n, 'mol', lang)}$ di gas perfetto compiono un ciclo di Carnot tra $T_C = ${q(Tc, 'K', lang)}$ e $T_F = ${q(Tf, 'K', lang)}$; nell'espansione isoterma il volume aumenta di un fattore ${num(k, lang)}. Calcola il calore assorbito, il rendimento, il lavoro netto e il calore ceduto per ciclo.`,
        `$n = ${q(n, 'mol', lang)}$ of ideal gas perform a Carnot cycle between $T_C = ${q(Tc, 'K', lang)}$ and $T_F = ${q(Tf, 'K', lang)}$; in the isothermal expansion the volume grows by a factor ${num(k, lang)}. Find the absorbed heat, the efficiency, the net work and the heat released per cycle.`,
      ),
      [
        step(
          lang,
          ['Isoterma calda', `$Q_C = nRT_C\\ln(V_2/V_1) = ${q(Qc, 'J', lang)}$.`],
          ['Hot isotherm', `$Q_C = nRT_C\\ln(V_2/V_1) = ${q(Qc, 'J', lang)}$.`],
        ),
        step(
          lang,
          [
            'Rendimento e bilancio',
            `$\\eta = 1 - T_F/T_C = ${num(eta, lang)}$, $W = \\eta Q_C = ${q(W, 'J', lang)}$, $|Q_F| = Q_C - W = ${q(Qf, 'J', lang)}$ (verifica: $Q_C/T_C = |Q_F|/T_F$).`,
          ],
          [
            'Efficiency and balance',
            `$\\eta = 1 - T_F/T_C = ${num(eta, lang)}$, $W = \\eta Q_C = ${q(W, 'J', lang)}$, $|Q_F| = Q_C - W = ${q(Qf, 'J', lang)}$ (check: $Q_C/T_C = |Q_F|/T_F$).`,
          ],
        ),
      ],
      [ans('Q_C', Qc, 'J'), ans('η', eta), ans('W', W, 'J'), ans('|Q_F|', Qf, 'J')],
    );
  },
});

export const entropiaMescolamento = registerGenerator({
  id: 'fisica-1/entropia-mescolamento',
  topic: 'entropia-adiabatiche',
  objectives: ['entropia-adiabatiche.2', 'entropia-adiabatiche.7'],
  generate(seed, lang) {
    const r = createRng(seed);
    const c = 4186;
    const m1 = r.nice(0.2, 3, 2);
    const m2 = r.nice(0.2, 3, 2);
    const t1 = r.int(50, 95);
    const t2 = r.int(2, 40);
    const T1 = t1 + 273.15;
    const T2 = t2 + 273.15;
    const Tf = (m1 * T1 + m2 * T2) / (m1 + m2);
    const S1 = m1 * c * Math.log(Tf / T1);
    const S2 = m2 * c * Math.log(Tf / T2);
    return exercise(
      L(
        lang,
        `In un recipiente isolato si mescolano $${q(m1, 'kg', lang)}$ d'acqua a $${t1}\\ °\\text{C}$ e $${q(m2, 'kg', lang)}$ d'acqua a $${t2}\\ °\\text{C}$ ($c = 4186\\ \\text{J/(kg·K)}$). Calcola la temperatura finale (in kelvin), la variazione di entropia dell'acqua calda e quella dell'universo.`,
        `In an insulated container $${q(m1, 'kg', lang)}$ of water at $${t1}\\ °\\text{C}$ and $${q(m2, 'kg', lang)}$ of water at $${t2}\\ °\\text{C}$ are mixed ($c = 4186\\ \\text{J/(kg·K)}$). Find the final temperature (in kelvin), the entropy change of the hot water and that of the universe.`,
      ),
      [
        step(
          lang,
          ['Equilibrio', `$m_1(T_1 - T_f) = m_2(T_f - T_2) \\Rightarrow T_f = ${q(Tf, 'K', lang, 5)}$.`],
          ['Equilibrium', `$m_1(T_1 - T_f) = m_2(T_f - T_2) \\Rightarrow T_f = ${q(Tf, 'K', lang, 5)}$.`],
        ),
        step(
          lang,
          [
            'Entropie (cammini reversibili)',
            `$\\Delta S_1 = m_1c\\ln(T_f/T_1) = ${q(S1, 'J/K', lang)}$, $\\Delta S_2 = m_2c\\ln(T_f/T_2) = ${q(S2, 'J/K', lang)}$; $\\Delta S_{univ} = ${q(S1 + S2, 'J/K', lang)} > 0$.`,
          ],
          [
            'Entropies (reversible paths)',
            `$\\Delta S_1 = m_1c\\ln(T_f/T_1) = ${q(S1, 'J/K', lang)}$, $\\Delta S_2 = m_2c\\ln(T_f/T_2) = ${q(S2, 'J/K', lang)}$; $\\Delta S_{univ} = ${q(S1 + S2, 'J/K', lang)} > 0$.`,
          ],
        ),
      ],
      [
        ans('T_f', Tf, 'K', 0.001),
        ans(L(lang, 'ΔS acqua calda', 'ΔS hot water'), S1, 'J/K'),
        ans(L(lang, 'ΔS universo', 'ΔS universe'), S1 + S2, 'J/K', 0.02),
      ],
    );
  },
});
