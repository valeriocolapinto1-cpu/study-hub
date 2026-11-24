# Tutor AI («Chiedi al tutor»)

Revisione 2, voce R12. Un pannello di chat su esercizi, schede di ripasso e pagine di teoria che
risponde con Claude (Anthropic). **Nessuna chiave nel browser**: il sito parla solo con un piccolo
Worker Cloudflare (`tools/ai-worker/`), che tiene la chiave come secret e chiama la Messages API.

Finché l'URL del Worker non è in `src/config/site.ts` il pulsante non compare e le pagine non
cambiano di un byte (né HTML né CSP).

## Come funziona

```
Pagina (pulsante) ──clic──▶ import() del pannello ──POST /chat (JSON)──▶ Worker Cloudflare
                                                   ◀── text/event-stream ──┘   │ chiave come secret
                                                                               ▼
                                                               Messages API (streaming)
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
  `prompt.ts` (istruzioni e ordine per la cache), `limits.ts` (Durable Object), `pricing.ts`.

### Scelte tecniche (verificate sulla documentazione dell'API, novembre 2026)

| Cosa | Come |
|---|---|
| Modello | `claude-opus-5-5` con `output_config.effort: "low"`; `MODEL` = `claude-sonnet-5-5` o `claude-haiku-5-5` in `wrangler.toml` |
| Pensiero | adattivo, il predefinito: il parametro `thinking` non si manda (su Opus 5.5 non si può spegnere) |
| Lunghezza | `max_tokens` 4000 (`MAX_TOKENS`); con `stop_reason: "max_tokens"` il pannello lo dice |
| Prefill | mai: la conversazione inviata finisce sempre con un messaggio dello studente |
| Cache | due punti fissi nel `system` (istruzioni; scaletta del corso) + cache automatica della conversazione; il contesto della pagina sta nel primo messaggio, dopo i punti fissi |
| Rifiuti | si controlla sempre `stop_reason`; `refusal` → il pannello scarta il testo parziale |
| Fallback | `fallbacks: "default"` con la beta `server-side-fallback-2026-07-01` su Opus 5.5 e Sonnet 5.5; **non su Haiku 5.5**, che non ha fallback lato server |
| Errori | classi dell'SDK (`RateLimitError`, `InternalServerError`, …), due tentativi automatici dell'SDK |

## Protezioni

- **CORS**: solo le origini in `ALLOWED_ORIGINS` (il dominio del sito).
- **Turnstile**: il primo messaggio porta un token; il Worker lo verifica e risponde con un gettone
  di sessione firmato (2 ore, legato all'IP) per i messaggi successivi.
- **Limite per IP**: `RATE_LIMIT_PER_HOUR` (20). Gli IP non si salvano in chiaro (hash con sale).
- **Tetto di spesa**: `DAILY_BUDGET_USD` (2 $) al giorno UTC, stimato dall'uso reale di ogni
  risposta; ogni richiesta prenota prima il suo costo massimo, così richieste contemporanee non lo
  superano. Raggiunto il tetto: «riprova domani».
- **Lunghezze**: messaggio ≤ 2000 caratteri, ≤ 20 turni, contesto ≤ 6000 caratteri, corpo ≤ 64 KB.
- **Privacy**: il Worker non salva le conversazioni ([PRIVACY-TUTOR.md](PRIVACY-TUTOR.md)).

## Stima dei costi

Prezzi per milione di token (input / output / lettura dalla cache): Opus 5.5 4 $ / 20 $ / 0,20 $,
Sonnet 5.5 2 $ / 10 $ / 0,10 $, Haiku 5.5 0,10 $ / 0,50 $ / 0,01 $. Una domanda tipica: ~3000 token
in ingresso (istruzioni ~800, scaletta del corso 1000–2000, esercizio con soluzione 500–1500) e
400–800 in uscita (pensiero compreso, con effort `low`).

| Modello | Prima domanda | Domanda successiva (cache) | Con il tetto di 2 $/giorno |
|---|---|---|---|
| Opus 5.5 (predefinito) | ~0,03 $ | ~0,015 $ | ~80–130 domande al giorno |
| Sonnet 5.5 | ~0,015 $ | ~0,008 $ | ~150–250 |
| Haiku 5.5 | < 0,001 $ | < 0,0005 $ | migliaia |

La cache dura 5 minuti: conviene quando le domande arrivano a breve distanza (stessa conversazione,
o altri studenti sullo stesso corso). Il caso peggiore del mese è il tetto giornaliero × 30
(60 $ con 2 $/giorno): il **limite di spesa mensile della console** (passo 1) è la seconda rete.

## Guida per Valerio (circa 20 minuti)

1. **Chiave API** — su <https://console.anthropic.com>: *Settings → Billing*, aggiungi credito e
   imposta un **limite di spesa mensile** (es. 20 $); poi *API keys → Create key*. Copiala: serve
   solo al passo 4 e non va mai nel repository.
2. **Account Cloudflare gratuito** — <https://dash.cloudflare.com/sign-up>. Il piano gratuito basta
   (Worker e Durable Object con SQLite).
3. **Turnstile** — *Turnstile → Add widget*: dominio `valeriocolapinto1-cpu.github.io`, modalità
   *Managed*. Annota la **Site Key** (pubblica) e la **Secret Key** (segreta). Puoi riusare il widget
   di «Contribuisci» se il dominio è lo stesso.
4. **Pubblica il Worker** — dalla cartella del repository:

   ```bash
   npm run ai:deploy                                   # installa wrangler, login, pubblica
   npx --prefix tools/ai-worker wrangler secret put ANTHROPIC_API_KEY      # incolla la chiave
   npx --prefix tools/ai-worker wrangler secret put TURNSTILE_SECRET_KEY   # incolla la Secret Key
   ```

   Al termine wrangler stampa l'URL, del tipo `https://study-hub-tutor.<account>.workers.dev`.
   Modello, effort, limiti e origine del sito si cambiano in `tools/ai-worker/wrangler.toml`
   (poi di nuovo `npm run ai:deploy`).
