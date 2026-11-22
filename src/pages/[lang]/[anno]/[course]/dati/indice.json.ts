/** Indice del corso per le isole (meta, argomenti, obiettivi, id e tipo di esercizi e carte; niente HTML). */
import type { APIRoute } from 'astro';
import { courseStaticPaths, getCourseIndex } from '../../../../../lib/course-data';
import type { Lang } from '../../../../../i18n';

export const getStaticPaths = courseStaticPaths;

export const GET: APIRoute = async ({ params, props }) => {
  const data = await getCourseIndex((props as { courseId: string }).courseId, params.lang as Lang);
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
