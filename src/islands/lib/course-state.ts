/** Padronanza e data d'esame di un corso, calcolate dallo storage e aggiornate quando cambia. */
import { useEffect, useState } from 'preact/hooks';
import { objectivesIndex, type TopicInfo } from '../../engine/course-data';
import { loadIndex } from './course-data-client';
import { computeMastery, examDateFor, type ObjectiveMastery } from '../../engine/mastery';
import { loadProgress, loadSrs } from '../../engine/progress';
import { loadExamState } from '../../engine/exam';
import { GLOBAL_SCOPE, read, subscribe, update } from '../../engine/storage';

export interface MasteryProps {
  courseId: string;
  topics: TopicInfo[];
  /** Cartella dei dati del corso: gli obiettivi di esercizi e carte si leggono da `indice.json`. */
  dataPath: string;
}

interface MasteryState {
  mastery: Record<string, ObjectiveMastery> | null;
  now: number;
  /** Numero di carte del corso (0 finché l'indice non è arrivato). */
  cardCount: number;
  /** Indice non scaricabile: `retry` riprova. */
  error: boolean;
  retry: () => void;
}

export function useMastery({ courseId, topics, dataPath }: MasteryProps): MasteryState {
  const [attempt, setAttempt] = useState(0);
  const retry = () => setAttempt((a) => a + 1);
  const [state, setState] = useState<MasteryState>({
    mastery: null,
    now: 0,
    cardCount: 0,
    error: false,
    retry,
  });
  useEffect(() => {
    let alive = true;
    let unsubs: Array<() => void> = [];
    setState((s) => ({ ...s, error: false }));
    loadIndex({ data: dataPath }).then(
      (ix) => {
        if (!alive) return;
        const exerciseObjectives = objectivesIndex(ix.exercises);
        const cardObjectives = objectivesIndex(ix.cards);
        const load = () => {
          const now = Date.now();
          setState({
            now,
            mastery: computeMastery({
              objectives: topics.flatMap((tp) => tp.objectives.map((o) => o.id)),
              exerciseObjectives,
              cardObjectives,
              progress: loadProgress(courseId),
              srs: loadSrs(courseId),
              exams: loadExamState(courseId).history,
              now,
            }),
            cardCount: ix.cards.length,
            error: false,
            retry,
          });
        };
        load();
        unsubs = ['progress', 'srs', 'exam'].map((area) => subscribe(courseId, area, load));
      },
      () => alive && setState((s) => ({ ...s, error: true })),
    );
    return () => {
      alive = false;
      unsubs.forEach((u) => u());
    };
  }, [courseId, dataPath, attempt]);
  return state;
}

export type ExamDates = Record<string, string>;

/** Data personale se non è passata, altrimenti il primo appello suggerito non ancora passato. */
export function effectiveExamDate(
  courseId: string,
  suggested: readonly string[],
  now: number,
  dates: ExamDates = read<ExamDates>(GLOBAL_SCOPE, 'examDates', {}),
): { date: string | null; personal: boolean } {
  const date = examDateFor(dates[courseId], suggested, now);
  return { date, personal: !!date && date === dates[courseId] };
}

export function useExamDates(): [ExamDates, (courseId: string, date: string | null) => void] {
  const [dates, setDates] = useState<ExamDates>({});
  useEffect(() => {
    const load = () => setDates(read<ExamDates>(GLOBAL_SCOPE, 'examDates', {}));
    load();
    return subscribe(GLOBAL_SCOPE, 'examDates', load);
  }, []);
  const set = (courseId: string, date: string | null) =>
    setDates(
      update<ExamDates>(GLOBAL_SCOPE, 'examDates', {}, (d) => {
        const next = { ...d };
        if (date) next[courseId] = date;
        else delete next[courseId];
        return next;
      }),
    );
  return [dates, set];
}
