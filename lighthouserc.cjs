/**
 * Lighthouse CI: soglie ≥ 0.95 su prestazioni, accessibilità, best practice e SEO
 * e budget JS (≤ 50 KB per pagina). Le PR successive aggiungono pagine campione
 * (in particolare una pagina di teoria per corso) all'elenco `url`.
 */
const PORT = 4322;
const BASE = `http://localhost:${PORT}/study-hub`;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `node tools/serve-dist.mjs ${PORT}`,
      startServerReadyPattern: 'servito su',
      url: [`${BASE}/it/`, `${BASE}/en/`],
      numberOfRuns: 3,
      ...(process.env.CHROME_PATH ? { chromePath: process.env.CHROME_PATH } : {}),
      settings: {
        chromeFlags: '--headless=new --no-sandbox --disable-gpu',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        // Budget: JavaScript iniziale ≤ 50 KB (misurato senza compressione: stima prudente).
        'resource-summary:script:size': ['error', { maxNumericValue: 51200 }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
