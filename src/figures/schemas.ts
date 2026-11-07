/**
 * Parametri delle figure: schemi Zod validati a build-time (componente <Diagram>,
 * collection `exercises`, test sui generatori). I disegnatori in `types/` usano
 * solo i tipi (`import type`), così Zod non entra nei bundle del browser.
 * Guida e valori di default: docs/FIGURE.md.
 */
import { z } from 'astro/zod';
import { DIAGRAM_TYPES, type DiagramType } from './types';

/** Testo di una figura: stringa (uguale nelle due lingue) oppure { it, en }. */
export const FigText = z.union([
  z.string(),
  z.strictObject({ it: z.string().min(1), en: z.string().min(1).optional() }),
]);
const label = z.string().max(24);
const tone = z.enum(['ink', 'muted', 'accent', 'accent2', 'info', 'success', 'warning', 'danger']);
const finite = z.number().refine(Number.isFinite, 'numero finito');
const pos = finite.refine((v) => v > 0, 'valore positivo');
const deg = finite.refine((v) => v >= -360 && v <= 360, 'angolo in gradi tra −360 e 360');

// ------------------------------------------------------------------ meccanica
export const FreeBody = z.strictObject({
  body: z.enum(['block', 'point', 'sphere']).optional(),
  bodyLabel: label.optional(),
  forces: z
    .array(
      z.strictObject({
        label,
        /** Direzione in gradi, 0 = verso destra, antiorario. */
        angle: deg,
        /** Lunghezza relativa (1 = standard). */
        magnitude: finite.refine((v) => v >= 0.1 && v <= 3, 'tra 0,1 e 3').optional(),
        kind: z.enum(['weight', 'normal', 'friction', 'tension', 'applied', 'other']).optional(),
      }),
    )
    .min(1)
    .max(8),
  /** Assi x-y (ruotati di `axesAngle` gradi). */
  axes: z.boolean().optional(),
  axesAngle: deg.optional(),
  ground: z.boolean().optional(),
  acceleration: z.strictObject({ angle: deg, label: label.optional() }).optional(),
});

export const InclinedPlane = z.strictObject({
  angle: finite.refine((v) => v >= 5 && v <= 75, 'angolo tra 5° e 75°'),
  friction: z.boolean().optional(),
  forces: z.boolean().optional(),
  components: z.boolean().optional(),
  motion: z.enum(['up', 'down', 'none']).optional(),
  pulley: z.boolean().optional(),
  massLabel: label.optional(),
  hangingLabel: label.optional(),
  angleLabel: label.optional(),
});

export const SpringMass = z.strictObject({
  orientation: z.enum(['horizontal', 'vertical']).optional(),
  /** Spostamento dalla posizione di equilibrio, in frazioni (−1…1). */
  displacement: finite.refine((v) => v >= -1 && v <= 1, 'tra −1 e 1').optional(),
  equilibrium: z.boolean().optional(),
  force: z.boolean().optional(),
  damper: z.boolean().optional(),
  kLabel: label.optional(),
  massLabel: label.optional(),
  xLabel: label.optional(),
});

export const Pendulum = z.strictObject({
  angle: finite.refine((v) => v >= -80 && v <= 80, 'angolo tra −80° e 80°'),
  forces: z.boolean().optional(),
  components: z.boolean().optional(),
  arc: z.boolean().optional(),
  lengthLabel: label.optional(),
  massLabel: label.optional(),
  angleLabel: label.optional(),
});

export const Projectile = z
  .strictObject({
    v0: pos,
    angle: finite.refine((v) => v >= 0 && v <= 90, 'angolo tra 0° e 90°'),
    h0: finite.refine((v) => v >= 0, 'quota iniziale ≥ 0').optional(),
    g: pos.optional(),
    /** Numero di vettori velocità lungo la traiettoria (0–7). */
    vectors: z.number().int().min(0).max(7).optional(),
    components: z.boolean().optional(),
    apex: z.boolean().optional(),
    range: z.boolean().optional(),
    values: z.boolean().optional(),
  })
  .refine((p) => p.angle > 0 || (p.h0 ?? 0) > 0, 'serve un angolo positivo o una quota iniziale');

