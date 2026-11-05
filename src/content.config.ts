import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { yamlListLoader } from './content/loaders';
import {
  cardSchema,
  courseSchema,
  exerciseSchema,
  formulaSchema,
  theorySchema,
  topicSchema,
} from './content/schemas';

/**
 * Con PUBLIC_STUDY_HUB_FIXTURES=1 (build delle fixture per i test end-to-end)
 * i contenuti arrivano dal corso finto di tests/fixtures/content.
 */
const ROOT = process.env.PUBLIC_STUDY_HUB_FIXTURES === '1' ? './tests/fixtures/content' : './src/content';

const courses = defineCollection({
  loader: glob({ pattern: '*.yaml', base: `${ROOT}/courses` }),
  schema: courseSchema,
});

const topics = defineCollection({
  loader: glob({
    pattern: '*/*.yaml',
    base: `${ROOT}/topics`,
    generateId: ({ data }) => `${String(data.course)}/${String(data.id)}`,
  }),
  schema: topicSchema,
});

const theory = defineCollection({
  loader: glob({
    pattern: '*/*.mdx',
    base: `${ROOT}/theory`,
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ''),
  }),
  schema: theorySchema,
});

const formulas = defineCollection({
  loader: yamlListLoader(`${ROOT}/formulas/`),
  schema: formulaSchema,
});
const exercises = defineCollection({
  loader: yamlListLoader(`${ROOT}/exercises/`),
  schema: exerciseSchema,
});
const cards = defineCollection({ loader: yamlListLoader(`${ROOT}/cards/`), schema: cardSchema });

export const collections = { courses, topics, theory, formulas, exercises, cards };
