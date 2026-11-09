/**
 * Registrazione del service worker (dist/sw.js, generato da tools/integrations/pwa.mjs)
 * e avviso "Nuova versione disponibile": la nuova versione resta in attesa finché la
 * persona non sceglie di aggiornare (nessun ricaricamento a sorpresa).
 *
 * Controllo aggiornamenti: version.json (mai in cache) all'avvio, quando la pagina torna
 * visibile (la PWA su iPhone resta sospesa in memoria per giorni) e ogni 30 minuti. Se la
 * build pubblicata è più recente di quella della pagina: registration.update() e avviso.
 */
import { BASE_URL } from '../config/site';
import { CHECK_INTERVAL_MS, isNewerBuild, parseBuildInfo, shouldCheck } from '../pwa/update';

const textsEl = document.getElementById('sh-pwa-texts');
const T = (textsEl?.dataset ?? {}) as Record<string, string | undefined>;
let userAskedReload = false;

/** `worker` null: nessun service worker in attesa, basta ricaricare (le pagine arrivano dalla rete). */
function showUpdate(worker: ServiceWorker | null) {
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
    if (worker) worker.postMessage({ type: 'SKIP_WAITING' });
    else location.reload();
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

let lastCheck = -Infinity;

async function checkVersion(reg: ServiceWorkerRegistration | null, force = false) {
  const now = Date.now();
  if (!force && !shouldCheck(lastCheck, now)) return;
  lastCheck = now;
  let remote;
  try {
    const res = await fetch(`${BASE_URL}version.json`, { cache: 'no-store' });
    if (!res.ok) return;
    remote = parseBuildInfo(await res.json());
  } catch {
    return; // offline o file assente: si riprova al prossimo controllo
  }
  if (!isNewerBuild(__SH_BUILD__, remote)) return;
  document.documentElement.dataset.updateAvailable = '';
  if (reg) {
    await reg.update().catch(() => undefined);
    // Il nuovo worker in installazione mostra l'avviso da solo (statechange → installed).
    if (reg.installing) return;
    if (reg.waiting && navigator.serviceWorker.controller) return showUpdate(reg.waiting);
  }
  showUpdate(null);
}

function watchVersion(reg: ServiceWorkerRegistration | null) {
  void checkVersion(reg, true);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void checkVersion(reg);
  });
  addEventListener('pageshow', (e) => {
    if (e.persisted) void checkVersion(reg);
  });
  setInterval(() => {
    if (document.visibilityState === 'visible') void checkVersion(reg, true);
  }, CHECK_INTERVAL_MS);
}

async function register() {
  const reg = await navigator.serviceWorker.register(`${BASE_URL}sw.js`, {
    scope: BASE_URL,
    updateViaCache: 'none',
  });
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
  await navigator.serviceWorker.ready;
  // Alla prima visita il worker attivo prende il controllo con clients.claim() poco dopo:
  // "ready" solo quando la pagina è davvero controllata (serve anche all'avviso di aggiornamento).
  if (!navigator.serviceWorker.controller)
    await new Promise((resolve) =>
      navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
    );
  document.documentElement.dataset.sw = 'ready';
  watchVersion(reg);
}

if (import.meta.env.PROD) {
  const start = () =>
    'serviceWorker' in navigator ? void register().catch(() => watchVersion(null)) : watchVersion(null);
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
}
