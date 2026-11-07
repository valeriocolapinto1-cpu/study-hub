/**
 * Registro sincrono delle figure: `renderDiagram(type, params, opts)` → SVG.
 * Usato a build-time (componente <Diagram>, dati degli esercizi). Nel browser
 * usare `renderDiagramAsync` di `./lazy`, che carica solo il gruppo necessario.
 * I parametri non sono validati qui (niente Zod): la validazione è in `schemas.ts`.
 */
import { finish, makeCtx, type Ctx, type Drawn, type FigureResult, type RenderOptions } from './core';
import type { DiagramParams } from './schemas';
import type { DiagramType } from './types';
import {
  collision,
  circularMotion,
  freeBody,
  inclinedPlane,
  pendulum,
  projectile,
  springMass,
} from './types/mechanics';
import { functionPlot, motionGraphs } from './types/plots';
import { heatEngine, pvCycle } from './types/thermo';
import { scene } from './types/scene';
import { capacitor, magneticField, pointCharges } from './types/em';
import { chargeDistribution, induction, uniformField } from './types/fields';
import { polarizers, refraction, slits } from './types/optics';
import { vectors, wave } from './types/waves';
import { blockDiagram, flowchart, linkedList, memory, tree, truthTable } from './types/cs';

export type Renderer<K extends DiagramType> = (p: DiagramParams[K], c: Ctx) => Drawn;

export const RENDERERS: { [K in DiagramType]: Renderer<K> } = {
  'free-body': freeBody,
  'inclined-plane': inclinedPlane,
  'spring-mass': springMass,
  pendulum,
  projectile,
  'circular-motion': circularMotion,
  'motion-graphs': motionGraphs,
  'function-plot': functionPlot,
  collision,
  'pv-cycle': pvCycle,
  'point-charges': pointCharges,
  capacitor,
  'magnetic-field': magneticField,
  'charge-distribution': chargeDistribution,
  'uniform-field': uniformField,
  induction,
  wave,
  refraction,
  slits,
  polarizers,
  vectors,
  flowchart,
  'block-diagram': blockDiagram,
  memory,
  'linked-list': linkedList,
  tree,
  'truth-table': truthTable,
  scene,
  'heat-engine': heatEngine,
};

export function renderDiagram<K extends DiagramType>(
  type: K,
  params: DiagramParams[K],
  opts: RenderOptions = {},
): FigureResult {
  const r = RENDERERS[type] as Renderer<K> | undefined;
  if (!r) throw new Error(`figura sconosciuta: "${type}"`);
  return finish(type, params, r(params, makeCtx(opts.lang ?? 'it')), opts);
}
