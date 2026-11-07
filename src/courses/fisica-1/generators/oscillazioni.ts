/**
 * Generatori di cinematica e oscillazioni (area A dell'originale): moto circolare,
 * moto armonico, massa-molla, pendolo, riferimenti accelerati, smorzamento, risonanza.
 */
import { registerGenerator } from '../../../engine/generators/registry';
import { createRng } from '../../../engine/random';
import * as Fig from '../lib/figures';
import { G, L, ans, exercise, num, q, rad, step } from '../lib/gen';

export const motoCircolare = registerGenerator({
  id: 'fisica-1/moto-circolare',
  topic: 'moto-circolare-vario',
  objectives: ['moto-circolare-vario.4', 'moto-circolare-vario.7'],
  generate(seed, lang) {
    const r = createRng(seed);
    const R = r.nice(0.2, 2, 2);
    const alpha = r.nice(0.5, 5, 2);
    const t = r.nice(0.5, 3, 2);
    const omega = alpha * t;
    const at = alpha * R;
    const an = omega * omega * R;
    const a = Math.hypot(at, an);
    return exercise(
      L(
        lang,
        `Un punto su una ruota di raggio $R = ${q(R, 'm', lang)}$ parte da fermo con accelerazione angolare costante $\\alpha = ${q(alpha, 'rad/s²', lang)}$. All'istante $t = ${q(t, 's', lang)}$ calcola: la velocità angolare, l'accelerazione tangenziale, quella centripeta e il modulo dell'accelerazione totale.`,
        `A point on a wheel of radius $R = ${q(R, 'm', lang)}$ starts from rest with constant angular acceleration $\\alpha = ${q(alpha, 'rad/s²', lang)}$. At time $t = ${q(t, 's', lang)}$ find: the angular velocity, the tangential acceleration, the centripetal acceleration and the magnitude of the total acceleration.`,
      ),
      [
        step(
          lang,
          ['Velocità angolare', `$\\omega = \\alpha t = ${q(omega, 'rad/s', lang)}$.`],
          ['Angular velocity', `$\\omega = \\alpha t = ${q(omega, 'rad/s', lang)}$.`],
        ),
        step(
          lang,
          [
            'Componenti',
            `$a_t = \\alpha R = ${q(at, 'm/s²', lang)}$, $a_n = \\omega^2 R = ${q(an, 'm/s²', lang)}$.`,
          ],
          [
            'Components',
            `$a_t = \\alpha R = ${q(at, 'm/s²', lang)}$, $a_n = \\omega^2 R = ${q(an, 'm/s²', lang)}$.`,
          ],
        ),
        step(
          lang,
          [
            'Modulo',
            `Le componenti sono ortogonali: $|\\vec a| = \\sqrt{a_t^2 + a_n^2} = ${q(a, 'm/s²', lang)}$.`,
          ],
          [
            'Magnitude',
            `The components are orthogonal: $|\\vec a| = \\sqrt{a_t^2 + a_n^2} = ${q(a, 'm/s²', lang)}$.`,
          ],
        ),
      ],
      [ans('ω', omega, 'rad/s'), ans('a_t', at, 'm/s²'), ans('a_n', an, 'm/s²'), ans('|a|', a, 'm/s²')],
      Fig.flywheel({ torque: 'drive', rimPoint: true }),
    );
  },
});

