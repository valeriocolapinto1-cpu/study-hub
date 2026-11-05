/**
 * Importa (e quindi registra) tutti i generatori dei corsi.
 * Ogni file `src/courses/<courseId>/generators/*.ts` deve chiamare `registerGenerator`.
 */
import { listGenerators } from './registry';

let loaded = false;

export function loadAllGenerators() {
  if (!loaded) {
    import.meta.glob('../../courses/*/generators/*.ts', { eager: true });
    loaded = true;
  }
  return listGenerators();
}

const lazy = import.meta.glob('../../courses/*/generators/*.ts');
const courseLoaded = new Set<string>();

/**
 * Carica solo i generatori di un corso (per le isole nel browser: evita di
 * scaricare quelli degli altri corsi). Idempotente.
 */
export async function loadCourseGenerators(courseId: string) {
  if (!courseLoaded.has(courseId)) {
    const prefix = `../../courses/${courseId}/generators/`;
    await Promise.all(
      Object.entries(lazy)
        .filter(([path]) => path.startsWith(prefix))
        .map(([, load]) => load()),
    );
    if (import.meta.env.PUBLIC_STUDY_HUB_FIXTURES === '1') {
      // Corso finto dei test end-to-end (solo nella build delle fixture).
      const fixtures = import.meta.glob('../../../tests/fixtures/generators/*.ts');
      if (courseId === 'esempio') await Promise.all(Object.values(fixtures).map((load) => load()));
    }
    courseLoaded.add(courseId);
  }
  return listGenerators(courseId);
}

export * from './registry';
