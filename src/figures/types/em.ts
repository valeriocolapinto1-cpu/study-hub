/**
 * Elettromagnetismo: cariche puntiformi con linee di campo ed equipotenziali,
 * condensatori (piano, sferico, cilindrico), campo B di filo, spira e solenoide
 * con la regola della mano destra. Linee di campo integrate con `src/sim/field.ts`.
 */
import {
  pointSourcesField,
  pointSourcesPotential,
  seedsAround,
  streamline,
  wiresMagneticField,
  type Bounds,
  type Field,
  type PointSource,
  type Vec,
} from '../../sim/field';
import { listText, midArrow, plainLabel, Svg, type Ctx, type Drawn, type Pt, type Tone } from '../core';
import type { DiagramParams } from '../schemas';

type P<K extends keyof DiagramParams> = DiagramParams[K];

/** Curve di livello (marching squares) unite in polilinee. */
export function contours(
  f: (x: number, y: number) => number,
  b: Bounds,
  nx: number,
  ny: number,
  level: number,
): Vec[][] {
  const dx = (b.xMax - b.xMin) / nx;
  const dy = (b.yMax - b.yMin) / ny;
  const val: number[][] = [];
  for (let i = 0; i <= nx; i++) {
    val.push([]);
    for (let j = 0; j <= ny; j++) val[i]!.push(f(b.xMin + i * dx, b.yMin + j * dy) - level);
  }
  const segs: Array<[Vec, Vec]> = [];
  const interp = (x0: number, y0: number, v0: number, x1: number, y1: number, v1: number): Vec => {
    // stesso ordine degli estremi da entrambe le celle: punti identici, segmenti unibili
    if (x1 < x0 || (x1 === x0 && y1 < y0)) return interp(x1, y1, v1, x0, y0, v0);
    const t = v0 / (v0 - v1);
    return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
  };
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++) {
      const x0 = b.xMin + i * dx;
      const y0 = b.yMin + j * dy;
      const x1 = b.xMin + (i + 1) * dx;
      const y1 = b.yMin + (j + 1) * dy;
      const v = [val[i]![j]!, val[i + 1]![j]!, val[i + 1]![j + 1]!, val[i]![j + 1]!];
      if (v.some((q) => !Number.isFinite(q))) continue;
      const corners: Vec[] = [
        [x0, y0],
        [x1, y0],
        [x1, y1],
        [x0, y1],
      ];
      const cross: Vec[] = [];
      for (let k = 0; k < 4; k++) {
        const a = v[k]!;
        const c2 = v[(k + 1) % 4]!;
        if (a < 0 !== c2 < 0)
          cross.push(
            interp(corners[k]![0], corners[k]![1], a, corners[(k + 1) % 4]![0], corners[(k + 1) % 4]![1], c2),
          );
      }
      if (cross.length === 2) segs.push([cross[0]!, cross[1]!]);
      else if (cross.length === 4) {
        segs.push([cross[0]!, cross[1]!], [cross[2]!, cross[3]!]);
      }
    }
  // unione dei segmenti per estremi coincidenti
  const key = (p: Vec): string => `${Math.round((p[0] / dx) * 1e4)},${Math.round((p[1] / dy) * 1e4)}`;
  // via i segmenti degeneri (contorno che passa esattamente per un vertice della griglia)
  for (let i = segs.length - 1; i >= 0; i--) if (key(segs[i]![0]) === key(segs[i]![1])) segs.splice(i, 1);
  const byEnd = new Map<string, number[]>();
  segs.forEach((s, i) => {
    for (const p of s) {
      const k = key(p);
      byEnd.set(k, [...(byEnd.get(k) ?? []), i]);
    }
  });
  const used = new Set<number>();
  const lines: Vec[][] = [];
  for (let i = 0; i < segs.length; i++) {
    if (used.has(i)) continue;
    used.add(i);
    const line: Vec[] = [segs[i]![0], segs[i]![1]];
    for (const end of [1, 0]) {
      for (;;) {
        const tip = end ? line[line.length - 1]! : line[0]!;
        const next = (byEnd.get(key(tip)) ?? []).find((j) => !used.has(j));
        if (next === undefined) break;
        used.add(next);
        const s = segs[next]!;
        const other = key(s[0]) === key(tip) ? s[1] : s[0];
        if (end) line.push(other);
        else line.unshift(other);
      }
    }
    lines.push(line);
  }
  return lines;
}

/** Trasformazione mondo → schermo con scala uniforme. */
function viewport(
  b: Bounds,
  w: number,
  h: number,
  pad = 10,
): { X: (x: number) => number; Y: (y: number) => number; k: number } {
  const k = Math.min((w - 2 * pad) / (b.xMax - b.xMin), (h - 2 * pad) / (b.yMax - b.yMin));
  const ox = (w - k * (b.xMax - b.xMin)) / 2;
  const oy = (h - k * (b.yMax - b.yMin)) / 2;
  return { X: (x) => ox + (x - b.xMin) * k, Y: (y) => h - oy - (y - b.yMin) * k, k };
}

