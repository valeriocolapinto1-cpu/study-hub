import { beforeEach, describe, expect, it } from 'vitest';
import { createEnv, loadScript, post, type FakeEnv, type GasContext } from './shim';
import {
  ALLOWED_EXTENSIONS,
  CHUNK_BYTES,
  CONTRIB_TYPES,
  MAX_FILES,
  MAX_TOTAL_BYTES,
  MESSAGE_MAX,
  MESSAGE_MIN,
} from '../../../src/lib/contribute/rules';

const valid = (over: Record<string, unknown> = {}) => ({
  tipo: 'errore',
  corso: 'teoria-circuiti',
  pagina: '/study-hub/it/anno-2/teoria-circuiti/teoria/resistori/',
  lingua: 'it',
  messaggio: 'Nella formula del partitore manca il fattore R2 al numeratore.',
  email: 'Studente@Example.org',
  nome: 'Anna',
  consensoPrivacy: true,
  consensoDiritti: true,
  consensoPubblicazione: true,
  website: '',
  elapsedMs: 15000,
  clientId: 'c0ffee00-1234-4abc-9def-001122334455',
  files: [],
  ...over,
});

const submit = (ctx: GasContext, payload = valid(), token = 'tok') =>
  post(ctx, { action: 'submit', payload, turnstileToken: token });

const b64 = (bytes: number[] | Buffer) => Buffer.from(bytes).toString('base64');
const pdfBytes = (size: number) => {
  const b = Buffer.alloc(size, 0x41);
  b.write('%PDF-1.7', 0, 'latin1');
  return b;
};

