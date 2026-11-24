/**
 * Formule dei generatori (revisione 2, R10): su molti semi e in entrambe le lingue ogni formula di testo,
 * passi, etichette e alternative passa da KaTeX in modo strict (un errore farebbe vedere il TeX grezzo:
 * il renderer ricade sul testo), e fuori dalle formule non resta notazione grezza (`v_cm`, `\frac`, `e^{…}`).
 */
import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { listGenerators, runGenerator } from '../../src/engine/generators/registry';
import { renderRich } from '../../src/engine/rich';
import { testoVisibile } from '../../tools/formule-grezze-html.mjs';
import { formuleGrezze } from '../../tools/formule-grezze-regole.mjs';
import '../../src/courses/fisica-1/generators/energia';
import '../../src/courses/fisica-1/generators/oscillazioni';
import '../../src/courses/fisica-1/generators/rigido';
import '../../src/courses/fisica-1/generators/termodinamica';
import '../../src/courses/fisica-2/generators/b1-elettrostatica';
import '../../src/courses/fisica-2/generators/b2-corrente';
import '../../src/courses/fisica-2/generators/b3-magnetostatica';
import '../../src/courses/fisica-2/generators/b4-induzione';
import '../../src/courses/fisica-2/generators/b5-onde';
import '../../src/courses/fondamenti-informatica/generators/assembly';
import '../../src/courses/fondamenti-informatica/generators/logica';
import '../../src/courses/fondamenti-informatica/generators/memoria';
import '../../src/courses/fondamenti-informatica/generators/numeri';
import '../../src/courses/teoria-circuiti/generators/analisi';
import '../../src/courses/teoria-circuiti/generators/applicate';

const SEEDS = Array.from({ length: 12 }, (_, i) => i * 104729 + 7);
const COURSES = ['fisica-1', 'fisica-2', 'fondamenti-informatica', 'teoria-circuiti'];

/** Come il renderer della build (strict), ma raccoglie gli errori invece di ricadere sul testo. */
function render(text: string, errors: string[]): string {
  return renderRich(text, (tex, display) => {
    try {
      return katex.renderToString(tex, { displayMode: display, throwOnError: true, strict: 'error' });
    } catch (e) {
      errors.push(`${tex} → ${(e as Error).message.split('\n')[0]}`);
      return '';
    }
  });
}

describe.each(COURSES)('generatori di %s: formule rese, niente notazione grezza', (course) => {
  const ids = listGenerators(course).map((g) => g.id);
  it('ci sono generatori', () => expect(ids.length).toBeGreaterThan(0));
  it.each(ids)(
    '%s',
    (id) => {
      const errors: string[] = [];
      const raw = new Set<string>();
      for (const lang of ['it', 'en'] as const) {
        for (const seed of SEEDS) {
          const g = runGenerator(id, seed, lang);
          const texts = [
            g.statement,
            ...g.steps.flatMap((s) => [s.title, s.body]),
            ...g.answer.map((a) => a.label),
            ...(g.choices ?? []).flatMap((c) => [c.text, c.explanation ?? '']),
          ];
          for (const t of texts) for (const f of formuleGrezze(testoVisibile(render(t, errors)))) raw.add(f);
        }
      }
      expect(errors.slice(0, 5)).toEqual([]);
      expect([...raw]).toEqual([]);
      // Come in tests/unit/teoria-circuiti/analisi.test.ts: i generatori d'analisi di TdC (livello 3) in CI,
      // con i file in parallelo, impiegano decine di secondi su 12 semi × 2 lingue; 5 s di default non bastano.
    },
    60_000,
  );
});