// -------------------------------------------------------------- cariche puntiformi
export function pointCharges(p: P<'point-charges'>, c: Ctx): Drawn {
  const W = 420;
  const H = 320;
  const qs: PointSource[] = p.charges.map((q) => ({ x: q.x, y: q.y, q: q.q }));
  let b: Bounds;
  if (p.bounds) b = p.bounds;
  else {
    const xs = qs.map((q) => q.x);
    const ys = qs.map((q) => q.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1);
    const hw = span * 0.5 + span * 0.9 + 0.5;
    const hh = (hw * H) / W;
    b = { xMin: cx - hw, xMax: cx + hw, yMin: cy - hh, yMax: cy + hh };
  }
  const v = viewport(b, W, H, 4);
  const s = new Svg(W, H);
  const span = Math.max(b.xMax - b.xMin, b.yMax - b.yMin);
  const E = pointSourcesField(qs, 1, 2, 1e-9);
  const toScreen = (pts: Vec[]): Pt[] => pts.map(([x, y]) => [v.X(x), v.Y(y)]);
  // equipotenziali
  const ne = p.equipotentials ?? 4;
  if (ne > 0) {
    const V = pointSourcesPotential(qs, 1, 2, 1e-9);
    const qmax = Math.max(...qs.map((q) => Math.abs(q.q)));
    const levels: number[] = [];
    for (let j = 0; j < ne; j++) {
      const r = span * 0.05 * 1.55 ** j;
      if (qs.some((q) => q.q > 0)) levels.push(qmax / r);
      if (qs.some((q) => q.q < 0)) levels.push(-qmax / r);
    }
    if (
      qs.some((q) => q.q > 0) &&
      qs.some((q) => q.q < 0) &&
      Math.abs(qs.reduce((a, q) => a + q.q, 0)) < 1e-9
    )
      levels.push(0);
    for (const lv of levels)
      for (const line of contours(V, b, 84, 64, lv))
        if (line.length > 3) s.polyline(toScreen(line), { tone: 'muted', width: 1, dash: '1 4' });
  }
  // linee di campo
  const nl = p.lines ?? 8;
  if (nl > 0) {
    const sinkR = span * 0.012;
    const opts = {
      bounds: b,
      step: span / 260,
      maxSteps: 1400,
      sinks: qs.map((q) => ({ x: q.x, y: q.y, r: sinkR })),
    };
    const hasPos = qs.some((q) => q.q > 0);
    const s0 = seedsAround(qs, nl, span * 0.02);
    for (const sd of s0) {
      const neg = sd.direction === -1;
      let line = streamline(E, sd.seed, { ...opts, direction: sd.direction });
      if (neg && hasPos) {
        const end = line[line.length - 1]!;
        if (qs.some((q) => q.q > 0 && Math.hypot(end[0] - q.x, end[1] - q.y) < sinkR * 1.5)) continue;
      }
      if (neg) line = line.slice().reverse();
      const pts = toScreen(line);
      s.polyline(pts, { tone: 'accent', width: 1.3 });
      midArrow(s, pts, 'accent', neg ? 0.75 : 0.25, 7);
    }
  }
  if (p.testPoint) {
    const [ex, ey] = E(p.testPoint.x, p.testPoint.y);
    const m = Math.hypot(ex, ey) || 1;
    const x = v.X(p.testPoint.x);
    const y = v.Y(p.testPoint.y);
    s.arrow(x, y, x + (ex / m) * 54, y - (ey / m) * 54, { tone: 'danger', width: 2.4 });
    s.text(x + (ex / m) * 68, y - (ey / m) * 68, 'E', { italic: true, size: 14, halo: true });
    s.dot(x, y, 3.4);
    if (p.testPoint.label) s.text(x - 10, y + 14, p.testPoint.label, { halo: true, size: 12 });
  }
  for (const q of p.charges) {
    const x = v.X(q.x);
    const y = v.Y(q.y);
    const tone: Tone = q.q > 0 ? 'danger' : 'info';
    s.circle(x, y, 11, { fill: 'surface', tone, width: 2.4 });
    s.text(x, y - 0.5, q.q > 0 ? '+' : '−', { size: 16, weight: 700 });
    if (q.label) s.text(x + 15, y - 16, q.label, { anchor: 'start', italic: true, size: 13, halo: true });
  }
  const desc = p.charges.map(
    (q) =>
      `${q.label ? `${plainLabel(q.label)} ` : ''}${q.q > 0 ? '+' : '−'}${c.num(Math.abs(q.q))} ${c.L('in', 'at')} (${c.num(q.x)}; ${c.num(q.y)})`,
  );
  return {
    svg: s,
    title:
      p.charges.length === 1
        ? c.L('Campo di una carica puntiforme', 'Field of a point charge')
        : c.L('Campo di cariche puntiformi', 'Field of point charges'),
    description:
      c.L(`Cariche: ${listText(desc, 'it')}.`, `Charges: ${listText(desc, 'en')}.`) +
      (nl > 0
        ? c.L(
            ' Le linee di campo escono dalle cariche positive ed entrano in quelle negative.',
            ' Field lines leave positive charges and end on negative ones.',
          )
        : '') +
      (ne > 0
        ? c.L(
            ' Le linee punteggiate sono equipotenziali, perpendicolari alle linee di campo.',
            ' Dotted curves are equipotentials, perpendicular to the field lines.',
          )
        : '') +
      (p.testPoint
        ? c.L(
            ' Nel punto evidenziato è disegnato il verso del campo E.',
            ' The direction of E is drawn at the marked point.',
          )
        : ''),
  };
}

