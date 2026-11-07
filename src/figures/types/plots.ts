/**
 * Grafici: leggi orarie x(t), v(t), a(t) a tratti e grafici di funzione generici
 * (polinomi, sinusoidi, esponenziali, punti), con assi, tacche, aree e marcatori.
 */
import { drawAxes, frame, type Frame } from '../axes';
import { listText, plainLabel, Svg, type Ctx, type Drawn, type Pt, type Tone } from '../core';
import type { DiagramParams } from '../schemas';

type P<K extends keyof DiagramParams> = DiagramParams[K];

const SERIES_TONES: Tone[] = ['accent', 'danger', 'info', 'success', 'warning', 'accent2'];

/** Estremi con un margine; mai un intervallo nullo. */
function padExtent(vals: number[], include0 = true): [number, number] {
  const f = vals.filter(Number.isFinite);
  let lo = Math.min(...f, include0 ? 0 : Infinity);
  let hi = Math.max(...f, include0 ? 0 : -Infinity);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
  if (hi - lo < 1e-12) {
    lo -= 1;
    hi += 1;
  }
  const m = (hi - lo) * 0.08;
  return [lo < 0 || !include0 ? lo - m : lo, hi + m];
}

/** Spezza una polilinea dove esce dal riquadro verticale. */
function clipped(pts: Pt[], y0: number, y1: number): Pt[][] {
  const out: Pt[][] = [];
  let cur: Pt[] = [];
  for (const p of pts) {
    if (Number.isFinite(p[1]) && p[1] >= y0 - 0.5 && p[1] <= y1 + 0.5) cur.push(p);
    else {
      if (cur.length > 1) out.push(cur);
      cur = [];
    }
  }
  if (cur.length > 1) out.push(cur);
  return out;
}

// ------------------------------------------------------------- x(t), v(t), a(t)
export function motionGraphs(p: P<'motion-graphs'>, c: Ctx): Drawn {
  const show = p.show ?? ['x', 'v', 'a'];
  const ts: number[] = [];
  const xs: number[] = [];
  const vs: number[] = [];
  const as: number[] = [];
  const breaks: number[] = [0];
  let t = 0;
  let x = p.x0 ?? 0;
  let v = p.v0 ?? 0;
  for (const seg of p.segments) {
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const dt = (seg.duration * i) / n;
      ts.push(t + dt);
      xs.push(x + v * dt + (seg.a * dt * dt) / 2);
      vs.push(v + seg.a * dt);
      as.push(seg.a);
    }
    x += v * seg.duration + (seg.a * seg.duration ** 2) / 2;
    v += seg.a * seg.duration;
    t += seg.duration;
    breaks.push(t);
  }
  const panelH = 120;
  const gap = 48;
  const W = 440;
  const s = new Svg(W, show.length * (panelH + gap) + 12);
  const fmt = (n: number): string => c.num(n, 3);
  const meta = {
    x: { ys: xs, label: 'x', unit: 'm', tone: 'accent' as Tone },
    v: { ys: vs, label: 'v', unit: 'm/s', tone: 'info' as Tone },
    a: { ys: as, label: 'a', unit: 'm/s²', tone: 'danger' as Tone },
  };
  show.forEach((k, i) => {
    const m = meta[k];
    const f: Frame = frame(
      { x: 58, y: 30 + i * (panelH + gap), w: W - 110, h: panelH },
      [0, t],
      padExtent(m.ys),
    );
    for (const b of breaks.slice(1, -1))
      s.line(f.sx(b), f.box.y, f.sx(b), f.box.y + f.box.h, { tone: 'faint', width: 1, dash: '3 4' });
    drawAxes(s, f, { xLabel: 't', xUnit: 's', yLabel: m.label, yUnit: m.unit, fmt });
    const pts: Pt[] = ts.map((tt, j) => [f.sx(tt), f.sy(m.ys[j]!)]);
    // a(t) a gradini: segmenti verticali alle discontinuità
    s.polyline(pts, { tone: m.tone, width: 2.2 });
  });
  const segText = p.segments.map((g, i) =>
    c.L(
      `tratto ${i + 1}: ${c.num(g.duration)} s con a = ${c.num(g.a)} m/s²`,
      `segment ${i + 1}: ${c.num(g.duration)} s with a = ${c.num(g.a)} m/s²`,
    ),
  );
  return {
    svg: s,
    title: c.L('Grafici del moto', 'Motion graphs'),
    description:
      c.L(
        `Grafici ${listText(
          show.map((k) => `${k}(t)`),
          'it',
        )} di un moto rettilineo a tratti con accelerazione costante, partendo da x₀ = ${c.num(p.x0 ?? 0)} m e v₀ = ${c.num(p.v0 ?? 0)} m/s; `,
        `Graphs of ${listText(
          show.map((k) => `${k}(t)`),
          'en',
        )} for piecewise uniformly accelerated straight-line motion, starting from x₀ = ${c.num(p.x0 ?? 0)} m and v₀ = ${c.num(p.v0 ?? 0)} m/s; `,
      ) +
      segText.join('; ') +
      c.L(
        `. Alla fine x = ${c.num(x)} m e v = ${c.num(v)} m/s.`,
        `. At the end x = ${c.num(x)} m and v = ${c.num(v)} m/s.`,
      ),
  };
}

