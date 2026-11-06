/** @jsxImportSource preact */
/**
 * "Scarica per l'offline" nella panoramica di un corso: chiede al service worker
 * (src/pwa/sw.js) di salvare tutte le pagine e le risorse del corso nella lingua
 * corrente, mostra la dimensione stimata, l'avanzamento e lo stato (non scaricato,
 * scaricato, aggiornamento disponibile), e permette di rimuoverlo.
 */
import { useEffect, useState } from 'preact/hooks';
import { formatBytes } from '../lib/contribute/rules';
import './platform.css';

export interface OfflineCourseProps {
  lang: 'it' | 'en';
  courseId: string;
  summaryUrl: string;
  texts: Record<string, string>;
}

type Status = {
  state: 'none' | 'complete' | 'partial';
  files: number;
  bytes: number;
  missing: number;
  missingBytes: number;
};
type View =
  | { kind: 'checking' }
  | { kind: 'unsupported' }
  | { kind: 'waiting'; bytes: number | null }
  | { kind: 'ready'; status: Status }
  | { kind: 'downloading'; done: number; total: number }
  | { kind: 'error'; status: Status | null };

const fmt = (s: string | undefined, p: Record<string, string | number>) =>
  (s ?? '').replace(/\{(\w+)\}/g, (m, k: string) => (k in p ? String(p[k]) : m));

function ask(
  worker: ServiceWorker,
  msg: Record<string, unknown>,
  onProgress?: (d: number, t: number) => void,
) {
  return new Promise<Record<string, any>>((resolve, reject) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = (e: MessageEvent<Record<string, any>>) => {
      const data = e.data;
      if (data.type === 'progress') onProgress?.(data.done, data.total);
      else if (data.type === 'error') reject(new Error(data.message));
      else resolve(data);
    };
    worker.postMessage(msg, [ch.port2]);
  });
}

/** Il worker risponde ai messaggi solo dopo l'attivazione (alla prima visita può essere ancora in corso). */
function activated(w: ServiceWorker): Promise<ServiceWorker> {
  if (w.state === 'activated') return Promise.resolve(w);
  return new Promise((resolve) => {
    const on = () => {
      if (w.state === 'activated') {
        w.removeEventListener('statechange', on);
        resolve(w);
      }
    };
    w.addEventListener('statechange', on);
  });
}

async function activeWorker(timeoutMs: number): Promise<ServiceWorker | null> {
  if (!('serviceWorker' in navigator)) return null;
  const ready = navigator.serviceWorker.ready.then((r) => (r.active ? activated(r.active) : null));
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), timeoutMs));
  return Promise.race([ready, timeout]);
}

export default function OfflineCourse({ lang, courseId, summaryUrl, texts: T }: OfflineCourseProps) {
  const [view, setView] = useState<View>({ kind: 'checking' });
  const [worker, setWorker] = useState<ServiceWorker | null>(null);
  const msgBase = { course: courseId, lang };

  const refresh = async (w: ServiceWorker) => {
    const s = await ask(w, { type: 'COURSE_STATUS', ...msgBase });
    if (s.state === 'unknown') setView({ kind: 'unsupported' });
    else setView({ kind: 'ready', status: s as Status });
  };

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('caches' in window)) {
      setView({ kind: 'unsupported' });
      return;
    }
    let alive = true;
    (async () => {
      const w = await activeWorker(4000);
      if (!alive) return;
      if (w) {
        setWorker(w);
        await refresh(w);
        return;
      }
      // Service worker non ancora attivo (prima visita): mostra almeno la stima.
      const bytes = await fetch(summaryUrl)
        .then((r) => (r.ok ? r.json() : null))
        .then((s) => (s?.courses?.[courseId]?.[lang]?.bytes as number | undefined) ?? null)
        .catch(() => null);
      if (!alive) return;
      setView({ kind: 'waiting', bytes });
      const later = await activeWorker(60000);
      if (alive && later) {
        setWorker(later);
        await refresh(later);
      }
    })().catch(() => alive && setView({ kind: 'error', status: null }));
    return () => {
      alive = false;
    };
  }, []);

  const download = async () => {
    if (!worker) return;
    // Chiede al browser di non liberare questa memoria quando lo spazio scarseggia.
    await navigator.storage?.persist?.().catch(() => false);
    setView({ kind: 'downloading', done: 0, total: 0 });
    try {
      const s = await ask(worker, { type: 'COURSE_DOWNLOAD', ...msgBase }, (done, total) =>
        setView({ kind: 'downloading', done, total }),
      );
      setView({ kind: 'ready', status: s as Status });
    } catch {
      const s = await ask(worker, { type: 'COURSE_STATUS', ...msgBase }).catch(() => null);
      setView({ kind: 'error', status: (s as Status | null) ?? null });
    }
  };

  const remove = async () => {
    if (!worker) return;
    const s = await ask(worker, { type: 'COURSE_REMOVE', ...msgBase });
    setView({ kind: 'ready', status: s as Status });
  };

  if (view.kind === 'unsupported') return null;

  const size = (n: number) => formatBytes(n, lang);
  let line = '';
  let action: preact.ComponentChildren = null;
  let tone: 'none' | 'ok' | 'warn' = 'none';
  switch (view.kind) {
    case 'checking':
      line = T.checking ?? '';
      break;
    case 'waiting':
      line = view.bytes ? fmt(T.waitingSize, { size: size(view.bytes) }) : (T.waiting ?? '');
      break;
    case 'downloading':
      line = view.total
        ? fmt(T.progress, { done: size(view.done), total: size(view.total) })
        : (T.starting ?? '');
      break;
    case 'error':
      line = T.error ?? '';
      tone = 'warn';
      action = (
        <button type="button" class="btn btn--sm" onClick={download}>
          {T.retry}
        </button>
      );
      break;
    case 'ready': {
      const s = view.status;
      if (s.state === 'none') {
        line = fmt(T.none, { size: size(s.bytes), files: s.files });
        action = (
          <button type="button" class="btn btn--primary btn--sm" onClick={download}>
            {T.download}
          </button>
        );
      } else if (s.state === 'complete') {
        tone = 'ok';
        line = fmt(T.complete, { size: size(s.bytes) });
        action = (
          <button type="button" class="btn btn--ghost btn--sm" onClick={remove}>
            {T.remove}
          </button>
        );
      } else {
        tone = 'warn';
        line = fmt(T.partial, { files: s.missing, size: size(s.missingBytes) });
        action = (
          <>
            <button type="button" class="btn btn--primary btn--sm" onClick={download}>
              {T.update}
            </button>
            <button type="button" class="btn btn--ghost btn--sm" onClick={remove}>
              {T.remove}
            </button>
          </>
        );
      }
    }
  }

  return (
    <section
      class="pf-offline"
      data-state={view.kind === 'ready' ? view.status.state : view.kind}
      aria-labelledby="pf-offline-title"
    >
      <div class="pf-offline__text">
        <h2 id="pf-offline-title" class="pf-offline__title">
          {T.title}
        </h2>
        <p class="pf-offline__status" data-tone={tone} role="status">
          {line}
        </p>
        {view.kind === 'downloading' && view.total > 0 && (
          <progress class="progress__bar" max={view.total} value={view.done} aria-label={T.progressLabel} />
        )}
      </div>
      {action && <div class="btn-row pf-offline__actions">{action}</div>}
    </section>
  );
}