// -------------------------------------------------------------------- condensatori
export function capacitor(p: P<'capacitor'>, c: Ctx): Drawn {
  const field = p.field !== false;
  const charges = p.charges !== false;
  const geo = p.geometry;
  let s: Svg;
  if (geo === 'parallel') {
    s = new Svg(380, 290);
    const xl = 130;
    const xr = 250;
    const y1 = 66;
    const y2 = 226;
    const diel = p.dielectric ?? 'none';
    if (diel !== 'none') {
      const w = diel === 'full' ? xr - xl : (xr - xl) / 2;
      s.rect(xl, y1, w, y2 - y1, { fill: 'surface2', tone: 'faint', width: 1 });
      s.text(xl + w / 2, y2 - 14, 'ε_r', { italic: true, size: 13 });
    }
    if (field) {
      const n = 6;
      for (let i = 0; i < n; i++) {
        const y = y1 + 14 + ((y2 - y1 - 28) * i) / (n - 1);
        s.arrow(xl + 8, y, xr - 8, y, { tone: 'accent', width: 1.4 });
      }
      if (p.fringe) {
        for (const [yy, sg] of [
          [y1, -1],
          [y2, 1],
        ] as const) {
          s.path(
            `M${xl + 4} ${yy + sg * 2}C${xl + 30} ${yy + sg * 34} ${xr - 30} ${yy + sg * 34} ${xr - 4} ${yy + sg * 2}`,
            { tone: 'accent', width: 1.1, dash: '4 3' },
          );
        }
      }
      s.text((xl + xr) / 2, y1 - 12, 'E', { italic: true, size: 14, halo: true });
    }
    s.rect(xl - 6, y1, 6, y2 - y1, { fill: 'ink', tone: 'ink', width: 1 });
    s.rect(xr, y1, 6, y2 - y1, { fill: 'ink', tone: 'ink', width: 1 });
    if (charges) {
      for (let i = 0; i < 7; i++) {
        const y = y1 + 10 + ((y2 - y1 - 20) * i) / 6;
        s.text(xl - 16, y, '+', { size: 14, weight: 700 });
        s.text(xr + 16, y, '−', { size: 14, weight: 700 });
      }
    }
    // generatore
    const top = 26;
    s.polyline(
      [
        [xl - 3, y1],
        [xl - 3, top],
        [176, top],
      ],
      { width: 1.4 },
    );
    s.polyline(
      [
        [xr + 3, y1],
        [xr + 3, top],
        [204, top],
      ],
      { width: 1.4 },
    );
    s.line(176, top - 13, 176, top + 13, { width: 1.8 });
    s.line(186, top - 7, 186, top + 7, { width: 3 });
    s.line(194, top - 13, 194, top + 13, { width: 1.8 });
    s.line(204, top - 7, 204, top + 7, { width: 3 });
    s.text(170, top - 18, '+', { size: 12, muted: true });
    s.text(232, top - 14, p.voltageLabel ?? 'ΔV', { italic: true, size: 13, anchor: 'start' });
    s.dimension(xl, y2 + 30, xr, y2 + 30, p.dLabel ?? 'd');
    s.text(xl - 40, y1 + 12, p.areaLabel ?? 'A', { italic: true, size: 13 });
  } else {
    const cyl = geo === 'cylindrical';
    s = new Svg(cyl ? 470 : 300, 290);
    const O: Pt = [150, 150];
    const a = 46;
    const b = 112;
    s.circle(O[0], O[1], b, { width: 4, fill: 'none' });
    s.circle(O[0], O[1], a, { fill: 'surface2', width: 2 });
    if (field) {
      for (let i = 0; i < 12; i++) {
        const t = (i * Math.PI) / 6 + Math.PI / 12;
        s.arrow(
          O[0] + (a + 6) * Math.cos(t),
          O[1] - (a + 6) * Math.sin(t),
          O[0] + (b - 8) * Math.cos(t),
          O[1] - (b - 8) * Math.sin(t),
          { tone: 'accent', width: 1.3 },
        );
      }
    }
    if (charges) {
      for (let i = 0; i < 12; i++) {
        const t = (i * Math.PI) / 6;
        s.text(O[0] + (a - 12) * Math.cos(t), O[1] - (a - 12) * Math.sin(t), '+', { size: 13, weight: 700 });
        s.text(O[0] + (b - 12) * Math.cos(t), O[1] - (b - 12) * Math.sin(t), '−', {
          size: 13,
          weight: 700,
          halo: true,
        });
      }
    }
    const t1 = -Math.PI / 2 - 0.5;
    s.dot(O[0], O[1], 2.6);
    s.line(O[0], O[1], O[0] + a * Math.cos(t1), O[1] - a * Math.sin(t1), { width: 1, tone: 'muted' });
    s.text(O[0] + a * 0.5 * Math.cos(t1) - 12, O[1] - a * 0.5 * Math.sin(t1), p.innerLabel ?? 'a', {
      italic: true,
      halo: true,
    });
    const t2 = Math.PI * 1.08;
    s.line(O[0], O[1], O[0] + b * Math.cos(t2), O[1] - b * Math.sin(t2), { width: 1, tone: 'muted' });
    s.text(O[0] + b * 0.78 * Math.cos(t2), O[1] - b * 0.78 * Math.sin(t2) - 12, p.outerLabel ?? 'b', {
      italic: true,
      halo: true,
    });
    if (cyl) {
      // vista laterale: conduttore interno e guscio esterno coassiali
      const x0 = 300;
      const x1 = 450;
      const cy = 150;
      s.rect(x0, cy - 60, x1 - x0, 120, { width: 3, fill: 'none', rx: 2 });
      s.rect(x0, cy - 25, x1 - x0, 50, { width: 1.6, fill: 'surface2' });
      s.line(x0, cy, x1, cy, { tone: 'muted', width: 1, dash: '6 4' });
      s.dimension(x0, cy + 84, x1, cy + 84, 'L');
      s.text((x0 + x1) / 2, cy - 76, c.L('vista laterale', 'side view'), { muted: true, size: 11 });
      s.text(150, 18, c.L('sezione', 'cross-section'), { muted: true, size: 11 });
    }
  }
  const name =
    geo === 'parallel'
      ? c.L('Condensatore piano', 'Parallel-plate capacitor')
      : geo === 'spherical'
        ? c.L('Condensatore sferico', 'Spherical capacitor')
        : c.L('Condensatore cilindrico', 'Cylindrical capacitor');
  const desc =
    geo === 'parallel'
      ? c.L(
          `Due armature piane parallele di area ${plainLabel(p.areaLabel ?? 'A')} a distanza ${plainLabel(p.dLabel ?? 'd')}, collegate a un generatore di tensione ${plainLabel(p.voltageLabel ?? 'ΔV')}: l'armatura di sinistra è positiva, quella di destra negativa.${field ? ' Il campo E tra le armature è uniforme e va dalla positiva alla negativa.' : ''}${p.fringe ? ' Ai bordi le linee si incurvano (effetti di bordo).' : ''}${p.dielectric === 'full' ? ' Lo spazio è riempito da un dielettrico.' : p.dielectric === 'half' ? ' Metà dello spessore è occupata da una lastra di dielettrico.' : ''}`,
          `Two parallel plates of area ${plainLabel(p.areaLabel ?? 'A')} a distance ${plainLabel(p.dLabel ?? 'd')} apart, connected to a source ${plainLabel(p.voltageLabel ?? 'ΔV')}: the left plate is positive, the right one negative.${field ? ' The field E between the plates is uniform, from the positive to the negative plate.' : ''}${p.fringe ? ' Field lines bend at the edges (fringe effects).' : ''}${p.dielectric === 'full' ? ' The gap is filled with a dielectric.' : p.dielectric === 'half' ? ' A dielectric slab fills half of the gap thickness.' : ''}`,
        )
      : c.L(
          `${geo === 'spherical' ? 'Sezione di due sfere conduttrici concentriche' : 'Sezione di due conduttori cilindrici coassiali'} di raggi ${plainLabel(p.innerLabel ?? 'a')} (interno, carica positiva) e ${plainLabel(p.outerLabel ?? 'b')} (esterno, carica negativa).${field ? ' Il campo E è radiale, diretto verso l’esterno e presente solo tra i due conduttori.' : ''}${geo === 'cylindrical' ? ' A destra la vista laterale, di lunghezza L.' : ''}`,
          `${geo === 'spherical' ? 'Cross-section of two concentric conducting spheres' : 'Cross-section of two coaxial conducting cylinders'} with radii ${plainLabel(p.innerLabel ?? 'a')} (inner, positive) and ${plainLabel(p.outerLabel ?? 'b')} (outer, negative).${field ? ' The field E is radial, pointing outwards, and exists only between the conductors.' : ''}${geo === 'cylindrical' ? ' Side view of length L on the right.' : ''}`,
        );
  return { svg: s, title: name, description: desc };
}

