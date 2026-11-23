import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as St from '../../../src/engine/studied';
import * as S from '../../../src/engine/storage';
import * as X from '../../../src/engine/exportImport';
import { decodePasted, encodeForQr } from '../../../src/engine/qr';
import { newCard } from '../../../src/engine/fsrs';

beforeEach(() => S.setStorageBackend(S.createMemoryBackend()));
afterEach(() => S.setStorageBackend(undefined));

const DAY = 86_400_000;
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

describe('stato «studiato»', () => {
  it('segna, annulla e salva con data e versione', () => {
    expect(St.loadStudied('c')).toEqual({ v: 1, topics: {} });
    St.saveStudied('c', ['alfa'], true, 5);
    expect(S.read('c', 'studied', null)).toEqual({ v: 1, topics: { alfa: 5 } });
    // segnare di nuovo non cambia la data della prima segnatura
    St.saveStudied('c', ['alfa', 'beta'], true, 9);
    expect(St.loadStudied('c').topics).toEqual({ alfa: 5, beta: 9 });
    expect(St.isStudied(St.loadStudied('c'), 'beta')).toBe(true);
    St.saveStudied('c', ['alfa'], false, 10);
    expect(St.loadStudied('c').topics).toEqual({ beta: 9 });
    expect(St.isStudied(St.loadStudied('c'), 'alfa')).toBe(false);
  });

  it('normalizza valori malformati e forme compatte', () => {
    expect(St.sanitizeStudied(null)).toEqual({ v: 1, topics: {} });
    expect(St.sanitizeStudied('x')).toEqual({ v: 1, topics: {} });
    expect(St.sanitizeStudied({ v: 1, topics: { a: 3, b: 'no', c: -1, d: NaN } }).topics).toEqual({ a: 3 });
    expect(St.sanitizeStudied(['a', 4, ''], 7).topics).toEqual({ a: 7 });
    expect(St.sanitizeStudied(['a']).topics).toEqual({ a: 1 });
    expect(St.sanitizeStudied({ a: 2, v: 1 }).topics).toEqual({ a: 2 });
    // un valore corrotto nello storage diventa lo stato vuoto
    S.write('c', 'studied', 'rotto');
    expect(St.loadStudied('c')).toEqual({ v: 1, topics: {} });
  });

  it('migra gli argomenti segnati nei siti originali (progress.read)', () => {
    S.write('c', 'progress', { v: 1, exercises: {}, read: { alfa: 100, beta: 200 } });
    // lettura senza scrivere
    expect(St.loadStudied('c').topics).toEqual({ alfa: 100, beta: 200 });
    expect(S.read('c', 'studied', null)).toBeNull();
    // la prima scrittura parte dai dati migrati
    St.saveStudied('c', ['beta'], false, 300);
    expect(S.read('c', 'studied', null)).toEqual({ v: 1, topics: { alfa: 100 } });
    // da qui `progress.read` non si consulta più: l'annullamento resta
    expect(St.loadStudied('c').topics).toEqual({ alfa: 100 });
  });

  it('fusione: unione con la prima data', () => {
    const a = { v: 1 as const, topics: { x: 5, y: 1 } };
    const b = { v: 1 as const, topics: { x: 3, z: 8 } };
    expect(St.mergeStudied(a, b).topics).toEqual({ x: 3, y: 1, z: 8 });
  });
});

