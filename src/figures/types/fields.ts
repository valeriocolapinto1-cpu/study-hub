/**
 * Campi e induzione: distribuzioni di carica con superficie di Gauss, cariche/dipoli/spire in un
 * campo uniforme (forza di Lorentz, momenti meccanici), circuiti in cui si induce una f.e.m.
 * (barretta su rotaie, sbarra rotante, spira rotante, spira vicino a un filo, spira in B(t)).
 * I versi (curvatura, forze, corrente indotta, polarità) sono calcolati dai parametri.
 */
import { midArrow, plainLabel, Svg, type Ctx, type Drawn, type Pt, type Tone } from '../core';
import type { DiagramParams } from '../schemas';

type P<K extends keyof DiagramParams> = DiagramParams[K];

/** Punto a distanza r e angolo `deg` (antiorario, y verso l'alto) da O. */
const polar = (O: Pt, r: number, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [O[0] + r * Math.cos(a), O[1] - r * Math.sin(a)];
};

/** Simbolo di campo perpendicolare al foglio: × entrante, · uscente (piccoli, grigi). */
function fieldMark(s: Svg, x: number, y: number, out: boolean, tone: Tone = 'muted'): void {
  if (out) {
    s.circle(x, y, 5, { tone, width: 1 });
    s.dot(x, y, 1.6, tone);
  } else {
    s.line(x - 4, y - 4, x + 4, y + 4, { tone, width: 1.1 });
    s.line(x - 4, y + 4, x + 4, y - 4, { tone, width: 1.1 });
  }
}

/** Raggio con etichetta (linea grigia dal centro, etichetta a metà con alone). */
function radius(s: Svg, O: Pt, r: number, deg: number, label: string): void {
  const e = polar(O, r, deg);
  s.line(O[0], O[1], e[0], e[1], { tone: 'muted', width: 1.1 });
  s.head(e[0], e[1], e[0] - O[0], e[1] - O[1], 7, 'muted');
  s.text(...polar(O, r * 0.62, deg + (r < 50 ? 22 : 9)), label, { italic: true, halo: true });
}

/** Griglia di simboli di campo in un rettangolo, saltando i punti per cui `skip` è vero. */
function fieldGrid(
  s: Svg,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  out: boolean,
  gap = 40,
  skip: (x: number, y: number) => boolean = () => false,
): void {
  for (let x = x0 + gap / 2; x < x1; x += gap)
    for (let y = y0 + gap / 2; y < y1; y += gap) if (!skip(x, y)) fieldMark(s, x, y, out);
}

/** Frecce di corrente lungo un percorso chiuso (verso dato dall'ordine dei punti). */
function loopArrows(s: Svg, pts: Pt[], tone: Tone = 'danger'): void {
  const n = pts.length;
  for (let i = 0; i < n; i++) midArrow(s, [pts[i]!, pts[(i + 1) % n]!], tone, 0.5, 10);
}

/** Cerchio orientato con frecce (verso antiorario se `ccw`, come lo vede chi guarda il foglio). */
function orientedCircle(s: Svg, O: Pt, r: number, ccw: boolean, tone: Tone, width = 1.6): void {
  s.circle(O[0], O[1], r, { tone, width });
  for (const a of [45, 225]) {
    const p = polar(O, r, a);
    const t = (a * Math.PI) / 180;
    // tangente antioraria (in coordinate dello schermo)
    const ux = -Math.sin(t) * (ccw ? 1 : -1);
    const uy = -Math.cos(t) * (ccw ? 1 : -1);
    s.head(p[0] + ux * 5, p[1] + uy * 5, ux, uy, 10, tone);
  }
}

/** Verso della corrente indotta (Lenz) visto da chi guarda il foglio. */
function lenz(fieldOut: boolean, increasing: boolean): 'ccw' | 'cw' {
  const inducedOut = increasing ? !fieldOut : fieldOut;
  return inducedOut ? 'ccw' : 'cw';
}

const senseText = (c: Ctx, sense: 'ccw' | 'cw'): string =>
  sense === 'ccw' ? c.L('antiorario', 'counter-clockwise') : c.L('orario', 'clockwise');

