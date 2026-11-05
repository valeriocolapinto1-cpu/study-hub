/**
 * Modello dei circuiti senza dipendenze: tipi della netlist normalizzata,
 * funzioni di servizio e una normalizzazione leggera usata a runtime.
 *
 * Lo schema Zod completo (con tutti i controlli) è in netlist.ts e si usa a
 * build-time (content collections, test, componente Astro). Le isole nel
 * browser importano solo questo modulo, così Zod non finisce nel bundle.
 * Un test verifica che normalizeNetlist() e lo schema producano lo stesso risultato.
 */
import { parseSI } from '../units';

export const GROUND = '0';
const GROUND_ALIASES = new Set(['0', 'gnd', 'GND', 'massa', 'ground']);
/** Normalizza il nome di un nodo (le varie scritture della massa diventano "0"). */
export const normNode = (n: string | number): string => {
  const s = String(n).trim();
  return GROUND_ALIASES.has(s) ? GROUND : s;
};

export type Dir = 'right' | 'left' | 'up' | 'down';
export interface GridPoint {
  x: number;
  y: number;
}
export interface Placement extends GridPoint {
  dir?: Dir | undefined;
  len?: number | undefined;
  label?: 'auto' | 'left' | 'right' | 'above' | 'below' | undefined;
  flip?: boolean | undefined;
}
export interface Show {
  name?: boolean | undefined;
  value?: boolean | undefined;
  v?: boolean | string | undefined;
  i?: boolean | string | undefined;
}
interface Base {
  id: string;
  label?: string | undefined;
  show?: Show | undefined;
  at?: Placement | undefined;
}
interface TwoT extends Base {
  a: string;
  b: string;
}

export type Wave =
  | { kind: 'dc'; value: number }
  | {
      kind: 'sin';
      offset: number;
      amp: number;
      omega?: number | undefined;
      freq?: number | undefined;
      phase: number;
    }
  | { kind: 'step'; before: number; after: number; at: number }
  | {
      kind: 'pulse';
      low: number;
      high: number;
      delay: number;
      rise: number;
      fall: number;
      width: number;
      period?: number | undefined;
    }
  | { kind: 'pwl'; points: Array<[number, number]> };

export interface Phasor {
  mag: number;
  phase: number;
}
interface SourceFields {
  dc?: number | undefined;
  ac?: Phasor | undefined;
  wave?: Wave | undefined;
}
export type Matrix2 = [[number, number], [number, number]];

export type Element =
  | (TwoT & { type: 'R'; value: number })
  | (TwoT & { type: 'C'; value: number; v0?: number | undefined })
  | (TwoT & { type: 'L'; value: number; i0?: number | undefined })
  | (TwoT & SourceFields & { type: 'V' })
  | (TwoT & SourceFields & { type: 'I' })
  | (TwoT & { type: 'E'; cp: string; cn: string; gain: number })
  | (TwoT & { type: 'G'; cp: string; cn: string; gain: number })
  | (TwoT & { type: 'H'; ctrl: string; gain: number })
  | (TwoT & { type: 'F'; ctrl: string; gain: number })
  | (TwoT & { type: 'SW'; closed: boolean; toggleAt?: number | undefined })
  | (TwoT & { type: 'AM' })
  | (TwoT & { type: 'VM' })
  | (Base & { type: 'K'; l1: string; l2: string; k?: number | undefined; m?: number | undefined })
  | (Base & { type: 'T'; p1a: string; p1b: string; p2a: string; p2b: string; n: number })
  | (Base & { type: 'OA'; plus: string; minus: string; out: string; gain?: number | undefined })
  | (Base & { type: 'N'; na: string; nb: string; ra: string; rb: string; at2?: Placement | undefined })
  | (Base & {
      type: 'P';
      p1a: string;
      p1b: string;
      p2a: string;
      p2b: string;
      kind: 'Z' | 'Y' | 'H' | 'ABCD';
      m: Matrix2;
    });

export type ElementType = Element['type'];
export type ElementOf<T extends ElementType> = Extract<Element, { type: T }>;
export type TwoTerminal = Extract<Element, { a: string; b: string }>;
export const isTwoTerminal = (e: Element): e is TwoTerminal => 'a' in e && 'b' in e;

export interface Port {
  id: string;
  plus: string;
  minus: string;
  label?: string | undefined;
}
export type Probe =
  { kind: 'v'; plus: string; minus: string; label: string } | { kind: 'i'; element: string; label: string };
export interface Wire {
  node: string;
  points: Array<[number, number]>;
}
export interface Layout {
  mode?: 'auto' | 'bridge' | 'manual' | undefined;
  ground: 'rail' | 'symbols';
  order?: string[] | undefined;
  wires?: Wire[] | undefined;
}

/** Netlist normalizzata (valori numerici SI, nodi normalizzati, default applicati). */
export interface Netlist {
  title?: string | undefined;
  description?: string | undefined;
  omega?: number | undefined;
  freq?: number | undefined;
  phasor: 'peak' | 'rms';
  elements: Element[];
  nodes?: Record<string, { label?: string | undefined; at?: GridPoint | undefined }> | undefined;
  ports?: Port[] | undefined;
  probes?: Probe[] | undefined;
  layout: Layout;
}

// ------------------------------------------------------------------ servizio

