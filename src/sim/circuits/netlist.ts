/**
 * Formato dati dei circuiti lineari (netlist).
 *
 * Un'unica descrizione alimenta il risolutore (mna.ts), lo schema SVG
 * (schematic.ts) e la descrizione testuale per i lettori di schermo: figura e
 * calcolo non possono divergere. Lo schema Zod è esportato perché le content
 * collections (esercizi, `figure.netlist`) lo validino a build-time.
 *
 * Convenzioni:
 *  - nodi: stringhe; la massa è "0" (alias accettati: "gnd", "GND", "massa");
 *  - valori: numeri in unità SI oppure stringhe con prefisso ("4.7k", "10u", "2,2m");
 *  - bipoli: morsetti `a` e `b`; tensione v = v(a) − v(b), corrente i da a verso b
 *    attraverso l'elemento (convenzione degli utilizzatori: i entra dal morsetto +);
 *  - generatori di corrente (I, G, F): la corrente scorre da a verso b dentro il
 *    generatore, cioè esce dal morsetto b (come in SPICE);
 *  - fasori: modulo = ampiezza di picco (default) oppure valore efficace
 *    (`phasor: "rms"`), fase in gradi.
 * La guida completa con esempi è in docs/SIM.md.
 */
import { z } from 'astro/zod';
import { parseSI } from '../units';

import * as M from './model';
import {
  GROUND,
  normNode,
  nodesOf,
  type Netlist as ModelNetlist,
  type Element as ModelElement,
} from './model';
export * from './model';

const Node = z.union([z.string().min(1), z.number().int().nonnegative()]).transform((n) => normNode(n));

/** Valore numerico: numero SI o stringa con prefisso ("4.7k", "100n", "1meg"). */
export const Value = z.union([z.number(), z.string()]).transform((v, ctx) => {
  try {
    const x = parseSI(v);
    if (!Number.isFinite(x)) throw new Error('non finito');
    return x;
  } catch {
    ctx.addIssue({ code: 'custom', message: `valore non valido: ${String(v)}` });
    return z.NEVER;
  }
});
const Positive = Value.refine((x) => x > 0, 'deve essere positivo');
const NonZero = Value.refine((x) => x !== 0, 'non può essere zero');

const Id = z.string().regex(/^[A-Za-z][A-Za-z0-9_']*$/, 'id: lettera seguita da lettere, cifre, _ o apice');

/** Posizione su griglia (unità di griglia, non pixel). x verso destra, y verso il basso. */
export const GridPoint = z.object({ x: z.number(), y: z.number() });

export const Dir = z.enum(['right', 'left', 'up', 'down']);

/**
 * Suggerimento di layout per un elemento: dove sta il morsetto di riferimento
 * (il morsetto `a` per i bipoli) e verso quale direzione va il corpo.
 */
export const Placement = GridPoint.extend({
  dir: Dir.optional(),
  /** Lunghezza in unità di griglia (bipoli; default 4). */
  len: z.number().positive().optional(),
  /** Lato dell'etichetta rispetto al corpo. */
  label: z.enum(['auto', 'left', 'right', 'above', 'below']).optional(),
  /** Specchia gli elementi a più morsetti (es. op-amp con + in alto). */
  flip: z.boolean().optional(),
});

/** Cosa mostrare sullo schema accanto all'elemento. */
const Show = z
  .object({
    /** Nome dell'elemento (default true). */
    name: z.boolean().optional(),
    /** Valore (default true). */
    value: z.boolean().optional(),
    /** Segni + e − della tensione: true usa "v_<id>", una stringa è l'etichetta. */
    v: z.union([z.boolean(), z.string()]).optional(),
    /** Freccia della corrente (verso a→b): true usa "i_<id>", una stringa è l'etichetta. */
    i: z.union([z.boolean(), z.string()]).optional(),
  })
  .optional();

const base = {
  id: Id,
  /** Etichetta del valore al posto di quella generata (es. "R", "2R", "Z_L"). */
  label: z.string().optional(),
  show: Show,
  at: Placement.optional(),
};

// ---------------------------------------------------------------- forme d'onda

/** Forma d'onda nel dominio del tempo dei generatori indipendenti (analisi transitoria). */
export const Wave = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('dc'), value: Value }),
  z.object({
    kind: z.literal('sin'),
    offset: Value.default(0),
    amp: Value,
    /** Pulsazione ω [rad/s] o frequenza f [Hz]: almeno una. */
    omega: Value.optional(),
    freq: Value.optional(),
    /** Fase in gradi: x(t) = offset + amp·cos(ωt + fase). */
    phase: z.number().default(0),
  }),
  z.object({
    kind: z.literal('step'),
    /** Valore per t < at. */
    before: Value.default(0),
    /** Valore per t ≥ at. */
    after: Value,
    at: Value.default(0),
  }),
  z.object({
    kind: z.literal('pulse'),
    low: Value.default(0),
    high: Value,
    delay: Value.default(0),
    rise: Value.default(0),
    fall: Value.default(0),
    width: Value,
    period: Value.optional(),
  }),
  z.object({
    kind: z.literal('pwl'),
    /** Punti [t, valore] con t crescente; costante prima del primo e dopo l'ultimo. */
    points: z.array(z.tuple([z.number(), z.number()])).min(1),
  }),
]);

