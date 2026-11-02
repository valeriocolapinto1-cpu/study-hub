import { loadJSON, esc, url, badge } from '../ui.js';
import { getStato } from '../progress.js';
(async () => {
  const lista = document.getElementById('lista'), filtri = document.getElementById('filtri');
  const syl = await loadJSON('data/syllabus.json');
  let sel = location.hash.replace('#', '') || 'tutti';
  const draw = () => {
    filtri.innerHTML = ['tutti', ...syl.blocchi.map((b) => b.id)].map((id) =>
      `<button class="btn chip" data-id="${id}" aria-pressed="${id === sel}">${id === 'tutti' ? 'Tutti' : 'Blocco ' + id}</button>`).join('');
    lista.innerHTML = syl.blocchi.filter((b) => sel === 'tutti' || b.id === sel).map((b) => {
      const arg = syl.argomenti.filter((a) => a.blocco === b.id);
      return `<section><h2>Blocco ${esc(b.id)} — ${esc(b.titolo)} <span class="muted" style="font-size:.8rem">peso stimato ~${b.peso}%</span> ${badge('INFERENZA')}</h2>
        <ul>${arg.map((a) => {
          const st = getStato(a.id);
          return `<li><a href="${url(a.pagina)}">${esc(a.id)} · ${esc(a.titolo)}</a> <span class="muted st-${st.replace(' ', '')}">[${esc(st)}]</span>
            ${a.prerequisiti.length ? `<small class="muted"> · prerequisiti: ${a.prerequisiti.map(esc).join(', ')}</small>` : ''}</li>`;
        }).join('')}</ul></section>`;
    }).join('');
  };
  filtri.addEventListener('click', (e) => { const b = e.target.closest('button[data-id]'); if (!b) return; sel = b.dataset.id; history.replaceState(null, '', sel === 'tutti' ? '#' : '#' + sel); draw(); });
  draw();
})();
