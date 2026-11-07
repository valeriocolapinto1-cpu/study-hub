# Revisione — Teoria dei Circuiti

Dubbi e correzioni emersi nella migrazione. **Corretto** = errore certo già sistemato; le altre voci aspettano una decisione.

## Correzioni già fatte (errori certi)

- `teoria/metodo-delle-maglie/` — il testo diceva che il termine mutuo $R_{m,jk}$ è «negativo se le correnti hanno verso concorde nel ramo»: è il contrario (negativo con versi opposti nel ramo condiviso, come nel riquadro degli errori della stessa pagina). **Corretto**.
- Quiz `Q-III-029` — un'opzione era `$mathsf T$` (manca il backslash): ora `$\mathsf T$`. **Corretto**.
- Quiz `Q-IV-034` — nella spiegazione il segno meno era il carattere tipografico «−» dentro la formula: sostituito con `-` (KaTeX in modalità stretta). **Corretto**.
- Formulario `energia-l`, `vccs`, `ccvs`, `cccs` — l'errore tipico era «Come sopra», che fuori dalla tabella originale non ha senso: testo esplicito. **Corretto**.
- Domanda d'orale `T-27` — `$vC(0^-)/s$` e `L\,iL(0^-)` senza pedici: uniformati a $v_C$, $i_L$. **Corretto**.

## Da decidere

- **Tutte le pagine di teoria** — lo strato «Intuizione» è nuovo (il sito originale non l'aveva): 49 paragrafi scritti per la migrazione, da rileggere.
- `teoria/linearita-passivita-causalita/`, `teoria/relazioni-costitutive/`, `teoria/matrici-a-b/` — restano i segnali «da verificare» del sito originale (definizione di passività del docente, continuità con elementi ideali incongruenti, forma esatta di $B=-A^{\mathsf T}$ a blocchi). Proposta: chiedere al docente e poi togliere l'etichetta.
- `teoria/potenza-complessa/` — l'ultimo passo della dimostrazione di $Q=2\omega(W_L-W_C)$ è sintetico (passa dalla somma sugli elementi alla potenza erogata). Proposta: esplicitare il bilancio con Tellegen in una riga.
- Notazione — il sito usa «Thevenin» senza accento in italiano (titoli compresi, che devono restare identici) e «Thévenin» nella traduzione inglese. Proposta: lasciare così; eventualmente uniformare l'italiano a «Thévenin» cambiando anche il titolo dell'argomento (richiede di aggiornare l'estrattore).
- Glossario — nel corso «bipolo» è tradotto *one-port* (in coppia con *two-port*) e «maglia» *loop* nella topologia: il glossario generale diceva *two-terminal element* e *mesh*; aggiunte note alle voci.
- `extra/esame-info/` — le date d'esame (29-10-2026 scritto, 03-11-2026 discussione) sono già passate: aggiornare `examDates` quando escono le date di gennaio/febbraio 2027.
- Domande applicate — «Filtro del primo ordine» chiedeva il tipo di filtro come scelta multipla insieme a $\omega_c$; il motore non mescola risposte numeriche e scelte, quindi ora si chiede $|H(0)|$ (1 passa-basso, 0 passa-alto). Stessa idea per risposta impulsiva e antitrasformate, che chiedevano un'espressione in $t$: ora si chiedono i coefficienti ($K$, $a$, $A$, $B$). Proposta: va bene così, oppure estendere il motore con risposte «espressione».
- Esercizio d'analisi — il vecchio sito controllava anche l'espressione completa di $v_{out}(t)$; ora si controllano i numeri che la determinano (continua, coefficienti di coseno e seno, condizione iniziale, $R_{eq}$, $\tau$, $K$). Stessa informazione, più diagnostica.
- Figure di teoria — le 7 figure di circuiti (trasformatore ideale, invertente, partitore, RC serie, RLC, Thevenin, Norton) sono ora disegnate dal netlist del kit con `<Circuit>`; restano SVG ripuliti solo grafi, Bode, nullore e schemi a blocchi (non sono circuiti a componenti). Corretto: i testi degli SVG venivano trasformati in paragrafi da MDX e finivano fuori dalla figura; le didascalie rendono i pedici (`V_th` → V<sub>th</sub>).
- Ricerca — Pagefind indicizzava il testo interno di KaTeX (glifi ripetuti come «ZZZ», sorgente TeX): estratti illeggibili e risultati spuri. Ora `.katex` è escluso dall'indice; le formule restano trovabili dal nome nei record del formulario.
- Formulario e pagine esercizi — fuori dal campione Lighthouse: il formulario completo pesa ~800 KB non compressi (~80 KB gzip su Pages); le pagine esercizi superano il budget di 50 KB per il dizionario i18n delle isole del motore (62 KB). Proposta: dividere il dizionario delle isole per lingua/area (intervento sul motore, vale per tutti i corsi).
