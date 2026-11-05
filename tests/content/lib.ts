/**
 * Controlli sui contenuti, indipendenti dal runtime di Astro: schema Zod,
 * coerenza tra collezioni, traduzioni mancanti, argomenti identici a legacy.
 * Usati da content.test.ts sia su src/content sia sulle fixture.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import type { ZodType } from 'astro/zod';
import { readListFiles } from '../../src/content/loaders';
import {
  cardSchema,
  courseSchema,
  exerciseSchema,
  formulaSchema,
  theorySchema,
  topicSchema,
  type Course,
  type Topic,
} from '../../src/content/schemas';
import { compareTopicLists, type TopicTitle } from '../../tools/legacy-topics/compare.mjs';

export interface CheckOptions {
  /** Cartella dei contenuti (struttura di src/content). */
  contentDir: string;
  /** Cartella che contiene legacy/<courseId>. */
  legacyDir: string;
  /** Cartella degli estrattori <courseId>.mjs. */
  extractorsDir: string;
  /** Id dei generatori registrati. */
  generatorIds: Set<string>;
  /** Voci di traduzione mancante ammesse (supporta * finale). */
  translationWhitelist: string[];
}

export interface Entry<T> {
  file: string;
  data: T;
}

export interface LoadedContent {
  courses: Entry<Course>[];
  topics: Entry<Topic>[];
  theory: Entry<{ course: string; topic: string; lang: 'it' | 'en' }>[];
  formulas: Entry<Record<string, unknown>>[];
  exercises: Entry<Record<string, unknown>>[];
  cards: Entry<Record<string, unknown>>[];
}

const files = (dir: string, re: RegExp, depth = 1): string[] => {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory() && depth > 0) out.push(...files(full, re, depth - 1));
    else if (e.isFile() && re.test(e.name)) out.push(full);
  }
  return out.sort();
};

const frontmatter = (file: string): unknown => {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, 'utf8'));
  return m ? parse(m[1] ?? '') : {};
};

function validate<T>(schema: ZodType<T>, raw: unknown, file: string, errors: string[]): T | null {
  const r = schema.safeParse(raw);
  if (r.success) return r.data;
  for (const issue of r.error.issues)
    errors.push(`${file}: ${issue.path.join('.') || '(radice)'}: ${issue.message}`);
  return null;
}

export async function loadContent(contentDir: string, errors: string[]): Promise<LoadedContent> {
  const out: LoadedContent = { courses: [], topics: [], theory: [], formulas: [], exercises: [], cards: [] };
  for (const file of files(join(contentDir, 'courses'), /\.ya?ml$/, 0)) {
    const data = validate(courseSchema, parse(readFileSync(file, 'utf8')), file, errors);
    if (data) out.courses.push({ file, data });
  }
  for (const file of files(join(contentDir, 'topics'), /\.ya?ml$/)) {
    const data = validate(topicSchema, parse(readFileSync(file, 'utf8')), file, errors);
    if (data) out.topics.push({ file, data });
  }
  for (const file of files(join(contentDir, 'theory'), /\.mdx$/)) {
    const data = validate(theorySchema, frontmatter(file), file, errors);
    if (data) out.theory.push({ file, data });
  }
  const lists = [
    ['formulas', formulaSchema],
    ['exercises', exerciseSchema],
    ['cards', cardSchema],
  ] as const;
  for (const [name, schema] of lists) {
    try {
      for (const { file, item } of await readListFiles(join(contentDir, name))) {
        const data = validate(
          schema as ZodType<Record<string, unknown>>,
          item,
          `${file} [${String(item.id)}]`,
          errors,
        );
        if (data) out[name].push({ file, data });
      }
    } catch (err) {
      errors.push(String(err instanceof Error ? err.message : err));
    }
  }
  return out;
}

/** Trova i testi localizzati senza inglese, come percorsi "a.b.0.c". */
export function missingEnglish(value: unknown, path = ''): string[] {
  if (Array.isArray(value))
    return value.flatMap((v, i) => missingEnglish(v, path ? `${path}.${i}` : String(i)));
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (typeof obj.it === 'string' && keys.every((k) => k === 'it' || k === 'en')) {
      return typeof obj.en === 'string' && obj.en.trim() ? [] : [path];
    }
    return keys.flatMap((k) => missingEnglish(obj[k], path ? `${path}.${k}` : k));
  }
  return [];
}

const whitelisted = (key: string, list: string[]) =>
  list.some((w) => (w.endsWith('*') ? key.startsWith(w.slice(0, -1)) : key === w));

