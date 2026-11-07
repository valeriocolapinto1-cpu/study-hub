/**
 * Figure ricorrenti di Fisica 1 costruite con il tipo `scene` del kit (docs/FIGURE.md):
 * funzioni pure `grandezze → { type, params }`, usate dai generatori (parametri del seme)
 * e, con valori fissi, come riferimento per le figure degli esercizi statici.
 * Le etichette sono simboli: i valori numerici restano nell'enunciato.
 */
import type { DiagramParams, DiagramSpec } from '../../../figures/schemas';

type Item = DiagramParams['scene']['items'][number];
type Pt = [number, number];
type Txt = string | { it: string; en: string };

const scene = (
  items: Item[],
  description?: Txt,
  extra: Partial<DiagramParams['scene']> = {},
): DiagramSpec => ({
  type: 'scene',
  params: { ...(description ? { description } : {}), ...extra, items },
});
const r3 = (x: number): number => Math.round(x * 1000) / 1000;
const P = (x: number, y: number): Pt => [r3(x), r3(y)];
const cosd = (d: number): number => Math.cos((d * Math.PI) / 180);
const sind = (d: number): number => Math.sin((d * Math.PI) / 180);

/**
 * Carrucola (disco di raggio 1 con perno fisso) e una o due masse appese.
 * `heavier` indica il lato che scende (freccia dell'accelerazione).
 */
export function pulley(o: {
  masses: Array<{ label: string; side: 'left' | 'right' }>;
  discLabel?: string;
  tensions?: boolean;
  heavier?: 'left' | 'right';
  accelLabel?: string;
}): DiagramSpec {
  const items: Item[] = [
    { kind: 'surface', from: P(-2.2, 3), to: P(2.2, 3) },
    { kind: 'line', points: [P(0, 3), P(0, 0)], width: 'thick' },
    {
      kind: 'disc',
      at: P(0, 0),
      r: 1,
      label: o.discLabel ?? 'M',
      labelAngle: 90,
      radius: { angle: -35, label: 'R' },
    },
  ];
  for (const m of o.masses) {
    const x = m.side === 'left' ? -1 : 1;
    const y = m.side === (o.heavier ?? 'left') ? -4.6 : -3.6;
    items.push({ kind: 'line', points: [P(x, 0), P(x, y + 0.6)] });
    items.push({ kind: 'block', at: P(x, y), w: 1.2, h: 1.2, label: m.label });
    if (o.tensions !== false) {
      const t = m.side === 'left' ? 'T_1' : 'T_2';
      items.push({
        kind: 'vector',
        from: P(x, y + 0.6),
        to: P(x, y + 1.9),
        label: o.masses.length === 1 ? 'T' : t,
        labelAngle: m.side === 'left' ? 180 : 0,
        vkind: 'tension',
      });
    }
    items.push({
      kind: 'vector',
      from: P(x, y - 0.6),
      to: P(x, y - 1.9),
      label: `${m.label}g`,
      labelAngle: m.side === 'left' ? 180 : 0,
      vkind: 'weight',
    });
  }
  const down = o.heavier ?? o.masses[0]!.side;
  const ax = down === 'left' ? -2.3 : 2.3;
  items.push({
    kind: 'vector',
    from: P(ax, -3.2),
    to: P(ax, -4.6),
    label: o.accelLabel ?? 'a',
    labelAngle: down === 'left' ? 180 : 0,
    vkind: 'acceleration',
  });
  items.push({
    kind: 'rotation',
    at: P(0, 0),
    r: 46,
    from: down === 'left' ? 60 : 120,
    to: down === 'left' ? 130 : 50,
    label: 'α',
  });
  return scene(
    items,
    {
      it: 'Carrucola a disco con perno fisso; la fune non slitta.',
      en: 'Disc pulley on a fixed axle; the rope does not slip.',
    },
    { maxHeight: 420 },
  );
}

/** Asta incernierata a un estremo, lasciata cadere dall'orizzontale; tratteggiata la posizione verticale. */
export function rodFalling(o: { lengthLabel?: string } = {}): DiagramSpec {
  return scene(
    [
      { kind: 'pivot', at: P(0, 0), style: 'hinge', label: 'O', labelAngle: 135 },
      { kind: 'rod', from: P(0, 0), to: P(4, 0), label: o.lengthLabel ?? 'L' },
      { kind: 'line', points: [P(0, 0), P(0, -4)], dash: true, tone: 'muted', width: 'thick' },
      { kind: 'dot', at: P(2, 0), label: 'CM', labelAngle: 270 },
      { kind: 'vector', from: P(2, 0), to: P(2, -1.4), label: 'Mg', labelAngle: 0, vkind: 'weight' },
      { kind: 'rotation', at: P(0, 0), r: 60, from: -10, to: -75, label: 'ω' },
      { kind: 'dot', at: P(0, -2), label: 'CM', labelAngle: 0, tone: 'muted' },
      { kind: 'vector', from: P(0, -4), to: P(1.6, -4), label: 'v', vkind: 'velocity' },
    ],
    {
      it: "Asta incernierata in O, lasciata da ferma in orizzontale; tratteggiata la posizione verticale con la velocità dell'estremo.",
      en: 'Rod hinged at O, released from rest horizontally; dashed: the vertical position with the velocity of the free end.',
    },
  );
}

/** Pendolo fisico: asta appesa a distanza d dal centro, oppure anello appeso a un chiodo. */
export function physicalPendulum(o: { shape: 'rod' | 'ring'; angle?: number }): DiagramSpec {
  const a = o.angle ?? 18;
  const dir = (t: number): Pt => P(t * sind(a), -t * cosd(a));
  const items: Item[] = [
    { kind: 'surface', from: P(-1.5, 0.4), to: P(1.5, 0.4) },
    { kind: 'line', points: [P(0, 0.4), P(0, 0)] },
    { kind: 'line', points: [P(0, 0), P(0, -4.2)], dash: true, tone: 'muted', width: 'thin' },
  ];
  if (o.shape === 'rod') {
    items.push(
      { kind: 'rod', from: P(0, 0), to: dir(4) },
      { kind: 'pivot', at: P(0, 0), style: 'pin', label: 'O', labelAngle: 160 },
      { kind: 'dot', at: dir(2), label: 'CM', labelAngle: 0 },
      { kind: 'dim', from: P(0, 0), to: dir(2), label: 'd', offset: -16 },
    );
  } else {
    const c = dir(1.6);
    items.push(
      { kind: 'disc', at: c, r: 1.6, style: 'ring', axle: false },
      { kind: 'pivot', at: P(0, 0), style: 'pin', label: 'O', labelAngle: 160 },
      { kind: 'dot', at: c, label: 'CM', labelAngle: 0 },
      { kind: 'dim', from: P(0, 0), to: c, label: 'R', offset: -14 },
    );
  }
  const cm = o.shape === 'rod' ? dir(2) : dir(1.6);
  items.push(
    { kind: 'angle', at: P(0, 0), from: -90, to: -90 + a, r: 40, label: 'θ' },
    { kind: 'vector', from: cm, to: P(cm[0], cm[1] - 1.3), label: 'Mg', labelAngle: 0, vkind: 'weight' },
  );
  return scene(items, {
    it: 'Corpo rigido sospeso nel punto O, spostato di un angolo θ dalla verticale.',
    en: 'Rigid body suspended at point O, displaced by an angle θ from the vertical.',
  });
}

