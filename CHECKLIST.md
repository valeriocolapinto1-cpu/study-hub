# Checklist — Sito di studio «Teoria dei Circuiti»

Legenda: `[ ]` da fare · `[x]` fatto. Ogni fase termina con un commit e con la verifica del suo criterio di accettazione. Se un criterio non è soddisfatto, ci si ferma con un riepilogo.

## Fase 0 — Decisioni e setup
- [x] Intervista al committente (stile grafico, simboli, modalità di lavoro, KaTeX/PWA)
- [x] Registrare le decisioni in `README.md` (sezione «Decisioni di progetto»)
- [x] `.gitignore` (inclusi `sources-private/`, `tests/private/`), `.nojekyll`, `404.html`
- [x] Cartella `sources-private/` vuota e non tracciata
- [x] Verifica: `git ls-files | grep sources-private` vuoto

## Fase 1 — Scheletro
- [x] Struttura cartelle (`/studio`, `/esercizi`, `/quiz`, `/prova`, `/archivio`, `/formulario`, `/risorse`, `/appunti`, `/simulatori`, `/progresso`, `/piano`, `/impostazioni`, `/faq`)
- [x] Navigazione comune: menu mobile, ricerca globale, drawer formulario, indicatore di progresso
- [x] Tema chiaro/scuro con toggle salvato, contrasto WCAG AA, navigazione da tastiera
- [x] `data/syllabus.json` (≥ 45 argomenti foglia, 6 blocchi, prerequisiti, pesi)
- [x] `assets/js/storage.js`: chiavi con namespace, versione schema, migrazioni, fallback in memoria, `try/catch`
- [x] Export/import JSON con anteprima e conferma; azzeramento per sezione
- [x] Pagina Programma (con «Fuori programma»: trifase, circuiti magnetici, macchine elettriche)
- [x] Pagine Corso e professore, Modalità d'esame («cosa sappiamo e cosa no»), badge di affidabilità
- [x] `data/appelli.json` + riquadro prossima scadenza nella Home
- [x] Home (3 azioni, scadenza, progresso, «Ripasso di oggi»)
- [x] **Criterio:** export/import ok, tema salvato, nessun errore in console

## Fase 2 — Studio blocchi I–II e Formulario
- [x] Template pagina di studio (10 sezioni fisse, KaTeX, dimostrazioni comprimibili, «Segna come studiato»)
- [x] Blocco I: pagine foglia complete (modellamento, porta/bipolo, proprietà, costitutive, energia, 2-porte, nullore)
- [x] Blocco II: pagine foglia complete (topologia, A/B, Tellegen, nodi/maglie, serie/parallelo, partitori)
- [x] Dimostrazioni: Tellegen e ortogonalità v–i; relazione A/B in forma a blocchi [DA VERIFICARE]
- [x] Esempi svolti originali (3 per blocco) e schemi SVG
- [x] `data/formulario.json` avviato (46 voci; arriva a 150 nella fase 7); pagina Formulario con ricerca, filtri, segnalibri
- [x] Drawer rapido del formulario su ogni pagina
- [x] **Criterio:** pagine dei due blocchi complete, formule compilano in KaTeX

## Fase 3 — Motore degli esercizi
- [x] `rational.js` (BigInt) e `complex.js` (complessi razionali)
- [x] Netlist interna unica (solutore, passi, SPICE, SVG leggono la stessa struttura)
- [x] Solutore MNA esatto (continua e fasori; generatori, R/L/C, trasformatore, nullore, 2-porte Z/Y)
- [x] Thevenin/Norton con generatore di prova
- [x] Risposta per t<0 e t>0 (metodo Laplace con generatori equivalenti)
- [x] Generatore di istanze con seed e vincoli di «bellezza»
- [x] Simulatore indipendente (transitorio numerico + AC) e controllo a runtime
- [x] Libreria simboli SVG + layout a griglia, template A (nullore)
- [x] Test: aritmetica, casi a mano originali, doppia verifica su centinaia di istanze
- [x] **Criterio:** doppia verifica verde

