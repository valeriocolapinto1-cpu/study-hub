import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as X from '../../../src/engine/exportImport';
import * as Q from '../../../src/engine/qr';
import * as R from '../../../src/engine/rich';
import { MIGRATIONS, jsonTransform, registerMigration, runMigrations } from '../../../src/engine/migrate';
import * as S from '../../../src/engine/storage';
import { saveAttempt, saveReview } from '../../../src/engine/progress';
import { saveNote } from '../../../src/engine/notes';

beforeEach(() => S.setStorageBackend(S.createMemoryBackend()));
afterEach(() => S.setStorageBackend(undefined));

describe('export/import', () => {
  it('andata e ritorno, esclude le migrazioni', () => {
    saveAttempt('fisica-2', 'e1', { at: 1, score: 1 });
    saveReview('fisica-2', 'c1', 3, 1000);
    saveNote('fisica-2', 'n1', 'testo', 5);
    S.write('global', 'examDates', { 'fisica-2': '2027-01-20' });
    S.write('global', 'migrations', ['hub/lang']);
    S.write('fisica-2', 'exam', { v: 1, history: [] });
    const file = X.buildExport(new Date('2026-11-05T10:00:00Z'));
    expect(file.exportedAt).toBe('2026-11-05T10:00:00.000Z');
    expect(Object.keys(file.data)).not.toContain('sh:v1:global:migrations');
    expect(X.exportFileName(new Date('2026-11-05T10:00:00Z'))).toBe('study-hub-2026-11-05.json');
    const v = X.validateExport(X.serializeExport(file));
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    expect(X.summarize(v.file)['fisica-2']).toEqual(['exam', 'notes', 'progress', 'srs']);
    S.setStorageBackend(S.createMemoryBackend());
    S.write('teoria-circuiti', 'progress', { v: 1, exercises: {}, read: {} });
    const rep = X.applyImport(v.file, 'replace');
    expect(rep.written).toHaveLength(5);
    expect(S.listKeys('teoria-circuiti')).toEqual([]);
    expect(S.read('global', 'examDates', {})).toEqual({ 'fisica-2': '2027-01-20' });
  });
  it('validazione', () => {
    expect(X.validateExport('{')).toEqual({ ok: false, error: 'json' });
    expect(X.validateExport(5)).toEqual({ ok: false, error: 'format' });
    expect(X.validateExport({ format: 'altro', data: {} })).toEqual({ ok: false, error: 'format' });
    expect(X.validateExport({ format: 'study-hub', version: 99, data: {} })).toEqual({
      ok: false,
      error: 'version',
    });
    expect(
      X.validateExport({ format: 'study-hub', version: 1, data: { foo: 1, 'sh:v1:global:migrations': [] } }),
    ).toEqual({ ok: false, error: 'empty' });
    const v = X.validateExport({
      format: 'study-hub',
      version: 1,
      data: { foo: 1, 'sh:v1:x:srs': { cards: { a: 'rotta' } } },
    });
    expect(v.ok && v.warnings).toEqual(['foo']);
    expect(v.ok && v.file.data['sh:v1:x:srs']).toEqual({ v: 1, cards: {}, log: [] });
  });
  it('fusione area per area', () => {
    saveAttempt('c', 'e1', { at: 1, score: 0.5 });
    saveReview('c', 'k', 3, 1000);
    saveNote('c', 'n', 'vecchia', 1);
    saveNote('c', 'm', 'locale', 50);
    S.write('c', 'exam', { v: 1, history: [{ id: 'a', at: 1, percent: 10 }] });
    S.write('global', 'examDates', { c: '2027-01-01' });
    S.write('global', 'theme', 'dark');
    const incoming = X.validateExport({
      format: 'study-hub',
      version: 1,
      data: {
        'sh:v1:c:progress': {
          exercises: {
            e1: { attempts: [{ at: 2, score: 1 }], best: 1 },
            e2: { attempts: [{ at: 3, score: 1 }], best: 1 },
          },
          read: { t: 4 },
        },
        'sh:v1:c:srs': {
          cards: {
            k: { due: 9, stability: 9, difficulty: 5, reps: 3, lapses: 0, state: 'review', lastReview: 5000 },
          },
          log: [{ id: 'k', rating: 4, at: 5000 }],
        },
        'sh:v1:c:notes': {
          notes: {
            n: { text: 'nuova', createdAt: 1, updatedAt: 10 },
            m: { text: 'remota', createdAt: 1, updatedAt: 5 },
          },
        },
        'sh:v1:c:exam': { history: [{ id: 'b', at: 2, percent: 20 }] },
        'sh:v1:global:examDates': { c: '2099-01-01', d: '2027-02-02' },
        'sh:v1:global:theme': 'light',
        'sh:v1:z:settings': { a: 1 },
      },
    });
    expect(incoming.ok).toBe(true);
    if (!incoming.ok) return;
    X.applyImport(incoming.file, 'merge');
    const p = S.read<any>('c', 'progress', null);
    expect(p.exercises.e1.attempts).toHaveLength(2);
    expect(p.exercises.e1.best).toBe(1);
    expect(p.exercises.e2).toBeTruthy();
    expect(S.read<any>('c', 'srs', null).cards.k.reps).toBe(3);
    expect(S.read<any>('c', 'srs', null).log).toHaveLength(2);
    const n = S.read<any>('c', 'notes', null).notes;
    expect(n.n.text).toBe('nuova');
    expect(n.m.text).toBe('locale');
    expect(S.read<any>('c', 'exam', null).history.map((r: any) => r.id)).toEqual(['a', 'b']);
    expect(S.read('global', 'examDates', {})).toEqual({ c: '2027-01-01', d: '2027-02-02' });
    expect(S.read('global', 'theme', '')).toBe('dark');
    expect(S.read('z', 'settings', null)).toEqual({ a: 1 });
    expect(X.mergeArea('examDates', 'x', { a: 1 })).toBe('x');
  });
});

