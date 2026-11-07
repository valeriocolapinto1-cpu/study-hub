/**
 * Figure di segnali e sistemi: diagrammi di Bode (modulo in dB e fase su asse logaritmico),
 * piano complesso dei poli e degli zeri, diagrammi temporali di segnali digitali.
 */
import { drawAxes, frame } from '../axes';
import { listText, plainLabel, Svg, type Ctx, type Drawn, type Pt, type Tone } from '../core';
import type { DiagramParams } from '../schemas';

type P<K extends keyof DiagramParams> = DiagramParams[K];

// ------------------------------------------------------------------- Bode
type Factor = { w: number; zeta?: number | undefined };

/** H(jω) nella forma K·(jω)^n·Π(1+jω/z)/Π(1+jω/p): modulo in dB e fase in gradi. */
export function bodeAt(p: P<'bode'>, w: number): { db: number; deg: number } {
  let re = p.gain ?? 1;
  let im = 0;
  const mul = (a: number, b: number, inv: boolean): void => {
    if (inv) {
      const d = a * a + b * b;
      [a, b] = [a / d, -b / d];
    }
    [re, im] = [re * a - im * b, re * b + im * a];
  };
  const fac = (f: Factor): [number, number] => {
    const u = w / f.w;
    return f.zeta === undefined ? [1, u] : [1 - u * u, 2 * f.zeta * u];
  };
  for (const z of p.zeros ?? []) mul(...fac(z), false);
  for (const q of p.poles ?? []) mul(...fac(q), true);
  const o = p.origin ?? 0;
  const mag = Math.hypot(re, im) * w ** o;
  // fase: somma dei contributi (continua, senza salti di ±360°)
  let deg = (p.gain ?? 1) < 0 ? 180 : 0;
  const ph = (f: Factor): number => {
    const [a, b] = fac(f);
    return (Math.atan2(b, a) * 180) / Math.PI;
  };
  for (const z of p.zeros ?? []) deg += ph(z);
  for (const q of p.poles ?? []) deg -= ph(q);
  deg += 90 * o;
  return { db: 20 * Math.log10(mag), deg };
}

function bodeAsymptote(p: P<'bode'>, w: number): number {
  let db = 20 * Math.log10(Math.abs(p.gain ?? 1)) + 20 * (p.origin ?? 0) * Math.log10(w);
  const slope = (f: Factor): number => (w > f.w ? (f.zeta === undefined ? 20 : 40) * Math.log10(w / f.w) : 0);
  for (const z of p.zeros ?? []) db += slope(z);
  for (const q of p.poles ?? []) db -= slope(q);
  return db;
}

const niceRange = (a: number, b: number, step: number): [number, number] => [
  Math.floor(a / step) * step,
  Math.ceil(b / step) * step,
];