export async function checkContent(opts: CheckOptions): Promise<string[]> {
  const errors: string[] = [];
  const c = await loadContent(opts.contentDir, errors);

  // ---- corsi
  const courseIds = new Set<string>();
  for (const { file, data } of c.courses) {
    if (basename(file).replace(/\.ya?ml$/, '') !== data.id)
      errors.push(`${file}: il nome del file deve essere ${data.id}.yaml`);
    if (courseIds.has(data.id)) errors.push(`${file}: corso duplicato "${data.id}"`);
    courseIds.add(data.id);
    const slugs = data.extras.map((e) => e.slug);
    if (new Set(slugs).size !== slugs.length) errors.push(`${file}: slug degli extra duplicati`);
  }

  // ---- argomenti
  const topicsByCourse = new Map<string, Map<string, Topic>>();
  for (const { file, data } of c.topics) {
    const dir = basename(join(file, '..'));
    if (dir !== data.course)
      errors.push(`${file}: la cartella deve essere quella del corso "${data.course}"`);
    if (!new RegExp(`^\\d{2,3}-${data.id}\\.ya?ml$`).test(basename(file)))
      errors.push(`${file}: il nome del file deve essere <NN>-${data.id}.yaml`);
    if (!courseIds.has(data.course)) errors.push(`${file}: corso inesistente "${data.course}"`);
    const map = topicsByCourse.get(data.course) ?? new Map<string, Topic>();
    if (map.has(data.id)) errors.push(`${file}: argomento duplicato "${data.id}"`);
    if ([...map.values()].some((t) => t.order === data.order))
      errors.push(`${file}: order ${data.order} duplicato`);
    map.set(data.id, data);
    topicsByCourse.set(data.course, map);
  }
  const topicOf = (course: string, topic: string) => topicsByCourse.get(course)?.get(topic);

  // ---- teoria
  const theoryKeys = new Set<string>();
  for (const { file, data } of c.theory) {
    const expected = `${data.topic}.${data.lang}.mdx`;
    if (basename(file) !== expected) errors.push(`${file}: il nome del file deve essere ${expected}`);
    if (basename(join(file, '..')) !== data.course) errors.push(`${file}: cartella del corso errata`);
    if (!topicOf(data.course, data.topic))
      errors.push(`${file}: argomento inesistente "${data.course}/${data.topic}"`);
    theoryKeys.add(`${data.course}/${data.topic}.${data.lang}`);
  }
  for (const key of theoryKeys) {
    if (key.endsWith('.it')) {
      const en = key.replace(/\.it$/, '.en');
      if (!theoryKeys.has(en) && !whitelisted(`theory:${key.slice(0, -3)}`, opts.translationWhitelist))
        errors.push(`traduzione mancante: teoria ${en}.mdx`);
    } else if (!theoryKeys.has(key.replace(/\.en$/, '.it'))) {
      errors.push(`teoria ${key}.mdx senza versione italiana`);
    }
  }

  // ---- formule, esercizi, flashcard
  for (const name of ['formulas', 'exercises', 'cards'] as const) {
    const seen = new Set<string>();
    for (const { file, data } of c[name]) {
      const course = String(data.course);
      const id = `${course}/${String(data.id)}`;
      const where = `${file} [${String(data.id)}]`;
      if (seen.has(id)) errors.push(`${where}: id duplicato in ${name}`);
      seen.add(id);
      if (!courseIds.has(course)) errors.push(`${where}: corso inesistente "${course}"`);
      const topic = topicOf(course, String(data.topic));
      if (!topic) {
        errors.push(`${where}: argomento inesistente "${String(data.topic)}"`);
        continue;
      }
      if (name !== 'formulas' && basename(file).replace(/\.ya?ml$/, '') !== topic.id)
        errors.push(`${where}: il file deve chiamarsi ${topic.id}.yaml`);
      const objectiveIds = new Set(topic.objectives.map((o) => o.id));
      for (const o of (data.objectives as string[] | undefined) ?? [])
        if (!objectiveIds.has(o)) errors.push(`${where}: obiettivo inesistente "${o}"`);
      if (name === 'exercises' && data.kind === 'generated' && !opts.generatorIds.has(String(data.generator)))
        errors.push(`${where}: generatore non registrato "${String(data.generator)}"`);
    }
  }

  // ---- traduzioni mancanti nei campi localizzati
  const all: [string, Entry<Record<string, unknown>>[]][] = [
    ['courses', c.courses as unknown as Entry<Record<string, unknown>>[]],
    ['topics', c.topics as unknown as Entry<Record<string, unknown>>[]],
    ['formulas', c.formulas],
    ['exercises', c.exercises],
    ['cards', c.cards],
  ];
  for (const [name, entries] of all) {
    for (const { data } of entries) {
      const id = name === 'courses' ? String(data.id) : `${String(data.course)}/${String(data.id)}`;
      for (const p of missingEnglish(data)) {
        const key = `${name}:${id}:${p}`;
        if (!whitelisted(key, opts.translationWhitelist)) errors.push(`traduzione mancante: ${key}`);
      }
    }
  }

  // ---- argomenti identici al sito originale
  for (const courseId of courseIds) {
    const extractor = join(opts.extractorsDir, `${courseId}.mjs`);
    if (!existsSync(extractor)) {
      errors.push(`manca l'estrattore degli argomenti legacy: ${extractor}`);
      continue;
    }
    const mod = (await import(pathToFileURL(extractor).href)) as {
      default: (dir: string) => TopicTitle[] | Promise<TopicTitle[]>;
    };
    const legacy = await mod.default(join(opts.legacyDir, courseId));
    const migrated = [...(topicsByCourse.get(courseId)?.values() ?? [])]
      .sort((a, b) => a.order - b.order)
      .map((t) => ({ title: t.title.it, group: t.group?.it }));
    for (const p of compareTopicLists(legacy, migrated)) errors.push(`argomenti ${courseId}: ${p}`);
  }

  return errors;
}
