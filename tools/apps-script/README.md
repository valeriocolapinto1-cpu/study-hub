# Backend del modulo Contribuisci (Google Apps Script)

Script che riceve i contributi inviati da `/<lingua>/contribuisci/`: li verifica (Cloudflare Turnstile,
validazione, limiti di frequenza), salva una riga in un Google Sheet, salva gli allegati su Google Drive e
ti avvisa via email. Flusso completo e processo di integrazione: [`docs/CONTRIBUTI.md`](../../docs/CONTRIBUTI.md).

| File | Contenuto |
|---|---|
| `Code.gs` | web app (`doPost`, `doGet`), servizi Google, funzioni di manutenzione `inizializza()` e `verificaConfigurazione()` |
| `Logic.gs` | logica pura (validazione, limiti, formattazione), testata con vitest (`tests/unit/apps-script/`) |
| `appsscript.json` | manifest: runtime V8, fuso orario, permessi, impostazioni della web app |

Finché lo script non è pubblicato il modulo funziona comunque: prepara un'email precompilata.

## Messa in funzione (una volta, circa 15 minuti)

### 1. Chiavi di Cloudflare Turnstile

1. Accedi (o registrati gratis) su <https://dash.cloudflare.com> → **Turnstile** → **Add widget**.
2. Nome: `study-hub`; **Hostname**: `valeriocolapinto1-cpu.github.io` (aggiungi anche `localhost` se vuoi provare in locale);
   **Widget mode**: *Managed*. Crea.
3. Copia la **Site Key** (pubblica) e la **Secret Key** (segreta: non va mai nel repository).

### 2. Progetto Apps Script

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
   Google chiede i permessi (Drive, Fogli, email, richieste esterne): **Rivedi autorizzazioni** → scegli
   l'account → *Avanzate* → *Vai a study-hub-contributi (non sicuro)* → **Consenti**.
   È normale: lo script è tuo e non è verificato da Google.
2. `inizializza` crea su Drive la cartella **`study-hub-contributi`** e, al suo interno, il foglio
   **`study-hub-contributi`** con le intestazioni; salva gli ID nelle proprietà dello script.
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

Incolla i file nuovi, salva, poi **Esegui il deployment** → **Gestisci deployment** → matita → **Versione:
Nuova versione** → **Esegui il deployment**. L'URL resta lo stesso: non serve toccare il sito.

## Cosa fa a ogni invio

1. Scarta in silenzio i bot (campo trappola compilato o modulo inviato in meno di 3 secondi).
2. Valida i campi come il sito (tipo, corso, pagina, messaggio 10–5000 caratteri, email, nome ≤ 80, tre
   dichiarazioni, allegati: max 10 file e 25 MB, solo PDF, immagini, TXT, MD, TEX, DOCX, ODT).
3. Verifica il token Turnstile con `siteverify` (host e azione `contribute` compresi).
4. Limiti per ora: 5 invii per email, 5 per browser, 120 in totale (CacheService, valori hash).
5. Aggiunge una riga al foglio (stato `nuovo`, oppure `in-caricamento` finché arrivano gli allegati).
6. Allegati: blocchi da 4 MiB inviati dal browser uno alla volta, salvati in una sottocartella per invio
   (file grandi con upload ripristinabile di Drive); il primo blocco deve corrispondere al tipo dichiarato.
7. Alla fine: link ai file nel foglio, stato `nuovo`, email di notifica (rispondi direttamente al
   contributore, se ha lasciato l'email).

Risposte: `{ ok: true, v: 1, … }` oppure `{ ok: false, v: 1, error }` con `error` tra `bad_request`,
`validation` (+ `fields`), `turnstile`, `rate_limited`, `config`, `upload_state`, `chunk`, `file_content`,
`upload_incomplete`, `server`. Il browser invia `POST` con corpo `text/plain` (JSON): è una richiesta
"semplice", quindi niente preflight CORS, che Apps Script non gestisce.

## Test

`npx vitest run tests/unit/apps-script` esegue `Logic.gs` e `Code.gs` in Node con servizi Google finti
(`tests/unit/apps-script/shim.ts`): validazione, Turnstile, limiti, upload a blocchi, finalizzazione, errori.
Il modulo nel browser è provato con un endpoint finto in `tests/e2e/platform.spec.ts`.