// ------------------------------------------------------ distribuzioni di carica
export function chargeDistribution(p: P<'charge-distribution'>, c: Ctx): Drawn {
  const sign = p.charge === 'negative' ? -1 : 1;
  const sym = sign > 0 ? '+' : '−';
  const showField = p.field !== false;
  const Rl = p.radiusLabel ?? 'R';
  const rho = p.densityLabel;
  switch (p.shape) {
    case 'plane':
      return planeDist(p, c, sign, sym, showField);
    case 'wire':
      return wireDist(p, c, sign, sym, showField);
    case 'ring':
      return ringDist(p, c, sign, sym, showField);
    case 'rod':
      return rodDist(p, c, sign, sym, showField);
    default:
      break;
  }
  const W = 360;
  const H = 320;
  const s = new Svg(W, H);
  const O: Pt = [180, 160];
  const nested = p.shape === 'sphere-in-shell';
  const g = p.gaussian ?? (nested ? 0 : 1.5);
  const R = Math.max(48, Math.min(100, 128 / Math.max(1, g)));
  const conductor = p.conductor === true || nested;
  const cyl = p.shape === 'cylinder';
  const shell = p.shape === 'shell';
  const a = shell ? 0.55 * R : 0;
  const tone: Tone = sign > 0 ? 'accent' : 'info';
  // corpo
  if (nested) {
    const R1 = 0.38 * R;
    const R2 = 0.7 * R;
    s.circle(O[0], O[1], R, { tone: 'ink', width: 1.6, fill: 'surface2' });
    s.circle(O[0], O[1], R2, { tone: 'ink', width: 1.6, fill: 'bg' });
    s.circle(O[0], O[1], R1, { tone: 'ink', width: 1.6, fill: 'surface2' });
    const connected = p.connected === true;
    for (let k = 0; k < 10; k++) {
      const ang = 18 + k * 36;
      const q = polar(O, R - 8, ang);
      s.text(q[0], q[1], sym, { size: 11 });
      if (!connected) {
        const q1 = polar(O, R1 - 7, ang + 18);
        if (k % 2 === 0) s.text(q1[0], q1[1], sym, { size: 11 });
        const q2 = polar(O, R2 + 7, ang + 18);
        if (k % 2 === 0) s.text(q2[0], q2[1], sign > 0 ? '−' : '+', { size: 11 });
      }
    }
    if (connected) {
      const q1 = polar(O, R1, 60);
      const q2 = polar(O, R2, 60);
      s.line(q1[0], q1[1], q2[0], q2[1], { width: 2.2 });
    }
    radius(s, O, R1, 160, p.radiusLabel ?? 'R_1');
    radius(s, O, R2, 235, p.innerLabel ?? 'R_2');
    radius(s, O, R, 305, p.outerLabel ?? 'R_3');
    if (showField && !connected)
      for (const ang of [100, 150]) {
        const q1 = polar(O, R1 + 3, ang);
        const q2 = polar(O, R2 - 3, ang);
        s.arrow(...((sign > 0 ? [...q1, ...q2] : [...q2, ...q1]) as [number, number, number, number]), {
          tone,
          width: 1.6,
        });
      }
  } else if (shell) {
    s.circle(O[0], O[1], R, { tone, width: 1.6, fill: 'soft' });
    s.circle(O[0], O[1], a, { tone, width: 1.4, fill: 'bg' });
    for (let k = 0; k < 12; k++) {
      const q = polar(O, (a + R) / 2, 15 + k * 30);
      s.text(q[0], q[1], sym, { size: 11 });
    }
    radius(s, O, a, 150, p.innerLabel ?? 'a');
    radius(s, O, R, 215, p.outerLabel ?? Rl);
  } else if (conductor) {
    s.circle(O[0], O[1], R, { tone: 'ink', width: 1.8, fill: 'surface2' });
    for (let k = 0; k < 14; k++) {
      const q = polar(O, R - 8, k * (360 / 14));
      s.text(q[0], q[1], sym, { size: 11 });
    }
    radius(s, O, R, 215, Rl);
  } else {
    s.circle(O[0], O[1], R, { tone, width: 1.6, fill: 'soft' });
    for (let x = -R + 14; x < R; x += 24)
      for (let y = -R + 14; y < R; y += 24)
        if (Math.hypot(x, y) < R - 10) s.text(O[0] + x, O[1] + y, sym, { size: 11 });
    radius(s, O, R, 215, Rl);
  }
  // campo relativo E(r)/E(R) (r in unità di R)
  const rel = (r: number): number => {
    if (nested) return r < 1 ? 0 : 1 / (r * r);
    if (shell) {
      const ar = a / R;
      if (r < ar) return 0;
      if (r < 1) return (r ** 3 - ar ** 3) / (1 - ar ** 3) / (r * r);
      return 1 / (r * r);
    }
    if (conductor) return r < 1 ? 0 : cyl ? 1 / r : 1 / (r * r);
    if (r < 1) return r;
    return cyl ? 1 / r : 1 / (r * r);
  };
  const outward = sign > 0;
  if (g > 0) {
    const rg = g * R;
    s.circle(O[0], O[1], rg, { tone: 'info', width: 1.4, dash: '6 5' });
    const gl = p.gaussLabel ?? 'r';
    const e = polar(O, rg, 35);
    s.line(O[0], O[1], e[0], e[1], { tone: 'info', width: 1, dash: '3 3' });
    s.text(...polar(O, rg * 0.72, 45), gl, { italic: true, halo: true });
    s.text(...polar(O, rg + 14, 128), 'S', { italic: true, size: 13, halo: true });
    const E = rel(g);
    if (showField) {
      if (E < 1e-9) s.text(O[0], O[1] - rg / 2, 'E = 0', { size: 12, halo: true });
      else {
        const len = 12 + 26 * Math.min(1, E);
        for (const ang of [0, 60, 120, 180, 240, 300]) {
          const q0 = polar(O, rg, ang);
          const q1 = polar(O, rg + (outward ? len : -len), ang);
          s.arrow(q0[0], q0[1], q1[0], q1[1], { tone, width: 2 });
        }
        s.text(...polar(O, rg + len + 12, 0), 'E', { italic: true, halo: true });
      }
    }
  } else if (showField) {
    const r0 = R + 6;
    for (const ang of [0, 45, 90, 135, 180, 225, 270, 315]) {
      const q0 = polar(O, outward ? r0 : r0 + 30, ang);
      const q1 = polar(O, outward ? r0 + 30 : r0, ang);
      s.arrow(q0[0], q0[1], q1[0], q1[1], { tone, width: 1.8 });
    }
    s.text(...polar(O, R + 46, 22), 'E', { italic: true, halo: true });
  }
  if (rho) s.text(W - 14, 20, rho, { italic: true, anchor: 'end', halo: true });
  const name = nested
    ? c.L('Sfera conduttrice dentro un guscio conduttore', 'Conducting sphere inside a conducting shell')
    : shell
      ? c.L('Guscio sferico carico', 'Charged spherical shell')
      : cyl
        ? c.L('Cilindro carico (sezione)', 'Charged cylinder (cross-section)')
        : conductor
          ? c.L('Sfera conduttrice carica', 'Charged conducting sphere')
          : c.L('Sfera uniformemente carica', 'Uniformly charged sphere');
  const charge = sign > 0 ? c.L('positiva', 'positive') : c.L('negativa', 'negative');
  let desc: string;
  if (nested)
    desc = c.L(
      `Sezione di una sfera conduttrice di raggio ${plainLabel(p.radiusLabel ?? 'R_1')} al centro di un guscio conduttore di raggi ${plainLabel(p.innerLabel ?? 'R_2')} e ${plainLabel(p.outerLabel ?? 'R_3')}.${p.connected ? ' Un filo collega i due conduttori: tutta la carica va sulla superficie esterna del guscio e nella cavità il campo è nullo.' : ' Sulla superficie interna del guscio si induce una carica opposta a quella della sfera; il campo è radiale nella cavità e fuori dal guscio, nullo dentro i conduttori.'}`,
      `Cross-section of a conducting sphere of radius ${plainLabel(p.radiusLabel ?? 'R_1')} at the centre of a conducting shell with radii ${plainLabel(p.innerLabel ?? 'R_2')} and ${plainLabel(p.outerLabel ?? 'R_3')}.${p.connected ? ' A wire connects the two conductors: all the charge moves to the outer surface of the shell and the field in the cavity is zero.' : ' The inner surface of the shell carries an induced charge opposite to the sphere’s; the field is radial in the cavity and outside the shell, zero inside the conductors.'}`,
    );
  else {
    const body = shell
      ? c.L(
          `Sezione di un guscio sferico con carica ${charge} tra i raggi ${plainLabel(p.innerLabel ?? 'a')} e ${plainLabel(p.outerLabel ?? Rl)}${rho ? ` (densità ${plainLabel(rho)})` : ''}: nella cavità il campo è nullo, fuori è quello di una carica puntiforme al centro.`,
          `Cross-section of a spherical shell with ${charge} charge between radii ${plainLabel(p.innerLabel ?? 'a')} and ${plainLabel(p.outerLabel ?? Rl)}${rho ? ` (density ${plainLabel(rho)})` : ''}: the field is zero in the cavity and outside it is that of a point charge at the centre.`,
        )
      : conductor
        ? c.L(
            `Conduttore ${cyl ? 'cilindrico' : 'sferico'} di raggio ${plainLabel(Rl)} con carica ${charge} tutta sulla superficie: dentro il campo è nullo, fuori è radiale e perpendicolare alla superficie.`,
            `${cyl ? 'Cylindrical' : 'Spherical'} conductor of radius ${plainLabel(Rl)} with ${charge} charge all on its surface: the field is zero inside and radial, perpendicular to the surface, outside.`,
          )
        : c.L(
            `${cyl ? 'Sezione di un cilindro indefinito' : 'Sfera'} di raggio ${plainLabel(Rl)} con carica ${charge} distribuita nel volume${rho ? ` (densità ${plainLabel(rho)})` : ''}: il campo è radiale, cresce dentro e decresce fuori come ${cyl ? '1/r' : '1/r²'}.`,
            `${cyl ? 'Cross-section of an infinite cylinder' : 'Sphere'} of radius ${plainLabel(Rl)} with ${charge} charge spread through the volume${rho ? ` (density ${plainLabel(rho)})` : ''}: the field is radial, grows inside and falls off as ${cyl ? '1/r' : '1/r²'} outside.`,
          );
    const gauss =
      g > 0
        ? c.L(
            ` Tratteggiata la superficie di Gauss S (${cyl ? 'cilindro coassiale' : 'sfera concentrica'}) di raggio ${plainLabel(p.gaussLabel ?? 'r')} ${g < 1 ? 'interna' : g === 1 ? 'coincidente con la superficie' : 'esterna'}${rel(g) < 1e-9 ? ': lì il campo è nullo.' : ', su cui il campo ha modulo costante.'}`,
            ` Dashed: the Gaussian surface S (${cyl ? 'coaxial cylinder' : 'concentric sphere'}) of radius ${plainLabel(p.gaussLabel ?? 'r')}, ${g < 1 ? 'inside' : g === 1 ? 'on the surface' : 'outside'}${rel(g) < 1e-9 ? ': the field there is zero.' : ', on which the field has constant magnitude.'}`,
          )
        : '';
    desc = body + gauss;
  }
  return { svg: s, title: name, description: desc };
}

