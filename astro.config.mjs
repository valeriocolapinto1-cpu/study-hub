// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Unica impostazione di dominio e percorso base del sito: tutto il resto
// (link, hreflang, canonical, sitemap) si ricava da qui tramite import.meta.env.
export default defineConfig({
  site: 'https://valeriocolapinto1-cpu.github.io',
  base: '/study-hub',
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory' },
  // Matematica resa a build-time con KaTeX (HTML + MathML): nessun JS nel browser.
  // Sätteri (processore predefinito) non supporta la matematica: si usa unified().
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, { output: 'htmlAndMathml', strict: 'error' }]],
    }),
  },
  integrations: [
    preact(),
    mdx(),
    sitemap({
      i18n: { defaultLocale: 'it', locales: { it: 'it-IT', en: 'en-US' } },
      // La radice reindirizza e la 404 non va indicizzata.
      filter: (page) => /\/study-hub\/(it|en)\//.test(page),
    }),
  ],
  vite: {
    server: { watch: { ignored: ['**/legacy/**'] } },
    optimizeDeps: { entries: ['src/**/*.{astro,ts,tsx}'] },
  },
});
