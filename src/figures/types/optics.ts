/**
 * Ottica ondulatoria e geometrica: riflessione e rifrazione su una superficie piana (Snell, angolo
 * limite, Brewster), fenditure singola e doppia con il profilo di intensità sullo schermo, catena di
 * polarizzatori con la legge di Malus. Angoli e intensità sono calcolati dai parametri.
 */
import { midArrow, plainLabel, Svg, type Ctx, type Drawn, type Pt } from '../core';
import type { DiagramParams } from '../schemas';

type P<K extends keyof DiagramParams> = DiagramParams[K];
type Txt = string | { it: string; en?: string | undefined };
const tx = (t: Txt, c: Ctx): string => (typeof t === 'string' ? t : c.lang === 'en' ? (t.en ?? t.it) : t.it);
const deg = (r: number): number => (r * 180) / Math.PI;

// -------------------------------------------------------------- rifrazione
export function refraction(p: P<'refraction'>, c: Ctx): Drawn {
  const W = 400;
  const H = 300;
  const s = new Svg(W, H);
  const O: Pt = [200, 150];
  const L = 128;
  const t1 = (p.incidence * Math.PI) / 180;
  const sin2 = (p.n1 * Math.sin(t1)) / p.n2;
  const total = sin2 > 1 + 1e-9;
  const t2 = total ? NaN : Math.asin(Math.min(1, sin2));
  const tc = p.n1 > p.n2 ? Math.asin(p.n2 / p.n1) : NaN;
  const tb = Math.atan(p.n2 / p.n1);
  const brewster = Math.abs(t1 - tb) < (0.6 * Math.PI) / 180;
  if (p.n2 !== p.n1)
    s.rect(10, p.n2 > p.n1 ? O[1] : 10, W - 20, H / 2 - 10, { tone: 'faint', width: 0, fill: 'surface2' });
  s.line(10, O[1], W - 10, O[1], { width: 1.8 });
  s.line(O[0], 16, O[0], H - 16, { tone: 'muted', width: 1, dash: '5 4' });
  const ml = p.mediumLabels;
  s.text(20, 28, `n_1 = ${c.num(p.n1)}`, { anchor: 'start', halo: true });
  s.text(20, H - 22, `n_2 = ${c.num(p.n2)}`, { anchor: 'start', halo: true });
  if (ml) {
    s.text(20, 48, tx(ml[0]!, c), { anchor: 'start', muted: true, size: 12, halo: true });
    s.text(20, H - 42, tx(ml[1]!, c), { anchor: 'start', muted: true, size: 12, halo: true });
  }
  const pol = p.polarization === true;
  /** Segni di polarizzazione lungo un raggio: punti (⊥) e trattini (∥). */
  const marks = (a: Pt, b: Pt, dots: boolean, dashes: boolean): void => {
    const n = 4;
    const ux = (b[0] - a[0]) / Math.hypot(b[0] - a[0], b[1] - a[1]);
    const uy = (b[1] - a[1]) / Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let i = 1; i <= n; i++) {
      const f = 0.15 + (0.7 * i) / (n + 1);
      const x = a[0] + (b[0] - a[0]) * f;
      const y = a[1] + (b[1] - a[1]) * f;
      if (dots && (i % 2 === 1 || !dashes)) s.dot(x, y, 2.6, 'warning');
      if (dashes && (i % 2 === 0 || !dots))
        s.line(x - uy * 7, y + ux * 7, x + uy * 7, y - ux * 7, { tone: 'warning', width: 1.8 });
    }
  };
  const inc: Pt = [O[0] - L * Math.sin(t1), O[1] - L * Math.cos(t1)];
  s.line(inc[0], inc[1], O[0], O[1], { tone: 'accent', width: 2.4 });
  midArrow(s, [inc, O], 'accent', 0.55, 11);
  if (pol) marks(inc, O, true, true);
  const showRefl = p.reflected !== false || total;
  if (showRefl) {
    const r: Pt = [O[0] + L * Math.sin(t1), O[1] - L * Math.cos(t1)];
    s.line(O[0], O[1], r[0], r[1], {
      tone: 'accent',
      width: total ? 2.4 : 1.5,
      dash: total ? undefined : '7 4',
    });
    midArrow(s, [O, r], 'accent', 0.6, 10);
    if (pol) marks(O, r, true, !brewster);
    if (p.incidence > 0) s.angleArc(O[0], O[1], 36, Math.PI / 2 - t1, Math.PI / 2, 'θ_r');
  }
  if (!total) {
    const crit = p.critical === true && Math.abs(sin2 - 1) < 0.02;
    const r: Pt = [O[0] + L * Math.sin(t2), O[1] + L * Math.cos(t2)];
    s.line(O[0], O[1], r[0], r[1], { tone: 'info', width: 2.4, dash: crit ? '6 4' : undefined });
    midArrow(s, [O, r], 'info', 0.6, 11);
    if (pol) marks(O, r, true, true);
    if (t2 > 0.01) s.angleArc(O[0], O[1], 40, -Math.PI / 2, -Math.PI / 2 + t2, 'θ_2');
  }
  if (p.incidence > 0) s.angleArc(O[0], O[1], 46, Math.PI / 2, Math.PI / 2 + t1, 'θ_1');
  if (p.values !== false) {
    const lines = [`θ_1 = ${c.num(p.incidence)}°`];
    if (!total) lines.push(`θ_2 = ${c.num(deg(t2))}°`);
    if (Number.isFinite(tc)) lines.push(`θ_c = ${c.num(deg(tc))}°`);
    if (pol) lines.push(`θ_B = ${c.num(deg(tb))}°`);
    lines.forEach((l, i) => s.text(W - 20, 28 + i * 18, l, { anchor: 'end', size: 12, halo: true }));
  }
  const title = total
    ? c.L('Riflessione totale', 'Total internal reflection')
    : c.L('Riflessione e rifrazione', 'Reflection and refraction');
  const desc = c.L(
    `Raggio che passa da un mezzo con indice ${c.num(p.n1)} a uno con indice ${c.num(p.n2)} con angolo di incidenza ${c.num(p.incidence)}° dalla normale (tratteggiata). ${total ? `L'angolo supera l'angolo limite (${c.num(deg(tc))}°): non c'è raggio rifratto, la luce è riflessa tutta.` : `Per la legge di Snell il raggio rifratto forma ${c.num(deg(t2))}° con la normale${p.n2 > p.n1 ? ', avvicinandosi' : p.n2 < p.n1 ? ', allontanandosi' : ''}${showRefl ? '; il raggio riflesso forma lo stesso angolo di quello incidente' : ''}.`}${pol ? (brewster ? ' Siamo all’angolo di Brewster: il raggio riflesso è polarizzato perpendicolarmente al piano di incidenza (punti).' : ' Punti e trattini indicano le componenti di polarizzazione perpendicolare e parallela al piano di incidenza.') : ''}`,
    `Ray going from a medium with index ${c.num(p.n1)} to one with index ${c.num(p.n2)} at ${c.num(p.incidence)}° from the normal (dashed). ${total ? `The angle exceeds the critical angle (${c.num(deg(tc))}°): there is no refracted ray, all the light is reflected.` : `By Snell's law the refracted ray makes ${c.num(deg(t2))}° with the normal${p.n2 > p.n1 ? ', bending towards it' : p.n2 < p.n1 ? ', bending away from it' : ''}${showRefl ? '; the reflected ray makes the same angle as the incident one' : ''}.`}${pol ? (brewster ? ' This is Brewster’s angle: the reflected ray is polarized perpendicular to the plane of incidence (dots).' : ' Dots and dashes mark the polarization components perpendicular and parallel to the plane of incidence.') : ''}`,
  );
  return { svg: s, title, description: desc };
}

