// Progresso per argomento foglia. Schema: { [id]: { stato, data, note } }
import { getStorage } from './storage.js';
export const STATI = ['non iniziato', 'studiato', 'ripassato', 'padroneggiato'];
export function getAll() { return getStorage().get('progress', {}); }
export function getStato(id) { const p = getAll()[id]; return p ? p.stato : 'non iniziato'; }
export function setStato(id, stato, note) {
  if (!STATI.includes(stato)) throw new Error('stato non valido: ' + stato);
  const all = getAll();
  if (stato === 'non iniziato') delete all[id];
  else all[id] = { stato, data: new Date().toISOString().slice(0, 10), note: note ?? (all[id] && all[id].note) ?? '' };
  getStorage().set('progress', all);
  return all;
}
export function summary(argomenti) {
  const all = getAll();
  const done = argomenti.filter((a) => all[a.id]).length;
  return { done, total: argomenti.length, pct: argomenti.length ? Math.round((100 * done) / argomenti.length) : 0 };
}
