import type { JSX } from 'preact';
import { fmtPoints } from '~/lib/i18n';
import type { Answer, Question, QuestionResult, SelfGrade } from '~/engine/types';
import { diagramById } from '~/content/diagrams';
import { countMatchingSlots } from '~/engine/grade';
import { judgeSop } from '~/engine/parseSop';
import { TopicRef } from '~/ui/components/TopicRef';
import { AsmBlock } from './AsmBlock';
import { DiagramQuiz, type DiagramPicks } from './DiagramQuiz';
import { Rich } from './Rich';
import { TruthTable } from './TruthTable';

const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f'];

/** Disegna il dato allegato al quesito: tabella, mappa o listato. */
function Payload({ question }: { question: Question }): JSX.Element | null {
  const payload = question.payload;
  if (!payload) return null;

  switch (payload.type) {
    case 'truthTable':
      return (
        <TruthTable
          vars={payload.vars}
          rows={payload.rows}
          caption="Tabella di verità del quesito"
        />
      );
    case 'kmap':
      return (
        <TruthTable
          vars={payload.vars}
          rows={payload.rows}
          caption={`Tabella di verità di Y(${payload.vars.join(',')})${
            payload.dontCares.length ? ' — x = indifferenza' : ''
          }`}
        />
      );
    case 'asm':
      return <AsmBlock lines={payload.lines} />;
  }
}

interface Props {
  question: Question;
  index: number;
  answer: Answer | undefined;
  onAnswer: (answer: Answer) => void;
  /** Presente dopo la correzione: blocca gli input e mostra l'esito. */
  result?: QuestionResult;
  /** La soluzione modello è stata rivelata (quesiti `self`). */
  revealed: boolean;
  onReveal: () => void;
}

