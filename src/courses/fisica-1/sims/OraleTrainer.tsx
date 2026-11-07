/**
 * Simulazione dell'orale di Fisica 1 (dal sito originale «Orale Trainer»): estrazione di un
 * argomento pesata verso quelli meno sicuri, timer, modalità facile (checklist a schermo da
 * spuntare) o difficile (a memoria, checklist rivelabile), autovalutazione 0–3 per punto e
 * domande di approfondimento. Esiti salvati in `sh:v1:fisica-1:orale`.
 * Testi (titoli, checklist, domande) arrivano già in HTML con KaTeX dalla pagina.
 */
import { useEffect, useMemo, useState } from 'preact/hooks';
import { read, write } from '../../../engine/storage';
import { createRng, randomSeed } from '../../../engine/random';
import '../../../sim/sim.css';
import './oral.css';

export interface OralTopic {
  id: string;
  title: string;
  group: string;
  href: string;
  /** Punti della scaletta (obiettivi), HTML. */
  checklist: string[];
  /** Domande di approfondimento, HTML. */
  questions: string[];
}

export interface OralTexts {
  intro: string;
  mode: string;
  easy: string;
  hard: string;
  easyHint: string;
  hardHint: string;
  start: string;
  drawn: string;
  speak: string;
  showChecklist: string;
  done: string;
  cancel: string;
  rate: string;
  scale: [string, string, string, string];
  followUp: string;
  save: string;
  result: string;
  again: string;
  study: string;
  history: string;
  empty: string;
  timer: string;
  avg: string;
}

export interface OralRecord {
  topic: string;
  at: number;
  seconds: number;
  /** Media dei voti 0–3 sulla checklist. */
  score: number;
  mode: 'facile' | 'difficile';
}
export interface OralState {
  v: 1;
  mode: 'facile' | 'difficile';
  history: OralRecord[];
}

const SCOPE = 'fisica-1';
const AREA = 'orale';
export const emptyOral = (): OralState => ({ v: 1, mode: 'difficile', history: [] });