// --------------------------------------------------------------- grafico generico
type Series = P<'function-plot'>['series'][number];

function evalSeries(sr: Series, x: number): number {
  switch (sr.kind) {
    case 'poly':
      return sr.coeffs.reduceRight((acc, a) => acc * x + a, 0);
    case 'sin':
      return (sr.offset ?? 0) + sr.amp * Math.sin((sr.omega ?? 1) * x + (sr.phase ?? 0));
    case 'exp':
      return sr.a * Math.exp(sr.b * x) + (sr.c ?? 0);
    case 'damped':
      return (
        (sr.offset ?? 0) + sr.amp * Math.exp(-sr.alpha * x) * Math.cos((sr.omega ?? 0) * x + (sr.phase ?? 0))
      );
    default:
      return NaN;
  }
}

function sampleSeries(sr: Series, x0: number, x1: number, n = 240): Array<[number, number]> {
  if (sr.kind === 'points') return sr.points.map(([a, b]) => [a, b]);
  const out: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    out.push([x, evalSeries(sr, x)]);
  }
  return out;
}

function seriesText(sr: Series, c: Ctx): string {
  const lab = sr.label ? `${plainLabel(sr.label)}: ` : '';
  switch (sr.kind) {
    case 'poly':
      return (
        lab +
        c.L(`polinomio di grado ${sr.coeffs.length - 1}`, `polynomial of degree ${sr.coeffs.length - 1}`)
      );
    case 'sin':
      return lab + c.L(`sinusoide di ampiezza ${c.num(sr.amp)}`, `sinusoid of amplitude ${c.num(sr.amp)}`);
    case 'exp':
      return (
        lab +
        c.L(
          sr.b < 0 ? 'esponenziale decrescente' : 'esponenziale crescente',
          sr.b < 0 ? 'decaying exponential' : 'growing exponential',
        )
      );
    case 'damped':
      return (
        lab +
        (sr.omega
          ? c.L(
              `oscillazione smorzata (α = ${c.num(sr.alpha)}, ω = ${c.num(sr.omega)}) attorno a ${c.num(sr.offset ?? 0)}`,
              `damped oscillation (α = ${c.num(sr.alpha)}, ω = ${c.num(sr.omega)}) around ${c.num(sr.offset ?? 0)}`,
            )
          : c.L(
              `esponenziale con α = ${c.num(sr.alpha)} verso ${c.num(sr.offset ?? 0)}`,
              `exponential with α = ${c.num(sr.alpha)} towards ${c.num(sr.offset ?? 0)}`,
            ))
      );
    default:
      return (
        lab + c.L(`spezzata per ${sr.points.length} punti`, `polyline through ${sr.points.length} points`)
      );
  }
}

