# AE·FIN — Palestra di Architettura degli Elaboratori

Sito di studio e **generatore di prove di autovalutazione** per Architettura degli Elaboratori:
complemento a 2, algebra di Boole e Karnaugh, reti combinatorie e sequenziali, percorso dati,
assembly, interruzioni e I/O, pipeline, cache, memoria virtuale, IEEE 754.

Diciassette moduli scritti per **partire da zero**, ottantacinque esercizi svolti passo per
passo, quarantacinque schemi da completare e un motore che genera prove sempre diverse e le
corregge da sé.

### → **[Apri il sito](https://valeriocolapinto1-cpu.github.io/fondamenti-di-informatica-AEFIN/)**

Funziona anche da telefono e, dopo la prima visita, **offline**: si installa come app dal menu
del browser.

> ⚠︎ **Strumento di studio indipendente**, scritto da uno studente: **non è il sito di nessun
> corso e di nessuna università**, e nessuno l'ha rivisto o approvato. Programma, regole della
> prova, punteggi e date valgono solo quelli del **tuo** corso: verificali sulle sue pagine
> ufficiali, e in caso di differenza ha ragione lui.
>
> La prova generata — 12 quesiti, un'ora, punteggio su 30 — è una **struttura scelta da questo
> sito** perché è una misura utile, non il formato dell'esame di qualcuno. Domande, spiegazioni
> ed esercizi sono scritti qui e gli schemi disegnati da zero: non riproducono prove d'esame
> reali né il materiale di nessun testo. I libri consigliati stanno in bibliografia, come
> letture.
>
> Nessun account e nessun server: quello che fai resta nel tuo browser.
> Vedi [`COMPLIANCE.md`](COMPLIANCE.md) per la provenienza dei contenuti e come segnalare un
> problema.

## Cosa c'è dentro

- **Dashboard** — il **calcolatore di preparazione**: metti la data del tuo appello e il sito
  ricava a che punto sei e a che ritmo devi andare — minuti di lettura al giorno, moduli a
  settimana, prove complete da qui alla data. Con due ciambelle di avanzamento (argomenti
  studiati, banca domande affrontata), le statistiche delle prove e l'avvio rapido.
- **Carriera** — l'elenco dei 17 moduli con una spunta per ciascuno: lo segni **tu** quando l'hai
  studiato davvero, con barra di avanzamento, minuti che restano e data di completamento. Aprire
  un modulo è automatico e non conta.
- **Studia** — 17 moduli in ordine di studio, raggruppati per area, pensati per **partire da
  zero**: ognuno apre con la rampa «Da dove si parte» (cosa serve sapere prima, che problema si
  risolve, le parole nuove definite al primo uso), poi il ripasso «in due minuti», l'indice
  interno, la teoria distesa con un **esempio svolto con i numeri**, gli errori tipici, gli schemi
  collegati, tre domande di **autoverifica** e **cinque esercizi** con suggerimento e svolgimento
  passo per passo — 85 in tutto.
- **Definizioni** — i termini da saper enunciare, una frase ciascuno, con filtro per testo e per
  argomento.
- **Simulatore** — quattro formati di prova, generati al volo: numeri, tabelle di verità,
  schemi, snippet e mix di quesiti cambiano a ogni generazione.
- **Allenamento** — quattro palestre che fanno fare il procedimento e correggono ogni passaggio:
  binario a mano, schemi da completare, verità e Karnaugh, assembly da eseguire a mente. In
  fondo restano i convertitori, come banco di verifica.
- **Schemi** — i **45 schemi** disegnati per il sito, raggruppati per area del programma: si
  guardano per capire come sono collegate le parti, oppure si **completano** come esercizio, con
  qualche etichetta in più che non va da nessuna parte. Più le convenzioni di notazione e la
  bibliografia.

- **Note & privacy** — che cos'è il sito e che cosa non è, che cosa salva nel browser, a chi
  appartengono i contenuti e come segnalare un errore. Raggiungibile dal piè di pagina di ogni
  vista.

