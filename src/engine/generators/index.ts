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

export * from './registry';
