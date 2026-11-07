// Plugin Vite: `virtual:island-i18n` esporta { it, en } ridotti ai namespace delle isole.
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
      return id === ID ? RESOLVED : null;
    },
    /** @param {string} id */
    load(id) {
      if (id !== RESOLVED) return null;
      const [it, en] = files.map((f) => {
        this.addWatchFile(f);
        return filterIslandKeys(JSON.parse(readFileSync(f, 'utf8')));
      });
      return `export default ${JSON.stringify({ it, en })};`;
    },
  };
}
