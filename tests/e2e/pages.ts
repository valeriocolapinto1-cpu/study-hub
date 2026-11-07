/**
 * Campione di pagine per tipo, usato da a11y e test visivi.
 * Le PR successive aggiungono qui una pagina per ogni nuovo tipo (corso, teoria, esercizi…).
 */
export const BASE = '/study-hub/';

export interface SamplePage {
  name: string;
  path: string;
  /**
   * false per le pagine troppo lunghe per uno screenshot a pagina intera entro il timeout
   * (es. un formulario completo): restano nei test a11y e smoke.
   */
  visual?: boolean;
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
  { name: 'stile-figure', path: `${BASE}it/stile/figure/` },
  // stessa pagina in inglese: solo axe e smoke (le figure sono le stesse, cambiano i testi)
  { name: 'stile-figure-en', path: `${BASE}en/stile/figure/`, visual: false },
  { name: 'contribuisci-en', path: `${BASE}en/contribuisci/` },
  { name: 'ringraziamenti-en', path: `${BASE}en/ringraziamenti/` },
  { name: 'offline-it', path: `${BASE}it/offline/` },
  { name: 'fi-panoramica-it', path: `${BASE}it/anno-1/fondamenti-informatica/` },
  { name: 'fi-teoria-en', path: `${BASE}en/anno-1/fondamenti-informatica/teoria/gerarchia-di-memoria/` },
  { name: 'fi-esercizi-it', path: `${BASE}it/anno-1/fondamenti-informatica/esercizi/mappe-di-karnaugh/` },
  { name: 'fi-formulario-it', path: `${BASE}it/anno-1/fondamenti-informatica/formulario/` },
  { name: 'fi-convertitori-en', path: `${BASE}en/anno-1/fondamenti-informatica/extra/convertitori/` },
  { name: 'tdc-panoramica-it', path: `${BASE}it/anno-2/teoria-circuiti/` },
  { name: 'tdc-teoria-en', path: `${BASE}en/anno-2/teoria-circuiti/teoria/teorema-di-thevenin/` },
  { name: 'tdc-formulario-it', path: `${BASE}it/anno-2/teoria-circuiti/formulario/`, visual: false },
  { name: 'tdc-esercizi-it', path: `${BASE}it/anno-2/teoria-circuiti/esercizi/circuiti-primo-ordine/` },
  { name: 'tdc-extra-it', path: `${BASE}it/anno-2/teoria-circuiti/extra/esame-info/` },
  { name: 'fisica-2-panoramica-it', path: `${BASE}it/anno-2/fisica-2/` },
  { name: 'fisica-2-teoria-it', path: `${BASE}it/anno-2/fisica-2/teoria/fisica-moderna/` },
  { name: 'fisica-2-teoria-en', path: `${BASE}en/anno-2/fisica-2/teoria/magnetismo-nella-materia/` },
  { name: 'fisica-2-formulario-it', path: `${BASE}it/anno-2/fisica-2/formulario/`, visual: false },
  { name: 'fisica-2-esercizi-en', path: `${BASE}en/anno-2/fisica-2/esercizi/onde-elettromagnetiche/` },
  { name: 'fisica-2-laboratorio-en', path: `${BASE}en/anno-2/fisica-2/extra/laboratorio/` },
  { name: 'fisica-2-appelli-it', path: `${BASE}it/anno-2/fisica-2/extra/appelli/` },
  { name: 'f1-panoramica-it', path: `${BASE}it/anno-1/fisica-1/` },
  { name: 'f1-teoria-en', path: `${BASE}en/anno-1/fisica-1/teoria/ciclo-di-carnot/` },
  { name: 'f1-esercizi-it', path: `${BASE}it/anno-1/fisica-1/esercizi/urti-centrali/` },
  { name: 'f1-formulario-en', path: `${BASE}en/anno-1/fisica-1/formulario/` },
  { name: 'f1-orale-it', path: `${BASE}it/anno-1/fisica-1/extra/simulazione-orale/` },
];
