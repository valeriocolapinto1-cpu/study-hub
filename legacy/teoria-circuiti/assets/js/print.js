// Stampa/PDF: prova (con intestazione COGNOME/NOME/MATRICOLA e spazio per le risposte) e soluzione, separate.
import { renderCircuit } from './svg/render.js';
import { statement, steps, answerLatex } from './explain.js';
import { esc } from './svg/symbols.js';
import { FORMATO, TOTALE } from './exam.js';

const fig = (inst, p = {}) => `<div class="pfig">${renderCircuit(inst.circuit, inst.layout, { omega: inst.omega, outLabel: p.outLabel || 'v_out' }).svg}</div>`;
const lines = (n) => `<div class="plines">${'<div></div>'.repeat(n)}</div>`;
const head = (titolo, seed) => `<header class="phead"><h1>${esc(titolo)}</h1>
  <table class="pid"><tr><td>COGNOME</td><td class="pf"></td><td>NOME</td><td class="pf"></td><td>MATRICOLA</td><td class="pf"></td></tr></table>
  <p class="pmeta">Teoria dei Circuiti — prova simulata (formato storico, non garantito per l'esame attuale) · seed <code>${esc(seed)}</code> · testo da riconsegnare</p></header>`;
const campi = (p) => `<ul class="pcampi">${p.campi.map((c) => `<li>${c.label} = <span class="pbox"></span></li>`).join('')}</ul>`;

export function printProva(exam) {
  const e = exam.esercizio;
  const dom = exam.domande.map((d, i) => `<section class="pq"><h2>Domanda ${i + 1} (${FORMATO.domanda} punti)</h2>
    <p><strong>a) (${FORMATO.teoria} punti)</strong> ${d.teoria.domanda}</p>${lines(10)}
    <p><strong>b) (${FORMATO.applicata} punti)</strong> ${d.applicata.testo}</p>${d.applicata.inst ? fig(d.applicata.inst, d.applicata) : ''}${campi(d.applicata)}</section>`).join('');
  return `${head('Teoria dei Circuiti — Prova scritta', exam.spec.seed)}
    <section class="pq"><h2>Esercizio (${FORMATO.esercizio} punti)</h2><p>${statement(e.inst, e.sol)}</p>${fig(e.inst)}
      <p>$v_{out}(t)$ per $t<0$: <span class="pbox wide"></span></p><p>$v_{out}(t)$ per $t>0$: <span class="pbox wide"></span></p>${lines(14)}</section>
    ${dom}
    <section class="pq"><h2>Domanda opzionale (${FORMATO.opzionale} punti)</h2><p>${exam.opzionale.testo}</p>${campi(exam.opzionale)}</section>
    <p class="pmeta">Totale: ${FORMATO.esercizio} + ${FORMATO.domande}×${FORMATO.domanda} + ${FORMATO.opzionale} (opzionale) = ${TOTALE} punti.</p>`;
}

const sol = (arr) => `<ol>${arr.map((s) => `<li>${s.titolo ? `<strong>${esc(s.titolo)}.</strong> ` : ''}${(s.testo || [s]).map((t) => `<p>${t}</p>`).join('')}</li>`).join('')}</ol>`;
const risp = (p) => `<p><strong>Risposte attese:</strong> ${p.campi.map((c) => `${c.label} = ${c.tipo === 'num' ? (typeof c.atteso === 'number' ? Math.round(c.atteso * 1e4) / 1e4 : c.atteso.toString()) : c.tipo === 'scelta' ? esc(c.opzioni[c.atteso]) : esc(c.risposta || '(vedi soluzione)')}`).join('; ')}</p>`;

export function printSoluzione(exam) {
  const e = exam.esercizio;
  const dom = exam.domande.map((d, i) => `<section class="pq"><h2>Domanda ${i + 1}</h2>
    <p><strong>a)</strong> ${esc(d.teoria.titolo)} — punteggio massimo ${FORMATO.teoria}. Criteri di valutazione:</p><ul>${d.teoria.rubrica.criteri.map((c) => `<li>${c.desc} <em>(${c.peso}/${d.teoria.rubrica.max})</em></li>`).join('')}</ul>
    <p><strong>b)</strong> ${d.applicata.testo}</p>${sol(d.applicata.soluzione)}${risp(d.applicata)}</section>`).join('');
  return `${head('Teoria dei Circuiti — Soluzione', exam.spec.seed)}
    <section class="pq"><h2>Esercizio</h2><p>${statement(e.inst, e.sol)}</p>${fig(e.inst)}${sol(steps(e.inst, e.sol))}<p><strong>Risposta:</strong> $$${answerLatex(e.sol)}$$</p></section>
    ${dom}<section class="pq"><h2>Domanda opzionale</h2><p>${exam.opzionale.testo}</p>${sol(exam.opzionale.soluzione)}${risp(exam.opzionale)}</section>`;
}
