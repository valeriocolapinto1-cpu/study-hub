/**
 * Dati dei corsi nel browser: indice (`dati/indice.json`) e testi per argomento
 * (`dati/<argomento>.json`), scaricati quando servono e tenuti in memoria per la
 * pagina (cache di `fetchJson`, condivisa fra le isole).
 */
import {
  indexUrl,
  topicDataUrl,
  type CardData,
  type CourseIndex,
  type CoursePaths,
  type ExerciseData,
  type TopicData,
} from '../../engine/course-data';
import { fetchJson, LoadError } from './hooks';

type DataPaths = Pick<CoursePaths, 'data'>;

export const loadIndex = (paths: DataPaths): Promise<CourseIndex> => fetchJson<CourseIndex>(indexUrl(paths));

export const loadTopic = (paths: DataPaths, topic: string): Promise<TopicData> =>
  fetchJson<TopicData>(topicDataUrl(paths, topic));

/** Esercizio completo (testi HTML) dal file del suo argomento. */
export async function loadExercise(
  paths: DataPaths,
  ref: { id: string; topic: string },
): Promise<ExerciseData> {
  const e = (await loadTopic(paths, ref.topic)).exercises.find((x) => x.id === ref.id);
  if (!e) throw new LoadError(`esercizio assente da ${ref.topic}.json: ${ref.id}`);
  return e;
}

/** Carta completa (fronte e retro in HTML) dal file del suo argomento. */
export async function loadCard(paths: DataPaths, ref: { id: string; topic: string }): Promise<CardData> {
  const c = (await loadTopic(paths, ref.topic)).cards.find((x) => x.id === ref.id);
  if (!c) throw new LoadError(`carta assente da ${ref.topic}.json: ${ref.id}`);
  return c;
}
