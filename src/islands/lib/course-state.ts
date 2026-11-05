/** Padronanza e data d'esame di un corso, calcolate dallo storage e aggiornate quando cambia. */
import { useEffect, useState } from 'preact/hooks';
import type { TopicInfo } from '../../engine/course-data';
import { computeMastery, daysUntil, type ObjectiveMastery } from '../../engine/mastery';
import { loadProgress, loadSrs } from '../../engine/progress';
import { loadExamState } from '../../engine/exam';
import { GLOBAL_SCOPE, read, subscribe, update } from '../../engine/storage';

export interface MasteryProps {
  courseId: string;
  topics: TopicInfo[];
  exerciseObjectives: Record<string, string[]>;
  cardObjectives: Record<string, string[]>;
}

export function useMastery({ courseId, topics, exerciseObjectives, cardObjectives }: MasteryProps): {
  mastery: Record<string, ObjectiveMastery> | null;
  now: number;
} {
  const [state, setState] = useState<{ mastery: Record<string, ObjectiveMastery> | null; now: number }>({
    mastery: null,
    now: 0,
  });
  useEffect(() => {
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
  }, [courseId]);
  return state;
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
