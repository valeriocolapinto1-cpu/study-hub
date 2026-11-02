import { loadJSON, esc, url } from '../ui.js';
import { typeset } from '../katex.js';
import { getStorage } from '../storage.js';
import { recordResult, due, stats } from '../srs.js';
import { makeRng } from '../rng.js';

const root = document.getElementById('root');
const QS = await loadJSON('data/quiz.json'); const SYL = await loadJSON('data/syllabus.json');
const all = QS.domande; const byId = new Map(all.map((q) => [q.id, q]));
const st = getStorage();
let sess = null;

const lastWrong = () => { const log = st.get('quiz.log', []); const last = new Map(); for (const e of log) last.set(e.id, e.ok); return [...last].filter(([, ok]) => !ok).map(([id]) => id); };

function menu() {
  const s = stats();
  const dueItems = due();
  const dueQuiz = dueItems.filter((x) => x.id.startsWith('quiz:')).length;
  root.innerHTML = `<h1>Quiz e ripasso</h1>
    <p>Banco di ${all.length} domande originali (scelta multipla, vero/falso con motivazione, completamento di formule), ognuna con spiegazione e rimando alla teoria. Le domande sbagliate o segnate «incerte» rientrano in una coda di ripasso a intervalli crescenti (1, 3, 7, 14, 30 giorni).</p>
    <p><a class="btn" href="${url('teoria/')}">Domande di teoria (risposte aperte)</a></p>
    <section class="card"><h2 style="margin-top:0">Ripasso di oggi: ${dueItems.length} ${dueItems.length === 1 ? 'voce' : 'voci'}</h2>
      <p class="muted">In coda: ${s.total} (scatole 1–5: ${s.byBox.slice(1).join(' / ')}). ${dueQuiz} sono domande del quiz.</p>
      <button class="btn primary" id="go-due"${dueItems.length ? '' : ' disabled'}>Inizia il ripasso</button></section>
    <form class="card" id="f"><div class="row">
      <div><label for="mode">Modalità</label><select id="mode"><option value="blocco">Per blocco</option><option value="arg">Per argomento</option><option value="mista">Mista</option><option value="errori">Solo errori</option></select></div>
      <div id="bsel"><label for="blk">Blocco</label><select id="blk">${SYL.blocchi.map((b) => `<option value="${b.id}">${b.id} · ${esc(b.titolo)}</option>`).join('')}</select></div>
      <div id="asel" hidden><label for="arg">Argomento</label><select id="arg">${SYL.argomenti.filter((a) => all.some((q) => q.argomento === a.id)).map((a) => `<option value="${a.id}">${a.id} · ${esc(a.titolo)}</option>`).join('')}</select></div>
      <div><label for="n">Numero di domande</label><select id="n"><option>10</option><option>20</option><option>5</option></select></div>
    </div><p><button class="btn primary" type="submit">Inizia</button></p></form>`;
  const sync = () => { const m = root.querySelector('#mode').value; root.querySelector('#bsel').hidden = m !== 'blocco'; root.querySelector('#asel').hidden = m !== 'arg'; };
  root.querySelector('#mode').addEventListener('change', sync); sync();
  root.querySelector('#go-due').addEventListener('click', () => startDue(dueItems));
  root.querySelector('#f').addEventListener('submit', (e) => {
    e.preventDefault();
    const mode = root.querySelector('#mode').value, n = Number(root.querySelector('#n').value);
    let pool = all;
    if (mode === 'blocco') pool = all.filter((q) => q.blocco === root.querySelector('#blk').value);
    else if (mode === 'arg') pool = all.filter((q) => q.argomento === root.querySelector('#arg').value);
    else if (mode === 'errori') { const w = new Set(lastWrong()); const inq = new Set(Object.keys(st.get('srs', { items: {} }).items).filter((k) => k.startsWith('quiz:')).map((k) => k.slice(5))); pool = all.filter((q) => w.has(q.id) || inq.has(q.id)); }
    if (!pool.length) { root.querySelector('#f').insertAdjacentHTML('beforeend', '<p class="notice">Nessuna domanda disponibile per questa scelta (ancora nessun errore registrato?).</p>'); return; }
    const rng = makeRng(String(Date.now()));
    start(rng.shuffle(pool).slice(0, n), mode);
  });
}

function start(qs, mode) { sess = { qs, i: 0, ok: 0, mode, res: [] }; ask(); }
function startDue(items) {
  const qs = []; const other = [];
  for (const it of items) { if (it.id.startsWith('quiz:') && byId.has(it.id.slice(5))) qs.push(byId.get(it.id.slice(5))); else other.push(it); }
  sess = { qs, i: 0, ok: 0, mode: 'ripasso', res: [], other };
  if (!qs.length) return summary(); ask();
}