/** Peso di estrazione: argomenti mai esposti o con media bassa escono più spesso. */
export function weights(topics: readonly { id: string }[], history: readonly OralRecord[]): number[] {
  return topics.map((t) => {
    const h = history.filter((r) => r.topic === t.id);
    if (h.length === 0) return 4;
    const last = h.slice(-3);
    const avg = last.reduce((s, r) => s + r.score, 0) / last.length;
    return 1 + (3 - avg);
  });
}

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function OraleTrainer({
  topics,
  texts: t,
}: {
  topics: OralTopic[];
  texts: OralTexts;
}): preact.JSX.Element {
  const [state, setState] = useState<OralState>(emptyOral);
  const [phase, setPhase] = useState<'idle' | 'talk' | 'rate' | 'done'>('idle');
  const [topic, setTopic] = useState<OralTopic | null>(null);
  const [start, setStart] = useState(0);
  const [now, setNow] = useState(0);
  const [ticked, setTicked] = useState<Record<number, boolean>>({});
  const [reveal, setReveal] = useState(false);
  const [votes, setVotes] = useState<Record<number, number>>({});

  useEffect(() => {
    const s = read<OralState>(SCOPE, AREA, emptyOral());
    setState(s && s.v === 1 && Array.isArray(s.history) ? s : emptyOral());
  }, []);
  useEffect(() => {
    if (phase !== 'talk') return undefined;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [phase]);

  const save = (s: OralState) => {
    setState(s);
    write(SCOPE, AREA, s);
  };
  const seconds = Math.max(0, Math.floor((now - start) / 1000));
  const lastByTopic = useMemo(() => {
    const m = new Map<string, OralRecord>();
    for (const r of state.history) m.set(r.topic, r);
    return m;
  }, [state.history]);

  const draw = () => {
    const r = createRng(randomSeed());
    const pick = r.weighted(topics, weights(topics, state.history));
    setTopic(pick);
    setTicked({});
    setVotes({});
    setReveal(false);
    setStart(Date.now());
    setNow(Date.now());
    setPhase('talk');
  };
  const finish = () => {
    if (!topic) return;
    const n = topic.checklist.length;
    const score = n ? topic.checklist.reduce((s, _, i) => s + (votes[i] ?? 0), 0) / n : 0;
    const rec: OralRecord = { topic: topic.id, at: Date.now(), seconds, score, mode: state.mode };
    save({ ...state, history: [...state.history, rec].slice(-200) });
    setPhase('done');
  };

  const modeSwitch = (
    <fieldset class="oral__mode">
      <legend>{t.mode}</legend>
      {(['facile', 'difficile'] as const).map((m) => (
        <label key={m}>
          <input
            type="radio"
            name="oral-mode"
            checked={state.mode === m}
            onChange={() => save({ ...state, mode: m })}
          />{' '}
          {m === 'facile' ? t.easy : t.hard}
        </label>
      ))}
      <p class="sim-note">{state.mode === 'facile' ? t.easyHint : t.hardHint}</p>
    </fieldset>
  );

  return (
    <div class="oral sim" aria-live="polite">
      {phase === 'idle' && (
        <>
          <p>{t.intro}</p>
          {modeSwitch}
          <button type="button" class="btn btn--primary" onClick={draw}>
            {t.start}
          </button>
        </>
      )}
      {topic && phase !== 'idle' && (
        <div class="oral__topic">
          <p class="eyebrow">{t.drawn}</p>
          <h3 dangerouslySetInnerHTML={{ __html: topic.title }} />
          <p class="sim-note">{topic.group}</p>
        </div>
      )}
      {phase === 'talk' && topic && (
        <>
          <p class="oral__timer" role="timer" aria-label={t.timer}>
            {fmt(seconds)}
          </p>
          <p>{t.speak}</p>
          {state.mode === 'facile' || reveal ? (
            <ul class="oral__checklist">
              {topic.checklist.map((c, i) => (
                <li key={i}>
                  <label>
                    <input
                      type="checkbox"
                      checked={!!ticked[i]}
                      onChange={() => setTicked({ ...ticked, [i]: !ticked[i] })}
                    />{' '}
                    <span dangerouslySetInnerHTML={{ __html: c }} />
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <button type="button" class="btn" onClick={() => setReveal(true)}>
              {t.showChecklist}
            </button>
          )}
          <div class="oral__actions">
            <button type="button" class="btn btn--primary" onClick={() => setPhase('rate')}>
              {t.done}
            </button>
            <button type="button" class="btn btn--ghost" onClick={() => setPhase('idle')}>
              {t.cancel}
            </button>
          </div>
        </>
      )}
      {phase === 'rate' && topic && (
        <>
          <p>{t.rate}</p>
          <ol class="oral__rate">
            {topic.checklist.map((c, i) => (
              <li key={i}>
                <span dangerouslySetInnerHTML={{ __html: c }} />
                <span class="oral__votes" role="radiogroup" aria-label={`${t.rate} ${i + 1}`}>
                  {t.scale.map((label, v) => (
                    <label key={v} title={label}>
                      <input
                        type="radio"
                        name={`vote-${i}`}
                        checked={votes[i] === v}
                        onChange={() => setVotes({ ...votes, [i]: v })}
                      />
                      <span>{v}</span>
                      <span class="visually-hidden">{label}</span>
                    </label>
                  ))}
                </span>
              </li>
            ))}
          </ol>
          <p class="sim-note">{t.scale.map((s, i) => `${i} = ${s}`).join(' · ')}</p>
          <h4>{t.followUp}</h4>
          <ul>
            {topic.questions.map((q, i) => (
              <li key={i} dangerouslySetInnerHTML={{ __html: q }} />
            ))}
          </ul>
          <button
            type="button"
            class="btn btn--primary"
            disabled={topic.checklist.some((_, i) => votes[i] === undefined)}
            onClick={finish}
          >
            {t.save}
          </button>
        </>
      )}
      {phase === 'done' && topic && (
        <>
          <p>
            {t.result
              .replace('{time}', fmt(seconds))
              .replace('{score}', (state.history.at(-1)?.score ?? 0).toFixed(1))}
          </p>
          <div class="oral__actions">
            <button type="button" class="btn btn--primary" onClick={draw}>
              {t.again}
            </button>
            <a class="btn" href={topic.href}>
              {t.study}
            </a>
          </div>
        </>
      )}
      <details class="oral__history">
        <summary>{t.history}</summary>
        {state.history.length === 0 ? (
          <p class="sim-note">{t.empty}</p>
        ) : (
          <ul>
            {topics
              .filter((tp) => lastByTopic.has(tp.id))
              .map((tp) => {
                const r = lastByTopic.get(tp.id)!;
                return (
                  <li key={tp.id}>
                    <a href={tp.href} dangerouslySetInnerHTML={{ __html: tp.title }} /> — {t.avg}{' '}
                    {r.score.toFixed(1)}/3 · {fmt(r.seconds)}
                  </li>
                );
              })}
          </ul>
        )}
      </details>
    </div>
  );
}
