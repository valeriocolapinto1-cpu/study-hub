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

const SECTIONS = [['progress', 'Progresso'], ['quiz.log', 'Storico quiz'], ['esercizi.log', 'Storico esercizi'], ['teoria.log', 'Storico teoria'], ['prove.storico', 'Prove svolte'], ['srs', 'Ripasso'], ['formulario', 'Segnalibri formulario'], ['piano', 'Piano di studio'], ['settings', 'Impostazioni'], ['notes', 'Appunti (copia di ripiego)']];
const row = document.getElementById('reset-row');
row.innerHTML = SECTIONS.map(([k, l]) => `<button class="btn danger" data-k="${k}">Azzera ${l}</button>`).join('');
row.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-k]'); if (!b) return;
  if (!confirm(`Azzerare «${b.textContent.replace('Azzera ', '')}»? L'operazione non si può annullare.`)) return;
  const n = st.reset(b.dataset.k); applyTheme(); say(`Cancellate ${n} voci.`);
});

// ── Correzione con AI ──
import { getConfig, saveConfig, getKey, setKey, clearKey, testConnection, DEFAULTS } from '../grader/ai-adapter.js';
(() => {
  const g = (id) => document.getElementById(id), msg = g('ai-msg');
  const cfg = getConfig();
  g('prov').value = cfg.provider;
  g('a-url').value = cfg.anthropic.baseUrl; g('a-model').value = cfg.anthropic.model; g('a-ver').value = cfg.anthropic.version; g('a-hdr').value = cfg.anthropic.browserHeader;
  g('o-url').value = cfg.openai.baseUrl; g('o-model').value = cfg.openai.model;
  g('key').placeholder = getKey() ? '•••••••• (chiave impostata)' : 'incolla qui la chiave';
  const sync = () => { g('p-anthropic').hidden = g('prov').value !== 'anthropic'; g('p-openai').hidden = g('prov').value !== 'openai'; };
  g('prov').addEventListener('change', sync); sync();
  const read = () => ({ ...DEFAULTS, provider: g('prov').value, anthropic: { baseUrl: g('a-url').value.trim(), model: g('a-model').value.trim(), version: g('a-ver').value.trim(), browserHeader: g('a-hdr').value.trim() }, openai: { baseUrl: g('o-url').value.trim(), model: g('o-model').value.trim() } });
  const save = () => { saveConfig(read()); const k = g('key').value.trim(); if (k) { setKey(k, g('rem').checked); g('key').value = ''; g('key').placeholder = '•••••••• (chiave impostata)'; } };
  g('ai-save').addEventListener('click', () => { save(); msg.textContent = 'Impostazioni salvate.'; });
  g('ai-clear').addEventListener('click', () => { clearKey(); g('key').value = ''; g('key').placeholder = 'incolla qui la chiave'; msg.textContent = 'Chiave cancellata da questo browser.'; });
  g('ai-test').addEventListener('click', async () => {
    save(); msg.textContent = 'Test in corso…';
    try { const t = await testConnection(); msg.textContent = `Connessione riuscita (risposta: «${t}»).`; } catch (e) { msg.textContent = 'Test non riuscito: ' + e.message; }
  });
})();