/** Scala appoggiata a un muro liscio su un pavimento scabro: forze della statica. */
export function ladder(o: { angle: number }): DiagramSpec {
  const L = 5;
  const a = o.angle;
  const top = P(0, L * sind(a));
  const foot = P(-L * cosd(a), 0);
  const mid = P(foot[0] / 2, top[1] / 2);
  return scene(
    [
      { kind: 'surface', from: P(foot[0] - 1.2, 0), to: P(0.6, 0) },
      { kind: 'surface', from: P(0, 0), to: P(0, top[1] + 0.8) },
      { kind: 'rod', from: foot, to: top, thickness: 7 },
      { kind: 'angle', at: foot, from: 0, to: a, r: 34, label: 'θ' },
      { kind: 'vector', from: mid, to: P(mid[0], mid[1] - 1.5), label: 'mg', labelAngle: 0, vkind: 'weight' },
      {
        kind: 'vector',
        from: top,
        to: P(top[0] - 1.4, top[1]),
        label: 'N_m',
        labelAngle: 90,
        vkind: 'normal',
      },
      { kind: 'vector', from: foot, to: P(foot[0], 1.5), label: 'N_p', labelAngle: 180, vkind: 'normal' },
      {
        kind: 'vector',
        from: foot,
        to: P(foot[0] + 1.4, 0),
        label: 'f_s',
        labelAngle: 270,
        vkind: 'friction',
      },
      { kind: 'dim', from: foot, to: top, label: 'L', offset: 18 },
    ],
    {
      it: 'Scala appoggiata a un muro liscio e a un pavimento scabro, inclinata di θ sul pavimento.',
      en: 'Ladder leaning on a smooth wall and a rough floor, at an angle θ to the floor.',
    },
  );
}

/** Trave su due appoggi A e B con un carico a distanza `d` (frazione della lunghezza) da A. */
export function beam(o: { loadAt: number; loadLabel?: string }): DiagramSpec {
  const L = 6;
  const x = L * o.loadAt;
  return scene(
    [
      { kind: 'rod', from: P(0, 0), to: P(L, 0), thickness: 10 },
      { kind: 'pivot', at: P(0, -0.12), style: 'support', label: 'A', labelAngle: 200 },
      { kind: 'pivot', at: P(L, -0.12), style: 'support', label: 'B', labelAngle: -20 },
      { kind: 'block', at: P(x, 0.6), w: 0.9, h: 0.9 },
      {
        kind: 'vector',
        from: P(x, 0.15),
        to: P(x, -1.4),
        label: o.loadLabel ?? 'mg',
        labelAngle: 0,
        vkind: 'weight',
      },
      { kind: 'vector', from: P(L / 2, 0), to: P(L / 2, -1.2), label: 'Mg', labelAngle: 0, vkind: 'weight' },
      { kind: 'vector', from: P(0, -1.5), to: P(0, -0.15), label: 'R_A', labelAngle: 180, vkind: 'normal' },
      { kind: 'vector', from: P(L, -1.5), to: P(L, -0.15), label: 'R_B', labelAngle: 0, vkind: 'normal' },
      { kind: 'dim', from: P(0, 1.4), to: P(x, 1.4), label: 'd', offset: 0 },
      { kind: 'dim', from: P(0, 2.1), to: P(L, 2.1), label: 'L', offset: 0 },
    ],
    {
      it: 'Trave omogenea su due appoggi alle estremità con un carico a distanza d da A.',
      en: 'Uniform beam on two supports at its ends with a load at distance d from A.',
    },
  );
}

/** Corpo che rotola senza strisciare lungo un piano inclinato. */
export function rollingIncline(o: {
  angle: number;
  style?: 'disc' | 'sphere' | 'ring';
  height?: boolean;
  friction?: boolean;
}): DiagramSpec {
  const a = o.angle;
  const base = 7;
  const h = base * Math.tan((a * Math.PI) / 180);
  const r = 0.8;
  const t = 0.35; // posizione lungo il piano (frazione dalla cima)
  const contact = P(base * t, h * (1 - t));
  const n = P(-sind(a), cosd(a));
  const c = P(contact[0] + n[0] * r, contact[1] + n[1] * r);
  const down = P(cosd(a), -sind(a));
  const items: Item[] = [
    { kind: 'line', points: [P(0, 0), P(base, 0), P(0, h)], closed: true, fill: 'surface' },
    { kind: 'surface', from: P(-0.5, 0), to: P(base + 0.8, 0) },
    { kind: 'angle', at: P(base, 0), from: 180 - a, to: 180, r: 34, label: 'θ' },
    { kind: 'disc', at: c, r, style: o.style ?? 'disc', axle: (o.style ?? 'disc') !== 'sphere' },
    { kind: 'vector', from: c, to: P(c[0], c[1] - 1.6), label: 'mg', labelAngle: 0, vkind: 'weight' },
    {
      kind: 'vector',
      from: contact,
      to: P(contact[0] + n[0] * 1.5 - 0.0, contact[1] + n[1] * 1.5),
      label: 'N',
      labelAngle: 150,
      vkind: 'normal',
    },
    {
      kind: 'vector',
      from: P(c[0] + down[0] * 1.2 + n[0] * 0.2, c[1] + down[1] * 1.2 + n[1] * 0.2),
      to: P(c[0] + down[0] * 2.6 + n[0] * 0.2, c[1] + down[1] * 2.6 + n[1] * 0.2),
      label: 'a_{CM}',
      labelAngle: 60,
      vkind: 'acceleration',
    },
    { kind: 'rotation', at: c, r: 28, from: 120, to: 30, label: 'ω' },
  ];
  if (o.friction !== false)
    items.push({
      kind: 'vector',
      from: contact,
      to: P(contact[0] - down[0] * 1.3, contact[1] - down[1] * 1.3),
      label: 'f_s',
      labelAngle: 200,
      vkind: 'friction',
    });
  if (o.height) items.push({ kind: 'dim', from: P(-0.6, 0), to: P(-0.6, h), label: 'h', offset: 0 });
  return scene(items, {
    it: 'Corpo che rotola senza strisciare lungo un piano inclinato di θ; l’attrito statico nel punto di contatto fa ruotare il corpo.',
    en: 'Body rolling without slipping down a plane inclined at θ; static friction at the contact point makes it spin.',
  });
}