export function bode(p: P<'bode'>, c: Ctx): Drawn {
  const corners = [...(p.zeros ?? []), ...(p.poles ?? [])].map((f) => f.w);
  const lo = p.range?.min ?? 10 ** Math.floor(Math.log10(Math.min(...corners, 1)) - 1);
  const hi = p.range?.max ?? 10 ** Math.ceil(Math.log10(Math.max(...corners, 1)) + 1);
  const l0 = Math.log10(lo);
  const l1 = Math.log10(hi);
  const show = p.show ?? ['mag', 'phase'];
  const W = 460;
  const panelH = 170;
  const s = new Svg(W, 24 + show.length * (panelH + 34));
  const N = 240;
  const ws = Array.from({ length: N + 1 }, (_, i) => 10 ** (l0 + ((l1 - l0) * i) / N));
  const vals = ws.map((w) => bodeAt(p, w));
  const fmtW = (e: number): string => {
    const v = 10 ** e;
    return v >= 0.01 && v <= 1e4 ? c.num(v, 3) : `10^{${e}}`;
  };
  let top = 22;
  const descr: string[] = [];
  for (const kind of show) {
    const ys = kind === 'mag' ? vals.map((v) => v.db) : vals.map((v) => v.deg);
    const step = kind === 'mag' ? 20 : 45;
    let [y0, y1] = niceRange(Math.min(...ys), Math.max(...ys), step);
    if (y1 - y0 < step * 2) [y0, y1] = [y0 - step, y1 + step];
    const f = frame({ x: 62, y: top, w: W - 150, h: panelH - 30 }, [l0, l1], [y0, y1], true);
    // griglia per decadi
    for (let e = Math.ceil(l0); e <= Math.floor(l1); e++) {
      s.line(f.sx(e), f.box.y, f.sx(e), f.box.y + f.box.h, { tone: 'faint', width: 0.6, opacity: 0.7 });
      s.text(f.sx(e), f.box.y + f.box.h + 14, fmtW(e), { size: 11, muted: true, halo: true });
    }
    for (let v = y0; v <= y1 + 1e-9; v += step * (y1 - y0 > step * 6 ? 2 : 1)) {
      s.line(f.box.x, f.sy(v), f.box.x + f.box.w, f.sy(v), { tone: 'faint', width: 0.6, opacity: 0.7 });
      s.text(f.box.x - 7, f.sy(v), c.num(v, 3), { size: 11, muted: true, anchor: 'end', halo: true });
    }
    drawAxes(s, f, {
      xLabel: 'ω',
      xUnit: 'rad/s',
      yLabel: kind === 'mag' ? `|${p.label ?? 'H'}|` : `∠${p.label ?? 'H'}`,
      yUnit: kind === 'mag' ? 'dB' : '°',
      fmt: () => '',
      edge: true,
      noTicks: true,
    });
    if (kind === 'mag' && p.asymptotes)
      s.polyline(
        ws.map((w): Pt => [f.sx(Math.log10(w)), f.sy(Math.max(y0, Math.min(y1, bodeAsymptote(p, w))))]),
        { tone: 'muted', width: 1.4, dash: '6 4' },
      );
    s.polyline(
      ws.map((w, i): Pt => [f.sx(Math.log10(w)), f.sy(ys[i]!)]),
      { tone: kind === 'mag' ? 'accent' : 'info', width: 2.2 },
    );
    for (const m of p.markers ?? []) {
      const x = f.sx(Math.log10(m.w));
      const y = f.sy(kind === 'mag' ? bodeAt(p, m.w).db : bodeAt(p, m.w).deg);
      s.line(x, f.box.y, x, f.box.y + f.box.h, { tone: 'muted', width: 1, dash: '4 4' });
      s.dot(x, y, 3.6);
      if (m.label && kind === show[0])
        s.text(x + 5, f.box.y + 6, m.label, { anchor: 'start', italic: true, size: 12, halo: true });
    }
    descr.push(
      kind === 'mag'
        ? c.L(
            `modulo da ${c.num(ys[0]!, 3)} dB a ${c.num(ys[N]!, 3)} dB (massimo ${c.num(Math.max(...ys), 3)} dB)`,
            `magnitude from ${c.num(ys[0]!, 3)} dB to ${c.num(ys[N]!, 3)} dB (maximum ${c.num(Math.max(...ys), 3)} dB)`,
          )
        : c.L(
            `fase da ${c.num(ys[0]!, 3)}° a ${c.num(ys[N]!, 3)}°`,
            `phase from ${c.num(ys[0]!, 3)}° to ${c.num(ys[N]!, 3)}°`,
          ),
    );
    top += panelH + 34;
  }
  const fac = (list: Factor[] | undefined, it: string, en: string): string[] =>
    (list ?? []).map((f) =>
      f.zeta === undefined
        ? c.L(`${it} in ω = ${c.num(f.w)} rad/s`, `${en} at ω = ${c.num(f.w)} rad/s`)
        : c.L(
            `coppia di ${it === 'zero' ? 'zeri' : 'poli'} complessi con ω₀ = ${c.num(f.w)} rad/s e ζ = ${c.num(f.zeta)}`,
            `complex ${en} pair with ω₀ = ${c.num(f.w)} rad/s and ζ = ${c.num(f.zeta)}`,
          ),
    );
  const o = p.origin ?? 0;
  const items = [
    ...fac(p.zeros, 'zero', 'zero'),
    ...fac(p.poles, 'polo', 'pole'),
    ...(o
      ? [
          c.L(
            `${Math.abs(o)} ${o > 0 ? 'zeri' : 'poli'} nell'origine`,
            `${Math.abs(o)} ${o > 0 ? 'zeros' : 'poles'} at the origin`,
          ),
        ]
      : []),
  ];
  return {
    svg: s,
    title: c.L('Diagramma di Bode', 'Bode plot'),
    description:
      c.L(
        `Diagramma di Bode tra ${c.num(lo)} e ${c.num(hi)} rad/s, guadagno ${c.num(p.gain ?? 1)}, `,
        `Bode plot from ${c.num(lo)} to ${c.num(hi)} rad/s, gain ${c.num(p.gain ?? 1)}, `,
      ) +
      listText(items, c.lang) +
      ': ' +
      descr.join('; ') +
      '.',
  };
}

