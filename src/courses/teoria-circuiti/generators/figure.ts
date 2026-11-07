/**
 * Figure dei generatori «applicati»: schemi (netlist del kit) e figure del kit costruiti dagli
 * stessi parametri estratti dal seme, così la figura cambia con la variante.
 */
import type { ExerciseFigure } from '../../../engine/generators/registry';
import type { NetlistInput } from '../../../sim/circuits/netlist';

type El = NetlistInput['elements'][number];
const net = (elements: El[], extra: Partial<NetlistInput> = {}): ExerciseFigure => ({
  netlist: { elements, ...extra } as NetlistInput,
});
const HIDE = { value: false } as const;

/** Generatore di Thevenin con impedenza R + jX e carico Z_L (ω = 1 rad/s). */
export function figMaxTrasf(vp: number, r: number, x: number): ExerciseFigure {
  const els: El[] = [
    { type: 'V', id: 'Vth', a: 'a', b: '0', ac: vp },
    { type: 'R', id: 'Rth', a: 'a', b: x === 0 ? 'c' : 'b', value: r },
  ];
  if (x > 0) els.push({ type: 'L', id: 'Lth', a: 'b', b: 'c', value: x, label: `j${x} Ω` });
  if (x < 0) els.push({ type: 'C', id: 'Cth', a: 'b', b: 'c', value: 1 / -x, label: `−j${-x} Ω` });
  els.push({ type: 'R', id: 'ZL', a: 'c', b: '0', value: 1, show: HIDE });
  return net(els, { omega: 1 });
}

/** Filtro del primo ordine: elemento in serie e uscita sull'elemento in parallelo. */
export function figFiltro(kind: 'rc_lp' | 'rc_hp' | 'rl_lp' | 'rl_hp', r: number, x: number): ExerciseFigure {
  const el = (k: 'R' | 'C' | 'L', a: string, b: string, out: boolean): El =>
    ({
      type: k,
      id: k,
      a,
      b,
      value: k === 'R' ? r : x,
      ...(out ? { show: { v: 'v_o' } } : {}),
    }) as El;
  const [s, p] = { rc_lp: ['R', 'C'], rc_hp: ['C', 'R'], rl_lp: ['L', 'R'], rl_hp: ['R', 'L'] }[kind] as [
    'R' | 'C' | 'L',
    'R' | 'C' | 'L',
  ];
  return net([
    { type: 'V', id: 'vi', a: 'i', b: '0', ac: 1, show: HIDE },
    el(s, 'i', 'o', false),
    el(p, 'o', '0', true),
  ]);
}

/** RLC serie (con generatore di tensione) o parallelo (con generatore di corrente). */
export function figRisonanza(serie: boolean, r: number, l: number, c: number): ExerciseFigure {
  if (serie)
    return net([
      { type: 'V', id: 'vg', a: 'a', b: '0', ac: 1, show: HIDE },
      { type: 'R', id: 'R', a: 'a', b: 'b', value: r },
      { type: 'L', id: 'L', a: 'b', b: 'c', value: l },
      { type: 'C', id: 'C', a: 'c', b: '0', value: c },
    ]);
  return net([
    { type: 'I', id: 'ig', a: '0', b: 'a', ac: 1, show: HIDE },
    { type: 'R', id: 'R', a: 'a', b: '0', value: r },
    { type: 'L', id: 'L', a: 'a', b: '0', value: l },
    { type: 'C', id: 'C', a: 'a', b: '0', value: c },
  ]);
}

/** RC serie con uscita sul condensatore o RL serie con uscita sul resistore. */
export function figImpulsiva(rc: boolean, r: number, x: number): ExerciseFigure {
  return net([
    { type: 'V', id: 'x', a: 'i', b: '0', dc: 1, show: HIDE },
    rc ? { type: 'R', id: 'R', a: 'i', b: 'o', value: r } : { type: 'L', id: 'L', a: 'i', b: 'o', value: x },
    rc
      ? { type: 'C', id: 'C', a: 'o', b: '0', value: x, show: { v: 'y' } }
      : { type: 'R', id: 'R', a: 'o', b: '0', value: r, show: { v: 'y' } },
  ]);
}

const PORTS = {
  ports: [
    { id: 'P1', plus: 'p1', minus: '0', label: '1' },
    { id: 'P2', plus: 'p2', minus: '0', label: '2' },
  ],
};

/** Doppio bipolo a T (resistori) o a π (conduttanze). */
export function figDoppioBipolo(t: boolean, a: number, b: number, c: number): ExerciseFigure {
  if (t)
    return net(
      [
        { type: 'R', id: 'Ra', a: 'p1', b: 'm', value: a },
        { type: 'R', id: 'Rb', a: 'm', b: 'p2', value: b },
        { type: 'R', id: 'Rc', a: 'm', b: '0', value: c },
      ],
      PORTS,
    );
  return net(
    [
      { type: 'R', id: 'Ga', a: 'p1', b: '0', value: 1 / a, label: `${a} S` },
      { type: 'R', id: 'Gc', a: 'p1', b: 'p2', value: 1 / c, label: `${c} S` },
      { type: 'R', id: 'Gb', a: 'p2', b: '0', value: 1 / b, label: `${b} S` },
    ],
    PORTS,
  );
}

