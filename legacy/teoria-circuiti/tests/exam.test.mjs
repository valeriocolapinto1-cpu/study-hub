import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { composeExam, buildExam, gradeExam, overrideScore, timerState, fmtTime, stimaTrentesimi, FORMATO, TOTALE, BASE, BLOCCHI_DOMANDE } from '../assets/js/exam.js';
import { printProva, printSoluzione } from '../assets/js/print.js';
import { Rational } from '../assets/js/rational.js';

const teoria = JSON.parse(readFileSync(new URL('../data/teoria.json', import.meta.url), 'utf8')).domande;

function perfectAnswer(c) {
  if (c.tipo === 'num') return typeof c.atteso === 'number' ? String(c.atteso) : c.atteso.toString();
  if (c.tipo === 'scelta') return String(c.atteso);
  return c.risposta;
}
function perfect(exam) {
  const sol = exam.esercizio.sol, w = sol.pre.omega ? sol.pre.omega.toString() : '1', parts = [];
  if (!sol.pre.dc.isZero()) parts.push(`(${sol.pre.dc})`);
  if (!sol.pre.cos.isZero()) parts.push(`(${sol.pre.cos})*cos((${w})*t)`);
  if (!sol.pre.sin.isZero()) parts.push(`(${sol.pre.sin})*sin((${w})*t)`);
  const ans = { es: { pre: parts.join('+') || '0', post: `(${sol.post.k})*e^(-t/(${sol.post.tau}))` }, d: [], opt: {} };
  for (const d of exam.domande) {
    const app = {}; for (const c of d.applicata.campi) app[c.key] = perfectAnswer(c);
    ans.d.push({ teoria: d.teoria.campioni.find((x) => x.livello === 'ottima').testo, app });
  }
  for (const c of exam.opzionale.campi) ans.opt[c.key] = perfectAnswer(c);
  return ans;
}

test('formato storico: 30 + 3×10 + 3 = 63; la parte ordinaria vale 60', () => {
  assert.equal(TOTALE, 63); assert.equal(BASE, 60);
  assert.equal(FORMATO.teoria + FORMATO.applicata, FORMATO.domanda);
});

test('composizione: 1 esercizio, 3 domande su blocchi distinti III–VI, 1 opzionale; nessun argomento ripetuto', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const spec = composeExam({ seed, level: 2, teoria });
    assert.equal(spec.domande.length, 3);
    const blocks = spec.domande.map((d) => d.blocco);
    assert.equal(new Set(blocks).size, 3, `blocchi ripetuti seed ${seed}`);
    for (const b of blocks) assert.ok(BLOCCHI_DOMANDE.includes(b));
    assert.equal(new Set(spec.domande.map((d) => d.teoria)).size, 3);
    assert.equal(new Set(spec.domande.map((d) => d.applicata.kind)).size, 3, `applicate ripetute seed ${seed}`);
    assert.ok(['opamp', 'topologia'].includes(spec.opzionale.kind));
    // la teoria scelta appartiene al blocco dichiarato
    for (const d of spec.domande) assert.equal(teoria.find((q) => q.id === d.teoria).blocco, d.blocco);
  }
});

test('copertura: su molte prove tutti i blocchi III–VI compaiono in modo bilanciato', () => {
  const cnt = { III: 0, IV: 0, V: 0, VI: 0 };
  for (let seed = 1; seed <= 200; seed++) for (const d of composeExam({ seed, teoria }).domande) cnt[d.blocco] += 1;
  for (const b of Object.keys(cnt)) assert.ok(cnt[b] >= 120 && cnt[b] <= 180, `${b}: ${cnt[b]}`); // attesi 150 ciascuno
});

test('riproducibilità: stesso seed → stessa prova (testi inclusi); seed diversi → prove diverse', () => {
  const a = buildExam(composeExam({ seed: 'xyz', level: 2, teoria }), teoria, { verify: false });
  const b = buildExam(composeExam({ seed: 'xyz', level: 2, teoria }), teoria, { verify: false });
  assert.equal(printProva(a), printProva(b));
  const c = buildExam(composeExam({ seed: 'xyw', level: 2, teoria }), teoria, { verify: false });
  assert.notEqual(printProva(a), printProva(c));
});

test('prova completa: si genera, si svolge e si corregge — risposte perfette = 63 punti, vuote = 0', () => {
  for (const seed of ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']) for (const level of [1, 2, 3]) {
    const exam = buildExam(composeExam({ seed, level, teoria }), teoria);
    assert.ok(exam.esercizio.check.ok);
    const g = gradeExam(exam, perfect(exam));
    assert.ok(g.totale >= 62.5, `${seed}/${level}: ${g.totale} ${g.parti.filter((p) => p.punti < p.max).map((p) => p.nome + ':' + p.punti)}`);
    assert.equal(gradeExam(exam, {}).totale, 0);
    assert.equal(g.parti.length, 1 + 3 * 2 + 1);
  }
});

