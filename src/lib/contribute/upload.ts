/**
 * Protocollo di invio dei contributi verso il Google Apps Script (tools/apps-script/Code.gs).
 *
 *   submit   → { id, uploadToken, chunkBytes }  (una sola volta: il token Turnstile vale per un invio)
 *   chunk    → { done, received }               (un blocco base64 alla volta, per file)
 *   finalize → { id }
 *   cancel   → annullamento (allegati nel cestino, riga «scartato»)
 *
 * Qui non c'è interfaccia: il modulo (ContributeForm) passa i dati e riceve
 * l'avanzamento. Ogni richiesta di blocco o di chiusura si ritenta con attesa
 * crescente sugli errori transitori (rete, tempo scaduto, HTTP 5xx/429,
 * `server`, `busy`); se il server risponde `chunk` con `received` si riprende
 * dal blocco che ha davvero ricevuto. Un `AbortSignal` annulla l'invio.
 */
import { CHUNK_BYTES, toBase64 } from './rules';

export type Reply = Record<string, any> & { ok: boolean; error?: string };

export interface UploadFile {
  readonly size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface SendInput {
  turnstileToken: string;
  payload: Record<string, unknown>;
  files: readonly UploadFile[];
}

export interface TransportOptions {
  endpoint: string;
  /** Predefinito: `fetch` globale. */
  fetch?: typeof fetch;
  /** Annulla l'invio: la promessa rifiuta con codice `cancelled`. */
  signal?: AbortSignal;
  /** Tentativi oltre il primo per ogni blocco e per la chiusura. */
  retries?: number;
  /** Prima attesa tra due tentativi; raddoppia a ogni tentativo fino a `maxDelayMs`. */
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Tempo massimo di una singola richiesta. */
  timeoutMs?: number;
  /** Ripartenze consentite per file quando il server indica un altro blocco da cui riprendere. */
  maxResumes?: number;
  /** Per i test: attesa e numeri casuali (variazione delle attese). */
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  random?: () => number;
  onProgress?: (sent: number, total: number) => void;
}

/** Errore dell'invio: `code` è un codice del server (`validation`, `rate_limited`, …) o `network` / `cancelled`. */
export class ContributeError extends Error {
  constructor(
    readonly code: string,
    readonly fields?: Record<string, string>,
  ) {
    super(code);
    this.name = 'ContributeError';
  }
}

/** Errori del server dopo cui ha senso ritentare la stessa richiesta. */
const TRANSIENT = new Set(['server', 'busy']);

const DEFAULTS = {
  retries: 5,
  baseDelayMs: 800,
  maxDelayMs: 15_000,
  timeoutMs: 60_000,
  maxResumes: 3,
};

/** Attesa prima del tentativo `attempt` (da 0): esponenziale con variazione ±25 %. */
export function backoffDelay(attempt: number, base: number, max: number, random = Math.random): number {
  const d = Math.min(max, base * 2 ** attempt);
  return Math.round(d * (0.75 + random() * 0.5));
}

function sleepFor(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new ContributeError('cancelled'));
    const t = setTimeout(done, ms);
    function done() {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }
    function onAbort() {
      clearTimeout(t);
      reject(new ContributeError('cancelled'));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Esito di una richiesta: risposta JSON oppure errore transitorio di trasporto. */
type Outcome = { reply: Reply } | { transient: string };

async function request(o: TransportOptions, body: unknown): Promise<Outcome> {
  const doFetch = o.fetch ?? globalThis.fetch.bind(globalThis);
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  o.signal?.addEventListener('abort', onAbort, { once: true });
  const timer = setTimeout(() => ctrl.abort(), o.timeoutMs ?? DEFAULTS.timeoutMs);
  try {
    const res = await doFetch(o.endpoint, {
      method: 'POST',
      // text/plain: richiesta "semplice", nessun preflight (Apps Script non risponde a OPTIONS).
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      redirect: 'follow',
      signal: ctrl.signal,
    });
    if (res.status >= 500 || res.status === 429) return { transient: `http_${res.status}` };
    if (!res.ok) return { reply: { ok: false, error: `http_${res.status}` } };
    const reply = (await res.json()) as Reply;
    return { reply: reply && typeof reply === 'object' ? reply : { ok: false, error: 'bad_reply' } };
  } catch (err) {
    if (o.signal?.aborted) throw new ContributeError('cancelled');
    // Rete assente, connessione chiusa, tempo scaduto o JSON illeggibile.
    return { transient: (err as Error)?.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
    o.signal?.removeEventListener('abort', onAbort);
  }
}

/** Una richiesta con i ritentativi: restituisce la risposta definitiva (ok o errore non transitorio). */
export async function requestWithRetry(o: TransportOptions, body: unknown): Promise<Reply> {
  const retries = o.retries ?? DEFAULTS.retries;
  const sleep = o.sleep ?? sleepFor;
  let last = 'network';
  for (let attempt = 0; ; attempt++) {
    if (o.signal?.aborted) throw new ContributeError('cancelled');
    const out = await request(o, body);
    if ('reply' in out) {
      if (out.reply.ok || !TRANSIENT.has(String(out.reply.error))) return out.reply;
      last = String(out.reply.error);
    } else {
      last = out.transient;
    }
    if (attempt >= retries) break;
    await sleep(
      backoffDelay(
        attempt,
        o.baseDelayMs ?? DEFAULTS.baseDelayMs,
        o.maxDelayMs ?? DEFAULTS.maxDelayMs,
        o.random,
      ),
      o.signal,
    );
  }
  // Dopo tutti i tentativi un errore del server resta `server`, uno di trasporto è `network`.
  throw new ContributeError(TRANSIENT.has(last) ? 'server' : 'network');
}

function fail(reply: Reply): never {
  throw new ContributeError(
    String(reply.error ?? 'generic'),
    reply.fields as Record<string, string> | undefined,
  );
}

/**
 * Invia un contributo e i suoi allegati. Restituisce l'identificativo assegnato dal server.
 * Con `signal` annullato rifiuta con `ContributeError('cancelled')` e, se l'upload era
 * già iniziato, chiede al server di scartarlo.
 */
export async function sendContribution(input: SendInput, o: TransportOptions): Promise<{ id: string }> {
  const first = await request(o, {
    action: 'submit',
    turnstileToken: input.turnstileToken,
    payload: input.payload,
  });
  // L'invio non si ritenta: il token Turnstile è già stato usato.
  if (!('reply' in first)) throw new ContributeError('network');
  const sub = first.reply;
  if (!sub.ok) fail(sub);
  const id = String(sub.id);
  if (!sub.uploadToken) return { id };

  const session = { action: '', id, uploadToken: String(sub.uploadToken) };
  try {
    await uploadFiles(session, Number(sub.chunkBytes) || CHUNK_BYTES, input.files, o);
    const fin = await requestWithRetry(o, { ...session, action: 'finalize' });
    if (!fin.ok) fail(fin);
    return { id };
  } catch (err) {
    if (err instanceof ContributeError && err.code === 'cancelled') {
      // Avviso al server senza segnale né ritentativi: se non arriva, ci pensa la pulizia oraria.
      void request({ ...o, signal: undefined, timeoutMs: 10_000 }, { ...session, action: 'cancel' }).catch(
        () => undefined,
      );
    }
    throw err;
  }
}

async function uploadFiles(
  session: { id: string; uploadToken: string },
  chunkBytes: number,
  files: readonly UploadFile[],
  o: TransportOptions,
): Promise<void> {
  const total = files.reduce((s, f) => s + f.size, 0);
  let before = 0;
  for (let fi = 0; fi < files.length; fi++) {
    const file = files[fi]!;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const n = Math.max(1, Math.ceil(bytes.length / chunkBytes));
    const progress = (received: number) =>
      o.onProgress?.(before + Math.min(bytes.length, received * chunkBytes), total);
    let resumes = 0;
    let ci = 0;
    while (ci < n) {
      const data = toBase64(bytes.subarray(ci * chunkBytes, Math.min(bytes.length, (ci + 1) * chunkBytes)));
      const r = await requestWithRetry(o, {
        ...session,
        action: 'chunk',
        fileIndex: fi,
        chunkIndex: ci,
        data,
      });
      const received = Number.isInteger(r.received) ? Math.min(n, Math.max(0, r.received as number)) : null;
      if (r.ok) {
        ci = received ?? ci + 1;
      } else if (
        r.error === 'chunk' &&
        received !== null &&
        received !== ci &&
        resumes < (o.maxResumes ?? DEFAULTS.maxResumes)
      ) {
        // Il server ha un'idea diversa di dove siamo arrivati: si riprende da lì.
        resumes++;
        ci = received;
      } else {
        fail(r);
      }
      progress(ci);
    }
    before += bytes.length;
  }
}
