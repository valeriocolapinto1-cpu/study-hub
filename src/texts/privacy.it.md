## In breve

- Nessun account, nessun cookie, nessuna statistica di traffico, nessun tracker, nessuna pubblicità.
- Preferenze e progressi restano **solo nel tuo browser** (`localStorage`) e non vengono inviati a nessuno.
- Il modulo **Contribuisci** invia al gestore solo ciò che scrivi tu, quando decidi di inviarlo.

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

Se usi il modulo per segnalare un errore o proporre un contenuto, vengono inviati: il testo che scrivi, la pagina e il corso a cui si riferisce, il tipo di segnalazione e, **solo se li inserisci**, un nome (per i ringraziamenti) e un indirizzo email (per una risposta).

- L'invio passa da uno script **Google Apps Script** del gestore e i dati vengono salvati in un foglio sul suo **Google Drive** (Google Ireland Ltd. / Google LLC, informativa: policies.google.com/privacy). Sono usati solo per correggere il sito e rispondere, non sono ceduti a nessuno e vengono cancellati quando la segnalazione è chiusa, al più tardi dopo 12 mesi.
- Per bloccare lo spam il modulo usa **Cloudflare Turnstile** (Cloudflare, Inc., informativa: cloudflare.com/privacypolicy). Turnstile viene caricato solo nella pagina Contribuisci e può elaborare l'indirizzo IP e alcune caratteristiche del browser per distinguere le persone dai programmi automatici; non imposta cookie di profilazione.
- Base giuridica: il tuo consenso, espresso inviando il modulo (art. 6.1.a GDPR). Puoi chiedere in ogni momento la cancellazione di una segnalazione.

Se preferisci, puoi scrivere direttamente via email o aprire una segnalazione su GitHub (soggetta all'informativa di GitHub).

## Hosting

Il sito è ospitato su **GitHub Pages** (GitHub, Inc.): come qualsiasi server web, GitHub può registrare l'indirizzo IP dei visitatori per motivi di sicurezza (informativa: docs.github.com, «GitHub General Privacy Statement»). Font, formule e script sono serviti dallo stesso dominio: nessun'altra risorsa esterna viene caricata, salvo Turnstile nella pagina Contribuisci.

## I tuoi diritti

Chi gestisce il sito non conserva dati dei visitatori, salvo le segnalazioni inviate con il modulo. Hai i diritti previsti dagli articoli 15–22 del Regolamento (UE) 2016/679 (accesso, rettifica, cancellazione, limitazione, opposizione, portabilità): per le segnalazioni scrivi al titolare, per i dati trattati dai fornitori indicati sopra rivolgiti a loro. Puoi presentare reclamo al Garante per la protezione dei dati personali.

## Modifiche

Se questa informativa cambia, la data di aggiornamento in alto viene modificata e le novità sono visibili nella cronologia del repository.
