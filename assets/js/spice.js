// Esportazione di un'istanza in netlist SPICE (.cir) a partire dalla STESSA netlist interna.
// Approssimazioni (dichiarate anche nell'intestazione del file e nella pagina Simulatori):
//  • nullore → generatore di tensione controllato (VCVS) a guadagno molto alto (1e6), segno scelto verificando la soluzione;
//  • trasformatore ideale → VCVS + CCCS (modello algebrico: passa anche la continua, come l'elemento ideale);
//  • doppio bipolo → generatori controllati (la matrice Z è convertita in Y, se invertibile);
//  • generatori indipendenti → sorgenti comportamentali accese per t<0 e spente per t>0, con l'istante t=0 dell'esercizio
//    posto a t=T0 della simulazione (T0 molto maggiore di τ per raggiungere il regime).
import { Cx } from './complex.js';
import { Rational } from './rational.js';
import { solve } from './solver/mna.js';

const fmt = (q) => { const n = Rational.from(q).toNumber(); return Number.isInteger(n) ? String(n) : String(+n.toPrecision(10)); };
const num = (q) => Rational.from(q).toNumber();

function invert2(m) {
  const [[a, b], [c, d]] = m.map((r) => r.map((x) => Rational.from(x)));
  const det = a.mul(d).sub(b.mul(c));
  if (det.isZero()) throw new Error('matrice non invertibile');
  return [[d.div(det), b.neg().div(det)], [c.neg().div(det), a.div(det)]];
}

/** Sceglie per ogni nullore il segno del VCVS che riproduce la soluzione ideale. Restituisce {id: +1|-1}. */
export function nullorSigns(circuit, A = 1e6) {
  const ids = circuit.elements.filter((e) => e.type === 'N').map((e) => e.id);
  const ideal = solve(circuit);
  const nodes = [...new Set(circuit.elements.flatMap((e) => ['a', 'b', 'na', 'nb', 'ra', 'rb', 'p1a', 'p2a', 'cp'].map((f) => e[f]).filter((x) => x !== undefined)))].filter((n) => n !== '0');
  const signs = {};
  for (let mask = 0; mask < 1 << ids.length; mask++) {
    const trial = ids.map((_, i) => ((mask >> i) & 1 ? -1 : 1));
    const c = { ...circuit, elements: circuit.elements.map((e) => {
      const i = ids.indexOf(e.id); if (i < 0) return e;
      // E ra rb (nb,na)·A con segno s: v(ra)-v(rb) = s·A·(v(nb)-v(na))
      return { id: e.id, type: 'E', a: e.ra, b: e.rb, cp: trial[i] > 0 ? e.nb : e.na, cn: trial[i] > 0 ? e.na : e.nb, mu: Rational.from(A) };
    }) };
    try {
      const s = solve(c);
      let ok = true;
      for (const n of nodes) { const d = s.v(n).sub(ideal.v(n)).abs(); if (d > 1e-3 * (1 + ideal.v(n).abs())) { ok = false; break; } }
      if (ok) { ids.forEach((id, i) => { signs[id] = trial[i]; }); return signs; }
    } catch (e) { /* singolare: prova un altro segno */ }
  }
  throw new Error('nessun segno del nullore riproduce la soluzione ideale');
}

