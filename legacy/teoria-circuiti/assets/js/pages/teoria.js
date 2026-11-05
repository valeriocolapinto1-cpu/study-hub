import { loadJSON, esc, url } from '../ui.js';
import { typeset } from '../katex.js';
import { getStorage } from '../storage.js';
import { gradeWithRubric } from '../grader/rubric.js';
import { aiEnabled, gradeWithAI } from '../grader/ai-adapter.js';
import { recordResult } from '../srs.js';

const root = document.getElementById('root');
const D = (await loadJSON('data/teoria.json')).domande;
const st = getStorage();
const params = new URLSearchParams(location.search);
const pct = (a, m) => Math.round((100 * a) / m);

function list() {
  const log = st.get('teoria.log', []);
  const best = new Map(); for (const e of log) best.set(e.id, e.score);
  root.innerHTML = `<h1>Domande di teoria</h1>
    <p>${D.length} domande aperte (enunciati, dimostrazioni, spiegazioni) riformulate a partire dagli argomenti ricorrenti nelle prove storiche. Scrivi la risposta con parole tue: lo <strong>script di correzione offline</strong> la confronta con una rubrica di criteri e stima un punteggio. È una <em>stima</em>: puoi confermarla o correggerla. Con una chiave API personale (Impostazioni) puoi avere anche la correzione con AI.</p>
    <div class="chips" id="fl" role="group" aria-label="Blocco">${['tutti', 'I', 'II', 'III', 'IV', 'V', 'VI'].map((b) => `<button class="btn chip" data-b="${b}" aria-pressed="${b === 'tutti'}">${b === 'tutti' ? 'Tutti' : 'Blocco ' + b}</button>`).join('')}</div>
    <div id="lst"></div>`;
  const draw = (b) => {
    root.querySelector('#lst').innerHTML = D.filter((q) => b === 'tutti' || q.blocco === b).map((q) => `<article class="card"><strong>${q.id}</strong> · blocco ${q.blocco} · ${esc(q.titolo)} ${best.has(q.id) ? `<span class="muted">· ultimo punteggio ${best.get(q.id)}/${q.rubrica.max}</span>` : ''}<br><button class="btn" data-q="${q.id}" style="margin-top:8px">Rispondi</button></article>`).join('');
  };
  draw('tutti');
  root.querySelector('#fl').addEventListener('click', (e) => { const b = e.target.closest('button[data-b]'); if (!b) return; root.querySelectorAll('#fl button').forEach((x) => x.setAttribute('aria-pressed', x === b)); draw(b.dataset.b); });
  root.querySelector('#lst').addEventListener('click', (e) => { const b = e.target.closest('button[data-q]'); if (b) open(b.dataset.q); });
}