/** Rampa liscia che termina in un giro della morte di raggio R, partenza da quota h. */
export function loop(o: { hOverR: number }): DiagramSpec {
  const R = 1;
  const h = Math.min(Math.max(o.hOverR, 2.2), 4.5) * R;
  const cx = 2.6;
  const ramp: Pt[] = [];
  for (let i = 0; i <= 20; i++) {
    const x = -3 + (i / 20) * (cx + 3);
    const u = (x + 3) / (cx + 3);
    ramp.push(P(x, h * (1 - u) ** 2));
  }
  return scene(
    [
      { kind: 'surface', from: P(-3.4, 0), to: P(cx + 2, 0) },
      { kind: 'line', points: ramp, width: 'thick' },
      { kind: 'arc', center: P(cx, R), r: R, width: 'thick' },
      { kind: 'block', at: P(-3 + 0.25, h + 0.2), w: 0.45, h: 0.35, angle: -40, label: '' },
      { kind: 'dim', from: P(-3.5, 0), to: P(-3.5, h), label: 'h', offset: 0 },
      { kind: 'dim', from: P(cx, R), to: P(cx + R * cosd(35), R + R * sind(35)), label: 'R', offset: 0 },
      { kind: 'dot', at: P(cx, 2 * R), label: 'A', labelAngle: 90 },
      { kind: 'dot', at: P(cx, 0), label: 'B', labelAngle: 270 },
    ],
    {
      it: 'Guida liscia: discesa da quota h e giro della morte di raggio R; A punto più alto, B punto più basso.',
      en: 'Smooth track: descent from height h and vertical loop of radius R; A top point, B lowest point.',
    },
  );
}

/** Pendolo balistico: proiettile verso un blocco appeso a fili, e il blocco sollevato di h. */
export function ballisticPendulum(o: { angle?: number } = {}): DiagramSpec {
  const a = o.angle ?? 22;
  const Lf = 4;
  const b = P(Lf * sind(a), -Lf * cosd(a));
  const h = r3(Lf - Lf * cosd(a));
  return scene(
    [
      { kind: 'surface', from: P(-2.5, 0), to: P(2.5, 0) },
      { kind: 'line', points: [P(-0.4, 0), P(-0.4, -Lf + 0.5)], dash: true, tone: 'muted' },
      { kind: 'line', points: [P(0.4, 0), P(0.4, -Lf + 0.5)], dash: true, tone: 'muted' },
      { kind: 'block', at: P(0, -Lf), w: 1.2, h: 1, label: 'M' },
      { kind: 'block', at: P(-3.6, -Lf), w: 0.5, h: 0.22 },
      { kind: 'vector', from: P(-3.3, -Lf), to: P(-1.9, -Lf), label: 'v', labelAngle: 90, vkind: 'velocity' },
      { kind: 'label', at: P(-3.6, -Lf - 0.55), text: 'm', italic: true },
      { kind: 'line', points: [P(-0.4, 0), P(b[0] - 0.4, b[1] + 0.5)] },
      { kind: 'line', points: [P(0.4, 0), P(b[0] + 0.4, b[1] + 0.5)] },
      { kind: 'block', at: b, w: 1.2, h: 1, angle: 0, label: 'm+M' },
      { kind: 'angle', at: P(0, 0), from: -90, to: -90 + a, r: 44, label: 'θ' },
      { kind: 'dim', from: P(2.9, -Lf), to: P(2.9, -Lf + h), label: 'h', offset: 0 },
      { kind: 'line', points: [P(0.6, -Lf), P(3.1, -Lf)], dash: true, tone: 'muted', width: 'thin' },
      { kind: 'line', points: [P(b[0] + 0.6, b[1]), P(3.1, b[1])], dash: true, tone: 'muted', width: 'thin' },
    ],
    {
      it: 'Pendolo balistico: il proiettile si conficca nel blocco appeso, che risale di h deviando i fili di θ.',
      en: 'Ballistic pendulum: the bullet embeds in the hanging block, which rises by h as the strings swing by θ.',
    },
  );
}

/** Uomo (o carico) su una barca che galleggia: spostamento e centro di massa. */
export function boat(): DiagramSpec {
  return scene(
    [
      {
        kind: 'line',
        points: [P(-4, 0), P(4.5, 0), P(4.5, -1.2), P(-4, -1.2)],
        closed: true,
        fill: 'soft',
        tone: 'info',
      },
      {
        kind: 'line',
        points: [P(-2.5, 0.6), P(2.5, 0.6), P(2, -0.4), P(-2, -0.4)],
        closed: true,
        fill: 'surface2',
      },
      { kind: 'block', at: P(-2.1, 1.25), w: 0.4, h: 1.3, label: 'm' },
      { kind: 'block', at: P(2.1, 1.25), w: 0.4, h: 1.3 },
      { kind: 'label', at: P(0, 0.15), text: 'M', italic: true },
      { kind: 'dim', from: P(-2.5, -0.9), to: P(2.5, -0.9), label: 'L', offset: 0 },
      {
        kind: 'vector',
        from: P(-1.4, 2.3),
        to: P(1.4, 2.3),
        label: 'v_{uomo}',
        labelAngle: 90,
        vkind: 'velocity',
      },
      {
        kind: 'vector',
        from: P(0.6, -1.6),
        to: P(-0.8, -1.6),
        label: 'V',
        labelAngle: 270,
        vkind: 'velocity',
      },
    ],
    {
      it: 'Barca in acqua ferma con una persona che cammina da poppa a prua; senza forze esterne orizzontali il centro di massa resta fermo e la barca arretra.',
      en: 'Boat in still water with a person walking from stern to bow; with no horizontal external forces the centre of mass stays put and the boat moves back.',
    },
  );
}

