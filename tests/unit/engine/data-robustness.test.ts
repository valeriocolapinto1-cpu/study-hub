/**
 * Robustezza dei dati dell'utente: scritture che falliscono (quota piena, storage
 * assente), valori corrotti in ogni area, memoria persistente, promemoria di backup.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as S from '../../../src/engine/storage';
import { loadProgress, loadSrs, saveAttempt } from '../../../src/engine/progress';
import { loadExamState, sanitizeExamState } from '../../../src/engine/exam';
import { allNotes, loadNotes } from '../../../src/engine/notes';
import { backupDue, BACKUP_INTERVAL_MS, loadBackupState, snoozeBackup } from '../../../src/engine/backup';
import { buildExport } from '../../../src/engine/exportImport';

class QuotaExceededError extends Error {
  override name = 'QuotaExceededError';
}

/** Backend che legge normalmente ma lancia a ogni scrittura (come Safari/Chrome a quota piena). */
function fullBackend(initial: Record<string, string> = {}): S.StorageBackend {
  const mem = S.createMemoryBackend(initial);
  return {
    ...mem,
    getItem: mem.getItem,
    key: mem.key,
    removeItem: mem.removeItem,
    get length() {
      return mem.length;
    },
    setItem() {
      throw new QuotaExceededError('The quota has been exceeded.');
    },
  };
}

/** In Node non c'è `window`: gli eventi del modulo passano da un EventTarget di prova. */
function captureErrors() {
  const target = new EventTarget();
  vi.stubGlobal('dispatchEvent', target.dispatchEvent.bind(target));
  const events: Array<{ key: string; quota: boolean }> = [];
  target.addEventListener(S.STORAGE_ERROR_EVENT, (e) => events.push((e as CustomEvent).detail));
  return { events, stop: () => vi.unstubAllGlobals() };
}

afterEach(() => {
  S.setStorageBackend(undefined);
  vi.unstubAllGlobals();
});

describe('scritture che falliscono', () => {
  it('QuotaExceededError: write restituisce false ed emette sh:storage-error con quota', () => {
    S.setStorageBackend(fullBackend());
    const cap = captureErrors();
    expect(S.write('fisica-1', 'progress', { v: 1 })).toBe(false);
    expect(cap.events).toEqual([{ key: 'sh:v1:fisica-1:progress', quota: true }]);
    // Anche i salvataggi del motore passano dallo stesso percorso.
    saveAttempt('fisica-1', 'es-1', { at: 1, score: 1 });
    expect(cap.events).toHaveLength(2);
    cap.stop();
  });

  it('storage assente (bloccato): evento senza quota, nessuna eccezione', () => {
    S.setStorageBackend(null);
    const cap = captureErrors();
    expect(S.writeRaw('sh:v1:global:theme', '"dark"')).toBe(false);
    expect(cap.events).toEqual([{ key: 'sh:v1:global:theme', quota: false }]);
    cap.stop();
  });

  it('NS_ERROR_DOM_QUOTA_REACHED (Firefox) conta come quota piena', () => {
    const mem = S.createMemoryBackend();
    S.setStorageBackend({
      ...mem,
      key: mem.key,
      getItem: mem.getItem,
      removeItem: mem.removeItem,
      length: 0,
      setItem() {
        const e = new Error('quota');
        e.name = 'NS_ERROR_DOM_QUOTA_REACHED';
        throw e;
      },
    });
    const cap = captureErrors();
    S.write('global', 'lang', 'it');
    expect(cap.events[0]?.quota).toBe(true);
    cap.stop();
  });

  it('una scrittura riuscita non emette errori', () => {
    S.setStorageBackend(S.createMemoryBackend());
    const cap = captureErrors();
    expect(S.write('global', 'lang', 'en')).toBe(true);
    expect(cap.events).toHaveLength(0);
    cap.stop();
  });
});