// ------------------------------------------------------------------- campo magnetico
/** Simbolo di corrente perpendicolare al foglio: ⊙ uscente, ⊗ entrante. */
function perp(s: Svg, x: number, y: number, out: boolean, r = 9, tone: Tone = 'ink'): void {
  s.circle(x, y, r, { fill: 'surface', tone, width: 1.6 });
  if (out) s.dot(x, y, r * 0.28, tone);
  else {
    const d = r * 0.55;
    s.line(x - d, y - d, x + d, y + d, { tone, width: 1.6 });
    s.line(x - d, y + d, x + d, y - d, { tone, width: 1.6 });
  }
}

/** Linea di campo chiusa (o fino al bordo) da un seme, nei due versi. */
function closedLine(F: Field, seed: Vec, opts: Parameters<typeof streamline>[2]): Vec[] {
  const fwd = streamline(F, seed, { ...opts, direction: 1 });
  // si chiude se torna vicino al seme
  const step = opts.step ?? 0.02;
  for (let i = 30; i < fwd.length; i++) {
    if (Math.hypot(fwd[i]![0] - seed[0], fwd[i]![1] - seed[1]) < step * 1.2)
      return [...fwd.slice(0, i), seed];
  }
  const back = streamline(F, seed, { ...opts, direction: -1 });
  return [...back.slice(1).reverse(), ...fwd];
}

/** Inserto "regola della mano destra": pollice dritto, dita che si chiudono. */
function rightHand(s: Svg, x: number, y: number, thumb: string, curl: string, c: Ctx): void {
  s.rect(x, y, 112, 116, { tone: 'faint', width: 1, rx: 8, fill: 'surface' });
  const cx = x + 50;
  const cy = y + 62;
  s.path(`M${cx - 26} ${cy}A26 9 0 0 0 ${cx + 26} ${cy}`, { tone: 'accent', width: 1.6 });
  s.path(`M${cx + 26} ${cy}A26 9 0 0 0 ${cx - 26} ${cy}`, { tone: 'accent', width: 1.2, dash: '3 3' });
  s.head(cx + 4, cy + 9, 1, 0, 8, 'accent');
  s.arrow(cx, cy + 30, cx, cy - 36, { tone: 'danger', width: 2.6 });
  s.text(cx + 10, cy - 34, thumb, { italic: true, anchor: 'start', size: 13 });
  s.text(cx + 32, cy + 4, curl, { italic: true, anchor: 'start', size: 13 });
  s.text(x + 56, y + 108, c.L('mano destra', 'right hand'), { muted: true, size: 10 });
}

/** Cerchio orientato (verso antiorario per chi guarda il foglio se `ccw`). */
function ring(s: Svg, O: Pt, r: number, ccw: boolean, tone: Tone = 'accent', width = 1.3): void {
  s.circle(O[0], O[1], r, { tone, width });
  s.head(O[0] + r, O[1], 0, ccw ? -1 : 1, 9, tone);
  s.head(O[0] - r, O[1], 0, ccw ? 1 : -1, 9, tone);
}

