/** Testi HTML di esercizi e carte di un argomento, scaricati dalle isole quando servono. */
import type { APIRoute } from 'astro';
import { courseTopicStaticPaths, getTopicData } from '../../../../../lib/course-data';
import type { Lang } from '../../../../../i18n';

export const getStaticPaths = courseTopicStaticPaths;

export const GET: APIRoute = async ({ params, props }) => {
  const { courseId, topicId } = props as { courseId: string; topicId: string };
  const data = await getTopicData(courseId, topicId, params.lang as Lang);
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
