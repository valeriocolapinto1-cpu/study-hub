import { generate } from '../generator.js';
import { TEMPLATES, TEMPLATE_INFO } from '../templates/index.js';
import { renderCircuit } from '../svg/render.js';
import { statement, steps, guidedSteps, answerLatex } from '../explain.js';
import { gradeAnswer, gradeNumber, compareExpr } from '../grader/exercise.js';
import { STEP_KINDS, APPLIED_KINDS, generateStep, generateApplied, gradeProblem } from '../problems.js';
import { recordAttempt } from '../stats.js';
import { recordResult } from '../srs.js';
import { aiEnabled, explainMistake } from '../grader/ai-adapter.js';
import { typeset } from '../katex.js';
import { esc, url } from '../ui.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
let mode = params.get('m') || 'completo';
const newSeed = () => String(Math.floor(Math.random() * 1e6));

$('tpl').innerHTML = '<option value="any">Casuale</option>' + Object.keys(TEMPLATES).map((k) => `<option value="${k}">${k} · ${esc(TEMPLATE_INFO[k])}</option>`).join('');
$('stepk').innerHTML = STEP_KINDS.map((s) => `<option value="${s.kind}">${s.titolo}</option>`).join('');
$('appk').innerHTML = APPLIED_KINDS.map((s) => `<option value="${s.kind}">${esc(s.titolo)} (blocco ${s.blocco})</option>`).join('');
$('lvl').value = params.get('lvl') || '1'; $('tpl').value = params.get('tpl') || 'any';
$('stepk').value = params.get('sk') || STEP_KINDS[0].kind; $('appk').value = params.get('ak') || APPLIED_KINDS[0].kind;
$('seed').value = params.get('seed') || newSeed();

