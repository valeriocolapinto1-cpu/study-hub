import { loadJSON, esc, url, badge } from '../ui.js';
import { getStato, setStato, STATI } from '../progress.js';
(async () => {
  const root = document.getElementById('studio-root');
  const t = new URLSearchParams(location.search).get('t');
  const syl = await loadJSON('data/syllabus.json');
  if (!t) {
    root.innerHTML = '<h1>Studio</h1><p>Scegli un argomento dal <a href="' + url('programma/') + '">Programma</a>.</p>';
    return;
  }
  const a = syl.argomenti.find((x) => x.id === t);
  if (!a) { root.innerHTML = '<h1>Argomento non trovato</h1><p><a href="' + url('programma/') + '">Torna al Programma</a></p>'; return; }
  document.title = a.titolo;
  const blocco = syl.blocchi.find((b) => b.id === a.blocco);
  const pre = a.prerequisiti.map((id) => syl.argomenti.find((x) => x.id === id)).filter(Boolean);
  let content = null;
  if (a.contenuto) { try { content = await loadJSON(`data/studio/${a.id}.json`); } catch (e) { content = null; } }
  const render = () => {
    const st = getStato(a.id);
    root.innerHTML = `<p class="muted">Blocco ${esc(blocco.id)} — ${esc(blocco.titolo)}</p><h1>${esc(a.titolo)}</h1>
      <p>${badge('UFFICIALE')} argomento del programma · importanza per l'esercizio d'analisi: ${'●'.repeat(a.peso)}${'○'.repeat(3 - a.peso)} ${badge('INFERENZA')}</p>
      <h2>Prerequisiti</h2>${pre.length ? `<ul>${pre.map((p) => `<li><a href="${url(p.pagina)}">${esc(p.id)} · ${esc(p.titolo)}</a> <span class="muted">[${esc(getStato(p.id))}]</span></li>`).join('')}</ul>` : '<p>Nessuno.</p>'}
      ${content ? '' : '<div class="notice">Pagina di teoria in preparazione: sarà completata nelle fasi di contenuto (blocchi I–II: fase 2; III–VI: fase 7).</div>'}
      <h2>Il tuo stato</h2><div class="row"><span>Stato attuale: <strong class="st-${st.replace(' ', '')}">${esc(st)}</strong></span>
      <button class="btn primary" id="mark">Segna come studiato</button>
      <select id="stsel" aria-label="Stato">${STATI.map((s) => `<option${s === st ? ' selected' : ''}>${s}</option>`).join('')}</select></div>`;
    root.querySelector('#mark').addEventListener('click', () => { setStato(a.id, 'studiato'); render(); });
    root.querySelector('#stsel').addEventListener('change', (e) => { setStato(a.id, e.target.value); render(); });
  };
  render();
})();
