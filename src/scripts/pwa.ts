/**
 * Registrazione del service worker (dist/sw.js, generato da tools/integrations/pwa.mjs)
 * e avviso "Nuova versione disponibile": la nuova versione resta in attesa finché la
 * persona non sceglie di aggiornare (nessun ricaricamento a sorpresa).
 */
import { BASE_URL } from '../config/site';

const textsEl = document.getElementById('sh-pwa-texts');
const T = (textsEl?.dataset ?? {}) as Record<string, string | undefined>;
let userAskedReload = false;

function showUpdate(worker: ServiceWorker) {
  if (document.querySelector('[data-pwa-update]')) return;
  let region = document.querySelector<HTMLElement>('.toast-region');
  if (!region) {
    region = document.createElement('div');
    region.className = 'toast-region';
    document.body.append(region);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.dataset.tone = 'info';
  toast.dataset.pwaUpdate = '';
  toast.setAttribute('role', 'status');
  const body = document.createElement('div');
  body.className = 'toast__body';
  const title = document.createElement('strong');
  title.textContent = T.title ?? '';
  const text = document.createElement('p');
  text.textContent = T.body ?? '';
  text.style.margin = '0';
  const row = document.createElement('div');
  row.className = 'btn-row';
  row.style.marginTop = 'var(--space-2xs)';
  const reload = document.createElement('button');
  reload.type = 'button';
  reload.className = 'btn btn--primary btn--sm';
  reload.textContent = T.reload ?? '';
  reload.addEventListener('click', () => {
    userAskedReload = true;
    reload.disabled = true;
    worker.postMessage({ type: 'SKIP_WAITING' });
  });
  const later = document.createElement('button');
  later.type = 'button';
  later.className = 'btn btn--ghost btn--sm';
  later.textContent = T.later ?? '';
  later.addEventListener('click', () => toast.remove());
  row.append(reload, later);
  body.append(title, text, row);
  toast.append(body);
  region.append(toast);
}

async function register() {
  const reg = await navigator.serviceWorker.register(`${BASE_URL}sw.js`, { scope: BASE_URL });
  if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
  reg.addEventListener('updatefound', () => {
    const w = reg.installing;
    w?.addEventListener('statechange', () => {
      if (w.state === 'installed' && navigator.serviceWorker.controller) showUpdate(w);
    });
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (userAskedReload) location.reload();
  });
  // Pagine lasciate aperte a lungo: controllo periodico degli aggiornamenti.
  setInterval(() => void reg.update().catch(() => undefined), 60 * 60 * 1000);
  await navigator.serviceWorker.ready;
  // Alla prima visita il worker attivo prende il controllo con clients.claim() poco dopo:
  // "ready" solo quando la pagina è davvero controllata (serve anche all'avviso di aggiornamento).
  if (!navigator.serviceWorker.controller)
    await new Promise((resolve) =>
      navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
    );
  document.documentElement.dataset.sw = 'ready';
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const start = () => void register().catch(() => undefined);
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
}
