#!/usr/bin/env node
// Estrae dall'originale (legacy/fisica-1/index.html, «Orale Trainer») l'elenco ESATTO
// degli argomenti: id, titolo, ordine e gruppo (area). Il test di CI confronta questo
// elenco con src/content/topics/fisica-1/: nomi, ordine e suddivisione devono coincidere.
//
// L'originale è un unico file con l'array JS `CONTENUTI` (un oggetto per argomento, che
// si apre con `id: N, titolo: "…", area: "X"`) e la mappa `AREE` (lettera → nome area).
// Si legge il file come testo, senza eseguirlo.
//
// Uso: `node tools/legacy-topics/fisica-1.mjs [cartella-legacy]` stampa il JSON.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const courseId = 'fisica-1';

/** id stabili (kebab-case) assegnati ai 33 argomenti, nell'ordine dell'originale. */
export const TOPIC_IDS = [
  'moto-circolare-vario',
  'moto-armonico',
  'oscillatore-massa-molla',
  'pendolo-semplice',
  'sistemi-di-riferimento',
  'oscillatore-smorzato',
  'risonanza',
  'lavoro-energia-cinetica',
  'forze-conservative',
  'forze-non-conservative',
  'momento-angolare',
  'centro-di-massa',
  'momenti-di-inerzia',
  'teorema-momento-angolare',
  'teorema-di-koenig',
  'moto-corpo-rigido',
  'statica-corpo-rigido',
  'energia-corpo-rigido',
  'pendolo-fisico',
  'rotolamento-puro',
  'urti-centrali',
  'pendolo-balistico',
  'legge-di-stevino',
  'teoria-cinetica-gas',
  'legge-gas-perfetti',
  'equipartizione-energia',
  'calori-molari',
  'primo-principio',
  'secondo-principio',
  'ciclo-di-carnot',
  'teorema-di-carnot',
  'disuguaglianza-di-clausius',
  'entropia-adiabatiche',
];

/** id stabili dei gruppi (aree dell'originale). */
export const GROUP_IDS = {
  A: 'cinematica-oscillazioni',
  B: 'lavoro-energia',
  C: 'sistemi-corpo-rigido',
  D: 'fluidi-termodinamica',
};

function unescapeJs(s) {
  return JSON.parse('"' + s.replace(/\\'/g, "'") + '"');
}

/**
 * @param {string} html contenuto di index.html dell'originale
 * @returns {{ id: string, legacyId: number, title: string, order: number, group: string, groupTitle: string }[]}
 */
export function extractFromHtml(html) {
  const aree = {};
  const areeBlock = html.match(/const AREE = \{([\s\S]*?)\};/);
  if (!areeBlock) throw new Error('mappa AREE non trovata');
  for (const m of areeBlock[1].matchAll(/([A-Z]):\s*"((?:[^"\\]|\\.)*)"/g)) aree[m[1]] = unescapeJs(m[2]);

  const out = [];
  const re = /^\s*id:\s*(\d+),\s*titolo:\s*"((?:[^"\\]|\\.)*)",\s*area:\s*"([A-Z])"/gm;
  for (const m of html.matchAll(re)) {
    const legacyId = Number(m[1]);
    const group = m[3];
    if (!(group in aree)) throw new Error(`area sconosciuta ${group} per l'argomento ${legacyId}`);
    out.push({ legacyId, title: unescapeJs(m[2]), group, groupTitle: aree[group] });
  }
  if (out.length !== TOPIC_IDS.length) {
    throw new Error(`attesi ${TOPIC_IDS.length} argomenti, trovati ${out.length}`);
  }
  return out.map((t, i) => {
    if (t.legacyId !== i + 1) throw new Error(`ordine inatteso: posizione ${i + 1} ha id ${t.legacyId}`);
    return {
      id: TOPIC_IDS[i],
      legacyId: t.legacyId,
      title: t.title,
      order: i + 1,
      group: GROUP_IDS[t.group],
      groupTitle: t.groupTitle,
    };
  });
}

/**
 * Estrattore per il test dei contenuti: `legacyDir` è il percorso assoluto di
 * legacy/fisica-1. Restituisce gli argomenti nell'ordine originale con titolo
 * italiano e gruppo (nome dell'area), più l'id stabile usato nel sito nuovo.
 * @param {string} [legacyDir]
 */
export default function extract(legacyDir) {
  const here = dirname(fileURLToPath(import.meta.url));
  const dir = legacyDir ?? resolve(here, '../../legacy/fisica-1');
  return extractFromHtml(readFileSync(join(dir, 'index.html'), 'utf8')).map((t) => ({
    id: t.id,
    legacyId: t.legacyId,
    title: t.title,
    order: t.order,
    group: t.groupTitle,
    groupId: t.group,
  }));
}

export const extractTopics = extract;

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(extract(process.argv[2]), null, 2));
}
