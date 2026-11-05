import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as N from '../../../src/engine/notes';
import * as P from '../../../src/engine/progress';
import { createMemoryBackend, setStorageBackend, write } from '../../../src/engine/storage';

beforeEach(() => setStorageBackend(createMemoryBackend()));
afterEach(() => setStorageBackend(undefined));

describe('appunti', () => {
  it('crea, aggiorna, cancella', () => {
    let s = N.saveNote('fisica-2', 'teoria/gauss/p1', 'ciao', 10, {
      page: 'anno-2/fisica-2/teoria/gauss',
      label: 'Gauss',
    });
    expect(s.notes['teoria/gauss/p1']).toMatchObject({
      text: 'ciao',
      createdAt: 10,
      updatedAt: 10,
      label: 'Gauss',
    });
    s = N.saveNote('fisica-2', 'teoria/gauss/p1', 'ciao 2', 20);
    expect(s.notes['teoria/gauss/p1']).toMatchObject({
      createdAt: 10,
      updatedAt: 20,
      page: 'anno-2/fisica-2/teoria/gauss',
    });
    N.saveNote('global', 'nota', 'globale', 30);
    expect(N.allNotes().map((n) => n.id)).toEqual(['nota', 'teoria/gauss/p1']);
    s = N.saveNote('fisica-2', 'teoria/gauss/p1', '   ', 40);
    expect(s.notes).toEqual({});
    expect(() => N.withNote(N.emptyNotes(), 'Non Valido', 'x', 1)).toThrow();
    expect(N.withNote(N.emptyNotes(), 'a', 'x'.repeat(20_000), 1).notes.a!.text.length).toBe(
      N.MAX_NOTE_LENGTH,
    );
  });
  it('ricerca, markdown, sanificazione', () => {
    const entries: N.NoteEntry[] = [
      { scope: 'fisica-2', id: 'a', text: 'Teorema di Gauss', createdAt: 1, updatedAt: 1 },
      {
        scope: 'teoria-circuiti',
        id: 'b',
        text: 'Thévenin',
        label: 'Equivalenti',
        createdAt: 1,
        updatedAt: 2,
      },
    ];
    expect(N.searchNotes(entries, 'thevenin').map((e) => e.id)).toEqual(['b']);
    expect(N.searchNotes(entries, ' ')).toHaveLength(2);
    const md = N.notesToMarkdown(entries, { 'fisica-2': 'Fisica 2' });
    expect(md).toContain('## Fisica 2');
    expect(md).toContain('## teoria-circuiti');
    expect(md).toContain('### Equivalenti');
    expect(N.sanitizeNotes(null)).toEqual(N.emptyNotes());
    const dirty = {
      notes: {
        ok: { text: 't', createdAt: 1, updatedAt: 1, page: 'p', label: 'l' },
        'BAD ID': { text: 't', createdAt: 1, updatedAt: 1 },
        vuoto: { text: ' ', createdAt: 1, updatedAt: 1 },
        rotto: { text: 1 },
      },
    };
    expect(Object.keys(N.sanitizeNotes(dirty).notes)).toEqual(['ok']);
    write('fisica-2', 'progress', {});
    expect(N.allNotes()).toEqual([]);
  });
});

describe('progressi', () => {
  it('tentativi e stato', () => {
    expect(P.exerciseStatus(undefined)).toBe('nuovo');
    let s = P.saveAttempt('c', 'e1', { at: 1, score: 0.5 });
    expect(P.exerciseStatus(s.exercises.e1)).toBe('tentato');
    s = P.saveAttempt('c', 'e1', { at: 2, score: 1, revealed: true });
    expect(s.exercises.e1!.best).toBe(0.5);
    s = P.saveAttempt('c', 'e1', { at: 3, score: 2 });
    expect(P.exerciseStatus(s.exercises.e1)).toBe('risolto');
    for (let i = 0; i < 30; i++) s = P.saveAttempt('c', 'e1', { at: 10 + i, score: 0 });
    expect(s.exercises.e1!.attempts).toHaveLength(P.MAX_ATTEMPTS);
    expect(P.loadProgress('c').exercises.e1!.last).toBe(39);
    P.setTopicRead('c', 'alfa', true, 5);
    expect(P.loadProgress('c').read.alfa).toBe(5);
    P.setTopicRead('c', 'alfa', false, 6);
    expect(P.loadProgress('c').read.alfa).toBeUndefined();
  });
  it('sanificazione', () => {
    expect(P.sanitizeProgress('x')).toEqual(P.emptyProgress());
    const s = P.sanitizeProgress({
      exercises: {
        a: { attempts: [{ at: 1, score: 3 }, { at: 'x' }], best: 'x' },
        b: { attempts: [] },
        c: null,
        d: { attempts: 'x' },
      },
      read: { t: 1, u: 'x' },
    });
    expect(s.exercises.a).toEqual({ attempts: [{ at: 1, score: 1 }], best: 0, last: 1 });
    expect(Object.keys(s.exercises)).toEqual(['a']);
    expect(s.read).toEqual({ t: 1 });
    expect(P.withAttempt(P.emptyProgress(), 'z', { at: 1, score: NaN }).exercises.z!.best).toBe(0);
  });
  it('ripasso', () => {
    const day = new Date(2026, 10, 5, 12).getTime();
    P.saveReview('c', 'k1', 3, day);
    P.saveReview('c', 'k1', 1, day + 1000);
    const s = P.loadSrs('c');
    expect(s.cards.k1!.reps).toBe(2);
    expect(P.reviewsOn(s, new Date(day))).toBe(2);
    expect(P.reviewsOn(s, new Date(day + 86_400_000))).toBe(0);
    expect(P.sanitizeSrs(null)).toEqual(P.emptySrs());
    expect(
      P.sanitizeSrs({
        cards: { a: { bad: 1 } },
        log: [
          { id: 'a', rating: 9, at: 1 },
          { id: 'a', rating: 2, at: 1 },
        ],
      }),
    ).toEqual({ v: 1, cards: {}, log: [{ id: 'a', rating: 2, at: 1 }] });
  });
});