function planeDist(
  p: P<'charge-distribution'>,
  c: Ctx,
  sign: number,
  sym: string,
  showField: boolean,
): Drawn {
  const s = new Svg(380, 280);
  const x = 190;
  const cond = p.conductor === true;
  const tone: Tone = sign > 0 ? 'accent' : 'info';
  if (cond) {
    s.rect(x - 14, 24, 28, 232, { tone: 'ink', width: 1.6, fill: 'surface2' });
    for (let y = 40; y < 250; y += 24) {
      s.text(x - 21, y, sym, { size: 11 });
      s.text(x + 21, y, sym, { size: 11 });
    }
    s.text(x, 140, 'E = 0', { size: 11, halo: true });
  } else {
    s.line(x, 20, x, 260, { tone, width: 3 });
    for (let y = 34; y < 256; y += 22) s.text(x - 10, y, sym, { size: 11 });
  }
  const g = p.gaussian ?? 1.5;
  const hw = (cond ? 14 : 0) + 30 * Math.max(0.6, Math.min(g, 3));
  if (g > 0) {
    s.rect(x - hw, 100, 2 * hw, 80, { tone: 'info', width: 1.4, dash: '6 5' });
    s.text(x - hw - 10, 92, 'S', { italic: true, halo: true });
  }
  if (showField)
    for (const y of [60, 140, 220]) {
      const x0 = cond ? 16 : 6;
      const L = 56;
      for (const d of [1, -1]) {
        const a = x + d * x0;
        const b = x + d * (x0 + L);
        if (sign > 0) s.arrow(a, y, b, y, { tone, width: 2 });
        else s.arrow(b, y, a, y, { tone, width: 2 });
      }
    }
  if (showField) s.text(x + 92, 48, 'E', { italic: true, halo: true });
  s.text(x + 18, 18, p.densityLabel ?? 'σ', { italic: true, anchor: 'start', halo: true });
  return {
    svg: s,
    title: cond
      ? c.L('Lastra conduttrice carica', 'Charged conducting slab')
      : c.L('Piano indefinito carico', 'Infinite charged plane'),
    description: cond
      ? c.L(
          'Lastra conduttrice di profilo con carica sulle due facce: dentro il campo è nullo, fuori è uniforme e perpendicolare alle facce, pari a σ/ε₀.',
          'Conducting slab seen edge-on with charge on both faces: the field is zero inside and uniform outside, perpendicular to the faces, equal to σ/ε₀.',
        )
      : c.L(
          `Piano carico visto di profilo (densità ${plainLabel(p.densityLabel ?? 'σ')}): il campo è uniforme, perpendicolare al piano e di verso opposto sui due lati, pari a σ/(2ε₀).${g > 0 ? ' Tratteggiata la superficie di Gauss S, un cilindretto che attraversa il piano.' : ''}`,
          `Charged plane seen edge-on (density ${plainLabel(p.densityLabel ?? 'σ')}): the field is uniform, perpendicular to the plane and opposite on the two sides, equal to σ/(2ε₀).${g > 0 ? ' Dashed: the Gaussian surface S, a small cylinder crossing the plane.' : ''}`,
        ),
  };
}

function wireDist(p: P<'charge-distribution'>, c: Ctx, sign: number, sym: string, showField: boolean): Drawn {
  const s = new Svg(400, 260);
  const y = 130;
  const tone: Tone = sign > 0 ? 'accent' : 'info';
  s.line(20, y, 380, y, { tone, width: 3 });
  for (let x = 34; x < 380; x += 26) s.text(x, y - 11, sym, { size: 11 });
  const g = p.gaussian ?? 1.5;
  const r = 34 * Math.max(0.8, Math.min(g, 2.6));
  if (g > 0) {
    s.line(130, y - r, 270, y - r, { tone: 'info', width: 1.4, dash: '6 5' });
    s.line(130, y + r, 270, y + r, { tone: 'info', width: 1.4, dash: '6 5' });
    s.path(`M130 ${y - r}A12 ${r} 0 0 0 130 ${y + r}A12 ${r} 0 0 0 130 ${y - r}`, {
      tone: 'info',
      width: 1.4,
      dash: '6 5',
    });
    s.path(`M270 ${y - r}A12 ${r} 0 0 0 270 ${y + r}A12 ${r} 0 0 0 270 ${y - r}`, {
      tone: 'info',
      width: 1.4,
      dash: '6 5',
    });
    s.dimension(300, y, 300, y + r, p.gaussLabel ?? 'r', { offset: -14 });
    s.dimension(130, y + r + 22, 270, y + r + 22, 'h');
    s.text(120, y - r - 12, 'S', { italic: true, halo: true });
  }
  if (showField)
    for (const x of [165, 200, 235]) {
      const r0 = g > 0 ? r : 14;
      for (const d of [-1, 1]) {
        const a = y + d * r0;
        const b = y + d * (r0 + 30);
        if (sign > 0) s.arrow(x, a, x, b, { tone, width: 2 });
        else s.arrow(x, b, x, a, { tone, width: 2 });
      }
    }
  if (showField) s.text(250, y - (g > 0 ? r : 14) - 26, 'E', { italic: true, halo: true });
  s.text(30, y + 18, p.densityLabel ?? 'λ', { italic: true, halo: true });
  return {
    svg: s,
    title: c.L('Filo indefinito carico', 'Infinite charged wire'),
    description: c.L(
      `Filo rettilineo indefinito con densità lineare ${plainLabel(p.densityLabel ?? 'λ')}: il campo è radiale e decresce come 1/r.${g > 0 ? ` Tratteggiata la superficie di Gauss S, un cilindro coassiale di raggio ${plainLabel(p.gaussLabel ?? 'r')} e altezza h: il flusso passa solo dalla superficie laterale.` : ''}`,
      `Infinite straight wire with linear density ${plainLabel(p.densityLabel ?? 'λ')}: the field is radial and falls off as 1/r.${g > 0 ? ` Dashed: the Gaussian surface S, a coaxial cylinder of radius ${plainLabel(p.gaussLabel ?? 'r')} and height h: flux only crosses the lateral surface.` : ''}`,
    ),
  };
}