/** Pallina che ruota su un piano liscio legata a un filo che passa per un foro (vista dall'alto). */
export function stringThroughHole(o: { r1?: number; r2?: number } = {}): DiagramSpec {
  const r1 = o.r1 ?? 2.5;
  const r2 = o.r2 ?? 1;
  return scene(
    [
      { kind: 'arc', center: P(0, 0), r: r1, tone: 'muted', dash: true },
      { kind: 'arc', center: P(0, 0), r: r2, tone: 'muted', dash: true },
      { kind: 'disc', at: P(0, 0), r: 0.12, axle: false },
      { kind: 'line', points: [P(0, 0), P(r1, 0)], tone: 'success' },
      { kind: 'disc', at: P(r1, 0), r: 0.22, axle: false, style: 'sphere', label: 'm', labelAngle: -30 },
      { kind: 'vector', from: P(r1, 0), to: P(r1, 1.6), label: 'v_1', labelAngle: 0, vkind: 'velocity' },
      { kind: 'disc', at: P(0, r2), r: 0.22, axle: false, style: 'sphere' },
      { kind: 'vector', from: P(0, r2), to: P(-1.9, r2), label: 'v_2', labelAngle: 90, vkind: 'velocity' },
      { kind: 'dim', from: P(0, 0), to: P(r1 * cosd(-40), r1 * sind(-40)), label: 'r_1', offset: 0 },
      { kind: 'dim', from: P(0, 0), to: P(r2 * cosd(-140), r2 * sind(-140)), label: 'r_2', offset: 0 },
      {
        kind: 'vector',
        from: P(r1 - 0.25, 0),
        to: P(r1 - 1.3, 0),
        label: 'T',
        labelAngle: 270,
        vkind: 'tension',
      },
    ],
    {
      it: "Vista dall'alto: la pallina gira legata a un filo che passa per il foro centrale; tirando il filo il raggio passa da r₁ a r₂ e il momento angolare rispetto al foro si conserva.",
      en: 'Top view: the ball circles on a string through the central hole; pulling the string reduces the radius from r₁ to r₂ while the angular momentum about the hole is conserved.',
    },
  );
}

/** Disco di inerzia I con momento frenante o motore (volano). */
export function flywheel(o: { torque?: 'brake' | 'drive'; rimPoint?: boolean } = {}): DiagramSpec {
  const items: Item[] = [
    { kind: 'disc', at: P(0, 0), r: 2, label: 'I', labelAngle: 225, radius: { angle: 200, label: 'R' } },
    { kind: 'rotation', at: P(0, 0), r: 72, from: 20, to: 110, label: 'ω', tone: 'accent2' },
  ];
  if (o.torque === 'brake')
    items.push({ kind: 'rotation', at: P(0, 0), r: 30, from: 150, to: 60, label: 'τ', tone: 'warning' });
  if (o.torque === 'drive')
    items.push({ kind: 'rotation', at: P(0, 0), r: 30, from: 60, to: 150, label: 'α', tone: 'accent' });
  if (o.rimPoint) {
    const p = P(2 * cosd(-30), 2 * sind(-30));
    items.push(
      { kind: 'dot', at: p },
      {
        kind: 'vector',
        from: p,
        to: P(p[0] + 1.2 * sind(-30) * -1, p[1] + 1.2 * cosd(-30)),
        label: 'a_t',
        labelAngle: 0,
        vkind: 'acceleration',
      },
      {
        kind: 'vector',
        from: p,
        to: P(p[0] - 1.1 * cosd(-30), p[1] - 1.1 * sind(-30)),
        label: 'a_c',
        labelAngle: 250,
        vkind: 'acceleration',
        dash: true,
      },
    );
  }
  return scene(items, {
    it: 'Disco che ruota attorno al proprio asse fisso.',
    en: 'Disc spinning about its fixed axis.',
  });
}

/** Tubo a U con due liquidi non miscibili: colonna d'acqua h_a in un ramo, dislivello del mercurio Δh. */
export function uTube(): DiagramSpec {
  const w = 0.8;
  const out: Pt[] = [P(-2, 6), P(-2, 1), P(-1.2, 0), P(1.2, 0), P(2, 1), P(2, 6)];
  const inn: Pt[] = [P(-2 + w, 6), P(-2 + w, 1.2), P(-0.9, w), P(0.9, w), P(2 - w, 1.2), P(2 - w, 6)];
  const yl = 2.4;
  const yr = 3.2;
  const yw = 5.1;
  return scene(
    [
      {
        kind: 'line',
        points: [
          P(-2, yl),
          P(-2, 1),
          P(-1.2, 0),
          P(1.2, 0),
          P(2, 1),
          P(2, yr),
          P(2 - w, yr),
          P(2 - w, 1.2),
          P(0.9, w),
          P(-0.9, w),
          P(-2 + w, 1.2),
          P(-2 + w, yl),
        ],
        closed: true,
        fill: 'surface2',
        tone: 'muted',
        width: 'thin',
      },
      {
        kind: 'line',
        points: [P(-2, yw), P(-2, yl), P(-2 + w, yl), P(-2 + w, yw)],
        closed: true,
        fill: 'soft',
        tone: 'info',
        width: 'thin',
      },
      { kind: 'line', points: out },
      { kind: 'line', points: inn },
      { kind: 'label', at: P(0, 0.4), text: { it: 'mercurio', en: 'mercury' }, muted: true, size: 12 },
      { kind: 'label', at: P(-1.6, 6.5), text: { it: 'acqua', en: 'water' }, muted: true, size: 12 },
      { kind: 'dim', from: P(-2.5, yl), to: P(-2.5, yw), label: 'h_a', offset: 0 },
      { kind: 'line', points: [P(-2 + w, yl), P(3, yl)], dash: true, tone: 'muted', width: 'thin' },
      { kind: 'dim', from: P(2.6, yl), to: P(2.6, yr), label: 'Δh', offset: 0 },
    ],
    {
      it: 'Tubo a U con mercurio e una colonna d’acqua in un ramo: alla stessa quota nello stesso liquido la pressione è la stessa.',
      en: 'U-tube with mercury and a water column in one arm: at the same height in the same liquid the pressure is the same.',
    },
  );
}

