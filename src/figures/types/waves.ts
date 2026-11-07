/**
 * Onde (progressive e stazionarie) e vettori nel piano (somma, componenti,
 * sistemi di riferimento).
 */
import { niceTicks } from '../../sim/scale';
import { listText, plainLabel, Svg, type Ctx, type Drawn, type Pt, type Tone } from '../core';
import type { DiagramParams } from '../schemas';

type P<K extends keyof DiagramParams> = DiagramParams[K];

// -------------------------------------------------------------------------- onde
function emWave(p: P<'wave'>, c: Ctx): Drawn {
  const W = 470;
  const H = 280;
  const s = new Svg(W, H);
  const x0 = 50;
  const x1 = 440;
  const y0 = 140;
  const wl = p.wavelengths ?? 1.5;
  const lam = (x1 - x0 - 20) / wl;
  const A = 72;
  const zx = -0.62;
  const zy = 0.5;
  // assi
  s.arrow(x0 - 10, y0, x1 + 20, y0, { tone: 'muted', width: 1, head: 8 });
  s.arrow(x0, y0 + 10, x0, y0 - A - 22, { tone: 'muted', width: 1, head: 8 });
  s.arrow(x0, y0, x0 + zx * 60, y0 + zy * 60, { tone: 'muted', width: 1, head: 8 });
  s.text(x1 + 18, y0 + 16, 'x', { italic: true, size: 12 });
  s.text(x0 - 12, y0 - A - 18, 'y', { italic: true, size: 12 });
  s.text(x0 + zx * 60 - 8, y0 + zy * 60 + 4, 'z', { italic: true, size: 12 });
  const k = (2 * Math.PI) / lam;
  const Ept: Pt[] = [];
  const Bpt: Pt[] = [];
  for (let i = 0; i <= 200; i++) {
    const x = ((x1 - x0) * i) / 200;
    const v = Math.sin(k * x);
    Ept.push([x0 + x, y0 - A * v]);
    Bpt.push([x0 + x + zx * 0.7 * A * v, y0 + zy * 0.7 * A * v]);
  }
  for (let x = lam / 16; x < x1 - x0; x += lam / 8) {
    const v = Math.sin(k * x);
    if (Math.abs(v) < 0.2) continue;
    s.line(x0 + x, y0, x0 + x, y0 - A * v, { tone: 'danger', width: 0.9, opacity: 0.7 });
    s.line(x0 + x, y0, x0 + x + zx * 0.7 * A * v, y0 + zy * 0.7 * A * v, {
      tone: 'info',
      width: 0.9,
      opacity: 0.7,
    });
  }
  s.polyline(Ept, { tone: 'danger', width: 2.2 });
  s.polyline(Bpt, { tone: 'info', width: 2.2 });
  const xe = x0 + lam / 4;
  s.text(xe + 12, y0 - A - 8, 'E', { italic: true, halo: true });
  s.text(xe + zx * 0.7 * A - 14, y0 + zy * 0.7 * A + 12, 'B', { italic: true, halo: true });
  if (p.lambda !== false && wl >= 1) s.dimension(xe, y0 - A - 30, xe + lam, y0 - A - 30, 'λ');
  s.arrow(x1 - 60, 26, x1, 26, { tone: 'accent', width: 2.2 });
  s.text(x1 - 30, 14, 'c', { italic: true });
  return {
    svg: s,
    title: c.L('Onda elettromagnetica piana', 'Plane electromagnetic wave'),
    description: c.L(
      `Istantanea di un'onda elettromagnetica piana che si propaga lungo x con velocità c: il campo E oscilla lungo y, il campo B lungo z. I due campi sono perpendicolari tra loro e alla direzione di propagazione, in fase, con E₀ = c B₀; E × B punta nel verso di propagazione.`,
      `Snapshot of a plane electromagnetic wave travelling along x at speed c: the field E oscillates along y, the field B along z. The two fields are perpendicular to each other and to the direction of propagation, in phase, with E₀ = c B₀; E × B points along the propagation.`,
    ),
  };
}

