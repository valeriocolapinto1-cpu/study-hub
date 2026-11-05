/** Hook condivisi dalle isole: stato salvato reattivo, orologio, dati remoti. */
import { useCallback, useEffect, useState } from 'preact/hooks';
import { subscribe } from '../../engine/storage';

/**
 * Legge un valore con `load()` e lo ricarica quando (scope, area) cambia,
 * anche da un'altra scheda o da un'importazione.
 * Al primo render (anche lato server) restituisce `initial`, così l'HTML
 * statico non dipende da localStorage e l'idratazione è coerente.
 */
export function useStored<T>(scope: string, area: string, load: () => T, initial: T): [T, () => void] {
  const [value, setValue] = useState<T>(initial);
  const refresh = useCallback(() => setValue(load()), [scope, area]);
  useEffect(() => {
    refresh();
    return subscribe(scope, area, refresh);
  }, [refresh, scope, area]);
  return [value, refresh];
}

/** Istante corrente aggiornato ogni `ms` (0 = mai). Lato server vale 0. */
export function useNow(ms = 0): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    if (!ms) return;
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

const cache = new Map<string, Promise<unknown>>();

/** JSON da un URL del sito, con cache in memoria per pagina. */
export function fetchJson<T>(url: string): Promise<T> {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p as Promise<T>;
}

export type Remote<T> =
  { state: 'loading' } | { state: 'error'; retry: () => void } | { state: 'ready'; data: T };

export function useRemote<T>(urls: readonly string[]): Remote<T[]> {
  const [res, setRes] = useState<Remote<T[]>>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const key = urls.join('|');
  useEffect(() => {
    let alive = true;
    setRes({ state: 'loading' });
    Promise.all(urls.map((u) => fetchJson<T>(u)))
      .then((data) => alive && setRes({ state: 'ready', data }))
      .catch(() => alive && setRes({ state: 'error', retry: () => setAttempt((a) => a + 1) }));
    return () => {
      alive = false;
    };
  }, [key, attempt]);
  return res;
}