/** Liquido in un recipiente aperto con un punto a profondità h (legge di Stevino). */
export function depth(o: { label?: Txt; bubble?: boolean } = {}): DiagramSpec {
  const items: Item[] = [
    {
      kind: 'line',
      points: [P(-3, 4), P(3, 4), P(3, 0), P(-3, 0)],
      closed: true,
      fill: 'soft',
      tone: 'info',
      width: 'thin',
    },
    { kind: 'surface', from: P(-3.2, 0), to: P(3.2, 0) },
    { kind: 'label', at: P(-2, 4.45), text: 'p₀', italic: true },
    { kind: 'dim', from: P(-2.6, 4), to: P(-2.6, 1.2), label: 'h', offset: 0 },
    { kind: 'line', points: [P(-2.4, 1.2), P(1.2, 1.2)], dash: true, tone: 'muted', width: 'thin' },
  ];
  if (o.bubble) {
    items.push(
      { kind: 'disc', at: P(1.2, 1.2), r: 0.18, axle: false, label: 'V_1', labelAngle: 0 },
      { kind: 'disc', at: P(1.2, 3.65), r: 0.3, axle: false, label: 'V_2', labelAngle: 0 },
      { kind: 'vector', from: P(1.2, 1.6), to: P(1.2, 3.1), dash: true, tone: 'muted' },
    );
  } else {
    items.push({ kind: 'dot', at: P(1.2, 1.2), label: 'p', labelAngle: 0 });
  }
  if (o.label) items.push({ kind: 'label', at: P(1.8, 0.45), text: o.label, muted: true, size: 12 });
  return scene(items, {
    it: 'Liquido in quiete con la superficie libera alla pressione atmosferica p₀: la pressione cresce linearmente con la profondità h.',
    en: 'Liquid at rest with its free surface at atmospheric pressure p₀: pressure grows linearly with depth h.',
  });
}

/** Recipiente diviso da un setto in due parti (gas diversi, gas e vuoto, due masse d'acqua). */
export function partition(o: { left: Txt; right: Txt; caption?: Txt }): DiagramSpec {
  return scene(
    [
      {
        kind: 'line',
        points: [P(-3, 2), P(3, 2), P(3, -0), P(-3, 0)],
        closed: true,
        fill: 'surface',
        width: 'thick',
      },
      { kind: 'line', points: [P(0, 2), P(0, 0)], width: 'thick', dash: true },
      { kind: 'label', at: P(-1.5, 1), text: o.left },
      { kind: 'label', at: P(1.5, 1), text: o.right },
    ],
    o.caption,
    { maxHeight: 200 },
  );
}

/** Molla verticale compressa con una pallina sopra (lancio) o pallina che cade sul piattello. */
export function verticalSpring(o: { mode: 'launch' | 'drop' }): DiagramSpec {
  const items: Item[] = [{ kind: 'surface', from: P(-2, 0), to: P(2, 0) }];
  if (o.mode === 'launch') {
    items.push(
      { kind: 'spring', from: P(0, 0), to: P(0, 1.6), label: 'k', coils: 7 },
      { kind: 'line', points: [P(-0.7, 1.6), P(0.7, 1.6)], width: 'thick' },
      { kind: 'disc', at: P(0, 1.95), r: 0.35, style: 'sphere', axle: false, label: 'm', labelAngle: 0 },
      { kind: 'line', points: [P(-1.5, 2.6), P(1.5, 2.6)], dash: true, tone: 'muted', width: 'thin' },
      { kind: 'dim', from: P(-1.3, 1.6), to: P(-1.3, 2.6), label: 'x', offset: 0 },
      { kind: 'vector', from: P(0.9, 2.4), to: P(0.9, 4), label: 'v', labelAngle: 0, vkind: 'velocity' },
      { kind: 'label', at: P(1.7, 2.85), text: { it: 'riposo', en: 'rest' }, muted: true, size: 11 },
    );
  } else {
    items.push(
      { kind: 'spring', from: P(0, 0), to: P(0, 2), label: 'k', coils: 7 },
      { kind: 'line', points: [P(-0.7, 2), P(0.7, 2)], width: 'thick' },
      { kind: 'disc', at: P(0, 4.4), r: 0.35, style: 'sphere', axle: false, label: 'm', labelAngle: 0 },
      { kind: 'dim', from: P(-1.3, 2), to: P(-1.3, 4.05), label: 'h', offset: 0 },
      {
        kind: 'vector',
        from: P(0.9, 4.2),
        to: P(0.9, 2.9),
        label: 'g',
        labelAngle: 0,
        vkind: 'acceleration',
      },
    );
  }
  return scene(
    items,
    o.mode === 'launch'
      ? {
          it: 'Molla verticale compressa di x con una pallina appoggiata sopra.',
          en: 'Vertical spring compressed by x with a ball resting on top.',
        }
      : {
          it: 'Pallina lasciata cadere da altezza h sul piattello di una molla verticale.',
          en: 'Ball dropped from height h onto the plate of a vertical spring.',
        },
  );
}

/** Rampa liscia da quota h seguita da un tratto orizzontale scabro (slitta). */
export function rampThenRough(): DiagramSpec {
  const ramp: Pt[] = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    ramp.push(P(-4 + 4 * u, 3 * (1 - u) ** 2));
  }
  return scene(
    [
      { kind: 'surface', from: P(-4.4, 0), to: P(5, 0) },
      { kind: 'line', points: ramp, width: 'thick' },
      { kind: 'line', points: [P(0.3, 0.06), P(4.8, 0.06)], tone: 'warning', width: 'thick' },
      { kind: 'block', at: P(-3.75, 3.2), w: 0.7, h: 0.4, angle: -45, label: '' },
      { kind: 'dim', from: P(-4.5, 0), to: P(-4.5, 3), label: 'h', offset: 0 },
      { kind: 'label', at: P(-1.6, 2.4), text: { it: 'liscio', en: 'smooth' }, muted: true, size: 12 },
      { kind: 'label', at: P(2.5, 0.6), text: 'μ_d', italic: true },
      { kind: 'dim', from: P(0.3, -0.6), to: P(4.8, -0.6), label: 'd', offset: 0 },
    ],
    {
      it: 'Discesa liscia da quota h, poi tratto orizzontale con attrito dinamico μ_d lungo d.',
      en: 'Smooth descent from height h, then a horizontal stretch with kinetic friction μ_k, length d.',
    },
  );
}

