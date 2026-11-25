# Tutor AI («Chiedi al tutor»)

Revisione 2, voce R12; dalla revisione 3 (R15) il modello è **Gemini di Google** al posto di Claude.
Un pannello di chat su esercizi, schede di ripasso e pagine di teoria. **Nessuna chiave nel
browser**: il sito parla solo con un piccolo Worker Cloudflare (`tools/ai-worker/`), che tiene la
chiave come secret e chiama l'API Gemini (`streamGenerateContent`).

Finché l'URL del Worker non è in `src/config/site.ts` il pulsante non compare e le pagine non
cambiano di un byte (né HTML né CSP).

> **Prima di accendere il tutor leggi «Termini di Google: tre punti da decidere»** più sotto: per un
> sito usato da studenti in Italia Google chiede il livello **a pagamento** dell'API, e i progetti
> nuovi di AI Studio **registrano le chiamate** finché non si spegne il registro.

## Come funziona

```
Pagina (pulsante) ──clic──▶ import() del pannello ──POST /chat (JSON)──▶ Worker Cloudflare
                                                   ◀── text/event-stream ──┘   │ chiave come secret
                                                                               ▼
                                            API Gemini: streamGenerateContent?alt=sse
```

- **Pulsante**: `src/components/course/TutorButton.astro` (sotto ogni esercizio, sotto la sessione di
  ripasso, fisso in basso a destra nella teoria) e `Tutor.astro` (configurazione JSON e un caricatore
  di ~0,5 KB, solo nelle pagine col pulsante). **Mai nella pagina d'esame.**
- **Pannello** (`src/scripts/tutor/`): scaricato con `import()` al primo clic, CSS compreso
  (zero byte in più al caricamento delle pagine). Legge il contesto dalla pagina (`context.ts`):
  - esercizio: enunciato, alternative, campi, risposta scritta dallo studente ed esito della
    correzione; soluzione di riferimento da `dati/<argomento>.json` (per i generati solo se la
    variante mostrata è quella pregenerata);
  - scheda di ripasso: fronte e, se già girata, retro;
  - teoria: il testo selezionato, altrimenti la sezione in vista.
  Le formule tornano in TeX (`$…$`); le risposte si rendono con lo stesso renderer delle isole
  (`rich-client`, KaTeX caricato solo se serve). Cronologia solo nel browser (`history.ts`).
- **Worker** (`tools/ai-worker/src/`): `handler.ts` (CORS, validazione, Turnstile, limiti, SSE),
  `gemini.ts` (richiesta, lettura dello stream, esiti ed errori), `prompt.ts` (istruzioni e forma
  dei messaggi), `limits.ts` (Durable Object), `pricing.ts` (stima dei costi). Nessun SDK: solo
  `fetch`. Il protocollo verso il pannello (`session`, `text`, `refusal`, `done`, `error`) non
  dipende dal fornitore del modello.

### Scelte tecniche (verificate su ai.google.dev il 25 novembre 2026)

