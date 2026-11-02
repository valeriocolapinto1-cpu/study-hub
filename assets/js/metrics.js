// Metriche di progresso (funzioni pure: ricevono i dati, non toccano il DOM né lo storage).
import { addDays, ymd } from './srs.js';

/** data = {progress, quizLog, eserciziLog, teoriaLog, prove, srsItems, argomenti, blocchi} */
export function computeMetrics(data, now = ymd()) {
  const { progress = {}, quizLog = [], eserciziLog = [], teoriaLog = [], prove = [], srsItems = {}, argomenti = [], blocchi = [] } = data;
  const perBlocco = blocchi.map((b) => {
    const arg = argomenti.filter((a) => a.blocco === b.id);
    const st = (s) => arg.filter((a) => (progress[a.id] || {}).stato === s).length;
    const toccati = arg.filter((a) => progress[a.id]).length;
    return { id: b.id, titolo: b.titolo, totale: arg.length, studiati: toccati, ripassati: st('ripassato'), padroneggiati: st('padroneggiato'), pct: arg.length ? Math.round((100 * toccati) / arg.length) : 0 };
  });
  const quizArg = {}, quizBlk = {};
  for (const e of quizLog) {
    const a = quizArg[e.arg] || (quizArg[e.arg] = { n: 0, ok: 0 }); a.n++; a.ok += e.ok ? 1 : 0;
    const b = quizBlk[e.blocco] || (quizBlk[e.blocco] = { n: 0, ok: 0 }); b.n++; b.ok += e.ok ? 1 : 0;
  }
  const heat = argomenti.map((a) => { const q = quizArg[a.id]; return { id: a.id, blocco: a.blocco, titolo: a.titolo, stato: (progress[a.id] || {}).stato || 'non iniziato', quiz: q ? q.ok / q.n : null, n: q ? q.n : 0 }; });
  const esTemplate = {};
  for (const e of eserciziLog) {
    const k = `${e.template || e.kind || '?'}|${e.level || '-'}`;
    const o = esTemplate[k] || (esTemplate[k] = { n: 0, ok: 0, sec: 0, secN: 0 }); o.n++; o.ok += e.score >= 0.999 ? 1 : 0; if (e.seconds) { o.sec += e.seconds; o.secN++; }
  }
  const esercizi = Object.entries(esTemplate).map(([k, o]) => ({ chiave: k, n: o.n, successo: o.ok / o.n, tempoMedio: o.secN ? Math.round(o.sec / o.secN) : null }));
  const days = new Set();
  for (const e of [...quizLog, ...eserciziLog, ...teoriaLog]) if (e.data) days.add(e.data.slice(0, 10));
  for (const p of Object.values(progress)) if (p.data) days.add(p.data);
  for (const p of prove) if (p.data) days.add(p.data.slice(0, 10));
  let serie = 0; let d = days.has(now) ? now : addDays(now, -1);
  while (days.has(d)) { serie++; d = addDays(d, -1); }
  const due = Object.entries(srsItems).filter(([, v]) => v.due <= now);
  return { perBlocco, quizArg, quizBlk, heat, esercizi, prove: prove.map((p) => ({ data: p.data, totale: p.totale, stima: p.stima })), serie, giorniAttivi: days.size, ripasso: { totale: Object.keys(srsItems).length, scadenza: due.length } };
}

/** Suggerimento «cosa studiare ora»: punteggio più alto = più urgente. Restituisce fino a n voci con motivazione. */
export function suggestNext(data, now = ymd(), n = 3) {
  const m = computeMetrics(data, now);
  const w = new Map((data.blocchi || []).map((b) => [b.id, b.peso]));
  const dueByArg = {};
  for (const [id, v] of Object.entries(data.srsItems || {})) if (v.due <= now && v.meta && v.meta.arg) dueByArg[v.meta.arg] = (dueByArg[v.meta.arg] || 0) + 1;
  const done = new Set((data.argomenti || []).filter((a) => data.progress && data.progress[a.id]).map((a) => a.id));
  const cand = m.heat.map((h) => {
    const a = (data.argomenti || []).find((x) => x.id === h.id);
    const prereqOk = (a.prerequisiti || []).every((p) => done.has(p));
    let s = 0; const why = [];
    if (h.stato === 'non iniziato') { s += 3; why.push('non ancora studiato'); }
    if (h.quiz !== null && h.quiz < 0.6) { s += 4 * (0.6 - h.quiz) / 0.6 + 1; why.push(`quiz al ${Math.round(h.quiz * 100)}%`); }
    if (dueByArg[h.id]) { s += 2 + dueByArg[h.id]; why.push(`${dueByArg[h.id]} voci di ripasso in scadenza`); }
    s *= 1 + (a.peso || 1) / 3 + (w.get(h.blocco) || 10) / 100;
    if (h.stato === 'non iniziato' && !prereqOk) { s *= 0.4; why.push('prima rivedi i prerequisiti'); }
    return { id: h.id, titolo: h.titolo, score: s, motivo: why.join('; ') };
  }).filter((c) => c.score > 0).sort((a, b) => b.score - a.score);
  return cand.slice(0, n);
}