/** Morsetti di un elemento, nell'ordine canonico, come coppie [campo, nodo]. */
export function terminals(e: Element): Array<[string, string]> {
  switch (e.type) {
    case 'K':
      return [];
    case 'T':
    case 'P':
      return [
        ['p1a', e.p1a],
        ['p1b', e.p1b],
        ['p2a', e.p2a],
        ['p2b', e.p2b],
      ];
    case 'OA':
      return [
        ['plus', e.plus],
        ['minus', e.minus],
        ['out', e.out],
      ];
    case 'N':
      return [
        ['na', e.na],
        ['nb', e.nb],
        ['ra', e.ra],
        ['rb', e.rb],
      ];
    default:
      return [
        ['a', e.a],
        ['b', e.b],
      ];
  }
}

/** Tutti i nodi del circuito (massa compresa), in ordine di apparizione. */
export function nodesOf(n: { elements: readonly Element[] }): string[] {
  const s = new Set<string>([GROUND]);
  for (const e of n.elements) {
    for (const [, nd] of terminals(e)) s.add(nd);
    if (e.type === 'E' || e.type === 'G') {
      s.add(e.cp);
      s.add(e.cn);
    }
  }
  return [...s];
}

/** Pulsazione del circuito (da omega o freq), o undefined. */
export function circuitOmega(n: Pick<Netlist, 'omega' | 'freq'>): number | undefined {
  if (n.omega !== undefined) return n.omega;
  if (n.freq !== undefined) return 2 * Math.PI * n.freq;
  return undefined;
}

export const elementById = (n: Netlist, id: string): Element | undefined =>
  n.elements.find((e) => e.id === id);

// ------------------------------------------------------------------ normalizzazione leggera

type Loose = Record<string, unknown>;
const NODE_KEYS = [
  'a',
  'b',
  'cp',
  'cn',
  'p1a',
  'p1b',
  'p2a',
  'p2b',
  'plus',
  'minus',
  'out',
  'na',
  'nb',
  'ra',
  'rb',
];
const VALUE_KEYS = ['value', 'v0', 'i0', 'gain', 'dc', 'toggleAt', 'm', 'n'];
const WAVE_VALUE_KEYS = [
  'value',
  'offset',
  'amp',
  'omega',
  'freq',
  'before',
  'after',
  'at',
  'low',
  'high',
  'delay',
  'rise',
  'fall',
  'width',
  'period',
];
const WAVE_DEFAULTS: Record<string, Loose> = {
  sin: { offset: 0, phase: 0 },
  step: { before: 0, at: 0 },
  pulse: { low: 0, delay: 0, rise: 0, fall: 0 },
};
const num = (v: unknown): number => parseSI(v as number | string);

/**
 * Normalizzazione senza Zod: converte i valori con prefisso, normalizza i
 * nodi, applica i default e controlla id unici e riferimenti. Per i controlli
 * completi (tipi, intervalli) usare lo schema di netlist.ts a build-time.
 */
export function normalizeNetlist(input: unknown): Netlist {
  if (!input || typeof input !== 'object' || !Array.isArray((input as Loose).elements))
    throw new Error('Netlist non valida: manca elements');
  const src = input as Loose;
  const out: Loose = { ...src };
  out.phasor = src.phasor ?? 'peak';
  for (const k of ['omega', 'freq'] as const) if (src[k] !== undefined) out[k] = num(src[k]);
  const layout = (src.layout as Loose | undefined) ?? {};
  out.layout = {
    ...layout,
    ground: layout.ground ?? 'rail',
    ...(Array.isArray(layout.order) ? { order: (layout.order as Array<string | number>).map(normNode) } : {}),
    ...(Array.isArray(layout.wires)
      ? { wires: (layout.wires as Loose[]).map((w) => ({ ...w, node: normNode(w.node as string) })) }
      : {}),
  };
  out.elements = (src.elements as Loose[]).map((raw) => {
    const e: Loose = { ...raw };
    for (const k of NODE_KEYS) if (e[k] !== undefined) e[k] = normNode(e[k] as string);
    for (const k of VALUE_KEYS)
      if (e[k] !== undefined && !(k === 'm' && Array.isArray(e[k]))) e[k] = num(e[k]);
    if (e.ac !== undefined) {
      const a = e.ac;
      e.ac =
        typeof a === 'object' && a !== null
          ? { mag: num((a as Loose).mag), phase: ((a as Loose).phase as number | undefined) ?? 0 }
          : { mag: num(a), phase: 0 };
    }
    if (e.wave && typeof e.wave === 'object') {
      const w: Loose = { ...(WAVE_DEFAULTS[(e.wave as Loose).kind as string] ?? {}), ...(e.wave as Loose) };
      for (const k of WAVE_VALUE_KEYS) if (w[k] !== undefined) w[k] = num(w[k]);
      e.wave = w;
    }
    return e;
  });
  if (src.ports)
    out.ports = (src.ports as Loose[]).map((p) => ({
      ...p,
      plus: normNode(p.plus as string),
      minus: normNode((p.minus as string | undefined) ?? GROUND),
    }));
  if (src.probes)
    out.probes = (src.probes as Loose[]).map((p) =>
      p.kind === 'v'
        ? {
            ...p,
            plus: normNode(p.plus as string),
            minus: normNode((p.minus as string | undefined) ?? GROUND),
          }
        : { ...p },
    );
  const net = out as unknown as Netlist;
  const ids = new Set<string>();
  for (const e of net.elements) {
    if (ids.has(e.id)) throw new Error(`Netlist non valida: id duplicato ${e.id}`);
    ids.add(e.id);
  }
  for (const e of net.elements) {
    if ((e.type === 'H' || e.type === 'F') && !ids.has(e.ctrl))
      throw new Error(`Netlist non valida: ${e.id}: controllo inesistente ${e.ctrl}`);
    if (e.type === 'K' && (!ids.has(e.l1) || !ids.has(e.l2)))
      throw new Error(`Netlist non valida: ${e.id}: induttore inesistente`);
  }
  return net;
}
