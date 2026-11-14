/** Padronanza e data d'esame di un corso, calcolate dallo storage e aggiornate quando cambia. */
import { useEffect, useState } from 'preact/hooks';
import type { CourseIndex, TopicInfo } from '../../engine/course-data';
import { dataUrl, INDEX_NAME, objectivesIndex } from '../../engine/course-data';
import { computeMastery, daysUntil, type ObjectiveMastery } from '../../engine/mastery';
import { loadProgress, loadSrs } from '../../engine/progress';
import { loadExamState } from '../../engine/exam';
import { GLOBAL_SCOPE, read, subscribe, update } from '../../engine/storage';
import { fetchJson, peekJson } from './hooks';

export interface MasteryProps {
  courseId: string;
  topics: TopicInfo[];
  /** Cartella dei dati del corso (`paths.data`): gli obiettivi di carte ed esercizi arrivano da `indice.json`. */
  dataUrl: string;
}

export function useMastery({ courseId, topics, dataUrl: base }: MasteryProps): {
  mastery: Record<string, ObjectiveMastery> | null;
  now: number;
  /** Numero di carte del corso (0 finché l'indice non è scaricato). */
  cardCount: number;
  error: boolean;
  retry: () => void;
} {
  const url = dataUrl(base, INDEX_NAME);
  const [index, setIndex] = useState<CourseIndex | null>(() => peekJson<CourseIndex>(url) ?? null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setError(false);
    fetchJson<CourseIndex>(url)
      .then((i) => alive && setIndex(i))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [url, attempt]);
  const [state, setState] = useState<{ mastery: Record<string, ObjectiveMastery> | null; now: number }>({
    mastery: null,
    now: 0,
  });
  useEffect(() => {
    if (!index) return;
    const exerciseObjectives = objectivesIndex(index.exercises);
    const cardObjectives = objectivesIndex(index.cards);
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
      });
    };
    load();
    const subs = ['progress', 'srs', 'exam'].map((area) => subscribe(courseId, area, load));
    return () => subs.forEach((u) => u());
  }, [courseId, index]);
  return { ...state, cardCount: index?.cards.length ?? 0, error, retry: () => setAttempt((a) => a + 1) };
}

export type ExamDates = Record<string, string>;

/** Data personale se impostata, altrimenti il primo appello suggerito non ancora passato. */
export function effectiveExamDate(
  courseId: string,
  suggested: readonly string[],
  now: number,
  dates: ExamDates = read<ExamDates>(GLOBAL_SCOPE, 'examDates', {}),
): { date: string | null; personal: boolean } {
  const personal = dates[courseId];
  if (personal) return { date: personal, personal: true };
  const next = [...suggested].sort().find((d) => (daysUntil(d, now) ?? -1) >= 0);
  return { date: next ?? null, personal: false };
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
