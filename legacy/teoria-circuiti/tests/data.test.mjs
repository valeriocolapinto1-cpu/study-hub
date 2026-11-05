import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const J = (p) => JSON.parse(readFileSync(new URL('../' + p, import.meta.url), 'utf8'));

test('syllabus: almeno 45 foglie, id unici, prerequisiti validi, blocchi noti', () => {
  const s = J('data/syllabus.json');
  assert.ok(s.argomenti.length >= 45, 'foglie: ' + s.argomenti.length);
  const ids = s.argomenti.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length);
  const bl = new Set(s.blocchi.map((b) => b.id));
  assert.equal(bl.size, 6);
  for (const a of s.argomenti) {
    assert.ok(bl.has(a.blocco), a.id);
    assert.ok(a.titolo && a.pagina && Array.isArray(a.tag) && a.tag.length, a.id);
    assert.ok([1, 2, 3].includes(a.peso), a.id);
    for (const p of a.prerequisiti) assert.ok(ids.includes(p), `${a.id} -> ${p}`);
    assert.ok(!a.pagina.startsWith('/') && !a.pagina.includes('://'), 'percorso non relativo: ' + a.id);
  }
});

test('syllabus: nessun ciclo nei prerequisiti', () => {
  const s = J('data/syllabus.json');
  const m = new Map(s.argomenti.map((a) => [a.id, a.prerequisiti]));
  const state = new Map();
  const visit = (id) => {
    if (state.get(id) === 1) throw new Error('ciclo in ' + id);
    if (state.get(id) === 2) return;
    state.set(id, 1); for (const p of m.get(id)) visit(p); state.set(id, 2);
  };
  for (const id of m.keys()) visit(id);
});

test('syllabus: pesi dei blocchi sommano a 100', () => {
  assert.equal(J('data/syllabus.json').blocchi.reduce((t, b) => t + b.peso, 0), 100);
});

test('appelli: date valide', () => {
  for (const a of J('data/appelli.json').appelli) assert.ok(!Number.isNaN(new Date(a.data).getTime()), a.data);
});

test('nessun file privato tracciabile e .gitignore corretto', () => {
  const g = readFileSync(new URL('../.gitignore', import.meta.url), 'utf8');
  assert.match(g, /sources-private/); assert.match(g, /tests\/private/);
  assert.ok(existsSync(new URL('../.nojekyll', import.meta.url)));
});
