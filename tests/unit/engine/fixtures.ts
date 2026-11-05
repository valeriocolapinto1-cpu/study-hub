import type { CardData, ExerciseData, TopicInfo } from '../../../src/engine/course-data';

export const topics: TopicInfo[] = [
  {
    id: 'alfa',
    order: 1,
    title: 'Alfa',
    objectives: [
      { id: 'alfa.1', text: 'A1' },
      { id: 'alfa.2', text: 'A2' },
    ],
  },
  { id: 'beta', order: 2, title: 'Beta', objectives: [{ id: 'beta.1', text: 'B1' }] },
  { id: 'gamma', order: 3, title: 'Gamma', objectives: [{ id: 'gamma.1', text: 'G1' }] },
];

const ex = (id: string, topic: string, extra: Partial<ExerciseData> = {}): ExerciseData => ({
  id,
  topic,
  objectives: [`${topic}.1`],
  difficulty: 1,
  kind: 'static',
  title: id,
  statementHtml: `<p>${id}</p>`,
  steps: [{ titleHtml: 'Passo', bodyHtml: 'corpo' }],
  answer: [{ label: 'x', value: 1 }],
  ...extra,
});

export const exercises: ExerciseData[] = [
  ex('e1', 'alfa'),
  ex('e2', 'alfa', { objectives: ['alfa.2'] }),
  ex('e3', 'beta'),
  ex('e4', 'gamma'),
  ex('q1', 'beta', {
    answer: [],
    choices: [
      { html: 'a', correct: false },
      { html: 'b', correct: true },
    ],
  }),
  ex('g1', 'gamma', { kind: 'generated', generator: 'esempio/somma', answer: [], statementHtml: undefined }),
  ex('o1', 'alfa', { answer: [] }),
];

export const cards: CardData[] = [
  { id: 'c1', topic: 'alfa', objectives: ['alfa.1'], kind: 'orale', frontHtml: 'F1', backHtml: 'B1' },
  { id: 'c2', topic: 'beta', objectives: ['beta.1'], kind: 'definizione', frontHtml: 'F2', backHtml: 'B2' },
];
