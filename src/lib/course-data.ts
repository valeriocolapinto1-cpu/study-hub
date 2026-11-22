/**
 * Dati di un corso per le isole del motore, dalle content collections:
 * testi nella lingua della pagina (con ripiego sull'italiano segnalato) e
 * testi ricchi già in HTML (KaTeX senza MathML: vedi katex-lite.ts). Usato dai
 * componenti di src/components/course/ e dagli endpoint `dati/indice.json`
 * (`getCourseIndex`) e `dati/<argomento>.json` (`getTopicData`).
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import {
  exerciseCategory,
  INDEX_FILE,
  topicDataUrl,
  type CardData,
  type CardMeta,
  type CourseData,
  type CourseIndex,
  type CoursePaths,
  type CourseSummary,
  type ExerciseData,
  type ExerciseMeta,
  type TopicData,
  type TopicInfo,
} from '../engine/course-data';
import { pick, tr, localizePath, type Lang } from '../i18n';
import { coursePath } from './courses';
import { plainText } from '../engine/rich';
import { hashString } from '../engine/random';
import { richHtml as richHtmlFull, richInline as richInlineFull } from './rich-server';
import { stripMathml } from './katex-lite';
import { renderSchematic } from '../sim/circuits/schematic';
import { renderDiagram } from '../figures/render';
import { loadCourseGenerators, runGenerator } from '../engine/generators/index';

type CourseEntry = CollectionEntry<'courses'>['data'];

// Testi per le isole: KaTeX senza la copia MathML (il TeX resta come nome accessibile).
const richHtml = (text: string) => stripMathml(richHtmlFull(text));
const richInline = (text: string) => stripMathml(richInlineFull(text));

export function coursePaths(course: Pick<CourseEntry, 'id' | 'year'>, lang: Lang): CoursePaths {
  const base = coursePath(course);
  return {
    overview: localizePath(base, lang),
    theory: localizePath(`${base}/teoria`, lang),
    exercises: localizePath(`${base}/esercizi`, lang),
    review: localizePath(`${base}/ripasso`, lang),
    exam: localizePath(`${base}/esame`, lang),
    progress: localizePath(`${base}/progressi`, lang),
    // cartella dei file statici generati dagli endpoint dati/indice.json e dati/<argomento>.json
    data: localizePath(`${base}/dati`, lang),
    print: localizePath('stampa/prova', lang),
  };
}

export function courseSummary(course: CourseEntry, lang: Lang): CourseSummary {
  return {
    id: course.id,
    lang,
    year: course.year,
    title: tr(course.title, lang),
    examFormat: course.exam.format,
    ...(course.exam.durationMin ? { durationMin: course.exam.durationMin } : {}),
    structure: course.exam.structure.map((p) => ({
      label: tr(p.label, lang),
      kind: p.kind,
      ...(p.points !== undefined ? { points: p.points } : {}),
      ...(p.tag ? { tag: p.tag } : {}),
    })),
    examDates: course.examDates ?? [],
    paths: coursePaths(course, lang),
  };
}

export async function getCourse(courseId: string): Promise<CourseEntry> {
  const all = await getCollection('courses');
  const c = all.find((x) => x.data.id === courseId);
  if (!c) throw new Error(`corso sconosciuto: ${courseId}`);
  return c.data;
}

export async function courseTopics(courseId: string, lang: Lang): Promise<TopicInfo[]> {
  const topics = (await getCollection('topics'))
    .filter((t) => t.data.course === courseId)
    .sort((a, b) => a.data.order - b.data.order);
  return topics.map(({ data: t }) => ({
    id: t.id,
    order: t.order,
    title: tr(t.title, lang),
    objectives: t.objectives.map((o) => ({ id: o.id, text: tr(o.text, lang) })),
    ...(t.group ? { group: tr(t.group, lang) } : {}),
  }));
}

export function exerciseData(e: CollectionEntry<'exercises'>['data'], lang: Lang): ExerciseData {
  const statement = e.statement ? pick(e.statement, lang) : null;
  const fallback = !!statement?.fallback || e.steps.some((s) => pick(s.body, lang).fallback);
  return {
    id: e.id,
    topic: e.topic,
    objectives: e.objectives,
    difficulty: e.difficulty,
    kind: e.kind,
    ...(e.generator ? { generator: e.generator } : {}),
    ...(e.examTags ? { examTags: e.examTags } : {}),
    title: statement ? plainText(statement.text).slice(0, 140) : e.id,
    ...(statement ? { statementHtml: richHtml(statement.text) } : {}),
    // la netlist diventa SVG a build-time (stessa funzione del risolutore, zero JS nel browser)
    ...(e.figure?.svg
      ? { figureSvg: typeof e.figure.svg === 'string' ? e.figure.svg : tr(e.figure.svg, lang) }
      : e.figure?.netlist
        ? { figureSvg: renderSchematic(e.figure.netlist, { lang, idPrefix: `fig-${e.id}` }).svg }
        : e.figure?.diagram
          ? {
              figureSvg: renderDiagram(e.figure.diagram.type, e.figure.diagram.params as never, {
                lang,
                idPrefix: `fig-${e.id}`,
              }).svg,
            }
          : {}),
    steps: e.steps.map((s) => ({
      titleHtml: richInline(tr(s.title, lang)),
      bodyHtml: richHtml(tr(s.body, lang)),
    })),
    answer: (e.answer ?? []).map((a) => ({
      label: plainText(tr(a.label, lang)),
      labelHtml: richInline(tr(a.label, lang)),
      value: a.value,
      ...(a.unit ? { unit: a.unit } : {}),
      ...(a.tol !== undefined ? { tol: a.tol } : {}),
      ...(a.kind ? { kind: a.kind } : {}),
      ...(a.accept?.length ? { accept: a.accept } : {}),
    })),
    ...(e.choices
      ? {
          choices: e.choices.map((c) => ({
            html: richInline(tr(c.text, lang)),
            label: plainText(tr(c.text, lang)),
            correct: c.correct,
            ...(c.fixedLast ? { fixedLast: true } : {}),
            ...(c.explanation ? { explanationHtml: richHtml(tr(c.explanation, lang)) } : {}),
          })),
        }
      : {}),
    ...(fallback ? { fallback: true } : {}),
  };
}

export function cardData(c: CollectionEntry<'cards'>['data'], lang: Lang): CardData {
  const front = pick(c.front, lang);
  const back = pick(c.back, lang);
  return {
    id: c.id,
    topic: c.topic,
    objectives: c.objectives,
    kind: c.kind,
    frontHtml: richHtml(front.text),
    backHtml: richHtml(back.text),
    ...(front.fallback || back.fallback ? { fallback: true } : {}),
  };
}

const memo = new Map<string, Promise<CourseData>>();

/** Tutti i dati del corso per una lingua (in memoria per la durata della build). */
export function getCourseData(courseId: string, lang: Lang): Promise<CourseData> {
  const key = `${courseId}:${lang}`;
  let p = memo.get(key);
  if (!p) {
    p = (async () => {
      const course = await getCourse(courseId);
      const topicOrder = new Map((await courseTopics(courseId, lang)).map((t, i) => [t.id, i]));
      const exercises = (await getCollection('exercises'))
        .filter((e) => e.data.course === courseId)
        // Ordine stabile (il loader non garantisce quello dei file): argomento, difficoltà, id.
        .sort(
          (a, b) =>
            (topicOrder.get(a.data.topic) ?? 0) - (topicOrder.get(b.data.topic) ?? 0) ||
            a.data.difficulty - b.data.difficulty ||
            a.data.id.localeCompare(b.data.id),
        )
        .map((e) => exerciseData(e.data, lang));
      const cards = (await getCollection('cards'))
        .filter((c) => c.data.course === courseId)
        .sort(
          (a, b) =>
            (topicOrder.get(a.data.topic) ?? 0) - (topicOrder.get(b.data.topic) ?? 0) ||
            a.data.id.localeCompare(b.data.id),
        )
        .map((c) => cardData(c.data, lang));
      return { ...courseSummary(course, lang), topics: await courseTopics(courseId, lang), exercises, cards };
    })();
    memo.set(key, p);
  }
  return p;
}

