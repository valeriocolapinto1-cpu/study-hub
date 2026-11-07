/**
 * Schizzi di situazioni fisiche composti da primitive in coordinate del mondo
 * (x verso destra, y verso l'alto, unità arbitrarie): superfici tratteggiate,
 * linee e regioni, blocchi, dischi e anelli, aste, perni, molle, vettori, frecce
 * di rotazione, quote, angoli, etichette. La scala si adatta da sola.
 *
 * Copre la «coda lunga» delle figure di meccanica e fluidi (carrucole, aste
 * incernierate, scale, travi, tubi a U, recipienti…) senza un tipo per ciascuna;
 * i generatori costruiscono gli elementi a partire dal seme.
 */
import { listText, midArrow, plainLabel, rad, Svg, type Ctx, type Drawn, type Pt, type Tone } from '../core';
import type { DiagramParams } from '../schemas';

type P = DiagramParams['scene'];
type Item = P['items'][number];
type Txt = string | { it: string; en?: string | undefined };

const tx = (t: Txt | undefined, c: Ctx): string =>
  t === undefined ? '' : typeof t === 'string' ? t : c.lang === 'en' ? (t.en ?? t.it) : t.it;

const KIND_TONE: Record<string, Tone> = {
  weight: 'danger',
  normal: 'info',
  friction: 'warning',
  tension: 'success',
  applied: 'accent',
  velocity: 'accent2',
  acceleration: 'accent',
  other: 'accent2',
};
const WIDTH = { thin: 1, normal: 1.6, thick: 3 } as const;

/** Punti che delimitano un elemento (per il riquadro della scala). */
function extent(it: Item): Pt[] {
  switch (it.kind) {
    case 'surface':
    case 'spring':
    case 'vector':
    case 'dim':
    case 'rod':
      return [it.from, it.to];
    case 'line':
      return it.points;
    case 'block': {
      const a = rad(it.angle ?? 0);
      const hw = it.w / 2;
      const hh = it.h / 2;
      return [
        [-hw, -hh],
        [hw, -hh],
        [hw, hh],
        [-hw, hh],
      ].map(([x, y]) => [
        it.at[0] + x! * Math.cos(a) - y! * Math.sin(a),
        it.at[1] + x! * Math.sin(a) + y! * Math.cos(a),
      ]);
    }
    case 'disc':
    case 'arc':
      return [
        [
          (it.kind === 'disc' ? it.at : it.center)[0] - it.r,
          (it.kind === 'disc' ? it.at : it.center)[1] - it.r,
        ],
        [
          (it.kind === 'disc' ? it.at : it.center)[0] + it.r,
          (it.kind === 'disc' ? it.at : it.center)[1] + it.r,
        ],
      ];
    case 'rotation':
    case 'angle':
    case 'pivot':
    case 'dot':
    case 'label':
      return [it.at];
  }
}

