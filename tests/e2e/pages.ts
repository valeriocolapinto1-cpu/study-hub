/**
 * Campione di pagine per tipo, usato da a11y e test visivi.
 * Le PR successive aggiungono qui una pagina per ogni nuovo tipo (corso, teoria, esercizi…).
 */
export const BASE = '/study-hub/';

export interface SamplePage {
  name: string;
  path: string;
}

export const SAMPLE_PAGES: SamplePage[] = [
  { name: 'home-it', path: `${BASE}it/` },
  { name: 'home-en', path: `${BASE}en/` },
  { name: '404', path: `${BASE}pagina-inesistente/` },
  { name: 'stile-circuiti', path: `${BASE}it/stile/circuiti/` },
];