/** Voce dell'indice di un esercizio (niente HTML). */
export function exerciseMeta(e: ExerciseData): ExerciseMeta {
  return {
    id: e.id,
    topic: e.topic,
    objectives: e.objectives,
    difficulty: e.difficulty,
    kind: e.kind,
    ...(e.generator ? { generator: e.generator } : {}),
    title: e.title,
    category: exerciseCategory(e),
    ...(e.examTags ? { examTags: e.examTags } : {}),
    ...(e.fallback ? { fallback: true } : {}),
  };
}

export const cardMeta = (c: CardData): CardMeta => ({
  id: c.id,
  topic: c.topic,
  objectives: c.objectives,
  kind: c.kind,
});

/** `dati/indice.json`: riepilogo, argomenti con obiettivi, esercizi e carte senza testi HTML. */
export async function getCourseIndex(courseId: string, lang: Lang): Promise<CourseIndex> {
  const { exercises, cards, ...rest } = await getCourseData(courseId, lang);
  if (rest.topics.some((t) => t.id === INDEX_FILE))
    throw new Error(`${courseId}: "${INDEX_FILE}" è un nome riservato, non può essere un argomento`);
  return { ...rest, exercises: exercises.map(exerciseMeta), cards: cards.map(cardMeta) };
}

/**
 * `dati/<argomento>.json`: testi di esercizi e carte di un argomento. I generati hanno
 * la stessa variante già resa della pagina dell'argomento (seme derivato dall'id).
 */
