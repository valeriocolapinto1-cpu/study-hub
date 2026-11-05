import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// storage con backend finto: srs.js usa getStorage(), che in Node ricade sul fallback in memoria
const srs = await import('../assets/js/srs.js');
const { getStorage } = await import('../assets/js/storage.js');
const reset = () => getStorage().remove('srs');

test('Leitner: una risposta sbagliata va in scatola 1 e scade il giorno dopo', () => {
  reset();
  const it = srs.review('quiz:Q-I-001', false, { now: '2026-11-02' });
  assert.equal(it.box, 1); assert.equal(it.due, '2026-11-03'); assert.equal(it.lapses, 1);
});

test('Leitner: le risposte giuste salgono di scatola con intervalli crescenti 1,3,7,14,30 giorni', () => {
  reset();
  srs.review('a', false, { now: '2026-11-02' });
  const dues = [];
  let day = '2026-11-03';
  for (let i = 0; i < 4; i++) { const it = srs.review('a', true, { now: day }); dues.push([it.box, it.due]); day = it.due; }
  assert.deepEqual(dues.map((d) => d[0]), [2, 3, 4, 5]);
  assert.equal(dues[0][1], '2026-11-06'); // +3
  assert.equal(dues[1][1], '2026-11-13'); // +7
  assert.equal(dues[2][1], '2026-11-27'); // +14
  assert.equal(dues[3][1], '2026-12-27'); // +30
  assert.equal(srs.review('a', true, { now: day }).box, 5); // massimo 5
});

test('una risposta incerta, anche se giusta, torna in scatola 1', () => {
  reset();
  srs.review('b', false, { now: '2026-11-02' }); srs.review('b', true, { now: '2026-11-03' });
  assert.equal(srs.review('b', true, { uncertain: true, now: '2026-11-06' }).box, 1);
});

test('recordResult: giusta al primo colpo non entra in coda; sbagliata sì', () => {
  reset();
  assert.equal(srs.recordResult('c', true, { now: '2026-11-02' }), null);
  assert.ok(srs.recordResult('d', false, { now: '2026-11-02' }));
  assert.deepEqual(srs.due('2026-11-03').map((x) => x.id), ['d']);
  assert.equal(srs.due('2026-11-02').length, 0);
});

test('due e stats: ordinamento per scadenza e conteggi per scatola', () => {
  reset();
  srs.review('x', false, { now: '2026-11-01' }); srs.review('y', false, { now: '2026-11-02' });
  const d = srs.due('2026-11-05');
  assert.deepEqual(d.map((v) => v.id), ['x', 'y']);
  const s = srs.stats('2026-11-05');
  assert.equal(s.total, 2); assert.equal(s.due, 2); assert.equal(s.byBox[1], 2);
});

test('le scadenze fanno parte dell\'export JSON e sopravvivono a un round-trip', () => {
  reset();
  srs.review('z', false, { now: '2026-11-02' });
  const st = getStorage();
  const exp = JSON.parse(JSON.stringify(st.exportAll()));
  assert.ok(exp.data.srs.items.z);
  reset();
  assert.equal(srs.due('2026-11-10').length, 0);
  st.applyImport(exp);
  assert.equal(srs.due('2026-11-10').length, 1);
});

test('addDays/ymd gestiscono il cambio di mese e anno', () => {
  assert.equal(srs.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(srs.addDays('2026-02-27', 3), '2026-03-02');
});

let katex = null;
try { katex = (await import('katex')).default; } catch (e) { /* facoltativo in locale */ }
test('quiz e teoria: tutte le formule compilano in KaTeX', { skip: !katex && 'katex non installato' }, () => {
  const J = (p) => JSON.parse(readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
  const texts = [];
  for (const q of J('data/quiz.json').domande) texts.push(q.testo, q.spiegazione, ...(q.opzioni || []));
  for (const q of J('data/teoria.json').domande) texts.push(q.domanda, ...q.rubrica.criteri.map((c) => c.desc));
  let n = 0;
  for (const t of texts) for (const m of t.matchAll(/\$\$([^$]+)\$\$|\$([^$]+)\$/g)) { katex.renderToString(m[1] || m[2], { throwOnError: true }); n++; }
  assert.ok(n > 300);
});
