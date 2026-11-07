/**
 * Figure di meccanica: corpo libero, piano inclinato, molla-massa, pendolo,
 * proiettile, moto circolare, urti. Disegnatori puri: parametri → SVG.
 */
import { listText, plainLabel, rad, Svg, type Ctx, type Drawn, type Pt, type Tone } from '../core';
import type { DiagramParams } from '../schemas';

type P<K extends keyof DiagramParams> = DiagramParams[K];

const FORCE_TONE: Record<string, Tone> = {
  weight: 'danger',
  normal: 'info',
  friction: 'warning',
  tension: 'success',
  applied: 'accent',
  other: 'accent2',
};

/** Direzione a parole (0° = destra, antiorario). */
function dirText(angle: number, c: Ctx): string {
  const a = ((Math.round(angle) % 360) + 360) % 360;
  if (a === 0) return c.L('verso destra', 'to the right');
  if (a === 90) return c.L("verso l'alto", 'upwards');
  if (a === 180) return c.L('verso sinistra', 'to the left');
  if (a === 270) return c.L('verso il basso', 'downwards');
  return c.L(`a ${c.num(a)}° dall'orizzontale`, `at ${c.num(a)}° from the horizontal`);
}

/** Quadrante diagonale (45°, 135°, …) più lontano da tutte le direzioni date, per le etichette. */
function freeDiagonal(angles: number[]): number {
  let best = 135;
  let bestD = -1;
  for (const a of [135, 45, 225, 315]) {
    const d = Math.min(360, ...angles.map((x) => {
      const t = Math.abs((((a - x) % 360) + 360) % 360);
      return Math.min(t, 360 - t);
    }));
    if (d > bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}

/** Vettore con etichetta oltre la punta. */
function vec(s: Svg, from: Pt, to: Pt, label: string, tone: Tone, o: { dash?: boolean; width?: number } = {}): void {
  s.arrow(from[0], from[1], to[0], to[1], { tone, width: o.width ?? 2.2, ...(o.dash ? { dash: '5 4' } : {}) });
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1;
  const ux = (to[0] - from[0]) / len;
  const uy = (to[1] - from[1]) / len;
  if (label) s.text(to[0] + ux * 13, to[1] + uy * 13, label, { italic: true, size: 14, halo: true });
}

/** Molla a zig-zag tra due punti. */
function spring(s: Svg, a: Pt, b: Pt, coils = 8, amp = 9): void {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ux = (b[0] - a[0]) / len;
  const uy = (b[1] - a[1]) / len;
  const lead = Math.min(12, len * 0.15);
  const pts: Pt[] = [a, [a[0] + ux * lead, a[1] + uy * lead]];
  const body = len - 2 * lead;
  const n = coils * 2;
  for (let i = 1; i < n; i++) {
    const t = lead + (body * i) / n;
    const side = i % 2 ? 1 : -1;
    pts.push([a[0] + ux * t - uy * amp * side, a[1] + uy * t + ux * amp * side]);
  }
  pts.push([b[0] - ux * lead, b[1] - uy * lead], b);
  s.polyline(pts, { width: 1.6 });
}

/** Parete tratteggiata verticale (lato `side`: −1 tratti a sinistra). */
function wall(s: Svg, x: number, y1: number, y2: number, side: 1 | -1 = -1): void {
  s.line(x, y1, x, y2, { width: 1.6 });
  for (let y = y1 + 4; y < y2; y += 10) s.line(x, y, x + 8 * side, y - 7, { tone: 'muted', width: 1 });
}

/** Soffitto tratteggiato. */
function ceiling(s: Svg, x1: number, x2: number, y: number): void {
  s.line(x1, y, x2, y, { width: 1.6 });
  for (let x = x1 + 4; x < x2; x += 10) s.line(x, y, x - 7, y - 8, { tone: 'muted', width: 1 });
}

// ---------------------------------------------------------------- corpo libero
export function freeBody(p: P<'free-body'>, c: Ctx): Drawn {
  const body = p.body ?? 'block';
  const base = 62;
  const vecs = p.forces.map((f) => {
    const L = base * (f.magnitude ?? 1);
    return { f, dx: L * Math.cos(rad(f.angle)), dy: -L * Math.sin(rad(f.angle)) };
  });
  const half = body === 'block' ? 36 : body === 'sphere' ? 26 : 6;
  let minX = -half - 30;
  let maxX = half + 30;
  let minY = -half - 30;
  let maxY = half + (p.ground ? 24 : 30);
  for (const v of vecs) {
    minX = Math.min(minX, v.dx - 30);
    maxX = Math.max(maxX, v.dx + 30);
    minY = Math.min(minY, v.dy - 24);
    maxY = Math.max(maxY, v.dy + 24);
  }
  if (p.acceleration) minY = Math.min(minY, -half - 70);
  const pad = 16;
  const s = new Svg(maxX - minX + 2 * pad, maxY - minY + 2 * pad);
  const cx = -minX + pad;
  const cy = -minY + pad;
  if (p.axes) {
    const a = rad(p.axesAngle ?? 0);
    const R = Math.min(cx, s.width - cx, cy, s.height - cy) - 6;
    const ex: Pt = [Math.cos(a), -Math.sin(a)];
    const ey: Pt = [-Math.sin(a), -Math.cos(a)];
    s.arrow(cx - ex[0] * R, cy - ex[1] * R, cx + ex[0] * R, cy + ex[1] * R, { tone: 'muted', width: 1, dash: '4 4', head: 8 });
    s.arrow(cx - ey[0] * R, cy - ey[1] * R, cx + ey[0] * R, cy + ey[1] * R, { tone: 'muted', width: 1, dash: '4 4', head: 8 });
    s.text(cx + ex[0] * (R - 6) + ey[0] * 12, cy + ex[1] * (R - 6) + ey[1] * 12, 'x', { italic: true, muted: true });
    s.text(cx + ey[0] * (R - 6) - ex[0] * 12, cy + ey[1] * (R - 6) - ex[1] * 12, 'y', { italic: true, muted: true });
  }
  if (p.ground) s.ground(cx - half - 40, cy + half, cx + half + 40);
  if (body === 'block') s.rect(cx - half, cy - half, 2 * half, 2 * half, { fill: 'surface2', width: 1.6, rx: 2 });
  else if (body === 'sphere') s.circle(cx, cy, half, { fill: 'surface2', width: 1.6 });
  if (p.bodyLabel) {
    const a = rad(freeDiagonal(p.forces.map((f) => f.angle)));
    const r = body === 'point' ? 16 : half * 0.62;
    s.text(cx + r * Math.cos(a), cy - r * Math.sin(a), p.bodyLabel, { italic: true, size: 14, halo: body === 'point' });
  }
  for (const v of vecs) vec(s, [cx, cy], [cx + v.dx, cy + v.dy], v.f.label, FORCE_TONE[v.f.kind ?? 'other']!);
  s.dot(cx, cy, 3.2);
  if (p.acceleration) {
    const a = rad(p.acceleration.angle);
    const ax = cx - Math.cos(a) * 24;
    const ay = cy - half - 44 + Math.sin(a) * 12;
    vec(s, [ax, ay], [ax + Math.cos(a) * 48, ay - Math.sin(a) * 48], p.acceleration.label ?? 'a', 'accent2', { width: 1.6 });
  }
  const what = body === 'block' ? c.L('un blocco', 'a block') : body === 'sphere' ? c.L('una sfera', 'a sphere') : c.L('un punto materiale', 'a point mass');
  return {
    svg: s,
    title: c.L('Diagramma di corpo libero', 'Free-body diagram'),
    description:
      c.L(`Diagramma di corpo libero di ${what}`, `Free-body diagram of ${what}`) +
      (p.bodyLabel ? ` (${plainLabel(p.bodyLabel)})` : '') +
      c.L(` con ${p.forces.length} forze: `, ` with ${p.forces.length} forces: `) +
      listText(p.forces.map((f) => `${plainLabel(f.label)} ${dirText(f.angle, c)}`), c.lang) +
      (p.acceleration ? c.L(`; accelerazione ${dirText(p.acceleration.angle, c)}`, `; acceleration ${dirText(p.acceleration.angle, c)}`) : '') +
      '.',
  };
}

// ------------------------------------------------------------- piano inclinato
export function inclinedPlane(p: P<'inclined-plane'>, c: Ctx): Drawn {
  const th = rad(p.angle);
  const H = 300;
  const W = H * Math.cos(th);
  const Ht = H * Math.sin(th);
  const top = 86;
  const right = p.pulley ? 110 : 60;
  const s = new Svg(30 + W + right, top + Ht + 40 + (p.pulley ? Math.max(0, 150 - Ht) : 0));
  const A: Pt = [30, top + Ht];
  const B: Pt = [30 + W, top + Ht];
  const C: Pt = [30 + W, top];
  s.ground(10, A[1], B[0] + right - 10);
  s.polygon([A, B, C], { fill: 'surface2', width: 1.6 });
  s.angleArc(A[0], A[1], 42, 0, th, p.angleLabel ?? 'θ');
  const u: Pt = [Math.cos(th), -Math.sin(th)];
  const n: Pt = [-Math.sin(th), -Math.cos(th)];
  const t = p.pulley ? 0.55 : 0.5;
  const P0: Pt = [A[0] + u[0] * H * t, A[1] + u[1] * H * t];
  const bw = 50;
  const bh = 34;
  const Cb: Pt = [P0[0] + n[0] * (bh / 2), P0[1] + n[1] * (bh / 2)];
  s.raw(`<g transform="rotate(${-p.angle} ${Cb[0].toFixed(2)} ${Cb[1].toFixed(2)})">`);
  s.rect(Cb[0] - bw / 2, Cb[1] - bh / 2, bw, bh, { fill: 'surface', width: 1.6, rx: 2 });
  s.raw('</g>');
  s.text(Cb[0] - u[0] * 13 - n[0] * 3, Cb[1] - u[1] * 13 - n[1] * 3, p.massLabel ?? 'm', { italic: true, size: 13 });
  const forces: string[] = [];
  const at = (k: number, d: Pt): Pt => [Cb[0] + d[0] * k, Cb[1] + d[1] * k];
  if (p.forces !== false) {
    const g = 84;
    vec(s, Cb, at(g, [0, 1]), 'mg', 'danger');
    vec(s, Cb, at(g * Math.cos(th) + 4, n), 'N', 'info');
    forces.push(c.L('peso mg verticale', 'weight mg, vertical'), c.L('reazione normale N perpendicolare al piano', 'normal force N, perpendicular to the plane'));
    if (p.components) {
      vec(s, Cb, at(g * Math.sin(th), [-u[0], -u[1]]), 'mg sin θ', 'danger', { dash: true, width: 1.4 });
      vec(s, Cb, at(g * Math.cos(th), [-n[0], -n[1]]), 'mg cos θ', 'danger', { dash: true, width: 1.4 });
      forces.push(c.L('componenti del peso mg sin θ lungo il piano e mg cos θ perpendicolare', 'weight components mg sin θ along and mg cos θ perpendicular to the plane'));
    }
    if (p.friction) {
      const up = p.motion !== 'up';
      const d: Pt = up ? u : [-u[0], -u[1]];
      const start: Pt = [P0[0] + d[0] * (bw / 2 - 4), P0[1] + d[1] * (bw / 2 - 4)];
      vec(s, start, [start[0] + d[0] * 46, start[1] + d[1] * 46], 'f', 'warning');
      forces.push(up ? c.L('attrito f lungo il piano verso l’alto', 'friction f up the slope') : c.L('attrito f lungo il piano verso il basso', 'friction f down the slope'));
    }
  }
  if (p.pulley) {
    const r = 13;
    const Pc: Pt = [C[0] + 8, C[1] - 16];
    s.line(C[0], C[1], Pc[0], Pc[1], { width: 2 });
    s.circle(Pc[0], Pc[1], r, { fill: 'surface', width: 1.6 });
    s.dot(Pc[0], Pc[1], 2.2);
    const T1: Pt = [Pc[0] + n[0] * r, Pc[1] + n[1] * r];
    const S0: Pt = [Cb[0] + u[0] * (bw / 2), Cb[1] + u[1] * (bw / 2)];
    s.line(S0[0], S0[1], T1[0], T1[1], { width: 1.2 });
    const hx = Pc[0] + r;
    const hy = Pc[1] + 96;
    s.line(hx, Pc[1], hx, hy, { width: 1.2 });
    s.rect(hx - 20, hy, 40, 36, { fill: 'surface', width: 1.6, rx: 2 });
    s.text(hx, hy + 18, p.hangingLabel ?? 'M', { italic: true, size: 14 });
    if (p.forces !== false) {
      vec(s, at(0, [0, 0]), at(58, u), 'T', 'success');
      vec(s, [hx, hy + 36], [hx, hy + 36 + 46], 'Mg', 'danger');
      vec(s, [hx + 26, hy + 6], [hx + 26, hy - 34], 'T', 'success', { width: 1.8 });
      forces.push(c.L('tensione T del filo', 'string tension T'));
    }
  }
  if (p.motion && p.motion !== 'none') {
    const d: Pt = p.motion === 'up' ? u : [-u[0], -u[1]];
    const base: Pt = [P0[0] + n[0] * 66 - d[0] * 22, P0[1] + n[1] * 66 - d[1] * 22];
    s.arrow(base[0], base[1], base[0] + d[0] * 44, base[1] + d[1] * 44, { tone: 'muted', width: 1.4 });
    s.text(base[0] + d[0] * 22 + n[0] * 12, base[1] + d[1] * 22 + n[1] * 12, 'v', { italic: true, muted: true });
  }
  const motion = p.motion === 'up' ? c.L(' che sale', ' moving up') : p.motion === 'down' ? c.L(' che scende', ' moving down') : '';
  return {
    svg: s,
    title: c.L('Piano inclinato', 'Inclined plane'),
    description:
      c.L(
        `Blocco di massa ${plainLabel(p.massLabel ?? 'm')}${motion} su un piano inclinato di ${c.num(p.angle)}°${p.friction ? ' con attrito' : ' liscio'}`,
        `Block of mass ${plainLabel(p.massLabel ?? 'm')}${motion} on a ${p.friction ? 'rough' : 'frictionless'} plane inclined at ${c.num(p.angle)}°`,
      ) +
      (p.pulley
        ? c.L(`, collegato da un filo su una carrucola in cima a una massa sospesa ${plainLabel(p.hangingLabel ?? 'M')}`, `, tied by a string over a pulley at the top to a hanging mass ${plainLabel(p.hangingLabel ?? 'M')}`)
        : '') +
      (forces.length ? c.L('. Forze: ', '. Forces: ') + listText(forces, c.lang) : '') +
      '.',
  };
}

// -------------------------------------------------------------- molla e massa
export function springMass(p: P<'spring-mass'>, c: Ctx): Drawn {
  const vertical = p.orientation === 'vertical';
  const d = p.displacement ?? 0.4;
  const k = p.kLabel ?? 'k';
  const m = p.massLabel ?? 'm';
  const xl = p.xLabel ?? 'x';
  const shift = d * 80;
  let s: Svg;
  if (!vertical) {
    s = new Svg(440, 200);
    const floor = 150;
    wall(s, 30, 50, floor);
    s.ground(30, floor, 420);
    const eq = 230;
    const bx = eq + shift;
    const sy = p.damper ? 92 : 118;
    spring(s, [30, sy], [bx, sy], 9, 8);
    if (p.damper) {
      const dy = 132;
      const mid = 30 + (bx - 30) * 0.55;
      s.line(30, dy, mid, dy, { width: 1.6 });
      s.path(`M${mid - 22} ${dy - 9}H${mid + 10}M${mid - 22} ${dy + 9}H${mid + 10}M${mid - 22} ${dy - 9}V${dy + 9}`, { width: 1.6 });
      s.line(mid - 6, dy - 6, mid - 6, dy + 6, { width: 2.4 });
      s.line(mid - 6, dy, bx, dy, { width: 1.6 });
    }
    s.rect(bx, 92, 64, 58, { fill: 'surface2', width: 1.6, rx: 2 });
    s.text(bx + 32, 121, m, { italic: true, size: 15 });
    s.text(30 + (bx - 30) / 2, sy - 20, k, { italic: true, size: 14, halo: true });
    if (p.equilibrium !== false) {
      s.line(eq + 32, 40, eq + 32, floor + 4, { tone: 'muted', width: 1, dash: '4 4' });
      s.text(eq + 32, 176, `${xl} = 0`, { muted: true, size: 12 });
      if (Math.abs(shift) > 8) s.dimension(eq + 32, 66, bx + 32, 66, xl);
    }
    if (p.force !== false && Math.abs(shift) > 2) {
      const dir = -Math.sign(d);
      const L = 24 + Math.abs(d) * 56;
      const x0 = bx + 32 + dir * 32;
      vec(s, [x0, 121], [x0 + dir * L, 121], 'F_{el}', 'accent');
    }
  } else {
    s = new Svg(300, 400);
    ceiling(s, 60, 240, 30);
    const eq = 230;
    const by = eq + shift;
    const sx = p.damper ? 128 : 150;
    spring(s, [sx, 30], [sx, by], 9, 9);
    if (p.damper) {
      const dx = 176;
      const mid = 30 + (by - 30) * 0.5;
      s.line(dx, 30, dx, mid, { width: 1.6 });
      s.path(`M${dx - 9} ${mid - 10}V${mid + 22}M${dx + 9} ${mid - 10}V${mid + 22}M${dx - 9} ${mid + 22}H${dx + 9}`, { width: 1.6 });
      s.line(dx - 6, mid + 6, dx + 6, mid + 6, { width: 2.4 });
      s.line(dx, mid + 6, dx, by, { width: 1.6 });
    }
    s.rect(122, by, 56, 52, { fill: 'surface2', width: 1.6, rx: 2 });
    s.text(150, by + 26, m, { italic: true, size: 15 });
    s.text(sx - 24, 30 + (by - 30) / 2, k, { italic: true, size: 14, halo: true });
    if (p.equilibrium !== false) {
      s.line(70, eq + 26, 230, eq + 26, { tone: 'muted', width: 1, dash: '4 4' });
      s.text(236, eq + 26, `${xl} = 0`, { muted: true, size: 12, anchor: 'start' });
      if (Math.abs(shift) > 8) s.dimension(95, eq + 26, 95, by + 26, xl, { offset: 0 });
    }
    if (p.force !== false && Math.abs(shift) > 2) {
      const dir = -Math.sign(d);
      const L = 24 + Math.abs(d) * 56;
      const y0 = by + 26 + dir * 26;
      vec(s, [200, y0], [200, y0 + dir * L], 'F_{el}', 'accent');
    }
  }
  const pos =
    Math.abs(d) < 0.02
      ? c.L('nella posizione di equilibrio', 'at equilibrium')
      : d > 0
        ? c.L(vertical ? 'spostata verso il basso rispetto all’equilibrio' : 'spostata a destra rispetto all’equilibrio (molla allungata)', vertical ? 'displaced downwards from equilibrium' : 'displaced to the right of equilibrium (spring stretched)')
        : c.L(vertical ? 'spostata verso l’alto rispetto all’equilibrio' : 'spostata a sinistra rispetto all’equilibrio (molla compressa)', vertical ? 'displaced upwards from equilibrium' : 'displaced to the left of equilibrium (spring compressed)');
  return {
    svg: s,
    title: c.L('Sistema molla-massa', 'Mass–spring system'),
    description:
      c.L(
        `Massa ${plainLabel(m)} attaccata a una molla di costante ${plainLabel(k)}${vertical ? ' appesa al soffitto' : ' fissata a una parete, su un piano orizzontale'}${p.damper ? ', con smorzatore' : ''}, ${pos}.`,
        `Mass ${plainLabel(m)} attached to a spring of constant ${plainLabel(k)}${vertical ? ' hanging from the ceiling' : ' fixed to a wall, on a horizontal surface'}${p.damper ? ', with a damper' : ''}, ${pos}.`,
      ) +
      (p.force !== false && Math.abs(d) >= 0.02 ? c.L(' La forza elastica è diretta verso l’equilibrio.', ' The elastic force points towards equilibrium.') : ''),
  };
}

// ---------------------------------------------------------------------- pendolo
export function pendulum(p: P<'pendulum'>, c: Ctx): Drawn {
  const th = rad(p.angle);
  const L = 190;
  const amp = Math.abs(th);
  const half = Math.max(110, L * Math.sin(amp) + 90);
  const s = new Svg(2 * half, 40 + L + 120);
  const O: Pt = [half, 34];
  ceiling(s, half - 60, half + 60, O[1]);
  s.line(O[0], O[1], O[0], O[1] + L + 30, { tone: 'muted', width: 1, dash: '4 4' });
  const B: Pt = [O[0] + L * Math.sin(th), O[1] + L * Math.cos(th)];
  if (p.arc !== false && amp > 0.02) {
    const pts: Pt[] = [];
    for (let i = 0; i <= 40; i++) {
      const a = -amp + (2 * amp * i) / 40;
      pts.push([O[0] + L * Math.sin(a), O[1] + L * Math.cos(a)]);
    }
    s.polyline(pts, { tone: 'muted', width: 1, dash: '3 5' });
  }
  s.line(O[0], O[1], B[0], B[1], { width: 1.6 });
  s.dot(O[0], O[1], 3);
  if (amp > 0.02) {
    const r = 46;
    const a0 = -Math.PI / 2;
    s.angleArc(O[0], O[1], r, a0, a0 + th, p.angleLabel ?? 'θ');
  }
  const mid: Pt = [(O[0] + B[0]) / 2, (O[1] + B[1]) / 2];
  const side = th >= 0 ? -1 : 1;
  s.text(mid[0] + side * 14 * Math.cos(th), mid[1] + Math.sin(Math.abs(th)) * 14, p.lengthLabel ?? 'L', { italic: true, size: 14, halo: true });
  s.circle(B[0], B[1], 14, { fill: 'surface2', width: 1.6 });
  s.text(B[0] + (th >= 0 ? 22 : -22), B[1] - 18, p.massLabel ?? 'm', { italic: true, size: 14, halo: true });
  if (p.forces !== false) {
    const toO: Pt = [(O[0] - B[0]) / L, (O[1] - B[1]) / L];
    vec(s, B, [B[0] + toO[0] * 70, B[1] + toO[1] * 70], 'T', 'success');
    vec(s, B, [B[0], B[1] + 84], 'mg', 'danger');
    if (p.components && amp > 0.02) {
      const tan: Pt = [-Math.cos(th) * Math.sign(th), Math.sin(th) * Math.sign(th)];
      vec(s, B, [B[0] + tan[0] * 84 * Math.sin(amp), B[1] + tan[1] * 84 * Math.sin(amp)], 'mg sin θ', 'danger', { dash: true, width: 1.4 });
      vec(s, B, [B[0] - toO[0] * 84 * Math.cos(th), B[1] - toO[1] * 84 * Math.cos(th)], 'mg cos θ', 'danger', { dash: true, width: 1.4 });
    }
  }
  return {
    svg: s,
    title: c.L('Pendolo semplice', 'Simple pendulum'),
    description:
      c.L(
        `Pendolo semplice di lunghezza ${plainLabel(p.lengthLabel ?? 'L')} e massa ${plainLabel(p.massLabel ?? 'm')}, spostato di ${c.num(Math.abs(p.angle))}° ${p.angle >= 0 ? 'a destra' : 'a sinistra'} della verticale`,
        `Simple pendulum of length ${plainLabel(p.lengthLabel ?? 'L')} and mass ${plainLabel(p.massLabel ?? 'm')}, displaced ${c.num(Math.abs(p.angle))}° to the ${p.angle >= 0 ? 'right' : 'left'} of the vertical`,
      ) +
      (p.forces !== false
        ? c.L('; forze sulla massa: tensione T lungo il filo e peso mg', '; forces on the bob: tension T along the string and weight mg') +
          (p.components ? c.L(', con le componenti mg sin θ (tangente) e mg cos θ (lungo il filo)', ', with components mg sin θ (tangential) and mg cos θ (along the string)') : '')
        : '') +
      '.',
  };
}

// -------------------------------------------------------------------- proiettile
export function projectile(p: P<'projectile'>, c: Ctx): Drawn {
  const g = p.g ?? 9.81;
  const a = rad(p.angle);
  const h0 = p.h0 ?? 0;
  const vx = p.v0 * Math.cos(a);
  const vy = p.v0 * Math.sin(a);
  const T = (vy + Math.sqrt(vy * vy + 2 * g * h0)) / g;
  const R = vx * T;
  const H = h0 + Math.max(0, vy) ** 2 / (2 * g);
  const plotW = 400;
  const plotH = 220;
  const k = Math.min(plotW / Math.max(R, 1e-9), plotH / Math.max(H, 1e-9));
  const w = Math.max(R * k, 120);
  const h = Math.max(H * k, 60);
  const ox = 46;
  const oy = 56 + h;
  const s = new Svg(ox + w + 60, oy + 56);
  const X = (x: number): number => ox + x * k;
  const Y = (y: number): number => oy - y * k;
  s.ground(ox - 26, oy, ox + w + 40);
  s.arrow(ox, oy + 6, ox, oy - h - 34, { width: 1.1, head: 8, tone: 'muted' });
  s.text(ox - 10, oy - h - 34, 'y', { italic: true, muted: true });
  s.text(ox + w + 44, oy - 12, 'x', { italic: true, muted: true });
  if (h0 > 0) {
    s.rect(ox - 22, Y(h0), 22, oy - Y(h0), { fill: 'surface2', width: 1.2 });
  }
  const pts: Pt[] = [];
  for (let i = 0; i <= 80; i++) {
    const t = (T * i) / 80;
    pts.push([X(vx * t), Y(h0 + vy * t - (g * t * t) / 2)]);
  }
  s.polyline(pts, { tone: 'accent', width: 2 });
  const vs = 64 / p.v0;
  const nv = p.vectors ?? 3;
  for (let i = 0; i < nv; i++) {
    const t = nv === 1 ? 0 : (T * i) / (nv - 1 + (nv > 2 ? 0.25 : 0.4));
    const x = X(vx * t);
    const y = Y(h0 + vy * t - (g * t * t) / 2);
    const vyt = vy - g * t;
    if (p.components !== false) {
      s.arrow(x, y, x + vx * vs, y, { tone: 'info', width: 1.3, dash: '4 3' });
      if (Math.abs(vyt * vs) > 6) s.arrow(x, y, x, y - vyt * vs, { tone: 'info', width: 1.3, dash: '4 3' });
    }
    vec(s, [x, y], [x + vx * vs, y - vyt * vs], i === 0 ? 'v_0' : '', 'accent', { width: 2 });
    s.dot(x, y, 2.6);
  }
  const values = p.values !== false;
  if (p.angle > 0) s.angleArc(X(0), Y(h0), 30, 0, a, 'α');
  if (p.apex !== false && vy > 0) {
    const ta = vy / g;
    const xa = X(vx * ta);
    s.line(xa, Y(H), xa, oy, { tone: 'muted', width: 1, dash: '4 4' });
    s.dot(xa, Y(H), 3);
    s.text(xa + 8, Y(H) - 14, values ? `h_{max} = ${c.num(H)} m` : 'h_{max}', { anchor: 'start', halo: true, size: 12 });
  }
  if (p.range !== false) s.dimension(X(0), oy + 24, X(R), oy + 24, values ? `R = ${c.num(R)} m` : 'R', { italic: false });
  return {
    svg: s,
    title: c.L('Moto del proiettile', 'Projectile motion'),
    description: c.L(
      `Traiettoria parabolica di un proiettile lanciato con velocità ${c.num(p.v0)} m/s a ${c.num(p.angle)}° sull'orizzontale${h0 ? ` da un'altezza di ${c.num(h0)} m` : ''}: gittata ${c.num(R)} m, quota massima ${c.num(H)} m, tempo di volo ${c.num(T)} s.`,
      `Parabolic path of a projectile launched at ${c.num(p.v0)} m/s, ${c.num(p.angle)}° above the horizontal${h0 ? ` from a height of ${c.num(h0)} m` : ''}: range ${c.num(R)} m, maximum height ${c.num(H)} m, time of flight ${c.num(T)} s.`,
    ),
  };
}

// --------------------------------------------------------------- moto circolare
export function circularMotion(p: P<'circular-motion'>, c: Ctx): Drawn {
  const s = new Svg(340, 340);
  const O: Pt = [170, 170];
  const R = 110;
  const th = rad(p.angle);
  const ccw = p.direction !== 'cw';
  s.line(O[0] - R - 30, O[1], O[0] + R + 30, O[1], { tone: 'faint', width: 1, dash: '4 4' });
  s.line(O[0], O[1] + R + 30, O[0], O[1] - R - 30, { tone: 'faint', width: 1, dash: '4 4' });
  s.circle(O[0], O[1], R, { tone: 'muted', width: 1.4 });
  // verso di rotazione: punta sulla circonferenza dalla parte opposta
  const ar = th + Math.PI * 0.85;
  const tx = ccw ? -Math.sin(ar) : Math.sin(ar);
  const ty = ccw ? -Math.cos(ar) : Math.cos(ar);
  s.head(O[0] + R * Math.cos(ar), O[1] - R * Math.sin(ar), tx, ty, 10, 'muted');
  const P0: Pt = [O[0] + R * Math.cos(th), O[1] - R * Math.sin(th)];
  s.line(O[0], O[1], P0[0], P0[1], { width: 1.2 });
  s.dot(O[0], O[1], 3);
  s.text(O[0] - 10, O[1] + 14, 'O', { muted: true, size: 12 });
  const mid: Pt = [(O[0] + P0[0]) / 2, (O[1] + P0[1]) / 2];
  s.text(mid[0] - Math.sin(th) * 12, mid[1] - Math.cos(th) * 12, p.radiusLabel ?? 'r', { italic: true, halo: true });
  if (p.showAngle !== false) s.angleArc(O[0], O[1], 34, 0, ((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), p.angleLabel ?? 'θ');
  const t: Pt = ccw ? [-Math.sin(th), -Math.cos(th)] : [Math.sin(th), Math.cos(th)];
  if (p.velocity !== false) vec(s, P0, [P0[0] + t[0] * 72, P0[1] + t[1] * 72], 'v', 'accent');
  if (p.centripetal !== false) vec(s, P0, [P0[0] + (O[0] - P0[0]) * 0.5, P0[1] + (O[1] - P0[1]) * 0.5], 'a_c', 'danger');
  const tg = p.tangential ?? 'none';
  if (tg !== 'none') {
    const sg = tg === 'speeding' ? 1 : -1;
    vec(s, P0, [P0[0] + t[0] * 36 * sg, P0[1] + t[1] * 36 * sg], 'a_t', 'warning', { width: 1.8 });
  }
  s.circle(P0[0], P0[1], 6, { fill: 'surface2', width: 1.6 });
  return {
    svg: s,
    title: c.L('Moto circolare', 'Circular motion'),
    description:
      c.L(
        `Punto in moto circolare ${ccw ? 'antiorario' : 'orario'} su una circonferenza di raggio ${plainLabel(p.radiusLabel ?? 'r')}, nella posizione a ${c.num(p.angle)}°`,
        `Point in ${ccw ? 'counter-clockwise' : 'clockwise'} circular motion on a circle of radius ${plainLabel(p.radiusLabel ?? 'r')}, at ${c.num(p.angle)}°`,
      ) +
      (p.velocity !== false ? c.L('; velocità tangente', '; tangential velocity') : '') +
      (p.centripetal !== false ? c.L(', accelerazione centripeta verso il centro', ', centripetal acceleration towards the centre') : '') +
      (tg !== 'none'
        ? tg === 'speeding'
          ? c.L(', accelerazione tangenziale concorde con la velocità (accelera)', ', tangential acceleration along the velocity (speeding up)')
          : c.L(', accelerazione tangenziale opposta alla velocità (rallenta)', ', tangential acceleration against the velocity (slowing down)')
        : '') +
      '.',
  };
}

// --------------------------------------------------------------------------- urti
export function collision(p: P<'collision'>, c: Ctx): Drawn {
  const plane = [...p.before, ...p.after].some((b) => b.angle !== undefined);
  const unit = p.unit ?? 'm/s';
  const values = p.values !== false;
  const vmax = Math.max(1e-9, ...[...p.before, ...p.after].map((b) => Math.abs(b.v)));
  const panelH = plane ? 230 : 130;
  const W = 440;
  const s = new Svg(W, panelH * 2 + 20);
  const vl = (b: { label: string; v: number }, prime: boolean): string =>
    `v${prime ? "'" : ''}_{${b.label}}` + (values ? ` = ${c.num(Math.abs(b.v))} ${unit}` : '');
  const panel = (bodies: typeof p.before, y0: number, after: boolean): void => {
    s.rect(4, y0 + 4, W - 8, panelH - 12, { tone: 'faint', width: 1, rx: 8 });
    s.text(18, y0 + 22, after ? c.L('Dopo', 'After') : c.L('Prima', 'Before'), { anchor: 'start', size: 12, weight: 600, muted: true });
    if (!plane) {
      const y = y0 + panelH / 2 + 8;
      s.line(20, y + 22, W - 20, y + 22, { tone: 'faint', width: 1 });
      bodies.forEach((b, i) => {
        const x = ((i + 1) * W) / (bodies.length + 1);
        const L = (Math.abs(b.v) / vmax) * 90;
        if (L > 1) {
          const dir = Math.sign(b.v);
          vec(s, [x + dir * 20, y], [x + dir * (20 + L), y], '', 'accent', { width: 2 });
          s.text(x + dir * (22 + L / 2), y - 16, vl(b, after), { italic: true, size: 12, halo: true });
        } else s.text(x, y - 30, values ? `v${after ? "'" : ''}_{${b.label}} = 0` : '', { italic: true, size: 12 });
        s.circle(x, y, 18, { fill: 'surface2', width: 1.6 });
        s.text(x, y, b.label, { size: 13, weight: 600 });
        if (b.mass) s.text(x, y + 34, b.mass, { italic: true, size: 12, muted: true });
      });
    } else {
      const C: Pt = [W / 2, y0 + panelH / 2 + 8];
      s.dot(C[0], C[1], 2, 'muted');
      bodies.forEach((b) => {
        const ang = rad(b.angle ?? (b.v >= 0 ? 0 : 180));
        const d: Pt = [Math.cos(ang), -Math.sin(ang)];
        const L = (Math.abs(b.v) / vmax) * 70;
        const center: Pt = after ? [C[0] + d[0] * 36, C[1] + d[1] * 36] : [C[0] - d[0] * (L + 48), C[1] - d[1] * (L + 48)];
        if (L > 1) {
          const from: Pt = [center[0] + d[0] * 17, center[1] + d[1] * 17];
          vec(s, from, [from[0] + d[0] * L, from[1] + d[1] * L], '', 'accent', { width: 2 });
          s.text(from[0] + d[0] * (L / 2) - d[1] * 16, from[1] + d[1] * (L / 2) + d[0] * 16, vl(b, after), { italic: true, size: 12, halo: true });
        }
        s.circle(center[0], center[1], 16, { fill: 'surface2', width: 1.6 });
        s.text(center[0], center[1], b.label, { size: 13, weight: 600 });
      });
    }
  };
  panel(p.before, 0, false);
  panel(p.after, panelH + 20, true);
  const merged = p.after.length < p.before.length;
  const d = (b: { label: string; v: number; angle?: number | undefined }): string =>
    `${b.label} ${values ? `${c.num(Math.abs(b.v))} ${unit}` : ''}${b.angle !== undefined ? ` ${c.L('a', 'at')} ${c.num(b.angle)}°` : b.v > 0 ? c.L(' verso destra', ' to the right') : b.v < 0 ? c.L(' verso sinistra', ' to the left') : c.L(' ferma', ' at rest')}`;
  return {
    svg: s,
    title: c.L('Urto: prima e dopo', 'Collision: before and after'),
    description:
      c.L(`Urto ${plane ? 'nel piano' : 'lungo una retta'}${merged ? ' completamente anelastico' : ''}. Prima: `, `${plane ? 'Two-dimensional' : 'One-dimensional'}${merged ? ' perfectly inelastic' : ''} collision. Before: `) +
      listText(p.before.map(d), c.lang) +
      c.L('. Dopo: ', '. After: ') +
      listText(p.after.map(d), c.lang) +
      '.',
  };
}

