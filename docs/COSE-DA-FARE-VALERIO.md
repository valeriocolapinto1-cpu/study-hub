# Cose da fare (Valerio)

Passi che richiedono il proprietario del repository o dei suoi account: le sessioni di lavoro non possono farli.
Sono in ordine di utilità; ognuno è indipendente dagli altri. Per aggiungere o correggere contenuti da solo vedi
[`COME-AGGIUNGERE-CONTENUTI.md`](COME-AGGIUNGERE-CONTENUTI.md).

## 0. Verifica della pubblicazione (una volta)

Il sito si pubblica da solo: a ogni push su `main` il workflow **CI** (`.github/workflows/ci.yml`) esegue tutti i
controlli e, solo se sono tutti verdi, il job **«Pubblicazione su GitHub Pages»** mette online lo stesso `dist/`
provato. Non c'è più un workflow di deploy separato.

1. Settings → Pages → Build and deployment → Source: **GitHub Actions** (se non è già così).
2. Controlla che il sito risponda: <https://valeriocolapinto1-cpu.github.io/study-hub/>. La versione pubblicata
   (commit · data) è nel piè di pagina.

## 1. Modulo «Contribuisci» (Apps Script + Turnstile, ~15 minuti)

Finché non è fatto, il modulo mostra il ripiego via email. Procedura completa in
[`tools/apps-script/README.md`](../tools/apps-script/README.md):

1. Crea un widget Cloudflare Turnstile: ottieni la **Site Key** (pubblica) e la **Secret Key** (segreta).
2. Crea il progetto Apps Script, la cartella Drive e il foglio; imposta le proprietà dello script (la Secret Key va
   lì, mai nel repository). Il codice si può caricare con `npm run script:push`.
3. Pubblica come web app e copia l'URL che finisce con `/exec`.
4. Metti **URL `/exec`** e **Site Key** (entrambi pubblici) in `src/config/site.ts` → `contribute.endpoint` e
   `contribute.turnstileSiteKey`, oppure mandali a una sessione che apra la PR.

## 2. Tutor AI «Chiedi al tutor» (~20 minuti)

Finché non è fatto, il pulsante non compare e le pagine non cambiano. Procedura, costi e limiti in
[`TUTOR-AI.md`](TUTOR-AI.md); privacy in [`PRIVACY-TUTOR.md`](PRIVACY-TUTOR.md). In breve:

1. Chiave API su console.anthropic.com, con un **limite di spesa mensile**.
2. Account Cloudflare gratuito e un widget Turnstile per il tutor.
3. Dalla cartella del repository: `npm run ai:deploy` (installa wrangler, login, pubblica), poi
   `npx --prefix tools/ai-worker wrangler secret put ANTHROPIC_API_KEY` e lo stesso con `TURNSTILE_SECRET_KEY`.
4. URL del Worker e Site Key in `src/config/site.ts` → `tutor.endpoint` e `tutor.turnstileSiteKey`.

## 3. Protezione del branch `main`

Settings → Branches (o Rules → Rulesets) → regola per `main`:

1. **Require a pull request before merging** (nessun push diretto).
2. **Require status checks to pass**: scegli i job della CI — «Controlli (astro check, tsc, ESLint, prettier)»,
   «Dipendenze (npm audit)», «Test unitari (vitest)», «Build e test dei contenuti», «Playwright (smoke, axe WCAG 2.2
   AA, visual)», «Lighthouse CI». Non aggiungere «Pubblicazione su GitHub Pages»: gira solo su `main`, mai nelle PR.
3. Facoltativo: **Require branches to be up to date before merging**.

## 4. Pull request da chiudere o valutare

| PR | Cosa | Consiglio |
| --- | --- | --- |
| #29 | Actions: gruppo di 4 aggiornamenti | mergiare se la CI è verde |
| #30 | Dipendenze di produzione (gruppo di 6) | mergiare se la CI è verde; dopo, controllare a occhio il sito pubblicato |
| #31 | Dipendenze di sviluppo (gruppo di 4) | mergiare se la CI è verde |
| #32 | jsdom 30 → 31 (versione maggiore) | mergiare solo con la CI verde, altrimenti chiudere |
| #33 | `@types/node` 22 → 26 | **chiudere**: i tipi devono restare quelli di Node 22, la versione usata (`.nvmrc`) |
| #34 | TypeScript 6 → 7 (versione maggiore) | mergiare solo con la CI verde; se fallisce, chiudere e affidarlo a una sessione |
| #18 | «PR1 — Dati delle isole fuori dall'HTML» | **chiudere**: superata, il lavoro è entrato in `main` con le PR successive |

Le PR di Dependabot si aggiornano da sole quando `main` cambia; una PR chiusa non si ripropone per la stessa versione.

## 5. Branch remoti da cancellare

