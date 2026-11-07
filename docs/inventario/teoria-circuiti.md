# Inventario — Teoria dei Circuiti

Sito originale: `legacy/teoria-circuiti/` (repository `teoria-dei-circuiti-ingegneria-elettronica`), HTML + JS vanilla,
dati in `data/*.json` generati da `tools/content/*.mjs`. Nuovo corso: `teoria-circuiti`, anno 2, semestre 1, tinta prugna.

## Pagine → destinazione

| Pagina originale | Contenuto | Destinazione |
|---|---|---|
| `index.html` (Home) | 3 azioni, prossima scadenza, progresso, «Ripasso di oggi» | Panoramica (`/`) + home del sito (dashboard del motore) |
| `corso/` | dati ufficiali con badge, appelli | Panoramica: «Il corso» (`src/courses/teoria-circuiti/Overview.astro`), date d'esame (`examDates`) |
| `esame/` | «cosa sappiamo e cosa no», formato storico, domande al docente | `extra/esame-info/` + struttura d'esame nella Panoramica |
| `programma/` | 6 blocchi, pesi (inferenza), fuori programma | Panoramica (pesi dei blocchi, fuori programma, mappa argomenti) + indice `teoria/` |
| `studio/?t=<id>` (49 pagine) | obiettivi, teoria, dimostrazioni, figure, esempi, errori, «all'esame», formule collegate | `teoria/<topic>/` (MDX IT/EN a strati) + `teoria/<topic>/stampa/` |
| `formulario/` + drawer ƒ | 160 voci con simboli, uso, errore; ricerca, filtri, segnalibri, stampa, solo preferiti | `formulario/` e `formulario/stampa/` (generici, schema `formulas` esteso) |
| `esercizi/` | esercizio d'analisi (template A/B/C, livelli 1–3; modalità completo, guidato in 8 passi, per passo), 12 domande applicate | `esercizi/` e `esercizi/<topic>/` (generatori registrati; passi = soluzione progressiva del motore) |
| `quiz/` | 271 domande (mc, vf, fm), Leitner, «solo errori» | esercizi a scelta per argomento + `ripasso/` (FSRS del motore) |
| `teoria/` (domande aperte) | 50 domande con rubrica, correzione a parole chiave + AI | flashcard `orale` (`ripasso/`, esame «domande») in autovalutazione |
| `prova/` | prova storica (30 + 3×10 + 3), timer 2h30, report, stampa | `esame/` (struttura dal YAML del corso, durata 150 min) |
| `progresso/`, `piano/` | metriche, heatmap, «cosa studiare ora», piano settimanale, `.ics` | `progressi/` (padronanza per obiettivo, piano fino alla data d'esame) |
| `appunti/` | appunti Markdown in IndexedDB | appunti del motore (`<Notes>` su ogni paragrafo `data-note-id`), pagina globale «I miei appunti» |
| `archivio/` | date e argomenti degli appelli 2000–2009 | `extra/archivio-appelli/` |
| `risorse/` | libri, risorse gratuite, materiali a pagamento | `extra/risorse/` |
| `faq/` | FAQ, errori tipici E1–E11, strategia di studio, domande al docente | `extra/errori-tipici/` (errori + strategia), `extra/esame-info/` (domande al docente, etichette) |
| `simulatori/` | guide CircuitJS/LTspice, export SPICE | figure degli esercizi dal kit `<Circuit>`; link ai simulatori in `extra/risorse/` |
| `impostazioni/` | tema, export/import, chiave API AI | tema globale, «I miei dati» (export/import, QR) del motore; chiave API **eliminata** |
| `altro/` | indice delle pagine secondarie | eliminata (doppione del menu del corso) |
| `note-legali/`, `privacy/`, `404.html` | — | pagine globali del sito |

## Eliminato (motivato)

- **Correzione con AI** (`assets/js/grader/ai-adapter.js`, `secret.aiKey`, `ai.cache`, «Spiega il mio errore», pagina Impostazioni AI, `tests/ai.test.mjs`): vietata dalle decisioni del progetto (niente chiavi API nel browser). Nessun riferimento nel nuovo codice; la chiave non viene migrata.
- **Correzione a parole chiave delle risposte aperte** (`grader/rubric.js`): poco affidabile per stessa ammissione del vecchio sito (confidenza bassa sulle parafrasi), non trasferibile all'inglese; la rubrica sopravvive come «punti da toccare» sul retro delle flashcard d'orale.
- **Pagina `altro/`** e menu a 5 voci: sostituiti dal menu delle sezioni fisse e degli extra.
- **Badge su ogni dato di pagina corso** come elemento grafico invadente: le etichette restano (componente `Reliability`) dove servono, nelle pagine informative.
- **Risorse «Università di Roma» non verificate di recente** (due pagine di docenti con esami e programma diversi) e **siti di appunti a pagamento**: poco utili e non verificabili; restano MIT OCW, dispense di Trieste, CircuitJS, LTspice.
- **Generatore di prove proprio** (`exam.js`) e **Leitner** (`srs.js`): doppioni del motore comune (esame e FSRS).
- **Disegno SVG dei circuiti a coordinate fisse** (`svg/render.js`) ed **export SPICE** (`spice.js`): sostituiti dallo schema generato dalla netlist del kit.
- **Service worker / PWA del corso**: competenza della piattaforma (PR9).

## Dati

| File | Contenuto | Destinazione |
|---|---|---|
| `data/syllabus.json` | 6 blocchi, 49 argomenti (id I-01…VI-09, titolo, prerequisiti, pesi, tag) | `src/content/topics/teoria-circuiti/NN-<id>.yaml` (titoli identici, gruppo «<blocco> · <titolo>»); estrattore `tools/legacy-topics/teoria-circuiti.mjs`; mappa id in `src/courses/teoria-circuiti/legacy-ids.ts` |
| `data/studio/*.json` (49) | obiettivi (3), teoria, figure SVG, dimostrazioni, esempi, errori, esame, formule collegate | `src/content/theory/teoria-circuiti/<topic>.{it,en}.mdx` (strati intuizione → formalismo → esempio → errori, callout «All'esame») |
| `data/formulario.json` | 160 voci | `src/content/formulas/teoria-circuiti.yaml` + 160 flashcard `formula` |
| `data/quiz.json` | 271 domande | esercizi statici con `choices` in `src/content/exercises/teoria-circuiti/<topic>.yaml` |
| `data/teoria.json` | 50 domande aperte, rubriche, risposte campione | 50 flashcard `orale` in `src/content/cards/teoria-circuiti/` |
| `data/appelli.json` | appelli 29-10-2026 (scritto) e 03-11-2026 (discussione) | `examDates` del corso |
| `data/archivio.json` | 26 appelli storici, solo argomenti | `src/courses/teoria-circuiti/data.ts` → `extra/archivio-appelli/` |
| `data/errori.json` | 11 errori tipici | `data.ts` → `extra/errori-tipici/` |
| `data/risorse.json` | libri, risorse, a pagamento | `data.ts` → `extra/risorse/` |

## Codice portato

| Originale | Nuovo |
|---|---|
| `rational.js`, `complex.js`, `solver/{linalg,netlist,mna,network,exercise}.js` | `src/courses/teoria-circuiti/lib/` (TypeScript, aritmetica esatta) |
| `solver/simulator.js` (verifica indipendente nel tempo) | `lib/simulator.ts`, usato solo dai test |
| `templates/{common,templateA,B,C}.js`, `generator.js` | `lib/templates.ts`, `lib/generate.ts` |
| `explain.js` (testo e 8 passi) | `lib/explain.ts` (IT/EN) |
| `problems.js` (12 domande applicate, 4 allenamenti per passo) | `generators/applicate.ts` (19 generatori) |
| — | `generators/analisi.ts` (12 generatori: 4 tipi × 3 livelli), `lib/kit.ts` (netlist del kit) |
| `tests/*.test.mjs` (aritmetica, solver, motore, problemi) | `tests/unit/teoria-circuiti/*.test.ts` (+ verifica con il risolutore del kit) |

## Chiavi localStorage (`tdc:` + chiave) → migrazione

| Chiave | Contenuto | Migrazione (`src/courses/teoria-circuiti/migrations.ts`) |
|---|---|---|
| `meta` | versione dello schema | non serve |
| `settings` | `tema` (auto/chiaro/scuro), altro | `sh:v1:global:theme` (solo chiaro/scuro) |
| `progress` | stato per argomento (non iniziato/studiato/ripassato/padroneggiato) | `progress.read` degli argomenti |
| `quiz.log` | esiti dei quiz | tentativi sugli esercizi `q-…` in `progress` |
| `formulario` | segnalibri | `sh:v1:teoria-circuiti:formulary` |
| `piano` | data d'esame, ore settimanali, ordine dei blocchi | `sh:v1:global:examDates` |
| `notes` | appunti (ripiego senza IndexedDB) | `sh:v1:teoria-circuiti:notes` (con pagina dell'argomento) |
| IndexedDB `tdc-notes` | appunti | non migrabili in modo sincrono: restano nel vecchio sito, esportabili da lì |
| `srs` | scatole Leitner | non migrate (modello diverso); le domande sbagliate tornano dal registro dei quiz |
| `esercizi.log`, `teoria.log`, `prove.storico`, `prova.corrente`, `prova.config` | storici del vecchio generatore | non migrati: id e formato delle istanze non corrispondono |
| `secret.aiKey`, `ai.cache` | AI | **mai** migrati |
| `print-pref`, `printing` | temporanei | non servono |