/** Sorgenti aggiunte per Fisica II: coppia di fili, cavo coassiale, toroide, filo a U. */
function magneticExtra(p: P<'magnetic-field'>, c: Ctx): Drawn | null {
  const pos = p.current !== 'negative';
  const I = p.currentLabel ?? 'I';
  const Bl = p.fieldLabel ?? 'B';
  const lines = p.fieldLines !== false;
  if (p.source === 'wire-pair') {
    const W = 400;
    const H = 280;
    const s = new Svg(W, H);
    const pos2 = (p.current2 ?? p.current ?? 'positive') !== 'negative';
    const src: PointSource[] = [
      { x: -1, y: 0, q: pos ? 1 : -1 },
      { x: 1, y: 0, q: pos2 ? 1 : -1 },
    ];
    const b: Bounds = { xMin: -3.2, xMax: 3.2, yMin: -2.24, yMax: 2.24 };
    const v = viewport(b, W, H, 4);
    if (lines) {
      const F = wiresMagneticField(src, 1, 1e-4);
      const opts = {
        bounds: b,
        step: 0.02,
        maxSteps: 2400,
        sinks: src.map((q) => ({ x: q.x, y: q.y, r: 0.06 })),
      };
      const seeds =
        pos === pos2 ? [-2.7, -2.1, -1.5, -0.55, 0.55, 1.5, 2.1, 2.7] : [-0.75, -0.5, -0.25, 0.25, 0.5, 0.75];
      for (const x0 of seeds) {
        const line = closedLine(F, [x0, 0], opts);
        const pts: Pt[] = line.map(([x, y]) => [v.X(x), v.Y(y)]);
        s.polyline(pts, { tone: 'accent', width: 1.2 });
        midArrow(s, pts, 'accent', 0.25, 8);
      }
    }
    const P1: Pt = [v.X(-1), v.Y(0)];
    const P2: Pt = [v.X(1), v.Y(0)];
    if (p.forces !== false) {
      const attract = pos === pos2;
      const d = attract ? 1 : -1;
      s.arrow(P1[0] + d * 14, P1[1] - 0, P1[0] + d * 58, P1[1], { tone: 'danger', width: 2.6 });
      s.arrow(P2[0] - d * 14, P2[1], P2[0] - d * 58, P2[1], { tone: 'danger', width: 2.6 });
      s.text(P1[0] + d * 40, P1[1] + 18, 'F', { italic: true, halo: true });
      s.text(P2[0] - d * 40, P2[1] + 18, 'F', { italic: true, halo: true });
    }
    perp(s, P1[0], P1[1], pos, 12, 'danger');
    perp(s, P2[0], P2[1], pos2, 12, 'danger');
    s.text(P1[0] - 6, P1[1] - 24, `${plainLabel(I) === 'I' ? 'I_1' : I}`, { italic: true, halo: true });
    s.text(P2[0] + 6, P2[1] - 24, 'I_2', { italic: true, halo: true });
    s.dimension(P1[0], H - 24, P2[0], H - 24, p.distanceLabel ?? 'd');
    const attract = pos === pos2;
    return {
      svg: s,
      title: c.L('Due fili paralleli percorsi da corrente', 'Two parallel current-carrying wires'),
      description: c.L(
        `Due fili paralleli perpendicolari al foglio, a distanza ${plainLabel(p.distanceLabel ?? 'd')}, con correnti ${attract ? 'nello stesso verso' : 'in versi opposti'} (${pos ? '⊙' : '⊗'} e ${pos2 ? '⊙' : '⊗'}). Linee del campo magnetico totale${p.forces !== false ? `; ciascun filo risente del campo dell'altro e i fili si ${attract ? 'attraggono' : 'respingono'}, con forza per unità di lunghezza μ₀ I₁ I₂ /(2π d)` : ''}.`,
        `Two parallel wires perpendicular to the page, ${plainLabel(p.distanceLabel ?? 'd')} apart, carrying currents ${attract ? 'in the same direction' : 'in opposite directions'} (${pos ? '⊙' : '⊗'} and ${pos2 ? '⊙' : '⊗'}). Lines of the total magnetic field${p.forces !== false ? `; each wire feels the other's field and the wires ${attract ? 'attract' : 'repel'}, with force per unit length μ₀ I₁ I₂ /(2π d)` : ''}.`,
      ),
    };
  }
  if (p.source === 'coax') {
    const s = new Svg(340, 320);
    const O: Pt = [170, 160];
    const [a, bb, cc] = [30, 82, 104];
    s.circle(O[0], O[1], cc, { tone: 'ink', width: 1.4, fill: 'soft' });
    s.circle(O[0], O[1], bb, { tone: 'ink', width: 1.4, fill: 'bg' });
    s.circle(O[0], O[1], a, { tone: 'ink', width: 1.4, fill: 'soft' });
    if (lines) {
      ring(s, O, 18, pos, 'accent', 1);
      ring(s, O, 50, pos, 'accent', 1.5);
      ring(s, O, 68, pos, 'accent', 1.5);
      ring(s, O, 93, pos, 'accent', 1);
    }
    perp(s, O[0], O[1], pos, 8, 'danger');
    for (const ang of [30, 150, 270]) {
      const t = (ang * Math.PI) / 180;
      perp(s, O[0] + 93 * Math.cos(t), O[1] - 93 * Math.sin(t), !pos, 6, 'danger');
    }
    const dim = (r: number, ang: number, lab: string): void => {
      const t = (ang * Math.PI) / 180;
      s.line(O[0], O[1], O[0] + r * Math.cos(t), O[1] - r * Math.sin(t), { tone: 'muted', width: 1 });
      s.text(O[0] + (r + 12) * Math.cos(t), O[1] - (r + 12) * Math.sin(t), lab, { italic: true, halo: true });
    };
    dim(a, 215, p.innerLabel ?? 'a');
    dim(bb, 250, p.outerLabel ?? 'b');
    dim(cc, 305, p.shellLabel ?? 'c');
    s.text(O[0] + 118, 22, `${plainLabel(Bl)} = 0`, { size: 12, halo: true });
    s.text(O[0] + 40, O[1] - 48, Bl, { italic: true, halo: true });
    return {
      svg: s,
      title: c.L('Cavo coassiale (sezione)', 'Coaxial cable (cross-section)'),
      description: c.L(
        `Sezione di un cavo coassiale: conduttore pieno di raggio ${plainLabel(p.innerLabel ?? 'a')} con corrente ${plainLabel(I)} ${pos ? 'uscente' : 'entrante'} e conduttore tubolare tra ${plainLabel(p.outerLabel ?? 'b')} e ${plainLabel(p.shellLabel ?? 'c')} con la stessa corrente in verso opposto. Le linee di ${plainLabel(Bl)} sono circonferenze ${pos ? 'antiorarie' : 'orarie'}: il campo cresce come r nel conduttore interno, vale μ₀I/(2πr) tra i conduttori, cala a zero nel tubo ed è nullo fuori.`,
        `Cross-section of a coaxial cable: solid conductor of radius ${plainLabel(p.innerLabel ?? 'a')} with current ${plainLabel(I)} ${pos ? 'out of' : 'into'} the page and tubular conductor between ${plainLabel(p.outerLabel ?? 'b')} and ${plainLabel(p.shellLabel ?? 'c')} carrying the same current the opposite way. The ${plainLabel(Bl)} lines are ${pos ? 'counter-clockwise' : 'clockwise'} circles: the field grows as r inside the inner conductor, equals μ₀I/(2πr) between the conductors, drops to zero across the tube and vanishes outside.`,
      ),
    };
  }
  if (p.source === 'toroid') {
    const s = new Svg(360, 330);
    const O: Pt = [180, 165];
    const r1 = 74;
    const r2 = 122;
    const rm = (r1 + r2) / 2;
    s.circle(O[0], O[1], r2, { tone: 'ink', width: 1.6, fill: 'surface2' });
    s.circle(O[0], O[1], r1, { tone: 'ink', width: 1.6, fill: 'bg' });
    const gap = p.gap === true;
    const g = 8;
    if (gap) {
      s.rect(O[0] + r1 - 3, O[1] - g, r2 - r1 + 6, 2 * g, { tone: 'faint', width: 0, fill: 'bg' });
      s.line(O[0] + r1, O[1] - g, O[0] + r2, O[1] - g, { width: 1.6 });
      s.line(O[0] + r1, O[1] + g, O[0] + r2, O[1] + g, { width: 1.6 });
      s.text(O[0] + r2 + 8, O[1] - 18, p.gapLabel ?? 'h', { italic: true, anchor: 'start', halo: true });
    }
    const n = p.turns ?? 12;
    for (let k = 0; k < n; k++) {
      const ang = 30 + (300 * (k + 0.5)) / n;
      const t = (ang * Math.PI) / 180;
      s.line(
        O[0] + (r1 - 5) * Math.cos(t),
        O[1] - (r1 - 5) * Math.sin(t),
        O[0] + (r2 + 5) * Math.cos(t),
        O[1] - (r2 + 5) * Math.sin(t),
        {
          tone: 'danger',
          width: 2,
        },
      );
    }
    if (lines) {
      s.circle(O[0], O[1], rm, { tone: 'accent', width: 1.6, dash: '7 4' });
      s.head(O[0], O[1] - rm, pos ? -1 : 1, 0, 10, 'accent');
      s.head(O[0], O[1] + rm, pos ? 1 : -1, 0, 10, 'accent');
      s.text(O[0] - 14, O[1] - rm + 18, Bl, { italic: true, halo: true });
    }
    s.line(O[0], O[1], O[0] - rm * Math.cos(Math.PI / 4), O[1] + rm * Math.sin(Math.PI / 4), {
      tone: 'muted',
      width: 1,
    });
    s.text(O[0] - 26, O[1] + 14, p.radiusLabel ?? 'R', { italic: true, halo: true });
    if (p.innerLabel) s.dimension(O[0] - r2, O[1] + 6, O[0] - r1, O[1] + 6, p.innerLabel, { offset: 0 });
    s.text(O[0], O[1] - 10, `N, ${plainLabel(I)}`, { italic: true, size: 12, muted: true });
    return {
      svg: s,
      title: gap ? c.L('Toroide con traferro', 'Toroid with an air gap') : c.L('Toroide', 'Toroid'),
      description: c.L(
        `Nucleo toroidale di raggio medio ${plainLabel(p.radiusLabel ?? 'R')} avvolto da N spire con corrente ${plainLabel(I)}. Le linee di ${plainLabel(Bl)} sono circonferenze dentro il nucleo; fuori il campo è nullo.${gap ? ` Il nucleo è interrotto da un traferro di spessore ${plainLabel(p.gapLabel ?? 'h')}: B è continuo attraverso il traferro, mentre H è μ_r volte più grande che nel ferro.` : ''}`,
        `Toroidal core of mean radius ${plainLabel(p.radiusLabel ?? 'R')} wound with N turns carrying current ${plainLabel(I)}. The ${plainLabel(Bl)} lines are circles inside the core; outside the field is zero.${gap ? ` The core is cut by an air gap of thickness ${plainLabel(p.gapLabel ?? 'h')}: B is continuous across the gap, while H is μ_r times larger than in the iron.` : ''}`,
      ),
    };
  }
  if (p.source === 'hairpin') {
    const s = new Svg(400, 270);
    const C: Pt = [250, 135];
    const R = 72;
    const cw = pos; // positivo = orario sul semicerchio
    s.line(20, C[1] - R, C[0], C[1] - R, { width: 2.6 });
    s.line(20, C[1] + R, C[0], C[1] + R, { width: 2.6 });
    s.line(4, C[1] - R, 20, C[1] - R, { width: 2.6, dash: '3 4' });
    s.line(4, C[1] + R, 20, C[1] + R, { width: 2.6, dash: '3 4' });
    s.path(`M${C[0]} ${C[1] - R}A${R} ${R} 0 0 1 ${C[0]} ${C[1] + R}`, { width: 2.6 });
    const d = cw ? 1 : -1;
    s.arrow(90 - d * 20, C[1] - R, 90 + d * 20, C[1] - R, { tone: 'danger', width: 2.6 });
    s.arrow(90 + d * 20, C[1] + R, 90 - d * 20, C[1] + R, { tone: 'danger', width: 2.6 });
    s.head(C[0] + R, C[1] + (cw ? 6 : -6), 0, d, 11, 'danger');
    s.text(90, C[1] - R - 16, I, { italic: true, halo: true });
    s.dot(C[0], C[1], 3);
    s.text(C[0] - 14, C[1] + 4, 'C', { italic: true, halo: true });
    s.line(C[0], C[1], C[0] + R * Math.cos(-0.6), C[1] - R * Math.sin(-0.6), { tone: 'muted', width: 1 });
    s.text(C[0] + 40, C[1] + 34, p.radiusLabel ?? 'R', { italic: true, halo: true });
    perp(s, C[0] + 30, C[1] - 22, !cw, 8, 'accent');
    s.text(C[0] + 48, C[1] - 22, Bl, { italic: true, anchor: 'start', halo: true });
    return {
      svg: s,
      title: c.L('Filo a U con semicerchio', 'U-shaped wire with a semicircle'),
      description: c.L(
        `Filo formato da due tratti rettilinei semi-infiniti paralleli e da un semicerchio di raggio ${plainLabel(p.radiusLabel ?? 'R')}, percorso dalla corrente ${plainLabel(I)} in senso ${cw ? 'orario' : 'antiorario'}. Nel centro C del semicerchio i contributi del semicerchio e dei due tratti rettilinei hanno lo stesso verso: ${plainLabel(Bl)} è ${cw ? 'entrante nel' : 'uscente dal'} foglio.`,
        `Wire made of two parallel semi-infinite straight segments and a semicircle of radius ${plainLabel(p.radiusLabel ?? 'R')}, carrying current ${plainLabel(I)} ${cw ? 'clockwise' : 'counter-clockwise'}. At the centre C of the semicircle the contributions of the semicircle and of the two straight segments point the same way: ${plainLabel(Bl)} points ${cw ? 'into' : 'out of'} the page.`,
      ),
    };
  }
  return null;
}

