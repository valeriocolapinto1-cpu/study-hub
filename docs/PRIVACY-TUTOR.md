# Privacy del tutor AI

Informativa breve sul pulsante «Chiedi al tutor» di «Siti di studio» (progetto personale e non
ufficiale). / *Short privacy note on the "Ask the tutor" button (English below).*

**Non scrivere al tutor dati personali o sensibili** (nome, email, numero di matricola, dati di
salute, …): le domande escono dal sito e vengono elaborate da Google.

## Cosa viene inviato

Quando scrivi al tutor, il browser invia al server del sito (un Worker Cloudflare):

- la tua domanda e i messaggi precedenti della stessa conversazione;
- il contesto della pagina: il testo dell'esercizio, della scheda o della sezione di teoria, la
  risposta che hai scritto nei campi dell'esercizio e la soluzione del materiale del corso;
- il titolo e l'elenco degli argomenti del corso, la lingua della pagina;
- un token di Cloudflare Turnstile (verifica anti-robot) o un gettone di sessione.

Il server inoltra domanda e contesto all'**API Gemini di Google** per generare la risposta. Non
invia nome, email, indirizzo IP o altri dati che ti identificano: il sito non ha account, e verso
Google la richiesta parte dal server del sito, non dal tuo browser.

## Cosa viene conservato

- **Sul server del sito: niente conversazioni.** Il Worker non salva domande né risposte. Tiene solo
  contatori anonimi per i limiti (quante richieste per ora da un indirizzo IP, salvato come hash con
  sale e cancellato dopo un'ora; la spesa stimata del giorno). Nel registro tecnico di Cloudflare
  finiscono solo codici d'errore, mai i testi.
- **Google** tratta i dati inviati tramite l'API secondo i termini aggiuntivi dell'API Gemini
  (<https://ai.google.dev/gemini-api/terms>) e la propria informativa
  (<https://policies.google.com/privacy>). Le condizioni **cambiano tra livello gratuito e a
  pagamento**:
  - sul **livello gratuito** Google usa domande e risposte per migliorare i suoi prodotti e
    modelli, e revisori umani possono leggerle;
  - sul **livello a pagamento** Google non le usa per migliorare i prodotti e le registra per un
    periodo limitato solo per individuare abusi e per obblighi di legge.

  Questo sito usa il **livello a pagamento** (i termini di Google lo richiedono per servizi offerti
  a persone nell'Unione europea) con il registro delle chiamate di AI Studio spento. Termini letti
  il 25 novembre 2026: possono cambiare, fa fede la versione pubblicata da Google.
- **Cloudflare** gestisce Worker e Turnstile secondo la propria informativa
  (<https://www.cloudflare.com/privacypolicy/>).
- **Nel tuo browser**: la cronologia delle conversazioni (localStorage, chiave `sh:tutor:<corso>`,
  al più 30 conversazioni per corso) e il gettone di sessione (sessionStorage). «Nuova conversazione»
  cancella quella aperta; cancellando i dati del sito dal browser sparisce tutto. La cronologia non
  entra nell'esportazione dei dati («I miei dati»).

Le risposte sono generate automaticamente e possono contenere errori: controllale sul materiale del
corso.

## English

**Do not share personal or sensitive data with the tutor.** When you message the tutor, your
question, the earlier messages of the conversation, the page context (exercise, card or theory
text, your typed answer, the reference solution) and the course outline are sent to the site's
Cloudflare Worker, which forwards them to **Google's Gemini API** to generate the answer. The
Worker **does not store conversations**; it only keeps anonymous counters for rate limits (a salted
hash of the IP address, deleted after an hour) and the estimated daily spend. Google's data use
depends on the API tier: on the free tier Google uses prompts and responses to improve its products
(human reviewers may read them); on the paid tier it does not, and keeps them for a limited time
only for abuse detection and legal requirements. This site uses the **paid tier**, as Google's
terms require for services offered to users in the European Union, with AI Studio call logging
turned off (terms read on 25 November 2026; Google's published terms prevail). Conversation history
stays **only in your browser** (localStorage) and is not part of the data export.