test('correzione per parte e per blocco; override manuale del punteggio teorico', () => {
  const exam = buildExam(composeExam({ seed: 'g1', level: 2, teoria }), teoria, { verify: false });
  const g = gradeExam(exam, perfect(exam));
  const sumBlocks = Object.values(g.perBlocco).reduce((s, o) => s + o.max, 0);
  assert.equal(sumBlocks, TOTALE);
  const idx = g.parti.findIndex((p) => p.tipo === 'teoria');
  const g2 = overrideScore(g, idx, 2);
  assert.equal(g2.parti[idx].punti, 2); assert.ok(g2.parti[idx].manuale);
  assert.ok(Math.abs(g2.totale - (g.totale - g.parti[idx].punti + 2)) < 1e-9);
  assert.equal(overrideScore(g, idx, 99).parti[idx].punti, g.parti[idx].max); // limitato al massimo
});

test('esercizio: parziale (solo t<0 corretta) → 15/30', () => {
  const exam = buildExam(composeExam({ seed: 'g2', level: 1, teoria }), teoria, { verify: false });
  const a = perfect(exam); a.es.post = '0';
  const g = gradeExam(exam, a);
  assert.equal(g.parti[0].punti, 15);
});

test('timer: ripresa dopo ricarica (stato dall\'ora di inizio), avvisi a 15 e 5 minuti, scadenza, disattivabile', () => {
  const t0 = 1_000_000_000_000, dur = 150;
  assert.equal(timerState(t0, dur, t0).remainingMs, 150 * 60000);
  assert.equal(timerState(t0, dur, t0 + 100 * 60000).warn, null);
  assert.equal(timerState(t0, dur, t0 + 136 * 60000).warn, 15);
  assert.equal(timerState(t0, dur, t0 + 146 * 60000).warn, 5);
  const end = timerState(t0, dur, t0 + 151 * 60000);
  assert.ok(end.expired && end.warn === 0);
  assert.ok(timerState(t0, 0, t0 + 1e12).disabled);
  assert.equal(timerState(t0, 0).warn, null);
  assert.equal(fmtTime(150 * 60000), '2:30:00'); assert.equal(fmtTime(65000), '0:01:05'); assert.equal(fmtTime(-5), '0:00:00');
  assert.equal(timerState(t0, 90, t0).remainingMs, 90 * 60000); // modificabile
});

test('stima in trentesimi: proporzionale, soglia configurabile, mai oltre 30', () => {
  assert.equal(stimaTrentesimi(60).valore, 30);
  assert.equal(stimaTrentesimi(63).valore, 30);
  assert.equal(stimaTrentesimi(30).valore, 15);
  assert.equal(stimaTrentesimi(36).sufficiente, true);
  assert.equal(stimaTrentesimi(30, { soglia: 15 }).sufficiente, true);
  assert.match(stimaTrentesimi(20).testo, /sotto la soglia/);
});

test('stampa: intestazione COGNOME/NOME/MATRICOLA, tutti i testi, spazio per le risposte; prova e soluzione separate', () => {
  const exam = buildExam(composeExam({ seed: 'pr', level: 3, teoria }), teoria, { verify: false });
  const p = printProva(exam), s = printSoluzione(exam);
  for (const w of ['COGNOME', 'NOME', 'MATRICOLA', 'testo da riconsegnare', 'plines', 'storico']) assert.ok(p.includes(w), w);
  assert.ok(p.includes('<svg'));
  for (const d of exam.domande) { assert.ok(p.includes(d.teoria.domanda)); assert.ok(p.includes(d.applicata.testo)); }
  assert.ok(p.includes(exam.opzionale.testo));
  assert.ok(!p.includes('Soluzione') && !p.includes('Risposte attese'), 'la prova non deve contenere la soluzione');
  assert.ok(s.includes('Risposte attese') && s.includes('Soluzione') && s.includes('cases'));
  assert.ok(s.includes(exam.domande[0].teoria.rubrica.criteri[0].desc));
});

test('nessun testo, figura o numero del professore: i testi della prova provengono solo dai nostri generatori', () => {
  const exam = buildExam(composeExam({ seed: 'orig', level: 2, teoria }), teoria, { verify: false });
  assert.ok(!/\.pdf/i.test(printProva(exam)));
  assert.ok(exam.domande.every((d) => d.teoria.id.startsWith('T-')));
  void Rational;
});