export const CircularMotion = z.strictObject({
  angle: deg,
  velocity: z.boolean().optional(),
  centripetal: z.boolean().optional(),
  tangential: z.enum(['none', 'speeding', 'slowing']).optional(),
  direction: z.enum(['ccw', 'cw']).optional(),
  radiusLabel: label.optional(),
  angleLabel: label.optional(),
  showAngle: z.boolean().optional(),
});

export const MotionGraphs = z.strictObject({
  x0: finite.optional(),
  v0: finite.optional(),
  segments: z
    .array(z.strictObject({ duration: pos, a: finite }))
    .min(1)
    .max(8),
  show: z
    .array(z.enum(['x', 'v', 'a']))
    .min(1)
    .optional(),
  values: z.boolean().optional(),
});

const series = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('points'),
    points: z
      .array(z.tuple([finite, finite]))
      .min(2)
      .max(500),
    label: label.optional(),
    tone: tone.optional(),
    dash: z.boolean().optional(),
  }),
  z.strictObject({
    kind: z.literal('poly'),
    /** a0 + a1·x + a2·x² + … */
    coeffs: z.array(finite).min(1).max(8),
    label: label.optional(),
    tone: tone.optional(),
    dash: z.boolean().optional(),
  }),
  z.strictObject({
    kind: z.literal('sin'),
    amp: finite,
    omega: finite.optional(),
    /** Fase in radianti: y = offset + amp·sin(ω x + phase). */
    phase: finite.optional(),
    offset: finite.optional(),
    label: label.optional(),
    tone: tone.optional(),
    dash: z.boolean().optional(),
  }),
  z.strictObject({
    kind: z.literal('exp'),
    /** y = a·e^(b x) + c */
    a: finite,
    b: finite,
    c: finite.optional(),
    label: label.optional(),
    tone: tone.optional(),
    dash: z.boolean().optional(),
  }),
]);

const axisSpec = z.strictObject({
  min: finite.optional(),
  max: finite.optional(),
  label: label.optional(),
  unit: z.string().max(12).optional(),
});

export const FunctionPlot = z
  .strictObject({
    x: axisSpec.extend({ min: finite, max: finite }),
    y: axisSpec.optional(),
    series: z.array(series).min(1).max(6),
    markers: z
      .array(z.strictObject({ x: finite, y: finite, label: label.optional() }))
      .max(12)
      .optional(),
    vlines: z
      .array(z.strictObject({ x: finite, label: label.optional() }))
      .max(6)
      .optional(),
    hlines: z
      .array(z.strictObject({ y: finite, label: label.optional() }))
      .max(6)
      .optional(),
    /** Area sotto la curva `series` tra `from` e `to` (lavoro, impulso, spazio percorso…). */
    area: z
      .strictObject({ series: z.number().int().min(0), from: finite, to: finite, label: label.optional() })
      .optional(),
    grid: z.boolean().optional(),
  })
  .refine((p) => p.x.max > p.x.min, 'x.max deve superare x.min')
  .refine((p) => !p.area || p.area.series < p.series.length, 'area.series fuori elenco');

const collisionBody = z.strictObject({
  label,
  mass: label.optional(),
  v: finite,
  /** Direzione in gradi (urti nel piano); assente = moto lungo x con il segno di v. */
  angle: deg.optional(),
});
export const Collision = z.strictObject({
  before: z.array(collisionBody).min(1).max(3),
  after: z.array(collisionBody).min(1).max(3),
  values: z.boolean().optional(),
  unit: z.string().max(8).optional(),
});

