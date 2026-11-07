/**
 * Registro dei generatori di esercizi. Ogni corso registra i propri in
 * `src/courses/<courseId>/generators/*.ts` chiamando `registerGenerator`;
 * `loadAllGenerators()` (in ./index.ts) li importa tutti.
 *
 * Contratto: `generate(seed, lang)` è deterministico (stesso seed e lingua →
 * stesso risultato) e restituisce testi già localizzati, nella stessa forma
 * degli esercizi statici.
 */
import type { Lang } from '../../config/site';
import { GENERATOR_RE, OBJECTIVE_RE, KEBAB_RE } from '../../content/ids';
import type { NetlistInput } from '../../sim/circuits/netlist';
import type { DiagramSpec } from '../../figures/schemas';
import { isDiagramType } from '../../figures/types';

export type { Lang };

export interface ExerciseStep {
  title: string;
  body: string;
}

export interface ExerciseFigure {
  /** Netlist del circuito (formato in src/sim/circuits/netlist.ts, guida in docs/SIM.md). */
  netlist?: NetlistInput;
  /** Figura del kit (`src/figures`, guida in docs/FIGURE.md) con i parametri dell'esercizio. */
  diagram?: DiagramSpec;
  /** SVG inline. */
  svg?: string;
}

export interface AnswerItem {
  label: string;
  value: number | string;
  unit?: string;
  /** Tolleranza relativa (default 0.01). */
  tol?: number;
  /** Tipo di confronto; dedotto dal valore se assente (`text` per codici binari, esadecimali, nomi). */
  kind?: 'number' | 'complex' | 'text';
  /** Per `text`: forme alternative accettate. */
  accept?: string[];
}

export interface Choice {
  text: string;
  correct: boolean;
  explanation?: string;
}

export interface GeneratedExercise {
  statement: string;
  figure?: ExerciseFigure;
  steps: ExerciseStep[];
  /** Risposte numeriche o testuali da verificare. */
  answer: AnswerItem[];
  /** In alternativa alle risposte libere: scelta multipla (answer vuoto). */
  choices?: Choice[];
}

export interface GeneratorDefinition {
  /** `<courseId>/<name>` */
  id: string;
  topic: string;
  objectives: string[];
  generate(seed: number, lang: Lang): GeneratedExercise;
}

const registry = new Map<string, GeneratorDefinition>();

export function registerGenerator(def: GeneratorDefinition): GeneratorDefinition {
  if (!GENERATOR_RE.test(def.id))
    throw new Error(`id generatore non valido: "${def.id}" (atteso <courseId>/<nome>)`);
  if (!KEBAB_RE.test(def.topic)) throw new Error(`${def.id}: topic non valido "${def.topic}"`);
  if (def.objectives.length === 0) throw new Error(`${def.id}: almeno un obiettivo`);
  for (const o of def.objectives) {
    if (!OBJECTIVE_RE.test(o) || !o.startsWith(`${def.topic}.`))
      throw new Error(`${def.id}: obiettivo "${o}" non appartiene a "${def.topic}"`);
  }
  const existing = registry.get(def.id);
  if (existing && existing !== def) throw new Error(`generatore già registrato: "${def.id}"`);
  registry.set(def.id, def);
  return def;
}

export function getGenerator(id: string): GeneratorDefinition | undefined {
  return registry.get(id);
}

export function listGenerators(courseId?: string): GeneratorDefinition[] {
  const all = [...registry.values()].sort((a, b) => a.id.localeCompare(b.id));
  return courseId ? all.filter((g) => g.id.startsWith(`${courseId}/`)) : all;
}

/** Controlla la forma di un esercizio generato; restituisce l'elenco dei problemi. */
export function validateGenerated(ex: GeneratedExercise): string[] {
  const problems: string[] = [];
  if (!ex.statement?.trim()) problems.push('testo vuoto');
  ex.steps.forEach((s, i) => {
    if (!s.title?.trim() || !s.body?.trim()) problems.push(`passo ${i + 1} incompleto`);
  });
  if (ex.choices) {
    if (ex.choices.length < 2) problems.push('almeno due scelte');
    if (!ex.choices.some((c) => c.correct)) problems.push('nessuna scelta corretta');
  } else if (ex.answer.length === 0) {
    problems.push('nessuna risposta');
  }
  for (const a of ex.answer) {
    if (typeof a.value === 'number' && !Number.isFinite(a.value))
      problems.push(`risposta "${a.label}" non finita`);
    if (a.tol !== undefined && !(a.tol > 0 && a.tol <= 1))
      problems.push(`tolleranza di "${a.label}" fuori intervallo`);
  }
  if (ex.figure) {
    const kinds = [ex.figure.netlist, ex.figure.diagram, ex.figure.svg].filter(Boolean).length;
    if (kinds !== 1) problems.push('figura: una sola tra netlist, diagram e svg');
    if (ex.figure.diagram && !isDiagramType(ex.figure.diagram.type))
      problems.push(`figura: tipo sconosciuto "${ex.figure.diagram.type}"`);
  }
  return problems;
}

/** Esegue un generatore e ne valida l'uscita. */
export function runGenerator(id: string, seed: number, lang: Lang): GeneratedExercise {
  const def = registry.get(id);
  if (!def) throw new Error(`generatore sconosciuto: "${id}"`);
  const ex = def.generate(seed >>> 0, lang);
  const problems = validateGenerated(ex);
  if (problems.length > 0) throw new Error(`${id} (seed ${seed}, ${lang}): ${problems.join('; ')}`);
  return ex;
}

/** Solo per i test. */
export function clearGenerators(): void {
  registry.clear();
}
