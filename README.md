# Siti di studio — Valerio Colapinto

Portfolio statico (HTML/CSS/JS, nessun build) che raccoglie i siti di studio di Ingegneria Elettronica, Roma. Italiano e inglese.

## Aggiungere o aggiornare un sito
Modifica solo `data/projects.json`. Per una card con sito: `"status": "online"`, `"site"` (percorso dopo `https://valeriocolapinto1-cpu.github.io/`), `"repo"`, `"metrics"`. Senza questi campi la card resta "in arrivo".

## Provarlo in locale
`python3 -m http.server 8000` e apri http://localhost:8000

## Pubblicazione
Repo `study-hub` → Settings → Pages → Deploy from branch → `main` / root.
