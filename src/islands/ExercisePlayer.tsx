/** @jsxImportSource preact */
/**
 * Esercizio interattivo: enunciato, figura, risposta (con unità, complessi,
 * scelte), verifica con feedback sugli errori tipici, suggerimenti, soluzione
 * a passi rivelabili, "nuova variante" per i generati. Salva i tentativi in
 * `sh:v1:<courseId>:progress`.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { AnswerItemData, ChoiceData, ExerciseData, StepData } from '../engine/course-data';
import { answerHelpKey } from '../engine/course-data';
import { feedbackText, gradeAnswers, gradeChoice, type MultiResult } from '../engine/grading';
import { toAnswerSpec } from '../engine/exam';
import { exerciseStatus, loadProgress, saveAttempt, type ProgressState } from '../engine/progress';
import { formatComplex, formatNumber, parseComplex } from '../engine/units';
import { randomSeed } from '../engine/random';
import { renderRichClient } from './lib/rich-client';
import { plainText } from '../engine/rich';
import { useStored } from './lib/hooks';
import { t, type Lang } from './lib/i18n';
import './islands.css';

export interface ExercisePlayerProps {
  lang: Lang;
  courseId: string;
  exercise: ExerciseData;
  /** Numero mostrato nel titolo (es. 3 → «Esercizio 3»). */
  number?: number;
  headingLevel?: 2 | 3;
  /** Seme iniziale per i generati (default: derivato dall'id, stabile tra SSR e client). */
  seed?: number;
}

interface Content {
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
  const { loadCourseGenerators, runGenerator } = await import('../engine/generators/index');
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
  // figura da netlist: lo schema si carica solo quando un generatore lo usa
  let figureSvg = g.figure?.svg;
  if (!figureSvg && g.figure?.netlist) {
    const { renderSchematic } = await import('../sim/circuits/schematic');
    figureSvg = renderSchematic(g.figure.netlist, {
      lang,
      idPrefix: `fig-${generator.replace(/\W/g, '-')}-${seed}`,
    }).svg;
  }
  return { statementHtml, figureSvg, steps, answer, choices };
}

/** Valore atteso leggibile (per il feedback dopo la soluzione). */
export function formatExpected(a: AnswerItemData, lang: Lang): string {
  if (typeof a.value === 'number') return `${formatNumber(a.value, { lang })}${a.unit ? ` ${a.unit}` : ''}`;
  const z = parseComplex(a.value);
  return z ? `${formatComplex(z, { lang })}${a.unit ? ` ${a.unit}` : ''}` : a.value;
}

const STATUS_CLASS: Record<string, string> = {
  correct: 'is-correct',
  partial: 'is-partial',
  wrong: 'is-wrong',
  invalid: 'is-wrong',
  blank: '',
};