function ringDist(p: P<'charge-distribution'>, c: Ctx, sign: number, sym: string, showField: boolean): Drawn {
  const s = new Svg(400, 260);
  const C: Pt = [130, 130];
  const R = 80;
  const rx = 24;
  const tone: Tone = sign > 0 ? 'accent' : 'info';
  s.line(30, C[1], 385, C[1], { tone: 'muted', width: 1, dash: '6 4' });
  s.text(384, C[1] - 12, 'z', { italic: true, anchor: 'end' });
  s.path(`M${C[0]} ${C[1] - R}A${rx} ${R} 0 0 0 ${C[0]} ${C[1] + R}`, { tone, width: 1.4, dash: '4 4' });
  s.path(`M${C[0]} ${C[1] - R}A${rx} ${R} 0 0 1 ${C[0]} ${C[1] + R}`, { tone, width: 2.6 });
  for (let k = 0; k < 7; k++) {
    const t = -Math.PI / 2 + ((k + 0.5) * Math.PI) / 7;
    s.text(C[0] + (rx + 10) * Math.cos(t), C[1] + R * Math.sin(t), sym, { size: 11 });
  }
  s.dot(C[0], C[1], 2.6);
  s.text(C[0] - 10, C[1] + 16, 'O', { size: 12 });
  s.dimension(C[0] - rx - 34, C[1], C[0] - rx - 34, C[1] - R, p.radiusLabel ?? 'R');
  s.line(C[0] - rx - 40, C[1] - R, C[0] - 4, C[1] - R, { tone: 'muted', width: 0.8, dash: '2 3' });
  const d = p.point?.distance ?? 1;
  const zp = C[0] + d * R;
  let Ez = 0;
  if (p.point) {
    s.dot(zp, C[1], 3.6);
    s.text(zp + 2, C[1] + 18, p.point.label ?? 'P', { italic: true, halo: true });
    if (d > 0) s.dimension(C[0], C[1] + R + 22, zp, C[1] + R + 22, p.point.distanceLabel ?? 'z');
    Ez = d / (1 + d * d) ** 1.5;
    if (showField && Ez > 1e-6) {
      const len = 16 + 44 * (Ez / 0.385);
      const dir = sign > 0 ? 1 : -1;
      s.arrow(zp, C[1], zp + dir * len, C[1], { tone, width: 2.2 });
      s.text(zp + dir * (len + 12), C[1] - 12, 'E', { italic: true, halo: true });
    }
  }
  s.text(C[0] + rx + 30, C[1] - R + 4, p.densityLabel ?? 'λ', { italic: true, halo: true });
  return {
    svg: s,
    title: c.L('Anello carico e il suo asse', 'Charged ring and its axis'),
    description: c.L(
      `Anello sottile di raggio ${plainLabel(p.radiusLabel ?? 'R')} con carica uniforme (densità ${plainLabel(p.densityLabel ?? 'λ')}), visto in prospettiva; l'asse z passa per il centro O.${p.point ? ` Il punto ${plainLabel(p.point.label ?? 'P')} è sull'asse a distanza ${plainLabel(p.point.distanceLabel ?? 'z')} dal centro${Ez > 1e-6 ? ': lì il campo è diretto lungo l’asse' : ': al centro il campo è nullo'}.` : ''}`,
      `Thin ring of radius ${plainLabel(p.radiusLabel ?? 'R')} with uniform charge (density ${plainLabel(p.densityLabel ?? 'λ')}), seen in perspective; the z axis passes through the centre O.${p.point ? ` Point ${plainLabel(p.point.label ?? 'P')} is on the axis at distance ${plainLabel(p.point.distanceLabel ?? 'z')} from the centre${Ez > 1e-6 ? ': there the field points along the axis' : ': at the centre the field is zero'}.` : ''}`,
    ),
  };
}

function rodDist(p: P<'charge-distribution'>, c: Ctx, sign: number, sym: string, showField: boolean): Drawn {
  const s = new Svg(400, 290);
  const O: Pt = [110, 240];
  const L = 170;
  const tone: Tone = sign > 0 ? 'accent' : 'info';
  s.arrow(O[0] - 20, O[1], 390, O[1], { tone: 'muted', width: 1, head: 8 });
  s.arrow(O[0], O[1] + 20, O[0], 16, { tone: 'muted', width: 1, head: 8 });
  s.text(386, O[1] + 16, 'x', { italic: true, anchor: 'end' });
  s.text(O[0] - 14, 22, 'y', { italic: true });
  s.text(O[0] - 12, O[1] + 16, 'O', { size: 12 });
  s.line(O[0], O[1], O[0], O[1] - L, { tone, width: 4 });
  for (let k = 0; k < 7; k++) s.text(O[0] - 12, O[1] - 14 - k * 24, sym, { size: 11 });
  s.dimension(O[0], O[1], O[0], O[1] - L, p.radiusLabel ?? 'L', { offset: -30 });
  const d = Math.max(0.2, p.point?.distance ?? 1);
  const P0: Pt = [O[0] + d * L * 0.95, O[1]];
  s.dot(P0[0], P0[1], 3.6);
  s.text(P0[0], P0[1] + 18, p.point?.label ?? 'P', { italic: true, halo: true });
  s.dimension(O[0], O[1] + 30, P0[0], O[1] + 30, p.point?.distanceLabel ?? 'D');
  // campo di un segmento (0..L sull'asse y) nel punto (D, 0), con L = 1
  const D = d;
  const ex = (1 / D) * (1 / Math.hypot(D, 1));
  const ey = -(1 / D - 1 / Math.hypot(D, 1));
  if (showField) {
    const m = Math.hypot(ex, ey);
    const len = 70;
    const ux = (sign * ex) / m;
    const uy = (sign * ey) / m;
    const tip: Pt = [P0[0] + ux * len, P0[1] - uy * len];
    s.line(P0[0], P0[1], tip[0], P0[1], { tone, width: 1.2, dash: '4 3' });
    s.line(tip[0], P0[1], tip[0], tip[1], { tone, width: 1.2, dash: '4 3' });
    s.arrow(P0[0], P0[1], tip[0], tip[1], { tone, width: 2.2 });
    s.text(tip[0] + 14, tip[1], 'E', { italic: true, halo: true });
  }
  s.text(O[0] + 16, O[1] - L + 6, p.densityLabel ?? 'λ', { italic: true, anchor: 'start', halo: true });
  return {
    svg: s,
    title: c.L('Segmento carico', 'Charged segment'),
    description: c.L(
      `Segmento carico di lunghezza ${plainLabel(p.radiusLabel ?? 'L')} sull'asse y, con un estremo nell'origine O. Nel punto ${plainLabel(p.point?.label ?? 'P')} sull'asse x, a distanza ${plainLabel(p.point?.distanceLabel ?? 'D')}, il campo ha una componente lungo x e una lungo y ${sign > 0 ? 'negativa' : 'positiva'} (verso ${sign > 0 ? 'il basso' : "l'alto"}), perché la carica sta tutta da un lato.`,
      `Charged segment of length ${plainLabel(p.radiusLabel ?? 'L')} on the y axis, with one end at the origin O. At point ${plainLabel(p.point?.label ?? 'P')} on the x axis, at distance ${plainLabel(p.point?.distanceLabel ?? 'D')}, the field has an x component and a ${sign > 0 ? 'negative' : 'positive'} y component (pointing ${sign > 0 ? 'down' : 'up'}), because all the charge lies on one side.`,
    ),
  };
}