async function open(id) {
  const q = D.find((x) => x.id === id);
  history.replaceState(null, '', '?q=' + id);
  const ai = aiEnabled();
  root.innerHTML = `<p><a href="${url('teoria/')}" id="back">← Elenco</a></p><h1>${esc(q.titolo)}</h1><p class="muted">${q.id} · blocco ${q.blocco} · punteggio massimo ${q.rubrica.max} · teoria: ${q.argomenti.map((a) => `<a href="${url('studio/?t=' + a)}">${a}</a>`).join(', ')}</p>
    <section class="card"><p>${q.domanda}</p><label for="ans">La tua risposta</label><textarea id="ans" rows="9" style="max-width:100%" maxlength="4000" placeholder="Scrivi con parole tue; puoi usare formule in LaTeX o testo semplice (es. R_th, omega0 = 1/sqrt(LC))."></textarea>
    <div class="row" style="margin-top:10px"><button class="btn primary" id="off">Correggi (script offline)</button>${ai ? '<button class="btn" id="aib">Correggi anche con AI</button>' : ''}</div></section><div id="res"></div>`;
  root.querySelector('#back').addEventListener('click', (e) => { e.preventDefault(); history.replaceState(null, '', url('teoria/')); list(); });
  const crit = (r) => `<ul>${r.criteri.map((c) => `<li>${c.ok ? '✓' : '✗'} ${c.desc} <span class="muted">(${c.peso})</span></li>`).join('')}</ul>`;
  let offRes = null, aiRes = null, aiErr = null;
  const render = () => {
    const parts = [];
    if (aiErr) parts.push(`<p class="notice" role="alert">Correzione AI non riuscita (${esc(aiErr)}). Resta valida la correzione offline.</p>`);
    if (offRes) parts.push(`<section class="card"><h2 style="margin-top:0">Script offline: ${offRes.punteggio}/${offRes.max}</h2>${crit(offRes)}
      ${offRes.errori.length ? `<p class="notice"><strong>Errori noti:</strong> ${offRes.errori.map((e) => esc(e.msg)).join('; ')}</p>` : ''}
      <p class="muted">Confidenza della stima: ${Math.round(offRes.confidenza * 100)}%${offRes.confidenza < 0.6 ? ' — bassa: una parafrasi corretta potrebbe non essere riconosciuta, valuta tu.' : '.'} È una stima basata su parole chiave.</p></section>`);
    if (aiRes) parts.push(`<section class="card"><h2 style="margin-top:0">AI: ${aiRes.total}/${q.rubrica.max}</h2><ul>${aiRes.criteria.map((c) => `<li>${c.awarded}/${c.max} — ${esc(c.comment)}</li>`).join('')}</ul><p>${esc(aiRes.feedback)}</p>${aiRes.errors.length ? `<p class="notice">${aiRes.errors.map(esc).join('<br>')}</p>` : ''}<p class="muted">Correzione dell'AI: può sbagliare. La verifica dei risultati numerici resta affidata al motore esatto.</p></section>`);
    if (offRes) {
      const def = aiRes ? aiRes.total : offRes.punteggio;
      parts.push(`<section class="card"><h2 style="margin-top:0">Registra il punteggio</h2><label for="fin">Punteggio finale (0–${q.rubrica.max})</label><input id="fin" type="number" min="0" max="${q.rubrica.max}" step="0.5" value="${def}" style="max-width:120px">
        <div class="row" style="margin-top:8px"><button class="btn primary" id="reg">Conferma e registra</button><button class="btn" id="showr">Mostra risposta di riferimento (rubrica)</button></div><div id="rub" hidden>${crit({ criteri: q.rubrica.criteri.map((c) => ({ ...c, ok: true })) })}</div><p id="rmsg" role="status"></p></section>`);
    }
    root.querySelector('#res').innerHTML = parts.join(''); typeset(root.querySelector('#res'));
    const reg = root.querySelector('#reg');
    if (reg) { reg.addEventListener('click', () => {
      const v = Math.max(0, Math.min(q.rubrica.max, Number(root.querySelector('#fin').value) || 0));
      const log = st.get('teoria.log', []); log.push({ id: q.id, score: v, max: q.rubrica.max, fonte: aiRes && v === aiRes.total ? 'ai' : v === offRes.punteggio ? 'script' : 'manuale', data: new Date().toISOString() }); st.set('teoria.log', log.slice(-500));
      const ok = v / q.rubrica.max >= 0.6; recordResult('teoria:' + q.id, ok, { meta: { arg: q.argomenti[0] } });
      root.querySelector('#rmsg').textContent = `Registrato: ${v}/${q.rubrica.max} (${pct(v, q.rubrica.max)}%).${ok ? '' : ' Aggiunta alla coda di ripasso.'}`;
    }); root.querySelector('#showr').addEventListener('click', async () => { const b = root.querySelector('#rub'); b.hidden = !b.hidden; await typeset(b); }); }
  };
  root.querySelector('#off').addEventListener('click', () => { offRes = gradeWithRubric(root.querySelector('#ans').value, q.rubrica); render(); });
  const aib = root.querySelector('#aib');
  if (aib) aib.addEventListener('click', async () => {
    if (!offRes) offRes = gradeWithRubric(root.querySelector('#ans').value, q.rubrica);
    aib.disabled = true; aib.textContent = 'Correzione AI in corso…';
    aiErr = null;
    try { aiRes = await gradeWithAI(q, root.querySelector('#ans').value); }
    catch (e) { aiErr = e.message; }
    aib.disabled = false; aib.textContent = 'Correggi anche con AI'; render();
  });
  await typeset(root);
}
if (params.get('q') && D.some((q) => q.id === params.get('q'))) open(params.get('q')); else list();
