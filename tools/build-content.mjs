// Genera data/studio/*.json, data/formulario.json e aggiorna i flag "contenuto" del syllabus.
// Uso: node tools/build-content.mjs
import { makeRng } from '../assets/js/rng.js';
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
const dir = new URL('./content/', import.meta.url);
const root = new URL('../', import.meta.url);
mkdirSync(new URL('data/studio/', root), { recursive: true });
const studio = {};
const forms = [];
const quiz = [];
const teoria = [];
for (const f of readdirSync(dir).sort()) {
  if (/^blocco.*\.mjs$/.test(f)) { const m = await import(new URL(f, dir)); for (const v of Object.values(m)) Object.assign(studio, v); }
  if (/^quiz-.*\.mjs$/.test(f)) { const m = await import(new URL(f, dir)); for (const v of Object.values(m)) quiz.push(...v); }
  if (/^teoria-.*\.mjs$/.test(f)) { const m = await import(new URL(f, dir)); for (const v of Object.values(m)) teoria.push(...v); }
  if (/^formulario-.*\.mjs$/.test(f)) { const m = await import(new URL(f, dir)); for (const v of Object.values(m)) forms.push(...v); }
}
for (const [id, c] of Object.entries(studio)) writeFileSync(new URL(`data/studio/${id}.json`, root), JSON.stringify({ id, ...c }, null, 1));
const keys = ['id', 'blocco', 'titolo', 'formula', 'simboli', 'uso', 'errore', 'studio'];
const { FILL } = await import(new URL('fill-formulario.mjs', dir));
const voci = forms.map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i]])));
for (const v of voci) { const f = FILL[v.id]; if (f) { if (!v.simboli) v.simboli = f[0]; if (!v.uso) v.uso = f[1]; } }
writeFileSync(new URL('data/formulario.json', root), JSON.stringify({ _nota: 'Generato da tools/build-content.mjs', voci }, null, 1));
const cnt = {};
const quizOut = quiz.map((q) => {
  const bl = q.t.split('-')[0]; cnt[bl] = (cnt[bl] || 0) + 1;
  const base = { id: `Q-${bl}-${String(cnt[bl]).padStart(3, '0')}`, blocco: bl, argomento: q.t, difficolta: q.d, tipo: q.tipo, testo: q.q, spiegazione: q.s, studio: q.t };
  if (q.tipo === 'vf') return { ...base, corretta: q.c };
  // ordine delle opzioni mescolato in modo deterministico (la posizione della risposta giusta varia)
  const idx = makeRng(`quiz|${base.id}`).shuffle(q.o.map((_, i) => i));
  return { ...base, opzioni: idx.map((i) => q.o[i]), corretta: idx.indexOf(q.c) };
});
writeFileSync(new URL('data/quiz.json', root), JSON.stringify({ _nota: 'Generato da tools/build-content.mjs. Domande originali.', domande: quizOut }, null, 1));
writeFileSync(new URL('data/teoria.json', root), JSON.stringify({ _nota: 'Generato da tools/build-content.mjs. Domande riformulate; rubriche e risposte campione originali.', domande: teoria }, null, 1));
const syl = JSON.parse(readFileSync(new URL('data/syllabus.json', root), 'utf8'));
for (const a of syl.argomenti) a.contenuto = Object.prototype.hasOwnProperty.call(studio, a.id);
writeFileSync(new URL('data/syllabus.json', root), JSON.stringify(syl, null, 1));
console.log(Object.keys(studio).length, 'pagine di studio,', voci.length, 'voci di formulario,', quizOut.length, 'quiz,', teoria.length, 'domande aperte');
