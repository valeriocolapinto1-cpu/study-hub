#!/usr/bin/env node
/**
 * Estrae dal sito originale di Fondamenti di Informatica (ex AE·FIN) l'elenco
 * ESATTO degli argomenti: id, titolo, ordine e gruppo.
 *
 * Fonte: `legacy/fondamenti-informatica/src/content/topics/`
 *   - `index.ts`  → ordine (array `topics`) e gruppi (`TOPIC_GROUPS`)
 *   - `<id>.ts`   → titolo del modulo
 *
 * Il sito nuovo usa slug italiani descrittivi al posto degli id brevi
 * dell'originale (`bin` → `numeri-binari`): la corrispondenza è fissata qui,
 * una volta per tutte, ed è la stessa usata dalla migrazione dei dati utente.
 *
 * Uso: `node tools/legacy-topics/fondamenti-informatica.mjs [cartella-legacy]`
 * stampa il JSON; importato, espone `extractTopics(dir?)`.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const COURSE_ID = 'fondamenti-informatica';

/** id legacy → id (slug) nel sito nuovo. */
export const LEGACY_TO_ID = {
  bin: 'numeri-binari',
  bool: 'algebra-di-boole',
  comb: 'reti-combinatorie',
  karnaugh: 'mappe-di-karnaugh',
  arith: 'aritmetica-hardware',
  ff: 'circuiti-sequenziali',
  tech: 'tempi-e-tecnologia',
  cpu: 'processore',
  isa: 'risc-cisc-assembly',
  sw: 'dal-sorgente-all-esecuzione',
  irq: 'interruzioni-ed-eccezioni',
  io: 'input-output',
  pipe: 'pipeline',
  mem: 'gerarchia-di-memoria',
  vm: 'memoria-virtuale',
  perf: 'prestazioni-e-parallelismo',
  ieee: 'virgola-mobile',
};

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const DEFAULT_DIR = join(ROOT, 'legacy', COURSE_ID);

/** Decodifica un letterale stringa JS ('…', "…" o `…` senza interpolazioni). */
function unquote(literal) {
  const body = literal.slice(1, -1);
  return body.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (_, esc) => {
    if (esc[0] === 'u') return String.fromCodePoint(parseInt(esc.replace(/[u{}]/g, ''), 16));
    if (esc[0] === 'x') return String.fromCharCode(parseInt(esc.slice(1), 16));
    return { n: '\n', t: '\t' }[esc] ?? esc;
  });
}

const STRING = String.raw`('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\`(?:[^\`\\]|\\.)*\`)`;

export function extractTopics(dir = DEFAULT_DIR) {
  const topicsDir = join(dir, 'src', 'content', 'topics');
  const index = readFileSync(join(topicsDir, 'index.ts'), 'utf8');

  const order = /export const topics:\s*Topic\[\]\s*=\s*\[([\s\S]*?)\];/.exec(index);
  if (!order) throw new Error('array `topics` non trovato in index.ts');
  const legacyIds = order[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const groupsSrc = /export const TOPIC_GROUPS[^=]*=\s*\[([\s\S]*?)\n\];/.exec(index);
  if (!groupsSrc) throw new Error('`TOPIC_GROUPS` non trovato in index.ts');
  const groupOf = new Map();
  const groups = [];
  const groupRe = new RegExp(
    String.raw`\{\s*id:\s*${STRING},\s*title:\s*${STRING},[\s\S]*?topicIds:\s*\[([^\]]*)\]`,
    'g',
  );
  for (const m of groupsSrc[1].matchAll(groupRe)) {
    const group = { id: unquote(m[1]), title: unquote(m[2]) };
    groups.push(group);
    for (const t of m[3].matchAll(/'([^']+)'/g)) groupOf.set(t[1], group.id);
  }

  const titleRe = new RegExp(String.raw`^\s*title:\s*${STRING},`, 'm');
  return legacyIds.map((legacyId, i) => {
    const src = readFileSync(join(topicsDir, `${legacyId}.ts`), 'utf8');
    const t = titleRe.exec(src);
    if (!t) throw new Error(`titolo non trovato in ${legacyId}.ts`);
    const id = LEGACY_TO_ID[legacyId];
    if (!id) throw new Error(`id legacy senza corrispondenza: ${legacyId}`);
    const group = groupOf.get(legacyId);
    if (!group) throw new Error(`modulo fuori da ogni gruppo: ${legacyId}`);
    return { id, legacyId, order: i + 1, title: unquote(t[1]), group };
  });
}

export function extractGroups(dir = DEFAULT_DIR) {
  const index = readFileSync(join(dir, 'src', 'content', 'topics', 'index.ts'), 'utf8');
  const re = new RegExp(String.raw`\{\s*id:\s*${STRING},\s*title:\s*${STRING},`, 'g');
  const src = /export const TOPIC_GROUPS[^=]*=\s*\[([\s\S]*?)\n\];/.exec(index)[1];
  return [...src.matchAll(re)].map((m) => ({ id: unquote(m[1]), title: unquote(m[2]) }));
}

export default extractTopics;

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_DIR;
  process.stdout.write(JSON.stringify(extractTopics(dir), null, 2) + '\n');
}
