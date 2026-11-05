# Registro delle decisioni

Una riga per decisione, in ordine cronologico (AAAA-MM-GG — decisione — motivo).

- 2026-11-05 — Sorgenti originali importati con `git subtree add` **con storia completa** in `legacy/<courseId>/` (teoria-circuiti, fondamenti-informatica, fisica-2, fisica-1) e sito hub precedente spostato con `git mv` in `legacy/hub/` — riferimento per contenuti, design e test "argomenti identici".
- 2026-11-05 — Fisica 2 importata dal branch `main` (non dal branch predefinito del repository, `claude/fisica-generale-ii-study-site-m06roy`): è `main` che il workflow Pages pubblica e contiene un commit in più.
- 2026-11-05 — La PR delle fondamenta si unisce con **merge commit** e non con squash: lo squash appiattirebbe la storia dei subtree, che era lo scopo dell'importazione.
- 2026-11-05 — Astro 7: il processore Markdown predefinito (Sätteri) non gestisce la matematica, quindi si usa `unified()` di `@astrojs/markdown-remark` con remark-math + rehype-katex (`output: htmlAndMathml`, `strict: error`).
- 2026-11-05 — Routing manuale con `src/pages/[lang]/` e `getStaticPaths` invece dell'i18n routing di Astro: slug identici nelle due lingue e radice con redirect lato client (lingua salvata `sh:v1:global:lang`, poi `navigator.languages`, ripiego `it`; `<noscript>` con meta refresh).
- 2026-11-05 — `trailingSlash: 'always'` e `build.format: 'directory'`: URL puliti con barra finale, coerenti con GitHub Pages.
- 2026-11-05 — I file YAML "a elenco" (formule, esercizi, flashcard) sono caricati da un loader dedicato (`yamlListLoader`) che aggiunge `course` dal percorso; id delle entry `<courseId>/<id>`.
- 2026-11-05 — Testi localizzati `{ it, en? }`: nello schema l'inglese è facoltativo (per il ripiego a runtime), ma il test dei contenuti lo rende obbligatorio salvo whitelist.
- 2026-11-05 — `GeneratedExercise.answer` è sempre un array (vuoto se l'esercizio usa `choices`), per avere una sola forma da correggere.
- 2026-11-05 — Font da `@fontsource-variable` (Geist, Geist Mono, Source Serif 4 come serif provvisorio): solo webfont, così gli screenshot sono identici tra macchine Linux; la PR design può cambiare il serif.
- 2026-11-05 — Test visivi: baseline generate solo in CI nel container `mcr.microsoft.com/playwright:v1.63.0-noble` dal workflow manuale "Aggiorna baseline visive"; la CI fallisce con un messaggio esplicito se mancano. `@playwright/test` fissato a 1.63.0 (stessa versione dell'immagine).
- 2026-11-05 — Lighthouse CI: budget JS misurato con `resource-summary:script:size` sul server statico non compresso (stima prudente rispetto ai 50 KB gzip richiesti).
- 2026-11-05 — Deploy con `actions/configure-pages` (`enablement: true`) + `upload-pages-artifact` + `deploy-pages` in un workflow separato dalla CI. Se l'abilitazione automatica non riesce, Valerio deve impostare Settings → Pages → Source: **GitHub Actions** (oggi è "Deploy from branch main /").
- 2026-11-05 — `random.ts` (PRNG mulberry32 deterministico) incluso nelle fondamenta perché il contratto dei generatori richiede determinismo dato il seed.
- 2026-11-05 — Favicon del vecchio hub (gradiente viola-ciano) sostituito da uno sobrio monocromatico, in linea con il design editoriale.
- 2026-11-05 — Direzione visiva "Quaderno" (carta calda, Source Serif 4 per titoli e testo lungo, Geist per l'interfaccia, Geist Mono per dati) scelta tra tre prototipi (Quaderno, Tecnico, Rivista): miglior accordo tra testo e formule KaTeX e struttura degli strati senza riquadri. Dettagli e screenshot in `docs/design/DIRECTION.md`.
- 2026-11-05 — Source Serif 4 confermato come serif, caricato con l'asse ottico (`@fontsource-variable/source-serif-4/opsz.css` + `opsz-italic.css`) invece del solo peso.
- 2026-11-05 — Quattro tinte d'accento da inchiostri tradizionali: Fisica 1 terracotta, Fondamenti di Informatica verde abete, Fisica Generale II blu di Prussia (continuità con il sito originale), Teoria dei Circuiti prugna; accento globale blu inchiostro. Contrasti AA verificati da `tests/unit/design-tokens.test.ts`.
- 2026-11-05 — I CSS dei corsi sono caricati tutti da `BaseLayout` con `import.meta.glob` (sono poche centinaia di byte): un nuovo corso basta aggiungerlo nella cartella.
- 2026-11-05 — Il pulsante di ricerca resta nascosto finché la PR piattaforma non imposta `html[data-search="ready"]`, e comunica con l'evento `sh:search-open`: niente link a una pagina di ricerca che ancora non esiste.
- 2026-11-05 — Pagina `/<lang>/contribuisci/` minima con i canali diretti (email e issue GitHub precompilate da `?corso&pagina&tipo`), perché "Segnala errore" e il menu vi puntano già; la PR piattaforma aggiunge il modulo Apps Script + Turnstile.
- 2026-11-05 — Marchio: segno di integrale in un riquadro, monocromo; favicon SVG, apple-touch-icon e icone del manifest (192/512, maskable) generate dallo stesso disegno. Nessun logo di marchi terzi nelle icone di contatto.
- 2026-11-05 — La pagina `/it/stile/` esiste solo in italiano (noindex, senza hreflang): è uno strumento di sviluppo e la base dei test visivi.
- 2026-11-05 — Nessuna regola globale sugli `svg` in `base.css`: `height: auto` e `max-width` azzeravano gli SVG con cui KaTeX disegna frecce e radici.
