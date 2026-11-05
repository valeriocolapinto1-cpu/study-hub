// Shell comune: header, navigazione, ricerca globale, tema, indicatore di progresso, footer.
import { getStorage } from './storage.js';
import { url, esc, loadJSON, icon } from './ui.js';
import { summary } from './progress.js';

// Menu semplificato: 5 voci. Le pagine meno usate stanno sotto «Altro» (altro/).
const NAV = [
  { label: 'Studia', href: 'programma/', match: ['programma/', 'studio/', 'formulario/'] },
  { label: 'Esercizi', href: 'esercizi/', match: ['esercizi/'] },
  { label: 'Quiz', href: 'quiz/', match: ['quiz/', 'teoria/'] },
  { label: 'Prove', href: 'prova/', match: ['prova/'] },
  { label: 'Altro', href: 'altro/', match: ['altro/', 'corso/', 'esame/', 'archivio/', 'risorse/', 'appunti/', 'simulatori/', 'progresso/', 'piano/', 'faq/', 'impostazioni/'] },
];
export const NAV_ITEMS = NAV;

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
const ICON = {
  get auto() { return icon('auto'); },
  get chiaro() { return icon('sun'); },
  get scuro() { return icon('moon'); },
};

function currentPath() {
  const root = new URL(url('')).pathname;
  let p = location.pathname.startsWith(root) ? location.pathname.slice(root.length) : location.pathname;
  return p.replace(/index\.html$/, '');
}

function buildHeader() {
  const cur = currentPath();
  const links = NAV.map((n) => {
    const isCur = n.match.some((m) => cur.startsWith(m));
    return `<a href="${url(n.href)}"${isCur ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`;
  }).join('');
  const t = applyTheme();
  const h = document.createElement('header');
  h.className = 'site-header';
  h.innerHTML = `
    <div class="header-inner">
      <a class="brand" href="${url('')}"><svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="var(--accent)"/><path d="M36 10 18 36h12l-4 18 20-28H34z" fill="var(--accent-contrast)"/></svg>Teoria dei Circuiti <span>Ing. Elettronica</span></a>
      <nav class="nav" id="nav" aria-label="Navigazione principale">${links}</nav>
      <div class="header-search gsearch"><input id="gs" type="search" placeholder="Cerca argomento…" aria-label="Cerca nel programma" autocomplete="off" enterkeyhint="search"><div class="gresults" id="gres" hidden></div></div>
      <div class="header-tools">
        <span class="prog-ind" id="pind" title="Argomenti studiati">…</span>
        <button class="icon-btn" id="fdrawer-btn" type="button" aria-label="Apri formulario rapido" aria-expanded="false" title="Formulario rapido"><span class="fx" aria-hidden="true">ƒ</span></button>
        <button class="icon-btn" id="theme-btn" type="button" aria-label="Cambia tema (attuale: ${t})" title="Tema: ${t}">${ICON[t]}</button>
        <button class="icon-btn menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="nav" aria-label="Menu">${icon('menu')}</button>
      </div>
    </div>`;
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
  skip.className = 'skip-link'; skip.href = '#main'; skip.textContent = 'Vai al contenuto';
  document.body.prepend(skip);
  const header = buildHeader();
  skip.after(header);
  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main';
  const sec = NAV.find((n) => n.match.some((m) => currentPath().startsWith(m)));
  if (main && sec && currentPath() !== '') main.dataset.eyebrow = sec.label;
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
  f.innerHTML = `
    <p>Teoria dei Circuiti · Ingegneria Elettronica · 2º anno</p>
    <p>Strumento di studio non ufficiale, gratuito e aperto a tutti. Non è affiliato all'università né ai docenti: per programma ed esami fanno fede le comunicazioni dei docenti. Nessun materiale di terzi è incluso; i dati restano nel tuo browser.</p>
    <p>© 2026 Valerio Colapinto · codice con licenza MIT · contenuti per uso personale di studio</p>
    <nav class="footer-links" aria-label="Link legali">
      <a href="${url('privacy/')}">Privacy</a>
      <a href="${url('note-legali/')}">Note legali</a>
      <a href="mailto:valeriocolapinto1@gmail.com">valeriocolapinto1@gmail.com</a>
      <a href="https://www.linkedin.com/in/valerio-colapinto" rel="noopener">LinkedIn</a>
    </nav>`;
  document.body.append(f);
  header.querySelector('#theme-btn').addEventListener('click', (e) => {
    const t = cycleTheme(); e.currentTarget.innerHTML = ICON[t];
    e.currentTarget.setAttribute('aria-label', `Cambia tema (attuale: ${t})`); e.currentTarget.title = 'Tema: ' + t;
  });
  const mb = header.querySelector('#menu-btn'), nav = header.querySelector('#nav');
  mb.addEventListener('click', () => { const o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', String(o)); });
  wireSearch(header);
  wireDrawer(header);
}

function wireDrawer(header) {
  const btn = header.querySelector('#fdrawer-btn');
  let drawer = null;
  const close = () => { if (drawer) drawer.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); };
  btn.addEventListener('click', async () => {
    if (drawer && !drawer.hidden) { close(); return; }
    if (!drawer) {
      drawer = document.createElement('aside');
      drawer.className = 'drawer'; drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-label', 'Formulario rapido');
      drawer.innerHTML = '<div class="row"><h2 style="margin:0;border:0;flex:1">Formulario</h2><button class="btn" id="fd-close" aria-label="Chiudi formulario">✕</button></div><div id="fd-body"></div>';
      document.body.append(drawer);
      drawer.querySelector('#fd-close').addEventListener('click', close);
      drawer.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
      const { mountFormulario } = await import('./formulario.js');
      await mountFormulario(drawer.querySelector('#fd-body'), { compact: true });
    }
    drawer.hidden = false; btn.setAttribute('aria-expanded', 'true');
    drawer.querySelector('.fq').focus();
  });
}
// PWA offline opzionale: se non è disponibile o fallisce, il sito funziona comunque.
function registerSW() {
  try {
    if (!('serviceWorker' in navigator)) return;
    if (!(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;
    navigator.serviceWorker.register(url('sw.js'), { scope: url('') }).catch(() => {});
  } catch (e) { /* ignora */ }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
registerSW();