function sphericalWave(p: P<'wave'>, c: Ctx): Drawn {
  const W = 420;
  const H = 280;
  const s = new Svg(W, H);
  const S0: Pt = [70, 140];
  for (let r = 36; r < 330; r += 36) {
    const a = Math.min(Math.PI / 2.4, Math.asin(Math.min(1, 125 / r)));
    const p0: Pt = [S0[0] + r * Math.cos(a), S0[1] - r * Math.sin(a)];
    const p1: Pt = [S0[0] + r * Math.cos(a), S0[1] + r * Math.sin(a)];
    s.path(
      `M${p0[0].toFixed(2)} ${p0[1].toFixed(2)}A${r} ${r} 0 0 1 ${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`,
      {
        tone: 'accent',
        width: 1.3,
        opacity: 0.85,
      },
    );
  }
  for (const a of [-50, -25, 0, 25, 50]) {
    const t = (a * Math.PI) / 180;
    s.arrow(
      S0[0] + 18 * Math.cos(t),
      S0[1] - 18 * Math.sin(t),
      S0[0] + 70 * Math.cos(t),
      S0[1] - 70 * Math.sin(t),
      {
        tone: 'danger',
        width: 1.6,
      },
    );
  }
  s.circle(S0[0], S0[1], 9, { fill: 'surface', width: 1.6 });
  s.text(S0[0] - 18, S0[1] - 18, p.sourceLabel ?? 'P', { italic: true, halo: true });
  const Q: Pt = [S0[0] + 288, S0[1]];
  s.dot(Q[0], Q[1], 3.6);
  s.dimension(S0[0], H - 26, Q[0], H - 26, p.distanceLabel ?? 'r');
  s.text(Q[0] - 4, Q[1] + 22, 'I = P/(4πr²)', { size: 12, halo: true, muted: true });
  return {
    svg: s,
    title: c.L('Onda sferica da una sorgente isotropa', 'Spherical wave from an isotropic source'),
    description: c.L(
      `Sorgente puntiforme di potenza ${plainLabel(p.sourceLabel ?? 'P')} che emette in modo isotropo: i fronti d'onda sono sfere concentriche. A distanza ${plainLabel(p.distanceLabel ?? 'r')} la potenza si distribuisce sulla superficie 4πr², quindi l'intensità cala come 1/r² e l'ampiezza dei campi come 1/r.`,
      `Point source of power ${plainLabel(p.sourceLabel ?? 'P')} emitting isotropically: the wavefronts are concentric spheres. At distance ${plainLabel(p.distanceLabel ?? 'r')} the power is spread over the area 4πr², so the intensity falls off as 1/r² and the field amplitude as 1/r.`,
    ),
  };
}