/** Fasore: numero (fase 0) oppure { mag, phase } con fase in gradi. */
export const PhasorSpec = z.union([
  Value.transform((mag) => ({ mag, phase: 0 })),
  z.object({ mag: Value, phase: z.number().default(0) }),
]);

const sourceFields = {
  /** Componente continua (analisi DC). */
  dc: Value.optional(),
  /** Fasore (analisi in regime sinusoidale alla pulsazione del circuito). */
  ac: PhasorSpec.optional(),
  /**
   * Forma d'onda nel tempo. Se assente: dc + |ac|·cos(ωt + fase) con la ω del
   * circuito (e per t < 0 lo stesso regime).
   */
  wave: Wave.optional(),
};

// ---------------------------------------------------------------- elementi

const two = { a: Node, b: Node };

export const Resistor = z.object({ type: z.literal('R'), ...base, ...two, value: NonZero });
export const Capacitor = z.object({
  type: z.literal('C'),
  ...base,
  ...two,
  value: Positive,
  /** Condizione iniziale v(0) (usata con `initial: "ic"`). */
  v0: Value.optional(),
});
export const Inductor = z.object({
  type: z.literal('L'),
  ...base,
  ...two,
  value: Positive,
  /** Condizione iniziale i(0) (usata con `initial: "ic"`). */
  i0: Value.optional(),
});
export const VSource = z.object({ type: z.literal('V'), ...base, ...two, ...sourceFields });
export const ISource = z.object({ type: z.literal('I'), ...base, ...two, ...sourceFields });

/** Generatore di tensione pilotato in tensione: v(a,b) = gain · v(cp,cn). */
export const VCVS = z.object({ type: z.literal('E'), ...base, ...two, cp: Node, cn: Node, gain: Value });
/** Generatore di corrente pilotato in tensione: i(a→b) = gain · v(cp,cn) [S]. */
export const VCCS = z.object({ type: z.literal('G'), ...base, ...two, cp: Node, cn: Node, gain: Value });
/** Generatore di tensione pilotato in corrente: v(a,b) = gain · i(ctrl) [Ω]. */
export const CCVS = z.object({ type: z.literal('H'), ...base, ...two, ctrl: Id, gain: Value });
/** Generatore di corrente pilotato in corrente: i(a→b) = gain · i(ctrl). */
export const CCCS = z.object({ type: z.literal('F'), ...base, ...two, ctrl: Id, gain: Value });

/** Interruttore ideale: stato iniziale e (facoltativo) istante di commutazione. */
export const Switch = z.object({
  type: z.literal('SW'),
  ...base,
  ...two,
  /** Stato per t < toggleAt (e nelle analisi statiche, salvo opzione `t`). */
  closed: z.boolean(),
  /** Istante in cui l'interruttore cambia stato. */
  toggleAt: Value.optional(),
});

/** Amperometro ideale (cortocircuito che misura la corrente da a verso b). */
export const Ammeter = z.object({ type: z.literal('AM'), ...base, ...two });
/** Voltmetro ideale (circuito aperto che misura v(a) − v(b)). */
export const Voltmeter = z.object({ type: z.literal('VM'), ...base, ...two });

/** Accoppiamento magnetico tra due induttori; i pallini sono sui morsetti `a`. */
export const Coupling = z
  .object({
    type: z.literal('K'),
    ...base,
    l1: Id,
    l2: Id,
    /** Coefficiente di accoppiamento, |k| ≤ 1 … */
    k: z.number().min(-1).max(1).optional(),
    /** … oppure mutua induttanza M [H]. */
    m: Value.optional(),
  })
  .refine((e) => (e.k === undefined) !== (e.m === undefined), 'specificare k oppure m (uno solo)');

