/**
 * Turnstile (caricato alla prima interazione con il modulo) e identificativo anonimo del
 * dispositivo per i limiti di invio del backend.
 */
declare global {
  interface Window {
    turnstile?: {
      render(el: HTMLElement, opts: Record<string, unknown>): string;
      reset(id?: string): void;
      remove(id?: string): void;
    };
    /** Solo per i test end-to-end: sostituisce endpoint e sitekey della build. */
    __SH_CONTRIBUTE__?: { endpoint: string; siteKey: string };
  }
}

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const CLIENT_KEY = 'sh:v1:global:contribClient';

export function clientId(): string {
  try {
    const saved = JSON.parse(localStorage.getItem(CLIENT_KEY) ?? 'null');
    if (typeof saved === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(saved)) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem(CLIENT_KEY, JSON.stringify(id));
    return id;
  } catch {
    return '';
  }
}

let turnstileLoading: Promise<void> | null = null;
export function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  turnstileLoading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      turnstileLoading = null;
      reject(new Error('turnstile'));
    };
    document.head.appendChild(s);
  });
  return turnstileLoading;
}
