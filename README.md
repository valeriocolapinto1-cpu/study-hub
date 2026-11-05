# Siti di studio — Ingegneria Elettronica

Un unico sito, bilingue (italiano e inglese), che riunisce i siti di studio dei corsi del corso di laurea in
Ingegneria Elettronica: teoria spiegata a strati, formulari, esercizi con soluzione passo per passo,
ripasso spaziato e simulazioni d'esame. Progetto personale e non ufficiale.

Sito: <https://valeriocolapinto1-cpu.github.io/study-hub/>

## Sviluppo

Richiede Node 22 (`.nvmrc`).

```sh
npm ci
npm run dev        # http://localhost:4321/study-hub/
npm run check      # astro check + tsc
npm test           # vitest: unit e contenuti
npm run build      # dist/
npm run test:e2e   # Playwright su dist/
```

Architettura, contratti (contenuti, generatori, storage, design token) e procedura per aggiungere un corso:
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Decisioni: [`docs/decisions.md`](docs/decisions.md).
Regole per i contenuti: [`docs/CONTRIBUTING-CONTENT.md`](docs/CONTRIBUTING-CONTENT.md).

I siti originali sono conservati con la loro storia in `legacy/` (esclusi dalla build):
`legacy/teoria-circuiti`, `legacy/fondamenti-informatica`, `legacy/fisica-2`, `legacy/fisica-1` e il vecchio hub in `legacy/hub`.

## Pubblicazione

A ogni push su `main` il workflow `deploy.yml` compila e pubblica su GitHub Pages
(Settings → Pages → Source: **GitHub Actions**).

## Note legali e contatti

Progetto **personale e non ufficiale**, non affiliato ad alcuna università o docente.
Non riproduce testi, figure o soluzioni di terzi: criteri e provenienza in [`COMPLIANCE.md`](COMPLIANCE.md).

- Codice: licenza MIT ([`LICENSE`](LICENSE)). Contenuti originali: uso personale di studio ([`LICENSE-CONTENT.md`](LICENSE-CONTENT.md)).
- Componenti di terzi: [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).
- Contatti: [valeriocolapinto1@gmail.com](mailto:valeriocolapinto1@gmail.com) · [LinkedIn](https://www.linkedin.com/in/valerio-colapinto) · [GitHub](https://github.com/valeriocolapinto1-cpu).
- Segnalazioni e rimozioni: [issue](https://github.com/valeriocolapinto1-cpu/study-hub/issues/new?template=rimozione-contenuti.md) o email. Il materiale contestato viene rimosso subito.