export function QuestionCard({
  question,
  index,
  answer,
  onAnswer,
  result,
  revealed,
  onReveal,
}: Props): JSX.Element {
  const locked = result !== undefined;

  return (
    <div class="q">
      <div class="q-top">
        <span class="q-num">{String(index + 1).padStart(2, '0')}</span>
        <span class="q-cat">{question.cat}</span>
        <TopicRef class="cite" topic={question.topic} />
        <span class="q-pts">{fmtPoints(question.points)} pt</span>
      </div>

      <Rich class="q-body" html={question.q} />
      <Payload question={question} />

      {question.kind === 'mc' && (
        <div class="choices" role="radiogroup" aria-label={`Quesito ${index + 1}`}>
          {question.options.map((option, position) => {
            const selected = answer?.kind === 'mc' && answer.choice === position;
            const isCorrect = locked && position === question.correct;
            const isWrong = locked && selected && position !== question.correct;

            return (
              <label
                key={option}
                class={[
                  'choice',
                  selected ? 'sel' : '',
                  isCorrect ? 'correct' : '',
                  isWrong ? 'wrong' : '',
                  locked ? 'locked' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <input
                  type="radio"
                  name={question.id}
                  checked={selected}
                  disabled={locked}
                  onChange={() => onAnswer({ kind: 'mc', choice: position })}
                />
                <span class="k" aria-hidden="true">
                  {LETTERS[position]}
                </span>
                <Rich as="span" html={option} />
              </label>
            );
          })}
        </div>
      )}

      {question.kind === 'fill' && (
        <input
          class={`fill${
            locked ? (result?.outcome === 'correct' ? ' ok' : ' ko') : ''
          }`}
          type="text"
          inputMode={question.normalize === 'bin' ? 'numeric' : 'text'}
          autocomplete="off"
          spellcheck={false}
          placeholder={question.placeholder ?? ''}
          aria-label={`Risposta al quesito ${index + 1}`}
          disabled={locked}
          value={answer?.kind === 'fill' ? answer.text : ''}
          onInput={(event) =>
            onAnswer({ kind: 'fill', text: (event.target as HTMLInputElement).value })
          }
        />
      )}

      {question.kind === 'diagram' &&
        (() => {
          const diagram = diagramById(question.diagramId);
          if (!diagram) return null;
          const picks: DiagramPicks = answer?.kind === 'diagram' ? answer.picks : {};
          // A correzione avvenuta ogni slot mostra il proprio esito: è un
          // quesito a punteggio parziale, quindi «giusto/sbagliato» sul
          // quesito intero non basterebbe.
          const verdict = locked
            ? Object.fromEntries(
                question.slots.map((slot) => [slot.id, picks[slot.id] === slot.label]),
              )
            : undefined;

          return (
            <DiagramQuiz
              diagram={diagram}
              options={question.options}
              picks={picks}
              locked={locked}
              verdict={verdict}
              onPick={(slotId, label) =>
                onAnswer({ kind: 'diagram', picks: { ...picks, [slotId]: label } })
              }
            />
          );
        })()}

      {question.kind === 'expr' && (
        <>
          <div class="field" style="margin-top:10px">
            <label for={`expr-${question.id}`}>Y =</label>
            <input
              id={`expr-${question.id}`}
              class={`fill${
                locked
                  ? result?.outcome === 'correct'
                    ? ' ok'
                    : result?.outcome === 'partial'
                      ? ''
                      : ' ko'
                  : ''
              }`}
              type="text"
              style="width:min(320px,100%)"
              autocomplete="off"
              spellcheck={false}
              placeholder="es. A'B + C"
              disabled={locked}
              value={answer?.kind === 'expr' ? answer.text : ''}
              onInput={(event) =>
                onAnswer({ kind: 'expr', text: (event.target as HTMLInputElement).value })
              }
            />
          </div>
          <p class="fn">
            Scrivila come sul foglio: <code>A'B + C</code>, <code>ĀB + C</code>,{' '}
            <code>!A·B + C</code> sono la stessa espressione.
          </p>
          {locked && (
            <div class="reveal">
              <div
                class={`rl${
                  result?.outcome === 'correct'
                    ? ''
                    : result?.outcome === 'partial'
                      ? ' half'
                      : ' ko'
                }`}
              >
                {(() => {
                  const verdict = judgeSop(
                    answer?.kind === 'expr' ? answer.text : '',
                    new Set(question.minterms),
                    new Set(question.dontCares),
                    question.vars,
                  );
                  if (verdict.status === 'empty') return 'Non risposta';
                  if (verdict.status === 'error') return `Non leggibile: ${verdict.message}`;
                  return verdict.message;
                })()}
              </div>
              <Rich html={question.model} />
            </div>
          )}
        </>
      )}

      {question.kind === 'self' && !revealed && (
        <div class="selfgrade">
          <span class="sl">Rispondi su carta, poi:</span>
          <button type="button" class="btn ghost mini" onClick={onReveal}>
            Mostra soluzione modello
          </button>
        </div>
      )}

      {question.kind === 'self' && revealed && (
        <div class="reveal">
          <div class="rl">Soluzione modello</div>
          <Rich html={question.model} />
          <div class="selfgrade">
            <span class="sl" id={`sg-${question.id}`}>
              Come te la sei cavata?
            </span>
            {(
              [
                [1, '✓ Corretta'],
                [0.5, '≈ Parziale'],
                [0, '✗ No'],
              ] as [SelfGrade, string][]
            ).map(([grade, label]) => {
              const active = answer?.kind === 'self' && answer.grade === grade;
              return (
                <button
                  key={label}
                  type="button"
                  class="btn ghost mini"
                  aria-pressed={active}
                  disabled={locked}
                  style={active ? 'border-color:var(--color-copper);color:var(--color-copper)' : ''}
                  onClick={() => onAnswer({ kind: 'self', grade })}
                >
                  {label}
                </button>
              );
            })}
            {answer?.kind === 'self' && answer.grade !== null && (
              <span class={`verdict ${answer.grade > 0 ? 'ok' : 'no'}`}>
                {answer.grade === 1 ? '+pieno' : answer.grade === 0.5 ? '+metà' : '0 pt'}
              </span>
            )}
          </div>
        </div>
      )}

      {locked && question.kind !== 'self' && question.kind !== 'expr' && (
        <div class="reveal">
          <div
            class={`rl${
              result.outcome === 'correct' ? '' : result.outcome === 'partial' ? ' half' : ' ko'
            }`}
          >
            {result.outcome === 'blank'
              ? 'Non risposta'
              : question.kind === 'diagram'
                ? // Sullo schema conta quante etichette sono al posto giusto:
                  // è il numero da cui esce il punteggio parziale.
                  (() => {
                    const right = countMatchingSlots(
                      question,
                      answer?.kind === 'diagram' ? answer.picks : {},
                    );
                    return `${right} etichett${right === 1 ? 'a' : 'e'} su ${
                      question.slots.length
                    } · ${fmtPoints(result.earned)} pt`;
                  })()
                : result.outcome === 'correct'
                  ? 'Corretta'
                  : result.outcome === 'partial'
                    ? `Parziale: ${fmtPoints(result.earned)} di ${fmtPoints(result.max)} punti`
                    : 'Da rivedere'}
          </div>
          {question.kind === 'fill' && (
            <p style="margin:0 0 6px">
              Risposta attesa: <span class="mono">{question.answer}</span>
            </p>
          )}
          {'hint' in question && question.hint && (
            <div style="color:var(--color-muted);font-size:13px">
              <Rich as="span" html={question.hint} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
