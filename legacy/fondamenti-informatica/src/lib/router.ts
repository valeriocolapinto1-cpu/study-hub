import { useEffect, useState } from 'preact/hooks';

/**
 * Router a hash, ~40 righe, nessuna dipendenza.
 *
 * Perché hash e non History API: il sito è servito da GitHub Pages sotto un
 * sotto-path, e un router basato su History richiederebbe il trucco del
 * `404.html` per sopravvivere ai reload sulle route profonde. Con l'hash il
 * server vede sempre `index.html` e il problema non esiste.
 */
export const VIEWS = [
  'dash',
  'study',
  'def',
  'exam',
  'train',
  'ref',
  'carriera',
  'note',
] as const;
export type ViewId = (typeof VIEWS)[number];

/**
 * Le viste che compaiono nella barra in alto.
 *
 * «Note» ne sta fuori: sette voci sono già il massimo che una barra regge su
 * un telefono, e avvertenza, privacy e licenza si cercano in fondo alla
 * pagina — che è dove infatti stanno, nella mappa del piè di pagina.
 */
export const NAV_VIEWS = VIEWS.filter((view) => view !== 'note');

export const DEFAULT_VIEW: ViewId = 'dash';

export type Route = {
  /** Vista attiva. */
  view: ViewId;
  /** Segmento opzionale, es. l'id del modulo in `#/study/mem`. */
  param: string | null;
  /**
   * `false` quando l'hash non corrisponde a nessuna vista.
   *
   * Prima un indirizzo storpiato ricadeva **in silenzio** sulla dashboard:
   * chi arrivava da un link vecchio o sbagliato vedeva la home e concludeva
   * che la pagina non era mai esistita. Adesso `view` resta la dashboard —
   * qualcosa va pur reso — ma il chiamante sa che la rotta non c'era e può
   * dirlo.
   */
  known: boolean;
};

function isViewId(value: string): value is ViewId {
  return (VIEWS as readonly string[]).includes(value);
}

export function parseHash(hash: string): Route {
  // "#/study/mem" → ["study", "mem"]
  const segments = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const head = segments[0];
  // Nessun hash è la home, non un indirizzo sbagliato.
  if (head === undefined) return { view: DEFAULT_VIEW, param: null, known: true };
  if (!isViewId(head)) return { view: DEFAULT_VIEW, param: null, known: false };
  return { view: head, param: segments[1] ?? null, known: true };
}

export function hrefFor(view: ViewId, param?: string): string {
  return param ? `#/${view}/${param}` : `#/${view}`;
}

/** Naviga, lasciando che sia l'evento `hashchange` ad aggiornare lo stato. */
export function navigate(view: ViewId, param?: string): void {
  const next = hrefFor(view, param);
  if (window.location.hash === next) return;
  window.location.hash = next;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = (): void => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}