export function wave(p: P<'wave'>, c: Ctx): Drawn {
  if (p.kind === 'electromagnetic') return emWave(p, c);
  if (p.kind === 'spherical') return sphericalWave(p, c);
  const W = 460;
  const H = 230;
  const s = new Svg(W, H);
  const x0 = 46;
  const x1 = W - 40;
  const L = x1 - x0;
  const y0 = 122;
  const A = 62;
  s.line(x0 - 10, y0, x1 + 16, y0, { tone: 'muted', width: 1 });
  const curve = (f: (x: number) => number, n = 160): Pt[] => {
    const pts: Pt[] = [];
    for (let i = 0; i <= n; i++) {
      const x = (L * i) / n;
      pts.push([x0 + x, y0 - A * f(x)]);
    }
    return pts;
  };
  let desc: string;
  let title: string;
  if (p.kind === 'traveling') {
    const wl = p.wavelengths ?? 2;
    const lam = L / wl;
    s.polyline(
      curve((x) => Math.sin((2 * Math.PI * x) / lam)),
      { tone: 'accent', width: 2.2 },
    );
    if (p.lambda !== false && wl >= 1.2)
      s.dimension(x0 + lam / 4, y0 - A - 22, x0 + lam / 4 + lam, y0 - A - 22, 'λ');
    if (p.amplitude !== false) {
      const xc = x0 + (lam * 5) / 4;
      if (xc < x1) s.dimension(xc + 2, y0, xc + 2, y0 + A, 'A', { offset: 16 });
    }
    const right = p.direction !== 'left';
    const ay = 24;
    s.arrow(right ? x1 - 70 : x1, ay, right ? x1 : x1 - 70, ay, { tone: 'danger', width: 2 });
    s.text(x1 - 35, ay - 12, 'v', { italic: true });
    title = c.L('Onda progressiva', 'Travelling wave');
    desc = c.L(
      `Istantanea di un'onda sinusoidale che si propaga verso ${right ? 'destra' : 'sinistra'}: ${c.num(wl)} lunghezze d'onda λ, ampiezza A.`,
      `Snapshot of a sinusoidal wave travelling to the ${right ? 'right' : 'left'}: ${c.num(wl)} wavelengths λ, amplitude A.`,
    );
  } else {
    const n = p.harmonic ?? 2;
    const bd = p.boundary ?? 'fixed-fixed';
    const k =
      bd === 'fixed-fixed'
        ? (n * Math.PI) / L
        : bd === 'fixed-free'
          ? ((2 * n - 1) * Math.PI) / (2 * L)
          : (n * Math.PI) / L;
    const shape = (x: number): number => (bd === 'free-free' ? Math.cos(k * x) : Math.sin(k * x));
    const snaps = p.snapshots ?? 3;
    for (let j = 0; j < snaps; j++) {
      const ph = snaps === 1 ? 1 : 1 - (2 * j) / (snaps - 1);
      const env = j === 0 || j === snaps - 1;
      s.polyline(
        curve((x) => ph * shape(x)),
        env ? { tone: 'accent', width: 2.2 } : { tone: 'muted', width: 1.2, dash: '5 4' },
      );
    }
    // estremi
    for (const [x, fixed] of [
      [x0, bd !== 'free-free'],
      [x1, bd === 'fixed-fixed'],
    ] as const) {
      if (fixed) {
        s.line(x, y0 - A - 16, x, y0 + A + 16, { width: 2.4 });
        for (let y = y0 - A - 12; y < y0 + A + 16; y += 10)
          s.line(x, y, x + (x === x0 ? -7 : 7), y + 7, { tone: 'muted', width: 1 });
      } else {
        s.line(x, y0 - A - 16, x, y0 + A + 16, { tone: 'muted', width: 1, dash: '2 4' });
        s.circle(x, y0 - A * shape(x - x0), 4, { fill: 'surface', width: 1.4 });
      }
    }
    const nodes: number[] = [];
    const anti: number[] = [];
    for (let i = 0; i <= 400; i++) {
      const x = (L * i) / 400;
      const v = Math.abs(shape(x));
      if (v < 0.02) nodes.push(x);
      if (v > 0.9995) anti.push(x);
    }
    const dedupe = (xs: number[]): number[] => xs.filter((x, i) => i === 0 || x - xs[i - 1]! > 4);
    const N = dedupe(nodes);
    const AN = dedupe(anti);
    if (p.nodes !== false) {
      for (const x of N) {
        s.dot(x0 + x, y0, 3.6);
        s.text(x0 + x, y0 + 18, 'N', { size: 11, muted: true, halo: true });
      }
      for (const x of AN) s.text(x0 + x, y0 + A + 22, 'V', { size: 11, muted: true });
    }
    if (p.lambda !== false && N.length >= 2)
      s.dimension(x0 + N[0]!, y0 - A - 26, x0 + N[1]!, y0 - A - 26, 'λ/2');
    const lamText = bd === 'fixed-free' ? `L = ${2 * n - 1}·λ/4` : `L = ${n}·λ/2`;
    s.text(W / 2, H - 8, lamText, { italic: true, size: 12, muted: true });
    title = c.L('Onda stazionaria', 'Standing wave');
    const bdText =
      bd === 'fixed-fixed'
        ? c.L('estremi fissi', 'both ends fixed')
        : bd === 'fixed-free'
          ? c.L('un estremo fisso e uno libero', 'one fixed and one free end')
          : c.L('estremi liberi', 'both ends free');
    desc = c.L(
      `Onda stazionaria, armonica n = ${n}, con ${bdText}: ${N.length} nodi (N) e ${AN.length} ventri (V); ${lamText}. Le curve mostrano la corda in istanti diversi.`,
      `Standing wave, harmonic n = ${n}, with ${bdText}: ${N.length} nodes (N) and ${AN.length} antinodes (V); ${lamText}. The curves show the string at different instants.`,
    );
  }
  return { svg: s, title, description: desc };
}

// ----------------------------------------------------------------------- vettori
const VEC_TONES: Tone[] = ['accent', 'info', 'success', 'warning', 'accent2', 'danger'];