// ------------------------------------------------------------- termodinamica
export const PvCycle = z
  .strictObject({
    states: z
      .array(z.strictObject({ id: z.string().min(1).max(4), p: pos, V: pos }))
      .min(2)
      .max(8),
    processes: z
      .array(
        z.strictObject({
          from: z.string(),
          to: z.string(),
          kind: z.enum(['isothermal', 'adiabatic', 'isochoric', 'isobaric', 'linear']),
        }),
      )
      .min(1)
      .max(8),
    gamma: finite.refine((v) => v > 1 && v < 2, 'γ tra 1 e 2').optional(),
    work: z.boolean().optional(),
    isotherms: z.boolean().optional(),
    units: z.strictObject({ p: z.string().max(8), V: z.string().max(8) }).optional(),
    values: z.boolean().optional(),
  })
  .superRefine((p, ctx) => {
    const ids = new Map(p.states.map((s) => [s.id, s]));
    if (ids.size !== p.states.length)
      ctx.addIssue({ code: 'custom', path: ['states'], message: 'id degli stati ripetuti' });
    const g = p.gamma ?? 1.4;
    p.processes.forEach((pr, i) => {
      const a = ids.get(pr.from);
      const b = ids.get(pr.to);
      if (!a || !b) {
        ctx.addIssue({
          code: 'custom',
          path: ['processes', i],
          message: `stato sconosciuto (${pr.from} → ${pr.to})`,
        });
        return;
      }
      const close = (x: number, y: number): boolean =>
        Math.abs(x - y) <= 0.02 * Math.max(Math.abs(x), Math.abs(y));
      const ok =
        pr.kind === 'isochoric'
          ? close(a.V, b.V)
          : pr.kind === 'isobaric'
            ? close(a.p, b.p)
            : pr.kind === 'isothermal'
              ? close(a.p * a.V, b.p * b.V)
              : pr.kind === 'adiabatic'
                ? close(a.p * a.V ** g, b.p * b.V ** g)
                : true;
      if (!ok)
        ctx.addIssue({
          code: 'custom',
          path: ['processes', i],
          message: `stati ${pr.from} e ${pr.to} incompatibili con una trasformazione ${pr.kind}`,
        });
    });
  });

// -------------------------------------------------------- elettromagnetismo
export const PointCharges = z.strictObject({
  charges: z
    .array(
      z.strictObject({
        x: finite,
        y: finite,
        q: finite.refine((v) => v !== 0 && Math.abs(v) <= 5, 'carica non nulla, |q| ≤ 5'),
        label: label.optional(),
      }),
    )
    .min(1)
    .max(6),
  bounds: z.strictObject({ xMin: finite, xMax: finite, yMin: finite, yMax: finite }).optional(),
  /** Linee di campo per unità di carica (0 = nessuna). */
  lines: z.number().int().min(0).max(24).optional(),
  /** Numero di equipotenziali per segno (0 = nessuna). */
  equipotentials: z.number().int().min(0).max(10).optional(),
  testPoint: z.strictObject({ x: finite, y: finite, label: label.optional() }).optional(),
});

export const Capacitor = z.strictObject({
  geometry: z.enum(['parallel', 'spherical', 'cylindrical']),
  field: z.boolean().optional(),
  charges: z.boolean().optional(),
  dielectric: z.enum(['none', 'full', 'half']).optional(),
  fringe: z.boolean().optional(),
  dLabel: label.optional(),
  areaLabel: label.optional(),
  innerLabel: label.optional(),
  outerLabel: label.optional(),
  voltageLabel: label.optional(),
});

export const MagneticField = z.strictObject({
  source: z.enum(['wire', 'wire-section', 'loop', 'solenoid']),
  /** Verso della corrente: `positive` = verso l'alto (filo), uscente (sezione), antiorario visto da destra (spira). */
  current: z.enum(['positive', 'negative']).optional(),
  rightHand: z.boolean().optional(),
  turns: z.number().int().min(3).max(14).optional(),
  fieldLines: z.boolean().optional(),
  currentLabel: label.optional(),
  fieldLabel: label.optional(),
});

// ---------------------------------------------------------------------- onde
export const Wave = z.strictObject({
  kind: z.enum(['traveling', 'standing']),
  /** Lunghezze d'onda mostrate (onda progressiva). */
  wavelengths: finite.refine((v) => v >= 0.5 && v <= 5, 'tra 0,5 e 5').optional(),
  /** Armonica (onda stazionaria). */
  harmonic: z.number().int().min(1).max(8).optional(),
  boundary: z.enum(['fixed-fixed', 'fixed-free', 'free-free']).optional(),
  /** Istantanee sovrapposte dell'onda stazionaria. */
  snapshots: z.number().int().min(1).max(5).optional(),
  direction: z.enum(['right', 'left']).optional(),
  lambda: z.boolean().optional(),
  amplitude: z.boolean().optional(),
  nodes: z.boolean().optional(),
});

