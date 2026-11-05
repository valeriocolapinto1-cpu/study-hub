// Storage con namespace, versione di schema, migrazioni, fallback in memoria ed export/import.
// Nessun accesso diretto a localStorage fuori da questo modulo.
export const NS = 'tdc:';
export const SCHEMA_VERSION = 1;
export const APP_ID = 'teoria-circuiti';
// Chiavi che NON entrano mai nell'export (segreti).
export const SECRET_KEYS = ['secret.aiKey'];

// migrazioni[n] porta i dati dalla versione n alla n+1.
export const MIGRATIONS = {};

function memoryBackend() {
  const m = new Map();
  return {
    kind: 'memory',
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    keys: () => [...m.keys()],
  };
}

function webBackend(store) {
  return {
    kind: 'web',
    getItem: (k) => store.getItem(k),
    setItem: (k, v) => store.setItem(k, v),
    removeItem: (k) => store.removeItem(k),
    keys: () => { const out = []; for (let i = 0; i < store.length; i++) out.push(store.key(i)); return out; },
  };
}

export function createStorage(rawStore) {
  let backend;
  let degraded = false;
  try {
    if (!rawStore) throw new Error('no store');
    rawStore.setItem(NS + '__probe', '1');
    rawStore.removeItem(NS + '__probe');
    backend = webBackend(rawStore);
  } catch (e) {
    backend = memoryBackend();
    degraded = true;
  }
  const mem = memoryBackend();

  function safe(fn, fallback) {
    try { return fn(); } catch (e) { degraded = true; return fallback; }
  }
  function rawGet(k) {
    return safe(() => backend.getItem(NS + k), mem.getItem(NS + k));
  }
  function rawSet(k, v) {
    try { backend.setItem(NS + k, v); return true; }
    catch (e) { degraded = true; mem.setItem(NS + k, v); return false; }
  }

  const api = {
    get isDegraded() { return degraded; },
    get(key, def = null) {
      const s = rawGet(key);
      if (s === null || s === undefined) return def;
      try { return JSON.parse(s); } catch (e) { return def; }
    },
    has(key) { const s = rawGet(key); return s !== null && s !== undefined; },
    set(key, value) { return rawSet(key, JSON.stringify(value)); },
    remove(key) { safe(() => backend.removeItem(NS + key)); mem.removeItem(NS + key); },
    keys() {
      const all = new Set([...safe(() => backend.keys(), []), ...mem.keys()]);
      return [...all].filter((k) => k.startsWith(NS) && k !== NS + 'meta' && !k.startsWith(NS + '__'))
        .map((k) => k.slice(NS.length));
    },
    /** Esegue le migrazioni se i dati salvati hanno una versione più vecchia. */
    init() {
      const meta = api.get('meta', null);
      let v = meta && Number.isInteger(meta.version) ? meta.version : 0;
      if (v > SCHEMA_VERSION) return { ok: false, reason: 'dati più recenti dell\'app', version: v };
      while (v < SCHEMA_VERSION) {
        const fn = MIGRATIONS[v];
        if (fn) fn(api);
        v += 1;
      }
      api.set('meta', { version: SCHEMA_VERSION, updated: new Date().toISOString() });
      return { ok: true, version: v };
    },
    exportAll(now = new Date()) {
      const data = {};
      for (const k of api.keys()) {
        if (SECRET_KEYS.includes(k)) continue;
        data[k] = api.get(k);
      }
      return { app: APP_ID, version: SCHEMA_VERSION, exportedAt: now.toISOString(), data };
    },
    /** Valida un file di export e ne descrive il contenuto, senza scrivere nulla. */
    previewImport(obj) {
      const errors = [];
      if (!obj || typeof obj !== 'object') return { valid: false, errors: ['File non valido'], sections: [] };
      if (obj.app !== APP_ID) errors.push('Il file non proviene da questo sito');
      if (!Number.isInteger(obj.version)) errors.push('Versione assente');
      else if (obj.version > SCHEMA_VERSION) errors.push('Il file è più recente di questa versione del sito');
      if (!obj.data || typeof obj.data !== 'object') errors.push('Sezione dati assente');
      const sections = [];
      if (obj.data && typeof obj.data === 'object') {
        for (const k of Object.keys(obj.data)) {
          if (SECRET_KEYS.includes(k)) continue;
          const existing = api.has(k);
          sections.push({ key: k, willOverwrite: existing, bytes: JSON.stringify(obj.data[k]).length });
        }
      }
      return { valid: errors.length === 0, errors, sections, exportedAt: obj.exportedAt || null };
    },
    applyImport(obj, onlyKeys = null) {
      const p = api.previewImport(obj);
      if (!p.valid) throw new Error(p.errors.join('; '));
      let n = 0;
      for (const s of p.sections) {
        if (onlyKeys && !onlyKeys.includes(s.key)) continue;
        api.set(s.key, obj.data[s.key]);
        n += 1;
      }
      // Dopo l'import porta i dati alla versione corrente.
      let v = obj.version;
      while (v < SCHEMA_VERSION) { const fn = MIGRATIONS[v]; if (fn) fn(api); v += 1; }
      api.set('meta', { version: SCHEMA_VERSION, updated: new Date().toISOString() });
      return n;
    },
    /** Azzera le chiavi che iniziano per `prefix` (mai i segreti, a meno di richiesta esplicita). */
    reset(prefix = '', { includeSecrets = false } = {}) {
      let n = 0;
      for (const k of api.keys()) {
        if (!k.startsWith(prefix)) continue;
        if (!includeSecrets && SECRET_KEYS.includes(k)) continue;
        api.remove(k); n += 1;
      }
      return n;
    },
  };
  return api;
}

let _default = null;
export function getStorage() {
  if (!_default) {
    let raw = null;
    try { raw = globalThis.localStorage || null; } catch (e) { raw = null; }
    _default = createStorage(raw);
    _default.init();
  }
  return _default;
}