/** Trasformatore ideale n:1 — v1 = n·v2, i1 = −i2/n (utilizzatori su entrambe le porte). */
export const Transformer = z.object({
  type: z.literal('T'),
  ...base,
  p1a: Node,
  p1b: Node,
  p2a: Node,
  p2b: Node,
  n: NonZero,
});

/**
 * Amplificatore operazionale ideale (uscita riferita a massa): v+ = v−,
 * correnti d'ingresso nulle. Con `gain` finito diventa vout = gain·(v+ − v−).
 */
export const OpAmp = z.object({
  type: z.literal('OA'),
  ...base,
  plus: Node,
  minus: Node,
  out: Node,
  gain: Value.optional(),
});

/** Nullore: nullatore tra na–nb (v = 0, i = 0), noratore tra ra–rb. */
export const Nullor = z.object({ type: z.literal('N'), ...base, na: Node, nb: Node, ra: Node, rb: Node });

const Matrix2 = z.tuple([z.tuple([z.number(), z.number()]), z.tuple([z.number(), z.number()])]);
/**
 * Doppio bipolo descritto da una matrice 2×2 (correnti entranti nei morsetti
 * `p1a`, `p2a`). Z: v = Z i; Y: i = Y v; H: [v1; i2] = H [i1; v2];
 * ABCD: [v1; i1] = T [v2; −i2].
 */
export const TwoPort = z.object({
  type: z.literal('P'),
  ...base,
  p1a: Node,
  p1b: Node,
  p2a: Node,
  p2b: Node,
  kind: z.enum(['Z', 'Y', 'H', 'ABCD']),
  m: Matrix2,
});

export const Element = z.union([
  Resistor,
  Capacitor,
  Inductor,
  VSource,
  ISource,
  VCVS,
  VCCS,
  CCVS,
  CCCS,
  Switch,
  Ammeter,
  Voltmeter,
  Coupling,
  Transformer,
  OpAmp,
  Nullor,
  TwoPort,
]);

/** Porta: coppia di nodi con nome (Thévenin, funzioni di trasferimento, figure). */
export const Port = z.object({
  id: Id,
  plus: Node,
  minus: Node.default(GROUND),
  label: z.string().optional(),
});

/** Grandezza da evidenziare sullo schema (tensione tra due nodi o corrente di un elemento). */
export const Probe = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('v'), plus: Node, minus: Node.default(GROUND), label: z.string() }),
  z.object({ kind: z.literal('i'), element: Id, label: z.string() }),
]);

/** Percorso esplicito di un filo (punti di griglia) che collega morsetti dello stesso nodo. */
export const Wire = z.object({ node: Node, points: z.array(z.tuple([z.number(), z.number()])).min(2) });

export const Layout = z
  .object({
    /**
     * auto: disposizione a binari (massa in basso, generatori a sinistra,
     * elementi in serie in alto, derivazioni verticali, retroazioni sopra);
     * bridge: ponte (Wheatstone) con i due rami verticali;
     * manual: tutte le posizioni dagli `at` degli elementi.
     * Default: manual se ogni elemento ha `at`, altrimenti auto.
     */
    mode: z.enum(['auto', 'bridge', 'manual']).optional(),
    /** Massa come binario comune con un solo simbolo (default) o simbolo su ogni morsetto. */
    ground: z.enum(['rail', 'symbols']).default('rail'),
    /** Ordine preferito dei nodi da sinistra a destra (layout auto). */
    order: z.array(Node).optional(),
    /** Fili tracciati a mano (sostituiscono l'instradamento automatico di quel nodo). */
    wires: z.array(Wire).optional(),
  })
  .default({ ground: 'rail' });

export const NetlistBase = z.object({
  title: z.string().optional(),
  /** Descrizione per i lettori di schermo al posto di quella generata. */
  description: z.string().optional(),
  /** Pulsazione ω [rad/s] dell'analisi in regime sinusoidale… */
  omega: Value.optional(),
  /** … oppure frequenza f [Hz]. */
  freq: Value.optional(),
  /** Convenzione dei fasori: ampiezza di picco (default) o valore efficace. */
  phasor: z.enum(['peak', 'rms']).default('peak'),
  elements: z.array(Element).min(1),
  nodes: z
    .record(z.string(), z.object({ label: z.string().optional(), at: GridPoint.optional() }))
    .optional(),
  ports: z.array(Port).optional(),
  probes: z.array(Probe).optional(),
  layout: Layout,
});

/** Elementi che possono fare da controllo per H/F e da riferimento per K. */
const BRANCH_TYPES = new Set<M.ElementType>(['R', 'C', 'L', 'V', 'I', 'E', 'G', 'H', 'F', 'SW', 'AM']);