export default function ExercisePlayer({
  lang,
  courseId,
  exercise,
  number,
  headingLevel = 3,
  seed: seed0,
}: ExercisePlayerProps) {
  // Id derivati dall'esercizio: useId si ripete tra isole diverse (radici Preact separate).
  const uid = `ex-${exercise.id}`;
  const generated = exercise.kind === 'generated' && !!exercise.generator;
  const [seed, setSeed] = useState<number>(seed0 ?? 1);
  const pregenerated = generated && exercise.pregeneratedSeed !== undefined;
  const [content, setContent] = useState<Content | null>(
    generated && !pregenerated ? null : staticContent(exercise),
  );
  const [genError, setGenError] = useState(false);
  const [fields, setFieldsState] = useState<string[]>([]);
  // Copia sincrona: input rapidi in più campi non devono leggere uno stato vecchio.
  const fieldsRef = useRef<string[]>([]);
  const setFields = (next: string[]) => {
    fieldsRef.current = next;
    setFieldsState(next);
  };
  const [picked, setPicked] = useState<number[]>([]);
  const [result, setResult] = useState<MultiResult | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [hints, setHints] = useState(0);
  const [progress] = useStored<ProgressState | null>(
    courseId,
    'progress',
    () => loadProgress(courseId),
    null,
  );

  useEffect(() => {
    if (!generated) return;
    // variante già resa a build-time: niente generatori né KaTeX nel browser
    if (seed === exercise.pregeneratedSeed) {
      setContent(staticContent(exercise));
      return;
    }
    let alive = true;
    setContent(null);
    setGenError(false);
    generatedContent(courseId, exercise.generator!, seed, lang)
      .then((c) => alive && setContent(c))
      .catch(() => alive && setGenError(true));
    return () => {
      alive = false;
    };
  }, [generated, seed, courseId, exercise, lang]);

  const reset = () => {
    setFields([]);
    setPicked([]);
    setResult(null);
    setRevealed(0);
    setHints(0);
  };

  const multiple = useMemo(() => (content?.choices?.filter((c) => c.correct).length ?? 0) > 1, [content]);
  const status = exerciseStatus(progress?.exercises[exercise.id]);
  const attempts = progress?.exercises[exercise.id]?.attempts.length ?? 0;
  const steps = content?.steps ?? [];
  const selfGraded = !!content && content.answer.length === 0 && !content.choices?.length;
  const H = `h${headingLevel}` as 'h2' | 'h3';
  const title = number !== undefined ? t(lang, 'exercise.title', { n: number }) : exercise.title;

  const check = (current: string[] = fieldsRef.current) => {
    if (!content) return;
    const r = content.choices?.length
      ? gradeChoice({ correct: content.choices.flatMap((c, i) => (c.correct ? [i] : [])) }, picked)
      : gradeAnswers(
          content.answer.map(toAnswerSpec),
          content.answer.map((_, i) => current[i] ?? ''),
        );
    setResult(r);
    if (r.status !== 'blank' && r.status !== 'invalid') {
      saveAttempt(courseId, exercise.id, {
        at: Date.now(),
        score: r.score,
        ...(generated ? { seed } : {}),
        ...(hints ? { hints } : {}),
        ...(revealed > 0 ? { revealed: true } : {}),
      });
    }
  };

  const selfGrade = (score: number) => {
    saveAttempt(courseId, exercise.id, { at: Date.now(), score });
    setResult({ status: score === 1 ? 'correct' : score > 0 ? 'partial' : 'wrong', score, fields: [] });
  };

  const message = result
    ? {
        correct: 'exercise.correct',
        partial: 'exercise.partial',
        wrong: 'exercise.wrong',
        invalid: 'exercise.invalid',
        blank: 'exercise.blank',
      }[result.status]
    : null;

  return (
    <article
      class={`sh-exercise sh-card ${result ? STATUS_CLASS[result.status] : ''}`}
      aria-labelledby={`${uid}-h`}
      data-note-id={`esercizi/${exercise.id}`}
      id={exercise.id}
    >
      <header class="sh-exercise__head">
        <H id={`${uid}-h`} class="sh-exercise__title">
          {title}
        </H>
        <ul class="sh-tags" aria-label={t(lang, 'engine.status')}>
          <li class={`sh-tag sh-tag--d${exercise.difficulty}`}>
            {t(lang, `engine.difficulty.${exercise.difficulty}`)}
          </li>
          {generated && <li class="sh-tag">{t(lang, 'engine.generated')}</li>}
          <li class={`sh-tag sh-tag--${status}`} data-status={status}>
            {t(lang, `engine.status.${status}`)}
            {attempts > 0 && (
              <span class="sh-visually-hidden">, {t(lang, 'exercise.attempts', { n: attempts })}</span>
            )}
          </li>
        </ul>
        <span class="sh-note-slot" data-note-slot />
      </header>
      {exercise.fallback && <p class="sh-note">{t(lang, 'engine.fallback')}</p>}

      {genError ? (
        <p class="sh-alert sh-alert--danger" role="alert">
          {t(lang, 'exercise.generatorError')}
        </p>
      ) : !content ? (
        <p class="sh-muted" aria-busy="true">
          {t(lang, 'engine.loading')}
        </p>
      ) : (
        <>
          <div
            class="sh-exercise__statement prose"
            dangerouslySetInnerHTML={{ __html: content.statementHtml }}
          />
          {content.figureSvg && (
            <figure
              class="sh-figure"
              role="group"
              aria-label={t(lang, 'exercise.figure')}
              dangerouslySetInnerHTML={{ __html: content.figureSvg }}
            />
          )}

          {content.choices?.length ? (
            <fieldset class="sh-choices">
              <legend>{t(lang, multiple ? 'exercise.chooseMany' : 'exercise.choose')}</legend>
              {content.choices.map((c, i) => {
                const on = picked.includes(i);
                const mark = result ? (c.correct ? 'is-correct' : on ? 'is-wrong' : '') : '';
                return (
                  <label class={`sh-choice ${mark}`} key={i}>
                    <input
                      type={multiple ? 'checkbox' : 'radio'}
                      name={`${uid}-c`}
                      aria-label={c.label}
                      checked={on}
                      onChange={() =>
                        setPicked(multiple ? (on ? picked.filter((x) => x !== i) : [...picked, i]) : [i])
                      }
                    />
                    <span dangerouslySetInnerHTML={{ __html: c.html }} />
                    {result && c.explanationHtml && (on || c.correct) && (
                      <span class="sh-choice__why" dangerouslySetInnerHTML={{ __html: c.explanationHtml }} />
                    )}
                  </label>
                );
              })}
            </fieldset>
          ) : selfGraded ? (
            <p class="sh-muted">{t(lang, 'exercise.selfCheck')}</p>
          ) : (
            <div class="sh-fields">
              {content.answer.map((a, i) => {
                const fr = result?.fields[i];
                const id = `${uid}-f${i}`;
                return (
                  <div class={`sh-field ${fr ? STATUS_CLASS[fr.status] : ''}`} key={`${seed}-${i}`}>
                    {a.labelHtml ? (
                      <label for={id} dangerouslySetInnerHTML={{ __html: a.labelHtml }} />
                    ) : (
                      <label for={id}>{a.label}</label>
                    )}
                    <div class="sh-field__row">
                      <input
                        id={id}
                        class="sh-input"
                        // etichette di sole formule: il nome accessibile viene dal testo semplice
                        aria-label={a.labelHtml ? a.label : undefined}
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        spellcheck={false}
                        value={fields[i] ?? ''}
                        aria-describedby={`${uid}-help${fr ? ` ${id}-fb` : ''}`}
                        aria-invalid={fr ? fr.status === 'wrong' || fr.status === 'invalid' : undefined}
                        onInput={(e) => {
                          const next = [...fieldsRef.current];
                          next[i] = (e.target as HTMLInputElement).value;
                          setFields(next);
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') return;
                          // Valore letto dal campo: lo stato potrebbe non essere ancora aggiornato.
                          const next = [...fieldsRef.current];
                          next[i] = (e.target as HTMLInputElement).value;
                          setFields(next);
                          check(next);
                        }}
                      />
                      {a.unit && (
                        <span class="sh-field__unit" aria-label={t(lang, 'exercise.unit', { unit: a.unit })}>
                          {a.unit}
                        </span>
                      )}
                    </div>
                    {fr && fr.feedback.length > 0 && (
                      <ul id={`${id}-fb`} class="sh-feedback">
                        {fr.feedback.map((code) => (
                          <li key={code}>{feedbackText(code, lang)}</li>
                        ))}
                      </ul>
                    )}
                    {fr && revealed >= steps.length && steps.length > 0 && fr.status !== 'correct' && (
                      <p class="sh-muted">
                        {t(lang, 'exercise.expected', { value: formatExpected(a, lang) })}
                      </p>
                    )}
                  </div>
                );
              })}
              <p id={`${uid}-help`} class="sh-help">
                {t(lang, answerHelpKey(content.answer))}
              </p>
            </div>
          )}

          <div class="sh-actions">
            {!selfGraded && (
              <button type="button" class="btn btn--primary" onClick={() => check()}>
                {t(lang, 'exercise.check')}
              </button>
            )}
            {steps.length > 0 && revealed === 0 && (
              <button
                type="button"
                class="btn"
                aria-describedby={hints > 0 ? `${uid}-hint` : undefined}
                onClick={() => setHints((h) => Math.min(h + 1, steps.length))}
                disabled={hints >= steps.length}
              >
                {t(lang, 'exercise.hint')}
              </button>
            )}
            {generated && (
              <button
                type="button"
                class="btn btn--ghost"
                onClick={() => {
                  reset();
                  setSeed(randomSeed());
                }}
              >
                {t(lang, 'exercise.newVariant')}
              </button>
            )}
          </div>

          <div class="sh-live" role="status" aria-live="polite">
            {message && <p class={`sh-result ${STATUS_CLASS[result!.status]}`}>{t(lang, message)}</p>}
          </div>

          {hints > 0 && revealed === 0 && (
            <ol id={`${uid}-hint`} class="sh-hints" aria-label={t(lang, 'exercise.hint')}>
              {steps.slice(0, hints).map((s, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: s.titleHtml }} />
              ))}
            </ol>
          )}

          {steps.length > 0 && (
            <section class="sh-solution" aria-label={t(lang, 'exercise.solution')}>
              {revealed > 0 && (
                <ol class="sh-steps">
                  {steps.slice(0, revealed).map((s, i) => (
                    <li key={i} class="sh-step" tabIndex={-1} id={`${uid}-s${i}`}>
                      <p class="sh-step__title">
                        <span class="sh-visually-hidden">
                          {t(lang, 'exercise.step', { n: i + 1, total: steps.length })}:{' '}
                        </span>
                        <span dangerouslySetInnerHTML={{ __html: s.titleHtml }} />
                      </p>
                      <div class="prose" dangerouslySetInnerHTML={{ __html: s.bodyHtml }} />
                    </li>
                  ))}
                </ol>
              )}
              <div class="sh-actions">
                {revealed < steps.length && (
                  <>
                    <button
                      type="button"
                      class="btn"
                      aria-expanded={revealed > 0}
                      onClick={() => {
                        setRevealed(revealed + 1);
                        requestAnimationFrame(() => document.getElementById(`${uid}-s${revealed}`)?.focus());
                      }}
                    >
                      {t(lang, 'exercise.showStep')}
                    </button>
                    <button type="button" class="btn btn--ghost" onClick={() => setRevealed(steps.length)}>
                      {t(lang, 'exercise.showSolution')}
                    </button>
                  </>
                )}
                {revealed > 0 && (
                  <button type="button" class="btn btn--ghost" onClick={() => setRevealed(0)}>
                    {t(lang, 'exercise.hideSolution')}
                  </button>
                )}
              </div>
              {selfGraded && revealed >= steps.length && (
                <div class="sh-actions" role="group" aria-label={t(lang, 'exam.selfGrade')}>
                  <button type="button" class="btn" onClick={() => selfGrade(0)}>
                    {t(lang, 'exercise.self.0')}
                  </button>
                  <button type="button" class="btn" onClick={() => selfGrade(0.5)}>
                    {t(lang, 'exercise.self.05')}
                  </button>
                  <button type="button" class="btn btn--primary" onClick={() => selfGrade(1)}>
                    {t(lang, 'exercise.self.1')}
                  </button>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </article>
  );
}