5. **Collega il sito** — in `src/config/site.ts`:

   ```ts
   tutor: {
     endpoint: 'https://study-hub-tutor.<account>.workers.dev',
     turnstileSiteKey: '<Site Key>',
   },
   ```

   Oppure manda URL e Site Key (entrambi pubblici) a una sessione. Dopo la pubblicazione del sito il
   pulsante «Chiedi al tutor» compare e la CSP delle pagine col tutor si apre a quell'URL.

**Spegnere il tutor**: svuota `endpoint` (il pulsante sparisce alla pubblicazione successiva) oppure
metti `DAILY_BUDGET_USD = "0"` nel Worker (risponde subito «riprova domani»).

## Prove

- `tests/unit/ai-worker/worker.test.ts`: Worker con client dell'API finto (CORS, validazione,
  Turnstile e sessione, limite per IP, tetto con prenotazione, SSE, rifiuti, troncamenti, errori,
  parametri della richiesta, costi).
- `tests/unit/tutor/tutor-client.test.ts`: contesto dal DOM, SSE, cronologia.
- `tests/e2e/engine/tutor.spec.ts`: pannello sulla build delle fixture, dove l'URL del Worker è
  `https://tutor.invalid/chat`, servito da un server SSE finto (`page.route`).

Nessuna chiamata reale all'API, né in locale né in CI.

## Seconda fase (predisposta, non attiva)

**Correzione delle risposte aperte** (esercizi in autovalutazione e domande d'orale): il contesto
`exercise` porta già enunciato, soluzione di riferimento e risposta dello studente. Servirebbero:
un tipo di contesto `grade` nel Worker con un'istruzione di correzione e un'uscita strutturata
(`output_config.format` con punteggio 0–1 e commenti per punto della soluzione), un pulsante
«Fammi correggere» nelle isole in autovalutazione (bytes nella pagina degli esercizi, non
nell'esame) e un limite separato. La prova d'esame resta senza tutor.