/** Veicolo che frena: velocità, forza frenante e spazio di frenata. */
export function braking(): DiagramSpec {
  return scene(
    [
      { kind: 'surface', from: P(-1, 0), to: P(8, 0) },
      {
        kind: 'line',
        points: [
          P(0, 0.35),
          P(0, 1.1),
          P(0.6, 1.1),
          P(1, 1.6),
          P(2.2, 1.6),
          P(2.7, 1.1),
          P(3, 1.1),
          P(3, 0.35),
        ],
        closed: true,
        fill: 'surface2',
      },
      { kind: 'disc', at: P(0.7, 0.3), r: 0.3 },
      { kind: 'disc', at: P(2.4, 0.3), r: 0.3 },
      { kind: 'vector', from: P(3, 1.9), to: P(4.6, 1.9), label: 'v_0', labelAngle: 0, vkind: 'velocity' },
      {
        kind: 'vector',
        from: P(1.5, 0.05),
        to: P(0.1, 0.05),
        label: 'F',
        labelAngle: 270,
        vkind: 'friction',
      },
      { kind: 'dim', from: P(3, -0.7), to: P(7.6, -0.7), label: 'd', offset: 0 },
      { kind: 'line', points: [P(7.6, 0), P(7.6, 1.6)], dash: true, tone: 'muted' },
      { kind: 'label', at: P(7.6, 2), text: 'v = 0', italic: true },
    ],
    {
      it: 'Veicolo che frena con forza costante F fino a fermarsi dopo lo spazio d.',
      en: 'Vehicle braking with a constant force F until it stops after a distance d.',
    },
  );
}

/** Corpo dentro un riferimento accelerato: forza apparente −mA (ascensore, camion, vagone). */
export function acceleratedFrame(o: { mode: 'elevator' | 'truck' | 'wagon'; angle?: number }): DiagramSpec {
  if (o.mode === 'elevator') {
    return scene(
      [
        { kind: 'line', points: [P(-2, 0), P(2, 0), P(2, 5), P(-2, 5)], closed: true, width: 'thick' },
        { kind: 'line', points: [P(0, 5), P(0, 6)] },
        { kind: 'block', at: P(0, 0.15), w: 1.4, h: 0.3 },
        { kind: 'block', at: P(0, 1.3), w: 0.9, h: 2, label: 'm' },
        { kind: 'vector', from: P(0, 1.3), to: P(0, -0.3), label: 'mg', labelAngle: 0, vkind: 'weight' },
        {
          kind: 'vector',
          from: P(-0.6, 0.3),
          to: P(-0.6, 2.2),
          label: 'N',
          labelAngle: 180,
          vkind: 'normal',
        },
        {
          kind: 'vector',
          from: P(2.6, 2.5),
          to: P(2.6, 4),
          label: 'A',
          labelAngle: 0,
          vkind: 'acceleration',
        },
      ],
      {
        it: 'Persona su una bilancia in un ascensore che accelera: la bilancia legge la normale N.',
        en: 'Person on a scale in an accelerating lift: the scale reads the normal force N.',
      },
    );
  }
  if (o.mode === 'truck') {
    return scene(
      [
        { kind: 'surface', from: P(-1, -0.5), to: P(7, -0.5) },
        {
          kind: 'line',
          points: [P(0, 0), P(4.5, 0), P(4.5, 0.25), P(0, 0.25)],
          closed: true,
          fill: 'surface2',
        },
        {
          kind: 'line',
          points: [P(4.5, -0.2), P(6, -0.2), P(6, 1.8), P(4.7, 1.8), P(4.5, 1.2), P(4.5, -0.2)],
          closed: true,
          fill: 'surface2',
        },
        { kind: 'disc', at: P(1, -0.2), r: 0.3 },
        { kind: 'disc', at: P(5.2, -0.2), r: 0.3 },
        { kind: 'block', at: P(2.2, 0.75), w: 1, h: 1, label: 'm' },
        {
          kind: 'vector',
          from: P(2.2, 0.25),
          to: P(3.5, 0.25),
          label: 'f_s',
          labelAngle: 270,
          vkind: 'friction',
        },
        {
          kind: 'vector',
          from: P(2.2, 0.75),
          to: P(0.9, 0.75),
          label: '−mA',
          labelAngle: 180,
          vkind: 'other',
          dash: true,
        },
        {
          kind: 'vector',
          from: P(4.8, 2.4),
          to: P(6.4, 2.4),
          label: 'A',
          labelAngle: 0,
          vkind: 'acceleration',
        },
      ],
      {
        it: "Cassa sul pianale di un camion che accelera: nel riferimento del camion compare la forza apparente −mA, bilanciata dall'attrito statico.",
        en: "Crate on the bed of an accelerating truck: in the truck's frame the fictitious force −mA appears, balanced by static friction.",
      },
    );
  }
  const a = o.angle ?? 14;
  const b = P(3 * sind(a) * -1, -3 * cosd(a));
  return scene(
    [
      { kind: 'surface', from: P(2.5, 0), to: P(-2.5, 0) },
      { kind: 'line', points: [P(0, 0), P(0, -3.3)], dash: true, tone: 'muted', width: 'thin' },
      { kind: 'line', points: [P(0, 0), b] },
      { kind: 'disc', at: b, r: 0.25, style: 'sphere', axle: false },
      { kind: 'angle', at: P(0, 0), from: -90 - a, to: -90, r: 46, label: 'θ' },
      { kind: 'vector', from: b, to: P(b[0], b[1] - 1.4), label: 'mg', labelAngle: 0, vkind: 'weight' },
      {
        kind: 'vector',
        from: b,
        to: P(b[0] - 1.1, b[1]),
        label: '−mA',
        labelAngle: 270,
        vkind: 'other',
        dash: true,
      },
      {
        kind: 'vector',
        from: P(1.2, -1.5),
        to: P(2.6, -1.5),
        label: 'A',
        labelAngle: 90,
        vkind: 'acceleration',
      },
    ],
    {
      it: "Pendolo appeso al soffitto di un vagone che accelera: all'equilibrio relativo il filo è inclinato all'indietro di θ, con tan θ = A/g.",
      en: 'Pendulum hanging from the ceiling of an accelerating carriage: at relative equilibrium the string is tilted backwards by θ, with tan θ = A/g.',
    },
  );
}

