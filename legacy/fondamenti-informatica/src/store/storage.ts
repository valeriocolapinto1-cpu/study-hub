/**
 * Unico punto dell'app che tocca `localStorage`.
 *
 * Se lo storage è bloccato — navigazione privata, cookie di terze parti
 * disabilitati, quota esaurita — si degrada su una mappa in memoria: i
 * progressi non sopravvivono al reload, ma l'app continua a funzionare
 * invece di rompersi.
 */
export interface KeyValueStore {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  /** false quando si sta usando il ripiego in memoria. */
  readonly persistent: boolean;
}

/**
 * Non basta che `localStorage` esista: in alcune configurazioni l'oggetto c'è
 * ma qualunque scrittura solleva un'eccezione. Si verifica scrivendo davvero.
 */
function probeLocalStorage(): Storage | null {
  try {
    const probe = '__aefin_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

function createMemoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    persistent: false,
    get<T>(key: string, fallback: T): T {
      const raw = map.get(key);
      if (raw === undefined) return fallback;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return fallback;
      }
    },
    set<T>(key: string, value: T): void {
      map.set(key, JSON.stringify(value));
    },
    remove(key: string): void {
      map.delete(key);
    },
  };
}

function createBrowserStore(backing: Storage): KeyValueStore {
  const fallbackStore = createMemoryStore();

  return {
    persistent: true,
    get<T>(key: string, fallback: T): T {
      try {
        const raw = backing.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw) as T;
      } catch {
        // Dato corrotto o accesso negato: si riparte dal valore di default.
        return fallback;
      }
    },
    set<T>(key: string, value: T): void {
      try {
        backing.setItem(key, JSON.stringify(value));
      } catch {
        // Quota piena o scrittura negata: si tiene almeno la sessione corrente.
        fallbackStore.set(key, value);
      }
    },
    remove(key: string): void {
      try {
        backing.removeItem(key);
      } catch {
        fallbackStore.remove(key);
      }
    },
  };
}

export function createStorage(): KeyValueStore {
  if (typeof window === 'undefined') return createMemoryStore();
  const backing = probeLocalStorage();
  return backing ? createBrowserStore(backing) : createMemoryStore();
}

export const storage: KeyValueStore = createStorage();
