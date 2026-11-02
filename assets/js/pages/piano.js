import { loadJSON, esc } from '../ui.js';
import { getStorage } from '../storage.js';
import { getAll } from '../progress.js';
import { buildPlan, toICS } from '../plan.js';

const root = document.getElementById('root');
const S = await loadJSON('data/syllabus.json'); const A = await loadJSON('data/appelli.json');
const st = getStorage();
const cfg = { oreSettimana: 8, esame: '', ordine: S.blocchi.map((b) => b.id), ...(st.get('piano', {}) || {}) };
if (!cfg.esame) { const d = new Date(); d.setDate(d.getDate() + 84); cfg.esame = d.toISOString().slice(0, 10); }
const title = Object.fromEntries(S.blocchi.map((b) => [b.id, b.titolo]));
const stato = () => Object.fromEntries(Object.entries(getAll()).map(([k, v]) => [k, v.stato]));

function draw() {
  const blocchi = cfg.ordine.map((id) => S.blocchi.find((b) => b.id === id));
  const piano = buildPlan({ esame: new Date(cfg.esame + 'T12:00:00'), oreSettimana: cfg.oreSettimana, blocchi, argomenti: S.argomenti, stato: stato() });
  root.querySelector('#out').innerHTML = `${piano.note.map((n) => `<p class="notice">${esc(n)}</p>`).join('')}
    <div class="table-wrap"><table><thead><tr><th>Settimana</th><th>Cosa fare</th></tr></thead><tbody>${piano.settimane.map((w) => `<tr><td>${new Date(w.inizio + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} – ${new Date(w.fine + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</td><td>${w.voci.map((v) => w.tipo === 'prove' ? `<strong>${esc(v.blocco)}</strong> (${v.ore} h): genera prove dalla pagina <em>Prove</em> e svolgile a tempo` : `Blocco ${esc(v.blocco)} — ${esc(title[v.blocco])} (${v.ore} h)`).join('<br>')}</td></tr>`).join('')}</tbody></table></div>
    <p class="muted">Pesi dei blocchi e ordine sono una stima ${'<span class="badge b-INFERENZA">INFERENZA</span>'}; i blocchi già studiati pesano meno. Il piano tiene conto dello stato di avanzamento nella pagina Programma.</p>`;
  root.querySelector('#ics').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([toICS(piano, { titoliBlocchi: title })], { type: 'text/calendar' })); a.download = 'piano-di-studio.ics'; document.body.append(a); a.click(); a.remove(); };
}
function order() {
  root.querySelector('#ord').innerHTML = cfg.ordine.map((id, i) => `<li>Blocco ${id} — ${esc(title[id])} <button class="btn" data-up="${i}" aria-label="Sposta su ${id}"${i === 0 ? ' disabled' : ''}>↑</button> <button class="btn" data-dn="${i}" aria-label="Sposta giù ${id}"${i === cfg.ordine.length - 1 ? ' disabled' : ''}>↓</button></li>`).join('');
}
const next = A.appelli.map((a) => a.data.slice(0, 10)).filter((d) => d >= new Date().toISOString().slice(0, 10)).sort()[0];
root.innerHTML = `<h1>Piano di studio</h1>
  <p>Inserisci la data dell'esame e le ore a settimana: il sito distribuisce i blocchi in base ai pesi stimati e a ciò che hai già studiato, riserva le ultime settimane alle prove complete a tempo, e ti permette di riordinare i blocchi, esportare in <code>.ics</code> e stampare.</p>
  <div class="notice">Le date degli appelli di gennaio/febbraio 2027 non sono ancora pubblicate: controlla Infostud e il sito del docente. ${next ? `Prossimo appello noto: ${esc(next)}.` : ''}</div>
  <form class="card" id="f"><div class="row"><div><label for="ex">Data dell'esame</label><input id="ex" type="date" value="${cfg.esame}"></div><div><label for="oh">Ore a settimana</label><input id="oh" type="number" min="1" max="60" value="${cfg.oreSettimana}" style="max-width:110px"></div></div></form>
  <section class="card"><h2 style="margin-top:0">Ordine dei blocchi</h2><p class="muted">Ordine ufficiale del programma; alcuni appunti di studenti anticipano la caratterizzazione esterna <span class="badge b-INFERENZA">INFERENZA</span>.</p><ol id="ord"></ol><button class="btn" id="rst">Ripristina l'ordine ufficiale</button></section>
  <div class="row no-print"><button class="btn primary" id="ics">Esporta .ics</button><button class="btn" id="pr">Stampa</button></div>
  <div id="out"></div>`;
const save = () => { st.set('piano', cfg); draw(); };
root.querySelector('#ex').addEventListener('change', (e) => { if (e.target.value) { cfg.esame = e.target.value; save(); } });
root.querySelector('#oh').addEventListener('input', (e) => { cfg.oreSettimana = Math.max(1, Number(e.target.value) || 8); save(); });
root.querySelector('#ord').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const i = Number(b.dataset.up ?? b.dataset.dn); const j = b.dataset.up !== undefined ? i - 1 : i + 1; [cfg.ordine[i], cfg.ordine[j]] = [cfg.ordine[j], cfg.ordine[i]]; order(); save(); });
root.querySelector('#rst').addEventListener('click', () => { cfg.ordine = S.blocchi.map((b) => b.id); order(); save(); });
root.querySelector('#pr').addEventListener('click', () => window.print());
order(); draw();
