## In breve

- Nessun account, nessun cookie, nessuna statistica di traffico, nessun tracker, nessuna pubblicità.
- Preferenze e progressi restano **solo nel tuo browser** (`localStorage`) e non vengono inviati a nessuno.
- Il modulo **Contribuisci** è un Google Form esterno: ciò che scrivi arriva al titolare solo se lo invii; puoi chiederne la cancellazione in qualsiasi momento.

## Titolare

Valerio Colapinto, a titolo personale e non commerciale. Per qualsiasi richiesta sui dati scrivi all'indirizzo email indicato in fondo alla pagina.

## Dati salvati nel tuo browser

Il sito salva in `localStorage`, sul tuo dispositivo, alcune informazioni che servono a farlo funzionare. Tutte le chiavi iniziano con `sh:v1:`:

| Chiave | Contenuto |
|---|---|
| `sh:v1:global:theme` | tema scelto (chiaro o scuro), se lo cambi |
| `sh:v1:global:lang` | lingua scelta (italiano o inglese), se la cambi |
| `sh:v1:global:examDates` | date d'esame che inserisci tu |
| `sh:v1:<corso>:progress` | argomenti studiati ed esercizi svolti |
| `sh:v1:<corso>:srs` | stato del ripasso spaziato delle flashcard |
| `sh:v1:<corso>:exam` | simulazioni d'esame svolte e punteggi |
| `sh:v1:<corso>:notes`, `…:settings` | appunti e impostazioni del corso |

Al primo accesso il sito può copiare nelle nuove chiavi i progressi salvati dai siti di studio precedenti (stessa origine `github.io`), senza cancellare quelli originali.

Questi dati non lasciano il tuo dispositivo. Dalla pagina **Progressi** di ogni corso puoi **esportarli** in un file JSON, reimportarli su un altro dispositivo o cancellarli; puoi anche eliminarli in qualsiasi momento cancellando i dati del sito dalle impostazioni del browser.

## Modulo «Contribuisci»

La pagina Contribuisci contiene solo un **link a un modulo Google Forms**, che si apre in una nuova scheda: il sito non invia nulla a Google e non carica risorse di Google. Nel modulo ti vengono chiesti il tipo di contributo, il corso e l'argomento, il testo, la fonte e, **solo se vuoi**, il nome con cui essere citato o citata.

- **Dove finiscono.** Le risposte sono raccolte da **Google Forms** e salvate in un foglio Google sul **Google Drive** del titolare. Google (Google Ireland Ltd. / Google LLC) tratta i dati alle condizioni dei propri termini e dell'informativa policies.google.com/privacy (che si applica anche alla pagina del modulo); i dati possono essere trasferiti negli Stati Uniti con le garanzie previste da Google (clausole contrattuali tipo, EU-U.S. Data Privacy Framework). Se il modulo richiede l'accesso con un account Google, lo dice la pagina del modulo stessa.
- **Uso e conservazione.** Le risposte servono solo a correggere e migliorare il sito; non sono cedute a nessuno. Possono essere lette da un assistente di programmazione eseguito dal titolare, che le verifica sulla fonte indicata e prepara la modifica, sempre approvata a mano. Le righe vengono cancellate quando il contributo è chiuso (integrato o scartato), **al più tardi dopo 12 mesi**.
- **Pubblicazione.** Se il contributo viene integrato, il contenuto (anche rielaborato) è pubblicato nel sito e nel repository pubblico, con la **fonte** che hai indicato; il nome compare nella pagina **Ringraziamenti** e nel file `src/content/credits.yaml` del repository **solo se lo hai chiesto**. Puoi chiedere in ogni momento di toglierlo.
- **Base giuridica.** Il tuo consenso, dato inviando il modulo (art. 6.1.a GDPR), revocabile in qualsiasi momento senza conseguenze sui trattamenti già svolti.
- **Cancellazione.** Per farti cancellare un contributo scrivi al titolare indicando data e contenuto dell'invio: la riga viene eliminata entro 30 giorni.

Se preferisci, puoi scrivere direttamente via email o aprire una segnalazione su GitHub (pubblica e soggetta all'informativa di GitHub).

## Uso offline

Il sito può essere installato come applicazione e funziona anche senza connessione: un *service worker* salva nella memoria del browser (Cache Storage) le pagine principali e, **solo se lo chiedi** con «Scarica per l'offline» nella panoramica di un corso, le pagine di quel corso. Sono copie delle pagine pubbliche del sito: nessun dato personale. Puoi rimuoverle dalla stessa pagina o cancellando i dati del sito dal browser.

## Hosting

Il sito è ospitato su **GitHub Pages** (GitHub, Inc.): come qualsiasi server web, GitHub può registrare l'indirizzo IP dei visitatori per motivi di sicurezza (informativa: docs.github.com, «GitHub General Privacy Statement»). Font, formule e script sono serviti dallo stesso dominio: nessun'altra risorsa esterna viene caricata.

## I tuoi diritti

Chi gestisce il sito non conserva dati dei visitatori, salvo i contributi inviati con il modulo. Hai i diritti previsti dagli articoli 15–22 del Regolamento (UE) 2016/679 (accesso, rettifica, cancellazione, limitazione, opposizione, portabilità): per le segnalazioni scrivi al titolare, per i dati trattati dai fornitori indicati sopra rivolgiti a loro. Puoi presentare reclamo al Garante per la protezione dei dati personali.

## Modifiche

Se questa informativa cambia, la data di aggiornamento in alto viene modificata e le novità sono visibili nella cronologia del repository.
