/** Elenco dei tipi di figura (senza Zod: lo usano anche il registro dei generatori e il browser). */
export const DIAGRAM_TYPES = [
  'free-body',
  'inclined-plane',
  'spring-mass',
  'pendulum',
  'projectile',
  'circular-motion',
  'motion-graphs',
  'function-plot',
  'collision',
  'pv-cycle',
  'point-charges',
  'capacitor',
  'magnetic-field',
  'wave',
  'vectors',
  'flowchart',
  'block-diagram',
  'memory',
  'linked-list',
  'tree',
  'truth-table',
] as const;

export type DiagramType = (typeof DIAGRAM_TYPES)[number];

export const isDiagramType = (t: string): t is DiagramType =>
  (DIAGRAM_TYPES as readonly string[]).includes(t);
