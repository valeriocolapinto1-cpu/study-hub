/**
 * Soluzioni degli esercizi statici di Fisica 1 RICALCOLATE: per ogni risposta
 * pubblicata, l'espressione indipendente usata per scriverla (generato da
 * tools/fisica-1 a partire dai sorgenti di traduzione; non modificare a mano).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';

const CALC: Record<string, Record<string, () => number>> = {
  'volano-avviamento': {
    ω: () => 3 * 2,
    a_t: () => 3 * 0.4,
    a_n: () => 36 * 0.4,
    '|a|': () => Math.hypot(1.2, 14.4),
  },
  'curva-frenata': {
    a_t: () => (15 ** 2 - 25 ** 2) / (2 * 60),
    '|a| iniziale': () => Math.hypot(400 / 120, 625 / 80),
    '|a| finale': () => Math.hypot(400 / 120, 225 / 80),
  },
  'legge-oraria-condizioni-iniziali': {
    ω: () => (2 * Math.PI) / 0.5,
    A: () => 100 * Math.hypot(0.02, 0.3 / (4 * Math.PI)),
    a_max: () => Math.hypot(0.02, 0.3 / (4 * Math.PI)) * (4 * Math.PI) ** 2,
  },
  'istante-passaggio': {
    'v(0)': () => -0.5 * Math.sin(Math.PI / 3),
    t: () => Math.PI / 30,
    v: () => -0.5,
  },
  'molla-orizzontale-energia': {
    T: () => 2 * Math.PI * Math.sqrt(0.8 / 200),
    E: () => 0.5 * 200 * 0.05 ** 2,
    v: () => Math.sqrt(250 * (0.05 ** 2 - 0.03 ** 2)),
  },
  'molla-verticale-urto': {
    'v₀': () => Math.sqrt(2 * 9.81 * 0.3),
    d: () => (0.2 * 9.81 + Math.sqrt((0.2 * 9.81) ** 2 + 2 * 400 * 0.2 * 9.81 * 0.3)) / 400,
    A: () =>
      (0.2 * 9.81 + Math.sqrt((0.2 * 9.81) ** 2 + 2 * 400 * 0.2 * 9.81 * 0.3)) / 400 - (0.2 * 9.81) / 400,
  },
  'pendolo-periodo-tensione': {
    T: () => 2 * Math.PI * Math.sqrt(0.8 / 9.81),
    v_max: () => Math.sqrt(2 * 9.81 * 0.8 * (1 - Math.cos((8 * Math.PI) / 180))),
    'T_filo max': () => 0.25 * 9.81 * (3 - 2 * Math.cos((8 * Math.PI) / 180)),
  },
  'pendolo-vagone': {
    θ_eq: () => (Math.atan(2.5 / 9.81) * 180) / Math.PI,
    T: () => 2 * Math.PI * Math.sqrt(0.5 / Math.hypot(9.81, 2.5)),
    'T/T₀': () => Math.sqrt(9.81 / Math.hypot(9.81, 2.5)),
  },
  'bilancia-ascensore': {
    'N (a)': () => 70 * (9.81 + 1.5),
    'N (b)': () => 70 * 9.81,
    'N (c)': () => 70 * (9.81 - 2),
  },
  'cassa-camion': {
    A_max: () => 0.35 * 9.81,
    "a' (rispetto al camion)": () => -4.5 + 0.25 * 9.81,
    'a (rispetto alla strada)': () => 0.25 * 9.81,
  },
  'smorzato-decremento': {
    γ: () => 0.4 / (2 * 0.5),
    ω_s: () => Math.sqrt(100 - 0.16),
    'x_n/x_(n+1)': () => Math.exp((0.4 * 2 * Math.PI) / Math.sqrt(99.84)),
    Q: () => 10 / 0.8,
  },
  'smorzamento-critico-ammortizzatore': {
    b: () => 2 * 300 * 10,
    t: () =>
      (() => {
        let u = 5;
        for (let i = 0; i < 60; i++) {
          const f = (1 + u) * Math.exp(-u) - 0.01,
            d = -u * Math.exp(-u);
          u -= f / d;
        }
        return u / 10;
      })(),
  },
  'forzato-ampiezza-regime': {
    'A(15 rad/s)': () => 2.5 / Math.sqrt(175 ** 2 + 900),
    Ω_ris: () => Math.sqrt(398),
    A_max: () => 2.5 / (2 * Math.sqrt(399)),
    δ: () => Math.atan(30 / 175),
  },
  'potenza-risonanza': {
    'v₀': () => (20 * 2.5) / 40,
    '⟨P⟩': () => 0.5 * 0.5 * 1.25,
  },
  'frenata-lavoro-attrito': {
    W_tot: () => -0.5 * 1200 * 625,
    d: () => 375000 / 6000,
    'P media': () => 375000 / 5,
  },
  'lavoro-forza-variabile': {
    W: () => 48 - 64 / 3,
    v: () => Math.sqrt((2 * (48 - 64 / 3)) / 2),
    P: () => 8 * Math.sqrt(48 - 64 / 3),
  },
  'giro-della-morte': {
    h_min: () => 2.5 * 0.4,
    'v in basso': () => Math.sqrt(5 * 9.81 * 0.4),
    'N in basso': () => 6 * 0.5 * 9.81,
  },
  'molla-lancio-verticale': {
    U_el: () => 0.5 * 800 * 0.01,
    h: () => 4 / (0.1 * 9.81),
    v: () => Math.sqrt((2 * (4 - 0.1 * 9.81 * 0.1)) / 0.1),
  },
  'piano-scabro-andata-ritorno': {
    d: () => 18 / (9.81 * (0.5 + 0.2 * Math.cos(Math.PI / 6))),
    'energia dissipata per kg': () =>
      (0.2 * 9.81 * Math.cos(Math.PI / 6) * 18) / (9.81 * (0.5 + 0.2 * Math.cos(Math.PI / 6))),
    v_f: () =>
      Math.sqrt(
        (2 * 9.81 * (0.5 - 0.2 * Math.cos(Math.PI / 6)) * 18) / (9.81 * (0.5 + 0.2 * Math.cos(Math.PI / 6))),
      ),
  },
  'slitta-tratto-scabro': {
    v: () => Math.sqrt(2 * 9.81 * 5),
    d: () => 5 / 0.4,
    'energia dissipata': () => 20 * 9.81 * 5,
  },
  'momento-chiave-inglese': {
    b: () => 0.25 * Math.sin(Math.PI / 3),
    τ: () => 80 * 0.25 * Math.sin(Math.PI / 3),
    F_min: () => 80 * Math.sin(Math.PI / 3),
  },
  'pallina-filo-che-si-accorcia': {
    'v₂': () => (2 * 0.5) / 0.2,
    ΔK: () => 0.05 * (25 - 4),
    T: () => (0.1 * 25) / 0.2,
  },
  'uomo-sulla-barca': {
    'Δx barca': () => (-75 * 4.5) / 225,
    'Δx uomo': () => (150 * 4.5) / 225,
    'v barca': () => (-75 * 1.2) / 150,
  },
  'proiettile-esplode': {
    'v₂': () => -30 / 2,
    distanza: () => 45 * Math.sqrt(160 / 9.81),
  },
  'asta-con-masse': {
    I_cm: () => (1.2 * 0.64) / 12 + 2 * 0.3 * 0.16,
    I_estremo: () => (1.2 * 0.64) / 3 + 0.3 * 0.64,
  },
  'disco-con-foro': {
    massa: () => 4 - 1,
    x_cm: () => -0.1 / 3,
    I_O: () => 0.5 * 4 * 0.04 - (0.5 * 1 * 0.01 + 1 * 0.01),
  },
  'carrucola-massiva': {
    a: () => (4 * 9.81) / 7,
    T: () => (3 * 4 * 9.81) / 7,
    ω: () => Math.sqrt(((2 * 4 * 9.81) / 7) * 2) / 0.15,
  },
  'pattinatrice-braccia': {
    'ν₂': () => 2 * 3,
    'K₁': () => 0.5 * 3.6 * (4 * Math.PI) ** 2,
    'K₂': () => 0.5 * 1.2 * (12 * Math.PI) ** 2,
    W: () => 0.5 * 1.2 * (12 * Math.PI) ** 2 - 0.5 * 3.6 * (4 * Math.PI) ** 2,
  },
  'ruota-energia-koenig': {
    K_cm: () => 0.5 * 1.5 * 25,
    "K'": () => 0.5 * 1.5 * 25,
    frazione: () => 0.5,
  },
  'due-carrelli-massa-ridotta': {
    v_cm: () => 3 / 5,
    K: () => 9 + 1.5,
    "K'": () => 0.5 * 1.2 * 16,
  },
  'volano-frenato': {
    α: () => 1.5 / 0.9,
    t: () => (20 * Math.PI) / (1.5 / 0.9),
    giri: () => (20 * Math.PI) ** 2 / ((2 * 1.5) / 0.9) / (2 * Math.PI),
  },
  'rocchetto-due-masse': {
    a: () => (2 * 9.81) / 5,
    'T₁': () => 3 * (9.81 - (2 * 9.81) / 5),
    'T₂': () => 1 * (9.81 + (2 * 9.81) / 5),
    P: () => ((0.5 * 2 * 0.01 * ((2 * 9.81) / 5)) / 0.1) * 10,
  },
  'scala-appoggiata': {
    N_muro: () => (12 * 9.81) / (2 * Math.tan(Math.PI / 3)),
    f_s: () => (12 * 9.81) / (2 * Math.tan(Math.PI / 3)),
    'μ_s min': () => 1 / (2 * Math.tan(Math.PI / 3)),
  },
  'trave-due-appoggi': {
    R_A: () => 60 * 9.81,
    R_B: () => 40 * 9.81,
  },
  'asta-che-cade': {
    ω: () => Math.sqrt((3 * 9.81) / 1.2),
    'v estremo': () => Math.sqrt(3 * 9.81 * 1.2),
    v_cm: () => Math.sqrt(3 * 9.81 * 1.2) / 2,
  },
  'disco-massa-appesa-energia': {
    v: () => Math.sqrt((2 * 2 * 9.81 * 1.5) / 4),
    'frazione rotazionale': () => 2 / 4,
  },
  'asta-pendolo-fisico': {
    ℓ: () => (2 * 0.9) / 3,
    T: () => 2 * Math.PI * Math.sqrt(0.6 / 9.81),
    'T (d = 0,15 m)': () => 2 * Math.PI * Math.sqrt((0.81 / 12 / 0.15 + 0.15) / 9.81),
  },
  'anello-appeso': {
    ℓ: () => 2 * 0.25,
    T: () => 2 * Math.PI * Math.sqrt(0.5 / 9.81),
  },
  'cilindro-piano-inclinato': {
    a: () => (9.81 * Math.sin((25 * Math.PI) / 180)) / 1.5,
    f_s: () => (2 * 9.81 * Math.sin((25 * Math.PI) / 180)) / 3,
    'μ_s min': () => Math.tan((25 * Math.PI) / 180) / 3,
    v: () => Math.sqrt(((2 * 9.81 * Math.sin((25 * Math.PI) / 180)) / 1.5) * 1.5),
  },
  'gara-sfera-anello': {
    'v sfera': () => Math.sqrt((2 * 9.81) / 1.4),
    'v anello': () => Math.sqrt(9.81),
    'rapporto tempi': () => Math.sqrt(2 / 1.4),
  },
  'urto-elastico-carrelli': {
    "v₁'": () => ((0.4 - 1.2) / 1.6) * 2,
    "v₂'": () => (0.8 / 1.6) * 2,
    'frazione trasferita': () => 1.2 / (0.4 * 4),
  },
  'urto-anelastico-auto': {
    "v'": () => 42000 / 3000,
    'energia dissipata': () => ((0.5 * 2000) / 3) * 81,
  },
  'pendolo-balistico-proiettile': {
    h: () => 1.5 * (1 - Math.cos((18 * Math.PI) / 180)),
    V: () => Math.sqrt(2 * 9.81 * 1.5 * (1 - Math.cos((18 * Math.PI) / 180))),
    'v₀': () => 201 * Math.sqrt(2 * 9.81 * 1.5 * (1 - Math.cos((18 * Math.PI) / 180))),
    'frazione dissipata': () => 2 / 2.01,
  },
  'errore-energia-urto': {
    h: () => (1.5 / 1.005) ** 2 / (2 * 9.81),
    "h' (sbagliata)": () => 225 / (1.005 * 9.81),
    rapporto: () => 1.005 / 0.005,
  },
  'sub-pressione-profondita': {
    'p assoluta': () => 101300 + 1025 * 9.81 * 25,
    'p relativa': () => 1025 * 9.81 * 25,
    F: () => 1025 * 9.81 * 25 * 0.012,
  },
  'tubo-a-u-due-liquidi': {
    'Δh mercurio': () => 27.2 / 13.6,
    'dislivello superfici': () => 27.2 - 2,
  },
  'velocita-quadratica-media': {
    'v_qm elio': () => Math.sqrt((3 * 8.314 * 300) / 0.004),
    'v_qm ossigeno': () => Math.sqrt((3 * 8.314 * 300) / 0.032),
    'energia media': () => 1.5 * 1.381e-23 * 300,
  },
  'urti-sulla-parete': {
    N: () => (1e5 * 2e-3) / (1.381e-23 * 300),
    massa: () => ((1e5 * 2e-3) / (8.314 * 300)) * 28,
    'densità di energia': () => 1.5e5,
  },
  'pneumatico-temperatura': {
    'p assoluta': () => (3.2e5 * 318.15) / 288.15,
    'p relativa': () => (3.2e5 * 318.15) / 288.15 - 1e5,
    n: () => (3.2e5 * 0.025) / (8.314 * 288.15),
  },
  'bolla-che-risale': {
    'p sul fondo': () => 1.013e5 + 1000 * 9.81 * 20,
    'V₂': () => (((1.013e5 + 1000 * 9.81 * 20) / 1.013e5) * 291.15) / 279.15,
  },
  'energia-interna-biatomico': {
    'U iniziale': () => 2.5 * 2 * 8.314 * 293.15,
    ΔU: () => 2.5 * 2 * 8.314 * 100,
    Q: () => 2.5 * 2 * 8.314 * 100,
  },
  'miscela-equipartizione': {
    T_f: () => (600 + 625) / 4,
    'ΔU elio': () => 1.5 * 8.314 * (306.25 - 400),
  },
  'riscaldamento-isobaro-isocoro': {
    Q_V: () => 3 * 2.5 * 8.314 * 50,
    Q_p: () => 3 * 3.5 * 8.314 * 50,
    W: () => 3 * 8.314 * 50,
  },
  'dulong-petit-rame': {
    'c rame': () => (3 * 8.314) / 0.0635,
    'T equilibrio': () =>
      (((0.5 * 3 * 8.314) / 0.0635) * 100 + 4186 * 20) / ((0.5 * 3 * 8.314) / 0.0635 + 4186),
  },
  'espansione-isoterma-adiabatica': {
    'W isoterma': () => 8.314 * 300 * Math.log(2),
    'T₂ adiabatica': () => 300 * 2 ** (-2 / 3),
    'W adiabatica': () => 1.5 * 8.314 * (300 - 300 * 2 ** (-2 / 3)),
  },
  'ciclo-rettangolare': {
    'W netto': () => 2e5 * 0.015,
    'Q assorbito': () => 2.5 * 0.01 * 2e5 + 3.5 * 3e5 * 0.015,
    η: () => 3000 / 20750,
  },
  'motore-rendimento': {
    η: () => 600 / 2400,
    '|Q_F|': () => 2400 - 600,
    'P meccanica': () => 25 * 600,
  },
  'pompa-di-calore-cop': {
    'COP pompa': () => 9 / 2.5,
    'P estratta': () => 9 - 2.5,
    'COP frigo': () => 6.5 / 2.5,
  },
  'carnot-gas-perfetto': {
    Q_C: () => 0.2 * 8.314 * 600 * Math.log(2),
    η: () => 0.5,
    W: () => 0.1 * 8.314 * 600 * Math.log(2),
    'V_max/V_min': () => 2 * 2 ** 1.5,
  },
  'frigorifero-carnot': {
    COP: () => 255.15 / 43,
    W: () => (100 * 43) / 255.15,
    Q_C: () => 100 + (100 * 43) / 255.15,
  },
  'verifica-macchina-dichiarata': {
    'η dichiarato': () => 0.45,
    'η massimo': () => 1 - 300 / 500,
    'W massimo': () => 0.4 * 10,
  },
  'centrale-termoelettrica': {
    'P scaricata': () => 500 / 0.38 - 500,
    'η Carnot': () => 1 - 300 / 820,
    'P scaricata ideale': () => 500 * (1 / (1 - 300 / 820) - 1),
  },
  'clausius-verifica-ciclo': {
    'Σ Q/T': () => 2 - 8 / 3,
    η: () => 1 / 3,
    'ΔS universo': () => 8 / 3 - 2,
  },
  'clausius-tre-sorgenti': {
    'W max': () => 800 - 250 * 1.75,
    η: () => 362.5 / 800,
    'η Carnot': () => 0.5,
  },
  'entropia-espansione-libera': {
    ΔT: () => 0,
    'ΔS gas': () => 2 * 8.314 * Math.log(3),
    'ΔS universo': () => 2 * 8.314 * Math.log(3),
  },
  'entropia-mescolamento-acqua': {
    T_f: () => 50,
    'ΔS calda': () => 4186 * Math.log(323.15 / 353.15),
    'ΔS fredda': () => 4186 * Math.log(323.15 / 293.15),
    'ΔS universo': () => 4186 * Math.log(323.15 ** 2 / (353.15 * 293.15)),
  },
};

const DIR = resolve(import.meta.dirname, '../../../src/content/exercises/fisica-1');
type Ex = { id: string; kind: string; answer?: { label: { it: string }; value: number; tol?: number }[] };
const all = readdirSync(DIR).flatMap((f) => load(readFileSync(join(DIR, f), 'utf8')) as Ex[]);

describe('Fisica 1: soluzioni degli esercizi statici', () => {
  it('ogni esercizio statico ha le sue espressioni di verifica', () => {
    expect(
      all
        .filter((e) => e.kind === 'static')
        .map((e) => e.id)
        .sort(),
    ).toEqual(Object.keys(CALC).sort());
  });
  it.each(all.filter((e) => e.kind === 'static'))('$id', (e) => {
    for (const a of e.answer ?? []) {
      const f = CALC[e.id]?.[a.label.it];
      expect(f, a.label.it).toBeTypeOf('function');
      const v = f!();
      const tol = a.tol ?? 0.01;
      expect(
        Math.abs(a.value - v) <= tol * Math.max(Math.abs(v), 1e-9) + 1e-12,
        `${a.label.it}: ${a.value} ≠ ${v}`,
      ).toBe(true);
    }
  });
});
