/**
 * Schemi Zod dei contenuti. Modulo puro (nessuna dipendenza dal runtime di
 * Astro oltre a zod): lo usano content.config.ts, i test e gli strumenti.
 * Il contratto è descritto in docs/ARCHITECTURE.md.
 */
import { z } from 'astro/zod';
import { Netlist } from '../sim/circuits/netlist';

export const LANG_VALUES = ['it', 'en'] as const;

import { GENERATOR_RE, KEBAB_RE, OBJECTIVE_RE } from './ids';

export { GENERATOR_RE, KEBAB_RE, OBJECTIVE_RE };

export const kebabId = z.string().regex(KEBAB_RE, 'id in kebab-case');
export const objectiveId = z.string().regex(OBJECTIVE_RE, 'id obiettivo nella forma <topicId>.<n>');

/** Testo in due lingue. L'inglese può mancare: lo segnala il test sulle traduzioni. */
export const localized = z.strictObject({
  it: z.string().trim().min(1),
  en: z.string().trim().min(1).optional(),
});
export type LocalizedText = z.infer<typeof localized>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'data ISO AAAA-MM-GG');

// ---------------------------------------------------------------- courses
export const examFormat = z.enum(['scritto', 'orale', 'scritto+orale']);

export const courseSchema = z.strictObject({
  id: kebabId,
  year: z.number().int().min(1).max(5),
  semester: z.union([z.literal(1), z.literal(2)]).optional(),
  title: localized,
  subtitle: localized.optional(),
  description: localized,
  /** Nome della tinta d'accento (definita in src/styles/courses/<id>.css). */
  accent: kebabId,
  exam: z.strictObject({
    format: examFormat,
    durationMin: z.number().int().positive().optional(),
    structure: z
      .array(
        z.strictObject({
          label: localized,
          points: z.number().nonnegative().optional(),
          kind: kebabId,
        }),
      )
      .default([]),
  }),
  extras: z.array(z.strictObject({ slug: kebabId, title: localized })).default([]),
  examDates: z.array(isoDate).optional(),
  /** Nome del repository originale (nome, non URL). */
  legacyRepo: z.string().min(1),
  order: z.number().int(),
});
export type Course = z.infer<typeof courseSchema>;

// ---------------------------------------------------------------- topics
export const topicSchema = z
  .strictObject({
    id: kebabId,
    course: kebabId,
    order: z.number().int().nonnegative(),
    title: localized,
    summary: localized,
    objectives: z.array(z.strictObject({ id: objectiveId, text: localized })).min(1),
    /** Capitolo o modulo come nel sito originale. */
    group: localized.optional(),
  })
  .superRefine((topic, ctx) => {
    topic.objectives.forEach((o, i) => {
      if (!o.id.startsWith(`${topic.id}.`)) {
        ctx.addIssue({
          code: 'custom',
          path: ['objectives', i, 'id'],
          message: `l'obiettivo "${o.id}" deve iniziare con "${topic.id}."`,
        });
      }
    });
  });
export type Topic = z.infer<typeof topicSchema>;

// ---------------------------------------------------------------- theory (frontmatter MDX)
export const LAYER_KINDS = ['intuizione', 'formalismo', 'esempio', 'errori'] as const;
export const theorySchema = z.strictObject({
  course: kebabId,
  topic: kebabId,
  lang: z.enum(LANG_VALUES),
});
export type TheoryFrontmatter = z.infer<typeof theorySchema>;

// ---------------------------------------------------------------- formulas
export const formulaSchema = z.strictObject({
  id: kebabId,
  /** Iniettato dal loader dal nome del file. */
  course: kebabId,
  topic: kebabId,
  objectives: z.array(objectiveId).optional(),
  latex: z.string().min(1),
  label: localized,
  note: localized.optional(),
  /** Significato dei simboli e unità di misura. */
  symbols: localized.optional(),
  /** Quando e come si usa. */
  usage: localized.optional(),
  /** Errore tipico nell'uso della formula. */
  pitfall: localized.optional(),
});
export type Formula = z.infer<typeof formulaSchema>;

