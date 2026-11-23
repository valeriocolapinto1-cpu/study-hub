/**
 * Integrazione Astro della piattaforma: dopo la build aggiunge la Content-Security-Policy
 * alle pagine, crea l'indice di ricerca (Pagefind) e poi il service worker con i manifest
 * dell'offline, che includono anche i file dell'indice (e quindi le pagine con la CSP).
 */
import { fileURLToPath } from 'node:url';
import { applyCsp } from './csp.mjs';
import { buildSearchIndex } from './pagefind.mjs';
import { buildServiceWorker } from './pwa.mjs';

/** @returns {import('astro').AstroIntegration} */
export default function platform() {
  let base = '/';
  return {
    name: 'study-hub-platform',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = `${config.base ?? ''}/`.replace(/\/+$/, '/').replace(/^(?!\/)/, '/');
      },
      'astro:build:done': async ({ dir, logger }) => {
        const dist = fileURLToPath(dir);
        await applyCsp(dist, logger);
        await buildSearchIndex(dist, base, logger);
        await buildServiceWorker(dist, base, logger);
      },
    },
  };
}
