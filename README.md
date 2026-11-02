# Teoria dei Circuiti — sito di studio (non ufficiale)

Sito statico **in italiano** per preparare l'esame di *Teoria dei Circuiti* (Ingegneria Elettronica L-8, Roma, 2º anno). Teoria completa con dimostrazioni, formulario, esercizi e prove d'esame **generati con numeri originali e verificati da un simulatore indipendente**, quiz con ripasso a intervalli, domande di teoria con correzione automatica, progresso, piano di studio.

> **Strumento di studio non ufficiale, non affiliato a Roma né al prof. [docente].**
> Il repository **non contiene** testi, figure, numeri, soluzioni o PDF del docente: esercizi e prove sono originali, ispirati alla struttura descritta nel sito. Le domande di teoria sono riformulate con parole nostre; gli appelli sono citati solo per data e argomento, con link ai siti ufficiali. Non ci sono link a download non autorizzati di libri.

## Cosa c'è
| Pagina | Contenuto |
|---|---|
| Home, Corso, Esame, Programma | dati ufficiali con badge di affidabilità; «cosa sappiamo e cosa no» sull'esame; 49 argomenti in 6 blocchi |
| Studio | una pagina per argomento: obiettivi, teoria, dimostrazioni, esempi originali, schemi SVG, errori tipici, cosa chiede l'esame, risorse, formulario collegato |
| Formulario | 160 voci con simboli, uso ed errore tipico; ricerca, filtri, segnalibri, drawer rapido (pulsante ƒ), stampa |
| Esercizi | «determinare v_out(t) per tutto l'asse dei tempi»: template A (nullore), B (doppio bipolo Z/Y + Thevenin/Norton), C (trasformatore ideale), livelli 1–3; modalità completo, guidato (8 passi), per passo; 12 domande applicate |
| Quiz | 271 domande originali; ripasso Leitner (1, 3, 7, 14, 30 giorni) |
| Teoria | 50 domande aperte con rubrica; correzione offline + (facoltativa) con AI |
| Prove | prova nel formato storico (30 + 3×10 + 3), timer 2h30, report, stampa/PDF |
| Archivio, Risorse, Appunti, Simulatori, Piano, Progresso, FAQ | vedi le pagine; Simulatori esporta netlist SPICE |

## Decisioni di progetto
- Solo versione pubblica; `sources-private/` è nel `.gitignore` e non va mai tracciata (`git ls-files | grep sources-private` deve essere vuoto).
- HTML + CSS + JavaScript vanilla a moduli ES, **nessun build** per il deploy; KaTeX da CDN (cdnjs) con fallback; PWA offline opzionale.
- Stile blu notte + ambra, tema chiaro/scuro; simboli circuitali ANSI/IEEE (resistore a zig-zag); mobile-first.
- Dati nel browser (localStorage / IndexedDB) con export/import JSON. Nessun account, nessun analytics, nessun tracker.
- **Correttezza prima di tutto:** i risultati numerici sono calcolati con aritmetica esatta (razionali su BigInt) e mai valutati da un LLM. Dove un dato non è pubblico il sito scrive «non pubblicato / DA VERIFICARE».
- Badge: `UFFICIALE`, `STORICO`, `EDITORE`, `NON UFFICIALE`, `INFERENZA`, `DA VERIFICARE`.

## Provarlo in locale
```bash
python3 -m http.server 8000          # poi apri http://localhost:8000
npm test                             # node --test: nessuna dipendenza (per il test KaTeX: npm i --no-save katex@0.16.9)
node tools/check-links/check.mjs     # link interni (--external controlla anche gli URL esterni)
```

## Deploy su GitHub Pages
1. Crea un repository pubblico (es. `teoria-circuiti-[docente]`), `git push` su `main`.
2. **Settings → Pages → Source: GitHub Actions.** Il workflow `.github/workflows/pages.yml` esegue `npm test` (anche sulle pull request) e poi pubblica la cartella escludendo `tests/`, `tools/` e i file privati.
3. Verifica che i link siano relativi (il test lo controlla), che `.nojekyll` esista e che la pagina `404.html` funzioni.
4. In alternativa: «Deploy from a branch» dalla radice.

