/**
 * Lighthouse CI: soglie ≥ 0.95 su prestazioni, accessibilità, best practice e SEO
 * e budget JS (≤ 50 KB per pagina). Le PR successive aggiungono pagine campione
 * (in particolare una pagina di teoria per corso) all'elenco `url`.
 */
const PORT = 4322;
const BASE = `http://localhost:${PORT}/study-hub`;

const COMMON = {
  'categories:performance': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
  'categories:accessibility': ['error', { minScore: 0.95 }],
  'categories:best-practices': ['error', { minScore: 0.95 }],
  // Budget: JavaScript iniziale ≤ 50 KB (misurato senza compressione: stima prudente).
  'resource-summary:script:size': ['error', { maxNumericValue: 51200 }],
};
const SEO_EXCEPT_CRAWLABLE = Object.fromEntries(
  [
    'document-title',
    'meta-description',
    'http-status-code',
    'link-text',
    'crawlable-anchors',
    'hreflang',
    'canonical',
    'image-alt',
    'robots-txt',
  ].map((id) => [id, ['error', { minScore: 1 }]]),
);

module.exports = {
  ci: {
    collect: {
      startServerCommand: `node tools/serve-dist.mjs ${PORT}`,
      startServerReadyPattern: 'servito su',
      url: [
        `${BASE}/it/`,
        `${BASE}/en/`,
        `${BASE}/it/chi-sono/`,
        `${BASE}/en/privacy/`,
        `${BASE}/it/contribuisci/`,
        `${BASE}/it/stile/circuiti/`,
        `${BASE}/it/anno-2/fisica-2/teoria/corrente-stazionaria/`,
        `${BASE}/en/anno-2/fisica-2/`,
        `${BASE}/it/anno-1/fondamenti-informatica/teoria/algebra-di-boole/`,
        `${BASE}/en/anno-1/fondamenti-informatica/`,
      ],
      numberOfRuns: 3,
      ...(process.env.CHROME_PATH ? { chromePath: process.env.CHROME_PATH } : {}),
      settings: {
        chromeFlags: '--headless=new --no-sandbox --disable-gpu',
      },
    },
    assert: {
      // Le pagine /stile/ sono di prova e volutamente noindex: lì la categoria SEO
      // fallirebbe solo per "is-crawlable", quindi si controllano le singole voci SEO.
      assertMatrix: [
        {
          matchingUrlPattern: '^(?!.*/stile/).*$',
          assertions: { ...COMMON, 'categories:seo': ['error', { minScore: 0.95 }] },
        },
        { matchingUrlPattern: '/stile/', assertions: { ...COMMON, ...SEO_EXCEPT_CRAWLABLE } },
      ],
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
