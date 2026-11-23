/**
 * Registrazione del service worker (dist/sw.js, generato da tools/integrations/pwa.mjs)
 * e avviso "Nuova versione disponibile": il nuovo worker si attiva da solo, la pagina
 * aperta si ricarica solo se la persona sceglie di aggiornare.
 *
 * Controllo aggiornamenti: version.json (mai in cache) all'avvio, quando la pagina torna
 * visibile (la PWA su iPhone resta sospesa in memoria per giorni) e ogni 30 minuti. Se la
 * build pubblicata è più recente di quella della pagina: registration.update() e avviso.
 *
 * Recupero dopo una pubblicazione: se un'isola non riesce a caricare il suo codice
 * (`astro:hydration-error`, import dinamico fallito) o va in errore (`sh:island-error` da
 * IslandBoundary) e la build pubblicata è più recente, si attiva il worker nuovo e si
 * ricarica la pagina, una volta sola per build (`RELOAD_GUARD_KEY` in sessionStorage).
 * «Ricarica» nel riquadro d'errore (`sh:hard-reload`) deregistra il worker e svuota le cache
 * (tranne i corsi scaricati) prima di ricaricare.
 */
import { BASE_URL } from '../config/site';
import {
  CHECK_INTERVAL_MS,
  RELOAD_GUARD_KEY,
  isChunkLoadError,
  isNewerBuild,
  parseBuildInfo,
  shouldAutoReload,
  shouldCheck,
  type BuildInfo,
} from '../pwa/update';

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
    reload.disabled = true;
    // Il worker nuovo di norma si è già attivato da solo (skipWaiting): basta ricaricare.
    if (worker?.state === 'installed') {
      userAskedReload = true;
      worker.postMessage({ type: 'SKIP_WAITING' });
    } else location.reload();
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

/** Build pubblicata (version.json, mai in cache); null offline o se il file manca. */
async function fetchRemote(): Promise<BuildInfo | null> {
  try {
    const res = await fetch(`${BASE_URL}version.json`, { cache: 'no-store' });
    return res.ok ? parseBuildInfo(await res.json()) : null;
  } catch {
    return null;
  }
}

async function checkVersion(reg: ServiceWorkerRegistration | null, force = false) {
  const now = Date.now();
  if (!force && !shouldCheck(lastCheck, now)) return;
  lastCheck = now;
  // offline o file assente: si riprova al prossimo controllo
  if (!isNewerBuild(__SH_BUILD__, await fetchRemote())) return;
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

/** Esito del controllo dopo un errore: motivo per «Segnala errore» e se la pagina si ricarica. */
interface Recovery {
  reload: boolean;
  reason: 'versione' | 'versione-ripetuta' | 'offline' | 'stessa-versione';
}
let recovering: Promise<Recovery> | null = null;

/** Attiva il worker più recente (al più 5 s di attesa) prima di ricaricare. */
async function activateLatest() {
  const reg = await navigator.serviceWorker?.getRegistration().catch(() => undefined);
  if (!reg) return;
  await reg.update().catch(() => undefined);
  const w = reg.installing ?? reg.waiting;
  if (!w) return;
  await new Promise((resolve) => {
    setTimeout(resolve, 5000);
    navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
    w.postMessage({ type: 'SKIP_WAITING' });
  });
}

/** La pagina è di una build non più pubblicata? Allora worker nuovo e ricaricamento (una volta per build). */
const recover = (): Promise<Recovery> =>
  (recovering ??= (async (): Promise<Recovery> => {
    const remote = await fetchRemote();
    if (!remote) return { reload: false, reason: 'offline' };
    if (!isNewerBuild(__SH_BUILD__, remote)) return { reload: false, reason: 'stessa-versione' };
    try {
      if (!shouldAutoReload(__SH_BUILD__, remote, sessionStorage.getItem(RELOAD_GUARD_KEY)))
        return { reload: false, reason: 'versione-ripetuta' };
      sessionStorage.setItem(RELOAD_GUARD_KEY, remote.commit);
    } catch {
      // Senza sessionStorage non c'è protezione dai cicli: niente ricaricamento automatico.
      return { reload: false, reason: 'versione-ripetuta' };
    }
    await activateLatest();
    location.reload();
    return { reload: true, reason: 'versione' };
  })());

addEventListener('astro:hydration-error', () => void recover());
addEventListener('unhandledrejection', (e) => {
  if (isChunkLoadError(e.reason)) void recover();
});
addEventListener('sh:island-error', (e) => {
  (e as CustomEvent<{ pending?: Promise<Recovery> }>).detail.pending = recover();
});
addEventListener('sh:hard-reload', (e) => {
  e.preventDefault();
  void (async () => {
    // Offline non si tocca nulla: senza rete la cache è tutto ciò che resta.
    if (await fetchRemote())
      await import('../pwa/reset')
        .then((m) =>
          m.resetSiteCaches(
            { serviceWorker: navigator.serviceWorker, caches: 'caches' in window ? caches : undefined },
            m.isCourseCache,
          ),
        )
        .catch(() => undefined);
    location.reload();
  })();
});

if (import.meta.env.PROD) {
  const start = () =>
    'serviceWorker' in navigator ? void register().catch(() => watchVersion(null)) : watchVersion(null);
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
}
