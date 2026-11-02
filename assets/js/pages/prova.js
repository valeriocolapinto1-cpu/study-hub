import { loadJSON, esc, url } from '../ui.js';
import { typeset } from '../katex.js';
import { getStorage } from '../storage.js';
import { composeExam, buildExam, gradeExam, overrideScore, timerState, fmtTime, stimaTrentesimi, FORMATO, TOTALE, DEFAULT_MINUTES } from '../exam.js';
import { printProva, printSoluzione } from '../print.js';
import { renderCircuit } from '../svg/render.js';
import { statement, steps, answerLatex } from '../explain.js';
import { recordResult } from '../srs.js';
import { recordAttempt } from '../stats.js';

const root = document.getElementById('root');
const teoria = (await loadJSON('data/teoria.json')).domande;
const st = getStorage();
const KEY = 'prova.corrente', HIST = 'prove.storico', CFG = 'prova.config';
let exam = null, state = null, tick = null;

const cfg = () => ({ minuti: DEFAULT_MINUTES, soglia: 18, ...(st.get(CFG, {}) || {}) });
const newSeed = () => String(Math.floor(Math.random() * 1e6));
const field = (c, pre, val = '') => c.tipo === 'scelta'
  ? `<div class="fld"><label for="${pre}-${c.key}">${c.label}</label><select id="${pre}-${c.key}" data-k="${c.key}"><option value="">—</option>${c.opzioni.map((o, i) => `<option value="${i}"${String(val) === String(i) ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`
  : `<div class="fld"><label for="${pre}-${c.key}">${c.label}</label><input type="text" id="${pre}-${c.key}" data-k="${c.key}" value="${esc(val)}" autocomplete="off" spellcheck="false" placeholder="${c.tipo === 'expr' ? 'espressione' : 'numero o frazione'}"></div>`;
const save = () => st.set(KEY, state);

function setup() {
  const c = cfg();
  const hist = st.get(HIST, []);
  const saved = st.get(KEY, null);
  root.innerHTML = `<h1>Prova d'esame simulata</h1>
    <p>Una prova simulata: 1 esercizio (${FORMATO.esercizio} punti), 3 domande (${FORMATO.domanda} punti ciascuna) e 1 opzionale (${FORMATO.opzionale}). Timer di 2h30 modificabile.</p><div class="notice">Formato storico, <strong>non garantito per l'esame attuale</strong> [STORICO]. La stima in trentesimi è solo proporzionale e <strong>non è ufficiale</strong> [INFERENZA].</div>
    ${saved && !saved.consegnata ? `<section class="card"><h2 style="margin-top:0">Prova in corso</h2><p>Seed <code>${esc(saved.seed)}</code>, iniziata il ${new Date(saved.startedAt).toLocaleString('it-IT')}.</p><button class="btn primary" id="resume">Riprendi</button> <button class="btn danger" id="drop">Abbandona</button></section>` : ''}
    <form class="card" id="f"><div class="row"><div><label for="lvl">Difficoltà dell'esercizio</label><select id="lvl"><option value="1">1 · Base</option><option value="2" selected>2 · Esame</option><option value="3">3 · Avanzato</option></select></div>
      <button class="btn primary" type="submit">Genera prova</button></div>
      <details style="margin-top:12px"><summary>Opzioni (timer, seed, soglia)</summary><div class="row">
      <div><label for="seed">Seed (per riprodurre la prova)</label><input id="seed" type="text" value="${newSeed()}" style="max-width:140px"></div>
      <div><label for="min">Timer (minuti, 0 = disattivato)</label><input id="min" type="number" min="0" max="600" value="${c.minuti}" style="max-width:120px"></div>
      <div><label for="sog">Soglia di sufficienza (/30)</label><input id="sog" type="number" min="1" max="30" value="${c.soglia}" style="max-width:120px"></div></div></details></form>
    ${hist.length ? `<section class="card"><h2 style="margin-top:0">Prove precedenti</h2><div class="table-wrap"><table><thead><tr><th>Data</th><th>Seed</th><th>Punti</th><th>Stima</th><th>Tempo</th></tr></thead><tbody>${hist.slice().reverse().map((h) => `<tr><td>${new Date(h.data).toLocaleDateString('it-IT')}</td><td><code>${esc(h.seed)}</code></td><td>${h.totale}/${TOTALE}</td><td>${h.stima}/30</td><td>${fmtTime(h.secondi * 1000)}</td></tr>`).join('')}</tbody></table></div></section>` : ''}`;
  root.querySelector('#f').addEventListener('submit', (e) => {
    e.preventDefault();
    const seed = root.querySelector('#seed').value.trim() || newSeed();
    const minuti = Number(root.querySelector('#min').value) || 0, soglia = Number(root.querySelector('#sog').value) || 18;
    st.set(CFG, { minuti: minuti || 0, soglia });
    state = { seed, level: Number(root.querySelector('#lvl').value), startedAt: Date.now(), minuti, answers: { es: {}, d: [{}, {}, {}], opt: {} }, consegnata: false };
    save(); run();
  });
  const r = root.querySelector('#resume'); if (r) r.addEventListener('click', () => { state = saved; run(); });
  const d = root.querySelector('#drop'); if (d) d.addEventListener('click', () => { if (confirm('Abbandonare la prova in corso?')) { st.remove(KEY); setup(); } });
}

async function run() {
  const spec = composeExam({ seed: state.seed, level: state.level, teoria });
  exam = buildExam(spec, teoria);
  const e = exam.esercizio;
  const A = state.answers;
  root.innerHTML = `<div class="timer" id="timer" role="timer" aria-live="off"><span>Tempo rimasto</span><span class="t" id="tt">—</span><span id="tw" class="muted"></span><span style="flex:1"></span><button class="btn" id="pp">Stampa prova</button><button class="btn primary" id="sub">Consegna</button></div>
    <p class="muted">Seed <code>${esc(state.seed)}</code> · formato storico, non garantito per l'esame attuale</p>
    <section class="card"><h2 style="margin-top:0">Esercizio (${FORMATO.esercizio} punti)</h2><p>${statement(e.inst, e.sol)}</p><figure class="fig"><div style="overflow-x:auto">${renderCircuit(e.inst.circuit, e.inst.layout, { omega: e.inst.omega }).svg}</div></figure>
      ${field({ key: 'pre', label: '$v_{out}(t)$ per $t<0$', tipo: 'expr' }, 'es', A.es.pre)}${field({ key: 'post', label: '$v_{out}(t)$ per $t>0$', tipo: 'expr' }, 'es', A.es.post)}</section>
    ${exam.domande.map((d, i) => `<section class="card"><h2 style="margin-top:0">Domanda ${i + 1} (${FORMATO.domanda} punti)</h2>
      <p><strong>a) (${FORMATO.teoria} punti)</strong> ${d.teoria.domanda}</p><textarea data-t="${i}" rows="7" style="max-width:100%" maxlength="4000" aria-label="Risposta alla domanda ${i + 1}a">${esc(A.d[i].teoria || '')}</textarea>
      <p><strong>b) (${FORMATO.applicata} punti)</strong> ${d.applicata.testo}</p>${d.applicata.inst ? `<figure class="fig"><div style="overflow-x:auto">${renderCircuit(d.applicata.inst.circuit, d.applicata.inst.layout, { outLabel: 'V_AB' }).svg}</div></figure>` : ''}
      ${d.applicata.campi.map((c) => field(c, `d${i}`, (A.d[i].app || {})[c.key] ?? '')).join('')}</section>`).join('')}
    <section class="card"><h2 style="margin-top:0">Domanda opzionale (${FORMATO.opzionale} punti)</h2><p>${exam.opzionale.testo}</p>${exam.opzionale.campi.map((c) => field(c, 'o', (A.opt || {})[c.key] ?? '')).join('')}</section>
    <p><button class="btn primary" id="sub2">Consegna</button></p>`;
  const sync = () => { save(); };
  root.addEventListener('input', (ev) => {
    const t = ev.target; if (!t) return;
    if (t.dataset.t !== undefined) A.d[Number(t.dataset.t)].teoria = t.value;
    else if (t.dataset.k !== undefined) {
      const id = t.id;
      if (id.startsWith('es-')) A.es[t.dataset.k] = t.value; else if (id.startsWith('o-')) A.opt[t.dataset.k] = t.value;
      else { const i = Number(id.slice(1, 2)); (A.d[i].app ||= {})[t.dataset.k] = t.value; }
    }
    sync();
  });
  root.querySelector('#pp').addEventListener('click', () => doPrint(printProva(exam)));
  const submit = () => { if (confirm('Consegnare la prova? Non potrai più modificare le risposte.')) consegna(); };
  root.querySelector('#sub').addEventListener('click', submit); root.querySelector('#sub2').addEventListener('click', submit);
  clearInterval(tick);
  const upd = () => {
    const t = timerState(state.startedAt, state.minuti), box = root.querySelector('#timer'); if (!box) return;
    root.querySelector('#tt').textContent = t.disabled ? 'timer disattivato' : fmtTime(t.remainingMs);
    const w = root.querySelector('#tw');
    if (t.warn === 15 && !state.w15) { state.w15 = true; save(); w.textContent = 'Attenzione: restano 15 minuti.'; box.classList.add('warn'); box.setAttribute('aria-live', 'assertive'); }
    if (t.warn === 5 && !state.w5) { state.w5 = true; save(); w.textContent = 'Attenzione: restano 5 minuti!'; box.classList.add('warn'); box.setAttribute('aria-live', 'assertive'); }
    if (t.warn === 15) box.classList.add('warn'); if (t.warn === 5) { box.classList.add('warn'); w.textContent = 'Restano meno di 5 minuti!'; }
    if (t.expired) { box.classList.add('bad'); w.textContent = 'Tempo scaduto: consegna la prova.'; }
  };
  upd(); tick = setInterval(upd, 1000);
  await typeset(root);
}

async function doPrint(html) {
  const pa = document.getElementById('print-area'); pa.innerHTML = html; await typeset(pa);
  document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done); window.print(); setTimeout(done, 2000);
}

async function consegna() {
  clearInterval(tick);
  const usati = Math.min(Math.round((Date.now() - state.startedAt) / 1000), (state.minuti || 1e6) * 60 + 3600);
  state.consegnata = true; state.secondi = usati; save();
  let sum = gradeExam(exam, state.answers);
  report(sum, usati, true);
}

function report(sum, secondi, first) {
  const c = cfg();
  const stima = stimaTrentesimi(sum.totale, { soglia: c.soglia });
  const hist = st.get(HIST, []).filter((h) => h.seed !== state.seed || !first);
  const prev = hist.slice(-3);
  const blk = Object.entries(sum.perBlocco);
  root.innerHTML = `<h1>Report della prova</h1><p class="muted">Seed <code>${esc(state.seed)}</code> · tempo usato ${fmtTime(secondi * 1000)}${state.minuti ? ` su ${state.minuti} min` : ''}</p>
    <section class="card"><p style="font-size:1.6rem;margin:0"><strong>${sum.totale} / ${TOTALE}</strong> punti</p>
      <p>Stima in trentesimi: <strong>${esc(stima.testo)}</strong> <span class="badge b-INFERENZA">INFERENZA</span></p>
      <p class="muted">La stima è proporzionale (parte ordinaria ${sum.base} punti → 30/30; l'opzionale è un bonus) e <strong>non è un voto ufficiale</strong>. Le risposte aperte sono valutate dallo script offline: sono una stima e le puoi correggere qui sotto.</p></section>
    <section class="card"><h2 style="margin-top:0">Punti per parte</h2><div class="table-wrap"><table><thead><tr><th>Parte</th><th>Blocco</th><th>Punti</th><th></th></tr></thead><tbody>
      ${sum.parti.map((p, i) => `<tr><td>${esc(p.nome)}</td><td>${esc(p.blocco)}</td><td>${p.tipo === 'teoria' ? `<input type="number" class="adj" data-i="${i}" min="0" max="${p.max}" step="0.5" value="${p.punti}" style="max-width:90px;min-height:36px" aria-label="Punteggio ${esc(p.nome)}"> / ${p.max}` : `${p.punti} / ${p.max}`}</td><td>${p.manuale ? '<span class="muted">corretto</span>' : ''}</td></tr>`).join('')}</tbody></table></div>
      <p class="muted">Modifica i punteggi delle domande teoriche se la stima automatica non ti convince, poi premi Conferma.</p><button class="btn" id="conf">Conferma punteggi</button></section>
    <section class="card"><h2 style="margin-top:0">Per argomento (blocco)</h2>${blk.map(([b, o]) => `<p style="margin:.3em 0">Blocco ${esc(b)}: ${Math.round(o.punti * 10) / 10}/${o.max}<span class="bar" style="display:block"><i style="width:${Math.round((100 * o.punti) / o.max)}%"></i></span></p>`).join('')}</section>
    <section class="card"><h2 style="margin-top:0">Errori e cosa rivedere</h2>${errList(sum)}</section>
    ${prev.length ? `<section class="card"><h2 style="margin-top:0">Confronto con le prove precedenti</h2><ul>${prev.map((h) => `<li>${new Date(h.data).toLocaleDateString('it-IT')} · seed ${esc(h.seed)}: ${h.totale}/${TOTALE} (${h.stima}/30)</li>`).join('')}</ul><p>Questa prova: <strong>${sum.totale}</strong>${prev.length ? ` (${sum.totale - prev[prev.length - 1].totale >= 0 ? '+' : ''}${Math.round((sum.totale - prev[prev.length - 1].totale) * 10) / 10} rispetto all'ultima)` : ''}.</p></section>` : ''}
    <section class="card"><h2 style="margin-top:0">Soluzione</h2><div class="row"><button class="btn" id="vs">Mostra la soluzione dell'esercizio</button><button class="btn" id="ps">Stampa soluzione</button><button class="btn" id="pp2">Stampa prova</button></div><div id="solbox" hidden></div></section>
    <p><button class="btn primary" id="fine">Salva e chiudi</button></p>`;
  typeset(root);
  let cur = sum;
  root.querySelector('#conf').addEventListener('click', () => {
    root.querySelectorAll('.adj').forEach((inp) => { const i = Number(inp.dataset.i); const v = Number(inp.value); if (Number.isFinite(v) && v !== cur.parti[i].punti) cur = overrideScore(cur, i, v); });
    report(cur, secondi, false);
  });
  root.querySelector('#vs').addEventListener('click', async () => {
    const b = root.querySelector('#solbox'); if (!b.hidden) { b.hidden = true; return; }
    const e = exam.esercizio;
    b.innerHTML = `<ol>${steps(e.inst, e.sol).map((s) => `<li><strong>${esc(s.titolo)}.</strong> ${s.testo.map((t) => `<p>${t}</p>`).join('')}</li>`).join('')}</ol><div class="card right">$$${answerLatex(e.sol)}$$</div>`;
    b.hidden = false; await typeset(b);
  });
  root.querySelector('#ps').addEventListener('click', () => doPrint(printSoluzione(exam)));
  root.querySelector('#pp2').addEventListener('click', () => doPrint(printProva(exam)));
  root.querySelector('#fine').addEventListener('click', () => { finalize(cur, secondi, stima); });
  if (first) autosave(cur, secondi);
}
function errList(sum) {
  const out = [];
  for (const p of sum.parti) {
    if (p.punti >= p.max * 0.999) continue;
    if (p.tipo === 'esercizio') out.push(`<li><strong>${esc(p.nome)}</strong>: ${p.dettaglio.hints.length ? p.dettaglio.hints.map(esc).join(' ') : 'risposta non corretta: riguarda gli 8 passi della procedura.'} <a href="${url('esercizi/?m=guidato&lvl=' + p.livello + '&tpl=' + p.template)}">Allenati in modalità guidata</a></li>`);
    else if (p.tipo === 'teoria') out.push(`<li><strong>${esc(p.nome)}</strong>: criteri mancanti: ${p.dettaglio.mancanti.map((m) => esc(m.desc)).join('; ') || '—'}${p.dettaglio.errori.length ? ` · errori noti: ${p.dettaglio.errori.map((x) => esc(x.msg)).join('; ')}` : ''} <a href="${url('teoria/?q=' + p.id)}">Rifai la domanda</a></li>`);
    else out.push(`<li><strong>${esc(p.nome)}</strong>: ${Object.entries(p.dettaglio.per).filter(([, v]) => !v.ok).length} campi da rivedere. ${(p.studio || []).map((s) => `<a href="${url('studio/?t=' + s)}">${esc(s)}</a>`).join(', ')}</li>`);
  }
  return out.length ? `<ul>${out.join('')}</ul>` : '<p>Nessun errore: prova perfetta!</p>';
}
function autosave() { /* il salvataggio definitivo avviene con «Salva e chiudi» (dopo eventuali correzioni manuali) */ }
function finalize(sum, secondi, stima) {
  const hist = st.get(HIST, []);
  hist.push({ seed: state.seed, data: new Date().toISOString(), totale: sum.totale, stima: stima.valore, secondi, parti: sum.parti.map((p) => ({ n: p.nome, b: p.blocco, p: p.punti, m: p.max })) });
  st.set(HIST, hist.slice(-50));
  // progresso e ripasso
  const e = exam.esercizio, pe = sum.parti[0];
  recordAttempt({ mode: 'prova', template: e.inst.template, level: e.inst.level, seed: e.seed, score: pe.score, seconds: secondi });
  recordResult(`ex:${e.inst.template}:${e.inst.level}:${e.seed}`, pe.score === 1, { meta: { arg: 'III-02' } });
  const tlog = st.get('teoria.log', []);
  for (const p of sum.parti) {
    if (p.tipo === 'teoria') { tlog.push({ id: p.id, score: p.punti / FORMATO.teoria * p.dettaglio.max, max: p.dettaglio.max, fonte: p.manuale ? 'manuale' : 'script', data: new Date().toISOString() }); recordResult('teoria:' + p.id, p.score >= 0.6, { meta: { arg: p.argomenti[0] } }); }
  }
  st.set('teoria.log', tlog.slice(-500));
  st.remove(KEY);
  root.innerHTML = `<h1>Prova salvata</h1><p>Punteggio ${sum.totale}/${TOTALE}. I risultati sono stati registrati nel progresso e le parti non superate sono entrate nella coda di ripasso.</p><p><a class="btn primary" href="${url('prova/')}">Nuova prova</a> <a class="btn" href="${url('quiz/')}">Vai al ripasso</a></p>`;
}
setup();