/** Asta di lunghezza L con due masse alle estremità e gli assi di rotazione considerati. */
export function rodWithMasses(): DiagramSpec {
  return scene(
    [
      { kind: 'rod', from: P(-3, 0), to: P(3, 0), thickness: 6, label: 'M' },
      { kind: 'disc', at: P(-3, 0), r: 0.3, style: 'sphere', axle: false, label: 'm', labelAngle: 90 },
      { kind: 'disc', at: P(3, 0), r: 0.3, style: 'sphere', axle: false, label: 'm', labelAngle: 90 },
      { kind: 'line', points: [P(0, -1.4), P(0, 1.4)], dash: true, tone: 'accent' },
      { kind: 'line', points: [P(-3, -1.4), P(-3, 1.4)], dash: true, tone: 'accent2' },
      { kind: 'label', at: P(0.45, -1.3), text: 'a', italic: true },
      { kind: 'label', at: P(-2.55, -1.3), text: 'b', italic: true },
      { kind: 'dim', from: P(-3, -2), to: P(3, -2), label: 'L', offset: 0 },
    ],
    {
      it: 'Asta omogenea con due masse puntiformi agli estremi; assi perpendicolari al foglio: (a) per il centro, (b) per un estremo.',
      en: 'Uniform rod with two point masses at its ends; axes perpendicular to the page: (a) through the centre, (b) through one end.',
    },
  );
}

/** Disco con un foro circolare di raggio R/2 tangente internamente al bordo. */
export function discWithHole(): DiagramSpec {
  return scene(
    [
      { kind: 'disc', at: P(0, 0), r: 2, hole: { at: P(1, 0), r: 1 }, axle: false },
      { kind: 'dot', at: P(0, 0), label: 'O', labelAngle: 135 },
      { kind: 'dim', from: P(0, 0), to: P(-2 * cosd(50), 2 * sind(50)), label: 'R', offset: 0 },
      { kind: 'dim', from: P(1, 0), to: P(2, 0), label: 'R/2', offset: 12 },
      { kind: 'dot', at: P(-1 / 3, 0), label: 'CM', labelAngle: 250, tone: 'accent' },
    ],
    {
      it: 'Disco di raggio R da cui è asportato un disco di raggio R/2 tangente al bordo; il centro di massa si sposta dalla parte opposta al foro.',
      en: 'Disc of radius R with a disc of radius R/2 removed, tangent to the rim; the centre of mass moves away from the hole.',
    },
  );
}

/** Chiave inglese: forza F all'estremità con angolo φ rispetto alla chiave, braccio b. */
export function wrench(o: { angle: number }): DiagramSpec {
  const L = 5;
  const tip = P(L, 0);
  const f = P(tip[0] + 1.8 * cosd(o.angle), 1.8 * sind(o.angle));
  return scene(
    [
      { kind: 'rod', from: P(0, 0), to: tip, thickness: 10, label: 'r' },
      { kind: 'disc', at: P(0, 0), r: 0.45, axle: true },
      { kind: 'vector', from: tip, to: f, label: 'F', vkind: 'applied' },
      { kind: 'line', points: [tip, P(tip[0] + 1.6, 0)], dash: true, tone: 'muted', width: 'thin' },
      { kind: 'angle', at: tip, from: 0, to: o.angle, r: 26, label: 'φ' },
      {
        kind: 'line',
        points: [P(tip[0] - 2.6 * cosd(o.angle), -2.6 * sind(o.angle)), tip],
        dash: true,
        tone: 'muted',
        width: 'thin',
      },
      { kind: 'rotation', at: P(0, 0), r: 30, from: -60, to: 60, label: 'τ' },
    ],
    {
      it: "Chiave che stringe un bullone: la forza F applicata all'estremità forma l'angolo φ con la chiave; il braccio è r sin φ.",
      en: 'Wrench tightening a bolt: the force F at the end makes the angle φ with the wrench; the lever arm is r sin φ.',
    },
  );
}

/** Pattinatrice (vista dall'alto stilizzata): braccia aperte e chiuse, ω cresce. */
export function skater(): DiagramSpec {
  return scene(
    [
      { kind: 'disc', at: P(-3, 0), r: 0.5, axle: false },
      { kind: 'rod', from: P(-5, 0), to: P(-1, 0), thickness: 5 },
      { kind: 'rotation', at: P(-3, 0), r: 46, from: 30, to: 150, label: 'ω_1' },
      { kind: 'label', at: P(-3, -1.4), text: 'I_1', italic: true },
      { kind: 'disc', at: P(3, 0), r: 0.5, axle: false },
      { kind: 'rod', from: P(2.3, 0), to: P(3.7, 0), thickness: 5 },
      { kind: 'rotation', at: P(3, 0), r: 30, from: 10, to: 170, label: 'ω_2' },
      { kind: 'label', at: P(3, -1.4), text: 'I_2 < I_1', italic: true },
      { kind: 'vector', from: P(-0.6, 0.9), to: P(0.9, 0.9), tone: 'muted' },
    ],
    {
      it: "Vista dall'alto: chiudendo le braccia il momento d'inerzia diminuisce e, a momento angolare costante, la velocità angolare aumenta.",
      en: 'Top view: pulling the arms in lowers the moment of inertia and, with constant angular momentum, the angular velocity increases.',
    },
    { maxHeight: 200 },
  );
}

/** Due carrelli su rotaia prima di un urto: masse e velocità con segno (per la massa ridotta). */
export function carts(): DiagramSpec {
  return scene(
    [
      { kind: 'surface', from: P(-4.5, 0), to: P(4.5, 0) },
      { kind: 'block', at: P(-2.5, 0.5), w: 1.4, h: 0.8, label: 'm_1' },
      { kind: 'block', at: P(2.5, 0.5), w: 1.6, h: 0.9, label: 'm_2' },
      {
        kind: 'vector',
        from: P(-1.7, 0.5),
        to: P(-0.3, 0.5),
        label: 'v_1',
        labelAngle: 90,
        vkind: 'velocity',
      },
      { kind: 'vector', from: P(1.6, 0.5), to: P(1, 0.5), label: 'v_2', labelAngle: 90, vkind: 'velocity' },
      { kind: 'dot', at: P(-0.6, 1.8), label: 'CM', labelAngle: 90, tone: 'accent' },
      {
        kind: 'vector',
        from: P(-0.6, 1.8),
        to: P(0.2, 1.8),
        label: 'v_{CM}',
        labelAngle: 0,
        vkind: 'velocity',
        dash: true,
      },
    ],
    {
      it: 'Due carrelli su una rotaia liscia che si vengono incontro; il centro di massa si muove con velocità costante.',
      en: 'Two carts approaching each other on a smooth track; the centre of mass moves with constant velocity.',
    },
    { maxHeight: 200 },
  );
}

