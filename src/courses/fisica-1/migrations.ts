/**
 * Migrazione dei dati del sito originale «Orale Trainer» (chiave `fisica1-orale-v1`,
 * stessa origine github.io) verso le aree del sito nuovo. La chiave legacy non viene
 * mai modificata né cancellata (vedi src/engine/migrate.ts).
 *
 * Formato legacy:
 *   { argomenti: { <1..33>: { stato 0-3, ef, intervallo, prossimoRipasso, ultimaRevisione? } },
 *     simulazioni: { 'AAAA-MM-GG': numero }, dataEsame?: 'AAAA-MM-GG',
 *     modalitaSim?: 'facile' | 'difficile', quizPref?, teoriaPref?, quizStat?, teoriaStat? }
 *
 * - argomenti con stato > 0 → `progress.read` (argomento studiato) e una voce dello storico
 *   dell'orale con il voto dell'autovalutazione (stato 1 debole, 2 consolidato, 3 padroneggiato),
 *   così l'estrazione pesata riparte dagli argomenti deboli;
 * - modalitaSim → modalità della simulazione dell'orale;
 * - dataEsame → data d'esame del corso (globale `examDates`).
 * Le preferenze dei quiz e il conteggio giornaliero delle simulazioni non hanno corrispondente
 * (il ripasso e la prova sono del motore comune) e non si trasferiscono.
 */
import { jsonTransform, registerMigration } from '../../engine/migrate';
import { GLOBAL_SCOPE } from '../../engine/storage';
import type { ProgressState } from '../../engine/progress';
import type { OralRecord, OralState } from './sims/OraleTrainer';

export const COURSE_ID = 'fisica-1';
export const LEGACY_KEY = 'fisica1-orale-v1';

/** Id numerici dell'originale (1…33) → id degli argomenti (stessa tabella di tools/legacy-topics). */
export const LEGACY_TOPICS = [
  'moto-circolare-vario',
  'moto-armonico',
  'oscillatore-massa-molla',
  'pendolo-semplice',
  'sistemi-di-riferimento',
  'oscillatore-smorzato',
  'risonanza',
  'lavoro-energia-cinetica',
  'forze-conservative',
  'forze-non-conservative',
  'momento-angolare',
  'centro-di-massa',
  'momenti-di-inerzia',
  'teorema-momento-angolare',
  'teorema-di-koenig',
  'moto-corpo-rigido',
  'statica-corpo-rigido',
  'energia-corpo-rigido',
  'pendolo-fisico',
  'rotolamento-puro',
  'urti-centrali',
  'pendolo-balistico',
  'legge-di-stevino',
  'teoria-cinetica-gas',
  'legge-gas-perfetti',
  'equipartizione-energia',
  'calori-molari',
  'primo-principio',
  'secondo-principio',
  'ciclo-di-carnot',
  'teorema-di-carnot',
  'disuguaglianza-di-clausius',
  'entropia-adiabatiche',
] as const;

interface LegacyTopic {
  stato?: number;
  ultimaRevisione?: string;
}
interface Legacy {
  argomenti?: Record<string, LegacyTopic>;
  dataEsame?: string | null;
  modalitaSim?: string;
}

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Argomenti dell'originale con stato valido (1–3) e istante dell'ultima revisione. */
function studied(v: Legacy, now: number): { id: string; stato: number; at: number }[] {
  if (!isObj(v.argomenti)) return [];
  const out: { id: string; stato: number; at: number }[] = [];
  for (const [key, rec] of Object.entries(v.argomenti)) {
    const id = LEGACY_TOPICS[Number(key) - 1];
    if (!id || !isObj(rec)) continue;
    const stato = typeof rec.stato === 'number' ? Math.round(rec.stato) : 0;
    if (stato < 1 || stato > 3) continue;
    const day =
      typeof rec.ultimaRevisione === 'string' && ISO_DAY.test(rec.ultimaRevisione)
        ? rec.ultimaRevisione
        : null;
    const at = day ? new Date(`${day}T12:00:00`).getTime() : now;
    out.push({ id, stato, at: Number.isFinite(at) ? at : now });
  }
  return out;
}

export function migrateProgress(value: unknown, now = Date.now()): ProgressState | undefined {
  if (!isObj(value)) return undefined;
  const list = studied(value as Legacy, now);
  if (list.length === 0) return undefined;
  return { v: 1, exercises: {}, read: Object.fromEntries(list.map((t) => [t.id, t.at])) };
}

export function migrateOral(value: unknown, now = Date.now()): OralState | undefined {
  if (!isObj(value)) return undefined;
  const v = value as Legacy;
  const list = studied(v, now);
  const mode = v.modalitaSim === 'facile' || v.modalitaSim === 'difficile' ? v.modalitaSim : undefined;
  if (list.length === 0 && !mode) return undefined;
  const history: OralRecord[] = list
    .sort((a, b) => a.at - b.at)
    .map((t) => ({ topic: t.id, at: t.at, seconds: 0, score: t.stato, mode: mode ?? 'difficile' }));
  return { v: 1, mode: mode ?? 'difficile', history };
}

export function migrateExamDate(value: unknown): Record<string, string> | undefined {
  if (!isObj(value)) return undefined;
  const d = (value as Legacy).dataEsame;
  return typeof d === 'string' && ISO_DAY.test(d) ? { [COURSE_ID]: d } : undefined;
}

export const MIGRATIONS_F1 = [
  registerMigration({
    id: 'fisica-1/progress',
    legacyKey: LEGACY_KEY,
    scope: COURSE_ID,
    area: 'progress',
    transform: jsonTransform((v) => migrateProgress(v)),
  }),
  registerMigration({
    id: 'fisica-1/orale',
    legacyKey: LEGACY_KEY,
    scope: COURSE_ID,
    area: 'orale',
    transform: jsonTransform((v) => migrateOral(v)),
  }),
  registerMigration({
    id: 'fisica-1/exam-date',
    legacyKey: LEGACY_KEY,
    scope: GLOBAL_SCOPE,
    area: 'examDates',
    transform: jsonTransform(migrateExamDate),
    // Le date degli altri corsi restano; quella già scelta nel sito nuovo prevale.
    merge: (existing, migrated) => ({ ...(migrated as object), ...(isObj(existing) ? existing : {}) }),
  }),
];
