/**
 * Dati comuni alle pagine dei corsi (rotte src/pages/[lang]/[anno]/[course]/…):
 * percorsi statici e caricamento ordinato di argomenti, teoria e formule.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { LANGS, type Lang } from '../i18n';
import { coursePath, groupTopics } from './courses';

export { groupTopics };

export type CourseData = CollectionEntry<'courses'>['data'];
export type TopicData = CollectionEntry<'topics'>['data'];

/** Un percorso per ogni (lingua, corso) con almeno un argomento. */
export async function coursePaths() {
  const courses = await getCollection('courses');
  const topics = await getCollection('topics');
  return LANGS.flatMap((lang) =>
    courses
      .filter((c) => topics.some((t) => t.data.course === c.data.id))
      .map((c) => ({
        params: { lang, anno: `anno-${c.data.year}`, course: c.data.id },
        props: { course: c.data },
      })),
  );
}

export async function courseTopics(courseId: string): Promise<TopicData[]> {
  return (await getCollection('topics', (t) => t.data.course === courseId))
    .map((t) => t.data)
    .sort((a, b) => a.order - b.order);
}

export async function courseFormulas(courseId: string) {
  return (await getCollection('formulas', (f) => f.data.course === courseId)).map((f) => f.data);
}

export async function theoryEntry(courseId: string, topicId: string, lang: Lang) {
  const all = await getCollection('theory', (e) => e.data.course === courseId && e.data.topic === topicId);
  const exact = all.find((e) => e.data.lang === lang);
  return { entry: exact ?? all.find((e) => e.data.lang === 'it'), fallback: !exact };
}

export const sectionPath = (course: Pick<CourseData, 'id' | 'year'>, ...rest: string[]) =>
  [coursePath(course), ...rest].filter(Boolean).join('/');
