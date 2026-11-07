# Architettura

Sito statico bilingue (IT/EN) che riunisce i siti di studio dei corsi di Ingegneria Elettronica.
Pubblicato su GitHub Pages: `https://valeriocolapinto1-cpu.github.io/study-hub/`.

## Stack

- **Astro 7** (output statico, `trailingSlash: 'always'`, `build.format: 'directory'`) con isole **Preact**.
- **MDX** per la teoria; **content collections** con schemi **Zod** (`src/content.config.ts`, schemi in `src/content/schemas.ts`).
- Matematica: **KaTeX a build-time** (`remark-math` + `rehype-katex`, uscita HTML+MathML) tramite il processore `unified()`
  di `@astrojs/markdown-remark` (Sätteri, il processore predefinito di Astro 7, non gestisce la matematica). Nessun MathJax.
- TypeScript strict, Node 22 (`.nvmrc`), npm. Font Geist e Geist Mono da `@fontsource-variable/*` (OFL).
- Nessun Tailwind, nessuna analytics, nessuna chiave API nel browser.

`site` e `base` stanno **solo** in `astro.config.mjs`. Nel codice si usano `localizePath()`, `withBase()`
(`src/i18n/index.ts`) e `Astro.site`; gli strumenti Node leggono la configurazione da `tools/site-base.mjs`.
Un test (`tests/content/source.test.ts`) vieta in `src/` URL assoluti del sito o dei repository, salvo `src/config/site.ts`.

## Struttura

```
astro.config.mjs  package.json  tsconfig.json  vitest.config.ts  playwright.config.ts  lighthouserc.cjs
src/config/site.ts              autore, contatti, repository, endpoint Contribuisci, LEGACY_REPOS
src/i18n/                       it.json, en.json (interfaccia), glossary.yaml (termini IT→EN), index.ts
src/styles/tokens.css           SOLO variabili (contratto dei nomi più sotto)
src/styles/{base,components,prose,print}.css, src/styles/courses/<courseId>.css (solo --accent*)
src/layouts/                    BaseLayout, CourseLayout, PrintLayout
src/components/                 Head, Header, Footer, LangSwitch, ThemeToggle, CourseNav, …
src/lib/courses.ts              coursePath(), sortCourses(), COURSE_SECTIONS
src/engine/                     TS puro: storage, migrate, random, units, grading, fsrs, progress, exam, mastery,
                                notes, exportImport, qr, rich, course-data, generators/{registry,index}.ts (docs/ENGINE.md)
src/islands/                    isole Preact del motore (ExercisePlayer, ReviewSession, ExamRunner, …) + islands.css
src/components/course/          sezioni generiche del corso (esercizi, ripasso, esame, progressi, appunti)
src/lib/course-data.ts          dati dei corsi per le isole (testi localizzati, HTML con KaTeX a build-time)
src/sim/                        kit simulatori
src/courses/<courseId>/         codice specifico: generators/*.ts, sims/*.tsx, extras/*
src/content/                    content collections (dati)
src/scripts/site.ts             script globale (tema, lingua, migrazioni)
src/pages/index.astro           radice: reindirizza alla lingua
src/pages/[lang]/…              tutte le pagine (getStaticPaths su it/en)
src/pages/404.astro             pagina 404 bilingue
legacy/<courseId>/, legacy/hub/ sorgenti originali (git subtree), esclusi da build, tsc, vitest, prettier
tools/                          serve-dist.mjs, check-links.mjs, site-base.mjs, legacy-topics/, apps-script/
tests/unit, tests/content, tests/e2e, tests/fixtures
```

## URL

- `/study-hub/` → redirect a `/study-hub/it/` o `/study-hub/en/` (lingua salvata, poi del browser; ripiego `it`).
- Gli slug sono **identici** nelle due lingue e sono in italiano: `/en/anno-2/teoria-circuiti/esercizi/`.
- Corso: `/<lang>/anno-<year>/<courseId>/` con sezioni fisse (`COURSE_SECTIONS`):
  `` (Panoramica), `teoria/` (+ `teoria/<topic>/`), `formulario/`, `esercizi/` (+ `esercizi/<topic>/`),
  `ripasso/`, `esame/`, `progressi/`; extra in `extra/<slug>/`.
