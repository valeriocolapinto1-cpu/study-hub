// Plugin Vite: ogni isola Preact passa da IslandBoundary (src/islands/lib/boundary.ts).
// `@astrojs/preact/client.js` (il client che idrata le isole) viene risolto nel nostro
// `boundary-client.ts`, che importa l'originale come `virtual:preact-client-original`.
import { fileURLToPath } from 'node:url';

const CLIENTS = ['@astrojs/preact/client.js', '@astrojs/preact/client-dev.js'];
const ORIGINAL = 'virtual:preact-client-original';
const wrapper = fileURLToPath(new URL('../../src/islands/lib/boundary-client.ts', import.meta.url));

export default function islandBoundary() {
  let dev = false;
  return {
    name: 'study-hub:island-boundary',
    enforce: /** @type {const} */ ('pre'),
    /** @param {{ command: string }} config */
    configResolved(config) {
      dev = config.command === 'serve';
    },
    /**
     * @param {string} id
     * @param {string | undefined} importer
     */
    async resolveId(id, importer) {
      if (CLIENTS.includes(id)) return wrapper;
      if (id !== ORIGINAL) return null;
      // @ts-ignore -- contesto del plugin Rollup
      return this.resolve(CLIENTS[dev ? 1 : 0], importer, { skipSelf: true });
    },
  };
}