export async function getTopicData(courseId: string, topic: string, lang: Lang): Promise<TopicData> {
  const data = await getCourseData(courseId, lang);
  return {
    topic,
    exercises: await Promise.all(
      data.exercises.filter((e) => e.topic === topic).map((e) => withPregenerated(e, hashString(e.id), lang)),
    ),
    cards: data.cards.filter((c) => c.topic === topic),
  };
}

/**
 * Versione leggera per la pagina di un argomento: senza passi della soluzione né spiegazioni
 * delle scelte, che l'isola scarica da `dati/<argomento>.json` alla prima richiesta, e senza
 * enunciato e figura, che la pagina passa come slot (HTML una volta sola, non anche nelle props).
 */
export function lightExercise(ex: ExerciseData, paths: Pick<CoursePaths, 'data'>): ExerciseData {
  const { statementHtml: _s, figureSvg: _f, ...rest } = ex;
  return {
    ...rest,
    steps: [],
    stepCount: ex.steps.length,
    // testi delle scelte ed etichette dei campi: slot `c<i>` / `l<i>` della pagina
    ...(ex.choices
      ? { choices: ex.choices.map(({ explanationHtml: _, ...c }) => ({ ...c, html: '' })) }
      : {}),
    answer: ex.answer.map(({ labelHtml: _, ...a }) => a),
    detailsUrl: topicDataUrl(paths, ex.topic),
  };
}

/** Argomenti nella forma del sommario laterale di CourseLayout (TopicNav). */
export async function courseTopicsNav(courseId: string) {
  return (await getCollection('topics'))
    .filter((t) => t.data.course === courseId)
    .map(({ data: t }) => ({
      id: t.id,
      order: t.order,
      title: t.title,
      ...(t.group ? { group: t.group } : {}),
    }))
    .sort((a, b) => a.order - b.order);
}

/** Percorsi statici `[lang]/[anno]/[course]/dati/[topic]` (un file per argomento e lingua). */
export async function courseTopicStaticPaths() {
  const [courses, topics] = await Promise.all([getCollection('courses'), getCollection('topics')]);
  return courses.flatMap(({ data }) =>
    topics
      .filter((t) => t.data.course === data.id)
      .flatMap((t) =>
        (['it', 'en'] as const).map((lang) => ({
          params: { lang, anno: `anno-${data.year}`, course: data.id, topic: t.data.id },
          props: { courseId: data.id, topicId: t.data.id },
        })),
      ),
  );
}

/** Percorsi statici `[lang]/[anno]/[course]` di tutti i corsi. */
export async function courseStaticPaths() {
  const courses = await getCollection('courses');
  return courses.flatMap(({ data }) =>
    (['it', 'en'] as const).map((lang) => ({
      params: { lang, anno: `anno-${data.year}`, course: data.id },
      props: { courseId: data.id },
    })),
  );
}

/**
 * Rende a build-time la variante `seed` di un esercizio generato (stessi testi che l'isola
 * produrrebbe nel browser). Gli esercizi statici tornano invariati.
 */
export async function withPregenerated(ex: ExerciseData, seed: number, lang: Lang): Promise<ExerciseData> {
  if (ex.kind !== 'generated' || !ex.generator) return ex;
  await loadCourseGenerators(ex.generator.split('/')[0]!);
  const g = runGenerator(ex.generator, seed, lang);
  const idPrefix = `fig-${ex.generator.replace(/\W/g, '-')}-${seed}`;
  const figureSvg =
    g.figure?.svg ??
    (g.figure?.netlist
      ? renderSchematic(g.figure.netlist, { lang, idPrefix }).svg
      : g.figure?.diagram
        ? renderDiagram(g.figure.diagram.type, g.figure.diagram.params as never, { lang, idPrefix }).svg
        : undefined);
  return {
    ...ex,
    statementHtml: richHtml(g.statement),
    ...(figureSvg ? { figureSvg } : {}),
    steps: g.steps.map((s) => ({ titleHtml: richInline(s.title), bodyHtml: richHtml(s.body) })),
    answer: g.answer.map((a) => ({ ...a, label: plainText(a.label), labelHtml: richInline(a.label) })),
    ...(g.choices
      ? {
          choices: g.choices.map((c) => ({
            html: richInline(c.text),
            label: plainText(c.text),
            correct: c.correct,
            ...(c.explanation ? { explanationHtml: richHtml(c.explanation) } : {}),
          })),
        }
      : {}),
    pregeneratedSeed: seed,
  };
}
