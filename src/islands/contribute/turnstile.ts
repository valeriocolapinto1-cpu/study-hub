/**
 * Caricamento di Cloudflare Turnstile, oggi usato solo dal tutor AI (src/scripts/tutor/panel.ts).
 * Nato per il vecchio modulo Contribuisci (sostituito da un Google Form, R14): il file resta qui
 * per non toccare il tutor; il percorso si può riordinare in una voce del tutor.
 */
declare global {
  interface Window {
    turnstile?: {
      render(el: HTMLElement, opts: Record<string, unknown>): string;
      reset(id?: string): void;
      remove(id?: string): void;
    };
  }
}

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

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
