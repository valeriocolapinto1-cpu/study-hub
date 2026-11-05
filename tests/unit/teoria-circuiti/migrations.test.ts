import { beforeEach, describe, expect, it } from 'vitest';
import { setStorageBackend, read, GLOBAL_SCOPE } from '../../../src/engine/storage';
import { MIGRATIONS, runMigrations } from '../../../src/engine/migrate';
import '../../../src/courses/teoria-circuiti/migrations';

function memory(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  };
}

describe('migrazioni di Teoria dei Circuiti', () => {
  let ls: Storage;
  beforeEach(() => {
    ls = memory();
    setStorageBackend(ls);
  });
  it('sono registrate', () => {
    expect(MIGRATIONS.filter((m) => m.id.startsWith('teoria-circuiti/')).length).toBe(6);
  });
  it('portano segnalibri, argomenti studiati, quiz, appunti, data d’esame e tema senza cancellare le chiavi legacy', () => {
    ls.setItem('tdc:formulario', JSON.stringify({ bookmarks: ['kcl', 'tellegen'] }));
    ls.setItem(
      'tdc:progress',
      JSON.stringify({
        'I-02': { stato: 'studiato', data: '2026-10-01' },
        'II-05': { stato: 'non iniziato' },
      }),
    );
    ls.setItem(
      'tdc:quiz.log',
      JSON.stringify([
        { id: 'Q-I-005', ok: false, data: '2026-10-02T10:00:00Z' },
        { id: 'Q-I-005', ok: true, data: '2026-10-03T10:00:00Z' },
      ]),
    );
    ls.setItem(
      'tdc:notes',
      JSON.stringify([
        {
          id: 'n1',
          titolo: 'Tellegen',
          testo: 'ricordare il segno',
          argomenti: ['II-05'],
          creato: '2026-10-01T00:00:00Z',
          modificato: '2026-10-01T00:00:00Z',
        },
      ]),
    );
    ls.setItem('tdc:piano', JSON.stringify({ esame: '2027-01-20', oreSettimana: 8 }));
    ls.setItem('tdc:settings', JSON.stringify({ tema: 'scuro' }));
    ls.setItem('tdc:secret.aiKey', JSON.stringify('sk-xxx'));
    const r = runMigrations();
    expect(r.failed).toEqual([]);
    expect(read('teoria-circuiti', 'formulary', {})).toEqual({ bookmarks: ['kcl', 'tellegen'] });
    const p = read<{
      read: Record<string, number>;
      exercises: Record<string, { best: number; attempts: unknown[] }>;
    }>('teoria-circuiti', 'progress', { read: {}, exercises: {} });
    expect(Object.keys(p.read)).toEqual(['leggi-di-kirchhoff']);
    expect(p.exercises['q-i-005']!.best).toBe(1);
    expect(p.exercises['q-i-005']!.attempts).toHaveLength(2);
    const n = read<{ notes: Record<string, { text: string; page?: string }> }>('teoria-circuiti', 'notes', {
      notes: {},
    });
    expect(Object.values(n.notes)[0]!.page).toBe('anno-2/teoria-circuiti/teoria/teorema-di-tellegen');
    expect(read(GLOBAL_SCOPE, 'examDates', {})).toEqual({ 'teoria-circuiti': '2027-01-20' });
    expect(read(GLOBAL_SCOPE, 'theme', null)).toBe('dark');
    expect(ls.getItem('tdc:progress')).not.toBeNull();
    expect(
      JSON.stringify(Object.fromEntries([...Array(ls.length).keys()].map((i) => [ls.key(i), 1]))),
    ).not.toContain('sh:v1:teoria-circuiti:secret');
    // idempotente
    expect(runMigrations().applied).toEqual([]);
  });
});