| Cosa | Come |
|---|---|
| Endpoint | `POST https://generativelanguage.googleapis.com/v1beta/models/<MODEL>:streamGenerateContent?alt=sse`, chiave nell'intestazione `x-goog-api-key` (mai nell'URL) |
| Modello | variabile `MODEL`, predefinito `gemini-4-hydrogen` (stabile da novembre 2026, nel livello gratuito e in quello a pagamento). **I modelli cambiano spesso: controlla l'elenco aggiornato in Google AI Studio** o su <https://ai.google.dev/gemini-api/docs/models> prima di pubblicare |
| Istruzioni | `systemInstruction` (istruzioni fisse, poi titolo e scaletta del corso); il contesto della pagina va davanti al primo messaggio in `contents` (ruoli `user`/`model`) |
| Ragionamento | `generationConfig.thinkingConfig.thinkingLevel` da `THINKING_LEVEL`: `low` predefinito (su Hydrogen il predefinito di Google è `high`, più lento e costoso; `minimal` è rifiutato dai Gemini 4, accettato dai Flash-Lite); `default` non manda il campo |
| Lunghezza | `generationConfig.maxOutputTokens` = `MAX_TOKENS` (4000), **ragionamento compreso**; con `finishReason: MAX_TOKENS` il pannello dice «risposta interrotta» |
| Parametri non usati | niente `temperature`/`topP`/`topK` (Gemini 4 li ignora), niente cache esplicita (Hydrogen ha solo quella implicita, automatica: le parti fisse stanno all'inizio, uguali byte per byte), niente strumenti né `safetySettings` (si tengono i filtri predefiniti di Google) |
| Blocchi | `promptFeedback.blockReason` (domanda bloccata) o `finishReason` `SAFETY`, `RECITATION`, `PROHIBITED_CONTENT`, `SPII`, `BLOCKLIST`, `OTHER`… → evento `refusal`: il pannello scarta il testo parziale e la coppia non entra nella cronologia |
| Ragionamento nel testo | le parti con `thought: true` non arrivano mai allo studente (e non si chiedono) |
| Thought signature | le risposte precedenti tornano come testo semplice: Google le verifica solo con le chiamate a funzione, che il tutor non usa (per il testo sono «raccomandate», non obbligatorie) |
| Errori | 400 → «richiesta non valida»; 400 `FAILED_PRECONDITION`, 401, 402, 403, 404 → «tutor non disponibile» (chiave, modello, fatturazione o regione da sistemare); 429 → «limite di richieste del servizio»; 5xx → «sovraccarico»; 504 e tempo massimo (`TIMEOUT_SECONDS`, 60 s) → «ci sta mettendo troppo». Due nuovi tentativi automatici solo su 500/502/503 ed errori di rete, prima che arrivi testo. Il Worker scrive nel registro di Cloudflare (`wrangler tail`) solo stato HTTP e codice di Google, mai i testi |

## Protezioni

- **CORS**: solo le origini in `ALLOWED_ORIGINS` (il dominio del sito).
- **Turnstile**: il primo messaggio porta un token; il Worker lo verifica e risponde con un gettone
  di sessione firmato (2 ore, legato all'IP) per i messaggi successivi.
- **Limite per IP**: `RATE_LIMIT_PER_HOUR` (20). Gli IP non si salvano in chiaro (hash con sale).
- **Tetto di spesa**: `DAILY_BUDGET_USD` (2 $) al giorno UTC, stimato da `usageMetadata` di ogni
  risposta con i prezzi `PRICE_*` (vedi «Stima dei costi»); ogni richiesta prenota prima il suo costo
  massimo, così richieste contemporanee non lo superano. Raggiunto il tetto: «riprova domani».
- **Lunghezze**: messaggio ≤ 2000 caratteri, ≤ 20 turni, contesto ≤ 6000 caratteri, corpo ≤ 64 KB.
- **Privacy**: il Worker non salva le conversazioni ([PRIVACY-TUTOR.md](PRIVACY-TUTOR.md)); il
  registro di AI Studio va spento (passo 1 della guida).

## Stima dei costi

Il tetto del Worker è una **stima**: la cifra vera è quella della fatturazione di Google (pagine
*Spend* e *Billing* di AI Studio). Il Worker calcola il costo di ogni risposta da `usageMetadata`:

```
costo ($) = (promptTokenCount + toolUsePromptTokenCount) × PRICE_INPUT_PER_MTOK  / 1 000 000
          + (candidatesTokenCount + thoughtsTokenCount)  × PRICE_OUTPUT_PER_MTOK / 1 000 000
```

- I token del **ragionamento** (`thoughtsTokenCount`) si pagano come uscita: è il motivo di
  `THINKING_LEVEL = "low"`.
- Lo sconto della **cache implicita** (`cachedContentTokenCount`) non si sottrae: la stima sbaglia
  per eccesso.
- Se `usageMetadata` manca (risposta interrotta), si stima dalla lunghezza: ~3 caratteri per token,
  per eccesso, su istruzioni + contesto + conversazione e sul testo arrivato.
- Prima di chiamare Google ogni richiesta **prenota** il caso peggiore:
  `(caratteri inviati / 3) × prezzo di ingresso + MAX_TOKENS × prezzo di uscita`, poi lo sostituisce
  con la stima della risposta.

**Dove leggere i prezzi**: <https://ai.google.dev/gemini-api/docs/pricing>, sezione del modello
scelto, scheda *Standard*, colonna *Paid Tier* (dollari per milione di token; per l'uscita vale la
riga «Output price (including thinking tokens)»). Copiali in `PRICE_INPUT_PER_MTOK` e
`PRICE_OUTPUT_PER_MTOK` in `wrangler.toml`. I valori scritti ora sono quelli di `gemini-4-hydrogen`
letti il 25/11/2026 e **vanno aggiornati dal listino Google** quando cambi modello o quando Google
cambia i prezzi. Con un modello più caro e i prezzi vecchi il tetto sottostima la spesa.

**Per farti un'idea**, con i numeri del listino e quelli delle tue prove:

```
costo di una domanda ≈ T_in × P_in / 10⁶ + (T_out + T_ragionamento) × P_out / 10⁶
domande al giorno prima del tetto ≈ DAILY_BUDGET_USD / costo di una domanda
caso peggiore del mese ≈ DAILY_BUDGET_USD × 30
```

dove `T_in` sono i token in ingresso (istruzioni, scaletta del corso, esercizio con soluzione,
conversazione), `T_out` quelli della risposta, `T_ragionamento` quelli del ragionamento, `P_in` e
`P_out` i prezzi per milione. I conteggi veri li leggi dopo qualche domanda di prova nella pagina
*Spend* di AI Studio. La **seconda rete** è il tetto mensile del progetto o il credito prepagato
(passo 1).

## Termini di Google: tre punti da decidere

Dai termini aggiuntivi dell'API Gemini (<https://ai.google.dev/gemini-api/terms>, in vigore dal
23 marzo 2026) e dalla pagina sui registri (<https://ai.google.dev/gemini-api/docs/logs-policy>),
letti il 25 novembre 2026. Sono condizioni del contratto tra te e Google: rileggile prima di
pubblicare, possono cambiare.

1. **Livello gratuito e livello a pagamento.** Sul livello gratuito («Unpaid Services») Google usa
   domande e risposte per fornire, migliorare e sviluppare i suoi prodotti e modelli, e revisori
   umani possono leggerle (scollegate dalla chiave e dal progetto). Sul livello a pagamento
   (progetto con un account di fatturazione Cloud attivo) Google **non** le usa per migliorare i
   prodotti e le registra per un periodo limitato solo per individuare abusi e per obblighi di
   legge. **Per un servizio offerto a persone nello Spazio economico europeo, in Svizzera o nel
   Regno Unito i termini ammettono solo il livello a pagamento** («You may use only Paid Services
   when making API Clients available to users in the European Economic Area, Switzerland, or the
   United Kingdom»): con studenti in Italia serve la fatturazione attiva, anche se la spesa resta
   bassa. (Per chi usa l'API dall'UE i termini applicano comunque le regole sui dati del livello a
   pagamento anche alla quota gratuita, ma la regola sopra resta.)
2. **Età.** I termini chiedono di non usare l'API in un servizio «rivolto o che probabilmente sarà
   usato da minori di 18 anni». Il sito è per studenti universitari, ma qualcuno al primo anno può
   avere 17 anni: valuta tu e, nel caso, scrivilo accanto al pulsante.
3. **Registro delle chiamate di AI Studio.** Nei progetti con fatturazione creati dal 26 ottobre
   2026 Google tiene di default un registro delle chiamate a `generateContent` (domande e risposte),
   privato del progetto e conservato fino a 55 giorni. Il tutor promette di non conservare le
   conversazioni: **spegni il registro** nella pagina *Logs* di AI Studio e non condividere mai
   dataset con Google.

## Guida per Valerio (circa 30 minuti)

1. **Chiave e spesa in Google AI Studio** — <https://aistudio.google.com>, con un account Google:
   - *Get API key → Create API key*: la chiave nasce dentro un progetto Google Cloud (AI Studio ne
     crea uno se non c'è). Le chiavi nuove sono già limitate all'API Gemini; se la pagina mostra
     l'etichetta *Unrestricted*, scegli *Add restrictions → Restrict to Gemini API only*. Copia la
     chiave: serve solo al passo 3 e non va mai nel repository né in una chat.
   - *Billing*: collega un account di fatturazione al progetto (necessario per studenti nell'UE,
     vedi sopra). Con il prepagato (*Buy credits*, minimo 5 $) quando il credito finisce le chiavi
     smettono di funzionare: il credito è già un tetto. In più, nella pagina *Spend* puoi impostare
     un **tetto mensile del progetto** (*Monthly spend cap*; funzione sperimentale, può sforare
     dell'uso di una decina di minuti).
   - *Logs*: **spegni il registro** delle chiamate del progetto.
   - Controlla che il modello di `wrangler.toml` (`gemini-4-hydrogen`) sia ancora nell'elenco dei
     modelli e annota i suoi prezzi dal listino.
2. **Account Cloudflare gratuito** — <https://dash.cloudflare.com/sign-up>. Serve perché il sito è
   statico (GitHub Pages) e non può custodire segreti: il **Worker** è il piccolo intermediario che
   tiene la chiave Google fuori dal browser, la usa per conto delle pagine e applica i limiti
   (Turnstile contro i robot, richieste per IP, tetto di spesa del giorno). Il piano gratuito basta
   (Worker e Durable Object con SQLite).
   - *Turnstile → Add widget*: dominio `valeriocolapinto1-cpu.github.io`, modalità *Managed*.
     Annota la **Site Key** (pubblica) e la **Secret Key** (segreta). Puoi riusare il widget di
     «Contribuisci» se il dominio è lo stesso.
3. **Pubblica il Worker** — dalla cartella del repository:

   ```bash
   npm run ai:deploy                                   # installa wrangler, login, pubblica
   npx --prefix tools/ai-worker wrangler secret put GEMINI_API_KEY         # incolla la chiave
   npx --prefix tools/ai-worker wrangler secret put TURNSTILE_SECRET_KEY   # incolla la Secret Key
   ```

   Al termine wrangler stampa l'URL, del tipo `https://study-hub-tutor.<account>.workers.dev`.
   Le variabili stanno in `tools/ai-worker/wrangler.toml` (dopo una modifica, di nuovo
   `npm run ai:deploy`): `MODEL`, `THINKING_LEVEL`, `MAX_TOKENS`, **`PRICE_INPUT_PER_MTOK` e
   `PRICE_OUTPUT_PER_MTOK` (dal listino del modello scelto)**, `TIMEOUT_SECONDS`,
   `RATE_LIMIT_PER_HOUR`, `DAILY_BUDGET_USD`, `ALLOWED_ORIGINS`. Per vedere gli errori del servizio:
   `npx --prefix tools/ai-worker wrangler tail`.
4. **Collega il sito** — in `src/config/site.ts`:

   ```ts
   tutor: {
     endpoint: 'https://study-hub-tutor.<account>.workers.dev',
     turnstileSiteKey: '<Site Key>',
   },
   ```

   Oppure manda URL e Site Key (entrambi pubblici) a una sessione. Dopo la pubblicazione del sito il
   pulsante «Chiedi al tutor» compare e la CSP delle pagine col tutor si apre a quell'URL.

**Spegnere il tutor**: svuota `endpoint` (il pulsante sparisce alla pubblicazione successiva) oppure
metti `DAILY_BUDGET_USD = "0"` nel Worker (risponde subito «riprova domani»). Per fermare subito la
spesa dal lato Google: elimina la chiave in AI Studio.

**Se avevi già pubblicato il Worker con Anthropic** (R12):
`npx --prefix tools/ai-worker wrangler secret delete ANTHROPIC_API_KEY` e revoca quella chiave nella
console Anthropic.

## Prove

- `tests/unit/ai-worker/worker.test.ts`: Worker con `fetch` finto per Turnstile e Gemini (CORS,
  validazione, Turnstile e sessione, limite per IP, tetto con prenotazione, SSE, URL, intestazioni e
  corpo della richiesta, blocchi di sicurezza, MAX_TOKENS, errori HTTP e dentro lo stream, nuovi
  tentativi, tempo massimo, costi da `usageMetadata` e stimati dalla lunghezza).
- `tests/unit/tutor/tutor-client.test.ts`: contesto dal DOM, SSE, cronologia.
- `tests/e2e/engine/tutor.spec.ts`: pannello sulla build delle fixture, dove l'URL del Worker è
  `https://tutor.invalid/chat`, servito da un server SSE finto (`page.route`).

Nessuna chiamata reale all'API, né in locale né in CI.

## Seconda fase (predisposta, non attiva)

**Correzione delle risposte aperte** (esercizi in autovalutazione e domande d'orale): il contesto
`exercise` porta già enunciato, soluzione di riferimento e risposta dello studente. Servirebbero:
un tipo di contesto `grade` nel Worker con un'istruzione di correzione e un'uscita strutturata
(`generationConfig.responseMimeType: "application/json"` con `responseJsonSchema`: punteggio 0–1 e
commenti per punto della soluzione), un pulsante «Fammi correggere» nelle isole in autovalutazione
(bytes nella pagina degli esercizi, non nell'esame) e un limite separato. La prova d'esame resta
senza tutor.
