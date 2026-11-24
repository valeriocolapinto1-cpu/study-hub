/**
 * Limiti del tutor: richieste per IP all'ora e tetto di spesa del giorno (UTC).
 *
 * Logica pura su un piccolo archivio chiave-valore (`LimitStore`): nel Worker è lo storage di un
 * Durable Object (un'istanza sola, quindi i contatori sono coerenti anche con richieste in
 * parallelo), nei test una Map. Gli IP non si salvano mai in chiaro: arriva solo un hash.
 *
 * Ogni richiesta **prenota** il suo costo massimo prima di chiamare l'API (`begin`) e a fine
 * risposta lo sostituisce con il costo stimato dall'uso reale (`end`): così più richieste
 * contemporanee non possono superare il tetto insieme.
 */

export interface LimitStore {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
}

export const HOUR_MS = 3_600_000;

export type BeginResult =
  | { ok: true; remaining: number }
  | { ok: false; reason: 'rate'; retryAfterSec: number }
  | { ok: false; reason: 'budget'; retryAfterSec: number };

interface DayState {
  spent: number;
  reserved: number;
}

const dayKey = (now: number) => `day:${new Date(now).toISOString().slice(0, 10)}`;

/** Secondi fino alla mezzanotte UTC (quando il tetto si azzera). */
export function secondsToNextDay(now: number): number {
  const d = new Date(now);
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - now) / 1000));
}

export async function begin(
  store: LimitStore,
  opts: { ipHash: string; now: number; perHour: number; budgetUsd: number; reserveUsd: number },
): Promise<BeginResult> {
  const { ipHash, now, perHour, budgetUsd, reserveUsd } = opts;
  const day = (await store.get<DayState>(dayKey(now))) ?? { spent: 0, reserved: 0 };
  if (day.spent + day.reserved + reserveUsd > budgetUsd)
    return { ok: false, reason: 'budget', retryAfterSec: secondsToNextDay(now) };

  const ips = (await store.get<Record<string, number[]>>('ips')) ?? {};
  // Sfoltisce: tiene solo le richieste dell'ultima ora (e solo gli IP che ne hanno).
  for (const [k, list] of Object.entries(ips)) {
    const fresh = list.filter((t) => now - t < HOUR_MS);
    if (fresh.length) ips[k] = fresh;
    else delete ips[k];
  }
  const mine = ips[ipHash] ?? [];
  if (mine.length >= perHour) {
    const oldest = Math.min(...mine);
    return {
      ok: false,
      reason: 'rate',
      retryAfterSec: Math.max(1, Math.ceil((oldest + HOUR_MS - now) / 1000)),
    };
  }
  ips[ipHash] = [...mine, now];
  await store.put('ips', ips);
  await store.put(dayKey(now), { spent: day.spent, reserved: day.reserved + reserveUsd });
  return { ok: true, remaining: perHour - mine.length - 1 };
}

/** Chiude una prenotazione: toglie il costo massimo prenotato e somma quello effettivo. */
export async function end(
  store: LimitStore,
  opts: { now: number; reservedUsd: number; actualUsd: number; startedAt: number },
): Promise<void> {
  const key = dayKey(opts.startedAt);
  const day = (await store.get<DayState>(key)) ?? { spent: 0, reserved: 0 };
  const reserved = Math.max(0, day.reserved - opts.reservedUsd);
  // Una risposta iniziata ieri e finita oggi si conta nel giorno in cui era stata prenotata.
  await store.put(key, { spent: day.spent + Math.max(0, opts.actualUsd), reserved });
}

/** Spesa stimata del giorno (per i log e i test). */
export async function spentToday(store: LimitStore, now: number): Promise<number> {
  return (await store.get<DayState>(dayKey(now)))?.spent ?? 0;
}
