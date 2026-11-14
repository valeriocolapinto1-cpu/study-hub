/**
 * Dati di un corso per le isole del motore, dalle content collections:
 * testi nella lingua della pagina (con ripiego sull'italiano segnalato) e
 * testi ricchi già in HTML. Usato dai componenti di src/components/course/
 * e dagli endpoint `dati/*.json` (indice e file per argomento).
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import type {
  CardData,
  CardIndex,
  CourseData,
  CourseIndex,
  ExerciseIndex,
  TopicData,
  CoursePaths,
  CourseSummary,
  ExerciseData,
  TopicInfo,
} from '../engine/course-data';
import { exerciseCategory } from '../engine/course-data';
import { pick, tr, localizePath, type Lang } from '../i18n';
import { coursePath } from './courses';
import { plainText } from '../engine/rich';
import { richHtml, richInline } from './rich-server';
import { renderSchematic } from '../sim/circuits/schematic';
import { renderDiagram } from '../figures/render';
import { loadCourseGenerators, runGenerator } from '../engine/generators/index';
import { hashString } from '../engine/random';

type CourseEntry = CollectionEntry<'courses'>['data'];

export function coursePaths(course: Pick<CourseEntry, 'id' | 'year'>, lang: Lang): CoursePaths {
  const base = coursePath(course);
  return {
    overview: localizePath(base, lang),
    theory: localizePath(`${base}/teoria`, lang),
    exercises: localizePath(`${base}/esercizi`, lang),
    review: localizePath(`${base}/ripasso`, lang),
    exam: localizePath(`${base}/esame`, lang),
    progress: localizePath(`${base}/progressi`, lang),
    // cartella dei file statici generati dall'endpoint (`indice.json`, `<argomento>.json`): niente barra finale
    data: localizePath(`${base}/dati`, lang).replace(/\/$/, ''),
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

function exerciseIndex(e: ExerciseData): ExerciseIndex {
  return {
    id: e.id,
    topic: e.topic,
    objectives: e.objectives,
    difficulty: e.difficulty,
    kind: e.kind,
    ...(e.generator ? { generator: e.generator } : {}),
    title: e.title,
    hasStatement: !!e.statementHtml,
    category: exerciseCategory(e),
  };
}

const cardIndex = (c: CardData): CardIndex => ({
  id: c.id,
  topic: c.topic,
  objectives: c.objectives,
  kind: c.kind,
});

/** Indice del corso (`dati/indice.json`): metadati senza HTML. */
export async function getCourseIndex(courseId: string, lang: Lang): Promise<CourseIndex> {
  const { exercises, cards, ...rest } = await getCourseData(courseId, lang);
  return { ...rest, exercises: exercises.map(exerciseIndex), cards: cards.map(cardIndex) };
}

/**
 * Contenuto di un argomento (`dati/<argomento>.json`). Per i generati c'è la variante già resa
 * del seme predefinito della pagina dell'argomento (stessa di `TopicExercises`).
 */
export async function getTopicData(courseId: string, lang: Lang, topicId: string): Promise<TopicData> {
  const data = await getCourseData(courseId, lang);
  return {
    exercises: await Promise.all(
      data.exercises.filter((e) => e.topic === topicId).map((e) => pregeneratedDefault(e, lang)),
    ),
    cards: data.cards.filter((c) => c.topic === topicId),
  };
}

const pregenMemo = new Map<string, Promise<ExerciseData>>();
/** Variante di partenza di un esercizio (seme derivato dall'id), in memoria per la durata della build. */
export function pregeneratedDefault(ex: ExerciseData, lang: Lang): Promise<ExerciseData> {
  const key = `${lang}:${ex.id}`;
  let p = pregenMemo.get(key);
  if (!p) pregenMemo.set(key, (p = withPregenerated(ex, hashString(ex.id), lang)));
  return p;
}

/**
 * Versione leggera per le props di una pagina: senza i corpi dei passi e le spiegazioni delle
 * scelte (l'isola li scarica da `dati/<argomento>.json` quando servono).
 */
export function leanExercise(ex: ExerciseData): ExerciseData {
  const { choices, ...rest } = ex;
  return {
    ...rest,
    steps: ex.steps.map((s) => ({ titleHtml: s.titleHtml, bodyHtml: '' })),
    ...(choices ? { choices: choices.map(({ explanationHtml: _e, ...c }) => c) } : {}),
    lean: true,
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