// --------------------------------------------------------------- campo uniforme
export function uniformField(p: P<'uniform-field'>, c: Ctx): Drawn {
  const W = 400;
  const H = 300;
  const s = new Svg(W, H);
  const f = p.field;
  const isB = f.startsWith('B');
  const Fl = p.fieldLabel ?? (isB ? 'B' : 'E');
  const pos = p.charge !== 'negative';
  s.rect(10, 10, W - 20, H - 20, { tone: 'faint', width: 1, rx: 6 });
  const C: Pt = [200, 150];
  const near = (x: number, y: number, pts: Pt[], d: number): boolean =>
    pts.some((q) => Math.hypot(q[0] - x, q[1] - y) < d);
  let title = '';
  let desc = '';
  const keep: Pt[] = [];
  if (p.object === 'particle' && (f === 'B-in' || f === 'B-out')) {
    // F = q v × B con v = +x: verso l'alto (schermo) se q·(B entrante) > 0
    const up = (pos ? 1 : -1) * (f === 'B-in' ? 1 : -1) > 0;
    const R = 88;
    const Q: Pt = [C[0], up ? C[1] + R : C[1] - R];
    keep.push(Q, C);
    const traj = p.trajectory !== false;
    fieldGrid(
      s,
      10,
      10,
      W - 10,
      H - 10,
      f === 'B-out',
      40,
      (x, y) => near(x, y, [Q], 24) || (traj && Math.abs(Math.hypot(x - C[0], y - C[1]) - R) < 9),
    );
    if (traj) {
      const ccw = up; // in basso verso destra → antiorario
      orientedCircle(s, C, R, ccw, 'accent', 1.6);
      s.dot(C[0], C[1], 2.4, 'muted');
      s.line(C[0], C[1], Q[0], Q[1], { tone: 'muted', width: 1, dash: '3 3' });
      s.text(C[0] + 12, C[1] + (Q[1] - C[1]) * 0.3, p.radiusLabel ?? 'r', { italic: true, halo: true });
    }
    s.arrow(Q[0] + 12, Q[1], Q[0] + 70, Q[1], { tone: 'accent', width: 2.4 });
    s.text(Q[0] + 78, Q[1] + (up ? 14 : -14), p.velocityLabel ?? 'v', { italic: true, halo: true });
    if (p.forces !== false) {
      const dy = up ? -1 : 1;
      s.arrow(Q[0], Q[1] + dy * 12, Q[0], Q[1] + dy * 52, { tone: 'danger', width: 2.4 });
      s.text(Q[0] - 14, Q[1] + dy * 44, 'F', { italic: true, halo: true });
    }
    s.circle(Q[0], Q[1], 10, { fill: 'surface', width: 1.6 });
    s.text(Q[0], Q[1], pos ? '+' : '−', { size: 13, weight: 700 });
    if (p.chargeLabel) s.text(Q[0] - 22, Q[1] + (up ? 18 : -18), p.chargeLabel, { italic: true, halo: true });
    title = c.L('Carica in un campo magnetico uniforme', 'Charge in a uniform magnetic field');
    desc = c.L(
      `Carica ${pos ? 'positiva' : 'negativa'} con velocità ${plainLabel(p.velocityLabel ?? 'v')} perpendicolare a un campo ${plainLabel(Fl)} uniforme ${f === 'B-in' ? 'entrante nel' : 'uscente dal'} foglio. La forza di Lorentz F = q v × B è perpendicolare alla velocità e diretta verso il centro: la carica percorre una circonferenza in senso ${up ? 'antiorario' : 'orario'}${traj ? ` di raggio ${plainLabel(p.radiusLabel ?? 'r')} = mv/(|q|B)` : ''} e la forza non compie lavoro.`,
      `${pos ? 'Positive' : 'Negative'} charge with velocity ${plainLabel(p.velocityLabel ?? 'v')} perpendicular to a uniform field ${plainLabel(Fl)} pointing ${f === 'B-in' ? 'into' : 'out of'} the page. The Lorentz force F = q v × B is perpendicular to the velocity and points to the centre: the charge moves on a circle ${up ? 'counter-clockwise' : 'clockwise'}${traj ? ` of radius ${plainLabel(p.radiusLabel ?? 'r')} = mv/(|q|B)` : ''} and the force does no work.`,
    );
  } else if (p.object === 'particle') {
    // campo elettrico verticale: parabola
    const fieldUp = f === 'E-up';
    for (let x = 50; x < W - 20; x += 50)
      if (fieldUp) s.arrow(x, H - 24, x, 24, { tone: 'muted', width: 1, head: 8 });
      else s.arrow(x, 24, x, H - 24, { tone: 'muted', width: 1, head: 8 });
    const dir = (pos ? 1 : -1) * (fieldUp ? 1 : -1); // +1 = deviata verso l'alto
    const x0 = 30;
    const y0 = C[1];
    const pts: Pt[] = [];
    for (let i = 0; i <= 60; i++) {
      const x = x0 + (i / 60) * 330;
      pts.push([x, y0 - dir * 100 * ((x - x0) / 330) ** 2]);
    }
    if (p.trajectory !== false) {
      s.polyline(pts, { tone: 'accent', width: 1.8, dash: '6 4' });
      midArrow(s, pts, 'accent', 0.7, 10);
    }
    s.arrow(x0 + 12, y0, x0 + 70, y0, { tone: 'accent', width: 2.4 });
    s.text(x0 + 66, y0 + dir * 16, p.velocityLabel ?? 'v_0', { italic: true, halo: true });
    if (p.forces !== false) {
      s.arrow(x0, y0 - dir * 12, x0, y0 - dir * 50, { tone: 'danger', width: 2.4 });
      s.text(x0 + 16, y0 - dir * 44, 'F', { italic: true, halo: true });
    }
    s.circle(x0, y0, 10, { fill: 'surface', width: 1.6 });
    s.text(x0, y0, pos ? '+' : '−', { size: 13, weight: 700 });
    title = c.L('Carica in un campo elettrico uniforme', 'Charge in a uniform electric field');
    desc = c.L(
      `Carica ${pos ? 'positiva' : 'negativa'} che entra con velocità orizzontale in un campo ${plainLabel(Fl)} uniforme diretto verso ${fieldUp ? "l'alto" : 'il basso'}: la forza qE è costante e ${dir > 0 ? "verso l'alto" : 'verso il basso'}, la traiettoria è una parabola.`,
      `${pos ? 'Positive' : 'Negative'} charge entering with horizontal velocity a uniform field ${plainLabel(Fl)} pointing ${fieldUp ? 'up' : 'down'}: the force qE is constant and points ${dir > 0 ? 'up' : 'down'}, the path is a parabola.`,
    );
  } else {
    // campo nel piano verso destra
    const th = p.angle ?? 40;
    const t = (th * Math.PI) / 180;
    const u: Pt = [Math.cos(t), -Math.sin(t)];
    const half = 70;
    const ends: Pt[] = [
      [C[0] - u[0] * half, C[1] - u[1] * half],
      [C[0] + u[0] * half, C[1] + u[1] * half],
    ];
    for (let y = 40; y < H - 20; y += 52) {
      if (Math.abs(y - C[1]) < 30 && p.object !== 'none') continue;
      s.arrow(24, y, W - 24, y, { tone: 'muted', width: 1, head: 8 });
    }
    s.text(W - 28, 26, Fl, { italic: true, halo: true });
    if (p.object === 'dipole') {
      s.line(ends[0]![0], ends[0]![1], ends[1]![0], ends[1]![1], { width: 1.6 });
      s.angleArc(C[0], C[1], 34, 0, t, 'θ');
      s.line(C[0], C[1], C[0] + 58, C[1], { tone: 'muted', width: 1, dash: '3 3' });
      s.arrow(C[0], C[1], C[0] + u[0] * 52, C[1] + u[1] * 52, { tone: 'accent', width: 2.6 });
      s.text(C[0] + u[0] * 52 - 14, C[1] + u[1] * 52 - 10, p.momentLabel ?? 'p', {
        italic: true,
        halo: true,
      });
      for (const [i, q] of [
        [0, '−'],
        [1, '+'],
      ] as const) {
        const e = ends[i]!;
        if (p.forces !== false) {
          const d = q === '+' ? 1 : -1;
          s.arrow(e[0] + d * 12, e[1], e[0] + d * 56, e[1], { tone: 'danger', width: 2.2 });
          s.text(e[0] + d * 48, e[1] - 12, q === '+' ? 'qE' : '−qE', { italic: true, size: 12, halo: true });
        }
        s.circle(e[0], e[1], 10, { fill: 'surface', width: 1.6 });
        s.text(e[0], e[1], q, { size: 13, weight: 700 });
      }
      title = c.L('Dipolo in un campo elettrico uniforme', 'Dipole in a uniform electric field');
      desc = c.L(
        `Dipolo elettrico con momento ${plainLabel(p.momentLabel ?? 'p')} che forma l'angolo θ = ${c.num(th)}° con il campo uniforme ${plainLabel(Fl)}: le forze sulle due cariche sono uguali e opposte (risultante nulla) ma formano una coppia di momento M = p × E, che tende ad allineare il dipolo al campo.`,
        `Electric dipole with moment ${plainLabel(p.momentLabel ?? 'p')} at angle θ = ${c.num(th)}° to the uniform field ${plainLabel(Fl)}: the forces on the two charges are equal and opposite (zero net force) but form a couple with torque M = p × E, which tends to align the dipole with the field.`,
      );
    } else if (p.object === 'loop') {
      // spira di taglio: perpendicolare a μ; corrente uscente all'estremo +t (t = μ ruotato di 90°)
      // e1 = C + rot90(μ) con μ = (cos t, sin t) in coordinate con y in su: rot90 = (−sin t, cos t)
      const a1: Pt = [C[0] - Math.sin(t) * half, C[1] - Math.cos(t) * half];
      const a2: Pt = [C[0] + Math.sin(t) * half, C[1] + Math.cos(t) * half];
      s.line(a1[0], a1[1], a2[0], a2[1], { width: 2.2, tone: 'muted' });
      s.line(C[0], C[1], C[0] + 58, C[1], { tone: 'muted', width: 1, dash: '3 3' });
      s.angleArc(C[0], C[1], 30, 0, t, 'θ');
      s.arrow(C[0], C[1], C[0] + u[0] * 56, C[1] + u[1] * 56, { tone: 'accent', width: 2.6 });
      s.text(C[0] + u[0] * 56 + 12, C[1] + u[1] * 56 - 6, p.momentLabel ?? 'μ', { italic: true, halo: true });
      if (p.forces !== false) {
        s.arrow(a1[0], a1[1] - 12, a1[0], a1[1] - 54, { tone: 'danger', width: 2.2 });
        s.arrow(a2[0], a2[1] + 12, a2[0], a2[1] + 54, { tone: 'danger', width: 2.2 });
        s.text(a1[0] + 14, a1[1] - 46, 'F', { italic: true, halo: true });
        s.text(a2[0] - 14, a2[1] + 46, 'F', { italic: true, halo: true });
      }
      const perp = (x: number, y: number, out: boolean): void => {
        s.circle(x, y, 9, { fill: 'surface', width: 1.6, tone: 'danger' });
        if (out) s.dot(x, y, 2.6, 'danger');
        else {
          s.line(x - 5, y - 5, x + 5, y + 5, { tone: 'danger', width: 1.6 });
          s.line(x - 5, y + 5, x + 5, y - 5, { tone: 'danger', width: 1.6 });
        }
      };
      perp(a1[0], a1[1], true);
      perp(a2[0], a2[1], false);
      title = c.L('Spira in un campo magnetico uniforme', 'Current loop in a uniform magnetic field');
      desc = c.L(
        `Spira percorsa da corrente vista di taglio (⊙ corrente uscente, ⊗ entrante), con momento magnetico ${plainLabel(p.momentLabel ?? 'μ')} a θ = ${c.num(th)}° dal campo ${plainLabel(Fl)}. Le forze sui due lati sono opposte: risultante nulla, momento M = μ × B che ruota la spira finché μ è parallelo a B.`,
        `Current loop seen edge-on (⊙ current out of the page, ⊗ into it), with magnetic moment ${plainLabel(p.momentLabel ?? 'μ')} at θ = ${c.num(th)}° to the field ${plainLabel(Fl)}. The forces on the two sides are opposite: zero net force, torque M = μ × B that turns the loop until μ is parallel to B.`,
      );
    } else {
      title = c.L('Campo uniforme', 'Uniform field');
      desc = c.L(`Campo ${plainLabel(Fl)} uniforme.`, `Uniform field ${plainLabel(Fl)}.`);
    }
  }
  if (f === 'B-in' || f === 'B-out' || f === 'E-up' || f === 'E-down') {
    s.text(W - 22, 30, Fl, { italic: true, halo: true, anchor: 'end' });
    if (p.object === 'none' && (f === 'B-in' || f === 'B-out'))
      fieldGrid(s, 10, 10, W - 10, H - 10, f === 'B-out');
    if (p.object === 'none' && !title) {
      title = c.L('Campo uniforme', 'Uniform field');
      desc = c.L(`Campo ${plainLabel(Fl)} uniforme.`, `Uniform field ${plainLabel(Fl)}.`);
    }
  }
  return { svg: s, title, description: desc };
}

