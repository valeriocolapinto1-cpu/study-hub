/**
 * Soluzioni degli esercizi statici di Fisica 1 RICALCOLATE: per ogni risposta
 * pubblicata, l'espressione indipendente usata per scriverla (le voci fino alla
 * revisione 2 erano generate da tools/fisica-1; quelle di R2 sono scritte a mano con lo script di R2).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
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
    'x_n/x_n+1': () => Math.exp((0.4 * 2 * Math.PI) / Math.sqrt(99.84)),
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
  // Revisione 2, R2: esercizi aggiunti per gli obiettivi scoperti (valori ricalcolati qui).
  'r2-mcv-1': {
    α: () => 2 / 50,
    a_n: () => 15 ** 2 / 50,
    '|a|': () => Math.hypot(2, 15 ** 2 / 50),
  },
  'r2-mcv-2': {},
  'r2-mcv-3': {},
  'r2-ma-1': {
    A: () => Math.hypot(0.03, 0.4 / 10),
    '\\varphi': () => (Math.atan2(0.04, 0.03) * 180) / Math.PI,
  },
  'r2-ma-2': {},
  'r2-ma-3': {},
  'r2-omm-1': {
    E: () => 0.5 * 200 * 0.1 ** 2,
    U: () => 0.5 * 200 * 0.06 ** 2,
    v: () => Math.sqrt((200 / 0.5) * (0.1 ** 2 - 0.06 ** 2)),
  },
  'r2-omm-2': {
    Δ: () => (0.4 * 9.81) / 100,
    T: () => 2 * Math.PI * Math.sqrt(0.4 / 100),
  },
  'r2-omm-3': {},
  'r2-ps-1': {},
  'r2-ps-2': {
    v_max: () => Math.sqrt(2 * 9.81 * 1.2 * (1 - Math.cos(Math.PI / 6))),
    T_max: () => 0.3 * 9.81 * (3 - 2 * Math.cos(Math.PI / 6)),
    T_min: () => 0.3 * 9.81 * Math.cos(Math.PI / 6),
  },
  'r2-ps-3': {
    T_0: () => 2 * Math.PI * Math.sqrt(1 / 9.81),
    T: () => 2 * Math.PI * Math.sqrt(1 / 9.81) * (1 + ((40 * Math.PI) / 180) ** 2 / 16),
  },
  'r2-sr-1': {
    N_a: () => 60 * (9.81 - 2),
    N_b: () => 60 * (9.81 + 2),
  },
  'r2-sr-2': {
    F_app: () => 0.5 * 3,
    θ: () => (Math.atan(3 / 9.81) * 180) / Math.PI,
  },
  'r2-sr-3': {},
  'r2-sr-4': {},
  'r2-os-1': {
    '\\gamma': () => 0.4 / (2 * 0.2),
    ω_s: () => Math.sqrt(80 / 0.2 - 1),
    Q: () => Math.sqrt(80 / 0.2) / 2,
    'A(2)/A_0': () => Math.exp(-2),
  },
  'r2-os-2': {},
  'r2-os-3': {},
  'r2-ris-1': {
    'A(0)': () => 10 / 100,
    'A(ω_0)': () => 10 / (2 * 1 * 1 * 10),
    ω_r: () => Math.sqrt(100 - 2),
  },
  'r2-ris-2': {},
  'r2-ris-3': {},
  'r2-ris-4': {},
  'r2-lec-1': {
    W_F: () => 40 * Math.cos(Math.PI / 6) * 3,
    W_a: () => -0.2 * (5 * 9.81 - 40 * 0.5) * 3,
    v: () => Math.sqrt((2 * (40 * Math.cos(Math.PI / 6) * 3 - 0.2 * (5 * 9.81 - 40 * 0.5) * 3)) / 5),
  },
  'r2-lec-2': {},
  'r2-lec-3': {},
  'r2-fc-1': {
    v: () => 0.1 * Math.sqrt(800 / 0.05),
    h: () => (800 * 0.1 ** 2) / (2 * 0.05 * 9.81),
  },
  'r2-fc-2': {
    'F(2)': () => -6 * 2 ** 2 + 6,
    x_s: () => Math.sqrt(6 / 6),
  },
  'r2-fc-3': {},
  'r2-fc-4': {},
  'r2-fnc-1': {
    d: () => 36 / (2 * 9.81 * (0.5 + 0.25 * Math.cos(Math.PI / 6))),
    v: () =>
      Math.sqrt(
        2 *
          9.81 *
          (36 / (2 * 9.81 * (0.5 + 0.25 * Math.cos(Math.PI / 6)))) *
          (0.5 - 0.25 * Math.cos(Math.PI / 6)),
      ),
    E_diss: () =>
      2 * 0.25 * 2 * 9.81 * Math.cos(Math.PI / 6) * (36 / (2 * 9.81 * (0.5 + 0.25 * Math.cos(Math.PI / 6)))),
  },
  'r2-fnc-2': {},
  'r2-fnc-3': {},
  'r2-mang-1': {
    L_O: () => 2 * 3 * 4,
    L_P: () => 2 * 3 * (4 - 1),
  },
  'r2-mang-2': {},
  'r2-mang-3': {},
  'r2-mang-4': {
    v_2: () => (1.47e11 * 30.29) / 1.52e11,
    'dA/dt': () => 0.5 * 1.47e11 * 30.29e3,
  },
  'r2-cm-1': {
    R: () => (20 ** 2 * Math.sin((120 * Math.PI) / 180)) / 9.81,
    x_2: () => (1.5 * (20 ** 2 * Math.sin((120 * Math.PI) / 180))) / 9.81,
  },
  'r2-cm-2': {},
  'r2-cm-3': {
    '|v_2|': () => (50 * 3) / 75,
  },
  'r2-mi-1': {},
  'r2-mi-2': {
    I_anello: () => 2 * 0.1 ** 2,
    I_disco: () => 0.5 * 2 * 0.1 ** 2,
    I_sfera: () => 0.4 * 2 * 0.1 ** 2,
    I_asta: () => (2 * 0.5 ** 2) / 12,
  },
  'r2-mi-3': {
    I_estremo: () => (1.2 * 0.8 ** 2) / 3,
    I_cm: () => (1.2 * 0.8 ** 2) / 12,
    'I_0,1': () => (1.2 * 0.8 ** 2) / 12 + 1.2 * 0.1 ** 2,
  },
  'r2-mi-4': {},
  'r2-tma-1': {},
  'r2-tma-2': {
    a: () => (1 * 9.81) / (1 + 2 / 2),
    T: () => 0.5 * 2 * ((1 * 9.81) / (1 + 2 / 2)),
    α: () => (1 * 9.81) / (1 + 2 / 2) / 0.1,
  },
  'r2-tma-3': {
    ω_2: () => (4 * 2) / 1.6,
    'K_2/K_1': () => 4 / 1.6,
  },
  'r2-koe-1': {},
  'r2-koe-2': {
    K_tr: () => 0.5 * 3 * 2 ** 2,
    K_rot: () => 0.5 * (0.4 * 3 * 0.1 ** 2) * (2 / 0.1) ** 2,
    K: () => 0.5 * 3 * 2 ** 2 + 0.5 * (0.4 * 3 * 0.1 ** 2) * (2 / 0.1) ** 2,
  },
  'r2-koe-3': {
    K_cm: () => (0.5 * (2 * 4) ** 2) / (2 + 3),
    E_diss: () => 0.5 * ((2 * 3) / (2 + 3)) * 4 ** 2,
  },
  'r2-koe-4': {
    I_cm: () => 2 * 1 * 0.3 ** 2,
    K: () => 0.5 * 2 * 2 ** 2 + 0.5 * (2 * 1 * 0.3 ** 2) * 5 ** 2,
  },
  'r2-mcr-1': {},
  'r2-mcr-2': {
    ω: () => 3 * 4,
    θ: () => 0.5 * 3 * 4 ** 2,
    giri: () => (0.5 * 3 * 4 ** 2) / (2 * Math.PI),
  },
  'r2-mcr-3': {},
  'r2-mcr-4': {
    P: () => 5 * ((300 * 2 * Math.PI) / 60),
    W: () => 5 * 10 * 2 * Math.PI,
  },
  'r2-stat-1': {
    N_p: () => (20 * 9.81) / (2 * Math.tan(Math.PI / 3)),
    f: () => (20 * 9.81) / (2 * Math.tan(Math.PI / 3)),
    μ_min: () => 1 / (2 * Math.tan(Math.PI / 3)),
  },
  'r2-stat-2': {
    R_s: () => (30 * 9.81 * 2 + 50 * 9.81 * 3) / 4,
    R_d: () => (30 * 9.81 * 2 + 50 * 9.81 * 1) / 4,
  },
  'r2-stat-3': {},
  'r2-stat-4': {},
  'r2-ecr-1': {},
  'r2-ecr-2': {},
  'r2-ecr-3': {
    ω: () => Math.sqrt((3 * 9.81) / 1.2),
    v: () => Math.sqrt((3 * 9.81) / 1.2) * 1.2,
  },
  'r2-pf-1': {
    T: () => 2 * Math.PI * Math.sqrt(2 / (3 * 9.81)),
    l: () => 2 / 3,
  },
  'r2-pf-2': {},
  'r2-pf-3': {},
  'r2-rp-1': {
    a: () => (9.81 * 0.5) / 1.5,
    f: () => 0.5 * 2 * ((9.81 * 0.5) / 1.5),
    μ_min: () => Math.tan(Math.PI / 6) / 3,
  },
  'r2-rp-2': {
    v_cilindro: () => Math.sqrt((2 * 9.81 * 1.5) / 1.5),
    v_anello: () => Math.sqrt((2 * 9.81 * 1.5) / 2),
  },
  'r2-rp-3': {},
  'r2-uc-1': {
    "v_1'": () => ((1 - 2) / (1 + 2)) * 6,
    "v_2'": () => ((2 * 1) / (1 + 2)) * 6,
  },
  'r2-uc-2': {
    "v'": () => (3 * 4 + 1 * -2) / 4,
    '|ΔK|': () => 0.5 * 3 * 4 ** 2 + 0.5 * 1 * 2 ** 2 - 0.5 * 4 * 2.5 ** 2,
  },
  'r2-uc-3': {},
  'r2-uc-4': {
    "v_1'": () => ((1 - 0.5) / 2) * 4,
    "v_2'": () => ((1 + 0.5) / 2) * 4,
    'frazione persa': () => (8 - 0.5 * 1 ** 2 - 0.5 * 3 ** 2) / 8,
  },
  'r2-pb-1': {
    h: () => 1.5 * (1 - Math.cos((12 * Math.PI) / 180)),
    v_0: () => ((0.01 + 2) / 0.01) * Math.sqrt(2 * 9.81 * 1.5 * (1 - Math.cos((12 * Math.PI) / 180))),
  },
  'r2-pb-2': {},
  'r2-pb-3': {
    'frazione persa': () => 0.98 / (0.02 + 0.98),
    E_persa: () => 0.5 * 0.02 * 300 ** 2 * (0.98 / (0.02 + 0.98)),
  },
  'r2-stv-1': {},
  'r2-stv-2': {},
  'r2-stv-3': {
    h_Hg: () => 101325 / (13600 * 9.81),
    h_acqua: () => 101325 / (1000 * 9.81),
  },
  'r2-stv-4': {
    Δp: () => 1000 * 9.81 * 0.1,
    F_A: () => 1000 * 9.81 * 0.1 * 0.1 ** 2,
  },
  'r2-tcg-1': {},
  'r2-tcg-2': {
    '\\langle K\\rangle': () => 1.5 * 1.380649e-23 * 300,
    v_qm: () => Math.sqrt((3 * 8.314 * 300) / 0.028),
  },
  'r2-tcg-3': {
    p: () => (2 / 3) * 2.5e25 * 6e-21,
    T: () => (2 * 6e-21) / (3 * 1.380649e-23),
  },
  'r2-lgp-1': {
    V_2: () => 2 * (100 / 80) * (250 / 300),
  },
  'r2-lgp-2': {
    n: () => (2e5 * 0.01) / (8.314 * 300),
    N: () => (2e5 * 0.01) / (1.380649e-23 * 300),
  },
  'r2-lgp-3': {},
  'r2-eq-1': {
    U_mono: () => 1.5 * 2 * 8.314 * 300,
    U_bi: () => 2.5 * 2 * 8.314 * 300,
  },
  'r2-eq-2': {},
  'r2-eq-3': {
    c_V: () => 2.5 * 8.314,
    Q: () => 3 * 2.5 * 8.314 * 20,
  },
  'r2-eq-4': {},
  'r2-cmol-1': {},
  'r2-cmol-2': {
    '\\gamma_mono': () => 1 + 2 / 3,
    '\\gamma_bi': () => 1 + 2 / 5,
    c_p: () => 3.5 * 8.314,
  },
  'r2-cmol-3': {
    c: () => 3 * 8.314,
    c_Cu: () => (3 * 8.314) / 0.0635,
  },
  'r2-cmol-4': {},
  'r2-pp-1': {
    W: () => 8.314 * 300 * Math.log(3),
    Q: () => 8.314 * 300 * Math.log(3),
  },
  'r2-pp-2': {
    p_2: () => 100 * 2 ** 1.4,
    T_2: () => 300 * 2 ** 0.4,
  },
  'r2-pp-3': {
    W: () => 2 * 8.314 * 100,
    ΔU: () => 1.5 * 2 * 8.314 * 100,
    Q: () => 2.5 * 2 * 8.314 * 100,
  },
  'r2-pp-4': {},
  'r2-sp-1': {
    η: () => 300 / 1000,
    COP_f: () => 500 / 200,
    COP_pc: () => 700 / 200,
  },
  'r2-sp-2': {},
  'r2-sp-3': {},
  'r2-cc-1': {},
  'r2-cc-2': {
    η: () => 1 - 300 / 500,
    W: () => 2000 * (1 - 300 / 500),
    '|Q_F|': () => 2000 * (300 / 500),
  },
  'r2-cc-3': {
    COP_f: () => 260 / (300 - 260),
    COP_pc: () => 300 / (300 - 260),
  },
  'r2-tc-1': {},
  'r2-tc-2': {},
  'r2-tc-3': {
    T: () => (273.16 * 1000) / 600,
  },
  'r2-tc-4': {
    η: () => 350 / 1000,
    ΔS_univ: () => -1000 / 600 + 650 / 300,
  },
  'r2-dc-1': {},
  'r2-dc-2': {},
  'r2-dc-3': {
    Q_1: () => 1.5 * 8.314 * 300 + 8.314 * 600 * Math.log(2),
    Q_2: () => 8.314 * 300 * Math.log(2) + 1.5 * 8.314 * 300,
    ΔS: () => 2.5 * 8.314 * Math.log(2),
  },
  'r2-dc-4': {
    '\\oint \\delta Q/T': () => 1000 / 500 - 700 / 300,
    ΔS_univ: () => -(1000 / 500 - 700 / 300),
  },
  'r2-ent-1': {
    ΔS: () => 2 * 8.314 * Math.log(3),
  },
  'r2-ent-2': {
    T_f: () => (400 + 300) / 2,
    ΔS_univ: () => 400 * Math.log(350 / 400) + 400 * Math.log(350 / 300),
  },
  'r2-ent-3': {
    ΔS: () => 2.5 * 8.314 * Math.log(1.5) + 8.314 * Math.log(0.5),
  },
  'r2-ent-4': {},
};

const DIR = resolve(import.meta.dirname, '../../../src/content/exercises/fisica-1');
type Ex = { id: string; kind: string; answer?: { label: { it: string }; value: number; tol?: number }[] };
const all = readdirSync(DIR).flatMap((f) => parse(readFileSync(join(DIR, f), 'utf8')) as Ex[]);

/** Chiave in CALC: l'etichetta TeX in notazione da tastiera (`$v_{\\mathrm{cm}}$` → `v_cm`, `\\omega` → `ω`). */
const GRECHE: Record<string, string> = {
  omega: 'ω',
  theta: 'θ',
  alpha: 'α',
  mu: 'μ',
  Delta: 'Δ',
  eta: 'η',
  tau: 'τ',
  Omega: 'Ω',
};
const chiave = (label: string) =>
  label
    .replace(/\$/g, '')
    .replace(/\\mathrm\{([^}]*)\}/g, '$1')
    .replace(/\\([A-Za-z]+) ?/g, (m, g: string) => GRECHE[g] ?? m)
    .replace(/[{}]/g, '');

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
      const f = CALC[e.id]?.[chiave(a.label.it)];
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