Nessun backend: nessun account, nessun cookie, nessuna statistica di traffico, nessun servizio
esterno contattato a runtime. I progressi restano nel `localStorage` del browser.

Un indirizzo sbagliato — una rotta che non esiste, un modulo che non esiste, un percorso fuori
dall'app — porta a una **pagina 404 vera** che rimette in strada, invece di ricadere in silenzio
sulla home.

## Come aggiungere domande

**Non serve toccare il codice**: i contenuti sono dati, tutti in `src/content/`.

| File | Cosa contiene |
|---|---|
| `mcq.ts` | Crocette, raggruppate per argomento |
| `open.ts` | Domande aperte con risposta modello |
| `asmWrite.ts` | Esercizi «scrivi un programma» |
| `topics/` | Moduli di studio, uno per file; `index.ts` fissa l'ordine e i gruppi |
| `definitions.ts` | I termini da saper enunciare |
| `diagrams.ts` | I 45 schemi ridisegnati, con gli slot da completare |
| `traps.ts` | Convenzioni di notazione — devono essere fatti sulla materia, mai su una persona o un corso: vedi la regola nel file |
| `links.ts` | Bibliografia |

Un modulo di studio porta con sé, oltre al corpo della teoria: `summary` (il ripasso «in due
minuti»), `checks` (le domande di autoverifica), `exercises` (gli esercizi svolti, con `hint` e
`solution` separati), `prereq` e `diagramIds`. L'indice interno **non**
è un dato: si ricava dai titoli del corpo (`content/outline.ts`), così non può disallinearsi.

### Una crocetta

Aggiungi una voce nella sezione dell'argomento giusto in `src/content/mcq.ts`:

```ts
{
  id: 'mcq-mem-12',            // deve essere unico
  topic: 'mem',                // uno dei TopicId in types.ts
  q: 'Che cos’è il <b>write-back</b> in una cache?',
  options: [                   // esattamente 4, tutte diverse
    'La scrittura va subito in memoria principale',
    'Il blocco modificato è riscritto solo quando viene sostituito',
    'La cache viene svuotata a ogni miss',
    'Un algoritmo di sostituzione',
  ],
  correct: 1,                  // indice (0-based) della risposta esatta
}
```

L'ordine in cui scrivi le alternative non conta: il motore le rimescola a ogni generazione.

### Una domanda aperta

In `src/content/open.ts`, con `model` che elenca i punti che una buona risposta deve toccare:

```ts
{
  id: 'open-pipe-02',
  topic: 'pipe',
  q: 'Che cos’è un hazard di controllo e come si mitiga?',
  model: 'Un salto rende incerta l’istruzione da prelevare…',
}
```

`topic` non è solo una classificazione: è il **rimando** mostrato sotto al quesito, quindi da una
risposta sbagliata si arriva al modulo che spiega l'argomento. Un id inesistente è un
collegamento rotto, e il test lo intercetta.

### Verificare quello che hai scritto

```bash
npm test
```

`validateContent()` controlla id univoci, che ogni voce rimandi a un modulo esistente, 4
alternative distinte per crocetta e convenzioni collegate esistenti. Se sbagli qualcosa, il test dice
esattamente quale voce e perché. In sviluppo gli stessi controlli girano al caricamento e
stampano un avviso in console.

## Architettura

Tre livelli separati in modo netto:

```
src/content/   dati puri: nessun import dal motore, nessun accesso al DOM
src/engine/    generatori, costruttore d'esame, correttore: funzioni pure, testabili
src/ui/        componenti: consumano motore e contenuti, nessuna logica di dominio
```

Il motore è **seedabile**: `buildExam('full', 42)` produce sempre la stessa prova, il che rende i
test riproducibili e permetterà di salvare e rigiocare un esame.

Punti notevoli:

- **`engine/boolean.ts`** contiene un minimizzatore booleano **esatto**. Il quesito di Karnaugh
  non mostra la SOP da cui è partito: la ricalcola, così la soluzione modello è minima per
  costruzione, indifferenze comprese. La minimalità è verificata dai test contro una forza bruta
  indipendente su tutte le 256 funzioni a 3 variabili e su un campione a 4.
- **`engine/asmSim.ts`** esegue davvero i tre template assembly: la risposta esatta non è mai
  scritta a mano. Un test rilegge i parametri dal listato mostrato e ri-esegue il programma.
- **`engine/numeric.ts`** tiene `overflow` e `carryOut` **separati**: sono cose diverse e
  confonderle è una classica perdita di punti.
- **`engine/ieee754.ts`** passa da un `DataView` per codificare, quindi applica lo standard
  esattamente come l'hardware. I quesiti partono dai **campi** e ne ricavano il valore: il
  numero mostrato è rappresentabile per costruzione e nessun arrotondamento può falsare la
  risposta attesa.
- **`store/storage.ts`** è l'unico punto che tocca `localStorage`, con ripiego in memoria se la
  scrittura è vietata.

### Struttura della prova completa

12 quesiti, **30 punti esatti** (verificato dai test su 500 semi):

| Tipo | Quanti | Punti |
|---|---|---|
| Crocette — teoria, complemento a 2, porte logiche, assembly, RTN, IEEE 754, traduzione indirizzi, campi di cache, cicli di pipeline | 4 | 2,5 |
| Completare lo schema | 2 | 2,5 |
| Dalla tabella di verità all'espressione logica | 2 | 2,5 |
| Sintesi con Karnaugh | 1 | 2,5 |
| Domanda aperta | 2 | 2,5 |
| Assembly da scrivere | 1 | 2,5 |

Le quattro crocette sono **estratte senza reinserimento** da un insieme di undici generatori, di
cui tre teorici: ogni prova copre quindi aree distinte, senza concentrarsi su un solo argomento,
e due prove di fila differiscono nel *mix*, non solo nei numeri.

Crocette, risposte brevi, schemi ed espressioni sono **auto-corretti**; Karnaugh, domande aperte
e assembly mostrano una soluzione modello e si autovalutano (pieno / parziale / no).

Due quesiti danno **credito parziale calcolato**: lo schema vale in proporzione alle etichette
azzeccate, e un'espressione corretta ma non minima vale metà. La **lode** richiede il punteggio
pieno.

## Deploy

Automatico: ogni push su `main` fa partire `.github/workflows/deploy.yml`, che esegue i test e
pubblica su GitHub Pages. **Se i test falliscono il sito non viene pubblicato**, quindi una
domanda malformata non arriva mai online.

Il `base` di Vite è il nome del repository (`vite.config.ts`): se rinomini il repo, aggiorna la
costante `REPO` lì.

## Stack

Vite 7 · Preact 10 · TypeScript (strict) · Tailwind CSS 4 · Vitest · vite-plugin-pwa.
Font Geist e Geist Mono self-hostati (`src/assets/fonts`, licenza OFL): nessuna chiamata a servizi esterni a runtime.

## Note legali e contatti

Progetto **personale e non ufficiale**, non affiliato ad alcuna università o docente.
Non riproduce testi, figure o soluzioni di terzi: criteri e provenienza in [`COMPLIANCE.md`](COMPLIANCE.md).

- Codice: licenza MIT ([`LICENSE`](LICENSE)). Contenuti originali: uso personale di studio ([`LICENSE-CONTENT.md`](LICENSE-CONTENT.md)).
- Componenti di terzi: [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).
- Contatti: [valeriocolapinto1@gmail.com](mailto:valeriocolapinto1@gmail.com) · [LinkedIn](https://www.linkedin.com/in/valerio-colapinto) · [GitHub](https://github.com/valeriocolapinto1-cpu).
- Segnalazioni e rimozioni: [issue](https://github.com/valeriocolapinto1-cpu/fondamenti-di-informatica-AEFIN/issues/new?template=rimozione-contenuti.md) o email. Il materiale contestato viene rimosso subito.