// ---------------------------------------------------------------- exercises
/**
 * Figura di un esercizio: netlist di un circuito (schema in src/sim/circuits/netlist.ts,
 * disegnata con <Circuit>) oppure SVG già pronto.
 */
export const figureSchema = z
  .strictObject({ netlist: Netlist.optional(), svg: z.string().min(1).optional() })
  .refine((f) => Boolean(f.netlist) !== Boolean(f.svg), 'figure: indicare netlist oppure svg');

export const stepSchema = z.strictObject({ title: localized, body: localized });

export const answerItemSchema = z.strictObject({
  label: localized,
  value: z.union([z.number(), z.string().min(1)]),
  unit: z.string().optional(),
  /** Tolleranza relativa; se assente vale 0.01. */
  tol: z.number().positive().max(1).optional(),
});

export const choiceSchema = z.strictObject({
  text: localized,
  correct: z.boolean(),
  explanation: localized.optional(),
});

export const DEFAULT_TOLERANCE = 0.01;

export const exerciseSchema = z
  .strictObject({
    id: kebabId,
    course: kebabId,
    topic: kebabId,
    objectives: z.array(objectiveId).min(1),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    kind: z.enum(['static', 'generated']),
    generator: z.string().regex(GENERATOR_RE, 'generatore nella forma <courseId>/<nome>').optional(),
    statement: localized.optional(),
    figure: figureSchema.optional(),
    steps: z.array(stepSchema).default([]),
    answer: z.array(answerItemSchema).min(1).optional(),
    choices: z.array(choiceSchema).min(2).optional(),
    origin: z.enum(['originale', 'tipologia-appello']),
  })
  .superRefine((ex, ctx) => {
    if (ex.kind === 'generated') {
      if (!ex.generator)
        ctx.addIssue({ code: 'custom', path: ['generator'], message: 'esercizio generato senza generatore' });
      else if (!ex.generator.startsWith(`${ex.course}/`))
        ctx.addIssue({
          code: 'custom',
          path: ['generator'],
          message: 'il generatore deve appartenere al corso',
        });
    } else {
      if (ex.generator)
        ctx.addIssue({
          code: 'custom',
          path: ['generator'],
          message: 'solo gli esercizi generati hanno un generatore',
        });
      if (!ex.statement)
        ctx.addIssue({ code: 'custom', path: ['statement'], message: 'esercizio statico senza testo' });
      if (ex.steps.length === 0)
        ctx.addIssue({ code: 'custom', path: ['steps'], message: 'esercizio statico senza svolgimento' });
    }
    if (ex.answer && ex.choices)
      ctx.addIssue({
        code: 'custom',
        path: ['choices'],
        message: 'usare answer oppure choices, non entrambi',
      });
    if (ex.choices && !ex.choices.some((c) => c.correct))
      ctx.addIssue({ code: 'custom', path: ['choices'], message: 'nessuna risposta corretta' });
  });
export type Exercise = z.infer<typeof exerciseSchema>;

// ---------------------------------------------------------------- cards
export const cardSchema = z.strictObject({
  id: kebabId,
  course: kebabId,
  topic: kebabId,
  objectives: z.array(objectiveId).min(1),
  kind: z.enum(['definizione', 'formula', 'orale', 'concetto']),
  front: localized,
  back: localized,
});
export type Card = z.infer<typeof cardSchema>;

// ---------------------------------------------------------------- credits
/** Persone che hanno contribuito e hanno chiesto di comparire (src/content/credits.yaml). */
export const creditSchema = z.strictObject({
  id: kebabId,
  /** Nome come indicato nel modulo "Nome per i ringraziamenti". */
  name: z.string().trim().min(1).max(80),
  /** Cosa ha fatto, in breve (es. "errori nel formulario"). */
  contribution: localized,
  course: kebabId.optional(),
  /** Data di integrazione del contributo. */
  date: isoDate,
});
export type Credit = z.infer<typeof creditSchema>;
