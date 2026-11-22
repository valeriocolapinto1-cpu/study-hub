/**
 * Contenuto di un esercizio (statico o generato nel browser) e valore atteso leggibile: condivisi
 * dall'isola dell'esercizio e dalla prova d'esame, in un modulo a parte perché la pagina esame
 * non scarichi il componente ExercisePlayer.
 */
import type { AnswerItemData, ChoiceData, ExerciseData, StepData } from '../../engine/course-data';
import { formatComplex, formatNumber, parseComplex } from '../../engine/units';
import { plainText } from '../../engine/rich';
import { renderRichClient } from './rich-client';
import type { Lang } from './i18n';

export interface Content {
  statementHtml: string;
  figureSvg?: string | undefined;
  steps: StepData[];
  answer: AnswerItemData[];
  choices?: ChoiceData[] | undefined;
}

export function staticContent(ex: ExerciseData): Content {
  return {
    statementHtml: ex.statementHtml ?? '',
    figureSvg: ex.figureSvg,
    steps: ex.steps,
    answer: ex.answer,
    choices: ex.choices,
  };
}

/** Esegue un generatore nel browser e rende i testi (KaTeX lazy). */
export async function generatedContent(
  courseId: string,
  generator: string,
  seed: number,
  lang: Lang,
): Promise<Content> {
  const { loadCourseGenerators, runGenerator } = await import('../../engine/generators/index');
  await loadCourseGenerators(courseId);
  const g = runGenerator(generator, seed, lang);
  const [statementHtml, steps, choices, answer] = await Promise.all([
    renderRichClient(g.statement),
    Promise.all(
      g.steps.map(async (s) => ({
        titleHtml: await renderRichClient(s.title, { inlineOnly: true }),
        bodyHtml: await renderRichClient(s.body),
      })),
    ),
    g.choices
      ? Promise.all(
          g.choices.map(async (c) => ({
            html: await renderRichClient(c.text, { inlineOnly: true }),
            label: plainText(c.text),
            correct: c.correct,
            ...(c.explanation ? { explanationHtml: await renderRichClient(c.explanation) } : {}),
          })),
        )
      : Promise.resolve(undefined),
    Promise.all(
      g.answer.map(async (a) => ({
        ...a,
        label: plainText(a.label),
        labelHtml: await renderRichClient(a.label, { inlineOnly: true }),
      })),
    ),
  ]);
  // figure da netlist o dal kit delle figure: il codice si carica solo quando un generatore lo usa
  let figureSvg = g.figure?.svg;
  const idPrefix = `fig-${generator.replace(/\W/g, '-')}-${seed}`;
  if (!figureSvg && g.figure?.netlist) {
    const { renderSchematic } = await import('../../sim/circuits/schematic');
    figureSvg = renderSchematic(g.figure.netlist, { lang, idPrefix }).svg;
  } else if (!figureSvg && g.figure?.diagram) {
    const { renderDiagramAsync } = await import('../../figures/lazy');
    figureSvg = (await renderDiagramAsync(g.figure.diagram.type, g.figure.diagram.params, { lang, idPrefix }))
      .svg;
  }
  return { statementHtml, figureSvg, steps, answer, choices };
}

/** Valore atteso leggibile (per il feedback dopo la soluzione). */
export function formatExpected(a: AnswerItemData, lang: Lang): string {
  if (typeof a.value === 'number') return `${formatNumber(a.value, { lang })}${a.unit ? ` ${a.unit}` : ''}`;
  const z = parseComplex(a.value);
  return z ? `${formatComplex(z, { lang })}${a.unit ? ` ${a.unit}` : ''}` : a.value;
}
