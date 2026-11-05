/**
 * Hook comuni del kit: movimento ridotto, ciclo di animazione senza perdite di
 * memoria (si ferma quando il componente si smonta, quando la scheda è nascosta
 * o quando l'elemento esce dallo schermo), dimensioni dell'elemento.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { RefObject } from 'preact';

/** true se l'utente preferisce meno movimento (aggiornato al cambio di preferenza). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const on = (): void => setReduced(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/**
 * Chiama `frame(dt, t)` a ogni fotogramma finché `running` è vero. `dt` è in
 * secondi ed è limitato (0,1 s) per evitare salti dopo una pausa. La callback
 * più recente viene sempre usata, senza riavviare il ciclo.
 */
export function useAnimationFrame(
  frame: (dt: number, t: number) => void,
  running: boolean,
  target?: RefObject<Element | null>,
): void {
  const cb = useRef(frame);
  cb.current = frame;
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = target?.current;
    if (!el || typeof IntersectionObserver !== 'function') return;
    const io = new IntersectionObserver((entries) => setVisible(entries.some((e) => e.isIntersecting)));
    io.observe(el);
    return () => io.disconnect();
  }, [target]);
  useEffect(() => {
    if (!running || !visible || typeof requestAnimationFrame !== 'function') return;
    let id = 0;
    let last = -1;
    let t = 0;
    const loop = (now: number): void => {
      const dt = last < 0 ? 0 : Math.min((now - last) / 1000, 0.1);
      last = now;
      if (!document.hidden) {
        t += dt;
        cb.current(dt, t);
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [running, visible]);
}

/** Larghezza (e altezza) dell'elemento, aggiornata con ResizeObserver. */
export function useElementSize<T extends Element>(
  ref: RefObject<T | null>,
  fallbackWidth = 640,
): { width: number; height: number } {
  const [size, setSize] = useState({ width: fallbackWidth, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = (): void => {
      const r = el.getBoundingClientRect();
      setSize((s) =>
        Math.abs(s.width - r.width) < 0.5 && Math.abs(s.height - r.height) < 0.5
          ? s
          : { width: r.width, height: r.height },
      );
    };
    read();
    if (typeof ResizeObserver !== 'function') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/** Legge il valore calcolato di un token CSS (es. "--accent") dall'elemento. */
export function cssVar(el: Element | null, name: string, fallback = '#888'): string {
  if (!el || typeof getComputedStyle !== 'function') return fallback;
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
}

/** Incrementa quando cambia il tema (data-theme o preferenza di sistema): ridisegna i canvas. */
export function useThemeVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const bump = (): void => setV((x) => x + 1);
    const mo = typeof MutationObserver === 'function' ? new MutationObserver(bump) : undefined;
    mo?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-course'],
    });
    const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : undefined;
    mq?.addEventListener('change', bump);
    return () => {
      mo?.disconnect();
      mq?.removeEventListener('change', bump);
    };
  }, []);
  return v;
}
