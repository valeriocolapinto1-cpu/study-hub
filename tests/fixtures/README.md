# Fixture dei test

Corso d'esempio **minimo** usato solo dai test (`tests/content/content.test.ts`):
non è nel sito pubblicato e non contiene contenuti reali dei corsi.
- `content/` replica la struttura di `src/content/`.
- `legacy/esempio/` simula un sito originale; `legacy-topics/esempio.mjs` è il suo estrattore.
- `generators/` contiene i generatori del corso finto (registrati solo nei test e nella build delle fixture).
- `npm run build:fixtures` compila il sito con questo corso in `dist-fixtures/` (test end-to-end delle isole del motore).