- Ogni pagina ha canonical e `hreflang` it-IT, en-US, x-default (`Head.astro`); sitemap da `@astrojs/sitemap` con i18n.

## i18n

- Testi d'interfaccia: `t(lang, key, params?)` con chiavi in `src/i18n/{it,en}.json` (stesse chiavi: lo verifica un test).
- Testi dei contenuti: oggetti `{ it, en? }`; `pick()`/`tr()` scelgono la lingua e segnalano il ripiego sull'italiano
  (mostrare allora l'avviso `lang.fallbackNotice`). Il test dei contenuti fallisce se manca l'inglese, salvo voci in
  `tests/content/translation-whitelist.json`.
- Traduzioni: usare `src/i18n/glossary.yaml` (e ampliarlo).
- `getLangFromUrl(url)`, `localizePath(path, lang)`, `switchLangPath(url, lang)`, `stripLang(pathname)`, `withBase(path)`.

## Content collections (contratto)

Schemi in `src/content/schemas.ts`; tutti gli id kebab-case, stabili e unici nel corso; obiettivi `<topicId>.<n>`.

| Collezione | File | Note |
|---|---|---|
| `courses` | `src/content/courses/<courseId>.yaml` | id, year, semester?, title, subtitle?, description, accent, exam{format, durationMin?, structure[]}, extras[], examDates?, legacyRepo, order |
| `topics` | `src/content/topics/<courseId>/<NN>-<topicId>.yaml` | id, course, order, title, summary, objectives[{id,text}], group? |
| `theory` | `src/content/theory/<courseId>/<topicId>.<lang>.mdx` | frontmatter {course, topic, lang}; blocchi `<Layer kind="intuizione\|formalismo\|esempio\|errori">` |
| `formulas` | `src/content/formulas/<courseId>.yaml` (elenco) | id, topic, objectives?, latex, latexEn? (variante inglese se `latex` contiene parole italiane), label, note?, symbols?, usage?, pitfall? |
| `exercises` | `src/content/exercises/<courseId>/<topicId>.yaml` (elenco) | id, topic, objectives, difficulty 1-3, kind static\|generated, generator?, statement, figure?{netlist\|svg}, steps[], answer[]\|choices[], origin |
| `cards` | `src/content/cards/<courseId>/<topicId>.yaml` (elenco) | id, topic, objectives, kind, front, back |

I file "elenco" sono caricati da `yamlListLoader` (`src/content/loaders.ts`), che aggiunge `course` dal percorso
e usa come id `<courseId>/<id>`. Le altre collezioni hanno id `<courseId>/<topicId>` (topics) e
`<courseId>/<topicId>.<lang>` (theory). `answer[].tol` è relativa, default `DEFAULT_TOLERANCE = 0.01`.

## Generatori di esercizi

`src/engine/generators/registry.ts`:

```ts
registerGenerator({ id: '<courseId>/<name>', topic, objectives, generate(seed: number, lang): GeneratedExercise })
// GeneratedExercise = { statement, figure?, steps: [{ title, body }], answer: AnswerItem[], choices? }
```

Deterministici dato il seed (usare `createRng(seed)` di `src/engine/random.ts`), testi già localizzati.
I file `src/courses/<courseId>/generators/*.ts` si registrano da soli; `loadAllGenerators()` li importa tutti.
`runGenerator(id, seed, lang)` esegue e valida l'uscita. Gli esercizi `kind: generated` devono puntare a un generatore registrato.

## Storage locale

`src/engine/storage.ts`: chiavi `sh:v1:<scope>:<area>` (scope = courseId | `global`), valori JSON, ogni accesso in try/catch.
API: `read(scope, area, fallback)`, `write`, `update`, `remove`, `listKeys(scope?)`, `subscribe(scope, area, cb)` (evento `sh:storage`
nella scheda e `storage` tra schede), `setStorageBackend()` per i test. Aree tipiche: `progress`, `srs`, `exam`, `notes`, `settings`;
globali: `theme`, `lang`, `examDates`, `migrations`.

`src/engine/migrate.ts`: tabella `MIGRATIONS` dalle chiavi legacy (stessa origine github.io). Ogni PR di corso aggiunge le sue
voci `{ id, legacyKey, scope, area, transform, merge? }`. Le chiavi legacy non si cancellano mai; le migrazioni eseguite sono in
`sh:v1:global:migrations`; un valore nuovo già presente non viene sovrascritto (salvo `merge`). Eseguita da `src/scripts/site.ts`.

## Design token

`src/styles/tokens.css` contiene solo variabili. Nomi obbligatori:
`--bg --surface --surface-2 --text --text-muted --border --border-strong --accent --accent-strong --accent-soft --on-accent
--success --warning --danger --info --focus`, `--font-serif --font-sans --font-mono`, `--step--2 … --step-5`,
`--leading-tight --leading-body`, `--space-3xs … --space-3xl` (3xs, 2xs, xs, s, m, l, xl, 2xl, 3xl), `--radius-s --radius-m --radius-l`,
`--shadow-1 --shadow-2`, `--measure`, `--content-max`.
Tema: `html[data-theme="light"|"dark"]`, senza attributo segue `prefers-color-scheme`; scelta salvata in `sh:v1:global:theme`
e applicata prima del disegno da uno script inline in `Head.astro`. Accento: `html[data-course="<id>"]` (impostato da
`BaseLayout` con la prop `course`) in `src/styles/courses/<id>.css`, che ridefinisce solo `--accent*`.
Principi, componenti e regole d'uso: `docs/design/README.md`; catalogo visivo di tutti i componenti in `/it/stile/`.

## Aggiungere un corso

1. `src/content/courses/<courseId>.yaml` (+ `src/styles/courses/<courseId>.css` con le sole variabili `--accent*`).
2. Argomenti in `src/content/topics/<courseId>/NN-<topicId>.yaml`: **esattamente** quelli del sito originale.
3. `tools/legacy-topics/<courseId>.mjs`: estrattore degli argomenti da `legacy/<courseId>/` (vedi il README della cartella).
   Il test dei contenuti fallisce se manca o se gli elenchi differiscono.
4. Teoria, formule, esercizi, flashcard nelle rispettive collezioni; generatori in `src/courses/<courseId>/generators/`.
5. Voci di migrazione in `src/engine/migrate.ts`; dubbi di contenuto in `docs/revisione/<courseId>.md`.
6. Pagine campione nuove in `tests/e2e/pages.ts` e `lighthouserc.cjs`; poi rigenerare le baseline visive.

## Motore di studio

Correzione, ripasso FSRS, prove d'esame stampabili, padronanza, piano di studio, appunti, export/QR: vedi
**docs/ENGINE.md**. Le sezioni `esercizi/`, `ripasso/`, `esame/`, `progressi/` e `dati.json` di ogni corso
sono generate da `src/pages/[lang]/[anno]/[course]/` (sostituibili con pagine statiche allo stesso percorso);
pagine globali `/<lang>/ripasso/`, `/<lang>/appunti/`, `/<lang>/i-miei-dati/`, `/<lang>/stampa/prova/`.

## Piattaforma: ricerca, offline, contributi, home

- **Ricerca** (Pagefind 1.6, `tools/integrations/pagefind.mjs`, eseguita da `tools/integrations/platform.mjs`
  dopo la build): un indice per lingua in `dist/pagefind/<it|en>/` (stemming corretto), solo il contenuto di
  `<main data-pagefind-body>` (BaseLayout) delle pagine indicizzabili (`pageSearchType` in
  `src/lib/search/records.ts`: teoria e pagine sì; esercizi, formulario, ripasso, esame, progressi, dati
  personali e strumenti no) con filtri `tipo` e `corso`; in più un record per ogni formula (`formulario/#f-<id>`),
  esercizio statico (`esercizi/<topic>/#<id>`) e flashcard (`ripasso/#<id>`), generati da
  `src/pages/search-records.json.ts` (file rimosso dopo l'indicizzazione). Interfaccia propria
  (`src/islands/SearchDialog.tsx`), caricata alla prima apertura da `src/scripts/search.ts`: `/`, Ctrl/⌘+K o il
  pulsante dell'intestazione; filtri corso, tipo, lingua; funziona offline.
- **PWA** (`tools/integrations/pwa.mjs` → `dist/sw.js` e `dist/offline-summary.json`): un solo service worker
  (`src/pwa/sw.js` + funzioni pure `src/pwa/sw-core.js`) con il manifest di ogni file (hash e dimensione).
  Shell in precache (pagine globali, 404, radice, indice di ricerca, icone e le risorse che richiamano, solo
  import statici e font latin woff2); ogni corso, per lingua, scaricabile su richiesta da "Scarica per
  l'offline" nella panoramica (`src/islands/OfflineCourse.tsx`, inserita da `CourseLayout`). Aggiornamenti
  incrementali (solo i file cambiati), attivati dopo conferma ("Nuova versione disponibile",
  `src/scripts/pwa.ts`); offline, le pagine non salvate portano a `/<lingua>/offline/`. Cache: `sh-shell`,
  `sh-course:<id>:<lingua>`, `sh-runtime` (≤ 120 voci, svuotata a ogni versione), `sh-meta`.
  Nei test Playwright il service worker è bloccato salvo `test.use({ serviceWorkers: 'allow' })`.
- **Contributi**: modulo `/<lingua>/contribuisci/` + Google Apps Script — vedi [CONTRIBUTI.md](CONTRIBUTI.md).
  Crediti nella collection `credits` (`src/content/credits.yaml`), pagina `/<lingua>/ringraziamenti/`.
- **Home**: vetrina con numeri reali dalle collections (corsi, argomenti, esercizi, flashcard, formule,
  simulatori/approfondimenti), corsi per anno, cosa offre il sito, chi lo cura; per chi ha già dati locali
  (`html[data-returning]`, impostato prima del disegno) l'isola `HomeStudy`: ripasso del giorno di tutti i
  corsi, esercizi risolti per corso, prossimo esame, appunti recenti. Le isole della piattaforma ricevono i
  testi come props (`texts(lang, prefisso)` di `src/i18n`), non il dizionario intero.

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm run dev` | server di sviluppo |
| `npm run build` | build statica in `dist/` |
| `npm run check` | `astro check` + `tsc --noEmit` |
| `npm test` | vitest (unit + contenuti) |
| `npm run test:coverage` | vitest con copertura (≥ 90 % righe su `src/engine`) |
| `npm run build:fixtures` | build del corso finto di `tests/fixtures/content` in `dist-fixtures/` (e2e delle isole) |
| `npm run test:content` | solo i controlli sui contenuti |
| `npm run test:links` | link interni di `dist/` (dopo la build) |
| `npm run test:e2e` | Playwright (smoke, axe, visual) su `dist/` servita da `tools/serve-dist.mjs` |
| `npm run lhci` | Lighthouse CI su `dist/` |
| `npm run format` / `format:check` | Prettier |

In locale con un Chromium già installato: `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e`,
`CHROME_PATH=/opt/pw-browsers/chromium npm run lhci`.

## CI e deploy

- `.github/workflows/ci.yml` (PR e push su main): `check` (astro check, tsc, prettier), `unit` (vitest con copertura), `build`
  (build, test dei contenuti, link interni, build delle fixture), `e2e` (container Playwright: smoke, isole del motore sulle fixture, axe WCAG 2.2 AA 0 violazioni serious/critical
  in tema chiaro e scuro, visual 390/1280 px chiaro/scuro), `lighthouse` (≥ 0.95 nelle quattro categorie, JS ≤ 50 KB).
- **Baseline visive**: si generano solo in CI con il workflow *Aggiorna baseline visive* (avvio manuale, oppure push su un branch con `[baseline]` nel messaggio dell'ultimo commit)
  (`visual-baselines.yml`), che le committa sul branch. Dopo il suo commit serve un nuovo push perché la CI riparta
  (i commit fatti con `GITHUB_TOKEN` non avviano workflow).
- **Tema nei test**: il sito è scuro di default e non segue `prefers-color-scheme`; axe, visual e simulazioni scelgono il tema
  scrivendo `sh:v1:global:theme` con `addInitScript`. Gli screenshot attendono `networkidle` (le isole cambiano l'altezza della pagina).
- `.github/workflows/deploy.yml` (push su main): build e pubblicazione con `actions/deploy-pages`.
  Richiede Settings → Pages → Source: **GitHub Actions**.