Le sessioni non possono cancellare branch remoti. Sono tutti già mergiati in `main` (la PR #28 ha verificato i
primi 25; gli altri hanno la PR mergiata). Si cancellano da **Code → Branches** (icona del cestino) o, in locale,
con `git push origin --delete <nome>`.

- Prima fase: `claude/pr1-fondamenta`, `claude/pr2-design`, `claude/pr3-motore`, `claude/pr4-simulatori`,
  `claude/pr5a-rotte-corso`, `claude/pr9-piattaforma`, `claude/pr10-grafica-originale`, `claude/pr11-kit-figure`,
  `claude/pr-corso-teoria-circuiti`, `claude/pr-corso-fondamenti-informatica`, `claude/pr-corso-fisica-2`,
  `claude/pr-corso-fisica-1`, `claude/pr-figure-fisica-2`, `claude/pr-figure-fisica-1`,
  `claude/pr-figure-circuiti-fondamenti`, `claude/pr-rifinitura`, `claude/pr-aggiornamenti-cache`.
- Revisione 1: `claude/rev-pr1-dati-isole`, `claude/rev-pr2-service-worker`, `claude/rev-pr3-formulari`,
  `claude/rev-pr4-dati-utente`, `claude/rev-pr5-motore`, `claude/rev-pr6-apps-script`, `claude/rev-pr7-head-pwa`,
  `claude/rev-pr8-telefono-a11y`, `claude/rev-pr9-strumenti-ci`.
- Revisione 2 (mergiati): `claude/rev2-r3-decisioni`, `claude/rev2-r3-virgola`, `claude/rev2-r5-sw-piccolo`,
  `claude/rev2-r6-telefono`, `claude/rev2-r8-panoramica`, `claude/rev2-r9-scroll-indice`, `claude/rev2-r10-formule`,
  `claude/rev2-r11-aggiornamenti`, `claude/rev2-r12-tutor-ai`, `claude/rev2-r13-studiato`.
- Vecchi, interamente contenuti in `main`: `conformita-legale`, `revisione-grafica`.
- Dopo la chiusura della PR #18: `claude/dati-isole`.

**Non cancellare** i branch con una PR ancora aperta (per esempio `claude/rev2-r4-formulari`, questo
`claude/rev2-r7-documentazione` finché non è mergiato, e i `dependabot/…`). Con la protezione del punto 3 puoi
attivare anche Settings → General → **Automatically delete head branches**, così in futuro si cancellano da soli
al merge.

## 6. Repository vecchi (quando vuoi)

I quattro siti originali rimandano già a study-hub (pagine di rimando con il percorso conservato, service worker
disattivati, README aggiornati):

- `teoria-dei-circuiti-ingegneria-elettronica`
- `fondamenti-di-informatica-AEFIN`
- `fisica-2-ingegneria-elettronica`
- `orale-fisica-1-ingegneria-elettronica`

Archiviarli è facoltativo e non ha fretta: Settings → General → Danger Zone → **Archive this repository**. Li rende
di sola lettura ma lascia attivi i rimandi su GitHub Pages; la loro storia è comunque anche in `legacy/` di questo
repository.

## 7. Informazioni sui corsi che mancano

Voci «In attesa di Valerio» in [`docs/revisione/`](revisione/). Rispondi nel file del corso, in una issue o a una
sessione; chi le inserisce segue [`COME-AGGIUNGERE-CONTENUTI.md`](COME-AGGIUNGERE-CONTENUTI.md).

1. **Teoria dei Circuiti — date degli appelli** di gennaio/febbraio 2027: vanno in `examDates` di
   `src/content/courses/teoria-circuiti.yaml` (formato `AAAA-MM-GG`). Le date passate si nascondono da sole.
2. **Fondamenti di Informatica — semestre** reale del corso (oggi la panoramica mostra il 1°): campo `semester`.
3. **Fisica 1 — semestre** (oggi non indicato): campo `semester` di `src/content/courses/fisica-1.yaml`.
4. **Fisica 1 — struttura della prova** («tre problemi + due domande d'orale, 120 min» è una scelta del sito):
   confermarla o dare quella reale (`exam` nello stesso file).
5. **Fisica 2 — i sei «risultati di apprendimento»** del programma ufficiale, da copiare dalla scheda del corso.
6. **Fisica 2 — dispense del docente**: nomenclatura del voltmetro «a monte/a valle» (`formulario/#f-inserzione`),
   soglia di compatibilità $t\lesssim 2$ (`#f-confronto`), segno in `#f-dipolo-osc` e `#f-fresnel-p`.
7. **Fisica 2 — appelli**: controllare a campione, sui PDF ufficiali, l'argomento assegnato agli esercizi di
   `extra/appelli`.
8. **Fisica 2 — laboratorio**: confermare obiettivi, strumentazione e voci di `extra/laboratorio` con le schede.
