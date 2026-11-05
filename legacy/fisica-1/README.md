# Fisica 1 — Orale Trainer

App web non ufficiale per preparare l'**esame orale di Fisica 1** (Ingegneria Elettronica) in 6 giorni. Non è affiliata ad alcuna università o docente.

**👉 Aprila qui: [valeriocolapinto1-cpu.github.io/orale-fisica-1-ingegneria-elettronica](https://valeriocolapinto1-cpu.github.io/orale-fisica-1-ingegneria-elettronica/)**

Tutto in un unico `index.html`: nessun build, nessun backend, nessun account. Funziona con doppio clic, da GitHub Pages e da Safari su iPhone; i dati restano nel `localStorage` del browser.

## Cosa contiene

- **33 argomenti completi** divisi in 4 aree (cinematica e oscillazioni, lavoro ed energia, sistemi di punti e corpo rigido, fluidi e termodinamica): ogni scheda si apre con **«L'idea in sintesi»** (l'intuizione fisica in evidenza) e prosegue con definizioni, **derivazioni passo-passo** con formule (MathJax), ipotesi di validità, casi limite, errori tipici, checklist per l'orale e domande di approfondimento.
- **Simulazioni interattive** (canvas) per costruire l'intuizione: moto armonico, oscillatore smorzato (i tre regimi), risonanza, pendolo semplice (dove l'approssimazione dei piccoli angoli cede), gara dei momenti d'inerzia sul piano inclinato, campo delle velocità nel rotolamento, ciclo di Carnot nel piano p-V e urti. Slider sui parametri fisici e valori aggiornati in tempo reale.
- **Simulazione d'orale** con **modalità facile / difficile**: estrazione casuale pesata verso gli argomenti deboli, timer ed esposizione a voce. In *difficile* esponi a memoria come all'esame (con la checklist rivelabile se ti blocchi); in *facile* segui la **checklist a schermo** e spunti i punti man mano. Alla fine, autovalutazione 0–3 sulla checklist e domande di approfondimento.
- **Quiz di allenamento**: costruisci un quiz su misura scegliendo aree, tipo di domande e numero. Le domande sono generate dai contenuti: *formula → argomento*, *argomento → formula*, *riconosci l'errore* (scelta multipla con feedback immediato) e *flashcard a voce* (autovalutate). A fine quiz: punteggio, dettaglio per area e possibilità di segnare come «da ripassare» gli argomenti sbagliati.
- **Quiz di teoria a difficoltà variabile**: domande concettuali generate al momento (nessuna formula) — riconosci l'argomento dall'idea, da un passaggio della trattazione o dalla definizione. Tre livelli: *facile* (3 opzioni, distrattori da aree diverse), *medio* e *difficile* (4 opzioni, distrattori dalla **stessa area** per distinzioni sottili).
- **Flashcard per ogni argomento**: un mazzo per ciascun argomento (idea, definizione, formule, ipotesi, casi limite, errori, domande, checklist) con **carta che si gira in 3D**; oppure un mazzo misto pescato a caso da tutti gli argomenti.
- **Dimostrazioni interattive**: tutte le derivazioni delle formule dei 33 argomenti, da ricavare **un passo alla volta**. Ogni dimostrazione mostra l'obiettivo (le formule chiave) e le ipotesi, poi riveli i passaggi uno per uno (o tutti insieme) con barra di avanzamento; navighi in sequenza fra tutte le dimostrazioni.
- **Piano di studio automatico** fino all'esame: distribuisce gli argomenti sui giorni rimanenti (peso doppio su corpo rigido e termodinamica), riserva gli ultimi 2 giorni a solo ripasso e ridistribuisce ciò che non completi.
- **Ripasso spaziato (SM-2 semplificato)**: ogni argomento ha uno stato (mai visto → debole → consolidato → padroneggiato) e una data di prossimo ripasso; la dashboard mostra la preparazione complessiva e la copertura per area con anelli animati.
- **Formulario stampabile** generato dalle formule chiave, raggruppato per area.

Interfaccia in **tema scuro futuristico** (HUD sci-fi): superfici in vetro (glassmorphism) con bordi luminosi e angoli a parentesi, sfondo con **aurora animata + griglia prospettica e scanline**, accenti neon ciano/violetto, testi e numeri con bagliore, barre e anelli che si riempiono con scia luminosa. Micro-animazioni ovunque (comparse a cascata, transizioni fluide, flip 3D delle flashcard, feedback dei quiz). Navigazione a tab in basso su mobile e sidebar su desktop, schede a schermo intero. Rispetta `prefers-reduced-motion`.

## Uso

Nessuna installazione: apri `index.html` nel browser (o il link GitHub Pages qui sopra). Serve la connessione solo al primo caricamento per il rendering delle formule (CDN MathJax).

## Note legali e contatti

Progetto **personale e non ufficiale**, non affiliato ad alcuna università o docente.
Non riproduce testi, figure o soluzioni di terzi: criteri e provenienza in [`COMPLIANCE.md`](COMPLIANCE.md).

- Codice: licenza MIT ([`LICENSE`](LICENSE)). Contenuti originali: uso personale di studio ([`LICENSE-CONTENT.md`](LICENSE-CONTENT.md)).
- Componenti di terzi: [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).
- Contatti: [valeriocolapinto1@gmail.com](mailto:valeriocolapinto1@gmail.com) · [LinkedIn](https://www.linkedin.com/in/valerio-colapinto) · [GitHub](https://github.com/valeriocolapinto1-cpu).
- Segnalazioni e rimozioni: [issue](https://github.com/valeriocolapinto1-cpu/orale-fisica-1-ingegneria-elettronica/issues/new?template=rimozione-contenuti.md) o email. Il materiale contestato viene rimosso subito.
