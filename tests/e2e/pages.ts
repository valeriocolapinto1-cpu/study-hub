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
  { name: 'stile', path: `${BASE}it/stile/` },
  { name: 'chi-sono-it', path: `${BASE}it/chi-sono/` },
  { name: 'chi-sono-en', path: `${BASE}en/chi-sono/` },
  { name: 'privacy-it', path: `${BASE}it/privacy/` },
  { name: 'note-legali-en', path: `${BASE}en/note-legali/` },
  { name: 'ringraziamenti-it', path: `${BASE}it/ringraziamenti/` },
  { name: 'contribuisci-it', path: `${BASE}it/contribuisci/` },
  { name: 'stile-circuiti', path: `${BASE}it/stile/circuiti/` },
  { name: 'contribuisci-en', path: `${BASE}en/contribuisci/` },
  { name: 'ringraziamenti-en', path: `${BASE}en/ringraziamenti/` },
  { name: 'offline-it', path: `${BASE}it/offline/` },
  { name: 'fisica-2-panoramica-it', path: `${BASE}it/anno-2/fisica-2/` },
  { name: 'fisica-2-teoria-it', path: `${BASE}it/anno-2/fisica-2/teoria/dielettrici/` },
  { name: 'fisica-2-teoria-en', path: `${BASE}en/anno-2/fisica-2/teoria/corrente-stazionaria/` },
  { name: 'fisica-2-formulario-it', path: `${BASE}it/anno-2/fisica-2/formulario/` },
  { name: 'fisica-2-esercizi-en', path: `${BASE}en/anno-2/fisica-2/esercizi/onde-elettromagnetiche/` },
  { name: 'fisica-2-laboratorio-en', path: `${BASE}en/anno-2/fisica-2/extra/laboratorio/` },
  { name: 'fisica-2-appelli-it', path: `${BASE}it/anno-2/fisica-2/extra/appelli/` },
];
