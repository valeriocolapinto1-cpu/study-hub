/**
 * Script globale minimo: interruttore del tema, memoria della lingua scelta,
 * menu mobile, apertura della ricerca e cassetto dell'indice del corso.
 */
import { GLOBAL_SCOPE, STORAGE_ERROR_EVENT, write } from '../engine/storage';
import { backupDue, snoozeBackup } from '../engine/backup';
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

// ---- Dati locali: avviso se una scrittura fallisce o se l'ultimo backup è vecchio.
// Il modulo dell'avviso si scarica solo quando serve.
const notice = (kind: 'storage' | 'backup') =>
  import('./data-notice')
    .then((m) => m.showNotice(kind, kind === 'backup' ? () => snoozeBackup() : undefined))
    .catch(() => undefined);
addEventListener(STORAGE_ERROR_EVENT, () => notice('storage'), { once: true });
setTimeout(() => !/\/i-miei-dati\/$/.test(location.pathname) && backupDue() && notice('backup'), 3000);

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

// ---- Prefetch dei link interni (modulo di Astro, senza View Transitions: le isole tengono stato):
// al passaggio del puntatore, o al tocco sugli schermi senza hover. Il modulo si scarica alla prima
// interazione (`pointerover` arriva anche dal tocco), fuori dal budget JS del caricamento, e il link
// che l'ha causata si carica subito. `init` agisce una volta sola.
for (const type of ['pointerover', 'focusin'])
  addEventListener(
    type,
    (e) => {
      const link = (e.target as Element).closest?.('a');
      import('astro/virtual-modules/prefetch.js').then(({ init, prefetch }) => {
        init({ prefetchAll: true, defaultStrategy: matchMedia('(hover:hover)').matches ? 'hover' : 'tap' });
        if (link) prefetch(link.href);
      }, Boolean);
    },
    { once: true },
  );

// ---- Ultima pagina di studio (teoria o esercizi di un argomento): «Riprendi da dove eri» in home
// e nella panoramica del corso. Solo percorso e titolo, nello storage locale.
{
  const bar = document.querySelector<HTMLElement>('[data-study-page]');
  const course = root.dataset.course;
  if (bar && course) {
    const entry = {
      href: location.pathname,
      title: bar.dataset.studyPage,
      courseTitle: bar.dataset.studyCourse,
    };
    write(course, 'lastPage', entry);
    write(GLOBAL_SCOPE, 'lastStudy', entry);
  }
}

// ---- Argomenti studiati (spunte, capitoli, «Segna come studiato»): modulo a parte, solo dove serve.
if (root.dataset.course && document.querySelector('[data-studied-mark],[data-studied-toggle]'))
  import('./studied').catch(Boolean);

// ---- Indice del corso: un solo elemento (`popover`), barra laterale da 1024 px e menu sotto.
// Il popover nativo gestisce apertura, Esc, clic fuori e aria-expanded; qui solo la voce corrente
// in vista all'apertura e, senza Popover API, l'attributo `data-open` commutato dai due pulsanti.
// (Script globale: il budget JS di 50 KB delle pagine più pesanti ha pochi byte di margine.)
{
  const side = document.getElementById('indice-corso');
  if (side && 'popover' in HTMLElement.prototype)
    side.addEventListener('toggle', (e) => {
      if ((e as ToggleEvent).newState === 'open')
        side.querySelector('.topic-nav [aria-current]')?.scrollIntoView({ block: 'center' });
    });
  else if (side)
    for (const b of document.querySelectorAll('[popovertarget]'))
      b.addEventListener('click', () => side.toggleAttribute('data-open'));
}

// ---- Formule in display più larghe della colonna: scorrono in orizzontale, quindi
// devono essere raggiungibili da tastiera (WCAG 2.1.1). Il tabindex si mette solo
// quando la formula trabocca davvero, per non aggiungere fermate inutili al Tab.
// Un ResizeObserver su contenitore e formula ricalcola quando arrivano i font o
// cambia la colonna: prima un solo controllo al caricamento poteva arrivare prima
// dei font (axe intermittente: scrollable-region-focusable).
// Prestazioni (formulari con centinaia di formule): prima tutte le letture, poi tutte
// le scritture, così il layout si calcola una volta sola e non a ogni formula; le formule
// in voci non ancora disegnate (`content-visibility: auto`) si misurano una per volta nei
// momenti di inattività, senza forzare subito il layout di tutta la pagina. A controllo
// completo `<html data-math-scroll="ready">` (lo attendono i test axe).
{
  const displays = [...document.querySelectorAll<HTMLElement>('.katex-display')];
  const measured = new WeakSet<HTMLElement>();
  const rendered = (el: HTMLElement): boolean =>
    typeof el.checkVisibility !== 'function' || el.checkVisibility({ contentVisibilityAuto: true });
  /** `force`: misura anche le formule in sezioni saltate dal rendering (forza il loro layout). */
  const markScrollableMath = (els: HTMLElement[], force = false): void => {
    const list = force ? els : els.filter(rendered);
    const overflowing = list.map((el) => el.scrollWidth > el.clientWidth + 1);
    list.forEach((el, i) => {
      measured.add(el);
      if (overflowing[i]) {
        if (el.getAttribute('tabindex') !== '0') el.tabIndex = 0;
      } else if (el.getAttribute('tabindex') === '0') el.removeAttribute('tabindex');
    });
  };
  /** Tempo libero rimasto (ms): senza requestIdleCallback, un passo breve per volta. */
  const idle = (cb: (left: () => number) => void): void => {
    if ('requestIdleCallback' in window) requestIdleCallback((d) => cb(() => d.timeRemaining()));
    else {
      setTimeout(() => {
        const end = performance.now() + 8;
        cb(() => end - performance.now());
      }, 16);
    }
  };
  const ready = (): void => {
    document.documentElement.dataset.mathScroll = 'ready';
  };
  // Una formula per volta finché resta tempo libero: ogni misura impagina solo la sua voce.
  const measureRest = (left: () => number): void => {
    for (const el of displays) {
      if (measured.has(el)) continue;
      if (left() < 4) return idle(measureRest);
      markScrollableMath([el], true);
    }
    ready();
  };
  if (displays.length > 0 && 'ResizeObserver' in window) {
    const ro = new ResizeObserver((entries) => {
      const els = new Set<HTMLElement>();
      for (const e of entries) {
        const el = (e.target as HTMLElement).closest<HTMLElement>('.katex-display');
        if (el) els.add(el);
      }
      markScrollableMath([...els]);
    });
    for (const el of displays) {
      ro.observe(el);
      if (el.firstElementChild) ro.observe(el.firstElementChild);
    }
  }
  const afterFonts = (): void => {
    markScrollableMath(displays);
    // Le formule già misurate prima dei font vanno rimisurate solo se disegnate (lo fa il
    // ResizeObserver); quelle mai misurate si controllano nei momenti liberi.
    idle(measureRest);
  };
  if (document.fonts) void document.fonts.ready.then(afterFonts);
  else afterFonts();
}

syncToggles();
// Migrazioni dalle chiavi dei vecchi siti (src/engine/migrate.ts e quelle dei corsi): ogni
// migrazione legge una chiave legacy, quindi il codice si scarica solo se nel browser c'è
// almeno una chiave che non è del nuovo formato (`sh:`), cioè quasi mai.
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
  void Promise.all([import('../engine/migrate'), ...Object.values(courseMigrations).map((load) => load())])
    .then(([m]) => m.runMigrations())
    .catch(() => undefined);
}