// ---------------------------------------------------------------- fenditure
export function slits(p: P<'slits'>, c: Ctx): Drawn {
  const W = 460;
  const H = 300;
  const s = new Svg(W, H);
  const yc = 150;
  const xb = 130;
  const xs = 340;
  const two = p.slits === 2;
  const a = p.width ?? (two ? 2 : 6);
  const d = p.separation ?? 12;
  // fronti d'onda in arrivo
  for (let x = 24; x < xb - 10; x += 16) s.line(x, 60, x, 240, { tone: 'muted', width: 1 });
  s.arrow(30, 40, 96, 40, { tone: 'accent', width: 2 });
  s.text(62, 26, 'λ', { italic: true });
  // schermo con le aperture
  const gap = two ? 10 : 34;
  const sep = two ? 64 : 0;
  const openings = two ? [yc - sep / 2, yc + sep / 2] : [yc];
  let y = 20;
  for (const o of openings) {
    s.line(xb, y, xb, o - gap / 2, { width: 4 });
    y = o + gap / 2;
  }
  s.line(xb, y, xb, H - 20, { width: 4 });
  if (p.plate && two) {
    s.rect(xb + 4, openings[0]! - 14, 12, 28, { tone: 'info', width: 1.4, fill: 'soft' });
    if (p.plateLabel)
      s.text(xb + 22, openings[0]! - 24, p.plateLabel, {
        italic: true,
        anchor: 'start',
        size: 12,
        halo: true,
      });
  }
  if (two) s.dimension(xb - 18, openings[0]!, xb - 18, openings[1]!, p.separationLabel ?? 'd');
  else s.dimension(xb - 18, yc - gap / 2, xb - 18, yc + gap / 2, p.widthLabel ?? 'a');
  // schermo di osservazione
  s.line(xs, 20, xs, H - 20, { width: 2 });
  s.dimension(xb, H - 30, xs, H - 30, p.distanceLabel ?? 'L', { offset: 0 });
  // raggi verso un punto P
  const yp = 92;
  for (const o of openings) s.line(xb + 2, o, xs, yp, { tone: 'muted', width: 1, dash: '4 4' });
  s.line(xb, yc, xs, yc, { tone: 'muted', width: 0.8, dash: '2 4' });
  s.dot(xs, yp, 3);
  s.text(xs - 10, yp - 10, 'P', { italic: true, halo: true });
  s.angleArc(xb, yc, 70, 0, Math.atan2(yc - yp, xs - xb), 'θ');
  // profilo di intensità
  const shift = p.plate && two ? 0.35 : 0;
  const span = two ? 3.3 / d : 2.6 / a; // sin θ al bordo della figura
  const I = (yy: number): number => {
    const st = ((yc - yy) / (H / 2 - 24)) * span;
    const b = Math.PI * a * st;
    const env = Math.abs(b) < 1e-9 ? 1 : (Math.sin(b) / b) ** 2;
    if (!two) return env;
    const al = Math.PI * (d * st - shift);
    return env * Math.cos(al) ** 2;
  };
  const pts: Pt[] = [];
  const pw = 92;
  let maxima: number[] = [];
  let prev = -1;
  let prev2 = -1;
  for (let yy = 26; yy <= H - 26; yy += 0.5) {
    const v = I(yy);
    pts.push([xs + 4 + pw * v, yy]);
    if (prev > prev2 && prev > v && prev > 0.2) maxima.push(yy - 0.5);
    prev2 = prev;
    prev = v;
  }
  if (p.pattern !== false) {
    s.polyline(pts, { tone: 'accent', width: 1.8 });
    s.text(xs + 4 + pw, 20, 'I', { italic: true, anchor: 'end' });
    maxima = maxima.sort((u, v) => Math.abs(u - yc) - Math.abs(v - yc));
    const m0 = maxima[0];
    if (two && m0 !== undefined) {
      const m1 = maxima.find((m) => m < m0 - 4);
      if (m1 !== undefined)
        s.dimension(xs + pw + 14, m1, xs + pw + 14, m0, p.fringeLabel ?? 'Δy', { offset: 0 });
    }
    if (!two) {
      const half = (H / 2 - 24) / span / a; // primo minimo: sin θ = λ/a
      s.dimension(xs + pw + 14, yc - half, xs + pw + 14, yc + half, p.fringeLabel ?? '2Δy', { offset: 0 });
    }
  }
  const title = two
    ? c.L('Esperimento di Young (doppia fenditura)', 'Young’s experiment (double slit)')
    : c.L('Diffrazione da una fenditura', 'Single-slit diffraction');
  const desc = two
    ? c.L(
        `Onda piana di lunghezza d'onda λ su due fenditure distanti ${plainLabel(p.separationLabel ?? 'd')}; lo schermo è a distanza ${plainLabel(p.distanceLabel ?? 'L')}. Sullo schermo frange chiare equidistanti (d sin θ = mλ), distanti ${plainLabel(p.fringeLabel ?? 'Δy')} = λL/d, modulate dalla diffrazione di ciascuna fenditura.${p.plate ? ' Una lastrina trasparente davanti alla fenditura superiore allunga il cammino ottico: tutta la figura si sposta verso quella fenditura.' : ''}`,
        `Plane wave of wavelength λ on two slits ${plainLabel(p.separationLabel ?? 'd')} apart; the screen is at distance ${plainLabel(p.distanceLabel ?? 'L')}. On the screen, equally spaced bright fringes (d sin θ = mλ), ${plainLabel(p.fringeLabel ?? 'Δy')} = λL/d apart, modulated by the diffraction of each slit.${p.plate ? ' A thin transparent plate in front of the upper slit lengthens the optical path: the whole pattern shifts towards that slit.' : ''}`,
      )
    : c.L(
        `Onda piana di lunghezza d'onda λ su una fenditura di larghezza ${plainLabel(p.widthLabel ?? 'a')}; schermo a distanza ${plainLabel(p.distanceLabel ?? 'L')}. Il massimo centrale è largo il doppio degli altri; i minimi cadono dove a sin θ = mλ, quindi una fenditura più stretta allarga la figura.`,
        `Plane wave of wavelength λ on a slit of width ${plainLabel(p.widthLabel ?? 'a')}; screen at distance ${plainLabel(p.distanceLabel ?? 'L')}. The central maximum is twice as wide as the others; the minima fall where a sin θ = mλ, so a narrower slit spreads the pattern.`,
      );
  return { svg: s, title, description: desc };
}