// ---------------------------------------------------------- poli e zeri
export function poleZero(p: P<'pole-zero'>, c: Ctx): Drawn {
  const pts = [...(p.poles ?? []), ...(p.zeros ?? [])];
  const R = p.range ?? Math.max(1, ...pts.flatMap((q) => [Math.abs(q.re), Math.abs(q.im)])) * 1.3;
  const S = 300;
  const s = new Svg(S + 64, S + 24);
  const f = frame({ x: 20, y: 14, w: S, h: S }, [-R, R], [-R, R]);
  if (p.stableRegion)
    s.rect(f.box.x, f.box.y, f.sx(0) - f.box.x, f.box.h, { fill: 'soft', tone: 'accent', width: 0 });
  const [ax, ay] = p.axisLabels ?? ['σ', 'jω'];
  drawAxes(s, f, { xLabel: ax, yLabel: ay, grid: true, fmt: (v) => c.num(v, 3) });
  const tone: Tone = 'accent';
  for (const q of p.poles ?? []) {
    const x = f.sx(q.re);
    const y = f.sy(q.im);
    s.line(x - 6, y - 6, x + 6, y + 6, { tone, width: 2.4 }).line(x - 6, y + 6, x + 6, y - 6, {
      tone,
      width: 2.4,
    });
    if (q.label) s.text(x + 9, y - 12, q.label, { anchor: 'start', size: 12, halo: true });
  }
  for (const q of p.zeros ?? []) {
    const x = f.sx(q.re);
    const y = f.sy(q.im);
    s.circle(x, y, 6, { tone: 'info', width: 2.2, fill: 'bg' });
    if (q.label) s.text(x + 9, y - 12, q.label, { anchor: 'start', size: 12, halo: true });
  }
  const z = (q: { re: number; im: number }): string =>
    q.im === 0 ? c.num(q.re) : `${c.num(q.re)} ${q.im < 0 ? '−' : '+'} j${c.num(Math.abs(q.im))}`;
  const lhp = (p.poles ?? []).every((q) => q.re < 0);
  return {
    svg: s,
    title: c.L('Poli e zeri nel piano complesso', 'Poles and zeros in the complex plane'),
    description:
      c.L('Piano complesso s', 'Complex s-plane') +
      (p.stableRegion
        ? c.L(' con il semipiano sinistro evidenziato', ' with the left half-plane shaded')
        : '') +
      '. ' +
      (p.poles?.length
        ? c.L('Poli (croci): ', 'Poles (crosses): ') + (p.poles ?? []).map(z).join('; ') + '. '
        : '') +
      (p.zeros?.length
        ? c.L('Zeri (cerchi): ', 'Zeros (circles): ') + (p.zeros ?? []).map(z).join('; ') + '. '
        : '') +
      (p.poles?.length && p.stableRegion
        ? lhp
          ? c.L('Tutti i poli sono nel semipiano sinistro.', 'All poles lie in the left half-plane.')
          : c.L('Non tutti i poli sono nel semipiano sinistro.', 'Not all poles lie in the left half-plane.')
        : ''),
  };
}

