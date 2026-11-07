# Siti di studio — Ingegneria Elettronica

Un unico sito, bilingue (italiano e inglese), che riunisce i siti di studio dei corsi del corso di laurea in
Ingegneria Elettronica: teoria spiegata a strati, formulari, esercizi con soluzione passo per passo,
ripasso spaziato e simulazioni d'esame. Progetto personale e non ufficiale.

Sito: <https://valeriocolapinto1-cpu.github.io/study-hub/>

## Struttura

| Percorso | Contenuto |
| --- | --- |
| `src/content/` | Contenuti dei corsi: argomenti, teoria MDX (IT/EN), esercizi, formule, flashcard |
| `src/courses/<corso>/` | Codice specifico di un corso: generatori di esercizi, extra, migrazioni dai vecchi siti |
| `src/engine/` | Motore di studio: esercizi, ripasso spaziato (FSRS), simulazioni d'esame, padronanza |
| `src/islands/` | Componenti interattivi (Preact) idratati solo dove servono |
| `src/figures/`, `src/sim/` | Kit delle figure (SVG da parametri) e simulazioni/circuiti |
| `src/pages/`, `src/layouts/`, `src/components/` | Pagine Astro, layout e componenti statici |
| `src/i18n/` | Dizionari dell'interfaccia (`it.json`, `en.json`) e glossario |
| `tests/` | Unit e contenuti (vitest), end-to-end, axe e visivi (Playwright) |
| `tools/` | Script di build, controllo dei link, backend del modulo Contribuisci (`tools/apps-script/`) |
| `legacy/` | I siti originali con la loro storia (esclusi dalla build) |
| `docs/` | Documentazione (vedi sotto) |

## Sviluppo

Richiede Node 22 (`.nvmrc`).

```sh
npm ci
npm run dev          # http://localhost:4321/study-hub/
npm run check        # astro check + tsc
npm test             # vitest: unit e contenuti
npm run build        # dist/
npm run test:links   # link interni di dist/
npm run test:e2e     # Playwright su dist/ (smoke, axe, visivi)
npm run lhci         # Lighthouse CI sulle pagine campione
```

Le baseline dei test visivi si generano solo in CI (workflow «Aggiorna baseline visive», o un commit con
`[baseline]` sul branch).

## Aggiungere contenuti

- **Teoria**: `src/content/theory/<corso>/<argomento>.<it|en>.mdx`, a strati (`<Layer kind="intuizione">`, …).
- **Esercizi**: YAML in `src/content/exercises/<corso>/`; generatori parametrici in `src/courses/<corso>/generators/`.
- **Formule e flashcard**: `src/content/formulas/`, `src/content/cards/`.
- **Un corso nuovo**: procedura in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

Regole (bilinguismo, originalità, glossario): [`docs/CONTRIBUTING-CONTENT.md`](docs/CONTRIBUTING-CONTENT.md).
Prima di una PR: `npm run check && npm test && npm run build`.

## Documentazione

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architettura e contratti (contenuti, storage, design token)
- [`docs/ENGINE.md`](docs/ENGINE.md) — motore di studio; [`docs/FIGURE.md`](docs/FIGURE.md) — figure; [`docs/SIM.md`](docs/SIM.md) — simulazioni
- [`docs/decisions.md`](docs/decisions.md) — registro delle decisioni
- [`docs/revisione/`](docs/revisione/) — note di revisione dei contenuti, corso per corso
- [`docs/COSE-DA-FARE-VALERIO.md`](docs/COSE-DA-FARE-VALERIO.md) — passi che richiedono il proprietario

I siti originali sono conservati con la loro storia in `legacy/` (esclusi dalla build):
`legacy/teoria-circuiti`, `legacy/fondamenti-informatica`, `legacy/fisica-2`, `legacy/fisica-1` e il vecchio hub in `legacy/hub`.
I vecchi indirizzi pubblicati rimandano alle pagine corrispondenti di questo sito.

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
