import { describe, expect, it } from 'vitest';
import { hrefFor, NAV_VIEWS, parseHash, VIEWS } from './router';

describe('router a hash', () => {
  it('nessun hash è la home, non un indirizzo sbagliato', () => {
    for (const hash of ['', '#', '#/']) {
      expect(parseHash(hash)).toEqual({ view: 'dash', param: null, known: true });
    }
  });

  it('riconosce tutte le viste dichiarate', () => {
    for (const view of VIEWS) {
      expect(parseHash(hrefFor(view))).toEqual({ view, param: null, known: true });
    }
  });

  it('legge il segmento in coda', () => {
    expect(parseHash('#/study/mem')).toEqual({ view: 'study', param: 'mem', known: true });
    expect(parseHash('#/exam/full')).toEqual({ view: 'exam', param: 'full', known: true });
  });

  it('un indirizzo inventato è segnato come sconosciuto', () => {
    // Il punto della regressione: prima ricadeva sulla dashboard senza che
    // nessuno potesse accorgersene, e il 404 non era rappresentabile.
    const route = parseHash('#/pippo');
    expect(route.known, 'la rotta non esiste e va detto').toBe(false);
    expect(route.view, 'qualcosa va pur reso').toBe('dash');
  });

  it('«note» esiste ma sta fuori dalla barra in alto', () => {
    expect(VIEWS).toContain('note');
    expect(NAV_VIEWS).not.toContain('note');
    // La barra resta a sette voci: è il massimo che regge su un telefono.
    expect(NAV_VIEWS).toHaveLength(VIEWS.length - 1);
  });

  it('i segmenti vuoti non spostano la vista', () => {
    expect(parseHash('#//study//mem')).toEqual({ view: 'study', param: 'mem', known: true });
  });
});
