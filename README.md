# Siti di studio — Valerio Colapinto

Portfolio statico (HTML/CSS/JS, nessun build) che raccoglie i siti di studio di Ingegneria Elettronica. Italiano e inglese. Progetto personale e non ufficiale.

## Pagine
- `index.html`: elenco dei siti di studio. `chi-sono.html`: pagina personale (testi IT/EN in `assets/app.js`, chiavi `cs.*`; contatti in fondo alla pagina e nel footer).
- `note-legali.html`, `privacy.html`, `404.html`: pagine legali (generate).

## Aggiungere o aggiornare un sito
Modifica solo `data/projects.json`. Per una card con sito: `"status": "online"`, `"site"` (percorso dopo `https://valeriocolapinto1-cpu.github.io/`), `"repo"`, `"metrics"`. Senza questi campi la card resta "in arrivo".

## Provarlo in locale
`python3 -m http.server 8000` e apri http://localhost:8000

## Pubblicazione
Repo `study-hub` → Settings → Pages → Deploy from branch → `main` / root.

## Note legali e contatti

Progetto **personale e non ufficiale**, non affiliato ad alcuna università o docente.
Non riproduce testi, figure o soluzioni di terzi: criteri e provenienza in [`COMPLIANCE.md`](COMPLIANCE.md).

- Codice: licenza MIT ([`LICENSE`](LICENSE)). Contenuti originali: uso personale di studio ([`LICENSE-CONTENT.md`](LICENSE-CONTENT.md)).
- Componenti di terzi: [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).
- Contatti: [valeriocolapinto1@gmail.com](mailto:valeriocolapinto1@gmail.com) · [LinkedIn](https://www.linkedin.com/in/valerio-colapinto) · [GitHub](https://github.com/valeriocolapinto1-cpu).
- Segnalazioni e rimozioni: [issue](https://github.com/valeriocolapinto1-cpu/study-hub/issues/new?template=rimozione-contenuti.md) o email. Il materiale contestato viene rimosso subito.