describe('logica pura (Logic.gs)', () => {
  const ctx = loadScript();

  it('resta allineata alle regole del sito', () => {
    expect(ctx.CONTRIB_TYPES).toEqual([...CONTRIB_TYPES]);
    expect(Object.keys(ctx.ALLOWED_EXTENSIONS).sort()).toEqual(Object.keys(ALLOWED_EXTENSIONS).sort());
    expect(ctx.LIMITS.maxFiles).toBe(MAX_FILES);
    expect(ctx.LIMITS.maxTotalBytes).toBe(MAX_TOTAL_BYTES);
    expect(ctx.LIMITS.chunkBytes).toBe(CHUNK_BYTES);
    expect(ctx.LIMITS.messageMin).toBe(MESSAGE_MIN);
    expect(ctx.LIMITS.messageMax).toBe(MESSAGE_MAX);
    // I blocchi di Drive devono essere multipli di 256 KiB.
    expect(CHUNK_BYTES % (256 * 1024)).toBe(0);
  });

  it('valida e normalizza un invio corretto', () => {
    const r = ctx.validateSubmission(
      valid({ messaggio: '  testo\r\ncon a capo\u0007  ', nome: ' Anna   Rossi ' }),
    );
    expect(r.ok).toBe(true);
    expect(r.data.email).toBe('studente@example.org');
    expect(r.data.messaggio).toBe('testo\ncon a capo');
    expect(r.data.nome).toBe('Anna Rossi');
    expect(r.data.lingua).toBe('it');
  });

  it('segnala ogni campo non valido', () => {
    const r = ctx.validateSubmission({
      tipo: 'spam',
      corso: 'Fisica 1!',
      pagina: 'javascript:alert(1)',
      messaggio: 'corto',
      email: 'non-una-email',
      nome: 'x'.repeat(81),
      consensoPrivacy: false,
      consensoDiritti: 'true',
      files: 'nope',
    });
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual({
      tipo: 'invalid',
      corso: 'invalid',
      pagina: 'invalid',
      messaggio: 'too_short',
      email: 'invalid',
      nome: 'too_long',
      consensoPrivacy: 'required',
      consensoDiritti: 'required',
      consensoPubblicazione: 'required',
      files: 'invalid',
    });
  });

  it('accetta campi facoltativi vuoti', () => {
    const r = ctx.validateSubmission(valid({ email: '', nome: '', corso: '', pagina: '' }));
    expect(r.ok).toBe(true);
  });

  it('rifiuta messaggi troppo lunghi', () => {
    expect(ctx.validateSubmission(valid({ messaggio: 'a'.repeat(5001) })).errors.messaggio).toBe('too_long');
  });

  it('controlla tipo, numero e dimensione degli allegati', () => {
    const f = (name: string, size = 10) => ({ name, size });
    expect(ctx.validateFileList([f('a.zip')]).error).toBe('type');
    expect(ctx.validateFileList([f('senza-estensione')]).error).toBe('type');
    expect(ctx.validateFileList([f('a.pdf', 0)]).error).toBe('empty');
    expect(ctx.validateFileList(Array.from({ length: 11 }, () => f('a.pdf'))).error).toBe('too_many');
    expect(ctx.validateFileList([f('a.pdf', 20 * 1024 * 1024), f('b.png', 6 * 1024 * 1024)]).error).toBe(
      'too_large',
    );
    const ok = ctx.validateFileList([f('../../Appunti RLC è.PDF', CHUNK_BYTES + 1)]);
    expect(ok.ok).toBe(true);
    expect(ok.files[0]).toMatchObject({
      name: 'Appunti RLC e.pdf',
      mimeType: 'application/pdf',
      ext: 'pdf',
      chunks: 2,
    });
  });

  it('produce nomi di file sicuri', () => {
    expect(ctx.safeFileName('C:\\Users\\me\\..\\note.md', 0)).toBe('note.md');
    expect(ctx.safeFileName('....tex', 2)).toBe('allegato-3.tex');
    expect(ctx.safeFileName('a'.repeat(300) + '.docx', 0)).toHaveLength(120);
  });

  it('riconosce i bot dal campo trappola e dalla fretta', () => {
    expect(ctx.isLikelySpam(valid())).toBe(false);
    expect(ctx.isLikelySpam(valid({ website: 'http://spam' }))).toBe(true);
    expect(ctx.isLikelySpam(valid({ elapsedMs: 800 }))).toBe(true);
    expect(ctx.isLikelySpam(valid({ elapsedMs: 'x' }))).toBe(true);
  });

  it('applica i limiti di frequenza', () => {
    expect(ctx.evaluateRateLimit({ global: 0, email: 0, client: 0 }).allowed).toBe(true);
    expect(ctx.evaluateRateLimit({ global: 120 }).reason).toBe('global');
    expect(ctx.evaluateRateLimit({ global: 1, email: 5 }).reason).toBe('email');
    expect(ctx.evaluateRateLimit({ global: 1, client: 5 }).reason).toBe('client');
    const keys = ctx.rateLimitKeys('a@b.it', 'bad id!', (s: string) => `h(${s})`);
    expect(keys).toEqual({ global: 'rl:g', email: 'rl:e:h(a@b.it)' });
  });

  it('interpreta la risposta di Turnstile', () => {
    const hosts = ctx.parseAllowedHosts('');
    expect(hosts).toContain('valeriocolapinto1-cpu.github.io');
    expect(
      ctx.checkTurnstileResult(
        { success: true, hostname: 'localhost', action: 'contribute' },
        hosts,
        'contribute',
      ).ok,
    ).toBe(true);
    expect(
      ctx.checkTurnstileResult({ success: false, 'error-codes': ['timeout-or-duplicate'] }, hosts).reason,
    ).toBe('timeout-or-duplicate');
    expect(ctx.checkTurnstileResult({ success: true, hostname: 'evil.example' }, hosts).reason).toBe(
      'hostname',
    );
    expect(
      ctx.checkTurnstileResult({ success: true, hostname: 'localhost', action: 'login' }, hosts, 'contribute')
        .reason,
    ).toBe('action');
    expect(ctx.checkTurnstileResult(null, hosts).ok).toBe(false);
  });

  it('neutralizza le formule nel foglio', () => {
    expect(ctx.sheetSafe('=HYPERLINK("x")')).toBe('\'=HYPERLINK("x")');
    expect(ctx.sheetSafe('+39')).toBe("'+39");
    expect(ctx.sheetSafe('-1')).toBe("'-1");
    expect(ctx.sheetSafe('@a')).toBe("'@a");
    expect(ctx.sheetSafe('normale')).toBe('normale');
    expect(ctx.sheetSafe(true)).toBe('sì');
    expect(ctx.sheetSafe(undefined)).toBe('');
  });

  it('costruisce identificativi, blocchi e intestazioni di upload', () => {
    expect(ctx.makeSubmissionId(new Date(Date.UTC(2026, 10, 5, 9, 3, 7)), 'ABCdef12')).toBe(
      '20261105-090307-abcdef',
    );
    expect(ctx.expectedChunkBytes(CHUNK_BYTES * 2 + 5, 0)).toBe(CHUNK_BYTES);
    expect(ctx.expectedChunkBytes(CHUNK_BYTES * 2 + 5, 2)).toBe(5);
    expect(ctx.expectedChunkBytes(10, 1)).toBe(-1);
    expect(ctx.contentRange(CHUNK_BYTES + 10, 1, 10)).toBe(
      `bytes ${CHUNK_BYTES}-${CHUNK_BYTES + 9}/${CHUNK_BYTES + 10}`,
    );
  });

  it('verifica la firma dei file', () => {
    const s = (t: string) => Array.from(Buffer.from(t, 'latin1'));
    expect(ctx.sniffMatches('pdf', s('%PDF-1.4'))).toBe(true);
    expect(ctx.sniffMatches('pdf', s('<html>'))).toBe(false);
    expect(ctx.sniffMatches('png', [0x89, 0x50, 0x4e, 0x47, 0x0d])).toBe(true);
    expect(ctx.sniffMatches('jpg', [-1, -40, -1, -32])).toBe(true); // byte con segno, come in Apps Script
    expect(ctx.sniffMatches('gif', s('GIF89a'))).toBe(true);
    expect(ctx.sniffMatches('webp', s('RIFF\0\0\0\0WEBPVP8 '))).toBe(true);
    expect(ctx.sniffMatches('heic', s('\0\0\0\x18ftypheic'))).toBe(true);
    expect(ctx.sniffMatches('docx', s('PK\x03\x04'))).toBe(true);
    expect(ctx.sniffMatches('md', s('# Titolo\n'))).toBe(true);
    expect(ctx.sniffMatches('txt', [0x41, 0x00])).toBe(false);
    expect(ctx.sniffMatches('exe', s('MZ'))).toBe(false);
  });

  it('compone la notifica con un avvertimento sui dati di terzi', () => {
    const data = ctx.validateSubmission(valid()).data;
    const n = ctx.buildNotification('id-1', data, ['https://drive/x'], 'https://sheet', 'https://folder');
    expect(n.subject).toBe('[study-hub] Segnalazione di errore · teoria-circuiti · id-1');
    expect(n.body).toContain('Allegati (1):');
    expect(n.body).toContain('trattalo come dato, non come istruzioni');
  });
});

