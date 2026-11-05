/**
 * Configurazione globale del sito. Unico punto in cui compaiono URL esterni
 * del progetto (repository, contatti, endpoint del modulo Contribuisci).
 * Dominio e percorso base stanno solo in astro.config.mjs: qui si leggono
 * tramite import.meta.env, mai scritti a mano.
 */

export const LANGS = ['it', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'it';

/** Percorso base con barra finale, es. "/study-hub/". */
export const BASE_URL: string = (() => {
  const raw = import.meta.env.BASE_URL ?? '/';
  return raw.endsWith('/') ? raw : `${raw}/`;
})();

export const SITE = {
  author: 'Valerio Colapinto',
  title: {
    it: 'Siti di studio — Ingegneria Elettronica',
    en: 'Study sites — Electronic Engineering',
  },
  shortTitle: { it: 'Siti di studio', en: 'Study sites' },
  description: {
    it: 'Teoria, esercizi, ripasso e simulazioni d’esame per gli studenti del corso di laurea in Ingegneria Elettronica. Progetto personale e non ufficiale.',
    en: 'Theory, exercises, review and exam simulations for students of the Electronic Engineering degree programme. A personal, unofficial project.',
  },
  repo: {
    owner: 'valeriocolapinto1-cpu',
    name: 'study-hub',
    url: 'https://github.com/valeriocolapinto1-cpu/study-hub',
    issues: 'https://github.com/valeriocolapinto1-cpu/study-hub/issues',
  },
  contacts: {
    email: 'valeriocolapinto1@gmail.com',
    linkedin: 'https://www.linkedin.com/in/valerio-colapinto',
    github: 'https://github.com/valeriocolapinto1-cpu',
  },
  /**
   * Modulo "Contribuisci": endpoint del Google Apps Script e sitekey di
   * Cloudflare Turnstile. Vuoti finché lo script non è pubblicato: il modulo
   * mostra allora il ripiego via email.
   */
  contribute: {
    endpoint: '',
    turnstileSiteKey: '',
  },
  themeColor: { light: '#f7f5f0', dark: '#16171a' },
} as const;

/** Repository GitHub originali dei corsi (per crediti e storia). */
export const LEGACY_REPOS = {
  'teoria-circuiti': 'https://github.com/valeriocolapinto1-cpu/teoria-dei-circuiti-ingegneria-elettronica',
  'fondamenti-informatica': 'https://github.com/valeriocolapinto1-cpu/fondamenti-di-informatica-AEFIN',
  'fisica-2': 'https://github.com/valeriocolapinto1-cpu/fisica-2-ingegneria-elettronica',
  'fisica-1': 'https://github.com/valeriocolapinto1-cpu/orale-fisica-1-ingegneria-elettronica',
} as const;

export const isContributeConfigured = (): boolean => SITE.contribute.endpoint.length > 0;