## Aggiornare i dati (senza toccare l'HTML)
- **Appelli:** `data/appelli.json` (le date compaiono in Home, Corso e Piano). Controlla sempre Infostud, il catalogo Roma e il sito del docente.
- **Modalità d'esame confermate:** pagina `esame/index.html` e `data/syllabus.json` (campo `_fonte`); quando il docente risponde, sostituisci i badge `DA VERIFICARE`.
- **Risorse, archivio, errori tipici:** `data/risorse.json`, `data/archivio.json`, `data/errori.json`.
- **Teoria, formulario, quiz, domande aperte:** i sorgenti stanno in `tools/content/*.mjs`; rigenera i JSON con `node tools/build-content.mjs`. Dopo ogni modifica ai file del sito esegui anche `node tools/build-sw.mjs` per aggiornare l'elenco della cache offline (il test lo verifica).

## Correzione con AI (facoltativa)
Nelle **Impostazioni** scegli il provider (Anthropic o endpoint compatibile OpenAI), il modello (sempre modificabile) e incolla la tua chiave API personale.
- La chiave resta **solo nel tuo browser** (per la sola sessione, salvo la casella «ricorda»), **non entra mai nel repository né nell'export JSON**, ed è inviata solo al provider scelto. Pulsanti «Testa connessione» e «Cancella chiave».
- Costi, privacy e invio al provider della risposta e della rubrica sono dichiarati nella pagina.
- Il punteggio dell'AI è mostrato **accanto** a quello dello script offline e sei tu a scegliere quale registrare; in caso di errore, timeout, CORS o JSON non valido il sito ripiega sulla correzione offline.
- «Spiega il mio errore» (esercizi): l'AI riceve i passaggi corretti calcolati dal motore come verità di riferimento e non ricalcola.
- **`DA VERIFICARE`:** l'intestazione per le chiamate dirette dal browser (`anthropic-dangerous-direct-browser-access`) non compare nelle pagine ufficiali consultate (Messages, versioning, authentication). È un campo modificabile nelle Impostazioni.

## Backup dei progressi
**Impostazioni → Esporta JSON** scarica progresso, ripasso, storici e impostazioni (mai la chiave). **Importa JSON** mostra un'anteprima e chiede conferma prima di sovrascrivere. Gli appunti personali hanno un export separato nella pagina Appunti. Puoi azzerare ogni sezione separatamente.

## Come è fatto il motore degli esercizi
Ogni istanza è **una sola netlist** (`assets/js/solver/netlist.js`) letta da quattro moduli: il solutore esatto (analisi nodale modificata su razionali/complessi, `solver/mna.js`), il simulatore indipendente nel tempo in virgola mobile (`solver/simulator.js`, usato nei test e come controllo a runtime su ogni istanza), l'esportatore SPICE (`spice.js`) e il disegno SVG (`svg/render.js`, con controllo di coerenza schema ↔ netlist). L'istanza che non supera il controllo non viene mostrata. I test generano centinaia di istanze per template e livello e verificano anche il metodo di Laplace con generatori equivalenti.

## Struttura
```
index.html, corso/, esame/, programma/, studio/, formulario/, esercizi/, quiz/, teoria/, prova/,
archivio/, risorse/, appunti/, simulatori/, progresso/, piano/, faq/, impostazioni/
assets/css/style.css          assets/js/ (app, storage, ui, katex, progress, srs, exam, print, plan, notes, spice, …)
assets/js/solver/             rational/complex (in assets/js), mna, network, exercise, simulator
assets/js/templates/          template A, B, C        assets/js/svg/   simboli e rendering
assets/js/grader/             expr (parser sicuro), exercise, rubric, ai-adapter
data/                         syllabus, appelli, formulario, quiz, teoria, archivio, risorse, errori, studio/*.json
tools/                        build-content, build-sw, check-links/, list-da-verificare, content/ (sorgenti)
tests/                        node --test        sources-private/, tests/private/ (gitignored)
sw.js, manifest.webmanifest, 404.html, .nojekyll, .github/workflows/pages.yml
```

## Punti `DA VERIFICARE`
Elenco aggiornabile con `node tools/list-da-verificare.mjs`:
- durata, punteggi e soglie dell'esame attuale; forma dell'orale/discussione; calcolatrice o formulario ammessi; esoneri;
- codice insegnamento alternativo 10627678 nel piano 2026; orari esatti del corso (PDF dell'orario);
- formulazione esatta, data a lezione, della relazione tra le matrici A e B in forma a blocchi;
- definizione precisa di passività adottata dal docente; trattazione della continuità con elementi ideali incongruenti;
- intestazione HTTP per l'accesso diretto dal browser ai provider AI.

## Licenza e contributi
Il codice e i contenuti originali di questo repository sono stati scritti per questo progetto; la licenza va decisa dal committente prima della pubblicazione. Segnalazioni di errori nei contenuti sono benvenute: indica sempre la pagina e la formula.
