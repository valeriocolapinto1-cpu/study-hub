import { generate } from '../generator.js';
import { VARIANTS, VARIANT_INFO } from '../templates/templateA.js';
import { renderCircuit } from '../svg/render.js';
import { statement, steps, answerLatex } from '../explain.js';
import { typeset } from '../katex.js';
import { esc } from '../ui.js';
import { getStorage } from '../storage.js';

const $ = (id) => document.getElementById(id);
$('var').innerHTML = '<option value="">Casuale</option>' + VARIANTS.map((v) => `<option value="${v}">${esc(VARIANT_INFO[v])}</option>`).join('');
const params = new URLSearchParams(location.search);
$('lvl').value = params.get('lvl') || '1';
$('var').value = params.get('var') || '';
const newSeed = () => String(Math.floor(Math.random() * 1e6));
$('seed').value = params.get('seed') || newSeed();

let current = null;
async function show() {
  const level = Number($('lvl').value), variant = $('var').value || undefined, seed = $('seed').value.trim() || newSeed();
  history.replaceState(null, '', `?lvl=${level}&seed=${encodeURIComponent(seed)}${variant ? '&var=' + variant : ''}`);
  let g;
  try { g = generate({ template: 'A', level, variant, seed }); } catch (e) { $('ex').innerHTML = `<div class="notice">Impossibile generare l'esercizio: ${esc(e.message)}</div>`; return; }
  current = g;
  const { svg } = renderCircuit(g.inst.circuit, g.inst.layout, { omega: g.inst.omega });
  $('ex').innerHTML = `<section class="card"><p class="muted">Seed <code>${esc(seed)}</code> · livello ${level} · ${esc(VARIANT_INFO[g.inst.variant])} · verifica indipendente superata (errore ${g.check.maxErr.toExponential(1)})</p>
    <p>${statement(g.inst, g.sol)}</p>
    <figure class="fig"><div style="overflow-x:auto">${svg}</div><figcaption>Schema generato dalla stessa descrizione usata per il calcolo.</figcaption></figure>
    <button class="btn" id="sol">Mostra soluzione passo-passo</button><div id="solbox" hidden></div></section>`;
  $('sol').addEventListener('click', async () => {
    const box = $('solbox');
    if (!box.hidden) { box.hidden = true; return; }
    box.innerHTML = `<ol>${steps(g.inst, g.sol).map((s) => `<li><strong>${esc(s.titolo)}.</strong> ${s.testo.map((t) => `<p>${t}</p>`).join('')}</li>`).join('')}</ol>
      <div class="card right"><strong>Risposta:</strong> $$${answerLatex(g.sol)}$$</div>`;
    box.hidden = false; await typeset(box);
    const st = getStorage(); const ex = st.get('esercizi', {}); ex.visti = (ex.visti || 0) + 1; st.set('esercizi', ex);
  });
  await typeset($('ex'));
}
$('ctl').addEventListener('submit', (e) => { e.preventDefault(); show(); });
$('new').addEventListener('click', () => { $('seed').value = newSeed(); show(); });
$('same').addEventListener('click', () => { $('seed').value = newSeed(); show(); });
show();
