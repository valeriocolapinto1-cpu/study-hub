// Appunti personali: Markdown (anche con formule LaTeX) salvati in IndexedDB, con ripiego su localStorage.
// L'input è SEMPRE sanificato: il testo viene prima trattato come testo puro (escape HTML) e solo dopo trasformato.
import { getStorage } from './storage.js';

export class NotesError extends Error { constructor(m, kind = 'generico') { super(m); this.name = 'NotesError'; this.kind = kind; } }
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = (u) => (/^(https?:|mailto:|#|\.{0,2}\/)/i.test(u.trim()) ? u.trim() : '#');

function inline(s) {
  let t = esc(s);
  // le formule restano intatte per KaTeX: le proteggiamo dagli altri rimpiazzi
  const math = []; t = t.replace(/\$\$[^$]+\$\$|\$[^$\n]+\$/g, (m) => { math.push(m); return `\u0000${math.length - 1}\u0000`; });
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, txt, url) => `<a href="${esc(safeUrl(url.replace(/&amp;/g, '&')))}" rel="noopener noreferrer">${txt}</a>`);
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => math[Number(i)]);
}
/** Markdown minimale → HTML sicuro (titoli, elenchi, citazioni, codice, link http/https/mailto, formule). Nessun HTML grezzo. */
export function mdToHtml(md) {
  const lines = String(md ?? '').replace(/\r/g, '').split('\n'); const out = []; let list = null, code = false, para = [];
  const flush = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of lines) {
    if (/^```/.test(raw)) { flush(); close(); out.push(code ? '</code></pre>' : '<pre><code>'); code = !code; continue; }
    if (code) { out.push(esc(raw) + '\n'); continue; }
    let m;
    if (!raw.trim()) { flush(); close(); continue; }
    if ((m = /^(#{1,4})\s+(.*)$/.exec(raw))) { flush(); close(); out.push(`<h${m[1].length + 1}>${inline(m[2])}</h${m[1].length + 1}>`); continue; }
    if ((m = /^\s*[-*]\s+(.*)$/.exec(raw))) { flush(); if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push(`<li>${inline(m[1])}</li>`); continue; }
    if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(raw))) { flush(); if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; } out.push(`<li>${inline(m[1])}</li>`); continue; }
    if ((m = /^>\s?(.*)$/.exec(raw))) { flush(); close(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
    close(); para.push(raw.trim());
  }
  if (code) out.push('</code></pre>'); flush(); close();
  return out.join('\n');
}

const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export function searchNotes(notes, q) {
  const t = norm(q).split(/\s+/).filter(Boolean); if (!t.length) return notes;
  return notes.filter((n) => { const hay = norm([n.titolo, n.testo, (n.argomenti || []).join(' '), (n.blocchi || []).join(' ')].join(' ')); return t.every((w) => hay.includes(w)); });
}
export const MAX_NOTE_CHARS = 200000;
export function validateNote(n) {
  if (!n || typeof n !== 'object') throw new NotesError('Appunto non valido');
  const titolo = String(n.titolo ?? '').trim().slice(0, 200) || 'Senza titolo';
  const testo = String(n.testo ?? '');
  if (testo.length > MAX_NOTE_CHARS) throw new NotesError('Appunto troppo lungo (massimo 200 000 caratteri).', 'dimensione');
  return { id: String(n.id || `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`), titolo, testo, argomenti: (n.argomenti || []).map(String).slice(0, 50), blocchi: (n.blocchi || []).map(String).slice(0, 6), creato: n.creato || new Date().toISOString(), modificato: new Date().toISOString() };
}

// ── backend ──
export function memoryBackend() { const m = new Map(); return { kind: 'memoria', async getAll() { return [...m.values()]; }, async put(n) { m.set(n.id, n); }, async delete(id) { m.delete(id); }, async clear() { m.clear(); } }; }
export function storageBackend(st = getStorage(), key = 'notes') {
  return { kind: 'localStorage',
    async getAll() { return st.get(key, []) || []; },
    async put(n) { const a = (st.get(key, []) || []).filter((x) => x.id !== n.id); a.push(n); if (st.set(key, a) === false) throw new NotesError('Spazio del browser esaurito: esporta e libera spazio.', 'quota'); },
    async delete(id) { st.set(key, (st.get(key, []) || []).filter((x) => x.id !== id)); },
    async clear() { st.remove(key); } };
}
export function idbBackend(idb = globalThis.indexedDB) {
  if (!idb) return null;
  const open = () => new Promise((res, rej) => { const r = idb.open('tdc-notes', 1); r.onupgradeneeded = () => r.result.createObjectStore('notes', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction('notes', mode); const out = fn(t.objectStore('notes')); t.oncomplete = () => res(out.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); };
  return { kind: 'IndexedDB',
    getAll: () => tx('readonly', (s) => s.getAll()),
    async put(n) { try { await tx('readwrite', (s) => s.put(n)); } catch (e) { if (e && e.name === 'QuotaExceededError') throw new NotesError('Spazio del browser esaurito: esporta e libera spazio.', 'quota'); throw e; } },
    delete: (id) => tx('readwrite', (s) => s.delete(id)), clear: () => tx('readwrite', (s) => s.clear()) };
}
export async function pickBackend() {
  try { const b = idbBackend(); if (b) { await b.getAll(); return b; } } catch (e) { /* ripiego */ }
  return storageBackend();
}
export function createStore(backend) {
  return {
    backend,
    list: async () => (await backend.getAll()).sort((a, b) => b.modificato.localeCompare(a.modificato)),
    save: async (n) => { const v = validateNote(n); await backend.put(v); return v; },
    remove: (id) => backend.delete(id),
    forTopic: async (id) => (await backend.getAll()).filter((n) => (n.argomenti || []).includes(id)),
    exportJSON: async () => JSON.stringify({ app: 'teoria-circuiti-appunti', version: 1, esportato: new Date().toISOString(), appunti: await backend.getAll() }, null, 2),
    async importJSON(text, { sovrascrivi = false } = {}) {
      let o; try { o = JSON.parse(text); } catch (e) { throw new NotesError('File non valido (JSON).', 'formato'); }
      if (!o || o.app !== 'teoria-circuiti-appunti' || !Array.isArray(o.appunti)) throw new NotesError('Il file non è un export degli appunti di questo sito.', 'formato');
      const esistenti = new Set((await backend.getAll()).map((n) => n.id)); let n = 0, saltati = 0;
      for (const a of o.appunti) { if (esistenti.has(a.id) && !sovrascrivi) { saltati++; continue; } await backend.put({ ...validateNote(a), id: a.id || undefined, creato: a.creato || new Date().toISOString() }); n++; }
      return { importati: n, saltati };
    },
  };
}
