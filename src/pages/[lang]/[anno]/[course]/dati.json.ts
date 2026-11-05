/** Dati del corso per le isole che li caricano su richiesta (prova, stampa, ripasso globale). */
import type { APIRoute } from 'astro';
import { courseStaticPaths, getCourseData } from '../../../../lib/course-data';
import type { Lang } from '../../../../i18n';

export const getStaticPaths = courseStaticPaths;

export const GET: APIRoute = async ({ params, props }) => {
  const data = await getCourseData((props as { courseId: string }).courseId, params.lang as Lang);
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