// ------------------------------------------------------------ polarizzatori
export function polarizers(p: P<'polarizers'>, c: Ctx): Drawn {
  const n = p.axes.length;
  const gapX = 110;
  const W = 70 + n * gapX + 60;
  const H = 210;
  const s = new Svg(W, H);
  const y = 96;
  const I0 = p.intensityLabel ?? 'I_0';
  const unpol = p.unpolarized !== false;
  // luce incidente
  const x0 = 40;
  s.arrow(10, y, 10 + 0.6 * gapX, y, { tone: 'accent', width: 2 });
  const sym = (x: number, axis: number | null): void => {
    const dirs = axis === null ? [0, 45, 90, 135] : [axis];
    for (const a of dirs) {
      const t = (a * Math.PI) / 180;
      const dx = Math.sin(t) * 16;
      const dy = -Math.cos(t) * 16;
      s.arrow(x - dx, y - 40 - dy, x + dx, y - 40 + dy, {
        tone: 'warning',
        width: 1.6,
        double: true,
        head: 6,
      });
    }
  };
  sym(x0, unpol ? null : 0);
  s.text(x0, y + 50, I0, { italic: true });
  let I = 1;
  let prevAxis: number | null = unpol ? null : 0;
  const values: string[] = [];
  p.axes.forEach((ax, i) => {
    const x = 70 + gapX * (i + 0.5);
    s.circle(x, y, 34, { tone: 'ink', width: 1.6, fill: 'surface2' });
    const t = (ax * Math.PI) / 180;
    s.line(x - Math.sin(t) * 28, y + Math.cos(t) * 28, x + Math.sin(t) * 28, y - Math.cos(t) * 28, {
      width: 2.2,
    });
    s.text(x, y + 50, `${c.num(ax)}°`, { size: 12, muted: true });
    I = prevAxis === null ? I / 2 : I * Math.cos(((ax - prevAxis) * Math.PI) / 180) ** 2;
    prevAxis = ax;
    const xm = x + gapX / 2;
    s.arrow(x + 36, y, x + gapX - 38 + (i === n - 1 ? 30 : 0), y, { tone: 'accent', width: 2 });
    sym(xm, ax);
    const v = I < 1e-9 ? '0' : `${c.num(I, 3)}·${I0}`;
    values.push(v);
    if (p.intensities !== false) s.text(xm, y + 72, v, { size: 12, halo: true });
  });
  return {
    svg: s,
    title: c.L('Polarizzatori in serie', 'Polarizers in series'),
    description: c.L(
      `Luce ${unpol ? 'non polarizzata' : 'polarizzata verticalmente'} di intensità ${plainLabel(I0)} attraversa ${n === 1 ? 'un polarizzatore' : `${n} polarizzatori`} con assi a ${p.axes.map((a) => `${c.num(a)}°`).join(', ')} dalla verticale. ${unpol ? 'Il primo dimezza l’intensità; ' : ''}ciascun polarizzatore trasmette la componente lungo il proprio asse (legge di Malus, I = I′ cos² θ). Intensità dopo ogni elemento: ${values.map(plainLabel).join(', ')}.`,
      `${unpol ? 'Unpolarized' : 'Vertically polarized'} light of intensity ${plainLabel(I0)} goes through ${n === 1 ? 'a polarizer' : `${n} polarizers`} with axes at ${p.axes.map((a) => `${c.num(a)}°`).join(', ')} from the vertical. ${unpol ? 'The first halves the intensity; ' : ''}each polarizer transmits the component along its axis (Malus’s law, I = I′ cos² θ). Intensity after each element: ${values.map(plainLabel).join(', ')}.`,
    ),
  };
}