/** Triangolo delle potenze prima e dopo il rifasamento (P normalizzata). */
export function figRifasamento(tan1: number, tan2: number): ExerciseFigure {
  const P = 4;
  const q1 = P * tan1;
  const q2 = P * tan2;
  return {
    diagram: {
      type: 'vectors',
      params: {
        vectors: [
          { id: 'P', label: 'P', dx: P, dy: 0, tone: 'accent' },
          { id: 'Q1', label: 'Q_1', dx: 0, dy: q1, from: 'P', tone: 'info' },
          { id: 'S1', label: 'S_1', dx: P, dy: q1, tone: 'danger' },
          ...(q2 > 0
            ? [{ id: 'S2', label: 'S_2', dx: P, dy: q2, tone: 'success' as const, dashed: true }]
            : []),
          { id: 'QC', label: 'Q_C', x: P + 0.35, y: q1, dx: 0, dy: q2 - q1, tone: 'warning', dashed: true },
        ],
        axes: true,
        axisLabels: ['P', 'Q'],
        range: { xMin: -0.5, xMax: P + 1.5, yMin: -0.5, yMax: Math.max(q1, 1) + 1 },
      },
    },
  };
}

/** Fasori di tensione (riferimento) e corrente in ritardo di φ. */
export function figPotenze(cos: number, sin: number): ExerciseFigure {
  return {
    diagram: {
      type: 'vectors',
      params: {
        vectors: [
          { label: 'V̇', dx: 1, dy: 0, tone: 'accent' },
          { label: 'İ', dx: 0.7 * cos, dy: -0.7 * sin, tone: 'info' },
        ],
        axes: true,
        axisLabels: ['Re', 'Im'],
        range: { xMin: -0.3, xMax: 1.3, yMin: -1, yMax: 0.4 },
      },
    },
  };
}

/** Impulso rettangolare di ampiezza a o rampa a·t troncata in T. */
export function figSegnaleTratti(rect: boolean, a: number, T: number): ExerciseFigure {
  const pts: [number, number][] = rect
    ? [
        [-0.5, 0],
        [0, 0],
        [0, a],
        [T, a],
        [T, 0],
        [T + 1.5, 0],
      ]
    : [
        [-0.5, 0],
        [0, 0],
        [T, a * T],
        [T, 0],
        [T + 1.5, 0],
      ];
  return {
    diagram: {
      type: 'function-plot',
      params: {
        x: { min: -0.5, max: T + 1.5, label: 't', unit: 's' },
        y: { min: 0, max: (rect ? a : a * T) * 1.2, label: 'x(t)' },
        series: [{ kind: 'points', points: pts }],
        vlines: [{ x: T, label: 'T' }],
      },
    },
  };
}

/** Configurazioni con amplificatore operazionale ideale. */
export function figOpamp(kind: 'inv' | 'noninv' | 'somm' | 'diff'): ExerciseFigure {
  const OA = (plus: string): El => ({ type: 'OA', id: 'A', plus, minus: 'm', out: 'o' });
  const nodes = { nodes: { o: { label: 'v_o' } } };
  const R = (id: string, a: string, b: string): El => ({ type: 'R', id, a, b, value: 1, show: HIDE });
  const V = (id: string, a: string): El => ({ type: 'V', id, a, b: '0', dc: 1, show: HIDE });
  switch (kind) {
    case 'inv':
      return net([V('Vg', 'g'), R('R1', 'g', 'm'), R('R2', 'm', 'o'), OA('0')], nodes);
    case 'noninv':
      return net([V('Vg', 'g'), OA('g'), R('R1', 'm', '0'), R('R2', 'm', 'o')], nodes);
    case 'somm':
      return net(
        [V('Vg1', 'g1'), V('Vg2', 'g2'), R('R1', 'g1', 'm'), R('R2', 'g2', 'm'), R('R0', 'm', 'o'), OA('0')],
        nodes,
      );
    default:
      return net(
        [
          V('Vg1', 'g1'),
          V('Vg2', 'g2'),
          R('R1', 'g1', 'm'),
          R('R2', 'm', 'o'),
          R('R3', 'g2', 'p'),
          R('R4', 'p', '0'),
          OA('p'),
        ],
        nodes,
      );
  }
}

/** Grafo orientato del circuito: rami r_k da x a y. */
export function figGrafo(nn: number, edges: [number, number][]): ExerciseFigure {
  return {
    diagram: {
      type: 'graph',
      params: {
        nodes: Array.from({ length: nn }, (_, i) => ({ id: String(i) })),
        edges: edges.map(([x, y], i) => ({ from: String(x), to: String(y), label: `r_${i + 1}` })),
        directed: true,
      },
    },
  };
}

/** Poli (e zeri) di F(s) nel piano complesso. */
export function figPoli(poles: [number, number][], zeros: [number, number][] = []): ExerciseFigure {
  return {
    diagram: {
      type: 'pole-zero',
      params: {
        poles: poles.map(([re, im]) => ({ re, im })),
        ...(zeros.length ? { zeros: zeros.map(([re, im]) => ({ re, im })) } : {}),
      },
    },
  };
}
