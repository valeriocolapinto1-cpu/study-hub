import { getStorage } from '../storage.js';
import { applyTheme } from '../app.js';
import { esc } from '../ui.js';
const st = getStorage();
const msg = document.getElementById('msg');
const say = (t) => { msg.textContent = t; };
const sel = document.getElementById('tema');
sel.value = (st.get('settings', {}) || {}).tema || 'auto';
sel.addEventListener('change', () => { const s = st.get('settings', {}) || {}; s.tema = sel.value; st.set('settings', s); applyTheme(); say('Tema salvato.'); });

document.getElementById('exp').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(st.exportAll(), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `teoria-circuiti-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  say('Backup esportato.');
});

const prev = document.getElementById('imp-prev');
document.getElementById('imp').addEventListener('change', async (e) => {
  const f = e.target.files[0]; if (!f) return;
  let obj;
  try { obj = JSON.parse(await f.text()); } catch (err) { prev.hidden = false; prev.textContent = 'Il file non è un JSON valido.'; return; }
  const p = st.previewImport(obj);
  prev.hidden = false;
  if (!p.valid) { prev.innerHTML = '<strong>Import non possibile:</strong> ' + p.errors.map(esc).join('; '); return; }
  prev.innerHTML = `<strong>Anteprima import</strong> (esportato il ${esc(p.exportedAt || 'n/d')})
    <ul>${p.sections.map((s) => `<li>${esc(s.key)} — ${s.bytes} caratteri${s.willOverwrite ? ' <strong>(sovrascrive i dati attuali)</strong>' : ''}</li>`).join('')}</ul>
    <div class="row"><button class="btn primary" id="go">Conferma e sovrascrivi</button><button class="btn" id="no">Annulla</button></div>`;
  prev.querySelector('#no').onclick = () => { prev.hidden = true; e.target.value = ''; };
  prev.querySelector('#go').onclick = () => { const n = st.applyImport(obj); prev.hidden = true; e.target.value = ''; applyTheme(); say(`Importate ${n} sezioni.`); };
});

const SECTIONS = [['progress', 'Progresso'], ['srs', 'Ripasso'], ['settings', 'Impostazioni'], ['notes', 'Appunti']];
const row = document.getElementById('reset-row');
row.innerHTML = SECTIONS.map(([k, l]) => `<button class="btn danger" data-k="${k}">Azzera ${l}</button>`).join('');
row.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-k]'); if (!b) return;
  if (!confirm(`Azzerare «${b.textContent.replace('Azzera ', '')}»? L'operazione non si può annullare.`)) return;
  const n = st.reset(b.dataset.k); applyTheme(); say(`Cancellate ${n} voci.`);
});
