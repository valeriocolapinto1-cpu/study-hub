/**
 * Uso da telefono e anello di focus.
 * - Barra in basso nelle pagine dei corsi sotto i 48em: cinque sezioni, bersagli ≥ 44 px, voce
 *   corrente, nessuna sovrapposizione col fondo della pagina, nascosta mentre si scrive.
 * - axe WCAG 2.2 AA a 390 px sulle pagine dei corsi, tema chiaro e scuro.
 * - Ogni fermata del Tab nelle pagine con il vetro (home, Contribuisci) ha un anello visibile e
 *   contrastato (≥ 3:1 sul fondo della pagina), in entrambi i temi.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { BASE } from './pages';
import { renderWholePage } from './render';

const TC = `${BASE}it/anno-2/teoria-circuiti/`;
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const PHONE = { width: 390, height: 844 };

async function useTheme(page: Page, theme: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme: theme });
  await page.addInitScript((t) => localStorage.setItem('sh:v1:global:theme', JSON.stringify(t)), theme);
}

test.describe('barra in basso (390 px)', () => {
  test.use({ viewport: PHONE });

  test('cinque sezioni, bersagli ≥ 44 px, voce corrente', async ({ page }) => {
    await page.goto(`${TC}esame/`);
    const bar = page.getByRole('navigation', { name: 'Sezioni principali del corso' });
    await expect(bar).toBeVisible();
    const links = bar.getByRole('link');
    await expect(links).toHaveText(['Teoria', 'Esercizi', 'Ripasso', 'Esame', 'Progressi']);
    for (const box of await Promise.all((await links.all()).map((l) => l.boundingBox()))) {
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }
    await expect(links.nth(3)).toHaveAttribute('aria-current', 'page');
    // dentro una sezione: la voce resta segnata
    await page.goto(`${TC}teoria/teorema-di-thevenin/`);
    await expect(bar.getByRole('link', { name: 'Teoria' })).toHaveAttribute('aria-current', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });

  test('il fondo della pagina resta sopra la barra', async ({ page }) => {
    await page.goto(TC);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const footer = await page.locator('.site-footer').boundingBox();
    const bar = await page.locator('.course-tabbar').boundingBox();
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(bar!.y + 1);
  });

  test('mentre si scrive la barra si nasconde', async ({ page }) => {
    await page.goto(`${TC}esercizi/`);
    await expect(page.locator('.course-tabbar')).toBeVisible();
    await page.evaluate(() => {
      const i = document.createElement('input');
      document.querySelector('main')!.append(i);
      i.focus();
    });
    await expect(page.locator('.course-tabbar')).toBeHidden();
  });

  test('il focus da tastiera non finisce sotto la barra', async ({ page }) => {
    // scorrimento istantaneo (senza, scroll-behavior: smooth anima la posizione)
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(TC);
    // l'ultimo link prima della barra (Segnala errore, in fondo alla colonna) portato in vista dal Tab
    const target = page.locator('.page-tools a').first();
    await target.evaluate((a: HTMLElement) => a.focus({ preventScroll: true }));
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(target).toBeFocused();
    const box = await target.boundingBox();
    const bar = await page.locator('.course-tabbar').boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(bar!.y);
  });

  for (const theme of ['light', 'dark'] as const) {
    for (const path of [
      '',
      'teoria/teorema-di-thevenin/',
      'esercizi/circuiti-primo-ordine/',
      'ripasso/',
      'esame/',
      'progressi/',
    ]) {
      test(`axe 390 px ${theme}: teoria-circuiti/${path}`, async ({ page }) => {
        await useTheme(page, theme);
        await page.goto(`${TC}${path}`, { waitUntil: 'networkidle' });
        await renderWholePage(page);
        const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        expect(
          serious.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
        ).toEqual([]);
      });
    }
  }
});

test('barra in basso assente da 48em', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto(TC);
  await expect(page.locator('.course-tabbar')).toBeHidden();
});

/** Anello di focus dell'elemento attivo (o del contenitore che lo disegna) e contrasto col fondo. */
async function focusRing(page: Page) {
  return page.evaluate(() => {
    const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 4).map(Number);
    const lum = ([r, g, b]: number[]) => {
      const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
    };
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    let ring: HTMLElement | null = el;
    for (let i = 0; ring && i < 4; i++, ring = ring.parentElement) {
      const s = getComputedStyle(ring);
      if (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2) {
        const bg = getComputedStyle(document.body).backgroundColor;
        const [a, b] = [lum(rgb(s.outlineColor)), lum(rgb(bg))];
        return {
          what: `${el.tagName.toLowerCase()}.${el.className}`,
          contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        };
      }
    }
    return {
      what: `${el.tagName.toLowerCase()}.${el.className} ${el.textContent?.trim().slice(0, 30)}`,
      contrast: 0,
    };
  });
}