// ------------------------------------------------------ diagramma temporale
export function timing(p: P<'timing'>, c: Ctx): Drawn {
  const lens = p.signals.map((sg) => ('wave' in sg ? sg.wave.length : 'bus' in sg ? sg.bus.length : 0));
  const steps = p.steps ?? Math.max(8, ...lens);
  const lw = Math.max(36, ...p.signals.map((sg) => plainLabel(sg.label).length * 8 + 14));
  const cell = Math.max(14, Math.min(34, Math.floor(400 / steps)));
  const rowH = 38;
  const W = lw + steps * cell + 12;
  const s = new Svg(W, p.signals.length * rowH + 24);
  const x0 = lw;
  for (let k = 0; k <= steps; k += 2)
    s.line(x0 + k * cell, 4, x0 + k * cell, p.signals.length * rowH + 6, {
      tone: 'faint',
      width: 0.6,
      dash: '2 4',
    });
  const lines: string[] = [];
  p.signals.forEach((sg, i) => {
    const yHi = i * rowH + 12;
    const yLo = yHi + rowH - 18;
    s.text(lw - 8, (yHi + yLo) / 2, sg.label, { anchor: 'end', italic: true });
    if ('bus' in sg) {
      let k = 0;
      const vals: string[] = [];
      while (k < steps) {
        const v = sg.bus[Math.min(k, sg.bus.length - 1)] ?? '';
        let e = k + 1;
        while (e < steps && (sg.bus[Math.min(e, sg.bus.length - 1)] ?? '') === v) e++;
        const a = x0 + k * cell;
        const b = x0 + e * cell;
        const m = (yHi + yLo) / 2;
        const d = Math.min(4, (b - a) / 3);
        s.polygon(
          [
            [a, m],
            [a + d, yHi],
            [b - d, yHi],
            [b, m],
            [b - d, yLo],
            [a + d, yLo],
          ],
          { width: 1.6, fill: v ? 'none' : 'faint' },
        );
        if (v) s.text((a + b) / 2, m, v, { mono: true, size: 11 });
        vals.push(v || '—');
        k = e;
      }
      lines.push(`${plainLabel(sg.label)}: ${vals.join(', ')}`);
      return;
    }
    const lv: string[] = [];
    if ('kind' in sg) for (let k = 0; k < steps; k++) lv.push(k % 2 === 0 ? '1' : '0');
    else {
      let prev = '0';
      for (let k = 0; k < steps; k++) {
        const ch = sg.wave[k] ?? '.';
        prev = ch === '.' ? prev : ch;
        lv.push(prev);
      }
    }
    const tone = sg.tone ?? ('kind' in sg ? 'muted' : 'accent');
    const y = (v: string): number => (v === '1' ? yHi : v === '0' ? yLo : (yHi + yLo) / 2);
    let path: Pt[] = [];
    const flush = (): void => {
      if (path.length > 1) s.polyline(path, { tone, width: 2 });
      path = [];
    };
    for (let k = 0; k < steps; k++) {
      const a = x0 + k * cell;
      const b = a + cell;
      const v = lv[k]!;
      if (v === 'x') {
        flush();
        s.rect(a, yHi, cell, yLo - yHi, { tone: 'muted', width: 1, fill: 'faint', opacity: 0.6 });
        continue;
      }
      if (v === 'z') {
        flush();
        s.line(a, y(v), b, y(v), { tone: 'muted', width: 1.6, dash: '4 3' });
        continue;
      }
      if (path.length) path.push([a, y(v)]);
      else path.push([a, y(v)]);
      path.push([b, y(v)]);
    }
    flush();
    // riassunto: livelli per passo, compressi in tratti
    const runs: string[] = [];
    let k = 0;
    while (k < steps) {
      let e = k + 1;
      while (e < steps && lv[e] === lv[k]) e++;
      runs.push(e - k > 1 ? `${lv[k]}×${e - k}` : lv[k]!);
      k = e;
    }
    lines.push(
      'kind' in sg
        ? c.L(`${plainLabel(sg.label)}: clock`, `${plainLabel(sg.label)}: clock`)
        : `${plainLabel(sg.label)}: ${runs.join(' ')}`,
    );
  });
  for (const m of p.markers ?? []) {
    const x = x0 + m.at * cell;
    s.line(x, 4, x, p.signals.length * rowH + 6, { tone: 'danger', width: 1.2, dash: '5 3' });
    if (m.label) s.text(x, p.signals.length * rowH + 16, m.label, { size: 11, italic: true, halo: true });
  }
  return {
    svg: s,
    title: c.L('Diagramma temporale', 'Timing diagram'),
    description:
      c.L(`Diagramma temporale su ${steps} passi. `, `Timing diagram over ${steps} steps. `) +
      lines.join('; ') +
      '.',
  };
}
