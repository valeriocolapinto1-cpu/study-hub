/**
 * Avviso sui dati locali, caricato solo quando serve (import dinamico da site.ts):
 * - `storage`: una scrittura non è riuscita (memoria piena, navigazione privata,
 *   storage bloccato): i progressi non vengono salvati;
 * - `backup`: l'ultimo export ha più di 30 giorni.
 * Un solo avviso per pagina, in basso, annunciato con role="status" e chiudibile;
 * rimanda a «I miei dati». Testi IT/EN qui dentro: il dizionario non entra nel bundle.
 * Non importa moduli del motore (finirebbero in un chunk separato in più su ogni pagina).
 */
export type NoticeKind = 'storage' | 'backup';

const TEXTS = {
  it: {
    storage:
      'Impossibile salvare i progressi: la memoria del browser è piena o non disponibile (ad esempio in navigazione privata).',
    backup: 'Non esporti i tuoi dati da più di 30 giorni: restano solo in questo browser.',
    link: 'I miei dati',
    close: 'Chiudi l’avviso',
  },
  en: {
    storage:
      'Your progress cannot be saved: the browser storage is full or unavailable (for example in private browsing).',
    backup: 'You haven’t exported your data for over 30 days: it lives only in this browser.',
    link: 'My data',
    close: 'Dismiss notice',
  },
};

const CSS = `.sh-notice{position:fixed;inset-inline:calc(var(--space-s) + var(--safe-inline,0px));inset-block-end:calc(var(--space-s) + var(--safe-bottom,0px));z-index:60;max-inline-size:34rem;margin-inline:auto;display:flex;gap:var(--space-xs);align-items:start;padding:var(--space-xs) var(--space-s);background:var(--surface-2);color:var(--text);border:1px solid var(--border-strong);border-inline-start:4px solid var(--warning);border-radius:var(--radius-m);box-shadow:var(--shadow-2);font-size:var(--step--1)}.sh-notice p{margin:0;flex:1}.sh-notice a{color:inherit;font-weight:600}.sh-notice button{flex:none;background:none;border:0;color:inherit;font:inherit;font-size:1.25rem;line-height:1;padding:var(--space-3xs);cursor:pointer;border-radius:var(--radius-s)}.sh-notice button:focus-visible{outline:2px solid var(--focus);outline-offset:2px}@media print{.sh-notice{display:none}}`;

let shown: NoticeKind | null = null;

export const noticeLang = (): 'it' | 'en' => (document.documentElement.lang.startsWith('en') ? 'en' : 'it');

/** Percorso di «I miei dati» nella lingua della pagina. */
export function dataPageHref(lang: 'it' | 'en'): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  return `${base}${lang}/i-miei-dati/`;
}

/** Mostra l'avviso; l'errore di salvataggio sostituisce il promemoria, mai il contrario. */
export function showNotice(kind: NoticeKind, onDismiss?: () => void): void {
  if (shown === kind || (shown === 'storage' && kind === 'backup')) return;
  document.querySelector('.sh-notice')?.remove();
  shown = kind;
  const lang = noticeLang();
  const T = TEXTS[lang];
  if (!document.getElementById('sh-notice-css')) {
    const style = document.createElement('style');
    style.id = 'sh-notice-css';
    style.textContent = CSS;
    document.head.append(style);
  }
  const box = document.createElement('div');
  box.className = 'sh-notice';
  box.setAttribute('role', 'status');
  box.dataset.kind = kind;
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = dataPageHref(lang);
  a.textContent = T.link;
  p.append(`${T[kind]} `, a);
  const close = document.createElement('button');
  close.type = 'button';
  close.setAttribute('aria-label', T.close);
  close.textContent = '×';
  close.addEventListener('click', () => {
    box.remove();
    onDismiss?.();
  });
  box.append(p, close);
  document.body.append(box);
}
