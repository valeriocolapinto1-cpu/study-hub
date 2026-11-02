import { loadJSON, esc, badge } from '../ui.js';
import { summary } from '../progress.js';
import { stats } from '../srs.js';
(async () => {
  const el = document.getElementById('scad-body');
  try {
    const d = await loadJSON('data/appelli.json');
    const now = Date.now();
    const next = d.appelli.map((a) => ({ ...a, t: new Date(a.data).getTime() })).filter((a) => a.t >= now).sort((a, b) => a.t - b.t)[0];
    el.innerHTML = (next
      ? `<p><strong>${esc(new Date(next.data).toLocaleString('it-IT', { dateStyle: 'full', ...(next.data.includes('T') ? { timeStyle: 'short' } : {}) }))}</strong> — ${esc(next.tipo)} ${badge(next.badge)}</p>`
      : `<p>Nessun appello futuro pubblicato. ${badge(d.badgeProssimi)}</p>`)
      + `<p class="muted">${esc(d.prossimi)} Controlla Infostud, catalogo e sito del docente: le date cambiano.</p>`;
    const syl = await loadJSON('data/syllabus.json');
    const s = summary(syl.argomenti);
    document.querySelector('#home-bar i').style.width = s.pct + '%';
    document.getElementById('home-bar').setAttribute('aria-valuenow', s.pct);
    document.getElementById('home-prog').textContent = `${s.done} argomenti su ${s.total} studiati (${s.pct}%).`;
  } catch (e) { el.textContent = 'Dati non disponibili: ' + e.message; }
  const s = stats(); const r = document.getElementById('home-rip');
  if (r) r.innerHTML = s.due ? `<strong>${s.due}</strong> ${s.due === 1 ? 'voce' : 'voci'} da ripassare oggi. <a class="btn primary" href="quiz/">Ripassa</a>` : 'Nessuna voce in scadenza oggi. Le domande sbagliate dei quiz e delle domande di teoria rientrano qui a intervalli crescenti.';
})();
