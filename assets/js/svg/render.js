// Disegno dello schema a partire dalla STESSA netlist usata dal solutore.
// Il layout del template fornisce solo coordinate; i valori e i collegamenti vengono dalla netlist.
// `renderCircuit` restituisce anche gli id disegnati, per i test di coerenza schema ↔ calcolo.
import { SYM, GROUND, DOT, TEXT, STR, esc } from './symbols.js';
import { NODE_FIELDS, GND } from '../solver/netlist.js';

const TERM_FIELDS = (e) => (e.type === 'G' || e.type === 'E' || e.type === 'H' || e.type === 'F' ? ['a', 'b'] : NODE_FIELDS[e.type]);
const FIELD_ORDER = { N: [['na', 'nb', 'nullator'], ['ra', 'rb', 'norator']] };
const fmtR = (x) => x.toString();

export function sourceLabel(e, omega) {
  const parts = [];
  const dc = e.wave.dc, ac = e.wave.ac;
  if (!dc.isZero()) parts.push(`${fmtR(dc)}`);
  if (!ac.isZero()) {
    const w = omega ? (omega.eq(1) ? 't' : `${omega}t`) : 't';
    const re = ac.re, im = ac.im;
    // cos(ωt) → fasore reale; sin(ωt) → fasore −j·A  (A·sin(ωt) = A·cos(ωt − 90°))
    if (!re.isZero() && im.isZero()) parts.push(`${re.eq(1) ? '' : re.toString()}cos(${w})`);
    else if (re.isZero() && !im.isZero()) { const a = im.neg(); parts.push(`${a.eq(1) ? '' : a.toString()}sin(${w})`); }
    else parts.push(`${re}cos(${w}) ${im.neg().sign() < 0 ? '−' : '+'} ${im.abs()}sin(${w})`);
  }
  return `${parts.join(' + ') || '0'} V`;
}
export function valueLabel(e, omega) {
  switch (e.type) {
    case 'R': return `${e.id}=${e.r} Ω`;
    case 'C': return `${e.id}=${e.c} F`;
    case 'L': return `${e.id}=${e.l} H`;
    case 'V': return sourceLabel(e, omega);
    case 'I': return sourceLabel(e, omega).replace(' V', ' A');
    case 'G': return `${e.id}=${e.gm} S·v_c`;
    default: return e.id;
  }
}

