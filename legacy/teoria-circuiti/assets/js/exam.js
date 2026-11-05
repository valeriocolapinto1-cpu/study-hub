// Prove d'esame simulate: composizione, timer, correzione e stima. Formato storico (non garantito per l'esame attuale):
// 1 esercizio d'analisi (30 punti) + 3 domande (10 punti ciascuna: 6 teoria + 4 applicata) + 1 domanda opzionale (3 punti).
import { makeRng } from './rng.js';
import { generate } from './generator.js';
import { generateApplied, gradeProblem } from './problems.js';
import { gradeAnswer } from './grader/exercise.js';
import { gradeWithRubric } from './grader/rubric.js';

export const FORMATO = { esercizio: 30, domanda: 10, teoria: 6, applicata: 4, opzionale: 3, domande: 3 };
export const TOTALE = FORMATO.esercizio + FORMATO.domande * FORMATO.domanda + FORMATO.opzionale; // 63
export const BASE = 60; // punti «ordinari» senza opzionale
export const DEFAULT_MINUTES = 150;

// A ogni domanda di teoria si abbina una parte applicata sullo stesso tema.
const APPL = {
  'T-01': 'thevenin', 'T-02': 'thevenin', 'T-03': 'thevenin', 'T-04': 'thevenin', 'T-05': 'thevenin', 'T-39': 'thevenin', 'T-40': 'thevenin',
  'T-06': 'max_trasferimento', 'T-07': 'max_trasferimento',
  'T-14': 'potenze', 'T-15': 'potenze', 'T-16': 'potenze', 'T-17': 'potenze', 'T-18': 'rifasamento', 'T-44': 'filtro', 'T-45': 'filtro',
  'T-19': 'laplace_tratti', 'T-20': 'laplace_tratti', 'T-48': 'laplace_tratti',
  'T-21': 'stabilita', 'T-22': 'stabilita', 'T-23': 'filtro', 'T-24': 'risonanza', 'T-25': 'risonanza', 'T-26': 'filtro', 'T-49': 'filtro',
  'T-27': 'impulsiva', 'T-28': 'impulsiva', 'T-29': 'impulsiva', 'T-30': 'impulsiva',
  'T-31': 'doppi_bipoli', 'T-32': 'doppi_bipoli', 'T-33': 'doppi_bipoli', 'T-34': 'doppi_bipoli',
};
const ALT = { III: ['potenze', 'rifasamento', 'filtro'], IV: ['laplace_tratti'], V: ['filtro', 'risonanza', 'stabilita', 'impulsiva'], VI: ['thevenin', 'max_trasferimento', 'doppi_bipoli'] };
const FALLBACK = { III: 'potenze', IV: 'laplace_tratti', V: 'filtro', VI: 'thevenin' };
export const BLOCCHI_DOMANDE = ['III', 'IV', 'V', 'VI'];

/** Compone la prova (solo id e seed: è riproducibile e leggera da salvare). `teoria` = elenco delle domande aperte. */
export function composeExam({ seed, level = 2, teoria }) {
  const rng = makeRng(`exam|${seed}`);
  const blocks = rng.shuffle(BLOCCHI_DOMANDE).slice(0, FORMATO.domande);
  const usedKinds = new Set(), usedT = new Set();
  const domande = blocks.map((b, i) => {
    const pool = rng.shuffle(teoria.filter((q) => q.blocco === b && !usedT.has(q.id)));
    let q = pool.find((x) => !usedKinds.has(APPL[x.id] || FALLBACK[b])) || pool[0];
    let kind = APPL[q.id] || FALLBACK[b];
    if (usedKinds.has(kind)) kind = ALT[b].find((k) => !usedKinds.has(k)) || kind; // niente parti applicate ripetute nella stessa prova
    usedT.add(q.id); usedKinds.add(kind);
    return { blocco: b, teoria: q.id, applicata: { kind, seed: `${seed}-d${i + 1}` } };
  });
  const optKind = rng.pick(['opamp', 'topologia']);
  return { seed: String(seed), level, formato: 'storico', esercizio: { template: 'any', level, seed: `${seed}-e` }, domande, opzionale: { kind: optKind, seed: `${seed}-o` } };
}