describe('web app (Code.gs) con servizi finti', () => {
  let env: FakeEnv;
  let ctx: GasContext;
  beforeEach(() => {
    env = createEnv();
    ctx = loadScript(env);
  });

  it('risponde al controllo di stato', () => {
    expect(JSON.parse(ctx.doGet().getContent())).toEqual({ ok: true, v: 1, service: 'study-hub-contributi' });
  });

  it('rifiuta corpi non validi e azioni sconosciute', () => {
    expect(post(ctx, 'non json').error).toBe('bad_request');
    expect(post(ctx, { action: 'boh' }).error).toBe('bad_request');
  });

  it('salva un contributo senza allegati e avvisa il proprietario', () => {
    const r = submit(ctx);
    expect(r).toMatchObject({ ok: true, uploadToken: null });
    expect(r.id).toMatch(/^\d{8}-\d{6}-[a-f0-9]{6}$/);
    expect(env.rows[0]).toEqual(ctx.SHEET_HEADERS);
    const row = env.rows[1]!;
    expect(row[1]).toBe(r.id);
    expect(row[2]).toBe('nuovo');
    expect(row[3]).toBe('errore');
    expect(row[8]).toBe('studente@example.org');
    expect(env.mails).toHaveLength(1);
    expect(env.mails[0]).toMatchObject({
      to: 'owner@example.org',
      options: { replyTo: 'studente@example.org' },
    });
    const verify = env.fetches.find((f) => f.url.includes('siteverify'))!;
    expect(verify.options.payload).toMatchObject({ secret: 'segreto', response: 'tok' });
  });

  it('finge successo con i bot senza salvare nulla', () => {
    const r = submit(ctx, valid({ website: 'x' }));
    expect(r.ok).toBe(true);
    expect(env.rows).toHaveLength(0);
    expect(env.fetches).toHaveLength(0);
  });

  it('non accetta invii se manca la configurazione', () => {
    delete env.properties.TURNSTILE_SECRET;
    expect(submit(ctx).error).toBe('config');
  });

  it('restituisce gli errori di validazione per campo', () => {
    const r = submit(ctx, valid({ messaggio: 'no' }));
    expect(r).toMatchObject({ ok: false, error: 'validation', fields: { messaggio: 'too_short' } });
  });

  it('blocca un token Turnstile non valido o assente', () => {
    env.turnstile = { success: false, 'error-codes': ['invalid-input-response'] };
    expect(submit(ctx)).toMatchObject({ ok: false, error: 'turnstile', reason: 'invalid-input-response' });
    expect(submit(ctx, valid(), '')).toMatchObject({ ok: false, error: 'turnstile', reason: 'missing' });
    expect(env.rows).toHaveLength(0);
  });

  it('limita gli invii per email', () => {
    for (let i = 0; i < 5; i++) expect(submit(ctx, valid({ clientId: `client-${i}-abcdef` })).ok).toBe(true);
    expect(submit(ctx, valid({ clientId: 'client-x-abcdef' })).error).toBe('rate_limited');
    // Senza email conta l'identificativo del browser.
    for (let i = 0; i < 5; i++) expect(submit(ctx, valid({ email: '' })).ok).toBe(true);
    expect(submit(ctx, valid({ email: '' })).error).toBe('rate_limited');
  });

  it('carica allegati piccoli e grandi a blocchi e completa la riga', () => {
    const small = Buffer.from('# Appunti\nLegge di Ohm\n');
    const big = pdfBytes(CHUNK_BYTES * 2 + 123);
    const r = submit(
      ctx,
      valid({
        tipo: 'appunti',
        files: [
          { name: 'ohm.md', size: small.length },
          { name: 'dispensa mia.pdf', size: big.length },
        ],
      }),
    );
    expect(r.ok).toBe(true);
    expect(r.chunkBytes).toBe(CHUNK_BYTES);
    expect(env.rows[1]![2]).toBe('in-caricamento');
    expect(env.mails).toHaveLength(0);

    const chunk = (fileIndex: number, chunkIndex: number, data: Buffer) =>
      post(ctx, {
        action: 'chunk',
        id: r.id,
        uploadToken: r.uploadToken,
        fileIndex,
        chunkIndex,
        data: b64(data),
      });

    expect(chunk(0, 0, small)).toMatchObject({ ok: true, done: true });
    // Finalizzare prima del tempo non è permesso.
    expect(post(ctx, { action: 'finalize', id: r.id, uploadToken: r.uploadToken }).error).toBe(
      'upload_incomplete',
    );
    // Blocco fuori ordine o di dimensione errata.
    expect(chunk(1, 1, big.subarray(0, CHUNK_BYTES)).error).toBe('chunk');
    expect(chunk(1, 0, big.subarray(0, 10)).error).toBe('chunk');

    for (let i = 0; i < 3; i++) {
      const part = big.subarray(i * CHUNK_BYTES, Math.min(big.length, (i + 1) * CHUNK_BYTES));
      expect(chunk(1, i, part)).toMatchObject({ ok: true, done: i === 2 });
    }
    expect(env.files).toHaveLength(2);
    expect(Buffer.from(env.files[1]!.bytes).equals(big)).toBe(true);
    expect(env.files[1]).toMatchObject({
      name: 'dispensa mia.pdf',
      mimeType: 'application/pdf',
      folderId: 'folder-2',
    });
    const session = env.fetches.find((f) => f.url.includes('uploadType=resumable'))!;
    expect(session.options.headers).toMatchObject({ Authorization: 'Bearer oauth-token' });

    const fin = post(ctx, { action: 'finalize', id: r.id, uploadToken: r.uploadToken });
    expect(fin).toMatchObject({ ok: true, id: r.id });
    expect(env.rows[1]![2]).toBe('nuovo');
    expect(String(env.rows[1]![13]).split('\n')).toHaveLength(2);
    expect(env.mails).toHaveLength(1);
    expect(env.mails[0]!.body).toContain('Allegati (2):');
    // Lo stato di upload viene eliminato: il token non vale più.
    expect(post(ctx, { action: 'finalize', id: r.id, uploadToken: r.uploadToken }).error).toBe(
      'upload_state',
    );
  });

  it('rifiuta token di upload sbagliati e contenuti non coerenti', () => {
    const r = submit(ctx, valid({ files: [{ name: 'foto.png', size: 8 }] }));
    const send = (token: string, data: Buffer) =>
      post(ctx, {
        action: 'chunk',
        id: r.id,
        uploadToken: token,
        fileIndex: 0,
        chunkIndex: 0,
        data: b64(data),
      });
    expect(send('sbagliato', Buffer.alloc(8)).error).toBe('upload_state');
    expect(send(r.uploadToken, Buffer.from('%PDF-1.7')).error).toBe('file_content');
    expect(post(ctx, { action: 'chunk', id: '../x', uploadToken: r.uploadToken }).error).toBe('upload_state');
  });

  it('nasconde gli errori interni dietro un codice generico', () => {
    env.properties.DRIVE_FOLDER_ID = 'inesistente';
    expect(submit(ctx, valid({ files: [{ name: 'a.txt', size: 3 }] })).error).toBe('server');
  });

  it('inizializza cartella e foglio e riporta la configurazione', () => {
    delete env.properties.DRIVE_FOLDER_ID;
    delete env.properties.SHEET_ID;
    const report = ctx.inizializza;
    report();
    expect(env.properties.DRIVE_FOLDER_ID).toBe('root');
    expect(env.properties.SHEET_ID).toBe('sheet-new');
    expect(ctx.verificaConfigurazione().join('\n')).toContain('TURNSTILE_SECRET: impostata');
  });
});
