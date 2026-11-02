import { loadJSON, esc, url } from '../ui.js';
import { getStorage } from '../storage.js';
import { getAll } from '../progress.js';
import { stats } from '../srs.js';
import { computeMetrics, suggestNext } from '../metrics.js';

const root = document.getElementById('root');
const S = await loadJSON('data/syllabus.json'); const st = getStorage();
const data = { progress: getAll(), quizLog: st.get('quiz.log', []), eserciziLog: st.get('esercizi.log', []), teoriaLog: st.get('teoria.log', []), prove: st.get('prove.storico', []), srsItems: (st.get('srs', { items: {} }) || { items: {} }).items, argomenti: S.argomenti, blocchi: S.blocchi };
const m = computeMetrics(data); const sug = suggestNext(data); const rip = stats();
const color = (q, stato) => (q === null ? (stato === 'non iniziato' ? 'var(--bg-2)' : 'var(--info)') : `color-mix(in srgb, var(--ok) ${Math.round(q * 100)}%, var(--bad))`);
const chart = () => {
  const p = m.prove; if (!p.length) return '<p class="muted">Nessuna prova svolta: l\'andamento comparirà dopo la prima prova.</p>';
  const W = 320, H = 140, max = 63, x = (i) => 30 + (p.length === 1 ? 130 : (i * 260) / (p.length - 1)), y = (v) => H - 20 - ((H - 40) * v) / max;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Andamento dei punteggi delle prove: ${p.map((q) => q.totale).join(', ')}" style="max-width:480px"><g stroke="currentColor" fill="none" stroke-width="1.5"><polyline points="30,10 30,${H - 20} ${W - 10},${H - 20}"/><polyline stroke="var(--accent)" stroke-width="2" points="${p.map((q, i) => `${x(i)},${y(q.totale)}`).join(' ')}"/></g>${p.map((q, i) => `<circle cx="${x(i)}" cy="${y(q.totale)}" r="3.5" fill="var(--accent)"/><text x="${x(i)}" y="${y(q.totale) - 8}" font-size="10" text-anchor="middle" fill="currentColor">${q.totale}</text>`).join('')}<text x="6" y="14" font-size="10" fill="currentColor">${max}</text></svg>`;
};
root.innerHTML = `<h1>Progresso</h1>
  <div class="grid"><div class="card"><h3 style="margin-top:0">Serie di giorni</h3><p style="font-size:1.8rem;margin:0"><strong>${m.serie}</strong></p><p class="muted">giorni consecutivi di studio (${m.giorniAttivi} giorni attivi in tutto)</p></div>
  <div class="card"><h3 style="margin-top:0">Ripasso</h3><p style="font-size:1.8rem;margin:0"><strong>${rip.due}</strong> in scadenza</p><p class="muted">${rip.total} voci in coda · <a href="${url('quiz/')}">vai al ripasso</a></p></div>
  <div class="card"><h3 style="margin-top:0">Prove</h3><p style="font-size:1.8rem;margin:0"><strong>${m.prove.length}</strong></p><p class="muted"><a href="${url('prova/')}">svolgi una prova</a></p></div></div>
  <section class="card"><h2 style="margin-top:0">Cosa studiare ora</h2>${sug.length ? `<ol>${sug.map((s) => `<li><a href="${url('studio/?t=' + s.id)}">${esc(s.id)} · ${esc(s.titolo)}</a> <span class="muted">— ${esc(s.motivo)}</span></li>`).join('')}</ol>` : '<p>Nessun suggerimento: ottimo lavoro!</p>'}<p class="muted">Suggerimento calcolato dai punti deboli (quiz), dagli argomenti non studiati e dalle scadenze del ripasso <span class="badge b-INFERENZA">INFERENZA</span>.</p></section>
  <section class="card"><h2 style="margin-top:0">Avanzamento per blocco</h2>${m.perBlocco.map((b) => `<p style="margin:.5em 0">Blocco ${esc(b.id)} — ${esc(b.titolo)}: ${b.studiati}/${b.totale}<span class="bar" style="display:block" role="progressbar" aria-valuenow="${b.pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${b.pct}%"></i></span></p>`).join('')}</section>
  <section class="card"><h2 style="margin-top:0">Mappa di calore: argomento × esito quiz</h2><p class="muted">Verde = quiz quasi sempre giusti, rosso = spesso sbagliati, azzurro = studiato ma senza quiz, grigio = non iniziato.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(46px,1fr));gap:4px">${m.heat.map((h) => `<a href="${url('studio/?t=' + h.id)}" title="${esc(h.id + ' · ' + h.titolo + (h.quiz === null ? '' : ` — quiz ${Math.round(h.quiz * 100)}% (${h.n})`))}" style="display:block;min-height:44px;border:1px solid var(--line);border-radius:6px;background:${color(h.quiz, h.stato)};color:var(--fg);font-size:.7rem;padding:2px;text-decoration:none;text-align:center">${esc(h.id)}</a>`).join('')}</div></section>
  <section class="card"><h2 style="margin-top:0">Esercizi per tipo e livello</h2>${m.esercizi.length ? `<div class="table-wrap"><table><thead><tr><th>Tipo / livello</th><th>Svolti</th><th>Successo</th><th>Tempo medio</th></tr></thead><tbody>${m.esercizi.map((e) => `<tr><td>${esc(e.chiave.replace('|', ' · livello '))}</td><td>${e.n}</td><td>${Math.round(e.successo * 100)}%</td><td>${e.tempoMedio === null ? '—' : Math.round(e.tempoMedio / 60 * 10) / 10 + ' min'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Nessun esercizio svolto.</p>'}</section>
  <section class="card"><h2 style="margin-top:0">Quiz per blocco</h2>${Object.keys(m.quizBlk).length ? `<ul>${Object.entries(m.quizBlk).sort().map(([b, o]) => `<li>Blocco ${esc(b)}: ${o.ok}/${o.n} (${Math.round((100 * o.ok) / o.n)}%)</li>`).join('')}</ul>` : '<p class="muted">Nessuna risposta ai quiz.</p>'}</section>
  <section class="card"><h2 style="margin-top:0">Andamento delle prove</h2>${chart()}</section>
  <p class="muted">I dati restano nel tuo browser. Backup e azzeramento per sezione: <a href="${url('impostazioni/')}">Impostazioni</a>.</p>`;
