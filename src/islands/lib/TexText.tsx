/** @jsxImportSource preact */
/**
 * Testo breve con matematica nelle isole. `html`: già reso a build-time (etichette dei dati degli
 * argomenti). `tex`: sorgente con `$…$` (obiettivi, voci della prova, da `shortText` in
 * src/lib/course-data.ts), reso nel browser da rich-client con KaTeX caricato al bisogno; finché non è
 * pronto (e nell'HTML del server) si vede `text`, la versione in testo semplice.
 */
import { useEffect, useState } from 'preact/hooks';

export function TexText({
  text,
  html,
  tex,
}: {
  text: string;
  html?: string | undefined;
  tex?: string | undefined;
}) {
  const [rendered, setRendered] = useState<string | null>(null);
  useEffect(() => {
    if (html || !tex) return;
    let live = true;
    void import('./rich-client')
      .then((m) => m.renderRichClient(tex, { inlineOnly: true }))
      .then((h) => live && setRendered(h))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [html, tex]);
  const out = html ?? rendered;
  return out ? <span dangerouslySetInnerHTML={{ __html: out }} /> : <>{text}</>;
}