describe('capitoli e indice', () => {
  const topics = [
    { id: 'a', group: { it: 'Uno', en: 'One' } },
    { id: 'b', group: { it: 'Uno', en: 'One' } },
    { id: 'c', group: { it: 'Due' } },
    { id: 'd' },
  ];
  it('studiedByChapter conta per capitolo', () => {
    const s = St.withStudied(St.emptyStudied(), ['a', 'b', 'd'], true, 1);
    const ch = St.studiedByChapter(topics, s, 'en');
    expect(ch.map((c) => [c.title, c.studied, c.total, c.done])).toEqual([
      ['One', 2, 2, true],
      ['Due', 0, 1, false],
      [undefined, 1, 1, true],
    ]);
    expect(ch[0]!.ids).toEqual(['a', 'b']);
    expect(St.studiedByChapter([{ id: 'x', group: 'G' }], St.emptyStudied())[0]!.title).toBe('G');
    expect(St.studiedByChapter([], s)).toEqual([]);
  });
  it('firstUnstudied propone il primo argomento non studiato', () => {
    const s = St.withStudied(St.emptyStudied(), ['a'], true, 1);
    expect(St.firstUnstudied(['a', 'b', 'c'], s)).toBe('b');
    expect(St.firstUnstudied(['a'], s)).toBeUndefined();
  });
});

describe('ripasso', () => {
  const cards = [
    { id: 'c1', topic: 'a' },
    { id: 'c2', topic: 'a' },
    { id: 'c3', topic: 'b' },
    { id: 'c4', topic: 'z' },
  ];
  it('le carte nuove entrano dal giorno dopo la segnatura; le già viste restano', () => {
    const marked = at(2026, 11, 23, 22);
    expect(St.reviewFrom(marked)).toBe(new Date(2026, 10, 24).getTime());
    const s = St.withStudied(St.emptyStudied(), ['a'], true, marked);
    const seen = { c4: newCard(0) };
    // stesso giorno: le carte di «a» aspettano, la già vista di «z» resta
    expect(St.reviewableCards(cards, seen, s, marked + 1000)).toEqual({ ids: ['c4'], waiting: 2 });
    // il giorno dopo entrano
    expect(St.reviewableCards(cards, seen, s, at(2026, 11, 24, 0) + 1)).toEqual({
      ids: ['c1', 'c2', 'c4'],
      waiting: 0,
    });
    expect(St.reviewableCards(cards, {}, St.emptyStudied(), marked + DAY)).toEqual({ ids: [], waiting: 0 });
  });
});

describe('export/import e QR', () => {
  it('l’area studied si esporta, si importa e passa dal QR', async () => {
    St.saveStudied('fisica-2', ['gauss'], true, 42);
    const file = X.buildExport(new Date('2026-11-23T10:00:00Z'));
    expect(file.data['sh:v1:fisica-2:studied']).toEqual({ v: 1, topics: { gauss: 42 } });
    expect(X.LOCAL_ONLY_AREAS).not.toContain(St.STUDIED_AREA);
    const frames = await encodeForQr(X.serializeExport(file));
    const text = await decodePasted(frames!.join('\n'));
    const v = X.validateExport(text);
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    S.setStorageBackend(S.createMemoryBackend());
    X.applyImport(v.file, 'replace');
    expect(St.loadStudied('fisica-2').topics).toEqual({ gauss: 42 });
  });
  it('importazione: ripulisce e fonde con i dati locali (anche migrati)', () => {
    const v = X.validateExport({
      format: 'study-hub',
      version: 1,
      data: { 'sh:v1:c:studied': { v: 1, topics: { a: 10, b: 'x', c: 30 } } },
    });
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    expect(v.file.data['sh:v1:c:studied']).toEqual({ v: 1, topics: { a: 10, c: 30 } });
    // locale solo in progress.read (migrazione): non si perde
    S.write('c', 'progress', { v: 1, exercises: {}, read: { m: 5, a: 20 } });
    X.applyImport(v.file, 'merge');
    expect(St.loadStudied('c').topics).toEqual({ a: 10, c: 30, m: 5 });
    // con un'area già salvata si fonde
    St.saveStudied('c', ['n'], true, 50);
    X.applyImport(v.file, 'merge');
    expect(St.loadStudied('c').topics).toEqual({ a: 10, c: 30, m: 5, n: 50 });
    expect(X.mergeArea('studied', null, { v: 1, topics: { q: 1 } })).toEqual({ v: 1, topics: { q: 1 } });
  });
});
