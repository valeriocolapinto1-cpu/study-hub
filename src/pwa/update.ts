/**
 * Logica pura degli aggiornamenti del sito (testata in tests/unit/pwa/update.test.ts):
 * confronto tra la build della pagina e quella pubblicata (version.json), frequenza dei
 * controlli e pulizia di service worker e Cache Storage per "Aggiorna il sito".
 */

export interface BuildInfo {
  /** Commit abbreviato (7 caratteri) o "dev". */
  commit: string;
  /** Data ISO della build. */
  date: string;
}

/** Legge version.json; null se il contenuto non è valido. */
export function parseBuildInfo(input: unknown): BuildInfo | null {
  if (!input || typeof input !== 'object') return null;
  const { commit, date } = input as Record<string, unknown>;
  if (typeof commit !== 'string' || !commit || typeof date !== 'string') return null;
  if (Number.isNaN(Date.parse(date))) return null;
  return { commit, date };
}

/**
 * La build pubblicata è più recente di quella della pagina? Serve un commit diverso e una
 * data successiva: una copia vecchia di version.json (cache di una CDN) non conta.
 */
export function isNewerBuild(local: BuildInfo, remote: BuildInfo | null): boolean {
  if (!remote || local.commit === 'dev' || remote.commit === local.commit) return false;
  return Date.parse(remote.date) > Date.parse(local.date);
}

/** Intervallo minimo tra due controlli (al ritorno sulla pagina, periodici). */
export const CHECK_MIN_GAP_MS = 60_000;
/** Controllo periodico con la pagina aperta. */
export const CHECK_INTERVAL_MS = 30 * 60_000;

export const shouldCheck = (last: number, now: number, gap = CHECK_MIN_GAP_MS): boolean => now - last >= gap;

/** Testo breve della build per il footer: "abc1234 · 2026-11-09". */
export const formatBuild = (b: BuildInfo): string => `${b.commit} · ${b.date.slice(0, 10)}`;

export interface CacheEnv {
  serviceWorker?: { getRegistrations(): Promise<ReadonlyArray<{ unregister(): Promise<boolean> }>> };
  caches?: { keys(): Promise<string[]>; delete(name: string): Promise<boolean> };
}

/**
 * Deregistra i service worker e svuota Cache Storage. Non tocca localStorage né IndexedDB
 * (progressi, appunti, ripasso restano dove sono).
 */
export async function resetSiteCaches(env: CacheEnv): Promise<{ workers: number; caches: number }> {
  let workers = 0;
  let removed = 0;
  if (env.serviceWorker) {
    for (const reg of await env.serviceWorker.getRegistrations()) if (await reg.unregister()) workers++;
  }
  if (env.caches) {
    for (const name of await env.caches.keys()) if (await env.caches.delete(name)) removed++;
  }
  return { workers, caches: removed };
}
