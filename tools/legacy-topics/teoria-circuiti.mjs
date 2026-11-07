import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Teoria dei Circuiti: gli argomenti stanno in `data/syllabus.json` del sito originale
 * (49 argomenti foglia in 6 blocchi). Il gruppo è "<numero romano del blocco> · <titolo del blocco>".
 * @param {string} legacyDir percorso assoluto di legacy/teoria-circuiti
 */
export default function extract(legacyDir) {
  const syl = JSON.parse(readFileSync(join(legacyDir, 'data/syllabus.json'), 'utf8'));
  const blocks = new Map(syl.blocchi.map((b) => [b.id, b.titolo]));
  return syl.argomenti.map((a) => ({ title: a.titolo, group: `${a.blocco} · ${blocks.get(a.blocco)}` }));
}