export function vectors(p: P<'vectors'>, c: Ctx): Drawn {
  const byId = new Map(p.vectors.filter((v) => v.id).map((v) => [v.id!, v]));
  const startOf = (v: P<'vectors'>['vectors'][number], depth = 0): Pt => {
    if (v.from && depth < 8) {
      const f = byId.get(v.from)!;
      const s0 = startOf(f, depth + 1);
      return [s0[0] + f.dx, s0[1] + f.dy];
    }
    return [v.x ?? 0, v.y ?? 0];
  };
  const placed = p.vectors.map((v, i) => ({
    v,
    s: startOf(v),
    tone: v.tone ?? VEC_TONES[i % VEC_TONES.length]!,
  }));
  const sumIds = p.sum?.of ?? [];
  const sumVecs = placed.filter((q) => q.v.id && sumIds.includes(q.v.id));
  const R: Pt = [sumVecs.reduce((a, q) => a + q.v.dx, 0), sumVecs.reduce((a, q) => a + q.v.dy, 0)];
  const R0: Pt = sumVecs[0]?.s ?? [0, 0];
  let range = p.range;
  if (!range) {
    const xs = [0];
    const ys = [0];
    for (const q of placed) (xs.push(q.s[0], q.s[0] + q.v.dx), ys.push(q.s[1], q.s[1] + q.v.dy));
    if (p.sum) (xs.push(R0[0] + R[0]), ys.push(R0[1] + R[1]));
    for (const f of p.frames ?? []) {
      const L = f.length ?? 2;
      (xs.push(f.x - L * 0.3, f.x + L), ys.push(f.y - L * 0.3, f.y + L));
    }
    range = {
      xMin: Math.floor(Math.min(...xs)) - 1,
      xMax: Math.ceil(Math.max(...xs)) + 1,
      yMin: Math.floor(Math.min(...ys)) - 1,
      yMax: Math.ceil(Math.max(...ys)) + 1,
    };
  }
  const spanX = range.xMax - range.xMin;
  const spanY = range.yMax - range.yMin;
  const k = Math.min(380 / spanX, 340 / spanY);
  const W = spanX * k + 40;
  const H = spanY * k + 40;
  const s = new Svg(W, H);
  const X = (x: number): number => 20 + (x - range.xMin) * k;
  const Y = (y: number): number => 20 + (range.yMax - y) * k;
  if (p.grid ?? spanX <= 24) {
    for (const x of niceTicks(range.xMin, range.xMax, Math.min(24, spanX)))
      s.line(X(x), Y(range.yMin), X(x), Y(range.yMax), { tone: 'faint', width: 0.6, opacity: 0.6 });
    for (const y of niceTicks(range.yMin, range.yMax, Math.min(24, spanY)))
      s.line(X(range.xMin), Y(y), X(range.xMax), Y(y), { tone: 'faint', width: 0.6, opacity: 0.6 });
  }
  if (p.axes !== false && range.xMin <= 0 && range.xMax >= 0 && range.yMin <= 0 && range.yMax >= 0) {
    const [ax, ay] = p.axisLabels ?? ['x', 'y'];
    s.arrow(X(range.xMin), Y(0), X(range.xMax) + 8, Y(0), { width: 1.1, head: 8, tone: 'muted' });
    s.arrow(X(0), Y(range.yMin), X(0), Y(range.yMax) - 8, { width: 1.1, head: 8, tone: 'muted' });
    s.text(X(range.xMax) + 4, Y(0) + 14, ax, { italic: true, muted: true });
    s.text(X(0) - 12, Y(range.yMax) - 2, ay, { italic: true, muted: true });
  }
  for (const f of p.frames ?? []) {
    const a = ((f.angle ?? 0) * Math.PI) / 180;
    const L = (f.length ?? 2) * k;
    const o: Pt = [X(f.x), Y(f.y)];
    const [lx, ly] = f.labels ?? ["x'", "y'"];
    const ex: Pt = [Math.cos(a), -Math.sin(a)];
    const ey: Pt = [-Math.sin(a), -Math.cos(a)];
    s.arrow(o[0], o[1], o[0] + ex[0] * L, o[1] + ex[1] * L, { width: 1.6, head: 9 });
    s.arrow(o[0], o[1], o[0] + ey[0] * L, o[1] + ey[1] * L, { width: 1.6, head: 9 });
    s.text(o[0] + ex[0] * (L + 12), o[1] + ex[1] * (L + 12), lx, { italic: true });
    s.text(o[0] + ey[0] * (L + 12), o[1] + ey[1] * (L + 12), ly, { italic: true });
    if (f.origin) s.text(o[0] - 10, o[1] + 12, f.origin, { halo: true });
    s.dot(o[0], o[1], 2.6);
  }
  if (p.sum?.parallelogram && sumVecs.length === 2) {
    const [a, b] = sumVecs as [(typeof placed)[number], (typeof placed)[number]];
    s.line(X(a.s[0] + a.v.dx), Y(a.s[1] + a.v.dy), X(a.s[0] + a.v.dx + b.v.dx), Y(a.s[1] + a.v.dy + b.v.dy), {
      tone: 'muted',
      width: 1,
      dash: '4 4',
    });
    s.line(X(b.s[0] + b.v.dx), Y(b.s[1] + b.v.dy), X(b.s[0] + a.v.dx + b.v.dx), Y(b.s[1] + a.v.dy + b.v.dy), {
      tone: 'muted',
      width: 1,
      dash: '4 4',
    });
  }
  const labelAt = (from: Pt, d: Pt, label: string): void => {
    const len = Math.hypot(d[0], d[1]) || 1;
    // a metà del vettore, spostata a sinistra della direzione
    s.text(X(from[0] + d[0] / 2) - (d[1] / len) * 14, Y(from[1] + d[1] / 2) - (d[0] / len) * 14, label, {
      italic: true,
      size: 14,
      halo: true,
    });
  };
  for (const q of placed) {
    const { v, s: st, tone } = q;
    if (v.components) {
      s.arrow(X(st[0]), Y(st[1]), X(st[0] + v.dx), Y(st[1]), { tone, width: 1.3, dash: '4 3' });
      s.arrow(X(st[0] + v.dx), Y(st[1]), X(st[0] + v.dx), Y(st[1] + v.dy), { tone, width: 1.3, dash: '4 3' });
      if (v.label) {
        s.text(X(st[0] + v.dx / 2), Y(st[1]) + (v.dy >= 0 ? 14 : -14), `${v.label}_x`, {
          italic: true,
          size: 12,
          halo: true,
        });
        s.text(X(st[0] + v.dx) + (v.dx >= 0 ? 16 : -16), Y(st[1] + v.dy / 2), `${v.label}_y`, {
          italic: true,
          size: 12,
          halo: true,
        });
      }
    }
    s.arrow(X(st[0]), Y(st[1]), X(st[0] + v.dx), Y(st[1] + v.dy), {
      tone,
      width: 2.2,
      ...(v.dashed ? { dash: '6 4' } : {}),
    });
    if (v.label) labelAt(st, [v.dx, v.dy], v.label);
  }
  if (p.sum) {
    s.arrow(X(R0[0]), Y(R0[1]), X(R0[0] + R[0]), Y(R0[1] + R[1]), { tone: 'danger', width: 2.8 });
    labelAt(R0, R, p.sum.label ?? 'R');
  }
  const vt = placed.map(
    ({ v, s: st }) =>
      `${v.label ? plainLabel(v.label) : c.L('vettore', 'vector')} = (${c.num(v.dx)}; ${c.num(v.dy)})${v.from ? c.L(` dalla punta di ${v.from}`, ` from the tip of ${v.from}`) : st[0] || st[1] ? c.L(` applicato in (${c.num(st[0])}; ${c.num(st[1])})`, ` applied at (${c.num(st[0])}; ${c.num(st[1])})`) : ''}`,
  );
  return {
    svg: s,
    title: p.sum
      ? c.L('Somma di vettori', 'Vector sum')
      : p.vectors.length
        ? c.L('Vettori nel piano', 'Vectors in the plane')
        : c.L('Sistemi di riferimento', 'Reference frames'),
    description:
      (vt.length ? c.L(`Vettori: ${listText(vt, 'it')}.`, `Vectors: ${listText(vt, 'en')}.`) : '') +
      (p.sum
        ? c.L(
            ` Risultante ${plainLabel(p.sum.label ?? 'R')} = (${c.num(R[0])}; ${c.num(R[1])}).`,
            ` Resultant ${plainLabel(p.sum.label ?? 'R')} = (${c.num(R[0])}; ${c.num(R[1])}).`,
          )
        : '') +
      (p.frames?.length
        ? c.L(` ${p.frames.length} sistemi di riferimento: `, ` ${p.frames.length} reference frames: `) +
          listText(
            p.frames.map((f) =>
              c.L(
                `origine (${c.num(f.x)}; ${c.num(f.y)}) ruotato di ${c.num(f.angle ?? 0)}°`,
                `origin (${c.num(f.x)}; ${c.num(f.y)}) rotated by ${c.num(f.angle ?? 0)}°`,
              ),
            ),
            c.lang,
          ) +
          '.'
        : ''),
  };
}