// ------------------------------------------------------------------ vettori
export const Vectors = z
  .strictObject({
    range: z.strictObject({ xMin: finite, xMax: finite, yMin: finite, yMax: finite }).optional(),
    grid: z.boolean().optional(),
    axes: z.boolean().optional(),
    axisLabels: z.tuple([label, label]).optional(),
    vectors: z
      .array(
        z.strictObject({
          id: z.string().max(12).optional(),
          label: label.optional(),
          x: finite.optional(),
          y: finite.optional(),
          dx: finite,
          dy: finite,
          /** Parte dalla punta del vettore con questo id (metodo punta-coda). */
          from: z.string().max(12).optional(),
          tone: tone.optional(),
          components: z.boolean().optional(),
          dashed: z.boolean().optional(),
        }),
      )
      .max(8),
    sum: z
      .strictObject({
        of: z.array(z.string()).min(2).max(6),
        label: label.optional(),
        parallelogram: z.boolean().optional(),
      })
      .optional(),
    frames: z
      .array(
        z.strictObject({
          x: finite,
          y: finite,
          angle: deg.optional(),
          length: pos.optional(),
          labels: z.tuple([label, label]).optional(),
          origin: label.optional(),
        }),
      )
      .max(3)
      .optional(),
  })
  .superRefine((p, ctx) => {
    const ids = new Set(p.vectors.map((v) => v.id).filter(Boolean));
    p.vectors.forEach((v, i) => {
      if (v.from && !ids.has(v.from))
        ctx.addIssue({
          code: 'custom',
          path: ['vectors', i, 'from'],
          message: `vettore "${v.from}" inesistente`,
        });
    });
    p.sum?.of.forEach((id, i) => {
      if (!ids.has(id))
        ctx.addIssue({ code: 'custom', path: ['sum', 'of', i], message: `vettore "${id}" inesistente` });
    });
    if (p.vectors.length === 0 && !p.frames?.length)
      ctx.addIssue({
        code: 'custom',
        path: ['vectors'],
        message: 'almeno un vettore o un sistema di riferimento',
      });
  });

// -------------------------------------------------------------- informatica
const nodeId = z.string().regex(/^[A-Za-z0-9_-]{1,24}$/, 'id: lettere, cifre, - e _');

export const Flowchart = z
  .strictObject({
    nodes: z
      .array(
        z.strictObject({
          id: nodeId,
          kind: z.enum(['start', 'end', 'process', 'decision', 'io', 'call']),
          text: FigText,
        }),
      )
      .min(1)
      .max(24),
    edges: z.array(z.strictObject({ from: nodeId, to: nodeId, label: FigText.optional() })).max(40),
  })
  .superRefine((p, ctx) => checkGraph(p.nodes, p.edges, ctx));

export const BlockDiagram = z
  .strictObject({
    blocks: z
      .array(
        z.strictObject({
          id: nodeId,
          text: FigText,
          col: z.number().int().min(0).max(8),
          row: z.number().int().min(0).max(8),
          span: z.number().int().min(1).max(4).optional(),
          emphasis: z.boolean().optional(),
        }),
      )
      .min(1)
      .max(24),
    links: z
      .array(
        z.strictObject({ from: nodeId, to: nodeId, label: FigText.optional(), both: z.boolean().optional() }),
      )
      .max(40),
  })
  .superRefine((p, ctx) => checkGraph(p.blocks, p.links, ctx));

function checkGraph(
  nodes: Array<{ id: string }>,
  edges: Array<{ from: string; to: string }>,
  ctx: z.RefinementCtx,
): void {
  const ids = new Set(nodes.map((n) => n.id));
  if (ids.size !== nodes.length) ctx.addIssue({ code: 'custom', path: ['nodes'], message: 'id ripetuti' });
  edges.forEach((e, i) => {
    for (const k of ['from', 'to'] as const)
      if (!ids.has(e[k]))
        ctx.addIssue({ code: 'custom', path: ['edges', i, k], message: `nodo "${e[k]}" inesistente` });
  });
}

