/**
 * Dati di un corso per le isole del motore, dalle content collections:
 * testi nella lingua della pagina (con ripiego sull'italiano segnalato) e
 * testi ricchi già in HTML. Usato dai componenti di src/components/course/
 * e dagli endpoint `dati.json`.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import type {
  CardData,
  CourseData,
  CoursePaths,
  CourseSummary,
  ExerciseData,
  TopicInfo,
} from '../engine/course-data';
import { pick, tr, localizePath, type Lang } from '../i18n';
import { coursePath } from './courses';
import { plainText } from '../engine/rich';
import { richHtml, richInline } from './rich-server';
import { renderSchematic } from '../sim/circuits/schematic';

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
    // file statico generato dall'endpoint: niente barra finale
    data: localizePath(`${base}/dati.json`, lang).replace(/\/$/, ''),
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
        : {}),
    steps: e.steps.map((s) => ({
      titleHtml: richInline(tr(s.title, lang)),
      bodyHtml: richHtml(tr(s.body, lang)),
    })),
    answer: (e.answer ?? []).map((a) => ({
      label: tr(a.label, lang),
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
