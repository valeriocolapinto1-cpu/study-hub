/** @jsxImportSource preact */
/**
 * Simulazione d'esame: configurazione, timer, navigazione tra le domande,
 * consegna, correzione automatica (autovalutazione per le domande aperte),
 * analisi per argomento/obiettivo, storico e PDF di prova e soluzioni
 * (pagina di stampa dedicata). La sessione in corso sopravvive al ricaricamento.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { CourseIndex, CourseSummary } from '../engine/course-data';
import {
  assembleExam,
  examRefs,
  gradeExam,
  loadExamState,
  printQuery,
  remainingMs,
  replaceRecord,
  saveRecord,
  saveSession,
  toRecord,
  type Exam,
  type ExamAnswer,
  type ExamConfig,
  type ExamRecord,
  type ExamSession,
  type ExamState,
} from '../engine/exam';
import { indexUrl, objectivesIndex } from '../engine/course-data';
import { randomSeed } from '../engine/random';
import { resolveExam, toResolved, type QuestionContent } from './lib/exam-content';
import { LoadError, useNow, useRemote } from './lib/hooks';
import { loadIndex } from './lib/course-data-client';
import { t, type Lang } from './lib/i18n';
import { isAnswered } from './exam/answered';
import { ExamRunning } from './exam/ExamRunning';
import { ExamSetup, type SetupForm } from './exam/ExamSetup';
import './islands.css';

export interface ExamRunnerProps {
  lang: Lang;
  course: CourseSummary;
  /** Argomenti (id, titolo) per la configurazione, già nell'HTML: l'indice serve solo alla partenza. */
  topics: Array<{ id: string; title: string }>;
}

type Phase = 'setup' | 'running' | 'result';
type ResultModule = typeof import('./exam/ExamResult');
// Esito (correzione, analisi) in un modulo a parte: non pesa sul caricamento della pagina e si
// scarica all'avvio della prova; i corsi salvati per l'offline includono anche questi moduli.
let resultModule: Promise<ResultModule> | undefined;
const loadResult = () => (resultModule ??= import('./exam/ExamResult'));
const TIME_MARKS = [1, 5, 10, 15, 30];

