import type { Course } from '../content/schemas';

/** Percorso di un corso senza base né lingua: `anno-<year>/<id>`. */
export const coursePath = (course: Pick<Course, 'year' | 'id'>): string => `anno-${course.year}/${course.id}`;

/** Ordina i corsi per anno, poi per `order`. */
export const sortCourses = <T extends Pick<Course, 'year' | 'order'>>(courses: T[]): T[] =>
  [...courses].sort((a, b) => a.year - b.year || a.order - b.order);

/** Sezioni fisse di ogni corso (contratto in docs/ARCHITECTURE.md). */
export const COURSE_SECTIONS = [
  { slug: '', key: 'nav.course.overview' },
  { slug: 'teoria', key: 'nav.course.theory' },
  { slug: 'formulario', key: 'nav.course.formulas' },
  { slug: 'esercizi', key: 'nav.course.exercises' },
  { slug: 'ripasso', key: 'nav.course.review' },
  { slug: 'esame', key: 'nav.course.exam' },
  { slug: 'progressi', key: 'nav.course.progress' },
] as const;
