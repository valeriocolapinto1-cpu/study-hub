/**
 * Dati del corso per le isole, divisi: `indice.json` (metadati, senza HTML) e `<argomento>.json`
 * (HTML di carte ed esercizi di un argomento). Le isole li scaricano quando servono.
 */
import type { APIRoute } from 'astro';
import {
  courseStaticPaths,
  courseTopics,
  getCourseIndex,
  getTopicData,
} from '../../../../../lib/course-data';
import { compactMathDeep } from '../../../../../lib/rich-server';
import { INDEX_NAME } from '../../../../../engine/course-data';
import type { Lang } from '../../../../../i18n';

export async function getStaticPaths() {
  const paths = await courseStaticPaths();
  return (
    await Promise.all(
      paths.map(async (p) => {
        const topics = await courseTopics(p.props.courseId, p.params.lang);
        return [INDEX_NAME, ...topics.map((t) => t.id)].map((name) => ({
          params: { ...p.params, name },
          props: p.props,
        }));
      }),
    )
  ).flat();
}

export const GET: APIRoute = async ({ params, props }) => {
  const { courseId } = props as { courseId: string };
  const lang = params.lang as Lang;
  const body =
    params.name === INDEX_NAME
      ? await getCourseIndex(courseId, lang)
      : compactMathDeep(await getTopicData(courseId, lang, params.name!));
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
