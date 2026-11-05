/**
 * Accesso a localStorage con chiavi versionate `sh:v1:<scope>:<area>`.
 * scope = id del corso oppure 'global'. Ogni accesso è protetto da try/catch:
 * in navigazione privata, con quote piene o senza `window` le funzioni
 * degradano senza lanciare eccezioni.
 */

export const STORAGE_PREFIX = 'sh:v1:';
export const GLOBAL_SCOPE = 'global';
export const STORAGE_EVENT = 'sh:storage';

export type Scope = typeof GLOBAL_SCOPE | (string & {});
export type GlobalArea = 'theme' | 'lang' | 'examDates' | 'migrations' | (string & {});
export type CourseArea = 'progress' | 'srs' | 'exam' | 'notes' | 'settings' | (string & {});

const SEGMENT_RE = /^[a-z0-9]+(?:[-.][a-z0-9]+)*$/i;

/** Backend di memorizzazione minimo (sottoinsieme di `Storage`). */
export interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  readonly length: number;
}

let override: StorageBackend | null | undefined;

/** Per i test: imposta un backend (null = nessuno disponibile; undefined = ripristina). */
export function setStorageBackend(backend: StorageBackend | null | undefined): void {
  override = backend;
}

export function getBackend(): StorageBackend | null {
  if (override !== undefined) return override;
  try {
    if (typeof globalThis.localStorage === 'undefined') return null;
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function storageKey(scope: Scope, area: CourseArea | GlobalArea): string {
  if (!SEGMENT_RE.test(scope)) throw new Error(`scope non valido: "${scope}"`);
  if (!SEGMENT_RE.test(area)) throw new Error(`area non valida: "${area}"`);
  return `${STORAGE_PREFIX}${scope}:${area}`;
}

/** Scompone una chiave `sh:v1:` in scope e area; null se non è del sito. */
export function parseKey(key: string): { scope: string; area: string } | null {
  if (!key.startsWith(STORAGE_PREFIX)) return null;
  const [scope, area, ...rest] = key.slice(STORAGE_PREFIX.length).split(':');
  if (!scope || !area || rest.length > 0) return null;
  return { scope, area };
}

export function readRaw(key: string): string | null {
  try {
    return getBackend()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeRaw(key: string, value: string): boolean {
  try {
    const backend = getBackend();
    if (!backend) return false;
    backend.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Legge un valore JSON; restituisce `fallback` se assente o illeggibile. */
export function read<T>(scope: Scope, area: string, fallback: T): T {
  const raw = readRaw(storageKey(scope, area));
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function notify(scope: string, area: string): void {
  try {
    if (typeof globalThis.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
      globalThis.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { scope, area } }));
    }
  } catch {
    /* nessun ambiente DOM */
  }
}

/** Scrive un valore serializzabile in JSON. Restituisce false se non è stato possibile. */
export function write<T>(scope: Scope, area: string, value: T): boolean {
  let json: string;
  try {
    json = JSON.stringify(value);
  } catch {
    return false;
  }
  const ok = writeRaw(storageKey(scope, area), json);
  if (ok) notify(scope, area);
  return ok;
}

/** Legge, trasforma e riscrive. Restituisce il nuovo valore. */
export function update<T>(scope: Scope, area: string, fallback: T, fn: (current: T) => T): T {
  const next = fn(read(scope, area, fallback));
  write(scope, area, next);
  return next;
}

export function remove(scope: Scope, area: string): void {
  try {
    getBackend()?.removeItem(storageKey(scope, area));
    notify(scope, area);
  } catch {
    /* ignora */
  }
}

/** Tutte le chiavi del sito presenti (eventualmente di un solo scope). */
export function listKeys(scope?: Scope): string[] {
  const keys: string[] = [];
  try {
    const backend = getBackend();
    if (!backend) return keys;
    for (let i = 0; i < backend.length; i++) {
      const k = backend.key(i);
      const parsed = k ? parseKey(k) : null;
      if (k && parsed && (scope === undefined || parsed.scope === scope)) keys.push(k);
    }
  } catch {
    /* ignora */
  }
  return keys.sort();
}

/**
 * Notifica le modifiche a (scope, area) fatte in questa scheda o in altre.
 * Restituisce la funzione per annullare l'iscrizione.
 */
export function subscribe(scope: Scope, area: string, callback: () => void): () => void {
  if (typeof globalThis.addEventListener !== 'function') return () => {};
  const key = storageKey(scope, area);
  const local = (e: Event) => {
    const d = (e as CustomEvent<{ scope: string; area: string }>).detail;
    if (d && (d.scope === '*' || (d.scope === scope && d.area === area))) callback();
  };
  const other = (e: StorageEvent) => {
    if (e.key === key || e.key === null) callback();
  };
  globalThis.addEventListener(STORAGE_EVENT, local);
  globalThis.addEventListener('storage', other);
  return () => {
    globalThis.removeEventListener(STORAGE_EVENT, local);
    globalThis.removeEventListener('storage', other);
  };
}

/** Backend in memoria (test, ambienti senza localStorage). */
export function createMemoryBackend(initial: Record<string, string> = {}): StorageBackend {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
}

/** localStorage è utilizzabile (non in sola memoria, non bloccato)? */
export function isStorageAvailable(): boolean {
  const probe = `${STORAGE_PREFIX}global:probe`;
  try {
    const backend = getBackend();
    if (!backend) return false;
    backend.setItem(probe, '1');
    backend.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** Tutti i valori del sito (eventualmente di un solo scope) come `{ chiave: valore JSON }`. */
export function readAll(scope?: Scope): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of listKeys(scope)) {
    const raw = readRaw(key);
    if (raw === null) continue;
    try {
      out[key] = JSON.parse(raw);
    } catch {
      /* valore corrotto: escluso */
    }
  }
  return out;
}

/** Cancella tutte le chiavi di uno scope (o di tutto il sito). Le chiavi legacy non sono toccate. */
export function clearScope(scope?: Scope): number {
  const keys = listKeys(scope);
  for (const key of keys) {
    const parsed = parseKey(key);
    if (parsed) remove(parsed.scope, parsed.area);
  }
  return keys.length;
}

/** Byte occupati dalle chiavi del sito (stima UTF-16, come la quota del browser). */
export function usageBytes(): number {
  let total = 0;
  for (const key of listKeys()) total += (key.length + (readRaw(key)?.length ?? 0)) * 2;
  return total;
}