export default function ExamRunner({ lang, course, topics: topicList }: ExamRunnerProps) {
  const remote = useRemote<CourseIndex>([indexUrl(course.paths)]);
  const data = remote.state === 'ready' ? remote.data[0]! : null;
  const [phase, setPhase] = useState<Phase>('setup');
  const [examState, setExamState] = useState<ExamState | null>(null);
  // Scelte della configurazione: restano dopo «Nuova prova».
  const [form, setForm] = useState<SetupForm>({
    mode: course.structure.length > 0 ? 'completa' : 'personalizzata',
    topics: [],
    count: 6,
    timed: true,
    duration: course.durationMin ?? 120,
  });
  const patch = (p: Partial<SetupForm>) => setForm((f) => ({ ...f, ...p }));
  const [exam, setExam] = useState<Exam | null>(null);
  const [contents, setContents] = useState<QuestionContent[]>([]);
  const [session, setSessionState] = useState<ExamSession | null>(null);
  // Copia sincrona della sessione: più modifiche prima del render non si sovrascrivono.
  const sessionRef = useRef<ExamSession | null>(null);
  const setSession = (s: ExamSession | null) => {
    sessionRef.current = s;
    setSessionState(s);
  };
  const [record, setRecord] = useState<ExamRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Testi delle domande in arrivo da dati/<argomento>.json.
  const [opening, setOpening] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  // Annunci per i lettori di schermo (regione aria-live comune alle tre fasi): soglie di tempo ed esito.
  const [announce, setAnnounce] = useState('');
  const [Result, setResult] = useState<ResultModule | null | false>(null);
  const now = useNow(phase === 'running' ? 1000 : 0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => setExamState(loadExamState(course.id)), [course.id]);

  const topicTitle = useMemo(() => Object.fromEntries(topicList.map((tp) => [tp.id, tp.title])), [topicList]);
  const objectiveText = useMemo(
    () =>
      Object.fromEntries(
        (data?.topics ?? []).flatMap((tp) => tp.objectives.map((o) => [o.id, { text: o.text, tex: o.tex }])),
      ),
    [data],
  );

  const open = async (config: ExamConfig, refs: string[] | undefined, resume?: ExamSession) => {
    setError(null);
    setOpening(true);
    // l'indice si scarica all'apertura della pagina; qui si attende se non è ancora arrivato
    let ix: CourseIndex;
    try {
      ix = await loadIndex(course.paths);
    } catch {
      setError(t(lang, 'engine.loadError'));
      setOpening(false);
      return;
    }
    // Padronanza (prova mirata): moduli caricati solo per questo tipo di prova.
    let weakness: Record<string, number> | undefined;
    if (config.mode === 'mirata') {
      try {
        const [{ computeMastery }, { loadProgress, loadSrs }] = await Promise.all([
          import('../engine/mastery'),
          import('../engine/progress'),
        ]);
        weakness = Object.fromEntries(
          Object.values(
            computeMastery({
              objectives: ix.topics.flatMap((tp) => tp.objectives.map((o) => o.id)),
              exerciseObjectives: objectivesIndex(ix.exercises),
              cardObjectives: objectivesIndex(ix.cards),
              progress: loadProgress(course.id),
              srs: loadSrs(course.id),
              exams: loadExamState(course.id).history,
              now: Date.now(),
            }),
          ).map((m) => [m.id, m.value]),
        );
      } catch {
        setError(t(lang, 'engine.loadError'));
        setOpening(false);
        return;
      }
    }
    const e = assembleExam(
      {
        id: course.id,
        structure: course.structure,
        ...(course.durationMin ? { durationMin: course.durationMin } : {}),
        examFormat: course.examFormat,
      },
      ix,
      config,
      weakness,
      refs,
    );
    if (e.questions.length === 0) {
      setError(t(lang, 'exam.empty'));
      setOpening(false);
      return;
    }
    try {
      const c = await resolveExam(ix, e, lang, t(lang, 'review.back'));
      const s: ExamSession = resume ?? {
        config,
        startedAt: Date.now(),
        answers: [],
        current: 0,
        refs: examRefs(e),
      };
      setExam(e);
      setContents(c);
      setSession(s);
      saveSession(course.id, s);
      setPhase('running');
      setTimeUp(false);
      setAnnounce('');
      void loadResult().then(setResult, () => setResult(false));
      requestAnimationFrame(() => headingRef.current?.focus());
    } catch (err) {
      setError(t(lang, err instanceof LoadError ? 'engine.loadError' : 'exercise.generatorError'));
    } finally {
      setOpening(false);
    }
  };

  const start = () => {
    const { mode, topics, count, timed, duration } = form;
    return open(
      {
        mode,
        seed: randomSeed(),
        ...(topics.length && mode !== 'completa' ? { topics } : {}),
        ...(mode !== 'completa' ? { count } : {}),
        durationMin: timed ? duration : null,
      },
      undefined,
    );
  };

  const setAnswer = (index: number, a: ExamAnswer) => {
    const cur = sessionRef.current;
    if (!cur) return;
    const answers = [...cur.answers];
    answers[index] = { ...answers[index], ...a };
    const next = { ...cur, answers };
    setSession(next);
    saveSession(course.id, next);
  };
  const go = (i: number) => {
    const cur = sessionRef.current;
    if (!cur) return;
    const next = { ...cur, current: i };
    setSession(next);
    saveSession(course.id, next);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const result = useMemo(
    () =>
      exam && session && phase === 'result'
        ? gradeExam(exam, contents.map(toResolved), session.answers)
        : null,
    [exam, session, contents, phase],
  );

  const submit = (auto = false) => {
    if (!exam || !session) return;
    const blank = exam.questions.filter((q) => !isAnswered(session.answers[q.index], q.category)).length;
    if (!auto && blank > 0 && !window.confirm(t(lang, 'exam.confirmSubmit', { n: blank }))) return;
    const r = gradeExam(exam, contents.map(toResolved), session.answers);
    const rec = toRecord(exam, r, session.startedAt, Date.now());
    setExamState(saveRecord(course.id, rec));
    setRecord(rec);
    setPhase('result');
    setTimeUp(auto);
    loadResult().then(
      (m) => {
        setResult(m);
        setAnnounce(`${auto ? `${t(lang, 'exam.timeUp')} ` : ''}${m.scoreText(lang, r)}`);
        requestAnimationFrame(() => headingRef.current?.focus());
      },
      () => setResult(false),
    );
  };

  // Aggiorna l'esito registrato dopo ogni autovalutazione.
  useEffect(() => {
    if (phase !== 'result' || !result || !record || !exam || !session) return;
    if (result.earned === record.earned) return;
    const updated = {
      ...toRecord(exam, result, session.startedAt, record.at),
      id: record.id,
      durationMs: record.durationMs,
    };
    setRecord(updated);
    setExamState(replaceRecord(course.id, updated));
  }, [result]);

  const remaining =
    exam && session ? remainingMs(session.startedAt, exam.durationMin, now || Date.now()) : Infinity;
  // Tempo residuo per i lettori di schermo: il testo cambia (e si annuncia) solo a ogni soglia.
  const mark = now ? TIME_MARKS.find((m) => remaining <= m * 60_000) : undefined;
  useEffect(() => {
    if (phase === 'running' && now > 0 && remaining === 0) submit(true);
  }, [remaining, phase, now]);

  const printHref = (part: 'prova' | 'soluzioni') =>
    exam
      ? `${course.paths.print}${printQuery({ course: course.id, config: exam.config, part, refs: examRefs(exam) })}`
      : '#';

  return (
    <>
      {phase === 'setup' || !exam || !session ? (
        <ExamSetup
          lang={lang}
          course={course}
          topicList={topicList}
          form={form}
          patch={patch}
          pending={examState?.session}
          history={examState?.history ?? []}
          opening={opening}
          error={error}
          loadFailed={remote.state === 'error'}
          retry={() => remote.state === 'error' && remote.retry()}
          onStart={() => void start()}
          onResume={(pending) => open(pending.config, pending.refs, pending)}
          onDiscard={() => {
            saveSession(course.id, undefined);
            setExamState(loadExamState(course.id));
          }}
          headingRef={headingRef}
        />
      ) : phase === 'result' && result ? (
        Result ? (
          <Result.ExamResult
            lang={lang}
            course={course}
            exam={exam}
            contents={contents}
            answers={session.answers}
            result={result}
            timeUp={timeUp}
            topicTitle={topicTitle}
            objectiveText={objectiveText}
            printHref={printHref}
            onSelf={(index, self) => setAnswer(index, { self })}
            onNew={() => {
              setPhase('setup');
              setExam(null);
              setRecord(null);
            }}
            headingRef={headingRef}
          />
        ) : (
          <p class={Result === false ? 'sh-alert sh-alert--danger' : 'sh-muted'} role="status">
            {t(lang, Result === false ? 'engine.loadError' : 'engine.loading')}
          </p>
        )
      ) : (
        <ExamRunning
          lang={lang}
          exam={exam}
          contents={contents}
          answers={session.answers}
          current={session.current}
          remaining={remaining}
          topicTitle={topicTitle}
          setAnswer={setAnswer}
          go={go}
          onSubmit={() => submit(false)}
          headingRef={headingRef}
        />
      )}
      <p class="sh-visually-hidden" role="status" aria-live="polite">
        {phase === 'running' && remaining > 0 && mark ? t(lang, 'exam.timeAnnounce', { n: mark }) : announce}
      </p>
    </>
  );
}
