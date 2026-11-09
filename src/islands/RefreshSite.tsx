/** @jsxImportSource preact */
/**
 * "Aggiorna il sito": per quando il browser continua a mostrare una versione vecchia.
 * Dopo la conferma scarica un backup dei dati (stesso file di "Esporta in un file"),
 * deregistra il service worker, svuota Cache Storage e ricarica. localStorage e
 * IndexedDB (progressi, appunti, ripasso) non vengono toccati.
 */
import { useState } from 'preact/hooks';
import { resetSiteCaches } from '../pwa/update';
import { isStorageAvailable } from '../engine/storage';
import { downloadExport } from './lib/download-export';
import { t, type Lang } from './lib/i18n';
import './islands.css';

export interface RefreshSiteProps {
  lang: Lang;
}

export default function RefreshSite({ lang }: RefreshSiteProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const run = async () => {
    if (!window.confirm(t(lang, 'sync.refresh.confirm'))) return;
    setBusy(true);
    setMessage(t(lang, 'sync.refresh.working'));
    try {
      if (isStorageAvailable()) downloadExport();
      await resetSiteCaches({
        serviceWorker: 'serviceWorker' in navigator ? navigator.serviceWorker : undefined,
        caches: 'caches' in window ? caches : undefined,
      });
    } catch {
      /* si ricarica comunque: al peggio resta la cache del browser */
    }
    // Lascia partire il download del backup prima di ricaricare.
    setTimeout(() => location.reload(), 600);
  };

  return (
    <section class="sh-sync" aria-labelledby="sh-refresh-h" data-refresh-site>
      <h2 id="sh-refresh-h">{t(lang, 'sync.refresh.title')}</h2>
      <p>{t(lang, 'sync.refresh.lead')}</p>
      <div class="sh-actions">
        <button type="button" class="btn" onClick={run} disabled={busy}>
          {t(lang, 'sync.refresh.button')}
        </button>
      </div>
      <p role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
