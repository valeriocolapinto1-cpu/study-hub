/**
 * Promemoria di backup: i dati vivono solo in questo browser, quindi ogni
 * tanto conviene esportarli. Stato in `sh:v1:global:backup` (resta sul
 * dispositivo, non entra nell'export):
 * - `lastExport`: ultimo export in un file o come QR (lo scrive `markExported` in storage.ts);
 * - `snoozeUntil`: prima di questo istante il promemoria tace.
 * Al primo controllo con dati e senza alcun export il promemoria parte fra
 * 30 giorni: chi ha appena iniziato non va disturbato.
 */
import { BACKUP_AREA, GLOBAL_SCOPE, listKeys, parseKey, read, write } from './storage';

export { BACKUP_AREA };
export const BACKUP_INTERVAL_MS = 30 * 86_400_000;
/** Aree che contengono lavoro dell'utente (le impostazioni da sole non contano). */
const USER_AREAS = ['progress', 'srs', 'exam', 'notes'];

export interface BackupState {
  lastExport?: number;
  snoozeUntil?: number;
}

const num = (x: unknown): number | undefined => (typeof x === 'number' && Number.isFinite(x) ? x : undefined);

export function loadBackupState(): BackupState {
  const raw = read<unknown>(GLOBAL_SCOPE, BACKUP_AREA, null);
  const s = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const lastExport = num(s.lastExport);
  const snoozeUntil = num(s.snoozeUntil);
  return {
    ...(lastExport !== undefined ? { lastExport } : {}),
    ...(snoozeUntil !== undefined ? { snoozeUntil } : {}),
  };
}

export const hasUserData = (): boolean =>
  listKeys().some((k) => USER_AREAS.includes(parseKey(k)?.area ?? ''));

/** Rimanda il promemoria (chiusura dell'avviso). */
export function snoozeBackup(now = Date.now(), ms = 7 * 86_400_000): void {
  write(GLOBAL_SCOPE, BACKUP_AREA, { ...loadBackupState(), snoozeUntil: now + ms });
}

/** Il promemoria va mostrato adesso? Al primo controllo con dati fissa la prima scadenza. */
export function backupDue(now = Date.now()): boolean {
  if (!hasUserData()) return false;
  const s = loadBackupState();
  if (s.lastExport === undefined && s.snoozeUntil === undefined) {
    write(GLOBAL_SCOPE, BACKUP_AREA, { snoozeUntil: now + BACKUP_INTERVAL_MS });
    return false;
  }
  return now >= Math.max((s.lastExport ?? 0) + BACKUP_INTERVAL_MS, s.snoozeUntil ?? 0);
}
