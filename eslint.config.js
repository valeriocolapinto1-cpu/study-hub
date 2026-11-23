// ESLint (flat config): JavaScript e TypeScript, componenti Astro, accessibilità del JSX (Preact).
// Le regole disattivate qui hanno la motivazione in docs/decisions.md (PR9, «Lint»).
import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'dist-fixtures/',
      '.astro/',
      'legacy/',
      'node_modules/',
      'playwright-report/',
      'test-results/',
      '.lighthouseci/',
      // Google Apps Script: altro runtime (V8 di Google, globali SpreadsheetApp/DriveApp…), provato a parte.
      'tools/apps-script/*.gs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-recommended'],
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      // Argomenti e variabili con «_» davanti: inutilizzati di proposito (firme imposte, destrutturazioni).
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
        },
      ],
      // Commenti @ts-…: ammessi solo con la spiegazione dopo «--».
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description', 'ts-nocheck': 'allow-with-description' },
      ],
    },
  },
  {
    // TypeScript controlla già i nomi non dichiarati (anche i `declare const` di env.d.ts,
    // che no-undef non vede): raccomandazione di typescript-eslint.
    files: ['**/*.ts', '**/*.tsx', '**/*.astro'],
    rules: { 'no-undef': 'off' },
  },
  {
    // Isole e componenti Preact: regole di accessibilità del JSX.
    // Il plugin è già registrato dalla configurazione jsx-a11y di eslint-plugin-astro: qui solo le regole.
    files: ['src/**/*.tsx'],
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // Preact usa l'attributo `for` (non `htmlFor`), che la regola non riconosce, e le etichette
      // con dangerouslySetInnerHTML le sembrano vuote: falsi positivi. L'associazione etichetta–campo
      // la verifica axe (label, WCAG 2.2 AA) sul DOM reso nei test end-to-end.
      'jsx-a11y/label-has-associated-control': 'off',
    },
  },
  {
    // Test: mock e shim di API esterne (Apps Script, canvas, QR) tipizzati alla buona di proposito.
    files: ['tests/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  {
    // Service worker: globali del worker.
    files: ['src/pwa/sw.js', 'src/pwa/sw-core.js'],
    languageOptions: { globals: { ...globals.serviceworker } },
  },
  {
    // Configurazione CommonJS di Lighthouse CI.
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
  },
);
