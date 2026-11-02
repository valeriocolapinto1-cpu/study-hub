import { loadJSON, esc, badge } from '../ui.js';
export async function renderAppelli(el) {
  try {
    const d = await loadJSON('data/appelli.json');
    const fmt = (s) => new Date(s).toLocaleString('it-IT', { dateStyle: 'long', ...(s.includes('T') ? { timeStyle: 'short' } : {}) });
    el.innerHTML = `<ul>${d.appelli.map((a) => `<li><strong>${esc(fmt(a.data))}</strong> (${esc(a.tipo)}): ${esc(a.note)} ${badge(a.badge)}</li>`).join('')}</ul>
      <p>${esc(d.prossimi)} ${badge(d.badgeProssimi)}</p><p class="muted">Dati aggiornati al ${esc(d.aggiornatoIl)}.</p>`;
    return d;
  } catch (e) { el.textContent = 'Impossibile caricare gli appelli (' + e.message + ').'; }
}