export const motoArmonico = registerGenerator({
  id: 'fisica-1/moto-armonico',
  topic: 'moto-armonico',
  objectives: ['moto-armonico.3', 'moto-armonico.4', 'moto-armonico.5'],
  generate(seed, lang) {
    const r = createRng(seed);
    const T = r.nice(0.4, 4, 2);
    const x0 = r.sign() * r.nice(0.01, 0.2, 2);
    const v0 = r.sign() * r.nice(0.05, 1.5, 2);
    const w = (2 * Math.PI) / T;
    const A = Math.hypot(x0, v0 / w);
    const vmax = A * w;
    const amax = A * w * w;
    return exercise(
      L(
        lang,
        `Un punto in moto armonico semplice ha periodo $T = ${q(T, 's', lang)}$. All'istante $t = 0$ si trova in $x_0 = ${q(x0, 'm', lang)}$ con velocità $v_0 = ${q(v0, 'm/s', lang)}$. Calcola la pulsazione, l'ampiezza, la velocità massima e l'accelerazione massima.`,
        `A point in simple harmonic motion has period $T = ${q(T, 's', lang)}$. At $t = 0$ it is at $x_0 = ${q(x0, 'm', lang)}$ with velocity $v_0 = ${q(v0, 'm/s', lang)}$. Find the angular frequency, the amplitude, the maximum speed and the maximum acceleration.`,
      ),
      [
        step(
          lang,
          ['Pulsazione', `$\\omega = 2\\pi/T = ${q(w, 'rad/s', lang)}$.`],
          ['Angular frequency', `$\\omega = 2\\pi/T = ${q(w, 'rad/s', lang)}$.`],
        ),
        step(
          lang,
          [
            'Ampiezza',
            `Da $x_0 = A\\cos\\varphi$ e $v_0 = -A\\omega\\sin\\varphi$: $A = \\sqrt{x_0^2 + v_0^2/\\omega^2} = ${q(A, 'm', lang)}$.`,
          ],
          [
            'Amplitude',
            `From $x_0 = A\\cos\\varphi$ and $v_0 = -A\\omega\\sin\\varphi$: $A = \\sqrt{x_0^2 + v_0^2/\\omega^2} = ${q(A, 'm', lang)}$.`,
          ],
        ),
        step(
          lang,
          [
            'Valori massimi',
            `$v_{max} = A\\omega = ${q(vmax, 'm/s', lang)}$ (in $x = 0$), $a_{max} = A\\omega^2 = ${q(amax, 'm/s²', lang)}$ (agli estremi).`,
          ],
          [
            'Maximum values',
            `$v_{max} = A\\omega = ${q(vmax, 'm/s', lang)}$ (at $x = 0$), $a_{max} = A\\omega^2 = ${q(amax, 'm/s²', lang)}$ (at the turning points).`,
          ],
        ),
      ],
      [ans('ω', w, 'rad/s'), ans('A', A, 'm'), ans('v_max', vmax, 'm/s'), ans('a_max', amax, 'm/s²')],
      Fig.harmonicPlot({ T, x0, v0 }),
    );
  },
});

export const massaMolla = registerGenerator({
  id: 'fisica-1/massa-molla',
  topic: 'oscillatore-massa-molla',
  objectives: ['oscillatore-massa-molla.3', 'oscillatore-massa-molla.5'],
  generate(seed, lang) {
    const r = createRng(seed);
    const m = r.nice(0.1, 3, 2);
    const k = r.nice(20, 800, 2);
    const A = r.nice(0.02, 0.2, 2);
    const x = round2(A * r.float(0.2, 0.8));
    const T = 2 * Math.PI * Math.sqrt(m / k);
    const E = 0.5 * k * A * A;
    const v = Math.sqrt((k / m) * (A * A - x * x));
    return exercise(
      L(
        lang,
        `Un corpo di massa $m = ${q(m, 'kg', lang)}$ su un piano liscio è attaccato a una molla di costante $k = ${q(k, 'N/m', lang)}$; viene spostato di $A = ${q(A, 'm', lang)}$ e lasciato da fermo. Calcola il periodo, l'energia meccanica e la velocità quando $x = ${q(x, 'm', lang)}$.`,
        `A body of mass $m = ${q(m, 'kg', lang)}$ on a smooth plane is attached to a spring of constant $k = ${q(k, 'N/m', lang)}$; it is displaced by $A = ${q(A, 'm', lang)}$ and released from rest. Find the period, the mechanical energy and the speed when $x = ${q(x, 'm', lang)}$.`,
      ),
      [
        step(
          lang,
          ['Periodo', `$T = 2\\pi\\sqrt{m/k} = ${q(T, 's', lang)}$.`],
          ['Period', `$T = 2\\pi\\sqrt{m/k} = ${q(T, 's', lang)}$.`],
        ),
        step(
          lang,
          ['Energia', `Parte da fermo: $E = \\tfrac12 kA^2 = ${q(E, 'J', lang)}$.`],
          ['Energy', `It starts at rest: $E = \\tfrac12 kA^2 = ${q(E, 'J', lang)}$.`],
        ),
        step(
          lang,
          ['Velocità', `$\\tfrac12 mv^2 = \\tfrac12 k(A^2 - x^2) \\Rightarrow v = ${q(v, 'm/s', lang)}$.`],
          ['Speed', `$\\tfrac12 mv^2 = \\tfrac12 k(A^2 - x^2) \\Rightarrow v = ${q(v, 'm/s', lang)}$.`],
        ),
      ],
      [ans('T', T, 's'), ans('E', E, 'J'), ans('v', v, 'm/s')],
      {
        type: 'spring-mass',
        params: {
          orientation: 'horizontal',
          displacement: Math.round((x / A) * 100) / 100,
          kLabel: 'k',
          massLabel: 'm',
          xLabel: 'x',
        },
      },
    );
  },
});
const round2 = (x: number) => Number(x.toPrecision(2));

