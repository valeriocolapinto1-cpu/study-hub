# Fisica Generale II — sito di studio

Sito statico per preparare l'esame di **Fisica Generale II** (Ingegneria Elettronica, a.a. 2026/2027, 12 CFU).

Sito personale e **non ufficiale**. Programma, calendario e struttura d'esame sono quelli ufficiali del corso. I dettagli non disponibili sono segnati come segnaposto da completare.

## Pagine

| Pagina | File | Contenuto |
|---|---|---|
| Home | `index.html` | Panoramica del corso, progressi per blocco, prossima lezione, backup dei progressi |
| Programma | `programma.html` | Due viste nella stessa pagina: **Lezioni** (le 60 lezioni in ordine, spuntabili, con filtri) e **Programma ufficiale** (7 blocchi con ore, capitoli, argomenti e testo integrale). `calendario.html` rimanda qui |
| (Simula esame) | `simulazione.html` → `esame.html` | Prove **generate** sulla tipologia degli appelli passati, con soluzioni: scritto misto (4 esercizi di argomenti diversi + 2 domande di teoria), appello vero completo (timer 2h30) o orale (3 domande, opzionale una di laboratorio), autocorrezione con totale, soglia e voto stimato. Il codice prova nell'URL la rende riproducibile |
| Teoria | `teoria.html` | La teoria spiegata per ogni blocco (file HTML in `data/teoria/`, con formule KaTeX tra `$…$`) |
| Formulario | `formulario.html` | Formule per blocco con KaTeX (Maxwell in forma integrale e locale, ecc.), filtro, stampa |
| Esercizi | `esercizi.html` | **Generatore di esercizi** originali (35 template, numeri casuali, soluzione passo per passo) e indice dei 48 appelli passati per argomento con rimando ai PDF ufficiali |
| Laboratorio | `laboratorio.html` | Le 5 esperienze con obiettivo, strumentazione e checklist della relazione |
| Esame e quiz | `esame.html` | Regole della prova, **quiz a correzione automatica** (`data/quiz.json`), simulazioni di scritto misto, appello vero e orale, consigli, obiettivi e materiali (`risorse.html` e `simulazione.html` rimandano qui) |
| Cerca | `cerca.html` | Ricerca in programma, lezioni, formule, esercizi e laboratorio |
| Privacy | `privacy.html` | Informativa: nessun cookie, dati solo nel browser, statistiche facoltative |
| Note legali | `note-legali.html` | Termini d'uso, sito non ufficiale, licenze |
| 404 | `404.html` | Pagina di errore con ricerca (GitHub Pages la usa in automatico) |

## Struttura dei file

```
├── index.html, programma.html, …   gusci HTML (tutti uguali, cambia lo script di pagina)
├── data/                           ← CONTENUTI: modifica questi file
│   ├── corso.json                  dati generali, docenti, link
│   ├── programma.json              7 blocchi → sezioni → argomenti
│   ├── lezioni.json                60 lezioni (tipo, capitoli, sezioni collegate)
│   ├── formule.json                formulario in LaTeX
│   ├── quiz.json                   banca delle domande del quiz (scelta multipla e numeriche)
│   ├── teoria/b1.html … b7.html    spiegazioni teoriche per capitolo
│   ├── appelli.json                48 appelli: indice (data, numero e argomento stimato); niente testi né soluzioni
│   ├── laboratorio.json            esperienze di laboratorio
│   ├── esame.json                  struttura d'esame, risultati di apprendimento, criteri
│   └── risorse.json                bibliografia e link
├── assets/
│   ├── css/style.css               stile (tema chiaro/scuro con variabili CSS)
│   ├── js/common.js                header, tema, caricamento dati, localStorage, KaTeX
│   ├── js/<pagina>.js              uno script per pagina
│   ├── vendor/katex/               KaTeX 0.16.22 incluso nel repo (funziona anche offline)
│   └── vendor/geist/               font Geist e Geist Mono (licenza OFL)
│   ├── js/static.js                script delle pagine statiche (privacy, note legali, 404)
│   ├── img/                        icone PWA e immagine Open Graph (PNG compressi)
├── favicon.ico, favicon.svg, apple-touch-icon.png, site.webmanifest
├── robots.txt, sitemap.xml         indicizzazione (URL assoluti del sito su GitHub Pages)
├── .github/workflows/pages.yml     deploy automatico su GitHub Pages
└── .nojekyll                       serve file statici su GitHub Pages senza passare da Jekyll
```

