/**
 * Rendering delle figure nel browser con import dinamico per gruppo: una pagina
 * carica il codice di una figura solo quando serve (es. «Nuova variante» di un
 * esercizio generato). Stessa uscita di `renderDiagram`.
 */
import { finish, makeCtx, type Ctx, type Drawn, type FigureResult, type RenderOptions } from './core';
import type { DiagramType } from './types';

type AnyRenderer = (p: never, c: Ctx) => Drawn;
type Loader = () => Promise<Record<string, unknown>>;

const GROUP: Record<DiagramType, [Loader, string]> = {
  'free-body': [() => import('./types/mechanics'), 'freeBody'],
  'inclined-plane': [() => import('./types/mechanics'), 'inclinedPlane'],
  'spring-mass': [() => import('./types/mechanics'), 'springMass'],
  pendulum: [() => import('./types/mechanics'), 'pendulum'],
  projectile: [() => import('./types/mechanics'), 'projectile'],
  'circular-motion': [() => import('./types/mechanics'), 'circularMotion'],
  collision: [() => import('./types/mechanics'), 'collision'],
  'motion-graphs': [() => import('./types/plots'), 'motionGraphs'],
  'function-plot': [() => import('./types/plots'), 'functionPlot'],
  'pv-cycle': [() => import('./types/thermo'), 'pvCycle'],
  'point-charges': [() => import('./types/em'), 'pointCharges'],
  capacitor: [() => import('./types/em'), 'capacitor'],
  'magnetic-field': [() => import('./types/em'), 'magneticField'],
  'charge-distribution': [() => import('./types/fields'), 'chargeDistribution'],
  'uniform-field': [() => import('./types/fields'), 'uniformField'],
  induction: [() => import('./types/fields'), 'induction'],
  wave: [() => import('./types/waves'), 'wave'],
  refraction: [() => import('./types/optics'), 'refraction'],
  slits: [() => import('./types/optics'), 'slits'],
  polarizers: [() => import('./types/optics'), 'polarizers'],
  vectors: [() => import('./types/waves'), 'vectors'],
  flowchart: [() => import('./types/cs'), 'flowchart'],
  'block-diagram': [() => import('./types/cs'), 'blockDiagram'],
  memory: [() => import('./types/cs'), 'memory'],
  'linked-list': [() => import('./types/cs'), 'linkedList'],
  tree: [() => import('./types/cs'), 'tree'],
  'truth-table': [() => import('./types/cs'), 'truthTable'],
  bode: [() => import('./types/signals'), 'bode'],
  'pole-zero': [() => import('./types/signals'), 'poleZero'],
  timing: [() => import('./types/signals'), 'timing'],
  karnaugh: [() => import('./types/structures'), 'karnaugh'],
  bitfield: [() => import('./types/structures'), 'bitfield'],
  pipeline: [() => import('./types/structures'), 'pipeline'],
  graph: [() => import('./types/structures'), 'graph'],
};

export async function renderDiagramAsync(
  type: string,
  params: unknown,
  opts: RenderOptions = {},
): Promise<FigureResult> {
  const g = GROUP[type as DiagramType];
  if (!g) throw new Error(`figura sconosciuta: "${type}"`);
  const mod = await g[0]();
  const r = mod[g[1]] as AnyRenderer;
  return finish(type, params, r(params as never, makeCtx(opts.lang ?? 'it')), opts);
}