/** Proiettile che esplode nel punto più alto: frammenti e traiettoria del centro di massa. */
export function explosion(): DiagramSpec {
  const parab = (v: number): Pt[] => {
    const out: Pt[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = (i / 16) * Math.sqrt(2 * 4);
      out.push(P(v * t, 4 - 0.5 * t * t));
    }
    return out;
  };
  return scene(
    [
      { kind: 'surface', from: P(-4, 0), to: P(4, 0) },
      { kind: 'line', points: [P(0, 0), P(0, 4)], dash: true, tone: 'muted' },
      { kind: 'line', points: parab(1), tone: 'accent2', arrow: 'end' },
      { kind: 'line', points: parab(-0.5), tone: 'accent', arrow: 'end' },
      { kind: 'dot', at: P(0, 4), label: 'H', labelAngle: 135 },
      { kind: 'vector', from: P(0, 4), to: P(1.3, 4), label: 'v_1', labelAngle: 90, vkind: 'velocity' },
      { kind: 'vector', from: P(0, 4), to: P(-0.8, 4), label: 'v_2', labelAngle: 90, vkind: 'velocity' },
      { kind: 'dot', at: P(0, 0), label: 'CM', labelAngle: 270, tone: 'accent' },
      { kind: 'dim', from: P(0, 0), to: P(0, 4), label: 'h', offset: 22 },
    ],
    {
      it: 'Proiettile che esplode nel punto più alto in due frammenti con velocità orizzontali opposte; il centro di massa continua la traiettoria del proiettile intero.',
      en: 'Projectile exploding at the top into two fragments with opposite horizontal velocities; the centre of mass continues the trajectory of the whole projectile.',
    },
  );
}

/** Oscillatore massa-molla con smorzatore e forzante F(t) = F₀ cos Ωt. */
export const forcedOscillator = (): DiagramSpec => ({
  type: 'spring-mass',
  params: { damper: true, displacement: 0.35, force: false },
});

/** Ruota (anello) che rotola senza strisciare su un piano: v_CM, ω e punto di contatto fermo. */
export function rollingWheel(): DiagramSpec {
  return scene(
    [
      { kind: 'surface', from: P(-3, 0), to: P(3, 0) },
      { kind: 'disc', at: P(0, 1.5), r: 1.5, style: 'ring', radius: { angle: 150, label: 'R' } },
      {
        kind: 'vector',
        from: P(0, 1.5),
        to: P(1.6, 1.5),
        label: 'v_{CM}',
        labelAngle: 90,
        vkind: 'velocity',
      },
      {
        kind: 'vector',
        from: P(0, 3),
        to: P(3.2, 3),
        label: '2v_{CM}',
        labelAngle: 90,
        vkind: 'velocity',
        dash: true,
      },
      { kind: 'rotation', at: P(0, 1.5), r: 26, from: 60, to: -30, label: 'ω' },
      { kind: 'dot', at: P(0, 0), label: 'P', labelAngle: 225 },
    ],
    {
      it: 'Ruota che rotola senza strisciare: il punto di contatto P è fermo, il centro avanza a v_CM = ωR e il punto più alto a 2v_CM.',
      en: 'Wheel rolling without slipping: the contact point P is at rest, the centre moves at v_CM = ωR and the top point at 2v_CM.',
    },
  );
}

/** Gas in un recipiente: molecole con velocità a caso (fisse, deterministiche) e urto su una parete. */
export function gasBox(o: { wall?: boolean } = {}): DiagramSpec {
  const mol: Array<[number, number, number]> = [
    [0.8, 0.7, 30],
    [2.1, 2.2, 160],
    [3.4, 1.1, 250],
    [4.6, 2.6, 80],
    [1.4, 3.1, 300],
    [3.0, 3.3, 200],
    [5.2, 1.0, 120],
    [0.6, 2.0, 10],
    [2.6, 0.5, 340],
    [4.0, 1.9, 220],
  ];
  const items: Item[] = [
    {
      kind: 'line',
      points: [P(0, 0), P(6, 0), P(6, 4), P(0, 4)],
      closed: true,
      fill: 'surface',
      width: 'thick',
    },
  ];
  mol.forEach(([x, y, a], i) => {
    items.push({ kind: 'disc', at: P(x, y), r: 0.12, axle: false });
    const l = 0.55 + (i % 3) * 0.2;
    items.push({ kind: 'vector', from: P(x, y), to: P(x + l * cosd(a), y + l * sind(a)), vkind: 'velocity' });
  });
  if (o.wall !== false) {
    items.push(
      {
        kind: 'vector',
        from: P(4.9, 3.0),
        to: P(5.85, 3.0),
        label: 'v_x',
        labelAngle: 90,
        vkind: 'velocity',
      },
      { kind: 'vector', from: P(5.85, 3.0), to: P(4.9, 3.0), vkind: 'other', dash: true },
      { kind: 'label', at: P(5.0, 3.55), text: 'Δp = 2mv_x', italic: true, size: 12 },
    );
  }
  return scene(items, {
    it: 'Molecole di gas in un recipiente, in moto disordinato; un urto elastico con la parete inverte la componente della velocità perpendicolare alla parete.',
    en: 'Gas molecules moving randomly in a container; an elastic collision with the wall reverses the velocity component perpendicular to it.',
  });
}

/** Corpo caldo immerso in acqua in un calorimetro isolato. */
export function calorimeter(o: { body: Txt; water: Txt }): DiagramSpec {
  return scene(
    [
      { kind: 'line', points: [P(-2.4, 3), P(-2.4, -0.2), P(2.4, -0.2), P(2.4, 3)], width: 'thick' },
      {
        kind: 'line',
        points: [P(-2.2, 2.3), P(2.2, 2.3), P(2.2, 0), P(-2.2, 0)],
        closed: true,
        fill: 'soft',
        tone: 'info',
        width: 'thin',
      },
      { kind: 'block', at: P(0, 0.8), w: 1.2, h: 0.9 },
      { kind: 'label', at: P(0, 0.8), text: o.body },
      { kind: 'label', at: P(-1.1, 1.9), text: o.water, muted: true, size: 12 },
    ],
    {
      it: 'Corpo immerso in acqua in un recipiente isolato: il calore ceduto dal corpo è assorbito dall’acqua fino all’equilibrio.',
      en: 'Body immersed in water in an insulated vessel: the heat released by the body is absorbed by the water until equilibrium.',
    },
    { maxHeight: 220 },
  );
}