describe('qr', () => {
  it('base64url e crc', () => {
    const bytes = new Uint8Array([0, 251, 255, 62, 63]);
    expect(Q.fromBase64Url(Q.toBase64Url(bytes))).toEqual(bytes);
    expect(() => Q.fromBase64Url('a+b')).toThrow();
    expect(Q.crc32('123456789')).toBe('cbf43926');
  });
  it('compressione e frame', async () => {
    const text = JSON.stringify({
      format: 'study-hub',
      data: Array.from({ length: 400 }, (_, i) => ({ i, t: `voce ${i % 7}` })),
    });
    const z = await Q.compressText(text);
    expect(z[0]).toBe('z');
    expect(z.length).toBeLessThan(text.length);
    expect(await Q.decompressText(z)).toBe(text);
    expect(await Q.decompressText(`r${Q.toBase64Url(new TextEncoder().encode('ciao'))}`)).toBe('ciao');
    await expect(Q.decompressText('xabc')).rejects.toThrow();
    const frames = (await Q.encodeForQr(text, { frameChars: 100 }))!;
    expect(frames.length).toBeGreaterThan(1);
    const c = new Q.FrameCollector();
    const shuffled = [...frames].reverse();
    expect(c.add('rumore')).toBe(false);
    expect(c.add(shuffled[0]!)).toBe(true);
    expect(c.add(shuffled[0]!)).toBe(false);
    expect(c.complete).toBe(false);
    expect(await Q.decodeFromCollector(c)).toBeNull();
    expect(c.missing.length).toBe(frames.length - 1);
    for (const f of shuffled.slice(1)) c.add(f);
    expect(c.received).toBe(c.expected);
    expect(await Q.decodeFromCollector(c)).toBe(text);
    expect(await Q.decodePasted(frames.join('\n'))).toBe(text);
    expect(await Q.decodePasted(' {"a":1}')).toBe('{"a":1}');
    expect(await Q.encodeForQr(text, { frameChars: 10, maxFrames: 3 })).toBeNull();
    // frame di un altro messaggio azzera la raccolta
    const other = Q.splitFrames('zabc', 2);
    c.add(other[0]!);
    expect(c.expected).toBe(2);
    expect(c.received).toBe(1);
    // CRC sbagliato
    const bad = new Q.FrameCollector();
    bad.add('SH1:1/1:00000000:abc');
    expect(bad.payload()).toBeNull();
  });
  it('parseFrame e svg', () => {
    expect(Q.parseFrame('SH1:2/3:0000abcd:xyz')).toEqual({
      index: 2,
      total: 3,
      crc: '0000abcd',
      chunk: 'xyz',
    });
    expect(Q.parseFrame('SH1:4/3:0000abcd:xyz')).toBeNull();
    expect(Q.parseFrame('SH1:0/3:0000abcd:xyz')).toBeNull();
    const svg = Q.matrixToSvg({ size: 3, isDark: (r, c) => (r + c) % 2 === 0 }, 'QR <1>');
    expect(svg).toContain('<title>QR &lt;1&gt;</title>');
    expect(svg).toContain('M4 4h1v1h-1z');
    expect(Q.compressionSupported()).toBe(true);
  });
});

