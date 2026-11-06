/**
 * Shim minimo per eseguire i file .gs di tools/apps-script in Node.
 *
 * Apps Script non ha moduli: tutti i file condividono un ambito globale. Qui li
 * concateniamo e li eseguiamo in un contesto `vm` isolato, in cui i servizi di
 * Google (SpreadsheetApp, DriveApp, …) sono sostituiti da finti in memoria.
 * Così i test verificano sia la logica pura sia il flusso completo di doPost.
 */
import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const dir = fileURLToPath(new URL('../../../tools/apps-script/', import.meta.url));

export function loadSource(files: string[] = ['Logic.gs', 'Code.gs']): string {
  // Le dichiarazioni `const` di primo livello non diventano proprietà del contesto:
  // le esponiamo esplicitamente in coda.
  return files.map((f) => readFileSync(dir + f, 'utf8')).join('\n;\n');
}

/* ------------------------------------------------------------------ finti */

export interface FakeFile {
  id: string;
  name: string;
  mimeType: string;
  bytes: number[];
  folderId: string;
}

export interface FakeEnv {
  properties: Record<string, string>;
  cache: Map<string, string>;
  rows: unknown[][];
  folders: Map<string, { id: string; name: string; parent: string | null }>;
  files: FakeFile[];
  mails: { to: string; subject: string; body: string; options: Record<string, unknown> }[];
  fetches: { url: string; options: Record<string, unknown> }[];
  /** Risposta di Turnstile simulata. */
  turnstile: Record<string, unknown>;
  /** Sessioni di upload ripristinabile aperte (url → byte ricevuti). */
  sessions: Map<string, { name: string; mimeType: string; size: number; folderId: string; bytes: number[] }>;
}

const toSigned = (b: number) => (b > 127 ? b - 256 : b);

class Blob {
  constructor(
    public bytes: number[],
    public contentType: string,
    public name: string,
  ) {}
}

function makeFolderApi(env: FakeEnv, id: string): Record<string, unknown> {
  return {
    getId: () => id,
    getName: () => env.folders.get(id)!.name,
    getUrl: () => `https://drive.google.com/drive/folders/${id}`,
    createFolder: (name: string) => {
      const fid = 'folder-' + (env.folders.size + 1);
      env.folders.set(fid, { id: fid, name, parent: id });
      return makeFolderApi(env, fid);
    },
    createFile: (blob: Blob) => {
      const fid = 'file-' + (env.files.length + 1);
      env.files.push({
        id: fid,
        name: blob.name,
        mimeType: blob.contentType,
        bytes: blob.bytes,
        folderId: id,
      });
      return { getId: () => fid, getUrl: () => `https://drive.google.com/file/d/${fid}/view` };
    },
  };
}

function response(code: number, body: string, headers: Record<string, string> = {}) {
  return { getResponseCode: () => code, getContentText: () => body, getHeaders: () => headers };
}

export function createEnv(overrides: Partial<FakeEnv> = {}): FakeEnv {
  const env: FakeEnv = {
    properties: {
      TURNSTILE_SECRET: 'segreto',
      DRIVE_FOLDER_ID: 'root',
      SHEET_ID: 'sheet-1',
      NOTIFY_EMAIL: 'owner@example.org',
    },
    cache: new Map(),
    rows: [],
    folders: new Map([['root', { id: 'root', name: 'study-hub-contributi', parent: null }]]),
    files: [],
    mails: [],
    fetches: [],
    turnstile: { success: true, hostname: 'valeriocolapinto1-cpu.github.io', action: 'contribute' },
    sessions: new Map(),
    ...overrides,
  };
  return env;
}

