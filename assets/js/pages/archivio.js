import { loadJSON, esc, badge } from '../ui.js';
const root = document.getElementById('root');
const D = await loadJSON('data/archivio.json');
const fmt = (s) => new Date(s + 'T12:00:00').toLocaleDateString('it-IT', { dateStyle: 'long' });
const tutti = D.appelli.slice().sort((a, b) => a.data.localeCompare(b.data));
const args = [...new Set(tutti.flatMap((a) => a.argomenti))].sort((a, b) => a.localeCompare(b, 'it'));
root.innerHTML = `<h1>Archivio prove</h1>
  <div class="notice"><strong>Nessun testo, figura o soluzione del docente è incluso.</strong> Gli appelli sono citati solo per <em>data e argomento</em>, con parole nostre ${badge('STORICO')}. I testi originali si trovano nei link ufficiali qui sotto (il Drive richiede l'account istituzionale).</div>
  <section class="card"><h2 style="margin-top:0">Fonti ufficiali</h2><ul>${D.link.map((l) => `<li><a href="${esc(l.url)}" rel="noopener noreferrer">${esc(l.titolo)}</a> ${badge(l.badge)}<br><small class="muted">${esc(l.nota)}</small></li>`).join('')}</ul></section>
  <section class="card"><h2 style="margin-top:0">Periodi</h2><ul>${D.periodi.map((p) => `<li><strong>${esc(p.titolo)}</strong> ${badge(p.badge)} — ${esc(p.descrizione)}</li>`).join('')}</ul></section>
  <section class="card"><h2 style="margin-top:0">Esercizi 2015–2024: sintesi</h2><p>${D.sintesi_2015_2024.esercizi} esercizi in ${D.sintesi_2015_2024.appelli} appelli ${badge('STORICO')}. Ingresso per $t<0$: continua ${D.sintesi_2015_2024.ingresso.continua}, sinusoidale ${D.sintesi_2015_2024.ingresso.sinusoidale}, mista ${D.sintesi_2015_2024.ingresso.mista}. Elemento che complica il circuito: ${Object.entries(D.sintesi_2015_2024.elementi).map(([k, v]) => `${esc(k)} (${v})`).join(', ')}. <small class="muted">${esc(D.sintesi_2015_2024.nota)}</small></p></section>
  <h2>Appelli 2000–2009</h2>
  <div class="row"><label for="fa" style="margin:0">Filtra per argomento</label><select id="fa"><option value="">Tutti</option>${args.map((a) => `<option>${esc(a)}</option>`).join('')}</select></div>
  <div class="table-wrap"><table><thead><tr><th>Data</th><th>Argomenti</th><th>Tipo di ingresso</th><th>Elementi</th><th></th></tr></thead><tbody id="tb"></tbody></table></div>`;
const draw = (f) => { root.querySelector('#tb').innerHTML = tutti.filter((a) => !f || a.argomenti.includes(f)).map((a) => `<tr><td>${esc(fmt(a.data))}</td><td>${a.argomenti.map(esc).join(', ')}</td><td>${esc(a.ingresso)}</td><td>${a.elementi.map(esc).join(', ') || '—'}</td><td>${badge('STORICO')}</td></tr>`).join(''); };
draw(''); root.querySelector('#fa').addEventListener('change', (e) => draw(e.target.value));
