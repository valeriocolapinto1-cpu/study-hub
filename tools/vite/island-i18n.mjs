// Plugin Vite: dizionari delle isole ridotti ai namespace che usano.
// `virtual:island-i18n/it` e `virtual:island-i18n/en` esportano il dizionario di una
// lingua (moduli separati: nel browser se ne scarica solo uno, quello della pagina).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ISLAND_NAMESPACES } from '../../src/i18n/island-namespaces.mjs';

const ID = 'virtual:island-i18n';
const RESOLVED = '\0' + ID;
const dir = new URL('../../src/i18n/', import.meta.url);

/** @param {Record<string, string>} dict */
export const filterIslandKeys = (dict) =>
  Object.fromEntries(Object.entries(dict).filter(([k]) => ISLAND_NAMESPACES.includes(k.split('.')[0] ?? '')));

export default function islandI18n() {
  const files = ['it', 'en'].map((l) => fileURLToPath(new URL(`${l}.json`, dir)));
  return {
    name: 'study-hub:island-i18n',
    /** @param {string} id */
    resolveId(id) {
      return /^virtual:island-i18n\/(it|en)$/.test(id) ? RESOLVED + id.slice(ID.length) : null;
    },
    /** @param {string} id */
    load(id) {
      if (!id.startsWith(RESOLVED + '/')) return null;
      const lang = id.slice(RESOLVED.length + 1);
      const file = files[lang === 'en' ? 1 : 0] ?? '';
      this.addWatchFile(file);
      return `export default ${JSON.stringify(filterIslandKeys(JSON.parse(readFileSync(file, 'utf8'))))};`;
    },
  };
}
