#!/usr/bin/env node
/**
 * Schermate del manifest della PWA (installazione su Android e desktop): `public/screenshots/*.webp`,
 * elencate in `src/pages/site.webmanifest.ts` con le loro dimensioni (verificate da un test).
 * Si rigenerano a mano quando l'aspetto del sito cambia molto:
 *   npm run build && node tools/screenshots.mjs   (Chromium di Playwright; PW_CHROMIUM_PATH per un altro)
 * Tema scuro (predefinito), lingua italiana; il service worker è bloccato (niente avvisi).
 */
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { BASE } from './site-base.mjs';

const PORT = 4339;
const OUT = join(import.meta.dirname, '..', 'public', 'screenshots');
const SHOTS = [
  { file: 'home-narrow.webp', path: 'it/', viewport: { width: 390, height: 844 }, scale: 2 },
  {
    file: 'teoria-narrow.webp',
    path: 'it/anno-2/teoria-circuiti/teoria/teorema-di-thevenin/',
    viewport: { width: 390, height: 844 },
    scale: 2,
  },
  { file: 'home-wide.webp', path: 'it/', viewport: { width: 1440, height: 900 }, scale: 1 },
];

const server = spawn(process.execPath, [join(import.meta.dirname, 'serve-dist.mjs'), String(PORT)], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((resolve) =>
  server.stdout.on('data', (d) => String(d).includes('servito su') && resolve()),
);
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
try {
  await mkdir(OUT, { recursive: true });
  for (const shot of SHOTS) {
    const page = await browser.newPage({
      viewport: shot.viewport,
      deviceScaleFactor: shot.scale,
      serviceWorkers: 'block',
    });
    await page.goto(`http://localhost:${PORT}${BASE}${shot.path}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ animations: 'disabled' });
    await sharp(png).webp({ quality: 80 }).toFile(join(OUT, shot.file));
    const { width, height } = await sharp(join(OUT, shot.file)).metadata();
    console.log(`${shot.file}: ${width}x${height}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
