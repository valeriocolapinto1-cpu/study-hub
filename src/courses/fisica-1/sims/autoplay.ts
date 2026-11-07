/** Stato «in esecuzione» delle animazioni: parte da fermo e si avvia solo senza `prefers-reduced-motion`. */
import { useEffect, useState } from 'preact/hooks';

export function useAutoplay(): [boolean, (f: boolean | ((r: boolean) => boolean)) => void] {
  const [running, setRunning] = useState(false);
  useEffect(() => {
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) setRunning(true);
  }, []);
  return [running, setRunning];
}
