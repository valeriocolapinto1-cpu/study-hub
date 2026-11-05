## In breve

- Nessun account, nessun cookie, nessuna statistica di traffico, nessun tracker, nessuna pubblicità.
- Preferenze e progressi restano **solo nel tuo browser** (`localStorage`) e non vengono inviati a nessuno.
- Il modulo **Contribuisci** invia al titolare solo ciò che scrivi tu, quando decidi di inviarlo; puoi chiederne la cancellazione in qualsiasi momento.

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

Se usi il modulo per segnalare un errore, proporre un miglioramento o inviare appunti, vengono inviati: il tipo di contributo, il corso e la pagina a cui si riferisce, il testo che scrivi, le tre dichiarazioni (privacy, diritti sul materiale, pubblicazione), la lingua della pagina e, **solo se li inserisci**, gli allegati, un nome (per i ringraziamenti) e un indirizzo email (per una risposta).

- **Dove finiscono.** L'invio passa da uno script **Google Apps Script** del titolare: una riga in un foglio Google, gli allegati in una cartella dedicata sul suo **Google Drive** e un'email di notifica nella sua casella Gmail. Google (Google Ireland Ltd. / Google LLC) agisce come **responsabile del trattamento** per conto del titolare, alle condizioni dei termini di Google Workspace e dell'informativa policies.google.com/privacy; i dati possono essere trasferiti negli Stati Uniti con le garanzie previste da Google (clausole contrattuali tipo, EU-U.S. Data Privacy Framework).
- **Anti-spam.** Il modulo usa **Cloudflare Turnstile** (Cloudflare, Inc., informativa cloudflare.com/privacypolicy), caricato **solo quando inizi a compilare il modulo**: può elaborare l'indirizzo IP e alcune caratteristiche del browser per distinguere le persone dai programmi automatici e non imposta cookie di profilazione. Il risultato della verifica viene controllato dallo script e non conservato. Per limitare gli invii ripetuti lo script tiene per un'ora, in forma cifrata con hash (SHA-256), l'indirizzo email e un identificativo casuale del browser (chiave `sh:v1:global:contribClient` in `localStorage`, generata al primo invio); dopo un'ora vengono cancellati da soli.
- **Uso e conservazione.** I dati servono solo a correggere e migliorare il sito e a risponderti; non sono ceduti a nessuno. Il testo e gli allegati possono essere letti da un processo automatico (un assistente di programmazione eseguito dal titolare) che prepara la proposta di modifica, sempre approvata a mano. Le righe e gli allegati vengono cancellati quando il contributo è chiuso (integrato o scartato), **al più tardi dopo 12 mesi**; l'email non viene mai pubblicata.
- **Pubblicazione.** Se il contributo viene integrato, il contenuto (anche rielaborato) è pubblicato nel sito e nel repository pubblico; il nome che hai indicato compare nella pagina **Ringraziamenti** e nel file `src/content/credits.yaml` del repository. Puoi chiedere in ogni momento di toglierlo.
- **Base giuridica.** Il tuo consenso, espresso con la casella dedicata (art. 6.1.a GDPR), revocabile in qualsiasi momento senza conseguenze sui trattamenti già svolti.
- **Cancellazione.** Per farti cancellare un contributo scrivi al titolare indicando il **codice del contributo** mostrato dopo l'invio (oppure data e indirizzo email usati): riga, allegati ed email di notifica vengono eliminati entro 30 giorni.

Se preferisci, puoi scrivere direttamente via email o aprire una segnalazione su GitHub (pubblica e soggetta all'informativa di GitHub).

## Uso offline

Il sito può essere installato come applicazione e funziona anche senza connessione: un *service worker* salva nella memoria del browser (Cache Storage) le pagine principali e, **solo se lo chiedi** con «Scarica per l'offline» nella panoramica di un corso, le pagine di quel corso. Sono copie delle pagine pubbliche del sito: nessun dato personale. Puoi rimuoverle dalla stessa pagina o cancellando i dati del sito dal browser.

## Hosting

Il sito è ospitato su **GitHub Pages** (GitHub, Inc.): come qualsiasi server web, GitHub può registrare l'indirizzo IP dei visitatori per motivi di sicurezza (informativa: docs.github.com, «GitHub General Privacy Statement»). Font, formule e script sono serviti dallo stesso dominio: nessun'altra risorsa esterna viene caricata, salvo Turnstile quando compili il modulo Contribuisci.

## I tuoi diritti

Chi gestisce il sito non conserva dati dei visitatori, salvo le segnalazioni inviate con il modulo. Hai i diritti previsti dagli articoli 15–22 del Regolamento (UE) 2016/679 (accesso, rettifica, cancellazione, limitazione, opposizione, portabilità): per le segnalazioni scrivi al titolare, per i dati trattati dai fornitori indicati sopra rivolgiti a loro. Puoi presentare reclamo al Garante per la protezione dei dati personali.

## Modifiche

Se questa informativa cambia, la data di aggiornamento in alto viene modificata e le novità sono visibili nella cronologia del repository.
