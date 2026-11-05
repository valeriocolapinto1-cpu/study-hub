/**
 * Migrazione una tantum dalle chiavi localStorage dei siti originali (stessa
 * origine github.io) alle chiavi `sh:v1:`. Le chiavi legacy non vengono MAI
 * cancellate: le migrazioni eseguite sono annotate in `sh:v1:global:migrations`.
 * Idempotente: una migrazione già annotata non viene rieseguita e non
 * sovrascrive mai un valore nuovo già presente (salvo `merge`).
 *
 * Ogni PR di corso aggiunge le proprie voci a MIGRATIONS.
 */
import { GLOBAL_SCOPE, read, readRaw, storageKey, write, writeRaw } from './storage';

export interface Migration {
  /** Id stabile e univoco, es. "fisica-2/progress". */
  id: string;
  /** Chiave legacy letta (mai modificata). */
  legacyKey: string;
  scope: string;
  area: string;
  /** Converte il valore legacy grezzo; `undefined` = niente da migrare. */
  transform: (raw: string) => unknown;
  /** Se presente, fonde il valore migrato con quello già esistente. */
  merge?: (existing: unknown, migrated: unknown) => unknown;
}

const parseJson = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export const MIGRATIONS: Migration[] = [
  {
    // Sito hub: lingua scelta salvata come stringa semplice.
    id: 'hub/lang',
    legacyKey: 'lang',
    scope: GLOBAL_SCOPE,
    area: 'lang',
    transform: (raw) => {
      const v = (parseJson(raw) ?? raw) as unknown;
      return v === 'it' || v === 'en' ? v : undefined;
    },
  },
];

export const MIGRATIONS_AREA = 'migrations';

/**
 * Registra una migrazione da un modulo del corso (`src/courses/<id>/migrations.ts`)
 * senza modificare questo file. Id duplicati con definizione diversa sono un errore.
 */
export function registerMigration(m: Migration): Migration {
  const existing = MIGRATIONS.find((x) => x.id === m.id);
  if (existing && existing !== m) throw new Error(`migrazione già registrata: "${m.id}"`);
  if (!existing) MIGRATIONS.push(m);
  return m;
}

/** Trasformazione JSON comune: `parse` riceve il valore legacy già decodificato. */
export function jsonTransform(parse: (value: unknown) => unknown): (raw: string) => unknown {
  return (raw) => {
    const v = parseJson(raw);
    return v === undefined ? undefined : parse(v);
  };
}

export interface MigrationReport {
  applied: string[];
  skipped: string[];
  failed: string[];
}

export function runMigrations(migrations: readonly Migration[] = MIGRATIONS): MigrationReport {
  const report: MigrationReport = { applied: [], skipped: [], failed: [] };
  const done = new Set(read<string[]>(GLOBAL_SCOPE, MIGRATIONS_AREA, []));
  let changed = false;
  for (const m of migrations) {
    if (done.has(m.id)) {
      report.skipped.push(m.id);
      continue;
    }
    try {
      const raw = readRaw(m.legacyKey);
      if (raw === null) {
        report.skipped.push(m.id);
        continue; // riprova in futuro: la chiave potrebbe comparire (altra scheda del vecchio sito)
      }
      const migrated = m.transform(raw);
      if (migrated !== undefined) {
        const target = storageKey(m.scope, m.area);
        const existingRaw = readRaw(target);
        if (existingRaw === null) {
          write(m.scope, m.area, migrated);
        } else if (m.merge) {
          writeRaw(target, JSON.stringify(m.merge(parseJson(existingRaw), migrated)));
        }
      }
      done.add(m.id);
      changed = true;
      report.applied.push(m.id);
    } catch {
      report.failed.push(m.id);
    }
  }
  if (changed) write(GLOBAL_SCOPE, MIGRATIONS_AREA, [...done].sort());
  return report;
}
