# Revisione dei contenuti — Fondamenti di Informatica

Dubbi e correzioni emersi nella conversione del sito originale (AE·FIN). Le correzioni **certe** sono già applicate al testo italiano (tabella «Corretto»); i **dubbi** restano come nell’originale in attesa di decisione.

## Corretto

| Argomento | Dove | Correzione |
|---|---|---|
| reti-combinatorie | In due minuti, punto 1 | refuso «sceglere» → «scegliere» (corretto) |
| virgola-mobile | esercizio 5, svolgimento | la frase sui negativi si contraddiceva («minori… anzi maggiori»): con 0xBF800000 < 0xC0000000 i bit di −1,0 sono minori come interi, il valore è maggiore. Riscritta senza la contraddizione. |
| pipeline | teoria, dipendenza dai dati | refuso «gia» → «già» nel commento del listato. |
| interruzioni-ed-eccezioni | crocetta mcq-irq-07 | **Risolto**: le alternative ora si rimescolano; «Tutte le precedenti» ha `fixedLast: true` e resta sempre in fondo, quindi la risposta è coerente in ogni ordine. |
| (corso) | crocette | **Risolto**: le alternative si rimescolano come nel sito originale (seme della prova; negli esercizi, seme dell’esercizio e del numero di tentativi). |
| (corso) | struttura della prova | **Risolto**: le voci «schema da completare», «tabella → espressione», «Karnaugh» e «assembly» hanno un `tag` e pescano solo esercizi con lo stesso `examTags` (ripiego per categoria se non ce ne sono). |
| mappe-di-karnaugh | teoria | rimandi al «Simulatore → drill Reti combinatorie» e al «simulatore di questo sito» del sito originale aggiornati agli esercizi generati del modulo. |

## Da decidere

| Argomento | Dove | Dubbio e proposta |
|---|---|---|
| gerarchia-di-memoria | esercizio 2, svolgimento | «Dimezzare e più il miss rate» è sintatticamente incerto: proposta «Ridurlo a meno della metà». **Deciso (23/11)**: ora «Ridurre il miss rate a meno della metà…»; l'inglese («Cutting the miss rate by more than half») era già coerente. |
| risc-cisc-assembly | esercizio «asmw-mul» (scrivi un programma) | si dichiara «stile RISC» ma usa locazioni di memoria (LOC1, LOC2, LOC3) come operandi di Sub/Add, in contrasto con il modello load/store spiegato nel modulo. Proposta: riscrivere con registri (Load R1,NUM1 · Load R2,NUM2 · Clear R3 · ciclo su R2 · Store R3,RES). **Deciso (23/11)**: fatto. Testo IT/EN: prodotto dei naturali nelle celle NUM1 e NUM2 (NUM2 > 0) salvato in RES; figura con le celle NUM1/NUM2/RES; soluzione a registri con la sintassi del modulo (`Load R1, NUM1`, `Sub R2, R2, #1`, `Store R3, RES`). Lo stesso listato in teoria («Un programma completo», IT/EN) è stato riscritto allo stesso modo. |
| numeri-binari | crocetta mcq-bin-05 | «In Big Endian il bit di segno si trova all’inizio»: vero per l’ordine dei byte in memoria, ma la domanda mescola bit e byte. Proposta: «il byte più significativo, che contiene il bit di segno, sta all’indirizzo più basso». **Deciso (23/11)**: fatto; la domanda chiede dove sta in memoria il byte con il bit di segno, le alternative parlano di indirizzi (più basso / più alto / a metà della parola / registro a parte). |
| (corso) | YAML del corso | Il sito originale non indica il semestre: la Panoramica mostra quello di default (1). Proposta: confermare il semestre reale del corso. **In attesa di Valerio**. |
| (corso) | listati assembly in inglese | Le etichette dei listati (CICLO, AVANTI, SOMMA…) restano in italiano anche nella versione inglese, per coerenza con il codice: valutare se tradurle. **Deciso (23/11)**: non si traducono. |

## Osservazioni sulla conversione

- Notazione: si è mantenuta quella prevalente del sito originale (· per AND, + per OR, barra per la negazione; negli esercizi e nei listati la negazione è scritta con il macron, Ā).
- Il grassetto dentro i blocchi preformattati (es. un risultato evidenziato in una somma in colonna) non è riproducibile nel testo ricco: il valore resta, l’evidenziazione no.
- 85 esercizi svolti: 54 hanno ora risposte verificabili (ricalcolate dai test), gli altri restano in autovalutazione perché la risposta è un’espressione, uno schema o un ragionamento.
