/**
 * Protocollo di invio dal lato del sito (src/lib/contribute/upload.ts) contro il
 * backend vero (Code.gs nello shim di tests/unit/apps-script), con una rete
 * finta che perde richieste, perde risposte e restituisce errori a metà invio.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { createEnv, loadScript, post, type FakeEnv, type GasContext } from '../apps-script/shim';
import { CHUNK_BYTES } from '../../../src/lib/contribute/rules';
import {
  backoffDelay,
  ContributeError,
  sendContribution,
  type TransportOptions,
} from '../../../src/lib/contribute/upload';

type Fault =
  'drop-request' | 'drop-response' | 'http-503' | 'busy' | 'server' | { reply: Record<string, unknown> };

const ENDPOINT = 'https://script.example/exec';

const payload = (over: Record<string, unknown> = {}) => ({
  tipo: 'appunti',
  corso: 'teoria-circuiti',
  pagina: '/study-hub/it/anno-2/teoria-circuiti/teoria/resistori/',
  lingua: 'it',
  messaggio: 'Allego i miei appunti sul partitore di tensione.',
  email: 'studente@example.org',
  nome: 'Anna',
  consensoPrivacy: true,
  consensoDiritti: true,
  consensoPubblicazione: true,
  website: '',
  elapsedMs: 15000,
  clientId: 'c0ffee00-1234-4abc-9def-001122334455',
  ...over,
});

const pdf = (size: number) => {
  const b = Buffer.alloc(size);
  for (let i = 0; i < size; i++) b[i] = (i * 31) & 0xff;
  b.write('%PDF-1.7', 0, 'latin1');
  return b;
};

describe('invio dei contributi con rete inaffidabile', () => {
  let env: FakeEnv;
  let ctx: GasContext;
  /** Guasti da applicare alle richieste `chunk`/`finalize`, per numero progressivo (da 1). */
  let faults: Map<number, Fault>;
  let calls: Record<string, any>[];
  let delays: number[];
  let onCall: ((body: Record<string, any>, n: number) => void) | null;

  const fakeFetch: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init!.body));
    calls.push(body);
    const n = calls.filter((c) => c.action === 'chunk' || c.action === 'finalize').length;
    const fault = body.action === 'chunk' || body.action === 'finalize' ? faults.get(n) : undefined;
    onCall?.(body, n);
    if (init?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const json = (o: unknown) =>
      new Response(JSON.stringify(o), { headers: { 'Content-Type': 'application/json' } });
    if (fault === 'drop-request') throw new TypeError('Failed to fetch');
    if (fault === 'http-503') return new Response('Service Unavailable', { status: 503 });
    if (fault === 'busy' || fault === 'server') return json({ ok: false, v: 1, error: fault });
    if (fault && typeof fault === 'object') return json(fault.reply);
    const reply = post(ctx, body);
    if (fault === 'drop-response') throw new TypeError('Network connection was lost');
    return json(reply);
  };

  const options = (over: Partial<TransportOptions> = {}): TransportOptions => ({
    endpoint: ENDPOINT,
    fetch: fakeFetch,
    sleep: async (ms) => void delays.push(ms),
    random: () => 0.5,
    ...over,
  });

  const files = (...bufs: Buffer[]) => bufs.map((b) => new Blob([new Uint8Array(b)]));

  beforeEach(() => {
    env = createEnv();
    ctx = loadScript(env);
    faults = new Map();
    calls = [];
    delays = [];
    onCall = null;
  });

  const row = () => env.rows[1]!;
  const STATO = 2;

  it("completa l'invio nonostante richieste e risposte perse, 503 e busy", async () => {
    const big = pdf(CHUNK_BYTES * 2 + 1000);
    const small = Buffer.from('# Appunti\nPartitore\n');
    faults.set(2, 'drop-response'); // il blocco 1 arriva, la risposta no
    faults.set(3, 'drop-request'); // il ritentativo del blocco 1 non arriva
    faults.set(4, 'http-503');
    faults.set(5, 'busy');
    faults.set(9, 'server'); // la prima chiusura
    const progress: number[] = [];
    const r = await sendContribution(
      {
        turnstileToken: 'tok',
        payload: payload({
          files: [
            { name: 'dispensa.pdf', size: big.length },
            { name: 'ohm.md', size: small.length },
          ],
        }),
        files: files(big, small),
      },
      options({ onProgress: (sent) => progress.push(sent) }),
    );
    expect(r.id).toMatch(/^\d{8}-\d{6}-[a-f0-9]{6}$/);
    expect(env.files).toHaveLength(2);
    expect(Buffer.from(env.files[0]!.bytes).equals(big)).toBe(true);
    expect(Buffer.from(env.files[1]!.bytes).equals(small)).toBe(true);
    expect(row()[STATO]).toBe('nuovo');
    expect(env.mails).toHaveLength(1);
    // Attese crescenti per i quattro errori consecutivi sul blocco 1, poi una per la chiusura.
    expect(delays).toEqual([800, 1600, 3200, 6400, 800]);
    // Il blocco 1 è stato inviato cinque volte, gli altri una.
    const sent = calls.filter((c) => c.action === 'chunk').map((c) => `${c.fileIndex}:${c.chunkIndex}`);
    expect(sent).toEqual(['0:0', '0:1', '0:1', '0:1', '0:1', '0:1', '0:2', '1:0']);
    expect(calls.filter((c) => c.action === 'finalize')).toHaveLength(2);
    expect(progress.at(-1)).toBe(big.length + small.length);
    expect(progress).toEqual([...progress].sort((a, b) => a - b));
  });

  it('riprende dal blocco che il server dice di aver ricevuto', async () => {
    const big = pdf(CHUNK_BYTES * 2 + 10);
    // Al blocco 2 il server risponde che si è fermato al blocco 1: si riparte da lì.
    faults.set(3, { reply: { ok: false, v: 1, error: 'chunk', received: 1 } });
    await sendContribution(
      {
        turnstileToken: 'tok',
        payload: payload({ files: [{ name: 'a.pdf', size: big.length }] }),
        files: files(big),
      },
      options(),
    );
    const sent = calls.filter((c) => c.action === 'chunk').map((c) => c.chunkIndex);
    // 1 è ripetuto: il server lo riconosce come già ricevuto e indica di proseguire da 2.
    expect(sent).toEqual([0, 1, 2, 1, 2]);
    expect(Buffer.from(env.files[0]!.bytes).equals(big)).toBe(true);
    expect(delays).toEqual([]);
  });

  it('si arrende dopo i ritentativi con un codice utile al modulo', async () => {
    const big = pdf(CHUNK_BYTES + 10);
    for (let i = 2; i <= 20; i++) faults.set(i, 'server');
    const err = await sendContribution(
      {
        turnstileToken: 'tok',
        payload: payload({ files: [{ name: 'a.pdf', size: big.length }] }),
        files: files(big),
      },
      options({ retries: 3 }),
    ).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ContributeError);
    expect((err as ContributeError).code).toBe('server');
    expect(delays).toEqual([800, 1600, 3200]);
    expect(row()[STATO]).toBe('in-caricamento'); // ci penserà pulizia()
  });

  it('non ritenta gli errori definitivi', async () => {
    const err = await sendContribution(
      {
        turnstileToken: 'tok',
        payload: payload({ files: [{ name: 'foto.png', size: 9 }] }),
        files: files(Buffer.from('%PDF-1.7\n')),
      },
      options(),
    ).catch((e: unknown) => e);
    expect((err as ContributeError).code).toBe('file_content');
    expect(delays).toEqual([]);
  });

  it('riporta gli errori di validazione con i campi', async () => {
    const err = await sendContribution(
      { turnstileToken: 'tok', payload: payload({ messaggio: 'no' }), files: [] },
      options(),
    ).catch((e: unknown) => e);
    expect(err).toMatchObject({ code: 'validation', fields: { messaggio: 'too_short' } });
    expect(calls).toHaveLength(1);
  });

  it('annulla a metà: si ferma, avvisa il server e la riga viene scartata', async () => {
    const big = pdf(CHUNK_BYTES * 3);
    const ctrl = new AbortController();
    onCall = (body) => {
      if (body.action === 'chunk' && body.chunkIndex === 1) ctrl.abort();
    };
    const err = await sendContribution(
      {
        turnstileToken: 'tok',
        payload: payload({ files: [{ name: 'a.pdf', size: big.length }] }),
        files: files(big),
      },
      options({ signal: ctrl.signal }),
    ).catch((e: unknown) => e);
    expect((err as ContributeError).code).toBe('cancelled');
    await new Promise((r) => setTimeout(r, 0));
    expect(calls.map((c) => c.action)).toEqual(['submit', 'chunk', 'chunk', 'cancel']);
    expect(row()[STATO]).toBe('scartato');
    expect(env.trashed.size).toBe(1);
  });

  it("annulla anche durante l'attesa tra due tentativi", async () => {
    const big = pdf(CHUNK_BYTES + 10);
    faults.set(1, 'http-503');
    const ctrl = new AbortController();
    const err = await sendContribution(
      {
        turnstileToken: 'tok',
        payload: payload({ files: [{ name: 'a.pdf', size: big.length }] }),
        files: files(big),
      },
      options({
        signal: ctrl.signal,
        sleep: () => {
          ctrl.abort();
          return Promise.reject(new ContributeError('cancelled'));
        },
      }),
    ).catch((e: unknown) => e);
    expect((err as ContributeError).code).toBe('cancelled');
  });

  it('senza allegati basta una richiesta', async () => {
    const r = await sendContribution({ turnstileToken: 'tok', payload: payload(), files: [] }, options());
    expect(r.id).toBe(row()[1]);
    expect(calls).toHaveLength(1);
  });

  it("l'attesa cresce in modo esponenziale fino al massimo, con variazione", () => {
    expect([0, 1, 2, 3, 10].map((a) => backoffDelay(a, 800, 15000, () => 0.5))).toEqual([
      800, 1600, 3200, 6400, 15000,
    ]);
    expect(backoffDelay(0, 800, 15000, () => 0)).toBe(600);
    expect(backoffDelay(0, 800, 15000, () => 1)).toBe(1000);
  });
});
