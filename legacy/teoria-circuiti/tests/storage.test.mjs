import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorage, SCHEMA_VERSION, SECRET_KEYS, APP_ID } from '../assets/js/storage.js';

class FakeStore {
  constructor() { this.m = new Map(); }
  get length() { return this.m.size; }
  key(i) { return [...this.m.keys()][i]; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}

test('get/set round-trip e default', () => {
  const s = createStorage(new FakeStore()); s.init();
  assert.equal(s.get('x', 5), 5);
  s.set('x', { a: [1, 2] });
  assert.deepEqual(s.get('x'), { a: [1, 2] });
});

test('senza localStorage: fallback in memoria, nessuna eccezione', () => {
  const s = createStorage(null); s.init();
  assert.equal(s.isDegraded, true);
  s.set('k', 1);
  assert.equal(s.get('k'), 1);
});

test('storage che lancia eccezioni: fallback in memoria', () => {
  const bad = { setItem() { throw new Error('quota'); }, getItem() { throw new Error('x'); }, removeItem() {}, key() { return null; }, length: 0 };
  const s = createStorage(bad); s.init();
  s.set('k', 2);
  assert.equal(s.get('k'), 2);
  assert.equal(s.isDegraded, true);
});

test('export/import round-trip, segreti esclusi', () => {
  const a = createStorage(new FakeStore()); a.init();
  a.set('progress', { 'I-01': 'studiato' });
  a.set('settings', { tema: 'scuro' });
  a.set(SECRET_KEYS[0], 'sk-segreto');
  const exp = a.exportAll(new Date('2026-11-02T00:00:00Z'));
  assert.equal(exp.app, APP_ID);
  assert.ok(!('secret.aiKey' in exp.data));
  assert.ok(!JSON.stringify(exp).includes('sk-segreto'));
  const b = createStorage(new FakeStore()); b.init();
  const prev = b.previewImport(exp);
  assert.ok(prev.valid);
  assert.equal(b.applyImport(exp), 2);
  assert.deepEqual(b.get('progress'), { 'I-01': 'studiato' });
});

test('import rifiuta file estranei o più recenti', () => {
  const s = createStorage(new FakeStore()); s.init();
  assert.equal(s.previewImport({ app: 'altro', version: 1, data: {} }).valid, false);
  assert.equal(s.previewImport({ app: APP_ID, version: SCHEMA_VERSION + 1, data: {} }).valid, false);
  assert.equal(s.previewImport(null).valid, false);
  assert.throws(() => s.applyImport({ app: 'altro' }));
});

test('anteprima segnala sovrascritture', () => {
  const s = createStorage(new FakeStore()); s.init();
  s.set('progress', {});
  const p = s.previewImport({ app: APP_ID, version: 1, data: { progress: {}, nuovo: 1 } });
  assert.equal(p.sections.find((x) => x.key === 'progress').willOverwrite, true);
  assert.equal(p.sections.find((x) => x.key === 'nuovo').willOverwrite, false);
});

test('migrazione: versione 0 viene portata alla corrente', () => {
  const st = new FakeStore();
  st.setItem('tdc:meta', JSON.stringify({ version: 0 }));
  const s = createStorage(st);
  const r = s.init();
  assert.ok(r.ok);
  assert.equal(s.get('meta').version, SCHEMA_VERSION);
});

test('dati più recenti dell\'app non vengono toccati', () => {
  const st = new FakeStore();
  st.setItem('tdc:meta', JSON.stringify({ version: SCHEMA_VERSION + 5 }));
  const r = createStorage(st).init();
  assert.equal(r.ok, false);
});

test('reset per sezione preserva i segreti', () => {
  const s = createStorage(new FakeStore()); s.init();
  s.set('progress', 1); s.set('srs', 2); s.set(SECRET_KEYS[0], 'k');
  assert.equal(s.reset('progress'), 1);
  assert.equal(s.get('srs'), 2);
  s.reset('');
  assert.equal(s.get(SECRET_KEYS[0]), 'k');
});