describe('memoria persistente', () => {
  it('persist() alla prima scrittura riuscita, una volta sola, se non già persistente', async () => {
    const persist = vi.fn(() => Promise.resolve(true));
    const persisted = vi.fn(() => Promise.resolve(false));
    vi.stubGlobal('navigator', { storage: { persist, persisted } });
    S.setStorageBackend(S.createMemoryBackend());
    S.write('global', 'lang', 'it');
    S.write('global', 'lang', 'en');
    await vi.waitFor(() => expect(persist).toHaveBeenCalledTimes(1));
    expect(persisted).toHaveBeenCalledTimes(1);
  });

  it('non chiede persist() se è già persistente o se la scrittura fallisce', async () => {
    const persist = vi.fn(() => Promise.resolve(true));
    const persisted = vi.fn(() => Promise.resolve(true));
    vi.stubGlobal('navigator', { storage: { persist, persisted } });
    S.setStorageBackend(fullBackend());
    S.write('global', 'lang', 'it');
    expect(persisted).not.toHaveBeenCalled();
    S.setStorageBackend(S.createMemoryBackend());
    S.write('global', 'lang', 'it');
    await vi.waitFor(() => expect(persisted).toHaveBeenCalledTimes(1));
    expect(persist).not.toHaveBeenCalled();
  });

  it('API assente o che rifiuta: nessuna eccezione', async () => {
    vi.stubGlobal('navigator', { storage: { persisted: () => Promise.reject(new Error('no')) } });
    S.setStorageBackend(S.createMemoryBackend());
    expect(S.write('global', 'lang', 'it')).toBe(true);
    vi.stubGlobal('navigator', {});
    S.setStorageBackend(S.createMemoryBackend());
    expect(S.write('global', 'lang', 'it')).toBe(true);
  });
});

/** Valori corrotti possibili in localStorage (JSON valido ma forma sbagliata, o JSON rotto). */
const CORRUPT = [
  'null',
  '"testo"',
  '42',
  'true',
  '[]',
  '[1,2,3]',
  '{"v":1}',
  '{',
  'undefined',
  '{"exercises":"x","read":[1],"cards":7,"log":{"a":1},"notes":[null],"history":"x","session":5}',
  '{"exercises":{"e":{"attempts":[null,1,{"at":"x"}]}},"cards":{"c":null},"log":[null,{"id":1}],"notes":{"n":{"text":5}},"history":[null,{"id":"a"}],"session":{"startedAt":1}}',
];

