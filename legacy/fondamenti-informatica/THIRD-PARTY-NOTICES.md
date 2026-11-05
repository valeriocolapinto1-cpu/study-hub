# Componenti di terze parti

Questo progetto usa i seguenti componenti, ciascuno con la propria licenza. Le licenze originali restano valide
e, dove il testo è incluso nel repository, è indicato nella colonna *Note*.

| Componente | Versione | Licenza | Note |
|---|---|---|---|
| Preact | ^10.29 | MIT | Libreria UI inclusa nel bundle |
| Geist e Geist Mono (font) | variable | SIL Open Font License 1.1 | `src/assets/fonts/`, inclusi nel bundle |
| Tailwind CSS | ^4.1 | MIT | Solo build: il CSS risultante è nel bundle |
| Vite, vite-plugin-pwa, Vitest, TypeScript | vedi package.json | MIT / Apache-2.0 | Solo strumenti di sviluppo e build |

Le dipendenze di sviluppo (strumenti di build e di test) non sono distribuite con il sito pubblicato.
Gli eventuali file in `.agents/` e `.claude/` sono strumenti di lavoro con licenza propria: non fanno parte dei contenuti del sito.
