# Cose da fare (Valerio)

Passi che richiedono il proprietario del repository o dei suoi account: le sessioni di lavoro non possono farli.

## 1. GitHub Pages

Settings → Pages → Build and deployment → Source: **GitHub Actions** (se non è già impostato).
Il workflow `deploy.yml` pubblica a ogni push su `main`. Verifica: <https://valeriocolapinto1-cpu.github.io/study-hub/>.

## 2. Modulo «Contribuisci» (Apps Script + Turnstile)

Finché non è fatto, il modulo mostra il ripiego via email. Procedura completa (~15 minuti) in
[`tools/apps-script/README.md`](../tools/apps-script/README.md):

1. Crea le chiavi Cloudflare Turnstile (Site Key pubblica, Secret Key segreta).
2. Crea il progetto Apps Script, la cartella Drive e il foglio, imposta le proprietà (la Secret Key va lì, mai nel repository).
3. Pubblica come web app e copia l'URL che finisce con `/exec`.
4. Invia **URL `/exec`** e **Site Key** (entrambi pubblici) a una sessione, oppure inseriscili tu in
   `src/config/site.ts` → `contribute.endpoint` e `contribute.turnstileSiteKey`.

## 3. Tutor AI («Chiedi al tutor»)

Finché non è fatto, il pulsante non compare. Procedura (~20 minuti) in [`TUTOR-AI.md`](TUTOR-AI.md):
chiave API su console.anthropic.com con un limite di spesa mensile, account Cloudflare gratuito,
widget Turnstile, `npm run ai:deploy` con `wrangler secret put ANTHROPIC_API_KEY` e
`TURNSTILE_SECRET_KEY`, poi URL del Worker e Site Key in `src/config/site.ts` → `tutor`.

## 3b. Revisione dei contenuti

Le note di migrazione, le scelte da confermare e le proposte sono in [`docs/revisione/`](revisione/):
una pagina per corso (`teoria-circuiti.md`, `fondamenti-informatica.md`, `fisica-1.md`, `fisica-2.md`).
Rispondi lì (o in una issue) alle voci marcate come «Proposta».

## 4. Repository vecchi

I quattro siti originali ora rimandano a study-hub (pagine di rimando con il percorso conservato,
service worker disattivati, README aggiornati):

- `teoria-dei-circuiti-ingegneria-elettronica`
- `fondamenti-di-informatica-AEFIN`
- `fisica-2-ingegneria-elettronica`
- `orale-fisica-1-ingegneria-elettronica`

**Da confermare**: archiviarli (Settings → General → Danger Zone → Archive this repository).
L'archiviazione li rende di sola lettura ma lascia attivi i rimandi su GitHub Pages; la loro storia è
comunque conservata anche in `legacy/` di questo repository.
