import type { Page } from '@playwright/test';

const frames = (page: Page) =>
  page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

/**
 * Porta tutta la pagina in vista e torna alla finestra iniziale.
 *
 * Serve per due motivi: le isole `client:visible` si idratano solo quando entrano nella finestra,
 * e gli elementi con `content-visibility: auto` (voci dei formulari) hanno un'altezza stimata
 * finché non vengono disegnati. Dopo questo passaggio l'altezza reale resta ricordata (`auto`).
 * La finestra si allunga più volte finché l'altezza del documento non cambia più, perché
 * disegnare le voci cambia l'altezza; tra un passo e l'altro si attendono due frame, perché
 * `networkidle` non garantisce che il browser abbia disegnato.
 */
export async function renderWholePage(page: Page, settle?: () => Promise<void>): Promise<void> {
  const viewport = page.viewportSize()!;
  for (let last = 0, h = 1, i = 0; h !== last && i < 10; i++) {
    last = h;
    h = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width: viewport.width, height: Math.max(viewport.height, h) });
    await frames(page);
    if (settle) await settle();
  }
  await page.setViewportSize(viewport);
  await frames(page);
}
