/**
 * Teoria di Teoria dei Circuiti abbastanza completa (revisione 2, R1): per ogni argomento e lingua
 * - almeno 500 parole di prosa, contate come il tempo di lettura della pagina (`theoryOutline`:
 *   una formula `$…$` vale una parola), quindi almeno «3 min di lettura»;
 * - i quattro strati presenti e non vuoti (Intuizione ≥ 50 parole, Formalismo ≥ 100);
 * - almeno un esempio svolto numerico: un blocco `.worked` con numeri, almeno due passaggi
 *   numerati e un risultato;
 * - almeno 3 errori tipici (coppie Sbagliato/Corretto).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { theoryOutline } from '../../src/lib/theory-outline';

const COURSE = 'teoria-circuiti';
const THEORY = join(process.cwd(), 'src/content/theory', COURSE);
const TOPICS = readdirSync(join(process.cwd(), 'src/content/topics', COURSE))
  .filter((f) => f.endsWith('.yaml'))
  .sort()
  .map((f) => f.replace(/^\d+-/, '').replace(/\.yaml$/, ''));

const MIN_PAROLE = 500;
const MIN_INTUIZIONE = 50;
const MIN_FORMALISMO = 100;
const MIN_ERRORI = 3;

const parole = (mdx: string) => theoryOutline(mdx, []).words;

function strato(body: string, kind: string): string {
  const m = new RegExp(`<Layer kind="${kind}"[^>]*>([\\s\\S]*?)</Layer>`).exec(body);
  return m?.[1] ?? '';
}

/** Blocchi `<div class="worked" …>…</div>` dello strato degli esempi. */
function esempi(body: string): string[] {
  return [...strato(body, 'esempio').matchAll(/<div class="worked"[^>]*>([\s\S]*?)\n<\/div>/g)].map(
    (m) => m[1]!,
  );
}

/** Un esempio è numerico se ha cifre nell'enunciato e almeno due passaggi numerati con numeri. */
function esempioNumerico(ex: string): boolean {
  const passi = ex.split('\n').filter((r) => /^\d+\.\s/.test(r));
  const conNumeri = passi.filter((r) => /\d/.test(r.replace(/^\d+\.\s/, '')));
  return passi.length >= 2 && conNumeri.length >= 2 && /=/.test(passi.join(' '));
}

const errori = (body: string) =>
  (strato(body, 'errori').match(/^- \*\*(Sbagliato|Wrong):\*\*/gm) ?? []).length;

describe('teoria di Teoria dei Circuiti (R1)', () => {
  it('ci sono 49 argomenti', () => expect(TOPICS).toHaveLength(49));

  for (const topic of TOPICS) {
    for (const lang of ['it', 'en'] as const) {
      describe(`${topic} (${lang})`, () => {
        const body = readFileSync(join(THEORY, `${topic}.${lang}.mdx`), 'utf8');

        it(`almeno ${MIN_PAROLE} parole`, () => expect(parole(body)).toBeGreaterThanOrEqual(MIN_PAROLE));

        it('quattro strati completi', () => {
          expect(parole(strato(body, 'intuizione'))).toBeGreaterThanOrEqual(MIN_INTUIZIONE);
          expect(parole(strato(body, 'formalismo'))).toBeGreaterThanOrEqual(MIN_FORMALISMO);
          expect(esempi(body).length).toBeGreaterThanOrEqual(1);
        });

        it('almeno un esempio svolto numerico', () => expect(esempi(body).some(esempioNumerico)).toBe(true));

        it(`almeno ${MIN_ERRORI} errori tipici`, () =>
          expect(errori(body)).toBeGreaterThanOrEqual(MIN_ERRORI));
      });
    }
  }
});