export function magneticField(p: P<'magnetic-field'>, c: Ctx): Drawn {
  const extra = magneticExtra(p, c);
  if (extra) return extra;
  const pos = p.current !== 'negative';
  const I = p.currentLabel ?? 'I';
  const Bl = p.fieldLabel ?? 'B';
  const lines = p.fieldLines !== false;
  let s: Svg;
  let desc: string;
  let title: string;
  if (p.source === 'wire-section') {
    s = new Svg(320, 300);
    const O: Pt = [170, 150];
    if (lines)
      for (const r of [42, 76, 112]) {
        s.circle(O[0], O[1], r, { tone: 'accent', width: 1.3 });
        // verso: antiorario se la corrente esce dal foglio
        s.head(O[0] + r, O[1], 0, pos ? -1 : 1, 9, 'accent');
        s.head(O[0] - r, O[1], 0, pos ? 1 : -1, 9, 'accent');
      }
    if (p.radiusLabel) {
      s.circle(O[0], O[1], 30, { tone: 'ink', width: 1.6, fill: 'soft' });
      s.line(O[0], O[1], O[0] - 21, O[1] + 21, { tone: 'muted', width: 1 });
      s.text(O[0] - 30, O[1] + 34, p.radiusLabel, { italic: true, halo: true });
    }
    perp(s, O[0], O[1], pos, 13, 'danger');
    s.text(O[0] + 20, O[1] - 18, I, { italic: true, size: 14, halo: true });
    s.text(O[0] + 76 * 0.72 + 10, O[1] - 76 * 0.72 - 6, Bl, { italic: true, size: 14, halo: true });
    if (p.rightHand) rightHand(s, 4, 4, I, Bl, c);
    title = c.L(
      'Campo magnetico di un filo rettilineo (sezione)',
      'Magnetic field of a straight wire (cross-section)',
    );
    desc = c.L(
      `Filo rettilineo perpendicolare al foglio con corrente ${plainLabel(I)} ${pos ? 'uscente' : 'entrante'}: le linee di ${plainLabel(Bl)} sono circonferenze concentriche percorse in senso ${pos ? 'antiorario' : 'orario'}, con intensità che diminuisce come 1/r.`,
      `Straight wire perpendicular to the page carrying current ${plainLabel(I)} ${pos ? 'out of' : 'into'} the page: the ${plainLabel(Bl)} lines are concentric circles running ${pos ? 'counter-clockwise' : 'clockwise'}, with magnitude decreasing as 1/r.`,
    );
  } else if (p.source === 'wire') {
    s = new Svg(400, 300);
    const x = 200;
    for (const y of [92, 196]) {
      if (!lines) break;
      // anello in prospettiva: metà posteriore tratteggiata
      s.path(`M${x - 70} ${y}A70 16 0 0 1 ${x + 70} ${y}`, { tone: 'accent', width: 1.1, dash: '4 4' });
      s.path(`M${x - 70} ${y}A70 16 0 0 0 ${x + 70} ${y}`, { tone: 'accent', width: 1.5 });
      s.head(x + 26 * (pos ? 1 : -1), y + 15.3, pos ? 1 : -1, 0, 9, 'accent');
    }
    s.line(x, 20, x, 280, { width: 3 });
    s.arrow(x, 160, x, pos ? 132 : 188, { tone: 'danger', width: 3, head: 12 });
    s.text(x + 14, 146, I, { italic: true, size: 14, anchor: 'start', halo: true });
    for (const y of [60, 144, 228]) {
      perp(s, x - 120, y, pos, 8, 'accent');
      perp(s, x + 120, y, !pos, 8, 'accent');
    }
    s.text(x + 150, 60, Bl, { italic: true, size: 14 });
    if (p.rightHand) rightHand(s, 4, 4, I, Bl, c);
    title = c.L('Campo magnetico di un filo rettilineo', 'Magnetic field of a straight wire');
    desc = c.L(
      `Filo verticale con corrente ${plainLabel(I)} verso ${pos ? "l'alto" : 'il basso'}: le linee di ${plainLabel(Bl)} sono circonferenze attorno al filo; nel piano del foglio il campo è uscente (⊙) a ${pos ? 'sinistra' : 'destra'} ed entrante (⊗) a ${pos ? 'destra' : 'sinistra'}.`,
      `Vertical wire with current ${plainLabel(I)} pointing ${pos ? 'up' : 'down'}: the ${plainLabel(Bl)} lines are circles around the wire; in the plane of the page the field points out (⊙) on the ${pos ? 'left' : 'right'} and in (⊗) on the ${pos ? 'right' : 'left'}.`,
    );
  } else {
    const sol = p.source === 'solenoid';
    const W = 440;
    const H = 300;
    s = new Svg(W, H);
    const n = sol ? (p.turns ?? 8) : 1;
    const R = 1;
    const pitch = 0.36;
    const src: PointSource[] = [];
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * pitch;
      src.push({ x, y: R, q: pos ? 1 : -1 }, { x, y: -R, q: pos ? -1 : 1 });
    }
    // per il solenoide il campo si calcola con una distribuzione fitta di correnti (foglio di
    // corrente): le spire disegnate sono poche, ma le linee devono essere quelle di un solenoide reale
    const field: PointSource[] = [];
    if (sol) {
      const len = (n - 1) * pitch;
      const m = n * 6;
      for (let i = 0; i < m; i++) {
        const x = -len / 2 + (len * i) / (m - 1);
        field.push({ x, y: R, q: pos ? 1 : -1 }, { x, y: -R, q: pos ? -1 : 1 });
      }
    } else field.push(...src);
    const half = Math.max(2.6, ((n - 1) / 2) * pitch + 1.6);
    const b: Bounds = { xMin: -half, xMax: half, yMin: (-half * H) / W, yMax: (half * H) / W };
    const v = viewport(b, W, H, 6);
    const F = wiresMagneticField(field, 1, 1e-4);
    if (lines) {
      const opts = {
        bounds: b,
        step: 0.02,
        maxSteps: 2400,
        sinks: field.map((q) => ({ x: q.x, y: q.y, r: 0.05 })),
      };
      for (const y0 of sol ? [0, 0.3, -0.3, 0.6, -0.6] : [0, 0.25, -0.25, 0.5, -0.5, 0.75, -0.75]) {
        const line = closedLine(F, [0, y0 * R], opts);
        const pts: Pt[] = line.map(([x, y]) => [v.X(x), v.Y(y)]);
        s.polyline(pts, { tone: 'accent', width: 1.3 });
        midArrow(s, pts, 'accent', 0.02, 8);
      }
    }
    if (sol) {
      const x0 = v.X(src[0]!.x) - 14;
      const x1 = v.X(src[src.length - 1]!.x) + 14;
      s.rect(x0, v.Y(R) - 4, x1 - x0, v.Y(-R) - v.Y(R) + 8, { tone: 'faint', width: 1, dash: '5 4', rx: 4 });
      const right = pos;
      s.text(x1 + 22, v.Y(0) - 16, right ? 'N' : 'S', { weight: 700, size: 15, halo: true });
      s.text(x0 - 22, v.Y(0) - 16, right ? 'S' : 'N', { weight: 700, size: 15, halo: true });
    } else {
      s.path(`M${v.X(0)} ${v.Y(R)}A16 ${(v.Y(-R) - v.Y(R)) / 2} 0 0 1 ${v.X(0)} ${v.Y(-R)}`, {
        tone: 'muted',
        width: 1.4,
      });
      s.path(`M${v.X(0)} ${v.Y(R)}A16 ${(v.Y(-R) - v.Y(R)) / 2} 0 0 0 ${v.X(0)} ${v.Y(-R)}`, {
        tone: 'muted',
        width: 1,
        dash: '3 3',
      });
    }
    for (const q of src) perp(s, v.X(q.x), v.Y(q.y), q.q > 0, sol ? 7 : 9, 'danger');
    s.text(v.X(src[0]!.x) - 16, v.Y(R) - 18, I, { italic: true, size: 14, halo: true });
    s.text(v.X(0) + (sol ? 0 : 40), v.Y(0) - 14, Bl, { italic: true, size: 14, halo: true });
    if (p.rightHand) rightHand(s, 4, 4, Bl, I, c);
    title = sol
      ? c.L('Campo magnetico di un solenoide', 'Magnetic field of a solenoid')
      : c.L('Campo magnetico di una spira', 'Magnetic field of a current loop');
    desc = sol
      ? c.L(
          `Sezione longitudinale di un solenoide di ${n} spire: corrente ${plainLabel(I)} uscente (⊙) dai conduttori in alto ed entrante (⊗) in basso${pos ? '' : ' (verso opposto)'}. Dentro il solenoide il campo ${plainLabel(Bl)} è quasi uniforme e parallelo all'asse, verso ${pos ? 'destra' : 'sinistra'}; fuori le linee si richiudono. Il polo nord è a ${pos ? 'destra' : 'sinistra'}.`,
          `Longitudinal section of a solenoid with ${n} turns: current ${plainLabel(I)} out of the page (⊙) in the top conductors and into it (⊗) at the bottom${pos ? '' : ' (reversed)'}. Inside, ${plainLabel(Bl)} is nearly uniform and parallel to the axis, pointing ${pos ? 'right' : 'left'}; outside, the lines close back. The north pole is on the ${pos ? 'right' : 'left'}.`,
        )
      : c.L(
          `Spira circolare vista di taglio: la corrente ${plainLabel(I)} esce dal foglio in alto (⊙) ed entra in basso (⊗)${pos ? '' : ' (verso opposto)'}. Le linee di ${plainLabel(Bl)} si avvolgono attorno ai conduttori e al centro della spira sono parallele all'asse, verso ${pos ? 'destra' : 'sinistra'}.`,
          `Circular loop seen edge-on: current ${plainLabel(I)} comes out of the page at the top (⊙) and goes in at the bottom (⊗)${pos ? '' : ' (reversed)'}. The ${plainLabel(Bl)} lines wrap around the conductors and at the centre of the loop are parallel to the axis, pointing ${pos ? 'right' : 'left'}.`,
        );
  }
  if (p.source === 'wire-section' && p.radiusLabel)
    desc += c.L(
      ` Il conduttore ha raggio ${plainLabel(p.radiusLabel)}: fuori il campo è quello di un filo sottile, dentro dipende da come è distribuita la corrente nella sezione.`,
      ` The conductor has radius ${plainLabel(p.radiusLabel)}: outside, the field is that of a thin wire; inside, it depends on how the current is spread over the cross-section.`,
    );
  if (p.rightHand)
    desc += c.L(
      p.source === 'wire' || p.source === 'wire-section'
        ? ' Regola della mano destra: il pollice indica la corrente, le dita chiuse il verso del campo.'
        : ' Regola della mano destra: le dita chiuse seguono la corrente, il pollice indica il campo al centro.',
      p.source === 'wire' || p.source === 'wire-section'
        ? ' Right-hand rule: the thumb points along the current, the curled fingers give the direction of the field.'
        : ' Right-hand rule: the curled fingers follow the current, the thumb gives the field at the centre.',
    );
  return { svg: s, title, description: desc };
}
