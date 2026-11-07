# Inventario — Fisica 1 (sito originale «Orale Trainer»)

Sorgente: `legacy/fisica-1/` (repository `orale-fisica-1-ingegneria-elettronica`). Il sito era un unico
`index.html` (~300 KB) con MathJax da CDN, dati e logica in JavaScript inline, stato in `localStorage`.

## Dati

| Dato nell'originale | Contenuto | Destinazione nel sito nuovo |
|---|---|---|
| `CONTENUTI` (33 oggetti) | id 1–33, `titolo`, `area` A–D, `prerequisiti` | `topics/fisica-1/NN-<id>.yaml` (titolo, ordine, gruppo = nome dell'area; id kebab-case fissati in `tools/legacy-topics/fisica-1.mjs`); prerequisiti come link in testa alla teoria |
| `intuizioneFisica` | «L'idea in sintesi» | strato `intuizione` della teoria; `summary` dell'argomento (prima frase) |
| `definizioni` | testo | strato `formalismo` → «Definizioni»; flashcard `definizione` |
| `derivazione[]` | passo, formula, commento | strato `formalismo` → «Derivazione passo per passo», un `<details>` per passo (passaggi rivelabili, aperti in stampa) |
| `ipotesi`, `casiLimite` | testo | strato `formalismo`; flashcard `concetto` |
| `erroriTipici[]` | elenco | strato `errori`; flashcard `concetto` |
| `checklistOrale[]` | scaletta dell'orale | **obiettivi** dell'argomento (`<id>.<n>`); scaletta della simulazione dell'orale e risposta modello della carta «Esponi…» |
| `domandeApprofondimento[]` | domande, a volte con risposta tra parentesi | flashcard `orale` con risposta modello (scritta per le 61 domande che non l'avevano; ampliata per le altre); elenco «Verso l'orale» nella teoria |
| `formuleChiave[]` | 131 formule | collection `formulas` (`<id>-fN`), etichette scritte per ogni formula, `latexEn` dove la formula contiene parole italiane; `<Formula>` nella teoria |
| `AREE` | 4 aree | gruppi degli argomenti (IT/EN) |

## Viste e funzioni

| Vista / funzione | Destinazione | Note |
|---|---|---|
| Oggi (dashboard, countdown, anelli per area, piano del giorno) | `progressi/` (motore comune: data d'esame, piano di studio, mappa di padronanza) e home | il piano «peso doppio su aree C e D, ultimi 2 giorni di ripasso» è sostituito dal piano del motore comune, che usa la padronanza reale |
| Argomenti (lista + scheda a schermo intero) | `teoria/` e `teoria/<topic>/` | |
| Simula (orale, facile/difficile, timer, checklist, voto 0–3) | `extra/simulazione-orale/` (isola `OraleTrainer`) | estrazione pesata verso argomenti mai esposti o deboli; storico in `sh:v1:fisica-1:orale` |
| Quiz (formula → argomento, argomento → formula, riconosci l'errore, flashcard a voce) | `ripasso/` (flashcard FSRS) | **eliminato come doppione**: i quiz erano generati al volo dagli stessi campi che ora sono flashcard (formule, errori, definizioni) con ripasso spaziato vero |
| Teoria (quiz concettuale a tre difficoltà) | `ripasso/` | **eliminato come doppione** per lo stesso motivo (riconoscere l'argomento da intuizione/definizione = flashcard `concetto`/`definizione`) |
| Flashcard (mazzo per argomento, mazzo misto, carta 3D) | `ripasso/` | mazzo per argomento = filtro del ripasso; animazione 3D non riprodotta |
| Dimostrazioni (passo per passo, barra di avanzamento) | strato `formalismo` di ogni pagina di teoria | passaggi in `<details>`: stessa funzione, senza JavaScript |
| Mini-quiz nella scheda | `esercizi/<topic>/` + ripasso | |
| Formulario stampabile | `formulario/` (+ stampa) | |
| Ripasso spaziato SM-2 semplificato | FSRS del motore comune | stati 0–3 migrati come storico dell'orale |
| 8 simulazioni canvas | `extra/simulazioni/` (kit `src/sim`) | moto armonico, pendolo esatto vs armonico, smorzato, risonanza, gara sul piano inclinato, rotolamento, urti, Carnot. L'originale ne ha **8** (non 7: anche gli urti) |
| Tema HUD sci-fi, aurora animata | design system comune | eliminato (identità grafica unica del sito) |
| Note legali, privacy, 404, COMPLIANCE | pagine globali | |

## Nuovo (decisione: corso «scritto + orale»)

- 66 esercizi da scritto originali (2 per argomento) con soluzione a passi e risposte verificate
  (`tests/unit/fisica-1/static-answers.test.ts` ricalcola ogni valore); il primo di ogni argomento è anche
  l'esempio svolto della teoria (i primi 4 argomenti hanno un esempio dedicato).
- 27 generatori parametrici (`src/courses/fisica-1/generators/`), verificati su 200 semi con integrazione
  numerica delle equazioni del moto o bilanci indipendenti (`tests/unit/fisica-1/generators.test.ts`).
- Prova simulata: 3 problemi + 2 domande d'orale, 120 minuti (struttura scelta dal sito).

## localStorage

| Chiave legacy | Contenuto | Migrazione (`src/courses/fisica-1/migrations.ts`) |
|---|---|---|
| `fisica1-orale-v1` | `argomenti{id: stato, ef, intervallo, prossimoRipasso, ultimaRevisione}` | stato > 0 → `fisica-1:progress.read`; voto → storico `fisica-1:orale` |
| | `dataEsame` | `global:examDates['fisica-1']` (non sovrascrive) |
| | `modalitaSim` | `fisica-1:orale.mode` |
| | `simulazioni`, `quizPref`, `teoriaPref`, `quizStat`, `teoriaStat` | non migrati (nessun corrispondente: conteggi giornalieri e preferenze di viste eliminate) |

La chiave legacy non viene mai modificata né cancellata.
