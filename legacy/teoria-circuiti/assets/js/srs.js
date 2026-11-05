// Ripetizione spaziata (Leitner a 5 scatole). Le scadenze stanno in localStorage e sono incluse nell'export.
import { getStorage } from './storage.js';

export const INTERVALS = [1, 3, 7, 14, 30]; // giorni per scatola 1..5
export const ymd = (d = new Date()) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
export const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return ymd(d); };

export function load() { return getStorage().get('srs', { items: {} }); }
function save(s) { getStorage().set('srs', s); }

/** Registra l'esito di una revisione. `id` es. «quiz:III-014», «teoria:T-12», «ex:B:2:1234». Restituisce la voce aggiornata. */
export function review(id, correct, { uncertain = false, now = ymd(), meta = {} } = {}) {
  const s = load();
  const it = s.items[id] || { box: 0, lapses: 0, meta };
  if (correct && !uncertain) it.box = Math.min(5, (it.box || 0) + 1);
  else { it.box = 1; it.lapses = (it.lapses || 0) + (correct ? 0 : 1); }
  it.due = addDays(now, INTERVALS[it.box - 1]);
  it.last = now; it.meta = { ...it.meta, ...meta };
  s.items[id] = it; save(s);
  return it;
}
/** Una domanda risolta bene al primo colpo non entra in coda; una sbagliata o incerta sì. */
export function recordResult(id, correct, opts = {}) {
  const s = load();
  if (correct && !opts.uncertain && !s.items[id]) return null;
  return review(id, correct, opts);
}
export function due(now = ymd()) {
  const s = load();
  return Object.entries(s.items).filter(([, v]) => v.due <= now).map(([id, v]) => ({ id, ...v })).sort((a, b) => a.due.localeCompare(b.due));
}
export function stats(now = ymd()) {
  const s = load(); const items = Object.values(s.items);
  const byBox = [0, 0, 0, 0, 0, 0];
  items.forEach((v) => byBox[v.box] += 1);
  return { total: items.length, due: due(now).length, byBox };
}
export function remove(id) { const s = load(); delete s.items[id]; save(s); }
