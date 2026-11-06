import { describe, expect, it } from 'vitest';
import {
  ACCEPT,
  CHUNK_BYTES,
  buildMailto,
  chunksOf,
  formatBytes,
  isAllowedFile,
  prefillFromQuery,
  validateFields,
  validateFiles,
  type ContribFields,
} from '../../../src/lib/contribute/rules';
import { texts } from '../../../src/i18n';

const ok: ContribFields = {
  tipo: 'errore',
  corso: 'fisica-1',
  pagina: '/study-hub/it/anno-1/fisica-1/',
  messaggio: 'Il segno nella seconda equazione è sbagliato.',
  email: '',
  nome: '',
  consensoPrivacy: true,
  consensoDiritti: true,
  consensoPubblicazione: true,
};

describe('regole del modulo Contribuisci', () => {
  it('accetta un invio corretto e segnala i campi sbagliati', () => {
    expect(validateFields(ok)).toEqual({});
    expect(
      validateFields({ ...ok, messaggio: ' ', email: 'x@', consensoDiritti: false, pagina: 'http://x' }, [
        { name: 'a.zip', size: 3 },
      ]),
    ).toEqual({
      messaggio: 'required',
      email: 'invalid',
      consensoDiritti: 'required',
      pagina: 'invalid',
      files: 'type',
    });
    expect(validateFields({ ...ok, messaggio: 'corto' }).messaggio).toBe('too_short');
  });

  it('controlla gli allegati', () => {
    expect(isAllowedFile('Appunti.TEX')).toBe(true);
    expect(isAllowedFile('archivio.zip')).toBe(false);
    expect(ACCEPT).toContain('.pdf');
    expect(ACCEPT).not.toContain('.zip');
    expect(validateFiles([{ name: 'a.pdf', size: 0 }])).toBe('empty');
    expect(validateFiles(Array.from({ length: 11 }, () => ({ name: 'a.png', size: 1 })))).toBe('too_many');
    expect(validateFiles([{ name: 'a.pdf', size: 26 * 1024 * 1024 }])).toBe('too_large');
    expect(validateFiles([{ name: 'a.pdf', size: 25 * 1024 * 1024 }])).toBeNull();
  });

  it('precompila solo valori validi dalla query', () => {
    expect(
      prefillFromQuery('?corso=fisica-1&pagina=%2Fstudy-hub%2Fit%2F&tipo=miglioria', ['fisica-1']),
    ).toEqual({
      corso: 'fisica-1',
      pagina: '/study-hub/it/',
      tipo: 'miglioria',
    });
    expect(prefillFromQuery('?corso=boh&pagina=javascript:x&tipo=spam', ['fisica-1'])).toEqual({});
  });

  it('prepara l’email di ripiego', () => {
    const url = buildMailto(
      'a@b.it',
      'Contributo',
      { ...ok, nome: 'Anna' },
      { type: 'Tipo', course: 'Corso', page: 'Pagina', name: 'Nome', attach: '(allegati)' },
      true,
    );
    expect(url.startsWith('mailto:a@b.it?subject=')).toBe(true);
    const q = new URLSearchParams(url.slice(url.indexOf('?')));
    expect(q.get('subject')).toBe('Contributo [errore] fisica-1');
    expect(q.get('body')).toBe(
      'Tipo: errore\nCorso: fisica-1\nPagina: /study-hub/it/anno-1/fisica-1/\nNome: Anna\n\nIl segno nella seconda equazione è sbagliato.\n\n(allegati)',
    );
  });

  it('formatta le dimensioni e divide i file in blocchi base64', () => {
    expect(formatBytes(500, 'it')).toBe('500 B');
    expect(formatBytes(2048, 'en')).toBe('2 KB');
    expect(formatBytes(1.5 * 1024 * 1024, 'it')).toBe('1,5 MB');
    const buf = new Uint8Array(CHUNK_BYTES + 5).map((_, i) => i % 251);
    const parts = [...chunksOf(buf.buffer)];
    expect(parts).toHaveLength(2);
    const back = Buffer.concat(parts.map((p) => Buffer.from(p, 'base64')));
    expect(back.equals(Buffer.from(buf))).toBe(true);
    expect([...chunksOf(new ArrayBuffer(0))]).toEqual(['']);
  });

  it('passa alle isole solo i testi con il prefisso, in entrambe le lingue', () => {
    const it = texts('it', 'cf.');
    const en = texts('en', 'cf.');
    expect(Object.keys(it).sort()).toEqual(Object.keys(en).sort());
    expect(it.submit).toBe('Invia il contributo');
    expect(en.submit).toBe('Send the contribution');
    expect(Object.keys(it).some((k) => k.startsWith('cf.'))).toBe(false);
  });
});