### Perché HTML/CSS/JS puro

- **Nessuna build**: non servono Node, npm o un framework. Modifichi un file, fai commit e il sito è aggiornato.
- **Manutenzione minima**: nessuna dipendenza da aggiornare, a parte KaTeX, che è già incluso nel repo.
- **Dati separati dalla presentazione**: i contenuti stanno tutti in `data/*.json` e gli script si limitano a disegnarli.
- **KaTeX locale** invece del CDN: è leggero, il rendering è istantaneo e il sito funziona anche senza rete dopo il primo caricamento.

## Pubblicare su GitHub Pages

Il workflow `.github/workflows/pages.yml` pubblica il sito automaticamente a ogni push su `main`.
Se il primo deploy fallisce perché Pages non è ancora attivo: **Settings → Pages → Build and deployment → Source: GitHub Actions**, poi rilancia il workflow da **Actions → Deploy su GitHub Pages → Run workflow**.

Indirizzo del sito: `https://<utente>.github.io/<nome-repo>/`.

## Provarlo in locale

I browser bloccano la lettura dei JSON se apri i file con doppio clic (`file://`). Avvia un server locale nella cartella del sito:

```bash
python3 -m http.server 8000
# poi apri http://localhost:8000
```

## Aggiornare i contenuti

- **Non cambiare gli `id`** esistenti (`b1a-3`, `es12`, `lab2:c4`, …): sono le chiavi con cui vengono salvati i progressi. Puoi aggiungere voci nuove con `id` nuovi.
- **LaTeX nei JSON**: ogni backslash va raddoppiato (`"\\vec E"`). Nei campi di testo (`note`, `testo`, `soluzione`) la matematica inline va tra `$...$` e quella in display tra `$$...$$`.
- **Appelli**: `appelli.json` contiene solo data, numero d'ordine e argomento stimato (serve anche a ricalcare la struttura delle prove generate) (`blocco` = b1–b5) di ogni esercizio e domanda; **non aggiungere testi, figure o soluzioni dei PDF dei docenti**. Il campo `blocco` è stimato: correggilo se è sbagliato.
- **Risultati di apprendimento**: in `esame.json` i 6 livelli sono segnaposto (`"placeholder": true`). Copia il testo ufficiale dalla pagina ufficiale del corso e imposta `placeholder` a `false`.
- **Laboratorio**: obiettivi e strumentazione sono indicativi (`"indicativo": true`). Correggili secondo le schede del docente e imposta `indicativo` a `false`.
- **Collegamenti lezione → programma**: il campo `sezioni` di `lezioni.json` è indicativo, ricavato dal titolo della lezione. Puoi correggerlo liberamente.

## Generatore di esercizi e prove

`assets/js/generatore.js` produce esercizi e prove **originali** che ricalcano la *tipologia* degli appelli passati:

