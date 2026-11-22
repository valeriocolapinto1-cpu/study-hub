/** @jsxImportSource preact */
/**
 * Scorciatoie da tastiera delle isole (prova d'esame, ripasso): filtro comune per i tasti
 * premuti mentre si scrive e pannello «?» con l'elenco, aperto con un popover nativo
 * (nessun JS per aprire e chiudere col pulsante; Esc lo chiude).
 */
import { t, type Lang } from './i18n';

/** Vero se il tasto va lasciato al campo (scrittura, scelta) o è una combinazione con modificatori. */
export function ignoreKey(e: KeyboardEvent): boolean {
  if (e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) return true;
  const el = e.target as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

/** Apre il pannello e ci porta il focus; alla chiusura il focus torna dov'era. */
export function openKeys(id: string) {
  const panel = document.getElementById(id);
  if (!panel || panel.matches(':popover-open')) return;
  const back = document.activeElement as HTMLElement | null;
  const onToggle = (e: Event) => {
    if ((e as ToggleEvent).newState !== 'closed') return;
    panel.removeEventListener('toggle', onToggle);
    if (back?.isConnected) back.focus();
  };
  panel.addEventListener('toggle', onToggle);
  panel.showPopover();
  panel.querySelector<HTMLElement>('button')?.focus();
}

export function KeysHelp({ id, lang, items }: { id: string; lang: Lang; items: [string, string][] }) {
  const title = t(lang, 'engine.keys');
  return (
    <>
      <button
        type="button"
        class="btn btn--sm sh-keys-btn"
        popovertarget={id}
        aria-keyshortcuts="?"
        aria-label={title}
        title={title}
      >
        ?
      </button>
      <div id={id} class="sh-keys" popover="auto" role="dialog" aria-labelledby={`${id}-h`}>
        <div class="sh-keys__head">
          <h3 id={`${id}-h`}>{title}</h3>
          <button type="button" class="btn btn--sm" popovertarget={id} popovertargetaction="hide">
            {t(lang, 'engine.keys.close')}
          </button>
        </div>
        <dl class="sh-keys__list">
          {[...items, ['?', t(lang, 'engine.keys.help')] as [string, string]].map(([k, d]) => (
            <div key={k}>
              <dt>
                <kbd>{k}</kbd>
              </dt>
              <dd>{d}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