function syncMode() {
  const adv = document.getElementById('adv'); if (adv && mode !== 'completo') adv.open = true;
  document.querySelectorAll('#modes button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.m === mode));
  document.querySelectorAll('#ctl [data-for]').forEach((d) => { d.hidden = !d.dataset.for.split(' ').includes(mode); });
}

const fieldHTML = (c, pre) => {
  const id = `${pre}-${c.key}`;
  if (c.tipo === 'scelta') return `<div class="fld"><label for="${id}">${c.label}</label><select id="${id}" data-key="${c.key}"><option value="">—</option>${c.opzioni.map((o, i) => `<option value="${i}">${esc(o)}</option>`).join('')}</select><span class="res" aria-live="polite"></span></div>`;
  return `<div class="fld"><label for="${id}">${c.label}</label><input type="text" id="${id}" data-key="${c.key}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${c.tipo === 'expr' ? 'es. 2+3cos(t)  oppure  4e^(-t/3)' : 'numero o frazione, es. 14/37'}"><span class="res" aria-live="polite"></span></div>`;
};
const mark = (el, ok, err) => { const r = el.closest('.fld').querySelector('.res'); r.textContent = err ? ` ⚠ ${err}` : ok ? ' ✓' : ' ✗'; r.style.color = ok ? 'var(--ok)' : 'var(--bad)'; };
const svgOf = (inst) => renderCircuit(inst.circuit, inst.layout, { omega: inst.omega }).svg;
const solHTML = (arr) => `<ol>${arr.map((s) => `<li>${s.titolo ? `<strong>${esc(s.titolo)}.</strong> ` : ''}${(s.testo || [s]).map((t) => `<p>${t}</p>`).join('')}</li>`).join('')}</ol>`;
const started = () => Date.now();

async function showCompleto(guided) {
  const level = Number($('lvl').value), template = $('tpl').value, seed = $('seed').value.trim() || newSeed();
  let g;
  try { g = generate({ template, level, seed }); } catch (e) { $('ex').innerHTML = `<div class="notice">Impossibile generare l'esercizio: ${esc(e.message)}</div>`; return; }
  const t0 = started();
  const info = `Seed <code>${esc(seed)}</code> · livello ${level} · tipo ${g.inst.template} · verifica indipendente superata (errore ${g.check.maxErr.toExponential(1)})`;
  const head = `<p class="muted">${info}</p><p>${statement(g.inst, g.sol)}</p><figure class="fig"><div style="overflow-x:auto">${svgOf(g.inst)}</div><figcaption>Schema generato dalla stessa descrizione usata per il calcolo.</figcaption></figure>`;
  if (!guided) {
    $('ex').innerHTML = `<section class="card">${head}
      <div class="fld-group">${fieldHTML({ key: 'pre', label: '$v_{out}(t)$ per $t<0$', tipo: 'expr' }, 'a')}${fieldHTML({ key: 'post', label: '$v_{out}(t)$ per $t>0$', tipo: 'expr' }, 'a')}</div>
      <p class="muted">Sintassi: <code>cos(t)</code>, <code>sin(2t)</code>, <code>e^(-t/3)</code>, frazioni <code>14/37</code>, decimali. Per $t>0$ puoi scrivere anche <code>u(t)</code>.</p>
      <div class="row"><button class="btn primary" id="chk">Controlla</button><button class="btn" id="sol">Mostra soluzione passo-passo</button></div>
      <div id="fb" role="status"></div><div id="solbox" hidden></div></section>`;
    $('chk').addEventListener('click', () => {
      const r = gradeAnswer(g.sol, { pre: $('a-pre').value, post: $('a-post').value });
      mark($('a-pre'), r.pre.ok, r.pre.parseError); mark($('a-post'), r.post.ok, r.post.parseError);
      $('fb').innerHTML = `<p><strong>Punteggio: ${Math.round(r.score * 100)}%</strong></p>${r.hints.map((h) => `<p class="notice">${esc(h)}</p>`).join('')}`;
      recordAttempt({ mode: 'completo', template: g.inst.template, level, seed, score: r.score, seconds: Math.round((Date.now() - t0) / 1000) });
      recordResult(`ex:${g.inst.template}:${level}:${seed}`, r.score === 1, { meta: { arg: 'III-02' } });
      if (r.score < 1 && aiEnabled()) {
        $('fb').insertAdjacentHTML('beforeend', '<p><button class="btn" id="expl">Spiega il mio errore (AI)</button></p><div id="explbox"></div>');
        $('expl').addEventListener('click', async () => {
          $('expl').disabled = true; $('explbox').textContent = 'Un momento…';
          try { const t = await explainMistake({ testo: statement(g.inst, g.sol).replace(/<[^>]+>/g, ''), passiCorretti: steps(g.inst, g.sol).flatMap((s) => [s.titolo + ':', ...s.testo]).map((x) => x.replace(/<[^>]+>/g, '')), rispostaUtente: `t<0: ${$('a-pre').value} | t>0: ${$('a-post').value}` }); $('explbox').innerHTML = `<div class="notice">${esc(t)}</div><p class="muted">Spiegazione generata da AI sulla base dei passaggi calcolati dal motore esatto.</p>`; }
          catch (e) { $('explbox').textContent = 'Spiegazione non disponibile: ' + e.message; }
          $('expl').disabled = false;
        });
      }
    });
    $('sol').addEventListener('click', async () => {
      const box = $('solbox'); if (!box.hidden) { box.hidden = true; return; }
      box.innerHTML = `${solHTML(steps(g.inst, g.sol))}<div class="card right"><strong>Risposta:</strong> $$${answerLatex(g.sol)}$$</div>`;
      box.hidden = false; await typeset(box);
    });
  } else {
    const gs = guidedSteps(g.inst, g.sol);
    $('ex').innerHTML = `<section class="card">${head}<h2>Percorso guidato</h2>${gs.map((s) => `<details class="gstep" data-n="${s.n}"${s.n === 1 ? ' open' : ''}><summary>Passo ${s.n} — ${esc(s.titolo)}</summary>
      <p><button class="btn hint">Suggerimento</button></p><div class="hintbox" hidden><p>${s.suggerimento}</p></div>
      ${s.campi.map((c) => fieldHTML(c, `g${s.n}`)).join('')}
      <div class="row">${s.campi.length ? '<button class="btn primary chk">Verifica</button>' : ''}<button class="btn showsol">Mostra il passo svolto</button></div>
      <div class="solbox" hidden>${s.soluzione.map((t) => `<p>${t}</p>`).join('')}</div></details>`).join('')}</section>`;
    let okSteps = 0, totSteps = gs.filter((s) => s.campi.length).length;
    const done = new Set();
    document.querySelectorAll('.gstep').forEach((d, i) => {
      const s = gs[i];
      d.querySelector('.hint').addEventListener('click', async () => { const b = d.querySelector('.hintbox'); b.hidden = !b.hidden; await typeset(b); });
      d.querySelector('.showsol').addEventListener('click', async () => { const b = d.querySelector('.solbox'); b.hidden = !b.hidden; await typeset(b); });
      const chk = d.querySelector('.chk');
      if (chk) chk.addEventListener('click', () => {
        let all = true;
        for (const c of s.campi) {
          const el = d.querySelector(`[data-key="${c.key}"]`);
          const r = c.tipo === 'expr' ? compareExpr(el.value, c.atteso, c.region, { env: { w: g.sol.omega ? g.sol.omega.toNumber() : 0 } }) : gradeNumber(el.value, c.atteso);
          mark(el, r.ok, r.parseError); all = all && r.ok;
        }
        if (all && !done.has(s.n)) { done.add(s.n); okSteps += 1; }
        if (done.size === totSteps) recordAttempt({ mode: 'guidato', template: g.inst.template, level, seed, score: 1, seconds: Math.round((Date.now() - t0) / 1000) });
      });
    });
  }
  await typeset($('ex'));
}

async function showProblem(p, modeName) {
  const t0 = started();
  const fig = p.inst ? `<figure class="fig"><div style="overflow-x:auto">${renderCircuit(p.inst.circuit, p.inst.layout, { omega: p.inst.omega, outLabel: p.outLabel ? p.outLabel.replace(/[{}\\]/g, '') : 'v_out' }).svg}</div></figure>` : '';
  const studio = (p.studio || []).map((id) => `<a href="${url('studio/?t=' + id)}">${id}</a>`).join(', ');
  $('ex').innerHTML = `<section class="card"><p class="muted">${esc(p.titolo)} · blocco ${esc(p.blocco)} · seed <code>${esc(String(p.seed))}</code>${studio ? ' · teoria: ' + studio : ''}</p><p>${p.testo}</p>${fig}
    ${p.campi.map((c) => fieldHTML(c, 'p')).join('')}
    <div class="row"><button class="btn primary" id="chk">Controlla</button><button class="btn" id="sol">Mostra soluzione</button></div><div id="fb" role="status"></div><div id="solbox" hidden>${solHTML(p.soluzione)}</div></section>`;
  $('chk').addEventListener('click', () => {
    const ans = {}; for (const c of p.campi) ans[c.key] = $(`p-${c.key}`).value;
    const r = gradeProblem(p, ans);
    for (const c of p.campi) mark($(`p-${c.key}`), r.per[c.key].ok, r.per[c.key].parseError);
    $('fb').innerHTML = `<p><strong>Punteggio: ${Math.round(r.score * 100)}%</strong></p>`;
    recordAttempt({ mode: modeName, kind: p.kind, level: Number($('lvl').value), seed: p.seed, score: r.score, seconds: Math.round((Date.now() - t0) / 1000) });
  });
  $('sol').addEventListener('click', async () => { const b = $('solbox'); b.hidden = !b.hidden; await typeset(b); });
  await typeset($('ex'));
}

async function show() {
  syncMode();
  const seed = $('seed').value.trim() || newSeed();
  const q = new URLSearchParams({ m: mode, lvl: $('lvl').value, tpl: $('tpl').value, sk: $('stepk').value, ak: $('appk').value, seed });
  history.replaceState(null, '', '?' + q.toString());
  try {
    if (mode === 'completo') await showCompleto(false);
    else if (mode === 'guidato') await showCompleto(true);
    else if (mode === 'passo') await showProblem(generateStep($('stepk').value, { level: Number($('lvl').value), seed, template: 'any' }), 'passo');
    else await showProblem(generateApplied($('appk').value, seed), 'applicate');
  } catch (e) { $('ex').innerHTML = `<div class="notice">Errore: ${esc(e.message)}</div>`; }
}
$('modes').addEventListener('click', (e) => { const b = e.target.closest('button[data-m]'); if (!b) return; mode = b.dataset.m; show(); });
$('ctl').addEventListener('submit', (e) => { e.preventDefault(); show(); });
$('new').addEventListener('click', () => { $('seed').value = newSeed(); show(); });
$('same').addEventListener('click', () => { $('seed').value = newSeed(); show(); });
show();