/** flavor: 'ltspice' (if(...)) oppure 'ngspice' (operatore ternario). */
export function toSpice(inst, { flavor = 'ltspice', sol } = {}) {
  const c = inst.circuit;
  const w = inst.omega ? num(inst.omega) : 0;
  const tau = sol ? num(sol.tau) : 1;
  const T0 = Math.max(30 * tau, w ? (2 * Math.PI) / w * 5 : 0);
  const tstop = T0 + 8 * tau;
  const signs = nullorSigns(c);
  const lines = [];
  const gate = (expr) => (flavor === 'ngspice' ? `(time<${fmt(T0)}) ? (${expr}) : 0` : `if(time<${fmt(T0)}, ${expr}, 0)`);
  lines.push(`* Teoria dei Circuiti — esercizio ${inst.template}/${inst.variant}, livello ${inst.level} (generato dal sito, non ufficiale)`);
  lines.push(`* Il tempo dell'esercizio è t = time - ${fmt(T0)}: i generatori sono accesi per t<0 e spenti per t>0.`);
  lines.push('* APPROSSIMAZIONI: nullore = VCVS con guadagno 1e6; trasformatore ideale = VCVS + CCCS (passa anche la continua);');
  lines.push('* doppio bipolo = generatori controllati (Z convertita in Y); tensione e condizioni iniziali dal punto di lavoro.');
  for (const e of c.elements) {
    switch (e.type) {
      case 'R': lines.push(`${e.id} ${e.a} ${e.b} ${fmt(e.r)}`); break;
      case 'C': lines.push(`${e.id} ${e.a} ${e.b} ${fmt(e.c)}`); break;
      case 'L': lines.push(`${e.id} ${e.a} ${e.b} ${fmt(e.l)}`); break;
      case 'V': case 'I': {
        const dc = num(e.wave.dc), re = num(e.wave.ac.re), im = num(e.wave.ac.im);
        const parts = [];
        if (dc !== 0) parts.push(fmt(dc));
        if (re !== 0 || im !== 0) parts.push(`${+re.toPrecision(10)}*cos(${+w.toPrecision(10)}*(time-${fmt(T0)})) - ${+im.toPrecision(10)}*sin(${+w.toPrecision(10)}*(time-${fmt(T0)}))`);
        const expr = parts.join(' + ') || '0';
        lines.push(`B${e.id} ${e.a} ${e.b} ${e.type === 'V' ? 'V' : 'I'}=${gate(expr)}`);
        break;
      }
      case 'G': lines.push(`${e.id} ${e.a} ${e.b} ${e.cp} ${e.cn} ${fmt(e.gm)}`); break;
      case 'E': lines.push(`${e.id} ${e.a} ${e.b} ${e.cp} ${e.cn} ${fmt(e.mu)}`); break;
      case 'N': {
        const s = signs[e.id];
        lines.push(`E${e.id} ${e.ra} ${e.rb} ${s > 0 ? `${e.nb} ${e.na}` : `${e.na} ${e.nb}`} 1E6 ; nullore: nullatore (${e.na},${e.nb}) + noratore (${e.ra},${e.rb})`);
        break;
      }
      case 'T': {
        const n = fmt(e.n);
        lines.push(`E${e.id} ${e.p1a} x${e.id} ${e.p2a} ${e.p2b} ${n} ; v1 = n v2`);
        lines.push(`V${e.id} x${e.id} ${e.p1b} 0 ; misura i1`);
        lines.push(`F${e.id} ${e.p2a} ${e.p2b} V${e.id} ${fmt(Rational.from(e.n).neg())} ; i2 = -n i1`);
        break;
      }
      case 'P': {
        const Y = e.kind === 'Y' ? e.m : invert2(e.m);
        lines.push(`G${e.id}a ${e.p1a} ${e.p1b} ${e.p1a} ${e.p1b} ${fmt(Y[0][0])}`);
        lines.push(`G${e.id}b ${e.p1a} ${e.p1b} ${e.p2a} ${e.p2b} ${fmt(Y[0][1])}`);
        lines.push(`G${e.id}c ${e.p2a} ${e.p2b} ${e.p1a} ${e.p1b} ${fmt(Y[1][0])}`);
        lines.push(`G${e.id}d ${e.p2a} ${e.p2b} ${e.p2a} ${e.p2b} ${fmt(Y[1][1])}`);
        break;
      }
      default: lines.push(`* ${e.id}: tipo ${e.type} non esportabile`);
    }
  }
  lines.push(`.tran 0 ${fmt(tstop)} 0 ${fmt(Math.min(tau, 1) / 50)}`);
  lines.push(`.probe V(${inst.out[0]})${inst.out[1] !== '0' ? ` V(${inst.out[1]})` : ''}`);
  lines.push('.end');
  return { text: lines.join('\n') + '\n', T0, tstop, signs };
}
void Cx;
