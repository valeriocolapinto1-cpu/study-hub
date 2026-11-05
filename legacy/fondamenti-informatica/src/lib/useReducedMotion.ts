import { useEffect, useState } from 'preact/hooks';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Il CSS copre già animazioni e transizioni, ma le animazioni SMIL dentro
 * l'SVG (`<animateMotion>`) non rispondono alle media query: vanno tolte dal
 * DOM. Questo hook permette ai componenti di non renderizzarle affatto (§8).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(
    () => window.matchMedia?.(QUERY).matches ?? false,
  );

  useEffect(() => {
    const mq = window.matchMedia?.(QUERY);
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent): void => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
