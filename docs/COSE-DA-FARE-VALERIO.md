# Cose da fare (Valerio)

Solo i passi che richiedono te o i tuoi account: le sessioni di lavoro non possono farli. In ordine di utilità,
ognuno indipendente dagli altri. Per aggiungere o correggere contenuti da solo vedi
[`COME-AGGIUNGERE-CONTENUTI.md`](COME-AGGIUNGERE-CONTENUTI.md).

## 1. Modulo «Contribuisci» (Google Form, ~10 minuti)

Finché non è fatto, la pagina Contribuisci mostra «Modulo in arrivo» con email e GitHub. Dettagli in
[`CONTRIBUTI.md`](CONTRIBUTI.md).

1. Crea un Google Form con i campi: **tipo di contributo** (correzione / esercizio / spiegazione / altro),
   **corso e argomento**, **testo**, **fonte** (libro e pagina, oppure link: obbligatoria), **vuoi essere
   citato/a? come?** (facoltativo).
2. Risposte → **Collega a Fogli**: un Foglio nuovo in Drive; aggiungi in fondo le colonne **Stato** e **Note**.
3. Copia il link «Invia» del modulo in `src/config/site.ts` → `contribuisci.formUrl`, oppure dallo a una
   sessione che apra la PR.

Poi, quando vuoi: apri una sessione con Google Drive/Sheets collegati e chiedi di «leggere le risposte nuove e
implementarle citando la fonte».

## 2. Tutor AI «Chiedi al tutor»

Usa una chiave **Google Gemini** (`GEMINI_API_KEY`, da Google AI Studio), non più Anthropic. Tutti i passi
(chiave, Worker, configurazione del sito) sono in [`TUTOR-AI.md`](TUTOR-AI.md); privacy in
[`PRIVACY-TUTOR.md`](PRIVACY-TUTOR.md). Da sapere prima di cominciare: con studenti nell'UE servono i termini
del livello **a pagamento** (fatturazione attiva, anche se la spesa resta bassa), l'età minima d'uso è **18
anni**, e il **registro delle chiamate** di AI Studio va spento prima di impostare l'endpoint. Finché non è
fatto, il pulsante non compare.

## 3. Pull request di Dependabot

Già mergiate: #29 (Actions) e #46 (dipendenze di sviluppo).

| PR | Cosa | Consiglio |
| --- | --- | --- |
| #30 | Dipendenze di produzione (gruppo di 6) | la CI fallisce: **non mergiare**; chiudila o lascia che Dependabot la aggiorni |
| #32 | jsdom 30 → 31 (versione maggiore) | la CI fallisce: **non mergiare**; chiudila o lasciala a Dependabot |
| #33 | `@types/node` 22 → 26 | **chiudere**: i tipi devono restare quelli di Node 22 (`.nvmrc`) |
| #34 | TypeScript 6 → 7 (versione maggiore) | la CI fallisce: **non mergiare**; chiudila o affidala a una sessione |
| #18 | «PR1 — Dati delle isole fuori dall'HTML» (non Dependabot) | **chiudere**: superata, il lavoro è in `main` |

Una PR di Dependabot chiusa non si ripropone per la stessa versione; quelle aperte si aggiornano da sole.

## 4. Repository vecchi: archiviarli

Hai deciso di archiviarli. Per ognuno: Settings → General → Danger Zone → **Archive this repository**. Restano
di sola lettura e i rimandi su GitHub Pages continuano a funzionare (la storia è anche in `legacy/`).

- `teoria-dei-circuiti-ingegneria-elettronica`
- `fondamenti-di-informatica-AEFIN`
- `fisica-2-ingegneria-elettronica`
- `orale-fisica-1-ingegneria-elettronica`

## 5. Branch remoti già integrati (pulizia, quando vuoi)

Le sessioni non possono cancellarli senza un permesso. Due modi: dall'interfaccia, **Code → Branches** e
l'icona del cestino; oppure aggiungi nelle impostazioni di Claude Code una regola che consenta il comando Bash
`git push origin --delete` e chiedi a una sessione di farlo.

Tutti questi hanno la PR mergiata:

- Prima fase: `claude/pr1-fondamenta`, `claude/pr2-design`, `claude/pr3-motore`, `claude/pr4-simulatori`,
  `claude/pr5a-rotte-corso`, `claude/pr9-piattaforma`, `claude/pr10-grafica-originale`, `claude/pr11-kit-figure`,
  `claude/pr-corso-teoria-circuiti`, `claude/pr-corso-fondamenti-informatica`, `claude/pr-corso-fisica-2`,
  `claude/pr-corso-fisica-1`, `claude/pr-figure-fisica-2`, `claude/pr-figure-fisica-1`,
  `claude/pr-figure-circuiti-fondamenti`, `claude/pr-rifinitura`, `claude/pr-aggiornamenti-cache`.
- Revisione 1: `claude/rev-pr1-dati-isole`, `claude/rev-pr2-service-worker`, `claude/rev-pr3-formulari`,
  `claude/rev-pr4-dati-utente`, `claude/rev-pr5-motore`, `claude/rev-pr6-apps-script`, `claude/rev-pr7-head-pwa`,
  `claude/rev-pr8-telefono-a11y`, `claude/rev-pr9-strumenti-ci`, `claude/rev-pr10-lettura`.
- Revisione 2: `claude/rev2-r1-teoria-tdc`, `claude/rev2-r1-teoria-tdc-2`, `claude/rev2-r2-esercizi`,
  `claude/rev2-r2-esercizi-fisica-1`, `claude/rev2-r2-esercizi-f2-fi`, `claude/rev2-r3-decisioni`,
  `claude/rev2-r3-virgola`, `claude/rev2-r4-formulari`, `claude/rev2-r5-sw-piccolo`, `claude/rev2-r6-telefono`,
  `claude/rev2-r7-documentazione`, `claude/rev2-r8-panoramica`, `claude/rev2-r9-scroll-indice`,
  `claude/rev2-r10-formule`, `claude/rev2-r11-aggiornamenti`, `claude/rev2-r12-tutor-ai`, `claude/rev2-r13-studiato`.
- Revisione 3: `claude/rev3-r15-tutor-gemini`; `claude/rev3-r14-semestri-contribuisci` dopo il suo merge.
- Dependabot già mergiato: `dependabot/github_actions/actions-e674aeb039`.
- Vecchi, interamente contenuti in `main`: `conformita-legale`, `revisione-grafica`.
- Dopo la chiusura della PR #18: `claude/dati-isole`.

**Non cancellare** i branch con una PR ancora aperta (gli altri `dependabot/…`).

## 6. Informazioni sui corsi che mancano

Rispondi in chat alla sessione principale (o nel file del corso in [`docs/revisione/`](revisione/)).
Già fatti il 25/11: semestri di Fisica 1 e Fondamenti (primo anno, secondo semestre) e struttura della prova di
Fisica 1 (confermata).

1. **Teoria dei Circuiti — date degli appelli** di gennaio/febbraio 2027, appena escono (`examDates` di
   `src/content/courses/teoria-circuiti.yaml`, formato `AAAA-MM-GG`).
2. **Teoria dei Circuiti — punti «da verificare» della teoria**: definizione di passività, continuità delle
   variabili di stato con ingressi impulsivi, forma $B=-A^{\mathsf T}$, banda $f\approx0{,}35/t_r$, trasformata dei
   segnali periodici, soglia di rifasamento, prova di Brune. Rispondi in chat alla sessione principale.
3. **Fisica 2** (li stai ricavando dal tuo progetto con i materiali):
   - i sei **risultati di apprendimento** del programma ufficiale;
   - **dispense del docente**: nomenclatura del voltmetro «a monte/a valle» (`formulario/#f-inserzione`), soglia
     di compatibilità $t\lesssim 2$ (`#f-confronto`), segno in `#f-dipolo-osc` e `#f-fresnel-p`;
   - **appelli**: controllare a campione, sui PDF ufficiali, l'argomento assegnato agli esercizi di `extra/appelli`;
   - **laboratorio**: confermare obiettivi, strumentazione e voci di `extra/laboratorio` con le schede.

## Una volta sola (già fatto?)

Il sito si pubblica da solo a ogni push su `main` con la CI verde. Se non risponde
<https://valeriocolapinto1-cpu.github.io/study-hub/>, controlla Settings → Pages → Source: **GitHub Actions**.
