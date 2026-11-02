import { loadJSON, esc, url, badge } from '../ui.js';
const root = document.getElementById('root');
const R = await loadJSON('data/risorse.json'); const S = await loadJSON('data/syllabus.json');
const state = { blocco: 'tutti', tipo: 'tutti', lingua: 'tutte', licenza: 'tutte' };
const uniq = (k) => [...new Set(R.risorse.map((r) => r[k]))];
const opt = (id, label, vals, first) => `<div><label for="${id}">${label}</label><select id="${id}"><option value="${first[0]}">${first[1]}</option>${vals.map((v) => `<option>${esc(v)}</option>`).join('')}</select></div>`;
root.innerHTML = `<h1>Risorse gratuite</h1>
  <p>Link a materiali <strong>gratuiti e legali</strong>, con la mappa degli argomenti del programma che coprono e non coprono. Nessun file è copiato nel sito. Le risorse di terzi sono <span class="badge b-NONUFFICIALE">NON UFFICIALE</span>: non sono il corso del [docente].</p>
  <h2>Libri del corso</h2><div class="table-wrap"><table><thead><tr><th>Testo</th><th>Ruolo</th><th>Note</th><th>PDF legale gratuito?</th></tr></thead><tbody>${R.libri.map((l) => `<tr><td>${esc(l.titolo)}<br><small class="muted">${esc(l.autori)} — ${esc(l.editore)}</small> ${badge(l.badge)}</td><td>${esc(l.ruolo)}</td><td>${esc(l.note)}</td><td><strong>${l.pdf_gratuito ? 'sì' : 'No'}</strong></td></tr>`).join('')}</tbody></table></div>
  <div class="notice">${esc(R.dichiarazione_libri)}</div>
  <h2>Risorse online</h2>
  <form class="card" onsubmit="return false"><div class="row">
    <div><label for="fb">Blocco del programma</label><select id="fb"><option value="tutti">Tutti</option>${S.blocchi.map((b) => `<option value="${b.id}">${b.id} · ${esc(b.titolo)}</option>`).join('')}</select></div>
    ${opt('ft', 'Tipo', uniq('tipo'), ['tutti', 'Tutti'])}${opt('fl', 'Lingua', uniq('lingua'), ['tutte', 'Tutte'])}${opt('fc', 'Licenza', uniq('licenza'), ['tutte', 'Tutte'])}</div></form>
  <div id="lst"></div>
  <h2>Materiali di studenti a pagamento</h2><div class="notice">${esc(R.a_pagamento.avviso)} ${badge(R.a_pagamento.badge)}</div><p>${R.a_pagamento.siti.map((s) => esc(s.nome)).join(', ')} (nessun link a file scaricabili).</p>`;
const title = new Map(S.argomenti.map((a) => [a.id, a.titolo]));
const draw = () => {
  const list = R.risorse.filter((r) => (state.blocco === 'tutti' || r.copre.some((id) => id.startsWith(state.blocco + '-'))) && (state.tipo === 'tutti' || r.tipo === state.tipo) && (state.lingua === 'tutte' || r.lingua === state.lingua) && (state.licenza === 'tutte' || r.licenza === state.licenza));
  root.querySelector('#lst').innerHTML = list.map((r) => `<article class="card"><h3 style="margin-top:0"><a href="${esc(r.url)}" rel="noopener noreferrer">${esc(r.titolo)}</a> ${badge(r.badge)}</h3>
    <p class="muted">${esc(r.ente)} · ${esc(r.tipo)} · ${esc(r.lingua)} · licenza: ${esc(r.licenza)} · link controllato il ${esc(r.controllo)}${r.url2 ? ` · <a href="${esc(r.url2)}" rel="noopener noreferrer">altro link</a>` : ''}</p>
    <p>${esc(r.nota)}</p>
    <p><strong>Copre:</strong> ${r.copre.map((id) => `<a href="${url('studio/?t=' + id)}" title="${esc(title.get(id) || '')}">${esc(id)}</a>`).join(', ') || '—'}<br><strong>Non copre:</strong> ${r.non_copre.map((id) => `<a href="${url('studio/?t=' + id)}" title="${esc(title.get(id) || '')}">${esc(id)}</a>`).join(', ') || 'nulla di rilevante tra gli argomenti elencati'}</p></article>`).join('') || '<p>Nessuna risorsa con questi filtri.</p>';
};
for (const [id, k] of [['fb', 'blocco'], ['ft', 'tipo'], ['fl', 'lingua'], ['fc', 'licenza']]) root.querySelector('#' + id).addEventListener('change', (e) => { state[k] = e.target.value; draw(); });
draw();
