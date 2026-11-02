import { loadJSON, esc, url } from '../ui.js';
import { typeset } from '../katex.js';
import { pickBackend, createStore, mdToHtml, searchNotes, NotesError, MAX_NOTE_CHARS } from '../notes.js';

const root = document.getElementById('root');
const S = await loadJSON('data/syllabus.json');
const backend = await pickBackend(); const store = createStore(backend);
const params = new URLSearchParams(location.search);
let editing = null;

async function list() {
  const q = root.querySelector('#q') ? root.querySelector('#q').value : '';
  const notes = searchNotes(await store.list(), q);
  root.querySelector('#lst').innerHTML = notes.map((n) => `<article class="card"><h3 style="margin-top:0">${esc(n.titolo)}</h3><p class="muted">${(n.argomenti || []).map((a) => `<a href="${url('studio/?t=' + a)}">${esc(a)}</a>`).join(', ') || 'nessun argomento collegato'} · modificato il ${new Date(n.modificato).toLocaleDateString('it-IT')}</p>
    <div class="nbody">${mdToHtml(n.testo)}</div><div class="row"><button class="btn" data-e="${esc(n.id)}">Modifica</button><button class="btn danger" data-d="${esc(n.id)}">Elimina</button></div></article>`).join('') || '<p class="muted">Nessun appunto. Creane uno qui sopra.</p>';
  await typeset(root.querySelector('#lst'));
}
function form(n = {}) {
  editing = n.id || null;
  root.querySelector('#ed').innerHTML = `<h2 style="margin-top:0">${n.id ? 'Modifica appunto' : 'Nuovo appunto'}</h2>
    <label for="nt">Titolo</label><input id="nt" type="text" maxlength="200" value="${esc(n.titolo || '')}">
    <label for="na">Argomenti collegati (tieni premuto Ctrl/Cmd per più scelte)</label><select id="na" multiple size="6" style="max-width:100%">${S.argomenti.map((a) => `<option value="${a.id}"${(n.argomenti || []).includes(a.id) ? ' selected' : ''}>${a.id} · ${esc(a.titolo)}</option>`).join('')}</select>
    <label for="nx">Testo (Markdown; formule LaTeX con $…$)</label><textarea id="nx" rows="10" style="max-width:100%" maxlength="${MAX_NOTE_CHARS}">${esc(n.testo || '')}</textarea>
    <label style="font-weight:400">…oppure carica un file .md o .txt: <input id="nf" type="file" accept=".md,.txt,text/markdown,text/plain"></label>
    <div class="row" style="margin-top:8px"><button class="btn primary" id="ns">Salva</button><button class="btn" id="nc">Annulla</button></div><p id="nmsg" role="status"></p>`;
  root.querySelector('#ed').hidden = false;
  root.querySelector('#nf').addEventListener('change', async (e) => { const f = e.target.files[0]; if (!f) return; if (f.size > MAX_NOTE_CHARS) { root.querySelector('#nmsg').textContent = 'File troppo grande.'; return; } root.querySelector('#nx').value = await f.text(); if (!root.querySelector('#nt').value) root.querySelector('#nt').value = f.name.replace(/\.[^.]+$/, ''); });
  root.querySelector('#nc').addEventListener('click', () => { root.querySelector('#ed').hidden = true; });
  root.querySelector('#ns').addEventListener('click', async () => {
    const arg = [...root.querySelector('#na').selectedOptions].map((o) => o.value);
    try {
      await store.save({ ...n, id: editing || undefined, titolo: root.querySelector('#nt').value, testo: root.querySelector('#nx').value, argomenti: arg, blocchi: [...new Set(arg.map((a) => a.split('-')[0]))], creato: n.creato });
      root.querySelector('#ed').hidden = true; await list();
    } catch (e) { root.querySelector('#nmsg').textContent = e instanceof NotesError ? e.message : 'Salvataggio non riuscito: ' + e.message; }
  });
}
root.innerHTML = `<h1>Appunti personali</h1>
  <div class="notice">I tuoi appunti restano <strong>solo in questo browser</strong> (${esc(backend.kind)})${backend.kind !== 'IndexedDB' ? ' — spazio limitato: esporta spesso un backup' : ''}. Non vengono inviati da nessuna parte. Il testo è sanificato: l'HTML grezzo non viene eseguito.</div>
  <div class="row"><button class="btn primary" id="new">Nuovo appunto</button><button class="btn" id="exp">Esporta (JSON)</button><label class="btn" for="imp" style="margin:0">Importa…</label><input id="imp" type="file" accept="application/json,.json" hidden></div>
  <p id="gmsg" role="status"></p>
  <section class="card" id="ed" hidden></section>
  <div class="row"><label for="q" style="margin:0">Cerca</label><input id="q" type="search" placeholder="titolo, testo, argomento…" style="flex:1"></div>
  <div id="lst"></div>`;
root.querySelector('#new').addEventListener('click', () => form({ argomenti: params.get('t') ? [params.get('t')] : [] }));
root.querySelector('#q').addEventListener('input', list);
root.querySelector('#lst').addEventListener('click', async (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.e) form((await store.list()).find((n) => n.id === b.dataset.e));
  if (b.dataset.d && confirm('Eliminare questo appunto?')) { await store.remove(b.dataset.d); list(); }
});
root.querySelector('#exp').addEventListener('click', async () => { const blob = new Blob([await store.exportJSON()], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `appunti-${new Date().toISOString().slice(0, 10)}.json`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); });
root.querySelector('#imp').addEventListener('change', async (e) => { const f = e.target.files[0]; if (!f) return; try { const r = await store.importJSON(await f.text()); root.querySelector('#gmsg').textContent = `Importati ${r.importati} appunti (${r.saltati} già presenti).`; list(); } catch (err) { root.querySelector('#gmsg').textContent = err.message; } e.target.value = ''; });
if (params.get('t') && params.get('nuovo')) form({ argomenti: [params.get('t')] });
await list();
