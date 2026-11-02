// Formulario consultabile: ricerca, filtro per blocco, segnalibri. Usato dalla pagina e dal drawer.
import { loadJSON, esc, url } from './ui.js';
import { getStorage } from './storage.js';
import { typeset } from './katex.js';

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export function getBookmarks() { const b = getStorage().get('formulario', {}); return new Set((b && b.bookmarks) || []); }
export function toggleBookmark(id) {
  const s = getBookmarks(); if (s.has(id)) s.delete(id); else s.add(id);
  getStorage().set('formulario', { bookmarks: [...s] });
  return s.has(id);
}
export function filterEntries(entries, { q = '', blocco = 'tutti', soloPreferiti = false, bookmarks = new Set() } = {}) {
  const nq = norm(q.trim());
  return entries.filter((e) =>
    (blocco === 'tutti' || e.blocco === blocco) &&
    (!soloPreferiti || bookmarks.has(e.id)) &&
    (!nq || norm([e.titolo, e.simboli, e.uso, e.errore || '', e.id].join(' ')).includes(nq)));
}
export function entryHTML(e, bookmarks, studioTitle) {
  const links = (e.studio || []).map((id) => `<a href="${url('studio/?t=' + id)}">${esc(id)}</a>`).join(', ');
  return `<article class="card fentry" id="f-${esc(e.id)}">
    <div class="row"><h3 style="margin:0;flex:1">${esc(e.titolo)} <small class="muted">${esc(e.blocco)}</small></h3>
    <button class="btn bm" data-id="${esc(e.id)}" aria-pressed="${bookmarks.has(e.id)}" aria-label="Segnalibro: ${esc(e.titolo)}">${bookmarks.has(e.id) ? '★' : '☆'}</button></div>
    <div class="fformula">$$${e.formula}$$</div>
    <p><strong>Simboli:</strong> ${esc(e.simboli)}</p>
    <p><strong>Quando si usa:</strong> ${esc(e.uso)}</p>
    ${e.errore ? `<p><strong>Errore tipico:</strong> ${esc(e.errore)}</p>` : ''}
    ${links ? `<p class="muted">Studio: ${links}</p>` : ''}</article>`;
}
export async function mountFormulario(root, { compact = false } = {}) {
  const data = await loadJSON('data/formulario.json');
  const blocchi = ['tutti', ...new Set(data.voci.map((v) => v.blocco))];
  const state = { q: '', blocco: 'tutti', soloPreferiti: false };
  root.innerHTML = `<div class="row"><input type="search" class="fq" placeholder="Cerca nel formulario…" aria-label="Cerca nel formulario" style="flex:1">
    <button class="btn chip fpref" aria-pressed="false">★ Preferiti</button></div>
    <div class="chips fblk" role="group" aria-label="Filtra per blocco">${blocchi.map((b) => `<button class="btn chip" data-b="${b}" aria-pressed="${b === 'tutti'}">${b === 'tutti' ? 'Tutti' : b}</button>`).join('')}</div>
    <p class="muted fcount" role="status"></p><div class="flist"></div>`;
  const list = root.querySelector('.flist');
  const draw = async () => {
    const bm = getBookmarks();
    const r = filterEntries(data.voci, { ...state, bookmarks: bm });
    root.querySelector('.fcount').textContent = `${r.length} voci`;
    list.innerHTML = r.map((e) => entryHTML(e, bm)).join('') || '<p>Nessuna voce.</p>';
    await typeset(list);
  };
  root.querySelector('.fq').addEventListener('input', (e) => { state.q = e.target.value; draw(); });
  root.querySelector('.fpref').addEventListener('click', (e) => { state.soloPreferiti = !state.soloPreferiti; e.currentTarget.setAttribute('aria-pressed', state.soloPreferiti); draw(); });
  root.querySelector('.fblk').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-b]'); if (!b) return; state.blocco = b.dataset.b;
    root.querySelectorAll('.fblk button').forEach((x) => x.setAttribute('aria-pressed', x === b)); draw();
  });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('button.bm'); if (!b) return;
    const on = toggleBookmark(b.dataset.id); b.setAttribute('aria-pressed', on); b.textContent = on ? '★' : '☆';
    if (state.soloPreferiti) draw();
  });
  await draw();
  return { redraw: draw, state };
}
