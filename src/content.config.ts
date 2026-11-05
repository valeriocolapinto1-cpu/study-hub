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

const courses = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/courses' }),
  schema: courseSchema,
});

const topics = defineCollection({
  loader: glob({
    pattern: '*/*.yaml',
    base: './src/content/topics',
    generateId: ({ data }) => `${String(data.course)}/${String(data.id)}`,
  }),
  schema: topicSchema,
});

const theory = defineCollection({
  loader: glob({
    pattern: '*/*.mdx',
    base: './src/content/theory',
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ''),
  }),
  schema: theorySchema,
});

const formulas = defineCollection({
  loader: yamlListLoader('./src/content/formulas/'),
  schema: formulaSchema,
});
const exercises = defineCollection({
  loader: yamlListLoader('./src/content/exercises/'),
  schema: exerciseSchema,
});
const cards = defineCollection({ loader: yamlListLoader('./src/content/cards/'), schema: cardSchema });

export const collections = { courses, topics, theory, formulas, exercises, cards };
