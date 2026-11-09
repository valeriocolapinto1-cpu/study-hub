// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import platform from './tools/integrations/platform.mjs';
import rehypeNoteIds from './src/lib/rehype-note-ids.mjs';
import islandI18n from './tools/vite/island-i18n.mjs';
import { buildInfo } from './tools/build-info.mjs';

// Unica impostazione di dominio e percorso base del sito: tutto il resto
// (link, hreflang, canonical, sitemap) si ricava da qui tramite import.meta.env.
export default defineConfig({
  site: 'https://valeriocolapinto1-cpu.github.io',
  base: '/study-hub',
  trailingSlash: 'always',
  output: 'static',
  // Build delle fixture end-to-end (corso finto): cartella separata, mai pubblicata.
  outDir: process.env.PUBLIC_STUDY_HUB_FIXTURES === '1' ? './dist-fixtures' : './dist',
  build: { format: 'directory' },
  // Matematica resa a build-time con KaTeX (HTML + MathML): nessun JS nel browser.
  // Sätteri (processore predefinito) non supporta la matematica: si usa unified().
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      // rehypeNoteIds: id stabili per gli appunti (data-note-id) e ancore nei titoli della teoria MDX.
      rehypePlugins: [[rehypeKatex, { output: 'htmlAndMathml', strict: 'error' }], rehypeNoteIds],
    }),
  },
  integrations: [
    preact(),
    mdx(),
    sitemap({
      i18n: { defaultLocale: 'it', locales: { it: 'it-IT', en: 'en-US' } },
      // La radice reindirizza e la 404 non va indicizzata.
      filter: (page) =>
        /\/study-hub\/(it|en)\//.test(page) && !page.includes('/stile/') && !/\/offline\/$/.test(page),
    }),
    // Dopo la build: indice di ricerca (Pagefind) e service worker con i manifest dell'offline.
    platform(),
  ],
  vite: {
    // Commit e data della build: footer e controllo aggiornamenti (uguali a dist/version.json).
    define: { __SH_BUILD__: JSON.stringify(buildInfo()) },
    // Dizionario ridotto per le isole (solo i namespace che usano).
    plugins: [islandI18n()],
    server: { watch: { ignored: ['**/legacy/**'] } },
    optimizeDeps: { entries: ['src/**/*.{astro,ts,tsx}'] },
  },
});
