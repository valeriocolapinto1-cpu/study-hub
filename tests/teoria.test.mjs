import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gradeWithRubric, tokens, stem, phraseMatches, normalizeText, canonFormula } from '../assets/js/grader/rubric.js';
const J = (p) => JSON.parse(readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const teoria = J('data/teoria.json').domande;
const syl = J('data/syllabus.json');
const quiz = J('data/quiz.json').domande;
const BLOCKS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

test('quiz: ≥ 200 domande, id unici, schema, spiegazione, argomenti validi, tutti i blocchi coperti', () => {
  assert.ok(quiz.length >= 200, 'quiz: ' + quiz.length);
  assert.equal(new Set(quiz.map((q) => q.id)).size, quiz.length);
  const arg = new Set(syl.argomenti.map((a) => a.id));
  for (const q of quiz) {
    assert.ok(arg.has(q.argomento), q.id);
    assert.ok([1, 2, 3].includes(q.difficolta), q.id);
    assert.ok(q.testo.length > 10 && q.spiegazione.length > 5, q.id);
    if (q.tipo === 'vf') assert.equal(typeof q.corretta, 'boolean', q.id);
    else {
      assert.ok(['mc', 'fm'].includes(q.tipo), q.id);
      assert.ok(q.opzioni.length >= 3 && q.opzioni.length <= 4, q.id);
      assert.ok(Number.isInteger(q.corretta) && q.corretta >= 0 && q.corretta < q.opzioni.length, q.id);
      assert.equal(new Set(q.opzioni).size, q.opzioni.length, 'opzioni duplicate ' + q.id);
    }
  }
  for (const b of BLOCKS) assert.ok(quiz.filter((q) => q.blocco === b).length >= 20, 'blocco ' + b);
  for (const d of [1, 2, 3]) assert.ok(quiz.filter((q) => q.difficolta === d).length >= 30, 'difficoltà ' + d);
  for (const t of ['mc', 'vf', 'fm']) assert.ok(quiz.filter((q) => q.tipo === t).length >= 15, 'tipo ' + t);
  // le vere/false non devono essere sbilanciate
  const vera = quiz.filter((q) => q.tipo === 'vf' && q.corretta).length, vfTot = quiz.filter((q) => q.tipo === 'vf').length;
  assert.ok(vera / vfTot < 0.9, `troppe affermazioni vere: ${vera}/${vfTot}`);
  // la risposta corretta non è sempre la stessa posizione
  const pos = [0, 1, 2, 3].map((i) => quiz.filter((q) => q.tipo === 'mc' && q.corretta === i).length);
  assert.ok(pos[1] >= 10 && pos[0] >= 10, 'posizione risposte: ' + pos);
});

test('teoria: ≥ 50 domande con rubrica, id unici, punteggio max coerente, argomenti validi', () => {
  assert.ok(teoria.length >= 50);
  assert.equal(new Set(teoria.map((q) => q.id)).size, teoria.length);
  const arg = new Set(syl.argomenti.map((a) => a.id));
  for (const q of teoria) {
    assert.ok(BLOCKS.includes(q.blocco), q.id);
    for (const a of q.argomenti) assert.ok(arg.has(a), `${q.id}: ${a}`);
    assert.ok(q.domanda.length > 20 && q.titolo, q.id);
    assert.ok(q.rubrica.criteri.length >= 3, q.id);
    assert.equal(q.rubrica.max, q.rubrica.criteri.reduce((s, c) => s + c.peso, 0), q.id);
    assert.equal(q.rubrica.max, 10, `${q.id}: max ${q.rubrica.max}`);
    assert.ok(q.campioni.length >= 3, q.id);
    for (const l of ['ottima', 'parziale', 'errata']) assert.ok(q.campioni.some((c) => c.livello === l), `${q.id}: manca ${l}`);
    assert.match(q.esame, /\d{4}|STORICO/, q.id);
  }
});

test('teoria: calibrazione — ogni risposta campione cade nell\'intervallo atteso', () => {
  const fails = [];
  for (const q of teoria) for (const c of q.campioni) {
    const r = gradeWithRubric(c.testo, q.rubrica);
    if (r.punteggio < c.min || r.punteggio > c.max) fails.push(`${q.id}/${c.livello}: ${r.punteggio} non in [${c.min},${c.max}] mancanti=${r.mancanti.map((m) => m.id)} errori=${r.errori.map((e) => e.id)}`);
  }
  assert.deepEqual(fails, []);
});

test('teoria: copertura di tutte le righe del §5.1 (appelli e temi)', () => {
  const temi = ['Thevenin', 'Norton', 'Massimo trasferimento', 'Tellegen', 'Topologia', 'nodi', 'Fasori', 'Potenze', 'Rifasamento', 'Laplace', 'Stabilit', 'Risposta in frequenza', 'risonanti', 'permanente e transitoria', 'impulsiva', 'razionali', 'Doppi bipoli', 'Connessioni', 'Nullore', 'Trasformatore', 'sostituzione', 'Proprietà', 'Costante di tempo'];
  const all = teoria.map((q) => q.esame).join(' | ');
  for (const t of temi) assert.ok(all.toLowerCase().includes(t.toLowerCase()), 'tema non coperto: ' + t);
});

test('rubrica: la risposta vuota o fuori tema vale 0, la risposta ideale (parole chiave) vale molto', () => {
  for (const q of teoria) {
    assert.equal(gradeWithRubric('', q.rubrica).punteggio, 0, q.id);
    assert.equal(gradeWithRubric('Oggi il tempo è bello e mi piace la pizza.', q.rubrica).punteggio, 0, q.id);
  }
});

test('rubrica: normalizzazione, stemming e tolleranza a un refuso', () => {
  assert.equal(normalizeText('Così ω è ≥ τ').trim().replace(/\s+/g, ' '), 'cosi omega e >= tau');
  assert.equal(stem('generatori'), stem('generatore'));
  assert.deepEqual(tokens('Il generatore di tensione'), tokens('generatori tensione'));
  assert.ok(phraseMatches('impedenza equivalente', tokens('l\'impedeza equivalente del bipolo'))); // refuso: impedeza
  assert.ok(phraseMatches('tensione vuoto', tokens('la tensione a vuoto')));
  assert.ok(!phraseMatches('tensione vuoto', tokens('la corrente di corto')));
  assert.equal(canonFormula('$P = \\frac{V^2}{8 R}$'), canonFormula('P=(V^2)/(8R)'));
});

test('rubrica: confidenza bassa per risposte molto brevi, penalità per errori noti', () => {
  const q = teoria.find((x) => x.id === 'T-01');
  assert.ok(gradeWithRubric('lineare', q.rubrica).confidenza <= 0.5);
  const r = gradeWithRubric('Bipolo lineare, generatore di tensione in serie a impedenza, tensione a vuoto, generatori indipendenti spenti ma si spengono anche i controllati.', q.rubrica);
  assert.ok(r.errori.length === 1);
  assert.ok(r.punteggio < 10);
});