describe('rich', () => {
  const fakeMath: R.MathRenderer = (tex, display) => `[${display ? 'D' : 'I'}:${tex}]`;
  it('markdown minimo con escape', () => {
    expect(R.renderRich('Ciao **mondo** e *tu* <b>x</b>')).toBe(
      '<p>Ciao <strong>mondo</strong> e <em>tu</em> &lt;b&gt;x&lt;/b&gt;</p>',
    );
    expect(R.renderRich('a\n\n- uno\n- due\n\n1. a\n2) b')).toBe(
      '<p>a</p><ul><li>uno</li><li>due</li></ul><ol><li>a</li><li>b</li></ol>',
    );
    expect(R.renderRich('`x<y` e _it_', fakeMath, { inlineOnly: true })).toBe(
      '<code>x&lt;y</code> e <em>it</em>',
    );
    expect(R.renderRich('riga  \naccapo')).toBe('<p>riga<br>accapo</p>');
  });
  it('matematica', () => {
    expect(R.renderRich('Vale $V = RI$ sempre', fakeMath)).toBe('<p>Vale [I:V = RI] sempre</p>');
    expect(R.renderRich('$$\\int f$$', fakeMath)).toBe('<span class="math-display">[D:\\int f]</span>');
    expect(R.renderRich('\\(a*b*c\\) e \\[x\\]', fakeMath)).toBe(
      '<p>[I:a*b*c] e <span class="math-display">[D:x]</span></p>',
    );
    expect(R.renderRich('costa 5$ e 3$', fakeMath)).toBe('<p>costa 5$ e 3$</p>');
    expect(R.renderRich('$x<1$')).toContain('<span class="math-tex">x&lt;1</span>');
    expect(
      R.renderRich('$x$', () => {
        throw new Error('no');
      }),
    ).toContain('math-tex');
    expect(R.plainText('**Legge** di $V=RI$ e *altro*')).toBe('Legge di V=RI e altro');
  });
});

describe('migrazioni e storage (estensioni)', () => {
  it('registerMigration e jsonTransform', () => {
    const m = registerMigration({
      id: 'test/x',
      legacyKey: 'old-x',
      scope: 'esempio',
      area: 'settings',
      transform: jsonTransform((v) => (v as { a: number }).a),
    });
    expect(registerMigration(m)).toBe(m);
    expect(() => registerMigration({ ...m })).toThrow();
    S.writeRaw('old-x', '{"a":3}');
    expect(runMigrations([m]).applied).toEqual(['test/x']);
    expect(S.read('esempio', 'settings', 0)).toBe(3);
    expect(jsonTransform((v) => v)('{')).toBeUndefined();
    MIGRATIONS.splice(MIGRATIONS.indexOf(m), 1);
  });
  it('readAll, clearScope, usage, disponibilità', () => {
    S.write('a', 'progress', { x: 1 });
    S.write('b', 'srs', [1]);
    S.writeRaw('sh:v1:b:rotto', '{');
    expect(Object.keys(S.readAll())).toEqual(['sh:v1:a:progress', 'sh:v1:b:srs']);
    expect(S.usageBytes()).toBeGreaterThan(0);
    expect(S.isStorageAvailable()).toBe(true);
    expect(S.clearScope('b')).toBe(2);
    expect(S.listKeys()).toEqual(['sh:v1:a:progress']);
    S.setStorageBackend(null);
    expect(S.isStorageAvailable()).toBe(false);
    const throwing = {
      ...S.createMemoryBackend(),
      setItem: () => {
        throw new Error('quota');
      },
    };
    S.setStorageBackend(throwing as S.StorageBackend);
    expect(S.isStorageAvailable()).toBe(false);
  });
});