for (const theme of ['light', 'dark'] as const) {
  for (const path of ['it/', 'it/contribuisci/']) {
    test(`anello di focus sul vetro ${theme}: ${path}`, async ({ page }) => {
      await useTheme(page, theme);
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      const weak: string[] = [];
      let stops = 0;
      for (let i = 0; i < 45; i++) {
        await page.keyboard.press('Tab');
        const r = await focusRing(page);
        if (!r) continue;
        stops++;
        if (r.contrast < 3) weak.push(`${r.what}: ${r.contrast.toFixed(2)}`);
      }
      expect(stops).toBeGreaterThan(10);
      expect(weak).toEqual([]);
    });
  }
}

/**
 * Rifiniture da telefono (revisione 2, R6), a 390×844 nei due temi:
 * barra in basso opaca, home con i corsi visibili senza scorrere, controlli dell'esame uniformi.
 */
test.describe('rifiniture da telefono (R6)', () => {
  test.use({ viewport: PHONE });

  for (const theme of ['light', 'dark'] as const) {
    test(`barra in basso opaca (${theme})`, async ({ page }) => {
      await useTheme(page, theme);
      await page.goto(`${TC}teoria/teorema-di-thevenin/`);
      const s = await page.locator('.course-tabbar').evaluate((el) => {
        const c = getComputedStyle(el);
        return { bg: c.backgroundColor, filter: c.backdropFilter };
      });
      // nessuna trasparenza: rgb(…) senza alfa, o alfa 1
      const alpha = s.bg.startsWith('rgba') ? Number(s.bg.match(/[\d.]+\)$/)![0].slice(0, -1)) : 1;
      expect(alpha, s.bg).toBe(1);
      expect(s.filter).toBe('none');
    });

    for (const lang of ['it', 'en'] as const) {
      test(`home: la prima scheda dei corsi si vede senza scorrere (${lang}, ${theme})`, async ({ page }) => {
        await useTheme(page, theme);
        await page.goto(`${BASE}${lang}/`);
        const card = page.locator('.home-course').first();
        const title = card.locator('.home-course__title a');
        await expect(title).toBeInViewport({ ratio: 1 });
        // titolo e inizio della descrizione sopra il fondo della schermata
        const desc = await card.locator('.home-course__desc').boundingBox();
        expect(desc!.y + 40).toBeLessThanOrEqual(PHONE.height);
        expect(await page.evaluate(() => window.scrollY)).toBe(0);
      });
    }

    test(`esame: «tipo di prova» con i colori degli altri controlli (${theme})`, async ({ page }) => {
      await useTheme(page, theme);
      await page.goto(`${TC}esame/`, { waitUntil: 'networkidle' });
      const radios = page.locator('input[name="sh-mode"]');
      await expect(radios.first()).toBeChecked();
      const look = (sel: string) =>
        page
          .locator(sel)
          .first()
          .evaluate((el) => {
            const c = getComputedStyle(el);
            return { bg: c.backgroundColor, border: c.borderTopColor };
          });
      const field = await look('.sh-input');
      const primary = await look('.btn--primary');
      // non scelto: fondo e bordo dei campi; scelto: l'accento del pulsante principale
      expect(await look('input[name="sh-mode"]:not(:checked)')).toEqual(field);
      expect((await look('input[name="sh-mode"]:checked')).bg).toBe(primary.bg);
      // la casella «Senza limite di tempo» segue le stesse regole
      expect(await look('.sh-check input[type="checkbox"]:not(:checked)')).toEqual(field);
    });
  }
});
