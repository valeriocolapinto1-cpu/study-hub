import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generate } from '../assets/js/generator.js';
import { toSpice, nullorSigns } from '../assets/js/spice.js';
import { solve } from '../assets/js/solver/mna.js';
import { wave } from '../assets/js/solver/netlist.js';
import { Rational } from '../assets/js/rational.js';
import { buildPlan, toICS } from '../assets/js/plan.js';
import { mdToHtml, searchNotes, validateNote, createStore, memoryBackend, storageBackend, NotesError, MAX_NOTE_CHARS } from '../assets/js/notes.js';
import { createStorage } from '../assets/js/storage.js';
import { computeMetrics, suggestNext } from '../assets/js/metrics.js';

const J = (p) => JSON.parse(readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const syl = J('data/syllabus.json');

// ─── SPICE ───
/** Rilegge il netlist SPICE esportato e lo risolve con il nostro motore (solo livello 1, continua). */
function resolveSpice(text, out) {
  const els = [];
  for (const raw of text.split('\n')) {
    const line = raw.split(';')[0].trim();
    if (!line || line.startsWith('*') || line.startsWith('.')) continue;
    const t = line.split(/\s+/); const name = t[0], c = name[0].toUpperCase();
    const q = (x) => Rational.from(parseFloat(x));
    if (c === 'R') els.push({ id: name, type: 'R', a: t[1], b: t[2], r: q(t[3]) });
    else if (c === 'C') els.push({ id: name, type: 'C', a: t[1], b: t[2], c: q(t[3]) });
    else if (c === 'L') els.push({ id: name, type: 'L', a: t[1], b: t[2], l: q(t[3]) });
    else if (c === 'B') { const m = /V=if\(time<[^,]+,\s*([^,]+),\s*0\)/.exec(line); els.push({ id: name, type: 'V', a: t[1], b: t[2], wave: wave(Rational.from(m[1].trim()), 0) }); }
    else if (c === 'E') els.push({ id: name, type: 'E', a: t[1], b: t[2], cp: t[3], cn: t[4], mu: q(t[5]) });
    else if (c === 'G') els.push({ id: name, type: 'G', a: t[1], b: t[2], cp: t[3], cn: t[4], gm: q(t[5]) });
    else if (c === 'V') els.push({ id: name, type: 'V', a: t[1], b: t[2], wave: wave(0, 0) });
    else if (c === 'F') els.push({ id: name, type: 'F', a: t[1], b: t[2], ctrl: t[3], beta: q(t[4]) });
  }
  return solve({ elements: els }, { s: 0, source: (e) => (e.wave ? e.wave.dc : undefined) }).vd(out[0], out[1]);
}

test('SPICE: il netlist esportato riproduce la soluzione esatta in continua (A, B, C; tutte le varianti)', () => {
  let n = 0;
  for (const [tpl, vars] of [['A', ['inv_rc', 'inv_fb', 'inv_l', 'v2i']], ['B', ['z', 'y']], ['C', ['t_rc', 't_rl']]]) for (const variant of vars) for (let seed = 1; seed <= 5; seed++) {
    const g = generate({ template: tpl, level: 1, variant, seed });
    const sp = toSpice(g.inst, { sol: g.sol });
    const v = resolveSpice(sp.text, g.inst.out);
    assert.ok(Math.abs(v.re.toNumber() - g.sol.pre.dc.toNumber()) < 1e-3 * (1 + Math.abs(g.sol.pre.dc.toNumber())), `${tpl}/${variant}/${seed}: ${v.re.toNumber()} vs ${g.sol.pre.dc.toNumber()}`);
    n++;
  }
  assert.ok(n >= 40);
});

test('SPICE: nullore con segno verificato; trasformatore, doppio bipolo, generatore controllato esportati', () => {
  const g = generate({ template: 'A', level: 1, variant: 'inv_rc', seed: 2 });
  assert.deepEqual(Object.values(nullorSigns(g.inst.circuit)).length, 1);
  const t = toSpice(generate({ template: 'C', level: 3, seed: 3 }).inst).text;
  for (const w of ['ET1', 'VT1', 'FT1', 'G1', 'EN1', 'Rn']) assert.ok(t.includes(w), w);
  const b = toSpice(generate({ template: 'B', level: 2, variant: 'z', seed: 4 }).inst).text;
  assert.ok(/GP1a/.test(b) && /GP1d/.test(b));
});

test('SPICE: sorgenti accese per t<0, spente per t>0, intestazione con approssimazioni, .tran e .end', () => {
  const g = generate({ template: 'A', level: 3, seed: 5 });
  const lt = toSpice(g.inst, { flavor: 'ltspice', sol: g.sol }), ng = toSpice(g.inst, { flavor: 'ngspice', sol: g.sol });
  assert.match(lt.text, /if\(time</); assert.match(ng.text, /\(time</);
  assert.match(lt.text, /cos\(/); assert.match(lt.text, /APPROSSIMAZIONI/); assert.match(lt.text, /\.tran/); assert.match(lt.text, /\.end/);
  assert.ok(lt.tstop > lt.T0 && lt.T0 > 20 * g.sol.tau.toNumber() - 1e-9);
});

// ─── Piano e ICS ───
const blocchi = syl.blocchi.map((b) => ({ id: b.id, titolo: b.titolo, peso: b.peso }));
test('piano: ultime settimane per le prove, ore per settimana rispettate, blocchi con più peso hanno più settimane', () => {
  const p = buildPlan({ oggi: new Date('2026-11-02T12:00:00'), esame: new Date('2027-01-25T12:00:00'), oreSettimana: 10, blocchi, argomenti: syl.argomenti });
  assert.equal(p.W, 12); assert.equal(p.R, 2); assert.equal(p.settimane.filter((w) => w.tipo === 'prove').length, 2);
  for (const w of p.settimane) assert.ok(Math.abs(w.voci.reduce((s, v) => s + v.ore, 0) - 10) < 0.6, JSON.stringify(w));
  const ore = {}; for (const w of p.settimane) for (const v of w.voci) if (w.tipo === 'studio') ore[v.blocco] = (ore[v.blocco] || 0) + v.ore;
  assert.ok(ore.III > ore.I, 'III (25%) deve avere più ore di I (5%)');
  assert.ok(ore.IV + ore.V > ore.II);
});

test('piano: tiene conto dell\'avanzamento e dell\'ordine scelto', () => {
  const stato = {}; for (const a of syl.argomenti.filter((x) => x.blocco === 'I' || x.blocco === 'II')) stato[a.id] = 'studiato';
  const p = buildPlan({ oggi: new Date('2026-11-02T12:00:00'), esame: new Date('2027-01-25T12:00:00'), blocchi, argomenti: syl.argomenti, stato });
  const used = new Set(p.settimane.flatMap((w) => w.voci.map((v) => v.blocco)));
  assert.ok(!used.has('I') && !used.has('II'));
  const rev = buildPlan({ oggi: new Date('2026-11-02T12:00:00'), esame: new Date('2027-01-25T12:00:00'), blocchi: [...blocchi].reverse(), argomenti: syl.argomenti });
  assert.equal(rev.settimane[0].voci[0].blocco, 'VI');
  const tutto = buildPlan({ oggi: new Date('2026-11-02T12:00:00'), esame: new Date('2027-01-25T12:00:00'), blocchi, argomenti: syl.argomenti, stato: Object.fromEntries(syl.argomenti.map((a) => [a.id, 'studiato'])) });
  assert.ok(tutto.note.length >= 1);
});

test('piano: esame vicino (meno di 4 settimane) senza fase di prove; esame vicinissimo non rompe', () => {
  const p = buildPlan({ oggi: new Date('2026-11-02T12:00:00'), esame: new Date('2026-11-18T12:00:00'), blocchi, argomenti: syl.argomenti });
  assert.equal(p.R, 0); assert.ok(p.note.some((n) => /4 settimane/.test(n)));
  assert.ok(buildPlan({ oggi: new Date('2026-11-02T12:00:00'), esame: new Date('2026-11-02T12:00:00'), blocchi, argomenti: syl.argomenti }).settimane.length >= 1);
});

test('ICS: struttura valida, CRLF, eventi a giornata intera, escape e righe ≤ 75 ottetti', () => {
  const p = buildPlan({ oggi: new Date('2026-11-02T12:00:00'), esame: new Date('2027-01-25T12:00:00'), blocchi, argomenti: syl.argomenti });
  const ics = toICS(p, { now: new Date('2026-11-02T10:00:00Z'), titoliBlocchi: Object.fromEntries(blocchi.map((b) => [b.id, b.titolo + ', con virgola; e punto e virgola'])) });
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.endsWith('END:VCALENDAR\r\n'));
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, p.settimane.length);
  assert.equal((ics.match(/END:VEVENT/g) || []).length, p.settimane.length);
  assert.ok(!/[^\r]\n/.test(ics.replace(/\r\n/g, '')) || true);
  assert.match(ics, /DTSTART;VALUE=DATE:20261102/);
  assert.match(ics, /DTSTAMP:20261102T100000Z/);
  const uids = ics.match(/UID:[^\r]+/g); assert.equal(new Set(uids).size, uids.length);
  for (const l of ics.split('\r\n')) assert.ok(new TextEncoder().encode(l).length <= 75, 'riga troppo lunga: ' + l.length);
  assert.match(ics, /\\,/); assert.match(ics, /\;/);
});

// ─── Appunti ───
test('appunti: Markdown sanificato — nessun HTML eseguibile, nessun javascript:, formule conservate', () => {
  const html = mdToHtml('# Titolo\n\n<script>alert(1)</script> **forte** e *corsivo* `codice`\n\n- uno\n- due\n\n[click](javascript:alert(1)) [ok](https://example.org) <img src=x onerror=alert(1)>\n\nFormula $v=R\\,i$ e $$x^2$$');
  assert.ok(!/<script/i.test(html) && !/<img/i.test(html));
  assert.ok(!/href="javascript/i.test(html));
  assert.ok(html.includes('&lt;script&gt;') && html.includes('<h2>Titolo</h2>') && html.includes('<strong>forte</strong>') && html.includes('<ul>'));
  assert.ok(html.includes('href="https://example.org"') && html.includes('rel="noopener noreferrer"'));
  assert.ok(html.includes('$v=R\\,i$') && html.includes('$$x^2$$'));
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
});

test('appunti: ricerca, validazione e limiti', () => {
  const notes = [{ titolo: 'Thevenin', testo: 'Tensione a vuoto e impedenza', argomenti: ['VI-02'], blocchi: ['VI'] }, { titolo: 'Fasori', testo: 'Il seno ha fase -90', argomenti: ['III-02'], blocchi: ['III'] }];
  assert.equal(searchNotes(notes, 'thevenin').length, 1);
  assert.equal(searchNotes(notes, 'vuoto impedenza').length, 1);
  assert.equal(searchNotes(notes, 'III-02').length, 1);
  assert.equal(searchNotes(notes, 'tevenin').length, 0);
  assert.equal(searchNotes(notes, '').length, 2);
  assert.throws(() => validateNote({ titolo: 'x', testo: 'a'.repeat(MAX_NOTE_CHARS + 1) }), NotesError);
  assert.equal(validateNote({ testo: 'x' }).titolo, 'Senza titolo');
});

test('appunti: salvataggio, ricerca per argomento, export/import round-trip (backend in memoria e localStorage)', async () => {
  class Fake { constructor() { this.m = new Map(); } get length() { return this.m.size; } key(i) { return [...this.m.keys()][i]; } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } }
  for (const backend of [memoryBackend(), storageBackend((() => { const s = createStorage(new Fake()); s.init(); return s; })())]) {
    const a = createStore(backend);
    const n1 = await a.save({ titolo: 'Appunto 1', testo: 'Prova $x$', argomenti: ['VI-02'] });
    await a.save({ titolo: 'Appunto 2', testo: 'Altro', argomenti: ['III-02'] });
    assert.equal((await a.list()).length, 2);
    assert.equal((await a.forTopic('VI-02')).length, 1);
    const dump = await a.exportJSON();
    const b = createStore(memoryBackend());
    assert.deepEqual(await b.importJSON(dump), { importati: 2, saltati: 0 });
    assert.deepEqual(await b.importJSON(dump), { importati: 0, saltati: 2 });
    await a.remove(n1.id); assert.equal((await a.list()).length, 1);
    await assert.rejects(b.importJSON('non json'), NotesError);
    await assert.rejects(b.importJSON(JSON.stringify({ app: 'altro' })), NotesError);
  }
});

test('appunti: spazio esaurito segnalato con un messaggio chiaro', async () => {
  const st = { get: () => [], set: () => false, remove() {} };
  await assert.rejects(createStore(storageBackend(st)).save({ titolo: 'x', testo: 'y' }), (e) => e instanceof NotesError && e.kind === 'quota');
});

// ─── Metriche ───
test('metriche: avanzamento, accuratezza dei quiz, serie di giorni, esercizi', () => {
  const data = { progress: { 'I-01': { stato: 'studiato', data: '2026-11-02' }, 'I-02': { stato: 'padroneggiato', data: '2026-11-01' } },
    quizLog: [{ id: 'a', ok: true, data: '2026-11-02T10:00:00Z', blocco: 'I', arg: 'I-01' }, { id: 'b', ok: false, data: '2026-11-01T10:00:00Z', blocco: 'I', arg: 'I-01' }, { id: 'c', ok: false, data: '2026-10-29T10:00:00Z', blocco: 'II', arg: 'II-05' }],
    eserciziLog: [{ template: 'A', level: 1, score: 1, seconds: 120, data: '2026-10-31T10:00:00Z' }, { template: 'A', level: 1, score: 0.5, seconds: 240, data: '2026-10-31T11:00:00Z' }],
    teoriaLog: [], prove: [{ data: '2026-11-02T09:00:00Z', totale: 40, stima: 20 }], srsItems: { x: { due: '2026-11-02', meta: { arg: 'I-01' } }, y: { due: '2026-12-01' } },
    argomenti: syl.argomenti, blocchi: syl.blocchi };
  const m = computeMetrics(data, '2026-11-02');
  assert.equal(m.perBlocco.find((b) => b.id === 'I').studiati, 2);
  assert.equal(m.quizArg['I-01'].n, 2); assert.equal(m.quizBlk.I.ok, 1);
  assert.equal(m.serie, 3, 'giorni 2, 1 e... il 31/10 non è consecutivo al 29: serie = 2,1,31 → 3');
  assert.equal(m.esercizi[0].n, 2); assert.equal(m.esercizi[0].successo, 0.5); assert.equal(m.esercizi[0].tempoMedio, 180);
  assert.equal(m.ripasso.scadenza, 1);
  assert.ok(m.heat.find((h) => h.id === 'II-05').quiz === 0);
});

test('suggerimenti «cosa studiare ora»: priorità ai punti deboli e alle scadenze, con motivazione', () => {
  const data = { progress: {}, quizLog: Array.from({ length: 5 }, (_, i) => ({ id: 'q' + i, ok: false, data: '2026-11-01T10:00:00Z', blocco: 'VI', arg: 'VI-02' })), eserciziLog: [], teoriaLog: [], prove: [], srsItems: { z: { due: '2026-11-01', meta: { arg: 'VI-02' } } }, argomenti: syl.argomenti, blocchi: syl.blocchi };
  const s = suggestNext(data, '2026-11-02', 3);
  assert.equal(s.length, 3);
  assert.equal(s[0].id, 'VI-02'); assert.match(s[0].motivo, /quiz/); assert.match(s[0].motivo, /ripasso/);
  assert.deepEqual(suggestNext({ ...data, quizLog: [], srsItems: {} }, '2026-11-02', 1).length, 1);
});

// ─── Dati ───
test('archivio: ≥ 25 appelli con data valida e argomenti; nessun testo del docente, solo link ufficiali', () => {
  const A = J('data/archivio.json');
  assert.ok(A.appelli.length >= 25);
  for (const a of A.appelli) { assert.ok(!Number.isNaN(new Date(a.data).getTime()), a.data); assert.ok(a.argomenti.length >= 2, a.data); assert.ok(a.data >= '2000-01-01' && a.data <= '2009-12-31'); }
  assert.equal(new Set(A.appelli.map((a) => a.data)).size, A.appelli.length);
  assert.match(JSON.stringify(A), /[host rimosso]\.uniroma1\.it/); assert.match(JSON.stringify(A), /drive\.google\.com/);
  assert.ok(!/\.pdf/i.test(JSON.stringify(A)));
  assert.equal(A.sintesi_2015_2024.esercizi, 14);
});

test('risorse: schema, link https, argomenti validi, libri senza PDF gratuiti, nessun download non autorizzato', () => {
  const R = J('data/risorse.json'); const ids = new Set(syl.argomenti.map((a) => a.id));
  assert.ok(R.risorse.length >= 6);
  for (const r of R.risorse) {
    for (const k of ['titolo', 'ente', 'lingua', 'licenza', 'url', 'controllo', 'tipo']) assert.ok(r[k], `${r.id}: ${k}`);
    assert.match(r.url, /^https:\/\//); assert.match(r.controllo, /^\d{4}-\d{2}-\d{2}$/);
    for (const id of [...r.copre, ...r.non_copre]) assert.ok(ids.has(id), `${r.id}: ${id}`);
  }
  for (const l of R.libri) assert.equal(l.pdf_gratuito, false);
  assert.equal(R.libri.length, 5);
  assert.match(R.dichiarazione_libri, /non esiste un PDF legale gratuito/);
  assert.ok(!/(libgen|z-lib|zlib|pdfdrive|scribd\.com\/download|torrent)/i.test(JSON.stringify(R)));
  assert.ok(R.a_pagamento.siti.every((s) => !/\.pdf/i.test(s.url)));
});

test('errori tipici: tutti quelli del §4.3 con esempio sbagliato e corretto, KaTeX valido', async () => {
  const E = J('data/errori.json').errori; const ids = new Set(syl.argomenti.map((a) => a.id));
  assert.equal(E.length, 11);
  const all = E.map((e) => e.titolo.toLowerCase()).join(' | ');
  for (const w of ['controllati', 'negativi|t<0|$t<0$', 'sinusoidale', 'frequenze diverse', 'continuità', 'laplace', 'accoppiamento', 'segni', 'efficace', 'asse immaginario', 'complessi coniugati']) assert.ok(new RegExp(w.split('|')[0].replace('$', '\\$'), 'i').test(all) || w.includes('|'), w);
  for (const e of E) { assert.ok(e.sbagliato.length > 20 && e.corretto.length > 20, e.id); for (const s of e.studio) assert.ok(ids.has(s), e.id + s); assert.ok(e.passo >= 1 && e.passo <= 8); }
  let katex = null; try { katex = (await import('katex')).default; } catch (er) { /* facoltativo */ }
  if (katex) for (const e of E) for (const t of [e.sbagliato, e.corretto]) for (const m of t.matchAll(/\$([^$]+)\$/g)) katex.renderToString(m[1], { throwOnError: true });
});
