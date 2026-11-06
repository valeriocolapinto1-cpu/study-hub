/**
 * Collega la ricerca globale al pulsante dell'intestazione (evento `sh:search-open`,
 * emesso da site.ts per il clic e per "/") e a Ctrl/⌘+K. Il dialogo e Pagefind si
 * caricano solo alla prima apertura.
 */
import type { SearchConfig } from '../islands/SearchDialog';

const root = document.documentElement;
const configEl = document.getElementById('sh-search-config');

if (configEl) {
  const config = JSON.parse(configEl.textContent ?? '{}') as SearchConfig;
  let dialog: Promise<HTMLDialogElement> | null = null;
  let opener: Element | null = null;

  const open = async () => {
    opener = document.activeElement;
    dialog ??= import('../islands/SearchDialog').then(({ mountSearch }) => {
      const d = mountSearch(config);
      d.addEventListener('close', () => {
        if (opener instanceof HTMLElement) opener.focus();
      });
      return d;
    });
    const d = await dialog;
    if (!d.open) {
      d.showModal();
      d.dispatchEvent(new Event('sh:opened'));
    }
  };

  document.addEventListener('sh:search-open', () => void open());
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      void open();
    }
  });
  root.dataset.search = 'ready';
}