/** Costruisce gli oggetti completi (esercizio generato, domande, problemi applicati). */
export function buildExam(spec, teoria, { verify = true } = {}) {
  const g = generate({ template: spec.esercizio.template, level: spec.esercizio.level, seed: spec.esercizio.seed, verify });
  const byId = new Map(teoria.map((q) => [q.id, q]));
  return {
    spec, esercizio: g,
    domande: spec.domande.map((d) => ({ blocco: d.blocco, teoria: byId.get(d.teoria), applicata: generateApplied(d.applicata.kind, d.applicata.seed) })),
    opzionale: generateApplied(spec.opzionale.kind, spec.opzionale.seed),
  };
}

// ── timer ──
export function timerState(startedAt, durationMin, now = Date.now()) {
  if (!durationMin || durationMin <= 0) return { disabled: true, remainingMs: Infinity, expired: false, warn: null };
  const remainingMs = startedAt + durationMin * 60000 - now;
  const min = remainingMs / 60000;
  return { disabled: false, remainingMs, expired: remainingMs <= 0, warn: remainingMs <= 0 ? 0 : min <= 5 ? 5 : min <= 15 ? 15 : null };
}
export function fmtTime(ms) {
  if (!Number.isFinite(ms)) return '—';
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`;
}

// ── correzione ──
const part = (nome, blocco, max, score, extra = {}) => ({ nome, blocco, max, punti: Math.round(max * score * 100) / 100, score, ...extra });

/** answers = { es:{pre,post}, d:[{teoria:'testo', app:{chiave:valore}}], opt:{chiave:valore} } */
export function gradeExam(exam, answers) {
  const parti = [];
  const e = exam.esercizio;
  const ge = gradeAnswer(e.sol, { pre: answers.es?.pre ?? '', post: answers.es?.post ?? '' });
  parti.push(part('Esercizio d\'analisi', 'III–VI', FORMATO.esercizio, ge.score, { dettaglio: ge, tipo: 'esercizio', template: e.inst.template, livello: e.inst.level }));
  exam.domande.forEach((d, i) => {
    const a = answers.d?.[i] || {};
    const gt = gradeWithRubric(a.teoria ?? '', d.teoria.rubrica);
    parti.push(part(`Domanda ${i + 1} — teoria (${d.teoria.titolo})`, d.blocco, FORMATO.teoria, gt.punteggio / gt.max, { dettaglio: gt, tipo: 'teoria', id: d.teoria.id, argomenti: d.teoria.argomenti, manuale: false }));
    const gp = gradeProblem(d.applicata, a.app || {});
    parti.push(part(`Domanda ${i + 1} — applicata (${d.applicata.titolo})`, d.blocco, FORMATO.applicata, gp.score, { dettaglio: gp, tipo: 'applicata', kind: d.applicata.kind, studio: d.applicata.studio }));
  });
  const go = gradeProblem(exam.opzionale, answers.opt || {});
  parti.push(part(`Opzionale (${exam.opzionale.titolo})`, exam.opzionale.blocco, FORMATO.opzionale, go.score, { dettaglio: go, tipo: 'opzionale', kind: exam.opzionale.kind, studio: exam.opzionale.studio }));
  return summarize(parti);
}
export function summarize(parti) {
  const totale = Math.round(parti.reduce((s, p) => s + p.punti, 0) * 100) / 100;
  const perBlocco = {};
  for (const p of parti) { const o = perBlocco[p.blocco] || (perBlocco[p.blocco] = { punti: 0, max: 0 }); o.punti += p.punti; o.max += p.max; }
  return { parti, totale, max: TOTALE, base: BASE, perBlocco };
}
/** Override manuale del punteggio di una parte (es. correzione dell'utente sulle domande aperte). */
export function overrideScore(summary, index, punti) {
  const parti = summary.parti.map((p, i) => (i === index ? { ...p, punti: Math.max(0, Math.min(p.max, punti)), score: Math.max(0, Math.min(p.max, punti)) / p.max, manuale: true } : p));
  return summarize(parti);
}

/** Stima proporzionale in trentesimi (NON ufficiale): la parte ordinaria vale 60 punti → 30/30; l'opzionale è un bonus. */
export function stimaTrentesimi(punti, { soglia = 18 } = {}) {
  const v = Math.min(30, Math.round((punti / BASE) * 30));
  return { valore: v, sufficiente: v >= soglia, testo: v >= soglia ? `${v}/30` : `${v}/30 (sotto la soglia di ${soglia})` };
}