async function ask() {
  const q = sess.qs[sess.i];
  const opts = q.tipo === 'vf' ? ['Vero', 'Falso'] : q.opzioni;
  root.innerHTML = `<p class="muted">Domanda ${sess.i + 1} di ${sess.qs.length} · ${q.id} · blocco ${q.blocco} · difficoltà ${'●'.repeat(q.difficolta)}${'○'.repeat(3 - q.difficolta)}</p>
    <div class="bar" aria-hidden="true"><i style="width:${(100 * sess.i) / sess.qs.length}%"></i></div>
    <section class="card"><p style="font-size:1.08rem">${q.tipo === 'vf' ? '<strong>Vero o falso?</strong> ' : ''}${q.testo}</p>
    <div id="opts" role="group" aria-label="Risposte">${opts.map((o, i) => `<button class="btn opt" data-i="${i}" style="display:block;width:100%;text-align:left;margin:6px 0;justify-content:flex-start">${q.tipo === 'vf' ? esc(o) : o}</button>`).join('')}</div>
    <label style="font-weight:400"><input type="checkbox" id="unc" style="min-height:auto;width:auto;margin-right:6px">Non sono sicuro/a (rientra nel ripasso anche se giusta)</label>
    <div id="fb" role="status"></div></section>`;
  root.querySelector('#opts').addEventListener('click', (e) => {
    const b = e.target.closest('button.opt'); if (!b || root.querySelector('#fb').dataset.done) return;
    const pick = Number(b.dataset.i); const unc = root.querySelector('#unc').checked;
    const ok = q.tipo === 'vf' ? (pick === 0) === q.corretta : pick === q.corretta;
    const right = q.tipo === 'vf' ? (q.corretta ? 0 : 1) : q.corretta;
    root.querySelectorAll('button.opt').forEach((x, i) => { x.disabled = true; if (i === right) x.style.borderColor = 'var(--ok)'; if (i === pick && !ok) x.style.borderColor = 'var(--bad)'; });
    root.querySelector('#fb').dataset.done = '1';
    sess.res.push({ q, ok, unc }); if (ok) sess.ok += 1;
    const log = st.get('quiz.log', []); log.push({ id: q.id, ok, data: new Date().toISOString(), blocco: q.blocco, arg: q.argomento }); st.set('quiz.log', log.slice(-2000));
    recordResult('quiz:' + q.id, ok, { uncertain: unc, meta: { arg: q.argomento } });
    root.querySelector('#fb').innerHTML = `<p style="color:var(${ok ? '--ok' : '--bad'});font-weight:700">${ok ? '✓ Esatto' : '✗ Non esatto'}</p><p>${q.spiegazione}</p><p><a href="${url('studio/?t=' + q.studio)}">Rivedi la teoria (${esc(q.studio)})</a></p>
      <button class="btn primary" id="next">${sess.i + 1 < sess.qs.length ? 'Avanti' : 'Fine'}</button>`;
    typeset(root.querySelector('#fb'));
    root.querySelector('#next').addEventListener('click', () => { sess.i += 1; if (sess.i < sess.qs.length) ask(); else summary(); });
    root.querySelector('#next').focus();
  });
  await typeset(root);
}

function summary() {
  const n = sess.qs.length, pct = n ? Math.round((100 * sess.ok) / n) : 0;
  const byArg = {}; for (const r of sess.res) { const o = byArg[r.q.argomento] || (byArg[r.q.argomento] = { n: 0, ok: 0 }); o.n += 1; o.ok += r.ok ? 1 : 0; }
  const other = (sess.other || []).map((it) => {
    if (it.id.startsWith('teoria:')) return `<li>Domanda di teoria <a href="${url('teoria/?q=' + it.id.slice(7))}">${esc(it.id.slice(7))}</a></li>`;
    if (it.id.startsWith('ex:')) { const [, tpl, lvl, seed] = it.id.split(':'); return `<li>Esercizio <a href="${url(`esercizi/?m=completo&tpl=${tpl}&lvl=${lvl}&seed=${encodeURIComponent(seed)}`)}">${esc(it.id)}</a></li>`; }
    return `<li>${esc(it.id)}</li>`;
  });
  root.innerHTML = `<h1>Risultato</h1><section class="card"><p style="font-size:1.4rem"><strong>${sess.ok} / ${n}</strong> (${pct}%)</p>
    ${Object.keys(byArg).length ? `<div class="table-wrap"><table><thead><tr><th>Argomento</th><th>Esatte</th></tr></thead><tbody>${Object.entries(byArg).map(([a, o]) => `<tr><td><a href="${url('studio/?t=' + a)}">${esc(a)}</a></td><td>${o.ok}/${o.n}</td></tr>`).join('')}</tbody></table></div>` : ''}
    ${sess.res.some((r) => !r.ok) ? '<p class="muted">Le domande sbagliate sono state aggiunte alla coda di ripasso.</p>' : ''}
    ${other.length ? `<h2>Altre voci in scadenza</h2><ul>${other.join('')}</ul>` : ''}
    <button class="btn primary" id="again">Torna al menu</button></section>`;
  root.querySelector('#again').addEventListener('click', menu);
}
menu();
