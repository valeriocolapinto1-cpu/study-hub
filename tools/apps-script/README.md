# Backend del modulo Contribuisci (Google Apps Script)

Script che riceve i contributi inviati da `/<lingua>/contribuisci/`: li verifica (Cloudflare Turnstile,
validazione, limiti di frequenza), salva una riga in un Google Sheet, salva gli allegati su Google Drive e
ti avvisa via email. Flusso completo e processo di integrazione: [`docs/CONTRIBUTI.md`](../../docs/CONTRIBUTI.md).

| File | Contenuto |
|---|---|
| `Code.gs` | web app (`doPost`, `doGet`), servizi Google, manutenzione: `inizializza()`, `verificaConfigurazione()`, `pulizia()`, `installaPulizia()` |
| `Logic.gs` | logica pura (validazione, limiti, formattazione), testata con vitest (`tests/unit/apps-script/`) |
| `appsscript.json` | manifest: runtime V8, fuso orario, permessi minimi, impostazioni della web app |
| `push.mjs`, `.clasp.json.example`, `.claspignore` | pubblicazione dal repository con `npm run script:push` (clasp) |

**Permessi** (`oauthScopes` del manifest, elencati esplicitamente perché Google non ne aggiunga altri):

| Ambito | Perché |
|---|---|
| `spreadsheets` | scrivere le righe nel foglio dei contributi |
| `drive` | cartella degli allegati e upload ripristinabile; `DriveApp` non funziona con il solo `drive.file` |
| `script.external_request` | verifica Turnstile e upload ripristinabile di Drive (`UrlFetchApp`) |
| `script.send_mail` | email di notifica (solo invio, nessun accesso alla posta) |
| `script.scriptapp` | attivatore orario di `pulizia()` |
| `userinfo.email` | destinatario predefinito delle notifiche (il tuo indirizzo) |

Finché lo script non è pubblicato il modulo funziona comunque: prepara un'email precompilata.

## Messa in funzione (una volta, circa 15 minuti)

### 1. Chiavi di Cloudflare Turnstile

1. Accedi (o registrati gratis) su <https://dash.cloudflare.com> → **Turnstile** → **Add widget**.
2. Nome: `study-hub`; **Hostname**: `valeriocolapinto1-cpu.github.io` (aggiungi anche `localhost` se vuoi provare in locale);
   **Widget mode**: *Managed*. Crea.
3. Copia la **Site Key** (pubblica) e la **Secret Key** (segreta: non va mai nel repository).

### 2. Progetto Apps Script

