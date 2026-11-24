# Revisione dei contenuti — Fisica 1

Dubbi e correzioni emersi nella conversione del sito originale («Orale Trainer»). Le correzioni **certe**
sono applicate al testo italiano; i **dubbi** restano come nell'originale in attesa di decisione.

## Corretto

| Argomento | Dove | Correzione |
|---|---|---|
| energia-corpo-rigido | errori tipici, punto 1 | refuso «½I_assek ω²» → «½I_asse ω²» |
| teoria-cinetica-gas | derivazione, passo 3 | la formula «2m⟨v_x²⟩^{1/2-media}·½n_vA⟨·⟩» era malformata (pezzi di testo dentro la formula): riscritta come $F = \langle 2mv_x \cdot \tfrac12 n_v A v_x\rangle \Rightarrow F = n_v m \langle v_x^2\rangle A$, che è ciò che il commento descrive |

| moto-armonico, pendolo-semplice, oscillatore-smorzato | checklist d'orale (obiettivi) | formule LaTeX dentro la scaletta riscritte in Unicode (ẍ = −ω²x…): gli obiettivi sono testo semplice in tutte le viste del motore |

## Da decidere

| Argomento | Dove | Dubbio e proposta |
|---|---|---|
| (corso) | notazione | Pedici italiani nelle formule (T_C/T_F per caldo/freddo, v_qm, Ω_ris, T_filo, I_disco…): mantenuti come nell'originale. In inglese T_C si legge «cold»: nelle pagine EN è spiegato (C = caldo, F = freddo) e alcune formule hanno una variante `latexEn` (T_string, I_disc). Proposta: lasciare così o passare a T_H/T_L in entrambe le lingue. **Deciso (23/11)**: restano i pedici italiani. |
| (corso) | separatore decimale | Nell'originale convivono «273.15», «8.314» (punto) e «0,03» (virgola) nel testo italiano. Lasciato com'è nelle formule (notazione), usata la virgola nei testi nuovi. Proposta: uniformare a virgola nel testo italiano. **Deciso (23/11)**: virgola nel testo italiano, anche nelle formule (in KaTeX `273{,}15`, `8{,}314`); l'inglese resta col punto. Fatto dopo la conversione delle formule in TeX (R10): `legge-gas-perfetti` (teoria, flashcard, formulario: 8,314, 273,15, 22,4, 1,38·10⁻²³, 0,0821) e `legge-di-stevino` (9,81 · 0,76 ≈ 1,013·10⁵); la formula `R = 8,314` del formulario ha una variante `latexEn` col punto. Gli altri numeri decimali del testo italiano usavano già la virgola. |
| risonanza | domande, «Δω ≈ 2γ» | vero per la larghezza a metà potenza della curva di potenza (o dell'ampiezza al quadrato); per la curva d'ampiezza a metà altezza vale ≈ 2√3 γ. Proposta: precisare «larghezza a metà potenza». **Deciso (23/11)**: la risposta modello già parlava di larghezza a metà potenza; aggiunto (IT/EN) che la curva d'ampiezza, a metà altezza, è larga circa $2\sqrt3\,\gamma$. |
| pendolo-semplice | casi limite | «T ≈ T₀(1 + θ₀²/16)»: corretto al secondo ordine; ok. Nessuna modifica. |
| oscillatore-smorzato | notazione | ω_s (pulsazione «smorzata») mantenuto anche in inglese (dove è più comune ω_d). **Deciso (23/11)**: resta ω_s. |
| (corso) | struttura della prova | «Tre problemi + due domande d'orale, 120 min» è una scelta del sito: il motore estrae esercizi da qualunque argomento. Proposta: confermare la struttura con il programma reale. **In attesa di Valerio**. |
| (corso) | semestre | L'originale non indica il semestre: non impostato. **In attesa di Valerio**. |

## Osservazioni sulla conversione

- MathJax → KaTeX: tutte le 33×(definizioni, derivazioni, formule, casi limite…) rese a build-time senza errori (`strict: error`).
- Le derivazioni sono rivelabili con `<details>` (nessun JavaScript); in stampa sono aperte.
- Le domande d'approfondimento senza risposta (61 su 99) hanno ora una risposta modello scritta per il sito.