export const pendolo = registerGenerator({
  id: 'fisica-1/pendolo',
  topic: 'pendolo-semplice',
  objectives: ['pendolo-semplice.4', 'pendolo-semplice.6'],
  generate(seed, lang) {
    const r = createRng(seed);
    const Lf = r.nice(0.3, 3, 2);
    const m = r.nice(0.1, 2, 2);
    const th = r.int(5, 60);
    const T0 = 2 * Math.PI * Math.sqrt(Lf / G);
    const v = Math.sqrt(2 * G * Lf * (1 - Math.cos(rad(th))));
    const Tmax = m * G * (3 - 2 * Math.cos(rad(th)));
    return exercise(
      L(
        lang,
        `Un pendolo semplice di lunghezza $L = ${q(Lf, 'm', lang)}$ e massa $m = ${q(m, 'kg', lang)}$ viene lasciato da fermo con il filo inclinato di $${th}°$. Calcola il periodo delle piccole oscillazioni, la velocità nel punto più basso e la tensione massima del filo.`,
        `A simple pendulum of length $L = ${q(Lf, 'm', lang)}$ and mass $m = ${q(m, 'kg', lang)}$ is released from rest with the string at $${th}°$. Find the small-oscillation period, the speed at the lowest point and the maximum string tension.`,
      ),
      [
        step(
          lang,
          ['Periodo', `$T_0 = 2\\pi\\sqrt{L/g} = ${q(T0, 's', lang)}$ (vale per piccoli angoli).`],
          ['Period', `$T_0 = 2\\pi\\sqrt{L/g} = ${q(T0, 's', lang)}$ (valid for small angles).`],
        ),
        step(
          lang,
          [
            'Energia',
            `La massa scende di $L(1-\\cos\\theta_0)$: $v = \\sqrt{2gL(1-\\cos\\theta_0)} = ${q(v, 'm/s', lang)}$. L'energia vale anche per angoli grandi.`,
          ],
          [
            'Energy',
            `The bob drops by $L(1-\\cos\\theta_0)$: $v = \\sqrt{2gL(1-\\cos\\theta_0)} = ${q(v, 'm/s', lang)}$. Energy holds for large angles too.`,
          ],
        ),
        step(
          lang,
          [
            'Tensione',
            `In basso $T_{filo} - mg = mv^2/L$, cioè $T_{filo} = mg(3 - 2\\cos\\theta_0) = ${q(Tmax, 'N', lang)}$.`,
          ],
          [
            'Tension',
            `At the bottom $T_{string} - mg = mv^2/L$, i.e. $T_{string} = mg(3 - 2\\cos\\theta_0) = ${q(Tmax, 'N', lang)}$.`,
          ],
        ),
      ],
      [ans('T₀', T0, 's'), ans('v', v, 'm/s'), ans(L(lang, 'T_filo', 'T_string'), Tmax, 'N')],
      {
        type: 'pendulum',
        params: { angle: th, forces: true, lengthLabel: 'L', massLabel: 'm', angleLabel: 'θ_0' },
      },
    );
  },
});

export const ascensore = registerGenerator({
  id: 'fisica-1/riferimento-accelerato',
  topic: 'sistemi-di-riferimento',
  objectives: ['sistemi-di-riferimento.4', 'sistemi-di-riferimento.6'],
  generate(seed, lang) {
    const r = createRng(seed);
    const m = r.nice(40, 110, 2);
    const A = r.sign() * r.nice(0.5, 4, 2);
    const N = m * (G + A);
    const up = A > 0;
    return exercise(
      L(
        lang,
        `Una persona di massa $m = ${q(m, 'kg', lang)}$ sta su una bilancia in un ascensore che accelera ${up ? 'verso l’alto' : 'verso il basso'} con $|A| = ${q(Math.abs(A), 'm/s²', lang)}$. Quanto segna la bilancia (in newton)? Qual è il rapporto tra peso apparente e peso?`,
        `A person of mass $m = ${q(m, 'kg', lang)}$ stands on a scale in a lift accelerating ${up ? 'upwards' : 'downwards'} with $|A| = ${q(Math.abs(A), 'm/s²', lang)}$. What does the scale read (in newtons)? What is the ratio of apparent weight to weight?`,
      ),
      [
        step(
          lang,
          [
            'Riferimento dell’ascensore',
            `In quiete rispetto all'ascensore: $N - mg - mA = 0$ con A positiva verso l'alto (forza apparente $-m\\vec A$).`,
          ],
          [
            'Lift frame',
            `At rest relative to the lift: $N - mg - mA = 0$ with A positive upwards (fictitious force $-m\\vec A$).`,
          ],
        ),
        step(
          lang,
          ['Risultato', `$N = m(g + A) = ${q(N, 'N', lang)}$; $N/(mg) = ${num(N / (m * G), lang)}$.`],
          ['Result', `$N = m(g + A) = ${q(N, 'N', lang)}$; $N/(mg) = ${num(N / (m * G), lang)}$.`],
        ),
      ],
      [ans('N', N, 'N'), ans('N/mg', N / (m * G))],
      Fig.acceleratedFrame({ mode: 'elevator', down: !up }),
    );
  },
});

