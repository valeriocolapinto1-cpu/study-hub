import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
const J = (p) => JSON.parse(readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const syl = J('data/syllabus.json');
const form = J('data/formulario.json').voci;
const studioIds = readdirSync(new URL('../data/studio/', import.meta.url)).map((f) => f.replace('.json', ''));
const BADGE = /\[(UFFICIALE|STORICO|EDITORE|NON UFFICIALE|INFERENZA|DA VERIFICARE)\]/;

test('formulario: id unici, campi obbligatori, riferimenti validi', () => {
  const ids = form.map((v) => v.id);
  assert.equal(new Set(ids).size, ids.length, 'id duplicati');
  const arg = new Set(syl.argomenti.map((a) => a.id));
  for (const v of form) {
    for (const k of ['id', 'blocco', 'titolo', 'formula', 'simboli']) assert.ok(v[k], `${v.id}: manca ${k}`);
    assert.ok(syl.blocchi.some((b) => b.id === v.blocco), v.id);
    for (const s of v.studio) assert.ok(arg.has(s), `${v.id} -> ${s}`);
  }
});

test('studio: ogni pagina ha tutte le sezioni e i riferimenti validi', () => {
  const ids = new Set(form.map((v) => v.id));
  for (const id of studioIds) {
    const c = J(`data/studio/${id}.json`);
    assert.ok(syl.argomenti.some((a) => a.id === id), 'argomento ignoto ' + id);
    assert.ok(c.obiettivi.length >= 2, id + ' obiettivi');
    assert.ok(c.teoria.length >= 2, id + ' teoria');
    assert.ok(c.esempi.length >= 1, id + ' esempi');
    assert.ok(c.errori.length >= 1, id + ' errori');
    assert.match(c.esame, BADGE, id + ' esame senza badge');
    for (const f of c.formulario) assert.ok(ids.has(f), `${id}: formulario ${f}`);
    for (const fg of c.figure || []) { assert.ok(fg.alt && fg.alt.length > 10, id + ' alt'); assert.match(fg.svg, /^<svg/); }
    for (const d of c.dimostrazioni) assert.ok(d.passi.length >= 2, id + ' dimostrazione');
  }
});

test('syllabus: flag contenuto coerente con i file', () => {
  for (const a of syl.argomenti) assert.equal(a.contenuto, studioIds.includes(a.id), a.id);
});

test('blocchi I e II: tutte le pagine foglia presenti', () => {
  for (const a of syl.argomenti.filter((x) => x.blocco === 'I' || x.blocco === 'II')) assert.ok(a.contenuto, a.id);
});

test('dimostrazioni richieste dal blocco II presenti (Tellegen, A/B)', () => {
  const t = J('data/studio/II-05.json').dimostrazioni.map((d) => d.titolo).join(' ');
  assert.match(t, /Tellegen/);
  assert.match(J('data/studio/II-03.json').dimostrazioni[0].titolo, /B/);
});

test('contenuti: nessun riferimento a PDF del professore', () => {
  for (const id of studioIds) assert.doesNotMatch(readFileSync(new URL(`../data/studio/${id}.json`, import.meta.url), 'utf8'), /\.pdf/i);
});

// Le formule compilano in KaTeX (se disponibile: in CI si installa con `npm i --no-save katex`).
let katex = null;
try { katex = (await import('katex')).default; } catch (e) { /* facoltativo in locale */ }
test('formule KaTeX compilano', { skip: !katex && 'katex non installato' }, () => {
  const src = [];
  for (const v of form) src.push([v.id, v.formula]);
  for (const id of studioIds) {
    const c = J(`data/studio/${id}.json`);
    const texts = [...c.teoria, ...c.obiettivi, ...c.esempi.flatMap((e) => [e.testo, ...e.soluzione]), ...c.errori.flatMap((e) => [e.sbagliato, e.corretto]), ...c.dimostrazioni.flatMap((d) => [d.enunciato || '', ...d.passi])];
    for (const t of texts) for (const m of t.matchAll(/\$\$([^$]+)\$\$|\$([^$]+)\$/g)) src.push([id, m[1] || m[2]]);
  }
  assert.ok(src.length > 200);
  for (const [where, tex] of src) {
    assert.doesNotThrow(() => katex.renderToString(tex, { throwOnError: true }), `${where}: ${tex}`);
  }
});