- **35 template** (b1–b5: elettrostatica, circuiti, magnetostatica, induzione, onde): ciascuno ha parametri casuali, testo, soluzione passo per passo e risultati numerici. Sono scritti per questo sito e **non riproducono testi o dati dei docenti**.
- **Struttura delle prove**: `Generatore.generaProva(seme, appelli, tipo)` usa `data/appelli.json` (solo date, numero d'ordine e blocco di ogni esercizio/domanda) per ricalcare la distribuzione degli argomenti di un appello passato.
- **Riproducibile**: lo stesso seme dà la stessa prova (il codice prova è nell'URL).
- **Verificato**: `node --test` confronta ogni soluzione con un calcolo indipendente (integrazione numerica, simulazione di ODE, Biot–Savart discretizzato, algebra dei nodi) su 40 semi per template.
- **Da riga di comando**: `node tools/genera-prova.mjs --tipo misto --soluzioni` (vedi `--aiuto`).
- **Aggiungere un template**: `def('b3-nuovo', 'b3', 'Titolo', (r) => { ... return { testo, passi, risultati, parametri, valori }; })` in `generatore.js`, più una verifica numerica in `tests/generatore.test.mjs`. Scrivi sempre il testo con parole tue: non copiare enunciati dei PDF.

## SEO, contatti, statistiche

- **URL del sito**: `canonical`, Open Graph, `sitemap.xml` e `robots.txt` usano `https://valeriocolapinto1-cpu.github.io/fisica-2-ingegneria-elettronica/`. Se rinomini il repo o usi un dominio tuo, aggiorna quell'indirizzo nelle pagine HTML e in `sitemap.xml`/`robots.txt`.
- **robots.txt**: i motori di ricerca lo leggono solo nella radice del dominio. Su un sito di progetto (`utente.github.io/repo/`) conta solo se hai anche un sito utente `utente.github.io`. La sitemap puoi comunque inviarla direttamente da Google Search Console.
- **Contatti**: `data/corso.json → contatti` (email e profilo GitHub), mostrati nel piè di pagina e nelle pagine Privacy e Note legali.
- **Statistiche (facoltative)**: crea un account gratuito su [goatcounter.com](https://www.goatcounter.com) (senza cookie) e inserisci il codice del sito in `data/corso.json → analytics.goatcounter`. Il banner allora chiede il consenso e lo script si carica solo dopo “Accetta”. Con `null` il banner è solo informativo.

## Progressi

Le checkbox (lezioni, esercizi d'esame, checklist del laboratorio e dell'esame) sono salvate in `localStorage` con la chiave `fg2-progress-v1`, quindi restano **solo nel browser in uso**. Per passare da computer a telefono usa **Programma → Porta i progressi con te → Esporta / Importa**.

## Contenuti da completare / verificare

- Testo esatto dei 6 livelli dei risultati di apprendimento (`data/esame.json`).
- Link alle dispense sulla teoria della misura (`data/risorse.json`).
- Obiettivi e strumentazione delle esperienze di laboratorio (`data/laboratorio.json`).
- Formulario: formule standard in unità SI; verifica notazione e convenzioni di segno sul Mencuccini-Silvestrini.

KaTeX è distribuito con licenza MIT (`assets/vendor/katex/LICENSE`).

## Design

Font Geist (self-hosted), tema chiaro/scuro, animazioni leggere: comparsa degli elementi allo scroll, transizioni tra pagine (View Transitions API, dove il browser la supporta), micro-interazioni su pulsanti e checkbox. Con l'impostazione di sistema "riduci movimento" le animazioni vengono disattivate. Il design segue le Web Interface Guidelines di Vercel (skill `web-design-guidelines` in `.agents/skills/`).

## Note legali e contatti

Progetto **personale e non ufficiale**, non affiliato ad alcuna università o docente.
Non riproduce testi, figure o soluzioni di terzi: criteri e provenienza in [`COMPLIANCE.md`](COMPLIANCE.md).

- Codice: licenza MIT ([`LICENSE`](LICENSE)). Contenuti originali: uso personale di studio ([`LICENSE-CONTENT.md`](LICENSE-CONTENT.md)).
- Componenti di terzi: [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).
- Contatti: [valeriocolapinto1@gmail.com](mailto:valeriocolapinto1@gmail.com) · [LinkedIn](https://www.linkedin.com/in/valerio-colapinto) · [GitHub](https://github.com/valeriocolapinto1-cpu).
- Segnalazioni e rimozioni: [issue](https://github.com/valeriocolapinto1-cpu/fisica-2-ingegneria-elettronica/issues/new?template=rimozione-contenuti.md) o email. Il materiale contestato viene rimosso subito.
