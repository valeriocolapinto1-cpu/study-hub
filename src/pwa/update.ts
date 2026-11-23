/**
 * Logica pura degli aggiornamenti del sito (testata in tests/unit/pwa/update.test.ts):
 * confronto tra la build della pagina e quella pubblicata (version.json), frequenza dei
 * controlli e ricaricamento automatico dopo una pubblicazione. La pulizia delle cache
 * ("Aggiorna il sito", «Ricarica») è in reset.ts, caricato solo quando serve.
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

/**
 * Errore di caricamento del codice (import dinamico fallito, file sparito dopo una
 * pubblicazione). Messaggi di Chrome, Safari e Firefox, più quello dei chunk CSS di Vite.
 */
export const isChunkLoadError = (error: unknown): boolean =>
  /imported module|module script failed|preload CSS/i.test(String((error as Error)?.message ?? error));

/** Chiave in sessionStorage: commit per cui la pagina si è già ricaricata da sola. */
export const RELOAD_GUARD_KEY = 'sh:auto-reload';

/**
 * Ricaricare da sola la pagina? Solo se la build pubblicata è più recente di quella della
 * pagina e non ci si è già ricaricati per quella build (protezione contro i cicli).
 */
export const shouldAutoReload = (local: BuildInfo, remote: BuildInfo | null, guard: string | null): boolean =>
  isNewerBuild(local, remote) && guard !== remote?.commit;
