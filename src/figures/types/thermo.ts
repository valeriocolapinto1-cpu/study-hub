/**
 * Cicli termodinamici nel piano pV: isoterme, adiabatiche, isocore, isobare e
 * trasformazioni lineari tra stati dati; area del lavoro e verso di percorrenza.
 */
import { drawAxes, frame } from '../axes';
import { listText, midArrow, Svg, type Ctx, type Drawn, type Pt } from '../core';
import type { DiagramParams } from '../schemas';

type PV = DiagramParams['pv-cycle'];
type Proc = PV['processes'][number];

const KIND_IT: Record<Proc['kind'], string> = {
  isothermal: 'isoterma',
  adiabatic: 'adiabatica',
  isochoric: 'isocora',
  isobaric: 'isobara',
  linear: 'trasformazione lineare',
};
const KIND_EN: Record<Proc['kind'], string> = {
  isothermal: 'isothermal',
  adiabatic: 'adiabatic',
  isochoric: 'isochoric',
  isobaric: 'isobaric',
  linear: 'straight-line process',
};

/** Punti (V, p) di una trasformazione. */
export function processPath(a: { p: number; V: number }, b: { p: number; V: number }, kind: Proc['kind'], gamma: number, n = 48): Array<[number, number]> {
  if (kind === 'isothermal' || kind === 'adiabatic') {
    const e = kind === 'isothermal' ? 1 : gamma;
    const K = a.p * a.V ** e;
    const out: Array<[number, number]> = [];
    for (let i = 0; i <= n; i++) {
      const V = a.V + ((b.V - a.V) * i) / n;
      out.push([V, K / V ** e]);
    }
    out[out.length - 1] = [b.V, b.p];
    return out;
  }
  return [
    [a.V, a.p],
    [b.V, b.p],
  ];
}

export function pvCycle(p: PV, c: Ctx): Drawn {
  const gamma = p.gamma ?? 1.4;
  const st = new Map(p.states.map((s) => [s.id, s]));
  const paths = p.processes.map((pr) => processPath(st.get(pr.from)!, st.get(pr.to)!, pr.kind, gamma));
  const all = paths.flat();
  const Vmax = Math.max(...all.map((q) => q[0]));
  const pmax = Math.max(...all.map((q) => q[1]));
  const units = p.units ?? { p: 'kPa', V: 'L' };
  const s = new Svg(440, 320);
  const f = frame({ x: 62, y: 34, w: 330, h: 236 }, [0, Vmax * 1.15], [0, pmax * 1.15], true);
  const closed =
    p.processes.length >= 2 &&
    p.processes.every((pr, i) => i === 0 || pr.from === p.processes[i - 1]!.to) &&
    p.processes[p.processes.length - 1]!.to === p.processes[0]!.from;
  // area con segno nel piano (V, p): positiva se percorsa in senso orario
  let area = 0;
  const loop = paths.flatMap((q, i) => (i ? q.slice(1) : q));
  if (closed) for (let i = 0; i < loop.length - 1; i++) area += (loop[i + 1]![0] - loop[i]![0]) * (loop[i]![1] + loop[i + 1]![1]) * 0.5;
  if (p.work !== false) {
    if (closed) s.polygon(loop.map(([V, pp]) => [f.sx(V), f.sy(pp)]), { fill: 'soft', tone: 'accent', width: 0.5 });
    else
      for (const q of paths) {
        if (Math.abs(q[0]![0] - q[q.length - 1]![0]) < 1e-12) continue;
        const poly: Pt[] = [[f.sx(q[0]![0]), f.sy(0)], ...q.map(([V, pp]) => [f.sx(V), f.sy(pp)] as Pt), [f.sx(q[q.length - 1]![0]), f.sy(0)]];
        s.polygon(poly, { fill: 'soft', tone: 'accent', width: 0.5 });
      }
  }
  drawAxes(s, f, { xLabel: 'V', xUnit: units.V, yLabel: 'p', yUnit: units.p, fmt: (v) => c.num(v, 3), edge: true, noTicks: p.values === false });
  if (p.isotherms) {
    for (const sv of p.states) {
      const K = sv.p * sv.V;
      const pts: Pt[] = [];
      for (let i = 0; i <= 60; i++) {
        const V = Vmax * 0.08 + ((Vmax * 1.12 - Vmax * 0.08) * i) / 60;
        const pp = K / V;
        if (pp <= pmax * 1.15) pts.push([f.sx(V), f.sy(pp)]);
      }
      s.polyline(pts, { tone: 'faint', width: 1, dash: '3 4' });
    }
  }
  paths.forEach((q) => {
    const pts: Pt[] = q.map(([V, pp]) => [f.sx(V), f.sy(pp)]);
    s.polyline(pts, { tone: 'accent', width: 2.2 });
    midArrow(s, pts, 'accent', 0.5, 10);
  });
  const cx = p.states.reduce((a, q) => a + f.sx(q.V), 0) / p.states.length;
  const cy = p.states.reduce((a, q) => a + f.sy(q.p), 0) / p.states.length;
  for (const sv of p.states) {
    const x = f.sx(sv.V);
    const y = f.sy(sv.p);
    const dx = x - cx;
    const dy = y - cy;
    const m = Math.hypot(dx, dy) || 1;
    s.dot(x, y, 3.6);
    s.text(x + (dx / m) * 14, y + (dy / m) * 14, sv.id, { weight: 600, size: 13, halo: true });
  }
  if (closed && p.work !== false) {
    const ax = loop.reduce((a, q) => a + f.sx(q[0]), 0) / loop.length;
    const ay = loop.reduce((a, q) => a + f.sy(q[1]), 0) / loop.length;
    s.text(ax, ay, area >= 0 ? 'W > 0' : 'W < 0', { italic: true, size: 13, halo: true });
  }
  const procText = p.processes.map((pr) => `${pr.from} → ${pr.to} ${c.L(KIND_IT[pr.kind], KIND_EN[pr.kind])}`);
  return {
    svg: s,
    title: closed ? c.L('Ciclo nel piano pV', 'Cycle on a pV diagram') : c.L('Trasformazioni nel piano pV', 'Processes on a pV diagram'),
    description:
      c.L('Piano pV con gli stati ', 'pV diagram with states ') +
      listText(p.states.map((q) => `${q.id} (V = ${c.num(q.V)} ${units.V}, p = ${c.num(q.p)} ${units.p})`), c.lang) +
      c.L('. Trasformazioni: ', '. Processes: ') +
      listText(procText, c.lang) +
      (closed
        ? c.L(
            `. Ciclo percorso in senso ${area >= 0 ? 'orario: lavoro netto fatto dal gas positivo' : 'antiorario: lavoro netto fatto dal gas negativo'}, pari all'area racchiusa (circa ${c.num(Math.abs(area))} ${units.p}·${units.V}).`,
            `. The cycle runs ${area >= 0 ? 'clockwise: positive net work done by the gas' : 'counter-clockwise: negative net work done by the gas'}, equal to the enclosed area (about ${c.num(Math.abs(area))} ${units.p}·${units.V}).`,
          )
        : p.work !== false
          ? c.L('. È evidenziata l’area sotto le trasformazioni (lavoro).', '. The area under the processes (work) is shaded.')
          : '.'),
  };
}
