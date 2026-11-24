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
import { chapterOfFormula, formularyChapters } from '../lib/formulary';

export const GET: APIRoute = async () => {
  const [courses, topics, formulas, exercises, cards] = await Promise.all([
    getCollection('courses'),
    getCollection('topics'),
    getCollection('formulas'),
    getCollection('exercises'),
    getCollection('cards'),
  ]);
  // Capitolo del formulario di ogni formula (una pagina per capitolo).
  const chapterOf = new Map(
    courses.flatMap((c) =>
      [
        ...chapterOfFormula(
          formularyChapters(
            topics.filter((t) => t.data.course === c.data.id).map((t) => t.data),
            formulas.filter((f) => f.data.course === c.data.id).map((f) => f.data),
          ),
        ),
      ].map(([id, slug]) => [`${c.data.id}/${id}`, slug] as const),
    ),
  );
  const records = LANGS.flatMap((lang) =>
    buildRecords({
      lang,
      courses: courses.map((c) => ({ id: c.data.id, paths: coursePaths(c.data, lang) })),
      formulas: formulas.map((f) => ({ ...f.data, chapter: chapterOf.get(`${f.data.course}/${f.data.id}`) })),
      exercises: exercises.map((e) => e.data),
      cards: cards.map((c) => c.data),
    }),
  );
  return new Response(JSON.stringify(records), { headers: { 'Content-Type': 'application/json' } });
};
