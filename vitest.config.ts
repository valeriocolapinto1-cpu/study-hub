/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';
import astroConfig from './astro.config.mjs';

// Stessa base del sito, letta dalla configurazione di Astro (unica fonte).
const base = `${astroConfig.base ?? ''}/`.replace(/\/+$/, '/');

export default getViteConfig({
  base,
  test: {
    env: { BASE_URL: base },
    include: ['tests/unit/**/*.test.ts', 'tests/content/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: ['legacy/**', 'node_modules/**', 'dist/**'],
    environment: 'node',
  },
});
