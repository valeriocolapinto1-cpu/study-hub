// Shell comune: header, navigazione, ricerca globale, tema, indicatore di progresso, footer.
import { getStorage } from './storage.js';
import { url, esc, loadJSON } from './ui.js';
import { summary } from './progress.js';

const NAV = [
  ['Home', '', true], ['Corso', 'corso/', true], ['Esame', 'esame/', true], ['Programma', 'programma/', true],
  ['Studio', 'studio/', true], ['Formulario', 'formulario/', false], ['Esercizi', 'esercizi/', false],
  ['Quiz', 'quiz/', false], ['Prove', 'prova/', false], ['Archivio', 'archivio/', false],
  ['Risorse', 'risorse/', false], ['Appunti', 'appunti/', false], ['Simulatori', 'simulatori/', false],
  ['Progresso', 'progresso/', false], ['Piano', 'piano/', false], ['Impostazioni', 'impostazioni/', true], ['FAQ', 'faq/', false],
];

export function applyTheme() {
  const st = getStorage();
  const t = (st.get('settings', {}) || {}).tema || 'auto';
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t === 'chiaro' ? 'light' : 'dark');
  return t;
}
function cycleTheme() {
  const st = getStorage();
  const s = st.get('settings', {}) || {};
  const order = ['auto', 'chiaro', 'scuro'];
  s.tema = order[(order.indexOf(s.tema || 'auto') + 1) % 3];
  st.set('settings', s);
  return applyTheme();
}
const ICON = { auto: '◐', chiaro: '☀', scuro: '☾' };

function currentPath() {
  const root = new URL(url('')).pathname;
  let p = location.pathname.startsWith(root) ? location.pathname.slice(root.length) : location.pathname;
  return p.replace(/index\.html$/, '');
}

function buildHeader() {
  const cur = currentPath();
  const links = NAV.map(([label, href, ready]) => {
    const isCur = href === cur || (href && cur.startsWith(href));
    return `<a href="${url(href)}"${isCur ? ' aria-current="page"' : ''}${ready ? '' : ' class="soon" title="In arrivo nelle prossime fasi"'}>${esc(label)}${ready ? '' : '<span class="tag">presto</span>'}</a>`;
  }).join('');
  const t = applyTheme();
  const h = document.createElement('header');
  h.className = 'site-header';
  h.innerHTML = `
    <div class="hbar">
      <a class="brand" href="${url('')}"><span aria-hidden="true">⚡</span> Teoria dei <b>Circuiti</b></a>
      <div class="gsearch"><input id="gs" type="search" placeholder="Cerca argomento…" aria-label="Cerca nel programma" autocomplete="off"><div class="gresults" id="gres" hidden></div></div>
      <span class="prog-ind" id="pind" title="Argomenti studiati">…</span>
      <button class="btn" id="theme-btn" aria-label="Cambia tema (attuale: ${t})" title="Tema: ${t}">${ICON[t]}</button>
      <button class="btn menu-btn" id="menu-btn" aria-expanded="false" aria-controls="nav" aria-label="Menu">☰</button>
    </div>
    <nav class="nav" id="nav" aria-label="Navigazione principale">${links}</nav>`;
  return h;
}

async function wireSearch(root) {
  const input = root.querySelector('#gs'), res = root.querySelector('#gres'), pind = root.querySelector('#pind');
  let syl = null;
  try { syl = await loadJSON('data/syllabus.json'); } catch (e) { pind.textContent = ''; return; }
  const s = summary(syl.argomenti);
  pind.innerHTML = `<b>${s.pct}%</b> studiato`;
  const norm = (x) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  input.addEventListener('input', () => {
    const q = norm(input.value.trim());
    if (q.length < 2) { res.hidden = true; return; }
    const hits = syl.argomenti.filter((a) => norm(a.titolo).includes(q) || norm(a.id).includes(q) || a.tag.some((t) => t.includes(q))).slice(0, 8);
    res.innerHTML = hits.length
      ? hits.map((a) => `<a href="${url(a.pagina)}">${esc(a.titolo)}<small>Blocco ${esc(a.blocco)} · ${esc(a.id)}</small></a>`).join('')
      : '<a href="#" tabindex="-1">Nessun risultato</a>';
    res.hidden = false;
  });
  document.addEventListener('click', (e) => { if (!root.querySelector('.gsearch').contains(e.target)) res.hidden = true; });
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { res.hidden = true; input.blur(); } });
}

function init() {
  const skip = document.createElement('a');
  skip.className = 'skip'; skip.href = '#main'; skip.textContent = 'Vai al contenuto';
  document.body.prepend(skip);
  const header = buildHeader();
  skip.after(header);
  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main';
  const st = getStorage();
  if (st.isDegraded) {
    const n = document.createElement('div');
    n.className = 'notice'; n.setAttribute('role', 'status');
    n.style.margin = '0'; n.style.borderRadius = '0';
    n.textContent = 'Archiviazione del browser non disponibile: i progressi non verranno salvati dopo la chiusura della pagina. Usa Esporta nelle Impostazioni.';
    header.after(n);
  }
  const f = document.createElement('footer');
  f.className = 'site-footer';
  f.innerHTML = 'Strumento di studio <strong>non ufficiale</strong>, non affiliato a Roma né al [docente]. Nessun materiale del docente è incluso. I dati restano nel tuo browser.';
  document.body.append(f);
  header.querySelector('#theme-btn').addEventListener('click', (e) => {
    const t = cycleTheme(); e.currentTarget.textContent = ICON[t];
    e.currentTarget.setAttribute('aria-label', `Cambia tema (attuale: ${t})`); e.currentTarget.title = 'Tema: ' + t;
  });
  const mb = header.querySelector('#menu-btn'), nav = header.querySelector('#nav');
  mb.addEventListener('click', () => { const o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', String(o)); });
  wireSearch(header);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