export const Memory = z.strictObject({
  kind: z.enum(['array', 'memory', 'stack', 'queue']),
  title: FigText.optional(),
  cells: z
    .array(
      z.strictObject({
        value: z.string().max(16),
        label: z.string().max(12).optional(),
        highlight: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(24),
  orientation: z.enum(['horizontal', 'vertical']).optional(),
  indices: z.boolean().optional(),
  pointers: z
    .array(z.strictObject({ label: z.string().max(12), index: z.number().int().min(0) }))
    .max(6)
    .optional(),
});

export const LinkedList = z.strictObject({
  nodes: z.array(z.strictObject({ value: z.string().max(10), highlight: z.boolean().optional() })).max(10),
  doubly: z.boolean().optional(),
  circular: z.boolean().optional(),
  head: z.string().max(12).optional(),
  tail: z.string().max(12).optional(),
  nullLabel: z.string().max(8).optional(),
});

export interface TreeNodeInput {
  value: string;
  highlight?: boolean | undefined;
  children?: Array<TreeNodeInput | null> | undefined;
}
const TreeNode: z.ZodType<TreeNodeInput, TreeNodeInput> = z.lazy(() =>
  z.strictObject({
    value: z.string().max(8),
    highlight: z.boolean().optional(),
    children: z.array(TreeNode.nullable()).max(4).optional(),
  }),
);
export const Tree = z.strictObject({ root: TreeNode, binary: z.boolean().optional() }).refine((p) => {
  let n = 0;
  const walk = (t: TreeNodeInput | null): void => {
    if (!t) return;
    n++;
    t.children?.forEach(walk);
  };
  walk(p.root);
  return n <= 40;
}, 'al massimo 40 nodi');

const bit = z.union([z.literal(0), z.literal(1), z.literal('x'), z.literal('-')]);
export const TruthTable = z
  .strictObject({
    inputs: z.array(z.string().min(1).max(6)).min(1).max(5),
    outputs: z
      .array(z.strictObject({ label: z.string().min(1).max(10), values: z.array(bit) }))
      .min(1)
      .max(4),
    highlight: z.array(z.number().int().min(0)).optional(),
  })
  .superRefine((p, ctx) => {
    const rows = 2 ** p.inputs.length;
    p.outputs.forEach((o, i) => {
      if (o.values.length !== rows)
        ctx.addIssue({ code: 'custom', path: ['outputs', i, 'values'], message: `servono ${rows} valori` });
    });
  });

// ---------------------------------------------------------------- registro
export const DIAGRAM_SCHEMAS = {
  'free-body': FreeBody,
  'inclined-plane': InclinedPlane,
  'spring-mass': SpringMass,
  pendulum: Pendulum,
  projectile: Projectile,
  'circular-motion': CircularMotion,
  'motion-graphs': MotionGraphs,
  'function-plot': FunctionPlot,
  collision: Collision,
  'pv-cycle': PvCycle,
  'point-charges': PointCharges,
  capacitor: Capacitor,
  'magnetic-field': MagneticField,
  wave: Wave,
  vectors: Vectors,
  flowchart: Flowchart,
  'block-diagram': BlockDiagram,
  memory: Memory,
  'linked-list': LinkedList,
  tree: Tree,
  'truth-table': TruthTable,
} satisfies Record<DiagramType, z.ZodType>;

export type DiagramParams = { [K in DiagramType]: z.input<(typeof DIAGRAM_SCHEMAS)[K]> };
export type DiagramSpec = { [K in DiagramType]: { type: K; params: DiagramParams[K] } }[DiagramType];

/** Schema di `{ type, params }` (figure degli esercizi). */
export const DiagramSpecSchema = z
  .strictObject({ type: z.enum(DIAGRAM_TYPES), params: z.unknown() })
  .superRefine((d, ctx) => {
    const r = DIAGRAM_SCHEMAS[d.type].safeParse(d.params);
    if (!r.success)
      for (const issue of r.error.issues)
        ctx.addIssue({
          code: 'custom',
          path: ['params', ...issue.path.map((k) => (typeof k === 'symbol' ? String(k) : k))],
          message: issue.message,
        });
  });

/** Valida i parametri di una figura; l'errore indica tipo e campo sbagliato. */
export function parseDiagram<K extends DiagramType>(type: K, params: unknown): DiagramParams[K] {
  const schema = DIAGRAM_SCHEMAS[type] as z.ZodType;
  if (!schema) throw new Error(`figura sconosciuta: "${type}" (tipi: ${DIAGRAM_TYPES.join(', ')})`);
  const r = schema.safeParse(params);
  if (!r.success) {
    const msg = r.error.issues.map((i) => `${i.path.join('.') || '(radice)'}: ${i.message}`).join('; ');
    throw new Error(`figura "${type}": parametri non validi — ${msg}`);
  }
  return params as DiagramParams[K];
}
