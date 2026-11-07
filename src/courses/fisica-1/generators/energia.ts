/** Generatori di lavoro ed energia (area B dell'originale). */
import { registerGenerator } from '../../../engine/generators/registry';
import { createRng } from '../../../engine/random';
import { G, L, ans, exercise, q, rad, step } from '../lib/gen';

export const frenata = registerGenerator({
  id: 'fisica-1/lavoro-frenata',
  topic: 'lavoro-energia-cinetica',
  objectives: ['lavoro-energia-cinetica.3', 'lavoro-energia-cinetica.6'],
  generate(seed, lang) {
    const r = createRng(seed);
    const m = r.nice(600, 2000, 2);
    const vk = r.int(4, 13) * 10; // km/h
    const F = r.nice(2000, 12000, 2);
    const v = vk / 3.6;
    const K = 0.5 * m * v * v;
    const d = K / F;
    return exercise(
      L(
        lang,
        `Un'auto di massa $m = ${q(m, 'kg', lang)}$ viaggia a $${vk}\\ \\text{km/h}$ su strada orizzontale e frena fino a fermarsi con una forza frenante costante $F = ${q(F, 'N', lang)}$. Calcola il lavoro totale delle forze e lo spazio di frenata.`,
        `A car of mass $m = ${q(m, 'kg', lang)}$ travels at $${vk}\\ \\text{km/h}$ on a horizontal road and brakes to a stop with a constant braking force $F = ${q(F, 'N', lang)}$. Find the total work of the forces and the braking distance.`,
      ),
      [
        step(
          lang,
          [
            'Teorema dell’energia cinetica',
            `$v = ${q(v, 'm/s', lang)}$; $W_{tot} = \\Delta K = -\\tfrac12 mv^2 = ${q(-K, 'J', lang)}$.`,
          ],
          [
            'Kinetic energy theorem',
            `$v = ${q(v, 'm/s', lang)}$; $W_{tot} = \\Delta K = -\\tfrac12 mv^2 = ${q(-K, 'J', lang)}$.`,
          ],
        ),
        step(
          lang,
          [
            'Spazio di frenata',
            `Peso e normale non lavorano: $-Fd = \\Delta K \\Rightarrow d = ${q(d, 'm', lang)}$.`,
          ],
          [
            'Braking distance',
            `Weight and normal force do no work: $-Fd = \\Delta K \\Rightarrow d = ${q(d, 'm', lang)}$.`,
          ],
        ),
      ],
      [ans('W_tot', -K, 'J'), ans('d', d, 'm')],
    );
  },
});

export const giroDellaMorte = registerGenerator({
  id: 'fisica-1/giro-della-morte',
  topic: 'forze-conservative',
  objectives: ['forze-conservative.3', 'forze-conservative.7'],
  generate(seed, lang) {
    const r = createRng(seed);
    const R = r.nice(0.2, 3, 2);
    const m = r.nice(0.1, 5, 2);
    const extra = r.nice(0.1, 1, 1);
    const h = Number((R * (2.5 + extra)).toPrecision(3));
    const vb = Math.sqrt(2 * G * h);
    const vt = Math.sqrt(2 * G * (h - 2 * R));
    const Nt = (m * vt * vt) / R - m * G;
    return exercise(
      L(
        lang,
        `Un carrello di massa $m = ${q(m, 'kg', lang)}$ parte da fermo da un'altezza $h = ${q(h, 'm', lang)}$ su una guida liscia che termina con un giro della morte di raggio $R = ${q(R, 'm', lang)}$. Calcola la velocità nel punto più basso, la velocità in cima al giro e la reazione della guida in cima.`,
        `A cart of mass $m = ${q(m, 'kg', lang)}$ starts from rest at height $h = ${q(h, 'm', lang)}$ on a smooth track ending in a vertical loop of radius $R = ${q(R, 'm', lang)}$. Find the speed at the lowest point, the speed at the top of the loop and the reaction of the track at the top.`,
      ),
      [
        step(
          lang,
          [
            'Conservazione dell’energia',
            `La normale non lavora: $v_{basso} = \\sqrt{2gh} = ${q(vb, 'm/s', lang)}$, $v_{cima} = \\sqrt{2g(h - 2R)} = ${q(vt, 'm/s', lang)}$.`,
          ],
          [
            'Energy conservation',
            `The normal force does no work: $v_{bottom} = \\sqrt{2gh} = ${q(vb, 'm/s', lang)}$, $v_{top} = \\sqrt{2g(h - 2R)} = ${q(vt, 'm/s', lang)}$.`,
          ],
        ),
        step(
          lang,
          [
            'Reazione in cima',
            `$N + mg = mv_{cima}^2/R \\Rightarrow N = ${q(Nt, 'N', lang)}$ (positiva: il carrello resta sulla guida, perché $h > 2{,}5R$).`,
          ],
          [
            'Reaction at the top',
            `$N + mg = mv_{top}^2/R \\Rightarrow N = ${q(Nt, 'N', lang)}$ (positive: the cart stays on the track, because $h > 2.5R$).`,
          ],
        ),
      ],
      [
        ans(L(lang, 'v in basso', 'v at the bottom'), vb, 'm/s'),
        ans(L(lang, 'v in cima', 'v at the top'), vt, 'm/s'),
        ans('N', Nt, 'N'),
      ],
    );
  },
});