## Fase 4 — Template B e C, AC/misto, parser, modalità
- [x] Template B (2-porte Z/Y + Thevenin/Norton, anche con generatore controllato)
- [x] Template C (trasformatore ideale)
- [x] Ingressi continua, sinusoidale, misto (sovrapposizione nel tempo)
- [x] Livelli 1–3
- [x] Parser sicuro delle risposte (senza `eval`), verifica t<0 e t>0
- [x] Modalità: completo, guidato (8 passi), per passo, mostra soluzione, varianti con seed
- [x] Domande applicate (Thevenin, max trasferimento, fc, risonanza, stabilità, Z/Y, rifasamento, P/Q/S, Laplace a tratti, op-amp, topologia)
- [x] **Criterio:** tutte le combinazioni generano istanze valide e verificate

## Fase 5 — Quiz, ripasso, teoria, correzione
- [ ] `quiz.json` (≥ 200 domande originali) e pagina Quiz (blocco, argomento, mista, solo errori)
- [ ] `srs.js` (Leitner 5 scatole o SM-2) e «Ripasso di oggi» in Home; scadenze nell'export
- [ ] `teoria.json` (≥ 50 domande aperte con rubrica, copertura righe §5.1, ≥ 3 risposte campione ciascuna)
- [ ] `rubric.js` (normalizzazione, stemming, criteri, confidenza, conferma utente)
- [ ] `ai-adapter.js` (Anthropic + OpenAI-compatibile, modello modificabile, header accesso diretto verificato in documentazione, gestione CORS)
- [ ] Impostazioni: chiave API (localStorage/sessionStorage), testa, cancella, avvisi privacy/costi
- [ ] Output JSON validato, fallback offline, confronto affiancato, cache, «Spiega il mio errore»
- [ ] **Criterio:** calibrazione verde; AI disattivata senza chiave e fallback offline su errore

## Fase 6 — Prove d'esame
- [ ] Generatore prova (esercizio 30 + 3 domande × 10 + opzionale 3), blocchi III–VI bilanciati, seed visibile
- [ ] Timer 2h30 configurabile, avvisi 15/5 min, ripresa dopo ricarica
- [ ] Interfaccia risposte, consegna, correzione, report, aggiornamento progresso e ripasso
- [ ] Stampa/PDF prova (intestazione COGNOME/NOME/MATRICOLA) e soluzione separate
- [ ] Stima in trentesimi proporzionale con avviso
- [ ] **Criterio:** una prova si genera, si svolge, si corregge e aggiorna il progresso

## Fase 7 — Contenuti blocchi III–VI e funzioni restanti
- [ ] Studio blocchi III, IV, V, VI (incl. nullore/op-amp §6), tutte le dimostrazioni di §5.2 (≥ 12)
- [ ] Pagina Errori tipici (§4.3) con esempi sbagliato vs corretto
- [ ] Formulario ≥ 150 voci, stampa max 4 pagine A4 + «solo preferiti»
- [ ] Archivio prove (`archivio.json`, solo data/argomento/tipo)
- [ ] Risorse (`risorse.json`, `libri.json`), mappa argomenti, sezione materiali a pagamento
- [ ] Appunti personali (Markdown+LaTeX, IndexedDB, ricerca, export/import, sanificazione)
- [ ] Simulatori: guide CircuitJS/LTspice, export netlist SPICE con approssimazioni dichiarate
- [ ] Piano di studio (pesi, riordino, `.ics`, stampa)
- [ ] Progresso completo (metriche, barre, heatmap, andamento prove, «cosa studiare ora»)
- [ ] Pagina FAQ e Domande al docente (copiabile)
- [ ] **Criterio:** quantità minime del §13 soddisfatte

## Fase 8 — Rifinitura e deploy
- [ ] Accessibilità (contrasto, tab, testo alternativo SVG), mobile (44 px, no scroll orizzontale)
- [ ] Performance (lazy load, worker se serve), CSP, nessun analytics
- [ ] PWA/service worker (opzionale, non deve rompere il deploy)
- [ ] `tools/check-links`
- [ ] Test JSON (schema, id univoci, link interni, KaTeX), storage (round-trip, migrazione, senza localStorage)
- [ ] `README.md` completo (non affiliazione, deploy, aggiornamento JSON, chiave AI, backup)
- [ ] `.github/workflows/pages.yml` con `node --test` prima del deploy
- [ ] Deploy riuscito e CI verde
- [ ] Riepilogo finale: albero progetto, test passati, punti `DA VERIFICARE`

## Controlli trasversali (a ogni fase)
- [ ] Nessun contenuto, figura o numero del professore nel repo
- [ ] Nessuna chiave/token/dato personale nel repo
- [ ] Badge di affidabilità su ogni dato non banale
- [ ] Link tutti relativi
- [ ] Commit a fine fase