// -------------------------------------------------------------------- induzione
export function induction(p: P<'induction'>, c: Ctx): Drawn {
  const fieldOut = p.field === 'out';
  const Bl = p.fieldLabel ?? 'B';
  const showI = p.induced !== false;
  const Il = p.inducedLabel ?? 'i';
  switch (p.setup) {
    case 'sliding-bar': {
      const s = new Svg(440, 280);
      const yT = 60;
      const yB = 220;
      const xL = 50;
      const right = p.velocity !== 'left';
      const bx = 280;
      fieldGrid(s, xL + 10, yT - 40, 430, yB + 40, fieldOut, 40, (x) => Math.abs(x - bx) < 16);
      s.line(xL, yT, 430, yT, { width: 2.4 });
      s.line(xL, yB, 430, yB, { width: 2.4 });
      // resistenza
      const zig: Pt[] = [[xL, yT]];
      for (let i = 0; i <= 8; i++) zig.push([xL + (i % 2 === 0 ? -8 : 8), yT + 40 + i * 10]);
      zig.push([xL, yT + 130], [xL, yB]);
      s.polyline([[xL, yT], [xL, yT + 36], ...zig.slice(1, -2), [xL, yT + 124], [xL, yB]], { width: 2 });
      s.text(xL - 16, (yT + yB) / 2, p.resistanceLabel ?? 'R', { italic: true, anchor: 'end', halo: true });
      s.line(bx, yT - 8, bx, yB + 8, { width: 5, tone: 'ink' });
      const d = right ? 1 : -1;
      s.arrow(bx + d * 8, (yT + yB) / 2, bx + d * 70, (yT + yB) / 2, { tone: 'accent', width: 2.6 });
      s.text(bx + d * 64, (yT + yB) / 2 - 14, p.velocityLabel ?? 'v', { italic: true, halo: true });
      s.dimension(bx, yT, bx, yB, p.lengthLabel ?? 'l', { offset: d * -96 });
      if (p.forceLabel) {
        s.arrow(bx + d * 8, yB - 22, bx + d * 60, yB - 22, { tone: 'success', width: 2.2 });
        s.text(bx + d * 68, yB - 22, p.forceLabel, {
          italic: true,
          anchor: d > 0 ? 'start' : 'end',
          halo: true,
        });
      }
      const increasing = right;
      const sense = lenz(fieldOut, increasing);
      if (showI) {
        // percorso: barra, rotaia sopra, resistenza, rotaia sotto (antiorario sullo schermo)
        const loop: Pt[] = [
          [bx, yB],
          [bx, yT],
          [xL, yT],
          [xL, yB],
        ];
        loopArrows(s, sense === 'ccw' ? loop : [...loop].reverse());
        s.text(bx - d * 16, yT + 22, Il, { italic: true, halo: true });
        s.arrow(bx - d * 8, yB - 26, bx - d * 56, yB - 26, { tone: 'warning', width: 2.2 });
        s.text(bx - d * 64, yB - 26, 'F_m', { italic: true, anchor: d > 0 ? 'end' : 'start', halo: true });
      }
      s.text(426, 16, Bl, { italic: true, anchor: 'end', halo: true });
      return {
        svg: s,
        title: c.L('Barretta su rotaie in un campo magnetico', 'Bar sliding on rails in a magnetic field'),
        description: c.L(
          `Due rotaie chiuse a sinistra dalla resistenza ${plainLabel(p.resistanceLabel ?? 'R')}, in un campo ${plainLabel(Bl)} uniforme ${fieldOut ? 'uscente dal' : 'entrante nel'} foglio. La barretta di lunghezza ${plainLabel(p.lengthLabel ?? 'l')} scorre verso ${right ? 'destra' : 'sinistra'}: l'area del circuito ${increasing ? 'aumenta' : 'diminuisce'}, si induce la f.e.m. B l v${showI ? ` e la corrente ${plainLabel(Il)} circola in senso ${senseText(c, sense)}; la forza magnetica F_m sulla barretta si oppone al moto (legge di Lenz)` : ''}.`,
          `Two rails closed on the left by the resistor ${plainLabel(p.resistanceLabel ?? 'R')}, in a uniform field ${plainLabel(Bl)} pointing ${fieldOut ? 'out of' : 'into'} the page. The bar of length ${plainLabel(p.lengthLabel ?? 'l')} slides to the ${right ? 'right' : 'left'}: the circuit area ${increasing ? 'grows' : 'shrinks'}, the emf B l v is induced${showI ? ` and the current ${plainLabel(Il)} flows ${senseText(c, sense)}; the magnetic force F_m on the bar opposes the motion (Lenz's law)` : ''}.`,
        ),
      };
    }
    case 'rotating-rod': {
      const s = new Svg(360, 320);
      const O: Pt = [180, 170];
      const L = 120;
      const ang = 30;
      const tip = polar(O, L, ang);
      const ccw = p.rotation !== 'cw';
      fieldGrid(s, 10, 10, 350, 310, fieldOut, 40, (x, y) => {
        // salta i punti vicini alla sbarra
        const t = ((x - O[0]) * (tip[0] - O[0]) + (y - O[1]) * (tip[1] - O[1])) / (L * L);
        const tt = Math.max(0, Math.min(1, t));
        return Math.hypot(x - O[0] - tt * (tip[0] - O[0]), y - O[1] - tt * (tip[1] - O[1])) < 16;
      });
      s.circle(O[0], O[1], L, { tone: 'faint', width: 1, dash: '4 5' });
      s.line(O[0], O[1], tip[0], tip[1], { width: 5 });
      s.circle(O[0], O[1], 6, { fill: 'surface', width: 1.6 });
      // verso di rotazione
      const a0 = ang + (ccw ? 10 : -10);
      const a1 = ang + (ccw ? 45 : -45);
      const pts: Pt[] = [];
      for (let i = 0; i <= 20; i++) pts.push(polar(O, L + 16, a0 + ((a1 - a0) * i) / 20));
      s.polyline(pts, { tone: 'accent', width: 2 });
      const last = pts[pts.length - 1]!;
      const prev = pts[pts.length - 2]!;
      s.head(last[0], last[1], last[0] - prev[0], last[1] - prev[1], 10, 'accent');
      s.text(...polar(O, L + 34, a1), p.omegaLabel ?? 'ω', { italic: true, halo: true });
      s.dimension(O[0], O[1], tip[0], tip[1], p.lengthLabel ?? 'l', { offset: 22 });
      const pivotPlus = (fieldOut ? -1 : 1) * (ccw ? 1 : -1) > 0;
      s.text(O[0] - 16, O[1] + 16, pivotPlus ? '+' : '−', { size: 15, weight: 700, halo: true });
      s.text(tip[0] + 10, tip[1] - 14, pivotPlus ? '−' : '+', { size: 15, weight: 700, halo: true });
      s.text(346, 20, Bl, { italic: true, anchor: 'end', halo: true });
      return {
        svg: s,
        title: c.L('Sbarra conduttrice in rotazione', 'Rotating conducting rod'),
        description: c.L(
          `Sbarra di lunghezza ${plainLabel(p.lengthLabel ?? 'l')} che ruota in senso ${ccw ? 'antiorario' : 'orario'} con velocità angolare ${plainLabel(p.omegaLabel ?? 'ω')} attorno a un estremo, in un campo ${plainLabel(Bl)} uniforme ${fieldOut ? 'uscente dal' : 'entrante nel'} foglio. La forza di Lorentz sposta le cariche lungo la sbarra: tra gli estremi c'è la f.e.m. ½ B ω l², con il polo positivo ${pivotPlus ? 'sul perno' : "all'estremo libero"}.`,
          `Rod of length ${plainLabel(p.lengthLabel ?? 'l')} rotating ${ccw ? 'counter-clockwise' : 'clockwise'} with angular velocity ${plainLabel(p.omegaLabel ?? 'ω')} about one end, in a uniform field ${plainLabel(Bl)} pointing ${fieldOut ? 'out of' : 'into'} the page. The Lorentz force pushes the charges along the rod: the emf between the ends is ½ B ω l², with the positive end ${pivotPlus ? 'at the pivot' : 'at the free end'}.`,
        ),
      };
    }
    case 'rotating-loop': {
      const s = new Svg(440, 290);
      const th = p.angle ?? 50;
      const t = (th * Math.PI) / 180;
      s.rect(10, 60, 56, 170, { width: 1.6, fill: 'surface2', rx: 4 });
      s.rect(374, 60, 56, 170, { width: 1.6, fill: 'surface2', rx: 4 });
      s.text(38, 145, 'N', { weight: 700, size: 16 });
      s.text(402, 145, 'S', { weight: 700, size: 16 });
      for (const y of [80, 120, 170, 210]) s.arrow(70, y, 370, y, { tone: 'muted', width: 1, head: 8 });
      s.text(352, 66, Bl, { italic: true, halo: true });
      const cx = 220;
      s.line(cx, 26, cx, 268, { tone: 'muted', width: 1, dash: '6 4' });
      // spira: piano verticale che contiene l'asse; normale n a θ da B
      const hw = 80 * Math.sin(t);
      const sk = 22 * Math.cos(t);
      const top = 78;
      const bot = 214;
      const quad: Pt[] = [
        [cx - hw, top + sk],
        [cx + hw, top - sk],
        [cx + hw, bot - sk],
        [cx - hw, bot + sk],
      ];
      s.polygon(quad, { tone: 'accent', width: 2.4, fill: 'none' });
      const nx = 80 * Math.cos(t);
      const ny = -26 * Math.sin(t);
      s.arrow(cx, 146, cx + nx, 146 + ny, { tone: 'danger', width: 2.4 });
      s.text(cx + nx + (nx >= 0 ? 12 : -12), 146 + ny - 8, 'n', { italic: true, halo: true });
      s.text(cx + 26, 168, 'θ', { italic: true, halo: true });
      s.path(`M${cx - 24} 30A24 7 0 0 0 ${cx + 24} 30`, { tone: 'accent', width: 1.8 });
      s.head(cx + 24, 29, 0.4, -1, 9, 'accent');
      s.text(cx + 34, 22, p.omegaLabel ?? 'ω', { italic: true, anchor: 'start', halo: true });
      if (p.lengthLabel)
        s.text(cx - hw - 12, (top + bot) / 2, p.lengthLabel, { italic: true, anchor: 'end', halo: true });
      return {
        svg: s,
        title: c.L(
          'Spira rotante in un campo uniforme (alternatore)',
          'Loop rotating in a uniform field (alternator)',
        ),
        description: c.L(
          `Spira (o bobina) che ruota con velocità angolare ${plainLabel(p.omegaLabel ?? 'ω')} attorno a un asse verticale, tra i poli di un magnete che produce il campo uniforme ${plainLabel(Bl)}. La normale n forma l'angolo θ = ωt con il campo (qui ${c.num(th)}°): il flusso N B S cos θ varia e la f.e.m. indotta è sinusoidale, N B S ω sin ωt.`,
          `Loop (or coil) rotating with angular velocity ${plainLabel(p.omegaLabel ?? 'ω')} about a vertical axis, between the poles of a magnet producing the uniform field ${plainLabel(Bl)}. The normal n makes the angle θ = ωt with the field (here ${c.num(th)}°): the flux N B S cos θ changes and the induced emf is sinusoidal, N B S ω sin ωt.`,
        ),
      };
    }
    case 'loop-near-wire': {
      const s = new Svg(440, 280);
      const xw = 60;
      const x0 = 160;
      const x1 = 310;
      const y0 = 80;
      const y1 = 200;
      fieldGrid(
        s,
        xw + 10,
        10,
        430,
        270,
        false,
        40,
        (x, y) => x > x0 - 14 && x < x1 + 14 && y > y0 - 14 && y < y1 + 14,
      );
      s.line(xw, 14, xw, 266, { width: 3 });
      s.arrow(xw, 170, xw, 120, { tone: 'danger', width: 3, head: 12 });
      s.text(xw - 14, 140, p.currentLabel ?? 'I', { italic: true, anchor: 'end', halo: true });
      s.rect(x0, y0, x1 - x0, y1 - y0, { tone: 'accent', width: 2.4 });
      s.dimension(xw, y1 + 34, x0, y1 + 34, p.distanceLabel ?? 'd');
      s.dimension(x0, y0, x0, y1, p.lengthLabel ?? 'h', { offset: 22 });
      s.dimension(x0, y0, x1, y0, p.widthLabel ?? 'l', { offset: -22 });
      const motion = p.motion ?? 'none';
      if (motion !== 'none') {
        const d = motion === 'away' ? 1 : -1;
        const xa = d > 0 ? x1 + 10 : x0 - 10;
        s.arrow(xa, (y0 + y1) / 2, xa + d * 60, (y0 + y1) / 2, { tone: 'success', width: 2.4 });
        s.text(xa + d * 56, (y0 + y1) / 2 - 14, p.velocityLabel ?? 'v', { italic: true, halo: true });
      }
      const trend = p.trend ?? (motion === 'none' ? 'increasing' : 'constant');
      const increasing = motion === 'toward' || (motion === 'none' && trend === 'increasing');
      const changing = motion !== 'none' || trend !== 'constant';
      const sense = lenz(false, increasing);
      if (showI && changing) {
        const loop: Pt[] = [
          [x1 - 14, y1 - 14],
          [x1 - 14, y0 + 14],
          [x0 + 14, y0 + 14],
          [x0 + 14, y1 - 14],
        ];
        s.polygon(loop, { tone: 'danger', width: 1, dash: '3 4', fill: 'none' });
        loopArrows(s, sense === 'ccw' ? loop : [...loop].reverse());
        s.text((x0 + x1) / 2, (y0 + y1) / 2, Il, { italic: true, halo: true });
      }
      s.text(426, 24, Bl, { italic: true, anchor: 'end', halo: true });
      const why =
        motion === 'away'
          ? c.L('la spira si allontana dal filo', 'the loop moves away from the wire')
          : motion === 'toward'
            ? c.L('la spira si avvicina al filo', 'the loop moves towards the wire')
            : trend === 'increasing'
              ? c.L('la corrente nel filo cresce', 'the current in the wire increases')
              : trend === 'decreasing'
                ? c.L('la corrente nel filo diminuisce', 'the current in the wire decreases')
                : c.L('nulla cambia', 'nothing changes');
      return {
        svg: s,
        title: c.L('Spira rettangolare vicino a un filo', 'Rectangular loop near a wire'),
        description: c.L(
          `Filo rettilineo con corrente ${plainLabel(p.currentLabel ?? 'I')} verso l'alto e spira rettangolare complanare di lati ${plainLabel(p.lengthLabel ?? 'h')} (parallelo al filo) e ${plainLabel(p.widthLabel ?? 'l')}, a distanza ${plainLabel(p.distanceLabel ?? 'd')}. A destra del filo il campo ${plainLabel(Bl)} entra nel foglio e decresce come 1/r. ${changing ? `Poiché ${why}, il flusso ${increasing ? 'aumenta' : 'diminuisce'} e la corrente indotta circola in senso ${senseText(c, sense)}.` : 'Il flusso è costante: nessuna corrente indotta.'}`,
          `Straight wire carrying current ${plainLabel(p.currentLabel ?? 'I')} upwards and a coplanar rectangular loop with sides ${plainLabel(p.lengthLabel ?? 'h')} (parallel to the wire) and ${plainLabel(p.widthLabel ?? 'l')}, at distance ${plainLabel(p.distanceLabel ?? 'd')}. To the right of the wire the field ${plainLabel(Bl)} points into the page and falls off as 1/r. ${changing ? `Since ${why}, the flux ${increasing ? 'increases' : 'decreases'} and the induced current flows ${senseText(c, sense)}.` : 'The flux is constant: no induced current.'}`,
        ),
      };
    }
    default: {
      // spira in un campo uniforme variabile
      const s = new Svg(360, 300);
      const C: Pt = [180, 150];
      const R = 92;
      const square = p.loop === 'square';
      fieldGrid(s, 10, 10, 350, 290, fieldOut, 40, (x, y) =>
        square
          ? Math.abs(Math.max(Math.abs(x - C[0]), Math.abs(y - C[1])) - R * 0.85) < 10
          : Math.abs(Math.hypot(x - C[0], y - C[1]) - R) < 10,
      );
      const trend = p.trend ?? 'increasing';
      const sense = lenz(fieldOut, trend === 'increasing');
      if (square) {
        const h = R * 0.85;
        const sq: Pt[] = [
          [C[0] + h, C[1] + h],
          [C[0] + h, C[1] - h],
          [C[0] - h, C[1] - h],
          [C[0] - h, C[1] + h],
        ];
        s.polygon(sq, { tone: 'accent', width: 2.4, fill: 'none' });
        if (showI && trend !== 'constant') loopArrows(s, sense === 'ccw' ? sq : [...sq].reverse());
        s.dimension(C[0] - h, C[1] + h, C[0] + h, C[1] + h, p.lengthLabel ?? 'a', { offset: 18 });
      } else {
        if (showI && trend !== 'constant') orientedCircle(s, C, R, sense === 'ccw', 'accent', 2.4);
        else s.circle(C[0], C[1], R, { tone: 'accent', width: 2.4 });
        s.dimension(C[0], C[1], ...polar(C, R, 210), p.lengthLabel ?? 'a');
      }
      if (showI && trend !== 'constant')
        s.text(C[0] + R * 0.5, C[1] - R * 0.2, Il, { italic: true, halo: true });
      s.text(346, 22, Bl, { italic: true, anchor: 'end', halo: true });
      const tr =
        trend === 'increasing'
          ? c.L('cresce', 'increases')
          : trend === 'decreasing'
            ? c.L('diminuisce', 'decreases')
            : c.L('è costante', 'is constant');
      return {
        svg: s,
        title: c.L('Spira in un campo magnetico variabile', 'Loop in a time-varying magnetic field'),
        description: c.L(
          `Spira ${square ? 'quadrata' : 'circolare'} immersa in un campo ${plainLabel(Bl)} uniforme ${fieldOut ? 'uscente dal' : 'entrante nel'} foglio, ortogonale al suo piano, che ${tr}. ${trend === 'constant' ? 'Il flusso non cambia: nessuna f.e.m. indotta.' : `Per la legge di Faraday-Lenz si induce una corrente in senso ${senseText(c, sense)}, che si oppone alla variazione del flusso.`}`,
          `${square ? 'Square' : 'Circular'} loop in a uniform field ${plainLabel(Bl)} pointing ${fieldOut ? 'out of' : 'into'} the page, perpendicular to its plane, that ${tr}. ${trend === 'constant' ? 'The flux does not change: no induced emf.' : `By Faraday-Lenz's law a ${senseText(c, sense)} current is induced, opposing the change of flux.`}`,
        ),
      };
    }
  }
}
