# Scrivere e modificare i contenuti

- I contenuti stanno in `src/content/` (schema e struttura in `docs/ARCHITECTURE.md`). Ogni testo ha italiano e inglese:
  `{ it: "...", en: "..." }`. Per i termini tecnici seguire `src/i18n/glossary.yaml`.
- Gli argomenti di un corso sono **esattamente** quelli del sito originale (stesso elenco, nomi, ordine e capitoli).
- Teoria a strati in MDX: `<Layer kind="intuizione">`, `formalismo`, `esempio`, `errori`. Formule in LaTeX (KaTeX).
- Esercizi: originali; quelli "tipo appello" riproducono solo la tipologia (`origin: tipologia-appello`), mai il testo dei docenti.
- Niente dispense, slide, figure o testi di terzi (vedi `COMPLIANCE.md`).
- Prima di aprire una PR: `npm run check && npm test && npm run build`.
