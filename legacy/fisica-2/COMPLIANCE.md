# Provenienza dei contenuti e conformità

*Ultima revisione: 2 novembre 2026.*

Questo documento dice **da dove viene** quello che si legge nel sito *Fisica Generale II*, con quali criteri è stato verificato
e come chiedere di rimuovere qualcosa. Non è un disclaimer: elenca i criteri applicati.

## In breve

Spiegazioni, quiz, formulario, schede di laboratorio e simulazioni sono scritti per questo sito. I **testi, le figure e le soluzioni degli appelli d'esame non sono riprodotti**: gli esercizi e le prove sono **generati da template propri** che ricalcano la tipologia degli appelli passati (argomenti, grandezze richieste, livello) con testi, numeri e soluzioni originali; la pagina Esercizi contiene inoltre un indice degli appelli (data, numero e argomento stimato) con rimando alla cartella ufficiale del corso.

## Provenienza

- **Spiegazioni, quiz, formulario, schede**: scritti per questo sito dall'autore, con formule standard in unità SI.
- **Programma**: elenco degli argomenti del programma ufficiale del corso (informazione pubblica), con rimando alla pagina ufficiale.
- **Esercizi e prove generati** (`assets/js/generatore.js`): 35 template scritti per il sito, con parametri casuali e soluzione calcolata e verificata numericamente (`tests/generatore.test.mjs`). Un controllo di sovrapposizione con i vecchi testi d'esame ha portato a riformulare ogni enunciato finché nessuna sequenza di più di 6 parole consecutive coincide con quelle degli appelli (restano solo locuzioni tecniche standard come «le armature di un condensatore piano»).
- **Appelli**: solo metadati propri (data, numero d'ordine, argomento stimato automaticamente), usati per ricalcare la distribuzione degli argomenti, e il link alla cartella ufficiale del corso.
- **Bibliografia**: autore, titolo ed editore del testo consigliato (citazione lecita); nessun contenuto del libro è riprodotto.

## Che cosa il sito NON contiene

- Testi, figure o soluzioni degli appelli d'esame (di titolarità dei docenti).
- Pagine, slide o dispense dei docenti, né riproduzioni di parti del libro di testo.
- Nomi dei docenti, loro recapiti o affermazioni su di loro.
- Dati personali di terzi, credenziali, chiavi API o file privati (il repository viene controllato prima di ogni pubblicazione).

## Rapporto con università e docenti

Il sito è un **progetto personale di uno studente**. **Non è affiliato, approvato o sponsorizzato** da alcuna università,
da alcun dipartimento o da alcun docente. Nomi di istituzioni e corsi compaiono solo come indicazione di argomento
(uso nominativo), non come marchio del progetto. Per programma, modalità d'esame e date fanno fede le fonti ufficiali.

## Che cosa è stato rimosso o cambiato in questa revisione

| Voce | Motivo |
|---|---|
| 378 immagini WebP (`assets/appelli/`) ritagliate dai PDF degli appelli, con esercizi e soluzioni | Riproduzione fedele di testi d'esame altrui: non coperta da alcuna eccezione e non necessaria al sito |
| Campi `testo`, `img` e `soluzione` di 191 esercizi e `testo` di 90 domande di teoria in `data/appelli.json` | Testo estratto dai PDF dei docenti |
| Simulatore d'esame con i «testi veri» | Sostituito da un generatore di prove originali sulla stessa tipologia (struttura degli argomenti ricalcata sugli appelli passati), con soluzioni calcolate |
| Nomi dei docenti in `data/corso.json` | Il sito non si rivolge ai docenti né li rappresenta; per i nomi vale la pagina ufficiale del corso |
| Nome dell'università da titoli, descrizioni e anteprime social | Il regolamento sul marchio disciplina l'uso della denominazione; resta l'uso nominativo nel corpo del sito per dire di cosa tratta e cosa non è |

## Licenza

- **Contenuti originali**: © 2026 Valerio Colapinto, uso personale di studio; altri usi su richiesta (`LICENSE-CONTENT.md`).
- **Codice**: licenza MIT (`LICENSE`).
- **Componenti di terzi**: vedi `THIRD-PARTY-NOTICES.md`.

## Segnalazioni e rimozione

Se possiedi diritti su qualcosa che compare in questo progetto e ritieni che non debba esserci, o se il sito dice qualcosa
di inesatto su una persona, un corso o un'istituzione:

- apri una [segnalazione](https://github.com/valeriocolapinto1-cpu/fisica-2-ingegneria-elettronica/issues/new?template=rimozione-contenuti.md), oppure
- scrivi a [valeriocolapinto1@gmail.com](mailto:valeriocolapinto1@gmail.com) o su [LinkedIn](https://www.linkedin.com/in/valerio-colapinto).

**Il materiale contestato viene rimosso subito, senza discutere**, e la verifica viene fatta dopo. Non è richiesta una diffida formale.
Se la rimozione riguarda materiale che non deve restare consultabile, la cronologia del repository viene ripulita su richiesta.
