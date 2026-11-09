/**
 * Identità della build (commit + data), calcolata una volta per processo: la stessa
 * nelle pagine (footer, controllo aggiornamenti in src/scripts/pwa.ts) e in dist/version.json.
 * In CI il commit viene da GITHUB_SHA; in locale da git; senza git vale "dev".
 * SH_BUILD_DATE (ISO) fissa la data, utile per build riproducibili.
 */
import { execSync } from 'node:child_process';

/** @type {{ commit: string, date: string } | null} */
let cached = null;

export function buildInfo() {
  if (cached) return cached;
  let commit = process.env.GITHUB_SHA ?? '';
  if (!commit) {
    try {
      commit = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      commit = 'dev';
    }
  }
  const date = new Date(process.env.SH_BUILD_DATE ?? Date.now()).toISOString();
  // astro.config.mjs può essere caricato in un'altra istanza del modulo: la data resta la stessa.
  process.env.SH_BUILD_DATE = date;
  cached = { commit: commit.slice(0, 7), date };
  return cached;
}
