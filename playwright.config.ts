import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
/** Build delle fixture (corso finto) per i test delle isole del motore. */
const FIXTURES_PORT = 4322;
// In locale si può indicare un Chromium già installato (es. /opt/pw-browsers/chromium).
const executablePath = process.env.PW_CHROMIUM_PATH;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  snapshotPathTemplate: 'tests/e2e/__screenshots__/{testFilePath}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // Il service worker (cache offline) è attivo solo nei test che lo chiedono (test.use).
    serviceWorkers: 'block',
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: [/visual\.spec\.ts/, /engine\//] },
    {
      name: 'engine',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${FIXTURES_PORT}` },
      testMatch: /engine\/.*\.spec\.ts/,
    },
    { name: 'visual', use: { ...devices['Desktop Chrome'] }, testMatch: /visual\.spec\.ts/ },
  ],
  webServer: [
    {
      command: `node tools/serve-dist.mjs ${PORT}`,
      url: `http://localhost:${PORT}/study-hub/it/`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    // Solo se la build delle fixture esiste (npm run build:fixtures); senza, i test `engine` falliscono.
    ...(existsSync('dist-fixtures')
      ? [
          {
            command: `node tools/serve-dist.mjs ${FIXTURES_PORT} dist-fixtures`,
            url: `http://localhost:${FIXTURES_PORT}/study-hub/it/`,
            reuseExistingServer: !process.env.CI,
            timeout: 30_000,
          },
        ]
      : []),
  ],
});