/** Schema completo, con i controlli semantici (id unici, riferimenti esistenti). */
export const Netlist = NetlistBase.superRefine((n, ctx) => {
  const ids = new Map<string, z.output<typeof Element>>();
  n.elements.forEach((e, i) => {
    if (ids.has(e.id))
      ctx.addIssue({ code: 'custom', path: ['elements', i, 'id'], message: `id duplicato: ${e.id}` });
    ids.set(e.id, e);
  });
  n.elements.forEach((e, i) => {
    if (e.type === 'H' || e.type === 'F') {
      const c = ids.get(e.ctrl);
      if (!c)
        ctx.addIssue({
          code: 'custom',
          path: ['elements', i, 'ctrl'],
          message: `${e.id}: elemento di controllo inesistente ${e.ctrl}`,
        });
      else if (!BRANCH_TYPES.has(c.type))
        ctx.addIssue({
          code: 'custom',
          path: ['elements', i, 'ctrl'],
          message: `${e.id}: ${e.ctrl} non è un bipolo con una corrente di ramo`,
        });
    }
    if (e.type === 'K') {
      for (const key of ['l1', 'l2'] as const) {
        const l = ids.get(e[key]);
        if (!l || l.type !== 'L')
          ctx.addIssue({
            code: 'custom',
            path: ['elements', i, key],
            message: `${e.id}: ${e[key]} non è un induttore`,
          });
      }
      if (e.l1 === e.l2)
        ctx.addIssue({
          code: 'custom',
          path: ['elements', i],
          message: `${e.id}: accoppiamento di un induttore con sé stesso`,
        });
    }
    if (
      (e.type === 'V' || e.type === 'I') &&
      e.wave?.kind === 'sin' &&
      e.wave.omega === undefined &&
      e.wave.freq === undefined &&
      n.omega === undefined &&
      n.freq === undefined
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['elements', i, 'wave'],
        message: `${e.id}: sinusoide senza pulsazione`,
      });
    }
  });
  const nodes = new Set(nodesOf(n));
  if (!nodes.has(GROUND))
    ctx.addIssue({ code: 'custom', path: ['elements'], message: 'manca il nodo di massa "0"' });
  for (const p of n.ports ?? [])
    for (const nd of [p.plus, p.minus])
      if (!nodes.has(nd))
        ctx.addIssue({ code: 'custom', path: ['ports'], message: `porta ${p.id}: nodo inesistente ${nd}` });
  for (const p of n.probes ?? []) {
    if (p.kind === 'v') {
      for (const nd of [p.plus, p.minus])
        if (!nodes.has(nd))
          ctx.addIssue({
            code: 'custom',
            path: ['probes'],
            message: `sonda ${p.label}: nodo inesistente ${nd}`,
          });
    } else if (!ids.has(p.element))
      ctx.addIssue({
        code: 'custom',
        path: ['probes'],
        message: `sonda ${p.label}: elemento inesistente ${p.element}`,
      });
  }
});

/** Netlist come la si scrive (valori anche come stringhe con prefisso). */
export type NetlistInput = z.input<typeof Netlist>;
export type ElementInput = z.input<typeof Element>;

/** Valida e normalizza; lancia un errore leggibile se la netlist non è valida. */
export function parseNetlist(input: NetlistInput | ModelNetlist): ModelNetlist {
  const r = Netlist.safeParse(input);
  if (!r.success) {
    const msg = r.error.issues.map((i) => `${i.path.join('.') || '(radice)'}: ${i.message}`).join('\n');
    throw new Error(`Netlist non valida:\n${msg}`);
  }
  return r.data;
}

// Controllo a compilazione: l'uscita dello schema è assegnabile al modello usato dal risolutore.
type Assert<T extends true> = T;
export type _SchemaMatchesModel = Assert<z.output<typeof Netlist> extends ModelNetlist ? true : false>;
export type _ElementMatchesModel = Assert<z.output<typeof Element> extends ModelElement ? true : false>;

// I nomi degli schemi coincidono con quelli dei tipi del modello: qui si
// fondono valore (schema) e tipo (modello normalizzato).
export type Netlist = M.Netlist;
export type Element = M.Element;
export type Wave = M.Wave;
export type Port = M.Port;
export type Probe = M.Probe;
export type Placement = M.Placement;
export type GridPoint = M.GridPoint;
export type Dir = M.Dir;
export type Layout = M.Layout;
export type Wire = M.Wire;
