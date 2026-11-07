# Inventario — Fondamenti di Informatica (ex AE·FIN)

Sito originale: repo `fondamenti-di-informatica-AEFIN` (Preact + Vite + Tailwind, router a hash,
PWA). Copiato in `legacy/fondamenti-informatica/` ed escluso dalla build.
Nome nel sito nuovo: **Fondamenti di Informatica**, sottotitolo *Architettura degli elaboratori*
(«AE·FIN» compare solo come richiamo nella Panoramica).

## 1. Viste (router `#/<vista>`) → destinazione

| Vista legacy | Cosa fa | Destinazione |
|---|---|---|
| `#/dash` Dashboard | calcolatore di preparazione (data appello → ritmo), ciambelle avanzamento, statistiche prove, «Perché la prova è fatta così», «Riprendi da dove eri», avviso indipendenza | **Panoramica** (`/`: cos'è il corso, struttura della prova, come usare il sito, mappa argomenti) + **progressi/** (preparazione, piano fino alla data d'esame). Il testo «Perché la prova è fatta così» va nella Panoramica e in `esame/`. |
| `#/carriera` Carriera | spunta «studiato» per modulo, barra, minuti residui, data di completamento | **progressi/** (mappa argomento → obiettivi). **Doppione** della mastery condivisa: la spunta diventa il segno «argomento studiato» del motore comune. |
| `#/study` e `#/study/<id>` Studia | 17 moduli in 6 gruppi; per modulo: «Da dove si parte», «In due minuti», indice, teoria, esempio svolto, errori tipici, schemi collegati, 3 autoverifiche, 5 esercizi svolti | **teoria/** + **teoria/<topic>/** (MDX a strati: intuizione = «Da dove si parte», formalismo = sezioni centrali, esempio = «Esempio svolto», errori = «Errori tipici»; «In due minuti» = riquadro iniziale). Autoverifiche → **ripasso/** (card `concetto`). Esercizi svolti → **esercizi/<topic>/**. |
| `#/def` Definizioni | 64 termini (frase breve + dettaglio), filtro testo/argomento | **ripasso/** (card `definizione`) + glossario. La vista a sé è un **doppione** delle flashcard con filtro. |
| `#/exam` Simulatore | 4 formati di prova generati (completo 12 quesiti/30 punti/60 min, quiz lampo, drill CP2, drill reti), correzione automatica + autovalutazione, storico | **esame/** (simulazione con timer). I drill «binario» e «reti» diventano esercizi generati in **esercizi/** (stessi generatori). |
| `#/train` Allenamento | 4 palestre: binario a mano (CP2 e somma con flag), schemi da completare, verità e Karnaugh, assembly a mente; convertitori in fondo | Palestre → esercizi **generati** a passi in **esercizi/<topic>/**; schemi da completare → esercizio interattivo (DiagramQuiz) in **esercizi/**; convertitori → **extra/convertitori**. |
| `#/ref` Schemi & convenzioni | 45 schemi per area, convenzioni di notazione (5), bibliografia (6 libri) | Schemi → figure nella **teoria/<topic>/** del loro argomento + esercizio «completa lo schema»; convenzioni → `Callout` nella teoria del modulo collegato (`trapIds`); bibliografia → Panoramica («Per approfondire»). |
| `#/note` Note & privacy | indipendenza, cosa si salva, provenienza contenuti, rimozione, segnalazioni | **Eliminata**: privacy/note legali/segnala errore sono pagine globali del sito (PR2). L'avviso «verifica sulle pagine ufficiali del tuo corso» resta nella Panoramica. |
| 404 | pagina 404 vera | 404 globale del sito. |

## 2. Funzioni e componenti

| Legacy | Destinazione |
|---|---|
| `engine/generators/*` (17 generatori: mc, cp2, arith, hex, maxRange, gate, asmSnippet, karnaugh, asmWrite, open, diagramLabel, truthToExpr, rtn, ieee754, pageTranslate, cacheFields, pipelineCycles) | `src/courses/fondamenti-informatica/generators/` registrati con `registerGenerator`, bilingui, deterministici. `mc`, `open`, `asmWrite` pescavano dalle banche: le banche diventano contenuto (quiz/card/esercizi) e la simulazione d'esame le pesca dal motore comune. |
| `engine/drills.ts` (cp2Drill, sumDrill, loopDrill, mulCmpDrill, shiftDrill) | generatori a passi (`cp2-a-mano`, `somma-con-flag`, `assembly-ciclo`, `assembly-mul-cmp`, `assembly-shift`). |
| `engine/boolean.ts` (minimizzatore esatto), `parseSop.ts`, `numeric.ts`, `ieee754.ts`, `asmSim.ts`, `rng.ts` | `src/courses/fondamenti-informatica/lib/` (logica invariata, test portati). |
| `engine/grade.ts` (correzione mc/fill/diagram/expr con credito parziale) | correzione del motore comune; il confronto di espressioni (`judgeSop`) resta nel corso per gli esercizi «tabella → espressione». |
| `engine/buildExam.ts` (blueprint della prova completa) | `exam.structure` nel YAML del corso + blueprint dei generatori per `esame/`. |
| `engine/readiness.ts` (prontezza 45/30/25, ritmo) | **Doppione** di progressi/ (mastery e piano fino alla data d'esame del motore comune). Logica non riportata; i pesi sono annotati in revisione. |
| `ui/components/Converters.tsx` | `extra/convertitori` (convertitore CP2, sommatore con flag, range). |
| `asmSim` + listati | `extra/simulatore-assembly` (esecuzione passo-passo dei tre programmi tipo, con registri e flag). |
| `ui/components/DatapathHero.tsx` | **Eliminato**: era una decorazione animata della home (piste con segnali), non un datapath interattivo; non aggiunge contenuto. Il datapath vero (schemi `processore-*`) resta come figura. |
| `TruthTable`, `DiagramFigure`, `DiagramQuiz`, `AsmBlock` | componenti del corso rifatti con i token (tema chiaro/scuro). |
| `Gauge`, `Preparation`, `Career`, `Dashboard` | sostituiti dai componenti condivisi di progressi/. |
| PWA (vite-plugin-pwa), font Geist locali | PWA e font sono globali (PR2/PR9). |

## 3. Dati

| File | Quantità | Destinazione |
|---|---|---|
| `content/topics/*.ts` | 17 moduli (titolo, blurb, summary, body HTML, checks, exercises, trapIds, prereq, diagramIds) | topics YAML + theory MDX + exercises + cards |
| esercizi svolti nei moduli | 85 (5 per modulo, `base`/`esame`) | `exercises/<topic>.yaml`, `origin: originale`, difficoltà base=1, esame=2 (o 3 se multi-passo) |
| autoverifiche (`checks`) | 51 | card `concetto` |
| `mcq.ts` | 125 crocette | quiz (scelta multipla) di ripasso/ |
| `open.ts` | 27 domande aperte con risposta modello | card `orale` |
| `asmWrite.ts` | 2 esercizi «scrivi un programma» | esercizi statici di `risc-cisc-assembly` |
| `definitions.ts` | 64 definizioni | card `definizione` + glossario |
| `diagrams.ts` | 45 schemi SVG originali con slot ed etichette distrattrici | `src/courses/fondamenti-informatica/diagrams/` (figure + esercizio «completa lo schema») |
| `traps.ts` | 5 convenzioni di notazione | `Callout` nella teoria |
| `links.ts` | 6 libri | Panoramica |
| date d'appello | **assenti** nell'originale (l'utente inseriva la propria data) | nessun `examDates`; resta l'inserimento della data in progressi/. |

## 4. localStorage

| Chiave | Contenuto | Migrazione |
|---|---|---|
| `aefin.v1` | `{version:1|2, exams[], visited[], done{topicId:ts}, bank{id:{right,wrong}}, examDate?}` | `migrate.ts`: `done` → argomenti studiati, `visited` → argomenti aperti, `examDate` → data d'esame, `exams` → storico simulazioni, `bank` → esiti per voce (id legacy → id nuovi). Gli id brevi (`bin`…) passano per la stessa tabella di `tools/legacy-topics`. La chiave legacy **non si cancella**. |
| `__aefin_probe__` | sonda temporanea (scritta e rimossa subito) | nessuna |

## 5. Eliminati (doppioni o inutili)

- **Note & privacy** come vista del corso: coperte dalle pagine globali.
- **Carriera** separata da Dashboard: due viste sullo stesso dato (moduli studiati) → un'unica progressi/.
- **Definizioni** come vista: stesso contenuto delle flashcard.
- **Readiness** del corso: sostituita dalla mastery condivisa.
- **DatapathHero**: solo decorazione.
- **Modalità «quiz lampo»**: sottoinsieme dei quiz di ripasso con correzione automatica; resta la simulazione completa e il ripasso spaziato.
- File di skill/agent (`.agents/`, `.claude/`, `skills-lock.json`) e configurazioni Vercel/Vite: strumenti di sviluppo, non contenuto.