function globalsFor(env: FakeEnv): Record<string, unknown> {
  const sheet = {
    getLastRow: () => env.rows.length,
    appendRow: (values: unknown[]) => {
      env.rows.push([...values]);
    },
    getRange: (row: number, col: number) => ({
      setValue: (v: unknown) => {
        env.rows[row - 1]![col - 1] = v;
      },
      setFontWeight: () => undefined,
    }),
    setFrozenRows: () => undefined,
  };
  return {
    console: { log: () => undefined, error: () => undefined },
    JSON,
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k: string) => env.properties[k] ?? null,
        setProperty: (k: string, v: string) => {
          env.properties[k] = v;
        },
      }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k: string) => env.cache.get(k) ?? null,
        getAll: (keys: string[]) =>
          Object.fromEntries(keys.filter((k) => env.cache.has(k)).map((k) => [k, env.cache.get(k)])),
        put: (k: string, v: string) => {
          if (v.length > 100 * 1024) throw new Error('Valore di cache oltre 100 KB');
          env.cache.set(k, v);
        },
        putAll: (o: Record<string, string>) => {
          for (const [k, v] of Object.entries(o)) env.cache.set(k, v);
        },
        remove: (k: string) => {
          env.cache.delete(k);
        },
      }),
    },
    LockService: { getScriptLock: () => ({ waitLock: () => undefined, releaseLock: () => undefined }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'owner@example.org' }) },
    ScriptApp: { getOAuthToken: () => 'oauth-token' },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (text: string) => {
        const out = {
          text,
          mime: '',
          setMimeType: (m: string) => ((out.mime = m), out),
          getContent: () => text,
        };
        return out;
      },
    },
    Utilities: {
      getUuid: () => randomUUID(),
      base64Decode: (s: string) => Array.from(Buffer.from(s, 'base64')).map(toSigned),
      newBlob: (bytes: number[], type: string, name: string) => new Blob(bytes, type, name),
      computeDigest: (_alg: unknown, text: string) =>
        Array.from(createHash('sha256').update(text, 'utf8').digest()).map(toSigned),
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      Charset: { UTF_8: 'UTF_8' },
    },
    SpreadsheetApp: {
      openById: (id: string) => ({
        getSheets: () => [sheet],
        getUrl: () => `https://docs.google.com/spreadsheets/d/${id}`,
        getId: () => id,
      }),
      create: () => ({ getId: () => 'sheet-new' }),
    },
    DriveApp: {
      getFolderById: (id: string) => {
        if (!env.folders.has(id)) throw new Error('Cartella inesistente: ' + id);
        return makeFolderApi(env, id);
      },
      getFoldersByName: () => ({ hasNext: () => false, next: () => null }),
      createFolder: (name: string) => {
        env.folders.set('root', { id: 'root', name, parent: null });
        return makeFolderApi(env, 'root');
      },
      getFileById: () => ({ moveTo: () => undefined }),
    },
    MailApp: {
      sendEmail: (to: string, subject: string, body: string, options: Record<string, unknown>) => {
        env.mails.push({ to, subject, body, options });
      },
    },
    UrlFetchApp: {
      fetch: (url: string, options: Record<string, any>) => {
        env.fetches.push({ url, options });
        if (url.startsWith('https://challenges.cloudflare.com/'))
          return response(200, JSON.stringify(env.turnstile));
        if (url.startsWith('https://www.googleapis.com/upload/drive/v3/files')) {
          const meta = JSON.parse(options.payload);
          const loc = `https://upload.example/session-${env.sessions.size + 1}`;
          env.sessions.set(loc, {
            name: meta.name,
            mimeType: meta.mimeType,
            size: Number(options.headers['X-Upload-Content-Length']),
            folderId: meta.parents[0],
            bytes: [],
          });
          return response(200, '', { Location: loc });
        }
        const session = env.sessions.get(url);
        if (session) {
          const range = /bytes (\d+)-(\d+)\/(\d+)/.exec(options.headers['Content-Range'])!;
          if (Number(range[1]) !== session.bytes.length) return response(400, 'range');
          for (const b of options.payload as number[]) session.bytes.push(b);
          if (session.bytes.length < session.size) return response(308, '');
          const fid = 'file-' + (env.files.length + 1);
          env.files.push({
            id: fid,
            name: session.name,
            mimeType: session.mimeType,
            bytes: session.bytes,
            folderId: session.folderId,
          });
          return response(200, JSON.stringify({ id: fid }));
        }
        return response(404, '');
      },
    },
  };
}

export type GasContext = Record<string, any>;

/** Carica Logic.gs + Code.gs in un contesto con i servizi finti di `env`. */
export function loadScript(env: FakeEnv = createEnv()): GasContext {
  const exposed = [
    'PROTOCOL_VERSION',
    'CONTRIB_TYPES',
    'LIMITS',
    'RATE_LIMITS',
    'ALLOWED_EXTENSIONS',
    'SHEET_HEADERS',
    'STATUS',
  ];
  const source = loadSource() + `\n;globalThis.__consts = { ${exposed.join(', ')} };`;
  const context = vm.createContext({ ...globalsFor(env) });
  vm.runInContext(source, context, { filename: 'apps-script.gs' });
  return Object.assign(context, context.__consts);
}

/** Invoca doPost come farebbe Apps Script e restituisce il JSON di risposta. */
export function post(ctx: GasContext, body: unknown): any {
  const out = ctx.doPost({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } });
  return JSON.parse(out.getContent());
}