export function functionPlot(p: P<'function-plot'>, c: Ctx): Drawn {
  const W = 440;
  const Hh = 260;
  const s = new Svg(W, Hh);
  const samples = p.series.map((sr) => sampleSeries(sr, p.x.min, p.x.max));
  const yd: [number, number] =
    p.y?.min !== undefined && p.y?.max !== undefined
      ? [p.y.min, p.y.max]
      : (() => {
          const auto = padExtent(samples.flatMap((pts) => pts.map((q) => q[1])));
          return [p.y?.min ?? auto[0], p.y?.max ?? auto[1]];
        })();
  const f = frame({ x: 56, y: 34, w: W - 104, h: Hh - 78 }, [p.x.min, p.x.max], yd);
  const fmt = (n: number): string => c.num(n, 3);
  if (p.area) {
    const sr = p.series[p.area.series]!;
    const a = Math.max(p.x.min, Math.min(p.area.from, p.area.to));
    const b = Math.min(p.x.max, Math.max(p.area.from, p.area.to));
    const base = Math.min(Math.max(0, yd[0]), yd[1]);
    const pts: Pt[] = [[f.sx(a), f.sy(base)]];
    const src =
      sr.kind === 'points' ? sr.points.filter(([x]) => x >= a && x <= b) : sampleSeries(sr, a, b, 120);
    for (const [x, y] of src) pts.push([f.sx(x), f.sy(Math.min(yd[1], Math.max(yd[0], y)))]);
    pts.push([f.sx(b), f.sy(base)]);
    s.polygon(pts, { fill: 'soft', tone: 'accent', width: 0.6 });
    if (p.area.label)
      s.text(f.sx((a + b) / 2), (f.sy(base) + f.box.y + f.box.h) / 2 - 18, p.area.label, {
        italic: true,
        halo: true,
      });
  }
  drawAxes(s, f, {
    xLabel: p.x.label ?? 'x',
    xUnit: p.x.unit,
    yLabel: p.y?.label ?? 'y',
    yUnit: p.y?.unit,
    grid: p.grid !== false,
    fmt,
  });
  for (const l of p.vlines ?? []) {
    s.line(f.sx(l.x), f.box.y, f.sx(l.x), f.box.y + f.box.h, { tone: 'muted', width: 1, dash: '5 4' });
    if (l.label)
      s.text(f.sx(l.x) + 4, f.box.y + 4, l.label, { anchor: 'start', italic: true, size: 12, halo: true });
  }
  for (const l of p.hlines ?? []) {
    s.line(f.box.x, f.sy(l.y), f.box.x + f.box.w, f.sy(l.y), { tone: 'muted', width: 1, dash: '5 4' });
    if (l.label)
      s.text(f.box.x + f.box.w - 2, f.sy(l.y) - 10, l.label, {
        anchor: 'end',
        italic: true,
        size: 12,
        halo: true,
      });
  }
  p.series.forEach((sr, i) => {
    const tone = sr.tone ?? SERIES_TONES[i % SERIES_TONES.length]!;
    const pts: Pt[] = samples[i]!.map(([x, y]) => [f.sx(x), f.sy(y)]);
    const parts = clipped(pts, f.box.y, f.box.y + f.box.h);
    for (const part of parts) s.polyline(part, { tone, width: 2.2, ...(sr.dash ? { dash: '7 5' } : {}) });
    if (sr.label && parts.length) {
      const last = parts[parts.length - 1]!;
      const q = last[Math.max(0, last.length - 1 - Math.floor(last.length * 0.08))]!;
      s.text(q[0], q[1] - 14, sr.label, { italic: true, size: 13, halo: true });
    }
  });
  for (const m of p.markers ?? []) {
    s.dot(f.sx(m.x), f.sy(m.y), 3.6);
    if (m.label) s.text(f.sx(m.x) + 8, f.sy(m.y) - 12, m.label, { anchor: 'start', size: 12, halo: true });
  }
  return {
    svg: s,
    title: c.L('Grafico', 'Graph'),
    description:
      c.L(
        `Grafico di ${plainLabel(p.y?.label ?? 'y')} in funzione di ${plainLabel(p.x.label ?? 'x')} per ${plainLabel(p.x.label ?? 'x')} da ${c.num(p.x.min)} a ${c.num(p.x.max)}${p.x.unit ? ` ${p.x.unit}` : ''}: `,
        `Graph of ${plainLabel(p.y?.label ?? 'y')} against ${plainLabel(p.x.label ?? 'x')} for ${plainLabel(p.x.label ?? 'x')} from ${c.num(p.x.min)} to ${c.num(p.x.max)}${p.x.unit ? ` ${p.x.unit}` : ''}: `,
      ) +
      listText(
        p.series.map((sr) => seriesText(sr, c)),
        c.lang,
      ) +
      (p.area
        ? c.L(
            `; area evidenziata tra ${c.num(p.area.from)} e ${c.num(p.area.to)}`,
            `; shaded area between ${c.num(p.area.from)} and ${c.num(p.area.to)}`,
          )
        : '') +
      (p.markers?.length
        ? c.L(`; ${p.markers.length} punti evidenziati`, `; ${p.markers.length} marked points`)
        : '') +
      '.',
  };
}
