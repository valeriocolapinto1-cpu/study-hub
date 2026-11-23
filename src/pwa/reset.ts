/**
 * Pulizia di service worker e Cache Storage per "Aggiorna il sito" (RefreshSite) e per
 * «Ricarica» nel riquadro d'errore delle isole (src/scripts/pwa.ts). Modulo a parte,
 * caricato solo quando serve: non pesa sul JS iniziale delle pagine.
 */

export interface CacheEnv {
  serviceWorker?: { getRegistrations(): Promise<ReadonlyArray<{ unregister(): Promise<boolean> }>> };
  caches?: { keys(): Promise<string[]>; delete(name: string): Promise<boolean> };
}

/**
 * Deregistra i service worker e svuota Cache Storage. Non tocca localStorage né IndexedDB
 * (progressi, appunti, ripasso restano dove sono). `keep` conserva alcune cache: «Ricarica»
 * nel riquadro d'errore tiene i corsi scaricati (senza `sh-meta` il nuovo worker li riscarica
 * in sottofondo, ma restano consultabili offline nel frattempo).
 */
export async function resetSiteCaches(
  env: CacheEnv,
  keep: (name: string) => boolean = () => false,
): Promise<{ workers: number; caches: number }> {
  let workers = 0;
  let removed = 0;
  if (env.serviceWorker) {
    for (const reg of await env.serviceWorker.getRegistrations()) if (await reg.unregister()) workers++;
  }
  if (env.caches) {
    for (const name of await env.caches.keys()) if (!keep(name) && (await env.caches.delete(name))) removed++;
  }
  return { workers, caches: removed };
}

/** Cache dei corsi scaricati per l'offline (vedi src/pwa/sw-core.js). */
export const isCourseCache = (name: string): boolean => name.startsWith('sh-course:');
