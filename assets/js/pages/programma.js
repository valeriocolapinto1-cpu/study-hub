import { loadJSON, esc, url, badge, icon } from '../ui.js';
import { getStato } from '../progress.js';
(async () => {
  const lista = document.getElementById('lista'), filtri = document.getElementById('filtri');
  const syl = await loadJSON('data/syllabus.json');
  let sel = location.hash.replace('#', '') || 'tutti';
  const draw = () => {
    filtri.innerHTML = ['tutti', ...syl.blocchi.map((b) => b.id)].map((id) =>
      `<button class="btn chip" data-id="${id}" aria-pressed="${id === sel}">${id === 'tutti' ? 'Tutti' : 'Blocco ' + id}</button>`).join('');
    lista.innerHTML = syl.blocchi.filter((b) => sel === 'tutti' || b.id === sel).map((b, idx) => {
      const arg = syl.argomenti.filter((a) => a.blocco === b.id);
      const done = arg.filter((a) => getStato(a.id) !== 'non iniziato').length;
      const pct = arg.length ? Math.round((100 * done) / arg.length) : 0;
      return `<details class="block" id="blocco-${esc(b.id)}" style="--bc:var(--b${(idx % 6) + 1})"${sel !== 'tutti' || idx === 0 ? ' open' : ''}>
        <summary>
          <span class="num">${esc(b.id)}</span>
          <span><span class="title">${esc(b.titolo)}</span><br><span class="meta">${arg.length}&nbsp;argomenti · peso stimato ~${b.peso}% ${badge('INFERENZA')}</span></span>
          <span class="side">${done}/${arg.length}${icon('chev', 'chev')}</span>
          <span style="grid-column:2 / -1"><span class="progress" role="presentation"><span style="width:${pct}%"></span></span></span>
        </summary>
        <div class="block-body"><ul class="topic-list">${arg.map((a) => {
          const st = getStato(a.id);
          return `<li><a class="tl" href="${url(a.pagina)}"><span class="tid">${esc(a.id)}</span>${esc(a.titolo)}</a><span class="st-chip st-${st.replace(' ', '')}">${esc(st)}</span>${a.prerequisiti.length ? `<small class="muted">prerequisiti: ${a.prerequisiti.map(esc).join(', ')}</small>` : ''}</li>`;
        }).join('')}</ul></div></details>`;
    }).join('');
  };
  filtri.addEventListener('click', (e) => { const b = e.target.closest('button[data-id]'); if (!b) return; sel = b.dataset.id; history.replaceState(null, '', sel === 'tutti' ? '#' : '#' + sel); draw(); });
  draw();
})();
