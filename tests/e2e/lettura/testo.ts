import type { Page } from '@playwright/test';

/**
 * Pagine campione della revisione di lettura («Pagine più leggere da leggere»): il loro testo visibile
 * deve contenere tutte le frasi che conteneva prima della revisione (`frasi.json`).
 */
export const PAGINE_LETTURA = [
  { name: 'home-it', path: 'it/' },
  { name: 'tdc-panoramica-it', path: 'it/anno-2/teoria-circuiti/' },
  { name: 'tdc-esercizi-indice-it', path: 'it/anno-2/teoria-circuiti/esercizi/' },
  { name: 'tdc-teoria-thevenin-it', path: 'it/anno-2/teoria-circuiti/teoria/teorema-di-thevenin/' },
  { name: 'fisica-2-panoramica-it', path: 'it/anno-2/fisica-2/' },
] as const;

/**
 * Testo visibile di `<main>` diviso in righe: le formule KaTeX diventano il loro TeX tra `$`
 * (così una formula resa e lo stesso TeX scritto in chiaro si confrontano allo stesso modo),
 * gli spazi si comprimono. Modifica il DOM della pagina: va chiamata per ultima.
 */
export async function righeVisibili(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const main = document.querySelector('main')!;
    for (const k of Array.from(main.querySelectorAll('.katex'))) {
      if (k.parentElement?.closest('.katex')) continue;
      const tex =
        k.querySelector('annotation[encoding="application/x-tex"]')?.textContent ??
        k.getAttribute('aria-label') ??
        '';
      k.replaceWith(document.createTextNode(`$${tex.trim()}$`));
    }
    return main.innerText
      .split('\n')
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .filter((s) => s.length > 0);
  });
}

/** Testo confrontabile: righe unite da uno spazio, TeX senza spazi interni ai `$…$`. */
export const testoUnito = (righe: string[]) => normalizza(righe.join(' '));
export const normalizza = (s: string) =>
  s
    .replace(/\$([^$]*)\$/g, (_, tex: string) => `$${tex.replace(/\s+/g, '')}$`)
    .replace(/\s+/g, ' ')
    .trim()
    // il maiuscolo degli occhielli è solo presentazione (text-transform)
    .toLocaleLowerCase('it');