export const smorzato = registerGenerator({
  id: 'fisica-1/oscillatore-smorzato',
  topic: 'oscillatore-smorzato',
  objectives: ['oscillatore-smorzato.1', 'oscillatore-smorzato.4', 'oscillatore-smorzato.7'],
  generate(seed, lang) {
    const r = createRng(seed);
    const m = r.nice(0.1, 2, 2);
    const k = r.nice(10, 500, 2);
    const w0 = Math.sqrt(k / m);
    const b = Number((2 * m * w0 * r.float(0.02, 0.3)).toPrecision(2));
    const g = b / (2 * m);
    const ws = Math.sqrt(w0 * w0 - g * g);
    const ratio = Math.exp((g * 2 * Math.PI) / ws);
    const Q = w0 / (2 * g);
    return exercise(
      L(
        lang,
        `Un oscillatore ha massa $m = ${q(m, 'kg', lang)}$, costante elastica $k = ${q(k, 'N/m', lang)}$ e coefficiente di attrito viscoso $b = ${q(b, 'kg/s', lang)}$. Calcola $\\gamma$, la pulsazione delle oscillazioni smorzate, il rapporto tra due massimi successivi e il fattore di qualità.`,
        `An oscillator has mass $m = ${q(m, 'kg', lang)}$, spring constant $k = ${q(k, 'N/m', lang)}$ and viscous friction coefficient $b = ${q(b, 'kg/s', lang)}$. Find $\\gamma$, the angular frequency of the damped oscillations, the ratio of two successive maxima and the quality factor.`,
      ),
      [
        step(
          lang,
          [
            'Parametri',
            `$\\omega_0 = \\sqrt{k/m} = ${q(w0, 'rad/s', lang)}$, $\\gamma = b/2m = ${q(g, '1/s', lang)}$: $\\gamma < \\omega_0$, regime sottosmorzato.`,
          ],
          [
            'Parameters',
            `$\\omega_0 = \\sqrt{k/m} = ${q(w0, 'rad/s', lang)}$, $\\gamma = b/2m = ${q(g, '1/s', lang)}$: $\\gamma < \\omega_0$, underdamped regime.`,
          ],
        ),
        step(
          lang,
          ['Pulsazione', `$\\omega_s = \\sqrt{\\omega_0^2 - \\gamma^2} = ${q(ws, 'rad/s', lang, 4)}$.`],
          [
            'Angular frequency',
            `$\\omega_s = \\sqrt{\\omega_0^2 - \\gamma^2} = ${q(ws, 'rad/s', lang, 4)}$.`,
          ],
        ),
        step(
          lang,
          [
            'Massimi e Q',
            `Due massimi distano $T_s = 2\\pi/\\omega_s$: $x_n/x_{n+1} = e^{\\gamma T_s} = ${num(ratio, lang, 4)}$; $Q = \\omega_0/2\\gamma = ${num(Q, lang)}$.`,
          ],
          [
            'Maxima and Q',
            `Two maxima are $T_s = 2\\pi/\\omega_s$ apart: $x_n/x_{n+1} = e^{\\gamma T_s} = ${num(ratio, lang, 4)}$; $Q = \\omega_0/2\\gamma = ${num(Q, lang)}$.`,
          ],
        ),
      ],
      [
        ans('γ', g, '1/s'),
        ans('ω_s', ws, 'rad/s', 0.002),
        ans('x_n/x_(n+1)', ratio, undefined, 0.005),
        ans('Q', Q),
      ],
      Fig.dampedPlot({ gamma: g, omega: ws }),
    );
  },
});

