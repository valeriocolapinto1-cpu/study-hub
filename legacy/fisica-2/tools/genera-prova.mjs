#!/usr/bin/env node
// Genera una prova di Fisica Generale II da riga di comando, con lo stesso motore usato dal sito (assets/js/generatore.js).
//
//   node tools/genera-prova.mjs                         # prova "misto" casuale in Markdown, senza soluzioni
//   node tools/genera-prova.mjs --seed 123456           # prova riproducibile
//   node tools/genera-prova.mjs --tipo appello          # stessa struttura (blocchi) di un appello passato di data/appelli.json
//   node tools/genera-prova.mjs --tipo orale            # 3 domande di teoria
//   node tools/genera-prova.mjs --soluzioni             # aggiunge soluzioni e tracce di risposta
//   node tools/genera-prova.mjs --formato json          # output strutturato
//   node tools/genera-prova.mjs --n 5 --soluzioni       # 5 prove con semi consecutivi
//
// Le prove non contengono testi d'esame di terzi: sono generate da template propri sulla tipologia degli appelli passati.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const G = require('../assets/js/generatore.js');
const appelli = JSON.parse(readFileSync(new URL('../data/appelli.json', import.meta.url), 'utf8'));
const programma = JSON.parse(readFileSync(new URL('../data/programma.json', import.meta.url), 'utf8'));

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i < 0 ? def : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
if (opt('aiuto', false) || opt('help', false)) {
  console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
  process.exit(0);
}
const tipo = ['misto', 'appello', 'orale'].includes(opt('tipo', 'misto')) ? opt('tipo', 'misto') : 'misto';
const seed0 = Number(opt('seed', Math.floor(Math.random() * 900000) + 100000));
const n = Math.max(1, Number(opt('n', 1)));
const soluzioni = !!opt('soluzioni', false);
const formato = opt('formato', 'md');
const titoloBlocco = Object.fromEntries(programma.blocchi.map((b) => [b.id, b.titolo]));

const prove = Array.from({ length: n }, (_, i) => G.generaProva(seed0 + i, appelli, tipo));
if (formato === 'json') { console.log(JSON.stringify(soluzioni ? prove : prove.map((p) => ({ ...p, esercizi: p.esercizi.map(({ passi, risultati, valori, ...e }) => e), teoria: p.teoria.map(({ traccia, ...q }) => q) })), null, 2)); process.exit(0); }

for (const p of prove) {
  const pts = tipo === 'orale' ? '3 domande × 10 punti' : '4 esercizi × 6 punti + 2 domande di teoria × 3 punti';
  console.log(`# Fisica Generale II — prova ${tipo} (codice ${p.seme})\n`);
  console.log(`*${pts}. ${tipo === 'orale' ? '' : 'Durata 2 h 30 min, nessun materiale ammesso, soglia 18/30. '}Esercizi e numeri generati: nessun testo d'esame di terzi.*`);
  if (p.modello) console.log(`\n*Struttura ricalcata sull'appello del ${p.modello.titolo}.*`);
  if (p.esercizi.length) console.log('\n## Esercizi');
  p.esercizi.forEach((e, i) => {
    console.log(`\n### Esercizio ${i + 1} — ${titoloBlocco[e.blocco]} (${e.tema})\n\n${e.testo}`);
    if (soluzioni) {
      console.log('\n**Soluzione**\n');
      e.passi.forEach((x, k) => console.log(`${k + 1}. ${x}`));
      console.log(`\n**Risultati:** ${e.risultati.map((x) => `$${x}$`).join(' ; ')}`);
    }
  });
  console.log('\n## Teoria');
  p.teoria.forEach((q, i) => {
    console.log(`\n${i + 1}. [${titoloBlocco[q.blocco]}] ${q.testo}`);
    if (soluzioni) q.traccia.forEach((x) => console.log(`   - ${x}`));
  });
  console.log('\n---\n');
}
