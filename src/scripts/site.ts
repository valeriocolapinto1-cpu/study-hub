/**
 * Script globale minimo: interruttore del tema, memoria della lingua scelta,
 * menu mobile, apertura della ricerca e cassetto dell'indice del corso.
 */
import { GLOBAL_SCOPE, write } from '../engine/storage';
import { runMigrations } from '../engine/migrate';
import './search';
import './pwa';

type Theme = 'light' | 'dark';

const root = document.documentElement;

function currentTheme(): Theme {
  const attr = root.dataset.theme;
  if (attr === 'light' || attr === 'dark') return attr;
  // Scuro di default, come i siti originali: il chiaro si sceglie con l'interruttore.
  return 'dark';
}

function syncToggles() {
  const theme = currentTheme();
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')) {
    btn.setAttribute('aria-pressed', String(theme === 'dark'));
    const label = theme === 'dark' ? btn.dataset.labelLight : btn.dataset.labelDark;
    if (label) btn.setAttribute('aria-label', label);
  }
}

function applyTheme(theme: Theme) {
  root.dataset.theme = theme;
  write(GLOBAL_SCOPE, 'theme', theme);
  syncToggles();
}

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest('[data-theme-toggle]')) {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    return;
  }
  const langLink = target?.closest<HTMLAnchorElement>('a[data-lang-switch]');
  if (langLink?.dataset.langSwitch) write(GLOBAL_SCOPE, 'lang', langLink.dataset.langSwitch);
});


// ---- Menu mobile: si chiude con Esc, al cambio di larghezza e al clic su un link.
const menuButton = document.querySelector<HTMLButtonElement>('.menu-toggle');
const menu = document.getElementById('menu-mobile');
function setMenu(open: boolean) {
  if (!menuButton || !menu) return;
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  const label = open ? menuButton.dataset.labelClose : menuButton.dataset.labelOpen;
  if (label) menuButton.setAttribute('aria-label', label);
}
menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
menu?.addEventListener('click', (e) => {
  if (e.target instanceof Element && e.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu && !menu.hidden) {
    setMenu(false);
    menuButton?.focus();
  }
});
globalThis.matchMedia?.('(min-width: 48em)').addEventListener('change', (e) => e.matches && setMenu(false));

// ---- Ricerca: la PR piattaforma ascolta `sh:search-open` (vedi SearchButton.astro).
const openSearch = () => document.dispatchEvent(new CustomEvent('sh:search-open'));
for (const b of document.querySelectorAll('[data-search-trigger]')) b.addEventListener('click', openSearch);
document.addEventListener('keydown', (e) => {
  const el = e.target instanceof HTMLElement ? e.target : null;
  if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || root.dataset.search !== 'ready') return;
  if (el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)) return;
  e.preventDefault();
  openSearch();
});

// ---- Cassetto dell'indice del corso (mobile): <dialog> modale nativo.
for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-drawer-open]')) {
  const dialog = document.getElementById(btn.dataset.drawerOpen ?? '');
  if (!(dialog instanceof HTMLDialogElement)) continue;
  btn.addEventListener('click', () => {
    dialog.showModal();
    btn.setAttribute('aria-expanded', 'true');
  });
  dialog.addEventListener('close', () => btn.setAttribute('aria-expanded', 'false'));
  // Chiusura con clic sullo sfondo o su un link interno.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || (e.target instanceof Element && e.target.closest('a'))) dialog.close();
  });
}

syncToggles();
runMigrations();
// Migrazioni dei corsi dalle chiavi dei vecchi siti: il codice si scarica solo se nel
// browser c'è almeno una chiave che non è del nuovo formato (`sh:`), cioè quasi mai.
const courseMigrations = import.meta.glob('../courses/*/migrations.ts');
const hasLegacyKeys = (): boolean => {
  try {
    for (let i = 0; i < localStorage.length; i++) if (!localStorage.key(i)?.startsWith('sh:')) return true;
  } catch {
    // storage non disponibile: niente da migrare
  }
  return false;
};
if (hasLegacyKeys()) {
  void Promise.all(Object.values(courseMigrations).map((load) => load())).then(() => runMigrations());
}

// Formule display più larghe della colonna: scorrono in orizzontale, quindi devono
// essere raggiungibili da tastiera (WCAG 2.1.1). Solo quelle che scorrono davvero.
const markScrollableMath = () => {
  for (const el of document.querySelectorAll<HTMLElement>('.katex-display')) {
    if (el.scrollWidth > el.clientWidth + 1) el.tabIndex = 0;
    else el.removeAttribute('tabindex');
  }
};
markScrollableMath();
globalThis.addEventListener?.('resize', markScrollableMath, { passive: true });
