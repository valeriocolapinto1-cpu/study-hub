import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

/**
 * Il sito è pubblicato su GitHub Pages sotto il path del repository, quindi
 * `base` deve corrispondere al nome del repo.
 *
 * Lo stesso `base` vale in dev, build e preview: `vite preview` gira con
 * command === 'serve' come il dev server, quindi renderlo condizionale
 * romperebbe il preview della build (gli asset finirebbero in 404).
 * Dev e preview servono quindi su http://localhost:PORT/<REPO>/.
 */
const REPO = 'fondamenti-di-informatica-AEFIN';

export default defineConfig(() => ({
  base: `/${REPO}/`,
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    preact(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'AE·FIN — Palestra di Architettura degli Elaboratori',
        short_name: 'AE·FIN',
        description:
          'Teoria, esercizi svolti e prove di autovalutazione di Architettura degli Elaboratori.',
        lang: 'it',
        start_url: `/${REPO}/`,
        scope: `/${REPO}/`,
        display: 'standalone',
        background_color: '#0E1116',
        theme_color: '#0E1116',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // I font self-hostati sono file locali: entrano nel precache come il resto.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        /**
         * Fuori dal precache ciò che l'utente non apre mai:
         *
         * - `social.jpg` la scarica solo il crawler di WhatsApp o Telegram
         *   quando qualcuno incolla il link;
         * - `404.html` è una pagina autonoma servita da GitHub Pages per i
         *   percorsi sbagliati, e precaricarla la farebbe pure comparire al
         *   posto dell'app in certi scenari di navigazione offline.
         */
        globIgnores: ['**/social.*', '**/404.html'],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));
