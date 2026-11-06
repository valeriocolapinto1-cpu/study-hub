/**
 * Record aggiuntivi per la ricerca (formule, esercizi, flashcard) in entrambe le lingue.
 * Il file è letto e poi rimosso da tools/integrations/pagefind.mjs dopo la build:
 * non viene pubblicato.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { LANGS } from '../config/site';
import { coursePaths } from '../lib/course-data';
import { buildRecords } from '../lib/search/records';

export const GET: APIRoute = async () => {
  const [courses, formulas, exercises, cards] = await Promise.all([
    getCollection('courses'),
    getCollection('formulas'),
    getCollection('exercises'),
    getCollection('cards'),
  ]);
  const records = LANGS.flatMap((lang) =>
    buildRecords({
      lang,
      courses: courses.map((c) => ({ id: c.data.id, paths: coursePaths(c.data, lang) })),
      formulas: formulas.map((f) => f.data),
      exercises: exercises.map((e) => e.data),
      cards: cards.map((c) => c.data),
    }),
  );
  return new Response(JSON.stringify(records), { headers: { 'Content-Type': 'application/json' } });
};