export const risonanza = registerGenerator({
  id: 'fisica-1/risonanza',
  topic: 'risonanza',
  objectives: ['risonanza.2', 'risonanza.4'],
  generate(seed, lang) {
    const r = createRng(seed);
    const m = r.nice(0.1, 2, 2);
    const w0 = r.nice(5, 40, 2);
    const k = Number((m * w0 * w0).toPrecision(3));
    const W0 = Math.sqrt(k / m);
    const b = Number((2 * m * W0 * r.float(0.03, 0.2)).toPrecision(2));
    const F0 = r.nice(0.2, 5, 2);
    const Om = Number((W0 * r.pick([0.5, 0.7, 0.8, 0.9, 1.1, 1.2, 1.5])).toPrecision(2));
    const g = b / (2 * m);
    const A = F0 / m / Math.sqrt((W0 * W0 - Om * Om) ** 2 + 4 * g * g * Om * Om);
    const delta = Math.atan2(2 * g * Om, W0 * W0 - Om * Om);
    const Amax = F0 / m / (2 * g * Math.sqrt(W0 * W0 - g * g));
    return exercise(
      L(
        lang,
        `Un oscillatore con $m = ${q(m, 'kg', lang)}$, $k = ${q(k, 'N/m', lang)}$ e $b = ${q(b, 'kg/s', lang)}$ è forzato da $F_0\\cos\\Omega t$ con $F_0 = ${q(F0, 'N', lang)}$ e $\\Omega = ${q(Om, 'rad/s', lang)}$. Calcola l'ampiezza a regime, il ritardo di fase e l'ampiezza massima che si otterrebbe variando $\\Omega$.`,
        `An oscillator with $m = ${q(m, 'kg', lang)}$, $k = ${q(k, 'N/m', lang)}$ and $b = ${q(b, 'kg/s', lang)}$ is driven by $F_0\\cos\\Omega t$ with $F_0 = ${q(F0, 'N', lang)}$ and $\\Omega = ${q(Om, 'rad/s', lang)}$. Find the steady-state amplitude, the phase lag and the maximum amplitude obtainable by varying $\\Omega$.`,
      ),
      [
        step(
          lang,
          [
            'Parametri',
            `$\\omega_0 = \\sqrt{k/m} = ${q(W0, 'rad/s', lang)}$, $\\gamma = b/2m = ${q(g, '1/s', lang)}$.`,
          ],
          [
            'Parameters',
            `$\\omega_0 = \\sqrt{k/m} = ${q(W0, 'rad/s', lang)}$, $\\gamma = b/2m = ${q(g, '1/s', lang)}$.`,
          ],
        ),
        step(
          lang,
          [
            'Ampiezza e fase',
            `$A = \\dfrac{F_0/m}{\\sqrt{(\\omega_0^2-\\Omega^2)^2 + 4\\gamma^2\\Omega^2}} = ${q(A, 'm', lang)}$; $\\tan\\delta = \\dfrac{2\\gamma\\Omega}{\\omega_0^2-\\Omega^2}$, $\\delta = ${q(delta, 'rad', lang)}$ (tra 0 e π).`,
          ],
          [
            'Amplitude and phase',
            `$A = \\dfrac{F_0/m}{\\sqrt{(\\omega_0^2-\\Omega^2)^2 + 4\\gamma^2\\Omega^2}} = ${q(A, 'm', lang)}$; $\\tan\\delta = \\dfrac{2\\gamma\\Omega}{\\omega_0^2-\\Omega^2}$, $\\delta = ${q(delta, 'rad', lang)}$ (between 0 and π).`,
          ],
        ),
        step(
          lang,
          [
            'Picco',
            `$A_{max} = \\dfrac{F_0/m}{2\\gamma\\sqrt{\\omega_0^2-\\gamma^2}} = ${q(Amax, 'm', lang)}$, a $\\Omega_{ris} = \\sqrt{\\omega_0^2 - 2\\gamma^2}$.`,
          ],
          [
            'Peak',
            `$A_{max} = \\dfrac{F_0/m}{2\\gamma\\sqrt{\\omega_0^2-\\gamma^2}} = ${q(Amax, 'm', lang)}$, at $\\Omega_{res} = \\sqrt{\\omega_0^2 - 2\\gamma^2}$.`,
          ],
        ),
      ],
      [ans('A', A, 'm'), ans('δ', delta, 'rad'), ans('A_max', Amax, 'm')],
      Fig.resonancePlot({ m, k, b, F0, Om }),
    );
  },
});