export function scene(p: P, c: Ctx): Drawn {
  const pts = p.items.flatMap(extent);
  const minX = Math.min(...pts.map((q) => q[0]));
  const maxX = Math.max(...pts.map((q) => q[0]));
  const minY = Math.min(...pts.map((q) => q[1]));
  const maxY = Math.max(...pts.map((q) => q[1]));
  const W = p.width ?? 420;
  const pad = 30;
  const bw = Math.max(maxX - minX, 1e-9);
  const bh = Math.max(maxY - minY, 1e-9);
  const k = Math.min((W - 2 * pad) / bw, ((p.maxHeight ?? 340) - 2 * pad) / bh);
  const s = new Svg(Math.round(bw * k + 2 * pad), Math.round(bh * k + 2 * pad));
  const X = (x: number): number => pad + (x - minX) * k;
  const Y = (y: number): number => pad + (maxY - y) * k;
  const S = (q: Pt): Pt => [X(q[0]), Y(q[1])];
  const named: string[] = [];
  const vectors: string[] = [];

  const textAt = (q: Pt, t: string, o: { italic?: boolean; muted?: boolean; size?: number } = {}): void => {
    s.text(q[0], q[1], t, {
      italic: o.italic ?? true,
      halo: true,
      size: o.size ?? 14,
      ...(o.muted ? { muted: true } : {}),
    });
  };
  /** Etichetta a distanza `d` px da `q` nella direzione `deg` (gradi, antiorario). */
  const near = (q: Pt, deg: number, d: number): Pt => [
    q[0] + d * Math.cos(rad(deg)),
    q[1] - d * Math.sin(rad(deg)),
  ];

  // Prima le regioni piene, poi il resto nell'ordine dato.
  const order = [...p.items].sort((a, b) => Number(isFill(b)) - Number(isFill(a)));
  for (const it of order) {
    switch (it.kind) {
      case 'surface': {
        const a = S(it.from);
        const b = S(it.to);
        s.line(a[0], a[1], b[0], b[1], { width: 1.8 });
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const ux = (b[0] - a[0]) / len;
        const uy = (b[1] - a[1]) / len;
        // a destra del verso from → to (sullo schermo: (−uy, ux) ruotato)
        const nx = -uy;
        const ny = ux;
        for (let t = 5; t < len; t += 10) {
          const x = a[0] + ux * t;
          const y = a[1] + uy * t;
          s.line(x, y, x + nx * 8 - ux * 6, y + ny * 8 - uy * 6, { tone: 'muted', width: 1 });
        }
        if (it.label) {
          const m: Pt = [(a[0] + b[0]) / 2 - nx * 14, (a[1] + b[1]) / 2 - ny * 14];
          textAt(m, tx(it.label, c), { italic: false, muted: true, size: 12 });
          named.push(tx(it.label, c));
        }
        break;
      }
      case 'line': {
        const q = it.points.map(S);
        const tone = it.tone ?? 'ink';
        s.polyline(
          q,
          {
            tone,
            width: WIDTH[it.width ?? 'normal'],
            ...(it.dash ? { dash: '5 4' } : {}),
            ...(it.fill ? { fill: it.fill } : {}),
          },
          it.closed ?? false,
        );
        if (it.arrow === 'mid') midArrow(s, q, tone);
        if (it.arrow === 'end' && q.length >= 2) {
          const a = q[q.length - 2]!;
          const b = q[q.length - 1]!;
          s.head(b[0], b[1], b[0] - a[0], b[1] - a[1], 9, tone);
        }
        if (it.label) {
          const at = it.labelAt ? S(it.labelAt) : q[Math.floor(q.length / 2)]!;
          textAt(at, tx(it.label, c), { italic: false, muted: true, size: 12 });
          named.push(tx(it.label, c));
        }
        break;
      }
      case 'rod': {
        const a = S(it.from);
        const b = S(it.to);
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const h = (it.thickness ?? 8) / 2;
        const nx = (-(b[1] - a[1]) / len) * h;
        const ny = ((b[0] - a[0]) / len) * h;
        s.polygon(
          [
            [a[0] + nx, a[1] + ny],
            [b[0] + nx, b[1] + ny],
            [b[0] - nx, b[1] - ny],
            [a[0] - nx, a[1] - ny],
          ],
          { fill: 'surface2', width: 1.4 },
        );
        if (it.label) {
          const m: Pt = [(a[0] + b[0]) / 2 + (nx / h) * (h + 11), (a[1] + b[1]) / 2 + (ny / h) * (h + 11)];
          textAt(m, it.label);
          named.push(c.L(`asta ${plainLabel(it.label)}`, `rod ${plainLabel(it.label)}`));
        } else named.push(c.L('asta', 'rod'));
        break;
      }
      case 'block': {
        const q = extent(it).map(S);
        s.polygon(q, { fill: 'surface2', width: 1.6 });
        if (it.label) {
          textAt(S(it.at), it.label);
          named.push(c.L(`corpo ${plainLabel(it.label)}`, `body ${plainLabel(it.label)}`));
        }
        break;
      }
      case 'disc': {
        const [cx, cy] = S(it.at);
        const r = it.r * k;
        const style = it.style ?? 'disc';
        if (style === 'ring') {
          s.circle(cx, cy, r, { width: 3.2 });
        } else {
          s.circle(cx, cy, r, { fill: 'surface2', width: 1.6 });
          if (style === 'sphere')
            s.path(`M${cx - r} ${cy}A${r} ${r * 0.3} 0 0 0 ${cx + r} ${cy}`, {
              tone: 'muted',
              width: 1,
              dash: '3 3',
            });
        }
        if (it.hole) {
          const [hx, hy] = S(it.hole.at);
          s.circle(hx, hy, it.hole.r * k, { fill: 'bg', width: 1.2, dash: '4 3' });
        }
        if (it.axle ?? true) s.circle(cx, cy, 3, { fill: 'surface', width: 1.4 });
        if (it.radius) {
          const a = rad(it.radius.angle ?? -30);
          const e: Pt = [cx + r * Math.cos(a), cy - r * Math.sin(a)];
          s.line(cx, cy, e[0], e[1], { tone: 'muted', width: 1 });
          textAt(
            near([(cx + e[0]) / 2, (cy + e[1]) / 2], (it.radius.angle ?? -30) + 90, 10),
            it.radius.label ?? 'R',
          );
        }
        if (it.label) {
          const lp =
            it.labelAngle === undefined
              ? [cx, cy + ((it.axle ?? true) ? 14 : 0)]
              : near([cx, cy], it.labelAngle, r + 12);
          textAt(lp as Pt, it.label);
        }
        const what =
          style === 'ring'
            ? c.L('anello', 'ring')
            : style === 'sphere'
              ? c.L('sfera', 'sphere')
              : c.L('disco', 'disc');
        named.push(it.label ? `${what} ${plainLabel(it.label)}` : what);
        break;
      }
      case 'pivot': {
        const [x, y] = S(it.at);
        const style = it.style ?? 'hinge';
        if (style === 'pin') {
          s.circle(x, y, 4, { fill: 'surface', width: 1.6 });
        } else {
          const h = 14;
          s.polygon(
            [
              [x, y],
              [x - 9, y + h],
              [x + 9, y + h],
            ],
            { fill: 'surface', width: 1.4 },
          );
          s.ground(x - 14, y + h, x + 14);
          if (style === 'hinge') s.circle(x, y, 3.5, { fill: 'surface', width: 1.6 });
        }
        if (it.label) textAt(near([x, y], it.labelAngle ?? 150, 14), it.label);
        named.push(c.L('perno', 'pivot') + (it.label ? ` ${plainLabel(it.label)}` : ''));
        break;
      }
      case 'spring': {
        const a = S(it.from);
        const b = S(it.to);
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const ux = (b[0] - a[0]) / len;
        const uy = (b[1] - a[1]) / len;
        const lead = Math.min(10, len * 0.15);
        const coils = it.coils ?? 8;
        const zz: Pt[] = [a, [a[0] + ux * lead, a[1] + uy * lead]];
        for (let i = 1; i < coils * 2; i++) {
          const t = lead + ((len - 2 * lead) * i) / (coils * 2);
          const side = i % 2 ? 1 : -1;
          zz.push([a[0] + ux * t - uy * 7 * side, a[1] + uy * t + ux * 7 * side]);
        }
        zz.push([b[0] - ux * lead, b[1] - uy * lead], b);
        s.polyline(zz, { width: 1.5 });
        if (it.label) textAt([(a[0] + b[0]) / 2 - uy * 18, (a[1] + b[1]) / 2 + ux * 18], it.label);
        named.push(c.L('molla', 'spring') + (it.label ? ` ${plainLabel(it.label)}` : ''));
        break;
      }
      case 'vector': {
        const a = S(it.from);
        const b = S(it.to);
        const tone = it.tone ?? KIND_TONE[it.vkind ?? 'other'] ?? 'accent2';
        s.arrow(a[0], a[1], b[0], b[1], { tone, width: 2.2, ...(it.dash ? { dash: '5 4' } : {}) });
        if (it.label) {
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
          const lp: Pt =
            it.labelAngle === undefined
              ? [b[0] + ((b[0] - a[0]) / len) * 13, b[1] + ((b[1] - a[1]) / len) * 13]
              : near(b, it.labelAngle, 13);
          textAt(lp, it.label);
          vectors.push(plainLabel(it.label));
        }
        break;
      }
      case 'rotation': {
        const [cx, cy] = S(it.at);
        const r = it.r;
        const a0 = rad(it.from);
        const a1 = rad(it.to);
        const n = 24;
        const q: Pt[] = [];
        for (let i = 0; i <= n; i++) {
          const a = a0 + ((a1 - a0) * i) / n;
          q.push([cx + r * Math.cos(a), cy - r * Math.sin(a)]);
        }
        const tone = it.tone ?? 'accent';
        s.polyline(q.slice(0, -1), { tone, width: 1.8 });
        const e = q[q.length - 1]!;
        const d = q[q.length - 2]!;
        s.head(e[0], e[1], e[0] - d[0], e[1] - d[1], 9, tone);
        if (it.label) {
          const am = (it.from + it.to) / 2;
          textAt(near([cx, cy], am, r + 12), it.label);
          vectors.push(plainLabel(it.label));
        }
        break;
      }
      case 'arc': {
        const [cx, cy] = S(it.center);
        const r = it.r * k;
        const from = it.from ?? 0;
        const to = it.to ?? 360;
        const n = Math.max(12, Math.ceil(Math.abs(to - from) / 5));
        const q: Pt[] = [];
        for (let i = 0; i <= n; i++) {
          const a = rad(from + ((to - from) * i) / n);
          q.push([cx + r * Math.cos(a), cy - r * Math.sin(a)]);
        }
        s.polyline(q, {
          tone: it.tone ?? 'ink',
          width: WIDTH[it.width ?? 'normal'],
          ...(it.dash ? { dash: '5 4' } : {}),
        });
        break;
      }
      case 'dim': {
        const a = S(it.from);
        const b = S(it.to);
        s.dimension(a[0], a[1], b[0], b[1], it.label, { offset: it.offset ?? 0 });
        named.push(c.L(`quota ${plainLabel(it.label)}`, `dimension ${plainLabel(it.label)}`));
        break;
      }
      case 'angle': {
        const [x, y] = S(it.at);
        s.angleArc(x, y, it.r ?? 28, rad(it.from), rad(it.to), it.label);
        if (it.label) named.push(c.L(`angolo ${plainLabel(it.label)}`, `angle ${plainLabel(it.label)}`));
        break;
      }
      case 'dot': {
        const [x, y] = S(it.at);
        s.dot(x, y, 3.5, it.tone ?? 'ink');
        if (it.label) {
          textAt(near([x, y], it.labelAngle ?? 45, 13), it.label);
          named.push(c.L(`punto ${plainLabel(it.label)}`, `point ${plainLabel(it.label)}`));
        }
        break;
      }
      case 'label': {
        const [x, y] = S(it.at);
        const t = tx(it.text, c);
        textAt([x, y], t, { italic: it.italic ?? false, muted: it.muted ?? false, size: it.size ?? 13 });
        named.push(plainLabel(t));
        break;
      }
    }
  }
  const title = p.title
    ? tx(p.title, c)
    : c.L('Schema della situazione fisica', 'Sketch of the physical situation');
  const parts: string[] = [];
  if (p.description) parts.push(tx(p.description, c));
  if (named.length)
    parts.push(c.L(`Elementi: ${listText(uniq(named), 'it')}.`, `Elements: ${listText(uniq(named), 'en')}.`));
  if (vectors.length)
    parts.push(
      c.L(`Vettori: ${listText(uniq(vectors), 'it')}.`, `Vectors: ${listText(uniq(vectors), 'en')}.`),
    );
  return { svg: s, title, description: parts.join(' ') || title };
}

const isFill = (it: Item): boolean => it.kind === 'line' && !!it.fill && it.fill !== 'none';
const uniq = (a: string[]): string[] => [...new Set(a.filter(Boolean))];
