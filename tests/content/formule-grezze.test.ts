/**
 * Nessuna formula grezza nella build (revisione 2, R10): nel testo visibile di tutte le pagine (IT ed EN,
 * stampe comprese, con l'HTML già reso delle isole) e nei testi dei dati delle isole (`dati/*.json`), fuori
 * da KaTeX e dal codice, non compaiono `$…$`, comandi TeX, pedici `x_…` né esponenti `^{…}`.
 * Regole ed eccezioni in tools/formule-grezze-regole.mjs; il testo reso nel browser lo controlla
 * tests/e2e/formule.spec.ts su un campione, i generatori tests/unit/formule-generatori.test.ts.
 *
 * Gira dopo `npm run build` (job `build` della CI, con REQUIRE_DIST=1).
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { controllaBuild } from '../../tools/formule-grezze-build.mjs';
import { formuleGrezze } from '../../tools/formule-grezze-regole.mjs';
import { testoVisibile } from '../../tools/formule-grezze-html.mjs';

const DIST = join(process.cwd(), 'dist');
const hasDist = existsSync(join(DIST, 'index.html'));

describe('regole delle formule grezze', () => {
  it.each([
    ['v_cm = ωR', ['v_cm']],
    ['costante $R_{eq}$ qui', ['$R_{eq}$']],
    ['oscilla come e^{−γt}', ['^{−γt}']],
    ['vale \\varepsilon_0', ['\\varepsilon']],
    ['file study_hub_backup.json', []],
    ['nessuna formula: v = ωR', []],
  ])('%s', (testo, attesi) => expect(formuleGrezze(testo)).toEqual(attesi));

  it('il testo visibile salta KaTeX, codice e figure', () => {
    const html =
      '<p>Vale <span class="katex"><span>v_cm</span></span> e <code>x_1</code><svg><text>T_C</text></svg> ok</p>';
    expect(formuleGrezze(testoVisibile(html))).toEqual([]);
    expect(formuleGrezze(testoVisibile('<p>resta <b>Q_C</b></p>'))).toEqual(['Q_C']);
  });
});

describe('formule grezze nella build', () => {
  it('dist/ esiste quando è richiesto (CI)', () => {
    if (process.env.REQUIRE_DIST) expect(hasDist, 'manca dist/: esegui npm run build').toBe(true);
  });

  it.runIf(hasDist)('nessuna pagina né dato delle isole con formule grezze', () => {
    expect(controllaBuild(DIST)).toEqual({});
  });
});
