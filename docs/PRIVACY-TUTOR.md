# Privacy del tutor AI

Informativa breve sul pulsante «Chiedi al tutor» di «Siti di studio» (progetto personale e non
ufficiale). / *Short privacy note on the "Ask the tutor" button (English below).*

## Cosa viene inviato

Quando scrivi al tutor, il browser invia al server del sito (un Worker Cloudflare):

- la tua domanda e i messaggi precedenti della stessa conversazione;
- il contesto della pagina: il testo dell'esercizio, della scheda o della sezione di teoria, la
  risposta che hai scritto nei campi dell'esercizio e la soluzione del materiale del corso;
- il titolo e l'elenco degli argomenti del corso, la lingua della pagina;
- un token di Cloudflare Turnstile (verifica anti-robot) o un gettone di sessione.

Il server inoltra domanda e contesto all'API di **Anthropic** (modello Claude) per generare la
risposta. Non invia nome, email o altri dati che ti identificano: il sito non ha account.

## Cosa viene conservato

- **Sul server del sito: niente conversazioni.** Il Worker non salva domande né risposte. Tiene solo
  contatori anonimi per i limiti (quante richieste per ora da un indirizzo IP, salvato come hash con
  sale e cancellato dopo un'ora; la spesa stimata del giorno).
- **Anthropic** tratta i dati inviati tramite API secondo i propri termini commerciali e la propria
  informativa (<https://www.anthropic.com/legal/privacy>); per impostazione predefinita non li usa per
  addestrare i modelli.
- **Cloudflare** gestisce Worker e Turnstile secondo la propria informativa
  (<https://www.cloudflare.com/privacypolicy/>).
- **Nel tuo browser**: la cronologia delle conversazioni (localStorage, chiave `sh:tutor:<corso>`,
  al più 30 conversazioni per corso) e il gettone di sessione (sessionStorage). «Nuova conversazione»
  cancella quella aperta; cancellando i dati del sito dal browser sparisce tutto. La cronologia non
  entra nell'esportazione dei dati («I miei dati»).

Non scrivere al tutor dati personali o sensibili.

## English

When you message the tutor, your question, the earlier messages of the conversation, the page
context (exercise, card or theory text, your typed answer, the reference solution) and the course
outline are sent to the site's Cloudflare Worker, which forwards them to the **Anthropic API**
(Claude) to generate the answer. The Worker **does not store conversations**; it only keeps
anonymous counters for rate limits (a salted hash of the IP address, deleted after an hour) and the
estimated daily spend. Conversation history stays **only in your browser** (localStorage) and is not
part of the data export. Do not share personal or sensitive data with the tutor.