describe('valori corrotti', () => {
  beforeEach(() => S.setStorageBackend(S.createMemoryBackend()));

  it.each(CORRUPT)('ogni area si legge senza eccezioni: %s', (raw) => {
    for (const area of ['progress', 'srs', 'exam', 'notes']) S.writeRaw(`sh:v1:c:${area}`, raw);
    S.writeRaw('sh:v1:global:examDates', raw);
    S.writeRaw('sh:v1:global:settings', raw);
    S.writeRaw('sh:v1:global:backup', raw);
    const p = loadProgress('c');
    expect(p).toMatchObject({ v: 1 });
    expect(typeof p.exercises).toBe('object');
    for (const e of Object.values(p.exercises)) expect(Array.isArray(e.attempts)).toBe(true);
    const srs = loadSrs('c');
    expect(Array.isArray(srs.log)).toBe(true);
    const exam = loadExamState('c');
    expect(Array.isArray(exam.history)).toBe(true);
    expect(exam.session).toBeUndefined();
    expect(loadNotes('c').notes).toEqual({});
    expect(() => allNotes()).not.toThrow();
    // Aree globali lette con un ripiego oggetto: mai null, stringa o array.
    const dates = S.read<Record<string, string>>('global', 'examDates', {});
    expect(dates !== null && typeof dates === 'object' && !Array.isArray(dates)).toBe(true);
    expect(S.read('global', 'settings', {})).not.toBeNull();
    expect(() => backupDue()).not.toThrow();
    expect(() => buildExport()).not.toThrow();
  });

  it('read() tiene il valore se il tipo coincide col ripiego e lo scarta altrimenti', () => {
    S.writeRaw('sh:v1:global:theme', '"dark"');
    expect(S.read('global', 'theme', '')).toBe('dark');
    expect(S.read('global', 'theme', {})).toEqual({});
    expect(S.read('global', 'theme', [])).toEqual([]);
    expect(S.read('global', 'theme', null)).toBe('dark');
    S.writeRaw('sh:v1:global:migrations', '{"a":1}');
    expect(S.read<string[]>('global', 'migrations', [])).toEqual([]);
  });

  it('esiti d’esame incompleti restano nello storico con valori neutri', () => {
    const s = sanitizeExamState({
      history: [
        { id: 'a', at: 1, percent: 50, byObjective: { o: { earned: 1, max: 2 }, bad: { earned: 'x' } } },
      ],
    });
    expect(s.history).toEqual([
      {
        id: 'a',
        at: 1,
        percent: 50,
        config: { mode: 'personalizzata', seed: 0 },
        earned: 0,
        total: 0,
        durationMs: 0,
        byTopic: {},
        byObjective: { o: { earned: 1, max: 2 } },
      },
    ]);
  });

  it('sessione d’esame: risposte null (JSON) diventano vuote, sessione malformata scartata', () => {
    const config = { mode: 'completa', seed: 3 };
    const ok = sanitizeExamState({
      session: {
        config,
        startedAt: 5,
        current: 0,
        answers: [null, { fields: ['1'], choices: [0, 'x'], self: 2 }],
      },
    });
    expect(ok.session?.answers).toEqual([undefined, { fields: ['1'], choices: [0] }]);
    expect(
      sanitizeExamState({ session: { config, startedAt: 5, answers: 'x', current: 0 } }).session,
    ).toBeUndefined();
    expect(
      sanitizeExamState({ session: { config: { mode: 1 }, startedAt: 5, answers: [], current: 0 } }).session,
    ).toBeUndefined();
  });
});

describe('promemoria di backup', () => {
  const DAY = 86_400_000;
  beforeEach(() => S.setStorageBackend(S.createMemoryBackend()));

  it('senza dati non scatta mai', () => {
    S.write('global', 'theme', 'dark');
    expect(backupDue(1e12)).toBe(false);
    expect(loadBackupState()).toEqual({});
  });

  it('al primo controllo con dati fissa la scadenza a 30 giorni', () => {
    const t0 = 1_700_000_000_000;
    S.write('c', 'progress', { v: 1, exercises: {}, read: { a: 1 } });
    expect(backupDue(t0)).toBe(false);
    expect(loadBackupState()).toEqual({ snoozeUntil: t0 + BACKUP_INTERVAL_MS });
    expect(backupDue(t0 + 29 * DAY)).toBe(false);
    expect(backupDue(t0 + 30 * DAY)).toBe(true);
  });

  it('dopo un export tace per 30 giorni; chiudere l’avviso lo rimanda di 7', () => {
    const t0 = 1_700_000_000_000;
    S.write('c', 'notes', { v: 1, notes: {} });
    S.markExported(t0);
    expect(backupDue(t0 + 10 * DAY)).toBe(false);
    expect(backupDue(t0 + 31 * DAY)).toBe(true);
    snoozeBackup(t0 + 31 * DAY);
    expect(backupDue(t0 + 35 * DAY)).toBe(false);
    expect(backupDue(t0 + 38 * DAY)).toBe(true);
    S.markExported(t0 + 38 * DAY);
    expect(backupDue(t0 + 40 * DAY)).toBe(false);
  });

  it('il promemoria resta sul dispositivo: non entra nell’export', () => {
    S.write('c', 'srs', { v: 1, cards: {}, log: [] });
    S.markExported(1);
    expect(Object.keys(buildExport().data)).toEqual(['sh:v1:c:srs']);
  });
});
