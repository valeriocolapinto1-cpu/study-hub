// Registro dei tentativi sugli esercizi (alimenta la pagina Progresso e il ripasso).
import { getStorage } from './storage.js';
export function recordAttempt(entry) {
  const st = getStorage();
  const log = st.get('esercizi.log', []);
  log.push({ data: new Date().toISOString(), ...entry });
  st.set('esercizi.log', log.slice(-500));
}
export function summarize() {
  const log = getStorage().get('esercizi.log', []);
  const by = {};
  for (const e of log) { const k = `${e.template || e.kind || '?'}|${e.level || '-'}`; const o = by[k] || (by[k] = { n: 0, sum: 0 }); o.n += 1; o.sum += e.score; }
  return { total: log.length, by };
}
