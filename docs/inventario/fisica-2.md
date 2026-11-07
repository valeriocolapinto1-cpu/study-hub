# Inventario del sito originale — Fisica Generale II (`fisica-2`)

Sorgente: `legacy/fisica-2/` (repository `fisica-2-ingegneria-elettronica`, branch pubblicato `main`, uguale al branch
`claude/fisica-generale-ii-study-site-m06roy` salvo una riga di CSS). Sito statico in HTML + JS vanilla, dati in `data/*.json`.

## Pagine → destinazione

| Pagina originale | Contenuto | Destinazione nel nuovo sito |
|---|---|---|
| `index.html` (+ `home.js`) | presentazione, avanzamento lezioni, prossima lezione | Panoramica (`Overview.astro`) + home globale |
| `programma.html` (+ `programma.js`) | vista "Lezioni" (60 lezioni spuntabili, filtri) e "Programma ufficiale" (7 blocchi, 11 sezioni, argomenti, testo ufficiale) | Panoramica: programma lezione per lezione con spunte; argomenti = 11 sezioni (mappa degli argomenti); obiettivi degli argomenti ricavati da lezioni e argomenti ufficiali |
| `teoria.html` (+ `teoria.js`, `data/teoria/b1…b7.html`) | teoria per capitolo, una sezione `<h2>` per sezione del programma | `teoria/<topic>/` (11 pagine, IT/EN), formalismo fedele + intuizione, esempio svolto, errori tipici |
| `formulario.html` (+ `formulario.js`, `data/formule.json`) | 155 formule in 29 gruppi per blocco | `formulario/` (collection `formulas`, 155 voci) + 155 flashcard di tipo formula |
| `esercizi.html` (+ `esercizi.js`, `data/appelli.json`) | generatore di esercizi + indice degli esercizi d'esame per blocco/anno con spunta "risolto" | `esercizi/` (35 generatori + 81 domande del quiz) e `extra/appelli` (indice con spunte) |
| `esame.html` (+ `esame.js`, `prove.js`, `quiz.js`, `data/esame.json`, `data/quiz.json`) | regole d'esame, quiz a correzione automatica, prova "scritto misto", "appello tipo", "orale", timer, link di prova | `esame/` (motore: simulazione con timer, stampa, PDF), quiz → esercizi statici con `choices`/`answer`, domande d'orale → flashcard `orale`; regole in Panoramica |
| `laboratorio.html` (+ `laboratorio.js`, `data/laboratorio.json`) | 5 esperienze, checklist della relazione (comune + specifica) | `extra/laboratorio` |
| `calendario.html` | reindirizzava a `programma.html` (lezioni) | eliminata (doppione) |
| `simulazione.html` | reindirizzava a `esame.html#allenati` | eliminata (doppione) |
| `risorse.html` (+ `data/risorse.json`) | reindirizzava a `esame.html#materiali`: testo, dispense, cartella appelli, pagina del corso | Panoramica, sezione "Testo e materiali" |
| `cerca.html` (+ `cerca.js`) | ricerca locale | sostituita dalla ricerca globale (Pagefind) |
| `note-legali.html`, `privacy.html`, `404.html` | pagine legali | pagine globali del sito |
| `tools/genera-prova.mjs` | CLI: prova misto/appello/orale in Markdown/JSON | sostituito dal motore (`esame/`: prova completa/personalizzata/mirata, deterministica da seme, stampabile) |
| `tests/generatore.test.mjs` | verifica numerica indipendente dei template | `tests/unit/fisica-2/verifica-numerica.test.ts` (+ `generatori.test.ts`) |

## Dati

- `corso.json`: CFU, ore, SSD, prerequisiti, link → Panoramica. `contatti` e `analytics` (GoatCounter, `null`) non migrati: contatti globali in Chi sono, nessuna analytics.
- `programma.json`: 7 blocchi, 11 sezioni → `tools/legacy-topics/fisica-2.mjs` (argomenti e gruppi), obiettivi.
- `lezioni.json` (60) → `src/courses/fisica-2/data/lezioni.yaml` (IT/EN, tipo, argomenti collegati).
- `teoria/b1…b7.html` → `src/content/theory/fisica-2/*.mdx`.
- `formule.json` (155) → `src/content/formulas/fisica-2.yaml`.
- `quiz.json` (81: 46 a scelta multipla, 31 numeriche, 4 pratiche a scelta) → `src/content/exercises/fisica-2/*.yaml` (`quiz-q…`).
- `appelli.json` (48 appelli, 192 esercizi e 96 domande, solo date e blocco stimato) → `src/courses/fisica-2/data/appelli.yaml`.
- `esame.json` → `courses/fisica-2.yaml` (struttura) e Panoramica. I "risultati di apprendimento" erano segnaposto senza testo: non migrati (vedi revisione).
- `laboratorio.json` → `src/courses/fisica-2/data/laboratorio.yaml` (IT/EN).
- `risorse.json` → Panoramica.
- `assets/js/generatore.js` (35 template + 28 domande di teoria) → `src/courses/fisica-2/generators/*.ts` e flashcard `orale-NN`.

## Chiavi localStorage

| Chiave | Contenuto | Migrazione (`src/courses/fisica-2/migrations.ts`) |
|---|---|---|
| `fg2-theme` | `light`/`dark` | `global:theme` |
| `fg2-progress-v1` | `{ lesson, exam, lab, outcome, criterio }` | `lesson` → `fisica-2:lessons` e argomenti studiati in `fisica-2:progress`; `lab` → `fisica-2:lab`; `exam` → `fisica-2:appelli`; `outcome`/`criterio` non migrati (segnaposto) |
| `fg2-quiz` | ultimi 20 quiz `{ t, ok, n, voto }` | `fisica-2:legacyQuiz` (mostrato in `extra/appelli`) |
| `fg2-consent` | consenso alle statistiche | annotata, nessun dato (il nuovo sito non ha statistiche) |

## Eliminato perché doppione o superato

- `calendario.html`, `simulazione.html`, `risorse.html`: erano solo reindirizzamenti.
- Esportazione/importazione dei progressi in `programma.html`: sostituita da "I miei dati" (export/QR del motore).
- Filtri della vista lezioni: la lista è breve e raggruppata per capitolo; la ricerca è globale.
- Banner dei cookie: nessun cookie né statistiche nel nuovo sito.
- `prove.js` (prove generate, timer, link con codice): sostituito dal motore d'esame, che usa gli stessi generatori.
