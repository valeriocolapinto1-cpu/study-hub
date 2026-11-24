/**
 * Formule nel testo reso nel browser (revisione 2, R10), su un campione: per ogni corso, in italiano e
 * in inglese, panoramica, teoria e stampa, info, un extra, esercizi (con una nuova variante dei generati e la soluzione),
 * progressi, prova e formulario. Dopo l'idratazione delle isole e con i <details> aperti, nel testo di
 * <main> fuori da KaTeX, codice e figure non devono comparire `$…$`, comandi TeX, `x_…` o `^{…}`.
 * Tutte le pagine compilate sono controllate in modo statico da tests/content/formule-grezze.test.ts.
 */
import { expect, test, type Page } from '@playwright/test';
import { BASE } from './pages';
import { formuleGrezze } from '../../tools/formule-grezze-regole.mjs';

const CORSI = [
  ['anno-1/fisica-1', 'rotolamento-puro', 'oscillatore-smorzato', 'simulazione-orale'],
  ['anno-1/fondamenti-informatica', 'gerarchia-di-memoria', 'gerarchia-di-memoria', 'convertitori'],
  ['anno-2/fisica-2', 'campi-variabili', 'corrente-stazionaria', 'laboratorio'],
  ['anno-2/teoria-circuiti', 'circuiti-primo-ordine', 'risposta-in-frequenza-filtri', 'esame-info'],
] as const;
const TESTI = {
  it: { variante: 'Nuova variante', soluzione: 'Mostra tutta la soluzione' },
  en: { variante: 'New variant', soluzione: 'Show full solution' },
} as const;

/** Testo visibile di <main> (isole idratate, <details> aperti) senza KaTeX, codice e figure. */
async function testo(page: Page): Promise<string> {
  // le isole client:visible si idratano quando entrano nella vista: si scorre tutta la pagina
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 30));
    }
  });
  // alcune isole restano statiche finché non servono (es. dentro sezioni chiuse): basta che la rete sia ferma
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    for (const d of Array.from(document.querySelectorAll('details'))) d.open = true;
    const main = document.querySelector('main')!;
    const c = main.cloneNode(true) as HTMLElement;
    for (const el of Array.from(c.querySelectorAll('.katex, pre, code, script, style, svg, template')))
      el.remove();
    // fuori dalla finestra ma nel layout, perché innerText segua la resa (blocchi, testo nascosto)
    c.style.cssText = 'position:absolute;left:-99999px;top:0;width:1000px';
    document.body.append(c);
    const t = c.innerText;
    c.remove();
    return t;
  });
}

for (const lang of ['it', 'en'] as const) {
  for (const [corso, teoria, esercizi, extra] of CORSI) {
    const base = `${BASE}${lang}/${corso}/`;
    test(`nessuna formula grezza: ${lang} ${corso}`, async ({ page }) => {
      test.setTimeout(120_000);
      const grezze: Record<string, string[]> = {};
      const controlla = async (percorso: string) => {
        await page.goto(`${base}${percorso}`, { waitUntil: 'networkidle' });
        const f = formuleGrezze(await testo(page));
        if (f.length) grezze[percorso || '(panoramica)'] = f;
      };
      for (const p of [
        '',
        `teoria/${teoria}/`,
        `teoria/${teoria}/stampa/`,
        'info/',
        `extra/${extra}/`,
        'progressi/',
        'esame/',
        'formulario/',
      ])
        await controlla(p);

      // esercizi: una nuova variante dei generati (resa nel browser con KaTeX caricato al bisogno)
      await page.goto(`${base}esercizi/${esercizi}/`, { waitUntil: 'networkidle' });
      const varianti = page.getByRole('button', { name: TESTI[lang].variante });
      const n = await varianti.count();
      for (let i = 0; i < Math.min(n, 4); i++) {
        const b = varianti.nth(i);
        await b.scrollIntoViewIfNeeded();
        await b.click();
        const art = page.locator('article', { has: b });
        const sol = art.getByRole('button', { name: TESTI[lang].soluzione });
        if (await sol.count())
          await sol
            .first()
            .click({ timeout: 3_000 })
            .catch(() => {});
      }
      await page.waitForLoadState('networkidle');
      const f = formuleGrezze(await testo(page));
      if (f.length) grezze[`esercizi/${esercizi}/ (+${n} varianti)`] = f;

      expect(grezze).toEqual({});
    });
  }
}
