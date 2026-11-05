/**
 * Campi vettoriali nel piano: cariche puntiformi (o fili rettilinei), campo
 * risultante, potenziale, linee di campo integrate con Runge–Kutta 4.
 * Funzioni pure, utili per le simulazioni di Fisica 2.
 */
export type Vec = [number, number];
export type Field = (x: number, y: number) => Vec;

export interface PointSource {
  x: number;
  y: number;
  /** Carica (o corrente per i fili), con segno. */
  q: number;
}

/**
 * Campo di sorgenti puntiformi nel piano: E = k Σ q r̂ / r^p.
 * p = 2: cariche puntiformi (sezione 2D del campo 3D); p = 1: fili carichi infiniti.
 */
export function pointSourcesField(src: PointSource[], k = 1, p = 2, soft = 1e-6): Field {
  return (x, y) => {
    let ex = 0;
    let ey = 0;
    for (const s of src) {
      const dx = x - s.x;
      const dy = y - s.y;
      const r2 = dx * dx + dy * dy + soft;
      const r = Math.sqrt(r2);
      const f = (k * s.q) / r ** (p + 1);
      ex += f * dx;
      ey += f * dy;
    }
    return [ex, ey];
  };
}

/** Potenziale di cariche puntiformi (p = 2) o di fili (p = 1, a meno di una costante). */
export function pointSourcesPotential(
  src: PointSource[],
  k = 1,
  p = 2,
  soft = 1e-6,
): (x: number, y: number) => number {
  return (x, y) => {
    let v = 0;
    for (const s of src) {
      const r = Math.sqrt((x - s.x) ** 2 + (y - s.y) ** 2 + soft);
      v += p === 1 ? -k * s.q * Math.log(r) * 2 : (k * s.q) / r;
    }
    return v;
  };
}

/** Campo magnetico di fili rettilinei perpendicolari al piano (corrente q, verso uscente se positiva). */
export function wiresMagneticField(src: PointSource[], k = 1, soft = 1e-6): Field {
  const e = pointSourcesField(src, k, 1, soft);
  return (x, y) => {
    const [ex, ey] = e(x, y);
    return [-ey, ex];
  };
}

export interface Bounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface StreamOptions {
  bounds: Bounds;
  /** Passo d'integrazione in unità del piano. */
  step?: number;
  maxSteps?: number;
  /** Verso: +1 lungo il campo, −1 contro. */
  direction?: 1 | -1;
  /** Ferma la linea vicino a questi punti (es. cariche). */
  sinks?: Array<{ x: number; y: number; r: number }>;
}

/** Linea di campo da un punto iniziale (RK4 sul campo normalizzato). */
export function streamline(field: Field, seed: Vec, o: StreamOptions): Vec[] {
  const h = (o.step ?? 0.02) * (o.direction ?? 1);
  const max = o.maxSteps ?? 2000;
  const dir = (x: number, y: number): Vec => {
    const [ex, ey] = field(x, y);
    const m = Math.hypot(ex, ey);
    return m > 0 ? [ex / m, ey / m] : [0, 0];
  };
  const pts: Vec[] = [seed];
  let [x, y] = seed;
  const b = o.bounds;
  for (let i = 0; i < max; i++) {
    const k1 = dir(x, y);
    const k2 = dir(x + (h / 2) * k1[0], y + (h / 2) * k1[1]);
    const k3 = dir(x + (h / 2) * k2[0], y + (h / 2) * k2[1]);
    const k4 = dir(x + h * k3[0], y + h * k3[1]);
    const nx = x + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    const ny = y + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    if (nx === x && ny === y) break;
    x = nx;
    y = ny;
    pts.push([x, y]);
    if (x < b.xMin || x > b.xMax || y < b.yMin || y > b.yMax) break;
    if (o.sinks?.some((s) => Math.hypot(x - s.x, y - s.y) < s.r)) break;
  }
  return pts;
}

/** Punti iniziali equispaziati su cerchietti attorno alle sorgenti (n linee per unità di carica). */
export function seedsAround(
  src: PointSource[],
  perUnit = 8,
  radius = 0.05,
): Array<{ seed: Vec; direction: 1 | -1 }> {
  const out: Array<{ seed: Vec; direction: 1 | -1 }> = [];
  for (const s of src) {
    const n = Math.max(4, Math.round(Math.abs(s.q) * perUnit));
    for (let i = 0; i < n; i++) {
      const a = ((i + 0.5) * 2 * Math.PI) / n;
      out.push({
        seed: [s.x + radius * Math.cos(a), s.y + radius * Math.sin(a)],
        direction: s.q >= 0 ? 1 : -1,
      });
    }
  }
  return out;
}

/** Campionamento su griglia (per frecce): punti e vettori. */
export function sampleGrid(
  field: Field,
  b: Bounds,
  nx: number,
  ny: number,
): Array<{ x: number; y: number; v: Vec }> {
  const out: Array<{ x: number; y: number; v: Vec }> = [];
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < ny; j++) {
      const x = b.xMin + ((i + 0.5) * (b.xMax - b.xMin)) / nx;
      const y = b.yMin + ((j + 0.5) * (b.yMax - b.yMin)) / ny;
      out.push({ x, y, v: field(x, y) });
    }
  return out;
}