Due strade: copiare i file a mano (sotto) oppure, se hai Node, usare `npm run script:push` (vedi
[«Aggiornare lo script»](#aggiornare-lo-script)) dopo aver creato il progetto vuoto al punto 1.

1. Vai su <https://script.google.com> con l'account Google che deve ricevere i contributi → **Nuovo progetto**.
   Rinominalo `study-hub-contributi`.
2. **Impostazioni progetto** (ingranaggio) → spunta **Mostra il file manifest "appsscript.json" nell'editor**.
3. Nell'editor:
   - sostituisci il contenuto di `Codice.gs` con quello di [`Code.gs`](Code.gs) (puoi rinominare il file in `Code`);
   - **+** → **Script** → `Logic` e incolla [`Logic.gs`](Logic.gs);
   - apri `appsscript.json` e sostituiscilo con [`appsscript.json`](appsscript.json).
   - Salva (Ctrl+S).

### 3. Cartella Drive, foglio e proprietà

1. Nell'editor scegli la funzione **`inizializza`** nel menu in alto e premi **Esegui**.
   Google chiede i permessi (Drive, Fogli, email, richieste esterne, attivatori): **Rivedi autorizzazioni** → scegli
   l'account → *Avanzate* → *Vai a study-hub-contributi (non sicuro)* → **Consenti**.
   È normale: lo script è tuo e non è verificato da Google.
2. `inizializza` crea su Drive la cartella **`study-hub-contributi`** e, al suo interno, il foglio
   **`study-hub-contributi`** con le intestazioni; salva gli ID nelle proprietà dello script e crea
   l'attivatore orario di **`pulizia`** (visibile in **Attivatori**, icona della sveglia).
   (Se preferisci crearli a mano: crea cartella e foglio, poi metti gli ID nelle proprietà `DRIVE_FOLDER_ID`
   e `SHEET_ID`; l'ID è la parte dell'indirizzo dopo `/folders/` o `/d/`.)
3. **Impostazioni progetto** → **Proprietà script** → **Aggiungi proprietà script**:
   - `TURNSTILE_SECRET` = la Secret Key di Turnstile (obbligatoria);
   - facoltative: `NOTIFY_EMAIL` (destinatario delle notifiche; predefinito: il tuo account),
     `ALLOWED_HOSTNAMES` (predefinito: `valeriocolapinto1-cpu.github.io,localhost,127.0.0.1`).
4. Esegui **`verificaConfigurazione`** e controlla nel **Registro di esecuzione** che nulla sia `MANCANTE`.

### 4. Pubblicazione come web app

1. **Esegui il deployment** → **Nuovo deployment** → tipo **App web**.
2. Descrizione `v1`; **Esegui come: Me**; **Chi ha accesso: Chiunque**. → **Esegui il deployment**.
3. Copia l'**URL dell'app web** (finisce con `/exec`).
4. Prova: apri l'URL nel browser; deve rispondere `{"ok":true,"v":1,"service":"study-hub-contributi"}`.

### 5. Collegamento al sito

In [`src/config/site.ts`](../../src/config/site.ts), `SITE.contribute`:

```ts
contribute: {
  endpoint: 'https://script.google.com/macros/s/…/exec', // URL del punto 4
  turnstileSiteKey: '0x4AAAA…', // Site Key del punto 1 (pubblica)
},
```

Commit e push: alla pubblicazione il modulo invia direttamente allo script.

## Aggiornare lo script

**Dal repository (consigliato).** Una volta sola:

1. <https://script.google.com/home/usersettings> → **API di Google Apps Script**: attiva.
2. `npx @google/clasp@2.4.2 login` (le credenziali restano in `~/.clasprc.json`, fuori dal repository).
3. `cp tools/apps-script/.clasp.json.example tools/apps-script/.clasp.json` e incolla lo **ID script**
   (Impostazioni progetto). `.clasp.json` è in `.gitignore`.

Poi a ogni modifica: `npm run script:push` invia `Code.gs`, `Logic.gs` e `appsscript.json` (solo questi, vedi
`.claspignore`; la versione di clasp è fissata in `push.mjs`). Il push aggiorna il codice ma **non** la web app
pubblicata: dall'editor **Esegui il deployment** → **Gestisci deployment** → matita → **Versione: Nuova
versione** → **Esegui il deployment**. L'URL resta lo stesso: non serve toccare il sito. Se il manifest ha
permessi nuovi, esegui una funzione dall'editor (per esempio `verificaConfigurazione`) per autorizzarli.

**A mano.** Incolla i file nuovi, salva, poi pubblica una nuova versione come sopra.

Dopo un aggiornamento che aggiunge la pulizia, esegui una volta **`inizializza`** (o `installaPulizia`): crea
l'attivatore orario e aggiunge l'intestazione `Note` ai fogli esistenti.

## Cosa fa a ogni invio

1. Scarta in silenzio i bot (campo trappola compilato o modulo inviato in meno di 3 secondi).
2. Valida i campi come il sito (tipo, corso, pagina, messaggio 10–5000 caratteri, email, nome ≤ 80, tre
   dichiarazioni, allegati: max 10 file e 25 MB, solo PDF, immagini, TXT, MD, TEX, DOCX, ODT).
3. Verifica il token Turnstile con `siteverify` (host e azione `contribute` compresi).
4. Limiti per ora: 5 invii per email, 5 per browser, 120 in totale (CacheService, valori hash). I contatori
   sono a secchi orari (ora UTC): scadono alla fine dell'ora e un nuovo invio non ne sposta la scadenza.
5. Aggiunge una riga al foglio (stato `nuovo`, oppure `in-caricamento` finché arrivano gli allegati).
6. Allegati: blocchi da 4 MiB inviati dal browser uno alla volta, salvati in una sottocartella per invio
   (file grandi con upload ripristinabile di Drive); il primo blocco deve corrispondere al tipo dichiarato.
   Lo stato dell'upload sta nelle **proprietà dello script** (`up:<id>`, meno di 9 KB: nomi, dimensioni,
   blocchi ricevuti; il messaggio resta solo nel foglio). Lo `ScriptLock` si tiene solo per leggere e scrivere
   questo stato, mai durante il trasferimento verso Drive: più persone caricano insieme senza bloccarsi. Due
   richieste sullo stesso upload si escludono con un segno «occupato» nello stato (`busy`, il browser ritenta).
   Un blocco già ricevuto si può ripetere senza danni; uno fuori sequenza risponde con il blocco da cui
   riprendere (`received`).
7. Alla fine: la riga si **cerca per ID** (il foglio può essere stato ordinato o avere righe cancellate nel
   frattempo), link ai file, stato `nuovo`, email di notifica (rispondi direttamente al contributore, se ha
   lasciato l'email). Se l'email non parte (quota giornaliera di MailApp esaurita) il contributo resta salvato
   e l'errore finisce nella colonna `Note`.
8. **Pulizia** (ogni ora): le righe `in-caricamento` più vecchie di 6 ore diventano `scartato` con una nota,
   la loro cartella va nel cestino di Drive e lo stato viene rimosso. Se chi invia annulla dal modulo, succede
   subito (`cancel`).

Risposte: `{ ok: true, v: 1, … }` oppure `{ ok: false, v: 1, error }` con `error` tra `bad_request`,
`validation` (+ `fields`), `turnstile`, `rate_limited`, `config`, `upload_state`, `chunk` (+ `received`),
`file_content`, `upload_incomplete`, `busy`, `server`. Il protocollo lato sito (ritentativi con attesa crescente
su rete, HTTP 5xx, `server` e `busy`; ripresa; annullamento) è in
[`src/lib/contribute/upload.ts`](../../src/lib/contribute/upload.ts). Il browser invia `POST` con corpo `text/plain` (JSON): è una richiesta
"semplice", quindi niente preflight CORS, che Apps Script non gestisce.

## Test

`npx vitest run tests/unit/apps-script` esegue `Logic.gs` e `Code.gs` in Node con servizi Google finti
(`tests/unit/apps-script/shim.ts`, con orologio, lock e quota email simulati): validazione, Turnstile, limiti a
secchi orari, upload a blocchi, righe ritrovate per ID dopo un riordino, lock non tenuto durante il
trasferimento, pulizia, notifica fallita, errori. `tests/unit/platform/contribute-upload.test.ts` prova il
protocollo del sito contro lo stesso backend con una rete che perde richieste e risposte a metà invio.
Il modulo nel browser è provato con un endpoint finto in `tests/e2e/platform.spec.ts`.