export const pianoScabro = registerGenerator({
  id: 'fisica-1/piano-scabro',
  topic: 'forze-non-conservative',
  objectives: ['forze-non-conservative.1', 'forze-non-conservative.3', 'forze-non-conservative.6'],
  generate(seed, lang) {
    const r = createRng(seed);
    const v0 = r.nice(2, 12, 2);
    const th = r.int(20, 45);
    const mu = Number((Math.tan(rad(th)) * r.float(0.15, 0.6)).toPrecision(2));
    const s = Math.sin(rad(th));
    const c = Math.cos(rad(th));
    const d = (v0 * v0) / (2 * G * (s + mu * c));
    const vf = Math.sqrt(2 * G * d * (s - mu * c));
    return exercise(
      L(
        lang,
        `Un blocco è lanciato con velocità $v_0 = ${q(v0, 'm/s', lang)}$ su per un piano inclinato di $${th}°$ con coefficiente di attrito dinamico $\\mu_d = ${q(mu, '', lang, 2)}$ (l'attrito statico non basta a trattenerlo in cima). Calcola la distanza percorsa in salita e la velocità con cui ripassa dal punto di partenza.`,
        `A block is launched with speed $v_0 = ${q(v0, 'm/s', lang)}$ up a $${th}°$ incline with kinetic friction coefficient $\\mu_k = ${q(mu, '', lang, 2)}$ (static friction cannot hold it at the top). Find the distance travelled upwards and the speed with which it passes the starting point again.`,
      ),
      [
        step(
          lang,
          [
            'Salita: bilancio $\\Delta E = W_{nc}$',
            `$\\tfrac12 v_0^2 = g d(\\sin\\theta + \\mu_d\\cos\\theta) \\Rightarrow d = ${q(d, 'm', lang)}$.`,
          ],
          [
            'Going up: balance $\\Delta E = W_{nc}$',
            `$\\tfrac12 v_0^2 = g d(\\sin\\theta + \\mu_k\\cos\\theta) \\Rightarrow d = ${q(d, 'm', lang)}$.`,
          ],
        ),
        step(
          lang,
          [
            'Discesa',
            `L'attrito lavora di nuovo contro il moto: $\\tfrac12 v_f^2 = g d(\\sin\\theta - \\mu_d\\cos\\theta) \\Rightarrow v_f = ${q(vf, 'm/s', lang)}$.`,
          ],
          [
            'Coming down',
            `Friction again works against the motion: $\\tfrac12 v_f^2 = g d(\\sin\\theta - \\mu_k\\cos\\theta) \\Rightarrow v_f = ${q(vf, 'm/s', lang)}$.`,
          ],
        ),
      ],
      [ans('d', d, 'm'), ans('v_f', vf, 'm/s')],
    );
  },
});