export function renderCircuit(circuit, layout, { omega = null, outLabel = 'v_out' } = {}) {
  const drawn = new Set();
  const terms = {}; // `${id}.${campo}` -> [x,y]
  const body = [];
  const termPos = (e, f) => {
    const p = layout.term[`${e.id}.${f}`];
    if (!p) throw new Error(`layout: manca il terminale ${e.id}.${f}`);
    return p;
  };
  for (const e of circuit.elements) {
    for (const f of TERM_FIELDS(e)) terms[`${e.id}.${f}`] = termPos(e, f);
  }
  const seg = (type, p1, p2, label, id, labelAbove) => {
    const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
    if (dx !== 0 && dy !== 0) throw new Error(`layout: ${id} non allineato`);
    const len = Math.hypot(dx, dy), ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    body.push(`<g data-id="${esc(id)}" transform="translate(${p1[0]},${p1[1]}) rotate(${ang})">${SYM[type](len)}</g>`);
    const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
    if (label) {
      if (dy === 0) body.push(TEXT(mx, my + (labelAbove ? -22 : 34), label));
      else if (id.startsWith('V') || id.startsWith('I')) body.push(TEXT(mx - 26, my + 4, label, 'end'));
      else body.push(TEXT(mx + 22, my + (id.startsWith('G') ? -8 : 4), label, 'start'));
    }
    drawn.add(id);
  };
  for (const e of circuit.elements) {
    if (['R', 'C', 'L', 'V', 'I', 'S', 'G'].includes(e.type)) {
      const a = terms[`${e.id}.a`], b = terms[`${e.id}.b`];
      // le sorgenti V verticali: il «+» è sul terminale a (in alto nel layout)
      seg(e.type, a, b, valueLabel(e, omega), e.id, !(layout.below || []).includes(e.id));
    } else if (e.type === 'N') {
      for (const [fa, fb, kind] of FIELD_ORDER.N) {
        const a = terms[`${e.id}.${fa}`], b = terms[`${e.id}.${fb}`];
        const id = `${e.id}.${kind}`;
        seg(kind, a, b, kind === 'nullator' ? 'v=0, i=0' : 'v, i', id, true);
      }
      drawn.add(e.id);
    } else if (e.type === 'P' || e.type === 'T') {
      const a1 = terms[`${e.id}.p1a`], b1 = terms[`${e.id}.p1b`], a2 = terms[`${e.id}.p2a`];
      const x1 = a1[0], x2 = a2[0], yT = a1[1], yB = b1[1], cx = (x1 + x2) / 2;
      if (e.type === 'P') {
        const f = (q) => q.toString();
        body.push(`<g data-id="${esc(e.id)}"><rect x="${x1}" y="${yT}" width="${x2 - x1}" height="${yB - yT}" rx="4"/></g>`);
        body.push(TEXT(cx, (yT + yB) / 2 - 30, `${e.kind} =`), TEXT(cx, (yT + yB) / 2 - 8, `[ ${f(e.m[0][0])}   ${f(e.m[0][1])} ]`), TEXT(cx, (yT + yB) / 2 + 14, `[ ${f(e.m[1][0])}   ${f(e.m[1][1])} ]`), TEXT(cx, (yT + yB) / 2 + 36, e.kind === 'Z' ? 'Ω' : 'S'));
      } else {
        const lx = x1 + 30, rx = x2 - 30, c0 = yT + 28;
        const coilL = `<path d="M${lx} ${c0} a8 8 0 0 1 0 16 a8 8 0 0 1 0 16 a8 8 0 0 1 0 16 a8 8 0 0 1 0 16"/>`;
        const coilR = `<path d="M${rx} ${c0} a8 8 0 0 0 0 16 a8 8 0 0 0 0 16 a8 8 0 0 0 0 16 a8 8 0 0 0 0 16"/>`;
        body.push(`<g data-id="${esc(e.id)}"><polyline points="${x1},${yT} ${lx},${yT} ${lx},${c0}"/><polyline points="${lx},${c0 + 64} ${lx},${yB} ${x1},${yB}"/>${coilL}`
          + `<polyline points="${x2},${yT} ${rx},${yT} ${rx},${c0}"/><polyline points="${rx},${c0 + 64} ${rx},${yB} ${x2},${yB}"/>${coilR}`
          + `<polyline points="${cx - 4},${c0 - 6} ${cx - 4},${c0 + 70}"/><polyline points="${cx + 4},${c0 - 6} ${cx + 4},${c0 + 70}"/></g>`);
        body.push(TEXT(cx, yT + 14, `n : 1 = ${e.n} : 1`));
      }
      drawn.add(e.id);
    } else throw new Error(`renderer: tipo ${e.type} non ancora supportato dal layout`);
  }
  // collegamenti di controllo (tratteggiati) dei generatori controllati
  for (const e of circuit.elements) if (e.type === 'G') {
    const c = layout.ctrl && layout.ctrl[e.id]; if (!c) throw new Error(`layout: manca il punto di controllo di ${e.id}`);
    const b = terms[`${e.id}.b`], a = terms[`${e.id}.a`], cy = (a[1] + b[1]) / 2, ex = a[0] + 120;
    body.push(`<polyline stroke-dasharray="5 4" points="${c[0]},${c[1]} ${c[0]},${c[1] - 45} ${ex},${c[1] - 45} ${ex},${cy} ${a[0] + 18},${cy}"/>`, DOT(c[0], c[1]), TEXT(c[0] - 8, c[1] - 52, 'v_c', 'end'));
  }
  // fili: percorsi per nodo (devono contenere tutti i terminali del nodo)
  for (const [node, pts] of Object.entries(layout.paths)) {
    if (pts.length > 1) body.push(`<polyline data-node="${esc(node)}" points="${pts.map((p) => p.join(',')).join(' ')}"/>`);
  }
  // massa e punti di giunzione
  const count = new Map();
  for (const e of circuit.elements) for (const f of TERM_FIELDS(e)) {
    const n = String(e[f]); const p = terms[`${e.id}.${f}`];
    if (n === GND) body.push(GROUND(p[0], p[1]));
    else { const k = `${n}@${p}`; count.set(k, (count.get(k) || 0) + 1); }
  }
  for (const [k, c] of count) if (c >= 3) { const [x, y] = k.split('@')[1].split(',').map(Number); body.push(DOT(x, y)); }
  if (layout.out) {
    const [x, y] = layout.out;
    body.push(DOT(x, y), TEXT(x + 8, y - 8, `+ ${outLabel}`, 'start'), ...(layout.outRef ? [DOT(layout.outRef[0], layout.outRef[1]), TEXT(layout.outRef[0] + 8, layout.outRef[1] - 8, '−', 'start')] : []));
  }
  const PADL = 70, PADT = 14, PADR = 96, W = layout.width + PADL + PADR, H = layout.height + PADT;
  const svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" ${STR} font-family="system-ui,sans-serif" font-size="13" role="img"><g transform="translate(${PADL},${PADT})">${body.join('')}</g></svg>`;
  return { svg, drawn, terms };
}

/** Controllo di coerenza: ogni terminale non a massa deve giacere sul percorso del proprio nodo; ogni elemento deve essere disegnato. */
export function checkLayout(circuit, layout, drawn) {
  const errors = [];
  const onPath = (pts, p) => {
    if (pts.length === 1) return pts[0][0] === p[0] && pts[0][1] === p[1];
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      if (p[0] >= Math.min(x1, x2) && p[0] <= Math.max(x1, x2) && p[1] >= Math.min(y1, y2) && p[1] <= Math.max(y1, y2) && (x1 === x2 ? p[0] === x1 : y1 === y2 ? p[1] === y1 : false)) return true;
    }
    return false;
  };
  for (const e of circuit.elements) {
    if (!drawn.has(e.id)) errors.push(`${e.id} non disegnato`);
    if (e.type === 'G') { const c = layout.ctrl && layout.ctrl[e.id]; const n = String(e.cp); if (!c) errors.push(`${e.id}: manca il punto di controllo`); else if (n !== GND && !(layout.paths[n] && onPath(layout.paths[n], c))) errors.push(`${e.id}: il punto di controllo non è sul nodo ${n}`); }
    for (const f of TERM_FIELDS(e)) {
      const n = String(e[f]); if (n === GND) continue;
      const pts = layout.paths[n];
      if (!pts) { errors.push(`nodo ${n} senza percorso`); continue; }
      const p = layout.term[`${e.id}.${f}`];
      if (!onPath(pts, p)) errors.push(`${e.id}.${f} (${p}) non sul percorso del nodo ${n}`);
    }
  }
  // nessun percorso di nodi diversi può coincidere in un punto (cortocircuito grafico)
  const owner = new Map();
  for (const [n, pts] of Object.entries(layout.paths)) for (const p of pts) { const k = String(p); if (owner.has(k) && owner.get(k) !== n) errors.push(`nodi ${owner.get(k)} e ${n} coincidono in ${k}`); owner.set(k, n); }
  return errors;
}
